/**
 * JANSANKET — Lawsuit / Legal Escalation Module
 */

import { ComplaintStore, Session, NotifStore } from './store.js';
import { showToast, formatDate } from './notification.js';

export function initLawsuit() {
    const params = new URLSearchParams(window.location.search);
    const cid = params.get('id');
    if (!cid) return;

    const complaint = ComplaintStore.getById(cid);
    const user = Session.get();
    if (!complaint || !user) return;

    renderLawsuitPage(complaint, user);

    document.getElementById('agreeBtn')?.addEventListener('click', () => handleAgree(complaint, user));
    document.getElementById('declineBtn')?.addEventListener('click', () => handleDecline(complaint, user));
}

function renderLawsuitPage(c, user) {
    const el = document.getElementById('lawsuitInfo');
    if (!el) return;
    el.innerHTML = `
    <div class="card" style="border-color:var(--color-amber);">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <span style="font-size:2rem;">⚖️</span>
        <div>
          <h3>Authority Did Not Respond</h3>
          <p>Complaint <strong>${c.id}</strong> exceeded the 6-working-day deadline with no authority action.</p>
        </div>
      </div>
      <div class="divider"></div>
      <div style="margin-bottom:16px;">
        <div style="font-size:0.82rem;font-weight:700;color:var(--color-text-3);text-transform:uppercase;margin-bottom:8px;">Your Options</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <div class="card" style="flex:1;min-width:220px;border-color:var(--color-green-pale);">
            <div style="font-size:1.5rem;margin-bottom:8px;">🛡️</div>
            <h4>Stay Anonymous</h4>
            <p style="font-size:0.82rem;margin-top:4px;">Keep your identity hidden. We will still escalate the complaint to higher authorities.</p>
          </div>
          <div class="card" style="flex:1;min-width:220px;border-color:var(--color-accent-pale);">
            <div style="font-size:1.5rem;margin-bottom:8px;">📋</div>
            <h4>Share & File Lawsuit</h4>
            <p style="font-size:0.82rem;margin-top:4px;">Share your identity to file a formal lawsuit. We will connect you with legal assistance.</p>
          </div>
        </div>
      </div>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <button id="agreeBtn" class="btn btn-primary btn-lg">📋 Agree to Share & File Lawsuit</button>
        <button id="declineBtn" class="btn btn-ghost btn-lg">🛡️ Stay Anonymous</button>
      </div>
    </div>
  `;
}

async function handleAgree(complaint, user) {
    // Update consent
    ComplaintStore.update(complaint.id, { dataShareConsent: 'agreed' });
    ComplaintStore.addTimelineEvent(complaint.id, 'authority_review', 'Citizen agreed to share identity for legal action.');

    NotifStore.push(user.id, {
        title: '📋 Lawsuit Process Started',
        desc: 'Your identity has been shared with legal authorities. Check your email for further instructions.',
        type: 'info',
        complaintId: complaint.id,
        link: `complaint-status.html?id=${complaint.id}`,
    });

    // Show lawsuit guide
    document.getElementById('agreeBtn').disabled = true;
    document.getElementById('declineBtn').disabled = true;
    renderLawsuitGuide(complaint, user);
    showToast({ title: 'Lawsuit process initiated', message: 'Follow the steps below to file your case.', type: 'success' });
}

function handleDecline(complaint, user) {
    ComplaintStore.update(complaint.id, { dataShareConsent: 'declined' });
    ComplaintStore.addTimelineEvent(complaint.id, 'authority_review', 'Citizen chose to remain anonymous. Complaint escalated to senior authority.');

    NotifStore.push(user.id, {
        title: '🛡️ Staying Anonymous',
        desc: 'Your complaint has been escalated to a senior authority while keeping your identity hidden.',
        type: 'info',
        complaintId: complaint.id,
        link: `complaint-status.html?id=${complaint.id}`,
    });

    showToast({ title: 'You remain anonymous', message: 'Complaint escalated to senior authority.', type: 'info' });
    setTimeout(() => window.location.href = `complaint-status.html?id=${complaint.id}`, 2000);
}

