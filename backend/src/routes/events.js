import { Router } from 'express';
import { z } from 'zod';
import { Event } from '../models/Event.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const r = Router();

const createSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  program: z.enum(['feeding', 'health', 'learning', 'environment', 'livelihood', 'youth']).optional(),
  barangay: z.string().optional(),
  sitio: z.string().optional(),
  partnerOrg: z.string().optional(),
  location: z.string().min(2),
  eventDate: z.coerce.date(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  targetChildren: z.number().int().min(0).optional(),
  status: z.enum(['draft', 'published', 'ongoing', 'completed', 'cancelled']).optional(),
});

r.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status)  filter.status = req.query.status;
    if (req.query.program) filter.program = req.query.program;
    const events = await Event.find(filter).sort({ eventDate: 1 }).limit(200);
    res.json({ events });
  } catch (e) {
    next(e);
  }
});

r.get('/:id', async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'NotFound' });
    res.json({ event });
  } catch (e) {
    next(e);
  }
});

r.post('/', requireAuth, requireRole('organizer'), validate(createSchema), async (req, res, next) => {
  try {
    const event = await Event.create({ ...req.body, createdBy: req.user.sub });
    res.status(201).json({ event });
  } catch (e) {
    next(e);
  }
});

export default r;
