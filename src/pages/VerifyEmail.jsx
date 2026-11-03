import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import { Mail, ShieldCheck, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { URLS } from "../url";
import "../styles/Dashboard.css";

const FieldLabel = ({ children }) => (
  <label
    style={{
      display: "block",
      marginBottom: "6px",
      fontSize: "0.78rem",
      fontWeight: "700",
      color: "#64748b",
      letterSpacing: "0.5px",
      textTransform: "uppercase",
    }}
  >
    {children}
  </label>
);

const VerifyEmail = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef([]);
  const initialSendDone = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth > 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) {
      navigate("/login", { replace: true });
      return;
    }
    try {
      const user = JSON.parse(userData);
      setEmail(user.email || "");
    } catch {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const sendOtp = useCallback(async () => {
    if (!email.trim()) {
      setError("Email address not found. Please log in again.");
      return false;
    }

    setSendingOtp(true);
    setError("");

    try {
      const response = await fetch(URLS.GenerateEmailOtp, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json();

      if (data.success) {
        setResendCooldown(60);
        return true;
      }
      setError(data.message || "Failed to send verification code.");
      return false;
    } catch {
      setError("Network error. Please check your connection and try again.");
      return false;
    } finally {
      setSendingOtp(false);
    }
  }, [email]);

  useEffect(() => {
    if (email && !initialSendDone.current) {
      initialSendDone.current = true;
      sendOtp().then((ok) => {
        if (ok) {
          setSuccess("A verification code has been sent to your email.");
          setTimeout(() => otpRefs.current[0]?.focus(), 100);
        }
      });
    }
  }, [email, sendOtp]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleOtpChange = (idx, val) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[idx] = digit;
    setOtpDigits(next);
    setError("");
    if (success && !success.includes("verified")) setSuccess("");
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...otpDigits];
    pasted.split("").forEach((c, i) => {
      next[i] = c;
    });
    setOtpDigits(next);
    setError("");
    if (success && !success.includes("verified")) setSuccess("");
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const otp = otpDigits.join("");
    if (otp.length < 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    if (!email.trim()) {
      setError("Email address not found. Please log in again.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(URLS.VerificationEmailOtp, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email: email.trim(),
          otp,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setSuccess("Email verified successfully!");

        try {
          const stored = localStorage.getItem("user");
          if (stored) {
            const user = JSON.parse(stored);
            localStorage.setItem(
              "user",
              JSON.stringify({ ...user, email_verified: true })
            );
            window.dispatchEvent(new Event("user-updated"));
          }
        } catch {
          /* ignore storage errors */
        }

        setTimeout(() => navigate("/dashboard"), 2000);
      } else {
        setError(data.message || "Invalid verification code. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || sendingOtp) return;

    setError("");
    setSuccess("");

    const ok = await sendOtp();
    if (ok) {
      setSuccess("A new code has been sent to your email.");
      setOtpDigits(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } else {
      setResendCooldown(0);
    }
  };

  const isVerified = success.includes("verified successfully");

  return (
    <div className="dashboard-container">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <main className="main-content">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <div className="form-container">
          <div className="form-card" style={{ maxWidth: "520px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div
                style={{
                  display: "inline-flex",
                  background: "#eef2ff",
                  color: "#2c2f7e",
                  padding: "0.75rem",
                  borderRadius: "50%",
                  marginBottom: "0.75rem",
                }}
              >
                <Mail size={28} />
              </div>
              <h3 className="form-title" style={{ marginBottom: "0.5rem" }}>
                Verify Your Email
              </h3>
              <p style={{ fontSize: "0.95rem", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                {sendingOtp && !success ? (
                  "Sending verification code..."
                ) : (
                  <>
                    We sent a 6-digit code to{" "}
                    <strong style={{ color: "#0f172a" }}>{email || "your email"}</strong>.
                    Enter it below to verify your email address.
                  </>
                )}
              </p>
            </div>

            {error && (
              <div
                className="alert alert-danger py-2 px-3 mb-3"
                style={{ fontSize: "0.87rem", borderRadius: "8px", display: "flex", alignItems: "center" }}
              >
                <AlertCircle size={16} style={{ marginRight: "8px", flexShrink: 0 }} />
                {error}
              </div>
            )}
            {success && (
              <div
                className="alert alert-success py-2 px-3 mb-3"
                style={{ fontSize: "0.87rem", borderRadius: "8px", display: "flex", alignItems: "center" }}
              >
                <CheckCircle size={16} style={{ marginRight: "8px", flexShrink: 0 }} />
                {success}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <FieldLabel>6-Digit Verification Code</FieldLabel>
                <div
                  style={{ display: "flex", gap: "10px", justifyContent: "center" }}
                  onPaste={handlePaste}
                >
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      disabled={loading || isVerified || sendingOtp}
                      style={{
                        width: "52px",
                        height: "58px",
                        textAlign: "center",
                        fontSize: "1.5rem",
                        fontWeight: "800",
                        border: digit ? "2px solid #2c2f7e" : "2px solid #e2e8f0",
                        borderRadius: "12px",
                        background: digit ? "#eef2ff" : "#f8fafc",
                        color: "#1e1b4b",
                        outline: "none",
                        transition: "all 0.2s",
                        caretColor: "#2c2f7e",
                        fontFamily: "'Inter', monospace",
                        cursor: loading || isVerified || sendingOtp ? "not-allowed" : "text",
                        opacity: loading || isVerified || sendingOtp ? 0.6 : 1,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                <button
                  type="button"
                  className="btn-save"
                  onClick={handleVerify}
                  disabled={loading || isVerified || sendingOtp}
                  style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      Verify Email
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading || isVerified || sendingOtp}
                  style={{
                    color: "#2c2f7e",
                    fontSize: "0.85rem",
                    fontWeight: "500",
                    background: "transparent",
                    border: "none",
                    cursor: resendCooldown > 0 || loading || isVerified || sendingOtp ? "not-allowed" : "pointer",
                    opacity: resendCooldown > 0 || loading || isVerified || sendingOtp ? 0.5 : 1,
                    padding: "0.7rem 0",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Clock size={16} />
                  {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend Code"}
                </button>
              </div>

              <div className="form-actions" style={{ marginTop: 0 }}>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => navigate("/dashboard")}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
};

export default VerifyEmail;
