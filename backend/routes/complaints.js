/**
 * JANSANKET — Backend Complaint Routes
 */

const express = require('express');
const router = express.Router();
const { readDB, writeDB, genId } = require('../db');

const STATUS_FLOW = ['submitted', 'ai_review', 'admin_review', 'authority_review', 'resolved'];

function getWorkingDeadline(fromDate, days = 6) {
    const date = new Date(fromDate);
    let added = 0;
    while (added < days) {
        date.setDate(date.getDate() + 1);
        const dow = date.getDay();
        if (dow !== 0 && dow !== 6) added++;
    }
    return date.toISOString();
}

// Helper: push notification
function pushNotif(userId, { title, desc, type = 'info', link = null, complaintId = null }) {
    const notifs = readDB('notifications');
    notifs.push({ id: genId(), userId, title, desc, type, link, complaintId, read: false, createdAt: new Date().toISOString() });
    writeDB('notifications', notifs);
}

// Middleware: department authorization
function authenticateUser(req, res, next) {
    const userId = req.headers['x-user-id'];
    const userDept = req.headers['x-user-department'];
    const userRole = req.headers['x-user-role'];

    if (userId) {
        const users = readDB('users');
        const user = users.find(u => u.id === userId);
        if (user) {
            req.user = {
                id: user.id,
                voterId: user.voterId,
                phone: user.phone,
                name: user.name,
                role: user.role,
                department: user.department || userDept || 'Administration',
            };
            return next();
        }
    }

    if (userDept || userRole) {
        req.user = {
            id: userId || 'anonymous',
            role: userRole || 'citizen',
            department: userDept || 'Administration',
        };
        return next();
    }

    req.user = null;
    next();
}

router.use(authenticateUser);

function checkDepartmentAuth(req, complaint) {
    const user = req.user;
    if (!user) return false;

    // 1. Administrator Role Check: Super-admin can view all complaints
    if (user.role === 'admin') {
        return true;
    }

    // 2. Complaint Owner Check: Creator of the complaint always has access
    if (user.id && complaint.userId && String(user.id) === String(complaint.userId)) {
        return true;
    }
    if (user.voterId && complaint.voterId && String(user.voterId).toUpperCase() === String(complaint.voterId).toUpperCase()) {
        return true;
    }
    if (user.phone && complaint.phone && String(user.phone) === String(complaint.phone)) {
        return true;
    }

    // Cross-session ownership check via users.json directory
    if (user.phone || user.voterId) {
        const users = readDB('users');
        const complaintOwner = users.find(u => u.id === complaint.userId);
        if (complaintOwner) {
            if (user.phone && complaintOwner.phone === user.phone) return true;
            if (user.voterId && complaintOwner.voterId && complaintOwner.voterId.toUpperCase() === (user.voterId || '').toUpperCase()) return true;
        }
    }

    // 3. Department Matching Check: User belongs to the assigned department
    if (user.department && complaint.department && user.department === complaint.department) {
        return true;
    }

    // Default Deny
    return false;
}

// GET all complaints (with department filtering)
router.get('/', (req, res) => {
    let complaints = readDB('complaints');
    const { status, ragTag, userId, department, search } = req.query;
    const user = req.user;

    // Department isolation & Strict Citizen Complaint Ownership Match
    if (user) {
        if (user.role === 'admin') {
            if (department) complaints = complaints.filter(c => c.department === department);
        } else if (user.role === 'authority') {
            complaints = complaints.filter(c => c.department === user.department || c.userId === user.id);
        } else {
            // Citizen role: Strict match by userId OR voterId OR phone
            const userPhone = user.phone;
            const userVoterId = (user.voterId || '').toUpperCase();

            complaints = complaints.filter(c => {
                if (c.userId === user.id) return true;
                if (c.voterId && userVoterId && c.voterId.toUpperCase() === userVoterId) return true;
                if (c.phone && userPhone && c.phone === userPhone) return true;
                return false;
            });
        }
    } else if (userId) {
        complaints = complaints.filter(c => c.userId === userId);
    } else if (department) {
        complaints = complaints.filter(c => c.department === department);
    }

    if (userId && user && user.role === 'admin') complaints = complaints.filter(c => c.userId === userId);
    if (status) complaints = complaints.filter(c => c.status === status);
    if (ragTag) complaints = complaints.filter(c => c.ragTag === ragTag);

    if (search) {
        const q = search.toLowerCase();
        complaints = complaints.filter(c =>
            (c.heading && c.heading.toLowerCase().includes(q)) ||
            (c.description && c.description.toLowerCase().includes(q)) ||
            (c.department && c.department.toLowerCase().includes(q)) ||
            (c.id && c.id.toLowerCase().includes(q))
        );
    }

    complaints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Lightweight list optimization for high-performance instant dashboard loading
    const lightweight = complaints.map(c => {
        const { files, ...rest } = c;
        return {
            ...rest,
            hasFiles: Array.isArray(files) && files.length > 0,
            fileCount: Array.isArray(files) ? files.length : 0
        };
    });

    res.json(lightweight);
});

