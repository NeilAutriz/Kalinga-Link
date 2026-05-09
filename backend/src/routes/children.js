import { Router } from 'express';
import mongoose from 'mongoose';
import { ChildRecord } from '../models/ChildRecord.js';
import { Measurement } from '../models/Measurement.js';
import { Event } from '../models/Event.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { audit } from '../services/auditService.js';

const r = Router();

const STATUS_VALUES = new Set(['baseline', 'monitored', 'improved', 'no_change', 'declined']);
const SEX_VALUES = new Set(['M', 'F', 'X']);

const isValidId = (v) => mongoose.Types.ObjectId.isValid(String(v));

// Authorized only: list child records with last measurement summary.
r.get('/', requireAuth, requireRole('organizer', 'health'), async (_req, res, next) => {
  try {
    const children = await ChildRecord.find().sort({ createdAt: -1 }).lean();
    const last = await Measurement.aggregate([
      { $sort: { recordedAt: -1 } },
      {
        $group: {
          _id: '$childId',
          lastMeasurementId: { $first: '$_id' },
          lastStatus: { $first: '$status' },
          lastMeasuredAt: { $first: '$recordedAt' },
          lastHeightCm: { $first: '$heightCm' },
          lastWeightKg: { $first: '$weightKg' },
          lastEventId: { $first: '$eventId' },
        },
      },
    ]);
    const map = new Map(last.map((m) => [String(m._id), m]));
    res.json({
      children: children.map((c) => {
        const m = map.get(String(c._id));
        return {
          ...c,
          lastMeasurementId: m?.lastMeasurementId ?? null,
          lastStatus: m?.lastStatus ?? 'baseline',
          lastMeasuredAt: m?.lastMeasuredAt ?? null,
          lastHeightCm: m?.lastHeightCm ?? null,
          lastWeightKg: m?.lastWeightKg ?? null,
          lastEventId: m?.lastEventId ?? null,
        };
      }),
    });
  } catch (e) {
    next(e);
  }
});

// Create child record. Consent must be true; the model's pre('validate') enforces this too.
r.post('/', requireAuth, requireRole('organizer', 'health'), async (req, res, next) => {
  try {
    const {
      firstName,
      age,
      sex,
      guardianName,
      guardianContact,
      consentGiven,
      consentDate,
      notes,
    } = req.body ?? {};

    const trimmedFirst = typeof firstName === 'string' ? firstName.trim() : '';
    const trimmedGuardian = typeof guardianName === 'string' ? guardianName.trim() : '';
    const ageNum = Number(age);

    if (!trimmedFirst) return res.status(400).json({ error: 'firstName is required' });
    if (!Number.isFinite(ageNum) || ageNum < 0 || ageNum > 18) {
      return res.status(400).json({ error: 'age must be a number between 0 and 18' });
    }
    if (!SEX_VALUES.has(sex)) return res.status(400).json({ error: 'sex must be M, F, or X' });
    if (!trimmedGuardian) return res.status(400).json({ error: 'guardianName is required' });
    if (consentGiven !== true) {
      return res.status(400).json({ error: 'Guardian consent is required to save a child record.' });
    }

    const child = await ChildRecord.create({
      firstName: trimmedFirst,
      age: ageNum,
      sex,
      guardianName: trimmedGuardian,
      guardianContact: typeof guardianContact === 'string' ? guardianContact.trim() : undefined,
      consentGiven: true,
      consentDate: consentDate ? new Date(consentDate) : new Date(),
      notes: typeof notes === 'string' ? notes : '',
      createdBy: req.user.sub,
    });

    await audit({
      userId: req.user.sub,
      action: 'child.create',
      entityType: 'ChildRecord',
      entityId: String(child._id),
      metadata: { anonCode: child.anonCode },
    });

    res.status(201).json({ child });
  } catch (e) {
    next(e);
  }
});

