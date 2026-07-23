const notificationsService = require('./notifications.service');

/**
 * GET /notifications
 * Returns a paginated list of notifications for the authenticated user,
 * including an unread count for polling use-cases.
 */
async function getNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const [notifications, unreadCount] = await Promise.all([
      notificationsService.getNotificationsForUser(userId, { page, limit }),
      notificationsService.getUnreadCount(userId),
    ]);

    return res.status(200).json({
      data: notifications.items,
      meta: {
        page: notifications.page,
        limit: notifications.limit,
        total: notifications.total,
        unreadCount,
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /notifications/:id/read
 * Marks a single notification as read for the authenticated user.
 */
async function markOneRead(req, res, next) {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const notification = await notificationsService.markAsRead(notificationId, userId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    return res.status(200).json({ data: notification });
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /notifications/read-all
 * Marks all notifications as read for the authenticated user.
 */
async function markAllRead(req, res, next) {
  try {
    const userId = req.user.id;

    const updatedCount = await notificationsService.markAllAsRead(userId);

    return res.status(200).json({ data: { updatedCount } });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getNotifications,
  markOneRead,
  markAllRead,
};
