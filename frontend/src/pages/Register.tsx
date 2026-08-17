import { useState } from 'react';
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '../components/ui/Card';
import { CheckSquare } from 'lucide-react';

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

const Register = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

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
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        'An error occurred during registration'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);

    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);

    try {
      const email = getValues('email');

      const response = await api.post('/auth/verify-otp', {
        email,
        otp,
      });

      if (response.data.success) {
        login(
          response.data.data.token,
          response.data.data.user
        );

        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        'Invalid verification code'
      );
    } finally {
      setLoading(false);
    }
  };

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
                ? `We sent a 6-digit verification code to ${getValues('email')}`
                : 'Enter your details to get started'}
            </CardDescription>
          </CardHeader>

          <CardContent>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4 text-center border border-destructive/20">
                {error}
              </div>
            )}

            {!otpSent ? (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
              >

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>

                  <Input
                    id="name"
                    placeholder="John Doe"
                    {...register('name')}
                    className={
                      errors.name
                        ? 'border-destructive focus-visible:ring-destructive'
                        : ''
                    }
                  />

                  {errors.name && (
                    <p className="text-sm text-destructive font-medium">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>

                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    {...register('email')}
                    className={
                      errors.email
                        ? 'border-destructive focus-visible:ring-destructive'
                        : ''
                    }
                  />

                  {errors.email && (
                    <p className="text-sm text-destructive font-medium">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>

                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                    className={
                      errors.password
                        ? 'border-destructive focus-visible:ring-destructive'
                        : ''
                    }
                  />

                  {errors.password && (
                    <p className="text-sm text-destructive font-medium">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirm Password
                  </Label>

                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...register('confirmPassword')}
                    className={
                      errors.confirmPassword
                        ? 'border-destructive focus-visible:ring-destructive'
                        : ''
                    }
                  />

                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive font-medium">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full mt-2"
                  disabled={loading}
                >
                  {loading ? 'Sending code...' : 'Sign Up'}
                </Button>

              </form>
            ) : (
              <div className="space-y-4">

                <div className="space-y-2">
                  <Label htmlFor="otp">
                    Verification Code
                  </Label>

                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) =>
                      setOtp(
                        e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 6)
                      )
                    }
                    className="text-center text-2xl tracking-[0.5em]"
                  />
                </div>

                <Button
                  type="button"
                  className="w-full"
                  disabled={loading}
                  onClick={handleVerifyOtp}
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
                    setError(null);
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
              <Link
                to="/login"
                className="text-primary hover:underline font-medium"
              >
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