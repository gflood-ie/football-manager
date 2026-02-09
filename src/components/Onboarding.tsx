
import React, { useState } from 'react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Onboarding: React.FC = () => {
    const { user, refreshProfile } = useAuth();
    const [teamName, setTeamName] = useState('');
    const [yearBorn, setYearBorn] = useState(new Date().getFullYear().toString());
    const [crestUrl, setCrestUrl] = useState(''); // Could implement file upload later
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleOnboarding = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            // 1. Create Team Document
            const teamRef = doc(collection(db, 'teams'));
            const teamData = {
                name: teamName,
                yearBorn,
                crestUrl,
                managerId: user.uid,
                createdAt: new Date().toISOString()
            };

            // NOTE: I need to import collection.

            await setDoc(teamRef, teamData);

            // 2. Update User Profile with teamId
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                teamId: teamRef.id
            });

            // 3. Refresh Context and Redirect
            await refreshProfile();
            navigate('/');
        } catch (error) {
            console.error("Error creating team:", error);
            alert("Failed to create team.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--background)' }}>
            <div className="glass-panel" style={{ padding: '40px', maxWidth: '500px', width: '100%' }}>
                <h1 style={{ color: '#fff', marginBottom: '8px', textAlign: 'center' }}>Welcome, Manager</h1>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '32px' }}>Let's set up your team.</p>

                <form onSubmit={handleOnboarding} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ color: '#fff', marginBottom: '8px', display: 'block' }}>Team Name</label>
                        <input
                            className="form-control"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="e.g. Celtic FC"
                            required
                        />
                    </div>

                    <div>
                        <label style={{ color: '#fff', marginBottom: '8px', display: 'block' }}>Year Group / Born</label>
                        <input
                            type="number"
                            className="form-control"
                            value={yearBorn}
                            onChange={(e) => setYearBorn(e.target.value)}
                            placeholder="e.g. 2011"
                            required
                        />
                    </div>

                    <div>
                        <label style={{ color: '#fff', marginBottom: '8px', display: 'block' }}>Crest URL (Optional)</label>
                        <input
                            className="form-control"
                            value={crestUrl}
                            onChange={(e) => setCrestUrl(e.target.value)}
                            placeholder="https://..."
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '16px', marginTop: '16px' }}>
                        {loading ? 'Setting up...' : 'Create Team'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Forgot the import in the function body, adding here for the write to file tool but will fix via imports
import { collection } from 'firebase/firestore';

export default Onboarding;
