import { Router } from 'express';
import { getFindings, getFindingById, updateFindingStatus, manualSearch } from '../controllers/findings.controller';
import { requireAuth } from '../middlewares/auth';

const router = Router();

router.use(requireAuth);

router.get('/', getFindings);
router.post('/search', manualSearch);
router.get('/:id', getFindingById);
router.patch('/:id/status', updateFindingStatus);

export default router;
