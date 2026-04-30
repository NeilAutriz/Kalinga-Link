import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth.js';
import { VolunteerSignup } from '../models/VolunteerSignup.js';
import { Pledge } from '../models/Pledge.js';

const r = Router();

/** All committee signups for the current user, joined with committee + event. */
r.get('/signups', requireAuth, async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.sub);
    const rows = await VolunteerSignup.aggregate([
      { $match: { userId } },
      { $lookup: { from: 'committees', localField: 'committeeId', foreignField: '_id', as: 'committee' } },
      { $unwind: '$committee' },
      { $lookup: { from: 'events', localField: 'committee.eventId', foreignField: '_id', as: 'event' } },
      { $unwind: '$event' },
      { $sort: { 'event.eventDate': -1 } },
    ]);
    res.json({ signups: rows });
  } catch (e) { next(e); }
});

/** All pledges by the current donor (matched on donorUserId), joined with resource + event. */
r.get('/pledges', requireAuth, async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.sub);
    const rows = await Pledge.aggregate([
      { $match: { donorUserId: userId } },
      { $lookup: { from: 'resourceneeds', localField: 'resourceNeedId', foreignField: '_id', as: 'resource' } },
      { $unwind: '$resource' },
      { $lookup: { from: 'events', localField: 'resource.eventId', foreignField: '_id', as: 'event' } },
      { $unwind: '$event' },
      { $sort: { createdAt: -1 } },
    ]);
    res.json({ pledges: rows });
  } catch (e) { next(e); }
});

export default r;
