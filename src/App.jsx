import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Components/Login";
import Register from "./Components/Register";
import ForgotPassword from "./Components/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import ClientDashboard from "./pages/ClientDashboard";
import Taxpayer from "./pages/Taxpayer";
import Spouse from "./pages/Spouse";
import Dependent from "./pages/Dependent";
import AddressInTaxYear from "./pages/AddressInTaxYear";
import BankDetails from "./pages/BankDetails";
import UploadDocuments from "./pages/UploadDocuments";
import ChangePassword from "./pages/ChangePassword";
import ScheduleTaxConsultation from "./pages/ScheduleTaxConsulation";
import ReferDetails from "./pages/ReferDetails";
import ReferFriend from "./pages/ReferFriend";
import DownloadTaxReturns from "./pages/DownloadTaxReturns";
import FBARQuestionnaire from "./pages/FBARQuestionnaire";
import TaxOrganizer from "./pages/TaxOrganizer";
import MyTaxSummary from "./pages/MyTaxSummary/MyTaxSummary";
import SendQuery from "./pages/SendQuery";
import VerifyEmail from "./pages/VerifyEmail";
import MakePayment from "./pages/MakePayment";
import Profile from "./pages/Profile";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<ClientDashboard />} />
        <Route path="/client-dashboard" element={<ClientDashboard />} />
        <Route path="/dashboard-legacy" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/taxpayer" element={<Taxpayer />} />
        <Route path="/spouse" element={<Spouse />} />
        <Route path="/dependent" element={<Dependent />} />
        <Route path="/address-in-tax-year" element={<AddressInTaxYear />} />
        <Route path="/bank-details" element={<BankDetails />} />
        {/* Legacy routes for backward compatibility */}
        <Route path="/dashboard/basic-info/taxpayer" element={<Taxpayer />} />
        <Route path="/dashboard/basic-info/spouse" element={<Spouse />} />
        <Route path="/dashboard/basic-info/dependent" element={<Dependent />} />
        <Route path="/dashboard/basic-info/address" element={<AddressInTaxYear />} />
        <Route path="/dashboard/basic-info/bank" element={<BankDetails />} />
        <Route path="/dashboard/upload" element={<UploadDocuments />} />
        <Route path="/dashboard/schedule" element={<ScheduleTaxConsultation />} />
        <Route path="/dashboard/tax-summary" element={<MyTaxSummary />} />
        <Route path="/dashboard/referrals" element={<ReferDetails />} />
        <Route path="/referrals/refer-friend" element={<ReferFriend />} />
        <Route path="/dashboard/download" element={<DownloadTaxReturns />} />
        <Route path="/dashboard/fbar" element={<FBARQuestionnaire />} />
        <Route path="/dashboard/organizer" element={<TaxOrganizer />} />
        <Route path="/dashboard/make-payment" element={<MakePayment />} />
        <Route path="/send-query" element={<SendQuery />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Routes>
    </Router>
  );
}

export default App;