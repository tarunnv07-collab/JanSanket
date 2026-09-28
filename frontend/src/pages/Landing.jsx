import { Link } from 'react-router-dom';

export default function Landing() {
    return (
        <div>
            {/* Navbar */}
            <nav className="navbar">
                <div className="container">
                    <Link to="/" className="nav-logo">
                        <div className="logo-icon">🛡️</div>
                        JanSanket
                    </Link>
                    <div className="nav-links">
                        <a href="#how-it-works" className="nav-link">How It Works</a>
                        <a href="#features" className="nav-link">Features</a>
                    </div>
                    <div className="nav-actions">
                        <Link to="/login" className="btn btn-ghost btn-sm">Log In</Link>
                        <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 60% 30%, hsla(0,85%,55%,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)', backgroundSize: '60px 60px', opacity: 0.4, pointerEvents: 'none' }} />
                <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', paddingTop: 60, position: 'relative', zIndex: 1 }}>
                    <div className="fade-in">
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--color-accent-pale)', border: '1px solid hsla(0,85%,55%,0.3)', borderRadius: 'var(--radius-full)', padding: '5px 14px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-accent)', marginBottom: 24 }}>
                            🛡️ Secure · Anonymous · AI-Powered
                        </div>
                        <h1>Your Voice.<br /><span className="text-accent">Protected.</span><br />Your Rights. <span className="text-accent">Enforced.</span></h1>
                        <p style={{ fontSize: '1.05rem', marginTop: 16, maxWidth: 480 }}>File civic complaints, track them like a delivery, and escalate to legal action — all while staying completely anonymous.</p>
                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 32 }}>
                            <Link to="/register" className="btn btn-primary btn-lg">🚀 File a Complaint</Link>
                            <Link to="/login" className="btn btn-ghost btn-lg">Track Existing →</Link>
                        </div>
                        <div style={{ display: 'flex', gap: 28, marginTop: 36, flexWrap: 'wrap' }}>
                            {[['100%', 'Anonymous Filing'], ['AI', 'Verified Complaints'], ['6 Days', 'Authority Deadline']].map(([v, l]) => (
                                <div key={l}><div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{v}</div><div style={{ fontSize: '0.8rem', color: 'var(--color-text-3)' }}>{l}</div></div>
                            ))}
                        </div>
                    </div>
                    {/* Hero card preview */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ position: 'relative', width: 340, height: 380 }}>
                            <div style={{ position: 'absolute', top: 20, right: 0, background: 'var(--color-bg-3)', border: '1px solid var(--color-border)', borderRadius: 20, padding: 24, width: 240, transform: 'rotate(6deg)', zIndex: 1 }}>
                                <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🏛️</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-3)' }}>Status</div>
                                <div style={{ fontWeight: 700 }}>Admin Review</div>
                            </div>
                            <div style={{ position: 'absolute', top: 40, left: 0, background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', borderRadius: 20, padding: 24, width: 260, transform: 'rotate(-4deg)', zIndex: 2 }}>
                                <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🤖</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-3)' }}>AI Analysis</div>
                                <div style={{ fontWeight: 700 }}>🟢 Verified</div>
                            </div>
                            <div style={{ position: 'absolute', bottom: 0, left: 40, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 20, padding: 24, width: 280, zIndex: 3, boxShadow: 'var(--shadow-lg)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>Complaint #CS00384921</span>
                                    <span className="badge badge-green">✅ Resolved</span>
                                </div>
                                <div style={{ fontWeight: 700, marginBottom: 4, fontSize: '0.95rem' }}>Pothole on Main Road</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-2)', marginBottom: 14 }}>Filed anonymously • Municipal Corp</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 3 }}>
                                    {['📋', '🤖', '🏛️', '⚖️', '✅'].map((ic, i) => (
                                        <div key={i} style={{ textAlign: 'center', fontSize: '0.8rem', padding: '6px 2px', background: i === 4 ? 'var(--color-green-pale)' : 'var(--color-bg-2)', borderRadius: 4, color: i === 4 ? 'var(--color-green)' : 'inherit' }}>{ic}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" style={{ padding: '80px 0' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: 40 }}>
                        <div className="section-tag">⚙️ Process</div>
                        <h2>How JanSanket Works</h2>
                        <p style={{ marginTop: 8 }}>From complaint to resolution — a transparent, automated pipeline</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
                        {[
                            ['📝', 'Register', 'Sign up with your Voter ID. Your identity is always protected.'],
                            ['📋', 'File Complaint', 'Submit with location, photos, and department details.'],
                            ['🤖', 'AI Analysis', 'Our AI validates, classifies, and routes your complaint.'],
                            ['🏛️', 'Admin Review', 'Department admin reviews and forwards to authority.'],
                            ['⚖️', 'Authority Acts', 'The authority resolves within 6 working days.'],
                            ['✅', 'Resolved!', 'You get notified at every step. Escalate if needed.'],
                        ].map(([icon, title, desc], i) => (
                            <div key={i} style={{ textAlign: 'center', padding: '24px 16px' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: 'var(--color-accent)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', margin: '0 auto 14px' }}>{i + 1}</div>
                                <div style={{ fontSize: '1.8rem', marginBottom: 10 }}>{icon}</div>
                                <h4 style={{ marginBottom: 6 }}>{title}</h4>
                                <p style={{ fontSize: '0.82rem' }}>{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" style={{ padding: '80px 0', background: 'var(--color-bg-2)' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: 40 }}>
                        <div className="section-tag">✨ Features</div>
                        <h2>Built for Citizens. Trusted by Authorities.</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                        {[
                            ['🛡️', 'Complete Anonymity', 'Your identity is replaced with an anonymous ID. Personal details are never exposed without your consent.'],
                            ['🤖', 'AI-Powered Verification', 'Gemini AI analyzes every complaint for validity, spam detection, and duplicate filtering.'],
                            ['📦', 'Delivery-Style Tracking', 'Track your complaint through every stage — just like tracking a package in real time.'],
                            ['🔔', 'Live Notifications', 'Get notified instantly when your complaint status changes, at every step of the pipeline.'],
                            ['⏱️', '6-Day Authority Deadline', 'Authorities must respond within 6 working days or face automatic escalation.'],
                            ['⚖️', 'Legal Escalation Path', 'If authorities fail to act, get a step-by-step guide to file RTI, consumer forum, or PIL.'],
                            ['📄', 'Government Order Docs', 'Auto-generate official government order document templates for validated complaints.'],
                            ['📍', 'Geolocation Support', 'Pinpoint your exact location with one click for precise complaint routing.'],
                        ].map(([icon, title, desc]) => (
                            <div key={title} style={{ padding: 28, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', transition: 'all var(--transition)', cursor: 'default' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.4)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                            >
                                <div style={{ fontSize: '2rem', marginBottom: 14 }}>{icon}</div>
                                <h4>{title}</h4>
                                <p style={{ fontSize: '0.85rem', marginTop: 6 }}>{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section style={{ padding: '80px 0' }}>
                <div className="container">
                    <div style={{ background: 'linear-gradient(135deg, var(--color-bg-2), var(--color-bg-3))', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '60px 40px', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🛡️</div>
                        <h2>Ready to Make a Difference?</h2>
                        <p style={{ fontSize: '1.05rem', marginTop: 12, maxWidth: 480, margin: '12px auto 0' }}>Join thousands of citizens holding local government accountable through JanSanket.</p>
                        <div style={{ marginTop: 28, display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link to="/register" className="btn btn-primary btn-lg">Get Started — It's Free</Link>
                            <Link to="/login" className="btn btn-ghost btn-lg">I Already Have an Account</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ borderTop: '1px solid var(--color-border)', padding: '32px 0', textAlign: 'center' }}>
                <div className="container">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: '1.2rem' }}>🛡️</span>
                        <strong style={{ fontSize: '1rem', color: 'var(--color-text)' }}>JanSanket</strong>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-text-3)' }}>
                        Admin: Voter ID <code>ADMIN0001</code> | Authority: <code>AUTH0001</code>
                    </p>
                </div>
            </footer>
        </div>
    );
}
