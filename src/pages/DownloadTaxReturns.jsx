import React, { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import { URLS } from "../url";

const DownloadTaxReturns = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const [downloadTaxReturns, setDownloadTaxReturns] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

  // Fetch tax returns
  const fetchDownloadTaxReturns = async () => {
    setFetching(true);
    setError(null);
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(URLS.GetDownloadTaxReturn, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setDownloadTaxReturns(data.data);
      } else {
        setError(data.message || "Failed to fetch tax returns.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchDownloadTaxReturns();
  }, []);

  // Sidebar responsiveness
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

  // Format date
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  // Download handler
  const handleDownload = async (filePath, originalName) => {
    try {
      const token = localStorage.getItem("token");
      // Construct full URL (assuming URLS.BASE_URL is defined)
      const baseUrl = URLS.BASE_URL || "http://187.127.143.141:4000";
      // Normalize file path (replace backslashes with forward slashes)
      const normalizedPath = filePath.replace(/\\/g, "/");
      const downloadUrl = `${baseUrl}/${normalizedPath}`;

      const response = await fetch(downloadUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = originalName || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Download error:", error);
      alert("Could not download the file. Please try again.");
    }
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
          <span className="breadcrumb-current">Download Tax Summary</span>
        </div>

        {/* Content */}
        <div className="form-container">
          <div className="form-card">
            <h3 className="form-title">Download Tax Returns</h3>
            <p className="form-description">
              Download your E-filed copies and Review copies here
            </p>

            <div className="table-card" style={{ marginTop: "2rem" }}>
              <div className="table-container">
                {fetching ? (
                  <div className="loading-message">Loading tax returns...</div>
                ) : error ? (
                  <div className="error-message">{error}</div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>S.NO</th>
                        <th>FILES</th>
                        <th>DOWNLOAD DOCUMENT</th>
                        <th>TAX YEAR</th>
                        <th>DATE & TIME</th>
                      </tr>
                    </thead>
                    <tbody>
                      {downloadTaxReturns.length === 0 ? (
                        <tr className="no-data">
                          <td colSpan="5" style={{ textAlign: "left", padding: "2rem" }}>
                            No records found
                          </td>
                        </tr>
                      ) : (
                        downloadTaxReturns.map((item, index) => (
                          <tr key={item._id}>
                            <td>{index + 1}</td>
                            <td>{item.original_name}</td>
                            <td>
                              <button
                                className="btn btn-md btn-primary"
                                onClick={() =>
                                  handleDownload(item.file_path, item.original_name)
                                }
                              >
                                Download
                              </button>
                            </td>
                            <td>{item.year?.name || "N/A"}</td>
                            <td>{formatDate(item.createdAt)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
};

export default DownloadTaxReturns;