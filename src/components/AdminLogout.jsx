import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLogout = ({ setIsAdminLoggedIn }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // ล้างข้อมูลการล็อกอินของแอดมิน
    localStorage.removeItem('isAdminLoggedIn');
    setIsAdminLoggedIn(false); // ตั้งสถานะการล็อกอินเป็น false

    // นำแอดมินกลับไปที่หน้าเข้าสู่ระบบ
    navigate('/'); // 
  }, [setIsAdminLoggedIn, navigate]); 

  return null; // ไม่ต้องแสดง UI
};

export default AdminLogout;
