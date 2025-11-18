/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}", // Main App file
    "./app/**/*.{js,jsx,ts,tsx}", // If you have app directory
    "./components/**/*.{js,jsx,ts,tsx}", // Components folder
    "./screens/**/*.{js,jsx,ts,tsx}", // If you use a screens folder
  ],

  theme: {
    extend: {},
  },
  plugins: [],
};
