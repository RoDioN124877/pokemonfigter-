import React from 'react';
import type { WeatherType } from '../types/Pokemon';

// Full-arena weather particles, pure CSS (same approach as StatusOverlay).
const WeatherOverlay: React.FC<{ weather: WeatherType }> = ({ weather }) => {
    if (weather === 'none') return null;

    return (
        <div className={`weather-overlay weather-${weather}`}>
            {weather === 'rain' && (
                <>
                    {Array.from({ length: 18 }, (_, i) => (
                        <span
                            key={i}
                            className="rain-drop"
                            style={{
                                left: `${(i * 5.6 + (i % 3) * 2) % 100}%`,
                                animationDelay: `${(i * 0.11) % 0.9}s`,
                                animationDuration: `${0.55 + (i % 3) * 0.15}s`,
                            }}
                        />
                    ))}
                    <div className="weather-tint tint-rain" />
                </>
            )}

            {weather === 'sun' && (
                <>
                    <div className="sun-glow" />
                    {Array.from({ length: 6 }, (_, i) => (
                        <span
                            key={i}
                            className="sun-ray"
                            style={{
                                left: `${10 + i * 16}%`,
                                animationDelay: `${i * 0.4}s`,
                            }}
                        />
                    ))}
                    <div className="weather-tint tint-sun" />
                </>
            )}

            {weather === 'sand' && (
                <>
                    {Array.from({ length: 14 }, (_, i) => (
                        <span
                            key={i}
                            className="sand-grain"
                            style={{
                                top: `${(i * 7.3) % 90}%`,
                                animationDelay: `${(i * 0.13) % 1.2}s`,
                                animationDuration: `${0.9 + (i % 4) * 0.2}s`,
                            }}
                        />
                    ))}
                    <div className="weather-tint tint-sand" />
                </>
            )}
        </div>
    );
};

export default WeatherOverlay;
