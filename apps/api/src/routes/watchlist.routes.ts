import { Router } from 'express';
import { getWatchlist, addWatchlistItem, deleteWatchlistItem } from '../controllers/watchlist.controller';
import { requireAuth } from '../middlewares/auth';

const router = Router();

router.use(requireAuth);

router.get('/', getWatchlist);
router.post('/', addWatchlistItem);
router.delete('/:id', deleteWatchlistItem);

export default router;
