/**
 * JANSANKET — Admin Dashboard Module
 */

import { ComplaintStore, NotifStore, UserStore } from './store.js';
import { showToast, formatDate, timeAgo } from './notification.js';
import { requireLogin } from './auth.js';
import { generateOrderDocument } from './ai-analysis.js';

export function initAdmin() {
  if (!requireLogin('admin')) return;
  loadStats();
  loadComplaints('all');
  // expose for filter buttons in admin.html
  window.__filterComplaints = (f) => loadComplaints(f);
  setInterval(() => { loadStats(); loadComplaints(window.__currentFilter || 'all'); }, 15000);
}

function loadStats() {
  const all = ComplaintStore.getAll();
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('statTotal', all.length);
  set('statPending', all.filter(c => c.status === 'admin_review').length);
  set('statResolved', all.filter(c => c.status === 'resolved').length);
  set('statRejected', all.filter(c => c.status === 'rejected').length);
}

function loadComplaints(filter = 'all') {
  const list = document.getElementById('complaintsList');
  if (!list) return;
  let complaints = ComplaintStore.getAll().filter(c => ['submitted', 'ai_review', 'admin_review', 'authority_review', 'resolved', 'rejected'].includes(c.status));
  // Apply filter
  if (filter !== 'all') {
    if (['green', 'amber', 'red'].includes(filter)) {
      complaints = complaints.filter(c => c.ragTag === filter);
    } else {
      complaints = complaints.filter(c => c.status === filter);
    }
  }
  const sorted = [...complaints].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (!sorted.length) {
    list.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--color-text-3);">No complaints found</td></tr>`;
    return;
  }

  list.innerHTML = sorted.map(c => `
    <tr>
      <td><span style="font-family:monospace;font-size:0.82rem;">${c.id}</span></td>
      <td>
        <div style="font-weight:600;font-size:0.88rem;">${c.heading}</div>
        <div style="font-size:0.75rem;color:var(--color-text-3);">${c.department}</div>
      </td>
      <td><span style="font-size:0.82rem;color:var(--color-text-2);">${c.anonymousId}</span></td>
      <td>${ragBadge(c.ragTag)}</td>
      <td>${statusBadge(c.status)}</td>
      <td style="font-size:0.8rem;color:var(--color-text-3);">${timeAgo(c.createdAt)}</td>
      <td>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn btn-sm btn-ghost" onclick="viewComplaint('${c.id}')">👁 View</button>
          ${c.status === 'admin_review' ? `
            <button class="btn btn-sm btn-success" onclick="acceptComplaint('${c.id}')">✓ Accept</button>
            <button class="btn btn-sm btn-danger" onclick="rejectComplaint('${c.id}')">✗ Reject</button>
          ` : ''}
          ${['admin_review', 'authority_review'].includes(c.status) && c.ragTag === 'green' ? `
            <button class="btn btn-sm btn-ghost" onclick="downloadOrder('${c.id}')">📄 Order</button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

window.viewComplaint = (cid) => {
  const c = ComplaintStore.getById(cid);
  if (!c) return;
  const modal = document.getElementById('complaintModal');
  const body = document.getElementById('modalBody');
  if (!modal || !body) return;
  body.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:18px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        ${field('Complaint ID', c.id)}
        ${field('Status', statusBadge(c.status))}
        ${field('Department', c.department)}
        ${field('Filed By', c.anonymousId)}
        ${field('Location', c.location || '—')}
        ${field('Filed On', formatDate(c.createdAt))}
        ${field('AI Tag', ragBadge(c.ragTag))}
        ${field('AI Reason', `<span style="font-size:0.82rem;color:var(--color-text-2);">${c.aiReason || 'Pending'}</span>`)}
      </div>
      <div>
        <div style="font-size:0.78rem;font-weight:700;color:var(--color-text-3);text-transform:uppercase;margin-bottom:6px;">Heading</div>
        <div style="font-weight:600;">${c.heading}</div>
      </div>
      <div>
        <div style="font-size:0.78rem;font-weight:700;color:var(--color-text-3);text-transform:uppercase;margin-bottom:6px;">Description</div>
        <div style="font-size:0.88rem;color:var(--color-text-2);line-height:1.7;">${c.description}</div>
      </div>
      ${c.files?.length ? `<div><div style="font-size:0.78rem;font-weight:700;color:var(--color-text-3);text-transform:uppercase;margin-bottom:6px;">Attachments</div><div style="font-size:0.84rem;color:var(--color-accent);">${c.files.join(', ')}</div></div>` : ''}
      ${c.status === 'admin_review' ? `
        <div>
          <label style="font-size:0.82rem;font-weight:600;color:var(--color-text-2);display:block;margin-bottom:6px;">Admin Note (optional)</label>
          <textarea id="adminNote" class="form-textarea" placeholder="Add a note for the authority…" rows="3"></textarea>
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn btn-success" onclick="acceptComplaint('${c.id}',true)" style="flex:1;">✓ Accept & Forward</button>
          <button class="btn btn-danger"  onclick="rejectComplaint('${c.id}',true)" style="flex:1;">✗ Reject Complaint</button>
        </div>
      ` : ''}
    </div>
  `;
  modal.classList.add('open');
};

window.closeModal = () => {
  const modal = document.getElementById('complaintModal');
  if (modal) modal.classList.remove('open');
};

window.acceptComplaint = (cid, fromModal = false) => {
  const c = ComplaintStore.getById(cid);
  if (!c) return;
  const note = fromModal ? (document.getElementById('adminNote')?.value || '') : '';
  const deadline = ComplaintStore.getWorkingDeadline(new Date().toISOString(), 6);

  ComplaintStore.update(cid, { adminNote: note, deadline });
  ComplaintStore.addTimelineEvent(cid, 'authority_review', 'Complaint validated by admin. Forwarded to the relevant authority for resolution.');

  // Notify citizen
  NotifStore.push(c.userId, {
    title: '⚖️ Forwarded to Authority',
    desc: 'Your complaint has been verified by admin and forwarded to the relevant authority. They have 6 working days to respond.',
    type: 'success',
    complaintId: cid,
    link: `complaint-status.html?id=${cid}`,
  });

  showToast({ title: 'Complaint Accepted', message: 'Forwarded to authority. 6-day deadline set.', type: 'success' });
  if (fromModal) closeModal();
  loadStats(); loadComplaints();
};

window.rejectComplaint = (cid, fromModal = false) => {
  const c = ComplaintStore.getById(cid);
  if (!c) return;
  const note = fromModal ? (document.getElementById('adminNote')?.value || 'Complaint does not meet the required criteria.') : 'Complaint does not meet the required criteria.';

  ComplaintStore.update(cid, { adminNote: note });
  ComplaintStore.addTimelineEvent(cid, 'rejected', 'Rejected by admin: ' + note);

  NotifStore.push(c.userId, {
    title: '❌ Complaint Rejected',
    desc: `Admin reviewed your complaint and rejected it. Reason: ${note}`,
    type: 'error',
    complaintId: cid,
    link: `complaint-status.html?id=${cid}`,
  });

  showToast({ title: 'Complaint Rejected', type: 'warning' });
  if (fromModal) closeModal();
  loadStats(); loadComplaints();
};

window.downloadOrder = (cid) => {
  const c = ComplaintStore.getById(cid);
  if (c) generateOrderDocument(c);
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function ragBadge(tag) {
  if (!tag) return '<span class="badge badge-gray">—</span>';
  const map = { red: 'badge-red', amber: 'badge-amber', green: 'badge-green' };
  const icons = { red: '🔴', amber: '🟡', green: '🟢' };
  return `<span class="badge ${map[tag]}">${icons[tag]} ${tag.toUpperCase()}</span>`;
}

function statusBadge(status) {
  const map = {
    submitted: 'badge-blue', ai_review: 'badge-amber', admin_review: 'badge-amber',
    authority_review: 'badge-blue', resolved: 'badge-green', rejected: 'badge-red',
  };
  const labels = {
    submitted: '📋 Submitted', ai_review: '🤖 AI Review', admin_review: '🏛️ Admin Review',
    authority_review: '⚖️ Authority', resolved: '✅ Resolved', rejected: '❌ Rejected',
  };
  return `<span class="badge ${map[status] || 'badge-gray'}">${labels[status] || status}</span>`;
}

function field(label, value) {
  return `<div><div style="font-size:0.75rem;font-weight:700;color:var(--color-text-3);text-transform:uppercase;margin-bottom:4px;">${label}</div><div style="font-size:0.88rem;">${value}</div></div>`;
}