// GET single complaint (with authorization check)
router.get('/:id', (req, res) => {
    const c = readDB('complaints').find(c => c.id === req.params.id);
    if (!c) return res.status(404).json({ error: 'Complaint not found' });

    if (!checkDepartmentAuth(req, c)) {
        return res.status(403).json({ error: 'Forbidden: You are not authorized to view complaints from another department' });
    }

    res.json(c);
});

// GET download complaint file (with department authorization)
router.get('/:id/download', (req, res) => {
    const c = readDB('complaints').find(c => c.id === req.params.id);
    if (!c) return res.status(404).json({ error: 'Complaint not found' });

    if (!checkDepartmentAuth(req, c)) {
        return res.status(403).json({ error: 'Forbidden: You are not authorized to download files from another department' });
    }

    res.json({
        id: c.id,
        department: c.department,
        heading: c.heading,
        description: c.description,
        files: c.files || [],
        content: `JANSANKET OFFICIAL RECORD\nID: ${c.id}\nDepartment: ${c.department}\nHeading: ${c.heading}\nDescription: ${c.description}\nStatus: ${c.status}`
    });
});

// POST create complaint
router.post('/', (req, res) => {
    const { userId, anonymousId, name, department, heading, description, location, coords, files } = req.body;
    if (!userId || !department || !heading || !description || !location) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const complaint = {
        id: 'CS' + Date.now().toString().slice(-8),
        userId, anonymousId, name, department, heading, description,
        location, coords: coords || null, files: files || [],
        voterId: req.user ? req.user.voterId : (req.body.voterId || ''),
        phone: req.user ? req.user.phone : (req.body.phone || ''),
        status: 'submitted', ragTag: null, aiReason: null,
        adminNote: null, authorityNote: null, deadline: null,
        dataShareConsent: null, deadline_notified: false,
        timeline: [{ step: 'submitted', timestamp: new Date().toISOString(), note: 'Complaint registered successfully' }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const all = readDB('complaints');
    all.push(complaint);
    writeDB('complaints', all);

    setTimeout(() => runAIAnalysis(complaint.id, userId), 100);

    res.status(201).json(complaint);
});

// DELETE complaint (with department authorization)
router.delete('/:id', (req, res) => {
    const all = readDB('complaints');
    const idx = all.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Complaint not found' });

    if (!checkDepartmentAuth(req, all[idx])) {
        return res.status(403).json({ error: 'Forbidden: You are not authorized to delete complaints from another department' });
    }

    const deleted = all.splice(idx, 1)[0];
    writeDB('complaints', all);
    res.json({ message: 'Complaint deleted successfully', complaint: deleted });
});

// PATCH update complaint status / fields
router.patch('/:id', (req, res) => {
    const all = readDB('complaints');
    const idx = all.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Complaint not found' });

    if (!checkDepartmentAuth(req, all[idx])) {
        return res.status(403).json({ error: 'Forbidden: You cannot modify complaints from another department' });
    }

    all[idx] = { ...all[idx], ...req.body, updatedAt: new Date().toISOString() };
    writeDB('complaints', all);
    res.json(all[idx]);
});

// POST admin accept
router.post('/:id/accept', (req, res) => {
    const all = readDB('complaints');
    const idx = all.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });

    if (!checkDepartmentAuth(req, all[idx])) {
        return res.status(403).json({ error: 'Forbidden: Cannot modify complaints from another department' });
    }

    const note = req.body.adminNote || '';
    const deadline = getWorkingDeadline(new Date().toISOString(), 6);
    all[idx] = {
        ...all[idx],
        adminNote: note, deadline, status: 'authority_review',
        updatedAt: new Date().toISOString(),
        timeline: [...all[idx].timeline, { step: 'authority_review', timestamp: new Date().toISOString(), note: 'Validated by admin. Forwarded to authority.' }],
    };
    writeDB('complaints', all);

    pushNotif(all[idx].userId, {
        title: '⚖️ Forwarded to Authority',
        desc: 'Your complaint was verified by admin and sent to the relevant authority. They have 6 working days to respond.',
        type: 'success', complaintId: all[idx].id,
        link: `/complaint/${all[idx].id}`,
    });

    res.json(all[idx]);
});

