import { useState, useEffect, useRef } from "react";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import {
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  Mail,
  Plus,
  Send,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import "../styles/ReferFriend.css";
import { URLS, buildReferralLink } from "../url";
import { buildMailtoUrl, scheduleMailFallback } from "../utils/mail";

// Maximum number of friend sections that can be added in one session
const MAX_FRIENDS = 10;

// Validation rules (email / mobile match the Register component)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const mobileRegex = /^\d{10}$/;

const SHARE_TEXT = "Join Dollar Tax Filer and we both get $10. Register here:";
const MAIL_SUBJECT = "You are invited to Dollar Tax Filer";

// Invite message reused by every share channel.
// The referral URL sits on its own line so chat apps (WhatsApp, Telegram, SMS)
// detect the URL boundary and render it as a clickable link instead of plain
// text squeezed behind the sentence.
const buildInviteText = (link) => `${SHARE_TEXT}\n${link}`;

// Brand glyphs. Lucide ships no WhatsApp mark (a generic chat bubble reads as
// "message", not WhatsApp) and no official Instagram mark either, so both use
// the real brand paths rendered in the current icon colour.
const WhatsAppIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const InstagramIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0Zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.9.423.423.682.819.9 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.423-.824.682-1.38.9-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03Zm0 3.678a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm7.846-10.405a1.441 1.441 0 0 1-2.88 0 1.441 1.441 0 0 1 2.88 0Z" />
  </svg>
);

// Instagram has no web share endpoint. On touch devices the native share sheet
// is used (Instagram is listed there); on desktop there is nothing to hand off
// to, so the invite is copied and instagram.com is opened for a story/DM paste.
const nativeShareAvailable = () =>
  typeof navigator !== 'undefined' &&
  typeof navigator.share === 'function' &&
  typeof window !== 'undefined' &&
  window.matchMedia('(pointer: coarse)').matches;

