import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getComplaints, getNotifications, markAllRead as apiMarkAllRead } from '../api/client';
import Navbar from '../components/Navbar';

const STATUS_STEPS = [
    { key: 'submitted', label: 'Filed', icon: '📋' },
    { key: 'ai_review', label: 'AI Check', icon: '🤖' },
    { key: 'admin_review', label: 'Admin', icon: '🏛️' },
    { key: 'authority_review', label: 'Authority', icon: '⚖️' },
    { key: 'resolved', label: 'Resolved', icon: '✅' },
];

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr);
    const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    return m < 1 ? 'just now' : `${m}m ago`;
}

function statusBadge(status) {
    const map = { submitted: 'badge-blue', ai_review: 'badge-amber', admin_review: 'badge-amber', authority_review: 'badge-blue', resolved: 'badge-green', rejected: 'badge-red' };
    const labels = { submitted: '📋 Filed', ai_review: '🤖 AI Review', admin_review: '🏛️ Admin', authority_review: '⚖️ Authority', resolved: '✅ Resolved', rejected: '❌ Rejected' };
    return <span className={`badge ${map[status] || 'badge-gray'}`}>{labels[status] || status}</span>;
}

export default function Dashboard() {
    const { user, logout, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [notifs, setNotifs] = useState([]);
    const [notifOpen, setNotifOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [profileForm, setProfileForm] = useState({ name: user?.name || '', age: user?.age || '', phone: user?.phone || '', gender: user?.gender || '' });
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!user) return;
        try {
            const [cs, ns] = await Promise.all([
                getComplaints({ userId: user.id }),
                getNotifications(user.id),
            ]);
            setComplaints(cs);
            setNotifs(ns);
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [user]);

    useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, [load]);

    const unread = notifs.filter(n => !n.read).length;

    async function markAll() {
        await apiMarkAllRead(user.id);
        setNotifs(ns => ns.map(n => ({ ...n, read: true })));
    }

    async function saveProfile(e) {
        e.preventDefault();
        await updateProfile(profileForm);
        setProfileOpen(false);
    }

    const stats = {
        total: complaints.length,
        active: complaints.filter(c => ['submitted', 'ai_review', 'admin_review', 'authority_review'].includes(c.status)).length,
        resolved: complaints.filter(c => c.status === 'resolved').length,
        rejected: complaints.filter(c => c.status === 'rejected').length,
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh', paddingTop: 64 }}>
            <Navbar user={user} onBell={() => setNotifOpen(o => !o)} unread={unread} onLogout={logout} />

            {/* Notification Panel */}
            <div className={`notif-panel ${notifOpen ? 'open' : ''}`}>
                <div className="notif-panel-header">
                    <h4>Notifications</h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-accent)', cursor: 'pointer' }} onClick={markAll}>Mark all read</span>
                </div>
                {notifs.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-3)', fontSize: '0.85rem' }}>No notifications yet</div>
                ) : notifs.map(n => (
                    <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`} onClick={() => n.link && navigate(n.link)}>
                        <div className="notif-item-title">{n.title}</div>
                        <div className="notif-item-desc">{n.desc}</div>
                        <div className="notif-item-time">{timeAgo(n.createdAt)}</div>
                    </div>
                ))}
            </div>

            {/* Sidebar */}
            <aside style={{ background: 'var(--color-bg-2)', borderRight: '1px solid var(--color-border)', padding: '24px 14px', position: 'sticky', top: 64, height: 'calc(100vh - 64px)', overflowY: 'auto' }}>
                <div style={{ padding: '0 12px', marginBottom: 20 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{user?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', marginTop: 2, fontFamily: 'monospace' }}>{user?.voterId}</div>
                    <div style={{ marginTop: 8 }}>
                        <span style={{ fontSize: '0.72rem', background: 'var(--color-accent-pale)', color: 'var(--color-accent)', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>
                            🛡️ {user?.anonymousId || `unknown${user?.voterId?.slice(-4)}`}
                        </span>
                    </div>
                </div>
                <div style={{ height: 1, background: 'var(--color-border)', margin: '12px 0' }} />
                <Link to="/submit" className="btn btn-primary btn-full btn-sm" style={{ marginBottom: 12 }}>+ File New Complaint</Link>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', padding: '0 12px', marginBottom: 8, letterSpacing: '0.08em' }}>Navigation</div>
                {[['📊', 'My Complaints', '/dashboard'], ['📝', 'Submit Complaint', '/submit']].map(([icon, label, path]) => (
                    <div key={label} onClick={() => navigate(path)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-2)', fontSize: '0.86rem', fontWeight: 500, cursor: 'pointer', transition: 'all var(--transition)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.color = 'var(--color-text)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--color-text-2)'; }}>
                        {icon} {label}
                    </div>
                ))}
                <div style={{ height: 1, background: 'var(--color-border)', margin: '12px 0' }} />
                <div onClick={() => setProfileOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-2)', fontSize: '0.86rem', cursor: 'pointer' }}>👤 Edit Profile</div>
                <div onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-3)', fontSize: '0.86rem', cursor: 'pointer' }}>↩ Log Out</div>
            </aside>

            {/* Main */}
            <main style={{ padding: 28, overflowY: 'auto' }}>
                <div style={{ marginBottom: 24 }}>
                    <div className="section-tag">👋 Welcome Back</div>
                    <h2>{user?.name}</h2>
                    <p style={{ marginTop: 4, fontSize: '0.88rem' }}>Here's a summary of all your complaints</p>
                </div>

                {/* Stats */}
                <div className="grid-4" style={{ marginBottom: 24 }}>
                    {[['📋', 'Total', stats.total], ['⏳', 'Active', stats.active], ['✅', 'Resolved', stats.resolved], ['❌', 'Rejected', stats.rejected]].map(([icon, label, val]) => (
                        <div key={label} className="stat-card"><div className="stat-icon">{icon}</div><div className="stat-value">{val}</div><div className="stat-label">{label}</div></div>
                    ))}
                </div>

                {/* Complaints */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-3)' }}>⏳ Loading complaints…</div>
                ) : complaints.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 60, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 12 }}>📋</div>
                        <h3>No complaints yet</h3>
                        <p style={{ marginTop: 8, marginBottom: 24 }}>File your first complaint — it takes under 2 minutes</p>
                        <Link to="/submit" className="btn btn-primary">🚀 File Your First Complaint</Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {complaints.map(c => {
                            const stepIndex = STATUS_STEPS.findIndex(s => s.key === c.status);
                            const isRejected = c.status === 'rejected';
                            return (
                                <div key={c.id} onClick={() => navigate(`/complaint/${c.id}`)}
                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 20, cursor: 'pointer', transition: 'all var(--transition)' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = ''; }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-3)' }}>{c.id}</span>
                                                {c.ragTag && <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.ragTag === 'green' ? 'var(--color-green)' : c.ragTag === 'amber' ? 'var(--color-amber)' : 'var(--color-red)', display: 'inline-block' }} />}
                                                {statusBadge(c.status)}
                                            </div>
                                            <h4 style={{ marginBottom: 2, fontSize: '0.95rem' }}>{c.heading}</h4>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-3)' }}>📁 {c.department} · 📍 {(c.location || '').slice(0, 40)}{(c.location || '').length > 40 ? '…' : ''}</div>
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-3)', flexShrink: 0 }}>{timeAgo(c.createdAt)}</div>
                                    </div>

                                    {/* Mini tracker */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        {isRejected ? (
                                            <span className="badge badge-red">❌ Rejected</span>
                                        ) : STATUS_STEPS.map((step, i) => {
                                            const isDone = i < stepIndex;
                                            const isActive = i === stepIndex;
                                            return (
                                                <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <div title={step.label} style={{
                                                        width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem',
                                                        border: `2px solid ${isDone ? 'var(--color-green)' : isActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                                        background: isDone ? 'var(--color-green-pale)' : isActive ? 'var(--color-accent-pale)' : 'var(--color-bg-2)',
                                                    }}>{isDone ? '✓' : step.icon}</div>
                                                    {i < STATUS_STEPS.length - 1 && <div style={{ height: 2, width: 12, background: isDone ? 'var(--color-green)' : 'var(--color-border)', borderRadius: 1 }} />}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {c.authorityNote && (
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-green)', borderTop: '1px solid var(--color-border)', paddingTop: 10, marginTop: 10 }}>✅ Authority: "{c.authorityNote}"</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Profile modal */}
            {profileOpen && (
                <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && setProfileOpen(false)}>
                    <div className="modal">
                        <button className="modal-close" onClick={() => setProfileOpen(false)}>✕</button>
                        <h3 style={{ marginBottom: 20 }}>Edit Profile</h3>
                        <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} /></div>
                            <div className="grid-2" style={{ gap: 12 }}>
                                <div className="form-group"><label className="form-label">Age</label><input type="number" className="form-input" value={profileForm.age} onChange={e => setProfileForm(f => ({ ...f, age: e.target.value }))} /></div>
                                <div className="form-group"><label className="form-label">Phone</label><input type="tel" className="form-input" value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} /></div>
                            </div>
                            <div className="form-group"><label className="form-label">Gender</label>
                                <select className="form-select" value={profileForm.gender} onChange={e => setProfileForm(f => ({ ...f, gender: e.target.value }))}>
                                    <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
                                <button type="button" className="btn btn-ghost" onClick={() => setProfileOpen(false)} style={{ flex: 1 }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
