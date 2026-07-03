import Notification from '../models/Notification.js';
import { success } from '../utils/apiResponse.js';
import asyncWrapper from '../utils/asyncWrapper.js';
import APIFeatures from '../utils/apiFeatures.js';

export const getNotifications = asyncWrapper(async (req, res, next) => {
  const features = new APIFeatures(Notification.find({ user: req.user.id }), req.query)
    .sort()
    .paginate();

  const notifications = await features.query;
  const total = await Notification.countDocuments({ user: req.user.id });
  const unreadCount = await Notification.countDocuments({ user: req.user.id, isRead: false });

  return success(res, {
    message: 'Notifications retrieved',
    data: { notifications, unreadCount },
    meta: { total, page: req.query.page * 1 || 1, limit: req.query.limit * 1 || 100 }
  });
});

export const markAsRead = asyncWrapper(async (req, res, next) => {
  await Notification.updateMany(
    { user: req.user.id, _id: { $in: req.body.notificationIds } },
    { isRead: true }
  );

  return success(res, { message: 'Notifications marked as read' });
});

export const markAllAsRead = asyncWrapper(async (req, res, next) => {
  await Notification.updateMany(
    { user: req.user.id, isRead: false },
    { isRead: true }
  );

  return success(res, { message: 'All notifications marked as read' });
});

export const deleteNotification = asyncWrapper(async (req, res, next) => {
  await Notification.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  return success(res, { message: 'Notification deleted' });
});
