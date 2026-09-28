import { Link } from 'react-router-dom';

export default function Navbar({ user, onBell, unread, onLogout }) {
    return (
        <nav className="navbar">
            <div className="container">
                <Link to={user?.role === 'admin' ? '/admin' : user?.role === 'authority' ? '/authority' : '/dashboard'} className="nav-logo">
                    <div className="logo-icon">🛡️</div>
                    JanSanket
                    {user?.role !== 'citizen' && (
                        <span style={{ fontSize: '0.7rem', background: user?.role === 'admin' ? 'var(--color-accent)' : 'var(--color-blue)', color: '#fff', padding: '2px 8px', borderRadius: 99, marginLeft: 8, fontWeight: 700 }}>
                            {user?.role?.toUpperCase()}
                        </span>
                    )}
                </Link>
                <div className="nav-actions">
                    {onBell && (
                        <button onClick={onBell} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', fontSize: '1.2rem', padding: '4px 8px' }}>
                            🔔
                            {unread > 0 && (
                                <span style={{ position: 'absolute', top: 0, right: 0, background: 'var(--color-accent)', color: '#fff', borderRadius: 99, fontSize: '0.65rem', fontWeight: 700, padding: '1px 5px', lineHeight: 1.4, minWidth: 16, textAlign: 'center' }}>{unread}</span>
                            )}
                        </button>
                    )}
                    {onLogout && (
                        <button onClick={onLogout} className="btn btn-ghost btn-sm">Log Out</button>
                    )}
                </div>
            </div>
        </nav>
    );
}
