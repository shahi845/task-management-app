import { Router } from 'express';
import {
  register,
  login,
  getMe,
  logout,
  verifyOtp
} from '../controllers/auth.controller';import { authenticate } from '../middlewares/auth.middleware';
import { authRateLimiter } from '../middlewares/rateLimiter.middleware';

const router = Router();

router.post('/register', authRateLimiter, register);
router.post('/verify-otp', authRateLimiter, verifyOtp);
router.post('/login', authRateLimiter, login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

export default router;
