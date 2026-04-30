import { Router } from 'express';
import * as ctrl from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { registerSchema, loginSchema } from '../validators/auth.js';

const r = Router();

r.post('/register', validate(registerSchema), ctrl.register);
r.post('/login', validate(loginSchema), ctrl.login);
r.post('/logout', ctrl.logout);
r.get('/me', requireAuth, ctrl.me);

export default r;
