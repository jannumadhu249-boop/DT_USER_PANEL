import { URLS } from "../url";

export const isNotificationUnread = (notification) => {
  if (!notification) return false;

  const readFlags = [
    notification.is_read,
    notification.isRead,
    notification.read,
    notification.notification_read,
  ];

  if (readFlags.some((flag) => flag === true || flag === 1 || flag === "1" || flag === "true")) {
    return false;
  }
  if (readFlags.some((flag) => flag === false || flag === 0 || flag === "0" || flag === "false")) {
    return true;
  }

  if (typeof notification.status === "string") {
    const status = notification.status.toLowerCase();
    if (status === "read" || status === "seen") return false;
    if (status === "unread" || status === "new") return true;
  }

  return true;
};

export const getNotificationId = (notification) =>
  notification?._id || notification?.id || notification?.notification_id || null;

export const markNotificationAsRead = async (notificationId) => {
  const token = localStorage.getItem("token");
  if (!token || !notificationId) return false;

  try {
    const response = await fetch(`${URLS.MarkNotificationRead}${notificationId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    return data.success !== false;
  } catch (err) {
    console.error("Error marking notification as read:", err);
    return false;
  }
};

export const markNotificationsAsRead = async (notifications = []) => {
  const unread = notifications.filter(isNotificationUnread);
  if (unread.length === 0) return 0;

  await Promise.all(
    unread.map((notification) => markNotificationAsRead(getNotificationId(notification)))
  );

  window.dispatchEvent(new Event("notifications-updated"));
  return unread.length;
};

export const fetchNotifications = async () => {
  const token = localStorage.getItem("token");
  if (!token) return [];

  try {
    const response = await fetch(URLS.GetNotificationsList, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (data.success) {
      return data.data || [];
    }
  } catch (err) {
    console.error("Error fetching notifications:", err);
  }

  return [];
};

export const fetchUnreadNotificationCount = async () => {
  const token = localStorage.getItem("token");
  if (!token) return 0;

  try {
    const notifications = await fetchNotifications();
    if (notifications.length > 0) {
      return notifications.filter(isNotificationUnread).length;
    }

    const response = await fetch(URLS.GetNotificationCount, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (data.success) {
      return data.count || data.data?.count || 0;
    }
  } catch (err) {
    console.error("Error fetching notification count:", err);
  }

  return 0;
};
