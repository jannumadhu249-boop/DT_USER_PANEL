import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Eye, EyeOff, CheckCircle, User, Mail, Phone, Globe, Lock, AlertTriangle, ShieldCheck, Gift } from "lucide-react";
import { URLS } from "../url";

// Validation constants (matching Login component)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
// Backend field name used to send the referral code captured from the referral link
const REFERRAL_CODE_FIELD = "referral_code";
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;"'<>,.?/~`\\-])[A-Za-z\d!@#$%^&*()_+{}\[\]:;"'<>,.?/~`\\-]{8,}$/;

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    contact_number: "",
    alter_number: "",
    email: "",
    password: "",
    time_zone: "America/New_York",
    countryCode: "+1",
    terms: false,
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ── Referral Code (from the referral registration link) ──
  // Derived from the URL so it stays available during the OTP step and is
  // empty for normal registrations (no referral link).
  const referralCode = (searchParams.get("referral_code") || "").trim();

  // ── Verification Step States ──
  const [step, setStep] = useState("register");
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyOtpDigits, setVerifyOtpDigits] = useState(["", "", "", "", "", ""]);
  const [verifyOtpSent, setVerifyOtpSent] = useState(false);
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false);
  const [verifyCooldown, setVerifyCooldown] = useState(0);
  const [verifyMessage, setVerifyMessage] = useState({ type: "", text: "" });
  const [verifySuccess, setVerifySuccess] = useState(false);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (verifyCooldown > 0) {
      const timer = setTimeout(() => setVerifyCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [verifyCooldown]);

  const sendVerificationOtp = async (emailToSend) => {
    const targetEmail = (emailToSend || verifyEmail).trim();
    if (!targetEmail) {
      setVerifyMessage({ type: "danger", text: "Please provide a valid email." });
      return;
    }
    setVerifyOtpLoading(true);
    setVerifyMessage({ type: "", text: "" });

    try {
      const res = await fetch(URLS.GenerateEmailOtp, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setVerifyOtpSent(true);
        setVerifyCooldown(60);
        setVerifyOtpDigits(["", "", "", "", "", ""]);
        setVerifyMessage({
          type: "info",
          text: data.message || `A 6-digit verification code has been sent to ${targetEmail}`,
        });
        setTimeout(() => otpRefs.current[0]?.focus(), 150);
      } else {
        setVerifyMessage({
          type: "danger",
          text: data.message || "Failed to send verification code. Please try again.",
        });
      }
    } catch {
      setVerifyMessage({
        type: "danger",
        text: "Network error sending verification code. Please try again.",
      });
    } finally {
      setVerifyOtpLoading(false);
    }
  };

  const handleVerifyDigitChange = (idx, val) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const updated = [...verifyOtpDigits];
    updated[idx] = digit;
    setVerifyOtpDigits(updated);
    setVerifyMessage({ type: "", text: "" });

    if (digit && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleVerifyKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !verifyOtpDigits[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerifyPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const updated = [...verifyOtpDigits];
    pasted.split("").forEach((char, i) => {
      updated[i] = char;
    });
    setVerifyOtpDigits(updated);
    setVerifyMessage({ type: "", text: "" });
    const nextIdx = Math.min(pasted.length, 5);
    otpRefs.current[nextIdx]?.focus();
  };

  const handleVerifyOtpSubmit = async () => {
    const otpCode = verifyOtpDigits.join("");
    if (otpCode.length < 6) {
      setVerifyMessage({ type: "danger", text: "Please enter the complete 6-digit OTP code." });
      return;
    }

    setVerifyOtpLoading(true);
    setVerifyMessage({ type: "", text: "" });

    try {
      const res = await fetch(URLS.VerificationEmailOtp, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: verifyEmail.trim(),
          otp: otpCode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVerifySuccess(true);
        setVerifyMessage({
          type: "success",
          text: "Email verified successfully! Redirecting to login...",
        });

        // Update stored user
        try {
          const stored = localStorage.getItem("user");
          if (stored) {
            const parsed = JSON.parse(stored);
            localStorage.setItem("user", JSON.stringify({ ...parsed, email_verified: true }));
            window.dispatchEvent(new Event("user-updated"));
          }
        } catch (_) {}

        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        setVerifyMessage({
          type: "danger",
          text: data.message || "Invalid verification code. Please check and try again.",
        });
      }
    } catch {
      setVerifyMessage({
        type: "danger",
        text: "Network error verifying email. Please check your connection.",
      });
    } finally {
      setVerifyOtpLoading(false);
    }
  };

  const validatePassword = (pwd) => {
    if (!pwd) {
      return "Password is required.";
    }
    if (pwd.length < PASSWORD_MIN_LENGTH) {
      return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
    }
    if (!PASSWORD_REGEX.test(pwd)) {
      return "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.";
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (error) setError("");
    if (name === "password" && passwordError) {
      setPasswordError("");
    }
  };

  const handlePasswordBlur = () => {
    if (!formData.password) return;
    const pwdErr = validatePassword(formData.password);
    setPasswordError(pwdErr);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // ─── Validations ──────────────────────────────────────────────────
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError("First name and last name are required.");
      return;
    }
    if (!formData.email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!emailRegex.test(formData.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!formData.contact_number.trim()) {
      setError("Phone number is required.");
      return;
    }
    // Phone number must be exactly 10 digits
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.contact_number.trim())) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }
    const pwdErr = validatePassword(formData.password);
    if (pwdErr) {
      setError(pwdErr);
      setPasswordError(pwdErr);
      return;
    }
    if (!formData.terms) {
      setError("You must agree to the Terms and Conditions.");
      return;
    }

    setLoading(true);

    try {
      const body = new FormData();
      body.append("first_name", formData.first_name.trim());
      body.append("last_name", formData.last_name.trim());
      body.append("contact_number", formData.contact_number.trim());
      body.append("alter_number", formData.alter_number.trim() || formData.contact_number.trim());
      body.append("time_zone", formData.time_zone);
      body.append("email", formData.email.trim());
      // Only sent when the user arrived through a referral link
      if (referralCode) {
        body.append(REFERRAL_CODE_FIELD, referralCode);
      }
      body.append("password", formData.password);
      body.append("current_stage", "New");
      body.append("stage", "Pending");
      body.append("filestatus", "Open");
      body.append("stat", "1");
      body.append("user_ip", "");
      body.append("new_dnos", "0");
      body.append("new_upload", "false");
      body.append("docs_updated", "false");
      body.append("old_client", "false");
      body.append("tin_type", "SSN");

      const response = await fetch(URLS.Registration, {
        method: "POST",
        body,
      });

      const data = await response.json();

      if (data.success) {
        const registeredEmail = data.data?.email || formData.email.trim();
        localStorage.setItem(
          "user",
          JSON.stringify({
            member_id: data.data?.member_id,
            year_id: data.data?.year_id,
            file_no: data.data?.file_no,
            first_name: data.data?.first_name || formData.first_name.trim(),
            last_name: data.data?.last_name || formData.last_name.trim(),
            email: registeredEmail,
            contact_number: data.data?.contact_number || formData.contact_number.trim(),
            image: data.data?.image,
            financial_year: data.data?.financial_year,
            email_verified: false,
          })
        );
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
        setVerifyEmail(registeredEmail);
        setStep("verify");
        sendVerificationOtp(registeredEmail);
      } else {
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container-fluid p-0 min-vh-100 d-flex align-items-stretch"
      style={{ overflow: "hidden", backgroundColor: "#ffffff", height: "100vh" }}
    >
      <div className="row g-0 w-100 h-100 min-vh-100">
        {/* Left Side – Blurred Banner with Content on Top */}
        <div
          className="col-lg-6 col-xl-7 p-0 d-none d-lg-flex flex-column text-white position-relative overflow-hidden"
          style={{
            height: "100vh",
            /* background: "linear-gradient(135deg, #1D2347 0%, #2c2f7e 100%)", */
            backgroundColor: "#0f172a",
          }}
        >
          {/* Blurred Background Image */}
          <div
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{
              backgroundImage: "url('/images/DT_Banner_img.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(3px)",
              transform: "scale(1.08)",
              zIndex: 0,
            }}
          />

          {/* Dark Overlay for Text Readability */}
          <div
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{
              background: "linear-gradient(135deg, rgba(15, 23, 42, 0.75) 0%, rgba(29, 35, 71, 0.82) 100%)",
              zIndex: 1,
            }}
          />

          {/* Foreground Content */}
          <div
            className="h-100 d-flex flex-column justify-content-center align-items-start text-white text-start p-5 p-xl-5 position-relative"
            style={{ flex: 1, zIndex: 2 }}
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
                <span>Fast &amp; Secure Registration</span>
              </div>

              <h1 className="fw-bold text-white mb-3 text-start" style={{ fontSize: "2.6rem", lineHeight: 1.25, letterSpacing: "-0.5px" }}>
                Join Us Today <span style={{ color: "#fef08a" }}>!</span>
              </h1>
              <p className="mb-4 text-white text-start" style={{ fontSize: "1.05rem", opacity: 0.92, lineHeight: 1.6, maxWidth: "460px" }}>
                Create your account and unlock exclusive tax benefits and personalized service.
              </p>

              <div className="w-100 text-start">
                {[
                  {
                    title: "FREE Tax Estimates",
                    // desc: "Zero preparation fee for your standard federal return",
                  },
                  {
                    title: "Dedicated Account Manager",
                    // desc: "Direct access to certified tax specialists",
                  },
                  // {
                  //   title: "100% Confidential & Secure",
                  //   desc: "Bank-grade data encryption and strict privacy safeguards",
                  // },
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

        {/* Right Side – Form (Fixed, compact, no scrolling on desktop) */}
        <div
          className="col-lg-6 col-xl-5 bg-white d-flex flex-column justify-content-center align-items-center px-4 px-xl-5 py-3 h-100 position-relative"
          style={{ overflowY: "auto", maxHeight: "100vh" }}
        >
          <div className="w-100" style={{ maxWidth: step === "register" ? "480px" : "440px" }}>
            <div className="text-center mb-2">
              <img
                src="/images/logo-lg.png"
                alt="Dollar Tax Filer"
                style={{ maxWidth: "135px", height: "auto" }}
              />
            </div>
            {step === "register" ? (
              <>
                <h3 className="text-center mb-0 fw-bold" style={{ color: "#1e1b4b", fontSize: "1.3rem" }}>Create Account</h3>
                <p className="text-center text-muted mb-2.5" style={{ fontSize: "0.82rem" }}>Fill in your details to get started</p>

                {error && (
                  <div className="alert alert-danger py-1.5 px-3 mb-2" style={{ fontSize: "0.78rem", borderRadius: "8px" }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* First Name & Last Name */}
                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <label className="form-label mb-1" style={{ fontSize: "0.75rem" }}>
                        First Name <span style={{ color: "#e63946" }}>*</span>
                      </label>
                      <div className="auth-field-wrap">
                        <span className="auth-icon"><User size={15} /></span>
                        <input
                          type="text"
                          name="first_name"
                          className="form-control"
                          placeholder="John"
                          value={formData.first_name}
                          onChange={handleChange}
                          style={{ padding: "8px 12px 8px 38px", fontSize: "0.88rem" }}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-6">
                      <label className="form-label mb-1" style={{ fontSize: "0.75rem" }}>
                        Last Name <span style={{ color: "#e63946" }}>*</span>
                      </label>
                      <div className="auth-field-wrap">
                        <span className="auth-icon"><User size={15} /></span>
                        <input
                          type="text"
                          name="last_name"
                          className="form-control"
                          placeholder="Doe"
                          value={formData.last_name}
                          onChange={handleChange}
                          style={{ padding: "8px 12px 8px 38px", fontSize: "0.88rem" }}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="mb-2">
                    <label className="form-label mb-1" style={{ fontSize: "0.75rem" }}>
                      Email <span style={{ color: "#e63946" }}>*</span>
                    </label>
                    <div className="auth-field-wrap">
                      <span className="auth-icon"><Mail size={15} /></span>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        style={{ padding: "8px 12px 8px 38px", fontSize: "0.88rem" }}
                        required
                      />
                    </div>
                  </div>

                  {/* ─── Combined Row: Time Zone | Country Code | Phone Number ─── */}
                  <div className="mb-2">
                    <label className="form-label mb-1" style={{ fontSize: "0.75rem" }}>
                      Contact Details <span style={{ color: "#e63946" }}>*</span>
                    </label>
                    <div className="row g-2">
                      {/* Time Zone */}
                      <div className="col-md-3 col-12">
                        <select
                          name="time_zone"
                          className="form-select"
                          value={formData.time_zone}
                          onChange={handleChange}
                          style={{ padding: "8px 10px", fontSize: "0.84rem" }}
                          required
                        >
                          <option value="America/New_York">EST</option>
                          <option value="America/Chicago">CST</option>
                          <option value="America/Denver">MST</option>
                          <option value="America/Los_Angeles">PST</option>
                          <option value="Asia/Kolkata">IST</option>
                          {/* <option value="UTC">UTC</option> */}
                        </select>
                      </div>
                      {/* Country Code */}
                      <div className="col-md-3 col-5">
                        <select
                          className="form-select"
                          name="countryCode"
                          value={formData.countryCode}
                          onChange={handleChange}
                          style={{ padding: "8px 6px", fontSize: "0.84rem" }}
                          required
                        >
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+91">🇮🇳 +91</option>
                          <option value="+61">🇦🇺 +61</option>
                          <option value="+44">uk +44</option>
                          <option value="+86">china +86</option>
                        </select>
                      </div>
                      {/* Phone Number */}
                      <div className="col-md-6 col-7">
                        <input
                          type="tel"
                          name="contact_number"
                          className="form-control"
                          placeholder="10-digit phone"
                          value={formData.contact_number}
                          onChange={handleChange}
                          style={{ padding: "8px 12px", fontSize: "0.88rem" }}
                          required
                          maxLength="10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="mb-2">
                    <label className="form-label mb-1" style={{ fontSize: "0.75rem" }}>
                      Password <span style={{ color: "#e63946" }}>*</span>
                    </label>
                    <div className="auth-field-wrap">
                      <span className="auth-icon" style={{ color: passwordError ? "#dc3545" : undefined }}>
                        <Lock size={15} />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        className={`form-control${passwordError ? " is-invalid" : ""}`}
                        placeholder="Min 8 characters"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={handlePasswordBlur}
                        style={{ padding: "8px 40px 8px 38px", fontSize: "0.88rem" }}
                        required
                      />
                      <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                    </div>
                    {passwordError ? (
                      <div className="d-flex align-items-center mt-1" style={{ gap: "4px" }}>
                        <span style={{ fontSize: "0.75rem", color: "#dc3545", fontWeight: "500" }}>
                          {passwordError}
                        </span>
                      </div>
                    ) : (
                      <small className="text-muted d-block mt-0.5" style={{ fontSize: "0.72rem" }}>
                        Must have 8+ characters, uppercase, lowercase, number &amp; symbol.
                      </small>
                    )}
                  </div>

                  {/* Referral Code – only visible for referral registrations */}
                  {referralCode && (
                    <div className="mb-2">
                      <label className="form-label mb-1" style={{ fontSize: "0.75rem" }}>
                        Referral Code
                      </label>
                      <div className="auth-field-wrap">
                        <span className="auth-icon"><Gift size={15} /></span>
                        <input
                          type="text"
                          className="form-control"
                          value={referralCode}
                          readOnly
                          aria-label="Referral code"
                          style={{
                            padding: "8px 12px 8px 38px",
                            fontSize: "0.88rem",
                            backgroundColor: "#f1f5f9",
                            color: "#1e1b4b",
                            fontWeight: 600,
                            cursor: "default",
                          }}
                        />
                      </div>
                      <small className="text-muted d-block mt-0.5" style={{ fontSize: "0.72rem" }}>
                        You were referred by a friend – this code is applied automatically.
                      </small>
                    </div>
                  )}

                  {/* Terms */}
                  <div className="mb-2.5 mt-1">
                    <div className="form-check d-flex align-items-center gap-2">
                      <input
                        type="checkbox"
                        className="form-check-input mt-0"
                        id="terms"
                        name="terms"
                        checked={formData.terms}
                        onChange={handleChange}
                        required
                      />
                      <label htmlFor="terms" className="form-check-label" style={{ fontSize: "0.82rem" }}>
                        I agree to the{" "}
                        <a href="/terms" style={{ color: "#2c2f7e", textDecoration: "none", fontWeight: "600" }}>Terms and Conditions</a>
                        <span style={{ color: "#e63946" }}>*</span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-danger btn-auth w-100 py-2 mt-1"
                    disabled={loading}
                    style={{ fontSize: "0.92rem", fontWeight: "600", borderRadius: "10px" }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </form>

                <div className="d-flex align-items-center my-2.5">
                  <hr className="flex-grow-1 my-0" />
                  <span className="mx-2 text-muted" style={{ fontSize: "0.8rem" }}>Or</span>
                  <hr className="flex-grow-1 my-0" />
                </div>

                <p className="text-center mb-0" style={{ fontSize: "0.86rem", color: "#64748b" }}>
                  Already have an account?{" "}
                  <Link to="/login" style={{ color: "#2c2f7e", textDecoration: "none", fontWeight: "600" }}>Sign In</Link>
                </p>
              </>
            ) : (
              <>
                {/* Badge showing Email Not Verified */}
                <div className="text-center mb-3">
                  {verifySuccess ? (
                    <span
                      className="auth-status-chip px-3 py-2 d-inline-flex align-items-center gap-2"
                      style={{
                        backgroundColor: "#ecfdf5",
                        color: "#059669",
                        border: "1px solid #a7f3d0",
                        borderRadius: "20px",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                      }}
                    >
                      <CheckCircle size={16} /> Email Verified
                    </span>
                  ) : (
                    <span
                      className="auth-status-chip px-3 py-2 d-inline-flex align-items-center gap-2"
                      style={{
                        backgroundColor: "#fffbeb",
                        color: "#b45309",
                        border: "1px solid #fde68a",
                        borderRadius: "20px",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                      }}
                    >
                      <AlertTriangle size={16} /> Email Not Verified
                    </span>
                  )}
                </div>

                <h3 className="text-center mb-1 fw-bold" style={{ color: "#1e1b4b", fontSize: "1.4rem" }}>
                  {verifySuccess ? "Verification Complete!" : "Verify Your Email"}
                </h3>
                <p className="text-center text-muted mb-4" style={{ fontSize: "0.88rem" }}>
                  {verifySuccess
                    ? "Your email has been verified successfully."
                    : "Account created! Please verify your email with the 6-digit code."}
                </p>

                {verifyMessage.text && (
                  <div
                    className={`alert alert-${verifyMessage.type} py-2 px-3 mb-3 d-flex align-items-center gap-2`}
                    style={{ fontSize: "0.85rem", borderRadius: "8px" }}
                  >
                    {verifyMessage.text}
                  </div>
                )}

                {!verifySuccess && (
                  <>
                    {/* Email Field */}
                    <div className="mb-3">
                      <label className="form-label">Email Address</label>
                      <div className="auth-field-wrap">
                        <span className="auth-icon"><Mail size={16} /></span>
                        <input
                          type="email"
                          className="form-control"
                          value={verifyEmail}
                          onChange={(e) => setVerifyEmail(e.target.value.trim())}
                          disabled={verifyOtpLoading}
                        />
                      </div>
                    </div>

                    {/* Verify Email / Send OTP Button */}
                    {!verifyOtpSent ? (
                      <button
                        type="button"
                        className="btn btn-danger btn-auth w-100 py-2 mb-3"
                        disabled={verifyOtpLoading}
                        onClick={() => sendVerificationOtp(verifyEmail)}
                      >
                        {verifyOtpLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Sending Verification Code...
                          </>
                        ) : (
                          "Verify Email"
                        )}
                      </button>
                    ) : (
                      <div className="mb-4">
                        <label
                          className="form-label d-block text-center mb-2"
                          style={{ fontSize: "0.88rem", fontWeight: "600", color: "#475569" }}
                        >
                          Enter 6-Digit OTP
                        </label>
                        <div className="d-flex justify-content-center gap-2 mb-3" onPaste={handleVerifyPaste}>
                          {verifyOtpDigits.map((digit, idx) => (
                            <input
                              key={idx}
                              ref={(el) => (otpRefs.current[idx] = el)}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleVerifyDigitChange(idx, e.target.value)}
                              onKeyDown={(e) => handleVerifyKeyDown(idx, e)}
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

                        <div className="d-flex justify-content-between align-items-center mt-2" style={{ fontSize: "0.85rem" }}>
                          <span className="text-muted">Didn't receive the code?</span>
                          {verifyCooldown > 0 ? (
                            <span className="text-muted fw-semibold">Resend in {verifyCooldown}s</span>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-link p-0 text-decoration-none fw-semibold"
                              style={{ color: "#2c2f7e" }}
                              onClick={() => sendVerificationOtp(verifyEmail)}
                              disabled={verifyOtpLoading}
                            >
                              Resend OTP
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          className="btn btn-danger btn-auth w-100 py-2 mt-4"
                          disabled={verifyOtpLoading || verifyOtpDigits.join("").length < 6}
                          onClick={handleVerifyOtpSubmit}
                        >
                          {verifyOtpLoading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Verifying Code...
                            </>
                          ) : (
                            "Verify & Complete"
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}

                <div className="d-flex align-items-center my-4">
                  <hr className="flex-grow-1" />
                  <span className="mx-2 text-muted" style={{ fontSize: "0.85rem" }}>Or</span>
                  <hr className="flex-grow-1" />
                </div>

                <p className="text-center mb-0" style={{ fontSize: "0.9rem", color: "#64748b" }}>
                  Already verified or prefer to do it later?{" "}
                  <Link to="/login" style={{ color: "#2c2f7e", textDecoration: "none", fontWeight: "600" }}>
                    Sign In
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;