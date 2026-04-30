import * as authService from '../services/authService.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

const cookieOpts = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({ user });
  } catch (e) {
    next(e);
  }
};

export const login = async (req, res, next) => {
  try {
    const { user, token } = await authService.login(req.body);
    res.cookie('token', token, cookieOpts);
    res.json({ user, token });
  } catch (e) {
    next(e);
  }
};

export const logout = async (_req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
};

export const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (e) {
    next(e);
  }
};
