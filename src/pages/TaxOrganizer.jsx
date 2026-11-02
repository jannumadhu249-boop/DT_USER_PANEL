import React, { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import { Download, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { URLS } from "../url";
import { getStoredUser } from "../utils/user";
import {
  getLatestSharedDocument,
  downloadSharedDocument,
} from "../utils/documentDownload";
import "../styles/Dashboard.css";

const TaxOrganizer = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      navigate("/login");
      return;
    }
    setUser(storedUser);

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
  }, [navigate]);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      // Shared Tax Organizer template uploaded by admin for all members — use document_id
      const { documentId, fileName } = await getLatestSharedDocument(
        URLS.GetTaxOrganizerDocuments,
        token
      );

      await downloadSharedDocument({
        downloadBaseUrl: URLS.DownloadTaxOrganizer,
        documentId,
        token,
        fallbackFileName:
          fileName || `Tax_Organizer_${user?.file_no || "document"}.pdf`,
      });
    } catch (err) {
      console.error("Download error:", err);
      setError(err.message || "Failed to download Tax Organizer. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

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
          <span className="breadcrumb-current">Tax Organizer</span>
        </div>

        {/* Content */}
        <div className="form-container">
          <div className="form-card">
            <h3 className="form-title">Tax Organizer</h3>

            <div className="tax-organizer-content">
              <p className="tax-organizer-text">
                Did you miss our phone call regarding to tax notes? Don't worry, fill out your tax organizer while you sip your coffee. You will receive tax estimates based on the information provided in the tax organizer.
              </p>

              {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2 mb-3" style={{ fontSize: "0.9rem", borderRadius: "8px" }}>
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div className="tax-organizer-download-section">
                <button
                  className="btn-download-fbar"
                  onClick={handleDownload}
                  disabled={downloading}
                >
                  {downloading ? (
                    <>
                      <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download size={20} />
                      Download
                    </>
                  )}
                </button>
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

export default TaxOrganizer;
