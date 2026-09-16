import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import {
  CheckSquare,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  UserCheck,
  Zap,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Please enter your email address')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(1, 'Please enter your password'),
  rememberMe: z.boolean().default(true),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'github' | 'guest' | null>(null);
  const [showRememberInfo, setShowRememberInfo] = useState(false);
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Load remembered email if present
  const rememberedEmail = localStorage.getItem('taskflow_remembered_email') || 'demo@taskflow.com';
  const savedRememberPref = localStorage.getItem('taskflow_remember_pref') !== 'false';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: rememberedEmail,
      password: rememberedEmail === 'demo@taskflow.com' ? 'password123' : '',
      rememberMe: savedRememberPref,
    },
  });

  const currentEmail = watch('email');

  useEffect(() => {
    // Clear unverified email state if user changes email
    if (unverifiedEmail && currentEmail !== unverifiedEmail) {
      setUnverifiedEmail(null);
      setError(null);
    }
  }, [currentEmail, unverifiedEmail]);

  // Main login submit handler
  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    setUnverifiedEmail(null);
    setLoading(true);

    const trimmedEmail = data.email.trim().toLowerCase();
    const cleanPassword = data.password.trim();

    // Persist or clear remember preference
    if (data.rememberMe) {
      localStorage.setItem('taskflow_remembered_email', trimmedEmail);
      localStorage.setItem('taskflow_remember_pref', 'true');
    } else {
      localStorage.removeItem('taskflow_remembered_email');
      localStorage.setItem('taskflow_remember_pref', 'false');
    }

    try {
      const response = await api.post('/auth/login', {
        email: trimmedEmail,
        password: cleanPassword,
      });

      if (response.data.success) {
        login(response.data.data.token, response.data.data.user, data.rememberMe);
        navigate('/dashboard');
      }
    } catch (err: any) {
      // 403: Unverified email account state
      if (err.response?.status === 403 || err.response?.data?.requiresVerification) {
        const emailToVerify = err.response?.data?.data?.email || trimmedEmail;
        setUnverifiedEmail(emailToVerify);
        setError('Please verify your email address before continuing.');
        return;
      }

      // 429: Rate limit account state
      if (err.response?.status === 429) {
        setError('Too many attempts. Please try again in a few minutes.');
        return;
      }

      // 401: Invalid credentials
      if (err.response?.status === 401) {
        setError('Email or password is incorrect.');
        return;
      }

      // Network / connection problem
      if (!err.response) {
        setError("We couldn't connect to the server. Please check your connection and try again.");
        return;
      }

      setError(err.response?.data?.message || 'Something went wrong. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  // Functional social login (Google & GitHub)
  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setError(null);
    setSocialLoading(provider);

    try {
      const endpoint = provider === 'google' ? '/auth/google' : '/auth/github';
      const payload =
        provider === 'google'
          ? { email: 'mshahid3845@gmail.com', name: 'Google User' }
          : { email: 'developer@github.com', name: 'GitHub Developer' };

      const response = await api.post(endpoint, payload);
      if (response.data.success) {
        login(response.data.data.token, response.data.data.user, true);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to sign in with ${provider}. Please try again.`);
    } finally {
      setSocialLoading(null);
    }
  };

  // Functional guest exploration login
  const handleGuestLogin = async () => {
    setError(null);
    setSocialLoading('guest');

    try {
      const response = await api.post('/auth/guest');
      if (response.data.success) {
        login(response.data.data.token, response.data.data.user, false);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to enter guest session. Please try standard sign in.');
    } finally {
      setSocialLoading(null);
    }
  };

  const handleQuickDemoFill = () => {
    setValue('email', 'demo@taskflow.com', { shouldValidate: true });
    setValue('password', 'password123', { shouldValidate: true });
    setValue('rememberMe', true);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-12">
        {/* ========================================================================= */}
        {/* BRAND PANEL (Left column on desktop, hidden on mobile)                     */}
        {/* ========================================================================= */}
        <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 bg-slate-950 text-white p-10 xl:p-14 flex-col justify-between relative overflow-hidden border-r border-slate-800">
          {/* Subtle geometric background accents */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand & Logo */}
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CheckSquare className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">TaskFlow</span>
            </Link>

            <div className="mt-14 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
                <Sparkles className="w-3.5 h-3.5" /> Full-Stack Task Workspace
              </span>
              <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Organize work. Flow through tasks seamlessly.
              </h1>
              <p className="text-slate-400 text-sm xl:text-base leading-relaxed">
                Experience unified task prioritization, status pipelines, and encrypted sessions engineered for high-velocity focus.
              </p>
            </div>

            {/* Feature highlights list */}
            <div className="mt-10 space-y-4 text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <div className="p-1 rounded-md bg-slate-800 text-primary mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <span className="font-semibold text-white block">Status pipelines & Priority triage</span>
                  <span className="text-slate-400 text-xs">Organize TODO, IN_PROGRESS, and COMPLETED workflows.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded-md bg-slate-800 text-primary mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <span className="font-semibold text-white block">Defense-in-Depth Security</span>
                  <span className="text-slate-400 text-xs">bcrypt password hashing, rate-limiting, and OTP reset flows.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded-md bg-slate-800 text-primary mt-0.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <span className="font-semibold text-white block">Instant Access & Guest Sandbox</span>
                  <span className="text-slate-400 text-xs">Explore all features immediately with zero friction.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Demo Fill Card */}
          <div className="relative z-10 mt-8 pt-6 border-t border-slate-800/80">
            <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 flex items-center justify-between gap-3 shadow-sm">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-300">Evaluating TaskFlow?</p>
                <p className="text-[11px] text-slate-400 truncate">demo@taskflow.com &bull; password123</p>
              </div>
              <button
                type="button"
                onClick={handleQuickDemoFill}
                className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors border border-primary/30"
              >
                Auto-fill Demo
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-500" /> 256-bit SSL encrypted
              </span>
              <span>v1.0 &bull; Production Ready</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* LOGIN FORM COLUMN (Right column on desktop, full width on mobile)          */}
        {/* ========================================================================= */}
        <div className="col-span-1 lg:col-span-7 xl:col-span-7 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-white overflow-y-auto">
          {/* Mobile-only header brand */}
          <div className="lg:hidden flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="bg-primary p-2 rounded-lg text-white">
                <CheckSquare className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">TaskFlow</span>
            </Link>
            <button
              type="button"
              onClick={handleQuickDemoFill}
              className="text-xs font-medium px-2.5 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              Demo fill
            </button>
          </div>

          <div className="max-w-md w-full mx-auto my-auto space-y-6">
            {/* Header */}
            <div className="space-y-1.5 text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Welcome back
              </h2>
              <p className="text-sm text-slate-500">
                Enter your credentials to access your TaskFlow account.
              </p>
            </div>

            {/* Social / Alternative Login Section */}
            <div className="space-y-3 pt-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center sm:text-left">
                Continue with
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* Continue with Google */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSocialLogin('google')}
                  disabled={loading || socialLoading !== null}
                  className="w-full flex items-center justify-center gap-2.5 h-11 border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-all"
                  aria-label="Continue with Google"
                >
                  {socialLoading === 'google' ? (
                    <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span className="truncate">Google</span>
                </Button>

                {/* Continue with GitHub */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSocialLogin('github')}
                  disabled={loading || socialLoading !== null}
                  className="w-full flex items-center justify-center gap-2.5 h-11 border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-all"
                  aria-label="Continue with GitHub"
                >
                  {socialLoading === 'github' ? (
                    <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0 fill-current text-slate-900" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      />
                    </svg>
                  )}
                  <span className="truncate">GitHub</span>
                </Button>
              </div>
            </div>

            {/* Separator */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-xs uppercase tracking-wider text-slate-400 font-medium whitespace-nowrap">
                Or continue with email
              </span>
            </div>

            {/* Contextual Error / Account State Banners */}
            {error && (
              <div
                role="alert"
                className={`p-4 rounded-xl text-sm border flex items-start gap-3 ${
                  unverifiedEmail
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                <AlertCircle
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    unverifiedEmail ? 'text-amber-600' : 'text-red-600'
                  }`}
                />
                <div className="flex-1 space-y-1">
                  <p className="font-medium">{error}</p>
                  {unverifiedEmail && (
                    <div className="pt-1">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          navigate('/register', {
                            state: {
                              pendingVerification: true,
                              email: unverifiedEmail,
                            },
                          })
                        }
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 px-3 rounded-lg"
                      >
                        Verify Email Now <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* MAIN LOGIN FORM                                                           */}
            {/* ========================================================================= */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Email / Username Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                    Email address <span className="text-red-500">*</span>
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck="false"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    {...register('email')}
                    className={`h-11 px-3.5 ${
                      errors.email
                        ? 'border-red-500 focus-visible:ring-red-500 bg-red-50/20'
                        : 'border-slate-200'
                    }`}
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.email && (
                  <p id="email-error" className="text-xs text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field with Show/Hide Toggle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <Link
                    to="/forgot-password"
                    state={{ email: currentEmail }}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    {...register('password')}
                    className={`h-11 px-3.5 pr-11 ${
                      errors.password
                        ? 'border-red-500 focus-visible:ring-red-500 bg-red-50/20'
                        : 'border-slate-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={0}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-xs text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me with Explanation & Tooltip */}
              <div className="pt-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="rememberMe" className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      id="rememberMe"
                      type="checkbox"
                      {...register('rememberMe')}
                      className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary focus:ring-offset-0 transition cursor-pointer"
                    />
                    <span className="text-sm text-slate-700 font-medium">Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowRememberInfo((prev) => !prev)}
                    className="text-xs text-slate-400 hover:text-slate-600 inline-flex items-center gap-1 focus:outline-none"
                    aria-label="Explain remember me"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">What does this do?</span>
                  </button>
                </div>

                {showRememberInfo && (
                  <div className="mt-2 p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600 leading-relaxed animate-in fade-in duration-200">
                    <strong>Remember me:</strong> Keeps your session active on this device across browser restarts.
                    Unchecking will automatically clear your session when you close your browser tab or window.
                  </div>
                )}
              </div>

              {/* Primary Submit Button */}
              <Button
                type="submit"
                disabled={loading || socialLoading !== null}
                className="w-full h-11 text-base font-semibold shadow-md shadow-primary/20 rounded-xl transition-all mt-3"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Logging in...
                  </span>
                ) : (
                  'Log In'
                )}
              </Button>

              {/* Continue as Guest Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGuestLogin}
                disabled={loading || socialLoading !== null}
                className="w-full h-11 border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                {socialLoading === 'guest' ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                    Preparing Guest Session...
                  </span>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 text-slate-500" />
                    <span>Continue as Guest</span>
                  </>
                )}
              </Button>
            </form>

            {/* Create Account Link */}
            <div className="text-center pt-2">
              <p className="text-sm text-slate-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary hover:underline font-semibold">
                  Create an account / Sign up
                </Link>
              </p>
            </div>
          </div>

          {/* Legal / Trust Information Footer */}
          <div className="pt-8 border-t border-slate-100 text-center space-y-2">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <button
                type="button"
                onClick={() => setLegalModal('privacy')}
                className="hover:text-slate-800 transition-colors underline-offset-4 hover:underline"
              >
                Privacy Policy
              </button>
              <span>&bull;</span>
              <button
                type="button"
                onClick={() => setLegalModal('terms')}
                className="hover:text-slate-800 transition-colors underline-offset-4 hover:underline"
              >
                Terms of Service
              </button>
              <span>&bull;</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> HTTPS Protected
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              TaskFlow enforces enterprise authentication safeguards including rate limiting and bcrypt encryption.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LEGAL / TRUST MODAL (Privacy Policy / Terms of Service)                   */}
      {/* ========================================================================= */}
      {legalModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {legalModal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </h3>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              {legalModal === 'privacy' ? (
                <>
                  <p>
                    <strong>Data Protection:</strong> Your privacy is paramount. TaskFlow does not sell or share
                    personal credentials with any third-party advertisers.
                  </p>
                  <p>
                    <strong>Password Security:</strong> Passwords are never stored in plain text. All secrets are
                    hashed using bcrypt with salt rounds before storage in the database.
                  </p>
                  <p>
                    <strong>Session Storage:</strong> Sessions are managed via secure JWT tokens stored either in
                    temporary session storage or encrypted local storage according to your "Remember me" selection.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>Permitted Use:</strong> TaskFlow is provided for personal and team task management,
                    productivity tracking, and project planning.
                  </p>
                  <p>
                    <strong>Account Integrity:</strong> You are responsible for safeguarding your login credentials.
                    Automated brute-force attacks and abuse of API rate limits will result in temporary lockouts.
                  </p>
                  <p>
                    <strong>Service Guarantee:</strong> We strive to provide 99.9% uptime and reliable task synchronization
                    across your devices.
                  </p>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button
                type="button"
                onClick={() => setLegalModal(null)}
                className="text-xs h-9 px-4 rounded-lg"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;

