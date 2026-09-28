/**
 * JANSANKET — Authority Dashboard Module
 */

import { ComplaintStore, NotifStore } from './store.js';
import { showToast, formatDate, daysLeft, timeAgo } from './notification.js';
import { requireLogin } from './auth.js';

export function initAuthority() {
    if (!requireLogin('authority')) return;
    loadAuthorityComplaints();
    checkDeadlines();
    setInterval(() => { loadAuthorityComplaints(); checkDeadlines(); }, 15000);
}

function loadAuthorityComplaints() {
    const list = document.getElementById('authorityList');
    if (!list) return;

    const complaints = ComplaintStore.getAll()
        .filter(c => ['authority_review', 'resolved', 'rejected'].includes(c.status))
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    if (!complaints.length) {
        list.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--color-text-3);">No complaints assigned yet</div>`;
        return;
    }

    list.innerHTML = complaints.map(c => {
        const left = daysLeft(c.deadline);
        const overdue = left === 0;
        const urgency = left !== null && left <= 2;
        return `
    <div class="card" style="margin-bottom:16px;${overdue ? 'border-color:var(--color-red);' : urgency ? 'border-color:var(--color-amber);' : ''}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
        <div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
            <span style="font-family:monospace;font-size:0.8rem;color:var(--color-text-3);">${c.id}</span>
            ${statusBadge(c.status)}
            ${overdue ? '<span class="badge badge-red">⚠️ OVERDUE</span>' : urgency ? '<span class="badge badge-amber">⏳ Urgent</span>' : ''}
          </div>
          <h4 style="margin-bottom:4px;">${c.heading}</h4>
          <div style="font-size:0.84rem;color:var(--color-text-2);">${c.department} · 📍 ${c.location || 'N/A'}</div>
        </div>
        <div style="text-align:right;">
          ${c.deadline ? `
            <div style="font-size:0.78rem;color:var(--color-text-3);">Deadline</div>
            <div style="font-size:0.88rem;font-weight:600;color:${overdue ? 'var(--color-red)' : urgency ? 'var(--color-amber)' : 'var(--color-text)'};">
              ${left === 0 ? '⚠️ Overdue' : `${left} day${left === 1 ? '' : 's'} left`}
            </div>
            <div style="font-size:0.72rem;color:var(--color-text-3);">${formatDate(c.deadline)}</div>
          ` : ''}
        </div>
      </div>

      <div style="margin:14px 0;font-size:0.85rem;color:var(--color-text-2);line-height:1.7;border-top:1px solid var(--color-border);padding-top:14px;">
        ${c.description.length > 200 ? c.description.slice(0, 200) + '…' : c.description}
      </div>

      ${c.adminNote ? `<div style="background:var(--color-bg-2);border-radius:var(--radius-sm);padding:10px 14px;font-size:0.82rem;color:var(--color-text-2);margin-bottom:14px;border-left:3px solid var(--color-accent);">
        <strong>Admin Note:</strong> ${c.adminNote}
      </div>` : ''}

      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        ${c.status === 'authority_review' ? `
          <button class="btn btn-sm btn-success" onclick="resolveComplaint('${c.id}')">✅ Mark Resolved</button>
          <button class="btn btn-sm btn-ghost" onclick="openResponseModal('${c.id}')">💬 Add Response</button>
          ${overdue ? `<button class="btn btn-sm btn-ghost" onclick="triggerEscalation('${c.id}')">📤 Escalate</button>` : ''}
        ` : ''}
        ${c.status === 'resolved' ? `<span style="color:var(--color-green);font-size:0.85rem;font-weight:600;">✅ Resolved ${timeAgo(c.updatedAt)}</span>` : ''}
        ${c.authorityNote ? `<div style="width:100%;font-size:0.8rem;color:var(--color-text-3);">Your response: "${c.authorityNote}"</div>` : ''}
      </div>
    </div>
  `}).join('');
}

// ── Deadline Checker ──────────────────────────────────────────────────────────
function checkDeadlines() {
    const overdues = ComplaintStore.getAll().filter(c =>
        c.status === 'authority_review' && ComplaintStore.isDeadlinePassed(c) && !c.deadline_notified
    );

    overdues.forEach(c => {
        // Notify citizen about overdue
        NotifStore.push(c.userId, {
            title: '⚠️ Authority Has Not Responded',
            desc: 'The authority has not acted on your complaint within 6 working days. You can now choose to share your identity or stay anonymous.',
            type: 'warning',
            complaintId: c.id,
            link: `complaint-status.html?id=${c.id}`,
        });
        ComplaintStore.update(c.id, { deadline_notified: true });
    });
}

window.resolveComplaint = (cid) => {
    const c = ComplaintStore.getById(cid);
    if (!c) return;
    const note = prompt('Describe the resolution action taken:') || 'Issue has been addressed and resolved.';
    ComplaintStore.update(cid, { authorityNote: note });
    ComplaintStore.addTimelineEvent(cid, 'resolved', 'Resolved by authority: ' + note);

    NotifStore.push(c.userId, {
        title: '✅ Complaint Resolved!',
        desc: `Great news! The authority has resolved your complaint. Action: ${note}`,
        type: 'success',
        complaintId: cid,
        link: `complaint-status.html?id=${cid}`,
    });

    showToast({ title: 'Marked as Resolved', type: 'success' });
    loadAuthorityComplaints();
};

window.openResponseModal = (cid) => {
    const note = prompt('Enter your response/action update for the citizen:');
    if (!note) return;
    const c = ComplaintStore.getById(cid);
    ComplaintStore.update(cid, { authorityNote: note });
    NotifStore.push(c.userId, {
        title: '💬 Authority Update',
        desc: `The authority has responded to your complaint: "${note}"`,
        type: 'info',
        complaintId: cid,
        link: `complaint-status.html?id=${cid}`,
    });
    showToast({ title: 'Response added', type: 'success' });
    loadAuthorityComplaints();
};

window.triggerEscalation = (cid) => {
    const c = ComplaintStore.getById(cid);
    if (!c) return;
    ComplaintStore.addTimelineEvent(cid, 'authority_review', 'Complaint escalated to higher authority due to deadline breach.');
    NotifStore.push(c.userId, {
        title: '📤 Complaint Escalated',
        desc: 'Your complaint has been escalated to a higher authority for urgent action.',
        type: 'warning',
        complaintId: cid,
        link: `complaint-status.html?id=${cid}`,
    });
    showToast({ title: 'Escalated to higher authority', type: 'info' });
    loadAuthorityComplaints();
};

function statusBadge(status) {
    const map = {
        authority_review: ['badge-blue', '⚖️ In Review'],
        resolved: ['badge-green', '✅ Resolved'],
        rejected: ['badge-red', '❌ Rejected'],
    };
    const [cls, label] = map[status] || ['badge-gray', status];
    return `<span class="badge ${cls}">${label}</span>`;
}
