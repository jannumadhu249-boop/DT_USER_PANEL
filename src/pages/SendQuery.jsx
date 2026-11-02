import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import { useNavigate } from "react-router-dom";
import { Plus, RefreshCw, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import "../styles/Dashboard.css";
import { URLS } from "../url";
import SendQueryModal from "../Components/SendQueryModal";

const SendQuery = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  const navigate = useNavigate();

  // ── Responsive sidebar ──
  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth > 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── Fetch queries ──
  const fetchQueries = useCallback(async (pageNumber = 1, pageSize = 10) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You are not logged in.");
        setLoading(false);
        return;
      }

      const response = await fetch(URLS.GetQueries, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          page: pageNumber,
          limit: pageSize,
        }),
      });

      if (response.status === 401) {
        setError("Session expired. Please log in again.");
        return;
      }

      const data = await response.json();
      if (data.success) {
        const items = data.data || [];
        setQueries(items);
        setTotalRecords(data.totalRecords ?? items.length);
        if (data.page) setCurrentPage(data.page);
        if (data.limit) setLimit(data.limit);
      } else {
        setError(data.message || "Failed to fetch queries.");
      }
    } catch (err) {
      console.error("Fetch queries error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueries(1, 10);
  }, []);

  // ── Refresh list after sending a query ──
  const handleQuerySent = () => {
    setCurrentPage(1);
    fetchQueries(1, limit);
    setIsModalOpen(false);
  };

  const totalPages = Math.ceil(totalRecords / limit) || 1;

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      fetchQueries(newPage, limit);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime())
        ? "—"
        : d.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
    } catch {
      return "—";
    }
  };

  // const renderStatusBadge = (status) => {
  //   const s = (status || "").toLowerCase();
  //   let badgeClass = "bg-warning text-dark";
  //   if (s === "resolved" || s === "completed" || s === "answered") {
  //     badgeClass = "bg-success text-white";
  //   } else if (s === "pending") {
  //     badgeClass = "bg-warning text-dark";
  //   } else if (s === "in progress" || s === "inprogress") {
  //     badgeClass = "bg-info text-dark";
  //   } else if (s === "rejected" || s === "closed") {
  //     badgeClass = "bg-secondary text-white";
  //   }
  //   return (
  //     <span
  //       className={`badge ${badgeClass}`}
  //       style={{ padding: "5px 10px", fontSize: "0.75rem", borderRadius: "6px" }}
  //     >
  //       {status || "Pending"}
  //     </span>
  //   );
  // };

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
          <span className="breadcrumb-current">Send Query</span>
        </div>

        {/* Content */}
        <div className="form-container">
          <div className="table-card" style={{ padding: "1.5rem" }}>
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <h4 style={{ margin: 0 }}>My Queries</h4>
                {totalRecords > 0 && (
                  <span
                    className="badge bg-light text-secondary border"
                    style={{ fontSize: "0.85rem", fontWeight: 500 }}
                  >
                    {totalRecords} Total
                  </span>
                )}
              </div>
              <div className="d-flex align-items-center gap-2">
                <button
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                  onClick={() => fetchQueries(currentPage, limit)}
                  disabled={loading}
                  title="Refresh queries"
                >
                  <RefreshCw size={15} className={loading ? "spin" : ""} />
                  <span>Refresh</span>
                </button>
                <button
                  className="btn btn-primary btn-md px-3 d-flex align-items-center gap-1"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Plus size={18} />
                  <span>Send Query</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger d-flex justify-content-between align-items-center" style={{ fontSize: "0.9rem" }}>
                <span>{error}</span>
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => fetchQueries(currentPage, limit)}
                >
                  Retry
                </button>
              </div>
            )}

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <div className="text-muted mt-2" style={{ fontSize: "0.9rem" }}>
                  Fetching queries...
                </div>
              </div>
            ) : queries.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <MessageSquare size={44} style={{ opacity: 0.35, marginBottom: "12px" }} />
                <h6 style={{ fontWeight: 600, color: "#475569" }}>No queries found</h6>
                <p style={{ fontSize: "0.9rem", color: "#64748b", maxWidth: "380px", margin: "0 auto 16px" }}>
                  Have questions about your tax return or filing status? Submit a query and our team will get back to you.
                </p>
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setIsModalOpen(true)}
                >
                  + Ask a Question
                </button>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="data-table table table-striped table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>S.No</th>
                        <th style={{ minWidth: "100px" }}>Your Query</th>
                        <th style={{ minWidth: "100px" }}>Admin Reply</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {queries.map((q, index) => (
                        <tr key={q._id || index}>
                          <td style={{ fontWeight: 500 }}>
                            {q.s_no ?? ((currentPage - 1) * limit + index + 1)}
                          </td>
                          <td>
                            {q.your_query || q.message || "—"}
                          </td>
                          <td>
                            {q.admin_reply || q.reply || "-"}
                          </td>
                          <td>{q.type}</td>
                          <td>{q.status}</td>
                          <td style={{ fontSize: "0.875rem", color: "#64748b" }}>
                            {formatDate(q.date || q.createdAt)}
                          </td>
                        </tr>
                      ))} 
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top flex-wrap gap-2">
                  <div className="text-muted" style={{ fontSize: "0.85rem" }}>
                    Showing {(currentPage - 1) * limit + 1}–
                    {Math.min(currentPage * limit, totalRecords)} of {totalRecords} records
                  </div>
                  {totalPages > 1 && (
                    <div className="d-flex align-items-center gap-2">
                      <button
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                        disabled={currentPage <= 1 || loading}
                        onClick={() => handlePageChange(currentPage - 1)}
                      >
                        <ChevronLeft size={16} />
                        <span>Prev</span>
                      </button>
                      <span className="text-muted" style={{ fontSize: "0.85rem", margin: "0 4px" }}>
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                        disabled={currentPage >= totalPages || loading}
                        onClick={() => handlePageChange(currentPage + 1)}
                      >
                        <span>Next</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Modal */}
        <SendQueryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleQuerySent}
        />

        <Footer />
      </main>
    </div>
  );
};

export default SendQuery;