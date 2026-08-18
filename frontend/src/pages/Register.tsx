import { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  CardTitle
} from '../components/ui/Card';
import { CheckSquare, RefreshCw, Mail } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const RESEND_COOLDOWN = 60;   // seconds between resends (UI enforced)
const MAX_RESENDS = 3;        // mirrors backend limit

// ---------------------------------------------------------------------------
// OTP digit-box component
// ---------------------------------------------------------------------------
interface OtpInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

const OtpInput = ({ value, onChange, disabled }: OtpInputProps) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (value[idx]) {
        // Clear current cell
        const next = [...value];
        next[idx] = '';
        onChange(next);
      } else if (idx > 0) {
        // Move back and clear previous
        const next = [...value];
        next[idx - 1] = '';
        onChange(next);
        refs.current[idx - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      refs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < 5) {
      refs.current[idx + 1]?.focus();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) return;

    // Handle paste — fill multiple boxes
    if (raw.length > 1) {
      const digits = raw.slice(0, 6).split('');
      const next = [...value];
      digits.forEach((d, i) => {
        if (idx + i < 6) next[idx + i] = d;
      });
      onChange(next);
      const focusIdx = Math.min(idx + digits.length, 5);
      refs.current[focusIdx]?.focus();
      return;
    }

    const next = [...value];
    next[idx] = raw;
    onChange(next);
    if (idx < 5) refs.current[idx + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, idx: number) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6 - idx);
    if (!pasted) return;
    const next = [...value];
    pasted.split('').forEach((d, i) => {
      if (idx + i < 6) next[idx + i] = d;
    });
    onChange(next);
    const focusIdx = Math.min(idx + pasted.length, 5);
    refs.current[focusIdx]?.focus();
  };

  return (
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          id={`otp-digit-${i}`}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          disabled={disabled}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={(e) => handlePaste(e, i)}
          onFocus={(e) => e.target.select()}
          autoComplete="one-time-code"
          style={{
            width: '48px',
            height: '56px',
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: 700,
            border: value[i]
              ? '2px solid hsl(var(--primary))'
              : '2px solid hsl(var(--border))',
            borderRadius: '10px',
            backgroundColor: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            outline: 'none',
            caretColor: 'transparent',
            transition: 'border-color 0.15s',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
        />
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Resend countdown
// ---------------------------------------------------------------------------
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

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return { seconds, start };
};

// ---------------------------------------------------------------------------
// Register page
// ---------------------------------------------------------------------------
const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { pendingVerification?: boolean; email?: string } | null;

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // If redirected from Login with pendingVerification, jump straight to OTP screen
  const [otpSent, setOtpSent] = useState(locationState?.pendingVerification ?? false);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [resendCount, setResendCount] = useState(0);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  const { seconds: countdown, start: startCountdown } = useResendCountdown(RESEND_COOLDOWN);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setError(null);
    setLoading(true);
    try {
      const response = await api.post('/auth/register', data);
      if (response.data.success) {
        setOtpSent(true);
        setDigits(Array(6).fill(''));
        setResendCount(0);
        startCountdown();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    const otp = digits.join('');
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const email = getValues('email');
      const response = await api.post('/auth/verify-otp', { email, otp });
      if (response.data.success) {
        login(response.data.data.token, response.data.data.user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resendCount >= MAX_RESENDS) return;
    setError(null);
    setResendSuccess(null);
    setLoading(true);
    try {
      const email = getValues('email');
      await api.post('/auth/resend-otp', { email });
      setDigits(Array(6).fill(''));
      setResendCount((c) => c + 1);
      startCountdown();
      setResendSuccess('A new code has been sent to your email.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const attemptsLeft = MAX_RESENDS - resendCount;
  const resendExhausted = resendCount >= MAX_RESENDS;

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="flex justify-center mb-8">
          <div className="bg-primary p-3 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2">
            <CheckSquare className="w-8 h-8 text-white" />
            <span className="text-white font-bold text-2xl tracking-tight pr-2">
              TaskFlow
            </span>
          </div>
        </div>

        <Card className="border-0 shadow-xl">

          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center font-bold">
              {otpSent ? 'Verify your email' : 'Create an account'}
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              {otpSent
                ? `We sent a 6-digit code to ${getValues('email')}`
                : 'Enter your details to get started'}
            </CardDescription>
          </CardHeader>

          <CardContent>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4 text-center border border-destructive/20">
                {error}
              </div>
            )}

            {resendSuccess && !error && (
              <div className="bg-green-500/10 text-green-700 dark:text-green-400 text-sm p-3 rounded-md mb-4 text-center border border-green-500/20 flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                {resendSuccess}
              </div>
            )}

            {!otpSent ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    {...register('name')}
                    className={errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive font-medium">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    {...register('email')}
                    className={errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive font-medium">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                    className={errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive font-medium">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...register('confirmPassword')}
                    className={errors.confirmPassword ? 'border-destructive focus-visible:ring-destructive' : ''}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive font-medium">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full mt-2" disabled={loading}>
                  {loading ? 'Sending code…' : 'Sign Up'}
                </Button>

              </form>
            ) : (
              <div className="space-y-6">

                {/* 6-digit OTP boxes */}
                <div className="space-y-3">
                  <Label className="block text-center text-sm font-medium">
                    Verification Code
                  </Label>
                  <OtpInput value={digits} onChange={setDigits} disabled={loading} />
                </div>

                <Button
                  type="button"
                  className="w-full"
                  disabled={loading || digits.join('').length !== 6}
                  onClick={handleVerifyOtp}
                >
                  {loading ? 'Verifying…' : 'Verify Email'}
                </Button>

                {/* Resend section */}
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the code?
                  </p>

                  {resendExhausted ? (
                    <p className="text-sm text-destructive font-medium">
                      Maximum resend limit reached. Please wait 15 minutes.
                    </p>
                  ) : countdown > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Resend OTP in{' '}
                      <span className="font-semibold tabular-nums text-foreground">
                        {countdown}s
                      </span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Resend OTP
                      {attemptsLeft < MAX_RESENDS && (
                        <span className="text-muted-foreground font-normal">
                          ({attemptsLeft} left)
                        </span>
                      )}
                    </button>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                  onClick={() => {
                    setOtpSent(false);
                    setDigits(Array(6).fill(''));
                    setError(null);
                    setResendSuccess(null);
                  }}
                >
                  Back
                </Button>

              </div>
            )}

          </CardContent>

          <CardFooter className="flex flex-col border-t p-6 mt-2">
            <p className="text-sm text-center text-muted-foreground mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>

        </Card>
      </div>
    </div>
  );
};

export default Register;