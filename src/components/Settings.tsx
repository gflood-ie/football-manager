import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, deleteDoc, onSnapshot } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const { userProfile, signOut } = useAuth();

    // Form and Loading State
    const [teamName, setTeamName] = useState('');
    const [yearBorn, setYearBorn] = useState('');
    const [crestUrl, setCrestUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // Assistant Manager State
    const [inviteEmail, setInviteEmail] = useState('');
    const [pendingInvites, setPendingInvites] = useState<any[]>([]);
    const [assistants, setAssistants] = useState<any[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchTeamData = async () => {
            if (userProfile?.teamId) {
                setLoading(true);
                try {
                    const teamDoc = await getDoc(doc(db, 'teams', userProfile.teamId));
                    if (teamDoc.exists()) {
                        const data = teamDoc.data();
                        setTeamName(data.name || '');
                        setYearBorn(data.yearBorn || '');
                        setCrestUrl(data.crestUrl || '');
                    }
                } catch (error) {
                    console.error("Error fetching team:", error);
                }
                setLoading(false);
            }
        };
        fetchTeamData();
    }, [userProfile]);

    // Fetch Assistants and Invites
    useEffect(() => {
        if (!userProfile?.teamId) return;

        // Listen for pending invites
        const qInvites = query(
            collection(db, 'invitations'),
            where('teamId', '==', userProfile.teamId),
            where('used', '==', false)
        );

        const unsubscribeInvites = onSnapshot(qInvites, (snapshot) => {
            setPendingInvites(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Listen for active assistants
        const qAssistants = query(
            collection(db, 'users'),
            where('teamId', '==', userProfile.teamId),
            where('role', '==', 'assistant_manager')
        );

        const unsubscribeAssistants = onSnapshot(qAssistants, (snapshot) => {
            setAssistants(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubscribeInvites();
            unsubscribeAssistants();
        };
    }, [userProfile?.teamId]);

    const handleInviteAssistant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile?.teamId) return;

        setLoading(true);
        try {
            // Check if invite already exists
            const q = query(
                collection(db, 'invitations'),
                where('teamId', '==', userProfile.teamId),
                where('email', '==', inviteEmail),
                where('used', '==', false)
            );
            const existing = await getDocs(q);
            if (!existing.empty) {
                alert('An invitation for this email already exists.');
                setLoading(false);
                return;
            }

            await addDoc(collection(db, 'invitations'), {
                email: inviteEmail,
                role: 'assistant_manager',
                teamId: userProfile.teamId,
                used: false,
                createdAt: new Date().toISOString()
            });

            setInviteEmail('');
            setMessage({ text: 'Invitation sent!', type: 'success' });
        } catch (error: any) {
            console.error(error);
            setMessage({ text: 'Failed to create invite.', type: 'error' });
        }
        setLoading(false);
    };

    const handleDeleteInvite = async (id: string) => {
        if (!confirm('Cancel this invitation?')) return;
        try {
            await deleteDoc(doc(db, 'invitations', id));
        } catch (error) {
            console.error("Error deleting invite:", error);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && userProfile?.teamId) {
            const file = e.target.files[0];
            setUploading(true);
            try {
                // Create a storage ref
                const storageRef = ref(storage, `crests/${userProfile.teamId}/${file.name}`);
                // Upload file
                await uploadBytes(storageRef, file);
                // Get URL
                const url = await getDownloadURL(storageRef);
                setCrestUrl(url);
                setMessage({ text: "Logo uploaded successfully! Don't forget to save.", type: 'success' });
            } catch (error: any) {
                console.error("Upload error:", error);
                setMessage({ text: "Failed to upload logo: " + error.message, type: 'error' });
            }
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!userProfile?.teamId) return;
        setSaving(true);
        setMessage(null);
        try {
            await updateDoc(doc(db, 'teams', userProfile.teamId), {
                name: teamName,
                yearBorn: yearBorn,
                crestUrl: crestUrl,
                updatedAt: new Date().toISOString()
            });
            setMessage({ text: "Team settings saved successfully!", type: 'success' });
        } catch (error: any) {
            console.error("Save error:", error);
            setMessage({ text: "Failed to save settings.", type: 'error' });
        }
        setSaving(false);
    };

    const handlePasswordReset = async () => {
        if (userProfile?.email) {
            try {
                await sendPasswordResetEmail(auth, userProfile.email);
                alert(`Password reset email sent to ${userProfile.email}`);
            } catch (error: any) {
                console.error("Password reset error:", error);
                alert("Failed to send reset email: " + error.message);
            }
        }
    };

    if (loading) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)' }}>Loading settings...</div>;
    }

    return (
        <div style={{ flex: 1, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div className="header-glass">
                <button onClick={() => navigate('/')} className="icon-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                </button>
                <h1 style={{ fontSize: '1.25rem', color: '#fff', margin: 0, fontWeight: 600 }}>Team Settings</h1>
                <div style={{ width: 40 }} /> {/* Spacer for centering */}
            </div>

            <div className="page-container">

                {/* Team Details Section */}
                <div className="glass-panel animate-fade-in" style={{ padding: '32px 24px' }}>

                    {/* Logo Upload */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
                        <div
                            style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px dashed var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                position: 'relative',
                                transition: 'all 0.2s',
                                boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                            }}
                            onClick={() => fileInputRef.current?.click()}
                            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--celtic-gold)'}
                            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--text-secondary)'}
                        >
                            {crestUrl ? (
                                <img src={crestUrl} alt="Team Crest" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                            )}
                            {uploading && (
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 500 }}>
                                    Uploading...
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            style={{ marginTop: '16px', background: 'transparent', border: 'none', color: 'var(--celtic-green)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
                        >
                            Change Team Logo
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label className="form-label">Team Name</label>
                            <input
                                className="form-control"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                placeholder="e.g. Celtic FC"
                            />
                        </div>
                        <div>
                            <label className="form-label">Year Born / Age Group</label>
                            <input
                                className="form-control"
                                value={yearBorn}
                                onChange={(e) => setYearBorn(e.target.value)}
                                placeholder="e.g. 2014"
                            />
                        </div>
                    </div>

                    {message && (
                        <div style={{
                            marginTop: '24px',
                            padding: '12px',
                            borderRadius: '12px',
                            background: message.type === 'success' ? 'rgba(0, 158, 96, 0.1)' : 'rgba(218, 41, 28, 0.1)',
                            color: message.type === 'success' ? 'var(--celtic-green)' : '#ff6b6b',
                            border: `1px solid ${message.type === 'success' ? 'rgba(0, 158, 96, 0.2)' : 'rgba(218, 41, 28, 0.2)'}`,
                            fontSize: '0.9rem',
                            textAlign: 'center',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}>
                            {message.type === 'success' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                            )}
                            {message.text}
                        </div>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary"
                        style={{ marginTop: '32px' }}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                {/* Assistant Managers Section */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                    <h2 style={{ fontSize: '1.1rem', color: '#fff', margin: '0 0 20px 0' }}>Assistant Managers</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                        Invite assistants to help manage your team. They can view data but cannot invite others.
                    </p>

                    <form onSubmit={handleInviteAssistant} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                        <input
                            type="email"
                            placeholder="Assistant Email"
                            className="form-control"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            required
                            style={{ flex: 1 }}
                        />
                        <button type="submit" className="btn-primary" disabled={loading} style={{ width: 'auto', padding: '0 20px' }}>
                            Invite
                        </button>
                    </form>

                    {/* Pending Invites */}
                    {pendingInvites.length > 0 && (
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ color: 'var(--celtic-gold)', fontSize: '0.9rem', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Invites</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {pendingInvites.map(invite => (
                                    <div key={invite.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ color: '#fff', fontSize: '0.95rem' }}>{invite.email}</div>
                                            <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>Code: {invite.id}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => { navigator.clipboard.writeText(invite.id); alert('Code copied!'); }}
                                                className="icon-btn"
                                                style={{ width: '32px', height: '32px', color: 'var(--celtic-gold)' }}
                                                title="Copy Code"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteInvite(invite.id)}
                                                className="icon-btn"
                                                style={{ width: '32px', height: '32px', color: 'var(--danger)' }}
                                                title="Cancel Invite"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Active Assistants */}
                    <div>
                        <h3 style={{ color: 'var(--celtic-green)', fontSize: '0.9rem', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Team Assistants</h3>
                        {assistants.length === 0 ? (
                            <p style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '0.9rem' }}>No active assistants.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {assistants.map(assistant => (
                                    <div key={assistant.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                                            <div style={{ color: '#fff', fontSize: '0.95rem' }}>{assistant.email}</div>
                                        </div>
                                        {/* Future: Add remove assistant functionality here if needed */}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Account Actions */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                    <h2 style={{ fontSize: '1.1rem', color: '#fff', margin: '0 0 20px 0' }}>Account Settings</h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Email Address</span>
                            <span style={{ color: '#fff', fontSize: '1rem', fontFamily: 'monospace' }}>{userProfile?.email}</span>
                        </div>

                        <button
                            onClick={handlePasswordReset}
                            className="btn-secondary"
                            style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}
                        >
                            <span>Reset Password</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                        </button>

                        <button
                            onClick={() => signOut()}
                            className="btn-danger"
                            style={{ marginTop: '8px' }}
                        >
                            Sign Out
                        </button>
                    </div>
                </div>

                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem', paddingBottom: '20px' }}>
                    App Version 1.0.2 • Powered by G-Football
                </div>

            </div>
        </div >
    );
};

export default Settings;
