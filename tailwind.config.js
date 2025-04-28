/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'light-blue': '#B22222',
        'peach': '#F5C2B1',
        'mint': '#A1E3D8',
        'lavender': '#E0B8D7',
        'cream': '#E9967A',
        'pastel-pink': '#F7B7D4',
        'light-gray': '#D3D3D3',
        'lavender-blue': '#E2D7F0',
      },
      fontFamily: {
        thSarabun: ['THSarabunNew', 'sans-serif'],
        FontNoto: ['Noto Sans Thai', 'sans-serif'],
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: "#FF7A00",
          secondary: "#FFFFFF",
          accent: "#1A1A1A",
          neutral: "#3D4451",
          "base-100": "#1A1A1A",
          info: "#3ABFF8",
          success: "#36D399",
          warning: "#FBBD23",
          error: "#F87272",
        },
      },
      "business",
      "dark",
    ],
  },
};