// Share targets opened from the "Or share on" chips
const SHARE_OPTIONS = [
  {
    key: "whatsapp",
    // label: "WhatsApp",
    icon: <WhatsAppIcon />,
    buildHref: (link) => `https://wa.me/?text=${encodeURIComponent(buildInviteText(link))}`,
    external: true,
  },
  {
    key: "facebook",
    // label: "Facebook",
    icon: <span className="refer-share-letter">f</span>,
    buildHref: (link) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
    external: true,
  },
  {
    key: "instagram",
    // label: "Instagram",
    icon: <InstagramIcon />,
    // No share intent exists; the handler below copies the invite and opens the
    // site, or hands the invite to the native share sheet on touch devices.
    buildHref: () => "https://www.instagram.com/",
    external: true,
  },
  {
    key: "x",
    // label: "X",
    icon: <X size={13} />,
    buildHref: (link) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}&text=${encodeURIComponent(SHARE_TEXT)}`,
    external: true,
  },
  {
    key: "linkedin",
    // label: "LinkedIn",
    icon: <span className="refer-share-letter refer-share-letter--small">in</span>,
    buildHref: (link) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
    external: true,
  },
  {
    key: "telegram",
    // label: "Telegram",
    icon: <Send size={13} />,
    buildHref: (link) =>
      `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(SHARE_TEXT)}`,
    external: true,
  },
  {
    key: "email",
    // label: "Email",
    icon: <Mail size={13} />,
    buildHref: (link, to) =>
      buildMailtoUrl({ to, subject: MAIL_SUBJECT, body: buildInviteText(link) }),
    external: false,
  },
];

const TERMS = [
  "The referrer can utilize their referral bonus for bill payments or opt for cash redemption after the 15th of April only.",
  "Referrals can apply their earned credit towards bill payments.",
  "Referral credits and bonuses are valid upon the service usage of the referred client.",
  "The referrers can track their friend's status in real time from client portal.",
  "One must first register and then start referring the friends.",
  "Refer more, earn more. No limits",
  'The referral program is exclusively applicable to those referred through the "Refer a Friend" page and is not valid for oral references.',
];

const getAuthToken = () => {
  const keys = ['authToken', 'token', 'adminToken', 'accessToken', 'jwt'];
  for (const key of keys) {
    const value = sessionStorage.getItem(key) || localStorage.getItem(key);
    if (value) return value;
  }
  return null;
};

// Creates a blank friend entry with a stable id
const createFriendEntry = (id) => ({
  id,
  friendName: "",
  friendEmail: "",
  friendMobile: "",
});

// Clipboard fallback for browsers/contexts where navigator.clipboard is unavailable
const fallbackCopyToClipboard = (text) => {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!copied) throw new Error("Copy command failed");
};

const ReferFriend = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  // Friend entries – ids come from a counter, never from the array index
  const friendIdRef = useRef(1);
  const [friends, setFriends] = useState(() => [createFriendEntry(1)]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Referral code / link state
  const [referralCode, setReferralCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(true);
  const [codeError, setCodeError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  // Compose URL shown when the browser blocks the fallback mail window
  const [blockedComposeUrl, setBlockedComposeUrl] = useState('');

  const navigateTimerRef = useRef(null);
  const copyTimerRef = useRef(null);
  const emailFallbackTimerRef = useRef(null);
  // Keeps the referral code request to one call per visit
  const referralFetchRef = useRef(false);

  // Clear pending timers when the page unmounts
  useEffect(() => {
    return () => {
      if (navigateTimerRef.current) clearTimeout(navigateTimerRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      if (emailFallbackTimerRef.current) clearTimeout(emailFallbackTimerRef.current);
    };
  }, []);

  const handleBack = () => {
    navigate("/dashboard/referrals");
  };

  // Next stable id for a new friend section
  const nextFriendId = () => {
    friendIdRef.current += 1;
    return friendIdRef.current;
  };

  // Fetch the logged-in user's referral code on mount
  useEffect(() => {
    if (referralFetchRef.current) return undefined;
    referralFetchRef.current = true;
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

  // Dynamic referral registration link. url.jsx resolves the share base: a
  // configured public domain is used as is, an IP hosted panel is addressed
  // through its sslip.io name so the invite stays clickable.
  const referralLink = referralCode ? buildReferralLink(referralCode) : '';

  // Pre-fill the mail recipient when the user already typed a friend's email
  const emailRecipient =
    friends
      .map((friend) => friend.friendEmail.trim())
      .find((email) => emailRegex.test(email)) || '';

  // The anchor opens the desktop client; if no handler is registered the page
  // keeps focus and the same invite opens in a web compose window instead.
  const handleEmailShare = () => {
    if (!referralLink) return;
    setBlockedComposeUrl('');
    if (emailFallbackTimerRef.current) clearTimeout(emailFallbackTimerRef.current);
    emailFallbackTimerRef.current = scheduleMailFallback(
      {
        to: emailRecipient,
        subject: MAIL_SUBJECT,
        body: buildInviteText(referralLink),
      },
      undefined,
      setBlockedComposeUrl
    );
  };

  const handleCopyLink = async () => {
    if (!referralLink) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(referralLink);
      } else {
        fallbackCopyToClipboard(referralLink);
      }
      setCopyStatus('success');
    } catch {
      try {
        fallbackCopyToClipboard(referralLink);
        setCopyStatus('success');
      } catch {
        setCopyStatus('error');
      }
    }
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopyStatus(''), 2500);
  };

  // Instagram cannot be pre-filled from a web link, so the invite is handed to
  // the native share sheet where available (touch devices) and otherwise copied
  // while the anchor opens instagram.com for a story or direct-message paste.
  const handleInstagramShare = (event) => {
    if (!referralLink) return;
    if (nativeShareAvailable()) {
      event.preventDefault();
      navigator
        .share({ title: MAIL_SUBJECT, text: buildInviteText(referralLink) })
        .catch((err) => {
          // A cancelled share sheet is not a failure; anything else falls back to
          // copying so the invite is never lost.
          if (err?.name !== 'AbortError') handleCopyLink();
        });
      return;
    }
    handleCopyLink();
  };

  const handleAddFriend = () => {
    if (friends.length >= MAX_FRIENDS) return;
    const newFriend = createFriendEntry(nextFriendId());
    setFriends((prev) => (prev.length >= MAX_FRIENDS ? prev : [...prev, newFriend]));
    setError('');
    setSuccess('');
  };

  const handleRemoveFriend = (id) => {
    setFriends((prev) => {
      // Always keep at least one section on the page
      if (prev.length <= 1) return prev;
      return prev.filter((friend) => friend.id !== id);
    });
    setFieldErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setError('');
    setSuccess('');
  };

  const handleFriendChange = (id, field, value) => {
    setFriends((prev) =>
      prev.map((friend) => (friend.id === id ? { ...friend, [field]: value } : friend))
    );
    setFieldErrors((prev) => {
      if (!prev[id]?.[field]) return prev;
      const next = { ...prev, [id]: { ...prev[id] } };
      delete next[id][field];
      if (Object.keys(next[id]).length === 0) delete next[id];
      return next;
    });
    if (error) setError('');
    if (success) setSuccess('');
  };

  // Validates every friend section independently
  const validateFriends = () => {
    const errors = {};
    const entries = [];
    const seenEmails = new Map();
    const isOnlyEntry = friends.length === 1;

    friends.forEach((friend) => {
      const name = friend.friendName.trim();
      const email = friend.friendEmail.trim();
      const mobile = friend.friendMobile.trim();
      const isBlank = !name && !email && !mobile;

      // Completely empty extra sections are skipped instead of submitted
      if (isBlank && !isOnlyEntry) return;

      const entryErrors = {};
      if (!name) {
        entryErrors.friendName = "Friend's name is required.";
      }
      if (!email) {
        entryErrors.friendEmail = "Friend's email is required.";
      } else if (!emailRegex.test(email)) {
        entryErrors.friendEmail = "Enter a valid email address.";
      } else if (seenEmails.has(email.toLowerCase())) {
        entryErrors.friendEmail = "This email has already been added.";
      }
      if (!mobile) {
        entryErrors.friendMobile = "Friend's mobile number is required.";
      } else if (!mobileRegex.test(mobile)) {
        entryErrors.friendMobile = "Enter a valid 10-digit mobile number.";
      }

      if (email && !entryErrors.friendEmail) seenEmails.set(email.toLowerCase(), friend.id);

      if (Object.keys(entryErrors).length > 0) {
        errors[friend.id] = entryErrors;
      } else {
        entries.push({
          id: friend.id,
          friend_name: name,
          friend_email: email,
          friend_mobile: mobile,
        });
      }
    });

    return { errors, entries };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const { errors, entries } = validateFriends();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix the highlighted fields before submitting.');
      setSuccess('');
      return;
    }
    if (entries.length === 0) {
      setError("Please enter at least one friend's details.");
      setSuccess('');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setError('Authentication required. Please log in.');
      return;
    }

    setError('');
    setSuccess('');
    setFieldErrors({});
    setLoading(true);

    const total = entries.length;
    // The endpoint accepts all friends in one request as a `friends` array
    const payload = {
      friends: entries.map((entry) => ({
        friend_name: entry.friend_name,
        friend_email: entry.friend_email,
        friend_mobile: entry.friend_mobile,
      })),
    };

    try {
      const response = await fetch(URLS.ReferFriend, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        setError('Session expired. Please log in again. No referrals were sent.');
        return;
      }

      let result = null;
      try {
        result = await response.json();
      } catch {
        result = null;
      }

      // A 2xx response without an explicit `success: false` counts as accepted
      if (response.ok && result?.success !== false) {
        setSuccess(
          result?.message ||
            (total === 1
              ? 'Friend referred successfully!'
              : `${total} referrals sent successfully!`)
        );
        // Every submitted friend was accepted, so reset to one empty section
        setFriends([createFriendEntry(nextFriendId())]);
        if (navigateTimerRef.current) clearTimeout(navigateTimerRef.current);
        navigateTimerRef.current = setTimeout(() => {
          navigate('/dashboard/referrals');
        }, 2000);
      } else {
        setError(
          result?.message ||
            `Could not send the referrals (error ${response.status}). Please try again.`
        );
      }
    } catch {
      setError('Network error occurred while sending the referrals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (navigateTimerRef.current) {
      clearTimeout(navigateTimerRef.current);
      navigateTimerRef.current = null;
    }
    setFriends([createFriendEntry(nextFriendId())]);
    setFieldErrors({});
    setError('');
    setSuccess('');
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
            {/* Left Side - Info (unchanged) */}
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
                    {TERMS.map((term) => (
                      <li key={term}>{term}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            {/* Right Side - Referral link + friends form */}
            <div className="refer-form-section">
              {/* Referral ticket */}
              <section className="refer-ticket">
                <div className="refer-ticket-main">
                  {codeLoading ? (
                    <div className="refer-ticket-state">
                      <Loader2 size={18} className="refer-spin" />
                      Fetching your referral code...
                    </div>
                  ) : codeError ? (
                    <div className="refer-ticket-error">{codeError}</div>
                  ) : (
                    <>
                      <span className="refer-ticket-label">Your referral code</span>
                      <div className="refer-ticket-code">{referralCode}</div>

                      <div className="refer-ticket-link-row">
                        <input
                          type="text"
                          className="refer-ticket-link"
                          value={referralLink}
                          readOnly
                          onFocus={(e) => e.target.select()}
                          aria-label="Your referral registration link"
                        />
                        <button
                          type="button"
                          className={`refer-copy-btn${copyStatus === 'success' ? ' is-copied' : ''}`}
                          onClick={handleCopyLink}
                          disabled={!referralLink || loading}
                        >
                          {copyStatus === 'success' ? <Check size={16} /> : <Copy size={16} />}
                          {copyStatus === 'success' ? 'Copied' : 'Copy link'}
                        </button>
                      </div>

                      {copyStatus === 'success' && (
                        <span className="refer-copy-msg refer-copy-msg--success">
                          Referral link copied. Share it with your friend.
                        </span>
                      )}
                      {copyStatus === 'error' && (
                        <span className="refer-copy-msg refer-copy-msg--error">
                          Could not copy automatically. Please select the link and copy it manually.
                        </span>
                      )}

                      {blockedComposeUrl && (
                        <span className="refer-copy-msg refer-copy-msg--error">
                          Your browser blocked the mail window.{' '}
                          <a
                            className="refer-inline-link"
                            href={blockedComposeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open the email draft
                          </a>
                        </span>
                      )}

                      <span className="refer-ticket-label refer-ticket-share-label">Or share on</span>
                      <div className="refer-share-chips">
                        {SHARE_OPTIONS.map((option) => {
                          const disabled = !referralLink;
                          const icon = (
                            <span className={`refer-share-icon refer-share-icon--${option.key}`}>
                              {option.icon}
                            </span>
                          );

                          if (disabled) {
                            return (
                              <button
                                type="button"
                                key={option.key}
                                className="refer-share-chip is-disabled"
                                disabled
                              >
                                {icon}
                                {option.label}
                              </button>
                            );
                          }

                          return (
                            <a
                              key={option.key}
                              className="refer-share-chip"
                              href={option.buildHref(referralLink, emailRecipient)}
                              onClick={
                                option.key === 'email'
                                  ? handleEmailShare
                                  : option.key === 'instagram'
                                    ? handleInstagramShare
                                    : undefined
                              }
                              target={option.external ? '_blank' : undefined}
                              rel={option.external ? 'noopener noreferrer' : undefined}
                            >
                              {icon}
                              {option.label}
                            </a>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* Friends being referred */}
              <section className="refer-friends-card">
                <div className="refer-friends-header">
                  <h2 className="refer-friends-title">Friends you're referring</h2>
                  <button
                    type="button"
                    className="refer-add-btn"
                    onClick={handleAddFriend}
                    disabled={loading || friends.length >= MAX_FRIENDS}
                    title={
                      friends.length >= MAX_FRIENDS
                        ? `You can add up to ${MAX_FRIENDS} friends at a time.`
                        : 'Add another friend'
                    }
                  >
                    <Plus size={15} />
                    Add friend
                  </button>
                </div>

                {error && <div className="refer-alert refer-alert--error">{error}</div>}
                {success && <div className="refer-alert refer-alert--success">{success}</div>}

                <form onSubmit={handleSubmit} noValidate>
                  {friends.map((friend, index) => {
                    const entryErrors = fieldErrors[friend.id] || {};
                    return (
                      <div className="refer-friend-block" key={friend.id}>
                        <div className="refer-friend-head">
                          <h3 className="refer-friend-title">Friend {index + 1}</h3>
                          {friends.length > 1 && (
                            <button
                              type="button"
                              className="refer-remove-btn"
                              onClick={() => handleRemoveFriend(friend.id)}
                              disabled={loading}
                              title={`Remove friend ${index + 1}`}
                            >
                              <X size={15} />
                            </button>
                          )}
                        </div>

                        <div className="refer-field">
                          <label className="refer-field-label" htmlFor={`refer-name-${friend.id}`}>
                            Name
                          </label>
                          <input
                            id={`refer-name-${friend.id}`}
                            type="text"
                            className={`refer-input${entryErrors.friendName ? ' is-invalid' : ''}`}
                            placeholder="Friend's full name"
                            value={friend.friendName}
                            onChange={(e) => handleFriendChange(friend.id, 'friendName', e.target.value)}
                            disabled={loading}
                          />
                          {entryErrors.friendName && (
                            <span className="refer-error-text">{entryErrors.friendName}</span>
                          )}
                        </div>

                        <div className="refer-grid-2">
                          <div className="refer-field">
                            <label className="refer-field-label" htmlFor={`refer-email-${friend.id}`}>
                              Email
                            </label>
                            <input
                              id={`refer-email-${friend.id}`}
                              type="email"
                              className={`refer-input${entryErrors.friendEmail ? ' is-invalid' : ''}`}
                              placeholder="name@example.com"
                              value={friend.friendEmail}
                              onChange={(e) => handleFriendChange(friend.id, 'friendEmail', e.target.value)}
                              disabled={loading}
                            />
                            {entryErrors.friendEmail && (
                              <span className="refer-error-text">{entryErrors.friendEmail}</span>
                            )}
                          </div>

                          <div className="refer-field">
                            <label className="refer-field-label" htmlFor={`refer-mobile-${friend.id}`}>
                              Mobile
                            </label>
                            <input
                              id={`refer-mobile-${friend.id}`}
                              type="tel"
                              inputMode="numeric"
                              maxLength={10}
                              className={`refer-input${entryErrors.friendMobile ? ' is-invalid' : ''}`}
                              placeholder="555 000 0000"
                              value={friend.friendMobile}
                              onChange={(e) =>
                                handleFriendChange(
                                  friend.id,
                                  'friendMobile',
                                  e.target.value.replace(/\D/g, '').slice(0, 10)
                                )
                              }
                              disabled={loading}
                            />
                            {entryErrors.friendMobile && (
                              <span className="refer-error-text">{entryErrors.friendMobile}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="refer-actions">
                    <button type="submit" className="refer-save-btn" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 size={18} className="refer-spin" />
                          Sending...
                        </>
                      ) : (
                        'Save referrals'
                      )}
                    </button>
                    <button
                      type="button"
                      className="refer-reset-btn"
                      onClick={handleReset}
                      disabled={loading}
                    >
                      Reset
                    </button>
                  </div>
                </form>
              </section>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
};

export default ReferFriend;
