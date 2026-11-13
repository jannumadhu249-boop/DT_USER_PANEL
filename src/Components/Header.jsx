import { useEffect, useRef } from "react";
import { Menu, X, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProfileDropdown from "./ProfileDropdown";
import NotificationDropdown from "./NotificationDropdown";
import { buildMailtoUrl, scheduleMailFallback, CONTACT_EMAIL } from "../utils/mail";

// Filled phone icon SVG (solid glyph)
const PhoneFilled = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="#2c2f7e"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
  >
    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
  </svg>
);

// Fully filled solid mail/envelope icon SVG (solid glyph, not border/outline)
const MailFilled = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="#2c2f7e"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
  >
    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
  </svg>
);

const Header = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const mailFallbackTimerRef = useRef(null);

  // Clear the pending mail fallback when the header unmounts
  useEffect(() => {
    return () => {
      if (mailFallbackTimerRef.current) clearTimeout(mailFallbackTimerRef.current);
    };
  }, []);

  // The anchor opens the desktop client; if no handler is registered the page
  // keeps focus and the same message opens in a web compose window instead.
  const handleEmailClick = () => {
    if (mailFallbackTimerRef.current) clearTimeout(mailFallbackTimerRef.current);
    mailFallbackTimerRef.current = scheduleMailFallback({ to: CONTACT_EMAIL });
  };

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
          <div className="contact-item contact-item-stacked">
            <img
              src="https://flagcdn.com/w20/us.png"
              alt="US Flag"
              className="flag-icon"
            />
            <PhoneFilled />
            <div className="phone-numbers-stacked">
              <a href="tel:+16163301947" className="phone-link">+1-616-330-1947</a>
              <a href="tel:+16164209090" className="phone-link">+1-616-420-9090</a>
            </div>
          </div>
          <a href="tel:+918466077444" className="contact-item">
            <img
              src="https://flagcdn.com/w20/in.png"
              alt="India Flag"
              className="flag-icon"
            />
            <PhoneFilled />
            <span>+91-8466077444</span>
          </a>
          <a
            href={buildMailtoUrl({ to: CONTACT_EMAIL })}
            className="contact-item"
            onClick={handleEmailClick}
          >
            <MailFilled />
            <span>contact@dollartaxfiler.com</span>
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
