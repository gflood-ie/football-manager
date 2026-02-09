
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const [team, setTeam] = useState<any>(null);

    useEffect(() => {
        const fetchTeam = async () => {
            if (userProfile?.teamId) {
                const teamDoc = await getDoc(doc(db, 'teams', userProfile.teamId));
                if (teamDoc.exists()) {
                    setTeam(teamDoc.data());
                }
            }
        };
        fetchTeam();
    }, [userProfile]);

    if (!userProfile) return null;

    return (
        <div style={{ flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div className="header-glass animate-fade-in" style={{ animationDelay: '0s' }}>
                <div className="flex-center gap-3">
                    {team?.crestUrl ? (
                        <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: '14px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--glass-border)',
                            padding: '6px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <img src={team.crestUrl} alt="Crest" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                    ) : (
                        <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'var(--celtic-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.4rem', boxShadow: '0 4px 12px rgba(0,158,96,0.3)' }}>
                            ⚽
                        </div>
                    )}
                    <div className="flex-col">
                        <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', lineHeight: '1.1' }}>
                            {team ? team.name : 'My Team'}
                        </span>
                        <span style={{ color: 'var(--celtic-gold)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            {team ? team.yearBorn : 'Manager'}
                        </span>
                    </div>
                </div>

                <div className="flex-center gap-3">
                    {userProfile.role === 'super_admin' && (
                        <button
                            onClick={() => navigate('/admin')}
                            className="icon-btn"
                            style={{ color: 'var(--celtic-gold)', background: 'rgba(255, 199, 44, 0.1)', borderColor: 'rgba(255, 199, 44, 0.2)' }}
                            title="Admin Dashboard"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                        </button>
                    )}

                    <button
                        onClick={() => navigate('/settings')}
                        className="icon-btn"
                        title="Settings"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="page-container" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '32px' }}>

                <div className="flex-col gap-2 animate-fade-in" style={{ alignItems: 'center', animationDelay: '0.1s' }}>
                    <h1 className="text-gradient-gold" style={{ fontSize: '2.5rem', margin: 0, textAlign: 'center' }}>
                        Welcome Back
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: 0 }}>
                        Ready to manage your team?
                    </p>
                </div>

                <div
                    onClick={() => navigate('/match')}
                    className="glass-panel animate-fade-in"
                    style={{
                        width: '100%',
                        padding: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '24px',
                        cursor: 'pointer',
                        animationDelay: '0.2s',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{
                        width: '72px', height: '72px', borderRadius: '20px',
                        background: 'linear-gradient(135deg, rgba(0, 158, 96, 0.2), rgba(0, 158, 96, 0.05))',
                        border: '1px solid rgba(0, 158, 96, 0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--celtic-green)',
                        boxShadow: '0 8px 24px rgba(0, 158, 96, 0.15)'
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>
                    </div>
                    <div className="flex-col gap-2">
                        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Match Center</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Record matches, view results & scorers</span>
                    </div>
                    <div style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '50%' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </div>
                </div>

                <div
                    onClick={() => navigate('/training')}
                    className="glass-panel animate-fade-in"
                    style={{
                        width: '100%',
                        padding: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '24px',
                        cursor: 'pointer',
                        animationDelay: '0.3s',
                    }}
                >
                    <div style={{
                        width: '72px', height: '72px', borderRadius: '20px',
                        background: 'linear-gradient(135deg, rgba(255, 199, 44, 0.2), rgba(255, 199, 44, 0.05))',
                        border: '1px solid rgba(255, 199, 44, 0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--celtic-gold)',
                        boxShadow: '0 8px 24px rgba(255, 199, 44, 0.15)'
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v2" /><path d="M14 2v2" /><path d="M16 8a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1" /><rect x="4" y="8" width="16" height="12" rx="2" /><path d="M8 12h8" /><path d="M8 16h8" /></svg>
                    </div>
                    <div className="flex-col gap-2">
                        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Training Hub</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Log attendance & track stats</span>
                    </div>
                    <div style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '50%' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/team')}
                    className="glass-panel animate-fade-in"
                    style={{
                        marginTop: '16px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-secondary)',
                        padding: '16px 32px',
                        borderRadius: '24px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '12px',
                        animationDelay: '0.4s',
                        width: 'auto',
                        alignSelf: 'center',
                        transition: 'all 0.3s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    Manage Squad List
                </button>
            </div>
        </div>
    );
};

export default Home;
