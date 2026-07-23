'use strict';

const { Router } = require('express');
const cartController = require('./cart.controller');
const {
  validateCreateCart,
  validateAddItem,
  validateUpdateItem,
  validateApplyPromo,
} = require('./cart.validator');

const router = Router();

// POST /carts
router.post('/', validateCreateCart, cartController.createCart);

// GET /carts/:cartId
router.get('/:cartId', cartController.getCart);

// POST /carts/:cartId/items
router.post('/:cartId/items', validateAddItem, cartController.addItem);

// PATCH /carts/:cartId/items/:itemId
router.patch('/:cartId/items/:itemId', validateUpdateItem, cartController.updateItem);

// DELETE /carts/:cartId/items/:itemId
router.delete('/:cartId/items/:itemId', cartController.removeItem);

// POST /carts/:cartId/promo
router.post('/:cartId/promo', validateApplyPromo, cartController.applyPromo);

// DELETE /carts/:cartId/promo
router.delete('/:cartId/promo', cartController.removePromo);

module.exports = router;
