const db = require('../../db');

const TABLE = 'notifications';

/**
 * Creates a new notification record.
 * Intended to be called by other services (e.g. orders, messages).
 *
 * @param {object} params
 * @param {string|number} params.userId      - Recipient user ID
 * @param {string}        params.type        - Notification type identifier
 * @param {string}        params.title       - Short title
 * @param {string}        params.body        - Full notification body
 * @param {object}        [params.metadata]  - Optional extra data (JSON)
 * @returns {Promise<object>} The created notification row
 */
async function createNotification({ userId, type, title, body, metadata = null }) {
  const [notification] = await db(TABLE)
    .insert({
      user_id: userId,
      type,
      title,
      body,
      metadata: metadata ? JSON.stringify(metadata) : null,
      is_read: false,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning('*');

  return notification;
}

/**
 * Retrieves a paginated list of notifications for a user, newest first.
 *
 * @param {string|number} userId
 * @param {{ page: number, limit: number }} options
 * @returns {Promise<{ items: object[], page: number, limit: number, total: number }>}
 */
async function getNotificationsForUser(userId, { page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;

  const [{ count }] = await db(TABLE)
    .where({ user_id: userId })
    .count('id as count');

  const items = await db(TABLE)
    .where({ user_id: userId })
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset)
    .select('*');

  return {
    items,
    page,
    limit,
    total: parseInt(count, 10),
  };
}

/**
 * Retrieves a single notification by ID.
 *
 * @param {string|number} notificationId
 * @param {string|number} userId  - Ensures ownership
 * @returns {Promise<object|null>}
 */
async function getNotificationById(notificationId, userId) {
  const notification = await db(TABLE)
    .where({ id: notificationId, user_id: userId })
    .first();

  return notification || null;
}

/**
 * Returns the count of unread notifications for a user.
 *
 * @param {string|number} userId
 * @returns {Promise<number>}
 */
async function getUnreadCount(userId) {
  const [{ count }] = await db(TABLE)
    .where({ user_id: userId, is_read: false })
    .count('id as count');

  return parseInt(count, 10);
}

/**
 * Marks a single notification as read.
 * Returns null if the notification does not exist or does not belong to the user.
 *
 * @param {string|number} notificationId
 * @param {string|number} userId
 * @returns {Promise<object|null>}
 */
async function markAsRead(notificationId, userId) {
  const [updated] = await db(TABLE)
    .where({ id: notificationId, user_id: userId })
    .update({
      is_read: true,
      updated_at: db.fn.now(),
    })
    .returning('*');

  return updated || null;
}

/**
 * Marks all unread notifications as read for a user.
 *
 * @param {string|number} userId
 * @returns {Promise<number>} Number of rows updated
 */
async function markAllAsRead(userId) {
  const updatedCount = await db(TABLE)
    .where({ user_id: userId, is_read: false })
    .update({
      is_read: true,
      updated_at: db.fn.now(),
    });

  return updatedCount;
}

module.exports = {
  createNotification,
  getNotificationsForUser,
  getNotificationById,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
