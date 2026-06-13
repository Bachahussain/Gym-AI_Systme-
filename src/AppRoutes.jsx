import { Routes, Route } from "react-router-dom";
import Signup from "./Signup";
import Login from "./Login";
import VerifyOtp from "./VerifyOtp";
import Home from "./Home";
import About from "./About";
import Contact from "./Contact";
import PrivateRoute from "./PrivateRoute";
import Workout from "./Workout";
import Nutrition from "./Nutrition";
import Analytics from "./Analytics";
import ProfileSetup from "./ProfileSetup";
import Premium from "./Premium";
import AccountSettings from "./AccountSettings";
function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />

      {/* Private routes */}

      <Route
        path="/profile-setup"
        element={
          <PrivateRoute>
            <ProfileSetup />
          </PrivateRoute>
        }
      />

      <Route
        path="/home"
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      />

      <Route
        path="/about"
        element={
          <PrivateRoute>
            <About />
          </PrivateRoute>
        }
      />
      <Route
        path="/contact"
        element={
          <PrivateRoute>
            <Contact />
          </PrivateRoute>
        }
      />
      <Route
        path="/workout"
        element={
          <PrivateRoute>
            <Workout />
          </PrivateRoute>
        }
      />
      <Route
        path="/nutrition"
        element={
          <PrivateRoute>
            <Nutrition />
          </PrivateRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <PrivateRoute>
            <Analytics />
          </PrivateRoute>
        }
      />
      <Route
        path="/premium"
        element={
          <PrivateRoute>
            <Premium />
          </PrivateRoute>
        }
      />

      <Route
        path="/account-settings"
        element={
          <PrivateRoute>
            <AccountSettings />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
export default AppRoutes;