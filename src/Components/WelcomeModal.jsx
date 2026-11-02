import React from "react";
import { Sparkles, X } from "lucide-react";
import "../styles/Modal.css";

const WelcomeModal = ({ isOpen, onClose, userData }) => {
  if (!isOpen) return null;

  const displayName = userData?.name || "Valued Client";
  const fileNo = userData?.file_no || "N/A";
  const statusName =
    typeof userData?.file_status === "string"
      ? userData.file_status
      : userData?.file_status?.name || "Interview Pending";

  return (
    <div className="welcome-modal-overlay" onClick={onClose}>
      <div
        className="welcome-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner Header */}
        <div className="welcome-modal-banner">
          <button
            type="button"
            className="welcome-modal-close-btn"
            onClick={onClose}
          >
            <X size={18} />
          </button>

          <div className="welcome-modal-icon-badge">
            <Sparkles size={32} color="#fbbf24" />
          </div>

          <h2 className="welcome-modal-title">
            Welcome to Dollar Tax! 🎉
          </h2>
          <p className="welcome-modal-subtitle">
            Hello <strong>{displayName}</strong>, we are thrilled to have you here. Your tax filing portal is ready!
          </p>
        </div>

        {/* Modal Body */}
        <div className="welcome-modal-body">
          <div className="welcome-modal-info-box">
            <div className="welcome-modal-info-row">
              <span className="welcome-modal-info-label">File Number:</span>
              <span className="welcome-modal-info-value">#{fileNo}</span>
            </div>

            <div className="welcome-modal-info-row">
              <span className="welcome-modal-info-label">Current File Status:</span>
              <span className="welcome-modal-status-badge">{statusName}</span>
            </div>
          </div>
{/* 
          <p className="welcome-modal-desc">
            Our dedicated team of CPA tax experts is ready to process your returns accurately, maximize your deductions, and secure your maximum refund.
          </p> */}

          {/* <button
            type="button"
            className="welcome-modal-btn"
            onClick={onClose}
          >
            Get Started 🚀
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
