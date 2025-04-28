import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
 
const Allcreate = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState({
        firstname: '',
        lastname: '',
        designation: '',
        contact: '',
        email: '',
        JDate: "",
        gender: "",
        passwordHash: '', // Assuming 'passwordHash' is the field used in the backend
        confirmPassword: '',
        role: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState({
        passwordHash: false,
        confirmPassword: false,
    });

    const togglePasswordVisibility = (field) => {
        setShowPassword((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // เงื่อนไขสำหรับการอนุญาตเฉพาะภาษาไทยและช่องว่าง
        const noThaiPattern = /^[^\u0E00-\u0E7F]*$/; // ห้ามตัวอักษรภาษาไทย
        const emailPattern = /^[^\u0E00-\u0E7F\s]+$/; // อนุญาตเฉพาะภาษาอังกฤษและไม่มีช่องว่าง

        // ตรวจสอบอีเมล (ห้ามภาษาไทย)
        if (name === "email" && !emailPattern.test(value) && value !== "") {
            return;
        }

        // ตรวจสอบรหัสผ่าน (ห้ามภาษาไทย)
        if ((name === "passwordHash" || name === "confirmPassword") && !noThaiPattern.test(value) && value !== "") {
            return;
        }

        if (name === "contact") {
            const phonePattern = /^[0-9]{0,10}$/; // ยอมรับเฉพาะตัวเลขสูงสุด 10 หลัก
            if (!phonePattern.test(value)) {
                return; // ไม่บันทึกค่าที่ไม่ผ่านเงื่อนไข
            }
        }

        // หากผ่านทุกเงื่อนไข ให้บันทึกค่าลงใน state
        setUser((prevUser) => ({
            ...prevUser,
            [name]: value,
        }));
    };

    useEffect(() => {
        if (id) {
            setLoading(true);
            axios
                .get(`https://localhost:7039/api/Admin/user/${id}`)
                .then((response) => {
                    setUser(response.data);
                    setLoading(false);
                })
                .catch(() => {
                    setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
                    setLoading(false);
                });
        }
    }, [id]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const noThaiRegex = /^[^\u0E00-\u0E7F]*$/; // สำหรับตรวจสอบห้ามภาษาไทย
        const emailRegex = /^[^\u0E00-\u0E7F]+$/; // ห้ามตัวอักษรภาษาไทย

        if (user.contact.length !== 10) {
            setError("กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก");
            setLoading(false);
            return;
        }

        // ตรวจสอบว่า Role ถูกเลือกหรือไม่
        if (!user.role) {
            setError("กรุณาเลือกแผนก");
            setLoading(false);
            return;
        }

        if (!emailRegex.test(user.email)) {
            setError("อีเมลต้องเป็นภาษาอังกฤษและอยู่ในรูปแบบที่ถูกต้อง");
            setLoading(false);
            return;
        }

        if (!noThaiRegex.test(user.passwordHash)) {
            setError("รหัสผ่านต้องไม่มีตัวอักษรภาษาไทย");
            setLoading(false);
            return;
        }

        if (user.passwordHash !== user.confirmPassword) {
            setError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
            setLoading(false);
            return;
        }

        const apiCall = id
            ? axios.put(`https://localhost:7039/api/Admin/Users/${id}`, user)
            : axios.post("https://localhost:7039/api/Admin/Users", user);

        apiCall
            .then((response) => navigate(`/EmpHome/Allemployee`))
            .catch(() => {
                setError("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
                setLoading(false);
            });
    };

    return (
        <div className="flex flex-col min-h-screen">
            <div className="min-h-screen bg-base-200 flex">
                {/* Form Section */}
                <div className="flex-1 p-6 bg-white shadow-lg rounded-lg ml-1">
                    
                    <div className="mb-6"></div>
                    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-bold text-black font-FontNoto text-center">เพิ่มพนักงาน</h2>
                        {loading && <p style={{ textAlign: 'center', color: '#6B7280' }}>กำลังโหลดข้อมูล...</p>}
                        {error && <p style={{ textAlign: 'center', color: '#DC2626' }}>{error}</p>}
                        <form onSubmit={handleSubmit}>
                            <div className="form-control mb-4">
                                <div className="flex flex-row gap-4">
                                    <div className="w-1/2">
                                        <label className="label">
                                            <span className="label-text font-FontNoto">ชื่อ</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="firstname"
                                            placeholder="ชื่อ"
                                            value={user.firstname}
                                            onChange={handleChange}
                                            className="input input-bordered font-FontNoto w-full"
                                            required
                                        />
                                    </div>
                                    <div className="w-1/2">
                                        <label className="label">
                                            <span className="label-text font-FontNoto">นามสกุล</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="lastname"
                                            placeholder="นามสกุล"
                                            value={user.lastname}
                                            onChange={handleChange}
                                            className="input input-bordered font-FontNoto w-full"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-control mb-4">
                                <div className="flex flex-row gap-4">
                                    <div className="w-1/2">
                                        <label className="label">
                                            <span className="label-text font-FontNoto">แผนก</span>
                                        </label>
                                        <select
                                            name="role"
                                            value={user.role}
                                            onChange={handleChange}
                                            className="select select-bordered font-FontNoto w-full"
                                            required
                                        >
                                            <option className="font-FontNoto" value="" disabled>เลือกแผนก</option>
                                            <option className="font-FontNoto" value="Hr">ทรัพยากรบุคคล</option>
                                            <option className="font-FontNoto" value="GM">ผู้จัดการทั่วไป</option>
                                            <option className="font-FontNoto" value="Dev">นักพัฒนาระบบ</option>
                                            <option className="font-FontNoto" value="BA">นักวิเคราะห์ธุรกิจ</option>
                                            <option className="font-FontNoto" value="Employee">พนักงาน</option>
                                        </select>
                                    </div>
                                    <div className="w-1/2">
                                        <label className="label">
                                            <span className="label-text font-FontNoto">ตำแหน่ง</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="designation"
                                            placeholder="ตำแหน่ง"
                                            value={user.designation}
                                            onChange={handleChange}
                                            className="input input-bordered font-FontNoto w-full"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="form-control mb-4">
                                <div className="flex flex-row gap-4">
                                    <div className="w-1/2">
                                        <label className="label">
                                            <span className="label-text font-FontNoto">อีเมล</span>
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="อีเมล"
                                            value={user.email}
                                            onChange={handleChange}
                                            className="input input-bordered font-FontNoto w-full"
                                            required
                                        />
                                    </div>
                                    <div className="w-1/2">
                                        <label className="label">
                                            <span className="label-text font-FontNoto">โทรศัพท์</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="contact"
                                            placeholder="โทรศัพท์"
                                            value={user.contact}
                                            onChange={handleChange}
                                            className="input input-bordered font-FontNoto w-full"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="form-control mb-4">
                                <div className="flex flex-row gap-4">
                                    <div className="w-1/2">
                                        <label className="label">
                                            <span className="label-text font-FontNoto">วันที่เริ่มงาน</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="JDate"
                                            placeholder="วันที่เริ่มงาน"
                                            value={user.JDate}
                                            onChange={handleChange}
                                            className="input input-bordered font-FontNoto w-full text-black"
                                            required
                                            style={{
                                                colorScheme: "light", // บังคับไอคอนให้ใช้โหมดสว่าง
                                            }}
                                        />
                                    </div>
                                    <div className="w-1/2">
                                        <label className="label">
                                            <span className="label-text font-FontNoto">เพศ</span>
                                        </label>
                                        <select
                                            name="gender"
                                            value={user.gender}
                                            onChange={handleChange}
                                            className="select select-bordered font-FontNoto w-full"
                                            required
                                        >
                                            <option className="font-FontNoto" value="" disabled>เลือกเพศ</option>
                                            <option className="font-FontNoto" value="Male">ชาย</option>
                                            <option className="font-FontNoto" value="Female">หญิง</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="form-control mb-4">
                                <div className="flex flex-row gap-4">
                                    {/* Password Field */}
                                    <div className="w-1/2 relative">
                                        <label className="label">
                                            <span className="label-text font-FontNoto">รหัสผ่าน</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword.passwordHash ? "text" : "password"}
                                                name="passwordHash"
                                                placeholder="รหัสผ่าน"
                                                value={user.passwordHash}
                                                onChange={handleChange}
                                                className="input input-bordered font-FontNoto bg-gray-700 text-black w-full py-3 px-4 rounded-md border border-gray-600"
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-300 font-FontNoto"
                                                onClick={() => togglePasswordVisibility("passwordHash")}
                                            >
                                                {showPassword.passwordHash ? (
                                                    <EyeSlashIcon className="h-5 w-5" />
                                                ) : (
                                                    <EyeIcon className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm Password Field */}
                                    <div className="w-1/2 relative">
                                        <label className="label">
                                            <span className="label-text font-FontNoto">ยืนยันรหัสผ่าน</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword.confirmPassword ? "text" : "password"}
                                                name="confirmPassword"
                                                placeholder="ยืนยันรหัสผ่าน"
                                                value={user.confirmPassword}
                                                onChange={handleChange}
                                                className="input input-bordered font-FontNoto bg-gray-700 text-black w-full py-3 px-4 rounded-md border border-gray-600"
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-300 font-FontNoto"
                                                onClick={() => togglePasswordVisibility("confirmPassword")}
                                            >
                                                {showPassword.confirmPassword ? (
                                                    <EyeSlashIcon className="h-5 w-5" />
                                                ) : (
                                                    <EyeIcon className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="form-control font-FontNoto">
                                <button type="submit" className={`btn btn-warning ${loading && "loading"}`} disabled={loading}>
                                    {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Allcreate;
