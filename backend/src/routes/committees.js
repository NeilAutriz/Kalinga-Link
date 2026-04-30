import { Router } from 'express';
import { Committee } from '../models/Committee.js';
import { VolunteerSignup } from '../models/VolunteerSignup.js';
import { requireAuth } from '../middleware/auth.js';

const r = Router();

// Roles allowed to occupy a volunteer slot. Donors and health partners do NOT
// take committee slots — donors pledge supplies, health partners are external
// and recorded as event partners, not as volunteers.
const VOLUNTEER_ROLES = new Set(['volunteer', 'organizer']);

// Public: list committees (optionally filtered by event) + filled counts.
r.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.eventId) filter.eventId = req.query.eventId;
    const committees = await Committee.find(filter).lean();
    const ids = committees.map((c) => c._id);
    const counts = await VolunteerSignup.aggregate([
      { $match: { committeeId: { $in: ids }, status: { $in: ['signed_up', 'attended'] } } },
      { $group: { _id: '$committeeId', filled: { $sum: 1 } } },
    ]);
    const map = new Map(counts.map((c) => [String(c._id), c.filled]));
    res.json({
      committees: committees.map((c) => ({ ...c, filled: map.get(String(c._id)) ?? 0 })),
    });
  } catch (e) {
    next(e);
  }
});

// Volunteer signs up for a committee.
r.post('/:id/signup', requireAuth, async (req, res, next) => {
  try {
    if (!VOLUNTEER_ROLES.has(req.user.role)) {
      return res.status(403).json({
        error: 'Your role does not take committee slots. Donors can pledge supplies; health partners are recorded as event partners.',
      });
    }
    const committee = await Committee.findById(req.params.id).lean();
    if (!committee) return res.status(404).json({ error: 'Committee not found' });

    // Reject duplicate sign-ups (also enforced by unique index)
    const exists = await VolunteerSignup.findOne({ committeeId: req.params.id, userId: req.user.sub });
    if (exists && exists.status !== 'cancelled') {
      return res.status(409).json({ error: 'You are already signed up to this committee' });
    }

    // Capacity check: count active signups
    const filled = await VolunteerSignup.countDocuments({
      committeeId: req.params.id,
      status: { $in: ['signed_up', 'attended'] },
    });
    if (filled >= committee.slotCount) {
      return res.status(409).json({ error: 'This committee is already full' });
    }

    // If a previous cancelled record exists, re-activate it; else create new.
    let signup;
    if (exists) {
      exists.status = 'signed_up';
      exists.signedUpAt = new Date();
      exists.cancelledAt = undefined;
      signup = await exists.save();
    } else {
      signup = await VolunteerSignup.create({
        committeeId: req.params.id,
        userId: req.user.sub,
        status: 'signed_up',
      });
    }
    res.status(201).json({ signup });
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(409).json({ error: 'You are already signed up to this committee' });
    }
    next(e);
  }
});

// Cancel an own signup.
r.delete('/signups/:id', requireAuth, async (req, res, next) => {
  try {
    const signup = await VolunteerSignup.findById(req.params.id);
    if (!signup) return res.status(404).json({ error: 'Signup not found' });
    if (String(signup.userId) !== String(req.user.sub)) {
      return res.status(403).json({ error: 'Not your signup' });
    }
    if (signup.status === 'cancelled') {
      return res.status(409).json({ error: 'Already cancelled' });
    }
    if (signup.status === 'attended') {
      return res.status(409).json({ error: 'Cannot cancel an attended event' });
    }
    signup.status = 'cancelled';
    signup.cancelledAt = new Date();
    await signup.save();
    res.json({ signup });
  } catch (e) {
    next(e);
  }
});

export default r;
