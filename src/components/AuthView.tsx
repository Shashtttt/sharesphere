import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles, ShieldCheck, Lock, Mail, User, Building,
  ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff,
  Award, Layers, Check, Key
} from 'lucide-react';

interface AuthViewProps {
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ initialMode = 'login', onSuccess }) => {
  const { login, register, demoAccounts, loginWithDemoAccount } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<'borrower' | 'owner'>('borrower');
  const [regDepartment, setRegDepartment] = useState('Electrical & Computer Engineering');
  const [agreedTerms, setAgreedTerms] = useState(true);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password strength calculation
  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;
    return score; // 0 to 4
  };

  const passStrength = calculatePasswordStrength(regPassword);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      await login(loginEmail.trim(), loginPassword);
      setSuccessMessage("Authentication verified. Redirecting to workspace...");
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid email or password credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (regPassword !== regConfirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    if (!agreedTerms) {
      setErrorMessage("You must accept the institutional laboratory safety policy.");
      return;
    }

    setIsLoading(true);

    try {
      await register({
        email: regEmail.trim(),
        password: regPassword,
        full_name: regFullName.trim(),
        role: regRole,
        department: regDepartment,
      });
      setSuccessMessage("Account created successfully! Welcome to ShareSphere.");
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 600);
    } catch (err: any) {
      setErrorMessage(err.message || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (acc: any) => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await loginWithDemoAccount(acc);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to log in with demo account.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      
      {/* Background Tech Mesh Glows */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Card Container */}
      <div className="relative z-10 w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        
        {/* Left Side: Institutional Brand Hero Panel */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          
          <div className="relative z-10 space-y-6">
            
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
                <Sparkles className="w-6 h-6 text-indigo-100" />
              </div>
              <div>
                <span className="font-extrabold text-white text-xl tracking-tight">ShareSphere</span>
                <span className="text-[10px] font-bold ml-2 px-1.5 py-0.5 rounded-sm bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  CAMPUS
                </span>
              </div>
            </div>

            {/* Headline */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                Unlock Underused Equipment & Laboratories.
              </h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Empowering college researchers, student creators, and faculty with verified safety gates, explainable equipment discovery, and handover accountability.
              </p>
            </div>

            {/* Feature Guarantees */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Verified Safety Gates</h4>
                  <p className="text-[11px] text-slate-400">Class 4 lasers and cleanroom tools require certified qualifications.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Explainable AI Matching</h4>
                  <p className="text-[11px] text-slate-400">Natural-language experimental goal matching with clear justifications.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Handover Accountability</h4>
                  <p className="text-[11px] text-slate-400">Condition reports & server timestamps at check-in and checkout.</p>
                </div>
              </div>
            </div>

          </div>

          {/* Institutional Footer note */}
          <div className="relative z-10 pt-6 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Apex Institute of Technology</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Production MVP
            </span>
          </div>

        </div>

        {/* Right Side: Interactive Login / Registration Panel */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between bg-white text-slate-800">
          
          <div className="space-y-6">
            
            {/* Header: Mode Switcher Tabs */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrorMessage(null); }}
                  className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${
                    mode === 'login'
                      ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setErrorMessage(null); }}
                  className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${
                    mode === 'register'
                      ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <span className="text-xs text-slate-400 hidden sm:inline">
                {mode === 'login' ? "Welcome back" : "New researcher registration"}
              </span>
            </div>

            {/* Alerts */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* ---------------- FORM: SIGN IN MODE ---------------- */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Institutional Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. borrower1@sharesphere.edu"
                      required
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Password</label>
                    <span className="text-[11px] text-slate-400">Demo: demo1234</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your account password"
                      required
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded text-indigo-600 w-3.5 h-3.5 focus:ring-indigo-500"
                    />
                    <span>Remember this browser session</span>
                  </label>
                  <span className="text-[11px] text-indigo-600 font-semibold">Institutional SSO Enabled</span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                >
                  {isLoading ? "Signing in..." : "Sign In to Workspace"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* ---------------- FORM: REGISTRATION MODE ---------------- */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="e.g. Dr. Maya Lin"
                        required
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Institutional Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="user@sharesphere.edu"
                        required
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department / Research Division</label>
                  <select
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                  >
                    <option value="Electrical & Computer Engineering">Electrical & Computer Engineering</option>
                    <option value="Precision Engineering & Applied Physics">Precision Engineering & Applied Physics</option>
                    <option value="Robotics, Microelectronics & Fabrication">Robotics, Microelectronics & Fabrication</option>
                    <option value="Materials Science & Nanotechnology">Materials Science & Nanotechnology</option>
                    <option value="Computer Science & Artificial Intelligence">Computer Science & Artificial Intelligence</option>
                    <option value="Digital Media Arts & Cinema">Digital Media Arts & Cinema</option>
                    <option value="Makerspace Foundry & Prototyping">Makerspace Foundry & Prototyping</option>
                  </select>
                </div>

                {/* Role Selection Cards */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Intended Platform Role</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div
                      onClick={() => setRegRole('borrower')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        regRole === 'borrower'
                          ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-600'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-bold text-slate-900 flex items-center justify-between">
                        <span>Borrower</span>
                        {regRole === 'borrower' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Students & researchers discovering equipment and requesting bookings.
                      </p>
                    </div>

                    <div
                      onClick={() => setRegRole('owner')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        regRole === 'owner'
                          ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-600'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-bold text-slate-900 flex items-center justify-between">
                        <span>Resource Owner</span>
                        {regRole === 'owner' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Lab directors & custodians listing tools, managing approvals & handovers.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    * Institutional Manager & Administrator accounts are provisioned via Dean office invitation.
                  </span>
                </div>

                {/* Passwords with live strength meter */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Create Password</label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                    />
                    
                    {/* Live Strength Bars */}
                    {regPassword && (
                      <div className="mt-1.5 space-y-1">
                        <div className="flex gap-1 h-1">
                          <div className={`flex-1 rounded-full ${passStrength >= 1 ? 'bg-rose-500' : 'bg-slate-200'}`}></div>
                          <div className={`flex-1 rounded-full ${passStrength >= 2 ? 'bg-amber-500' : 'bg-slate-200'}`}></div>
                          <div className={`flex-1 rounded-full ${passStrength >= 3 ? 'bg-blue-500' : 'bg-slate-200'}`}></div>
                          <div className={`flex-1 rounded-full ${passStrength >= 4 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Strength: {passStrength <= 1 ? 'Weak' : passStrength <= 2 ? 'Fair' : passStrength === 3 ? 'Good' : 'Strong'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                    />
                    {regConfirmPassword && regConfirmPassword !== regPassword && (
                      <span className="text-[10px] text-rose-600 mt-1 block">Passwords do not match</span>
                    )}
                  </div>
                </div>

                <div className="pt-1">
                  <label className="flex items-start gap-2 cursor-pointer text-slate-600 text-[11px]">
                    <input
                      type="checkbox"
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="rounded text-indigo-600 w-3.5 h-3.5 mt-0.5"
                    />
                    <span>
                      I agree to the Institutional Laboratory Safety Code and agree that high-hazard equipment requires verified certification before reservation.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                >
                  {isLoading ? "Creating Account..." : "Complete Registration"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* ---------------- 1-CLICK DEMO ACCOUNTS BAR ---------------- */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-indigo-600" />
                  Quick Evaluation — 1-Click Demo Personas:
                </span>
                <span className="text-[10px] text-slate-400">Password: demo1234</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {demoAccounts.slice(0, 4).map(acc => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleDemoLogin(acc)}
                    className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-left transition-all group"
                  >
                    <div className="font-bold text-[11px] text-slate-800 group-hover:text-indigo-700 truncate">
                      {acc.name}
                    </div>
                    <div className="text-[10px] text-slate-500 capitalize">
                      {acc.role}
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div className="text-center text-[11px] text-slate-400 pt-4">
            ShareSphere Campus Node • Zero Plaintext Storage • PBKDF2 Encrypted
          </div>

        </div>

      </div>
    </div>
  );
};
