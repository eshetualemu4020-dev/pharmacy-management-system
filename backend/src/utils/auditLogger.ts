import db from '../config/db.js';

interface AuditLogPayload {
  userId: number;
  action: string;
  module: string;
  entityType?: string;
  entityId?: number;
  description?: string;
  oldValue?: any;
  newValue?: any;
}

export const logAudit = async (payload: AuditLogPayload) => {
  try {
    const {
      userId,
      action,
      module,
      entityType = null,
      entityId = null,
      description = null,
      oldValue = null,
      newValue = null,
    } = payload;

    const oldValStr = oldValue ? JSON.stringify(oldValue) : null;
    const newValStr = newValue ? JSON.stringify(newValue) : null;

    const query = `
      INSERT INTO audit_logs 
      (user_id, action, module, target_table, target_id, description, old_value, new_value)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(query, [
      userId,
      action,
      module,
      entityType,
      entityId,
      description,
      oldValStr,
      newValStr,
    ]);
  } catch (error) {
    console.error('Failed to write audit log:', error);
    // We intentionally do not throw the error to prevent audit logging failures
    // from crashing the primary business transactions.
  }
};
