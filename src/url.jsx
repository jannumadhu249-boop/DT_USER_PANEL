// const base_url = "http://187.127.143.141:4000/"

const base_url = "http://72.61.116.4:8000/"

export const URLS = {

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

}
