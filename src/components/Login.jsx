import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import imgPath from '../assets/home.png';
import { Link } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Login = ({ setIsLoggedIn }) => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

        const url = isEmail
            ? "https://localhost:7039/api/Users/Login"   // ✅ ใช้ API ของพนักงาน
            : "https://localhost:7039/api/Admin/login";  // ✅ ใช้ API ของแอดมิน

        const data = isEmail
            ? { email: identifier, passwordHash: password }
            : { username: identifier, password };

        try {
            const response = await axios.post(url, data);

            if (response.status === 200) {
                const res = response.data;

                if (res === null) {
                    setError('ไม่พบข้อมูล role ของพนักงาน');
                    return;
                }

                // ✅ บันทึกข้อมูลผู้ใช้
                localStorage.setItem('userinfo', JSON.stringify(res));
                localStorage.setItem('userID', res.userid); // ✅ บันทึก userID ไว้ใช้งานหน้าอื่น เช่น Chat

                sessionStorage.setItem('userId', res.userid);
                if (isEmail) {
                    sessionStorage.setItem('role', res.role);
                }
                sessionStorage.setItem('isAdmin', !isEmail);

                setIsLoggedIn(true);
                navigate(isEmail ? '/LandingAfterLogin' : '/AdminDashboard');
            }
        } catch (err) {
            console.log(err)
            if (err.response && err.response.status === 401) {
                setError('ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง');
            } else {
                setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
            }
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-r from-blue-100 via-white to-blue-200 flex flex-col md:flex-row items-center justify-center px-4 py-8">
            {/* รูปหุ่นยนต์ */}
            <div className="w-full md:w-1/2 flex justify-center mb-8 md:mb-0">
                <img
                    src={imgPath}
                    alt="Cute Robot"
                    className="w-[900px] md:w-[1000px] animate-bounce-slow"
                />

            </div>

            {/* ฟอร์ม login */}
            <div className="w-full md:w-1/3 bg-white p-6 md:p-10 rounded-2xl shadow-lg space-y-5">
                <h2 className="text-2xl md:text-3xl font-bold text-center text-blue-700 font-FontNoto">เข้าสู่ระบบ</h2>

                <form onSubmit={handleSubmit} className="space-y-4 font-FontNoto">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 font-FontNoto">อีเมลที่ใช้สมัคร</label>
                        <input
                            type="text"
                            className="input input-bordered w-full text-black bg-white font-FontNoto"
                            placeholder="กรอกอีเมลที่ใช้สมัคร"
                            value={identifier}
                            onChange={(e) =>
                                /^[a-zA-Z0-9@._-]*$/.test(e.target.value) && setIdentifier(e.target.value)
                            }
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 font-FontNoto">รหัสผ่าน</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="input input-bordered w-full text-black bg-white font-FontNoto"
                                placeholder="รหัสผ่าน"
                                value={password}
                                onChange={(e) =>
                                    /^[a-zA-Z0-9]*$/.test(e.target.value) && setPassword(e.target.value)
                                }
                                required
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-3 flex items-center text-gray-400"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm text-center font-FontNoto">{error}</p>}

                    <button
                        type="submit"
                        className="btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                        disabled={isLoading}
                    >
                        {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                    </button>

                    <div className="text-center mt-4">
                        <Link to="/ForgotPassword" className="text-sm text-blue-600 hover:underline font-bold font-FontNoto">
                            ลืมรหัสผ่าน?
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );


};

export default Login;
