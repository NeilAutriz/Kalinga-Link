import { Router } from 'express';
import authRoutes from './auth.js';
import eventRoutes from './events.js';
import committeeRoutes from './committees.js';
import resourceRoutes from './resources.js';
import childRoutes from './children.js';
import dashboardRoutes from './dashboard.js';
import meRoutes from './me.js';
import chatRoutes from './chat.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/committees', committeeRoutes);
router.use('/resources', resourceRoutes);
router.use('/children', childRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/me', meRoutes);
router.use('/chat', chatRoutes);

export default router;
