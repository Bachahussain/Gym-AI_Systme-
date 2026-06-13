import React from 'react';
import './AppRoutes.jsx';
import AuthLayout from './components/auth/AuthLayout';
import OtpForm from './components/auth/OtpForm';

function VerifyOtp() {
  return (
    <AuthLayout>
      <OtpForm />
    </AuthLayout>
  )
}
export default VerifyOtp;
