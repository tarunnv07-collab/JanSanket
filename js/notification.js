/**
 * JANSANKET — Notification UI Manager
 * Handles toast notifications, bell panel, and real-time updates
 */

import { NotifStore, Session } from './store.js';

// ── Toast System ──────────────────────────────────────────────────────────────
let toastContainer = null;

function ensureToastContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    return toastContainer;
}

export function showToast({ title, message, type = 'info', duration = 5000 }) {
    const icons = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' };
    const container = ensureToastContainer();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-msg">${message}</div>` : ''}
    </div>
    <button onclick="this.closest('.toast').remove()" style="background:none;border:none;color:var(--color-text-3);cursor:pointer;margin-left:auto;padding:0 4px;font-size:1rem;">✕</button>
  `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.4s ease forwards';
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

// ── Bell Panel ────────────────────────────────────────────────────────────────
export function initNotifPanel() {
    const bell = document.getElementById('navBell');
    const panel = document.getElementById('notifPanel');
    if (!bell || !panel) return;

    // Toggle panel
    bell.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.toggle('open');
        if (panel.classList.contains('open')) {
            renderNotifPanel();
        }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && e.target !== bell) {
            panel.classList.remove('open');
        }
    });

    // Mark all read button
    const markAll = document.getElementById('markAllRead');
    if (markAll) {
        markAll.addEventListener('click', () => {
            const user = Session.get();
            if (user) {
                NotifStore.markAllRead(user.id);
                renderNotifPanel();
                updateBadge();
            }
        });
    }

    // Initial badge
    updateBadge();

    // Poll every 8 seconds for new notifications
    setInterval(() => {
        updateBadge();
        if (panel.classList.contains('open')) renderNotifPanel();
    }, 8000);
}

export function updateBadge() {
    const badge = document.querySelector('.notif-badge');
    if (!badge) return;
    const user = Session.get();
    if (!user) { badge.classList.remove('show'); return; }
    const count = NotifStore.getUnreadCount(user.id);
    if (count > 0) badge.classList.add('show');
    else badge.classList.remove('show');
}

export function renderNotifPanel() {
    const list = document.getElementById('notifList');
    if (!list) return;
    const user = Session.get();
    if (!user) { list.innerHTML = '<div class="notif-empty">Please log in to see notifications.</div>'; return; }

    const notifs = NotifStore.getForUser(user.id);
    if (!notifs.length) {
        list.innerHTML = '<div class="notif-empty">🔔 No notifications yet</div>';
        return;
    }

    list.innerHTML = notifs.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}" data-id="${n.id}" onclick="handleNotifClick('${n.id}', '${n.link || ''}')">
      <div class="notif-dot ${n.read ? 'read' : ''}"></div>
      <div class="notif-item-text">
        <div class="notif-item-title">${n.title}</div>
        <div class="notif-item-desc">${n.desc}</div>
        <div class="notif-item-time">${timeAgo(n.createdAt)}</div>
      </div>
    </div>
  `).join('');
}

// Make clickable from inline HTML
window.handleNotifClick = function (nid, link) {
    NotifStore.markRead(nid);
    updateBadge();
    renderNotifPanel();
    if (link && link !== 'null') window.location.href = link;
};

// ── Utility ───────────────────────────────────────────────────────────────────
export function timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

export function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export function daysLeft(isoDeadline) {
    if (!isoDeadline) return null;
    const diff = new Date(isoDeadline) - Date.now();
    if (diff <= 0) return 0;
    return Math.ceil(diff / 86400000);
}
