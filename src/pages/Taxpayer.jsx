import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";
import { URLS } from "../url";
import "../styles/Dashboard.css";
import { CheckCircle, XCircle, X, User, Mail, Phone, Calendar, MapPin, Building2, Hash, FileText, Heart, Clock, Users2 } from "lucide-react";

const Taxpayer = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [firstEntryDate, setFirstEntryDate] = useState(null);
  const [marriageDate, setMarriageDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const today = new Date();

  const [referred, setReferred] = useState("no");
  const [refer_full_name, setReferFullName] = useState("");
  const [refer_email, setReferEmail] = useState("");

  const [statesList, setStatesList] = useState([]);
  const [statesLoading, setStatesLoading] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    gender: "Male",
    ssn_tin: "",
    occupation: "",
    visa_type: "NOT AVAILABLE",
    filing_status: "Single",
    timezone: "MST",
    contact_number: "",
    alternate_number: "",
    email: "",
    alternate_email: "",
    date_of_marriage: "",
    mailing_address: "",
    city: "",
    state: "",
    zipcode: "",
  });

  const isValidPhone = (phone) => /^\d{10}$/.test(phone.replace(/\D/g, ""));
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const alertTimeoutRef = useRef(null);

  useEffect(() => {
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    if (error || successMsg) {
      alertTimeoutRef.current = setTimeout(() => {
        setError("");
        setSuccessMsg("");
      }, 5000);
    }
    return () => {
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };
  }, [error, successMsg]);

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth > 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchTaxpayerData();
    fetchStates();
  }, []);

  const fetchTaxpayerData = async () => {
    setFetching(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(URLS.GetTaxPayer, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const resData = await response.json();

      if (resData.success && resData.data) {
        const item = resData.data;
        setFormData({
          first_name: item.first_name || "",
          middle_name: item.middle_name || "",
          last_name: item.last_name || "",
          gender: item.gender || "Male",
          ssn_tin: item.ssn_tin || "",
          occupation: item.occupation || "",
          visa_type: item.visa_type || "NOT AVAILABLE",
          filing_status: item.filing_status || "Single",
          timezone: item.timezone || "MST",
          contact_number: item.contact_number || "",
          alternate_number: item.alternate_number || "",
          email: item.email || "",
          alternate_email: item.alternate_email || "",
          date_of_marriage: item.date_of_marriage || "",
          mailing_address: item.mailing_address || "",
          city: item.city || "",
          state: item.state || "",
          zipcode: item.zipcode || "",
        });

        if (item.date_of_birth) setDateOfBirth(new Date(item.date_of_birth));
        if (item.first_entry_date_into_usa)
          setFirstEntryDate(new Date(item.first_entry_date_into_usa));
        if (item.date_of_marriage) setMarriageDate(new Date(item.date_of_marriage));

        if (item.referred !== undefined) setReferred(item.referred ? "yes" : "no");
        if (item.refer_full_name) setReferFullName(item.refer_full_name);
        if (item.refer_email) setReferEmail(item.refer_email);
      } else if (resData.message && resData.message.toLowerCase().includes("not found")) {
        setError("");
        try {
          const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
          if (savedUser && (savedUser.first_name || savedUser.last_name || savedUser.email)) {
            setFormData((prev) => ({
              ...prev,
              first_name: savedUser.first_name || prev.first_name,
              last_name: savedUser.last_name || prev.last_name,
              email: savedUser.email || prev.email,
              contact_number: savedUser.contact_number || prev.contact_number,
            }));
          }
        } catch (_) {}
      } else {
        setError(resData.message || "Failed to fetch taxpayer details.");
      }
    } catch (err) {
      setError("Network error fetching taxpayer details.");
    } finally {
      setFetching(false);
    }
  };

  const fetchStates = async () => {
    setStatesLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(URLS.GetStates, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const resData = await response.json();
      if (Array.isArray(resData.data)) setStatesList(resData.data);
    } catch (err) {
      console.error("Error fetching states:", err);
    } finally {
      setStatesLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
    if (successMsg) setSuccessMsg("");
  };

  const handleSsnChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    let formatted = raw;
    if (raw.length > 3 && raw.length <= 5) {
      formatted = raw.slice(0, 3) + "-" + raw.slice(3);
    } else if (raw.length > 5) {
      formatted = raw.slice(0, 3) + "-" + raw.slice(3, 5) + "-" + raw.slice(5, 9);
    }
    if (formatted.length > 11) formatted = formatted.slice(0, 11);
    setFormData((prev) => ({ ...prev, ssn_tin: formatted }));
    if (error) setError("");
    if (successMsg) setSuccessMsg("");
  };

  const handlePhoneChange = (e, fieldName) => {
    const raw = e.target.value.replace(/\D/g, "");
    const limited = raw.slice(0, 10);
    let formatted = limited;
    if (limited.length > 6) {
      formatted = limited.slice(0, 3) + " " + limited.slice(3, 6) + " " + limited.slice(6);
    } else if (limited.length > 3) {
      formatted = limited.slice(0, 3) + " " + limited.slice(3);
    }
    setFormData((prev) => ({ ...prev, [fieldName]: formatted }));
    if (error) setError("");
    if (successMsg) setSuccessMsg("");
  };

  const formatDate = (date) => {
    if (!date) return "";
    if (typeof date === "string") return date.split("T")[0];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const showMarriageDate = [
    "Married Filing Separate",
    "Married Filing Joint",
    "Qualifying Widow/ER",
  ].includes(formData.filing_status);

  const validateForm = () => {
    setError("");

    if (!formData.first_name.trim()) {
      setError("First Name is required.");
      return false;
    }
    if (!formData.last_name.trim()) {
      setError("Last Name is required.");
      return false;
    }
    if (!dateOfBirth) {
      setError("Date of Birth is required.");
      return false;
    }
    if (!formData.occupation.trim()) {
      setError("Occupation is required.");
      return false;
    }
    if (!formData.visa_type || formData.visa_type === "Select Visa Type") {
      setError("Please select a Visa Type.");
      return false;
    }
    if (!formData.filing_status || formData.filing_status === "Select") {
      setError("Please select a Filing Status.");
      return false;
    }
    if (showMarriageDate && !marriageDate) {
      setError("Date of Marriage is required for the selected filing status.");
      return false;
    }

    const phone = formData.contact_number.replace(/\D/g, "");
    const altPhone = formData.alternate_number.replace(/\D/g, "");
    const email = formData.email.trim();
    const altEmail = formData.alternate_email.trim();

    if (!isValidPhone(phone)) {
      setError("Contact Number must be exactly 10 digits.");
      return false;
    }
    if (altPhone.length > 0 && !isValidPhone(altPhone)) {
      setError("Alternate Number must be exactly 10 digits.");
      return false;
    }
    if (!email) {
      setError("Email is required.");
      return false;
    }
    if (altEmail.length > 0 && !isValidEmail(altEmail)) {
      setError("Alternate Email must be a valid email address.");
      return false;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (!formData.mailing_address.trim()) {
      setError("Mailing Address is required.");
      return false;
    }
    if (!formData.city.trim()) {
      setError("City is required.");
      return false;
    }
    if (!formData.state) {
      setError("State is required.");
      return false;
    }
    if (!formData.zipcode.trim()) {
      setError("Zip Code is required.");
      return false;
    }
    if (referred === "yes") {
      if (!refer_full_name.trim()) {
        setError("Referrer Full Name is required.");
        return false;
      }
      if (!refer_email.trim()) {
        setError("Referrer Email is required.");
        return false;
      }
      if (!isValidEmail(refer_email.trim())) {
        setError("Please enter a valid referrer email address.");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setError("");
    setSuccessMsg("");
    setLoading(true);

    const payload = {
      first_name: formData.first_name,
      middle_name: formData.middle_name,
      last_name: formData.last_name,
      gender: formData.gender,
      ssn_tin: formData.ssn_tin.replace(/-/g, ""),
      date_of_birth: formatDate(dateOfBirth),
      occupation: formData.occupation,
      first_entry_date_into_usa: formatDate(firstEntryDate),
      visa_type: formData.visa_type,
      filing_status: formData.filing_status,
      timezone: formData.timezone,
      contact_number: formData.contact_number,
      alternate_number: formData.alternate_number,
      email: formData.email,
      alternate_email: formData.alternate_email,
      mailing_address: formData.mailing_address,
      city: formData.city,
      state: formData.state,
      zipcode: formData.zipcode,
      marriage_date: formatDate(marriageDate),
      referred: referred === "yes",
      refer_full_name: refer_full_name,
      refer_email: refer_email,
    };

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(URLS.UpdateTaxPayer, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();
      if (resData.success) {
        setSuccessMsg(resData.message || "Taxpayer details saved successfully.");
        try {
          localStorage.setItem("taxpayer_completed", "true");
          window.dispatchEvent(new Event("user-updated"));
        } catch (_) {}
        // Navigate to Spouse tab after successful save
        setTimeout(() => {
          navigate("/spouse");
        }, 1200);
      } else {
        setError(resData.message || "Failed to update taxpayer details.");
      }
    } catch (err) {
      setError("Network error updating taxpayer details.");
    } finally {
      setLoading(false);
    }
  };

  const visaOptions = [
    "Select Visa Type",
    "NOT AVAILABLE",
    "US CITIZEN",
    "B1",
    "B2",
    "H1 A",
    "H1 B",
    "H4",
    "L1 A",
    "L1 B",
    "L2",
    "F1",
    "F1 OPT",
    "F1 CPT",
    "J",
    "M",
    "Q",
    "EAD",
    "GREEN CARD",
    "TN",
  ];
  const filingOptions = [
    "Select",
    "Single",
    "Married Filing Joint",
    "Married Filing Separate",
    "Head of Household",
    "Qualifying Widow/ER",
  ];
  const timezoneOptions = ["Select Time Zone", "MST", "EST", "PST", "CST", "IST"];

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
          <span className="breadcrumb-current">Taxpayer</span>
        </div>

        <div className="form-container">
          {/* Page Header with Inline Step Tabs */}
          <div className="page-header-section">
            <div className="page-header-left">
              <div className="page-header-icon">
                <Users2 size={24} />
              </div>
              <div className="page-header-content">
                <h2 className="page-header-title">Taxpayer Information</h2>
                <p className="page-header-subtitle">Provide your personal and identification details for tax filing.</p>
              </div>
            </div>
            
            <div className="page-header-tabs">
              <div className="step-tab active">
                <div className="step-tab-circle">1</div>
                <div className="step-tab-label">Taxpayer</div>
              </div>
              <div className="step-tab">
                <div className="step-tab-circle">2</div>
                <div className="step-tab-label">Spouse</div>
              </div>
              <div className="step-tab">
                <div className="step-tab-circle">3</div>
                <div className="step-tab-label">Dependent</div>
              </div>
              <div className="step-tab">
                <div className="step-tab-circle">4</div>
                <div className="step-tab-label">Address</div>
              </div>
              <div className="step-tab">
                <div className="step-tab-circle">5</div>
                <div className="step-tab-label">Bank Details</div>
              </div>
            </div>
          </div>

          {/* Global Alerts */}
          <div style={{ marginBottom: "1rem" }}>
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
          </div>

          {fetching ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted" style={{ fontSize: "0.9rem" }}>
                  Fetching Taxpayer Details...
                </p>
              </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* CARD 1: Personal Details */}
              <div className="form-card" style={{ marginBottom: "1.5rem" }}>
                <h3 className="form-title">
                  <User size={20} />
                  Personal Information
                </h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      First Name <span style={{ color: "red" }}>*</span>
                    </label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><User size={18} /></span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter First Name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
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
                        name="middle_name"
                        value={formData.middle_name}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>
                      Last Name <span style={{ color: "red" }}>*</span>
                    </label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><User size={18} /></span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Last Name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Gender</label>
                    <div className="radio-group">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="gender"
                          value="Male"
                          checked={formData.gender?.toLowerCase() === "male"}
                          onChange={handleChange}
                        />
                        <span>Male</span>
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="gender"
                          value="Female"
                          checked={formData.gender?.toLowerCase() === "female"}
                          onChange={handleChange}
                        />
                        <span>Female</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>SSN / TIN</label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><Hash size={18} /></span>
                      <input
                        type="text"
                        className="form-control"
                        name="ssn_tin"
                        value={formData.ssn_tin}
                        onChange={handleSsnChange}
                        placeholder="XXX-XX-XXXX"
                        maxLength="11"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      Date of Birth <span style={{ color: "red" }}>*</span>
                    </label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><Calendar size={18} /></span>
                      <DatePicker
                        selected={dateOfBirth}
                        onChange={(date) => {
                          setDateOfBirth(date);
                          if (error) setError("");
                          if (successMsg) setSuccessMsg("");
                        }}
                        dateFormat="MM/dd/yyyy"
                        className="form-control"
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        placeholderText="Enter Date of Birth"
                        maxDate={today}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      Occupation <span style={{ color: "red" }}>*</span>
                    </label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><Building2 size={18} /></span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Occupation In USA"
                        name="occupation"
                        value={formData.occupation}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>First entry date into USA</label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><Calendar size={18} /></span>
                      <DatePicker
                        selected={firstEntryDate}
                        onChange={(date) => {
                          setFirstEntryDate(date);
                          if (error) setError("");
                          if (successMsg) setSuccessMsg("");
                        }}
                        dateFormat="MM/dd/yyyy"
                        className="form-control"
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        placeholderText="Enter First Entry Date"
                        maxDate={today}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      Visa Type <span style={{ color: "red" }}>*</span>
                    </label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><FileText size={18} /></span>
                      <select
                        className="form-control"
                        name="visa_type"
                        value={formData.visa_type}
                        onChange={handleChange}
                        style={{ paddingLeft: "42px" }}
                      >
                        {!visaOptions.includes(formData.visa_type) && formData.visa_type && (
                          <option value={formData.visa_type}>{formData.visa_type}</option>
                        )}
                        {visaOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      Filing Status <span style={{ color: "red" }}>*</span>
                    </label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><Heart size={18} /></span>
                      <select
                        className="form-control"
                        name="filing_status"
                        value={formData.filing_status}
                        onChange={handleChange}
                        style={{ paddingLeft: "42px" }}
                      >
                        {!filingOptions.includes(formData.filing_status) &&
                          formData.filing_status && (
                            <option value={formData.filing_status}>
                              {formData.filing_status}
                            </option>
                          )}
                        {filingOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {showMarriageDate && (
                    <div className="form-group">
                      <label>
                        Date of Marriage <span style={{ color: "red" }}>*</span>
                      </label>
                      <div className="input-icon-wrap">
                        <span className="input-icon"><Calendar size={18} /></span>
                        <DatePicker
                          selected={marriageDate}
                          onChange={(date) => {
                            setMarriageDate(date);
                            if (error) setError("");
                            if (successMsg) setSuccessMsg("");
                          }}
                          dateFormat="MM/dd/yyyy"
                          className="form-control"
                          showMonthDropdown
                          showYearDropdown
                          dropdownMode="select"
                          placeholderText="Enter Date of Marriage"
                          maxDate={today}
                        />
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Timezone</label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><Clock size={18} /></span>
                      <select
                        className="form-control"
                        name="timezone"
                        value={formData.timezone}
                        onChange={handleChange}
                        style={{ paddingLeft: "42px" }}
                      >
                        {!timezoneOptions.includes(formData.timezone) && formData.timezone && (
                          <option value={formData.timezone}>{formData.timezone}</option>
                        )}
                        {timezoneOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                </div>
              </div>

              {/* CARD 2: Contact Details */}
              <div className="form-card" style={{ marginBottom: "1.5rem" }}>
                <h3 className="form-title">
                  <Mail size={20} />
                  Contact Information
                </h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      Contact Number <span style={{ color: "red" }}>*</span>
                    </label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><Phone size={18} /></span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Phone Number"
                        name="contact_number"
                        value={formData.contact_number}
                        onChange={(e) => handlePhoneChange(e, "contact_number")}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Alternate Number</label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><Phone size={18} /></span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Alternate Number"
                        name="alternate_number"
                        value={formData.alternate_number}
                        onChange={(e) => handlePhoneChange(e, "alternate_number")}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      Primary Email <span style={{ color: "red" }}>*</span>
                    </label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><Mail size={18} /></span>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Enter Email Address"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      Alternate Email
                    </label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><Mail size={18} /></span>
                      <input
                        type="alternate_email"
                        className="form-control"
                        placeholder="Enter Email Address"
                        name="alternate_email"
                        value={formData.alternate_email}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      Mailing Address <span style={{ color: "red" }}>*</span>
                    </label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><MapPin size={18} /></span>
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Enter Mailing Address"
                        name="mailing_address"
                        value={formData.mailing_address}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      City <span style={{ color: "red" }}>*</span>
                    </label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><Building2 size={18} /></span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter City"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>
                      State <span style={{ color: "red" }}>*</span>
                    </label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><MapPin size={18} /></span>
                      <select
                        className="form-control"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        disabled={statesLoading}
                        style={{ paddingLeft: "42px" }}
                      >
                        <option value="">
                          {statesLoading ? "Loading states..." : "Select State"}
                        </option>
                        {formData.state &&
                          !statesList.some(
                            (s) => (s.name || s.state_name || s) === formData.state
                          ) && <option value={formData.state}>{formData.state}</option>}
                        {statesList.map((stateItem, idx) => {
                          const stateName =
                            typeof stateItem === "string"
                              ? stateItem
                              : stateItem.name ||
                                stateItem.state_name ||
                                stateItem.title ||
                                stateItem.label ||
                                "";
                          const stateId =
                            typeof stateItem === "string"
                              ? stateItem
                              : stateItem._id || stateName;
                          return (
                            <option key={stateId || idx} value={stateName}>
                              {stateName}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>
                      Zip Code <span style={{ color: "red" }}>*</span>
                    </label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><Hash size={18} /></span>
                      <input
                        type="text"
                        className="form-control"
                        name="zipcode"
                        value={formData.zipcode}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 3: Referral Details */}
              {/* <div className="form-card" style={{ marginBottom: "1.5rem" }}>
                <h3 className="form-title">
                  <Users2 size={20} />
                  Referral Details
                </h3>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Have you been referred?</label>
                    <div
                      className="radio-group"
                      style={{ display: "flex", gap: "1.5rem", marginTop: "0.25rem" }}
                    >
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="referred"
                          value="yes"
                          checked={referred === "yes"}
                          onChange={() => {
                            setReferred("yes");
                            if (error) setError("");
                            if (successMsg) setSuccessMsg("");
                          }}
                        />
                        <span>Yes</span>
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="referred"
                          value="no"
                          checked={referred === "no"}
                          onChange={() => {
                            setReferred("no");
                            setReferFullName("");
                            setReferEmail("");
                            if (error) setError("");
                            if (successMsg) setSuccessMsg("");
                          }}
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>

                  {referred === "yes" && (
                    <>
                      <div className="form-group">
                        <label>
                          Full Name <span style={{ color: "red" }}>*</span>
                        </label>
                        <div className="input-icon-wrap">
                          <span className="input-icon"><User size={18} /></span>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter Referred Name"
                            value={refer_full_name}
                            onChange={(e) => {
                              setReferFullName(e.target.value);
                              if (error) setError("");
                              if (successMsg) setSuccessMsg("");
                            }}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>
                          Referred Email <span style={{ color: "red" }}>*</span>
                        </label>
                        <div className="input-icon-wrap">
                          <span className="input-icon"><Mail size={18} /></span>
                          <input
                            type="email"
                            className="form-control"
                            placeholder="Enter Referred Email Address"
                            value={refer_email}
                            onChange={(e) => {
                              setReferEmail(e.target.value);
                              if (error) setError("");
                              if (successMsg) setSuccessMsg("");
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div> */}

              {/* Save Button - Outside all cards */}
              <div className="form-actions">
                <button type="button" className="btn-clear-form" onClick={() => {
                  window.location.reload();
                }}>
                  <X size={18} />
                  Clear Form
                </button>
                <button type="submit" className="btn-save" disabled={loading}>
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      Save & Continue
                      <span style={{ marginLeft: '0.25rem' }}>→</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <Footer />
      </main>
    </div>
  );
};

export default Taxpayer;
