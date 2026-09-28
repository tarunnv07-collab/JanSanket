import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [voterId, setVoterId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function submit(e) {
        e.preventDefault();
        if (!voterId.trim()) return setError('Enter your Voter ID');
        if (!password) return setError('Enter your password');
        setLoading(true);
        try {
            const user = await login(voterId, password);
            if (user.role === 'admin') navigate('/admin');
            else if (user.role === 'authority') navigate('/authority');
            else navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at center, hsla(0,85%,55%,0.07), transparent 70%)' }}>
            <div style={{ width: '100%', maxWidth: 420, padding: '0 24px' }}>
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                    <Link to="/" className="nav-logo" style={{ justifyContent: 'center', marginBottom: 20, display: 'flex' }}>
                        <div className="logo-icon">🛡️</div> JanSanket
                    </Link>
                    <h2>Welcome Back</h2>
                    <p style={{ marginTop: 8 }}>Enter your credentials to continue</p>
                </div>

                <div className="card" style={{ padding: 32 }}>
                    <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="form-group">
                            <label className="form-label">Voter ID <span className="text-accent">*</span></label>
                            <input
                                className="form-input"
                                value={voterId}
                                onChange={e => { setVoterId(e.target.value.toUpperCase()); setError(''); }}
                                placeholder="e.g. ABC1234567"
                                style={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '1rem', textAlign: 'center' }}
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password <span className="text-accent">*</span></label>
                            <input
                                type="password"
                                className="form-input"
                                value={password}
                                onChange={e => { setPassword(e.target.value); setError(''); }}
                                placeholder="Enter your password"
                                style={{ fontSize: '1rem' }}
                            />
                            {error && <span className="form-error visible">{error}</span>}
                        </div>

                        <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ padding: 13 }}>
                            {loading ? '⏳ Logging in…' : '→ Log In'}
                        </button>
                    </form>

                    <div style={{ marginTop: 20, background: 'var(--color-bg-2)', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: '0.78rem', color: 'var(--color-text-3)' }}>
                        <div style={{ marginBottom: 6, fontWeight: 600, color: 'var(--color-text-2)' }}>Demo Accounts</div>
                        <div>🏛️ Admin: <code style={{ color: 'var(--color-accent)' }}>ADMIN0001</code> (Pass: <code style={{ color: 'var(--color-accent)' }}>admin123</code>)</div>
                        <div style={{ marginTop: 4 }}>⚖️ Authority: <code style={{ color: 'var(--color-accent)' }}>AUTH0001</code> (Pass: <code style={{ color: 'var(--color-accent)' }}>auth123</code>)</div>
                    </div>
                </div>

                <div className="divider-text" style={{ margin: '20px 0' }}>new here?</div>
                <Link to="/register" className="btn btn-ghost btn-full">Create Account →</Link>
            </div>
        </div>
    );
}
