import { Router } from 'express';
import { getDashboardStats, getRecentActivity } from '../controllers/dashboard.controller';
import { requireAuth } from '../middlewares/auth';

const router = Router();

router.use(requireAuth);

router.get('/stats', getDashboardStats);
router.get('/activity', getRecentActivity);

export default router;
