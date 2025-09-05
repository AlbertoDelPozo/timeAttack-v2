import React, { createContext, useContext, useEffect, useState, type FC } from 'react';

interface ThemeContextType {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }

    return context;
}

export const ThemeProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || savedTheme === 'light') {
            return savedTheme;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        const html = document.documentElement;
        if (theme === 'dark') {
            html.classList.add('theme-dark');
            html.classList.remove('theme-light');
        } else {
            html.classList.add('theme-light');
            html.classList.remove('theme-dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
    };

    return (
        <ThemeContext.Provider value={ { theme, toggleTheme } }>
            {children}
        </ThemeContext.Provider>
    );
};