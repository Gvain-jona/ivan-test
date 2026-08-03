import Image from 'next/image';
import { SignIn } from '@clerk/nextjs';
import '../signin.css';

export default function SignInPage() {
  return (
    <div className="signin-container">
      {/* Background patterns */}
      <div className="grid-pattern" />
      <div className="starry-background" />

      {/* Company logo and branding */}
      <div className="logo-container">
        <div className="relative w-16 h-16">
          <Image
            src="/images/default-logo.svg"
            alt="YOKO Logo"
            className="signin-logo"
            fill
            priority
          />
        </div>
        <h1 className="signin-title">YOKO</h1>
        <p className="signin-subtitle">Print Management System</p>
      </div>

      <SignIn path="/auth/signin" fallbackRedirectUrl="/dashboard/orders" />

      {/* Footer */}
      <div className="signin-footer">
        &copy; {new Date().getFullYear()} YOKO. All rights reserved.
      </div>
    </div>
  );
}
