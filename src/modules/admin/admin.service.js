'use strict';

const db = require('../../config/db');

// ── Permissions ───────────────────────────────────────────────────────────────

/**
 * Returns every permission record, ordered by name.
 */
const getAllPermissions = async () => {
  return db('permissions').select('*').orderBy('name', 'asc');
};

// ── Roles ─────────────────────────────────────────────────────────────────────

/**
 * Returns all roles ordered by name.
 */
const getAllRoles = async () => {
  return db('roles').select('*').orderBy('name', 'asc');
};

/**
 * Creates a new role.
 * @param {{ name: string, description?: string }} data
 */
const createRole = async (data) => {
  const { name, description } = data;
  const [role] = await db('roles')
    .insert({ name, description })
    .returning('*');
  return role;
};

/**
 * Returns a single role by primary key.
 * Throws 404 if not found.
 * @param {string|number} roleId
 */
const getRoleById = async (roleId) => {
  const role = await db('roles').where({ id: roleId }).first();
  if (!role) {
    const err = new Error('Role not found');
    err.statusCode = 404;
    throw err;
  }
  return role;
};

/**
 * Updates an existing role.
 * @param {string|number} roleId
 * @param {{ name?: string, description?: string }} data
 */
const updateRole = async (roleId, data) => {
  const { name, description } = data;
  const [role] = await db('roles')
    .where({ id: roleId })
    .update({ name, description, updated_at: db.fn.now() })
    .returning('*');
  if (!role) {
    const err = new Error('Role not found');
    err.statusCode = 404;
    throw err;
  }
  return role;
};

/**
 * Deletes a role by primary key.
 * @param {string|number} roleId
 */
const deleteRole = async (roleId) => {
  const deleted = await db('roles').where({ id: roleId }).delete();
  if (!deleted) {
    const err = new Error('Role not found');
    err.statusCode = 404;
    throw err;
  }
};

// ── Role → Permissions ────────────────────────────────────────────────────────

/**
 * Returns all permissions attached to a role.
 * @param {string|number} roleId
 */
const getRolePermissions = async (roleId) => {
  await getRoleById(roleId);
  return db('role_permissions as rp')
    .join('permissions as p', 'rp.permission_id', 'p.id')
    .where('rp.role_id', roleId)
    .select('p.*')
    .orderBy('p.name', 'asc');
};

/**
 * Assigns a permission to a role.
 * @param {string|number} roleId
 * @param {{ permissionId: string|number }} data
 */
const addPermissionToRole = async (roleId, data) => {
  await getRoleById(roleId);
  const { permissionId } = data;

  const existing = await db('role_permissions')
    .where({ role_id: roleId, permission_id: permissionId })
    .first();
  if (existing) {
    const err = new Error('Permission already assigned to role');
    err.statusCode = 409;
    throw err;
  }

  const [entry] = await db('role_permissions')
    .insert({ role_id: roleId, permission_id: permissionId })
    .returning('*');
  return entry;
};

/**
 * Removes a permission from a role.
 * @param {string|number} roleId
 * @param {string|number} permissionId
 */
const removePermissionFromRole = async (roleId, permissionId) => {
  const deleted = await db('role_permissions')
    .where({ role_id: roleId, permission_id: permissionId })
    .delete();
  if (!deleted) {
    const err = new Error('Permission not found on role');
    err.statusCode = 404;
    throw err;
  }
};

// ── Serviceable Pin Codes ─────────────────────────────────────────────────────

/**
 * Returns all serviceable pin codes.
 * Supports optional `active` query filter.
 * @param {{ active?: string }} filters
 */
const getAllServiceablePinCodes = async (filters = {}) => {
  const query = db('serviceable_pin_codes').select('*').orderBy('pin_code', 'asc');
  if (filters.active !== undefined) {
    query.where({ is_active: filters.active === 'true' });
  }
  return query;
};

/**
 * Creates a new serviceable pin code.
 * @param {{ pin_code: string, city: string, state: string, is_active?: boolean }} data
 */
