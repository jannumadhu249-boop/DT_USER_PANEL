import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/NotificationDropdown.css";
import {
  fetchNotifications,
  isNotificationUnread,
  markNotificationsAsRead,
} from "../utils/notifications";

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const refreshNotifications = useCallback(async () => {
    const items = await fetchNotifications();
    setNotifications(items);
    setCount(items.filter(isNotificationUnread).length);
  }, []);

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 60000);
    const handleUpdated = () => refreshNotifications();

    window.addEventListener("notifications-updated", handleUpdated);
    return () => {
      clearInterval(interval);
      window.removeEventListener("notifications-updated", handleUpdated);
    };
  }, [refreshNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = async () => {
    const opening = !isOpen;
    setIsOpen(opening);

    if (opening) {
      const items = await fetchNotifications();
      setNotifications(items);
      const unreadCount = items.filter(isNotificationUnread).length;
      setCount(unreadCount);

      if (unreadCount > 0) {
        await markNotificationsAsRead(items);
        setCount(0);
        setNotifications(items.map((item) => ({ ...item, is_read: true, isRead: true, read: true })));
      }
    }
  };

  const handleViewQueries = async () => {
    setIsOpen(false);
    if (notifications.length > 0) {
      await markNotificationsAsRead(notifications);
    } else {
      const items = await fetchNotifications();
      await markNotificationsAsRead(items);
    }
    setCount(0);
    navigate("/send-query");
  };

  return (
    <div className="notification-dropdown-container" ref={dropdownRef}>
      <button
        className="icon-btn notification-trigger"
        onClick={handleToggle}
      >
        <Bell size={20} />
        {count > 0 && <span className="badge">{count > 99 ? "99+" : count}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            <span className="badge-count">{count} unread</span>
          </div>

          <div className="notification-content">
            {count === 0 ? (
              <p className="no-notifications">No new notifications</p>
            ) : (
              <p className="no-notifications" style={{ color: "#0d6efd" }}>
                You have {count} unread notification{count > 1 ? "s" : ""}.
              </p>
            )}
            <button className="btn-view-queries" onClick={handleViewQueries}>
              View All Queries
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
