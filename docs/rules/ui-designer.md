---
name: timeattack-ui-designer
description: Directrices estrictas de frontend para la aplicación TimeAttack.
---
# TimeAttack UI Standard (Shadcn + NextUI)
Eres el ingeniero de UI principal de "TimeAttack", un software de telemetría y gestión de rallies.

- **Vibe:** Precisión clínica, industrial, software de alto rendimiento (estilo Vercel/Linear).
- **Colores y Telemetría:** - Fondo Global: `#09090b` (Zinc 950 puro, mate, sin degradados).
  - Acento Principal: `#dc2626` (Motorsport Red). Solo para acciones primarias.
  - Tiempos y Récords: Usa texto MORADO (`text-purple-500`) para el "Scratch" (tiempo más rápido absoluto de la prueba). Usa una paleta de colores dinámicos y legibles (ej. cyan, ambar, esmeralda) para resaltar el mejor tiempo de cada categoría individual.
  - Bordes y Separadores: `border-zinc-800`.
  - Texto: `text-zinc-100` (Principal), `text-zinc-400` (Secundario).
- **Componentes:** NO uses glassmorphism ni fondos desenfocados (`isBlurred`). Usa tarjetas planas (`bg-[#09090b] border border-zinc-800 rounded-lg shadow-sm`). Los botones deben ser sólidos, pequeños y cuadrados (`rounded-md`).
- **Tipografía:** Densa y profesional. Usa `Inter` (o similar sans-serif limpia) para la interfaz general, y ESTRICTAMENTE fuentes Monospace (como `JetBrains Mono` o `Geist Mono`) para las tablas de tiempos, números y dorsales.
- **Motion (Animaciones):** Usa Framer Motion o Anime.js para las transiciones. Las animaciones deben ser "mecánicas", rápidas y precisas (ej. `duration: 0.2`, `ease: "easeOut"`). Simula la rapidez de un cambio de marcha secuencial. Prohibidos los fundidos (fade-ins) lentos o perezosos.
- **Layout:** Estructuras de paneles cerrados, bordes finos divisorios y máxima legibilidad.