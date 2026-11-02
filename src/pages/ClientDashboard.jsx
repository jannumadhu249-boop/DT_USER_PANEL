import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import {
  Upload,
  FileText,
  Calendar,
  Download,
  MessageSquare,
  AlertCircle,
  Check,
  CheckCircle,
  Info,
  ArrowRight,
  Send,
  X,
  Loader2,
  ChevronRight,
  HelpCircle,
  Headphones,
  User,
} from "lucide-react";
import { getStoredUser, isEmailVerified } from "../utils/user";
import {
  FILE_STATUS_MAP,
  resolveFilingStatusInfo,
  getDetailedStageProgress,
} from "../utils/filingStatus";
import { getMediaUrlCandidates, resolveMediaUrl } from "../utils/media";
import { URLS } from "../url";
import WelcomeModal from "../Components/WelcomeModal";
import "../styles/Dashboard.css";
import "../styles/ClientDashboard.css";
import SendQueryModal from "../Components/SendQueryModal";

// Banner image component — tries all candidate URLs with fallback
const OverviewBannerImg = ({ imagePath }) => {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const candidates = useMemo(() => getMediaUrlCandidates(imagePath), [imagePath]);

  useEffect(() => {
    setCandidateIndex(0);
    setFailed(false);
  }, [imagePath]);

  if (!imagePath || !candidates.length || failed) return null;
  const src = candidates[candidateIndex];
  const safeBgUrl = encodeURI(src).replace(/"/g, '\\"');

  return (
    <div className="cd-overview-banner">
      <div className="cd-overview-banner-bg" style={{ backgroundImage: `url("${safeBgUrl}")` }} />
      <img
        src={src}
        alt="Overview & Guidelines"
        onError={() => {
          if (candidateIndex < candidates.length - 1) setCandidateIndex((p) => p + 1);
          else setFailed(true);
        }}
      />
    </div>
  );
};

const ClientDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeUserData, setWelcomeUserData] = useState(null);
  const [showPocModal, setShowPocModal] = useState(false);
  const [pocMessage, setPocMessage] = useState("");
  const [pocSending, setPocSending] = useState(false);
  const [pocSuccess, setPocSuccess] = useState("");
  const [pocError, setPocError] = useState("");
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);

  const navigate = useNavigate();

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;
      const res = await fetch(URLS.GetProfile, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        const profileData = data.data;
        const updated = { ...getStoredUser(), ...profileData };
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
        setWelcomeUserData(profileData);
        if (profileData.showWelcome === true && sessionStorage.getItem("welcome_dismissed") !== "true") {
          setShowWelcomeModal(true);
        }
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(URLS.GetDashboard, { method: "POST", headers, body: JSON.stringify({}) });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) setDashboardData(data.data);
        else if (data.data) setDashboardData(data.data);
        else if (data.success) setDashboardData(data);
      }
    } catch (err) {
      console.error("Error fetching dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadUser = () => {
      const stored = getStoredUser();
      if (!stored) { navigate("/login"); return; }
      setUser(stored);
    };
    loadUser();
    fetchDashboardData();
    fetchUserProfile();
    const handleUserUpdated = () => loadUser();
    window.addEventListener("user-updated", handleUserUpdated);
    const handleResize = () => setSidebarOpen(window.innerWidth > 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("user-updated", handleUserUpdated);
      window.removeEventListener("resize", handleResize);
    };
  }, [navigate]);

  if (!user) return null;

  const header = dashboardData?.header;
  const cards = dashboardData?.cards;

  const displayName = header?.name || dashboardData?.member?.name || user?.name || user?.first_name || "";
  const displayFileNo = header?.file_no || dashboardData?.member?.file_no || user?.file_no || "";

  const fileStatusCode = (
    header?.file_status_code ||
    (typeof header?.file_status === "string" && (FILE_STATUS_MAP[header.file_status.toUpperCase().trim()] || header.file_status.length <= 10) ? header.file_status : "") ||
    dashboardData?.file_status_code ||
    dashboardData?.file_status?.code || user?.file_status?.code || ""
  ).toUpperCase().trim();

  const fileStatusName =
    header?.file_status_name ||
    (typeof header?.file_status === "string" && FILE_STATUS_MAP[header.file_status.toUpperCase().trim()] ? FILE_STATUS_MAP[header.file_status.toUpperCase().trim()].label : "") ||
    header?.file_status || dashboardData?.file_status_name ||
    (typeof dashboardData?.file_status === "string" ? dashboardData.file_status : dashboardData?.file_status?.name) ||
    dashboardData?.filing?.status || dashboardData?.member?.file_status ||
    user?.file_status?.name || (typeof user?.file_status === "string" ? user.file_status : "") ||
    "Registered Users";

  const currentStatusInfo = resolveFilingStatusInfo({ fileStatusCode, fileStatusName });
  const displayStatus = currentStatusInfo.label || fileStatusName || "Registered";

  const detailedProgress = getDetailedStageProgress(currentStatusInfo.code);
  const graphProgress = detailedProgress.overallProgress;

  const calculateDaysToDeadline = () => {
    const today = new Date();
    const deadline = new Date(today.getFullYear(), 3, 15);
    if (today > deadline) deadline.setFullYear(deadline.getFullYear() + 1);
    const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 62;
  };

  const daysDeadline =
    cards?.days_to_deadline?.days != null ? cards.days_to_deadline.days :
    dashboardData?.deadline?.days_remaining != null ? dashboardData.deadline.days_remaining :
    calculateDaysToDeadline();

  const referralAmount = dashboardData?.referral?.amount ?? dashboardData?.referral_rewards?.amount ?? 0;

  const poc = dashboardData?.point_of_contact || cards?.preparer || dashboardData?.preparer;
  const pocName = poc?.name || "";
  const pocPhone = poc?.contact_number || "";
  const pocEmail = poc?.email || "";

  const getInitials = (name) => {
    if (!name) return "TP";
    const parts = name.trim().split(/\s+/);
    return parts.length === 1 ? parts[0].substring(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  const pocInitials = getInitials(pocName);

  const formatPhoneNumber = (phone) => {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    return digits.length === 10 ? `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}` : phone;
  };
  const pocPhoneDisplay = pocPhone ? `+1 ${formatPhoneNumber(pocPhone)}` : pocEmail || "";

  const now = new Date();
  const dateDisplay = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const irsAccepted =
    fileStatusCode === "VA" || fileStatusCode === "EF" || fileStatusCode === "FA" ||
    (fileStatusName || "").toLowerCase().includes("accepted") ||
    (fileStatusName || "").toLowerCase().includes("verified");

  const recentActivity = dashboardData?.recent_activity || dashboardData?.activities || [];

  // ── Intake visibility: RGO, BIP, SP, DP, and IP (Interview Pending) ──
  const showIntakeSteps = (() => {
    const code = (currentStatusInfo?.code || fileStatusCode || "").toUpperCase().trim();
    if (["RGO", "BIP", "SP", "DP", "IP"].includes(code)) return true;
    const norm = (fileStatusName || currentStatusInfo?.label || displayStatus || "").toLowerCase().trim();
    if (norm.includes("registered")) return true;
    if (norm.includes("basic information") || norm.includes("information pending")) return true;
    if (norm.includes("schedul")) return true;
    if (norm.includes("documents pending") || norm.includes("document pending")) return true;
    if (norm.includes("interview")) return true;
    return false;
  })();

  // Intake step statuses from API
  const intakeStepsApi = dashboardData?.complete_your_intake?.steps || [];
  const getIntakeStatus = (key, fallback) => {
    const found = intakeStepsApi.find((s) => s.key === key);
    return found?.status || fallback;
  };
  const basicInfoStatus = getIntakeStatus("basic_information", dashboardData?.intake?.basic_information?.status || "Complete");
  const documentsStatus = getIntakeStatus("documents", dashboardData?.intake?.documents?.status || "");
  const consultationStatus = getIntakeStatus("consultation", dashboardData?.intake?.consultation?.status || "Not started");

  const completedIntakeCount = [basicInfoStatus, documentsStatus, consultationStatus].filter(
    (s) => s?.toLowerCase() === "complete" || s?.toLowerCase() === "completed" || s?.toLowerCase() === "done"
  ).length;
  const intakeProgressPercent = Math.round((completedIntakeCount / 3) * 100);

  // Pill badge helper
  const getStatusPillClass = (status) => {
    if (!status) return "dt-pill not-started";
    const s = status.toLowerCase();
    if (s === "complete" || s === "completed" || s === "done") return "dt-pill done";
    return "dt-pill not-started";
  };

  // Overview content from API — page_title is the primary text field in the backend
  const dashboardContent = dashboardData?.dashboard_content || dashboardData?.dashboardContent;
  const overviewBody =
    dashboardContent?.page_title ||
    dashboardContent?.description ||
    dashboardContent?.welcome_text ||
    dashboardContent?.body ||
    dashboardContent?.content ||
    "";

  // Overview image — check all API paths the backend might use
  const pickImagePath = (v) => {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (typeof v === "object") return v.url || v.path || v.src || v.image || "";
    return "";
  };
  const extractImg = (obj) => {
    if (!obj || typeof obj !== "object") return "";
    for (const k of ["banner_image","bannerImage","file_status_image","status_image","image","img","url","path","src"]) {
      const p = pickImagePath(obj[k]); if (p) return p;
    }
    return "";
  };
  const overviewImage = (() => {
    const statusCode = currentStatusInfo.code;
    // 1. From status list
    for (const list of [dashboardData?.file_statuses, dashboardData?.file_status_list, dashboardData?.status_list, dashboardContent?.file_statuses, dashboardContent?.status_images]) {
      if (!Array.isArray(list)) continue;
      const match = list.find((item) => (item?.code || item?.status_code || item?.file_status_code || "").toUpperCase().trim() === statusCode);
      const img = extractImg(match); if (img) return img;
    }
    // 2. From status map
    for (const map of [dashboardData?.file_status_images, dashboardData?.status_images, dashboardContent?.file_status_images, dashboardContent?.status_images]) {
      if (!map || typeof map !== "object" || Array.isArray(map)) continue;
      const v = map[statusCode] || map[statusCode?.toLowerCase()];
      const p = pickImagePath(v) || extractImg(v); if (p) return p;
    }
    // 3. Direct fields
    return (
      pickImagePath(dashboardContent?.banner_image) ||
      pickImagePath(dashboardContent?.bannerImage) ||
      pickImagePath(dashboardContent?.image) ||
      pickImagePath(dashboardContent?.file_status_image) ||
      extractImg(dashboardData?.file_status) ||
      pickImagePath(dashboardData?.file_status?.banner_image) ||
      pickImagePath(dashboardData?.file_status?.image) ||
      pickImagePath(dashboardData?.file_status_image) ||
      pickImagePath(dashboardData?.banner_image) ||
      pickImagePath(dashboardData?.header?.banner_image) ||
      pickImagePath(dashboardData?.header?.file_status_image) ||
      extractImg(welcomeUserData?.file_status) ||
      extractImg(user?.file_status) ||
      ""
    );
  })();

  // ── Overview Guidance Image suppression condition ──────────
  // Hide image for: Registered Users, Basic Info Pending, Schedule Pending, Documents Pending, Interview Pending
  const shouldHideOverviewImage = (() => {
    const code = (currentStatusInfo?.code || fileStatusCode || "").toUpperCase().trim();
    if (["RGO", "BIP", "SP", "DP", "IP"].includes(code)) return true;
    const norm = (fileStatusName || currentStatusInfo?.label || displayStatus || "").toLowerCase().trim();
    if (norm.includes("registered")) return true;
    if (norm.includes("basic information") || norm.includes("information pending")) return true;
    if (norm.includes("schedul")) return true;
    if (norm.includes("documents pending") || norm.includes("document pending")) return true;
    if (norm.includes("interview")) return true;
    return false;
  })();

  const canShowOverviewImage = Boolean(overviewImage && !shouldHideOverviewImage);

  const journeySteps = [
    { label: "Client info", sublabel: "Completed" },
    { label: "Documents", sublabel: "Scheduled" },
    { label: "Tax Preparation", sublabel: "Complete" },
    { label: "Client Review", sublabel: "Complete" },
    { label: "Return Filed", sublabel: "Completed" },
    { label: "IRS Acceptance", sublabel: "Verified Accepted" },
  ];

  const isStepDone = (idx) => graphProgress > idx;
  const isStepCurrent = (idx) => Math.floor(graphProgress) === idx;

  const emailVerified = isEmailVerified(user);

  const handleSendPocMessage = async (e) => {
    if (e) e.preventDefault();
    if (!pocMessage.trim()) return;
    setPocSending(true);
    setPocError("");
    setPocSuccess("");
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) { setPocError("You are not logged in."); setPocSending(false); return; }
      const payload = { first_name: user?.first_name || user?.name || "Client", mobile: user?.contact_number || user?.mobile || "", message: pocMessage.trim() };
      const response = await fetch(URLS.SendMessage, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        setPocSuccess("Message sent successfully!");
        setPocMessage("");
        setTimeout(() => setPocSuccess(""), 3500);
      } else {
        setPocError(data.message || "Failed to send message.");
      }
    } catch (err) {
      setPocError("Network error. Please try again.");
    } finally {
      setPocSending(false);
    }
  };

  const ActivityIcon = ({ type }) => {
    const base = { width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
    const t = (type || "").toLowerCase();
    if (t.includes("check") || t.includes("accept") || t.includes("complete")) {
      return <div style={{ ...base, background: "#EEF2FF", color: "#4c8d6d" }}><Check size={16} /></div>;
    }
    if (t.includes("calendar") || t.includes("schedule")) {
      return <div style={{ ...base, background: "#F0FDF4", color: "#16A34A" }}><Calendar size={16} /></div>;
    }
    if (t.includes("payment") || t.includes("fee")) {
      return <div style={{ ...base, background: "#FEF3C7", color: "#D97706" }}><FileText size={16} /></div>;
    }
    if (t.includes("upload") || t.includes("doc")) {
      return <div style={{ ...base, background: "#F1F5F9", color: "#64748B" }}><Upload size={16} /></div>;
    }
    if (t.includes("user") || t.includes("account") || t.includes("basic") || t.includes("register")) {
      return <div style={{ ...base, background: "#F1F5F9", color: "#4c8d6d" }}><User size={16} /></div>;
    }
    return <div style={{ ...base, background: "#F1F5F9", color: "#64748B" }}><FileText size={16} /></div>;
  };

  const StepIcon = ({ idx }) => {
    const icons = [
      <path key="r1" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>,
      <rect key="c1" x="3" y="4" width="18" height="18" rx="2"/>,
      <path key="p1" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>,
      <line key="pay1" x1="12" y1="1" x2="12" y2="23"/>,
      <path key="rev1" d="M9 11l3 3L22 4"/>,
      <polyline key="ef1" points="22 12 18 12 15 21 9 3 6 12 2 12"/>,
    ];
    const extras = [
      <circle key="r2" cx="12" cy="7" r="4"/>,
      <><line key="c2" x1="16" y1="2" x2="16" y2="6"/><line key="c3" x1="8" y1="2" x2="8" y2="6"/><line key="c4" x1="3" y1="10" x2="21" y2="10"/></>,
      <polyline key="p2" points="14 2 14 8 20 8"/>,
      <path key="pay2" d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>,
      null,
      null,
    ];
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        {icons[idx]}
        {extras[idx]}
      </svg>
    );
  };

  return (
    <div className="dashboard-container">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <main className="main-content">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <div className="dashboard-content">
          {/* {!emailVerified && (
            <div className="dt-verify-banner">
              <div className="dt-verify-banner-left">
                <AlertCircle size={18} />
                <span>Your email is not verified yet. Please verify to secure your account.</span>
              </div>
              <button type="button" className="dt-verify-banner-btn" onClick={() => navigate("/verify-email")}>
                Verify Email
              </button>
            </div>
          )} */}

          <div className="cd-wrapper">
            {/* Welcome Row */}
            <div className="cd-welcome-row">
              <div className="cd-welcome-left">
                <p className="cd-portal-label">CLIENT PORTAL</p>
                <h1 className="cd-welcome-title">Welcome back, {displayName}</h1>
                <p className="cd-welcome-sub">Your tax journey, organized in one place.</p>
              </div>
              <div className="cd-welcome-right">
                <div className="cd-date-block">
                  <span className="cd-date-label">Current Date</span>
                  <span className="cd-date-value">{dateDisplay}</span>
                </div>
                <button className="cd-contact-expert-btn" 
                onClick={() => setIsQueryModalOpen(true)}
                // onClick={() => setShowPocModal(true)}
                  >
                  <HelpCircle size={15} />
                  Send Query
                </button>
              </div>
            </div>

            {/* IRS Banner */}
            <div className="cd-irs-banner">
              <div className="cd-irs-banner-left">
                <div className="cd-irs-check"><Check size={16} /></div>
                <span>{irsAccepted ? "Your tax return has been accepted by the IRS." : `Your filing status: ${displayStatus}`}</span>
              </div>
              <button className="cd-irs-link" onClick={() => navigate("/dashboard/tax-summary")}>
                View Tax Summary <ChevronRight size={14} />
              </button>
            </div>

            {/* Metrics */}
            <div className="cd-metrics">
              <div className="cd-metric-card">
                <div className="cd-metric-header">
                  <span className="cd-metric-label">Account Information</span>
                  <div className="cd-metric-icon cd-icon-blue"><FileText size={16} /></div>
                </div>
                <p className="cd-metric-value cd-mono">#{displayFileNo || "—"}</p>
                <span className="cd-metric-badge cd-badge-green">{displayStatus}</span>
              </div>

              <div className="cd-metric-card">
                <div className="cd-metric-header">
                  <span className="cd-metric-label">Tax Deadline</span>
                  <div className="cd-metric-icon cd-icon-orange"><Calendar size={16} /></div>
                </div>
                <p className="cd-metric-value">{daysDeadline ?? "—"} <span className="cd-metric-unit">days</span></p>
                <span className="cd-metric-sub">Remaining until next filing deadline</span>
              </div>

              <div className="cd-metric-card">
                <div className="cd-metric-header">
                  <span className="cd-metric-label">Referral Rewards</span>
                  <div className="cd-metric-icon cd-icon-purple">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                </div>
                <p className="cd-metric-value">${typeof referralAmount === "number" ? referralAmount.toFixed(2) : "0.00"}</p>
                <button className="cd-refer-link" onClick={() => navigate("/dashboard/referrals")}>
                  Refer a Friend <ChevronRight size={13} />
                </button>
              </div>

              <div className="cd-metric-card cd-expert-card">
                <div className="cd-metric-header">
                  <span className="cd-metric-label">Your Tax Expert</span>
                  <div className="cd-expert-avatar">{pocInitials}</div>
                </div>
                <p className="cd-expert-name">{pocName || "Support Specialist"}</p>
                <p className="cd-expert-phone">{pocPhoneDisplay}</p>
                <button className="cd-send-message-btn" onClick={() => setShowPocModal(true)}>
                  <MessageSquare size={14} />
                  Send Message
                </button>
              </div>
            </div>

              {/* ── Tax Return Journey ────────────────────────── */}
            <div className="cd-journey-panel">
              <div className="cd-journey-header">
                <div>
                  <h2 className="cd-journey-title">Tax Year 2026</h2>
                  {/* <p className="cd-journey-sub">Track each stage of your tax preparation and filing process.</p> */}
                  <p className="cd-joureny-sub">Filing Progress & Workflow</p>
                </div>
                <div className="cd-journey-status-badge">Status: {displayStatus}</div>
              </div>

              <div className="cd-stepper">
                {journeySteps.map((step, idx) => {
                  const done = isStepDone(idx);
                  const active = isStepCurrent(idx);
                  const isLast = idx === journeySteps.length - 1;
                  return (
                    <React.Fragment key={idx}>
                      <div className="cd-step">
                        <div className={`cd-step-circle ${done ? "cd-step-done" : active ? "cd-step-active" : ""}`}>
                          {done ? <Check size={18} strokeWidth={3} /> : <StepIcon idx={idx} />}
                        </div>
                        <span className={`cd-step-label ${active ? "cd-step-label-active" : ""}`}>{step.label}</span>
                        {active && <span className="cd-step-sublabel">{step.sublabel}</span>}
                      </div>
                      {!isLast && <div className={`cd-step-line ${done ? "cd-step-line-done" : ""}`} />}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* ── Overview & Guidelines (image + dashboard content in one card) ── */}
            {(canShowOverviewImage || overviewBody) && (
              <div className="cd-overview-panel">
                <div className="cd-overview-head">
                  <div className="cd-overview-icon-title">
                    <div className="cd-overview-header-icon">
                      <Info size={19} />
                    </div>
                    <div>
                      <h2 className="cd-overview-title">Overview &amp; Guidelines</h2>
                      <p className="cd-overview-sub">Tax filing updates and official procedural notes for your account</p>
                    </div>
                  </div>
                </div>

                <div className="cd-overview-unified">
                  {canShowOverviewImage && (
                    <OverviewBannerImg imagePath={overviewImage} />
                  )}
                  {overviewBody && (
                    <p className="cd-overview-body">{overviewBody}</p>
                  )}
                </div>
              </div>
            )}

            {/* ── Complete Your Intake Steps Card ── */}
            {showIntakeSteps && (
              <div className="cd-intake-card">
                <div className="cd-intake-card-header">
                  <div className="cd-intake-title-group">
                    <div className="cd-intake-header-icon">
                      <CheckCircle size={20} />
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <h2 className="cd-intake-title">Complete Your Intake</h2>
                        <span className="cd-intake-status-chip">
                          {completedIntakeCount === 3 ? "All Complete" : "Action Required"}
                        </span>
                      </div>
                      <p className="cd-intake-sub">Finish these required milestones so our tax specialists can prepare your return.</p>
                    </div>
                  </div>

                  <div className="cd-intake-progress-box">
                    <div className="cd-intake-progress-info">
                      <span className="cd-intake-progress-text">{completedIntakeCount} of 3 Steps Done</span>
                      <span className="cd-intake-progress-pct">{intakeProgressPercent}%</span>
                    </div>
                    <div className="cd-intake-progress-track">
                      <div
                        className="cd-intake-progress-bar"
                        style={{ width: `${intakeProgressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 3 Modern Intake Step Cards in a Neat Grid */}
                <div className="cd-intake-grid">
                  {/* Step 1 – Basic Information */}
                  <div className={`cd-intake-tile ${basicInfoStatus?.toLowerCase() === "complete" || basicInfoStatus?.toLowerCase() === "completed" ? "cd-tile-complete" : ""}`}>
                    <div className="cd-intake-tile-top">
                      <span className="cd-intake-step-tag">Step 1</span>
                      <span className={getStatusPillClass(basicInfoStatus)}>
                        {basicInfoStatus || "Pending"}
                      </span>
                    </div>
                    <div className="cd-intake-tile-main">
                      <div className={`cd-intake-tile-icon ${basicInfoStatus?.toLowerCase() === "complete" || basicInfoStatus?.toLowerCase() === "completed" ? "icon-done" : "icon-user"}`}>
                        {basicInfoStatus?.toLowerCase() === "complete" || basicInfoStatus?.toLowerCase() === "completed" ? (
                          <Check size={18} strokeWidth={3} />
                        ) : (
                          <User size={18} />
                        )}
                      </div>
                      <div className="cd-intake-tile-text">
                        <h4>Basic Information</h4>
                        <p>Personal identity, spouse info, dependents, and bank details.</p>
                      </div>
                    </div>
                    <div className="cd-intake-tile-footer">
                      <button
                        type="button"
                        className="cd-intake-btn"
                        onClick={() => navigate("/dashboard/basic-info/taxpayer")}
                      >
                        Review details <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Step 2 – Upload Documents */}
                  <div className={`cd-intake-tile ${documentsStatus?.toLowerCase() === "complete" || documentsStatus?.toLowerCase() === "completed" ? "cd-tile-complete" : ""}`}>
                    <div className="cd-intake-tile-top">
                      <span className="cd-intake-step-tag">Step 2</span>
                      <span className={getStatusPillClass(documentsStatus)}>
                        {documentsStatus || "Pending"}
                      </span>
                    </div>
                    <div className="cd-intake-tile-main">
                      <div className={`cd-intake-tile-icon ${documentsStatus?.toLowerCase() === "complete" || documentsStatus?.toLowerCase() === "completed" ? "icon-done" : "icon-upload"}`}>
                        {documentsStatus?.toLowerCase() === "complete" || documentsStatus?.toLowerCase() === "completed" ? (
                          <Check size={18} strokeWidth={3} />
                        ) : (
                          <Upload size={18} />
                        )}
                      </div>
                      <div className="cd-intake-tile-text">
                        <h4>Upload Tax Documents</h4>
                        <p>W-2 forms, 1099s, prior year returns, and related tax papers.</p>
                      </div>
                    </div>
                    <div className="cd-intake-tile-footer">
                      <button
                        type="button"
                        className="cd-intake-btn"
                        onClick={() => navigate("/dashboard/upload")}
                      >
                        Upload files <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Step 3 – Schedule Consultation */}
                  <div className={`cd-intake-tile ${consultationStatus?.toLowerCase() === "complete" || consultationStatus?.toLowerCase() === "completed" ? "cd-tile-complete" : ""}`}>
                    <div className="cd-intake-tile-top">
                      <span className="cd-intake-step-tag">Step 3</span>
                      <span className={getStatusPillClass(consultationStatus)}>
                        {consultationStatus || "Not started"}
                      </span>
                    </div>
                    <div className="cd-intake-tile-main">
                      <div className={`cd-intake-tile-icon ${consultationStatus?.toLowerCase() === "complete" || consultationStatus?.toLowerCase() === "completed" ? "icon-done" : "icon-calendar"}`}>
                        {consultationStatus?.toLowerCase() === "complete" || consultationStatus?.toLowerCase() === "completed" ? (
                          <Check size={18} strokeWidth={3} />
                        ) : (
                          <Calendar size={18} />
                        )}
                      </div>
                      <div className="cd-intake-tile-text">
                        <h4>Schedule Consultation</h4>
                        <p>Book a dedicated discussion with your tax preparation executive.</p>
                      </div>
                    </div>
                    <div className="cd-intake-tile-footer">
                      <button
                        type="button"
                        className="cd-intake-btn"
                        onClick={() => navigate("/dashboard/schedule")}
                      >
                        Schedule now <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tax Return Journey ────────────────────────── */}
            {/* <div className="cd-journey-panel">
              <div className="cd-journey-header">
                <div>
                  <h2 className="cd-journey-title">Your Tax Return Journey</h2>
                  <p className="cd-journey-sub">Track each stage of your tax preparation and filing process.</p>
                </div>
                <div className="cd-journey-status-badge">Status: {displayStatus}</div>
              </div>

              <div className="cd-stepper">
                {journeySteps.map((step, idx) => {
                  const done = isStepDone(idx);
                  const active = isStepCurrent(idx);
                  const isLast = idx === journeySteps.length - 1;
                  return (
                    <React.Fragment key={idx}>
                      <div className="cd-step">
                        <div className={`cd-step-circle ${done ? "cd-step-done" : active ? "cd-step-active" : ""}`}>
                          {done ? <Check size={18} strokeWidth={3} /> : <StepIcon idx={idx} />}
                        </div>
                        <span className={`cd-step-label ${active ? "cd-step-label-active" : ""}`}>{step.label}</span>
                        {active && <span className="cd-step-sublabel">{step.sublabel}</span>}
                      </div>
                      {!isLast && <div className={`cd-step-line ${done ? "cd-step-line-done" : ""}`} />}
                    </React.Fragment>
                  );
                })}
              </div>
            </div> */}

            {/* Bottom Grid */}
            <div className="cd-bottom-grid">
              {/* Recent Activity */}
              {/* <div className="cd-activity-panel">
                <div className="cd-activity-header">
                  <h3>Recent Activity</h3>
                  <button className="cd-view-all" onClick={() => navigate("#")}>View All Activity</button>
                </div>
                <div className="cd-activity-list">
                  {recentActivity.length === 0 ? (
                    <div className="cd-activity-empty">
                      <FileText size={28} strokeWidth={1.5} />
                      <p>No recent activity yet.</p>
                    </div>
                  ) : (
                    recentActivity.slice(0, 6).map((item, idx) => {
                      const rawDate = item.date || item.created_at || "";
                      const parsed = rawDate ? new Date(rawDate) : null;
                      const dateStr = parsed && !isNaN(parsed) ? parsed.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : rawDate;
                      const desc = item.description || item.document_name || (item.uploaded_by ? `Uploaded by ${item.uploaded_by}` : "");
                      return (
                        <div className="cd-activity-item" key={idx}>
                          <ActivityIcon type={item.icon || item.type || "file"} />
                          <div className="cd-activity-body">
                            <p className="cd-activity-title">{item.title}</p>
                            {desc && <p className="cd-activity-desc">{desc}</p>}
                            {dateStr && <p className="cd-activity-date">{dateStr}</p>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div> */}

              {/* Right Column */}
              <div className="cd-right-col">
                <div className="cd-quick-panel">
                  <h3 className="cd-quick-title">Quick Actions</h3>
                  <div className="cd-quick-grid">
                    <button className="cd-quick-action" onClick={() => navigate("/dashboard/upload")}>
                      <div className="cd-qa-icon cd-qa-blue"><Upload size={22} /></div>
                      <span>Upload Documents</span>
                    </button>
                    <button className="cd-quick-action" onClick={() => navigate("/dashboard/tax-summary")}>
                      <div className="cd-qa-icon cd-qa-teal"><FileText size={22} /></div>
                      <span>View Tax Summary</span>
                    </button>
                    <button className="cd-quick-action" onClick={() => navigate("/dashboard/schedule")}>
                      <div className="cd-qa-icon cd-qa-orange"><Calendar size={22} /></div>
                      <span>Schedule Consultation</span>
                    </button>
                    <button className="cd-quick-action" onClick={() => navigate("/dashboard/download")}>
                      <div className="cd-qa-icon cd-qa-purple"><Download size={22} /></div>
                      <span>Download Tax Return</span>
                    </button>
                  </div>
                </div>

                {/* <div className="cd-expert-assist">
                  <div className="cd-expert-assist-top">
                    <div className="cd-expert-assist-icon"><Headphones size={22} /></div>
                    <div>
                      <h4>Need Expert Assistance?</h4>
                      <p>Our CPA support team is available Mon-Fri.</p>
                    </div>
                  </div>
                  <div className="cd-expert-assist-actions">
                    <button className="cd-assist-btn cd-assist-primary" onClick={() => setShowPocModal(true)}>Start Live Chat</button>
                    <button className="cd-assist-btn cd-assist-secondary" onClick={() => pocPhone && window.open(`tel:${pocPhone}`)}>Call Support</button>
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </main>

      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => { setShowWelcomeModal(false); sessionStorage.setItem("welcome_dismissed", "true"); }}
        userData={welcomeUserData}
      />

      {showPocModal && (
        <div onClick={() => { setShowPocModal(false); setPocMessage(""); setPocError(""); setPocSuccess(""); }}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "500px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#FED7AA,#FB923C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 700, color: "#fff" }}>{pocInitials}</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "#1F2937" }}>{pocName || "Support Specialist"}</h3>
                  <p style={{ margin: 0, fontSize: "14px", color: "#6B7280" }}>{pocPhoneDisplay}</p>
                </div>
              </div>
              <button onClick={() => { setShowPocModal(false); setPocMessage(""); setPocError(""); setPocSuccess(""); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: "4px", display: "flex" }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ padding: "24px" }}>
              {pocSuccess && (
                <div style={{ padding: "12px 16px", background: "#D1FAE5", border: "1px solid #10B981", borderRadius: "8px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#065F46" }}>
                  <Check size={18} /><span>{pocSuccess}</span>
                </div>
              )}
              {pocError && (
                <div style={{ padding: "12px 16px", background: "#FEE2E2", border: "1px solid #EF4444", borderRadius: "8px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#991B1B" }}>
                  <AlertCircle size={18} /><span>{pocError}</span>
                </div>
              )}
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>Your Message</label>
              <textarea value={pocMessage} onChange={(e) => setPocMessage(e.target.value)} placeholder="Type your message here..." rows={5}
                style={{ width: "100%", padding: "12px", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", outline: "none" }}
                onFocus={(e) => e.currentTarget.style.borderColor = "#4c8d6d"}
                onBlur={(e) => e.currentTarget.style.borderColor = "#D1D5DB"}
                disabled={pocSending} autoFocus />
            </div>
            <div style={{ padding: "16px 24px", borderTop: "1px solid #E5E7EB", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={() => { setShowPocModal(false); setPocMessage(""); setPocError(""); setPocSuccess(""); }}
                style={{ padding: "10px 20px", background: "#F3F4F6", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px", fontWeight: 500, cursor: "pointer", color: "#374151" }}>
                Cancel
              </button>
              <button onClick={handleSendPocMessage} disabled={pocSending || !pocMessage.trim()}
                style={{ padding: "10px 24px", background: "linear-gradient(135deg,#4c8d6d,#3d7559)", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 500, color: "#fff", cursor: pocSending || !pocMessage.trim() ? "not-allowed" : "pointer", opacity: pocSending || !pocMessage.trim() ? 0.6 : 1, display: "flex", alignItems: "center", gap: "8px" }}>
                {pocSending ? <><Loader2 size={16} className="spin" /><span>Sending...</span></> : <><Send size={16} /><span>Send Message</span></>}
              </button>
            </div>
          </div>
        </div>
      )}

      <SendQueryModal 
        isOpen={isQueryModalOpen}
        onClose={() => setIsQueryModalOpen(false)}
      />
    </div>
  );
};

export default ClientDashboard;
