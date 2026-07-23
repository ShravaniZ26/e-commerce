'use strict';

const knex = require('../knex');

const ROLES_TABLE = 'roles';
const USER_ROLES_TABLE = 'user_roles';

// ── Roles ────────────────────────────────────────────────────────────────────

const findRoleById = (id, trx = knex) =>
  trx(ROLES_TABLE).where({ id }).first();

const findRoleByName = (name, trx = knex) =>
  trx(ROLES_TABLE).where({ name }).first();

const findAllRoles = (trx = knex) =>
  trx(ROLES_TABLE).orderBy('name', 'asc');

const createRole = (data, trx = knex) =>
  trx(ROLES_TABLE).insert(data).returning('*').then((rows) => rows[0]);

const updateRole = (id, data, trx = knex) =>
  trx(ROLES_TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const deleteRole = (id, trx = knex) =>
  trx(ROLES_TABLE).where({ id }).delete();

// ── User-Roles ────────────────────────────────────────────────────────────────

const findRolesForUser = (user_id, trx = knex) =>
  trx(USER_ROLES_TABLE)
    .join(ROLES_TABLE, `${ROLES_TABLE}.id`, `${USER_ROLES_TABLE}.role_id`)
    .where({ user_id })
    .select(`${ROLES_TABLE}.*`, `${USER_ROLES_TABLE}.created_at as assigned_at`);

const findUsersForRole = (role_id, trx = knex) =>
  trx(USER_ROLES_TABLE)
    .join('users', 'users.id', `${USER_ROLES_TABLE}.user_id`)
    .where({ role_id })
    .select('users.*', `${USER_ROLES_TABLE}.created_at as assigned_at`);

const assignRoleToUser = (user_id, role_id, trx = knex) =>
  trx(USER_ROLES_TABLE)
    .insert({ user_id, role_id })
    .onConflict(['user_id', 'role_id'])
    .ignore()
    .returning('*')
    .then((rows) => rows[0]);

const revokeRoleFromUser = (user_id, role_id, trx = knex) =>
  trx(USER_ROLES_TABLE).where({ user_id, role_id }).delete();

const revokeAllRolesFromUser = (user_id, trx = knex) =>
  trx(USER_ROLES_TABLE).where({ user_id }).delete();

const userHasRole = (user_id, role_name, trx = knex) =>
  trx(USER_ROLES_TABLE)
    .join(ROLES_TABLE, `${ROLES_TABLE}.id`, `${USER_ROLES_TABLE}.role_id`)
    .where({ user_id, [`${ROLES_TABLE}.name`]: role_name })
    .first()
    .then((row) => Boolean(row));

module.exports = {
  findRoleById,
  findRoleByName,
  findAllRoles,
  createRole,
  updateRole,
  deleteRole,
  findRolesForUser,
  findUsersForRole,
  assignRoleToUser,
  revokeRoleFromUser,
  revokeAllRolesFromUser,
  userHasRole,
};