// Record a new measurement for a child.
r.post(
  '/:childId/measurements',
  requireAuth,
  requireRole('organizer', 'health'),
  async (req, res, next) => {
    try {
      const { childId } = req.params;
      if (!isValidId(childId)) return res.status(400).json({ error: 'Invalid child id' });

      const child = await ChildRecord.findById(childId).lean();
      if (!child) return res.status(404).json({ error: 'Child not found' });

      const { eventId, heightCm, weightKg, status, recordedAt, notes } = req.body ?? {};
      if (!isValidId(eventId)) return res.status(400).json({ error: 'eventId is required' });
      if (!STATUS_VALUES.has(status)) {
        return res.status(400).json({ error: 'status must be one of baseline, monitored, improved, no_change, declined' });
      }

      const event = await Event.findById(eventId).lean();
      if (!event) return res.status(404).json({ error: 'Event not found' });

      const heightNum = heightCm === '' || heightCm == null ? undefined : Number(heightCm);
      const weightNum = weightKg === '' || weightKg == null ? undefined : Number(weightKg);
      if (heightNum !== undefined && (!Number.isFinite(heightNum) || heightNum < 0)) {
        return res.status(400).json({ error: 'heightCm must be a non-negative number' });
      }
      if (weightNum !== undefined && (!Number.isFinite(weightNum) || weightNum < 0)) {
        return res.status(400).json({ error: 'weightKg must be a non-negative number' });
      }

      const measurement = await Measurement.create({
        childId,
        eventId,
        heightCm: heightNum,
        weightKg: weightNum,
        status,
        recordedBy: req.user.sub,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
        notes: typeof notes === 'string' ? notes : '',
      });

      await audit({
        userId: req.user.sub,
        action: 'measurement.create',
        entityType: 'Measurement',
        entityId: String(measurement._id),
        metadata: { childId, eventId, status },
      });

      res.status(201).json({ measurement });
    } catch (e) {
      next(e);
    }
  },
);

// Edit an existing measurement (height, weight, status, recordedAt).
r.patch(
  '/:childId/measurements/:id',
  requireAuth,
  requireRole('organizer', 'health'),
  async (req, res, next) => {
    try {
      const { childId, id } = req.params;
      if (!isValidId(childId) || !isValidId(id)) {
        return res.status(400).json({ error: 'Invalid id' });
      }

      const measurement = await Measurement.findById(id);
      if (!measurement) return res.status(404).json({ error: 'Measurement not found' });
      if (String(measurement.childId) !== String(childId)) {
        return res.status(404).json({ error: 'Measurement not found for this child' });
      }

      const { heightCm, weightKg, status, recordedAt } = req.body ?? {};
      const before = {
        heightCm: measurement.heightCm,
        weightKg: measurement.weightKg,
        status: measurement.status,
        recordedAt: measurement.recordedAt,
      };

      if (heightCm !== undefined) {
        const n = heightCm === '' || heightCm === null ? undefined : Number(heightCm);
        if (n !== undefined && (!Number.isFinite(n) || n < 0)) {
          return res.status(400).json({ error: 'heightCm must be a non-negative number' });
        }
        measurement.heightCm = n;
      }
      if (weightKg !== undefined) {
        const n = weightKg === '' || weightKg === null ? undefined : Number(weightKg);
        if (n !== undefined && (!Number.isFinite(n) || n < 0)) {
          return res.status(400).json({ error: 'weightKg must be a non-negative number' });
        }
        measurement.weightKg = n;
      }
      if (status !== undefined) {
        if (!STATUS_VALUES.has(status)) {
          return res.status(400).json({ error: 'Invalid status' });
        }
        measurement.status = status;
      }
      if (recordedAt !== undefined) {
        const d = new Date(recordedAt);
        if (Number.isNaN(d.getTime())) {
          return res.status(400).json({ error: 'Invalid recordedAt' });
        }
        measurement.recordedAt = d;
      }

      await measurement.save();

      await audit({
        userId: req.user.sub,
        action: 'measurement.update',
        entityType: 'Measurement',
        entityId: String(measurement._id),
        metadata: {
          childId: String(measurement.childId),
          before,
          after: {
            heightCm: measurement.heightCm,
            weightKg: measurement.weightKg,
            status: measurement.status,
            recordedAt: measurement.recordedAt,
          },
        },
      });

      res.json({ measurement });
    } catch (e) {
      next(e);
    }
  },
);

export default r;
