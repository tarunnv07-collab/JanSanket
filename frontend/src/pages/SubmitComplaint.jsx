import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createComplaint } from '../api/client';
import Navbar from '../components/Navbar';

export default function SubmitComplaint() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ department: '', heading: '', description: '', location: '' });
    const [coords, setCoords] = useState(null);
    const [files, setFiles] = useState([]);
    const [terms, setTerms] = useState(false);
    const [errors, setErrors] = useState({});
    const [geoState, setGeo] = useState('idle'); // idle | loading | done | error
    const [loading, setLoading] = useState(false);
    const dropRef = useRef();

    const change = e => {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
        setErrors(e => ({ ...e, [name]: '' }));
    };

    async function fetchGeo() {
        setGeo('loading');
        try {
            const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 }));
            const { latitude: lat, longitude: lng } = pos.coords;
            setCoords({ lat, lng });
            try {
                const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
                const d = await r.json();
                const addr = d.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                setForm(f => ({ ...f, location: addr }));
            } catch { setForm(f => ({ ...f, location: `${lat.toFixed(4)}, ${lng.toFixed(4)}` })); }
            setGeo('done');
        } catch { setGeo('error'); }
    }

    function handleFiles(fileList) {
        const valid = Array.from(fileList).filter(f => f.size <= 5 * 1024 * 1024);
        setFiles(prev => [...prev, ...valid].slice(0, 5));
    }

    async function submit(e) {
        e.preventDefault();
        const errs = {};
        if (!form.department.trim()) errs.department = 'Please select a department';
        if (!form.heading.trim()) errs.heading = 'Enter a heading';
        if (form.description.length < 50) errs.description = 'Minimum 50 characters';
        if (!form.location.trim()) errs.location = 'Enter or detect your location';
        if (!terms) errs.terms = 'Please accept the terms';
        if (Object.keys(errs).length) return setErrors(errs);

        setLoading(true);
        try {
            const anonymousId = `unknown${user.voterId.slice(-4).toUpperCase()}`;
            const c = await createComplaint({
                userId: user.id, anonymousId, name: user.name,
                ...form, coords,
                files: files.map(f => f.name),
            });
            navigate(`/complaint/${c.id}`);
        } catch (err) {
            setErrors({ department: err.message });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <Navbar user={user} onLogout={logout} />
            <div className="page-wrapper">
                <div className="container">
                    <div style={{ marginBottom: 24 }}>
                        <div className="section-tag">📋 New Complaint</div>
                        <h2>File a Complaint</h2>
                        <p>Your identity will be hidden. AI will analyze your complaint before routing to the authority.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28 }}>
                        {/* Form */}
                        <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div className="form-group">
                                <label htmlFor="department" className="form-label">Department <span className="text-accent">*</span></label>
                                <select id="department" name="department" className="form-input form-select" value={form.department} onChange={change} required>
                                    <option value="" disabled>Please select a department</option>
                                    <option value="Public Works Department (PWD)">Public Works Department (PWD)</option>
                                    <option value="Municipal Corporation – Solid Waste Management / Sanitation Department">Municipal Corporation – Solid Waste Management / Sanitation Department</option>
                                </select>
                                {errors.department && <span className="form-error visible">{errors.department}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Complaint Heading <span className="text-accent">*</span></label>
                                <input name="heading" className="form-input" value={form.heading} onChange={change} placeholder="Short descriptive title of the issue" maxLength={100} />
                                {errors.heading && <span className="form-error visible">{errors.heading}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Detailed Description <span className="text-accent">*</span></label>
                                <textarea name="description" className="form-textarea" value={form.description} onChange={change} placeholder="Describe the civic issue in detail — what happened, since when, how it affects you. Minimum 50 characters." rows={6} style={{ minHeight: 160 }} />
                                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-3)' }}>{form.description.length} characters</div>
                                {errors.description && <span className="form-error visible">{errors.description}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Exact Location <span className="text-accent">*</span></label>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <input name="location" className="form-input" value={form.location} onChange={change} placeholder="Enter address or use geolocation →" style={{ flex: 1 }} />
                                    <button type="button" className="btn btn-secondary" onClick={fetchGeo} disabled={geoState === 'loading'} style={{ flexShrink: 0 }}>
                                        {geoState === 'loading' ? '⏳ Detecting…' : geoState === 'done' ? '✅ Detected' : '📍 Use My Location'}
                                    </button>
                                </div>
                                {coords && <div style={{ fontSize: '0.78rem', color: 'var(--color-text-3)', marginTop: 4 }}>📍 {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</div>}
                                {errors.location && <span className="form-error visible">{errors.location}</span>}
                            </div>

                            {/* File drop zone */}
                            <div className="form-group">
                                <label className="form-label">Supporting Documents / Photos <span style={{ color: 'var(--color-text-3)', fontWeight: 400 }}>(optional)</span></label>
                                <div ref={dropRef} className="file-upload-area"
                                    onClick={() => document.getElementById('fileInput').click()}
                                    onDragOver={e => { e.preventDefault(); dropRef.current.classList.add('drag'); }}
                                    onDragLeave={() => dropRef.current.classList.remove('drag')}
                                    onDrop={e => { e.preventDefault(); dropRef.current.classList.remove('drag'); handleFiles(e.dataTransfer.files); }}>
                                    <div className="upload-icon">📎</div>
                                    <div style={{ fontWeight: 600 }}>Drag & drop or click to browse</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-3)', marginTop: 4 }}>JPG, PNG, PDF, MP4 · Max 5MB each · Up to 5 files</div>
                                </div>
                                <input id="fileInput" type="file" multiple accept="image/*,application/pdf,video/mp4" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
                                {files.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                                        {files.map((f, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '4px 10px', fontSize: '0.78rem' }}>
                                                📎 {f.name}
                                                <button type="button" onClick={() => setFiles(fs => fs.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer', fontSize: '0.9rem' }}>✕</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <label className="checkbox-wrapper">
                                <input type="checkbox" checked={terms} onChange={e => { setTerms(e.target.checked); setErrors(x => ({ ...x, terms: '' })); }} />
                                <span className="checkbox-custom" />
                                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-2)' }}>I confirm the information is accurate and agree to JanSanket's <a href="#" style={{ color: 'var(--color-accent)' }}>Terms</a> and <a href="#" style={{ color: 'var(--color-accent)' }}>Privacy Policy</a>.</span>
                            </label>
                            {errors.terms && <span className="form-error visible">{errors.terms}</span>}

                            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                                {loading ? '⏳ Submitting…' : '🚀 Submit Complaint'}
                            </button>
                        </form>

                        {/* Info sidebar */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Your Details</div>
                                {[['Voter ID', user?.voterId], ['Name', user?.name], ['Age', user?.age], ['Gender', user?.gender]].map(([l, v]) => (
                                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.88rem' }}>
                                        <span style={{ color: 'var(--color-text-3)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase' }}>{l}</span>
                                        <span style={{ color: 'var(--color-text-2)', fontFamily: l === 'Voter ID' ? 'monospace' : '' }}>{v || '—'}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ background: 'var(--color-accent-pale)', border: '1px solid hsla(0,85%,55%,0.3)', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: '0.84rem' }}>
                                🛡️ <strong>Your complaint identity:</strong>
                                <div style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: 'var(--color-accent)', fontWeight: 700, marginTop: 4 }}>
                                    unknown{user?.voterId?.slice(-4)?.toUpperCase()}
                                </div>
                                <div style={{ fontSize: '0.75rem', marginTop: 4 }}>Your real name is never shown on the complaint.</div>
                            </div>

                            <div className="card">
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', marginBottom: 12 }}>What Happens Next</div>
                                <div className="timeline">
                                    {[['🤖', 'AI Analysis', 'Verifies your complaint within seconds'], ['🏛️', 'Admin Review', 'Department admin reviews & routes'], ['⚖️', 'Authority Action', '6-day deadline to resolve'], ['🔔', 'You\'re Notified', 'Get updates at every step']].map(([icon, title, desc]) => (
                                        <div key={title} className="timeline-item">
                                            <div className="timeline-dot pending">{icon}</div>
                                            <div className="timeline-content">
                                                <div className="timeline-title">{title}</div>
                                                <div className="timeline-desc">{desc}</div>
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
