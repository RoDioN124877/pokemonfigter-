// src/components/Menu.tsx

import React from 'react';

interface MenuProps {
    setMode: (size: 1 | 3) => void;
}

const Menu: React.FC<MenuProps> = ({ setMode }) => {
    return (
        <section className="main-menu">
            <h1>Выберите режим игры</h1>
            <button className="menu-button" onClick={() => setMode(1)}>
                1 vs 1 (Одиночный Бой)
            </button>
            <button className="menu-button" onClick={() => setMode(3)}>
                3 vs 3 (Команда на Команду)
            </button>
            <button className="menu-button" disabled>
                Сюжетный режим (Скоро)
            </button>
        </section>
    );
};

export default Menu;