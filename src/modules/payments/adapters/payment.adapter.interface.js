/**
 * PaymentAdapterInterface
 *
 * Duck-type contract that every payment-provider adapter must satisfy.
 * Extend this class and override every method; calling super() on any
 * method will throw a NotImplementedError so missing overrides are
 * caught at runtime during development / testing.
 */
class PaymentAdapterInterface {
  /**
   * Charge a customer for a given amount.
   *
   * @param {object} params
   * @param {string} params.orderId         - Internal order identifier.
   * @param {number} params.amount          - Amount in the smallest currency unit (e.g. cents).
   * @param {string} params.currency        - ISO 4217 currency code (e.g. "USD").
   * @param {string} params.paymentMethodId - Provider-issued payment method token / id.
   * @param {object} [params.metadata]      - Arbitrary key-value pairs forwarded to the provider.
   *
   * @returns {Promise<ChargeResult>}
   */
  // eslint-disable-next-line no-unused-vars
  async charge(params) {
    throw new Error(
      `PaymentAdapterInterface.charge() is not implemented by ${this.constructor.name}`
    );
  }

  /**
   * Refund a previously successful charge, fully or partially.
   *
   * @param {object} params
   * @param {string} params.transactionId - Provider-issued transaction / charge id to refund.
   * @param {number} [params.amount]      - Amount to refund (smallest unit). Omit for full refund.
   * @param {string} [params.reason]      - Human-readable refund reason forwarded to the provider.
   *
   * @returns {Promise<RefundResult>}
   */
  // eslint-disable-next-line no-unused-vars
  async refund(params) {
    throw new Error(
      `PaymentAdapterInterface.refund() is not implemented by ${this.constructor.name}`
    );
  }

  /**
   * Void (cancel) an authorised but not yet captured charge.
   *
   * @param {object} params
   * @param {string} params.transactionId - Provider-issued authorisation id to void.
   *
   * @returns {Promise<VoidResult>}
   */
  // eslint-disable-next-line no-unused-vars
  async void(params) {
    throw new Error(
      `PaymentAdapterInterface.void() is not implemented by ${this.constructor.name}`
    );
  }

  /**
   * Retrieve the current status of a transaction from the provider.
   *
   * @param {object} params
   * @param {string} params.transactionId - Provider-issued transaction id.
   *
   * @returns {Promise<TransactionStatus>}
   */
  // eslint-disable-next-line no-unused-vars
  async getTransactionStatus(params) {
    throw new Error(
      `PaymentAdapterInterface.getTransactionStatus() is not implemented by ${this.constructor.name}`
    );
  }

  /**
   * Validate that the adapter is correctly configured and can reach the
   * provider (e.g. a lightweight ping / credentials check).
   *
   * @returns {Promise<HealthResult>}
   */
  async healthCheck() {
    throw new Error(
      `PaymentAdapterInterface.healthCheck() is not implemented by ${this.constructor.name}`
    );
  }
}

/**
 * @typedef {object} ChargeResult
 * @property {boolean} success
 * @property {string}  transactionId  - Provider-issued unique id for the charge.
 * @property {string}  status         - One of: "succeeded" | "pending" | "failed".
 * @property {number}  amount         - Charged amount in smallest currency unit.
 * @property {string}  currency
 * @property {string}  [errorCode]    - Provider error code when success === false.
 * @property {string}  [errorMessage] - Human-readable error when success === false.
 * @property {object}  [raw]          - Full provider response (for logging / debugging).
 */

/**
 * @typedef {object} RefundResult
 * @property {boolean} success
 * @property {string}  refundId       - Provider-issued unique id for the refund.
 * @property {string}  status         - One of: "succeeded" | "pending" | "failed".
 * @property {number}  amount         - Refunded amount in smallest currency unit.
 * @property {string}  [errorCode]
 * @property {string}  [errorMessage]
 * @property {object}  [raw]
 */

/**
 * @typedef {object} VoidResult
 * @property {boolean} success
 * @property {string}  transactionId
 * @property {string}  status         - One of: "voided" | "failed".
 * @property {string}  [errorCode]
 * @property {string}  [errorMessage]
 * @property {object}  [raw]
 */

/**
 * @typedef {object} TransactionStatus
 * @property {boolean} success
 * @property {string}  transactionId
 * @property {string}  status         - One of: "succeeded" | "pending" | "failed" | "refunded" | "voided".
 * @property {number}  amount
 * @property {string}  currency
 * @property {string}  [errorCode]
 * @property {string}  [errorMessage]
 * @property {object}  [raw]
 */

/**
 * @typedef {object} HealthResult
 * @property {boolean} healthy
 * @property {string}  [message]
 */

module.exports = PaymentAdapterInterface;
