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

const FBARQuestionnaire = () => {
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

      // Shared FBAR template uploaded by admin for all members — use document_id, not member_id
      const { documentId, fileName } = await getLatestSharedDocument(
        URLS.GetFbarDocuments,
        token
      );

      await downloadSharedDocument({
        downloadBaseUrl: URLS.DownloadFbarQuestionnaire,
        documentId,
        token,
        fallbackFileName:
          fileName || `FBAR_Questionnaire_${user?.file_no || "document"}.pdf`,
      });
    } catch (err) {
      console.error("Download error:", err);
      setError(err.message || "Failed to download FBAR questionnaire. Please try again.");
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
          <span className="breadcrumb-current">Fbar Questionnaire</span>
        </div>

        {/* Content */}
        <div className="form-container">
          <div className="form-card">
            <h3 className="form-title">Fbar Questionaire</h3>

            <div className="fbar-content">
              <p className="fbar-text">
                A United States person that has a financial interest in or signature authority over foreign financial accounts must file an FBAR if the aggregate value of the foreign financial accounts exceeds $10,000 at any time during the calendar year. Filing FBAR is a mandatory filing requirement for many 'United States Persons', including expats, who have 'Foreign Financial Accounts'.
              </p>

              <p className="fbar-text">
                Keep in mind that those filing FBAR aren't taxed on the balance of the accounts or anything of the sort–it's truly just a reporting requirement so that the IRS knows what money lies overseas
              </p>

              <p className="fbar-text">
                Please click the button below to download FBAR questionnaire and fill the document and upload it along with other tax documents
              </p>

              {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2 mb-3" style={{ fontSize: "0.9rem", borderRadius: "8px" }}>
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div className="fbar-download-section">
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

export default FBARQuestionnaire;
