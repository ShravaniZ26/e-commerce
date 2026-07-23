'use strict';

const rolesService = require('./roles.service');

/**
 * GET /roles
 * List all roles.
 */
async function listRoles(req, res, next) {
  try {
    const roles = await rolesService.getAllRoles();
    return res.status(200).json({ data: roles });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /roles/:id
 * Get a single role by primary key.
 */
async function getRoleById(req, res, next) {
  try {
    const { id } = req.params;
    const role = await rolesService.getRoleById(id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found.' });
    }
    return res.status(200).json({ data: role });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /roles
 * Create a new role.
 */
async function createRole(req, res, next) {
  try {
    const { name, description } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ message: 'Role name is required.' });
    }
    const existing = await rolesService.getRoleByName(name.trim());
    if (existing) {
      return res.status(409).json({ message: 'A role with that name already exists.' });
    }
    const role = await rolesService.createRole({ name: name.trim(), description: description || null });
    return res.status(201).json({ data: role });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /roles/:id
 * Update an existing role.
 */
async function updateRole(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const existing = await rolesService.getRoleById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Role not found.' });
    }
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Role name must be a non-empty string.' });
      }
      const duplicate = await rolesService.getRoleByName(name.trim());
      if (duplicate && String(duplicate.id) !== String(id)) {
        return res.status(409).json({ message: 'A role with that name already exists.' });
      }
    }
    const updated = await rolesService.updateRole(id, {
      name: name !== undefined ? name.trim() : existing.name,
      description: description !== undefined ? description : existing.description,
    });
    return res.status(200).json({ data: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /roles/:id
 * Delete a role.
 */
async function deleteRole(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await rolesService.getRoleById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Role not found.' });
    }
    await rolesService.deleteRole(id);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * GET /roles/users/:userId/roles
 * List all roles assigned to a user.
 */
async function getUserRoles(req, res, next) {
  try {
    const { userId } = req.params;
    const roles = await rolesService.getUserRoles(userId);
    return res.status(200).json({ data: roles });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /roles/users/:userId/roles
 * Assign a role to a user.
 * Body: { roleId }
 */
async function assignRoleToUser(req, res, next) {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;
    if (!roleId) {
      return res.status(400).json({ message: 'roleId is required.' });
    }
    const role = await rolesService.getRoleById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found.' });
    }
    const alreadyAssigned = await rolesService.userHasRole(userId, roleId);
    if (alreadyAssigned) {
      return res.status(409).json({ message: 'User already has this role.' });
    }
    const userRole = await rolesService.assignRoleToUser(userId, roleId);
    return res.status(201).json({ data: userRole });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /roles/users/:userId/roles/:roleId
 * Remove a role from a user.
 */
async function removeRoleFromUser(req, res, next) {
  try {
    const { userId, roleId } = req.params;
    const assigned = await rolesService.userHasRole(userId, roleId);
    if (!assigned) {
      return res.status(404).json({ message: 'User does not have this role.' });
    }
    await rolesService.removeRoleFromUser(userId, roleId);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getUserRoles,
  assignRoleToUser,
  removeRoleFromUser,
};
