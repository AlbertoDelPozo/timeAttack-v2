import { useState, useEffect, type FC } from 'react';
import { Button } from 'react-bootstrap';

const DarkModeButton: FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Comprobar la preferencia del sistema o el almacenamiento local
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }
    // Si no hay preferencia, usar el modo del sistema
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // useEffect para aplicar el tema
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = (): void => {
    setTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <Button 
      variant={theme === 'dark' ? "light" : "dark"} 
      onClick={toggleTheme}
    >
      {theme === 'dark' ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
    </Button>
  );
};

export default DarkModeButton;