import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage('รูปแบบอีเมลไม่ถูกต้อง');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        'https://localhost:7039/api/PasswordResets/reset-request',
        { email },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.status === 200) {
        setMessage(response.data.message || 'ลิงก์สำหรับรีเซ็ตรหัสผ่านถูกส่งไปที่อีเมลของคุณแล้ว');
        setTimeout(() => navigate('/ChangePassword'), 3000);
      } else {
        setMessage('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-100 via-white to-blue-200 px-4">
      {/* ข้อความหัวเรื่อง */}
      <h1 className="text-3xl md:text-4xl text-blue-700 font-FontInter p-6">
        THE EXPERTISE CO,LTD.
      </h1>
      
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg space-y-6 text-center">
        {/* หัวข้อฟอร์ม */}
        <h2 className="text-2xl md:text-3xl font-bold text-blue-700 font-FontNoto">
          ลืมรหัสผ่าน ?
        </h2>

        {/* ฟอร์ม */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-FontNoto">อีเมลที่ใช้สมัคร</label>
            <input
              type="email"
              className="input input-bordered w-full text-black bg-white font-FontNoto"
              placeholder="กรอกอีเมลของคุณ"
              value={email}
              onChange={(e) => {
                const value = e.target.value;
                if (/^[^\u0E00-\u0E7F]*$/.test(value)) {
                  setEmail(value);
                }
              }}
              required
            />
          </div>

          {message && (
            <div className="text-center">
              <span className={`text-sm font-FontNoto ${message.includes('สำเร็จ') ? 'text-green-600' : 'text-red-500'}`}>
                {message}
              </span>
            </div>
          )}

          <button
            type="submit"
            className="btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold font-FontNoto"
            disabled={isLoading}
          >
            {isLoading ? 'กำลังส่งลิงก์...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
          </button>
        </form>
      </div>
    </div>
  );

};

export default ForgotPassword;
