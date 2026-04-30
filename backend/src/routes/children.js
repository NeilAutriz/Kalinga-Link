import { Router } from 'express';
import { ChildRecord } from '../models/ChildRecord.js';
import { Measurement } from '../models/Measurement.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const r = Router();

// Authorized only: list child records with last measurement summary.
r.get('/', requireAuth, requireRole('organizer', 'health'), async (_req, res, next) => {
  try {
    const children = await ChildRecord.find().sort({ createdAt: -1 }).lean();
    const last = await Measurement.aggregate([
      { $sort: { recordedAt: -1 } },
      {
        $group: {
          _id: '$childId',
          lastStatus: { $first: '$status' },
          lastMeasuredAt: { $first: '$recordedAt' },
          lastHeightCm: { $first: '$heightCm' },
          lastWeightKg: { $first: '$weightKg' },
        },
      },
    ]);
    const map = new Map(last.map((m) => [String(m._id), m]));
    res.json({
      children: children.map((c) => {
        const m = map.get(String(c._id));
        return {
          ...c,
          lastStatus: m?.lastStatus ?? 'baseline',
          lastMeasuredAt: m?.lastMeasuredAt ?? null,
          lastHeightCm: m?.lastHeightCm ?? null,
          lastWeightKg: m?.lastWeightKg ?? null,
        };
      }),
    });
  } catch (e) {
    next(e);
  }
});

export default r;
