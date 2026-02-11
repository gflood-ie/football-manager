
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmationContext';
import { useNavigate } from 'react-router-dom';
import { SkeletonCard } from './common/Skeleton';
import { EmptyState } from './common/EmptyState';

interface Player {
    id: string;
    name: string;
    address?: string;
    dob?: string;
    email?: string;
    contactNumber?: string;
}

interface TrainingSession {
    id: string;
    date: string;
    location: string;
    attendance: string[];
    createdAt: string;
}

const TrainingManager: React.FC = () => {
    // Views: 
    // - 'list': show recent sessions, buttons for new session / stats
    // - 'record': add/edit session
    // - 'stats': leaderboard of attendance
    const [view, setView] = useState<'list' | 'record' | 'stats'>('list');
    const { userProfile } = useAuth();
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const navigate = useNavigate();

    // Helper for navigation
    const goBack = () => {
        navigate('/');
    };

    const [players, setPlayers] = useState<Player[]>([]);
    const [sessions, setSessions] = useState<TrainingSession[]>([]);
    const [loading, setLoading] = useState(true);

    // Record/Edit Logic
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedLocation, setSelectedLocation] = useState<string>('Aura');
    const [attendance, setAttendance] = useState<Record<string, boolean>>({});
    const [saving, setSaving] = useState(false);

    const locations = ['Aura', 'Tully Park', '+ Add Location'];

    useEffect(() => {
        if (userProfile?.teamId) {
            fetchData();
        }
    }, [userProfile]);

    const fetchData = async () => {
        if (!userProfile?.teamId) return;
        setLoading(true);
        try {
            // Fetch Players
            const playersQ = query(collection(db, "players"), where("teamId", "==", userProfile.teamId));
            const playersSnap = await getDocs(playersQ);
            const fetchedPlayers: Player[] = [];
            playersSnap.forEach(doc => fetchedPlayers.push({ id: doc.id, ...doc.data() } as Player));
            fetchedPlayers.sort((a, b) => a.name.localeCompare(b.name));
            setPlayers(fetchedPlayers);

            // Fetch Sessions
            const sessionsQ = query(collection(db, "training_sessions"), where("teamId", "==", userProfile.teamId));
            const sessionsSnap = await getDocs(sessionsQ);
            const fetchedSessions: TrainingSession[] = [];
            sessionsSnap.forEach(doc => fetchedSessions.push({ id: doc.id, ...doc.data() } as TrainingSession));
            fetchedSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setSessions(fetchedSessions);

        } catch (error) {
            console.error("Error fetching data:", error);
        }
        setLoading(false);
    };

    const handleNewSession = () => {
        setSelectedSessionId(null);
        setSelectedDate(new Date().toISOString().split('T')[0]);
        setSelectedLocation('Aura');
        setAttendance({});
        setView('record');
    };

    const handleEditSession = (session: TrainingSession) => {
        setSelectedSessionId(session.id);
        setSelectedDate(session.date);
        setSelectedLocation(session.location);

        const attMap: Record<string, boolean> = {};
        session.attendance.forEach(id => attMap[id] = true);
        setAttendance(attMap);

        setView('record');
    };

    const deleteSession = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!await confirm({
            title: 'Delete Session?',
            message: 'Are you sure you want to delete this training session?',
            type: 'danger',
            confirmText: 'Delete'
        })) return;

        try {
            await deleteDoc(doc(db, "training_sessions", id));
            setSessions(sessions.filter(s => s.id !== id));
            showToast('Session deleted', 'success');
        } catch (error) {
            console.error("Error deleting session:", error);
            showToast("Error deleting session", 'error');
        }
    };

    const saveSession = async () => {
        setSaving(true);
        try {
            const sessionData = {
                date: selectedDate,
                location: selectedLocation,
                attendance: Object.keys(attendance).filter(id => attendance[id]),
                updatedAt: new Date().toISOString()
            };

            if (selectedSessionId) {
                await updateDoc(doc(db, "training_sessions", selectedSessionId), sessionData);
            } else {
                await addDoc(collection(db, "training_sessions"), {
                    ...sessionData,
                    teamId: userProfile?.teamId,
                    createdAt: new Date().toISOString()
                });
            }

            fetchData();
            setView('list');
            showToast('Session saved successfully', 'success');
        } catch (error) {
            console.error("Error saving session:", error);
            showToast("Error saving session", 'error');
        }
        setSaving(false);
    };

    const toggleAttendance = (playerId: string) => {
        setAttendance(prev => ({
            ...prev,
            [playerId]: !prev[playerId]
        }));
    };

    // --- Stats Calculation ---
    const getAttendanceStats = () => {
        const stats: Record<string, number> = {};
        const totalSessions = sessions.length;

        sessions.forEach(session => {
            session.attendance.forEach(playerId => {
                stats[playerId] = (stats[playerId] || 0) + 1;
            });
        });

        return players.map(player => {
            const attended = stats[player.id] || 0;
            const percentage = totalSessions > 0 ? ((attended / totalSessions) * 100).toFixed(0) : '0';
            return {
                ...player,
                attended,
                totalSessions,
                percentage
            };
        }).sort((a, b) => b.attended - a.attended); // Sort by attendance high to low
    };

    // --- RENDER ---

    if (view === 'list') {
        return (
            <div className="page-container animate-fade-in">
                <div className="flex-center" style={{ justifyContent: 'space-between' }}>
                    <div className="flex-center gap-3">
                        <button onClick={goBack} className="icon-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        </button>
                        <h1 className="text-gradient-gold" style={{ fontSize: '2rem', margin: 0 }}>Training Hub</h1>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <button onClick={handleNewSession} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                        + New Session
                    </button>
                    <button onClick={() => setView('stats')} className="glass-panel" style={{ padding: '16px', fontSize: '1rem', color: 'var(--celtic-gold)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        📊 Attendance Stats
                    </button>
                </div>

                <div className="glass-panel" style={{ padding: '0' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)' }}>
                        <h3 style={{ margin: 0, color: '#fff' }}>Recent Sessions</h3>
                    </div>
                    {loading ? (
                        <div style={{ padding: '20px' }}>
                            <SkeletonCard count={3} />
                        </div>
                    ) : sessions.length === 0 ? (
                        <EmptyState
                            title="No Sessions"
                            message="Start tracking training attendance."
                            icon={<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>}
                            action={{ label: 'New Session', onClick: handleNewSession }}
                        />
                    ) : (
                        <div className="flex-col">
                            {sessions.map(session => (
                                <div
                                    key={session.id}
                                    className="active-scale"
                                    onClick={() => handleEditSession(session)}
                                    style={{
                                        padding: '20px',
                                        borderBottom: '1px solid var(--glass-border)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div className="flex-col gap-2">
                                        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>{session.date}</div>
                                        <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                                            <span style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', fontSize: '0.8rem', color: 'var(--celtic-gold)' }}>{session.location}</span>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>• {session.attendance.length} Players</span>
                                        </div>
                                    </div>
                                    <div className="flex-center gap-3">
                                        <button onClick={(e) => deleteSession(session.id, e)} className="icon-btn" style={{ width: '36px', height: '36px', color: 'var(--danger)', borderColor: 'rgba(255,0,0,0.2)' }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                        </button>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (view === 'stats') {
        const stats = getAttendanceStats();
        return (
            <div className="page-container animate-fade-in">
                <div className="flex-center" style={{ justifyContent: 'space-between' }}>
                    <div className="flex-center gap-3">
                        <button onClick={() => setView('list')} className="icon-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        </button>
                        <h1 className="text-gradient-gold" style={{ fontSize: '2rem', margin: 0 }}>Stats</h1>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '0' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', padding: '16px 20px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        <div style={{ flex: 1 }}>Player</div>
                        <div style={{ width: '80px', textAlign: 'center' }}>Sessions</div>
                        <div style={{ width: '70px', textAlign: 'center' }}>% Rate</div>
                    </div>

                    {stats.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No data available.</div>
                    ) : (
                        stats.map((stat, index) => (
                            <div key={stat.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center' }}>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <span style={{ color: 'var(--text-tertiary)', width: '24px', fontSize: '0.9rem', fontWeight: 600 }}>{index + 1}</span>
                                    <span style={{ color: '#fff', fontWeight: 500, fontSize: '1.05rem' }}>{stat.name}</span>
                                </div>
                                <div style={{ width: '80px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    <span style={{ color: '#fff', fontWeight: 700 }}>{stat.attended}</span> <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>/ {stat.totalSessions}</span>
                                </div>
                                <div style={{ width: '70px', textAlign: 'center' }}>
                                    <div style={{
                                        padding: '6px 10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold',
                                        background: Number(stat.percentage) > 75 ? 'rgba(0,158,96,0.2)' : Number(stat.percentage) > 50 ? 'rgba(255, 199, 44, 0.15)' : 'rgba(255,59,48,0.15)',
                                        color: Number(stat.percentage) > 75 ? 'var(--celtic-green)' : Number(stat.percentage) > 50 ? 'var(--celtic-gold)' : 'var(--danger)',
                                        display: 'inline-block', minWidth: '50px'
                                    }}>
                                        {stat.percentage}%
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    // Record View
    return (
        <div className="page-container animate-fade-in" style={{ paddingBottom: '100px' }}>

            <div className="flex-center" style={{ justifyContent: 'space-between' }}>
                <div className="flex-center gap-3">
                    <button onClick={() => setView('list')} className="icon-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <h1 className="text-gradient-gold" style={{ fontSize: '1.8rem', margin: 0 }}>
                        {selectedSessionId ? 'Edit Session' : 'New Session'}
                    </h1>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label className="form-label">Date</label>
                    <input
                        type="date"
                        className="form-control"
                        style={{ colorScheme: 'dark' }}
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                    />
                </div>
                <div>
                    <label className="form-label">Location</label>
                    <select
                        className="form-control"
                        value={selectedLocation}
                        onChange={e => setSelectedLocation(e.target.value)}
                    >
                        {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: 'var(--celtic-gold)' }}>Mark Attendance</h3>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '20px' }}>
                        {Object.values(attendance).filter(Boolean).length} Present
                    </span>
                </div>

                {loading ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading players...</div>
                ) : players.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No players found. Go to 'Team' tab to add players.
                    </div>
                ) : (
                    <div className="flex-col">
                        {players.map((player) => {
                            const isPresent = attendance[player.id];
                            return (
                                <div
                                    key={player.id}
                                    onClick={() => toggleAttendance(player.id)}
                                    style={{
                                        padding: '16px 20px',
                                        borderBottom: '1px solid var(--glass-border)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '20px',
                                        background: isPresent ? 'rgba(0,158,96,0.08)' : 'transparent',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{
                                        width: '28px', height: '28px', borderRadius: '50%', border: '2px solid',
                                        borderColor: isPresent ? 'var(--celtic-green)' : 'var(--text-tertiary)',
                                        background: isPresent ? 'var(--celtic-green)' : 'transparent',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                        transition: 'all 0.2s'
                                    }}>
                                        {isPresent && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 500, color: isPresent ? '#fff' : 'var(--text-secondary)', fontSize: '1.05rem', transition: 'color 0.2s' }}>{player.name}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '20px', background: 'linear-gradient(to top, rgba(0,0,0,0.95) 20%, transparent)', zIndex: 100, display: 'flex', justifyContent: 'center' }}>
                <button
                    className="btn-primary"
                    style={{ width: '100%', maxWidth: '600px', fontSize: '1.1rem' }}
                    onClick={saveSession}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save & Finish'}
                </button>
            </div>
        </div>
    );
};

export default TrainingManager;
