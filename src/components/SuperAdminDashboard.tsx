import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, deleteDoc, doc, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmationContext';

const SuperAdminDashboard: React.FC = () => {
    const [email, setEmail] = useState('');
    const [invitations, setInvitations] = useState<any[]>([]);
    const [managers, setManagers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { userProfile, signOut } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    useEffect(() => {
        if (userProfile && userProfile.role !== 'super_admin') {
            navigate('/');
        }
        if (userProfile?.role === 'super_admin') {
            fetchInvitations();
            fetchManagers();
        }
    }, [userProfile, navigate]);

    const fetchInvitations = async () => {
        const q = query(collection(db, 'invitations'), where('used', '==', false));
        const snapshot = await getDocs(q);
        setInvitations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    const fetchManagers = async () => {
        const q = query(collection(db, 'users'), where('role', '==', 'manager'));
        const snapshot = await getDocs(q);
        setManagers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    const handleCreateInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const docRef = await addDoc(collection(db, 'invitations'), {
                email,
                role: 'manager',
                used: false,
                createdAt: new Date().toISOString()
            });

            showToast(`Invitation created! Code: ${docRef.id}`, 'success');
            setEmail('');
            fetchInvitations();
        } catch (error) {
            console.error(error);
            showToast("Failed to create invitation", 'error');
        }
        setLoading(false);
    };

    const deleteInvite = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!await confirm({
            title: 'Delete Invite?',
            message: 'Are you sure you want to delete this invite?',
            type: 'danger',
            confirmText: 'Delete'
        })) return;

        try {
            await deleteDoc(doc(db, 'invitations', id));
            showToast('Invite deleted', 'success');
            fetchInvitations();
        } catch (error) {
            console.error("Error deleting invite:", error);
            showToast('Error deleting invite', 'error');
        }
    };

    const copyCode = (id: string) => {
        navigator.clipboard.writeText(id);
        showToast("Code copied to clipboard!", 'success');
    };

    const handleResetPassword = async (email: string) => {
        if (!await confirm({
            title: 'Reset Password?',
            message: `Send password reset email to ${email}?`,
            confirmText: 'Send Email'
        })) return;

        try {
            await sendPasswordResetEmail(auth, email);
            showToast(`Password reset email sent to ${email}`, 'success');
        } catch (error) {
            console.error("Error sending reset email:", error);
            showToast("Error sending password reset email. Please try again.", 'error');
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ color: 'var(--celtic-gold)' }}>Super Admin</h1>
                <button onClick={() => signOut()} className="btn-danger">Sign Out</button>
            </div>

            <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '16px' }}>Create Manager Invitation</h2>
                <form onSubmit={handleCreateInvite} style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="email"
                        placeholder="Manager Email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Invite'}
                    </button>
                </form>
            </div>

            <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '16px' }}>Active Invitations</h2>
                {invitations.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No active invitations.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {invitations.map(invite => (
                            <div key={invite.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', color: '#fff' }}>{invite.email}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => copyCode(invite.id)}>
                                        Code: {invite.id} (Click to copy)
                                    </div>
                                </div>
                                <button onClick={(e) => deleteInvite(invite.id, e)} className="btn-danger" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '16px' }}>Registered Managers</h2>
                {managers.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No managers registered yet.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {managers.map(manager => (
                            <div key={manager.id} style={{ background: 'rgba(0,158,96,0.1)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', color: '#fff' }}>{manager.email}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--celtic-green)' }}>Team ID: {manager.teamId || 'Not Setup'}</div>
                                </div>
                                <button onClick={() => handleResetPassword(manager.email)} className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                                    Reset Password
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
