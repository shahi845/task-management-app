import { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { CheckSquare, ArrowLeft, KeyRound, CheckCircle2, RefreshCw } from 'lucide-react';

const requestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const resetSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    otp: z.string().min(6, 'Verification code must be 6 digits').max(6, 'Verification code must be 6 digits'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RequestFormValues = z.infer<typeof requestSchema>;
type ResetFormValues = z.infer<typeof resetSchema>;

const RESEND_COOLDOWN = 60;

const useResendCountdown = (initial: number) => {
  const [seconds, setSeconds] = useState(initial);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback((from = initial) => {
    setSeconds(from);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, [initial]);

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  return { seconds, start };
};

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = (location.state as { email?: string } | null)?.email || '';

  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { seconds: cooldown, start: startCooldown } = useResendCountdown(0);

  // Form for requesting reset code
  const {
    register: registerRequest,
    handleSubmit: handleSubmitRequest,
    formState: { errors: requestErrors },
    setValue: setRequestEmail,
  } = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: initialEmail || 'demo@taskflow.com' },
  });

  // Form for submitting OTP and new password
  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: resetErrors },
    setValue: setResetEmail,
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: initialEmail || 'demo@taskflow.com' },
  });

  // Handle step 1: Request reset OTP
  const onRequestSubmit = async (data: RequestFormValues) => {
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email: data.email });
      setEmail(data.email);
      setResetEmail('email', data.email);
      setInfoMessage(response.data.message || 'Verification code sent to your email.');
      startCooldown(RESEND_COOLDOWN);
      setStep('reset');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send password reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle resending code
  const handleResend = async () => {
    if (cooldown > 0 || loading || !email) return;
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setInfoMessage(response.data.message || 'A new verification code has been sent.');
      startCooldown(RESEND_COOLDOWN);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle step 2: Verify OTP and save new password
  const onResetSubmit = async (data: ResetFormValues) => {
    setError(null);
    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        email: data.email,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      setStep('success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Please verify the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link to="/login" className="bg-primary p-3 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 hover:opacity-95 transition-opacity">
            <CheckSquare className="w-8 h-8 text-white" />
            <span className="text-white font-bold text-2xl tracking-tight pr-2">TaskFlow</span>
          </Link>
        </div>

        <Card className="border-0 shadow-xl">
          {step === 'request' && (
            <>
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl text-center font-bold">Forgot password?</CardTitle>
                <CardDescription className="text-center text-muted-foreground">
                  Enter your email address and we'll send you a 6-digit verification code to reset your password.
                </CardDescription>
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setRequestEmail('email', 'demo@taskflow.com')}
                    className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs px-3 py-1 rounded-full font-medium hover:bg-primary/20 transition-colors"
                  >
                    Use demo: demo@taskflow.com
                  </button>
                </div>
              </CardHeader>

              <CardContent>
                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4 text-center border border-destructive/20">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmitRequest(onRequestSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="request-email">Email</Label>
                    <Input
                      id="request-email"
                      type="email"
                      placeholder="name@example.com"
                      {...registerRequest('email')}
                      className={requestErrors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
                    />
                    {requestErrors.email && (
                      <p className="text-sm text-destructive font-medium">{requestErrors.email.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full mt-2" disabled={loading}>
                    {loading ? 'Sending verification code...' : 'Send Reset Code'}
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="flex flex-col border-t p-6 mt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </Link>
              </CardFooter>
            </>
          )}

          {step === 'reset' && (
            <>
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl text-center font-bold">Reset Password</CardTitle>
                <CardDescription className="text-center text-muted-foreground">
                  Verification code sent to <span className="font-semibold text-foreground">{email}</span>
                </CardDescription>
              </CardHeader>

              <CardContent>
                {infoMessage && (
                  <div className="bg-primary/10 text-primary text-sm p-3 rounded-md mb-4 border border-primary/20 text-center font-medium">
                    {infoMessage}
                  </div>
                )}

                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4 text-center border border-destructive/20">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmitReset(onResetSubmit)} className="space-y-4">
                  <input type="hidden" {...registerReset('email')} value={email} />

                  <div className="space-y-2">
                    <Label htmlFor="reset-otp">6-Digit Verification Code</Label>
                    <Input
                      id="reset-otp"
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      autoComplete="one-time-code"
                      className={`text-center tracking-widest text-lg font-mono ${
                        resetErrors.otp ? 'border-destructive focus-visible:ring-destructive' : ''
                      }`}
                      {...registerReset('otp')}
                    />
                    {resetErrors.otp && (
                      <p className="text-sm text-destructive font-medium">{resetErrors.otp.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground text-center">
                      Tip: In development mode, you can also use code <span className="font-mono font-semibold">123456</span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      {...registerReset('newPassword')}
                      className={resetErrors.newPassword ? 'border-destructive focus-visible:ring-destructive' : ''}
                    />
                    {resetErrors.newPassword && (
                      <p className="text-sm text-destructive font-medium">{resetErrors.newPassword.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      {...registerReset('confirmPassword')}
                      className={resetErrors.confirmPassword ? 'border-destructive focus-visible:ring-destructive' : ''}
                    />
                    {resetErrors.confirmPassword && (
                      <p className="text-sm text-destructive font-medium">{resetErrors.confirmPassword.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full mt-2" disabled={loading}>
                    {loading ? 'Updating Password...' : 'Reset Password'}
                  </Button>

                  <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => setStep('request')}
                      className="text-primary hover:underline font-medium"
                    >
                      Change email
                    </button>

                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={cooldown > 0 || loading}
                      className={`inline-flex items-center gap-1 font-medium ${
                        cooldown > 0 ? 'opacity-50 cursor-not-allowed' : 'text-primary hover:underline'
                      }`}
                    >
                      <RefreshCw className="w-3 h-3" />
                      {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                    </button>
                  </div>
                </form>
              </CardContent>

              <CardFooter className="flex flex-col border-t p-6 mt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </Link>
              </CardFooter>
            </>
          )}

          {step === 'success' && (
            <>
              <CardHeader className="space-y-2 pb-4 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-2xl font-bold">Password Reset Successful</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Your password has been securely updated. You can now log in with your new password.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-2">
                <Button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full"
                >
                  Go to Sign In
                </Button>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
