import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/error';
import { searchHibpByDomain, calculateRiskScore } from '../services/hibp.service';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['new', 'investigating', 'resolved', 'ignored']),
  resolvedNote: z.string().optional(),
});

export const getFindings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: { org: true },
    });

    if (!user?.org) {
      return next(new AppError('Organization not found', 404));
    }

    const { status, severity } = req.query;

    const whereClause: any = { orgId: user.org.id };
    if (status) whereClause.status = status;
    if (severity) whereClause.severity = severity;

    const findings = await prisma.finding.findMany({
      where: whereClause,
      orderBy: { detectedAt: 'desc' },
      include: { watchlistItem: true },
    });

    res.status(200).json({ success: true, data: findings });
  } catch (err) {
    next(err);
  }
};

export const getFindingById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: { org: true },
    });

    if (!user?.org) {
      return next(new AppError('Organization not found', 404));
    }

    const finding = await prisma.finding.findUnique({
      where: { id: req.params.id },
      include: { watchlistItem: true, alerts: true },
    });

    if (!finding || finding.orgId !== user.org.id) {
      return next(new AppError('Finding not found', 404));
    }

    res.status(200).json({ success: true, data: finding });
  } catch (err) {
    next(err);
  }
};

export const updateFindingStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, resolvedNote } = updateStatusSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: { org: true },
    });

    if (!user?.org) {
      return next(new AppError('Organization not found', 404));
    }

    const finding = await prisma.finding.findUnique({ where: { id: req.params.id } });
    if (!finding || finding.orgId !== user.org.id) {
      return next(new AppError('Finding not found', 404));
    }

    const updated = await prisma.finding.update({
      where: { id: req.params.id },
      data: {
        status,
        resolvedAt: status === 'resolved' ? new Date() : null,
        resolvedNote: resolvedNote || null,
      },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

export const manualSearch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { domain } = req.body;
    if (!domain) {
      return next(new AppError('Domain is required', 400));
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: { org: true },
    });

    if (!user?.org) {
      return next(new AppError('Organization not found', 404));
    }

    const hibpResults = await searchHibpByDomain(domain);
    
    // Save to DB
    const createdFindings = await Promise.all(hibpResults.map(async (breach) => {
      const { score, severity } = calculateRiskScore(breach);
      
      // Check if already exists
      const existing = await prisma.finding.findFirst({
        where: { orgId: user.org.id, breachName: breach.Name, domain }
      });

      if (existing) return existing;

      return prisma.finding.create({
        data: {
          orgId: user.org.id,
          domain,
          breachName: breach.Name,
          breachDate: new Date(breach.BreachDate),
          recordCount: breach.PwnCount,
          dataClasses: breach.DataClasses,
          isVerified: breach.IsVerified,
          riskScore: score,
          severity,
          status: 'new'
        }
      });
    }));

    res.status(200).json({ success: true, data: createdFindings });
  } catch (err) {
    next(err);
  }
};
