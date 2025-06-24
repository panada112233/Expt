import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Link } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Login = ({ setIsLoggedIn }) => {
    const [identifier, setIdentifier] = useState(() => localStorage.getItem('savedEmail') || '');
    const [isThaiInput, setIsThaiInput] = useState(false);
    const [isThaiPassword, setIsThaiPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('savedEmail'));
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

        const tryUserLogin = async () => {
            const data = {
                identifier: identifier,
                passwordHash: password
            };

            try {
                const res = await axios.post("https://192.168.1.188/hrwebapi/api/Users/Login", data);
                const result = res.data;
                if (rememberMe) {
                    localStorage.setItem('savedEmail', identifier);
                } else {
                    localStorage.removeItem('savedEmail');
                }

                localStorage.setItem('userinfo', JSON.stringify(result));
                localStorage.setItem('userID', result.userid);
                sessionStorage.setItem('userId', result.userid);
                sessionStorage.setItem('role', result.role);
                sessionStorage.setItem('isAdmin', result.role?.toLowerCase() === "admin");

                setIsLoggedIn(true);

                if (result.role?.toLowerCase() === "admin") {
                    navigate("/EmpHome/Allemployee");
                } else {
                    navigate("/LandingAfterLogin");
                }

            } catch (err) {
                if (err.response?.status === 401) {
                } else {
                    setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
                    setIsLoading(false);
                }
            }
        };
        await tryUserLogin();
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-100 via-white to-blue-200 px-4">
            <h1 className="text-3xl md:text-4xl  text-blue-700 mb-6 text-center font-FontInter">
                THE EXPERTISE CO,LTD.
            </h1>
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg space-y-6">
                <h2 className="text-2xl font-bold text-center text-blue-700 font-FontNoto">เข้าสู่ระบบ</h2>

                <form onSubmit={handleSubmit} className="space-y-4 font-FontNoto">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 font-FontNoto">ชื่อผู้ใช้งาน</label>
                        <input
                            type="text"
                            className={`input input-bordered w-full text-black !bg-white font-FontNoto ${isThaiInput ? 'placeholder-red-500' : ''
                                }`}
                            placeholder={isThaiInput ? 'กรุณากรอกเป็นภาษาอังกฤษเท่านั้น' : 'กรุณาระบุชื่อผู้ใช้งาน'}
                            value={identifier}
                            onChange={(e) => {
                                if (/^[a-zA-Z0-9@._-]*$/.test(e.target.value)) {
                                    setIdentifier(e.target.value);
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 font-FontNoto">รหัสผ่าน</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className={`input input-bordered w-full text-black !bg-white font-FontNoto ${isThaiPassword ? 'placeholder-red-500' : ''
                                    }`}
                                placeholder={isThaiPassword ? 'กรุณากรอกเป็นภาษาอังกฤษเท่านั้น' : 'กรุณาระบุรหัสผ่าน'}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setIsThaiPassword(false);
                                }}

                                onBeforeInput={(e) => {
                                    const char = e.data;
                                    if (char && /[ก-๙]/.test(char)) {
                                        e.preventDefault();
                                        setIsThaiPassword(true);
                                    }
                                }}
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

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="rememberMe"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="checkbox checkbox-primary accent-blue-600"
                            style={{
                                '--chkbg': '#2563eb',
                                '--chkfg': 'white'
                            }}
                        />
                        <label htmlFor="rememberMe" className="text-sm text-gray-700 cursor-pointer font-FontNoto">
                            จำอีเมลของฉัน
                        </label>
                    </div>

                    {error && <p className="text-red-500 text-sm text-center font-FontNoto">{error}</p>}

                    <button
                        type="submit"
                        className="btn w-full !bg-blue-500 hover:bg-blue-700 !text-white font-bold"
                        disabled={isLoading}
                    >
                        {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                    </button>

                    <div className="text-center mt-2">
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
