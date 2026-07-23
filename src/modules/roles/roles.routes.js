'use strict';

const { Router } = require('express');
const rolesController = require('./roles.controller');

const router = Router();

// Role CRUD
router.get('/', rolesController.listRoles);
router.get('/:id', rolesController.getRoleById);
router.post('/', rolesController.createRole);
router.put('/:id', rolesController.updateRole);
router.delete('/:id', rolesController.deleteRole);

// User-role associations (nested under /users)
router.get('/users/:userId/roles', rolesController.getUserRoles);
router.post('/users/:userId/roles', rolesController.assignRoleToUser);
router.delete('/users/:userId/roles/:roleId', rolesController.removeRoleFromUser);

module.exports = router;
