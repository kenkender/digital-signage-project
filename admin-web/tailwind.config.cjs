/** @type {import('tailwindcss').Config} */
module.exports = {
content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
theme: {
extend: {
colors: {
primary: '#0f172a', // navy
accent: '#e11d48', // red
warning: '#eab308' // yellow
}
}
},
plugins: []
};