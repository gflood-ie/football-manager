import React from 'react';

interface SkeletonProps {
    height?: string;
    width?: string;
    count?: number;
    className?: string;
    borderRadius?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    height = '20px',
    width = '100%',
    count = 1,
    className = '',
    borderRadius = '8px'
}) => {
    return (
        <div className={`skeleton-container ${className}`} style={{ width: '100%' }}>
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className="skeleton-loader"
                    style={{
                        height,
                        width,
                        marginBottom: count > 1 ? '12px' : '0',
                        borderRadius
                    }}
                />
            ))}
        </div>
    );
};

export const SkeletonCard: React.FC<{ count?: number }> = ({ count = 1 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="glass-panel" style={{ padding: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Skeleton height="48px" width="48px" borderRadius="50%" />
                    <div style={{ flex: 1 }}>
                        <Skeleton height="20px" width="60%" />
                        <div style={{ height: '8px' }} />
                        <Skeleton height="14px" width="40%" />
                    </div>
                </div>
            ))}
        </>
    );
};
