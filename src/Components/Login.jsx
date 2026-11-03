import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, CheckCircle, Mail, Lock, ShieldCheck, ArrowLeft, RefreshCw } from "lucide-react";
import { URLS } from "../url";

// Keywords for server error classification
const EMAIL_ERROR_KEYWORDS = [
  "not found", "not registered", "no account", "does not exist",
  "invalid email", "user not found", "email not", "account not",
];
const PASSWORD_ERROR_KEYWORDS = [
  "incorrect password", "wrong password", "invalid password",
  "password is incorrect", "password mismatch",
];

// Validation constants
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;"'<>,.?/~`\\-])[A-Za-z\d!@#$%^&*()_+{}\[\]:;"'<>,.?/~`\\-]{8,}$/;

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "", general: "" });
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  // ── OTP Login States ──
  const [authMode, setAuthMode] = useState("password");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpStep, setOtpStep] = useState("enter_email");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpMessage, setOtpMessage] = useState({ type: "", text: "" });
  const otpRefs = useRef([]);

  // Cooldown countdown timer for resend OTP
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  // When switching to OTP mode, inherit email if entered in password form
  const switchToOtpMode = () => {
    setAuthMode("otp");
    setOtpMessage({ type: "", text: "" });
    if (formData.email.trim()) {
      setOtpEmail(formData.email.trim());
    }
  };

  const switchToPasswordMode = () => {
    setAuthMode("password");
    setOtpMessage({ type: "", text: "" });
  };

  // Clear a specific field error and general error
  const clearFieldError = (name) =>
    setFieldErrors((prev) => ({ ...prev, [name]: "", general: "" }));

  // Central validation function
  const validateForm = (email, password) => {
    const errors = { email: "", password: "", general: "" };
    let isValid = true;

    const trimmedEmail = email.trim();

    // Email validation
    if (!trimmedEmail) {
      errors.email = "Email is required.";
      isValid = false;
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = "Please enter a valid email address.";
      isValid = false;
    }

    // Password validation
    if (!password) {
      errors.password = "Password is required.";
      isValid = false;
    } else if (password.length < PASSWORD_MIN_LENGTH) {
      errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
      isValid = false;
    } else if (!PASSWORD_REGEX.test(password)) {
      errors.password =
        "Invalid Password";
      isValid = false;
    }

    return { errors, isValid };
  };

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Trim email automatically; keep password as typed
    setFormData((prev) => ({
      ...prev,
      [name]: name === "email" ? value.trim() : value,
    }));
    clearFieldError(name);
  };

  const handleEmailBlur = () => {
    const email = formData.email.trim();
    if (!email) return;
    if (!emailRegex.test(email)) {
      setFieldErrors((prev) => ({ ...prev, email: "Please enter a valid email address." }));
    } else {
      setFieldErrors((prev) => ({ ...prev, email: "" }));
    }
  };

  const handlePasswordBlur = () => {
    if (!formData.password) return;
    const { errors } = validateForm(formData.email, formData.password);
    setFieldErrors((prev) => ({
      ...prev,
      password: errors.password,
      general: "",
    }));
  };

  // Parse server error and assign to appropriate field
  const applyServerError = (message) => {
    const lower = (message || "").toLowerCase();
    if (EMAIL_ERROR_KEYWORDS.some((k) => lower.includes(k))) {
      setFieldErrors({ email: message, password: "", general: "" });
    } else if (PASSWORD_ERROR_KEYWORDS.some((k) => lower.includes(k))) {
      setFieldErrors({ email: "", password: message, general: "" });
    } else {
      setFieldErrors({ email: "", password: "", general: message || "Login failed. Please try again." });
    }
  };

  // ── OTP Handlers ──────────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setOtpMessage({ type: "", text: "" });

    const trimmed = otpEmail.trim();
    if (!trimmed) {
      setOtpMessage({ type: "danger", text: "Please enter your email address." });
      return;
    }
    if (!emailRegex.test(trimmed)) {
      setOtpMessage({ type: "danger", text: "Please enter a valid email address." });
      return;
    }

    setOtpLoading(true);
    try {
      const response = await fetch(URLS.SendEmailLoginOtp, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await response.json();

      if (data.success) {
        setOtpStep("enter_otp");
        setOtpCooldown(60);
        setOtpDigits(["", "", "", "", "", ""]);
        setOtpMessage({
          type: "success",
          text: data.message || "A 6-digit OTP has been sent to your email.",
        });
        setTimeout(() => otpRefs.current[0]?.focus(), 150);
      } else {
        setOtpMessage({
          type: "danger",
          text: data.message || "Failed to send OTP. Please check your email and try again.",
        });
      }
    } catch {
      setOtpMessage({
        type: "danger",
        text: "Network error. Please check your connection and try again.",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpDigitChange = (index, val) => {
    const cleanDigit = val.replace(/\D/g, "").slice(-1);
    const updated = [...otpDigits];
    updated[index] = cleanDigit;
    setOtpDigits(updated);
    setOtpMessage({ type: "", text: "" });

    if (cleanDigit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const updated = [...otpDigits];
    pasted.split("").forEach((char, i) => {
      updated[i] = char;
    });
    setOtpDigits(updated);
    setOtpMessage({ type: "", text: "" });
    const nextIndex = Math.min(pasted.length, 5);
    otpRefs.current[nextIndex]?.focus();
  };

  const handleVerifyOtpAndLogin = async (e) => {
    if (e) e.preventDefault();
    setOtpMessage({ type: "", text: "" });

    const otpCode = otpDigits.join("");
    if (otpCode.length < 6) {
      setOtpMessage({ type: "danger", text: "Please enter the complete 6-digit OTP." });
      return;
    }

    setOtpLoading(true);
    try {
      const response = await fetch(URLS.VerifyEmailLoginOtp, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: otpEmail.trim(),
          otp: otpCode,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setOtpMessage({ type: "success", text: "Verification successful! Logging in..." });

        if (data.token) {
          localStorage.setItem("token", data.token);
        } else if (data.data && data.data.token) {
          localStorage.setItem("token", data.data.token);
        }

        const userObj = data.data || {};
        localStorage.setItem(
          "user",
          JSON.stringify({
            member_id: userObj.member_id || "",
            first_name: userObj.first_name || "",
            last_name: userObj.last_name || "",
            email: userObj.email || otpEmail.trim(),
            contact_number: userObj.contact_number || "",
            file_no: userObj.file_no || "",
            image: userObj.image || "",
            email_verified: true,
          })
        );

        window.dispatchEvent(new Event("user-updated"));
        setTimeout(() => {
          navigate("/dashboard");
        }, 800);
      } else {
        setOtpMessage({
          type: "danger",
          text: data.message || "Invalid OTP code. Please try again.",
        });
      }
    } catch {
      setOtpMessage({
        type: "danger",
        text: "Network error. Please check your connection and try again.",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({ email: "", password: "", general: "" });

    // Client‑side validation
    const { errors, isValid } = validateForm(formData.email, formData.password);
    if (!isValid) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(URLS.Login, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store token and user details
        localStorage.setItem("token", data.token);
        localStorage.setItem(
          "user",
          JSON.stringify({
            member_id: data.data.member_id,
            first_name: data.data.first_name,
            last_name: data.data.last_name,
            email: data.data.email,
            contact_number: data.data.contact_number,
            file_no: data.data.file_no,
            image: data.data.image,
            email_verified: data.data.email_verified,
          })
        );
        navigate("/dashboard");
      } else {
        applyServerError(data.message);
      }
    } catch (err) {
      setFieldErrors({
        email: "",
        password: "",
        general: "Network error. Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div
      className="container-fluid p-0 min-vh-100 d-flex align-items-stretch"
      style={{ overflowX: "hidden", backgroundColor: "#ffffff" }}
    >
      <div className="row g-0 w-100 min-vh-100">
        {/* Left Side – Colored with brand sidebar theme */}
        <div
          className="col-lg-6 col-xl-7 p-0 d-none d-lg-flex flex-column text-white position-relative"
          style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #1D2347 0%, #2c2f7e 100%)",
          }}
        >
          <div
            className="h-100 d-flex flex-column justify-content-center align-items-start text-white text-start p-5 p-xl-5 position-relative"
            style={{ flex: 1 }}
          >
            <div
              className="position-relative d-flex flex-column align-items-start text-start"
              style={{ maxWidth: "520px", width: "100%" }}
            >
              {/* Badge */}
              <div
                className="d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-pill mb-4"
                style={{
                  background: "rgba(255, 255, 255, 0.16)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  letterSpacing: "0.4px",
                  backdropFilter: "blur(8px)",
                }}
              >
                <span style={{ color: "#fef08a" }}>★</span>
                <span>Trusted Tax Filing Platform</span>
              </div>

              <h1 className="fw-bold text-white mb-3 text-start" style={{ fontSize: "2.6rem", lineHeight: 1.25, letterSpacing: "-0.5px" }}>
                Welcome Back <span style={{ color: "#fef08a" }}>!</span>
              </h1>
              <p className="mb-4 text-white text-start" style={{ fontSize: "1.05rem", opacity: 0.92, lineHeight: 1.6, maxWidth: "460px" }}>
                Access your personalized tax dashboard and continue where you let off.
              </p>

              <div className="w-100 text-start">
                {[
                  {
                    title: "Free Tax Estimates",
                    // desc: "Upfront calculation with no hidden costs",
                  },
                  {
                    title: "Dedicated Account Executive",
                    // desc: "Personalized 1-on-1 support for all your filing needs",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="d-flex align-items-start mb-3 p-3 w-100"
                    style={{
                      background: "rgba(255, 255, 255, 0.12)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    <div
                      className="d-flex align-items-center justify-content-center me-3 mt-0.5"
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background: "rgba(255, 255, 255, 0.22)",
                        color: "#fef08a",
                        flexShrink: 0,
                      }}
                    >
                      <CheckCircle size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                      <div className="fw-semibold text-white" style={{ fontSize: "0.96rem", lineHeight: 1.3 }}>
                        {item.title}
                      </div>
                      <div className="text-white text-opacity-75" style={{ fontSize: "0.82rem", marginTop: "2px" }}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side – Form */}
        <div className="col-lg-6 col-xl-5 bg-white d-flex align-items-center justify-content-center p-4 p-lg-5">
          <div className="w-100" style={{ maxWidth: "460px" }}>
            <div className="text-center mb-4">
              <img
                src="/images/logo-lg.png"
                alt="Dollar Tax Filer"
                style={{ maxWidth: "160px", height: "auto" }}
              />
            </div>
            {authMode === "password" ? (
              <>
                <h3 className="text-center mb-1 fw-bold" style={{ color: "#1e1b4b", fontSize: "1.6rem" }}>
                  Welcome Back
                </h3>
                <p className="text-center text-muted mb-4" style={{ fontSize: "0.88rem" }}>
                  Sign in to your account
                </p>

                {/* General Error Alert */}
                {fieldErrors.general && (
                  <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: "0.87rem", borderRadius: "8px" }}>
                    {fieldErrors.general}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Email Field */}
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <div className="auth-field-wrap">
                      <span className="auth-icon" style={{ color: fieldErrors.email ? "#dc3545" : undefined }}>
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        name="email"
                        className={`form-control${fieldErrors.email ? " is-invalid" : ""}`}
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleEmailBlur}
                      />
                    </div>
                    {fieldErrors.email && (
                      <div className="d-flex align-items-center mt-1" style={{ gap: "5px" }}>
                        <svg width="13" height="13" viewBox="0 0 20 20" fill="#dc3545">
                          <path
                            fillRule="evenodd"
                            d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span style={{ fontSize: "0.8rem", color: "#dc3545", fontWeight: "500" }}>
                          {fieldErrors.email}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <div className="auth-field-wrap">
                      <span className="auth-icon" style={{ color: fieldErrors.password ? "#dc3545" : undefined }}>
                        <Lock size={16} />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        className={`form-control${fieldErrors.password ? " is-invalid" : ""}`}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={handlePasswordBlur}
                        style={{ paddingRight: "44px" }}
                      />
                      <button
                        type="button"
                        className="eye-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <Eye size={17} /> : <EyeOff size={17} />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <div className="d-flex align-items-center mt-1" style={{ gap: "5px" }}>
                        <svg width="13" height="13" viewBox="0 0 20 20" fill="#dc3545">
                          <path
                            fillRule="evenodd"
                            d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span style={{ fontSize: "0.8rem", color: "#dc3545", fontWeight: "500" }}>
                          {fieldErrors.password}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Remember & Forgot */}
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="form-check mb-0">
                      <input type="checkbox" className="form-check-input" id="remember" />
                      <label htmlFor="remember" className="form-check-label">Remember Me</label>
                    </div>
                    <Link
                      to="/forgot-password"
                      style={{ color: "#2c2f7e", textDecoration: "none", fontSize: "0.85rem", fontWeight: "600" }}
                    >
                      Forgot Password?
                    </Link>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn btn-danger btn-auth w-100 py-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Signing In...
                      </>
                    ) : (
                      "Login"
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="d-flex align-items-center my-4">
                  <hr className="flex-grow-1" />
                  <span className="mx-2 text-muted" style={{ fontSize: "0.85rem" }}>Or</span>
                  <hr className="flex-grow-1" />
                </div>

                <button
                  type="button"
                  className="btn w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                  onClick={switchToOtpMode}
                  style={{ borderRadius: "10px", fontWeight: "600", fontSize: "0.92rem", border: "1.5px solid #2c2f7e", color: "#2c2f7e", backgroundColor: "#fff" }}
                >
                  <ShieldCheck size={18} />
                  Proceed with email otp
                </button>
              </>
            ) : (
              <>
                <div className="d-flex align-items-center justify-content-start mb-3">
                  <button
                    type="button"
                    className="btn btn-link text-decoration-none p-0 d-flex align-items-center gap-1 text-muted"
                    onClick={switchToPasswordMode}
                    style={{ fontSize: "0.85rem", fontWeight: "500" }}
                  >
                    <ArrowLeft size={16} /> Back to Password Login
                  </button>
                </div>

                <h3 className="text-center mb-1 fw-bold" style={{ color: "#1e1b4b", fontSize: "1.6rem" }}>
                  Email OTP Login
                </h3>
                <p className="text-center text-muted mb-4" style={{ fontSize: "0.88rem" }}>
                  {otpStep === "enter_email"
                    ? "Enter your email to receive a 6-digit login code"
                    : `Enter the 6-digit code sent to ${otpEmail}`}
                </p>

                {/* OTP Error or Success Alert */}
                {otpMessage.text && (
                  <div
                    className={`alert alert-${otpMessage.type} py-2 px-3 mb-3 d-flex align-items-center gap-2`}
                    style={{ fontSize: "0.87rem", borderRadius: "8px" }}
                  >
                    {otpMessage.text}
                  </div>
                )}

                {/* Email Field */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label mb-0">Email Address</label>
                    {otpStep === "enter_otp" && (
                      <button
                        type="button"
                        className="btn btn-link p-0 text-decoration-none"
                        style={{ fontSize: "0.8rem", color: "#2c2f7e", fontWeight: "600" }}
                        onClick={() => {
                          setOtpStep("enter_email");
                          setOtpMessage({ type: "", text: "" });
                        }}
                      >
                        Change Email
                      </button>
                    )}
                  </div>
                  <div className="auth-field-wrap">
                    <span className="auth-icon">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="you@example.com"
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value.trim())}
                      disabled={otpStep === "enter_otp" || otpLoading}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && otpStep === "enter_email") {
                          handleSendOtp();
                        }
                      }}
                    />
                  </div>
                </div>

                {otpStep === "enter_email" ? (
                  <button
                    type="button"
                    className="btn btn-danger btn-auth w-100 py-2 mt-2"
                    disabled={otpLoading}
                    onClick={handleSendOtp}
                  >
                    {otpLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending OTP...
                      </>
                    ) : (
                      "Send OTP"
                    )}
                  </button>
                ) : (
                  <div>
                    <label
                      className="form-label d-block text-center mb-2"
                      style={{ fontSize: "0.88rem", fontWeight: "600", color: "#475569" }}
                    >
                      Enter 6-Digit OTP
                    </label>
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
                            width: "46px",
                            height: "50px",
                            fontSize: "1.25rem",
                            borderRadius: "8px",
                            borderColor: digit ? "#2c2f7e" : "#cbd5e1",
                            backgroundColor: digit ? "#f8fafc" : "#fff",
                            boxShadow: digit ? "0 0 0 2px rgba(44, 47, 126, 0.15)" : "none",
                          }}
                        />
                      ))}
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-3" style={{ fontSize: "0.85rem" }}>
                      <span className="text-muted">Didn't receive the code?</span>
                      {otpCooldown > 0 ? (
                        <span className="text-muted fw-semibold">Resend in {otpCooldown}s</span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-link p-0 text-decoration-none fw-semibold"
                          style={{ color: "#2c2f7e" }}
                          onClick={handleSendOtp}
                          disabled={otpLoading}
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      className="btn btn-danger btn-auth w-100 py-2 mt-4"
                      disabled={otpLoading || otpDigits.join("").length < 6}
                      onClick={handleVerifyOtpAndLogin}
                    >
                      {otpLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Verifying &amp; Logging In...
                        </>
                      ) : (
                        "Verify & Login"
                      )}
                    </button>
                  </div>
                )}

                {/* Divider */}
                <div className="d-flex align-items-center my-4">
                  <hr className="flex-grow-1" />
                  <span className="mx-2 text-muted" style={{ fontSize: "0.85rem" }}>Or</span>
                  <hr className="flex-grow-1" />
                </div>

                <button
                  type="button"
                  className="btn w-100 py-2" style={{ borderRadius: "10px", fontWeight: "600", fontSize: "0.92rem", border: "1.5px solid #cbd5e1", color: "#475569", backgroundColor: "#fff" }}
                  onClick={switchToPasswordMode}
                >
                  Login with Password
                </button>
              </>
            )}

            {/* Register Link */}
            <p className="text-center mb-0 mt-4" style={{ fontSize: "0.9rem", color: "#64748b" }}>
              Don't have an account?{" "}
              <Link to="/register" style={{ color: "#2c2f7e", textDecoration: "none", fontWeight: "600" }}>
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;