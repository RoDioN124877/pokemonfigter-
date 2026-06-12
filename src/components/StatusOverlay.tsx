import React from 'react';
import type { StatusName } from '../types/Pokemon';

interface Props {
    statuses: Partial<Record<StatusName, boolean>>;
    teamNum: 1 | 2;
}

const Sparks: React.FC<{ count: number; cls: string }> = ({ count, cls }) => (
    <>
        {Array.from({ length: count }, (_, i) => (
            <span
                key={i}
                className={`status-particle ${cls}`}
                style={{
                    left: `${8 + i * (84 / (count - 1))}%`,
                    animationDelay: `${(i * 0.18).toFixed(2)}s`,
                    animationDuration: `${0.7 + (i % 3) * 0.25}s`,
                }}
            />
        ))}
    </>
);

const StatusOverlay: React.FC<Props> = ({ statuses, teamNum }) => {
    const active = Object.entries(statuses)
        .filter(([, v]) => v)
        .map(([k]) => k as StatusName);

    if (active.length === 0) return null;

    const flip = teamNum === 1;

    return (
        <div className={`status-overlay ${flip ? 'flip' : ''}`}>

            {statuses.burn && (
                <div className="status-layer status-burn">
                    <Sparks count={6} cls="spark-fire" />
                    <div className="status-glow glow-fire" />
                </div>
            )}

            {statuses.poison && (
                <div className="status-layer status-poison">
                    <Sparks count={5} cls="spark-poison" />
                    <div className="status-glow glow-poison" />
                </div>
            )}

            {statuses.paralysis && (
                <div className="status-layer status-paralysis">
                    {Array.from({ length: 4 }, (_, i) => (
                        <span
                            key={i}
                            className="bolt"
                            style={{
                                left: `${15 + i * 22}%`,
                                top: `${20 + (i % 2) * 30}%`,
                                animationDelay: `${i * 0.22}s`,
                            }}
                        >⚡</span>
                    ))}
                    <div className="status-glow glow-paralysis" />
                </div>
            )}

            {(statuses.slow || statuses.freeze) && (
                <div className="status-layer status-freeze">
                    <Sparks count={5} cls="spark-ice" />
                    <div className="status-glow glow-freeze" />
                    <div className="freeze-overlay" />
                </div>
            )}

            {statuses.sleep && (
                <div className="status-layer status-sleep">
                    {['💤', '💤', '💤'].map((z, i) => (
                        <span
                            key={i}
                            className="sleep-z"
                            style={{
                                left: `${20 + i * 25}%`,
                                animationDelay: `${i * 0.5}s`,
                                animationDuration: '1.8s',
                            }}
                        >{z}</span>
                    ))}
                    <div className="status-glow glow-sleep" />
                </div>
            )}

            {statuses.drenched && (
                <div className="status-layer status-drenched">
                    {Array.from({ length: 5 }, (_, i) => (
                        <span
                            key={i}
                            className="drop"
                            style={{
                                left: `${10 + i * 18}%`,
                                animationDelay: `${i * 0.2}s`,
                            }}
                        >💧</span>
                    ))}
                </div>
            )}

            {statuses.confusion && (
                <div className="status-layer status-confusion">
                    {['⭐', '💫', '✨'].map((star, i) => (
                        <span
                            key={i}
                            className="orbit-star"
                            style={{ animationDelay: `${i * 0.33}s` }}
                        >{star}</span>
                    ))}
                </div>
            )}

        </div>
    );
};

export default StatusOverlay;
