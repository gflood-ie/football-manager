
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface ConfirmationOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info';
}

interface ConfirmationContextType {
    confirm: (options: ConfirmationOptions | string) => Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export const useConfirm = () => {
    const context = useContext(ConfirmationContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmationProvider');
    }
    return context;
};

export const ConfirmationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmationOptions>({ message: '' });
    const resolver = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback((opts: ConfirmationOptions | string) => {
        const finalOptions = typeof opts === 'string' ? { message: opts } : opts;
        setOptions(finalOptions);
        setIsOpen(true);
        return new Promise<boolean>((resolve) => {
            resolver.current = resolve;
        });
    }, []);

    const handleConfirm = () => {
        setIsOpen(false);
        if (resolver.current) resolver.current(true);
    };

    const handleCancel = () => {
        setIsOpen(false);
        if (resolver.current) resolver.current(false);
    };

    return (
        <ConfirmationContext.Provider value={{ confirm }}>
            {children}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(5px)',
                    zIndex: 10000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }} className="animate-fade-in">
                    <div className="glass-panel" style={{
                        maxWidth: '400px',
                        width: '100%',
                        padding: '24px',
                        border: '1px solid var(--glass-border)',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '1.25rem', color: '#fff' }}>
                            {options.title || 'Confirm Action'}
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
                            {options.message}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                onClick={handleCancel}
                                className="btn-secondary"
                                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                            >
                                {options.cancelText || 'Cancel'}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={options.type === 'danger' ? 'btn-danger' : 'btn-primary'}
                                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                            >
                                {options.confirmText || 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmationContext.Provider>
    );
};
