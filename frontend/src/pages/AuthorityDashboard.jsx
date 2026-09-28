import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getComplaints, resolveComplaint } from '../api/client';
import Navbar from '../components/Navbar';

function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }
function daysLeft(d) { return d ? Math.ceil((new Date(d) - Date.now()) / 86400000) : null; }

export default function AuthorityDashboard() {
    const { user, logout } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [note, setNote] = useState('');
    const [active, setActive] = useState(null); // resolving cid

    const load = useCallback(async () => {
        const all = await getComplaints({ status: 'authority_review' });
        setComplaints(all);
    }, []);

    useEffect(() => { load(); const t = setInterval(load, 12000); return () => clearInterval(t); }, [load]);

    const resolved = complaints.filter(c => c.status === 'resolved');
    const overdue = complaints.filter(c => daysLeft(c.deadline) !== null && daysLeft(c.deadline) < 0);

    async function resolve(cid) {
        const n = note.trim() || 'Issue has been addressed and resolved.';
        await resolveComplaint(cid, { authorityNote: n });
        setActive(null); setNote(''); load();
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '100vh', paddingTop: 64 }}>
            <Navbar user={user} onLogout={logout} />

            <aside style={{ background: 'var(--color-bg-2)', borderRight: '1px solid var(--color-border)', padding: '24px 14px', position: 'sticky', top: 64, height: 'calc(100vh - 64px)', overflowY: 'auto' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)', padding: '0 12px', marginBottom: 12 }}>Authority Panel</div>
                <div style={{ padding: '10px 12px', background: 'var(--color-surface)', borderRadius: 8, color: 'var(--color-text)', fontSize: '0.86rem', fontWeight: 600 }}>⚖️ Assigned Complaints</div>
                <div style={{ height: 1, background: 'var(--color-border)', margin: '12px 0' }} />
                <div style={{ padding: 12, background: 'var(--color-surface)', borderRadius: 8, fontSize: '0.82rem', color: 'var(--color-text-2)' }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>⏱️ SLA Policy</div>
                    Respond within <strong style={{ color: 'var(--color-accent)' }}>6 working days</strong> of assignment. Overdue complaints will be escalated.
                </div>
                <div style={{ height: 1, background: 'var(--color-border)', margin: '12px 0' }} />
                <div onClick={logout} style={{ padding: '10px 12px', color: 'var(--color-text-3)', fontSize: '0.86rem', cursor: 'pointer' }}>↩ Log Out</div>
            </aside>

            <main style={{ padding: 28, overflowY: 'auto' }}>
                <div className="grid-3" style={{ marginBottom: 24 }}>
                    <div className="stat-card"><div className="stat-icon">📥</div><div className="stat-value">{complaints.length}</div><div className="stat-label">Assigned</div></div>
                    <div className="stat-card"><div className="stat-icon">✅</div><div className="stat-value">{resolved.length}</div><div className="stat-label">Resolved</div></div>
                    <div className="stat-card" style={{ borderColor: overdue.length > 0 ? 'var(--color-red)' : 'var(--color-border)' }}>
                        <div className="stat-icon">⚠️</div><div className="stat-value" style={{ color: overdue.length > 0 ? 'var(--color-red)' : undefined }}>{overdue.length}</div><div className="stat-label">Overdue</div>
                    </div>
                </div>

                <h3 style={{ marginBottom: 16 }}>Complaints Assigned to You</h3>
                {complaints.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 60, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', color: 'var(--color-text-3)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
                        <h3>All caught up!</h3>
                        <p style={{ marginTop: 8 }}>No complaints currently assigned.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {complaints.map(c => {
                            const dl = daysLeft(c.deadline);
                            const od = dl !== null && dl < 0;
                            return (
                                <div key={c.id} style={{ background: 'var(--color-surface)', border: `1px solid ${od ? 'hsla(0,85%,55%,0.4)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-lg)', padding: 20 }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                                        <div>
                                            <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                                                <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--color-text-3)' }}>{c.id}</span>
                                                {od && <span className="badge badge-red">⚠️ OVERDUE</span>}
                                            </div>
                                            <h4 style={{ marginBottom: 2 }}>{c.heading}</h4>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-3)' }}>📁 {c.department} · 📍 {(c.location || '').slice(0, 50)}</div>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            {dl !== null && !od && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: dl <= 2 ? 'var(--color-amber)' : 'var(--color-green)' }}>{dl}d left</div>}
                                            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-3)', marginTop: 2 }}>Due: {fmtDate(c.deadline)}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-2)', marginBottom: 12, lineHeight: 1.6 }}>{c.description}</div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16, padding: '12px', background: 'var(--color-bg-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                        <div>
                                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', marginBottom: 4 }}>📍 Full Location</div>
                                            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-2)' }}>{c.location || 'Not specified'}</div>
                                            {c.coords && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontFamily: 'monospace', marginTop: 2 }}>
                                                    {c.coords.lat.toFixed(5)}, {c.coords.lng.toFixed(5)}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', marginBottom: 4 }}>📎 Attachments</div>
                                            {c.files && c.files.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                    {c.files.map((f, i) => (
                                                        <div key={i} style={{ fontSize: '0.8rem', color: 'var(--color-blue)', textDecoration: 'underline', cursor: 'pointer' }}>
                                                            📄 {f}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-3)' }}>No attachments</div>
                                            )}
                                        </div>
                                    </div>

                                    {c.adminNote && <div style={{ fontSize: '0.8rem', background: 'var(--color-accent-pale)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', marginBottom: 12 }}>📝 Admin Note: {c.adminNote}</div>}

                                    {active === c.id ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            <textarea className="form-textarea" value={note} onChange={e => setNote(e.target.value)} placeholder="Describe the resolution action taken…" rows={3} />
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button className="btn btn-success btn-sm" onClick={() => resolve(c.id)}>✅ Confirm Resolution</button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => setActive(null)}>Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button className="btn btn-success btn-sm" onClick={() => setActive(c.id)}>✅ Mark as Resolved</button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
