import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../../Components/Sidebar";
import Header from "../../Components/Header";
import Footer from "../../Components/Footer";
import { useNavigate } from "react-router-dom";
import "../../styles/Dashboard.css";
import "../../styles/MyTaxSummary.css";
import { URLS } from "../../url";
import DocumentViewer from "./DocumentViewer";

const MyTaxSummary = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  // Data states
  const [taxSummaries, setTaxSummaries] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & search states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const limit = 10;

  // Viewer state
  const [viewerItem, setViewerItem] = useState(null);

  // Sidebar responsiveness
  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth > 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch tax summaries from API
  const fetchTaxSummaries = useCallback(async (page = 1, searchVal = "") => {
    setFetching(true);
    setError(null);
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(URLS.GetMyTaxSummary, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ page, limit, search: searchVal, year_id: "" }),
      });
      const data = await response.json();
      if (data.success) {
        setTaxSummaries(data.data || []);
        setCurrentPage(data.pagination?.currentPage || 1);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalRecords(data.pagination?.totalRecords || 0);
      } else {
        setError(data.message || "Failed to fetch tax summaries.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchTaxSummaries(currentPage, search);
  }, [fetchTaxSummaries, currentPage, search]);

  // Date formatter
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // File size formatter
  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Search handlers
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearch(searchInput);
  };

  const handleSearchClear = () => {
    setSearchInput("");
    setSearch("");
    setCurrentPage(1);
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
          <span className="breadcrumb-current">My Tax Summary</span>
        </div>

        {/* Content */}
        <div className="form-container">
          <div className="form-card">
            {/* Header Row: Title & Search */}
            <div className="ts-header-row">
              <h3 className="form-title ts-header-title">My Tax Summary</h3>

              {/* Compact Search Bar */}
              <form onSubmit={handleSearchSubmit} className="ts-search-form">
                <div className="ts-search-input-wrapper">
                  <span className="ts-search-icon">🔍</span>
                  <input
                    id="tax-summary-search"
                    type="text"
                    className="ts-search-input"
                    placeholder="Search documents…"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
                <button type="submit" className="ts-search-btn">
                  Search
                </button>
                {search && (
                  <button
                    type="button"
                    onClick={handleSearchClear}
                    className="ts-clear-btn"
                  >
                    ✕ Clear
                  </button>
                )}
              </form>
            </div>

            {/* Table */}
            <div className="table-card">
              <div className="table-container">
                {fetching ? (
                  <div className="loading-message">Loading tax summaries…</div>
                ) : error ? (
                  <div className="error-message">{error}</div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>S.NO</th>
                        <th>DOCUMENT NAME</th>
                        <th>DOCUMENT TYPE</th>
                        <th>TAX YEAR</th>
                        <th>FILE SIZE</th>
                        <th>DATE &amp; TIME</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {taxSummaries.length === 0 ? (
                        <tr className="no-data">
                          <td colSpan="7" style={{ textAlign: "left", padding: "2rem" }}>
                            No records found
                          </td>
                        </tr>
                      ) : (
                        taxSummaries.map((item, index) => (
                          <tr key={item._id}>
                            <td>{(currentPage - 1) * limit + index + 1}</td>
                            <td>{item.document_name || item.original_name}</td>
                            <td>
                              <span
                                className={`status-badge ${
                                  item.document_type === "Revised Tax Summary"
                                    ? "status-pending"
                                    : "status-approved"
                                }`}
                              >
                                {item.document_type}
                              </span>
                            </td>
                            <td>{item.year?.name || "N/A"}</td>
                            <td>{formatFileSize(item.file_size)}</td>
                            <td>{formatDate(item.createdAt)}</td>
                            <td>
                              <button
                                onClick={() => setViewerItem(item)}
                                className="ts-view-btn"
                              >
                                👁 View
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {!fetching && !error && totalPages > 1 && (
                <div className="ts-pagination-wrapper">
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage((p) => p - 1)}
                    disabled={currentPage === 1}
                  >
                    &laquo; Prev
                  </button>
                  <span className="ts-page-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next &raquo;
                  </button>
                </div>
              )}

              {/* Record count */}
              {!fetching && !error && totalRecords > 0 && (
                <div className="ts-record-count">
                  Showing {(currentPage - 1) * limit + 1}–
                  {Math.min(currentPage * limit, totalRecords)} of {totalRecords}{" "}
                  records
                </div>
              )}
            </div>
          </div>
        </div>

        <Footer />
      </main>

      {/* Separate Document Viewer Modal */}
      {viewerItem && (
        <DocumentViewer item={viewerItem} onClose={() => setViewerItem(null)} />
      )}
    </div>
  );
};

export default MyTaxSummary;
