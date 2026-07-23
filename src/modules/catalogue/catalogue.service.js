'use strict';

const db = require('../../db');

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const ALLOWED_SORT_COLUMNS = new Set(['name', 'base_price', 'created_at']);

function serviceError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function applyProductFilters(query, filters) {
  const { category_id, brand_id, status, search, min_price, max_price } = filters;
  if (category_id) query.where('products.category_id', category_id);
  if (brand_id) query.where('products.brand_id', brand_id);
  if (status) query.where('products.status', status);
  if (search) query.where('products.name', 'like', `%${search}%`);
  if (min_price !== undefined) query.where('products.base_price', '>=', min_price);
  if (max_price !== undefined) query.where('products.base_price', '<=', max_price);
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

async function listProducts(filters = {}) {
  const {
    page = 1,
    limit = 20,
    sort_by = 'created_at',
    sort_dir = 'desc',
    ...rest
  } = filters;

  const safeSort = ALLOWED_SORT_COLUMNS.has(sort_by) ? sort_by : 'created_at';
  const safeDir = sort_dir === 'asc' ? 'asc' : 'desc';
  const offset = (Number(page) - 1) * Number(limit);

  const base = () =>
    db('products')
      .join('brands', 'products.brand_id', 'brands.id')
      .join('categories', 'products.category_id', 'categories.id');

  const countQuery = base().count('products.id as total').first();
  applyProductFilters(countQuery, rest);

  const dataQuery = base()
    .select(
      'products.id',
      'products.name',
      'products.slug',
      'products.description',
      'products.base_price',
      'products.status',
      'products.brand_id',
      'brands.name as brand_name',
      'products.category_id',
      'categories.name as category_name',
      'products.created_at',
      'products.updated_at'
    )
    .orderBy(`products.${safeSort}`, safeDir)
    .limit(Number(limit))
    .offset(offset);
  applyProductFilters(dataQuery, rest);

  const [countResult, rows] = await Promise.all([countQuery, dataQuery]);
  const total = Number(countResult.total);

  return {
    data: rows,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  };
}

async function getProductById(productId) {
  const product = await db('products')
    .join('brands', 'products.brand_id', 'brands.id')
    .join('categories', 'products.category_id', 'categories.id')
    .select(
      'products.*',
      'brands.name as brand_name',
      'categories.name as category_name'
    )
    .where('products.id', productId)
    .first();

  if (!product) return null;

  const [images, skus] = await Promise.all([
    db('product_images').where({ product_id: productId }).orderBy('sort_order', 'asc'),
    db('skus').where({ product_id: productId }).orderBy('id', 'asc'),
  ]);

  return { ...product, images, skus };
}

async function createProduct(data) {
  const slugConflict = await db('products').where({ slug: data.slug }).first();
  if (slugConflict) {
    throw serviceError('Product slug already exists', 409);
  }

  const [id] = await db('products').insert({
    ...data,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });

  return getProductById(id);
}

async function updateProduct(productId, data) {
  const existing = await db('products').where({ id: productId }).first();
  if (!existing) return null;

  if (data.slug && data.slug !== existing.slug) {
    const slugConflict = await db('products')
      .where({ slug: data.slug })
      .whereNot({ id: productId })
      .first();
    if (slugConflict) {
      throw serviceError('Product slug already exists', 409);
    }
  }

  await db('products')
    .where({ id: productId })
    .update({ ...data, updated_at: db.fn.now() });

  return getProductById(productId);
}

async function deleteProduct(productId) {
  const existing = await db('products').where({ id: productId }).first();
  if (!existing) return false;

  await db('product_images').where({ product_id: productId }).del();
  await db('skus').where({ product_id: productId }).del();
  await db('products').where({ id: productId }).del();
  return true;
}

// ---------------------------------------------------------------------------
// SKUs
// ---------------------------------------------------------------------------

async function listSkus(productId) {
  const product = await db('products').where({ id: productId }).first();
  if (!product) return null;

  return db('skus').where({ product_id: productId }).orderBy('id', 'asc');
}

async function getSkuById(productId, skuId) {
  return db('skus').where({ id: skuId, product_id: productId }).first() || null;
}

async function getStockForProduct(productId) {
  const skus = await db('skus')
    .where({ product_id: productId, is_active: true })
    .select('id', 'sku_code', 'stock_quantity', 'attributes');

  const total_stock = skus.reduce((sum, s) => sum + (Number(s.stock_quantity) || 0), 0);
  return { skus, total_stock };
}

async function createSku(productId, data) {
  const product = await db('products').where({ id: productId }).first();
  if (!product) return null;

  const codeConflict = await db('skus').where({ sku_code: data.sku_code }).first();
  if (codeConflict) {
    throw serviceError('SKU code already exists', 409);
  }

  const [id] = await db('skus').insert({
    ...data,
    product_id: productId,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });

  return db('skus').where({ id }).first();
}

async function updateSku(productId, skuId, data) {
  const sku = await db('skus').where({ id: skuId, product_id: productId }).first();
  if (!sku) return null;

  if (data.sku_code && data.sku_code !== sku.sku_code) {
    const codeConflict = await db('skus')
      .where({ sku_code: data.sku_code })
      .whereNot({ id: skuId })
      .first();
    if (codeConflict) {
      throw serviceError('SKU code already exists', 409);
    }
  }

  await db('skus')
    .where({ id: skuId })
    .update({ ...data, updated_at: db.fn.now() });

  return db('skus').where({ id: skuId }).first();
}

async function deleteSku(productId, skuId) {
  const sku = await db('skus').where({ id: skuId, product_id: productId }).first();
  if (!sku) return false;

  await db('skus').where({ id: skuId }).del();
  return true;
}

// ---------------------------------------------------------------------------
// Product Images
// ---------------------------------------------------------------------------

async function listProductImages(productId) {
  const product = await db('products').where({ id: productId }).first();
  if (!product) return null;

  return db('product_images')
    .where({ product_id: productId })
    .orderBy('sort_order', 'asc');
}

async function addProductImage(productId, data) {
  const product = await db('products').where({ id: productId }).first();
  if (!product) return null;

  if (data.is_primary) {
    await db('product_images')
      .where({ product_id: productId })
      .update({ is_primary: false });
  }

  const [id] = await db('product_images').insert({
    ...data,
    product_id: productId,
    created_at: db.fn.now(),
  });

  return db('product_images').where({ id }).first();
}

async function deleteProductImage(productId, imageId) {
  const image = await db('product_images')
    .where({ id: imageId, product_id: productId })
    .first();
  if (!image) return false;

  await db('product_images').where({ id: imageId }).del();
  return true;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

async function listCategories(filters = {}) {
  const query = db('categories').select('*').orderBy('name', 'asc');
  if (filters.is_active !== undefined) query.where({ is_active: filters.is_active });
  return query;
}

async function getCategoryById(categoryId) {
  return db('categories').where({ id: categoryId }).first() || null;
}

async function createCategory(data) {
  const slugConflict = await db('categories').where({ slug: data.slug }).first();
  if (slugConflict) {
    throw serviceError('Category slug already exists', 409);
  }

  const [id] = await db('categories').insert({
    ...data,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });

  return getCategoryById(id);
}

async function updateCategory(categoryId, data) {
  const existing = await db('categories').where({ id: categoryId }).first();
  if (!existing) return null;

  if (data.slug && data.slug !== existing.slug) {
    const slugConflict = await db('categories')
      .where({ slug: data.slug })
      .whereNot({ id: categoryId })
      .first();
    if (slugConflict) {
      throw serviceError('Category slug already exists', 409);
    }
  }

  await db('categories')
    .where({ id: categoryId })
    .update({ ...data, updated_at: db.fn.now() });

  return getCategoryById(categoryId);
}

async function deleteCategory(categoryId) {
  const existing = await db('categories').where({ id: categoryId }).first();
  if (!existing) return false;

  const hasProducts = await db('products').where({ category_id: categoryId }).first();
  if (hasProducts) {
    throw serviceError('Cannot delete category with associated products', 409);
  }

  const hasChildren = await db('categories').where({ parent_id: categoryId }).first();
  if (hasChildren) {
    throw serviceError('Cannot delete category that has sub-categories', 409);
  }

  await db('categories').where({ id: categoryId }).del();
  return true;
}

async function listProductsByCategory(categoryId, filters = {}) {
  const category = await db('categories').where({ id: categoryId }).first();
  if (!category) return null;

  const { page = 1, limit = 20 } = filters;
  const offset = (Number(page) - 1) * Number(limit);

  const [countResult, rows] = await Promise.all([
    db('products')
      .where({ category_id: categoryId, status: 'active' })
      .count('id as total')
      .first(),
    db('products')
      .join('brands', 'products.brand_id', 'brands.id')
      .select(
        'products.id',
        'products.name',
        'products.slug',
        'products.base_price',
        'products.status',
        'products.brand_id',
        'brands.name as brand_name',
        'products.created_at'
      )
      .where({ 'products.category_id': categoryId, 'products.status': 'active' })
      .orderBy('products.name', 'asc')
      .limit(Number(limit))
      .offset(offset),
  ]);

  const total = Number(countResult.total);

  return {
    category,
    data: rows,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  };
}

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------

async function listBrands(filters = {}) {
  const query = db('brands').select('*').orderBy('name', 'asc');
  if (filters.is_active !== undefined) query.where({ is_active: filters.is_active });
  return query;
}

async function getBrandById(brandId) {
  return db('brands').where({ id: brandId }).first() || null;
}

async function createBrand(data) {
  const slugConflict = await db('brands').where({ slug: data.slug }).first();
  if (slugConflict) {
    throw serviceError('Brand slug already exists', 409);
  }

  const [id] = await db('brands').insert({
    ...data,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });

  return getBrandById(id);
}

async function updateBrand(brandId, data) {
  const existing = await db('brands').where({ id: brandId }).first();
  if (!existing) return null;

  if (data.slug && data.slug !== existing.slug) {
    const slugConflict = await db('brands')
      .where({ slug: data.slug })
      .whereNot({ id: brandId })
      .first();
    if (slugConflict) {
      throw serviceError('Brand slug already exists', 409);
    }
  }

  await db('brands')
    .where({ id: brandId })
    .update({ ...data, updated_at: db.fn.now() });

  return getBrandById(brandId);
}

async function deleteBrand(brandId) {
  const existing = await db('brands').where({ id: brandId }).first();
  if (!existing) return false;

  const hasProducts = await db('products').where({ brand_id: brandId }).first();
  if (hasProducts) {
    throw serviceError('Cannot delete brand with associated products', 409);
  }

  await db('brands').where({ id: brandId }).del();
  return true;
}

module.exports = {
  // Products
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  // SKUs
  listSkus,
  getSkuById,
  getStockForProduct,
  createSku,
  updateSku,
  deleteSku,
  // Product Images
  listProductImages,
  addProductImage,
  deleteProductImage,
  // Categories
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  listProductsByCategory,
  // Brands
  listBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
};
