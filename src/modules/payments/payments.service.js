'use strict';

const { v4: uuidv4 } = require('uuid');
const db = require('../../db');
const { getActiveAdapter } = require('../../adapters/paymentAdapterFactory');
const { NotFoundError, PaymentError } = require('../../errors');

const PAYMENT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
});

/**
 * Initiates a new payment attempt.
 * Persists a payment_attempts record, then delegates charge to the active adapter.
 *
 * @param {object} payload
 * @param {string} payload.orderId
 * @param {number} payload.amount          - in smallest currency unit (e.g. cents)
 * @param {string} payload.currency        - ISO 4217 code
 * @param {string} payload.paymentMethod   - e.g. 'card', 'bank_transfer'
 * @param {object} [payload.metadata]
 * @returns {Promise<object>} payment attempt record with provider reference
 */
async function initiatePayment(payload) {
  const { orderId, amount, currency, paymentMethod, metadata = {} } = payload;

  const paymentId = uuidv4();

  // Persist initial payment attempt
  await db('payment_attempts').insert({
    id: paymentId,
    order_id: orderId,
    amount,
    currency,
    payment_method: paymentMethod,
    status: PAYMENT_STATUS.PENDING,
    metadata: JSON.stringify(metadata),
    created_at: new Date(),
    updated_at: new Date(),
  });

  const adapter = getActiveAdapter();

  let providerResponse;
  try {
    providerResponse = await adapter.initiateCharge({
      paymentId,
      orderId,
      amount,
      currency,
      paymentMethod,
      metadata,
    });
  } catch (adapterErr) {
    await db('payment_attempts')
      .where({ id: paymentId })
      .update({
        status: PAYMENT_STATUS.FAILED,
        provider_error: adapterErr.message,
        updated_at: new Date(),
      });
    throw new PaymentError('Payment initiation failed: ' + adapterErr.message);
  }

  await db('payment_attempts')
    .where({ id: paymentId })
    .update({
      status: PAYMENT_STATUS.PROCESSING,
      provider_reference: providerResponse.reference,
      provider_data: JSON.stringify(providerResponse),
      updated_at: new Date(),
    });

  return {
    paymentId,
    orderId,
    amount,
    currency,
    status: PAYMENT_STATUS.PROCESSING,
    providerReference: providerResponse.reference,
    redirectUrl: providerResponse.redirectUrl || null,
  };
}

/**
 * Processes an asynchronous callback / webhook from the provider.
 * Updates the payment_attempts record with the definitive status.
 *
 * @param {object} payload
 * @param {string} payload.provider
 * @param {string} payload.reference      - provider transaction reference
 * @param {string} payload.status         - provider status string
 * @param {object} [payload.rawData]
 * @returns {Promise<object>} updated payment attempt
 */
async function handleCallback(payload) {
  const { provider, reference, status: providerStatus, rawData = {} } = payload;

  const attempt = await db('payment_attempts')
    .where({ provider_reference: reference })
    .first();

  if (!attempt) {
    throw new NotFoundError('Payment attempt not found for reference: ' + reference);
  }

  const adapter = getActiveAdapter(provider);
  const normalizedStatus = adapter.normalizeStatus(providerStatus);

  await db('payment_attempts')
    .where({ id: attempt.id })
    .update({
      status: normalizedStatus,
      provider_data: JSON.stringify(rawData),
      updated_at: new Date(),
    });

  return {
    paymentId: attempt.id,
    orderId: attempt.order_id,
    status: normalizedStatus,
    providerReference: reference,
  };
}

/**
 * Confirms a pending payment (buyer-side step).
 *
 * @param {object} payload
 * @param {string} payload.paymentId
 * @param {string} [payload.confirmationToken]
 * @returns {Promise<object>} updated payment attempt
 */
async function confirmPayment(payload) {
  const { paymentId, confirmationToken } = payload;

  const attempt = await db('payment_attempts').where({ id: paymentId }).first();

  if (!attempt) {
    throw new NotFoundError('Payment not found.');
  }

  if (attempt.status !== PAYMENT_STATUS.PENDING && attempt.status !== PAYMENT_STATUS.PROCESSING) {
    throw new PaymentError(
      `Payment cannot be confirmed in status: ${attempt.status}`
    );
  }

  const adapter = getActiveAdapter();
  let providerResponse;
  try {
    providerResponse = await adapter.confirmCharge({
      paymentId,
      providerReference: attempt.provider_reference,
      confirmationToken,
    });
  } catch (adapterErr) {
    await db('payment_attempts')
      .where({ id: paymentId })
      .update({
        status: PAYMENT_STATUS.FAILED,
        provider_error: adapterErr.message,
        updated_at: new Date(),
      });
    throw new PaymentError('Payment confirmation failed: ' + adapterErr.message);
  }

  const normalizedStatus = adapter.normalizeStatus(providerResponse.status);

  await db('payment_attempts')
    .where({ id: paymentId })
    .update({
      status: normalizedStatus,
      provider_data: JSON.stringify(providerResponse),
      updated_at: new Date(),
    });

  return {
    paymentId,
    status: normalizedStatus,
    providerReference: attempt.provider_reference,
  };
}

/**
 * Retrieves a payment attempt by its ID.
 *
 * @param {string} paymentId
 * @returns {Promise<object>} payment attempt record
 */
async function getPayment(paymentId) {
  const attempt = await db('payment_attempts').where({ id: paymentId }).first();

  if (!attempt) {
    throw new NotFoundError('Payment not found.');
  }

  return {
    paymentId: attempt.id,
    orderId: attempt.order_id,
    amount: attempt.amount,
    currency: attempt.currency,
    paymentMethod: attempt.payment_method,
    status: attempt.status,
    providerReference: attempt.provider_reference,
    metadata: attempt.metadata ? JSON.parse(attempt.metadata) : {},
    createdAt: attempt.created_at,
    updatedAt: attempt.updated_at,
  };
}

/**
 * Retries a previously failed payment attempt.
 * Creates a new payment_attempts record linked to the same order.
 *
 * @param {string} originalPaymentId
 * @returns {Promise<object>} new payment attempt record
 */
async function retryPayment(originalPaymentId) {
  const original = await db('payment_attempts')
    .where({ id: originalPaymentId })
    .first();

  if (!original) {
    throw new NotFoundError('Payment not found.');
  }

  if (original.status !== PAYMENT_STATUS.FAILED) {
    throw new PaymentError(
      `Only failed payments can be retried. Current status: ${original.status}`
    );
  }

  const metadata = original.metadata ? JSON.parse(original.metadata) : {};

  return initiatePayment({
    orderId: original.order_id,
    amount: original.amount,
    currency: original.currency,
    paymentMethod: original.payment_method,
    metadata: {
      ...metadata,
      retriedFrom: originalPaymentId,
    },
  });
}

module.exports = {
  initiatePayment,
  handleCallback,
  confirmPayment,
  getPayment,
  retryPayment,
  PAYMENT_STATUS,
};
