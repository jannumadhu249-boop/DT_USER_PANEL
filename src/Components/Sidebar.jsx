import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import SendQueryModal from "./SendQueryModal";
import {
  Home,
  FileText,
  Upload,
  Calendar,
  TrendingUp,
  Users,
  Download,
  ChevronRight,
  ChevronDown,
  ClipboardList,
  FolderOpen,
  CreditCard,
} from "lucide-react";
import { URLS } from "../url";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const [basicInfoOpen, setBasicInfoOpen] = useState(false);
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [taxOrganizerYear, setTaxOrganizerYear] = useState(null);
  const [fileStatus, setFileStatus] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch current tax organizer year and user file status dynamically from API
  useEffect(() => {
    const fetchCurrentYear = async () => {
      try {
        const response = await fetch(URLS.GetTaxOrganizerYear, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (data && data.data && data.data.name) {
          setTaxOrganizerYear(data.data.name);
        }
      } catch (error) {
        console.error("Failed to fetch tax organizer year:", error);
      }
    };

    const fetchUserFileStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        
        // Check profile API
        const response = await fetch(URLS.GetProfile, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data && data.data) {
          const status = data.data.file_status;
          const statusName =
            typeof status === "string"
              ? status
              : status?.name || "";
          setFileStatus(statusName);
        }
      } catch (error) {
        console.error("Failed to fetch user file status in Sidebar:", error);
      }
    };

    fetchCurrentYear();
    fetchUserFileStatus();

    // Listen for user updates
    const handleUserUpdated = () => fetchUserFileStatus();
    window.addEventListener("user-updated", handleUserUpdated);
    return () => window.removeEventListener("user-updated", handleUserUpdated);
  }, []);

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
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    {
      icon: FileText,
      label: "Basic Information",
      hasSubmenu: true,
      submenu: [
        { label: "Taxpayer", path: "/dashboard/basic-info/taxpayer" },
        { label: "Spouse", path: "/dashboard/basic-info/spouse" },
        { label: "Dependent", path: "/dashboard/basic-info/dependent" },
        { label: "Address in tax year", path: "/dashboard/basic-info/address" },
        { label: "Bank details", path: "/dashboard/basic-info/bank" },
      ],
    },
    { icon: Upload, label: "Upload Tax Documents", path: "/dashboard/upload" },
    {
      icon: Calendar,
      label: "Schedule a Tax Consultation",
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
  const isBasicInfoActive = menuItems[1].submenu.some(
    (item) => location.pathname === item.path
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
      // Close sidebar on mobile after navigation
      if (window.innerWidth <= 768 && setSidebarOpen) {
        setSidebarOpen(false);
      }
    }
  };

  const handleSubmenuClick = (path) => {
    navigate(path);
    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768 && setSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <img
              src="/images/logo-lg.png"
              alt="Tax Filer"
              className="sidebar-logo"
            />
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, index) => (
            <div key={index}>
              <a
                href="#"
                className={`nav-item ${
                  location.pathname === item.path || (item.hasSubmenu && isBasicInfoActive)
                    ? "active"
                    : ""
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  handleMenuClick(item);
                }}
              >
                <item.icon size={20} />
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
                  {item.submenu.map((subItem, subIndex) => (
                    <a
                      key={subIndex}
                      href="#"
                      className={`submenu-item ${
                        location.pathname === subItem.path ? "active" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleSubmenuClick(subItem.path);
                      }}
                    >
                      <span className="submenu-dot">•</span>
                      <span>{subItem.label}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* <div className="help-section">
          <div className="help-card">
            <h4>Need Help ?</h4>
            <p>Contact our expert support team anytime.</p>
            <button 
              className="btn-help"
              onClick={() => setIsQueryModalOpen(true)}
            >
              Send Query
            </button>
          </div>
        </div> */}
      </aside>

      <SendQueryModal 
        isOpen={isQueryModalOpen}
        onClose={() => setIsQueryModalOpen(false)}
      />
    </>
  );
};

export default Sidebar;
