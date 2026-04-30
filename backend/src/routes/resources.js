import { Router } from 'express';
import { z } from 'zod';
import { ResourceNeed } from '../models/ResourceNeed.js';
import { Pledge } from '../models/Pledge.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';

const r = Router();

// Public: list resource needs with received totals.
r.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.eventId) filter.eventId = req.query.eventId;
    const resources = await ResourceNeed.find(filter).lean();
    const ids = resources.map((x) => x._id);
    const sums = await Pledge.aggregate([
      { $match: { resourceNeedId: { $in: ids }, status: { $in: ['pledged', 'received'] } } },
      { $group: { _id: '$resourceNeedId', received: { $sum: '$quantity' } } },
    ]);
    const map = new Map(sums.map((s) => [String(s._id), s.received]));
    res.json({
      resources: resources.map((x) => ({
        ...x,
        quantityReceived: map.get(String(x._id)) ?? 0,
      })),
    });
  } catch (e) {
    next(e);
  }
});

const pledgeSchema = z.object({
  resourceNeedId: z.string().min(1),
  donorName: z.string().min(2),
  donorContact: z.string().optional(),
  quantity: z.number().int().min(1),
});

// Public (anonymous OK), but if logged-in we link the pledge to the user account.
r.post('/pledges', optionalAuth, validate(pledgeSchema), async (req, res, next) => {
  try {
    const need = await ResourceNeed.findById(req.body.resourceNeedId).lean();
    if (!need) return res.status(404).json({ error: 'Resource need not found' });
    const pledge = await Pledge.create({
      ...req.body,
      donorUserId: req.user?.sub,
      status: 'pledged',
    });
    res.status(201).json({ pledge });
  } catch (e) {
    next(e);
  }
});

// Cancel an own pledge (only owner, only if still 'pledged').
r.delete('/pledges/:id', requireAuth, async (req, res, next) => {
  try {
    const pledge = await Pledge.findById(req.params.id);
    if (!pledge) return res.status(404).json({ error: 'Pledge not found' });
    if (String(pledge.donorUserId) !== String(req.user.sub)) {
      return res.status(403).json({ error: 'Not your pledge' });
    }
    if (pledge.status !== 'pledged') {
      return res.status(409).json({ error: `Cannot cancel a ${pledge.status} pledge` });
    }
    pledge.status = 'cancelled';
    await pledge.save();
    res.json({ pledge });
  } catch (e) {
    next(e);
  }
});

export default r;
