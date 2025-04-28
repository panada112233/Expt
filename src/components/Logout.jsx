import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Logout({ setIsLoggedIn }) {
  const navigate = useNavigate();

  useEffect(() => {
    // ล้างข้อมูลผู้ใช้ (เช่น token) และตั้งสถานะล็อกอินเป็น false
    localStorage.removeItem('token'); // ตัวอย่าง: ลบ token ออกจาก localStorage
    setIsLoggedIn(false);

    // นำผู้ใช้กลับไปที่หน้าแรกหรือหน้า Login
    navigate('/');
  }, [setIsLoggedIn, navigate]);

  return null; // ไม่ต้องแสดง UI
}
