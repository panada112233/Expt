/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'light-blue': '#B22222', // น้ำตาลเมนู
        'peach': '#F5C2B1', // สีพีชหวาน
        'mint': '#A1E3D8', // เขียวมิ้นต์อ่อน
        'lavender': '#E0B8D7', // สีลาเวนเดอร์
        'cream': '#E9967A', // สีน้ำตาล
        'pastel-pink': '#F7B7D4', // ชมพูพาสเทล
        'light-gray': '#D3D3D3', // เทาอ่อน
        'lavender-blue': '#E2D7F0', // สีลาเวนเดอร์บลู
      },
      fontFamily: {
        thSarabun: ['THSarabunNew', 'sans-serif'], // เพิ่มฟอนต์ THSarabunNew
        FontNoto: ['Noto Sans Thai', 'sans-serif'],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: "#FF7A00", // สีส้ม
          secondary: "#FFFFFF", // สีขาว
          accent: "#1A1A1A", // สีดำ
          neutral: "#3D4451",
          "base-100": "#1A1A1A", // พื้นหลังหลัก (สีดำ)
          info: "#3ABFF8",
          success: "#36D399",
          warning: "#FBBD23",
          error: "#F87272",
        },
      },
      "business", // ธีมเพิ่มเติมจาก DaisyUI
      "dark", // ธีมเพิ่มเติมจาก DaisyUI
    ],
  },
};
