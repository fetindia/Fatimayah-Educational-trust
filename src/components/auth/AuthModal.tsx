/**
 * @license
 * Authentication & Access Portal Modal
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Globe, 
  AlertCircle, 
  CheckCircle2, 
  LogIn, 
  UserPlus, 
  Send, 
  ShieldCheck
} from 'lucide-react';
import { FETLogo } from '../common/FETLogo';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const { currentUser, signInEmail, signUpEmail, resetPassword, signInGoogle } = useAuth();
  const { config } = useConfig();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  
  // Form input states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [country, setCountry] = useState('India');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Status & feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resetFormState = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleClose = () => {
    resetFormState();
    setIsLoading(false);
    onClose();
  };

  // Auto-close modal and transition immediately if currentUser becomes authenticated
  useEffect(() => {
    if (isOpen && currentUser) {
      handleClose();
      if (onAuthSuccess) onAuthSuccess();
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const formatErrorMessage = (err: any): string => {
    const errorCode = err?.code || '';
    const rawMsg = err?.message || '';

    if (errorCode === 'auth/email-already-in-use') {
      return 'An account with this email address already exists. Please sign in or reset your password.';
    }
    if (errorCode === 'auth/invalid-email') {
      return 'The email address entered is not valid. Please verify the format.';
    }
    if (errorCode === 'auth/weak-password') {
      return 'The password is too weak. Please choose a password with at least 6 characters.';
    }
    if (errorCode === 'auth/network-request-failed') {
      return 'Network connection failure. Please check your internet connection and try again.';
    }
    if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
      return 'Invalid email or password credentials. Please verify your details or use Google Sign-in.';
    }
    if (errorCode === 'auth/too-many-requests') {
      return 'Access temporarily blocked due to multiple attempts. Please try again in a few minutes or reset your password.';
    }
    if (errorCode === 'auth/user-disabled') {
      return 'This account has been disabled. Please contact Trust administration.';
    }
    if (errorCode === 'auth/account-exists-with-different-credential') {
      return 'An account already exists with this email address using a different sign-in method. Please sign in with your email & password, or use password recovery.';
    }
    if (errorCode === 'auth/unauthorized-domain') {
      return 'This web domain is not authorized for Firebase Authentication OAuth. Please add this domain under Firebase Console -> Authentication -> Settings -> Authorized domains.';
    }
    if (errorCode === 'auth/operation-not-allowed' || rawMsg.includes('operation-not-allowed')) {
      return 'The requested sign-in provider is not enabled in the Firebase Console. Please verify that Email/Password and Google sign-in are enabled under Firebase Console -> Authentication -> Sign-in method.';
    }
    if (errorCode === 'auth/popup-closed-by-user' || errorCode === 'auth/cancelled-popup-request') {
      return '';
    }
    if (errorCode === 'auth/popup-blocked') {
      return 'Sign-in popup was blocked by your browser. Please allow popups for this website.';
    }
    return rawMsg || 'An authentication error occurred. Please try again.';
  };

  const validateSignup = (): string | null => {
    // 1. Full Legal Name
    if (!fullName.trim() || fullName.trim().length < 3) {
      return 'Please enter your complete Full Legal Name (minimum 3 characters).';
    }

    // 2. Email Address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      return 'Please enter a valid email address (e.g. name@domain.com).';
    }

    // 3. Mobile Number
    const cleanMobile = mobileNumber.trim().replace(/[\s-]/g, '');
    const phoneRegex = /^\+?[0-9]{10,14}$/;
    if (!cleanMobile || !phoneRegex.test(cleanMobile)) {
      return 'Please enter a valid 10-digit mobile phone number (e.g. +91 9876543210 or 9876543210).';
    }

    // 4. Country
    if (!country.trim() || country.trim().length < 2) {
      return 'Please specify your Country.';
    }

    // 5. Password
    if (!password || password.length < 6) {
      return 'Password must be at least 6 characters in length.';
    }

    // 6. Confirm Password
    if (password !== confirmPassword) {
      return 'Passwords do not match. Please verify and re-type both password fields.';
    }

    // 7. Accept Terms & Conditions
    if (!termsAccepted) {
      return 'Please accept the Fatimyah Educational Trust Terms of Service and Privacy Policy to create an account.';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        if (!email.trim() || !password) {
          throw new Error('Please enter both your registered email address and password.');
        }
        await signInEmail(email, password);
        handleClose();
        if (onAuthSuccess) onAuthSuccess();
      } else if (mode === 'signup') {
        const validationError = validateSignup();
        if (validationError) {
          throw new Error(validationError);
        }

        await signUpEmail(
          email.trim(),
          password,
          fullName.trim(),
          mobileNumber.trim(),
          country.trim(),
          termsAccepted
        );

        // Account created, email verification dispatched, default role member assigned
        // Modal closes cleanly and navigates to Member Dashboard / Verification gate
        handleClose();
        if (onAuthSuccess) onAuthSuccess();
      } else if (mode === 'forgot') {
        if (!email.trim()) {
          throw new Error('Please provide your registered email address.');
        }
        await resetPassword(email);
        setSuccessMsg(`Official password recovery instructions have been dispatched to ${email}. Please check your inbox and spam folder.`);
      }
    } catch (err: any) {
      const msg = formatErrorMessage(err);
      if (msg) setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    resetFormState();
    setIsLoading(true);
    try {
      await signInGoogle();
      handleClose();
      if (onAuthSuccess) onAuthSuccess();
    } catch (err: any) {
      const msg = formatErrorMessage(err);
      if (msg) setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" id="fet-auth-modal">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 relative my-6 animate-in fade-in zoom-in-95">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
          aria-label="Close"
          id="close-auth-modal-btn"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="flex justify-center">
            <FETLogo size="sm" showTagline={false} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            {mode === 'signin' && 'Sign in to FET India'}
            {mode === 'signup' && 'Create Member / Volunteer Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {mode === 'signin' && 'Access member portal, scholarship tracker, and 80G tax donation receipts'}
            {mode === 'signup' && 'Register for official trust digital membership with verified credentials'}
            {mode === 'forgot' && 'Enter your registered email address to receive password reset instructions'}
          </p>
        </div>

        {/* Feedback: Error Message */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-rose-900 leading-snug">{errorMsg}</p>
                {errorMsg.includes('Firebase Console') && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="px-3 py-1.5 rounded-lg bg-rose-900 text-white hover:bg-rose-800 text-[11px] font-bold transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      Sign In with Google Instead →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Feedback: Success Message */}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Google One-Click Sign-in Button */}
        {mode !== 'forgot' && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-xs flex items-center justify-center gap-3 transition-all hover:border-slate-400 active:scale-98 cursor-pointer disabled:opacity-50"
              id="google-signin-btn"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.43 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.19 0 10.04 0 12s.45 3.81 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.57 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.93 6.72-4.93z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-2 text-[10px] font-semibold uppercase text-slate-400 shrink-0">
                or continue with email
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5" id="fet-auth-form">
          {/* Field 1: Full Legal Name (Signup only) */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="reg-fullname">
                Full Legal Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="reg-fullname"
                  type="text"
                  required
                  placeholder="e.g. Dr. Ahmed Khan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                />
              </div>
            </div>
          )}

          {/* Field 2: Email Address (Common) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="auth-email">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="auth-email"
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Field 3: Mobile Number (Signup only) */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="reg-mobile">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="reg-mobile"
                  type="tel"
                  required
                  placeholder="e.g. +91 9876543210"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                />
              </div>
            </div>
          )}

          {/* Field 4: Country (Signup only) */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="reg-country">
                Country <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="reg-country"
                  type="text"
                  required
                  placeholder="e.g. India"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                />
              </div>
            </div>
          )}

          {/* Field 5: Password (Sign In & Sign Up) */}
          {mode !== 'forgot' && (
            <>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700" htmlFor="auth-password">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        resetFormState();
                        setMode('forgot');
                      }}
                      className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-password"
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* Field 6: Confirm Password (Signup only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="reg-confirm-password">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="reg-confirm-password"
                      type="password"
                      required
                      placeholder="Re-enter same password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Field 7: Accept Terms & Conditions (Signup only) */}
          {mode === 'signup' && (
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-slate-600">
                <input
                  id="reg-terms-checkbox"
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                />
                <span>
                  I accept the{' '}
                  <span className="font-bold text-slate-900">Terms of Service</span> and{' '}
                  <span className="font-bold text-slate-900">Privacy Policy</span> of Fatimyah Educational Trust.
                </span>
              </label>
            </div>
          )}

          {/* Informative Note on Signup */}
          {mode === 'signup' && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                New public registrations are assigned the <strong>Member</strong> role. Administrative access is restricted to verified Trust officials.
              </span>
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            id="auth-submit-btn"
            className="w-full py-3 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: config.primaryGreen || '#0D6E42' }}
          >
            {isLoading ? (
              <span className="animate-pulse">Processing Request...</span>
            ) : (
              <>
                {mode === 'signin' && <LogIn className="w-4 h-4" />}
                {mode === 'signup' && <UserPlus className="w-4 h-4" />}
                {mode === 'forgot' && <Send className="w-4 h-4" />}
                <span>
                  {mode === 'signin' && 'Sign In to Portal'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot' && 'Send Recovery Link'}
                </span>
              </>
            )}
          </button>
        </form>

        {/* Mode Switchers */}
        <div className="text-center text-xs text-slate-600 pt-2 border-t border-slate-100">
          {mode === 'signin' && (
            <p>
              Don't have an account?{' '}
              <button
                onClick={() => {
                  resetFormState();
                  setMode('signup');
                }}
                className="font-bold text-emerald-700 hover:underline cursor-pointer"
                id="switch-to-signup-btn"
              >
                Register Here
              </button>
            </p>
          )}
          {mode === 'signup' && (
            <p>
              Already registered?{' '}
              <button
                onClick={() => {
                  resetFormState();
                  setMode('signin');
                }}
                className="font-bold text-emerald-700 hover:underline cursor-pointer"
                id="switch-to-signin-btn"
              >
                Sign In Instead
              </button>
            </p>
          )}
          {mode === 'forgot' && (
            <p>
              Remember your password?{' '}
              <button
                onClick={() => {
                  resetFormState();
                  setMode('signin');
                }}
                className="font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                Back to Sign In
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

