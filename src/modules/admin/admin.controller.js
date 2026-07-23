'use strict';

const adminService = require('./admin.service');

// ── Reports ───────────────────────────────────────────────────────────────────

/**
 * GET /admin/reports
 * Orchestrates cross-domain read aggregations and returns a dashboard report.
 */
const getReports = async (req, res, next) => {
  try {
    const filters = {
      from: req.query.from,
      to: req.query.to,
      type: req.query.type,
    };
    const report = await adminService.getReports(filters);
    return res.status(200).json({ success: true, data: report });
  } catch (err) {
    return next(err);
  }
};

// ── Permissions ───────────────────────────────────────────────────────────────

/**
 * GET /admin/permissions
 * Returns all system permissions.
 */
const getPermissions = async (req, res, next) => {
  try {
    const permissions = await adminService.getAllPermissions();
    return res.status(200).json({ success: true, data: permissions });
  } catch (err) {
    return next(err);
  }
};

// ── Roles ─────────────────────────────────────────────────────────────────────

/**
 * GET /admin/roles
 */
const getRoles = async (req, res, next) => {
  try {
    const roles = await adminService.getAllRoles();
    return res.status(200).json({ success: true, data: roles });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /admin/roles
 */
const createRole = async (req, res, next) => {
  try {
    const role = await adminService.createRole(req.body);
    return res.status(201).json({ success: true, data: role });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /admin/roles/:roleId
 */
const getRoleById = async (req, res, next) => {
  try {
    const role = await adminService.getRoleById(req.params.roleId);
    return res.status(200).json({ success: true, data: role });
  } catch (err) {
    return next(err);
  }
};

/**
 * PUT /admin/roles/:roleId
 */
const updateRole = async (req, res, next) => {
  try {
    const role = await adminService.updateRole(req.params.roleId, req.body);
    return res.status(200).json({ success: true, data: role });
  } catch (err) {
    return next(err);
  }
};

/**
 * DELETE /admin/roles/:roleId
 */
const deleteRole = async (req, res, next) => {
  try {
    await adminService.deleteRole(req.params.roleId);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};

// ── Role → Permissions ────────────────────────────────────────────────────────

/**
 * GET /admin/roles/:roleId/permissions
 */
const getRolePermissions = async (req, res, next) => {
  try {
    const permissions = await adminService.getRolePermissions(req.params.roleId);
    return res.status(200).json({ success: true, data: permissions });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /admin/roles/:roleId/permissions
 */
const addPermissionToRole = async (req, res, next) => {
  try {
    const entry = await adminService.addPermissionToRole(
      req.params.roleId,
      req.body
    );
    return res.status(201).json({ success: true, data: entry });
  } catch (err) {
    return next(err);
  }
};

/**
 * DELETE /admin/roles/:roleId/permissions/:permissionId
 */
const removePermissionFromRole = async (req, res, next) => {
  try {
    await adminService.removePermissionFromRole(
      req.params.roleId,
      req.params.permissionId
    );
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};

// ── Serviceable Pin Codes ─────────────────────────────────────────────────────

/**
 * GET /admin/serviceable-pin-codes
 */
const getServiceablePinCodes = async (req, res, next) => {
  try {
    const pinCodes = await adminService.getAllServiceablePinCodes(req.query);
    return res.status(200).json({ success: true, data: pinCodes });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /admin/serviceable-pin-codes
 */
const createServiceablePinCode = async (req, res, next) => {
  try {
    const pinCode = await adminService.createServiceablePinCode(req.body);
    return res.status(201).json({ success: true, data: pinCode });
  } catch (err) {
    return next(err);
  }
};

/**
 * PUT /admin/serviceable-pin-codes/:pinCodeId
 */
const updateServiceablePinCode = async (req, res, next) => {
  try {
    const pinCode = await adminService.updateServiceablePinCode(
      req.params.pinCodeId,
      req.body
    );
    return res.status(200).json({ success: true, data: pinCode });
  } catch (err) {
    return next(err);
  }
};

/**
 * DELETE /admin/serviceable-pin-codes/:pinCodeId
 */
const deleteServiceablePinCode = async (req, res, next) => {
  try {
    await adminService.deleteServiceablePinCode(req.params.pinCodeId);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getReports,
  getPermissions,
  getRoles,
  createRole,
  getRoleById,
  updateRole,
  deleteRole,
  getRolePermissions,
  addPermissionToRole,
  removePermissionFromRole,
  getServiceablePinCodes,
  createServiceablePinCode,
  updateServiceablePinCode,
  deleteServiceablePinCode,
};
