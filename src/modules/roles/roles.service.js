'use strict';

const db = require('../../db');

// ---------------------------------------------------------------------------
// Role CRUD
// ---------------------------------------------------------------------------

/**
 * Retrieve every role record.
 * @returns {Promise<Array>}
 */
async function getAllRoles() {
  const result = await db.query(
    'SELECT id, name, description, created_at, updated_at FROM roles ORDER BY name ASC',
  );
  return result.rows;
}

/**
 * Retrieve a single role by its primary key.
 * @param {number|string} id
 * @returns {Promise<Object|null>}
 */
async function getRoleById(id) {
  const result = await db.query(
    'SELECT id, name, description, created_at, updated_at FROM roles WHERE id = $1',
    [id],
  );
  return result.rows[0] || null;
}

/**
 * Retrieve a single role by its unique name (case-insensitive).
 * @param {string} name
 * @returns {Promise<Object|null>}
 */
async function getRoleByName(name) {
  const result = await db.query(
    'SELECT id, name, description, created_at, updated_at FROM roles WHERE LOWER(name) = LOWER($1)',
    [name],
  );
  return result.rows[0] || null;
}

/**
 * Insert a new role.
 * @param {{ name: string, description: string|null }} payload
 * @returns {Promise<Object>}
 */
async function createRole({ name, description }) {
  const result = await db.query(
    `INSERT INTO roles (name, description, created_at, updated_at)
     VALUES ($1, $2, NOW(), NOW())
     RETURNING id, name, description, created_at, updated_at`,
    [name, description],
  );
  return result.rows[0];
}

/**
 * Update an existing role's mutable fields.
 * @param {number|string} id
 * @param {{ name: string, description: string|null }} payload
 * @returns {Promise<Object>}
 */
async function updateRole(id, { name, description }) {
  const result = await db.query(
    `UPDATE roles
     SET name = $1, description = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING id, name, description, created_at, updated_at`,
    [name, description, id],
  );
  return result.rows[0];
}

/**
 * Delete a role and its associated user_roles records.
 * Cascade is expected at the database level; the explicit delete of user_roles
 * is included for databases without FK cascade configured.
 * @param {number|string} id
 * @returns {Promise<void>}
 */
async function deleteRole(id) {
  await db.query('DELETE FROM user_roles WHERE role_id = $1', [id]);
  await db.query('DELETE FROM roles WHERE id = $1', [id]);
}

// ---------------------------------------------------------------------------
// User-role association
// ---------------------------------------------------------------------------

/**
 * Retrieve all roles assigned to a given user.
 * @param {number|string} userId
 * @returns {Promise<Array>}
 */
async function getUserRoles(userId) {
  const result = await db.query(
    `SELECT r.id, r.name, r.description, ur.created_at AS assigned_at
     FROM roles r
     INNER JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = $1
     ORDER BY r.name ASC`,
    [userId],
  );
  return result.rows;
}

/**
 * Check whether a specific user already has a specific role.
 * @param {number|string} userId
 * @param {number|string} roleId
 * @returns {Promise<boolean>}
 */
async function userHasRole(userId, roleId) {
  const result = await db.query(
    'SELECT 1 FROM user_roles WHERE user_id = $1 AND role_id = $2',
    [userId, roleId],
  );
  return result.rowCount > 0;
}

/**
 * Create a user_roles association record.
 * @param {number|string} userId
 * @param {number|string} roleId
 * @returns {Promise<Object>}
 */
async function assignRoleToUser(userId, roleId) {
  const result = await db.query(
    `INSERT INTO user_roles (user_id, role_id, created_at)
     VALUES ($1, $2, NOW())
     RETURNING user_id, role_id, created_at`,
    [userId, roleId],
  );
  return result.rows[0];
}

/**
 * Remove a user_roles association record.
 * @param {number|string} userId
 * @param {number|string} roleId
 * @returns {Promise<void>}
 */
async function removeRoleFromUser(userId, roleId) {
  await db.query(
    'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
    [userId, roleId],
  );
}

module.exports = {
  getAllRoles,
  getRoleById,
  getRoleByName,
  createRole,
  updateRole,
  deleteRole,
  getUserRoles,
  userHasRole,
  assignRoleToUser,
  removeRoleFromUser,
};
