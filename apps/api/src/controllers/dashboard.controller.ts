import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/error';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: { org: true },
    });

    if (!user?.org) {
      return next(new AppError('Organization not found', 404));
    }

    const orgId = user.org.id;

    const [totalFindings, highSeverityFindings, activeWatchlistItems] = await Promise.all([
      prisma.finding.count({ where: { orgId } }),
      prisma.finding.count({ where: { orgId, severity: 'high', status: { not: 'resolved' } } }),
      prisma.watchlistItem.count({ where: { orgId, status: 'verified' } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        riskScore: user.org.riskScore,
        totalFindings,
        highSeverityFindings,
        activeWatchlistItems,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getRecentActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: { org: true },
    });

    if (!user?.org) {
      return next(new AppError('Organization not found', 404));
    }

    const recentFindings = await prisma.finding.findMany({
      where: { orgId: user.org.id },
      orderBy: { detectedAt: 'desc' },
      take: 5,
    });

    res.status(200).json({ success: true, data: recentFindings });
  } catch (err) {
    next(err);
  }
};
