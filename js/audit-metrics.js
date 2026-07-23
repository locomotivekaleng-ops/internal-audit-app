/* ============================================================
   SHARED AUDIT CALCULATIONS & RELATIONSHIPS HELPER
   ============================================================ */

const AuditMetrics = {
  getActionMetrics(action) {
    const recovery = action.status === 'Closed' ? Number(action.recovery || 0) : 0;
    const unrecovered = Number(action.unrecovered || 0);
    const amount = action.amount !== undefined ? Number(action.amount) : (recovery + unrecovered);
    const outstanding = amount - recovery - unrecovered;
    return { amount, recovery, unrecovered, outstanding };
  },

  getFindingMetrics(findingId) {
    const finding = DB.find('audit_results', findingId);
    if (finding && finding.nature === 'Administrative') {
      return { totalLoss: 0, totalAmountInAAP: 0, totalRecovery: 0, totalUnrecovered: 0, outstandingLoss: 0 };
    }
    const totalLoss = finding ? Number(finding.totalLoss || 0) : 0;
    const actions = DB.get('audit_actions').filter(a => a.resultId === findingId);
    
    const totalAmountInAAP = actions.reduce((sum, a) => sum + AuditMetrics.getActionMetrics(a).amount, 0);
    const totalRecovery = actions.reduce((sum, a) => sum + AuditMetrics.getActionMetrics(a).recovery, 0);
    const totalUnrecovered = actions.reduce((sum, a) => sum + AuditMetrics.getActionMetrics(a).unrecovered, 0);
    const outstandingLoss = totalAmountInAAP - totalRecovery - totalUnrecovered;

    return {
      totalLoss,
      totalAmountInAAP,
      totalRecovery,
      totalUnrecovered,
      outstandingLoss
    };
  },

  getPlanningMetrics(planningId) {
    const findings = DB.get('audit_results').filter(r => r.planningId === planningId && (!r.nature || r.nature !== 'Administrative'));
    const resultIds = new Set(findings.map(r => r.id));
    const actions = DB.get('audit_actions').filter(a => a.planningId === planningId && resultIds.has(a.resultId));

    const totalLoss = findings.reduce((sum, f) => sum + Number(f.totalLoss || 0), 0);
    const totalAmountInAAP = actions.reduce((sum, a) => sum + AuditMetrics.getActionMetrics(a).amount, 0);
    const totalRecovery = actions.reduce((sum, a) => sum + AuditMetrics.getActionMetrics(a).recovery, 0);
    const totalUnrecovered = actions.reduce((sum, a) => sum + AuditMetrics.getActionMetrics(a).unrecovered, 0);
    const outstandingLoss = totalAmountInAAP - totalRecovery - totalUnrecovered;

    return {
      totalLoss,
      totalAmountInAAP,
      totalRecovery,
      totalUnrecovered,
      outstandingLoss
    };
  },

  getGlobalMetrics(filteredPlannings = null) {
    const plannings = filteredPlannings || DB.get('audit_plannings');
    const planIds = new Set(plannings.map(p => p.id));

    const findings = DB.get('audit_results').filter(r => planIds.has(r.planningId));
    const actions = DB.get('audit_actions').filter(a => planIds.has(a.planningId));

    const totalLoss = findings.reduce((sum, f) => sum + Number(f.totalLoss || 0), 0);
    const totalAmountInAAP = actions.reduce((sum, a) => sum + AuditMetrics.getActionMetrics(a).amount, 0);
    const totalRecovery = actions.reduce((sum, a) => sum + AuditMetrics.getActionMetrics(a).recovery, 0);
    const totalUnrecovered = actions.reduce((sum, a) => sum + AuditMetrics.getActionMetrics(a).unrecovered, 0);
    const outstandingLoss = totalAmountInAAP - totalRecovery - totalUnrecovered;

    return {
      totalLoss,
      totalAmountInAAP,
      totalRecovery,
      totalUnrecovered,
      outstandingLoss
    };
  },

  // Variant: accepts a pre-filtered results array (e.g., fraud-only subset)
  // Actions are still filtered by the same planning IDs
  getGlobalMetricsFromResults(filteredResults, filteredPlannings = null) {
    const plannings = filteredPlannings || DB.get('audit_plannings');
    const planIds   = new Set(plannings.map(p => p.id));
    const resultIds = new Set(filteredResults.map(r => r.id));
    const actions   = DB.get('audit_actions').filter(a =>
      planIds.has(a.planningId) && resultIds.has(a.resultId)
    );

    const totalLoss        = filteredResults.reduce((sum, f) => sum + Number(f.totalLoss || 0), 0);
    const totalAmountInAAP = actions.reduce((sum, a) => sum + AuditMetrics.getActionMetrics(a).amount, 0);
    const totalRecovery    = actions.reduce((sum, a) => sum + AuditMetrics.getActionMetrics(a).recovery, 0);
    const totalUnrecovered = actions.reduce((sum, a) => sum + AuditMetrics.getActionMetrics(a).unrecovered, 0);
    const outstandingLoss  = totalAmountInAAP - totalRecovery - totalUnrecovered;

    return {
      totalLoss,
      totalAmountInAAP,
      totalRecovery,
      totalUnrecovered,
      outstandingLoss
    };
  },

  getActionPlanStatus(planningId) {
    const actions = DB.get('audit_actions').filter(a => a.planningId === planningId);
    if (actions.length === 0) return 'New';
    return actions.every(a => a.status === 'Closed') ? 'Completed' : 'In Progress';
  },

  getDaysOverdue(action, todayStr) {
    if (action.status === 'Closed') return 0;
    const today = new Date(todayStr || new Date().toISOString().split('T')[0]);
    const due = new Date(action.dueDate);
    const diffTime = today - due;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  },

  getAgingBucket(action, todayStr) {
    if (action.status === 'Closed') return 'Closed';
    const today = new Date(todayStr || new Date().toISOString().split('T')[0]);
    const due = new Date(action.dueDate);
    const diffTime = today - due;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      if (diffDays >= -7) {
        return 'Due Soon';
      }
      return 'Not Due';
    } else {
      if (diffDays <= 30) return 'Overdue 1-30 days';
      if (diffDays <= 60) return 'Overdue 31-60 days';
      return 'Overdue >60 days';
    }
  },

  getLinkedPlanningForCase(triggerType, caseId) {
    const plannings = DB.get('audit_plannings');
    return plannings.find(p => p.trigger === triggerType && p.triggerRef === caseId) || null;
  },

  async syncPlanningRelationships(planningId, oldTrigger, oldTriggerRef, newTrigger, newTriggerRef) {
    try {
      // Clear old relationship
      if (oldTrigger === 'WBS' && oldTriggerRef) {
        const caseObj = DB.find('wbs_cases', oldTriggerRef);
        if (caseObj && caseObj.linkedPlanningId === planningId) {
          await DB.update('wbs_cases', oldTriggerRef, { linkedPlanningId: null, status: 'New' });
        }
      } else if (oldTrigger === 'FDS' && oldTriggerRef) {
        const caseObj = DB.find('fds_cases', oldTriggerRef);
        if (caseObj && caseObj.linkedPlanningId === planningId) {
          await DB.update('fds_cases', oldTriggerRef, { linkedPlanningId: null, status: 'Planned' });
        }
      }

      // Set new relationship and sync status
      if (newTrigger === 'WBS' && newTriggerRef) {
        const pl = DB.find('audit_plannings', planningId);
        let caseStatus = 'New';
        if (pl) {
          if (pl.status === 'Completed') caseStatus = 'Closed';
          else if (pl.status === 'In Progress') caseStatus = 'In Progress';
        }
        await DB.update('wbs_cases', newTriggerRef, { linkedPlanningId: planningId, status: caseStatus });
      } else if (newTrigger === 'FDS' && newTriggerRef) {
        const pl = DB.find('audit_plannings', planningId);
        let caseStatus = 'Planned';
        if (pl) {
          if (pl.status === 'Completed') caseStatus = 'Closed';
          else if (pl.status === 'In Progress') caseStatus = 'In Progress';
        }
        await DB.update('fds_cases', newTriggerRef, { linkedPlanningId: planningId, status: caseStatus });
      }
    } catch (e) {
      console.warn('[AuditMetrics] syncPlanningRelationships error:', e);
    }
  }
};

window.AuditMetrics = AuditMetrics;
