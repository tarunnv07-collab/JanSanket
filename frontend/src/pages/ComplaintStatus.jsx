import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getComplaint, setConsent, submitClarification, reassignDepartment, getAuditLogs, getDepartmentRegistry } from '../api/client';
import Navbar from '../components/Navbar';

const STATUS_STEPS = [
    { key: 'submitted', label: 'Filed', icon: '📋' },
    { key: 'ANALYZING', label: 'AI Check', icon: '🤖' },
    { key: 'AI_ROUTED', label: 'Routed', icon: '⚡' },
    { key: 'authority_review', label: 'Authority', icon: '⚖️' },
    { key: 'resolved', label: 'Resolved', icon: '✅' },
];

function timeAgo(d) { const m = Math.floor((Date.now() - new Date(d)) / 60000), h = Math.floor(m / 60), dy = Math.floor(h / 24); return dy > 0 ? `${dy}d ago` : h > 0 ? `${h}h ago` : m < 1 ? 'just now' : `${m}m ago`; }
function fmtDate(d) { return d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'; }
function daysLeft(deadline) { if (!deadline) return null; return Math.ceil((new Date(deadline) - Date.now()) / 86400000); }

export default function ComplaintStatus() {
    const { id } = useParams();
    const { user, logout } = useAuth();
    const [complaint, setComplaint] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [clarificationText, setClarificationText] = useState('');
    const [clarifying, setClarifying] = useState(false);
    const [reassignDept, setReassignDept] = useState('');
    const [reassignReason, setReassignReason] = useState('');
    const [reassigning, setReassigning] = useState(false);
    const [departmentsList, setDepartmentsList] = useState([]);

    const load = useCallback(async () => {
        try {
            const [c, logs, depts] = await Promise.all([
                getComplaint(id),
                getAuditLogs(id).catch(() => []),
                getDepartmentRegistry().catch(() => ({}))
            ]);
            setComplaint(c);
            setAuditLogs(logs || []);
            setDepartmentsList(Object.keys(depts || {}));
            setError(null);
        } catch (err) {
            setError(err.message || 'Complaint not found');
        }
        setLoading(false);
    }, [id]);

    useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, [load]);

    async function handleConsent(decision) {
        const c = await setConsent(id, { decision });
        setComplaint(c);
    }

    async function handleClarification(e) {
        e.preventDefault();
        if (!clarificationText.trim()) return;
        setClarifying(true);
        try {
            const updated = await submitClarification(id, { clarificationText });
            setComplaint(updated);
            setClarificationText('');
            load();
        } catch (err) {
            alert(err.message);
        } finally {
            setClarifying(false);
        }
    }

    async function handleReassign(e) {
        e.preventDefault();
        if (!reassignDept) return;
        setReassigning(true);
        try {
            const updated = await reassignDepartment(id, { newDepartment: reassignDept, reason: reassignReason });
            setComplaint(updated);
            setReassignDept('');
            setReassignReason('');
            load();
        } catch (err) {
            alert(err.message);
        } finally {
            setReassigning(false);
        }
    }

    if (loading) return <div style={{ textAlign: 'center', paddingTop: 120, color: 'var(--color-text-3)' }}>📡 Loading…</div>;
    if (!complaint) return (
        <div style={{ textAlign: 'center', paddingTop: 120, paddingLeft: 20, paddingRight: 20 }}>
            <h3>{error || 'Complaint not found'}</h3>
            <p style={{ color: 'var(--color-text-3)', marginTop: 8 }}>
                {error && error.includes('Forbidden') ? 'You do not have permission to access files assigned to another department.' : 'Please check the complaint ID or return to your dashboard.'}
            </p>
            <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: 20 }}>← Back to Dashboard</Link>
        </div>
    );

    const stepIdx = STATUS_STEPS.findIndex(s => s.key === complaint.status);
    const isRejected = complaint.status === 'rejected';
    const isResolved = complaint.status === 'resolved';
    const dl = daysLeft(complaint.deadline);
    const isOverdue = dl !== null && dl < 0;
    const dlPct = dl !== null ? Math.max(0, Math.min(100, (dl / 6) * 100)) : 0;
    const confidencePct = Math.round((complaint.departmentConfidence || 0.88) * 100);

    return (
        <div>
            <Navbar user={user} onLogout={logout} />
            <div className="page-wrapper">
                <div className="container">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
                        <div>
                            <div className="section-tag">📦 Complaint Tracking</div>
                            <h2>{complaint.heading}</h2>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-2)', marginTop: 4 }}>
                                ID: <span style={{ fontFamily: 'monospace', color: 'var(--color-accent)' }}>{complaint.id}</span> · Filed {timeAgo(complaint.createdAt)}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28 }}>
                        <div>
                            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
                                <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-2)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: isResolved ? 'var(--color-green)' : isRejected ? 'var(--color-red)' : 'var(--color-accent)', animation: isResolved || isRejected ? 'none' : 'pulse 2s infinite' }} />
                                                <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                                                    {isRejected ? 'Rejected ❌' : isResolved ? 'Resolved ✅' : complaint.status === 'AI_ROUTED' ? 'Automatically Routed ⚡' : complaint.status === 'NEEDS_CLARIFICATION' ? 'Clarification Required ⚠️' : STATUS_STEPS[stepIdx]?.label || complaint.status}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '0.82rem', marginTop: 4 }}>{complaint.aiExplanation || STATUS_STEPS[stepIdx]?.desc}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span className={`badge ${complaint.safetyFlag ? 'badge-red' : confidencePct >= 85 ? 'badge-green' : 'badge-amber'}`}>
                                                {complaint.safetyFlag ? '🔴 SAFETY FLAG' : `🤖 AI Confidence: ${confidencePct}%`}
                                            </span>
                                        </div>
                                    </div>

                                    {complaint.deadline && !isResolved && !isRejected && (
                                        <div style={{ marginTop: 16 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--color-text-3)', marginBottom: 4 }}>
                                                <span>Authority Deadline</span>
                                                <span style={{ fontWeight: 700, color: isOverdue ? 'var(--color-red)' : dl <= 2 ? 'var(--color-amber)' : 'var(--color-text)' }}>
                                                    {isOverdue ? '⚠️ OVERDUE' : `${dl} day${dl === 1 ? '' : 's'} remaining`}
                                                </span>
                                            </div>
                                            <div style={{ height: 6, borderRadius: 3, background: 'var(--color-border)', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', borderRadius: 3, width: dlPct + '%', background: isOverdue ? 'var(--color-red)' : dl <= 2 ? 'var(--color-amber)' : 'var(--color-green)', transition: 'width 0.4s' }} />
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-3)', marginTop: 4 }}>Deadline: {fmtDate(complaint.deadline)}</div>
                                        </div>
                                    )}
                                </div>

                                <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        🤖 AI Analysis & Routing Summary
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-2)', marginBottom: 12 }}>
                                        <strong>Reason:</strong> {complaint.aiExplanation || `Assigned to ${complaint.department} based on complaint analysis.`}
                                    </div>
                                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '0.8rem' }}>
                                        <div><strong>Assigned Dept:</strong> <span style={{ color: 'var(--color-accent)' }}>{complaint.department}</span></div>
                                        <div><strong>Priority:</strong> <span className={`badge ${complaint.priority === 'CRITICAL' ? 'badge-red' : 'badge-blue'}`}>{complaint.priority || 'MEDIUM'}</span></div>
                                        <div><strong>Urgency:</strong> <span className={`badge ${complaint.urgency === 'CRITICAL' ? 'badge-red' : 'badge-gray'}`}>{complaint.urgency || 'MEDIUM'}</span></div>
                                    </div>
                                </div>

                                <div className="track-steps">
                                    {STATUS_STEPS.map((step, i) => {
                                        const isDone = !isRejected && i < stepIdx;
                                        const isActive = !isRejected && i === stepIdx;
                                        return (
                                            <div key={step.key} className={`track-step ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                                                <div className="track-step-icon">{isDone ? '✓' : step.icon}</div>
                                                <div className="track-step-label">{step.label}</div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div style={{ padding: '0 28px 28px' }}>
                                    {complaint.status === 'NEEDS_CLARIFICATION' && (
                                        <form onSubmit={handleClarification} style={{ background: 'var(--color-amber-pale)', border: '1px solid var(--color-amber)', borderRadius: 'var(--radius-md)', padding: 18, marginBottom: 16 }}>
                                            <div style={{ fontWeight: 700, color: 'var(--color-amber)', marginBottom: 6 }}>⚠️ Additional Review / Information Required</div>
                                            <p style={{ fontSize: '0.83rem', color: 'var(--color-text-2)', marginBottom: 10 }}>
                                                Additional review is required because the complaint could match more than one department or requires details. Please provide extra information below:
                                            </p>
                                            <textarea
                                                className="form-input"
                                                rows={3}
                                                placeholder="Provide missing details (e.g. landmark, exact issue)..."
                                                value={clarificationText}
                                                onChange={e => setClarificationText(e.target.value)}
                                                style={{ marginBottom: 10, fontSize: '0.85rem' }}
                                                required
                                            />
                                            <button type="submit" className="btn btn-primary btn-sm" disabled={clarifying}>
                                                {clarifying ? '⏳ Submitting...' : '🚀 Submit Clarification'}
                                            </button>
                                        </form>
                                    )}

                                    {user?.role === 'admin' && (
                                        <form onSubmit={handleReassign} style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 16 }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 8 }}>🛠️ Admin Department Override</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
                                                <select className="form-select" value={reassignDept} onChange={e => setReassignDept(e.target.value)} required style={{ fontSize: '0.82rem' }}>
                                                    <option value="">Select new department...</option>
                                                    {departmentsList.map(d => (
                                                        <option key={d} value={d}>{d}</option>
                                                    ))}
                                                </select>
                                                <input className="form-input" placeholder="Reason for override..." value={reassignReason} onChange={e => setReassignReason(e.target.value)} style={{ fontSize: '0.82rem' }} />
                                            </div>
                                            <button type="submit" className="btn btn-primary btn-sm" disabled={reassigning}>
                                                {reassigning ? '⏳ Overriding...' : '⚙️ Confirm Reassignment'}
                                            </button>
                                        </form>
                                    )}

                                    {complaint.adminNote && (
                                        <div style={{ background: 'var(--color-accent-pale)', borderLeft: '3px solid var(--color-accent)', borderRadius: 6, padding: '12px 16px', fontSize: '0.85rem', marginBottom: 16 }}>
                                            <strong>Admin Note:</strong> {complaint.adminNote}
                                        </div>
                                    )}
                                    {complaint.authorityNote && (
                                        <div style={{ background: 'var(--color-green-pale)', borderLeft: '3px solid var(--color-green)', borderRadius: 6, padding: '12px 16px', fontSize: '0.85rem', marginBottom: 16 }}>
                                            <strong>Authority Response:</strong> {complaint.authorityNote}
                                        </div>
                                    )}
                                    {isOverdue && !complaint.dataShareConsent && (
                                        <div style={{ background: 'var(--color-red-pale)', border: '1px solid hsla(0,85%,55%,0.3)', borderRadius: 'var(--radius-md)', padding: 20, textAlign: 'center' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: 8 }}>⚠️</div>
                                            <h4>Authority Has Not Responded</h4>
                                            <p style={{ fontSize: '0.85rem', margin: '6px 0 16px' }}>The 6-day deadline has passed without action.</p>
                                            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                                                <Link to={`/lawsuit/${complaint.id}`} className="btn btn-danger">⚖️ Take Legal Action</Link>
                                                <button className="btn btn-ghost" onClick={() => handleConsent('declined')}>🛡️ Stay Anonymous</button>
                                            </div>
                                        </div>
                                    )}
                                    {complaint.dataShareConsent === 'agreed' && (
                                        <Link to={`/lawsuit/${complaint.id}`} className="btn btn-ghost btn-sm">⚖️ View Lawsuit Guide →</Link>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="card">
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', marginBottom: 14 }}>Complaint Details</div>
                                {[
                                    ['Assigned Department', complaint.department],
                                    ['Filed By', complaint.anonymousId],
                                    ['Location', complaint.location || '—'],
                                    ['Priority', complaint.priority || 'MEDIUM'],
                                    ['Urgency', complaint.urgency || 'MEDIUM'],
                                    ['Filed On', fmtDate(complaint.createdAt)]
                                ].map(([l, v]) => (
                                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--color-text-3)', fontSize: '0.78rem', flexShrink: 0 }}>{l}</span>
                                        <span style={{ color: 'var(--color-text-2)', textAlign: 'right', fontWeight: 600 }}>{v}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="card">
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', marginBottom: 14 }}>🔍 AI Audit Trail</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {auditLogs.length === 0 ? (
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-3)' }}>No audit events logged yet.</div>
                                    ) : (
                                        auditLogs.map((log, i) => (
                                            <div key={i} style={{ padding: 10, background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.78rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: 2 }}>
                                                    <span>{log.action}</span>
                                                    <span style={{ color: 'var(--color-accent)' }}>{log.confidence ? Math.round(log.confidence * 100) + '%' : '—'}</span>
                                                </div>
                                                <div style={{ color: 'var(--color-text-2)', marginBottom: 2 }}>{log.explanation}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-3)' }}>By: {log.performedBy} · {fmtDate(log.timestamp)}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="card">
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', marginBottom: 14 }}>📜 Activity Log</div>
                                <div className="timeline">
                                    {[...(complaint.timeline || [])].reverse().map((t, i) => (
                                        <div key={i} className="timeline-item">
                                            <div className="timeline-dot done">✓</div>
                                            <div>
                                                <div className="timeline-title">{t.step}</div>
                                                <div className="timeline-desc">{t.note}</div>
                                                <div className="timeline-time">{fmtDate(t.timestamp)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
