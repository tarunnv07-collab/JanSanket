import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getComplaints, acceptComplaint, rejectComplaint } from '../api/client';
import Navbar from '../components/Navbar';

function timeAgo(d) { const m = Math.floor((Date.now() - new Date(d)) / 60000), h = Math.floor(m / 60), dy = Math.floor(h / 24); return dy > 0 ? `${dy}d ago` : h > 0 ? `${h}h ago` : m < 1 ? 'just now' : `${m}m ago`; }

function RagBadge({ tag }) {
    if (!tag) return <span className="badge badge-gray">—</span>;
    const cls = { red: 'badge-red', amber: 'badge-amber', green: 'badge-green' }[tag] || 'badge-gray';
    const icons = { red: '🔴', amber: '🟡', green: '🟢' };
    return <span className={`badge ${cls}`}>{icons[tag]} {tag.toUpperCase()}</span>;
}
function StatusBadge({ status }) {
    const cls = { submitted: 'badge-blue', ai_review: 'badge-amber', admin_review: 'badge-amber', authority_review: 'badge-blue', resolved: 'badge-green', rejected: 'badge-red' }[status] || 'badge-gray';
    const lbl = { submitted: '📋 Submitted', ai_review: '🤖 AI Review', admin_review: '🏛️ Admin Review', authority_review: '⚖️ Authority', resolved: '✅ Resolved', rejected: '❌ Rejected' }[status] || status;
    return <span className={`badge ${cls}`}>{lbl}</span>;
}

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [filter, setFilter] = useState('all');
    const [modal, setModal] = useState(null); // complaint object
    const [note, setNote] = useState('');

    const load = useCallback(async () => {
        const all = await getComplaints();
        setComplaints(all);
    }, []);

    useEffect(() => { load(); const t = setInterval(load, 12000); return () => clearInterval(t); }, [load]);

    const filtered = complaints.filter(c => {
        if (filter === 'all') return true;
        if (['green', 'amber', 'red'].includes(filter)) return c.ragTag === filter;
        return c.status === filter;
    });

    const stats = {
        total: complaints.length,
        pending: complaints.filter(c => c.status === 'admin_review').length,
        resolved: complaints.filter(c => c.status === 'resolved').length,
        rejected: complaints.filter(c => c.status === 'rejected').length,
    };

    async function accept(cid) {
        await acceptComplaint(cid, { adminNote: note });
        setModal(null); setNote(''); load();
    }
    async function reject(cid) {
        await rejectComplaint(cid, { adminNote: note || 'Complaint does not meet criteria.' });
        setModal(null); setNote(''); load();
    }

    const FILTERS = [
        ['all', 'All Complaints'],
        ['AI_ROUTED', '⚡ Auto-Routed'],
        ['ROUTING_REVIEW', '🔍 Routing Review'],
        ['NEEDS_CLARIFICATION', '⚠️ Clarification Needed'],
        ['AI_ANALYSIS_FAILED', '❌ AI Failed'],
        ['resolved', '✅ Resolved'],
        ['rejected', '❌ Rejected']
    ];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '100vh', paddingTop: 64 }}>
            <Navbar user={user} onLogout={logout} />

            {/* Sidebar */}
            <aside style={{ background: 'var(--color-bg-2)', borderRight: '1px solid var(--color-border)', padding: '24px 14px', position: 'sticky', top: 64, height: 'calc(100vh - 64px)', overflowY: 'auto' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)', padding: '0 12px', marginBottom: 12 }}>Admin Panel</div>
                <div style={{ padding: '10px 12px', background: 'var(--color-surface)', borderRadius: 8, color: 'var(--color-text)', fontSize: '0.86rem', fontWeight: 600 }}>📊 Complaints</div>
                <div style={{ height: 1, background: 'var(--color-border)', margin: '12px 0' }} />
                <div onClick={logout} style={{ padding: '10px 12px', color: 'var(--color-text-3)', fontSize: '0.86rem', cursor: 'pointer' }}>↩ Log Out</div>
            </aside>

            <main style={{ padding: 28, overflowY: 'auto' }}>
                <div className="grid-4" style={{ marginBottom: 24 }}>
                    {[['📋', 'Total', stats.total], ['⏳', 'Pending', stats.pending], ['✅', 'Resolved', stats.resolved], ['❌', 'Rejected', stats.rejected]].map(([icon, label, val]) => (
                        <div key={label} className="stat-card"><div className="stat-icon">{icon}</div><div className="stat-value">{val}</div><div className="stat-label">{label}</div></div>
                    ))}
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '20px 20px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                            <h3>All Complaints</h3>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {FILTERS.map(([val, label]) => (
                                    <button key={val} onClick={() => setFilter(val)}
                                        style={{ padding: '6px 14px', borderRadius: 99, fontWeight: 600, fontSize: '0.8rem', border: '1px solid', borderColor: filter === val ? 'var(--color-accent)' : 'var(--color-border)', background: filter === val ? 'var(--color-accent)' : 'transparent', color: filter === val ? '#fff' : 'var(--color-text-2)', cursor: 'pointer' }}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                        <table>
                            <thead><tr><th>ID</th><th>Complaint</th><th>Filed By</th><th>RAG</th><th>Status</th><th>Time</th><th>Actions</th></tr></thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-3)' }}>No complaints found</td></tr>
                                ) : filtered.map(c => (
                                    <tr key={c.id}>
                                        <td><span style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{c.id}</span></td>
                                        <td><div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{c.heading}</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>{c.department}</div></td>
                                        <td><span style={{ fontSize: '0.82rem' }}>{c.anonymousId}</span></td>
                                        <td><RagBadge tag={c.ragTag} /></td>
                                        <td><StatusBadge status={c.status} /></td>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--color-text-3)' }}>{timeAgo(c.createdAt)}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                <button className="btn btn-sm btn-ghost" onClick={() => { setModal(c); setNote(''); }}>👁 View</button>
                                                {c.status === 'admin_review' && <>
                                                    <button className="btn btn-sm btn-success" onClick={() => accept(c.id)}>✓</button>
                                                    <button className="btn btn-sm btn-danger" onClick={() => reject(c.id)}>✗</button>
                                                </>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Detail modal */}
            {modal && (
                <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && setModal(null)}>
                    <div className="modal">
                        <button className="modal-close" onClick={() => setModal(null)}>✕</button>
                        <h3 style={{ marginBottom: 20 }}>Complaint Details</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                            {[['ID', modal.id], ['Status', modal.status], ['Dept', modal.department], ['Filed By', modal.anonymousId]].map(([l, v]) => (
                                <div key={l}><div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', marginBottom: 4 }}>{l}</div><div style={{ fontSize: '0.88rem' }}>{v}</div></div>
                            ))}
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Heading</div>
                            <div style={{ fontWeight: 600 }}>{modal.heading}</div>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Description</div>
                            <div style={{ fontSize: '0.88rem', color: 'var(--color-text-2)', lineHeight: 1.7, maxHeight: '200px', overflowY: 'auto', paddingRight: '8px' }}>{modal.description}</div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                            <div>
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', marginBottom: 4 }}>📍 Location</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-2)' }}>{modal.location || 'Not specified'}</div>
                                {modal.coords && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontFamily: 'monospace', marginTop: 2 }}>
                                        {modal.coords.lat.toFixed(5)}, {modal.coords.lng.toFixed(5)}
                                    </div>
                                )}
                            </div>
                            <div>
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', marginBottom: 4 }}>📎 Attachments</div>
                                {modal.files && modal.files.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        {modal.files.map((f, i) => (
                                            <div key={i} style={{ fontSize: '0.82rem', color: 'var(--color-blue)', textDecoration: 'underline', cursor: 'pointer' }}>
                                                📄 {f}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-3)' }}>No attachments</div>
                                )}
                            </div>
                        </div>

                        {modal.status === 'admin_review' && (
                            <>
                                <div className="form-group" style={{ marginBottom: 16 }}>
                                    <label className="form-label">Admin Note (optional)</label>
                                    <textarea className="form-textarea" value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note for the authority…" rows={3} />
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button className="btn btn-success" style={{ flex: 1 }} onClick={() => accept(modal.id)}>✓ Accept & Forward</button>
                                    <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => reject(modal.id)}>✗ Reject</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
