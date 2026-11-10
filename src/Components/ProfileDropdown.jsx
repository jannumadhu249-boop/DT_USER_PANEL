import React, { useState, useEffect, useRef } from "react";
import { User, Key, LogOut, Mail, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getStoredUser, isEmailVerified } from "../utils/user";
import "../styles/ProfileDropdown.css";
import { URLS } from "../url";

// Helper to get auth token
const getAuthToken = () => {
  const keys = ['authToken', 'token', 'adminToken', 'accessToken', 'jwt'];
  for (const key of keys) {
    const value = sessionStorage.getItem(key) || localStorage.getItem(key);
    if (value) return value;
  }
  return null;
};

const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch profile from API
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch(URLS.GetProfile, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }
        setUser(getStoredUser());
        return;
      }

      const result = await res.json();
      if (result.success && result.data) {
        const profileData = result.data;
        const stored = getStoredUser() || {};
        const userData = {
          ...stored,
          ...profileData,
          name: profileData.name || stored.name || '',
          email: profileData.email || stored.email || '',
          file_no: profileData.file_no || stored.file_no || '',
          file_status: profileData.file_status || stored.file_status || { code: '', name: '' },
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        window.dispatchEvent(new Event('user-updated'));
      } else {
        setUser(getStoredUser());
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setUser(getStoredUser());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      setLoading(false);
    }
    fetchProfile();

    const handleUserUpdated = () => {
      setUser(getStoredUser());
    };
    window.addEventListener('user-updated', handleUserUpdated);
    return () => window.removeEventListener('user-updated', handleUserUpdated);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleViewProfile = () => {
    setIsOpen(false);
    navigate('/profile');
  };

  const handleChangePassword = () => {
    setIsOpen(false);
    navigate('/change-password');
  };

  const handleVerifyEmail = () => {
    setIsOpen(false);
    navigate('/verify-email');
  };

  // const showVerifyEmail = user && !isEmailVerified(user);

  const displayName = user?.name || user?.first_name || '';
  const displayEmail = user?.email || '';
  const displayFileNo = user?.file_no || '—';
  const displayFileStatus =
    user?.file_status?.name ||
    user?.file_status?.label ||
    (typeof user?.file_status === 'string' ? user.file_status : '') ||
    '—';
  const userInitial = displayName ? displayName.trim().charAt(0).toUpperCase() : '';

  return (
    <div className="profile-dropdown-container" ref={dropdownRef}>
      <button
        className="icon-btn profile-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User Profile"
      >
        <User size={19} />
      </button>

      {isOpen && (
        <div className="profile-dropdown">
          {/* User Info Header */}
          <div className="profile-user-card" onClick={handleViewProfile} title="View Profile">
            <div className="profile-avatar">
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : userInitial ? (
                userInitial
              ) : (
                <User size={16} />
              )}
            </div>
            <div className="profile-user-details">
              <h4 className="profile-name">{loading ? 'Loading...' : displayName || 'My Account'}</h4>
              <p className="profile-email">{loading ? '...' : displayEmail || '—'}</p>
            </div>
          </div>

          {/* Quick Meta Row (File # and Status) */}
          <div className="profile-meta-row">
            <div className="profile-meta-col">
              <span className="profile-meta-label">File No</span>
              <span className="profile-meta-val">#{displayFileNo}</span>
            </div>
            {/* <div className="profile-meta-divider" /> */}
            {/* <div className="profile-meta-col">
              <span className="profile-meta-label">File Status</span>
              <span className="profile-meta-val status-val">{displayFileStatus}</span>
            </div> */}
          </div>
          <div className="profile-meta-row">
            <div className="profile-meta-col">
              <span className="profile-meta-label">File Status</span>
              <span className="profile-meta-val status-val">{displayFileStatus}</span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="profile-menu">
            <button
              className="profile-menu-item"
              onClick={handleViewProfile}
            >
              <User size={16} />
              <span>My Profile</span>
            </button>

            <button
              className="profile-menu-item"
              onClick={handleChangePassword}
            >
              <Key size={16} />
              <span>Change Password</span>
            </button>

            {/* {showVerifyEmail && (
              <button
                className="profile-menu-item verify-email-item"
                onClick={handleVerifyEmail}
              >
                <Mail size={16} />
                <span>Verify Email</span>
                <span className="profile-menu-badge">Verify</span>
              </button>
            )} */}

            <div className="profile-menu-divider" />

            <button className="profile-menu-item logout-item" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
