'use strict';

const service = require('./catalogue.service');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function handleServiceError(err, res, next) {
  if (err.statusCode === 409) {
    return res.status(409).json({ status: 'error', message: err.message });
  }
  return next(err);
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

async function getProducts(req, res, next) {
  try {
    const result = await service.listProducts(req.query);
    return res.status(200).json({ status: 'success', ...result });
  } catch (err) {
    return next(err);
  }
}

async function getProduct(req, res, next) {
  try {
    const product = await service.getProductById(req.params.productId);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }
    return res.status(200).json({ status: 'success', data: product });
  } catch (err) {
    return next(err);
  }
}

async function createProduct(req, res, next) {
  try {
    const product = await service.createProduct(req.body);
    return res.status(201).json({ status: 'success', data: product });
  } catch (err) {
    return handleServiceError(err, res, next);
  }
}

async function updateProduct(req, res, next) {
  try {
    const product = await service.updateProduct(req.params.productId, req.body);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }
    return res.status(200).json({ status: 'success', data: product });
  } catch (err) {
    return handleServiceError(err, res, next);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const deleted = await service.deleteProduct(req.params.productId);
    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }
    return res.status(204).send();
  } catch (err) {
    return handleServiceError(err, res, next);
  }
}

// ---------------------------------------------------------------------------
// SKUs
// ---------------------------------------------------------------------------

async function getProductSkus(req, res, next) {
  try {
    const skus = await service.listSkus(req.params.productId);
    if (skus === null) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }
    return res.status(200).json({ status: 'success', data: skus });
  } catch (err) {
    return next(err);
  }
}

async function getProductSku(req, res, next) {
  try {
    const sku = await service.getSkuById(req.params.productId, req.params.skuId);
    if (!sku) {
      return res.status(404).json({ status: 'error', message: 'SKU not found' });
    }
    return res.status(200).json({ status: 'success', data: sku });
  } catch (err) {
    return next(err);
  }
}

async function createProductSku(req, res, next) {
  try {
    const sku = await service.createSku(req.params.productId, req.body);
    if (sku === null) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }
    return res.status(201).json({ status: 'success', data: sku });
  } catch (err) {
    return handleServiceError(err, res, next);
  }
}

async function updateProductSku(req, res, next) {
  try {
    const sku = await service.updateSku(req.params.productId, req.params.skuId, req.body);
    if (!sku) {
      return res.status(404).json({ status: 'error', message: 'SKU not found' });
    }
    return res.status(200).json({ status: 'success', data: sku });
  } catch (err) {
    return handleServiceError(err, res, next);
  }
}

async function deleteProductSku(req, res, next) {
  try {
    const deleted = await service.deleteSku(req.params.productId, req.params.skuId);
    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'SKU not found' });
    }
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------------------
// Product Images
// ---------------------------------------------------------------------------

async function getProductImages(req, res, next) {
  try {
    const images = await service.listProductImages(req.params.productId);
    if (images === null) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }
    return res.status(200).json({ status: 'success', data: images });
  } catch (err) {
    return next(err);
  }
}

async function addProductImage(req, res, next) {
  try {
    const image = await service.addProductImage(req.params.productId, req.body);
    if (image === null) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }
    return res.status(201).json({ status: 'success', data: image });
  } catch (err) {
    return next(err);
  }
}

async function deleteProductImage(req, res, next) {
  try {
    const deleted = await service.deleteProductImage(req.params.productId, req.params.imageId);
    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Image not found' });
    }
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

async function getCategories(req, res, next) {
  try {
    const categories = await service.listCategories(req.query);
    return res.status(200).json({ status: 'success', data: categories });
  } catch (err) {
    return next(err);
  }
}

async function getCategory(req, res, next) {
  try {
    const category = await service.getCategoryById(req.params.categoryId);
    if (!category) {
      return res.status(404).json({ status: 'error', message: 'Category not found' });
    }
    return res.status(200).json({ status: 'success', data: category });
  } catch (err) {
    return next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const category = await service.createCategory(req.body);
    return res.status(201).json({ status: 'success', data: category });
  } catch (err) {
    return handleServiceError(err, res, next);
  }
}

async function updateCategory(req, res, next) {
  try {
    const category = await service.updateCategory(req.params.categoryId, req.body);
    if (!category) {
      return res.status(404).json({ status: 'error', message: 'Category not found' });
    }
    return res.status(200).json({ status: 'success', data: category });
  } catch (err) {
    return handleServiceError(err, res, next);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const deleted = await service.deleteCategory(req.params.categoryId);
    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Category not found' });
    }
    return res.status(204).send();
  } catch (err) {
    return handleServiceError(err, res, next);
  }
}

async function getCategoryProducts(req, res, next) {
  try {
    const result = await service.listProductsByCategory(req.params.categoryId, req.query);
    if (result === null) {
      return res.status(404).json({ status: 'error', message: 'Category not found' });
    }
    return res.status(200).json({ status: 'success', ...result });
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------

async function getBrands(req, res, next) {
  try {
    const brands = await service.listBrands(req.query);
    return res.status(200).json({ status: 'success', data: brands });
  } catch (err) {
    return next(err);
  }
}

async function getBrand(req, res, next) {
  try {
    const brand = await service.getBrandById(req.params.brandId);
    if (!brand) {
      return res.status(404).json({ status: 'error', message: 'Brand not found' });
    }
    return res.status(200).json({ status: 'success', data: brand });
  } catch (err) {
    return next(err);
  }
}

async function createBrand(req, res, next) {
  try {
    const brand = await service.createBrand(req.body);
    return res.status(201).json({ status: 'success', data: brand });
  } catch (err) {
    return handleServiceError(err, res, next);
  }
}

async function updateBrand(req, res, next) {
  try {
    const brand = await service.updateBrand(req.params.brandId, req.body);
    if (!brand) {
      return res.status(404).json({ status: 'error', message: 'Brand not found' });
    }
    return res.status(200).json({ status: 'success', data: brand });
  } catch (err) {
    return handleServiceError(err, res, next);
  }
}

async function deleteBrand(req, res, next) {
  try {
    const deleted = await service.deleteBrand(req.params.brandId);
    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Brand not found' });
    }
    return res.status(204).send();
  } catch (err) {
    return handleServiceError(err, res, next);
  }
}

module.exports = {
  // Products
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  // SKUs
  getProductSkus,
  getProductSku,
  createProductSku,
  updateProductSku,
  deleteProductSku,
  // Images
  getProductImages,
  addProductImage,
  deleteProductImage,
  // Categories
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryProducts,
  // Brands
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
};