const createServiceablePinCode = async (data) => {
  const { pin_code, city, state, is_active } = data;

  const existing = await db('serviceable_pin_codes').where({ pin_code }).first();
  if (existing) {
    const err = new Error('Pin code already exists');
    err.statusCode = 409;
    throw err;
  }

  const [record] = await db('serviceable_pin_codes')
    .insert({
      pin_code,
      city,
      state,
      is_active: is_active !== undefined ? is_active : true,
    })
    .returning('*');
  return record;
};

/**
 * Updates a serviceable pin code entry.
 * @param {string|number} pinCodeId
 * @param {{ pin_code?: string, city?: string, state?: string, is_active?: boolean }} data
 */
const updateServiceablePinCode = async (pinCodeId, data) => {
  const { pin_code, city, state, is_active } = data;
  const updatePayload = {};
  if (pin_code !== undefined) updatePayload.pin_code = pin_code;
  if (city !== undefined) updatePayload.city = city;
  if (state !== undefined) updatePayload.state = state;
  if (is_active !== undefined) updatePayload.is_active = is_active;
  updatePayload.updated_at = db.fn.now();

  const [record] = await db('serviceable_pin_codes')
    .where({ id: pinCodeId })
    .update(updatePayload)
    .returning('*');
  if (!record) {
    const err = new Error('Pin code not found');
    err.statusCode = 404;
    throw err;
  }
  return record;
};

/**
 * Deletes a serviceable pin code by primary key.
 * @param {string|number} pinCodeId
 */
const deleteServiceablePinCode = async (pinCodeId) => {
  const deleted = await db('serviceable_pin_codes').where({ id: pinCodeId }).delete();
  if (!deleted) {
    const err = new Error('Pin code not found');
    err.statusCode = 404;
    throw err;
  }
};

// ── Reports (cross-domain aggregation) ───────────────────────────────────────

/**
 * Aggregates data from multiple domains (users, orders, serviceable pin codes)
 * and returns a unified report payload.
 *
 * @param {{ from?: string, to?: string, type?: string }} filters
 */
const getReports = async (filters = {}) => {
  const { from, to } = filters;

  const [userStats, orderStats, revenueStats, pinCodeStats, roleStats] =
    await Promise.all([
      // Delegate to users domain table
      db('users').count('id as total').first(),

      // Delegate to orders domain table
      db('orders')
        .count('id as total')
        .modify((qb) => {
          if (from) qb.where('created_at', '>=', new Date(from));
          if (to) qb.where('created_at', '<=', new Date(to));
        })
        .first(),

      // Revenue aggregation from orders domain
      db('orders')
        .sum('total_amount as revenue')
        .modify((qb) => {
          if (from) qb.where('created_at', '>=', new Date(from));
          if (to) qb.where('created_at', '<=', new Date(to));
        })
        .first(),

      // Delegate to serviceable_pin_codes table
      db('serviceable_pin_codes')
        .select(
          db.raw('count(*) as total'),
          db.raw('count(*) filter (where is_active = true) as active')
        )
        .first(),

      // Delegate to roles domain table
      db('roles').count('id as total').first(),
    ]);

  return {
    users: {
      total: parseInt(userStats.total, 10) || 0,
    },
    orders: {
      total: parseInt(orderStats.total, 10) || 0,
      revenue: parseFloat(revenueStats.revenue) || 0,
    },
    serviceablePinCodes: {
      total: parseInt(pinCodeStats.total, 10) || 0,
      active: parseInt(pinCodeStats.active, 10) || 0,
    },
    roles: {
      total: parseInt(roleStats.total, 10) || 0,
    },
  };
};

module.exports = {
  getAllPermissions,
  getAllRoles,
  createRole,
  getRoleById,
  updateRole,
  deleteRole,
  getRolePermissions,
  addPermissionToRole,
  removePermissionFromRole,
  getAllServiceablePinCodes,
  createServiceablePinCode,
  updateServiceablePinCode,
  deleteServiceablePinCode,
  getReports,
};
