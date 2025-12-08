// src/components/TurnQueueDisplay.tsx
import React from 'react';
import type { TurnQueueItem } from '../types/Pokemon';

interface TurnQueueDisplayProps {
    queue: TurnQueueItem[];
}

const TurnQueueDisplay: React.FC<TurnQueueDisplayProps> = ({ queue }) => {
    if (queue.length === 0) return null;

    return (
        <div className="turn-queue">
            <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}>Очередь Хода</h3>
            <div className="queue-list">
                {queue.slice(0, 5).map(item => ( 
                    <div 
                        key={item.key} 
                        className={`queue-slot ${item.isCurrent ? 'active' : ''}`}
                        title={item.name}
                    >
                        {/* Используем div для спрайта, чтобы стилизовать границу и фон */}
                        <div className="queue-slot-img" style={{ backgroundImage: `url(${item.img})` }}></div>
                        {item.isCurrent && <span className="current-indicator">▶</span>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TurnQueueDisplay;