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

// Roles that may NOT create a pledge while signed in. Anonymous pledges are
// still allowed (donate page works for the public). Organizers should use a
// separate donor account if they personally want to give; health partners do
// not pledge supplies — both rules mirror the role cards on the About page.
const PLEDGE_BLOCKED_ROLES = new Set(['organizer', 'health']);

// Public (anonymous OK), but if logged-in we link the pledge to the user account.
r.post('/pledges', optionalAuth, validate(pledgeSchema), async (req, res, next) => {
  try {
    if (req.user && PLEDGE_BLOCKED_ROLES.has(req.user.role)) {
      return res.status(403).json({
        error:
          req.user.role === 'organizer'
            ? 'Organizers manage pledges; please use a separate donor account to give personally.'
            : 'Health partners are recorded as event partners and do not take pledge slots.',
      });
    }
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
