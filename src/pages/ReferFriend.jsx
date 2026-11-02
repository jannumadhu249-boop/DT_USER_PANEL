import React, { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import { URLS } from "../url";

const getAuthToken = () => {
  const keys = ['authToken', 'token', 'adminToken', 'accessToken', 'jwt'];
  for (const key of keys) {
    const value = sessionStorage.getItem(key) || localStorage.getItem(key);
    if (value) return value;
  }
};

const ReferFriend = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

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

  // Fetch referral code on mount
  useEffect(() => {
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
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    // Basic validation
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
        // Clear form
        setFriendName('');
        setFriendEmail('');
        setFriendMobile('');
        // Optionally redirect after a short delay
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
                <h2>Refer a Friend and Earn!</h2>
                <p className="refer-subtitle">Invite your friends to join us and</p>
                <h3 className="earn-text">Earn 10% of the Fee they pay</h3>
                <p className="bonus-text">as a referral bonus.</p>

                <div className="terms-section">
                  <h4>Terms and Conditions:</h4>
                  <ol className="terms-list">
                    <li>The referrer can utilize their referral bonus for bill payments or opt for cash redemption after the 15th of each cycle.</li>
                    <li>Referrals can apply their earned credit towards all payments.</li>
                    <li>Referral credits and bonuses are valid upon the service usage of the referred client.</li>
                    <li>The reference can track their friend's status in real time from client portal.</li>
                    <li>Once must first register and then start referring the friends.</li>
                    <li>Refer more, earn more, No limits</li>
                    <li>The referral program is exclusively applicable to those referred through the "Refer a Friend" page and is not valid for one references.</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="refer-form-section">
              <div className="refer-form-card">
                <h3>Your Referring Details</h3>

                {/* <div className="referring-code">
                  <p>
                    Referral Code:&nbsp;
                    {codeLoading ? (
                      <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                    ) : codeError ? (
                      <span style={{ color: '#dc3545' }}>{codeError}</span>
                    ) : (
                      <strong>{referralCode || 'Not Available'}</strong>
                    )}
                  </p>
                </div> */}

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
                  <div className="form-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Friend's Name"
                      value={friendName}
                      onChange={(e) => setFriendName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Friend's Email"
                      value={friendEmail}
                      onChange={(e) => setFriendEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="Friend's Phone Number"
                      value={friendMobile}
                      onChange={(e) => setFriendMobile(e.target.value)}
                      required
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