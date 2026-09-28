/**
 * JANSANKET — Data Store
 * LocalStorage-based mock backend
 */

const KEYS = {
  USERS:        'cs_users',
  COMPLAINTS:   'cs_complaints',
  NOTIFICATIONS:'cs_notifications',
  SESSION:      'cs_session',
  ADMIN_PASS:   'cs_admin_pass',
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function read(key)           { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } }
function write(key, val)     { localStorage.setItem(key, JSON.stringify(val)); }
function readObj(key)        { try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; } }
function genId()             { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

// ── Users ─────────────────────────────────────────────────────────────────────
export const UserStore = {
  getAll() { return read(KEYS.USERS); },
  getById(uid) { return this.getAll().find(u => u.id === uid) || null; },
  getByVoterId(vid) { return this.getAll().find(u => u.voterId === vid.toUpperCase()) || null; },
  create(data) {
    const users = this.getAll();
    const cleanVoterId = (data.voterId || '').trim().toUpperCase();
    const existingIdx = users.findIndex(u => u.voterId === cleanVoterId || (data.phone && u.phone === data.phone));
    
    if (existingIdx !== -1) {
      users[existingIdx] = {
        ...users[existingIdx],
        ...data,
        voterId: cleanVoterId || users[existingIdx].voterId,
        password: data.password || users[existingIdx].password,
        updatedAt: new Date().toISOString()
      };
      write(KEYS.USERS, users);
      return users[existingIdx];
    }

    const user = {
      id: genId(),
      voterId: cleanVoterId,
      password: data.password || '',
      name: data.name,
      age: data.age || 25,
      phone: data.phone,
      gender: data.gender || 'male',
      department: data.department || 'Administration',
      role: data.role || 'citizen',
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    write(KEYS.USERS, users);
    return user;
  },
  update(uid, updates) {
    const users = this.getAll().map(u => u.id === uid ? { ...u, ...updates } : u);
    write(KEYS.USERS, users);
    return users.find(u => u.id === uid);
  },
  exists(vid) { return !!this.getByVoterId(vid); },
};

// ── Session ───────────────────────────────────────────────────────────────────
export const Session = {
  get() { return readObj(KEYS.SESSION); },
  set(user) { localStorage.setItem(KEYS.SESSION, JSON.stringify(user)); },
  clear() { localStorage.removeItem(KEYS.SESSION); },
  isLoggedIn() { return !!this.get(); },
  isAdmin() { const u = this.get(); return u && u.role === 'admin'; },
  isAuthority() { const u = this.get(); return u && u.role === 'authority'; },
};

// ── Complaint Store ───────────────────────────────────────────────────────────
/*
  Status Flow:
  submitted → ai_review → admin_review → authority_review → resolved | rejected
  
  RAG Tag: red | amber | green
  
  Tracking Steps (delivery style):
  1. submitted       – Complaint filed
  2. ai_review       – AI Analysis in progress
  3. admin_review    – Forwarded to Admin
  4. authority_review – Forwarded to Authority
  5. resolved        – Issue resolved
  (rejected can happen at any step after submitted)
*/
export const STATUS_STEPS = [
  { key: 'submitted',        label: 'Submitted',         icon: '📋', desc: 'Your complaint has been registered' },
  { key: 'ai_review',        label: 'AI Review',         icon: '🤖', desc: 'AI is analyzing your complaint for validity' },
  { key: 'admin_review',     label: 'Admin Review',      icon: '🏛️', desc: 'Forwarded to the department administrator' },
  { key: 'authority_review', label: 'Authority Review',  icon: '⚖️', desc: 'Assigned to the relevant authority' },
  { key: 'resolved',         label: 'Resolved',          icon: '✅', desc: 'Your complaint has been resolved' },
];

export const ComplaintStore = {
  getAll() { return read(KEYS.COMPLAINTS); },
  getByUser(uid) {
    const all = this.getAll();
    const user = Session.get();
    if (!user) return all.filter(c => c.userId === uid);

    const userVoterId = (user.voterId || '').toUpperCase();

    return all.filter(c => {
      if (c.userId === uid || c.userId === user.id) return true;
      if (c.voterId && userVoterId && c.voterId.toUpperCase() === userVoterId) return true;
      if (c.phone && user.phone && c.phone === user.phone) return true;
      return false;
    });
  },
  getPendingAuthority() { return this.getAll().filter(c => c.status === 'authority_review'); },

  create(data) {
    const all = this.getAll();
    const complaint = {
      id: 'CS' + Date.now().toString().slice(-8),
      userId: data.userId,
      anonymousId: data.anonymousId,
      // Personal details stored encrypted-style (shown only to admin)
      name: data.name,
      department: data.department,
      heading: data.heading,
      description: data.description,
      location: data.location,
      coords: data.coords || null,
      files: data.files || [],
      status: 'submitted',
      ragTag: null,        // red | amber | green
      aiReason: null,
      adminNote: null,
      authorityNote: null,
      timeline: [
        { step: 'submitted', timestamp: new Date().toISOString(), note: 'Complaint registered successfully' }
      ],
      deadline: null,       // set when authority_review starts
      dataShareConsent: null, // null | 'agreed' | 'declined'
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    all.push(complaint);
    write(KEYS.COMPLAINTS, all);
    return complaint;
  },

  update(cid, updates) {
    const all = this.getAll().map(c => {
      if (c.id !== cid) return c;
      return { ...c, ...updates, updatedAt: new Date().toISOString() };
    });
    write(KEYS.COMPLAINTS, all);
    return all.find(c => c.id === cid);
  },

  addTimelineEvent(cid, step, note) {
    const c = this.getById(cid);
    if (!c) return;
    const timeline = [...(c.timeline || []), {
      step, timestamp: new Date().toISOString(), note
    }];
    return this.update(cid, { status: step, timeline });
  },

  isDeadlinePassed(complaint) {
    if (!complaint.deadline) return false;
    return new Date() > new Date(complaint.deadline);
  },

  getWorkingDeadline(fromDate, days = 6) {
    const date = new Date(fromDate);
    let added = 0;
    while (added < days) {
      date.setDate(date.getDate() + 1);
      const dow = date.getDay();
      if (dow !== 0 && dow !== 6) added++; // skip weekends
    }
    return date.toISOString();
  },
};

// ── Notifications Store ───────────────────────────────────────────────────────
export const NotifStore = {
  getAll() { return read(KEYS.NOTIFICATIONS); },
  getForUser(uid) { return this.getAll().filter(n => n.userId === uid).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)); },
  getUnreadCount(uid) { return this.getForUser(uid).filter(n => !n.read).length; },

  push(userId, { title, desc, type = 'info', link = null, complaintId = null }) {
    const all = this.getAll();
    const notif = {
      id: genId(),
      userId, title, desc, type, link, complaintId,
      read: false,
      createdAt: new Date().toISOString(),
    };
    all.push(notif);
    write(KEYS.NOTIFICATIONS, all);
    return notif;
  },

  markRead(nid) {
    const all = this.getAll().map(n => n.id === nid ? { ...n, read: true } : n);
    write(KEYS.NOTIFICATIONS, all);
  },

  markAllRead(uid) {
    const all = this.getAll().map(n => n.userId === uid ? { ...n, read: true } : n);
    write(KEYS.NOTIFICATIONS, all);
  },
};

// ── Seed admin + authority accounts ───────────────────────────────────────────
export function seedDefaults() {
  if (!UserStore.exists('ADMIN0001')) {
    UserStore.create({ voterId: 'ADMIN0001', password: 'admin123', name: 'Admin Officer', age: 40, phone: '9000000001', gender: 'male', department: 'Administration', role: 'admin' });
  }
  if (!UserStore.exists('AUTH0001')) {
    UserStore.create({ voterId: 'AUTH0001', password: 'auth123', name: 'Municipal Authority', age: 45, phone: '9000000002', gender: 'male', department: 'Information Technology', role: 'authority' });
  }
}
