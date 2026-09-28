/**
 * JANSANKET — Audit Logging System
 * Tracks routing events, AI predictions, confidence scores, and admin overrides.
 */

const path = require('path');
const { readDB, writeDB, genId } = require('../db');

function logEvent({ complaintId, action, predictedDepartment, assignedDepartment, confidence, explanation, safetyFlag, performedBy = 'SYSTEM' }) {
    const logs = readDB('audit_logs');
    const entry = {
        id: genId(),
        complaintId,
        action,
        predictedDepartment: predictedDepartment || null,
        assignedDepartment: assignedDepartment || null,
        confidence: confidence !== undefined ? parseFloat(confidence.toFixed(2)) : null,
        explanation: explanation || '',
        safetyFlag: Boolean(safetyFlag),
        performedBy,
        timestamp: new Date().toISOString()
    };
    logs.push(entry);
    writeDB('audit_logs', logs);
    return entry;
}

function getAuditLogs(complaintId = null) {
    const logs = readDB('audit_logs');
    if (complaintId) return logs.filter(l => l.complaintId === complaintId);
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

module.exports = {
    logEvent,
    getAuditLogs,
};
