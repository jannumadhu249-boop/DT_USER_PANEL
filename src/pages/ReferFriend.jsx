import React, { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import { URLS } from "../url";
import { getStoredUser } from "../utils/user";

const getAuthToken = () => {
  const keys = ['authToken', 'token', 'adminToken', 'accessToken', 'jwt'];
  for (const key of keys) {
    const value = sessionStorage.getItem(key) || localStorage.getItem(key);
    if (value) return value;
  }
  return null;
};

const ReferFriend = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  // User state for prefilled fields
  const [user, setUser] = useState(() => getStoredUser() || {});

  // Form fields
  const [friendName, setFriendName] = useState('');
  const [friendEmail, setFriendEmail] = useState('');
  const [friendMobile, setFriendMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Referral code state
  const [referralCode, setReferralCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(true);
  const [codeError, setCodeError] = useState('');

  const handleBack = () => {
    navigate("/dashboard/referrals");
  };

  // Fetch user and referral code on mount
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);

    const fetchReferralCode = async () => {
      setCodeLoading(true);
      setCodeError('');
      try {
        const token = getAuthToken();
        if (!token) {
          setCodeError('Authentication required. Please log in.');
          return;
        }
        const response = await fetch(URLS.GetReferralCode, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.status === 401) {
          setCodeError('Session expired. Please log in again.');
          return;
        }
        const result = await response.json();
        if (result.success && result.data?.referral_code) {
          setReferralCode(result.data.referral_code);
        } else {
          setCodeError(result.message || 'Failed to fetch referral code.');
        }
      } catch (err) {
        console.error('Referral code fetch error:', err);
        setCodeError('Network error occurred while fetching referral code.');
      } finally {
        setCodeLoading(false);
      }
    };

    fetchReferralCode();

    const handleUserUpdated = () => {
      const u = getStoredUser();
      if (u) setUser(u);
    };
    window.addEventListener("user-updated", handleUserUpdated);
    return () => window.removeEventListener("user-updated", handleUserUpdated);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!friendName.trim() || !friendEmail.trim() || !friendMobile.trim()) {
      setError('All fields are required.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = getAuthToken();
      const payload = {
        friend_name: friendName.trim(),
        friend_email: friendEmail.trim(),
        friend_mobile: friendMobile.trim()
      };
      const response = await fetch(URLS.ReferFriend, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        setSuccess(result.message || 'Friend referred successfully!');
        setFriendName('');
        setFriendEmail('');
        setFriendMobile('');
        setTimeout(() => {
          navigate("/dashboard/referrals");
        }, 2000);
      } else {
        setError(result.message || 'Failed to refer friend.');
      }
    } catch (err) {
      setError(err.message || 'Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFriendName('');
    setFriendEmail('');
    setFriendMobile('');
    setError('');
    setSuccess('');
  };

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
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const userName =
    user?.name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.first_name ||
    "";

  const userEmail = user?.email || "";

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
          <a href="/dashboard/referrals">Refer List</a>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">Refer a Friend</span>
        </div>

        <div className="form-container" style={{ padding: '2rem' }}>
          <div className="back-button-wrapper" style={{ padding: '0 0 1.5rem 0' }}>
            <button className="btn-back" onClick={handleBack}>
              <ArrowLeft size={18} />
              Back To List
            </button>
          </div>

          <div className="refer-container">
            {/* Left Side - Info */}
            <div className="refer-info-section">
              <div className="refer-info-card">
                <h2>Refer Your Friend</h2>
                <p
                  className="refer-subtitle"
                  style={{
                    fontSize: "0.92rem",
                    lineHeight: "1.65",
                    color: "rgba(255, 255, 255, 0.9)",
                    marginBottom: "1.5rem",
                  }}
                >
                  We value each and every one of our clients and know that our continued
                  success and growth is highly driven by you, and your word of mouth. As a
                  thank you to you, Dollar Tax Filer is happy to announce a new attractive
                  referral program for all the clients, for not only meant for assisting
                  new clients but also provides benefits in cash.
                </p>

                <h3 className="earn-text" style={{ color: "#38bdf8", fontSize: "2.3rem", marginBottom: "0.35rem" }}>
                  Get $10, Give $10
                </h3>
                <p className="bonus-text" style={{ fontSize: "1.05rem", marginBottom: "2rem" }}>
                  For every friend you refer, you will get $10 – and your friend will get $10 too.
                </p>

                <div className="terms-section">
                  <h4>Terms and Conditions:</h4>
                  <ol className="terms-list">
                    <li>The referrer can utilize their referral bonus for bill payments or opt for cash redemption after the 15th of April only.</li>
                    <li>Referrals can apply their earned credit towards bill payments.</li>
                    <li>Referral credits and bonuses are valid upon the service usage of the referred client.</li>
                    <li>The referrers can track their friend's status in real time from client portal.</li>
                    <li>One must first register and then start referring the friends.</li>
                    <li>Refer more, earn more. No limits</li>
                    <li>The referral program is exclusively applicable to those referred through the "Refer a Friend" page and is not valid for oral references.</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="refer-form-section">
              <div className="refer-form-card">
                <h3>Your Referring Details</h3>

                {error && (
                  <div style={{ background: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '4px', marginBottom: '1rem' }}>
                    {error}
                  </div>
                )}
                {success && (
                  <div style={{ background: '#d4edda', color: '#155724', padding: '10px', borderRadius: '4px', marginBottom: '1rem' }}>
                    {success}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Your Name */}
                  <div className="form-group">
                    <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.88rem", fontWeight: 600, color: "#374151" }}>
                      Your Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={userName}
                      readOnly
                      disabled
                      style={{ backgroundColor: "#f3f4f6", color: "#2563eb", fontWeight: 500, cursor: "default" }}
                    />
                  </div>

                  {/* Your Email */}
                  <div className="form-group">
                    <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.88rem", fontWeight: 600, color: "#374151" }}>
                      Your Email
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      value={userEmail}
                      readOnly
                      disabled
                      style={{ backgroundColor: "#f3f4f6", color: "#2563eb", fontWeight: 500, cursor: "default" }}
                    />
                  </div>

                  {/* Friend's Name */}
                  <div className="form-group">
                    <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.88rem", fontWeight: 600, color: "#374151" }}>
                      Friend's Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Friend's name"
                      value={friendName}
                      onChange={(e) => setFriendName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  {/* Friend's Email */}
                  <div className="form-group">
                    <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.88rem", fontWeight: 600, color: "#374151" }}>
                      Friend's Email
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Friend's email"
                      value={friendEmail}
                      onChange={(e) => setFriendEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  {/* Friend's Mobile */}
                  <div className="form-group">
                    <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.88rem", fontWeight: 600, color: "#374151" }}>
                      Friend's Mobile
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="Friend's mobile"
                      value={friendMobile}
                      onChange={(e) => setFriendMobile(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="refer-form-actions">
                    <button type="submit" className="btn-save" disabled={loading}>
                      {loading ? <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> : 'Save'}
                      {loading && ' Sending...'}
                    </button>
                    <button type="button" className="btn-reset" onClick={handleReset} disabled={loading}>
                      Reset
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
};

export default ReferFriend;
