import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getComplaint, setConsent } from '../api/client';
import Navbar from '../components/Navbar';

export default function Lawsuit() {
    const { id } = useParams();
    const { user, logout } = useAuth();
    const [complaint, setC] = useState(null);
    const [step, setStep] = useState('choice'); // choice | guide

    useEffect(() => { getComplaint(id).then(setC).catch(() => { }); }, [id]);

    async function agree() {
        const c = await setConsent(id, { decision: 'agreed' });
        setC(c); setStep('guide');
    }

    if (!complaint) return <div style={{ textAlign: 'center', paddingTop: 120, color: 'var(--color-text-3)' }}>Loading…</div>;

    const emailDraft = `To: collector.district@gov.in
Subject: Legal Notice — Unresolved Civic Complaint (Ref: ${complaint.id})

To Whom It May Concern,

I, ${user?.name || 'the complainant'} (Anonymous ID: ${complaint.anonymousId}), had filed a civic complaint on ${new Date(complaint.createdAt).toLocaleDateString('en-IN')} (Reference: ${complaint.id}) regarding: "${complaint.heading}" — Department: ${complaint.department}, Location: ${complaint.location}.

The designated authority has failed to respond within the mandated 6 working days. This constitutes a violation of citizen rights and government SLA under Section [X] of the [Act].

I hereby serve formal notice of my intent to escalate this matter legally. If not resolved within 7 days of this notice, I will file:
- An RTI Application (rtionline.gov.in)
- A Consumer Forum Complaint (edaakhil.nic.in)
- A PIL in the appropriate High Court

Kindly take immediate action.

Complainant ID: ${complaint.anonymousId}
Complaint Reference: ${complaint.id}
Date: ${new Date().toLocaleDateString('en-IN')}`;

    const steps = [
        { n: 1, title: 'File RTI Application', icon: '📄', desc: 'Request official documents about why your complaint was not addressed.', link: 'https://rtionline.gov.in/', label: 'File RTI Online →' },
        { n: 2, title: 'Consumer Forum Complaint', icon: '⚖️', desc: 'File a consumer complaint for deficiency in public service.', link: 'https://edaakhil.nic.in/', label: 'Open Consumer Forum →' },
        { n: 3, title: 'eCourts Portal', icon: '🏛️', desc: 'Access court services to file a PIL or writ petition.', link: 'https://services.ecourts.gov.in/', label: 'Access eCourts →' },
        { n: 4, title: 'NALSA Legal Aid', icon: '🎗️', desc: 'Get free legal help from the National Legal Services Authority.', link: 'https://nalsa.gov.in/', label: 'Get Legal Aid →' },
    ];

    return (
        <div>
            <Navbar user={user} onLogout={logout} />
            <div className="page-wrapper">
                <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px' }}>
                    <div style={{ background: 'linear-gradient(135deg, hsla(38,95%,52%,0.12), hsla(0,85%,55%,0.08))', border: '1px solid hsla(38,95%,52%,0.3)', borderRadius: 'var(--radius-xl)', padding: 32, textAlign: 'center', marginBottom: 28 }}>
                        <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚖️</div>
                        <h2>Legal Escalation Centre</h2>
                        <p style={{ marginTop: 8, maxWidth: 500, margin: '8px auto 0' }}>The authority failed to respond within 6 working days. You have the right to take legal action.</p>
                    </div>

                    {step === 'choice' ? (
                        <div className="card" style={{ padding: 32 }}>
                            <div style={{ marginBottom: 20 }}>
                                <h3>How would you like to proceed?</h3>
                                <p style={{ marginTop: 8, fontSize: '0.88rem' }}>Complaint: <strong>{complaint.heading}</strong> · Ref: <code>{complaint.id}</code></p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                                <div style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 24, textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>⚖️</div>
                                    <h4>Take Legal Action</h4>
                                    <p style={{ fontSize: '0.82rem', margin: '8px 0 16px' }}>Share your identity and get step-by-step legal guidance including RTI, consumer forum, and PIL options.</p>
                                    <button className="btn btn-danger btn-full" onClick={agree}>Proceed with Legal Action</button>
                                </div>
                                <div style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 24, textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>🛡️</div>
                                    <h4>Stay Anonymous</h4>
                                    <p style={{ fontSize: '0.82rem', margin: '8px 0 16px' }}>Escalate to a higher authority without revealing your identity. Your anonymity is preserved.</p>
                                    <Link to={`/complaint/${id}`} className="btn btn-ghost btn-full" onClick={() => setConsent(id, { decision: 'declined' })}>Stay Anonymous</Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div className="card" style={{ padding: 24 }}>
                                <h4 style={{ marginBottom: 12 }}>📧 Email Draft — Legal Notice</h4>
                                <pre style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 16, fontSize: '0.78rem', overflowX: 'auto', whiteSpace: 'pre-wrap', color: 'var(--color-text-2)', lineHeight: 1.7 }}>{emailDraft}</pre>
                                <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={() => navigator.clipboard?.writeText(emailDraft)}>📋 Copy Email</button>
                            </div>

                            {steps.map(s => (
                                <div key={s.n} className="card" style={{ padding: 24 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--color-accent-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>{s.icon}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <span style={{ background: 'var(--color-accent)', color: '#fff', borderRadius: 99, width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>{s.n}</span>
                                                <h4>{s.title}</h4>
                                            </div>
                                            <p style={{ fontSize: '0.85rem', marginBottom: 10 }}>{s.desc}</p>
                                            <a href={s.link} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">{s.label}</a>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <Link to={`/complaint/${id}`} className="btn btn-ghost" style={{ textAlign: 'center' }}>← Back to Complaint</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
