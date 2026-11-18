// const base_url = "http://187.127.143.141:4000/"

const base_url = "http://72.61.116.4:8000/"

// joined, so the resulting URL never contains a double slash.
export const BASE_ORIGIN = base_url.replace(/\/+$/, "")

// Public address of this client panel, used only to build shareable links.
export const APP_PUBLIC_URL = ""

// Registration link handed out by "Refer a Friend". The code is encoded so it
// cannot break the URL, and the base is normalised so no double slash appears.
export const buildReferralRegisterLink = (code = "", baseUrl = BASE_ORIGIN) => {
    const base = String(baseUrl || BASE_ORIGIN).trim().replace(/\/+$/, "")
    const value = String(code).trim()
    if (!value || !base) return ""
    return `${base}/register?referral_code=${encodeURIComponent(value)}`
}

// Bare IPv4 literal, e.g. 72.61.116.4
const IPV4_HOST_REGEX = /^\d{1,3}(\.\d{1,3}){3}$/

// Loopback and private ranges cannot be reached from the internet, so they are
// never turned into a public hostname.
const isPrivateIpv4 = (host = "") => {
    if (host.startsWith("10.") || host.startsWith("127.") || host.startsWith("169.254.")) return true
    if (host.startsWith("192.168.")) return true
    const secondOctet = Number(host.split(".")[1])
    return host.startsWith("172.") && secondOctet >= 16 && secondOctet <= 31
}

// sslip.io is a public wildcard DNS where "a.b.c.d.sslip.io" resolves to a.b.c.d,
// so an IP hosted panel can be shared as a direct link with a real domain (chat
// apps only linkify domains). Only a bare public IP is rewritten: localhost,
// private ranges and every real domain — including a configured public URL — are
// returned exactly as they came in, so no sslip.io name is ever added to them.
export const toShareableHost = (hostname = "") => {
    const host = String(hostname).trim().toLowerCase()
    if (!IPV4_HOST_REGEX.test(host) || isPrivateIpv4(host)) return host
    return `${host}.sslip.io`
}

// Base used for share links only (never for API calls):
// 1. VITE_APP_URL / APP_PUBLIC_URL when a public domain is configured — used as
//    is, the sslip.io mapping is skipped entirely.
// 2. Otherwise the address the panel is opened on, with a public IP host mapped
//    to its sslip.io name.
// The trailing slash is stripped so callers can always join with "/path".
export const getShareBaseUrl = () => {
    const configured = (import.meta.env.VITE_APP_URL || APP_PUBLIC_URL || "").trim()
    if (configured) return configured.replace(/\/+$/, "")
    const { protocol, hostname, port } = window.location
    const basePath = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "")
    return `${protocol}//${toShareableHost(hostname)}${port ? `:${port}` : ""}${basePath}`
}

// Final referral link used by every share channel and by "Copy link".
export const buildReferralLink = (code = "") => buildReferralRegisterLink(code, getShareBaseUrl())

