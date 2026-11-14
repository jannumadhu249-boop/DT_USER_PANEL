import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import SendQueryModal from "./SendQueryModal";
import {
  LayoutGrid,
  User,
  UserCheck,
  Users,
  Home,
  CreditCard,
  Upload,
  Calendar,
  TrendingUp,
  Download,
  ChevronRight,
  ChevronDown,
  ClipboardList,
  FolderOpen,
  Bell,
} from "lucide-react";
import { URLS } from "../url";
import { getStoredUser } from "../utils/user";
import { fetchNotifications, isNotificationUnread } from "../utils/notifications";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const [basicInfoOpen, setBasicInfoOpen] = useState(false);
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [taxOrganizerYear, setTaxOrganizerYear] = useState(null);
  const [fileStatus, setFileStatus] = useState("");
  const [user, setUser] = useState(() => getStoredUser());
  const [notificationCount, setNotificationCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  // 1. Fetch current tax organizer year from URLS.GetTaxOrganizerYear
  useEffect(() => {
    const fetchCurrentYear = async () => {
      try {
        const response = await fetch(URLS.GetTaxOrganizerYear, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          const rawYear =
            data?.data?.name ||
            data?.data?.year ||
            data?.name ||
            data?.year ||
            (typeof data?.data === "string" || typeof data?.data === "number" ? data.data : null);
          if (rawYear) {
            setTaxOrganizerYear(String(rawYear).trim());
          }
        }
      } catch (error) {
        console.error("Failed to fetch tax organizer year:", error);
      }
    };

    // 2. Fetch user profile & file status
    const fetchUserFileStatus = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) return;

        const response = await fetch(URLS.GetProfile, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.data) {
            const profileData = data.data;
            const updated = { ...getStoredUser(), ...profileData };
            setUser(updated);
            const status = profileData.file_status;
            const statusName =
              typeof status === "string"
                ? status
                : status?.name || "";
            setFileStatus(statusName);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user file status in Sidebar:", error);
      }
    };

    // 3. Fetch notifications count
    const loadNotificationCount = async () => {
      try {
        const items = await fetchNotifications();
        if (Array.isArray(items)) {
          setNotificationCount(items.filter(isNotificationUnread).length);
        }
      } catch (_) {}
    };

    fetchCurrentYear();
    fetchUserFileStatus();
    loadNotificationCount();

    const handleUserUpdated = () => {
      const stored = getStoredUser();
      if (stored) setUser(stored);
      fetchUserFileStatus();
    };

    const handleNotificationsUpdated = () => loadNotificationCount();

    window.addEventListener("user-updated", handleUserUpdated);
    window.addEventListener("storage", handleUserUpdated);
    window.addEventListener("notifications-updated", handleNotificationsUpdated);

    return () => {
      window.removeEventListener("user-updated", handleUserUpdated);
      window.removeEventListener("storage", handleUserUpdated);
      window.removeEventListener("notifications-updated", handleNotificationsUpdated);
    };
  }, []);

  // Format Year display, e.g. "TY2025" or "TY2026"
  const displayYear = (() => {
    if (!taxOrganizerYear) return "TY2025";
    const cleaned = String(taxOrganizerYear).trim();
    if (/^TY/i.test(cleaned)) {
      return cleaned.toUpperCase();
    }
    return `TY${cleaned}`;
  })();

  // Display Name, e.g. "Hi, Balakrishna B"
  const displayName =
    user?.name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.first_name ||
    user?.email?.split("@")[0] ||
    "User";

  // Helper to check if file status is Payment Pending E-Filing or Paper Filing
  const isPaymentPending = (status) => {
    if (!status) return false;
    const norm = status.toLowerCase().trim();
    const isEfiling =
      norm.includes("payment pending efiling") ||
      norm.includes("payment pending e-filing") ||
      norm.includes("payment pending e filing") ||
      (norm.includes("payment pending") && (norm.includes("efiling") || norm.includes("e-filing")));

    const isPaperFiling =
      norm.includes("payment pending paper filing") ||
      norm.includes("payment pending paper-filing") ||
      (norm.includes("payment pending") && norm.includes("paper"));

    return isEfiling || isPaperFiling;
  };

  const showMakePaymentItem = isPaymentPending(fileStatus);

  const baseMenuItems = [
    { icon: LayoutGrid, label: "Dashboard", path: "/dashboard" },
    {
      icon: User,
      label: "Basic Information",
      hasSubmenu: true,
      submenu: [
        { icon: User, label: "Taxpayer", path: "/dashboard/basic-info/taxpayer" },
        { icon: UserCheck, label: "Spouse", path: "/dashboard/basic-info/spouse" },
        { icon: Users, label: "Dependent", path: "/dashboard/basic-info/dependent" },
        { icon: Home, label: "Address in tax year", path: "/dashboard/basic-info/address" },
        { icon: CreditCard, label: "Bank details", path: "/dashboard/basic-info/bank" },
      ],
    },
    { icon: Upload, label: "Upload Tax Documents", path: "/dashboard/upload" },
    {
      icon: Calendar,
      label: "Schedule For Tax Notes ",
      path: "/dashboard/schedule",
    },
    { icon: TrendingUp, label: "My Tax Summary", path: "/dashboard/tax-summary" },
  ];

  if (showMakePaymentItem) {
    baseMenuItems.push({
      icon: CreditCard,
      label: "Make Payment",
      path: "/dashboard/make-payment",
    });
  }

  baseMenuItems.push(
    { icon: Users, label: "Referrals Details", path: "/dashboard/referrals" },
    { icon: Download, label: "Download Tax Returns", path: "/dashboard/download" },
    { icon: ClipboardList, label: "FBAR Questionnaire", path: "/dashboard/fbar" },
    { icon: FolderOpen, label: `${taxOrganizerYear ? taxOrganizerYear : ""} Tax Organizer`, path: "/dashboard/organizer" }
  );

  const menuItems = baseMenuItems;

  // Check if any submenu item is active
  const isBasicInfoActive = menuItems[1]?.submenu?.some(
    (item) =>
      location.pathname === item.path ||
      (location.pathname === "/taxpayer" && item.path.includes("taxpayer")) ||
      (location.pathname === "/spouse" && item.path.includes("spouse")) ||
      (location.pathname === "/dependent" && item.path.includes("dependent")) ||
      (location.pathname === "/address-in-tax-year" && item.path.includes("address")) ||
      (location.pathname === "/bank-details" && item.path.includes("bank"))
  );

  // Auto-expand Basic Information if on a submenu page
  useEffect(() => {
    if (isBasicInfoActive) {
      setBasicInfoOpen(true);
    }
  }, [isBasicInfoActive]);

  const handleMenuClick = (item) => {
    if (item.hasSubmenu) {
      setBasicInfoOpen(!basicInfoOpen);
    } else {
      navigate(item.path);
      if (window.innerWidth <= 768 && setSidebarOpen) {
        setSidebarOpen(false);
      }
    }
  };

  const handleSubmenuClick = (path) => {
    navigate(path);
    if (window.innerWidth <= 768 && setSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        {/* Top Header: Logo + User Profile Circle + Welcome To TY{year} + Hi, Name + Notifications */}
        <div className="sidebar-header">
          {/* Brand Logo */}
          <div className="logo-container">
            <img
              src="/images/logo-lg.png"
              alt="Dollar Tax Filer"
              className="sidebar-logo"
              onClick={() => navigate("/dashboard")}
              style={{ cursor: "pointer" }}
            />
          </div>

          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              {user?.image ? (
                <img src={user.image} alt={displayName} className="sidebar-user-avatar-img" />
              ) : (
                <svg
                  viewBox="0 0 44 44"
                  width="44"
                  height="44"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="sidebar-user-avatar-svg"
                >
                  <circle cx="22" cy="22" r="22" fill="#94A3B8" />
                  <circle cx="22" cy="15" r="6.5" fill="#FFFFFF" />
                  <path
                    d="M10 36.5C10 29.8726 15.3726 24.5 22 24.5C28.6274 24.5 34 29.8726 34 36.5V38H10V36.5Z"
                    fill="#FFFFFF"
                  />
                </svg>
              )}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-welcome-label">Welcome To</span>
              <span className="sidebar-year-label">{displayYear}</span>
              <span className="sidebar-user-name" title={displayName}>
                Hi, {displayName}
              </span>
            </div>
          </div>

          {/* Notifications Pill Button */}
          <button
            type="button"
            className="sidebar-notification-pill"
            onClick={() => {
              navigate("/send-query");
              if (window.innerWidth <= 768 && setSidebarOpen) {
                setSidebarOpen(false);
              }
            }}
          >
            <div className="sidebar-notification-left">
              <Bell size={16} className="sidebar-notification-bell" />
              <span className="sidebar-notification-text">Notifications</span>
            </div>
            <span className="sidebar-notification-badge">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="sidebar-nav">
          {menuItems.map((item, index) => {
            const ItemIcon = item.icon;
            const isItemActive =
              (item.path === "/dashboard" &&
                (location.pathname === "/dashboard" || location.pathname === "/client-dashboard")) ||
              (item.hasSubmenu ? isBasicInfoActive : location.pathname === item.path);

            return (
              <div key={index}>
                <a
                  href="#"
                  className={`nav-item ${isItemActive ? "active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleMenuClick(item);
                  }}
                >
                  <ItemIcon size={19} />
                  <span>{item.label}</span>
                  {item.hasSubmenu &&
                    (basicInfoOpen ? (
                      <ChevronDown size={16} className="nav-arrow" />
                    ) : (
                      <ChevronRight size={16} className="nav-arrow" />
                    ))}
                </a>

                {/* Submenu for Basic Information */}
                {item.hasSubmenu && basicInfoOpen && (
                  <div className="submenu">
                    {item.submenu.map((subItem, subIndex) => {
                      const SubIcon = subItem.icon;
                      const isSubActive =
                        location.pathname === subItem.path ||
                        (location.pathname === "/taxpayer" && subItem.path.includes("taxpayer")) ||
                        (location.pathname === "/spouse" && subItem.path.includes("spouse")) ||
                        (location.pathname === "/dependent" && subItem.path.includes("dependent")) ||
                        (location.pathname === "/address-in-tax-year" && subItem.path.includes("address")) ||
                        (location.pathname === "/bank-details" && subItem.path.includes("bank"));

                      return (
                        <a
                          key={subIndex}
                          href="#"
                          className={`submenu-item ${isSubActive ? "active" : ""}`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleSubmenuClick(subItem.path);
                          }}
                        >
                          {SubIcon ? <SubIcon size={16} /> : <span className="submenu-dot">•</span>}
                          <span>{subItem.label}</span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      <SendQueryModal 
        isOpen={isQueryModalOpen}
        onClose={() => setIsQueryModalOpen(false)}
      />
    </>
  );
};

export default Sidebar;
