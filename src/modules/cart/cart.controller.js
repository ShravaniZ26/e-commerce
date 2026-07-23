'use strict';

const cartService = require('./cart.service');

async function createCart(req, res, next) {
  try {
    const userId = req.user ? req.user.id : null;
    const { sessionId } = req.body;
    const cart = await cartService.createCart({ userId, sessionId });
    return res.status(201).json({
      status: 'success',
      data: cart,
    });
  } catch (err) {
    return next(err);
  }
}

async function getCart(req, res, next) {
  try {
    const { cartId } = req.params;
    const cart = await cartService.getCartById(cartId);
    return res.status(200).json({
      status: 'success',
      data: cart,
    });
  } catch (err) {
    return next(err);
  }
}

async function addItem(req, res, next) {
  try {
    const { cartId } = req.params;
    const { productId, variantId, quantity } = req.body;
    const cart = await cartService.addItem(cartId, { productId, variantId, quantity });
    return res.status(200).json({
      status: 'success',
      data: cart,
    });
  } catch (err) {
    return next(err);
  }
}

async function updateItem(req, res, next) {
  try {
    const { cartId, itemId } = req.params;
    const { quantity } = req.body;
    const cart = await cartService.updateItem(cartId, itemId, { quantity });
    return res.status(200).json({
      status: 'success',
      data: cart,
    });
  } catch (err) {
    return next(err);
  }
}

async function removeItem(req, res, next) {
  try {
    const { cartId, itemId } = req.params;
    const cart = await cartService.removeItem(cartId, itemId);
    return res.status(200).json({
      status: 'success',
      data: cart,
    });
  } catch (err) {
    return next(err);
  }
}

async function applyPromo(req, res, next) {
  try {
    const { cartId } = req.params;
    const { code } = req.body;
    const cart = await cartService.applyPromo(cartId, code);
    return res.status(200).json({
      status: 'success',
      data: cart,
    });
  } catch (err) {
    return next(err);
  }
}

async function removePromo(req, res, next) {
  try {
    const { cartId } = req.params;
    const cart = await cartService.removePromo(cartId);
    return res.status(200).json({
      status: 'success',
      data: cart,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createCart,
  getCart,
  addItem,
  updateItem,
  removeItem,
  applyPromo,
  removePromo,
};
