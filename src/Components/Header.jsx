import React from "react";
import { Menu, X, Users, Phone, Mail, Underline } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProfileDropdown from "./ProfileDropdown";
import NotificationDropdown from "./NotificationDropdown";

const Header = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();

  const handleReferFriend = () => {
    navigate("/referrals/refer-friend");
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <header className="top-nav">
      <button
        className="menu-toggle"
        onClick={handleToggleSidebar}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className="nav-left">
        <button 
          className="nav-menu-btn" 
          onClick={handleToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu size={24} />
        </button>
      </div>

      <div className="nav-right">
        <div className="contact-info">
          <a href="tel:+16305929655" className="contact-item">
            <img
              src="https://flagcdn.com/w20/us.png"
              alt="US Flag"
              className="flag-icon"
            />
            <Phone size={14} />
            <span>+1-630-592-9655</span>
          </a>
          <a href="tel:+919515487242" className="contact-item">
            <img
              src="https://flagcdn.com/w20/in.png"
              alt="India Flag"
              className="flag-icon"
            />
            <Phone size={14} />
            <span>+91-9515487242</span>
          </a>
          <a href="mailto:contact@dollartax.com" className="contact-item">
            <Mail size={14} />
            <span>contact@dollartax.com</span>
          </a>
        </div>

        <div className="nav-actions">
          <button className="btn-refer" onClick={handleReferFriend}>
            <Users size={18} />
            <span className="btn-refer-text">Refer Your Friend</span>
          </button>

          <NotificationDropdown />

          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
};

export default Header;
