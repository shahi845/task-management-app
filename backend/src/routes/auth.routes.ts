import { Router } from 'express';
import {
  register,
  login,
  getMe,
  logout,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  googleLogin,
  guestLogin,
  githubLogin,
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authRateLimiter } from '../middlewares/rateLimiter.middleware';

const router = Router();

router.post('/register', authRateLimiter, register);
router.post('/verify-otp', authRateLimiter, verifyOtp);
router.post('/resend-otp', authRateLimiter, resendOtp);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);
router.post('/login', authRateLimiter, login);
router.post('/google', authRateLimiter, googleLogin);
router.post('/github', authRateLimiter, githubLogin);
router.post('/guest', guestLogin);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

export default router;
