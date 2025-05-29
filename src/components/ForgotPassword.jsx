import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThaiInput, setIsThaiInput] = useState(false);
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
        'https://192.168.1.188/hrwebapi/api/PasswordResets/reset-request',
        { email },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.status === 200) {
        setMessage(response.data.message || 'โปรดตรวจสอบรหัสยืนยันที่อีเมลของคุณ');
        setTimeout(() => navigate('/ChangePassword'), 3000);
      } else {
        setMessage('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('กรุณาระบุอีเมลให้ถูกต้อง');
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
            <label className="block text-sm font-medium text-gray-700 mb-1 font-FontNoto">อีเมล</label>
            <input
              type="email"
              className={`input input-bordered w-full text-black !bg-white font-FontNoto ${isThaiInput ? 'placeholder-red-500' : ''}`}
              placeholder={isThaiInput ? 'กรุณากรอกเป็นภาษาอังกฤษเท่านั้น' : 'กรุณาระบุอีเมลของคุณ'}
              value={email}
              onChange={(e) => {
                const value = e.target.value;
                if (/^[^\u0E00-\u0E7F]*$/.test(value)) {
                  setEmail(value);
                  setIsThaiInput(false);
                }
              }}
              onBeforeInput={(e) => {
                const char = e.data;
                if (char && /[ก-๙]/.test(char)) {
                  e.preventDefault();
                  setIsThaiInput(true);
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
            className="btn w-full !bg-blue-500 hover:bg-blue-700 !text-white font-bold font-FontNoto"
            disabled={isLoading}
          >
            {isLoading ? 'กำลังส่งรหัสยืนยัน...' : 'ขอรหัสยืนยัน'}
          </button>
        </form>
      </div>
    </div>
  );

};

export default ForgotPassword;
