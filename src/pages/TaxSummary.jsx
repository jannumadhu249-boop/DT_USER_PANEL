import React, { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import { Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

const TaxSummary = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDownload = () => {
    alert("Downloading FBAR questionnaire...");
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

            <div className="fbar-content">
              <p className="fbar-text">
                Did you miss our phone call regarding to tax notes? Don't worry, fill out your tax organizer while you sip your coffee. You will receive tax estimates based on the information provided in the tax organizer.
              </p>

              <div className="fbar-download-section">
                <button className="btn-download-fbar" onClick={handleDownload}>
                  <Download size={20} />
                  Download
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

export default TaxSummary;
