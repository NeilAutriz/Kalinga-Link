import { Router } from 'express';
import { Event } from '../models/Event.js';
import { ChildRecord } from '../models/ChildRecord.js';
import { Measurement } from '../models/Measurement.js';
import { VolunteerSignup } from '../models/VolunteerSignup.js';
import { Pledge } from '../models/Pledge.js';

const r = Router();

// Public: aggregate impact stats for the home page / about page.
r.get('/impact', async (_req, res, next) => {
  try {
    const [eventsCompleted, childrenServed, improved, signups, pledges] = await Promise.all([
      Event.countDocuments({ status: 'completed' }),
      ChildRecord.countDocuments(),
      Measurement.countDocuments({ status: 'improved' }),
      VolunteerSignup.countDocuments({ status: { $in: ['signed_up', 'attended'] } }),
      Pledge.countDocuments({ status: { $in: ['pledged', 'received'] } }),
    ]);
    res.json({
      stats: {
        eventsCompleted,
        childrenServed,
        childrenImproved: improved,
        volunteersEngaged: signups,
        pledgesReceived: pledges,
        // Approx 4h per signup as a friendly estimate.
        hoursVolunteered: signups * 4,
      },
    });
  } catch (e) {
    next(e);
  }
});

export default r;
