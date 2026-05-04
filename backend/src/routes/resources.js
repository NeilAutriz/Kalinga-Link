import { Router } from 'express';
import { z } from 'zod';
import { ResourceNeed } from '../models/ResourceNeed.js';
import { Pledge } from '../models/Pledge.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
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
  donorContact: z
    .string()
    .refine(
      val => z.string().email().safeParse(val).success || /^(\+63|0)9\d{9}$/.test(val),
      { message: 'Must be a valid email address or Philippine mobile number (09XXXXXXXXX or +639XXXXXXXXX)' }
    )
    .optional(),
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
    const { quantity } = req.body;
    const need = await ResourceNeed.findById(req.body.resourceNeedId).lean();
    if (!need) return res.status(404).json({ error: 'Resource need not found' });

    const [agg] = await Pledge.aggregate([
      { $match: { resourceNeedId: need._id, status: { $in: ['pledged', 'received'] } } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);
    const remaining = need.quantityNeeded - (agg?.total ?? 0);

    if (remaining <= 0) {
      return res.status(400).json({ error: 'This resource need has already been fully covered.' });
    }
    if (quantity > remaining) {
      return res.status(400).json({
        error: `Only ${remaining} ${need.unit} remaining. Please reduce your pledge quantity.`,
      });
    }

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

const resourceNeedSchema = z.object({
  eventId:        z.string().min(1),
  itemName:       z.string().min(2).max(120),
  category:       z.enum(['food', 'utensils', 'art', 'hygiene', 'equipment', 'transport', 'other']),
  quantityNeeded: z.number().int().min(1),
  unit:           z.string().min(1).max(30).default('pcs'),
  notes:          z.string().max(300).optional(),
});

const resourceNeedUpdateSchema = resourceNeedSchema.partial().omit({ eventId: true });

// Organizer: create resource need
r.post('/', requireAuth, requireRole('organizer'), validate(resourceNeedSchema), async (req, res, next) => {
  try {
    const need = await ResourceNeed.create(req.body);
    res.status(201).json({ resourceNeed: need });
  } catch (err) {
    next(err);
  }
});

// Organizer: update resource need
r.put('/:id', requireAuth, requireRole('organizer'), validate(resourceNeedUpdateSchema), async (req, res, next) => {
  try {
    const need = await ResourceNeed.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!need) return res.status(404).json({ error: 'Resource need not found.' });
    res.json({ resourceNeed: need });
  } catch (err) {
    next(err);
  }
});

// Organizer: delete resource need (blocked if active pledges exist)
r.delete('/:id', requireAuth, requireRole('organizer'), async (req, res, next) => {
  try {
    const need = await ResourceNeed.findById(req.params.id);
    if (!need) return res.status(404).json({ error: 'Resource need not found.' });

    const activePledges = await Pledge.countDocuments({
      resourceNeedId: need._id,
      status: { $in: ['pledged', 'received'] },
    });
    if (activePledges > 0) {
      return res.status(409).json({
        error: `Cannot delete: ${activePledges} active pledge(s) exist for this resource need.`,
      });
    }

    await need.deleteOne();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default r;
