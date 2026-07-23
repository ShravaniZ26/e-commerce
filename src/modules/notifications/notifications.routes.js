const { Router } = require('express');
const notificationsController = require('./notifications.controller');
const authenticate = require('../../middleware/authenticate');

const router = Router();

router.use(authenticate);

// GET /notifications — fetch notifications for the authenticated user
router.get('/', notificationsController.getNotifications);

// PATCH /notifications/read-all — must be registered before /:id/read to avoid conflict
router.patch('/read-all', notificationsController.markAllRead);

// PATCH /notifications/:id/read — mark a single notification as read
router.patch('/:id/read', notificationsController.markOneRead);

module.exports = router;
