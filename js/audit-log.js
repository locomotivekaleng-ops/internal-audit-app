/* ============================================================
   AUDIT LOG — Server-side audit trail via log_audit_event() RPC
   ============================================================ */

const AuditLog = {
  /**
   * Log an audit event to the server.
   * @param {string} action - CREATE, UPDATE, DELETE, LOGIN, EXPORT, VIEW
   * @param {string} entityType - planning, result, action, user, master, wbs, fds, settings
   * @param {string|null} entityId - ID of the affected entity
   * @param {object} details - Additional context data
   */
  async log(action, entityType, entityId = null, details = {}) {
    try {
      await Supabase._fetch('POST', 'rpc/log_audit_event', {
        body: {
          p_action: action,
          p_entity_type: entityType,
          p_entity_id: entityId ? String(entityId) : null,
          p_details: details,
        },
      });
    } catch (err) {
      console.warn('[AuditLog] Failed to log event:', err);
    }
  },

  logCreate(entityType, entityId, details = {}) {
    return AuditLog.log('CREATE', entityType, entityId, details);
  },

  logUpdate(entityType, entityId, details = {}) {
    return AuditLog.log('UPDATE', entityType, entityId, details);
  },

  logDelete(entityType, entityId, details = {}) {
    return AuditLog.log('DELETE', entityType, entityId, details);
  },

  logExport(entityType, details = {}) {
    return AuditLog.log('EXPORT', entityType, null, details);
  },
};

window.AuditLog = AuditLog;
