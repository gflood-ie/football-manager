
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

const Register: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Auto-fill invite code from URL if present
    React.useEffect(() => {
        const code = searchParams.get('code');
        if (code) setInviteCode(code);
    }, [searchParams]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Verify Invitation Code
            const inviteRef = doc(db, 'invitations', inviteCode);
            const inviteSnap = await getDoc(inviteRef);

            if (!inviteSnap.exists()) {
                throw new Error('Invalid invitation code.');
            }

            const inviteData = inviteSnap.data();
            if (inviteData.used) {
                throw new Error('This invitation code has already been used.');
            }

            if (inviteData.email && inviteData.email !== email) {
                throw new Error('This invitation code is for a different email address.');
            }

            // 2. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 3. Create User Profile
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                role: inviteData.role || 'manager', // Default to manager if not specified
                teamId: inviteData.teamId || null, // Inherit teamId if present (for assistants)
                createdAt: new Date().toISOString()
            });

            // 4. Mark invitation as used
            await updateDoc(inviteRef, {
                used: true,
                usedBy: user.uid,
                usedAt: new Date().toISOString()
            });

            // 5. Navigate to Onboarding or Home
            navigate('/');

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to register.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--background)' }}>
            <div className="glass-panel" style={{ padding: '40px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                <img src="/logo.png" alt="Player Manager" style={{ width: '80px', marginBottom: '20px' }} />
                <h2 style={{ color: '#fff', marginBottom: '20px' }}>Manager Registration</h2>
                {error && <p style={{ color: 'var(--danger)', marginBottom: '10px' }}>{error}</p>}
                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <input
                        type="text"
                        placeholder="Invitation Code"
                        className="form-control"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="form-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                    <div style={{ marginTop: '20px' }}>
                        <Link to="/login" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Back to Login</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
