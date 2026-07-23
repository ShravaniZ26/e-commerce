'use strict';

const PaymentAdapterInterface = require('./payment.adapter.interface');

/**
 * MockAdapter
 *
 * Test-mode payment adapter.  No network calls are made; every method
 * returns a configurable success or failure response.
 *
 * Usage:
 *
 *   // Always succeed
 *   const adapter = new MockAdapter();
 *
 *   // Always fail
 *   const adapter = new MockAdapter({ shouldSucceed: false });
 *
 *   // Fail only for specific operations
 *   const adapter = new MockAdapter({
 *     charge:              { shouldSucceed: false, errorCode: 'card_declined', errorMessage: 'Card declined' },
 *     refund:              { shouldSucceed: true },
 *     void:                { shouldSucceed: true },
 *     getTransactionStatus:{ shouldSucceed: true, status: 'pending' },
 *     healthCheck:         { healthy: true },
 *   });
 *
 *   // Simulate network latency in tests
 *   const adapter = new MockAdapter({ delayMs: 50 });
 */
class MockAdapter extends PaymentAdapterInterface {
  /**
   * @param {MockAdapterOptions} [options]
   */
  constructor(options = {}) {
    super();

    const globalSuccess =
      typeof options.shouldSucceed === 'boolean' ? options.shouldSucceed : true;

    const delayMs =
      typeof options.delayMs === 'number' && options.delayMs >= 0
        ? options.delayMs
        : 0;

    this._delayMs = delayMs;

    // Per-operation configuration, falling back to the global flag.
    this._config = {
      charge: {
        shouldSucceed: true,
        status: 'succeeded',
        errorCode: 'card_declined',
        errorMessage: 'Your card was declined.',
        ...options.charge,
        ...(typeof options.shouldSucceed === 'boolean'
          ? { shouldSucceed: globalSuccess }
          : {}),
        ...(options.charge || {}),
      },
      refund: {
        shouldSucceed: true,
        status: 'succeeded',
        errorCode: 'refund_failed',
        errorMessage: 'Refund could not be processed.',
        ...options.refund,
        ...(typeof options.shouldSucceed === 'boolean'
          ? { shouldSucceed: globalSuccess }
          : {}),
        ...(options.refund || {}),
      },
      void: {
        shouldSucceed: true,
        status: 'voided',
        errorCode: 'void_failed',
        errorMessage: 'Void could not be processed.',
        ...(typeof options.shouldSucceed === 'boolean'
          ? { shouldSucceed: globalSuccess }
          : {}),
        ...(options.void || {}),
      },
      getTransactionStatus: {
        shouldSucceed: true,
        status: 'succeeded',
        errorCode: 'transaction_not_found',
        errorMessage: 'Transaction not found.',
        ...(typeof options.shouldSucceed === 'boolean'
          ? { shouldSucceed: globalSuccess }
          : {}),
        ...(options.getTransactionStatus || {}),
      },
      healthCheck: {
        healthy: typeof options.shouldSucceed === 'boolean' ? globalSuccess : true,
        message: 'Mock adapter is healthy.',
        ...(options.healthCheck || {}),
      },
    };

    /** @type {CallRecord[]} */
    this.calls = [];
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  _delay() {
    if (this._delayMs === 0) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, this._delayMs));
  }

  _recordCall(method, params) {
    this.calls.push({ method, params, calledAt: Date.now() });
  }

  /**
   * Reset the recorded call history.  Useful between individual test cases.
   */
  resetCalls() {
    this.calls = [];
  }

  /**
   * Retrieve all recorded calls for a specific method.
   *
   * @param {string} method
   * @returns {CallRecord[]}
   */
  callsFor(method) {
    return this.calls.filter((c) => c.method === method);
  }

  // ---------------------------------------------------------------------------
  // Interface implementation
  // ---------------------------------------------------------------------------

  /**
   * @param {object} params
   * @returns {Promise<import('./payment.adapter.interface').ChargeResult>}
   */
  async charge(params) {
    this._recordCall('charge', params);
    await this._delay();

    const cfg = this._config.charge;
    const transactionId = `mock_charge_${params.orderId}`;

    if (!cfg.shouldSucceed) {
      return {
        success: false,
        transactionId,
        status: 'failed',
        amount: params.amount,
        currency: params.currency,
        errorCode: cfg.errorCode,
        errorMessage: cfg.errorMessage,
        raw: { mock: true, params },
      };
    }

    return {
      success: true,
      transactionId,
      status: cfg.status || 'succeeded',
      amount: params.amount,
      currency: params.currency,
      raw: { mock: true, params },
    };
  }

  /**
   * @param {object} params
   * @returns {Promise<import('./payment.adapter.interface').RefundResult>}
   */
  async refund(params) {
    this._recordCall('refund', params);
    await this._delay();

    const cfg = this._config.refund;
    const refundId = `mock_refund_${params.transactionId}`;

    if (!cfg.shouldSucceed) {
      return {
        success: false,
        refundId,
        status: 'failed',
        amount: params.amount !== undefined ? params.amount : 0,
        errorCode: cfg.errorCode,
        errorMessage: cfg.errorMessage,
        raw: { mock: true, params },
      };
    }

    return {
      success: true,
      refundId,
      status: cfg.status || 'succeeded',
      amount: params.amount !== undefined ? params.amount : 0,
      raw: { mock: true, params },
    };
  }

  /**
   * @param {object} params
   * @returns {Promise<import('./payment.adapter.interface').VoidResult>}
   */
  async void(params) {
    this._recordCall('void', params);
    await this._delay();

    const cfg = this._config.void;

    if (!cfg.shouldSucceed) {
      return {
        success: false,
        transactionId: params.transactionId,
        status: 'failed',
        errorCode: cfg.errorCode,
        errorMessage: cfg.errorMessage,
        raw: { mock: true, params },
      };
    }

    return {
      success: true,
      transactionId: params.transactionId,
      status: cfg.status || 'voided',
      raw: { mock: true, params },
    };
  }

  /**
   * @param {object} params
   * @returns {Promise<import('./payment.adapter.interface').TransactionStatus>}
   */
  async getTransactionStatus(params) {
    this._recordCall('getTransactionStatus', params);
    await this._delay();

    const cfg = this._config.getTransactionStatus;

    if (!cfg.shouldSucceed) {
      return {
        success: false,
        transactionId: params.transactionId,
        status: 'failed',
        amount: 0,
        currency: 'USD',
        errorCode: cfg.errorCode,
        errorMessage: cfg.errorMessage,
        raw: { mock: true, params },
      };
    }

    return {
      success: true,
      transactionId: params.transactionId,
      status: cfg.status || 'succeeded',
      amount: cfg.amount !== undefined ? cfg.amount : 0,
      currency: cfg.currency || 'USD',
      raw: { mock: true, params },
    };
  }

  /**
   * @returns {Promise<import('./payment.adapter.interface').HealthResult>}
   */
  async healthCheck() {
    this._recordCall('healthCheck', {});
    await this._delay();

    const cfg = this._config.healthCheck;

    return {
      healthy: cfg.healthy,
      message: cfg.message,
    };
  }
}

/**
 * @typedef {object} MockAdapterOptions
 * @property {boolean} [shouldSucceed=true]          - Global success/failure toggle for all operations.
 * @property {number}  [delayMs=0]                   - Artificial delay (ms) applied to every call.
 * @property {object}  [charge]                      - Per-operation overrides for charge().
 * @property {object}  [refund]                      - Per-operation overrides for refund().
 * @property {object}  [void]                        - Per-operation overrides for void().
 * @property {object}  [getTransactionStatus]        - Per-operation overrides for getTransactionStatus().
 * @property {object}  [healthCheck]                 - Per-operation overrides for healthCheck().
 */

/**
 * @typedef {object} CallRecord
 * @property {string} method
 * @property {object} params
 * @property {number} calledAt - Unix timestamp (ms).
 */

module.exports = MockAdapter;
