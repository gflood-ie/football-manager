
import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { collection, getDocs, query, writeBatch, doc, deleteDoc, updateDoc, addDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

interface Player {
    id: string;
    name: string;
    address: string;
    dob: string;
    email: string;
    contactNumber: string;
}

const PlayerManager: React.FC = () => {
    const { userProfile } = useAuth();

    // Helper to simulate navigation or just go back to home
    const goBack = () => {
        window.location.href = '/';
    };

    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
    const [adding, setAdding] = useState(false);
    const [newPlayerName, setNewPlayerName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch players from Firestore
    useEffect(() => {
        if (userProfile?.teamId) {
            fetchPlayers();
        }
    }, [userProfile]);

    const fetchPlayers = async () => {
        if (!userProfile?.teamId) return;
        setLoading(true);
        try {
            const q = query(collection(db, "players"), where("teamId", "==", userProfile?.teamId));
            const querySnapshot = await getDocs(q);
            const fetchedPlayers: Player[] = [];
            querySnapshot.forEach((doc) => {
                fetchedPlayers.push({ id: doc.id, ...doc.data() } as Player);
            });
            fetchedPlayers.sort((a, b) => a.name.localeCompare(b.name));
            setPlayers(fetchedPlayers);
        } catch (error) {
            console.error("Error fetching players: ", error);
        }
        setLoading(false);
    };

    const deletePlayer = async (id: string) => {
        if (!confirm('Are you sure you want to delete this player?')) return;

        try {
            await deleteDoc(doc(db, "players", id));
            setPlayers(players.filter(p => p.id !== id));
        } catch (error) {
            console.error("Error deleting player", error);
            alert("Error deleting player");
        }
    };

    const handleEditClick = (player: Player) => {
        setEditingPlayer({ ...player });
    };

    const handleSaveEdit = async () => {
        if (!editingPlayer || !editingPlayer.id) return;

        try {
            const playerRef = doc(db, "players", editingPlayer.id);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...dataToUpdate } = editingPlayer;
            await updateDoc(playerRef, dataToUpdate as any);

            setPlayers(players.map(p => p.id === editingPlayer.id ? editingPlayer : p));
            setEditingPlayer(null);
        } catch (error) {
            console.error("Error updating player", error);
            alert("Error updating player");
        }
    };

    const handleAddPlayer = async () => {
        if (!newPlayerName.trim()) {
            alert("Please enter a player name");
            return;
        }

        try {
            await addDoc(collection(db, "players"), {
                name: newPlayerName,
                address: '',
                dob: '',
                email: '',
                contactNumber: '',
                active: true,
                teamId: userProfile?.teamId,
                createdAt: new Date().toISOString()
            });
            setNewPlayerName('');
            setAdding(false);
            fetchPlayers();
            alert("Player added!");
        } catch (error) {
            console.error("Error adding player:", error);
            alert("Error adding player");
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                await processImportData(data);
            } catch (error) {
                console.error("Error parsing file:", error);
                alert("Error parsing file. Please check the console for details.");
            } finally {
                setImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsBinaryString(file);
    };

    const processImportData = async (data: any[]) => {
        try {
            const batch = writeBatch(db);
            let count = 0;

            for (const row of data) {
                // Map Excel columns to our schema based on User's screenshot
                // "Player Name", "Address", "Date of Birth", "Contact Email"
                const player: any = {
                    name: row['Player Name'] || row['Name'] || 'Unknown',
                    address: row['Address'] || '',
                    dob: row['Date of Birth'] || row['DOB'] || '',
                    email: row['Contact Email'] || row['Email'] || '',
                    contactNumber: row['Contact Number'] || row['Mobile'] || row['Phone'] || '',
                    active: true,
                    teamId: userProfile?.teamId,
                    createdAt: new Date().toISOString()
                };

                // Create a reference for a new document
                const docRef = doc(collection(db, "players"));
                batch.set(docRef, player);
                count++;
            }

            await batch.commit();
            alert(`Successfully imported ${count} players!`);
            fetchPlayers(); // Refresh list
        } catch (error) {
            console.error("Error saving to Firestore:", error);
            alert("Error saving data to database. Check console.");
        }
    };

    return (
        <div style={{ flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div className="header-glass animate-fade-in">
                <div className="flex-center gap-3">
                    <button onClick={goBack} className="icon-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <h1 className="text-gradient-gold" style={{ fontSize: '1.5rem', margin: 0 }}>Squad List</h1>
                </div>
            </div>

            <div className="page-container animate-fade-in" style={{ paddingBottom: '100px' }}>

                {/* Actions Area */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'start' }}>
                    {/* Add Player Input Group */}
                    <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                        {adding ? (
                            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                                <input
                                    className="form-control"
                                    style={{ flex: 1, height: '52px' }}
                                    placeholder="Player Name"
                                    value={newPlayerName}
                                    onChange={e => setNewPlayerName(e.target.value)}
                                    autoFocus
                                    onKeyDown={e => e.key === 'Enter' && handleAddPlayer()}
                                />
                                <button
                                    onClick={handleAddPlayer}
                                    className="btn-primary"
                                    style={{ width: '52px', height: '52px', padding: 0, borderRadius: '16px' }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                </button>
                                <button
                                    onClick={() => setAdding(false)}
                                    className="btn-secondary"
                                    style={{ width: '52px', height: '52px', padding: 0, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </button>
                            </div>
                        ) : (
                            <button
                                className="btn-primary"
                                onClick={() => setAdding(true)}
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                Add Player
                            </button>
                        )}
                    </div>

                    {/* Secondary Actions (Icons) */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={importing}
                            className="glass-panel"
                            style={{
                                width: '52px', height: '52px',
                                padding: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'var(--celtic-gold)',
                                borderRadius: '16px',
                            }}
                            title="Import Excel"
                        >
                            {importing ? (
                                <span style={{ fontSize: '1rem' }}>...</span>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                            )}
                        </button>
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                        />

                        <button
                            className="glass-panel"
                            onClick={async () => {
                                const email = prompt("Enter Assistant Email:");
                                if (email) {
                                    try {
                                        const docRef = await addDoc(collection(db, 'invitations'), {
                                            email,
                                            role: 'assistant',
                                            teamId: userProfile?.teamId,
                                            used: false,
                                            createdAt: new Date().toISOString()
                                        });
                                        alert(`Invitation created for ${email}. Code: ${docRef.id}`);
                                    } catch (err) {
                                        console.error(err);
                                        alert("Failed to create invitation");
                                    }
                                }
                            }}
                            style={{
                                width: '52px', height: '52px',
                                padding: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'var(--celtic-gold)',
                                borderRadius: '16px',
                            }}
                            title="Invite Assistant"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Friendly Cards */}
                <div className="flex-col gap-4">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.85rem' }}>Total Players</span>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.2rem' }}>{players.length}</span>
                    </div>

                    {loading ? (
                        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '32px' }}>Loading squad...</div>
                    ) : (
                        players.map((player) => (
                            <div key={player.id} className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="flex-col" style={{ gap: '6px' }}>
                                    <div style={{ color: '#fff', fontWeight: 600, fontSize: '1.1rem' }}>{player.name}</div>
                                    <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>{player.dob || ''}</div>
                                </div>

                                <div className="flex-center gap-3">
                                    <button
                                        onClick={() => handleEditClick(player)}
                                        className="icon-btn"
                                        style={{ width: '40px', height: '40px', color: 'var(--celtic-gold)' }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                    </button>
                                    <button
                                        onClick={() => deletePlayer(player.id)}
                                        className="icon-btn"
                                        style={{ width: '40px', height: '40px', color: 'var(--danger)', borderColor: 'rgba(255,0,0,0.1)' }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {editingPlayer && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="glass-panel animate-fade-in" style={{ width: '500px', maxWidth: '90%', padding: '32px', border: '1px solid var(--glass-border)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                        <h2 className="text-gradient-gold" style={{ marginBottom: '24px', fontSize: '1.8rem' }}>Edit Player</h2>

                        <div className="flex-col gap-4">
                            <div>
                                <label className="form-label">Name</label>
                                <input
                                    className="form-control"
                                    value={editingPlayer.name}
                                    onChange={e => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="form-label">Contact Number</label>
                                <input
                                    className="form-control"
                                    value={editingPlayer.contactNumber || ''}
                                    onChange={e => setEditingPlayer({ ...editingPlayer, contactNumber: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="form-label">DOB</label>
                                <input
                                    className="form-control"
                                    value={editingPlayer.dob}
                                    onChange={e => setEditingPlayer({ ...editingPlayer, dob: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="form-label">Address</label>
                                <input
                                    className="form-control"
                                    value={editingPlayer.address}
                                    onChange={e => setEditingPlayer({ ...editingPlayer, address: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="form-label">Contact Email</label>
                                <input
                                    className="form-control"
                                    value={editingPlayer.email}
                                    onChange={e => setEditingPlayer({ ...editingPlayer, email: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px' }}>
                                <button
                                    onClick={() => setEditingPlayer(null)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={handleSaveEdit}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default PlayerManager;
