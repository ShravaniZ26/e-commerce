'use strict';

const { Router } = require('express');
const controller = require('./catalogue.controller');
const {
  validateCreateProduct,
  validateUpdateProduct,
  validateCreateSku,
  validateUpdateSku,
  validateCreateCategory,
  validateUpdateCategory,
  validateCreateBrand,
  validateUpdateBrand,
  validateProductImage,
  validateProductListQuery,
} = require('./catalogue.validator');

const router = Router();

// ---------------------------------------------------------------------------
// Public / Browse — Products
// ---------------------------------------------------------------------------

router.get('/products', validateProductListQuery, controller.getProducts);
router.get('/products/:productId', controller.getProduct);
router.get('/products/:productId/skus', controller.getProductSkus);
router.get('/products/:productId/skus/:skuId', controller.getProductSku);
router.get('/products/:productId/images', controller.getProductImages);

// ---------------------------------------------------------------------------
// Public / Browse — Categories
// ---------------------------------------------------------------------------

router.get('/categories', controller.getCategories);
router.get('/categories/:categoryId', controller.getCategory);
router.get('/categories/:categoryId/products', validateProductListQuery, controller.getCategoryProducts);

// ---------------------------------------------------------------------------
// Public / Browse — Brands
// ---------------------------------------------------------------------------

router.get('/brands', controller.getBrands);
router.get('/brands/:brandId', controller.getBrand);

// ---------------------------------------------------------------------------
// Admin — Products  (protect with auth/role middleware upstream)
// ---------------------------------------------------------------------------

router.post('/products', validateCreateProduct, controller.createProduct);
router.put('/products/:productId', validateUpdateProduct, controller.updateProduct);
router.delete('/products/:productId', controller.deleteProduct);

// Admin — SKUs
router.post('/products/:productId/skus', validateCreateSku, controller.createProductSku);
router.put('/products/:productId/skus/:skuId', validateUpdateSku, controller.updateProductSku);
router.delete('/products/:productId/skus/:skuId', controller.deleteProductSku);

// Admin — Product Images
router.post('/products/:productId/images', validateProductImage, controller.addProductImage);
router.delete('/products/:productId/images/:imageId', controller.deleteProductImage);

// Admin — Categories
router.post('/categories', validateCreateCategory, controller.createCategory);
router.put('/categories/:categoryId', validateUpdateCategory, controller.updateCategory);
router.delete('/categories/:categoryId', controller.deleteCategory);

// Admin — Brands
router.post('/brands', validateCreateBrand, controller.createBrand);
router.put('/brands/:brandId', validateUpdateBrand, controller.updateBrand);
router.delete('/brands/:brandId', controller.deleteBrand);

module.exports = router;
