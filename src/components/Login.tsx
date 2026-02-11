
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [failedAttempts, setFailedAttempts] = useState(0);
    const [lockoutTime, setLockoutTime] = useState<number | null>(null);

    React.useEffect(() => {
        let interval: any;
        if (lockoutTime && Date.now() < lockoutTime) {
            interval = setInterval(() => {
                const remaining = Math.ceil((lockoutTime - Date.now()) / 1000);
                if (remaining <= 0) {
                    setLockoutTime(null);
                    setFailedAttempts(0);
                    setError('');
                } else {
                    setError(`Too many failed attempts. Please wait ${remaining} seconds.`);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [lockoutTime]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (lockoutTime && Date.now() < lockoutTime) {
            const remaining = Math.ceil((lockoutTime - Date.now()) / 1000);
            setError(`Too many failed attempts. Please try again in ${remaining} seconds.`);
            return;
        }

        setLoading(true);
        setError('');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            setFailedAttempts(0);
            setLockoutTime(null);
            navigate('/');
        } catch (err: any) {
            console.error(err);
            const newFailedAttempts = failedAttempts + 1;
            setFailedAttempts(newFailedAttempts);

            if (newFailedAttempts >= 3) {
                const lockoutDuration = 30 * 1000; // 30 seconds
                setLockoutTime(Date.now() + lockoutDuration);
                setError(`Too many failed attempts. Please wait 30 seconds.`);
            } else {
                setError('Failed to login. Please check your credentials.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: '#0a0a0a' }}>
            {/* Left Side - Artwork (Desktop) */}
            <div className="login-art animate-fade-in" style={{
                flex: '1.2',
                backgroundImage: 'url(/app-cover.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                borderRight: '1px solid var(--glass-border)',
                minHeight: '300px' // For mobile if stacked
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'linear-gradient(to right, transparent 0%, rgba(10,10,10,1) 100%)',
                    opacity: 0.3
                }} />
            </div>

            {/* Right Side - Form */}
            <div style={{
                flex: '1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                background: '#0a0a0a',
                position: 'relative'
            }}>
                {/* Background Blobs for specific area */}
                <div style={{
                    position: 'absolute',
                    top: '20%',
                    right: '10%',
                    width: '300px',
                    height: '300px',
                    background: 'var(--celtic-green)',
                    filter: 'blur(120px)',
                    opacity: 0.1,
                    borderRadius: '50%',
                    pointerEvents: 'none'
                }} />

                <div className="animate-fade-in" style={{
                    maxWidth: '400px',
                    width: '100%',
                    position: 'relative',
                    zIndex: 1
                }}>
                    <div style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '3rem', fontWeight: 800, color: '#fff', marginBottom: '12px', letterSpacing: '-0.02em', lineHeight: '1.1' }}>
                            Login
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Welcome back, Manager.</p>
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(218, 41, 28, 0.1)',
                            border: '1px solid rgba(218, 41, 28, 0.2)',
                            color: '#ff4d4d',
                            padding: '16px',
                            borderRadius: '12px',
                            marginBottom: '24px',
                            fontSize: '0.9rem',
                            display: 'flex', alignItems: 'center', gap: '12px'
                        }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ position: 'relative' }}>
                            <label className="form-label" style={{ marginBottom: '8px', display: 'block', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Email</label>
                            <input
                                type="email"
                                className="form-control"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{
                                    height: '56px',
                                    fontSize: '1rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    paddingLeft: '16px'
                                }}
                            />
                        </div>

                        <div style={{ position: 'relative' }}>
                            <label className="form-label" style={{ marginBottom: '8px', display: 'block', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Password</label>
                            <input
                                type="password"
                                className="form-control"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{
                                    height: '56px',
                                    fontSize: '1rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    paddingLeft: '16px'
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                            style={{
                                marginTop: '16px',
                                width: '100%',
                                fontSize: '1.1rem',
                                justifyContent: 'center',
                                height: '56px',
                                borderRadius: '16px',
                                letterSpacing: '0.02em'
                            }}
                        >
                            {loading ? 'Signing In...' : 'SIGN IN'}
                        </button>
                    </form>

                    <div style={{ marginTop: '40px', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '8px' }}>
                            Don't have an account?
                        </p>
                        <Link
                            to="/register"
                            style={{
                                color: 'var(--celtic-gold)',
                                textDecoration: 'none',
                                fontWeight: 700,
                                fontSize: '1rem',
                                borderBottom: '1px solid transparent',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.borderBottomColor = 'var(--celtic-gold)'}
                            onMouseOut={(e) => e.currentTarget.style.borderBottomColor = 'transparent'}
                        >
                            Register with Invite Code
                        </Link>
                    </div>
                </div>
            </div>
            <style>{`
                @media (max-width: 900px) {
                    div[style*="min-height: 100vh"] {
                        flex-direction: column;
                    }
                    .login-art {
                        width: 100%;
                        height: 350px !important;
                        flex: none !important;
                        background-position: top center !important;
                        border-right: none !important;
                        border-bottom: 1px solid var(--glass-border);
                    }
                    /* Hide gradient on mobile to show full image brightness */
                    .login-art > div {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
};

export default Login;