export const URLS = {


    // Backend Payment Initiation Endpoint
    InitiatePayment : base_url + "v1/dollarTax/user/userPayment/initiatePayment",
    PayGlocalKey : "cGxkb2xsYXJ0YXhmaWxlOmtJZC1zYnlYcnY2d2xuMlNob2kx",
    PayGlocalAuth : "cGxkb2xsYXJ0YXg6NzZiMTBmZWYtNjczNS00ZGZjLThmNjMtMzY4YmRlYThmZGM0",
    PayGlocalEndpoint : "/payglocal-api/gl/v1/payments/initiate/paycollect",
    PayGlocalDirectEndpoint : "https://api.uat.payglocal.in/gl/v1/payments/initiate/paycollect",
    PayGlocalCallbackUrl : "https://www.dollartaxfiler.com/office/Payments/payglocal_return",
    

    Base_Url : base_url,
    ImageUrl : base_url,


    //Authentication
    Registration : base_url + "v1/dollarTax/user/auth/register",
    GenerateEmailOtp : base_url + "v1/dollarTax/user/auth/sendEmailOtp",
    VerificationEmailOtp : base_url + "v1/dollarTax/user/auth/verifyEmailOtp",
    Login : base_url + "v1/dollarTax/user/auth/login",
    GetProfile : base_url + "v1/dollarTax/user/auth/getMemberProfile",
    ChangePassword : base_url + "v1/dollarTax/user/auth/changePassword",
    SendEmailLoginOtp : base_url + "v1/dollarTax/user/auth/sendMemberLoginOtp",
    VerifyEmailLoginOtp : base_url + "v1/dollarTax/user/auth/verifyMemberLoginOtp",
    UpdateProfileEmailWithOtp : base_url + "v1/dollarTax/user/auth/sendProfileEmailOtp",
    VerifyProfileEmailOtp : base_url + "v1/dollarTax/user/auth/verifyProfileEmailOtp",
    SendAlternateEmailOtp : base_url + "v1/dollarTax/user/auth/sendAlternateEmailOtp",
    VerifyAlternateEmailOtp : base_url + "v1/dollarTax/user/auth/verifyAlternateEmailOtp",
    UpdateProfilePhoneNUmber : base_url + "v1/dollarTax/user/auth/updateProfilePhone",

    //Forgot Password
    GenerateOtp : base_url + "v1/dollarTax/user/auth/generateForgotPasswordOtp",
    VerifyOtp : base_url + "v1/dollarTax/user/auth/verifyForgotPasswordOtp",
    ResetPassword : base_url + "v1/dollarTax/user/auth/resetPassword",

    // TaxPayer
    GetTaxPayer : base_url + "v1/dollarTax/user/taxpayer/getTaxpayer",
    UpdateTaxPayer : base_url + "v1/dollarTax/user/taxpayer/updateTaxpayer",

    // Spouse 
    GetSpouse : base_url + "v1/dollarTax/user/spouse/getSpouse",
    UpdateSpouse : base_url + "v1/dollarTax/user/spouse/updateSpouse",

    // Dependent
    GetDependent : base_url  + "v1/dollarTax/user/dependent/getDependents",
    CreateDependent : base_url + "v1/dollarTax/user/dependent/createDependent",
    GetByIdDenpendent : base_url + "v1/dollarTax/user/dependent/getDependentById/",
    UpdateDependent : base_url + "v1/dollarTax/user/dependent/updateDependent/",
    DeleteDependent : base_url + "v1/dollarTax/user/dependent/deleteDependent/",

    // Address Tax Payer
    GetAddressTaxPayer : base_url + "v1/dollarTax/user/address/getAddress",
    GetStates : base_url + "v1/dollarTax/user/address/getStates",
    CreateAddressTaxPayer : base_url + "v1/dollarTax/user/address/createAddress", 
    GetByIdAddressTaxPayer : base_url + "v1/dollarTax/user/address/getAddressById/",
    UpdateAddressTaxPayer : base_url + "v1/dollarTax/user/address/updateAddress/",
    DeleteAddressTaxPayer : base_url + "v1/dollarTax/user/address/deleteAddress/",

    // Bank Details
    GetBankDetails : base_url + "v1/dollarTax/user/bankDetails/getBankDetails",
    UpdateBankDetails : base_url + "v1/dollarTax/user/bankDetails/updateBankDetails",

    // Document Uploads
    GetDocumentType : base_url + "v1/dollarTax/user/uploadDoc/getDocumentTypes",
    GetDocuments : base_url + "v1/dollarTax/user/uploadDoc/getDocuments",
    UploadDocuments : base_url + "v1/dollarTax/user/uploadDoc/uploadDocument",
    GetByIdDouments : base_url + "v1/dollarTax/user/uploadDoc/getDocument/",
    DeleteDocument : base_url + "v1/dollarTax/user/uploadDoc/deleteDocument/",

    // Schedule Tax Note
    GetScheduleTaxNote : base_url + "v1/dollarTax/user/scheduleTaxNote/getScheduleTaxNote",
    GetTimeSlote : base_url + "v1/dollarTax/user/scheduleTaxNote/getTimeSlots",
    ScheduleTaxNote : base_url + "v1/dollarTax/user/scheduleTaxNote/scheduleTaxNote",

    // Download Tax Return
    GetDownloadTaxReturn : base_url + "v1/dollarTax/user/taxReturns/getDownloadTaxReturns",

    // Refer Friend
    GetReferrals : base_url + "v1/dollarTax/user/refer/getMyReferrals",
    ReferFriend : base_url + "v1/dollarTax/user/refer/referFriend",
    GetReferralCode : base_url + "v1/dollarTax/user/refer/getReferralCode",

    // Send Query
    SendQuery : base_url + "v1/dollarTax/user/query/sendQuery",
    GetQueries : base_url + "v1/dollarTax/user/query/getMyQueries",

    // Notifications
    GetNotificationCount : base_url + "v1/dollarTax/user/query/getNotificationCount",
    GetNotificationsList : base_url + "v1/dollarTax/user/query/getNotifications",
    MarkNotificationRead : base_url + "v1/dollarTax/user/query/markNotificationAsRead/",

    // Dashboard
    GetDashboard : base_url + "v1/dollarTax/user/userDashboard/get",
    SendMessage : base_url + "v1/dollarTax/user/userDashboard/sendDashboardMessage",
    
    // Tax Organizer year
    GetTaxOrganizerYear : base_url + "v1/dollarTax/admin/years/getCurrentYear",

    // My Tax Summary
    GetMyTaxSummary : base_url + "v1/dollarTax/user/taxReturns/getMyTaxSummary",
    
    // Document Downloads
    GetFbarDocuments : base_url + "v1/dollarTax/user/document/getAll/fbar",
    GetTaxOrganizerDocuments : base_url + "v1/dollarTax/user/document/getAll/tax-organizer",
    DownloadFbarQuestionnaire : base_url + "v1/dollarTax/user/document/download/fbar/",
    DownloadTaxOrganizer : base_url + "v1/dollarTax/user/document/download/tax-organizer/",

    // PayGlocal Payment Gateway Configuration
    GetPayment : base_url + "v1/dollarTax/user/userPayment/calculatePayment/",
    UpdatePayment : base_url + "v1/dollarTax/user/userPayment/verifyAndUpdatePayment/",

}
