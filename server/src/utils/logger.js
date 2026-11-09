const AuditLog = require('../models/AuditLog');

const logAction = async ({
  action,
  performedBy = null,
  targetEntity,
  targetId = null,
  details = {},
  ipAddress = '',
}) => {
  try {
    const log = new AuditLog({
      action,
      performedBy,
      targetEntity,
      targetId,
      details,
      ipAddress,
    });
    await log.save();
    console.log(`[Audit] ${action} on ${targetEntity} (${targetId || 'N/A'}) by ${performedBy || 'System'}`);
    return log;
  } catch (err) {
    console.error(`[Audit Log Error] ${err.message}`);
    return null;
  }
};

module.exports = {
  logAction,
};

