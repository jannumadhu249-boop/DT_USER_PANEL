import React, { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";
import { URLS } from "../url";
import "../styles/Dashboard.css";
import { Pencil, Trash2, Plus, User, Calendar, Hash, FileText, Users2 } from "lucide-react";

/* ─── constants ─────────────────────────────────────────────────── */
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
  { value: "TN", label: "TN" },
  { value: "GREEN CARD", label: "GREEN CARD" },
  { value: "US CITIZEN", label: "US CITIZEN" },
  { value: "NOT AVAILABLE", label: "NOT AVAILABLE" },
];

/* ─── helpers ─────────────────────────────────────────────────── */
const toDate = (iso) => (iso ? new Date(iso) : null);
const toDateStr = (d) => {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};

// SSN formatting: digits only, hyphens after 3 and 5, max 9 digits
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
const isValid10Alphanumeric = (value) => /^[A-Za-z0-9]{10}$/.test(value);

const EMPTY_FORM = {
  first_name: "",
  middle_name: "",
  last_name: "",
  gender: "",
  date_of_birth: null,
  relationship: "",
  visa_type: "",
  tax_id_type: "ssn",
  ssn_itin: "",
  passport_number: "",
  passport_expiry_date: null,
  visa_number: "",
  visa_expiry_date: null,
  first_entry_date_into_usa: null,
};

