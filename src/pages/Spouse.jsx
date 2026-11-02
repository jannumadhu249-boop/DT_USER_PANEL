import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";
import { URLS } from "../url";
import "../styles/Dashboard.css";
import { CheckCircle, XCircle, X, User, Calendar, Hash, Building2, FileText } from "lucide-react";

// ---------- Helper functions ----------
const formatDate = (isoString) => {
  if (!isoString) return null;
  return new Date(isoString);
};

const toDateString = (dateObj) => {
  if (!dateObj) return null;
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// Format SSN: only digits, insert hyphens, limit to 9 digits
const formatSSN = (value) => {
  const raw = value.replace(/\D/g, "");
  let formatted = raw;
  if (raw.length > 3 && raw.length <= 5) {
    formatted = raw.slice(0, 3) + "-" + raw.slice(3);
  } else if (raw.length > 5) {
    formatted = raw.slice(0, 3) + "-" + raw.slice(3, 5) + "-" + raw.slice(5, 9);
  }
  if (formatted.length > 11) formatted = formatted.slice(0, 11);
  return formatted;
};

// Validation: exactly 10 alphanumeric characters
const isValid10Alphanumeric = (value) => {
  return /^[A-Za-z0-9]{10}$/.test(value);
};

// ---------- Visa options ----------
const VISA_OPTIONS = [
  { value: "", label: "Select Visa Type" },
  { value: "H1 A", label: "H1 A" },
  { value: "H1 B", label: "H1 B" },
  { value: "H4", label: "H4" },
  { value: "L1 A", label: "L1 A" },
  { value: "L1 B", label: "L1 B" },
  { value: "L2", label: "L2" },
  { value: "F1 OPT", label: "F1 OPT" },
  { value: "F1 CPT", label: "F1 CPT" },
  { value: "F2", label: "F2" },
  { value: "J", label: "J" },
  { value: "M", label: "M" },
  { value: "Q", label: "Q" },
  { value: "EAD", label: "EAD" },
  { VALUE: "TN", label: "TN" },
  { value: "GREEN CARD", label: "GREEN CARD" },
  { value: "US Citizen", label: "US CITIZEN" },
  { value: "Not Available", label: "NOT AVAILABLE" },
];

// ---------- Main Component ----------
const Spouse = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const today = new Date();

  // Form state
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [occupation, setOccupation] = useState("");
  const [visaType, setVisaType] = useState("");

  // Tax ID
  const [taxIdType, setTaxIdType] = useState("ssn");
  const [ssnNumber, setSsnNumber] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [passportExpiry, setPassportExpiry] = useState(null);
  const [visaNumber, setVisaNumber] = useState("");
  const [visaExpiry, setVisaExpiry] = useState(null);
  const [firstEntryDate, setFirstEntryDate] = useState(null);

  // UI state
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Field‑specific errors
  const [ssnError, setSsnError] = useState("");
  const [visaError, setVisaError] = useState("");
  const [passportError, setPassportError] = useState("");

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
      }, 5000); // 5 seconds
    }

    return () => {
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
  }, [error, successMsg]);

  // Sidebar resize
  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth > 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // GET spouse on mount
  useEffect(() => {
    const fetchSpouse = async () => {
      setFetching(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Authentication token missing. Please log in.");
          setFetching(false);
          return;
        }
        const res = await fetch(URLS.GetSpouse, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok && data.success && data.data) {
          const d = data.data;
          setFirstName(d.first_name || "");
          setMiddleName(d.middle_name || "");
          setLastName(d.last_name || "");
          setGender(d.gender || "");
          setDateOfBirth(formatDate(d.date_of_birth));
          setOccupation(d.occupation || "");
          setVisaType(d.visa_type || "");

          if (d.tax_id_type === "APPLYING FOR ITIN") {
            setTaxIdType("applying");
            setPassportNumber(d.passport_number || "");
            setPassportExpiry(formatDate(d.passport_expiry_date));
            setVisaNumber(d.visa_number || "");
            setVisaExpiry(formatDate(d.visa_expiry_date));
            setFirstEntryDate(formatDate(d.first_entry_date_into_usa));
          } else {
            setTaxIdType("ssn");
            setSsnNumber(d.ssn_itin || "");
          }
        } else {
          const msg = data.message || "";
          if (msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("no spouse")) {
            setError("");
          } else {
            setError(msg || "Failed to fetch spouse details.");
          }
        }
      } catch (err) {
        setError("Network error fetching spouse details.");
      } finally {
        setFetching(false);
      }
    };
    fetchSpouse();
  }, []);

  // PUT — save spouse with validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setSsnError("");
    setVisaError("");
    setPassportError("");

    // Validate SSN (if taxIdType === "ssn")
    if (taxIdType === "ssn") {
      const raw = ssnNumber.replace(/-/g, "");
      if (raw.length !== 9) {
        setSsnError("SSN/ITIN must be exactly 9 digits.");
        return;
      }
    }

    // Validate Passport & Visa (if applying for ITIN)
    if (taxIdType === "applying") {
      if (passportNumber && !isValid10Alphanumeric(passportNumber)) {
        setPassportError("Passport number must be exactly 10 alphanumeric characters.");
        return;
      }
      if (visaNumber && !isValid10Alphanumeric(visaNumber)) {
        setVisaError("Visa number must be exactly 10 alphanumeric characters.");
        return;
      }
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const body =
        taxIdType === "ssn"
          ? {
              first_name: firstName,
              middle_name: middleName,
              last_name: lastName,
              gender,
              date_of_birth: toDateString(dateOfBirth),
              occupation,
              visa_type: visaType,
              tax_id_type: "SSN/ITIN",
              ssn_itin: ssnNumber.replace(/-/g, ""),
            }
          : {
              first_name: firstName,
              middle_name: middleName,
              last_name: lastName,
              gender,
              date_of_birth: toDateString(dateOfBirth),
              occupation,
              visa_type: visaType,
              tax_id_type: "APPLYING FOR ITIN",
              passport_number: passportNumber,
              passport_expiry_date: toDateString(passportExpiry),
              visa_number: visaNumber,
              visa_expiry_date: toDateString(visaExpiry),
              first_entry_date_into_usa: toDateString(firstEntryDate),
            };

      const res = await fetch(URLS.UpdateSpouse, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message || "Spouse details saved successfully.");
        // Navigate to Dependent tab after successful save
        setTimeout(() => {
          navigate("/dependent");
        }, 1200);
      } else {
        setError(data.message || "Failed to update spouse details.");
      }
    } catch (err) {
      setError("Network error updating spouse details.");
    } finally {
      setLoading(false);
    }
  };

  // Handlers with formatting & validation
  const handleSsnChange = (e) => {
    const formatted = formatSSN(e.target.value);
    setSsnNumber(formatted);
    if (ssnError) setSsnError("");
    if (error) setError("");
    if (successMsg) setSuccessMsg("");
  };

  const handlePassportChange = (e) => {
    const val = e.target.value.replace(/[^A-Za-z0-9]/g, "");
    setPassportNumber(val);
    if (passportError) setPassportError("");
    if (error) setError("");
    if (successMsg) setSuccessMsg("");
  };

  const handleVisaChange = (e) => {
    const val = e.target.value.replace(/[^A-Za-z0-9]/g, "");
    setVisaNumber(val);
    if (visaError) setVisaError("");
    if (error) setError("");
    if (successMsg) setSuccessMsg("");
  };

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
          <span className="breadcrumb-current">Spouse</span>
        </div>

        <div className="form-container">
          <div className="form-card">
            <h3 className="form-title">Spouse Information</h3>

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
                  className="btn-close"
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
                  className="btn-close"
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
                  Fetching Spouse Details...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Main 3‑column grid */}
                <div className="form-grid">
                  {/* Row 1 */}
                  <div className="form-group">
                    <label>First Name</label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><User size={18} /></span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter First Name"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Middle Name</label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><User size={18} /></span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Middle Name"
                        value={middleName}
                        onChange={e => setMiddleName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><User size={18} /></span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Last Name"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><Calendar size={18} /></span>
                      <DatePicker
                        selected={dateOfBirth}
                        onChange={(date) => setDateOfBirth(date)}
                        dateFormat="MM/dd/yyyy"
                        className="form-control"
                        placeholderText="Select date"
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        maxDate={today}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Occupation</label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><Building2 size={18} /></span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Occupation In USA"
                        value={occupation}
                        onChange={e => setOccupation(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Visa Type</label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><FileText size={18} /></span>
                      <select
                        className="form-control"
                        value={visaType}
                        onChange={e => setVisaType(e.target.value)}
                        style={{ paddingLeft: "42px" }}
                      >
                        {VISA_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value} disabled={opt.value === ""}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 3 */}
                  <div className="form-group">
                    <label>Gender</label>
                    <div className="radio-group">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="gender"
                          value="Male"
                          checked={gender === "Male"}
                          onChange={e => setGender(e.target.value)}
                        />
                        <span>Male</span>
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="gender"
                          value="Female"
                          checked={gender === "Female"}
                          onChange={e => setGender(e.target.value)}
                        />
                        <span>Female</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Tax Id Type</label>
                    <div className="radio-group">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="taxIdType"
                          value="ssn"
                          checked={taxIdType === "ssn"}
                          onChange={e => setTaxIdType(e.target.value)}
                        />
                        <span>SSN/ITIN</span>
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="taxIdType"
                          value="applying"
                          checked={taxIdType === "applying"}
                          onChange={e => setTaxIdType(e.target.value)}
                        />
                        <span>APPLYING FOR ITIN</span>
                      </label>
                    </div>
                  </div>

                  {/* SSN field – only when taxIdType === "ssn" */}
                  {taxIdType === "ssn" && (
                    <>
                      <div className="form-group">
                        <label>SSN/ITIN Number</label>
                        <div className="input-icon-wrap">
                          <span className="input-icon"><Hash size={18} /></span>
                          <input
                            type="text"
                            className="form-control"
                            value={ssnNumber}
                            onChange={handleSsnChange}
                            placeholder="XXX-XX-XXXX"
                            maxLength="11"
                          />
                        </div>
                        {ssnError && (
                          <div style={{ color: "#dc3545", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                            {ssnError}
                          </div>
                        )}
                      </div>
                      <div></div>
                      <div></div>
                    </>
                  )}
                </div> {/* end form-grid */}

                {/* ITIN application fields */}
                {taxIdType === "applying" && (
                  <div className="form-grid" style={{ marginTop: "1.5rem" }}>
                    <div className="form-group">
                      <label>Passport Number</label>
                      <div className="input-icon-wrap">
                        <span className="input-icon"><Hash size={18} /></span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter Passport Number (10 alphanumeric)"
                          value={passportNumber}
                          onChange={handlePassportChange}
                          maxLength="10"
                        />
                      </div>
                      {passportError && (
                        <div style={{ color: "#dc3545", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                          {passportError}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Passport Expiry Date</label>
                      <div className="input-icon-wrap">
                        <span className="input-icon"><Calendar size={18} /></span>
                        <DatePicker
                          selected={passportExpiry}
                          onChange={date => setPassportExpiry(date)}
                          dateFormat="MM/dd/yyyy"
                          className="form-control"
                          placeholderText="Select date"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Visa Number</label>
                      <div className="input-icon-wrap">
                        <span className="input-icon"><Hash size={18} /></span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter Visa Number (10 alphanumeric)"
                          value={visaNumber}
                          onChange={handleVisaChange}
                          maxLength="10"
                        />
                      </div>
                      {visaError && (
                        <div style={{ color: "#dc3545", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                          {visaError}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Visa Expiry Date</label>
                      <div className="input-icon-wrap">
                        <span className="input-icon"><Calendar size={18} /></span>
                        <DatePicker
                          selected={visaExpiry}
                          onChange={date => setVisaExpiry(date)}
                          dateFormat="MM/dd/yyyy"
                          className="form-control"
                          placeholderText="Select date"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>First Entry Date into USA</label>
                      <div className="input-icon-wrap">
                        <span className="input-icon"><Calendar size={18} /></span>
                        <DatePicker
                          selected={firstEntryDate}
                          onChange={date => setFirstEntryDate(date)}
                          dateFormat="MM/dd/yyyy"
                          className="form-control"
                          placeholderText="Select date"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="form-actions">
                  <button type="submit" className="btn-save" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      "Save & Continue"
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

export default Spouse;