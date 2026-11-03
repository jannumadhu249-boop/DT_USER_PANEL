import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import "../styles/Modal.css";
import { URLS } from "../url";

const SendQueryModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    mobile: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Load user data when modal opens
  useEffect(() => {
    if (isOpen) {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setFormData((prev) => ({
            ...prev,
            firstName: user.first_name || user.name || "",
            mobile: user.contact_number || "",
          }));
        } catch {
          // ignore
        }
      }
      // Reset messages
      setError("");
      setSuccessMsg("");
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    // Client validation
    if (!formData.firstName.trim()) {
      setError("First name is required.");
      return;
    }
    if (!formData.mobile.trim() || formData.mobile.trim().length < 10) {
      setError("Valid 10-digit mobile number is required.");
      return;
    }
    if (!formData.message.trim()) {
      setError("Message cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You are not logged in.");
        setLoading(false);
        return;
      }

      const payload = {
        first_name: formData.firstName.trim(),
        mobile: formData.mobile.trim(),
        message: formData.message.trim(),
      };

      const response = await fetch(URLS.SendQuery, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMsg(data.message || "Query submitted successfully!");
        setFormData((prev) => ({ ...prev, message: "" }));
        // Notify parent after a short delay
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1000);
      } else {
        setError(data.message || "Failed to submit query.");
      }
    } catch (err) {
      console.error("Send query error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Send Query</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger" style={{ fontSize: "0.9rem" }}>
                {error}
              </div>
            )}
            {successMsg && (
              <div className="alert alert-success" style={{ fontSize: "0.9rem" }}>
                {successMsg}
              </div>
            )}

            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Mobile</label>
              <input
                type="tel"
                className="form-control"
                placeholder="10-digit mobile number"
                value={formData.mobile}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mobile: e.target.value.replace(/\D/g, ""),
                  })
                }
                maxLength="10"
                required
              />
            </div>

            <div className="form-group">
              <label>Message</label>
              <textarea
                className="form-control"
                rows="5"
                placeholder="Type your query here..."
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="modal-footer" style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "2px solid #6B7280",
                color: "#6B7280",
                borderRadius: "8px",
                padding: "0.65rem 1.5rem",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: "#5cb389",
                border: "none",
                color: "#ffffff",
                borderRadius: "8px",
                padding: "0.65rem 1.5rem",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 2px 8px rgba(92, 179, 137, 0.25)",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="spinner"
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendQueryModal;