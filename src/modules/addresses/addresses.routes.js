'use strict';

const express = require('express');
const router = express.Router({ mergeParams: true });
const authenticate = require('../../middleware/authenticate');
const addressesController = require('./addresses.controller');
const { validateCreateAddress, validateUpdateAddress } = require('./addresses.validator');

router.use(authenticate);

router.get('/', addressesController.listAddresses);
router.post('/', validateCreateAddress, addressesController.createAddress);
router.get('/:addressId', addressesController.getAddress);
router.put('/:addressId', validateUpdateAddress, addressesController.updateAddress);
router.delete('/:addressId', addressesController.deleteAddress);

module.exports = router;
