'use strict';

const bcrypt = require('bcrypt');
const db = require('../../db');

const SALT_ROUNDS = 12;

const USER_PUBLIC_FIELDS =
  'id, first_name, last_name, email, phone, role, is_active, created_at, updated_at';

const ADDRESS_FIELDS =
  'id, user_id, label, line1, line2, city, state, postal_code, country, is_default, created_at, updated_at';

function createError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function formatUser(row) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function formatAddress(row) {
  return {
    id: row.id,
    userId: row.user_id,
    label: row.label,
    line1: row.line1,
    line2: row.line2,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getProfile(userId) {
  const { rows } = await db.query(
    `SELECT ${USER_PUBLIC_FIELDS} FROM users WHERE id = $1`,
    [userId]
  );
  if (!rows[0]) {
    throw createError('User not found', 404);
  }
  return formatUser(rows[0]);
}

async function updateProfile(userId, data) {
  const { firstName, lastName, email, phone } = data;
  const updates = [];
  const values = [];
  let paramIndex = 1;

  if (firstName !== undefined) {
    updates.push(`first_name = $${paramIndex}`);
    values.push(firstName);
    paramIndex += 1;
  }
  if (lastName !== undefined) {
    updates.push(`last_name = $${paramIndex}`);
    values.push(lastName);
    paramIndex += 1;
  }
  if (email !== undefined) {
    const { rows: existing } = await db.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, userId]
    );
    if (existing[0]) {
      throw createError('Email address is already in use', 409);
    }
    updates.push(`email = $${paramIndex}`);
    values.push(email);
    paramIndex += 1;
  }
  if (phone !== undefined) {
    updates.push(`phone = $${paramIndex}`);
    values.push(phone);
    paramIndex += 1;
  }

  if (updates.length === 0) {
    return getProfile(userId);
  }

  updates.push('updated_at = NOW()');
  values.push(userId);

  const { rows } = await db.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING ${USER_PUBLIC_FIELDS}`,
    values
  );

  if (!rows[0]) {
    throw createError('User not found', 404);
  }
  return formatUser(rows[0]);
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const { rows } = await db.query(
    'SELECT id, password_hash FROM users WHERE id = $1',
    [userId]
  );
  if (!rows[0]) {
    throw createError('User not found', 404);
  }

  const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!isMatch) {
    throw createError('Current password is incorrect', 401);
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await db.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [passwordHash, userId]
  );
}

async function listUsers({ page = 1, limit = 20, search, role, isActive } = {}) {
  const offset = (page - 1) * limit;
  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (search) {
    conditions.push(
      `(first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`
    );
    values.push(`%${search}%`);
    paramIndex += 1;
  }
  if (role !== undefined) {
    conditions.push(`role = $${paramIndex}`);
    values.push(role);
    paramIndex += 1;
  }
  if (isActive !== undefined) {
    conditions.push(`is_active = $${paramIndex}`);
    values.push(isActive);
    paramIndex += 1;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows: countRows } = await db.query(
    `SELECT COUNT(*) AS total FROM users ${whereClause}`,
    values
  );

  const dataValues = [...values, limit, offset];
  const { rows } = await db.query(
    `SELECT ${USER_PUBLIC_FIELDS} FROM users ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    dataValues
  );

  const total = parseInt(countRows[0].total, 10);
  return {
    data: rows.map(formatUser),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function getUserById(userId) {
  const { rows } = await db.query(
    `SELECT ${USER_PUBLIC_FIELDS} FROM users WHERE id = $1`,
    [userId]
  );
  if (!rows[0]) {
    throw createError('User not found', 404);
  }
  return formatUser(rows[0]);
}

async function updateUser(userId, data) {
  const { firstName, lastName, email, phone, role, isActive } = data;
  const updates = [];
  const values = [];
  let paramIndex = 1;

  if (firstName !== undefined) {
    updates.push(`first_name = $${paramIndex}`);
    values.push(firstName);
    paramIndex += 1;
  }
  if (lastName !== undefined) {
    updates.push(`last_name = $${paramIndex}`);
    values.push(lastName);
    paramIndex += 1;
  }
  if (email !== undefined) {
    const { rows: existing } = await db.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, userId]
    );
    if (existing[0]) {
      throw createError('Email address is already in use', 409);
    }
    updates.push(`email = $${paramIndex}`);
    values.push(email);
    paramIndex += 1;
  }
  if (phone !== undefined) {
    updates.push(`phone = $${paramIndex}`);
    values.push(phone);
    paramIndex += 1;
  }
  if (role !== undefined) {
    updates.push(`role = $${paramIndex}`);
    values.push(role);
    paramIndex += 1;
  }
  if (isActive !== undefined) {
    updates.push(`is_active = $${paramIndex}`);
    values.push(isActive);
    paramIndex += 1;
  }

  if (updates.length === 0) {
    return getUserById(userId);
  }

  updates.push('updated_at = NOW()');
  values.push(userId);

  const { rows } = await db.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING ${USER_PUBLIC_FIELDS}`,
    values
  );

  if (!rows[0]) {
    throw createError('User not found', 404);
  }
  return formatUser(rows[0]);
}

async function deleteUser(userId) {
  const { rows } = await db.query(
    'DELETE FROM users WHERE id = $1 RETURNING id',
    [userId]
  );
  if (!rows[0]) {
    throw createError('User not found', 404);
  }
}

async function getAddresses(userId) {
  const { rows } = await db.query(
    `SELECT ${ADDRESS_FIELDS} FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
    [userId]
  );
  return rows.map(formatAddress);
}

