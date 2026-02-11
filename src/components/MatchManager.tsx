
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, addDoc, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
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
}

interface Match {
    id: string;
    date: string;
    opposition: string;
    competition: string;
    squad: string[];
    scorers: Record<string, number>;
    opponentScore?: number;
}

const MatchManager: React.FC = () => {
    const [view, setView] = useState<'list' | 'record' | 'edit' | 'scorers'>('list');

    const { userProfile } = useAuth();
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const navigate = useNavigate();

    const [matches, setMatches] = useState<Match[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(false);

    // Edit/Record State
    const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [opposition, setOpposition] = useState('');
    const [competition, setCompetition] = useState('League');
    const [squad, setSquad] = useState<Record<string, boolean>>({});
    const [scorers, setScorers] = useState<Record<string, number>>({});
    const [opponentScore, setOpponentScore] = useState<string | number>('');
    const [saving, setSaving] = useState(false);

    // Custom Competition State
    const [showCustomCompetition, setShowCustomCompetition] = useState(false);
    const defaultCompetitions = ['League', 'Cup', 'Friendly'];

    useEffect(() => {
        if (userProfile?.teamId) {
            fetchData();
        }
    }, [userProfile]);

    const fetchData = async () => {
        if (!userProfile?.teamId) return;
        setLoading(true);
        try {
            // Fetch Players - Filter by Team
            const playersQ = query(collection(db, "players"), where("teamId", "==", userProfile.teamId));
            const playersSnapshot = await getDocs(playersQ);
            const fetchedPlayers: Player[] = [];
            playersSnapshot.forEach(doc => fetchedPlayers.push({ id: doc.id, ...doc.data() } as Player));
            fetchedPlayers.sort((a, b) => a.name.localeCompare(b.name));
            setPlayers(fetchedPlayers);

            // Fetch Matches - Filter by Team
            const matchesQ = query(collection(db, "matches"), where("teamId", "==", userProfile.teamId));
            const matchesSnapshot = await getDocs(matchesQ);
            const fetchedMatches: Match[] = [];
            matchesSnapshot.forEach(doc => fetchedMatches.push({ id: doc.id, ...doc.data() } as Match));
            fetchedMatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setMatches(fetchedMatches);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
        setLoading(false);
    };

    const handleNewMatch = () => {
        setSelectedMatchId(null);
        setSelectedDate(new Date().toISOString().split('T')[0]);
        setOpposition('');
        setCompetition('League');
        setShowCustomCompetition(false);
        setSquad({});
        setScorers({});
        setOpponentScore('');
        setView('record');
    };

    const handleEditMatch = (match: Match) => {
        setSelectedMatchId(match.id);
        setSelectedDate(match.date);
        setOpposition(match.opposition);

        if (defaultCompetitions.includes(match.competition)) {
            setCompetition(match.competition);
            setShowCustomCompetition(false);
        } else {
            setCompetition(match.competition);
            setShowCustomCompetition(true);
        }

        const squadMap: Record<string, boolean> = {};
        match.squad.forEach(id => squadMap[id] = true);
        setSquad(squadMap);

        setScorers(match.scorers || {});
        setOpponentScore(match.opponentScore ?? '');
        setView('record');
    };

    const deleteMatch = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!await confirm({
            title: 'Delete Match Report?',
            message: 'Are you sure you want to delete this match report? This cannot be undone.',
            type: 'danger',
            confirmText: 'Delete'
        })) return;

        try {
            await deleteDoc(doc(db, "matches", id));
            setMatches(matches.filter(m => m.id !== id));
            showToast('Match deleted', 'success');
        } catch (error) {
            console.error("Error deleting match:", error);
            showToast('Error deleting match', 'error');
        }
    };

    const saveMatch = async () => {
        if (!opposition) {
            showToast("Please enter opposition name", 'error');
            return;
        }
        if (!competition) {
            showToast("Please enter competition name", 'error');
            return;
        }
        setSaving(true);
        try {
            const matchData = {
                date: selectedDate,
                opposition,
                competition,
                squad: Object.keys(squad).filter(id => squad[id]),
                scorers,
                opponentScore: opponentScore === '' ? 0 : Number(opponentScore),
                updatedAt: new Date().toISOString()
            };

            if (selectedMatchId) {
                await updateDoc(doc(db, "matches", selectedMatchId), matchData);
            } else {
                await addDoc(collection(db, "matches"), {
                    ...matchData,
                    teamId: userProfile?.teamId,
                    createdAt: new Date().toISOString()
                });
            }

            fetchData();
            setView('list');
            showToast('Match report saved!', 'success');
        } catch (error) {
            console.error("Error saving match:", error);
            showToast('Error saving match', 'error');
        }
        setSaving(false);
    };

    const togglePlayer = (id: string) => {
        setSquad(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const updateGoals = (id: string, delta: number) => {
        setScorers(prev => {
            const current = prev[id] || 0;
            const newVal = Math.max(0, current + delta);
            return { ...prev, [id]: newVal };
        });
    };

    const getTopScorers = () => {
        const scorerMap: Record<string, number> = {};
        matches.forEach(match => {
            if (match.scorers) {
                Object.entries(match.scorers).forEach(([playerId, goals]) => {
                    scorerMap[playerId] = (scorerMap[playerId] || 0) + goals;
                });
            }
        });

        return Object.entries(scorerMap)
            .map(([playerId, goals]) => {
                const player = players.find(p => p.id === playerId);
                return { name: player?.name || 'Unknown', goals };
            })
            .sort((a, b) => b.goals - a.goals);
    };

    // --- RENDER ---

    if (view === 'list') {
        return (
            <div className="page-container animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="flex-center gap-3">
                        <button onClick={() => navigate('/')} className="icon-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        </button>
                        <h1 className="text-gradient-gold" style={{ fontSize: '2rem', margin: 0 }}>Matches</h1>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <button onClick={handleNewMatch} className="btn-primary" style={{ padding: '16px', fontSize: '1rem', width: '100%', justifyContent: 'center' }}>+ Record Match</button>
                    <button onClick={() => setView('scorers')} className="glass-panel" style={{ padding: '16px', fontSize: '1rem', color: 'var(--celtic-gold)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        🏆 Top Scorers
                    </button>
                </div>

                <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                    <h3 style={{ margin: 0, padding: '20px', borderBottom: '1px solid var(--glass-border)', color: '#fff', fontSize: '1.2rem' }}>Recent Results</h3>
                    {loading ? (
                        <div style={{ padding: '20px' }}>
                            <SkeletonCard count={3} />
                        </div>
                    ) : matches.length === 0 ? (
                        <EmptyState
                            title="No Matches"
                            message="Record your first match result."
                            icon={<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m10 8 6 4-6 4V8z" /></svg>}
                            action={{ label: 'Record Match', onClick: handleNewMatch }}
                        />
                    ) : (
                        <div className="flex-col virtual-list">
                            {matches.map(match => {
                                const totalGoals = match.scorers ? Object.values(match.scorers).reduce((a, b) => a + b, 0) : 0;
                                return (
                                    <div
                                        key={match.id}
                                        className="animate-fade-in active-scale"
                                        style={{
                                            padding: '24px',
                                            borderBottom: '1px solid var(--glass-border)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '12px',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s'
                                        }}
                                        onClick={() => handleEditMatch(match)}
                                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: 'var(--celtic-gold)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{match.competition}</span>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{match.date}</span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                                                Vs {match.opposition}
                                            </div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--celtic-green)', background: 'rgba(0,158,96,0.1)', padding: '4px 12px', borderRadius: '8px' }}>
                                                {totalGoals} - {match.opponentScore ?? 0}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                                            <button onClick={(e) => deleteMatch(match.id, e)} className="icon-btn" style={{ width: '32px', height: '32px', color: 'var(--danger)', borderColor: 'rgba(255,0,0,0.2)' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (view === 'scorers') {
        const topScorers = getTopScorers();
        return (
            <div className="page-container animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => setView('list')} className="icon-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <h1 className="text-gradient-gold" style={{ fontSize: '1.8rem', margin: 0 }}>Top Scorers</h1>
                </div>

                <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                    {topScorers.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No goals recorded yet.</div>
                    ) : (
                        topScorers.map((scorer, index) => (
                            <div key={index} style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '50%',
                                        background: index === 0 ? 'var(--celtic-gold)' : 'rgba(255,255,255,0.1)',
                                        color: index === 0 ? '#000' : 'var(--text-secondary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                                    }}>
                                        {index + 1}
                                    </div>
                                    <span style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>{scorer.name}</span>
                                </div>
                                <span style={{ background: 'rgba(0,158,96,0.2)', color: 'var(--celtic-green)', padding: '6px 16px', borderRadius: '12px', fontWeight: '800', fontSize: '1.1rem' }}>{scorer.goals}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    // Record/Edit View
    return (
        <div className="page-container animate-fade-in" style={{ paddingBottom: '120px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                    onClick={() => setView('list')}
                    className="icon-btn"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <h1 className="text-gradient-gold" style={{ fontSize: '1.8rem', margin: 0 }}>{selectedMatchId ? 'Edit Match' : 'Match Day'}</h1>
            </div>

            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                    <label className="form-label">Date</label>
                    <input type="date" className="form-control" style={{ colorScheme: 'dark' }} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                </div>
                <div>
                    <label className="form-label">Opposition</label>
                    <input className="form-control" placeholder="e.g. Bohemians" value={opposition} onChange={e => setOpposition(e.target.value)} />
                </div>
                <div>
                    <label className="form-label">Competition</label>
                    <select
                        className="form-control"
                        style={{ marginBottom: showCustomCompetition ? '12px' : '0' }}
                        value={defaultCompetitions.includes(competition) && !showCustomCompetition ? competition : 'Other'}
                        onChange={e => {
                            if (e.target.value === 'Other') {
                                setShowCustomCompetition(true);
                                setCompetition('');
                            } else {
                                setShowCustomCompetition(false);
                                setCompetition(e.target.value);
                            }
                        }}
                    >
                        <option value="League">League</option>
                        <option value="Cup">Cup</option>
                        <option value="Friendly">Friendly</option>
                        <option value="Other">+ Add New</option>
                    </select>

                    {showCustomCompetition && (
                        <input
                            className="form-control animate-fade-in"
                            placeholder="Enter competition name..."
                            value={competition}
                            onChange={e => setCompetition(e.target.value)}
                            autoFocus
                        />
                    )}
                </div>
                <div>
                    <label className="form-label">Opponent Score</label>
                    <input
                        type="number"
                        min="0"
                        className="form-control"
                        placeholder="0"
                        value={opponentScore}
                        onChange={e => setOpponentScore(e.target.value)}
                    />
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--glass-border)' }}>
                    <h3 style={{ margin: 0, color: 'var(--celtic-gold)' }}>Squad Selection</h3>
                </div>

                {players.map(player => (
                    <div key={player.id} style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid var(--glass-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: squad[player.id] ? 'rgba(0,158,96,0.08)' : 'transparent',
                        transition: 'background 0.2s',
                        cursor: 'pointer'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }} onClick={() => togglePlayer(player.id)}>
                            <div style={{
                                width: '28px', height: '28px', borderRadius: '50%', border: '2px solid',
                                borderColor: squad[player.id] ? 'var(--celtic-green)' : 'var(--text-tertiary)',
                                background: squad[player.id] ? 'var(--celtic-green)' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s'
                            }}>
                                {squad[player.id] && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                            </div>
                            <span style={{ fontSize: '1.05rem', fontWeight: 500, color: squad[player.id] ? '#fff' : 'var(--text-secondary)' }}>{player.name}</span>
                        </div>

                        {squad[player.id] && (
                            <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '12px' }}>
                                <button
                                    onClick={() => updateGoals(player.id, -1)}
                                    className="flex-center"
                                    style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.2rem', cursor: 'pointer' }}
                                >-</button>
                                <span style={{ width: '28px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: '#fff' }}>{scorers[player.id] || 0}</span>
                                <button
                                    onClick={() => updateGoals(player.id, 1)}
                                    className="flex-center"
                                    style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--celtic-gold)', border: 'none', color: '#000', fontSize: '1.2rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                                >+</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '24px', background: 'linear-gradient(to top, rgba(0,0,0,0.95) 20%, transparent)', zIndex: 100, display: 'flex', justifyContent: 'center' }}>
                <button
                    className="btn-primary"
                    style={{ width: '100%', maxWidth: '600px', fontSize: '1.1rem', boxShadow: '0 4px 30px rgba(0,0,0,0.6)' }}
                    onClick={saveMatch}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save Match Report'}
                </button>
            </div>
        </div>
    );
};

export default MatchManager;
