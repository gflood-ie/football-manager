import React, { useEffect, useState } from 'react';

interface SplashProps {
    onFinish: () => void;
}

const Splash: React.FC<SplashProps> = ({ onFinish }) => {
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        // Play audio if available (must be triggered by user interaction usually, but let's try)
        const audio = new Audio('/intro.mp3');
        audio.play().catch(e => console.log("Audio play failed (user interaction needed first):", e));

        const timer1 = setTimeout(() => {
            setFadeOut(true);
        }, 2500);

        const timer2 = setTimeout(() => {
            onFinish();
        }, 3000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            audio.pause();
        };
    }, [onFinish]);

    return (
        <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
            <div className="splash-content">
                <div style={{ fontSize: '80px', marginBottom: '20px', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }}>⚽</div>
            </div>
        </div>
    );
};

export default Splash;
