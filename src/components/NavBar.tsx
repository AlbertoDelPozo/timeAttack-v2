import React from 'react';

/**
 * @param {{ onNewRally: () => void }} props
 */
const Navbar = ({ onNewRally }: { onNewRally: () => void; }) => {

    return (
        <nav className="bg-gray-800 shadow-2xl p-4 sticky top-0 z-50">
            <div className="flex items-center space-x-4">
                <button
                    onClick={onNewRally}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-[1.02] shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-opacity-50"
                >
                    Nuevo Rally
                </button>
            </div>
        </nav>
    );
};

export default Navbar;