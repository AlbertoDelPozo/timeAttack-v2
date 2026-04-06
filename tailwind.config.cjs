const { nextui } = require("@nextui-org/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  darkMode: "class",
  plugins: [
    nextui({
      themes: {
        dark: {
          colors: {
            background: "#09090b", // zinc-950
            foreground: "#f4f4f5", // zinc-100
            primary: {
              50: "#fff1f2",
              100: "#ffe4e6",
              200: "#fecdd3",
              300: "#fda4af",
              400: "#fb7185",
              500: "#f43f5e",
              600: "#e11d48",
              700: "#be123c",
              800: "#9f1239",
              900: "#881337",
              DEFAULT: "#dc2626", // red-600
              foreground: "#ffffff",
            },
            focus: "#ef4444", // red-500
            default: {
              DEFAULT: "#3f3f46",
              foreground: "#f4f4f5",
            },
            secondary: {
              DEFAULT: "#27272a",
              foreground: "#f4f4f5",
            },
          },
        },
      },
      addCommonColors: true,
    }),
  ],
};
