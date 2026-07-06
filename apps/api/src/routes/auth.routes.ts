import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  refresh,
} from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', requireAuth, getMe);

export default router;
