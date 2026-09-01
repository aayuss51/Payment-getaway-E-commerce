import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { signInWithPopup, GoogleAuthProvider, AuthError, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { BackButton } from '../components/BackButton';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, LogIn, AlertCircle, Loader2, Mail, Settings, UserPlus, ShieldAlert } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

export const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ADMIN_EMAILS = ['sales@bazaar.com', 'admin@bazaar.np', 'bazaar@admin.com', 'admin@bazar.com'];
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [success, setSuccess] = useState<React.ReactNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [authStep, setAuthStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'register') {
      setShowEmailLogin(true);
      setIsRegistering(true);
    } else {
      setIsRegistering(false);
      // If they explicitly clicked login, we might want to show the email login form if that's what they were using
      // or just reset to the initial state. Let's reset to initial state for clarity.
      setShowEmailLogin(false);
    }
  }, [searchParams]);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+977');
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const countries = [
    { name: 'Nepal', code: '+977', flag: '🇳🇵' },
    { name: 'India', code: '+91', flag: '🇮🇳' },
    { name: 'USA', code: '+1', flag: '🇺🇸' },
    { name: 'UK', code: '+44', flag: '🇬🇧' },
    { name: 'UAE', code: '+971', flag: '🇦🇪' },
    { name: 'Australia', code: '+61', flag: '🇦🇺' },
    { name: 'Canada', code: '+1', flag: '🇨🇦' },
    { name: 'Japan', code: '+81', flag: '🇯🇵' },
  ];

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const fullPhoneNumber = `${countryCode}${phoneNumber}`;
    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase().trim());

    if (authStep === 'form') {
      if (!isRegistering) {
        // Login flow: No OTP required
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          
          let userData;
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            userData = userDoc.data();
          } catch (error) {
            handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          }
          
          if (userData?.role === 'admin' || (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase().trim()))) {
            navigate('/admin');
          } else {
            const redirect = searchParams.get('redirect');
            navigate(redirect ? decodeURIComponent(redirect) : '/');
          }
          return;
        } catch (err) {
          const authError = err as AuthError;
          console.error("Login failed:", authError.code, authError.message);
          if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
            setError("Invalid email or password. Please try again.");
          } else {
            setError(authError.message || "An unexpected error occurred. Please try again.");
          }
          setIsLoading(false);
          return;
        }
      }

      // Registration flow: Validation and OTP
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setIsLoading(false);
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        setIsLoading(false);
        return;
      }

      // Send OTP for registration
      try {
        const purpose = "register your account";
        const response = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, purpose }),
        });
        const data = await response.json();
        if (data.success) {
          setAuthStep('otp');
          if (data.simulated) {
            setSuccess(
              <div className="text-left">
                <p className="font-bold mb-1">Simulation Mode Active:</p>
                <p className="text-sm mb-2">The email system encountered an error (likely authentication).</p>
                <div className="text-xs text-gray-600 space-y-2">
                  <p>1. Check if <strong>supportbazaar@gmail.com</strong> is spelled correctly in your Settings.</p>
                  <p>2. Ensure you are using a 16-character <strong>App Password</strong>.</p>
                  <p className="font-bold text-secondary">3. For now, the verification code has been logged to the server console. Please check the logs to proceed.</p>
                </div>
              </div>
            );
          } else {
            setSuccess("Verification code sent to your email.");
          }
          setIsLoading(false);
          return;
        } else {
          if (data.code === 'AUTH_FAILED') {
            setError(
              <div className="text-left bg-red-50 p-6 rounded-2xl border border-red-100 space-y-4">
                <div className="flex items-center gap-2 text-red-800">
                  <ShieldAlert className="w-5 h-5" />
                  <p className="font-bold text-xs  ">Email System Error (535)</p>
                </div>
                <p className="text-[13px] text-red-700 leading-relaxed font-medium">Gmail rejected your credentials. You must use an "App Password", not your regular password.</p>
                <div className="space-y-2 py-2 border-y border-red-200/50">
                  <p className="text-[11px] font-bold text-red-800  ">How to solve:</p>
                  <ol className="text-[11px] space-y-1.5 list-decimal pl-4 text-red-700 font-sans">
                    <li>Go to your Google Account Security settings</li>
                    <li>Enable <strong>2-Step Verification</strong></li>
                    <li>Search for <strong>"App Passwords"</strong> and create one</li>
                    <li>Copy/Paste that 16-character code into AI Studio Settings for <strong>GMAIL_APP_PASSWORD</strong></li>
                  </ol>
                </div>
                <p className="text-[10px] text-red-500 italic">Error: {data.error}</p>
              </div>
            );
          } else {
            setError(data.error || "Failed to send verification code.");
          }
          setIsLoading(false);
          return;
        }
      } catch (err) {
        setError("Failed to connect to authentication server.");
        setIsLoading(false);
        return;
      }
    }

    try {
      if (authStep !== 'otp') return;

      setIsVerifyingOtp(true);
      // Verify OTP on server
      const verifyResponse = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const verifyData = await verifyResponse.json();

      if (!verifyData.success) {
        setError(verifyData.error || "Invalid verification code.");
        setIsVerifyingOtp(false);
        setIsLoading(false);
        return;
      }

      // Registration logic
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user profile in Firestore
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: name,
          phoneNumber: fullPhoneNumber,
          role: 'buyer',
          createdAt: new Date().toISOString()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      }
      
      setSuccess("Account created successfully! Redirecting...");
      const redirect = searchParams.get('redirect');
      setTimeout(() => navigate(redirect ? decodeURIComponent(redirect) : '/'), 1500);
    } catch (err) {
      const authError = err as AuthError;
      console.error("Authentication failed:", authError.code, authError.message);
      
      if (authError.code === 'auth/email-already-in-use') {
        setError("This email is already in use. Please log in instead.");
      } else if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
        setError("Invalid email or password. Please try again.");
      } else if (authError.code === 'auth/too-many-requests') {
        setError("Too many failed attempts. Please try again later.");
      } else if (authError.code === 'auth/operation-not-allowed') {
        setError(
          <span>
            Email/Password authentication is not enabled. 
            <a 
              href="https://console.firebase.google.com/project/gen-lang-client-0891362162/authentication/providers" 
              target="_blank" 
              rel="noreferrer"
              className="ml-1 underline font-bold"
            >
              Click here to enable it in Firebase Console
            </a>
          </span>
        );
      } else {
        setError(authError.message || "An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    try {
      const purpose = "register your account";
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose }),
      });
      const data = await response.json();
      if (data.success) {
        if (data.simulated) {
          setSuccess(
            <div className="text-left">
              <p className="font-bold mb-1">Simulation Mode Active:</p>
              <p className="text-sm mb-2">The email system encountered an error (likely authentication).</p>
              <div className="text-xs text-gray-600 space-y-2">
                <p>1. Check if <strong>supportbazaar@gmail.com</strong> is spelled correctly in your Settings.</p>
                <p>2. Ensure you are using a 16-character <strong>App Password</strong>.</p>
                <p className="font-bold text-secondary">3. For now, the verification code has been logged to the server console. Please check the logs to proceed.</p>
              </div>
            </div>
          );
        } else {
          setSuccess("A new verification code has been sent.");
        }
      } else {
        if (data.code === 'AUTH_FAILED') {
          setError(
            <div className="text-left bg-red-50 p-6 rounded-2xl border border-red-100 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-red-800">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <p className="font-bold text-xs  ">SMTP Auth Failed</p>
              </div>
              <p className="text-[12px] text-red-700 leading-relaxed font-medium">Bazaar cannot send emails because the Gmail credentials in settings are invalid.</p>
              <div className="space-y-2 py-2 border-y border-red-200/50">
                <p className="text-[10px] font-bold text-red-800  ">Steps to Fix:</p>
                <ol className="text-[10px] space-y-1.5 list-decimal pl-4 text-red-700 font-sans">
                  <li>Ensure <strong>2-Step Verification</strong> is ON for your Google Account</li>
                  <li>Generate a <strong>16-digit App Password</strong></li>
                  <li>Update <strong>GMAIL_APP_PASSWORD</strong> in the Settings panel</li>
                </ol>
              </div>
              <p className="text-[9px] text-red-500 italic">Error details: {data.error}</p>
            </div>
          );
        } else {
          setError(data.error || "Failed to resend code.");
        }
      }
    } catch (err) {
      setError("Failed to connect to authentication server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address to reset your password.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const purpose = "reset your password";
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsResettingPassword(true);
        setAuthStep('otp');
        setSuccess("A verification code has been sent to your email to reset your password.");
      } else {
        setError(data.error || "Failed to send reset code. Please try again.");
      }
    } catch (err: any) {
      console.error("Password reset request failed:", err);
      setError("Failed to connect to the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (providerName: 'google') => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    try {
      let provider;
      if (providerName === 'google') {
        provider = new GoogleAuthProvider();
      } else {
        throw new Error("Invalid provider");
      }
      await signInWithPopup(auth, provider);
      const redirect = searchParams.get('redirect');
      navigate(redirect ? decodeURIComponent(redirect) : '/');
    } catch (err: any) {
      setIsLoading(false);
      const authError = err as AuthError;
      
      if (authError.code === 'auth/popup-closed-by-user') {
        // Just return, no need to show an error message as user closed it manually
        return; 
      }
      
      console.error("Login failed:", authError.code, authError.message);
      
      if (authError.code === 'auth/cancelled-popup-request') {
        setError("Sign-in request was cancelled. Please wait a moment.");
      } else if (authError.code === 'auth/popup-blocked') {
        setError("Sign-in popup was blocked by your browser. Please allow popups for this site.");
      } else if (authError.code === 'auth/operation-not-allowed') {
        setError(
          <span>
            Google Sign-in is not enabled in your Firebase Console. 
            <a 
              href={`https://console.firebase.google.com/project/${firebaseConfigData.projectId}/authentication/providers`} 
              target="_blank" 
              rel="noreferrer"
              className="ml-1 underline font-bold"
            >
              Click here to enable it
            </a>
          </span>
        );
      } else {
        setError(authError.message || "An unexpected error occurred during sign-in. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-8 bg-paper relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="bg-paper p-8 md:p-14 rounded-[3.5rem] lux-border shadow-[0_40px_100px_rgba(0,0,0,0.08)] max-w-xl w-full text-center space-y-8 relative z-10 overflow-hidden"
      >
        <div className="absolute top-6 left-8">
          <BackButton />
        </div>

        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-secondary/40 via-secondary to-secondary/40" />
        
        <div className="w-20 h-20 bg-secondary/5 rounded-[2.2rem] flex items-center justify-center mx-auto border border-secondary/10 shadow-inner">
          <Shield className="w-10 h-10 text-secondary" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-serif italic text-primary leading-tight">
            {isRegistering ? t('create_account') : t('welcome_back')}
          </h1>
          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-5 bg-secondary/20" />
            <p className="text-[9px] font-bold text-gray-400  ">
              {isRegistering 
                ? "Artisanal Excellence" 
                : "Bazaar Nepal's Next Gen E-commerce platform"}
            </p>
            <div className="h-px w-5 bg-secondary/20" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              key="error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50/50 border border-red-100 p-4 rounded-3xl flex items-start gap-3 text-left"
            >
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-xs text-red-700 font-serif leading-relaxed font-medium">{error}</div>
            </motion.div>
          )}
          {success && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-secondary/5 border border-secondary/20 p-4 rounded-3xl flex items-start gap-3 text-left"
            >
              <Shield className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
              <div className="text-xs text-secondary font-serif leading-relaxed font-medium">{success}</div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          {!showEmailLogin ? (
            <>
              <button 
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
                className="w-full h-[54px] flex items-center justify-center gap-4 bg-white border border-[#dadce0] text-[#3c4043] px-8 rounded-xl font-sans font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-[14px] "
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                </div>
                <span>{t('continue_with_google')}</span>
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-secondary/10"></div></div>
                <div className="relative flex justify-center"><span className="bg-paper px-6 text-[8px] font-bold text-gray-300  ">Or</span></div>
              </div>

              <button 
                onClick={() => setShowEmailLogin(true)}
                className="w-full h-[54px] bg-secondary text-white px-8 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-4 shadow-lg shadow-secondary/20 text-[14px]  "
              >
                <Mail className="w-5 h-5" /> {t('email_and_number')}
              </button>
            </>
          ) : (
            <motion.form 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4 text-left"
              onSubmit={handleEmailAuth}
            >
              {authStep === 'otp' ? (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <p className="font-serif text-gray-400">
                      We've dispatched a digital key to
                    </p>
                    <p className="font-bold text-primary   text-xs">{email}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-secondary   ml-1">{t('verification_code')}</label>
                    <input 
                      type="text" 
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      required
                      className="w-full px-6 py-6 rounded-3xl border border-secondary/10 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all text-center text-4xl font-serif  shadow-inner bg-secondary/[0.02]"
                      placeholder="000000"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isLoading || isVerifyingOtp || otp.length !== 6}
                    className="w-full bg-secondary text-white py-5 rounded-full font-bold transition-all duration-300 shadow-xl shadow-secondary/20 disabled:opacity-30 flex items-center justify-center gap-3 text-sm  "
                  >
                    {isVerifyingOtp ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                    {t('verify_and_create')}
                  </button>

                  <div className="flex flex-col gap-4">
                    <button 
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      className="text-[10px] font-bold text-secondary   hover:text-secondary/80 transition-colors disabled:opacity-30"
                    >
                      {t('resend_code')}
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setAuthStep('form');
                        setError(null);
                        setSuccess(null);
                      }}
                      className="text-[10px] font-bold text-gray-400   hover:text-primary transition-colors"
                    >
                      {t('change_email')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-5">
                    {isRegistering && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-secondary   ml-1">{t('full_name')}</label>
                          <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-5 py-3.5 rounded-xl border border-secondary/10 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all font-serif bg-secondary/[0.02] text-sm"
                            placeholder="Your Noble Name"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-secondary   ml-1">{t('phone_number')}</label>
                          <div className="flex gap-2">
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setShowCountrySelector(!showCountrySelector)}
                                className="h-full px-4 rounded-xl border border-secondary/10 bg-secondary/[0.02] flex items-center gap-2 transition-all min-w-[100px] justify-between shadow-sm"
                              >
                                <span className="text-lg">{countries.find(c => c.code === countryCode)?.flag}</span>
                                <span className="text-[11px] font-bold text-gray-700">{countryCode}</span>
                              </button>
                              
                              <AnimatePresence>
                                {showCountrySelector && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full left-0 mt-3 w-56 bg-paper border border-secondary/10 rounded-[2rem] shadow-2xl z-50 overflow-hidden lux-border"
                                  >
                                    <div className="max-h-60 overflow-y-auto py-3 scrollbar-hide">
                                      {countries.map((c) => (
                                        <button
                                          key={`${c.name}-${c.code}`}
                                          type="button"
                                          onClick={() => {
                                            setCountryCode(c.code);
                                            setShowCountrySelector(false);
                                          }}
                                          className="w-full px-5 py-3 flex items-center gap-4 hover:bg-secondary/5 transition-colors text-left"
                                        >
                                          <span className="text-xl shadow-sm">{c.flag}</span>
                                          <div className="flex flex-col">
                                            <span className="text-[11px] font-bold text-gray-900  ">{c.name}</span>
                                            <span className="text-[9px] text-secondary font-bold  ">{c.code}</span>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                            
                            <input 
                              type="tel" 
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                              required
                              className="flex-1 px-5 py-3.5 rounded-xl border border-secondary/10 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all font-serif bg-secondary/[0.02] text-sm"
                              placeholder="98XXXXXXXX"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-secondary   ml-1">{t('email_address')}</label>
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-5 py-3.5 rounded-xl border border-secondary/10 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all font-serif italic bg-secondary/[0.02] text-sm"
                        placeholder="your@prestige.com"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-secondary   ml-1">{t('password')}</label>
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-5 py-3.5 rounded-xl border border-secondary/10 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all bg-secondary/[0.02] text-sm"
                        placeholder="••••••••"
                      />
                      {!isRegistering && (
                        <div className="flex justify-end px-1">
                          <button
                            type="button"
                            onClick={handleForgotPassword}
                            className="text-[10px] font-bold text-secondary/70 hover:text-secondary transition-colors"
                          >
                            Forgot password?
                          </button>
                        </div>
                      )}
                    </div>
                    {isRegistering && (
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-secondary   ml-1">{t('confirm_password')}</label>
                        <input 
                          type="password" 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="w-full px-5 py-3.5 rounded-xl border border-secondary/10 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all bg-secondary/[0.02] text-sm"
                          placeholder="••••••••"
                        />
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 bg-secondary text-white rounded-xl font-bold transition-all duration-300 shadow-xl shadow-secondary/25 disabled:opacity-30 flex items-center justify-center gap-3 text-sm   mt-2"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                    {!isRegistering 
                      ? "Login" 
                      : t('send_verification_code')}
                  </button>

                  <div className="flex flex-col gap-4 mt-6">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsRegistering(!isRegistering);
                        setAuthStep('form');
                      }}
                      className="text-[11px] font-bold text-secondary   hover:text-secondary/80 transition-colors"
                    >
                      {isRegistering ? t('already_have_account_login') : t('dont_have_account_register')}
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setShowEmailLogin(false);
                        setIsRegistering(false);
                        setAuthStep('form');
                      }}
                      className="text-[11px] font-bold text-gray-400   hover:text-primary transition-colors"
                    >
                      {t('back_to_social')}
                    </button>
                  </div>
                </>
              )}
            </motion.form>
          )}
        </div>

        <p className="text-[10px] text-gray-400 leading-relaxed font-serif max-w-xs mx-auto">
          By proceeding, you adhere to our <span className="underline text-secondary font-bold">Terms of Excellence</span> and <span className="underline text-secondary font-bold">Private Protocol</span>.
        </p>
      </motion.div>
    </div>
  );
};



