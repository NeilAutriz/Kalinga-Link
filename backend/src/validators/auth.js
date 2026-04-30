import { z } from 'zod';

// Self-registration is intentionally limited to non-privileged roles.
// Organizer and health-partner accounts must be promoted by an admin
// (or created by the seed script) so that sensitive features like event
// creation and child-monitoring access cannot be self-granted.
export const SELF_REGISTRABLE_ROLES = ['volunteer', 'donor'];

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().min(2).max(120),
  contactNumber: z.string().max(40).optional(),
  affiliation: z.string().max(120).optional(),
  role: z.enum(SELF_REGISTRABLE_ROLES).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