// POST admin reject
router.post('/:id/reject', (req, res) => {
    const all = readDB('complaints');
    const idx = all.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });

    if (!checkDepartmentAuth(req, all[idx])) {
        return res.status(403).json({ error: 'Forbidden: Cannot modify complaints from another department' });
    }

    const note = req.body.adminNote || 'Complaint does not meet the required criteria.';
    all[idx] = {
        ...all[idx],
        status: 'rejected', adminNote: note, updatedAt: new Date().toISOString(),
        timeline: [...all[idx].timeline, { step: 'rejected', timestamp: new Date().toISOString(), note: 'Rejected by admin: ' + note }],
    };
    writeDB('complaints', all);

    pushNotif(all[idx].userId, {
        title: '❌ Complaint Rejected',
        desc: `Admin rejected your complaint. Reason: ${note}`,
        type: 'error', complaintId: all[idx].id,
        link: `/complaint/${all[idx].id}`,
    });

    res.json(all[idx]);
});

// POST authority resolve
router.post('/:id/resolve', (req, res) => {
    const all = readDB('complaints');
    const idx = all.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });

    if (!checkDepartmentAuth(req, all[idx])) {
        return res.status(403).json({ error: 'Forbidden: Cannot modify complaints from another department' });
    }

    const note = req.body.authorityNote || 'Issue has been addressed and resolved.';
    all[idx] = {
        ...all[idx],
        status: 'resolved', authorityNote: note, updatedAt: new Date().toISOString(),
        timeline: [...all[idx].timeline, { step: 'resolved', timestamp: new Date().toISOString(), note: 'Resolved by authority: ' + note }],
    };
    writeDB('complaints', all);

    pushNotif(all[idx].userId, {
        title: '✅ Complaint Resolved!',
        desc: `Great news! The authority has resolved your complaint. Action taken: ${note}`,
        type: 'success', complaintId: all[idx].id,
        link: `/complaint/${all[idx].id}`,
    });

    res.json(all[idx]);
});

// POST data-share consent
router.post('/:id/consent', (req, res) => {
    const all = readDB('complaints');
    const idx = all.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });

    const { decision } = req.body; // 'agreed' | 'declined'
    all[idx] = {
        ...all[idx], dataShareConsent: decision, updatedAt: new Date().toISOString(),
        timeline: [...all[idx].timeline, { step: 'authority_review', timestamp: new Date().toISOString(), note: decision === 'agreed' ? 'Citizen agreed to share identity for legal action.' : 'Citizen chose to remain anonymous. Escalated to higher authority.' }],
    };
    writeDB('complaints', all);
    res.json(all[idx]);
});

const { DEPARTMENTS } = require('../config/departmentRegistry');
const { processAndRouteComplaint } = require('../services/aiRouter');
const { verifyComplaintWithAI } = require('../services/aiVerificationService');
const { getAuditLogs, logEvent } = require('../services/auditLogger');

// GET registry of departments
router.get('/departments/registry', (req, res) => {
    res.json(DEPARTMENTS);
});

// GET audit logs for complaint
router.get('/:id/audit-logs', (req, res) => {
    const c = readDB('complaints').find(c => c.id === req.params.id);
    if (!c) return res.status(404).json({ error: 'Not found' });
    if (!checkDepartmentAuth(req, c)) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(getAuditLogs(req.params.id));
});

// POST provide user clarification
router.post('/:id/clarify', async (req, res) => {
    const all = readDB('complaints');
    const idx = all.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });

    const { clarificationText } = req.body;
    if (!clarificationText || clarificationText.trim().length < 5) {
        return res.status(400).json({ error: 'Please provide detailed clarification.' });
    }

    all[idx].description += `\n[User Clarification]: ${clarificationText.trim()}`;
    all[idx].updatedAt = new Date().toISOString();
    all[idx].timeline.push({
        step: 'user_clarification',
        timestamp: new Date().toISOString(),
        note: `User provided additional information: "${clarificationText.trim()}"`
    });
    writeDB('complaints', all);

    logEvent({
        complaintId: req.params.id,
        action: 'USER_CLARIFICATION',
        predictedDepartment: all[idx].department,
        assignedDepartment: all[idx].department,
        confidence: all[idx].departmentConfidence || 0.5,
        explanation: `User provided clarification: ${clarificationText.trim()}`,
        performedBy: req.user?.id || 'USER'
    });

    await runAIAnalysis(req.params.id, all[idx].userId);
    const updated = readDB('complaints').find(c => c.id === req.params.id);
    res.json(updated);
});

