import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { HttpError } from '../middleware/error.js';

export const register = async ({ email, password, fullName, contactNumber, affiliation, role }) => {
  const exists = await User.findOne({ email });
  if (exists) throw new HttpError(409, 'Email already registered');
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  // role is already constrained by the Zod validator to volunteer|donor; the
  // User model enum is the second line of defense. Default to volunteer.
  const user = await User.create({
    email, passwordHash, fullName, contactNumber, affiliation,
    role: role ?? 'volunteer',
  });
  return user;
};

export const login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new HttpError(401, 'Invalid credentials');
  const ok = await argon2.verify(user.passwordHash, password);
  if (!ok) throw new HttpError(401, 'Invalid credentials');
  const token = jwt.sign({ sub: user.id, role: user.role, email: user.email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
  return { user, token };
};
