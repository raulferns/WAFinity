/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./src/static/**/*.{html,js}',
	],
	theme: {
		extend: {
			colors: {
				cyber: {
					bg: '#0b0c10',
					'bg-secondary': '#111218',
					card: '#15161e',
					elevated: '#1c1d27',
					accent: '#f05627',
					'accent-hover': '#ff6838',
					purple: '#8b5cf6',
					success: '#10b981',
					danger: '#ef4444',
					warning: '#f59e0b',
				},
			},
			fontFamily: {
				sans: ['Outfit', 'sans-serif'],
				mono: ['JetBrains Mono', 'monospace'],
			},
			transitionTimingFunction: {
				'spring-bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
				'spring-smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
				'spring-press': 'cubic-bezier(0.4, 0, 0.2, 1)',
			},
		},
	},
	plugins: [],
};
