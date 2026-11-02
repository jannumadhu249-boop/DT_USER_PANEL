import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  X,
  Shield,
} from "lucide-react";
import { URLS } from "../url";
import { getStoredUser } from "../utils/user";
import "../styles/Dashboard.css";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Profile = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    name: "",
    email: "",
    alternate_email: "",
    contact_number: "",
  });

  const [alert, setAlert] = useState({ type: "", message: "" });
  const navigate = useNavigate();

  // ── Modal State for Changes ──
  // type: "email" | "alt_email" | "phone" | null
  const [modalType, setModalType] = useState(null);
  const [modalInput, setModalInput] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  // OTP states for email / alternate email change
  const [otpStep, setOtpStep] = useState("input"); // "input" | "otp"
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const otpRefs = useRef([]);

  // Sidebar responsiveness
  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth > 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  // Auto-dismiss top page alert after 5s
  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(() => setAlert({ type: "", message: "" }), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // 1. Fetch from GetProfile
      const resProfile = await fetch(URLS.GetProfile, {
        method: "POST",
        headers,
      });
      const dataProfile = await resProfile.json();

      // 2. Fetch from GetTaxPayer for contact & alternate fields
      let taxPayerData = {};
      try {
        const resTax = await fetch(URLS.GetTaxPayer, {
          method: "POST",
          headers,
        });
        const dataTax = await resTax.json();
        if (dataTax.success && dataTax.data) {
          taxPayerData = dataTax.data;
        }
      } catch (_) {}

      const stored = getStoredUser() || {};
      const profileData = dataProfile.success && dataProfile.data ? dataProfile.data : {};

      const firstName =
        taxPayerData.first_name || profileData.first_name || stored.first_name || "";
      const lastName =
        taxPayerData.last_name || profileData.last_name || stored.last_name || "";
      const fullName =
        profileData.name ||
        `${firstName} ${lastName}`.trim() ||
        stored.name ||
        "User";

      setProfile({
        first_name: firstName,
        last_name: lastName,
        name: fullName,
        email:
          taxPayerData.email || profileData.email || stored.email || "",
        alternate_email:
          taxPayerData.alternate_email ||
          taxPayerData.refer_email ||
          profileData.alternate_email ||
          stored.alternate_email ||
          "",
        contact_number:
          taxPayerData.contact_number ||
          profileData.contact_number ||
          stored.contact_number ||
          "",
      });
    } catch (err) {
      setAlert({
        type: "danger",
        message: "Failed to load profile details. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  // ── Open Modals ──
  const openModal = (type) => {
    setModalType(type);
    setModalError("");
    setModalSuccess("");
    setOtpStep("input");
    setOtpDigits(["", "", "", "", "", ""]);

    if (type === "email") {
      setModalInput(profile.email || "");
    } else if (type === "alt_email") {
      setModalInput(profile.alternate_email || "");
    } else if (type === "phone") {
      setModalInput(profile.contact_number || "");
    }
  };

  const closeModal = () => {
    setModalType(null);
    setModalInput("");
    setModalError("");
    setModalSuccess("");
    setOtpStep("input");
  };

  // ── Send OTP for Email / Alternate Email ──
  const handleSendEmailOtp = async () => {
    setModalError("");
    const newEmail = modalInput.trim();
    if (!newEmail) {
      setModalError("Please enter an email address.");
      return;
    }
    if (!emailRegex.test(newEmail)) {
      setModalError("Please enter a valid email address.");
      return;
    }

    setModalLoading(true);
    try {
      const token = localStorage.getItem("token");
      const isPrimary = modalType === "email";
      
      // Use different endpoints for primary vs alternate email
      const endpoint = isPrimary ? URLS.UpdateProfileEmailWithOtp : URLS.SendAlternateEmailOtp;
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpStep("otp");
        setOtpCooldown(60);
        setOtpDigits(["", "", "", "", "", ""]);
        setModalSuccess(data.message || `A 6-digit OTP code has been sent to ${newEmail}`);
        setTimeout(() => otpRefs.current[0]?.focus(), 150);
      } else {
        setModalError(data.message || "Failed to send OTP code. Please try again.");
      }
    } catch {
      setModalError("Network error sending OTP code.");
    } finally {
      setModalLoading(false);
    }
  };

  // ── Verify OTP & Save Email / Alternate Email ──
  const handleVerifyEmailAndSave = async () => {
    setModalError("");
    const otpCode = otpDigits.join("");
    if (otpCode.length < 6) {
      setModalError("Please enter the complete 6-digit OTP code.");
      return;
    }

    setModalLoading(true);
    const newEmail = modalInput.trim();
    const isPrimary = modalType === "email";

    try {
      const token = localStorage.getItem("token");
      
      // Use different endpoints for primary vs alternate email verification
      const endpoint = isPrimary ? URLS.VerifyProfileEmailOtp : URLS.VerifyAlternateEmailOtp;
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newEmail,
          otp: otpCode,
        }),
      });
      const data = await res.json();

      if (data.success) {
        // Update local state
        setProfile((prev) => ({
          ...prev,
          ...(isPrimary
            ? { email: newEmail }
            : { alternate_email: newEmail }),
        }));

        // Update localStorage
        const stored = getStoredUser() || {};
        const updated = {
          ...stored,
          ...(isPrimary
            ? { email: newEmail, email_verified: true }
            : { alternate_email: newEmail, alternate_email_verified: true }),
        };
        localStorage.setItem("user", JSON.stringify(updated));
        window.dispatchEvent(new Event("user-updated"));

        setAlert({
          type: "success",
          message: `${isPrimary ? "Primary email" : "Alternate email"} verified and updated successfully!`,
        });
        closeModal();
      } else {
        setModalError(data.message || "Invalid OTP code. Please check and try again.");
      }
    } catch {
      setModalError("Network error verifying OTP code.");
    } finally {
      setModalLoading(false);
    }
  };

  // ── Save Phone Number ──
  const handleSavePhone = async () => {
    setModalError("");
    const cleanPhone = modalInput.replace(/\D/g, "");

    if (!cleanPhone || cleanPhone.length !== 10) {
      setModalError("Phone number must be exactly 10 digits.");
      return;
    }

    setModalLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(URLS.UpdateProfilePhoneNUmber, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ contact_number: cleanPhone }),
      });

      const resData = await res.json();
      if (resData.success) {
        setProfile((prev) => ({
          ...prev,
          contact_number: cleanPhone,
        }));

        const stored = getStoredUser() || {};
        const updated = {
          ...stored,
          contact_number: cleanPhone,
        };
        localStorage.setItem("user", JSON.stringify(updated));
        window.dispatchEvent(new Event("user-updated"));

        setAlert({
          type: "success",
          message: "Phone number updated successfully!",
        });
        closeModal();
      } else {
        setModalError(resData.message || "Failed to update phone number.");
      }
    } catch {
      setModalError("Network error updating phone number.");
    } finally {
      setModalLoading(false);
    }
  };

  // OTP input helpers
  const handleOtpDigitChange = (idx, val) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const updated = [...otpDigits];
    updated[idx] = digit;
    setOtpDigits(updated);
    setModalError("");
    if (digit && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const updated = [...otpDigits];
    pasted.split("").forEach((c, i) => {
      updated[i] = c;
    });
    setOtpDigits(updated);
    setModalError("");
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="dashboard-container">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className={`main-content ${!sidebarOpen ? "sidebar-closed" : ""}`}>
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <div className="content-area w-100 p-4" style={{ minHeight: "85vh" }}>
          {/* Top Alert Message */}
          {alert.message && (
            <div
              className={`alert alert-${alert.type} alert-dismissible fade show py-2 px-3 mb-4 d-flex align-items-center gap-2`}
              role="alert"
              style={{ borderRadius: "10px" }}
            >
              {alert.type === "success" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
              <span>{alert.message}</span>
              <button
                type="button"
                className="btn-close"
                onClick={() => setAlert({ type: "", message: "" })}
                aria-label="Close"
              ></button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-danger" role="status">
                <span className="visually-hidden">Loading Profile...</span>
              </div>
              <p className="text-muted mt-2">Loading profile details...</p>
            </div>
          ) : (
            /* Main Modern Profile Card matching the mockup */
            <div
              className="card border shadow-sm p-4 p-md-5"
              style={{
                borderRadius: "18px",
                borderColor: "#e5e7eb",
                backgroundColor: "#ffffff",
                maxWidth: "1150px",
                margin: "0 auto",
              }}
            >
              {/* Header Title & Subtitle */}
              <div className="mb-4">
                <h3 className="fw-bold mb-1" style={{ color: "#0f172a", fontSize: "1.5rem" }}>
                  Profile
                </h3>
                <p className="text-muted mb-0" style={{ fontSize: "0.93rem" }}>
                  Update your details. Changing an email address needs a code sent to that address.
                </p>
              </div>

              {/* 2x2 Grid of Modern Fields */}
              <div className="row g-3 g-md-4">
                {/* 1. Full name (Mint / Teal Green Theme) */}
                <div className="col-12 col-md-6">
                  <div
                    className="p-3 d-flex align-items-center justify-content-between h-100"
                    style={{
                      backgroundColor: "#f0fdf4",
                      border: "1.5px solid #bbf7d0",
                      borderRadius: "14px",
                      minHeight: "82px",
                    }}
                  >
                    <div className="d-flex align-items-center gap-3 flex-grow-1 overflow-hidden">
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "10px",
                          backgroundColor: "#dcfce7",
                          color: "#059669",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <User size={22} />
                      </div>
                      <div className="text-truncate">
                        <div
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: "600",
                            color: "#065f46",
                            marginBottom: "2px",
                          }}
                        >
                          Full name
                        </div>
                        <div
                          className="fw-bold text-truncate"
                          style={{
                            fontSize: "1rem",
                            color: "#0f172a",
                            letterSpacing: "0.2px",
                          }}
                        >
                          {profile.name || `${profile.first_name} ${profile.last_name}`.trim() || "User"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Email (Soft Blue Theme) */}
                <div className="col-12 col-md-6">
                  <div
                    className="p-3 d-flex align-items-center justify-content-between h-100"
                    style={{
                      backgroundColor: "#eff6ff",
                      border: "1.5px solid #bfdbfe",
                      borderRadius: "14px",
                      minHeight: "82px",
                    }}
                  >
                    <div className="d-flex align-items-center gap-3 flex-grow-1 overflow-hidden pe-2">
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "10px",
                          backgroundColor: "#dbeafe",
                          color: "#2563eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Mail size={22} />
                      </div>
                      <div className="text-truncate">
                        <div
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: "600",
                            color: "#1e40af",
                            marginBottom: "2px",
                          }}
                        >
                          Email
                        </div>
                        <div
                          className="fw-bold text-truncate"
                          style={{ fontSize: "0.97rem", color: "#0f172a" }}
                          title={profile.email}
                        >
                          {profile.email || "No email"}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm px-3 py-1 fw-semibold flex-shrink-0"
                      style={{
                        backgroundColor: "#ffffff",
                        color: "#2563eb",
                        border: "1.5px solid #93c5fd",
                        borderRadius: "8px",
                        fontSize: "0.85rem",
                      }}
                      onClick={() => openModal("email")}
                    >
                      Change
                    </button>
                  </div>
                </div>

                {/* 3. Phone (Soft Purple Theme) */}
                <div className="col-12 col-md-6">
                  <div
                    className="p-3 d-flex align-items-center justify-content-between h-100"
                    style={{
                      backgroundColor: "#f5f3ff",
                      border: "1.5px solid #ddd6fe",
                      borderRadius: "14px",
                      minHeight: "82px",
                    }}
                  >
                    <div className="d-flex align-items-center gap-3 flex-grow-1 overflow-hidden pe-2">
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "10px",
                          backgroundColor: "#ede9fe",
                          color: "#7c3aed",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Phone size={22} />
                      </div>
                      <div className="text-truncate">
                        <div
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: "600",
                            color: "#5b21b6",
                            marginBottom: "2px",
                          }}
                        >
                          Phone
                        </div>
                        <div
                          className="fw-bold text-truncate"
                          style={{ fontSize: "0.97rem", color: "#0f172a" }}
                        >
                          {profile.contact_number
                            ? `${profile.contact_number}`
                            : "—"}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm px-3 py-1 fw-semibold flex-shrink-0"
                      style={{
                        backgroundColor: "#ffffff",
                        color: "#7c3aed",
                        border: "1.5px solid #c4b5fd",
                        borderRadius: "8px",
                        fontSize: "0.85rem",
                      }}
                      onClick={() => openModal("phone")}
                    >
                      Change
                    </button>
                  </div>
                </div>

                {/* 4. Alternate email (Soft Warm Amber Theme) */}
                <div className="col-12 col-md-6">
                  <div
                    className="p-3 d-flex align-items-center justify-content-between h-100"
                    style={{
                      backgroundColor: "#fffbeb",
                      border: "1.5px solid #fde68a",
                      borderRadius: "14px",
                      minHeight: "82px",
                    }}
                  >
                    <div className="d-flex align-items-center gap-3 flex-grow-1 overflow-hidden pe-2">
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "10px",
                          backgroundColor: "#fef3c7",
                          color: "#d97706",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Mail size={22} />
                      </div>
                      <div className="text-truncate">
                        <div
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: "600",
                            color: "#92400e",
                            marginBottom: "2px",
                          }}
                        >
                          Alternate email
                        </div>
                        <div
                          className="fw-bold text-truncate"
                          style={{ fontSize: "0.97rem", color: "#0f172a" }}
                          title={profile.alternate_email}
                        >
                          {profile.alternate_email || "—"}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm px-3 py-1 fw-semibold flex-shrink-0"
                      style={{
                        backgroundColor: "#ffffff",
                        color: "#d97706",
                        border: "1.5px solid #fcd34d",
                        borderRadius: "8px",
                        fontSize: "0.85rem",
                      }}
                      onClick={() => openModal("alt_email")}
                    >
                      {profile.alternate_email ? "Change" : "Add"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Security Note */}
              <div className="d-flex align-items-center gap-2 mt-4 pt-2">
                <Shield size={16} color="#7c3aed" />
                <span style={{ fontSize: "0.86rem", color: "#64748b" }}>
                  Email changes take effect only after you enter the 6-digit code.
                </span>
              </div>
            </div>
          )}
        </div>

        <Footer />
      </div>

      {/* ── Modal for Changing Email / Alternate Email / Phone ── */}
      {modalType && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "480px" }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px" }}>
              <div className="modal-header border-0 pb-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold" style={{ color: "#1e1b4b" }}>
                  {modalType === "email" && "Change Primary Email"}
                  {modalType === "alt_email" && (profile.alternate_email ? "Change Alternate Email" : "Add Alternate Email")}
                  {modalType === "phone" && "Change Phone Number"}
                </h5>
                <button
                  type="button"
                  className="btn btn-sm btn-light rounded-circle p-1"
                  onClick={closeModal}
                  disabled={modalLoading}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body p-4">
                {modalError && (
                  <div
                    className="alert alert-danger py-2 px-3 mb-3 d-flex align-items-center gap-2"
                    style={{ fontSize: "0.86rem", borderRadius: "8px" }}
                  >
                    <AlertTriangle size={16} />
                    <span>{modalError}</span>
                  </div>
                )}

                {modalSuccess && (
                  <div
                    className="alert alert-info py-2 px-3 mb-3"
                    style={{ fontSize: "0.86rem", borderRadius: "8px" }}
                  >
                    {modalSuccess}
                  </div>
                )}

                {/* Email & Alternate Email Change with OTP */}
                {(modalType === "email" || modalType === "alt_email") && (
                  <div>
                    <p className="text-muted small mb-3">
                      A 6-digit verification code will be sent to your new email address to confirm ownership.
                    </p>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-uppercase text-muted">
                        {modalType === "email" ? "New Email Address" : "New Alternate Email"}
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="newemail@example.com"
                        value={modalInput}
                        onChange={(e) => setModalInput(e.target.value.trim())}
                        disabled={otpStep === "otp" || modalLoading}
                        style={{ borderRadius: "8px" }}
                      />
                    </div>

                    {otpStep === "input" ? (
                      <button
                        type="button"
                        className="btn btn-danger w-100 py-2 mt-2 fw-semibold"
                        style={{ borderRadius: "8px" }}
                        onClick={handleSendEmailOtp}
                        disabled={modalLoading}
                      >
                        {modalLoading ? "Sending Code..." : "Send Verification Code"}
                      </button>
                    ) : (
                      <div className="mt-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <label className="form-label small fw-semibold text-uppercase mb-0 text-muted">
                            Enter 6-Digit OTP
                          </label>
                          <button
                            type="button"
                            className="btn btn-link p-0 text-decoration-none small"
                            style={{ color: "#4c8d6d", fontSize: "0.8rem" }}
                            onClick={() => {
                              setOtpStep("input");
                              setModalError("");
                            }}
                          >
                            Edit Email
                          </button>
                        </div>

                        <div className="d-flex justify-content-center gap-2 mb-3" onPaste={handleOtpPaste}>
                          {otpDigits.map((digit, idx) => (
                            <input
                              key={idx}
                              ref={(el) => (otpRefs.current[idx] = el)}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                              className="form-control text-center fw-bold"
                              style={{
                                width: "45px",
                                height: "48px",
                                fontSize: "1.2rem",
                                borderRadius: "8px",
                                borderColor: digit ? "#4c8d6d" : "#cbd5e1",
                              }}
                            />
                          ))}
                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-3 small">
                          <span className="text-muted">Didn't receive code?</span>
                          {otpCooldown > 0 ? (
                            <span className="text-muted fw-semibold">Resend in {otpCooldown}s</span>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-link p-0 text-decoration-none fw-semibold"
                              style={{ color: "#4c8d6d" }}
                              onClick={handleSendEmailOtp}
                              disabled={modalLoading}
                            >
                              Resend OTP
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          className="btn btn-danger w-100 py-2 fw-semibold"
                          style={{ borderRadius: "8px" }}
                          disabled={modalLoading || otpDigits.join("").length < 6}
                          onClick={handleVerifyEmailAndSave}
                        >
                          {modalLoading ? "Verifying & Updating..." : "Verify & Update Email"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Phone Number Change */}
                {modalType === "phone" && (
                  <div>
                    <p className="text-muted small mb-3">
                      Please enter your 10-digit phone number.
                    </p>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-uppercase text-muted">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        maxLength="10"
                        className="form-control"
                        placeholder="10-digit phone number"
                        value={modalInput}
                        onChange={(e) => setModalInput(e.target.value.replace(/\D/g, ""))}
                        disabled={modalLoading}
                        style={{ borderRadius: "8px" }}
                      />
                      <small className="text-muted mt-1 d-block">
                        Must contain exactly 10 digits.
                      </small>
                    </div>

                    <button
                      type="button"
                      className="btn btn-danger w-100 py-2 mt-3 fw-semibold"
                      style={{ borderRadius: "8px" }}
                      onClick={handleSavePhone}
                      disabled={modalLoading}
                    >
                      {modalLoading ? "Saving..." : "Save Phone Number"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