function renderLawsuitGuide(complaint, user) {
    const guide = document.getElementById('lawsuitGuide');
    if (!guide) return;

    const emailSubject = encodeURIComponent(`Civic Complaint - No Action Taken | ID: ${complaint.id}`);
    const emailBody = encodeURIComponent(
        `Dear Authority,\n\nThis is to inform you that complaint ID ${complaint.id} filed on ${new Date(complaint.createdAt).toLocaleDateString('en-IN')} regarding "${complaint.heading}" in department "${complaint.department}" has not been resolved within the mandated 6 working days.\n\nThis constitutes a violation of citizens' rights under the Right to Public Services Act.\n\nPlease take immediate action, failing which legal proceedings will be initiated.\n\nComplainant: ${user.name}\nVoter ID: ${user.voterId}\nContact: ${user.phone}\n\nFiled with JanSanket — ID: ${complaint.id}`
    );

    guide.classList.remove('hidden');
    guide.innerHTML = `
    <div class="card" style="margin-top:28px;">
      <h3 style="margin-bottom:20px;">⚖️ Step-by-Step Lawsuit Guide</h3>
      <div class="timeline">
        ${lawsuitStep(1, 'done', '📧', 'Send Official Email', `Send a notice email to the authority. <a href="mailto:authority@govt.in?subject=${emailSubject}&body=${emailBody}" class="btn btn-sm btn-primary" style="margin-top:8px;display:inline-flex;">📧 Open Email Draft</a>`)}
        ${lawsuitStep(2, 'active', '📝', 'File RTI Application', 'File a Right to Information application to get official records of inaction.', `<a href="https://rtionline.gov.in/" target="_blank" class="btn btn-sm btn-ghost" style="margin-top:8px;display:inline-flex;">→ RTI Online Portal</a>`)}
        ${lawsuitStep(3, 'pending', '🏛️', 'Consumer Forum Complaint', 'File a complaint at the District Consumer Forum for public service failure.', `<a href="https://consumerhelpline.gov.in/" target="_blank" class="btn btn-sm btn-ghost" style="margin-top:8px;display:inline-flex;">→ Consumer Forum</a>`)}
        ${lawsuitStep(4, 'pending', '⚖️', 'High Court / PIL', 'If unresolved, file a Public Interest Litigation (PIL) or writ petition in High Court.', `<a href="https://ecourts.gov.in/" target="_blank" class="btn btn-sm btn-ghost" style="margin-top:8px;display:inline-flex;">→ eCourts Portal</a>`)}
        ${lawsuitStep(5, 'pending', '🤝', 'Legal Aid', 'Get free legal assistance from your State Legal Services Authority.', `<a href="https://nalsa.gov.in/" target="_blank" class="btn btn-sm btn-ghost" style="margin-top:8px;display:inline-flex;">→ NALSA (Free Legal Aid)</a>`)}
      </div>
      <div style="margin-top:24px;padding:16px;background:var(--color-bg-2);border-radius:var(--radius-md);font-size:0.84rem;color:var(--color-text-2);">
        <strong style="color:var(--color-text);">Your Case Reference:</strong> ${complaint.id} · 
        <strong>Department:</strong> ${complaint.department} · 
        <strong>Filed:</strong> ${formatDate(complaint.createdAt)}
      </div>
    </div>
  `;
}

function lawsuitStep(num, state, icon, title, content, extra = '') {
    return `
    <div class="timeline-item">
      <div class="timeline-dot ${state}">${state === 'done' ? '✓' : num}</div>
      <div class="timeline-content">
        <div class="timeline-title">${icon} Step ${num}: ${title}</div>
        <div class="timeline-desc" style="margin-top:6px;">${content}</div>
        ${extra}
      </div>
    </div>
  `;
}
