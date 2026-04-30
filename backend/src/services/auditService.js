import { AuditLog } from '../models/AuditLog.js';

export const audit = async ({ userId, action, entityType, entityId, metadata }) => {
  try {
    await AuditLog.create({ userId, action, entityType, entityId, metadata });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Audit log failed:', e);
  }
};
