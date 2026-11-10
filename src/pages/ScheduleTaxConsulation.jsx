import React, { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  CalendarPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { URLS } from "../url";
import { getStoredUser } from "../utils/user";
import "../styles/Dashboard.css";

const ScheduleTaxConsultation = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [consultationDate, setConsultationDate] = useState(null);
  const [timeSlotId, setTimeSlotId] = useState("");
  const [timeSlots, setTimeSlots] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();

  /* ── 1. Fetch Time Slots ─────────────────────────────────────────── */
  const fetchTimeSlots = async () => {
    setLoadingSlots(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(URLS.GetTimeSlote, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTimeSlots(data.data);
      }
    } catch (err) {
      console.error("Error fetching time slots:", err);
    } finally {
      setLoadingSlots(false);
    }
  };

  /* ── 2. Fetch Existing Schedule ──────────────────────────────────── */
  const fetchSchedule = async () => {
    setLoadingSchedule(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(URLS.GetScheduleTaxNote, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && data.data) {
        const scheduleList = Array.isArray(data.data) ? data.data : [data.data];
        setSchedules(scheduleList);

        if (scheduleList.length > 0) {
          try {
            localStorage.setItem("consultation_scheduled", "true");
          } catch (_) {}
        }

        // Pre-fill form with the latest schedule
        if (scheduleList.length > 0) {
          const latest = scheduleList[0];
          if (latest.consultation_date) {
            setConsultationDate(new Date(latest.consultation_date));
          }
          if (latest.time_slot_id) {
            const slotId =
              typeof latest.time_slot_id === "object"
                ? latest.time_slot_id._id
                : latest.time_slot_id;
            setTimeSlotId(slotId);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching schedule:", err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Handle responsive sidebar
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

  // Fetch time slots and existing schedule on mount
  useEffect(() => {
    fetchTimeSlots();
    fetchSchedule();
  }, []);

  /* ── Format Date to YYYY-MM-DD ────────────────────────────────── */
  const formatDateToYYYYMMDD = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  /* ── 3. Schedule Tax Consultation ─────────────────────────────── */
  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!consultationDate) {
      setError("Please choose a consultation date.");
      return;
    }
    if (!timeSlotId) {
      setError("Please select a time slot.");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const dateStr = formatDateToYYYYMMDD(consultationDate);
      const body = { consultation_date: dateStr, time_slot_id: timeSlotId };

      const res = await fetch(URLS.ScheduleTaxNote, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        setShowForm(false);
        try {
          localStorage.setItem("consultation_scheduled", "true");
        } catch (_) {}
        fetchSchedule();

        // Immediately fetch updated profile to get new file_status
        try {
          const profileRes = await fetch(URLS.GetProfile, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          if (profileRes.ok) {
            const pData = await profileRes.json();
            if (pData.success && pData.data) {
              const stored = getStoredUser() || {};
              const updated = {
                ...stored,
                ...pData.data,
              };
              localStorage.setItem("user", JSON.stringify(updated));
            }
          }
        } catch (_) {}

        window.dispatchEvent(new Event("user-updated"));
      } else {
        setError(data.message || "Failed to schedule consultation.");
      }
    } catch (err) {
      console.error("Error scheduling consultation:", err);
      setError("Network error while scheduling consultation.");
    } finally {
      setSaving(false);
    }
  };

  // Helper to find slot display text by ID
  const getSlotText = (slotIdOrObj) => {
    if (slotIdOrObj && typeof slotIdOrObj === "object" && slotIdOrObj.slot) {
      return slotIdOrObj.slot;
    }
    const match = timeSlots.find((s) => s._id === slotIdOrObj);
    return match ? match.slot : "—";
  };

  return (
    <div className="dashboard-container">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <main className="main-content">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Breadcrumb */}
        <div className="breadcrumb">
          <a href="/dashboard">Home</a>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">Schedule Tax Consultation</span>
        </div>

        <div className="form-container" style={{ width: "100%" }}>

          {/* ── Collapsible Schedule Form Card ───────────────────────────── */}
          {showForm && (
            <div
              className="form-card"
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                padding: "1.75rem 2rem",
                marginBottom: "1.5rem",
                boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.75rem 1rem",
                  marginBottom: "1.25rem",
                }}
              >
                <h3 className="form-title" style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
                  Schedule New Consultation
                </h3>
              </div>

              {/* Form Alerts */}
              {successMsg && (
                <div
                  className="alert alert-success py-2 px-3 mb-3"
                  style={{ fontSize: "0.875rem", borderRadius: "8px" }}
                >
                  {successMsg}
                </div>
              )}
              {error && (
                <div
                  className="alert alert-danger py-2 px-3 mb-3"
                  style={{ fontSize: "0.875rem", borderRadius: "8px" }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSave}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "1.5rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  {/* Choose Date */}
                  <div className="form-group">
                    <label
                      style={{
                        fontWeight: 600,
                        color: "#1e293b",
                        marginBottom: "0.5rem",
                        display: "block",
                      }}
                    >
                      Choose Date <span style={{ color: "#e63946" }}>*</span>
                    </label>
                    <DatePicker
                      selected={consultationDate}
                      onChange={(date) => {
                        setConsultationDate(date);
                        if (error) setError("");
                      }}
                      dateFormat="MM/dd/yyyy"
                      className="form-control"
                      placeholderText="Select date"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      minDate={new Date()}
                      disabled={saving}
                    />
                  </div>

                  {/* Time Slot */}
                  <div className="form-group">
                    <label
                      style={{
                        fontWeight: 600,
                        color: "#1e293b",
                        marginBottom: "0.5rem",
                        display: "block",
                      }}
                    >
                      Time Slot <span style={{ color: "#e63946" }}>*</span>
                    </label>
                    <select
                      className="form-control"
                      value={timeSlotId}
                      onChange={(e) => {
                        setTimeSlotId(e.target.value);
                        if (error) setError("");
                      }}
                      disabled={loadingSlots || saving}
                    >
                      <option value="">
                        {loadingSlots ? "Loading time slots..." : "-- Select Time Slot --"}
                      </option>
                      {timeSlots.map((ts) => (
                        <option key={ts._id} value={ts._id}>
                          {ts.slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Form Buttons */}
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setError("");
                      setSuccessMsg("");
                    }}
                    style={{
                      padding: "0.55rem 1.25rem",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#f8fafc",
                      color: "#475569",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-upload"
                    disabled={saving}
                    style={{
                      padding: "0.55rem 1.5rem",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: saving ? "not-allowed" : "pointer",
                      maxWidth: "100%",
                    }}
                  >
                    {saving ? (
                      <>
                        <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CalendarPlus size={16} />
                        Save Schedule
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Schedules List Card (Primary / Always Visible) ──────────── */}
          <div
            className="form-card"
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "1.75rem 2rem",
              boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
              border: "1px solid #e2e8f0",
              width: "100%",
            }}
          >
            {/* Card Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.75rem 1rem",
                marginBottom: "1.5rem",
                width: "100%",
              }}
            >
              <h3 className="form-title" style={{ margin: 0, fontSize: "1.35rem", fontWeight: 700 }}>
                Scheduled Consultations ({schedules.length})
              </h3>
              <button
                onClick={() => {
                  setShowForm((prev) => !prev);
                  setError("");
                  setSuccessMsg("");
                }}
                className="btn-upload"
                style={{
                  padding: "0.55rem 1.25rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  borderRadius: "8px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                  maxWidth: "100%",
                }}
              >
                {showForm ? (
                  <>
                    <X size={16} /> Close Form
                  </>
                ) : (
                  <>
                    <CalendarPlus size={16} /> + Schedule Consultation
                  </>
                )}
              </button>
            </div>

            {/* Global Alerts (when form is closed) */}
            {!showForm && successMsg && (
              <div
                className="alert alert-success py-2 px-3 mb-3 d-flex align-items-center justify-content-between"
                style={{ fontSize: "0.875rem", borderRadius: "8px" }}
              >
                <span>{successMsg}</span>
                <X size={16} style={{ cursor: "pointer" }} onClick={() => setSuccessMsg("")} />
              </div>
            )}
            {!showForm && error && (
              <div
                className="alert alert-danger py-2 px-3 mb-3 d-flex align-items-center justify-content-between"
                style={{ fontSize: "0.875rem", borderRadius: "8px" }}
              >
                <span>{error}</span>
                <X size={16} style={{ cursor: "pointer" }} onClick={() => setError("")} />
              </div>
            )}

            {/* Table Content */}
            {loadingSchedule ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#64748b" }}>
                <Loader2
                  size={28}
                  style={{
                    animation: "spin 1s linear infinite",
                    marginBottom: "0.75rem",
                    color: "#2563eb",
                    display: "block",
                    margin: "0 auto 0.75rem",
                  }}
                />
                <p style={{ margin: 0, fontSize: "0.9rem" }}>Loading schedules...</p>
              </div>
            ) : schedules.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "3.5rem 1rem",
                  backgroundColor: "#f8fafc",
                  borderRadius: "10px",
                  border: "2px dashed #cbd5e1",
                }}
              >
                <Calendar size={40} style={{ color: "#94a3b8", marginBottom: "0.5rem" }} />
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.95rem" }}>
                  No consultations scheduled yet. Click "+ Schedule Consultation" above to get started.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: "#f8fafc",
                        borderBottom: "2px solid #e2e8f0",
                        textAlign: "left",
                      }}
                    >
                      <th style={{ padding: "0.85rem 1rem", color: "#475569", fontWeight: 600 }}>
                        S.No
                      </th>
                      <th style={{ padding: "0.85rem 1rem", color: "#475569", fontWeight: 600 }}>
                        Consultation Date
                      </th>
                      <th style={{ padding: "0.85rem 1rem", color: "#475569", fontWeight: 600 }}>
                        Time Slot
                      </th>
                      <th style={{ padding: "0.85rem 1rem", color: "#475569", fontWeight: 600 }}>
                        Status
                      </th>
                      <th style={{ padding: "0.85rem 1rem", color: "#475569", fontWeight: 600 }}>
                        Scheduled On
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((sch, idx) => (
                      <tr
                        key={sch._id || idx}
                        style={{ borderBottom: "1px solid #f1f5f9" }}
                      >
                        <td style={{ padding: "0.85rem 1rem", color: "#64748b" }}>{idx + 1}</td>
                        <td style={{ padding: "0.85rem 1rem", fontWeight: 500 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Calendar size={15} style={{ color: "#2563eb" }} />
                            <span>
                              {sch.consultation_date
                                ? new Date(sch.consultation_date).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })
                                : "N/A"}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "0.85rem 1rem", color: "#0f172a", fontWeight: 500 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Clock size={15} style={{ color: "#2563eb" }} />
                            <span>{getSlotText(sch.time_slot_id)}</span>
                          </div>
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <span
                            style={{
                              backgroundColor: "#e0e7ff",
                              color: "#1D2347",
                              padding: "0.25rem 0.75rem",
                              borderRadius: "20px",
                              fontSize: "0.82rem",
                              fontWeight: 600,
                            }}
                          >
                            {sch.status || "Scheduled"}
                          </span>
                        </td>
                        <td style={{ padding: "0.85rem 1rem", color: "#64748b", fontSize: "0.85rem" }}>
                          {sch.createdAt ? new Date(sch.createdAt).toLocaleDateString() : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
};

export default ScheduleTaxConsultation;
