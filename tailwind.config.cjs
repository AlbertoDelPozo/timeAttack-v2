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
      colors: {
        brand: {
          50:  '#fff0f5',
          100: '#ffd6e7',
          200: '#ffb0cc',
          300: '#f87aaa',
          400: '#e84a87',
          500: '#d9215e',
          600: '#c20e4d', // rgb(194 14 77) — primary brand color
          700: '#9c0b3d',
          800: '#7b0930',
          900: '#5e0826',
          950: '#350415',
        },
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
              50: "#fff0f5",
              100: "#ffd6e7",
              200: "#ffb0cc",
              300: "#f87aaa",
              400: "#e84a87",
              500: "#d9215e",
              600: "#c20e4d",
              700: "#9c0b3d",
              800: "#7b0930",
              900: "#5e0826",
              DEFAULT: "#c20e4d", // brand-600 = rgb(194 14 77)
              foreground: "#ffffff",
            },
            focus: "#d9215e", // brand-500
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
    require("daisyui"),
  ],
};
