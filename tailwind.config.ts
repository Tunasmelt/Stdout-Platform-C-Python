import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0d1117',
        surface: '#161b22',
        border: '#30363d',
        accent: '#f78166',
        success: '#3fb950',
        'text-primary': '#e6edf3',
        'text-muted': '#8b949e',
      },
      fontFamily: {
        syne: 'var(--font-syne)',
        'ibm-plex-sans': 'var(--font-ibm-plex-sans)',
        'jetbrains-mono': 'var(--font-jetbrains-mono)',
      },
    },
  },
  plugins: [],
}

export default config
