'use strict';

const db = require('../../config/db');

const ADDRESSES_TABLE = 'addresses';
const SERVICEABLE_PIN_CODES_TABLE = 'serviceable_pin_codes';

/**
 * Retrieve all addresses for a user, ordered with default first,
 * then by most recently created.
 *
 * @param {number|string} userId
 * @returns {Promise<object[]>}
 */
async function listAddresses(userId) {
  return db(ADDRESSES_TABLE)
    .where({ user_id: userId })
    .orderBy([
      { column: 'is_default', order: 'desc' },
      { column: 'created_at', order: 'desc' },
    ]);
}

/**
 * Retrieve a single address that belongs to the given user.
 * Throws a 404 error if not found.
 *
 * @param {number|string} userId
 * @param {number|string} addressId
 * @returns {Promise<object>}
 */
async function getAddressById(userId, addressId) {
  const address = await db(ADDRESSES_TABLE)
    .where({ id: addressId, user_id: userId })
    .first();

  if (!address) {
    const err = new Error('Address not found');
    err.status = 404;
    throw err;
  }

  return address;
}

/**
 * Check whether the given PIN code is serviceable.
 *
 * @param {string} pinCode
 * @returns {Promise<boolean>}
 */
async function isPinCodeServiceable(pinCode) {
  const row = await db(SERVICEABLE_PIN_CODES_TABLE)
    .where({ pin_code: pinCode })
    .first();
  return Boolean(row);
}

/**
 * Create a new address for the user.
 *
 * Rules:
 *  - The PIN code must exist in serviceable_pin_codes.
 *  - If the user has no existing addresses the new address becomes the default
 *    regardless of the is_default flag.
 *  - If is_default is true all other addresses are unset as default first.
 *
 * @param {number|string} userId
 * @param {object} payload  Validated request body.
 * @returns {Promise<object>} The newly created address record.
 */
async function createAddress(userId, payload) {
  const { is_default: wantsDefault = false, ...fields } = payload;

  const serviceable = await isPinCodeServiceable(fields.pin_code);
  if (!serviceable) {
    const err = new Error('Delivery is not available at this pin code');
    err.status = 422;
    throw err;
  }

  return db.transaction(async (trx) => {
    const countResult = await trx(ADDRESSES_TABLE)
      .where({ user_id: userId })
      .count('id as count')
      .first();

    const isDefault = wantsDefault || Number(countResult.count) === 0;

    if (isDefault) {
      await trx(ADDRESSES_TABLE)
        .where({ user_id: userId })
        .update({ is_default: false });
    }

    const [insertedId] = await trx(ADDRESSES_TABLE).insert({
      user_id: userId,
      ...fields,
      is_default: isDefault,
    });

    return trx(ADDRESSES_TABLE).where({ id: insertedId }).first();
  });
}

/**
 * Update an existing address.
 *
 * Rules:
 *  - Address must belong to the user.
 *  - If a new PIN code is supplied it must be serviceable.
 *  - If is_default is set to true all other addresses are unset first.
 *
 * @param {number|string} userId
 * @param {number|string} addressId
 * @param {object} payload  Validated request body (partial).
 * @returns {Promise<object>} The updated address record.
 */
async function updateAddress(userId, addressId, payload) {
  await getAddressById(userId, addressId);

  const { is_default, pin_code, ...rest } = payload;

  if (pin_code !== undefined) {
    const serviceable = await isPinCodeServiceable(pin_code);
    if (!serviceable) {
      const err = new Error('Delivery is not available at this pin code');
      err.status = 422;
      throw err;
    }
  }

  return db.transaction(async (trx) => {
    if (is_default === true) {
      await trx(ADDRESSES_TABLE)
        .where({ user_id: userId })
        .update({ is_default: false });
    }

    const updateData = { ...rest, updated_at: new Date() };
    if (pin_code !== undefined) updateData.pin_code = pin_code;
    if (is_default !== undefined) updateData.is_default = is_default;

    await trx(ADDRESSES_TABLE)
      .where({ id: addressId, user_id: userId })
      .update(updateData);

    return trx(ADDRESSES_TABLE).where({ id: addressId }).first();
  });
}

/**
 * Delete an address.
 *
 * If the deleted address was the default, the most recently created remaining
 * address (if any) is automatically promoted to default.
 *
 * @param {number|string} userId
 * @param {number|string} addressId
 * @returns {Promise<void>}
 */
async function deleteAddress(userId, addressId) {
  const existing = await getAddressById(userId, addressId);

  await db.transaction(async (trx) => {
    await trx(ADDRESSES_TABLE)
      .where({ id: addressId, user_id: userId })
      .delete();

    if (existing.is_default) {
      const next = await trx(ADDRESSES_TABLE)
        .where({ user_id: userId })
        .orderBy('created_at', 'desc')
        .first();

      if (next) {
        await trx(ADDRESSES_TABLE)
          .where({ id: next.id })
          .update({ is_default: true });
      }
    }
  });
}

module.exports = {
  listAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  isPinCodeServiceable,
};
