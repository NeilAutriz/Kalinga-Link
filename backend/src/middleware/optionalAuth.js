import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/** Attaches req.user when a valid token is present; never throws. */
export const optionalAuth = (req, _res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return next();
  try { req.user = jwt.verify(token, env.JWT_SECRET); } catch { /* ignore */ }
  next();
};