// POST admin reassign department
router.post('/:id/reassign', (req, res) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Only administrators can reassign department routing.' });
    }
    const all = readDB('complaints');
    const idx = all.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });

    const { newDepartment, reason } = req.body;
    if (!newDepartment || !DEPARTMENTS[newDepartment]) {
        return res.status(400).json({ error: 'Invalid department specified.' });
    }

    const oldDept = all[idx].department;
    all[idx].department = newDepartment;
    all[idx].status = 'AI_ROUTED';
    all[idx].adminNote = reason || `Reassigned from ${oldDept} to ${newDepartment} by admin.`;
    all[idx].updatedAt = new Date().toISOString();
    all[idx].timeline.push({
        step: 'admin_reassign',
        timestamp: new Date().toISOString(),
        note: `Department reassigned from ${oldDept} to ${newDepartment} by Admin. Reason: ${reason || 'Manual override'}`
    });
    writeDB('complaints', all);

    logEvent({
        complaintId: req.params.id,
        action: 'ADMIN_OVERRIDE',
        predictedDepartment: oldDept,
        assignedDepartment: newDepartment,
        confidence: 1.0,
        explanation: `Manual admin override from ${oldDept} to ${newDepartment}. Reason: ${reason || 'Manual review'}`,
        performedBy: req.user?.id || 'ADMIN'
    });

    res.json(all[idx]);
});

// ── AI Analysis Engine ───────────────────────────────────────────────────────

async function runAIAnalysis(complaintId, userId) {
    const all = readDB('complaints');
    const idx = all.findIndex(c => c.id === complaintId);
    if (idx === -1) return;

    all[idx].status = 'ANALYZING';
    all[idx].timeline.push({ step: 'ANALYZING', timestamp: new Date().toISOString(), note: 'AI analyzing complaint and determining department routing…' });
    writeDB('complaints', all);

    const fresh = readDB('complaints');
    const ci = fresh.findIndex(c => c.id === complaintId);
    if (ci === -1) return;

    const c = fresh[ci];
    const routeRes = await processAndRouteComplaint(c);

    // Query Multimodal Complaint Verification Engine (Python Microservice)
    let verificationRes = await verifyComplaintWithAI(c);

    fresh[ci] = {
        ...fresh[ci],
        status: routeRes.status,
        department: routeRes.department || fresh[ci].department,
        predictedDepartment: routeRes.analysis?.predictedDepartment || null,
        departmentConfidence: routeRes.analysis?.departmentConfidence || 0,
        categoryConfidence: routeRes.analysis?.categoryConfidence || 0,
        urgency: routeRes.urgency || routeRes.analysis?.urgency || 'MEDIUM',
        priority: routeRes.priority || routeRes.analysis?.priority || 'MEDIUM',
        safetyFlag: routeRes.analysis?.safetyFlag || false,
        aiExplanation: routeRes.analysis?.explanation || 'Assigned to ' + (routeRes.department || fresh[ci].department),
        ragTag: routeRes.analysis?.safetyFlag ? 'red' : ((routeRes.analysis?.departmentConfidence || 0) >= 0.85 ? 'green' : 'amber'),
        analysisData: routeRes.analysis || null,
        verificationReport: verificationRes.success ? verificationRes.verification : verificationRes.fallback,
        updatedAt: new Date().toISOString(),
        timeline: [
            ...fresh[ci].timeline,
            {
                step: routeRes.status,
                timestamp: new Date().toISOString(),
                note: `AI processed complaint: Verification assessment is ${verificationRes.verification?.decision || 'INCONCLUSIVE'}`
            }
        ]
    };
    writeDB('complaints', fresh);

    // Push Department Notification
    pushNotif(userId, {
        title: `📦 Complaint Routed: ${fresh[ci].department}`,
        desc: `AI routed your complaint to ${fresh[ci].department} (Verification: ${fresh[ci].verificationReport?.decision || 'INCONCLUSIVE'}). ${fresh[ci].aiExplanation}`,
        type: fresh[ci].safetyFlag ? 'error' : 'info',
        complaintId,
        link: `/complaint/${complaintId}`
    });
}

module.exports = router;
