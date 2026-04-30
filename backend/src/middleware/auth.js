import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from './error.js';

export const requireAuth = (req, _res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return next(new HttpError(401, 'Unauthorized'));
  try {
    req.user = jwt.verify(token, env.JWT_SECRET);
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token'));
  }
};

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new HttpError(401, 'Unauthorized'));
  if (!roles.includes(req.user.role)) return next(new HttpError(403, 'Forbidden'));
  next();
};
