import React from 'react';

export const LoadingScreen: React.FC = () => {
    return (
        <div className="flex-center animate-fade-in" style={{
            position: 'fixed', inset: 0,
            background: 'var(--bg-dark)',
            zIndex: 9999,
            flexDirection: 'column',
            gap: '24px'
        }}>
            <div style={{
                width: '64px',
                height: '64px',
                border: '4px solid rgba(255, 199, 44, 0.1)',
                borderTopColor: 'var(--celtic-gold)',
                borderRadius: '50%',
                animation: 'spin 1s cubic-bezier(0.55, 0.055, 0.675, 0.19) infinite'
            }} />

            <div style={{
                color: 'var(--celtic-green)',
                fontWeight: 700,
                letterSpacing: '0.15em',
                fontSize: '0.9rem',
                animation: 'pulse 1.5s ease-in-out infinite'
            }}>
                LOADING
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                }
            `}</style>
        </div>
    );
};
