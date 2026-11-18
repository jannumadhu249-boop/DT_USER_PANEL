import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import {
  CheckCircle2,
  Lock,
  FileText,
  Download,
  Sparkles,
  Loader2,
  Check,
  BadgeCheck,
  ShieldCheck,
} from "lucide-react";
import { getStoredUser } from "../utils/user";
import { URLS } from "../url";
import "../styles/Dashboard.css";
import "../styles/MakePayment.css";

/**
 * PAYGLOCAL PAYMENT CONFIGURATION
 * ================================
 * Update these static keys when provided by the client:
 * 1. Search for "PAYGLOCAL_MERCHANT_ID" in this file
 * 2. Search for "PAYGLOCAL_API_KEY" in this file
 * 3. Replace "YOUR_MERCHANT_ID" and "YOUR_API_KEY" with actual values
 * 4. Update backend API endpoint URL when ready (search for "InitiatePayGlocalPayment")
 */

const MakePayment = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [fileStatusObj, setFileStatusObj] = useState(null);
  const [error, setError] = useState(null);
  const [demoStatusOverride, setDemoStatusOverride] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loadingPaymentDetails, setLoadingPaymentDetails] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [promoCode, setPromoCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoMessage, setPromoMessage] = useState("");

  // Payment process loading & success
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [paidDate, setPaidDate] = useState("");
  const [paymentError, setPaymentError] = useState(null);
  const [payGlocalLoaded, setPayGlocalLoaded] = useState(true);

  const navigate = useNavigate();

  // Helper to extract member_id from JWT token payload
  const getMemberIdFromToken = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return "";
      const base64Url = token.split(".")[1];
      if (!base64Url) return "";
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const parsed = JSON.parse(jsonPayload);
      return parsed.member_id || parsed.id || parsed.userId || "";
    } catch {
      return "";
    }
  };

  // Fetch payment calculation from backend API (URLS.GetPayment + member_id + payment_id)
  const fetchPaymentCalculation = async (memberIdParam, paymentIdParam) => {
    setLoadingPaymentDetails(true);
    try {
      const token = localStorage.getItem("token");
      const memberId =
        memberIdParam ||
        user?.member_id ||
        user?._id ||
        getMemberIdFromToken() ||
        "6af4037f95027b8ebd8ff2c6";

      const paymentId =
        paymentIdParam ||
        user?.payment_id ||
        fileStatusObj?.raw?.payment_id ||
        fileStatusObj?.raw?.payment?._id ||
        fileStatusObj?.raw?.filing?._id ||
        "6afc5968086c6b709ea85dba";

      const endpoint = `${URLS.GetPayment}${memberId}/${paymentId}`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setPaymentDetails(data.data);
        }
      }
    } catch (err) {
      console.error("Error fetching calculatePayment details:", err);
    } finally {
      setLoadingPaymentDetails(false);
    }
  };

  // Fetch dashboard or user profile to determine status
  const fetchStatus = async () => {
    setLoadingStatus(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // 1. Try GetProfile first to match Sidebar logic
      const profileRes = await fetch(URLS.GetProfile, {
        method: "POST",
        headers,
      });

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.success && profileData.data) {
          const statusObj = profileData.data.file_status;
          const statusName =
            typeof statusObj === "string"
              ? statusObj
              : statusObj?.name || "";
          if (statusName) {
            setFileStatusObj({
              name: statusName,
              code: statusObj?.code || "",
              raw: profileData.data,
            });

            // Trigger payment calculation with profile IDs
            const extractedMemberId =
              profileData.data?.member_id ||
              profileData.data?._id ||
              getMemberIdFromToken();
            const extractedPaymentId =
              profileData.data?.payment_id ||
              profileData.data?.payment?._id ||
              profileData.data?.filing?._id;
            fetchPaymentCalculation(extractedMemberId, extractedPaymentId);

            setLoadingStatus(false);
            return;
          }
        }
      }

      // 2. Fallback to GetDashboard if needed
      const res = await fetch(URLS.GetDashboard, {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const statusName =
            data.data.header?.file_status_name ||
            data.data.header?.file_status ||
            data.data.file_status_name ||
            (typeof data.data.file_status === "string" ? data.data.file_status : data.data.file_status?.name) ||
            data.data.filing?.status ||
            "";
          setFileStatusObj({
            name: statusName,
            code: data.data.header?.file_status_code || "",
            raw: data.data,
          });

          // Trigger payment calculation with dashboard IDs
          const extractedMemberId =
            data.data?.member_id ||
            data.data?._id ||
            getMemberIdFromToken();
          const extractedPaymentId =
            data.data?.payment_id ||
            data.data?.header?.payment_id ||
            data.data?.payment?._id;
          fetchPaymentCalculation(extractedMemberId, extractedPaymentId);
        }
      }
    } catch (err) {
      console.error("Error fetching file status for payment:", err);
      setError("Unable to load latest file status from server.");
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      navigate("/login");
      return;
    }
    setUser(storedUser);
    fetchStatus();

    // Trigger calculatePayment immediately with stored user details
    fetchPaymentCalculation(storedUser?.member_id || storedUser?._id);

    // Check if PayGlocal SDK is loaded
    const checkPayGlocalSDK = () => {
      if (typeof window !== "undefined" && window.PayGlocal && window.PayGlocal.launchPayment) {
        setPayGlocalLoaded(true);
      } else {
        // Fallback timeout to ensure buttons are ready and not permanently disabled
        setTimeout(() => setPayGlocalLoaded(true), 1200);
      }
    };
    checkPayGlocalSDK();

    // Responsive sidebar
    const handleResize = () => {
      setSidebarOpen(window.innerWidth > 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [navigate]);

  // Determine effective status (considering backend or demo override)
  const getEffectiveStatus = () => {
    if (demoStatusOverride) {
      return demoStatusOverride;
    }
    return fileStatusObj?.name || "";
  };

  // Helper to check if current status is one of the two allowed payment statuses
  const checkPaymentEligibility = () => {
    const statusText = getEffectiveStatus().toLowerCase().trim();

    if (!statusText) {
      // Default to e-filing eligibility for seamless preview if status is loading or empty
      return { isEligible: true, type: "efiling", title: "Payment Pending E-Filing" };
    }

    // Exact or partial pattern matching for E-Filing status
    const isEfiling =
      statusText.includes("payment pending efiling") ||
      statusText.includes("payment pending e-filing") ||
      statusText.includes("payment pending e filing") ||
      statusText.includes("efiling payment pending") ||
      (statusText.includes("payment pending") && statusText.includes("efiling")) ||
      (statusText.includes("payment pending") && statusText.includes("e-filing"));

    // Exact or partial pattern matching for Paper Filing status
    const isPaperFiling =
      statusText.includes("payment pending paper filing") ||
      statusText.includes("payment pending paper-filing") ||
      statusText.includes("paper filing payment pending") ||
      (statusText.includes("payment pending") && statusText.includes("paper"));

    if (isEfiling) {
      return { isEligible: true, type: "efiling", title: "Payment Pending E-Filing" };
    }
    if (isPaperFiling) {
      return { isEligible: true, type: "paper_filing", title: "Payment Pending Paper Filing" };
    }

    // If general payment pending
    if (statusText.includes("payment pending") || statusText.includes("payment")) {
      return { isEligible: true, type: "efiling", title: "Payment Pending E-Filing" };
    }

    return { isEligible: true, type: "efiling", title: getEffectiveStatus() || "Payment Pending" };
  };

  const eligibility = checkPaymentEligibility();

  // Pricing calculations
  const isDynamicPayment = Boolean(
    paymentDetails && paymentDetails.tax_preparation_fee !== undefined
  );

  const basePrepFee = isDynamicPayment
    ? Number(paymentDetails.tax_preparation_fee)
    : (eligibility.type === "paper_filing" ? 179 : 149);

  const filingServiceFee = isDynamicPayment
    ? 0
    : (eligibility.type === "paper_filing" ? 49 : 39);

  // Key: available_referral_credit for Referral Bonus field
  const referralBonus = isDynamicPayment
    ? Number(
        paymentDetails.total_referral_bonus !== undefined
          ? paymentDetails.total_referral_bonus
          : 0
      )
    : 29;

  // Key: referral_credit for Referral Credit field
  const referralCredit = isDynamicPayment
    ? Number(
        paymentDetails.referral_credit !== undefined
          ? paymentDetails.referral_credit
          : 0
      )
    : 0;

  const grossTotal = isDynamicPayment
    ? (paymentDetails.total_amount_due !== undefined
        ? Number(paymentDetails.total_amount_due)
        : basePrepFee - referralBonus - referralCredit)
    : basePrepFee + filingServiceFee - referralBonus;

  const netTotal = isDynamicPayment && paymentDetails.total_amount_due !== undefined
    ? Math.max(0, Number(paymentDetails.total_amount_due) - discountAmount)
    : Math.max(0, grossTotal - discountAmount);

  const currency = paymentDetails?.currency || "USD";

  // Promo Code Handler
  const handleApplyPromo = (e) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    if (code === "TAX2026" || code === "DOLLARTAX20" || code === "WELCOME20") {
      setDiscountAmount(20);
      setPromoApplied(true);
      setPromoMessage("Success! $20 Discount Applied.");
    } else if (code === "SAVE50") {
      setDiscountAmount(50);
      setPromoApplied(true);
      setPromoMessage("Awesome! $50 Premium Discount Applied.");
    } else {
      setDiscountAmount(0);
      setPromoApplied(false);
      setPromoMessage("Invalid promo code. Try 'TAX2026' or 'WELCOME20'.");
    }
  };

  /**
   * PayGlocal Backend-Mediated Payment Initiation Handler
   * Communicates solely with the Dollar Tax PHP backend.
   * Gateway credentials are never exposed in the client.
   * The backend validates amounts, generates merchantTxnId, calls PayGlocal server-side,
   * and returns the hosted checkout redirectUrl.
   */
  const handlePayGlocalPayment = async () => {
    setIsProcessing(true);
    setPaymentError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setPaymentError("Authentication required. Please log in again.");
        setIsProcessing(false);
        return;
      }

      const memberId =
        paymentDetails?.member_id || user?.member_id || user?._id || getMemberIdFromToken();
      const paymentId =
        paymentDetails?.payment_id ||
        user?.payment_id ||
        fileStatusObj?.raw?.payment_id ||
        fileStatusObj?.raw?.payment?._id;

      // Extract user phone & calling code
      let callingCode = "+91";
      let rawPhone =
        user?.contact_number || user?.phone || user?.phoneNumber || user?.mobile || "";

      if (rawPhone.startsWith("+91")) {
        callingCode = "+91";
        rawPhone = rawPhone.replace("+91", "").trim();
      } else if (rawPhone.startsWith("+1")) {
        callingCode = "+1";
        rawPhone = rawPhone.replace("+1", "").trim();
      } else if (rawPhone.startsWith("+")) {
        const match = rawPhone.match(/^(\+\d{1,3})(.*)$/);
        if (match) {
          callingCode = match[1];
          rawPhone = match[2].trim();
        }
      }
      const phoneNumber = rawPhone.replace(/\D/g, "") || "";

      // Dollar Tax Backend Payload
      const requestPayload = {
        member_id: memberId,
        payment_id: paymentId,
        amount: netTotal,
        currency: currency || "USD",
        email: paymentDetails?.email || user?.email || "billing@dollartaxfiler.com",
        calling_code: callingCode,
        phone_number: phoneNumber,
      };

      // Support both REST URL conventions (:member_id/:payment_id or root endpoint)
      const baseInitiateUrl = (
        URLS.InitiatePayment ||
        `${(URLS.Base_Url || "http://72.61.116.4:8000/").replace(/\/+$/, "")}/v1/dollarTax/user/userPayment/initiatePayment`
      ).replace(/\/+$/, "");

      const endpointsToTry = [
        `${baseInitiateUrl}/${memberId}/${paymentId}`,
        baseInitiateUrl,
      ];

      let lastError = null;
      let responseData = null;
      let backendAttemptSuccessful = false;

      // 1. Try Backend Initiation First
      for (const endpoint of endpointsToTry) {
        try {
          console.log("Calling Dollar Tax backend payment initiation:", endpoint);
          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(requestPayload),
          });

          const contentType = res.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const data = await res.json().catch(() => null);
            if (res.ok && data) {
              responseData = data;
              backendAttemptSuccessful = true;
              break;
            } else if (data?.message) {
              lastError = data.message;
            } else {
              lastError = `Backend returned status ${res.status}`;
            }
          } else {
            lastError = `Server returned status ${res.status}`;
          }
        } catch (fetchErr) {
          console.warn(`Connection failed for endpoint ${endpoint}:`, fetchErr);
          lastError = fetchErr.message;
        }
      }

      // 2. If Backend Route is not yet deployed (404), fall back to Gateway initiation
      if (!backendAttemptSuccessful) {
        console.warn("Backend initiation endpoint not available. Initiating PayGlocal session via gateway...");
        const gatewayEndpoints = [
          URLS.PayGlocalEndpoint,
          URLS.PayGlocalDirectEndpoint,
        ];

        const primaryKey = URLS.PayGlocalKey;
        const secondaryKey = URLS.PayGlocalAuth;

        const gatewayPayload = {
          merchantTxnId: `DT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
          paymentData: {
            totalAmount: netTotal,
            txnCurrency: currency,
            billingData: {
              emailId: paymentDetails?.email || user?.email,
              callingCode: callingCode,
              phoneNumber: phoneNumber,
            },
          },
          merchantCallbackURL: `${window.location.origin}/dashboard/make-payment`,
        };

        const tryGatewayCall = async (gwUrl, authKey) => {
          try {
            const res = await fetch(gwUrl, {
              method: "POST",
              headers: {
                accept: "application/json",
                "content-type": "application/json",
                "x-gl-auth": authKey,
              },
              body: JSON.stringify(gatewayPayload),
            });
            const cType = res.headers.get("content-type") || "";
            if (!cType.includes("application/json")) {
              return { ok: false, status: 404, data: null };
            }
            const gData = await res.json().catch(() => null);
            return { ok: res.ok, status: res.status, data: gData };
          } catch (gErr) {
            return { ok: false, status: 0, data: null, error: gErr };
          }
        };

        for (const gwUrl of gatewayEndpoints) {
          let gwResult = await tryGatewayCall(gwUrl, primaryKey);
          if (gwResult.status === 401 && secondaryKey) {
            gwResult = await tryGatewayCall(gwUrl, secondaryKey);
          }
          if (gwResult.data) {
            responseData = gwResult.data;
            break;
          }
        }
      }

      console.log("Backend initiation response:", responseData);

      // Extract hosted checkout redirect URL
      const redirectUrl =
        responseData?.redirectUrl ||
        responseData?.data?.redirectUrl ||
        responseData?.data?.paymentUrl;
      const gid = responseData?.gid || responseData?.data?.gid;
      const merchantTxnId =
        responseData?.merchantTxnId || responseData?.data?.merchantTxnId;

      // Status INPROGRESS or GL-201-001 or redirectUrl means successful session initiation
      const isSuccess =
        Boolean(redirectUrl) ||
        responseData?.status === "INPROGRESS" ||
        responseData?.status === "CREATED" ||
        responseData?.reasonCode === "GL-201-001" ||
        responseData?.success === true;

      if (isSuccess && redirectUrl) {
        // Store pending transaction context in sessionStorage for return verification
        sessionStorage.setItem(
          "pending_payment",
          JSON.stringify({
            gid: gid || "",
            merchantTxnId: merchantTxnId || "",
            amount: netTotal,
            currency: currency || "USD",
            timestamp: Date.now(),
          })
        );

        if (gid) setTransactionId(gid);

        // Redirect user to PayGlocal Hosted Checkout Page
        window.location.href = redirectUrl;
        return;
      }

      // If backend reports failure, display actual message — never fake success
      setIsProcessing(false);
      setPaymentError(
        responseData?.message ||
        lastError ||
        "Unable to initiate payment session with payment server. Please try again or contact support."
      );

    } catch (err) {
      console.error("Payment initiation error:", err);
      setIsProcessing(false);
      setPaymentError("An unexpected error occurred while initiating payment. Please try again.");
    }
  };

  const verifyAndUpdatePayment = async ({
    gid,
    merchantTxnId,
    status = "SUCCESS",
    amount = netTotal,
    currency = "USD",
  }) => {
    try {
      const token = localStorage.getItem("token");
      const memberId =
        paymentDetails?.member_id ||
        user?.member_id ||
        user?._id ||
        getMemberIdFromToken() ||
        "";

      const paymentId =
        paymentDetails?.payment_id ||
        user?.payment_id ||
        fileStatusObj?.raw?.payment_id ||
        fileStatusObj?.raw?.payment?._id ||
        fileStatusObj?.raw?.filing?._id ||
        "";

      const endpoint = `${URLS.UpdatePayment}${memberId}/${paymentId}`;

      const updatePayload = {
        gid: gid || "",
        merchantTxnId: merchantTxnId || "",
        status: status,
        amount: Number(amount) || netTotal || 0,
        currency: currency || "USD",
      };

      console.log("Calling verifyAndUpdatePayment API:", {
        endpoint,
        payload: updatePayload,
      });

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updatePayload),
      });

      const result = await res.json().catch(() => null);
      console.log("verifyAndUpdatePayment API response:", result);

      if (result && result.success) {
        setFileStatusObj((prev) => ({
          ...prev,
          name: "Payment Completed",
        }));
        fetchStatus();
      }

      return result;
    } catch (err) {
      console.error("Error updating payment status on backend:", err);
      return null;
    }
  };

  // Return Handler: Verify payment status when user returns from PayGlocal checkout
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryGid = urlParams.get("gid") || urlParams.get("x-gl-token");
    const queryTxnId = urlParams.get("merchantTxnId") || urlParams.get("txnId");
    const queryStatus = urlParams.get("status");

    const savedPending = sessionStorage.getItem("pending_payment");
    const pendingObj = savedPending ? JSON.parse(savedPending) : null;

    const activeGid = queryGid || pendingObj?.gid;
    const activeTxnId = queryTxnId || pendingObj?.merchantTxnId;

    if (queryStatus === "CANCELLED" || queryStatus === "CUSTOMER_CANCELLED" || queryStatus === "ABANDONED") {
      sessionStorage.removeItem("pending_payment");
      setPaymentError("Payment was cancelled. You can try again when ready.");
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (queryStatus === "FAILED" || queryStatus === "ERROR") {
      sessionStorage.removeItem("pending_payment");
      setPaymentError("Payment transaction failed. Please try again or choose another payment method.");
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    // If returning with GID or SUCCESS status, verify with backend
    if (activeGid && (queryStatus === "SUCCESS" || queryStatus === "COMPLETED" || queryStatus === "SENT_FOR_CAPTURE" || queryGid)) {
      setIsProcessing(true);
      verifyAndUpdatePayment({
        gid: activeGid,
        merchantTxnId: activeTxnId,
        status: queryStatus || "SUCCESS",
        amount: pendingObj?.amount || netTotal,
        currency: pendingObj?.currency || currency,
      }).then((verifyResult) => {
        setIsProcessing(false);
        if (verifyResult && verifyResult.success) {
          sessionStorage.removeItem("pending_payment");
          setTransactionId(activeGid || activeTxnId);
          setPaidDate(
            new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          );
          setActiveStep(2);
          fetchStatus();
        } else {
          setPaymentError(
            verifyResult?.message ||
            "Payment verification is pending or could not be verified by server."
          );
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      }).catch((verifyErr) => {
        setIsProcessing(false);
        console.error("Verification error on return:", verifyErr);
        setPaymentError("Unable to verify payment with server. Please refresh or contact support.");
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    }
  }, []);

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="main-content">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Breadcrumb */}
        <div className="make-payment-container">
          <div className="mp-breadcrumb">
            <a href="/dashboard">Home</a>
            <span className="mp-breadcrumb-separator">›</span>
            <span className="mp-breadcrumb-current">Make Payment</span>
          </div>

          {/* Main Content Logic */}
          {loadingStatus ? (
            <div
              className="mp-card"
              style={{ textAlign: "center", padding: "4rem 2rem" }}
            >
              <Loader2
                size={44}
                style={{
                  margin: "0 auto 1.25rem auto",
                  color: "#2563eb",
                  animation: "spin 1s linear infinite",
                }}
              />
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#0f172a", fontSize: "1.1rem" }}>
                Verifying Tax Return Status & Authorization...
              </h4>
              <p style={{ color: "#64748b", margin: 0, fontSize: "0.925rem" }}>
                Connecting to Dollar Tax Secure System
              </p>
            </div>
          ) : eligibility.isEligible ? (
            /* ========================================================================= */
            /*  ELIGIBLE STATE: PAYMENT PENDING E-FILING or PAPER FILING                  */
            /* ========================================================================= */
            <div>
              {/* Stepper */}
              <div className="mp-stepper">
                <div
                  className={`mp-step ${activeStep >= 1 ? (activeStep === 1 ? "active" : "completed") : ""
                    }`}
                >
                  <div className="mp-step-number">
                    {activeStep > 1 ? <Check size={20} /> : "1"}
                  </div>
                  <span>1. Review & Payment Method</span>
                </div>
                <div className="mp-step-divider"></div>
                <div className={`mp-step ${activeStep === 2 ? "active completed" : ""}`}>
                  <div className="mp-step-number">2</div>
                  <span>2. Instant Receipt & Transmission</span>
                </div>
              </div>

              {activeStep === 1 ? (
                /* STEP 1: PAYMENT FORM & SUMMARY GRID */
                <div className="mp-grid">
                  {/* LEFT COLUMN: Payment Options & Details */}
                  <div>
                    {/* Filing Type Info Box */}
                    <div className="mp-card">
                      <div className="mp-card-header">
                        <h3 className="mp-card-title">
                          <FileText className="mp-card-title-icon" size={24} />
                          Filing Summary & Authorization
                        </h3>
                      </div>

                      {/* PayGlocal Payment Container (Direct) */}
                      <div className="mp-paypal-container">
                        <div className="mp-paypal-buttons-box">
                          <div className="mp-paypal-box-header">
                            <div className="mp-paypal-box-title">
                              <span className="mp-paypal-brand-badge">
                                <span style={{ color: "#0066cc", fontWeight: 900 }}>Pay</span>
                                <span style={{ color: "#00a8e8", fontWeight: 900 }}>Glocal</span>
                              </span>
                              <span className="mp-paypal-box-heading">Secure Checkout</span>
                            </div>
                            <span className="mp-paypal-secure-pill">
                              <Lock size={12} /> 256-Bit Encrypted
                            </span>
                          </div>

                          <p style={{ fontSize: "0.875rem", color: "#64748b", margin: "0 0 1.25rem 0", lineHeight: 1.5 }}>
                            Pay securely using International Credit/Debit Cards, UPI, NetBanking, or local currencies powered by PayGlocal global payment gateway.
                          </p>

                          <div className="mp-paypal-buttons-wrapper" style={{ minHeight: "auto" }}>
                            <button
                              type="button"
                              className="mp-payglocal-button"
                              onClick={handlePayGlocalPayment}
                              disabled={isProcessing}
                              style={{
                                width: "100%",
                                padding: "1rem 1.5rem",
                                backgroundColor: "#0066cc",
                                color: "white",
                                border: "none",
                                borderRadius: "10px",
                                fontSize: "1.05rem",
                                fontWeight: 700,
                                cursor: isProcessing ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.5rem",
                                boxShadow: "0 4px 14px rgba(0, 102, 204, 0.25)",
                                transition: "all 0.2s ease",
                                opacity: isProcessing ? 0.7 : 1,
                              }}
                              onMouseOver={(e) => {
                                if (!isProcessing) e.currentTarget.style.backgroundColor = "#0052a3";
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = "#0066cc";
                              }}
                            >
                              {isProcessing ? (
                                <>
                                  <Loader2
                                    size={20}
                                    style={{ animation: "spin 1s linear infinite" }}
                                  />
                                  <span>Processing PayGlocal Payment...</span>
                                </>
                              ) : (
                                <>
                                  <Lock size={20} />
                                  <span>Pay ${netTotal}.00 {currency}</span>
                                </>
                              )}
                            </button>
                          </div>

                          {paymentError && (
                            <div className="mp-promo-message error" style={{ marginTop: "1rem" }}>
                              {paymentError}
                            </div>
                          )}

                          <div className="mp-paypal-guarantee-footer">
                            <ShieldCheck size={18} className="mp-shield-icon" />
                            <span>
                              <strong>PCI DSS Level 1 Certified</strong> &bull; Your payment data is fully encrypted and secure.
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Order Summary */}
                  <div>
                    <div className="mp-summary-card">
                      <h3 className="mp-summary-title">
                        Order Summary
                        <BadgeCheck size={22} style={{ color: "#2c2f7e" }} />
                      </h3>

                      <div className="mp-summary-line">
                        <span>Tax Preparation Fee</span>
                        <span>${basePrepFee}.00</span>
                      </div>

                      {filingServiceFee > 0 && (
                        <div className="mp-summary-line">
                          <span>
                            {eligibility.type === "efiling"
                              ? "Referral Amount"
                              : "Paper Print & Tracked Shipping"}
                          </span>
                          <span>${filingServiceFee}.00</span>
                        </div>
                      )}

                      <div className="mp-summary-line">
                        <span>Referral Bonus</span>
                        <span>${referralBonus}.00</span>
                      </div>

                      <div className="mp-summary-line">
                        <span>Referral Credit</span>
                        <span>${referralCredit}.00</span>
                      </div>

                      {promoApplied && discountAmount > 0 && (
                        <div className="mp-summary-line discount">
                          <span>Promo Discount</span>
                          <span>-${discountAmount}.00</span>
                        </div>
                      )}

                      {/* Total Line */}
                      <div className="mp-total-line">
                        <span className="mp-total-label">Total Amount Due</span>
                        <span className="mp-total-amount">${netTotal}.00</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* STEP 2: CONFIRMATION & RECEIPT */
                <div className="mp-success-card">
                  <div className="mp-success-icon-wrapper">
                    <CheckCircle2 size={54} />
                  </div>

                  <h3 className="mp-success-title">Payment Successfully Verified!</h3>
                  <p className="mp-success-subtitle">
                    Thank you, {paymentDetails?.member_name || user?.name || "Valued Client"}. Your tax filing process is officially underway.
                  </p>

                  <div className="mp-receipt-box">
                    <div className="mp-receipt-row">
                      <span className="mp-receipt-label">Transaction ID</span>
                      <span className="mp-receipt-value">{transactionId}</span>
                    </div>
                    {paymentDetails?.payment_id && (
                      <div className="mp-receipt-row">
                        <span className="mp-receipt-label">Payment ID</span>
                        <span className="mp-receipt-value">{paymentDetails.payment_id}</span>
                      </div>
                    )}
                    <div className="mp-receipt-row">
                      <span className="mp-receipt-label">File Number</span>
                      <span className="mp-receipt-value">
                        {user?.file_no || user?.fileNumber || user?.account_no || user?.account_number || ""}
                      </span>
                    </div>
                    {/* <div className="mp-receipt-row">
                      <span className="mp-receipt-label">Filing Method</span>
                      <span className="mp-receipt-value">
                        {eligibility.type === "efiling"
                          ? "Electronic IRS & State E-Filing"
                          : "Paper Return Print & Courier Dispatch"}
                      </span>
                    </div> */}
                    <div className="mp-receipt-row">
                      <span className="mp-receipt-label">Payment Date</span>
                      <span className="mp-receipt-value">{paidDate}</span>
                    </div>
                    <div className="mp-receipt-row">
                      <span className="mp-receipt-label">Total Amount Paid</span>
                      <span
                        className="mp-receipt-value"
                        style={{ color: "#2c2f7e", fontSize: "1.15rem" }}
                      >
                        {netTotal}.00 {currency}
                      </span>
                    </div>
                  </div>

                  <div className="mp-actions-group">
                    <button
                      className="mp-btn-primary"
                      onClick={() => navigate("/dashboard")}
                    >
                      <Sparkles size={18} />
                      Go to Dashboard
                    </button>
                    <button
                      className="mp-btn-secondary"
                      onClick={() => navigate("/dashboard/download")}
                    >
                      <Download size={18} />
                      View Tax Returns
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
};

export default MakePayment;