/* ─── component ────────────────────────────────────────────────── */
const Dependent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const today = new Date();

  // list
  const [dependents, setDependents] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  // form panel
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // delete
  const [deletingId, setDeletingId] = useState(null);

  // field‑specific errors
  const [ssnError, setSsnError] = useState("");
  const [visaError, setVisaError] = useState("");
  const [passportError, setPassportError] = useState("");

  /* sidebar resize */
  useEffect(() => {
    const onResize = () => setSidebarOpen(window.innerWidth > 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ── GET list ─────────────────────────────────────────────────── */
  const fetchDependents = async () => {
    setListLoading(true);
    setListError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(URLS.GetDependent, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        const deps = data.data || [];
        setDependents(deps);
        // If no dependents, show the form (hide list)
        // If dependents exist, hide form and show list
        if (deps.length === 0) {
          setShowForm(true);
          setEditId(null);
          setForm(EMPTY_FORM);
        } else {
          setShowForm(false);
        }
      } else {
        setListError(data.message || "Failed to fetch dependents.");
      }
    } catch {
      setListError("Network error fetching dependents.");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => { fetchDependents(); }, []);

  /* ── open ADD form ────────────────────────────────────────────── */
  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setFormSuccess("");
    setSsnError("");
    setVisaError("");
    setPassportError("");
    setShowForm(true);
  };

  /* ── open EDIT form (GET by ID) ───────────────────────────────── */
  const openEdit = async (id) => {
    setFormError("");
    setFormSuccess("");
    setSsnError("");
    setVisaError("");
    setPassportError("");
    setShowForm(true);
    setEditId(id);
    setForm(EMPTY_FORM);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(URLS.GetByIdDenpendent + id, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && data.data) {
        const d = data.data;
        const isApplying = d.tax_id_type === "APPLYING FOR ITIN";
        setForm({
          first_name: d.first_name || "",
          middle_name: d.middle_name || "",
          last_name: d.last_name || "",
          gender: d.gender || "",
          date_of_birth: toDate(d.date_of_birth),
          relationship: d.relationship || "",
          visa_type: d.visa_type || "",
          tax_id_type: isApplying ? "applying" : "ssn",
          ssn_itin: d.ssn_itin || "",
          passport_number: d.passport_number || "",
          passport_expiry_date: toDate(d.passport_expiry_date),
          visa_number: d.visa_number || "",
          visa_expiry_date: toDate(d.visa_expiry_date),
          first_entry_date_into_usa: toDate(d.first_entry_date_into_usa),
        });
      } else {
        setFormError(data.message || "Failed to load dependent.");
      }
    } catch {
      setFormError("Network error loading dependent.");
    }
  };

  /* ── close form ───────────────────────────────────────────────── */
  const closeForm = () => {
    setShowForm(false);
    setFormError("");
    setFormSuccess("");
    setSsnError("");
    setVisaError("");
    setPassportError("");
  };

  /* ── SAVE (create or update) ──────────────────────────────────── */
  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setSsnError("");
    setVisaError("");
    setPassportError("");

    // --- validations ---
    if (form.tax_id_type === "ssn") {
      const raw = form.ssn_itin.replace(/-/g, "");
      if (raw.length !== 9) {
        setSsnError("SSN/ITIN must be exactly 9 digits.");
        return;
      }
    }

    if (form.tax_id_type === "applying") {
      if (form.passport_number && !isValid10Alphanumeric(form.passport_number)) {
        setPassportError("Passport number must be exactly 10 alphanumeric characters.");
        return;
      }
      if (form.visa_number && !isValid10Alphanumeric(form.visa_number)) {
        setVisaError("Visa number must be exactly 10 alphanumeric characters.");
        return;
      }
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const isApplying = form.tax_id_type === "applying";
      const body = {
        first_name: form.first_name,
        middle_name: form.middle_name,
        last_name: form.last_name,
        gender: form.gender,
        date_of_birth: toDateStr(form.date_of_birth),
        relationship: form.relationship,
        visa_type: form.visa_type,
        tax_id_type: isApplying ? "APPLYING FOR ITIN" : "SSN/ITIN",
        ...(isApplying
          ? {
              passport_number: form.passport_number,
              passport_expiry_date: toDateStr(form.passport_expiry_date),
              visa_number: form.visa_number,
              visa_expiry_date: toDateStr(form.visa_expiry_date),
              first_entry_date_into_usa: toDateStr(form.first_entry_date_into_usa),
            }
          : { ssn_itin: form.ssn_itin.replace(/-/g, "") }),
      };

      const url = editId ? URLS.UpdateDependent + editId : URLS.CreateDependent;
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setFormSuccess(data.message || (editId ? "Dependent updated." : "Dependent created."));
        await fetchDependents(); // refresh list
        // After saving, navigate to AddressInTaxYear if not editing
        if (!editId) {
          setTimeout(() => {
            navigate("/address-in-tax-year");
          }, 1200);
        } else {
          // If editing, close form after short delay
          setTimeout(() => {
            setShowForm(false);
          }, 1200);
        }
      } else {
        setFormError(data.message || "Failed to save dependent.");
      }
    } catch {
      setFormError("Network error saving dependent.");
    } finally {
      setSaving(false);
    }
  };

  /* ── DELETE ───────────────────────────────────────────────────── */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this dependent?")) return;
    setDeletingId(id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(URLS.DeleteDependent + id, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        await fetchDependents(); // refresh list
        if (editId === id) setShowForm(false);
      } else {
        alert(data.message || "Failed to delete dependent.");
      }
    } catch {
      alert("Network error deleting dependent.");
    } finally {
      setDeletingId(null);
    }
  };

  /* ── field change helper ──────────────────────────────────────── */
  const setField = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (formError) setFormError("");
    if (formSuccess) setFormSuccess("");
    if (key === "ssn_itin" && ssnError) setSsnError("");
    if (key === "passport_number" && passportError) setPassportError("");
    if (key === "visa_number" && visaError) setVisaError("");
  };

  const handleSsnChange = (e) => {
    const formatted = formatSSN(e.target.value);
    setField("ssn_itin", formatted);
  };

  const handlePassportChange = (e) => {
    const val = e.target.value.replace(/[^A-Za-z0-9]/g, "");
    setField("passport_number", val);
  };

  const handleVisaChange = (e) => {
    const val = e.target.value.replace(/[^A-Za-z0-9]/g, "");
    setField("visa_number", val);
  };

  /* ─────────────────────────────────────────────────────────────── */
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
          <span className="breadcrumb-current">Dependent</span>
        </div>

        <div className="form-container">
          <div className="page-header-section">
            <div className="page-header-left">
              <div className="page-header-icon">
                <Users2 size={24} />
              </div>
              <div className="page-header-content">
                <h2 className="page-header-title">Dependents</h2>
                <p className="page-header-subtitle">Add your dependents — children or other qualifying relatives.</p>
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
              <div className="step-tab active" onClick={() => navigate("/dependent")} style={{ cursor: "pointer" }}>
                <div className="step-tab-circle">3</div>
                <div className="step-tab-label">Dependent</div>
              </div>
              <div className="step-tab" onClick={() => navigate("/address-in-tax-year")} style={{ cursor: "pointer" }}>
                <div className="step-tab-circle">4</div>
                <div className="step-tab-label">Address</div>
              </div>
              <div className="step-tab" onClick={() => navigate("/bank-details")} style={{ cursor: "pointer" }}>
                <div className="step-tab-circle">5</div>
                <div className="step-tab-label">Bank Details</div>
              </div>
            </div>
          </div>

          {/* ── Main content: either List or Form ─────────────────── */}
          {listLoading ? (
            <div className="form-card">
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted" style={{ fontSize: "0.9rem" }}>Fetching Dependents...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Show LIST if there are dependents and form is NOT shown */}
              {!showForm && dependents.length > 0 && (
                <div className="form-card" style={{ marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                    <h3 className="form-title" style={{ margin: 0 }}>Dependents</h3>
                    <button
                      className="btn-save"
                      style={{ padding: "0.5rem 1.25rem", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
                      onClick={openAdd}
                    >
                      <Plus size={18} /> Add Dependent
                    </button>
                  </div>

                  {listError && (
                    <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: "0.87rem", borderRadius: "8px" }}>
                      {listError}
                    </div>
                  )}

                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                      <thead>
                        <tr style={{ background: "rgba(99,102,241,0.08)", textAlign: "left" }}>
                          {["Name", "Gender", "DOB", "Relationship", "Visa Type", "Tax ID Type", "Actions"].map((h) => (
                            <th key={h} style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "#475569", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {dependents.map((dep, i) => (
                          <tr
                            key={dep._id}
                            style={{
                              borderBottom: "1px solid rgba(0,0,0,0.06)",
                              background: i % 2 === 0 ? "transparent" : "rgba(99,102,241,0.02)",
                            }}
                          >
                            <td style={{ padding: "0.75rem 1rem", color: "#1e293b", fontWeight: 500 }}>
                              {[dep.first_name, dep.middle_name, dep.last_name].filter(Boolean).join(" ")}
                            </td>
                            <td style={{ padding: "0.75rem 1rem", color: "#64748b" }}>{dep.gender || "—"}</td>
                            <td style={{ padding: "0.75rem 1rem", color: "#64748b", whiteSpace: "nowrap" }}>{fmtDate(dep.date_of_birth)}</td>
                            <td style={{ padding: "0.75rem 1rem", color: "#64748b" }}>{dep.relationship || "—"}</td>
                            <td style={{ padding: "0.75rem 1rem", color: "#64748b" }}>{dep.visa_type || "—"}</td>
                            <td style={{ padding: "0.75rem 1rem" }}>
                              <span style={{
                                padding: "0.2rem 0.65rem",
                                borderRadius: "999px",
                                fontSize: "0.775rem",
                                fontWeight: 600,
                                background: dep.tax_id_type === "APPLYING FOR ITIN" ? "rgba(234,179,8,0.12)" : "rgba(34,197,94,0.12)",
                                color: dep.tax_id_type === "APPLYING FOR ITIN" ? "#b45309" : "#15803d",
                              }}>
                                {dep.tax_id_type || "—"}
                              </span>
                            </td>
                            <td style={{ padding: "0.75rem 1rem", whiteSpace: "nowrap" }}>
                              <button
                                onClick={() => openEdit(dep._id)}
                                style={{
                                  marginRight: "0.5rem",
                                  padding: "0.4rem 0.6rem",
                                  border: "none",
                                  borderRadius: "6px",
                                  background: "rgba(99,102,241,0.12)",
                                  color: "#6366f1",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                                title="Edit"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(dep._id)}
                                disabled={deletingId === dep._id}
                                style={{
                                  padding: "0.4rem 0.6rem",
                                  border: "none",
                                  borderRadius: "6px",
                                  background: "rgba(239,68,68,0.1)",
                                  color: "#dc2626",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                                title="Delete"
                              >
                                {deletingId === dep._id ? (
                                  <span style={{ fontSize: "0.8rem" }}>...</span>
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Show FORM if there are no dependents, OR if showForm is true */}
              {(showForm || dependents.length === 0) && (
                <div className="form-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                    <h3 className="form-title" style={{ margin: 0 }}>
                      {editId ? "Edit Dependent" : "Add Dependent"}
                    </h3>
                    {/* Only show close button if there are dependents (so we can go back to list) */}
                    {dependents.length > 0 && (
                      <button
                        onClick={closeForm}
                        style={{
                          background: "none", border: "none", fontSize: "1.25rem",
                          cursor: "pointer", color: "#94a3b8", lineHeight: 1,
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {formError && (
                    <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: "0.87rem", borderRadius: "8px" }}>
                      {formError}
                    </div>
                  )}
                  {formSuccess && (
                    <div className="alert alert-success py-2 px-3 mb-3" style={{ fontSize: "0.87rem", borderRadius: "8px" }}>
                      {formSuccess}
                    </div>
                  )}

                  <form onSubmit={handleSave}>
                    <div className="form-grid">
                      {/* Row 1 */}
                      <div className="form-group">
                        <label>First Name</label>
                        <div className="input-icon-wrap">
                          <span className="input-icon"><User size={18} /></span>
                          <input type="text" className="form-control" placeholder="Enter First Name" value={form.first_name}
                            onChange={e => setField("first_name", e.target.value)} required />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Middle Name</label>
                        <div className="input-icon-wrap">
                          <span className="input-icon"><User size={18} /></span>
                          <input type="text" className="form-control" placeholder="Enter Middle Name" value={form.middle_name}
                            onChange={e => setField("middle_name", e.target.value)} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Last Name</label>
                        <div className="input-icon-wrap">
                          <span className="input-icon"><User size={18} /></span>
                          <input type="text" className="form-control" placeholder="Enter Last Name" value={form.last_name}
                            onChange={e => setField("last_name", e.target.value)} required />
                        </div>
                      </div>

                      {/* Row 2 */}
                      <div className="form-group">
                        <label>Gender</label>
                        <div className="radio-group">
                          {["Male", "Female"].map((g) => (
                            <label className="radio-label" key={g}>
                              <input type="radio" name="dep-gender" value={g}
                                checked={form.gender === g}
                                onChange={() => setField("gender", g)} />
                              <span>{g}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Date of Birth</label>
                        <div className="input-icon-wrap">
                          <span className="input-icon"><Calendar size={18} /></span>
                          <DatePicker
                            selected={form.date_of_birth}
                            onChange={(d) => setField("date_of_birth", d)}
                            dateFormat="MM/dd/yyyy"
                            className="form-control"
                            placeholderText="Select date"
                            showMonthDropdown showYearDropdown dropdownMode="select"
                            maxDate={today}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Relationship</label>
                        <div className="input-icon-wrap">
                          <span className="input-icon"><Users2 size={18} /></span>
                          <select className="form-control" value={form.relationship}
                            onChange={e => setField("relationship", e.target.value)} required
                            style={{ paddingLeft: "42px" }}>
                            <option value="">-Select One-</option>
                            {["Son", "Daughter", "Foster Child", "Step Child", "Parent", "Grand Parent", "Grand Child", "Sister", "Brother", "Aunt", "Uncle", "Niece", "Nephew", "Other"].map(r => (
                              <option key={r}>{r}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Row 3 */}
                      <div className="form-group">
                        <label>Visa Type</label>
                        <div className="input-icon-wrap">
                          <span className="input-icon"><FileText size={18} /></span>
                          <select className="form-control" value={form.visa_type}
                            onChange={e => setField("visa_type", e.target.value)}
                            style={{ paddingLeft: "42px" }}>
                            {VISA_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value} disabled={opt.value === ""}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Tax Id Type</label>
                        <div className="radio-group">
                          <label className="radio-label">
                            <input type="radio" name="dep-taxid" value="ssn"
                              checked={form.tax_id_type === "ssn"}
                              onChange={() => setField("tax_id_type", "ssn")} />
                            <span>SSN/ITIN</span>
                          </label>
                          <label className="radio-label">
                            <input type="radio" name="dep-taxid" value="applying"
                              checked={form.tax_id_type === "applying"}
                              onChange={() => setField("tax_id_type", "applying")} />
                            <span>APPLYING FOR ITIN</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* SSN/ITIN field */}
                    {form.tax_id_type === "ssn" && (
                      <div className="form-grid" style={{ marginBottom: "1.5rem" }}>
                        <div className="form-group">
                          <label>SSN/ITIN Number</label>
                          <div className="input-icon-wrap">
                            <span className="input-icon"><Hash size={18} /></span>
                            <input
                              type="text"
                              className="form-control"
                              value={form.ssn_itin}
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
                      </div>
                    )}

                    {/* Applying for ITIN fields */}
                    {form.tax_id_type === "applying" && (
                      <div className="form-grid" style={{ marginBottom: "1.5rem" }}>
                        <div className="form-group">
                          <label>Passport Number</label>
                          <div className="input-icon-wrap">
                            <span className="input-icon"><Hash size={18} /></span>
                            <input
                              type="text"
                              className="form-control"
                              value={form.passport_number}
                              onChange={handlePassportChange}
                              placeholder="10 alphanumeric chars"
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
                            <DatePicker selected={form.passport_expiry_date}
                              onChange={d => setField("passport_expiry_date", d)}
                              dateFormat="MM/dd/yyyy" className="form-control" placeholderText="Select date" />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Visa Number</label>
                          <div className="input-icon-wrap">
                            <span className="input-icon"><Hash size={18} /></span>
                            <input
                              type="text"
                              className="form-control"
                              value={form.visa_number}
                              onChange={handleVisaChange}
                              placeholder="10 alphanumeric chars"
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
                            <DatePicker selected={form.visa_expiry_date}
                              onChange={d => setField("visa_expiry_date", d)}
                              dateFormat="MM/dd/yyyy" className="form-control" placeholderText="Select date" />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>First Entry Date into USA</label>
                          <div className="input-icon-wrap">
                            <span className="input-icon"><Calendar size={18} /></span>
                            <DatePicker selected={form.first_entry_date_into_usa}
                              onChange={d => setField("first_entry_date_into_usa", d)}
                              dateFormat="MM/dd/yyyy" className="form-control" placeholderText="Select date" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="form-actions">
                      {dependents.length > 0 && (
                        <button type="button" className="btn-cancel"
                          onClick={closeForm}
                          style={{ marginRight: "0.75rem" }}>
                          Cancel
                        </button>
                      )}
                      <button type="submit" className="btn-save" disabled={saving}>
                        {saving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Saving...
                          </>
                        ) : (editId ? "Update" : "Save & Continue")}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>

        <Footer />
      </main>
    </div>
  );
};

export default Dependent;