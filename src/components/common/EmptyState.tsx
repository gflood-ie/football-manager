import React from 'react';

interface EmptyStateProps {
    title: string;
    message?: string;
    icon?: React.ReactNode;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, message, icon, action }) => {
    return (
        <div className="flex-col animate-fade-in" style={{
            alignItems: 'center',
            textAlign: 'center',
            padding: '60px 24px',
            color: 'var(--text-secondary)',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '24px',
            border: '1px dashed rgba(255,255,255,0.1)',
            margin: '20px 0'
        }}>
            {icon && (
                <div className="flex-center" style={{
                    fontSize: '3rem',
                    marginBottom: '24px',
                    width: '80px',
                    height: '80px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '50%',
                    color: 'var(--celtic-gold)'
                }}>
                    {icon}
                </div>
            )}
            <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '1.3rem', fontWeight: 600 }}>{title}</h3>
            {message && <p style={{ maxWidth: '320px', margin: '0 0 32px 0', lineHeight: 1.6, fontSize: '0.95rem' }}>{message}</p>}

            {action && (
                <button
                    onClick={action.onClick}
                    className="btn-primary"
                    style={{ width: 'auto', padding: '12px 32px', fontSize: '1rem' }}
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};
