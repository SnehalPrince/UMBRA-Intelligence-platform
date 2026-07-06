import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/error';
import { verificationQueue } from '../lib/queue';

const addWatchlistSchema = z.object({
  type: z.enum(['domain', 'keyword']),
  value: z.string().min(2),
  label: z.string().optional(),
});

export const getWatchlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: { org: true },
    });

    if (!user?.org) {
      return next(new AppError('Organization not found', 404));
    }

    const items = await prisma.watchlistItem.findMany({
      where: { orgId: user.org.id },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

export const addWatchlistItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, value, label } = addWatchlistSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: { org: true },
    });

    if (!user?.org) {
      return next(new AppError('Organization not found', 404));
    }

    const existing = await prisma.watchlistItem.findUnique({
      where: {
        orgId_type_value: {
          orgId: user.org.id,
          type,
          value,
        },
      },
    });

    if (existing) {
      return next(new AppError('Item already exists in watchlist', 400));
    }

    const item = await prisma.watchlistItem.create({
      data: {
        orgId: user.org.id,
        type,
        value,
        label,
        status: type === 'domain' ? 'pending_verification' : 'verified',
      },
    });

    // If it's a domain, queue a mock verification job (60s delay per MVP rules)
    if (type === 'domain') {
      await verificationQueue.add(
        'verify-domain',
        { itemId: item.id, orgId: user.org.id, domain: value },
        { delay: 60000 }
      );
    }

    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

export const deleteWatchlistItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: { org: true },
    });

    if (!user?.org) {
      return next(new AppError('Organization not found', 404));
    }

    const item = await prisma.watchlistItem.findUnique({ where: { id } });

    if (!item || item.orgId !== user.org.id) {
      return next(new AppError('Item not found', 404));
    }

    await prisma.watchlistItem.delete({ where: { id } });

    res.status(200).json({ success: true, message: 'Item removed from watchlist' });
  } catch (err) {
    next(err);
  }
};
