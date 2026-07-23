'use strict';

const usersService = require('./users.service');

// ─── Profile ─────────────────────────────────────────────────────────────────

async function getMe(req, res, next) {
  try {
    const user = await usersService.getProfile(req.user.id);
    res.json({ status: 'success', data: user });
  } catch (err) {
    next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const user = await usersService.updateProfile(req.user.id, req.body);
    res.json({ status: 'success', data: user });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    await usersService.changePassword(req.user.id, req.body);
    res.json({ status: 'success', message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
}

// ─── Address Book ─────────────────────────────────────────────────────────────

async function getAddresses(req, res, next) {
  try {
    const addresses = await usersService.getAddresses(req.user.id);
    res.json({ status: 'success', data: addresses });
  } catch (err) {
    next(err);
  }
}

async function createAddress(req, res, next) {
  try {
    const address = await usersService.createAddress(req.user.id, req.body);
    res.status(201).json({ status: 'success', data: address });
  } catch (err) {
    next(err);
  }
}

async function updateAddress(req, res, next) {
  try {
    const address = await usersService.updateAddress(
      req.user.id,
      req.params.addressId,
      req.body
    );
    res.json({ status: 'success', data: address });
  } catch (err) {
    next(err);
  }
}

async function deleteAddress(req, res, next) {
  try {
    await usersService.deleteAddress(req.user.id, req.params.addressId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// ─── Admin User Management ───────────────────────────────────────────────────

async function getUsers(req, res, next) {
  try {
    const result = await usersService.listUsers(req.query);
    res.json({ status: 'success', ...result });
  } catch (err) {
    next(err);
  }
}

async function getUserById(req, res, next) {
  try {
    const user = await usersService.getUserById(req.params.userId);
    res.json({ status: 'success', data: user });
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const user = await usersService.updateUser(req.params.userId, req.body);
    res.json({ status: 'success', data: user });
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    await usersService.deleteUser(req.params.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMe,
  updateMe,
  changePassword,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
