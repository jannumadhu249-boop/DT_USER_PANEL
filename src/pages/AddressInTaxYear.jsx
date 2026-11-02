import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";
import { URLS } from "../url";
import "../styles/Dashboard.css";
import { Pencil, Trash2, Plus, X, CheckCircle, XCircle, Calendar, MapPin, User } from "lucide-react";

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

const EMPTY_FORM = {
  person: "",
  state_id: "",
  address_from: null,
  address_to: null,
};

const AddressInTaxYear = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const today = new Date();

  // states options
  const [states, setStates] = useState([]);
  const [statesLoading, setStatesLoading] = useState(true);

  // address list
  const [addresses, setAddresses] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  // form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // delete loading state
  const [deletingId, setDeletingId] = useState(null);

  // ─── Auto‑dismiss alerts ─────────────────────────────────────────
  const alertTimeoutRef = useRef(null);

  useEffect(() => {
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }
    if (formError || formSuccess) {
      alertTimeoutRef.current = setTimeout(() => {
        setFormError("");
        setFormSuccess("");
      }, 5000);
    }
    return () => {
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
  }, [formError, formSuccess]);

  /* Sidebar resize */
  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth > 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ── 1. GET States ───────────────────────────────────────────── */
  const fetchStates = async () => {
    setStatesLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(URLS.GetStates, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setStates(data.data);
      }
    } catch (err) {
      console.error("Error fetching states:", err);
    } finally {
      setStatesLoading(false);
    }
  };

  /* ── 2. GET Addresses ────────────────────────────────────────── */
  const fetchAddresses = async () => {
    setListLoading(true);
    setListError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(URLS.GetAddressTaxPayer, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        const addrs = data.data || [];
        setAddresses(addrs);
        // If no addresses, show the add form immediately
        if (addrs.length === 0) {
          setShowForm(true);
          setEditId(null);
          setForm(EMPTY_FORM);
        } else {
          setShowForm(false);
        }
      } else {
        setListError(data.message || "Failed to fetch addresses.");
      }
    } catch (err) {
      setListError("Network error fetching addresses.");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchStates();
    fetchAddresses();
  }, []);

  /* ── 3. Open Add Form ─────────────────────────────────────────── */
  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setFormSuccess("");
    setShowForm(true);
  };

  /* ── 4. Open Edit Form (Get By ID) ────────────────────────────── */
  const openEdit = async (id) => {
    setFormError("");
    setFormSuccess("");
    setShowForm(true);
    setEditId(id);
    setForm(EMPTY_FORM);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(URLS.GetByIdAddressTaxPayer + id, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && data.data) {
        const d = data.data;
        setForm({
          person: d.person || "",
          state_id: d.state_id || (d.state ? d.state._id : "") || "",
          address_from: toDate(d.address_from),
          address_to: toDate(d.address_to),
        });
      } else {
        setFormError(data.message || "Failed to load address record.");
      }
    } catch {
      setFormError("Network error loading address record.");
    }
  };

  /* ── 5. Save (Create or Update) with Validation ────────────────── */
  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    // --- Validation ---
    if (!form.person) {
      setFormError("Please select a person.");
      return;
    }
    if (!form.state_id) {
      setFormError("Please select a state.");
      return;
    }
    if (!form.address_from) {
      setFormError("Please select the 'From' date.");
      return;
    }
    if (!form.address_to) {
      setFormError("Please select the 'To' date.");
      return;
    }
    if (form.address_from > form.address_to) {
      setFormError("'From' date must be before or equal to 'To' date.");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const body = {
        person: form.person,
        state_id: form.state_id,
        address_from: toDateStr(form.address_from),
        address_to: toDateStr(form.address_to),
      };

      const url = editId ? URLS.UpdateAddressTaxPayer + editId : URLS.CreateAddressTaxPayer;
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
        setFormSuccess(data.message || (editId ? "Address updated successfully." : "Address created successfully."));
        await fetchAddresses();
        if (!editId) {
          // Navigate to BankDetails after successful save
          setTimeout(() => {
            navigate("/bank-details");
          }, 1200);
        } else {
          // If editing, close form after short delay
          setTimeout(() => {
            setShowForm(false);
          }, 1200);
        }
      } else {
        setFormError(data.message || "Failed to save address.");
      }
    } catch {
      setFormError("Network error saving address.");
    } finally {
      setSaving(false);
    }
  };

  /* ── 6. Delete Address ─────────────────────────────────────────── */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this address entry?")) return;
    setDeletingId(id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(URLS.DeleteAddressTaxPayer + id, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        await fetchAddresses();
        if (editId === id) setShowForm(false);
      } else {
        alert(data.message || "Failed to delete address.");
      }
    } catch {
      alert("Network error deleting address.");
    } finally {
      setDeletingId(null);
    }
  };

  const setField = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (formError) setFormError("");
    if (formSuccess) setFormSuccess("");
  };

  // Close form (only when addresses exist)
  const closeForm = () => {
    setShowForm(false);
    setFormError("");
    setFormSuccess("");
  };

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className="dashboard-container">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <main className="main-content">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Breadcrumb */}
        <div className="breadcrumb">
          <a href="/dashboard">Home</a>
          <span className="breadcrumb-separator">›</span>
          <a href="#">Basic Information</a>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">Address</span>
        </div>

        <div className="form-container">
          {listLoading ? (
            <div className="form-card">
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted" style={{ fontSize: "0.9rem" }}>Fetching Addresses...</p>
              </div>
            </div>
          ) : (
            <>
              {/* ── Show List only if addresses exist AND form is hidden ── */}
              {!showForm && addresses.length > 0 && (
                <div className="form-card" style={{ marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                    <div>
                      <h3 className="form-title" style={{ margin: 0 }}>Addresses in Tax Year</h3>
                      <p className="form-description" style={{ margin: "0.25rem 0 0 0" }}>
                        Please provide the period of each state where the taxpayer and spouse lived in during the Tax Year.
                      </p>
                    </div>
                    <button
                      className="btn-save"
                      style={{ padding: "0.5rem 1.25rem", fontSize: "0.875rem", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "0.5rem" }}
                      onClick={openAdd}
                    >
                      <Plus size={18} /> Add Address
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
                          {["Person", "State", "From", "To", "Actions"].map((h) => (
                            <th key={h} style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "#475569", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {addresses.map((addr, i) => (
                          <tr
                            key={addr._id}
                            style={{
                              borderBottom: "1px solid rgba(0,0,0,0.06)",
                              background: i % 2 === 0 ? "transparent" : "rgba(99,102,241,0.02)",
                            }}
                          >
                            <td style={{ padding: "0.75rem 1rem", color: "#1e293b", fontWeight: 500 }}>
                              {addr.person || "—"}
                            </td>
                            <td style={{ padding: "0.75rem 1rem", color: "#64748b" }}>
                              {addr.state?.name || addr.state_id || "—"}
                            </td>
                            <td style={{ padding: "0.75rem 1rem", color: "#64748b", whiteSpace: "nowrap" }}>
                              {fmtDate(addr.address_from)}
                            </td>
                            <td style={{ padding: "0.75rem 1rem", color: "#64748b", whiteSpace: "nowrap" }}>
                              {fmtDate(addr.address_to)}
                            </td>
                            <td style={{ padding: "0.75rem 1rem", whiteSpace: "nowrap" }}>
                              <button
                                onClick={() => openEdit(addr._id)}
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
                                onClick={() => handleDelete(addr._id)}
                                disabled={deletingId === addr._id}
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
                                {deletingId === addr._id ? (
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

              {/* ── Show Form if: no addresses OR showForm === true ── */}
              {(showForm || addresses.length === 0) && (
                <div className="form-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                    <h3 className="form-title" style={{ margin: 0 }}>
                      {editId ? "Edit Address" : "Add Address"}
                    </h3>
                    {addresses.length > 0 && (
                      <button
                        onClick={closeForm}
                        style={{
                          background: "none", border: "none", fontSize: "1.25rem",
                          cursor: "pointer", color: "#94a3b8", lineHeight: 1,
                        }}
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>

                  {/* ─── Advanced Alerts ─── */}
                  {formError && (
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
                        <span>{formError}</span>
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
                        onClick={() => setFormError("")}
                        aria-label="Close"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}

                  {formSuccess && (
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
                        <span>{formSuccess}</span>
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
                        onClick={() => setFormSuccess("")}
                        aria-label="Close"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSave}>
                    <div className="address-grid">
                      <div className="form-group">
                        <label>Select Person <span className="required">*</span></label>
                        <div className="input-icon-wrap">
                          <span className="input-icon"><User size={18} /></span>
                          <select
                            className="form-control"
                            value={form.person}
                            onChange={(e) => setField("person", e.target.value)}
                            required
                            style={{ paddingLeft: "42px" }}
                          >
                            <option value="">-Select Person-</option>
                            <option value="Taxpayer">Taxpayer</option>
                            <option value="Spouse">Spouse</option>
                            <option value="Both">Both</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>State <span className="required">*</span></label>
                        <div className="input-icon-wrap">
                          <span className="input-icon"><MapPin size={18} /></span>
                          <select
                            className="form-control"
                            value={form.state_id}
                            onChange={(e) => setField("state_id", e.target.value)}
                            required
                            disabled={statesLoading}
                          >
                            <option value="">
                              {statesLoading ? "Loading states..." : "Select state"}
                            </option>
                            {states.map((st) => (
                              <option key={st._id} value={st._id}>
                                {st.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>From <span className="required">*</span></label>
                        <div className="input-icon-wrap">
                          <span className="input-icon"><Calendar size={18} /></span>
                          <DatePicker
                            selected={form.address_from}
                            onChange={(date) => setField("address_from", date)}
                            dateFormat="MM/dd/yyyy"
                            className="form-control"
                            placeholderText="MM/DD/YYYY"
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="select"
                            maxDate={form.address_to && form.address_to < today ? form.address_to : today}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>To <span className="required">*</span></label>
                        <div className="input-icon-wrap">
                          <span className="input-icon"><Calendar size={18} /></span>
                          <DatePicker
                            selected={form.address_to}
                            onChange={(date) => setField("address_to", date)}
                            dateFormat="MM/dd/yyyy"
                            className="form-control"
                            placeholderText="MM/DD/YYYY"
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="select"
                            minDate={form.address_from || undefined}
                            maxDate={today}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-actions" style={{ marginTop: "1.5rem" }}>
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          className="btn-cancel"
                          onClick={closeForm}
                          style={{ marginRight: "0.75rem" }}
                        >
                          Cancel
                        </button>
                      )}
                      <button type="submit" className="btn-save" disabled={saving}>
                        {saving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Saving...
                          </>
                        ) : editId ? (
                          "Update"
                        ) : (
                          "Save & Continue"
                        )}
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

export default AddressInTaxYear;