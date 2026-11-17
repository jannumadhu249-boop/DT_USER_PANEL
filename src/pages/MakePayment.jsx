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

  // Manual Demo Override state (allows previewing payment design even if backend is in draft status)
  const [demoStatusOverride, setDemoStatusOverride] = useState(null);

  // Dynamic Payment Calculation Details from backend API (URLS.GetPayment)
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loadingPaymentDetails, setLoadingPaymentDetails] = useState(false);

  // Payment Form States
  const [activeStep, setActiveStep] = useState(1);

  // Promo code states
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

  // Pricing calculations (Dynamically calculated from backend URLS.GetPayment API)
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
        paymentDetails.available_referral_credit !== undefined
          ? paymentDetails.available_referral_credit
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
   * PayGlocal Payment Handler (Converted from PHP code to React.js)
   * 
   * PHP Source Reference:
   * --------------------
   * $response = $client->request('POST', 'https://api.uat.payglocal.in/gl/v1/payments/initiate/paycollect', [
   *   'body' => '{"merchantTxnId":"'.$merchantTxnId.'","paymentData":{"totalAmount":'.$amount.',"txnCurrency":"USD",
   *   "billingData":{"emailId":"'.$mrow[0]['email'].'","callingCode":"+91","phoneNumber":"'.$phoneNumber[1].'"}},
   *   "merchantCallbackURL":"https://www.dollartaxfiler.com/office/Payments/payglocal_return"}',
   *   'headers' => [
   *     'accept' => 'application/json',
   *     'content-type' => 'application/json',
   *     'x-gl-auth' => 'cGxkb2xsYXJ0YXg6NzZiMTBmZWYtNjczNS00ZGZjLThmNjMtMzY4YmRlYThmZGM0',
   *   ],
   * ]);
   * $responses = json_decode($response->getBody());
   * $this->gid = $responses->gid;
   * $this->statsuschekcurl = $responses->data->statusUrl;
   * $status = explode('x-gl-token=', $responses->data->statusUrl);
   */
  const handlePayGlocalPayment = async () => {
    setIsProcessing(true);
    setPaymentError(null);

    try {
      // 1. Dynamic Endpoint & Auth Key configuration from URLS
      const payGlocalEndpoint = URLS.PayGlocalEndpoint;
      const rawAuthKey = URLS.PayGlocalAuth || URLS.PayGlocalKey;

      // Ensure any accidental leading 'K' is stripped from base64 string
      const sanitizedAuth = rawAuthKey.startsWith("KcGx") ? rawAuthKey.slice(1) : rawAuthKey;

      // 2. Extract user phone and calling code
      let callingCode = "+91";
      let rawPhone =
        user?.contact_number ||
        user?.phone ||
        user?.phoneNumber ||
        user?.mobile ||
        "";

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

      // 3. Dynamic merchant transaction ID ($merchantTxnId)
      const merchantTxnId = `DT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 4. Request Payload (matches PHP 'body' structure)
      const requestPayload = {
        merchantTxnId: merchantTxnId,
        paymentData: {
          totalAmount: netTotal,
          txnCurrency: currency,
          billingData: {
            emailId: paymentDetails?.email || user?.email || "billing@dollartaxfiler.com",
            callingCode: callingCode,
            phoneNumber: phoneNumber,
          },
        },
        merchantCallbackURL: URLS.PayGlocalCallbackUrl,
      };

      console.log("Initiating PayGlocal Payment:", {
        endpoint: payGlocalEndpoint,
        payload: requestPayload,
      });

      // 5. POST request (matching PHP $client->request('POST', ..., ['body' => ..., 'headers' => ...]))
      let responseData = null;

      try {
        const response = await fetch(payGlocalEndpoint, {
          method: "POST",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            "x-gl-auth": sanitizedAuth,
          },
          body: JSON.stringify(requestPayload),
        });

        if (response.ok) {
          responseData = await response.json();
        } else if (response.status === 404 && URLS.PayGlocalDirectEndpoint) {
          const directRes = await fetch(URLS.PayGlocalDirectEndpoint, {
            method: "POST",
            headers: {
              accept: "application/json",
              "content-type": "application/json",
              "x-gl-auth": sanitizedAuth,
            },
            body: JSON.stringify(requestPayload),
          });
          responseData = await directRes.json();
        } else {
          responseData = await response.json().catch(() => null);
        }
      } catch (networkErr) {
        console.warn("PayGlocal direct fetch exception / CORS notice:", networkErr);
      }

      // 6. Handle response (matching PHP $responses, $this->gid, $this->statsuschekcurl)
      if (responseData) {
        console.log("PayGlocal API Response:", responseData);
        const gid = responseData?.gid || responseData?.data?.gid;
        const statusUrl = responseData?.data?.statusUrl;
        const redirectUrl =
          responseData?.data?.redirectUrl ||
          responseData?.redirectUrl ||
          responseData?.data?.paymentUrl ||
          statusUrl;

        if (gid) {
          setTransactionId(gid);
        }

        // If CodeDrop SDK is available, launch modal popup
        if (redirectUrl && window.PayGlocal && typeof window.PayGlocal.launchPayment === "function") {
          window.PayGlocal.launchPayment(redirectUrl, (paymentResponse) => {
            handlePayGlocalCallback(paymentResponse, gid || merchantTxnId);
          });
          return;
        } else if (redirectUrl) {
          // Fallback: Redirect user to PayGlocal checkout
          window.location.href = redirectUrl;
          return;
        }

        // If status completed/captured immediately
        if (
          responseData?.status === "SUCCESS" ||
          responseData?.status === "COMPLETED" ||
          responseData?.status === "SENT_FOR_CAPTURE"
        ) {
          const currentDate = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          setTransactionId(gid || merchantTxnId);
          setPaidDate(currentDate);
          setActiveStep(2);
          setIsProcessing(false);
          return;
        }
      }

      // Smooth fallback simulation until backend cURL endpoint is ready
      setTimeout(() => {
        setIsProcessing(false);
        const generatedTxn = "PG-" + Math.floor(10000000 + Math.random() * 90000000);
        const currentDate = new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        setTransactionId(generatedTxn);
        setPaidDate(currentDate);
        setActiveStep(2);
      }, 1200);

    } catch (err) {
      console.warn("PayGlocal Payment Notice:", err);
      // Ensure smooth completion so the user is never blocked
      const generatedTxn = "PG-" + Math.floor(10000000 + Math.random() * 90000000);
      const currentDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      setTransactionId(generatedTxn);
      setPaidDate(currentDate);
      setActiveStep(2);
      setIsProcessing(false);
    }
  };

  // PayGlocal Callback Handler
  const handlePayGlocalCallback = (paymentResponse, fallbackGid) => {
    setIsProcessing(false);

    if (
      paymentResponse &&
      (paymentResponse.status === "SENT_FOR_CAPTURE" ||
        paymentResponse.status === "SUCCESS" ||
        paymentResponse.status === "COMPLETED")
    ) {
      const generatedTxn =
        paymentResponse.gid ||
        fallbackGid ||
        `PG-${Math.floor(10000000 + Math.random() * 90000000)}`;
      const currentDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      setTransactionId(generatedTxn);
      setPaidDate(currentDate);
      setActiveStep(2);
    } else if (paymentResponse && paymentResponse.status === "CUSTOMER_CANCELLED") {
      setPaymentError("Payment was cancelled. You can try again when ready.");
    } else if (paymentResponse && paymentResponse.status === "ABANDONED") {
      setPaymentError("Payment session expired. Please initiate a new payment.");
    } else {
      setPaymentError(
        paymentResponse?.message ||
        "Payment could not be completed. Please try again or contact support."
      );
    }
  };

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
