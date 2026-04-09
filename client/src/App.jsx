import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage    from "./pages/LandingPage";
import ScrollIntro    from "./pages/ScrollIntro";
import Auth           from "./pages/Auth";
import Signup         from "./pages/Signup";
import Dashboard      from "./pages/Dashboard";
import Expenses       from "./pages/Expenses";
import PurchaseRequests from "./pages/PurchaseRequests";
import History        from "./pages/History";
import Group          from "./pages/Group";
import Settings       from "./pages/Settings";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Privacy        from "./pages/Privacy";
import Terms          from "./pages/Terms";
import { AuthProvider }    from "./context/AuthContext.jsx";
import { PaymentProvider } from "./context/PaymentContext.jsx";
import { ToastProvider }   from "./context/ToastContext.jsx";
import AppCursor from "./components/AppCursor.jsx";
import MobileBlocker from "./components/MobileBlocker.jsx";
import OnboardingTour from "./components/OnboardingTour.jsx";
import { useAuth } from "./context/AuthContext.jsx";

const OnboardingTourWrapper = () => {
  const { user } = useAuth();
  return <OnboardingTour user={user} />;
};

const HomeRoute = () => {
  const [showIntro, setShowIntro] = useState(true);

  const handleComplete = () => {
    setShowIntro(false);
    window.scrollTo(0, 0);
  };

  return showIntro ? <ScrollIntro onComplete={handleComplete} /> : <LandingPage />;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <MobileBlocker>
            <AppCursor />
            <OnboardingTourWrapper />
            <PaymentProvider>
              <Routes>
                <Route path="/"                 element={<HomeRoute />} />
                <Route path="/login"            element={<Auth />} />
                <Route path="/signup"           element={<Signup />} />
                <Route path="/forgot"  element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/dashboard"        element={<Dashboard />} />
                <Route path="/expenses"         element={<Expenses />} />
                <Route path="/purchases"        element={<PurchaseRequests />} />
                <Route path="/history"          element={<History />} />
                <Route path="/group"            element={<Group />} />
                <Route path="/settings"         element={<Settings />} />
                <Route path="/privacy"          element={<Privacy />} />
                <Route path="/conditions"       element={<Terms />} />
              </Routes>
            </PaymentProvider>
          </MobileBlocker>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;