async function createAddress(userId, data) {
  const { label = null, line1, line2 = null, city, state = null, postalCode, country, isDefault = false } = data;

  if (isDefault) {
    await db.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [userId]);
  }

  const { rows } = await db.query(
    `INSERT INTO addresses (user_id, label, line1, line2, city, state, postal_code, country, is_default)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING ${ADDRESS_FIELDS}`,
    [userId, label, line1, line2, city, state, postalCode, country, isDefault]
  );
  return formatAddress(rows[0]);
}

async function updateAddress(userId, addressId, data) {
  const { rows: existing } = await db.query(
    'SELECT id FROM addresses WHERE id = $1 AND user_id = $2',
    [addressId, userId]
  );
  if (!existing[0]) {
    throw createError('Address not found', 404);
  }

  const { label, line1, line2, city, state, postalCode, country, isDefault } = data;
  const updates = [];
  const values = [];
  let paramIndex = 1;

  if (label !== undefined) { updates.push(`label = $${paramIndex}`); values.push(label); paramIndex += 1; }
  if (line1 !== undefined) { updates.push(`line1 = $${paramIndex}`); values.push(line1); paramIndex += 1; }
  if (line2 !== undefined) { updates.push(`line2 = $${paramIndex}`); values.push(line2); paramIndex += 1; }
  if (city !== undefined) { updates.push(`city = $${paramIndex}`); values.push(city); paramIndex += 1; }
  if (state !== undefined) { updates.push(`state = $${paramIndex}`); values.push(state); paramIndex += 1; }
  if (postalCode !== undefined) { updates.push(`postal_code = $${paramIndex}`); values.push(postalCode); paramIndex += 1; }
  if (country !== undefined) { updates.push(`country = $${paramIndex}`); values.push(country); paramIndex += 1; }

  if (isDefault === true) {
    await db.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [userId]);
    updates.push(`is_default = $${paramIndex}`);
    values.push(true);
    paramIndex += 1;
  } else if (isDefault === false) {
    updates.push(`is_default = $${paramIndex}`);
    values.push(false);
    paramIndex += 1;
  }

  if (updates.length === 0) {
    const { rows } = await db.query(
      `SELECT ${ADDRESS_FIELDS} FROM addresses WHERE id = $1`,
      [addressId]
    );
    return formatAddress(rows[0]);
  }

  updates.push('updated_at = NOW()');
  values.push(addressId);

  const { rows } = await db.query(
    `UPDATE addresses SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING ${ADDRESS_FIELDS}`,
    values
  );
  return formatAddress(rows[0]);
}

async function deleteAddress(userId, addressId) {
  const { rows } = await db.query(
    'DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING id',
    [addressId, userId]
  );
  if (!rows[0]) {
    throw createError('Address not found', 404);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
};
