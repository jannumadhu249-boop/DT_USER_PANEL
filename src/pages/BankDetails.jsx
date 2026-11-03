import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import { useNavigate } from "react-router-dom";
import { URLS } from "../url";
import "../styles/Dashboard.css";
import { CheckCircle, XCircle, X, Building2, Hash, User, CreditCard, Users2 } from "lucide-react";

const BankDetails = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Field‑specific errors
  const [accountNumberError, setAccountNumberError] = useState("");
  const [routingNumberError, setRoutingNumberError] = useState("");

  const [formData, setFormData] = useState({
    bank_name: "",
    account_number: "",
    account_holder_name: "",
    routing_number: "",
    account_type: "Checking Account",
  });

  // ─── Auto‑dismiss alerts ─────────────────────────────────────────
  const alertTimeoutRef = useRef(null);

  useEffect(() => {
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }
    if (error || successMsg) {
      alertTimeoutRef.current = setTimeout(() => {
        setError("");
        setSuccessMsg("");
      }, 5000);
    }
    return () => {
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
  }, [error, successMsg]);

  // ─── Sidebar responsiveness ─────────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ─── Fetch bank details on mount ──────────────────────────────
  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    setFetching(true);
    setError("");
    setAccountNumberError("");
    setRoutingNumberError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token missing. Please log in.");
        setFetching(false);
        return;
      }

      const response = await fetch(URLS.GetBankDetails, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success && data.data) {
        const item = data.data;
        setFormData({
          bank_name: item.bank_name || "",
          account_number: item.account_number || "",
          account_holder_name: item.account_holder_name || "",
          routing_number: item.routing_number || "",
          account_type: item.account_type || "Checking Account",
        });
      } else {
        // No error when "not found" – treat as new profile
        const msg = data.message || "";
        if (msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("no bank")) {
          setError("");
        } else {
          setError(msg || "Failed to fetch bank details.");
        }
      }
    } catch (err) {
      setError("Network error fetching bank details.");
    } finally {
      setFetching(false);
    }
  };

  // ─── Handlers ────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
    if (successMsg) setSuccessMsg("");
    // Clear field errors on change
    if (name === "account_number" && accountNumberError) setAccountNumberError("");
    if (name === "routing_number" && routingNumberError) setRoutingNumberError("");
  };

  // Only allow digits for account number (max 17 chars – typical max)
  const handleAccountNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length <= 17) {
      setFormData((prev) => ({ ...prev, account_number: raw }));
    }
    if (error) setError("");
    if (successMsg) setSuccessMsg("");
    if (accountNumberError) setAccountNumberError("");
  };

  // Only allow digits for routing number (must be 9 digits – US routing number)
  const handleRoutingNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length <= 9) {
      setFormData((prev) => ({ ...prev, routing_number: raw }));
    }
    if (error) setError("");
    if (successMsg) setSuccessMsg("");
    if (routingNumberError) setRoutingNumberError("");
  };

  // ─── Submit ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setAccountNumberError("");
    setRoutingNumberError("");

    // Validations
    if (!formData.account_number || formData.account_number.length < 5) {
      setAccountNumberError("Account number must be at least 5 digits.");
      return;
    }
    if (!formData.routing_number || formData.routing_number.length !== 9) {
      setRoutingNumberError("Routing number must be exactly 9 digits.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        bank_name: formData.bank_name,
        account_number: formData.account_number,
        account_holder_name: formData.account_holder_name,
        routing_number: formData.routing_number,
        account_type: formData.account_type,
      };

      const response = await fetch(URLS.UpdateBankDetails, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        setSuccessMsg(data.message || "Bank details saved successfully.");
        // Re‑fetch to ensure UI is in sync with backend
        await fetchBankDetails();
      } else {
        setError(data.message || "Failed to update bank details.");
      }
    } catch (err) {
      console.error("Bank details update error:", err);
      setError("Network error updating bank details.");
    } finally {
      setLoading(false);
    }
  };

  const accountTypeOptions = ["Checking Account", "Savings Account"];

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <div className="dashboard-container">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <main className="main-content">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <div className="breadcrumb">
          <a href="/dashboard">Home</a>
          <span className="breadcrumb-separator">›</span>
          <a href="#">Basic Information</a>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">Bank Details</span>
        </div>

        <div className="form-container">
          <div className="page-header-section">
            <div className="page-header-left">
              <div className="page-header-icon">
                <Users2 size={24} />
              </div>
              <div className="page-header-content">
                <h2 className="page-header-title">Bank Details</h2>
                <p className="page-header-subtitle">Provide your bank account details for tax refund direct deposit.</p>
              </div>
            </div>
            <div className="page-header-tabs">
              <div className="step-tab" onClick={() => navigate("/dashboard/basic-info/taxpayer")} style={{ cursor: "pointer" }}>
                <div className="step-tab-circle">1</div>
                <div className="step-tab-label">Taxpayer</div>
              </div>
              <div className="step-tab" onClick={() => navigate("/spouse")} style={{ cursor: "pointer" }}>
                <div className="step-tab-circle">2</div>
                <div className="step-tab-label">Spouse</div>
              </div>
              <div className="step-tab" onClick={() => navigate("/dependent")} style={{ cursor: "pointer" }}>
                <div className="step-tab-circle">3</div>
                <div className="step-tab-label">Dependent</div>
              </div>
              <div className="step-tab" onClick={() => navigate("/address-in-tax-year")} style={{ cursor: "pointer" }}>
                <div className="step-tab-circle">4</div>
                <div className="step-tab-label">Address</div>
              </div>
              <div className="step-tab active" onClick={() => navigate("/bank-details")} style={{ cursor: "pointer" }}>
                <div className="step-tab-circle">5</div>
                <div className="step-tab-label">Bank Details</div>
              </div>
            </div>
          </div>
          <div className="form-card">
            <h3 className="form-title">Bank Details</h3>

            {/* ─── Advanced Alerts ─── */}
            {error && (
              <div
                className="alert alert-danger d-flex align-items-center justify-content-between py-2 px-3 mb-3"
                style={{
                  fontSize: "0.87rem",
                  borderRadius: "8px",
                  borderLeft: "4px solid #dc3545",
                  backgroundColor: "#fff5f5",
                  color: "#842029",
                }}
              >
                <div className="d-flex align-items-center">
                  <XCircle size={18} className="me-2" style={{ color: "#dc3545" }} />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1.2rem",
                    lineHeight: 1,
                    cursor: "pointer",
                    color: "#842029",
                  }}
                  onClick={() => setError("")}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {successMsg && (
              <div
                className="alert alert-success d-flex align-items-center justify-content-between py-2 px-3 mb-3"
                style={{
                  fontSize: "0.87rem",
                  borderRadius: "8px",
                  borderLeft: "4px solid #198754",
                  backgroundColor: "#f0fff4",
                  color: "#0a5c36",
                }}
              >
                <div className="d-flex align-items-center">
                  <CheckCircle size={18} className="me-2" style={{ color: "#198754" }} />
                  <span>{successMsg}</span>
                </div>
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1.2rem",
                    lineHeight: 1,
                    cursor: "pointer",
                    color: "#0a5c36",
                  }}
                  onClick={() => setSuccessMsg("")}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {fetching ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted" style={{ fontSize: "0.9rem" }}>
                  Fetching Bank Details...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="bank-form-grid">
                  <div className="form-group">
                    <label>Bank Name <span className="required">*</span></label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><Building2 size={18} /></span>
                      <input
                        type="text"
                        className="form-control"
                        name="bank_name"
                        value={formData.bank_name}
                        onChange={handleChange}
                        placeholder="Enter Bank Name"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Account Number <span className="required">*</span></label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><Hash size={18} /></span>
                      <input
                        type="text"
                        className="form-control"
                        name="account_number"
                        value={formData.account_number}
                        onChange={handleAccountNumberChange}
                        placeholder="Enter Account Number (digits only)"
                        maxLength="17"
                        required
                      />
                    </div>
                    {accountNumberError && (
                      <div style={{ color: "#dc3545", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                        {accountNumberError}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Account Holder Name <span className="required">*</span></label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><User size={18} /></span>
                      <input
                        type="text"
                        className="form-control"
                        name="account_holder_name"
                        value={formData.account_holder_name || ""}
                        onChange={handleChange}
                        placeholder="Enter Account Holder Name"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Routing Number <span className="required">*</span></label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><CreditCard size={18} /></span>
                      <input
                        type="text"
                        className="form-control"
                        name="routing_number"
                        value={formData.routing_number}
                        onChange={handleRoutingNumberChange}
                        placeholder="Enter 9‑digit Routing Number"
                        maxLength="9"
                        required
                      />
                    </div>
                    {routingNumberError && (
                      <div style={{ color: "#dc3545", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                        {routingNumberError}
                      </div>
                    )}
                  </div>

                  <div className="form-group full-width">
                    <label>Type of Account <span className="required">*</span></label>
                    <div className="radio-group">
                      {accountTypeOptions.map((opt) => (
                        <label className="radio-label" key={opt}>
                          <input
                            type="radio"
                            name="account_type"
                            value={opt}
                            checked={formData.account_type?.toLowerCase() === opt.toLowerCase()}
                            onChange={handleChange}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-save" disabled={loading}>
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Submitting...
                      </>
                    ) : (
                      "Submit"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
};

export default BankDetails;