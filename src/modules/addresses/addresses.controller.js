'use strict';

const addressesService = require('./addresses.service');

/**
 * GET /users/me/addresses
 * Returns all addresses belonging to the authenticated user.
 */
async function listAddresses(req, res, next) {
  try {
    const addresses = await addressesService.listAddresses(req.user.id);
    res.json({ success: true, data: addresses });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /users/me/addresses/:addressId
 * Returns a single address belonging to the authenticated user.
 */
async function getAddress(req, res, next) {
  try {
    const address = await addressesService.getAddressById(
      req.user.id,
      req.params.addressId
    );
    res.json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /users/me/addresses
 * Creates a new address for the authenticated user.
 */
async function createAddress(req, res, next) {
  try {
    const address = await addressesService.createAddress(req.user.id, req.body);
    res.status(201).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /users/me/addresses/:addressId
 * Updates an existing address belonging to the authenticated user.
 */
async function updateAddress(req, res, next) {
  try {
    const address = await addressesService.updateAddress(
      req.user.id,
      req.params.addressId,
      req.body
    );
    res.json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /users/me/addresses/:addressId
 * Deletes an address belonging to the authenticated user.
 * If the deleted address was the default, the most recently created
 * remaining address is promoted to default.
 */
async function deleteAddress(req, res, next) {
  try {
    await addressesService.deleteAddress(req.user.id, req.params.addressId);
    res.json({ success: true, message: 'Address deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
};
