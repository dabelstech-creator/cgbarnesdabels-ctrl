"use client";

import React, { useState, useEffect } from "react";
import { 
  Mail, 
  Lock, 
  ShieldCheck, 
  AlertCircle, 
  RefreshCw, 
  Chrome, 
  QrCode, 
  Copy, 
  CheckCircle2, 
  ShieldAlert, 
  LogOut,
  Sparkles,
  KeyRound,
  Fingerprint
} from "lucide-react";
// Imports from lib/firebase
import { doc, getDoc, setDoc } from "firebase/firestore";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User 
} from "firebase/auth";
import { generateSecret, verifyTOTP } from "@/lib/totp";
import { db as firestoreDb, auth as firebaseAuth } from "@/lib/firebase";

interface AuthBarrierProps {
  onAuthenticated: (user: User) => void;
  onAddLog: (type: 'auth' | 'sync' | 'refresh' | 'system', level: 'success' | 'info' | 'warning' | 'error', message: string, details: string) => void;
}

export default function AuthBarrier({ onAuthenticated, onAddLog }: AuthBarrierProps) {
  const [mode, setMode] = useState<"login" | "register" | "mfa-setup" | "mfa-verify">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Current session user stored temporarily before MFA verification is complete
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  
  // MFA setup states
  const [mfaSecret, setMfaSecret] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [mfaVerifiedOnce, setMfaVerifiedOnce] = useState(false);

  // Fallback demo user details if popup blocks standard OAuth in frame sandbox
  const [showDemoBypass, setShowDemoBypass] = useState(false);

  // Reset errors on mode toggling
  useEffect(() => {
    setError("");
  }, [mode]);

  // Handle direct Email Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please specify both corporate email and password.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const user = userCredential.user;
      
      onAddLog("auth", "info", `Credential authorization initiated: ${user.email}`, `Verifying security requirements for account ID: ${user.uid}`);
      await handleMfaCheckAndRedirect(user);
    } catch (err: any) {
      console.error("Login error:", err);
      let friendlyError = err.message || "Failed to authenticate. Please check credentials.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        friendlyError = "Incorrect corporate email address or password sequence.";
      }
      setError(friendlyError);
      onAddLog("auth", "error", `Authentication rejected for user: ${email}`, friendlyError);
    } finally {
      setLoading(false);
    }
  };

  // Handle direct Email Registration (Corporate Onboarding)
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email and password fields are required.");
      return;
    }
    if (password.length < 6) {
      setError("Security policy requires password containing at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      const user = userCredential.user;
      
      onAddLog("auth", "success", `Onboarding completed for corporate user: ${user.email}`, `Creating default profile and audit directories.`);
      
      // Auto-initialize empty profile document in Firestore
      await setDoc(doc(firestoreDb, `users/${user.uid}`), {
        uid: user.uid,
        email: user.email,
        createdAt: new Date().toISOString(),
        mfaEnabled: false,
        connectedServices: ["gmail", "drive", "calendar", "contacts"]
      });

      await handleMfaCheckAndRedirect(user);
    } catch (err: any) {
      console.error("Register error:", err);
      let friendlyError = err.message || "Failed to complete onboarding.";
      if (err.code === "auth/email-already-in-use") {
        friendlyError = "This corporate email address is already onboarded.";
      }
      setError(friendlyError);
      onAddLog("auth", "error", `Onboarding failed for user: ${email}`, friendlyError);
    } finally {
      setLoading(false);
    }
  };

  // Handle standard Gmail SSO (OpenID Connect popup)
  const handleGmailSSO = async () => {
    setLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();
    // Prompt to ensure SSO credential selection is visible
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      onAddLog("auth", "info", "SSO Handshake triggered: Google OpenID provider initialized.", "Negotiating active TLS credentials popup.");
      const result = await signInWithPopup(firebaseAuth, provider);
      const user = result.user;

      // Register or update user profile in Firestore
      const userRef = doc(firestoreDb, `users/${user.uid}`);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          mfaEnabled: false,
          connectedServices: ["gmail", "drive", "calendar", "contacts"]
        });
      }

      onAddLog("auth", "success", `Google OpenID SSO verified: ${user.email}`, `Session ID: ${user.uid.substring(0, 10)}...`);
      await handleMfaCheckAndRedirect(user);
    } catch (err: any) {
      console.error("SSO error:", err);
      // Fallback display if in sandboxed iframe where popups are blocked
      if (err.code === "auth/popup-blocked" || err.code === "auth/cancelled-popup-request" || err.code === "auth/internal-error") {
        setShowDemoBypass(true);
        setError("SSO handshake popup was intercepted by the browser sandboxing. Click standard 'Demo Bypass' below to access or check environment popups.");
      } else {
        setError(err.message || "SSO verification rejected.");
      }
      onAddLog("auth", "warning", "SSO negotiation rejected or interrupted.", err.message || "OAuth Handshake stopped.");
    } finally {
      setLoading(false);
    }
  };

  // Demo Quick-Access Mode to prevent users from getting locked out in sandboxed iframe
  const handleDemoBypass = async () => {
    setLoading(true);
    setError("");
    
    // Create an elegant simulated corporate session
    const demoEmail = "demo.workspace@internal.corp";
    const demoPassword = "InternalSecretPassword123!";
    
    try {
      let userCredential;
      try {
        // Try logging in first
        userCredential = await signInWithEmailAndPassword(firebaseAuth, demoEmail, demoPassword);
      } catch (authErr) {
        // Register if not exist
        userCredential = await createUserWithEmailAndPassword(firebaseAuth, demoEmail, demoPassword);
        
        await setDoc(doc(firestoreDb, `users/${userCredential.user.uid}`), {
          uid: userCredential.user.uid,
          email: demoEmail,
          displayName: "Workspace Admin Demo",
          createdAt: new Date().toISOString(),
          mfaEnabled: false,
          connectedServices: ["gmail", "drive", "calendar", "contacts"]
        });
      }

      const user = userCredential.user;
      onAddLog("auth", "success", `SSO Simulation Handshake approved: ${user.email}`, "Simulating corporate directory alignment.");
      await handleMfaCheckAndRedirect(user);
    } catch (err: any) {
      setError("Demo access failed to generate profile: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check Firestore user configuration for connected Google Authenticator keys
  const handleMfaCheckAndRedirect = async (user: User) => {
    try {
      const userRef = doc(firestoreDb, `users/${user.uid}`);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.mfaEnabled && userData.mfaSecret) {
          // MFA is configured, hold authentication state and prompt code verification
          setPendingUser(user);
          setMfaSecret(userData.mfaSecret);
          setMode("mfa-verify");
          onAddLog("auth", "warning", "Multi-Factor Authentication protocol requested.", "Google Authenticator 2FA challenge triggered.");
        } else {
          // First login, enforce Google Authenticator enrollment setup
          setPendingUser(user);
          const generatedSecret = generateSecret(16);
          setMfaSecret(generatedSecret);
          setMode("mfa-setup");
          onAddLog("auth", "info", "Google Authenticator enrollment challenge.", "Requiring setup of 2FA keys for Least Privilege Compliance.");
        }
      } else {
        // Direct default profile creation
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          createdAt: new Date().toISOString(),
          mfaEnabled: false,
          connectedServices: ["gmail", "drive", "calendar", "contacts"]
        });
        setPendingUser(user);
        const generatedSecret = generateSecret(16);
        setMfaSecret(generatedSecret);
        setMode("mfa-setup");
      }
    } catch (err: any) {
      console.error("MFA handshake error:", err);
      // Fallback
      onAuthenticated(user);
    }
  };

  // Verify and enroll Google Authenticator MFA secret key
  const handleVerifyMfaSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode || totpCode.length !== 6) {
      setError("Please specify a valid 6-digit Google Authenticator code.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const isValid = await verifyTOTP(mfaSecret, totpCode);
      if (isValid && pendingUser) {
        // Persist verification and secret configuration to Firestore
        await setDoc(doc(firestoreDb, `users/${pendingUser.uid}`), {
          mfaEnabled: true,
          mfaSecret: mfaSecret,
          mfaConfiguredAt: new Date().toISOString()
        }, { merge: true });

        onAddLog("auth", "success", "Google Authenticator key enrolled successfully.", `Encryption standards synced to security profile.`);
        onAuthenticated(pendingUser);
      } else {
        setError("Invalid 6-digit Authenticator code. Re-verify phone alignment.");
        onAddLog("auth", "error", "2FA Key enrollment rejected.", "TOTP code did not resolve to correct sync parameters.");
      }
    } catch (err: any) {
      setError("Cryptographic challenge failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Verify MFA token for existing users trying to gain dashboard clearance
  const handleVerifyMfaChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode || totpCode.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const isValid = await verifyTOTP(mfaSecret, totpCode);
      if (isValid && pendingUser) {
        onAddLog("auth", "success", "2FA Verification completed.", `Granted operational clearances to ${pendingUser.email}`);
        onAuthenticated(pendingUser);
      } else {
        setError("Invalid code. Please check Google Authenticator.");
        onAddLog("auth", "error", "2FA Challenge failed.", "TOTP validation failed.");
      }
    } catch (err: any) {
      setError("Handshake validation exception: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cancel login or signout of pending state
  const handleCancelMfa = async () => {
    setLoading(true);
    try {
      await signOut(firebaseAuth);
      setPendingUser(null);
      setTotpCode("");
      setMode("login");
      onAddLog("auth", "info", "Operational handshake aborted.", "Session state cleaned successfully.");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copySecretToClipboard = () => {
    navigator.clipboard.writeText(mfaSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  // Format OTP Auth URI for scanning
  const otpAuthUri = pendingUser 
    ? `otpauth://totp/WorkspaceSync:${encodeURIComponent(pendingUser.email || "")}?secret=${mfaSecret}&issuer=WorkspaceSync`
    : "";

  // Dynamic QR Code link (unauthenticated google charts API or api.qrserver)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=6366f1&bgcolor=030712&data=${encodeURIComponent(otpAuthUri)}`;

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-16 relative">
      {/* Absolute glow points for aesthetic depth */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-violet-600/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="w-full max-w-md bg-[#0b0f19] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 blur-2xl rounded-full" />
        
        {/* Gateway branding header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="p-3 bg-violet-500/10 rounded-xl border border-violet-500/20 text-violet-400 mb-3 shadow-inner">
            <Fingerprint className="w-7 h-7" />
          </div>
          <h2 className="text-sm font-extrabold tracking-widest font-mono text-white uppercase">WORKSPACE SECURITY GATEWAY</h2>
          <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-wider">Multi-Factor Single Sign-On (SSO)</p>
        </div>

        {/* Display System Notifications/Errors */}
        {error && (
          <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/40 text-red-300 text-xs font-mono flex items-start gap-2.5 mb-5">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            <p className="leading-normal">{error}</p>
          </div>
        )}

        {/* --- LOGIN MODE --- */}
        {mode === "login" && (
          <div className="space-y-4">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Corporate Directory Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input 
                    type="email" 
                    placeholder="name@company.corp" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all placeholder:text-slate-600"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Security Password</label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all placeholder:text-slate-600"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-850 text-white py-2 px-4 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all border border-violet-500/30"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                <span>VERIFY CORPORATE DIRECTORY</span>
              </button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800/80"></div>
              <span className="flex-shrink mx-4 text-[9px] font-mono text-slate-500 uppercase tracking-widest">Federated Sign-On</span>
              <div className="flex-grow border-t border-slate-800/80"></div>
            </div>

            {/* Google Authentication Direct Trigger */}
            <button 
              onClick={handleGmailSSO}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-violet-500/30 text-slate-300 py-2 px-4 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all"
            >
              <Chrome className="w-4 h-4 text-violet-400" />
              <span>AUTHENTICATE WITH GMAIL DIRECTLY</span>
            </button>

            {/* SSO Info / Integration details */}
            <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/60 text-[10px] font-mono text-slate-500 leading-relaxed">
              <span className="text-violet-400 font-bold block uppercase mb-1">SSO OPENID CONNECT STATUS</span>
              OpenID scopes: <span className="text-slate-400">openid profile email</span> are integrated. Standard TLS 1.3 handshake encryption enforced on GCP domain.
            </div>

            <div className="text-center pt-2">
              <button 
                onClick={() => setMode("register")}
                className="text-[10px] font-mono text-violet-400 hover:text-violet-300 transition-colors cursor-pointer uppercase"
              >
                Onboard New System Operator →
              </button>
            </div>
          </div>
        )}

        {/* --- REGISTER MODE --- */}
        {mode === "register" && (
          <div className="space-y-4">
            <form onSubmit={handleEmailRegister} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Authorized Email Input</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input 
                    type="email" 
                    placeholder="name@company.corp" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all placeholder:text-slate-600"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Access Password (Min 6 chars)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all placeholder:text-slate-600"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white py-2 px-4 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all border border-violet-500/30"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>ONBOARD OPERATOR SYSTEM</span>
              </button>
            </form>

            <div className="text-center pt-2">
              <button 
                onClick={() => setMode("login")}
                className="text-[10px] font-mono text-violet-400 hover:text-violet-300 transition-colors cursor-pointer uppercase"
              >
                ← Return to Login Interface
              </button>
            </div>
          </div>
        )}

        {/* --- MFA ENROLLMENT (GOOGLE AUTHENTICATOR SETUP) --- */}
        {mode === "mfa-setup" && (
          <div className="space-y-5">
            <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 text-indigo-300 text-[11px] font-mono leading-relaxed rounded-xl flex gap-3">
              <QrCode className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block uppercase">Least-Privilege Security Mandate</strong>
                Access control requires connecting a secure physical token generator via Google Authenticator.
              </div>
            </div>

            <div className="flex flex-col items-center py-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
              {/* QR Image containing OTP Auth Payload */}
              <div className="p-2 bg-white rounded-lg inline-block border border-slate-800 shadow-xl overflow-hidden">
                <img 
                  src={qrCodeUrl} 
                  alt="MFA Setup QR Code" 
                  className="w-40 h-40 object-contain"
                  onError={() => {
                    // Fallback visual if third-party QR API experiences brief rate limit
                    console.log("QR Code failed, showing visual fallback instructions");
                  }}
                />
              </div>
              <p className="text-[9px] font-mono text-slate-500 mt-2.5 uppercase tracking-wide">Scan this QR in Google Authenticator App</p>
            </div>

            <div className="space-y-1.5 bg-slate-950 border border-slate-800 rounded-lg p-3">
              <label className="text-[9px] font-mono text-slate-500 uppercase block tracking-wider">Manual Secret Key Setup</label>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-amber-300 font-bold tracking-wider select-all break-all">{mfaSecret}</span>
                <button 
                  onClick={copySecretToClipboard}
                  className="p-1.5 bg-slate-900 border border-slate-800 rounded hover:border-violet-500/30 transition-all cursor-pointer text-slate-400 hover:text-white shrink-0"
                  title="Copy secret key to clipboard"
                >
                  {copiedSecret ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <form onSubmit={handleVerifyMfaSetup} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block text-center">Enter 6-digit verification code</label>
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="000000" 
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full text-center tracking-[0.5em] font-mono text-lg font-bold py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                  required
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button 
                  type="button" 
                  onClick={handleCancelMfa}
                  className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono font-bold py-2 rounded-lg cursor-pointer transition-all"
                >
                  CANCEL
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1 bg-violet-600 hover:bg-violet-500 text-white text-xs font-mono font-bold py-2 rounded-lg cursor-pointer transition-all border border-violet-500/30"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>VERIFY & ENROLL</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- ACTIVE MFA CHALLENGE (ENTER 6-DIGIT CODE) --- */}
        {mode === "mfa-verify" && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-950/20 border border-amber-500/20 text-amber-300 text-[11px] font-mono leading-relaxed rounded-xl flex gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block uppercase">Authentication Challenge</strong>
                Enter the changing token generated by Google Authenticator.
              </div>
            </div>

            <form onSubmit={handleVerifyMfaChallenge} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block text-center">Google Authenticator Token</label>
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="000000" 
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full text-center tracking-[0.5em] font-mono text-lg font-bold py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={handleCancelMfa}
                  className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono font-bold py-2 rounded-lg cursor-pointer transition-all"
                >
                  CANCEL
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1 bg-violet-600 hover:bg-violet-500 text-white text-xs font-mono font-bold py-2 rounded-lg cursor-pointer transition-all border border-violet-500/30"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>VERIFY TOKEN</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Dynamic Demo-mode fallback when popups are blocked inside the sandboxed preview screen */}
        {(showDemoBypass || mode === "login") && (
          <div className="pt-4 mt-2 border-t border-slate-800/60 text-center">
            <p className="text-[9px] font-mono text-slate-600 mb-2">Popups blocked inside preview iframe container?</p>
            <button 
              onClick={handleDemoBypass}
              className="flex items-center justify-center gap-1 mx-auto bg-slate-900/60 hover:bg-slate-900 border border-dashed border-slate-800 hover:border-violet-500/30 text-[10px] text-slate-400 hover:text-violet-300 font-mono font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all"
              title="Skip popup OAuth barriers inside frames"
            >
              <span>DEMO SSO BYPASS (OIDC SIMULATION)</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
