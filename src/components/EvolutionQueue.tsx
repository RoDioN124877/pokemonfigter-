import React, { useEffect, useState } from 'react';
import { useProgressStore } from '../store/progressStore';
import { fetchPokemonsByIds } from '../services/ApiService';

interface Props {
    onDone: () => void;
}

const EvolutionQueue: React.FC<Props> = ({ onDone }) => {
    const { pendingEvolutions, confirmEvolution, clearPendingEvolutions } = useProgressStore();
    const [evolving, setEvolving] = useState(false);

    useEffect(() => {
        if (pendingEvolutions.length === 0) onDone();
    }, [pendingEvolutions.length]); // eslint-disable-line react-hooks/exhaustive-deps

    if (pendingEvolutions.length === 0) return null;

    const first = pendingEvolutions[0];

    const handleEvolve = async () => {
        setEvolving(true);
        const poks = await fetchPokemonsByIds([first.toId]);
        if (poks[0]) confirmEvolution(first.uuid, poks[0]);
        setEvolving(false);
    };

    const handleSkip = () => clearPendingEvolutions();

    return (
        <div style={{
            background: 'rgba(79,70,229,0.15)', border: '2px solid #7c3aed',
            borderRadius: 12, padding: 16, marginBottom: 16, textAlign: 'center',
        }}>
            <div style={{ fontSize: 32, marginBottom: 4 }}>✨</div>
            <div style={{ color: '#c4b5fd', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                {first.fromName.toUpperCase()} хочет эволюционировать!
            </div>
            <div style={{ color: '#7c3aed', fontSize: 11, marginBottom: 12 }}>
                → {first.toName.toUpperCase()}
            </div>
            {pendingEvolutions.length > 1 && (
                <div style={{ color: '#64748b', fontSize: 10, marginBottom: 8 }}>
                    (ещё {pendingEvolutions.length - 1} эволюций в очереди)
                </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button className="exe" onClick={handleSkip} style={{ fontSize: 11 }}>Пропустить всё</button>
                <button className="menu-button" onClick={handleEvolve} disabled={evolving} style={{ fontSize: 11 }}>
                    {evolving ? '⏳...' : '✨ ЭВОЛЮЦИЯ!'}
                </button>
            </div>
        </div>
    );
};

export default EvolutionQueue;
