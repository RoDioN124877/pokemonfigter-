import React from 'react';
import type { EquipId } from '../store/progressStore';
import { findEquip } from '../data/equipmentData';

interface Props {
    id: EquipId | string;
    size?: number;
}

const EquipIcon: React.FC<Props> = ({ id, size = 28 }) => {
    const def = findEquip(id);
    if (!def) return <span style={{ fontSize: size * 0.75, lineHeight: 1 }}>?</span>;
    return (
        <img
            src={def.sprite}
            alt={def.name}
            style={{ width: size, height: size, imageRendering: 'pixelated', display: 'inline-block', flexShrink: 0 }}
        />
    );
};

export default EquipIcon;
