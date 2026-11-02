import React, { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import { Users, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import { URLS } from "../url";

// Helper to get token
const getAuthToken = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token not found. Please log in.');
  }
  return token;
};

const ReferDetails = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const [referrals, setReferrals] = useState([]);
  const [summary, setSummary] = useState({ total: 0, paid: 0, balance: 0 });
  const [pagination, setPagination] = useState({ currentPage: 1, limit: 10, totalRecords: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleReferFriend = () => {
    navigate("/referrals/refer-friend");
  };

  const fetchReferrals = async (page = 1, limit = 10, search = null) => {
    setLoading(true);
    setError('');
    try {
      const token = getAuthToken(); // inline, no import
      const url = `${URLS.GetReferrals}?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        setError('Session expired. Please log in again.');
        return;
      }

      const result = await response.json();
      if (result.success) {
        setReferrals(result.data || []);
        setSummary(result.summary || { total: 0, paid: 0, balance: 0 });
        setPagination(result.pagination || { currentPage: 1, limit: 10, totalRecords: 0, totalPages: 0 });
      } else {
        setError(result.message || 'Failed to fetch referrals.');
      }
    } catch (err) {
      if (err.message === 'Authentication token not found. Please log in.') {
        setError('Please log in to view referrals.');
      } else {
        setError(err.message || 'Network error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  // Helper to safely get year name from object or string
  const getYearName = (year) => {
    if (!year) return '—';
    if (typeof year === 'string') return year;
    if (typeof year === 'object' && year.name) return year.name;
    return '—';
  };

  const getStatus = (status) => {
    if (!status) return '—';
    if (typeof status === 'string') return status;
    if (typeof status === 'object' && status.name) return status.name;
    return '—';
  };

  // Sidebar responsiveness
  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth > 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="dashboard-container">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <main className="main-content">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <div className="breadcrumb">
          <a href="/dashboard">Home</a>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">Referrals Details</span>
        </div>

        {/* Summary Cards */}
        <div className="summary-wrapper">
        <div className="referral-summary-cards">
          <div className="summary-card-item">
            <div className="summary-label">TOTAL</div>
            <div className="summary-value">${(summary.total || 0).toFixed(2)}</div>
          </div>
          <div className="summary-card-item">
            <div className="summary-label">PAID</div>
            <div className="summary-value">${(summary.paid || 0).toFixed(2)}</div>
          </div>
          <div className="summary-card-item">
            <div className="summary-label">Referral Bonus</div>
            <div className="summary-value">${(summary.balance || 0).toFixed(2)}</div>
          </div>
        </div>
        </div>

        {/* Content */}
        <div className="form-container">
          <div className="form-card">
            <div className="referral-header-section">
              <h3 className="form-title">Referrals Details</h3>
              <button className="btn-refer-friend-action" onClick={handleReferFriend}>
                <Users size={18} />
                Refer Your Friend
              </button>
            </div>

            {/* Table */}
            <div className="table-card" style={{ marginTop: '2rem' }}>
              <div className="table-container">
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <Loader2 size={24} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    <p>Loading referrals...</p>
                  </div>
                ) : error ? (
                  <div style={{ color: '#dc3545', padding: '1rem', textAlign: 'center' }}>{error}</div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>S.NO</th>
                        <th>NAME</th>
                        <th>E-MAIL</th>
                        <th>YEAR</th>
                        <th>STATUS</th>
                        <th>AMOUNT</th>
                        <th>DATE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referrals.length > 0 ? (
                        referrals.map((ref, index) => (
                          <tr key={ref._id || index}>
                            <td>{index + 1}</td>
                            <td>{ref.friend_name || '—'}</td>
                            <td>{ref.friend_email || '—'}</td>
                            <td>{getYearName(ref.year_id || ref.year)}</td>
                            <td>
                              <span style={{
                                color: getStatus(ref.status) === 'Registered' ? '#28a745' : '#856404',
                                fontWeight: getStatus(ref.status) === 'Registered' ? 'bold' : 'normal'
                              }}>
                                {getStatus(ref.status)}
                              </span>
                            </td>
                            <td>${(ref.amount || 0).toFixed(2)}</td>
                            <td>{ref.createdAt ? new Date(ref.createdAt).toLocaleDateString() : '—'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr className="no-data">
                          <td colSpan="7" style={{ textAlign: 'left', padding: '2rem' }}>
                            No records found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
};

export default ReferDetails;