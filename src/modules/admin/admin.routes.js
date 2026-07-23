'use strict';

const { Router } = require('express');
const adminController = require('./admin.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireAdmin } = require('../../middleware/rbac.middleware');

const router = Router();

// Apply authentication and admin RBAC guard to every route in this module
router.use(authenticate);
router.use(requireAdmin);

// ── Reports ───────────────────────────────────────────────────────────────────
router.get('/reports', adminController.getReports);

// ── Permissions ───────────────────────────────────────────────────────────────
router.get('/permissions', adminController.getPermissions);

// ── Roles ─────────────────────────────────────────────────────────────────────
router.get('/roles', adminController.getRoles);
router.post('/roles', adminController.createRole);
router.get('/roles/:roleId', adminController.getRoleById);
router.put('/roles/:roleId', adminController.updateRole);
router.delete('/roles/:roleId', adminController.deleteRole);

// ── Role → Permissions ────────────────────────────────────────────────────────
router.get('/roles/:roleId/permissions', adminController.getRolePermissions);
router.post('/roles/:roleId/permissions', adminController.addPermissionToRole);
router.delete(
  '/roles/:roleId/permissions/:permissionId',
  adminController.removePermissionFromRole
);

// ── Serviceable Pin Codes ─────────────────────────────────────────────────────
router.get('/serviceable-pin-codes', adminController.getServiceablePinCodes);
router.post('/serviceable-pin-codes', adminController.createServiceablePinCode);
router.put('/serviceable-pin-codes/:pinCodeId', adminController.updateServiceablePinCode);
router.delete('/serviceable-pin-codes/:pinCodeId', adminController.deleteServiceablePinCode);

module.exports = router;
