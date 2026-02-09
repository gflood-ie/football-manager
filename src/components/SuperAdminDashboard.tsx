import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SuperAdminDashboard: React.FC = () => {
    const [email, setEmail] = useState('');
    const [invitations, setInvitations] = useState<any[]>([]);
    const [managers, setManagers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { userProfile, signOut } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (userProfile && userProfile.role !== 'super_admin') {
            navigate('/');
        } else {
            fetchInvitations();
            fetchManagers();
        }
    }, [userProfile, navigate]);

    const fetchInvitations = async () => {
        try {
            const q = query(collection(db, 'invitations'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            setInvitations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching invitations:", error);
        }
    };

    const fetchManagers = async () => {
        try {
            const q = query(collection(db, 'users'), where('role', '==', 'manager'));
            const snapshot = await getDocs(q);
            setManagers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching managers:", error);
        }
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

            alert(`Invitation created! Code: ${docRef.id}`);
            setEmail('');
            fetchInvitations();
        } catch (error) {
            console.error(error);
            alert("Failed to create invitation");
        }
        setLoading(false);
    };

    const deleteInvite = async (id: string) => {
        if (!confirm("Delete this invite?")) return;
        await deleteDoc(doc(db, 'invitations', id));
        fetchInvitations();
    }

    const copyCode = (id: string) => {
        navigator.clipboard.writeText(id);
        alert("Code copied to clipboard!");
    };

    return (
        <div style={{ padding: '16px', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            onClick={() => navigate('/')}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                color: '#fff',
                                fontSize: '1.2rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            ←
                        </button>
                        <h1 style={{ color: '#fff', margin: 0, fontSize: '1.5rem' }}>Super Admin</h1>
                    </div>
                    <button onClick={() => signOut()} style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}>
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Invite Form */}
            <div className="glass-panel" style={{ padding: '20px' }}>
                <h2 style={{ color: 'var(--celtic-gold)', marginBottom: '16px', fontSize: '1.2rem' }}>Invite New Manager</h2>
                <form onSubmit={handleCreateInvite} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <input
                        type="email"
                        placeholder="Manager Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="form-control"
                        style={{ flex: 1, minWidth: '250px' }}
                        required
                    />
                    <button type="submit" className="btn-primary" disabled={loading} style={{ whiteSpace: 'nowrap', width: '100%', maxWidth: '200px' }}>
                        {loading ? 'Creating...' : 'Create Invite'}
                    </button>
                </form>
            </div>

            {/* Registered Managers List */}
            <div>
                <h3 style={{ color: '#fff', marginBottom: '16px', fontSize: '1.1rem' }}>Registered Managers</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {managers.map(manager => (
                        <div key={manager.id} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.03)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    👤
                                </div>
                                <div style={{ overflow: 'hidden' }}>
                                    <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{manager.email}</div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                        {manager.teamId ? 'Has Team' : 'No Team'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {managers.length === 0 && (
                        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No registered managers found.</p>
                    )}
                </div>
            </div>

            {/* Recent Invitations List */}
            <div>
                <h3 style={{ color: '#fff', marginBottom: '16px', fontSize: '1.1rem' }}>Recent Invitations</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {invitations.map(invite => (
                        <div key={invite.id} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.03)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ color: '#fff', fontWeight: 600, fontSize: '1rem', wordBreak: 'break-all' }}>{invite.email || 'No Email'}</div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
                                        {new Date(invite.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    background: invite.used ? 'rgba(218, 41, 28, 0.2)' : 'rgba(0, 158, 96, 0.2)',
                                    color: invite.used ? 'var(--danger)' : 'var(--celtic-green)'
                                }}>
                                    {invite.used ? 'USED' : 'ACTIVE'}
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                                <button
                                    onClick={() => copyCode(invite.id)}
                                    style={{
                                        flex: 1,
                                        background: 'rgba(255,199,44,0.1)',
                                        border: '1px solid var(--celtic-gold)',
                                        color: 'var(--celtic-gold)',
                                        padding: '8px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: 500
                                    }}
                                >
                                    Copy Code
                                </button>
                                <button
                                    onClick={() => deleteInvite(invite.id)}
                                    style={{
                                        width: '40px',
                                        background: 'rgba(218, 41, 28, 0.1)',
                                        border: '1px solid var(--danger)',
                                        color: 'var(--danger)',
                                        padding: '8px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    title="Delete"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
