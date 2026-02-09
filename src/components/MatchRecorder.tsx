import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface Player {
    id: string;
    name: string;
    position?: string;
    number?: number;
}

interface MatchRecorderProps {
    onBack: () => void;
}

const MatchRecorder: React.FC<MatchRecorderProps> = ({ onBack }) => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [opposition, setOpposition] = useState('');
    const [competition, setCompetition] = useState('League');
    const [squad, setSquad] = useState<Record<string, boolean>>({});
    const [scorers, setScorers] = useState<Record<string, number>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchPlayers = async () => {
            const q = query(collection(db, "players"), orderBy("name"));
            const querySnapshot = await getDocs(q);
            const fetched: Player[] = [];
            querySnapshot.forEach(doc => fetched.push({ id: doc.id, ...doc.data() } as Player));
            setPlayers(fetched);
        };
        fetchPlayers();
    }, []);

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

    const saveMatch = async () => {
        if (!opposition) {
            alert("Please enter opposition name");
            return;
        }
        setSaving(true);
        try {
            await addDoc(collection(db, "matches"), {
                date: selectedDate,
                opposition,
                competition,
                squad: Object.keys(squad).filter(id => squad[id]),
                scorers,
                createdAt: new Date().toISOString()
            });
            alert("Match recorded successfully!");
            onBack();
        } catch (error) {
            console.error("Error saving match:", error);
            alert("Error saving match");
        }
        setSaving(false);
    };

    return (
        <div style={{ padding: '16px 16px 100px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                    onClick={onBack}
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    ←
                </button>
                <h1 style={{ fontSize: '1.5rem', color: '#fff', margin: 0 }}>Match Day</h1>
            </div>

            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', zIndex: 1 }}>
                <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Date</label>
                    <input type="date" className="form-control" style={{ width: '100%', fontSize: '1.1rem', padding: '16px', colorScheme: 'dark', background: '#222' }} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                </div>
                <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Opposition</label>
                    <input className="form-control" style={{ width: '100%', fontSize: '1.1rem', padding: '16px', background: '#222' }} placeholder="e.g. Bohemians" value={opposition} onChange={e => setOpposition(e.target.value)} />
                </div>
                <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Competition</label>
                    <select className="form-control" style={{ width: '100%', fontSize: '1.1rem', padding: '16px', background: '#222' }} value={competition} onChange={e => setCompetition(e.target.value)}>
                        <option>League</option>
                        <option>Cup</option>
                        <option>Friendly</option>
                    </select>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--glass-border)' }}>
                    <h3 style={{ margin: 0, color: 'var(--celtic-gold)' }}>Squad Selection</h3>
                </div>

                {players.map(player => (
                    <div key={player.id} style={{
                        padding: '16px',
                        borderBottom: '1px solid var(--glass-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: squad[player.id] ? 'rgba(0,158,96,0.1)' : 'transparent'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }} onClick={() => togglePlayer(player.id)}>
                            <div style={{
                                width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--text-secondary)',
                                background: squad[player.id] ? 'var(--celtic-green)' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {squad[player.id] && <span style={{ color: '#000', fontSize: '14px', fontWeight: 'bold' }}>✓</span>}
                            </div>
                            <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>{player.name}</span>
                        </div>

                        {squad[player.id] && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <button
                                    onClick={() => updateGoals(player.id, -1)}
                                    style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#333', border: 'none', color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >-</button>
                                <span style={{ width: '24px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>{scorers[player.id] || 0}</span>
                                <button
                                    onClick={() => updateGoals(player.id, 1)}
                                    style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--celtic-gold)', border: 'none', color: '#000', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >+</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px', background: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent)', zIndex: 100 }}>
                <button
                    className="btn-primary"
                    style={{ width: '100%', padding: '16px', fontSize: '1.2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                    onClick={saveMatch}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save Match Report'}
                </button>
            </div>
        </div>
    );
};

export default MatchRecorder;
