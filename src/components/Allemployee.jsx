import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { FiInfo, FiTrash2 } from "react-icons/fi";

const sexLabels = {
    Male: "ชาย",
    Female: "หญิง",
};

const designationMap = {
    FULLTIME: "พนักงานประจำ",
    CONTRACT: "สัญญาจ้าง",
    INTERN: "นักศึกษาฝึกงาน",
    PROBATION: "ทดลองงาน",
    ADMIN: "Admin"
};

const roleMapping = {
    GM: "ผู้จัดการทั่วไป",
    Hr: "เลขานุการฝ่ายบริหาร",
    HEAD_BA: "หัวหน้าฝ่ายนักวิเคราะห์ธุรกิจ",
    SENIOR_DEV: "Senior Programmer",
    Dev: "Programmer",
    BA: "นักวิเคราะห์ธุรกิจ (BA)",
    TESTER: "Software Tester",
    JUNIOR_DEV: "Junior Programmer",
    ADMIN: "Admin",
};


const Allemployee = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [worktimes, setWorktimes] = useState([]);
    const [selectedRole, setSelectedRole] = useState("ทั้งหมด");
    const [selectedDesignation, setSelectedDesignation] = useState("ทั้งหมด");
    const [selectedWorkStatus, setSelectedWorkStatus] = useState("ทั้งหมด");
    const [userToDelete, setUserToDelete] = useState(null);

    const [historyDate, setHistoryDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0]; // รูปแบบ yyyy-MM-dd
    });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [user, setUser] = useState({
        employeeCode: '',
        prefix: '',
        firstname: '',
        lastname: '',
        email: '',
        contact: '',
        role: '',
        designation: '',
        JDate: '',
        gender: '',
        username: '',
        passwordHash: '',
        confirmPassword: '',
    });

    const [showPassword, setShowPassword] = useState({
        passwordHash: false,
        confirmPassword: false,
    });

    const handleDeleteUser = async () => {
        try {
            await axios.delete(`https://192.168.1.188/hrwebapi/api/Admin/${userToDelete}`);
            setUsers(users.filter((user) => user.userID !== userToDelete));
            setFilteredUsers(filteredUsers.filter((user) => user.userID !== userToDelete));
            document.getElementById('delete_modal').close();
        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการลบผู้ใช้:", error);
            alert("ลบผู้ใช้งานไม่สำเร็จ กรุณาลองใหม่");
        }
    };
    const openDeleteModal = (userID) => {
        setUserToDelete(userID);
        document.getElementById('delete_modal').showModal();
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
        fetch('https://192.168.1.188/hrwebapi/api/Worktime')
            .then((res) => res.json())
            .then((data) => setWorktimes(data))
            .catch((err) => console.error('โหลด worktime ล้มเหลว', err));
    }, []);

    const getStatusForEmployee = (userID) => {
        const today = new Date().toISOString().split("T")[0];
        const todayWork = worktimes.find(w => w.userID === userID && w.date.startsWith(today));

        if (!todayWork) return { text: "ยังไม่เช็คอิน", color: "bg-red-100 text-red-600" };
        if (todayWork.location?.includes("ลาป่วย")) return { text: "ลาป่วย", color: "bg-yellow-100 text-yellow-700" };
        if (todayWork.location?.includes("ลากิจส่วนตัว")) return { text: "ลากิจส่วนตัว", color: "bg-yellow-100 text-yellow-700" };
        if (todayWork.location?.includes("ลาบวช")) return { text: "ลาบวช", color: "bg-yellow-100 text-yellow-700" };
        if (todayWork.location?.includes("ลาพักร้อน")) return { text: "ลาพักร้อน", color: "bg-yellow-100 text-yellow-700" };
        if (todayWork.checkIn && !todayWork.checkOut) return { text: "ทำงานอยู่", color: "bg-green-100 text-green-700" };

        return { text: "ทำงานเสร็จ", color: "bg-gray-100 text-gray-700" };
    };

    useEffect(() => {
        if (id) {
            setLoading(true);
            axios
                .get(`https://192.168.1.188/hrwebapi/api/Admin/user/${id}`)
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
            setError("กรุณาเลือกตำแหน่ง");
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
            ? axios.put(`https://192.168.1.188/hrwebapi/api/Admin/Users/${id}`, user)
            : axios.post("https://192.168.1.188/hrwebapi/api/Admin/Users", user);

        apiCall
            .then(() => {
                setShowCreateModal(false);
                navigate(`/EmpHome/Allemployee`);
            })
            .catch(() => {
                setError("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const togglePasswordVisibility = (field) => {
        setShowPassword((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };
    useEffect(() => {
        axios
            .get("https://192.168.1.188/hrwebapi/api/Admin/Users")
            .then((response) => {
                if (Array.isArray(response.data)) {
                    setUsers(response.data);
                    setFilteredUsers(response.data);
                } else {
                    console.error("Data is not an array:", response.data);
                    setUsers([]);
                    setFilteredUsers([]);
                }
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error loading user data:", error);
                setError("ไม่สามารถโหลดข้อมูลผู้ใช้งานได้");
                setLoading(false);
            });
    }, []);

    const loggedInUser = JSON.parse(localStorage.getItem("userinfo"));

    const handleViewDetails = (user) => {
        navigate(`/EmpHome/Profile`, { state: { userID: user.userID } });
    };

    const handleSearch = () => {
        const results = users.filter((user) =>
            user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredUsers(results);
    };

    const openModal = (imageUrl) => {
        setSelectedImage(imageUrl);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedImage(null);
        setIsModalOpen(false);
    };

    return (
        <div className="flex flex-col w-full">
            <div className="w-full bg-gradient-to-r from-cyan-100 via-blue-100 to-blue-50 text-white rounded-xl p-4 sm:p-5 md:p-6 mb-6 shadow-lg">
                <h1 className="text-xl sm:text-2xl text-cyan-950 font-bold font-FontNoto leading-snug">
                    จัดการข้อมูลพนักงาน
                </h1>
                <p className="text-xs sm:text-sm mt-1 text-cyan-950 font-FontNoto">
                    จัดการข้อมูลพนักงาน และเพิ่มผู้ใช้งาน
                </p>
            </div>

            <div className="p-4 bg-white rounded-3xl shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base sm:text-lg font-bold font-FontNoto leading-snug">
                        ข้อมูลพนักงาน
                    </h2>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-FontNoto shadow"
                    >
                        เพิ่มผู้ใช้งานในระบบ
                    </button>
                </div>
                <div className="flex flex-row flex-wrap gap-2 mt-4 mb-4">
                    <button className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full font-FontNoto">
                        พนักงานปัจจุบัน: <span className="font-bold">{users.filter(u => u.role !== "ADMIN" && u.designation !== "CONTRACT").length} คน</span>
                    </button>
                    <button className="flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-full font-FontNoto">
                        ลาออก: <span className="font-bold">0 คน</span>
                    </button>
                    <button className="flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full font-FontNoto">
                        หมดสัญญา: <span className="font-bold">0 คน</span>
                    </button>
                </div>

                <div className="flex flex-wrap gap-4 mt-4 mb-4 bg-gray-100 rounded-lg p-2">
                    {/* ตำแหน่ง */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
                        <label className="text-sm text-gray-700 font-FontNoto whitespace-nowrap">ตำแหน่ง</label>
                        <select
                            className="select select-bordered font-FontNoto w-full sm:w-56"
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                        >
                            <option>ทั้งหมด</option>
                            <option>ผู้จัดการทั่วไป</option>
                            <option>เลขานุการฝ่ายบริหาร</option>
                            <option>หัวหน้าฝ่ายนักวิเคราะห์ธุรกิจ</option>
                            <option>Senior Programmer</option>
                            <option>Programmer</option>
                            <option>นักวิเคราะห์ธุรกิจ (BA)</option>
                            <option>Software Tester</option>
                            <option>Junior Programmer</option>
                        </select>
                    </div>

                    {/* สถานะงาน */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
                        <label className="text-sm text-gray-700 font-FontNoto whitespace-nowrap">สถานะงาน</label>
                        <select
                            className="select select-bordered font-FontNoto w-full sm:w-56"
                            value={selectedDesignation}
                            onChange={(e) => setSelectedDesignation(e.target.value)}
                        >
                            <option>ทั้งหมด</option>
                            <option>พนักงานประจำ</option>
                            <option>สัญญาจ้าง</option>
                            <option>นักศึกษาฝึกงาน</option>
                            <option>ทดลองงาน</option>
                            <option>ลาออก</option>
                            <option>หมดสัญญา</option>
                        </select>
                    </div>

                    {/* ประเภทการทำงาน */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
                        <label className="text-sm text-gray-700 font-FontNoto whitespace-nowrap">ประเภทการทำงาน</label>
                        <select
                            className="select select-bordered font-FontNoto w-full sm:w-56"
                            value={selectedWorkStatus}
                            onChange={(e) => setSelectedWorkStatus(e.target.value)}
                        >
                            <option>ทั้งหมด</option>
                            <option>ทำงานอยู่</option>
                            <option>ลาป่วย</option>
                            <option>ลากิจกิจส่วนตัว</option>
                            <option>ลาพักร้อน</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-6 font-FontNoto text-blue-700">
                        กำลังโหลดข้อมูล...
                    </div>
                ) : error ? (
                    <div className="text-center py-6 text-red-500 font-FontNoto">
                        {error}
                    </div>
                ) : (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {users
                            .filter((user) => user.role !== "ADMIN")
                            .filter((user) => {
                                const roleMatch =
                                    selectedRole === "ทั้งหมด" || roleMapping[user.role] === selectedRole;
                                const designationMatch =
                                    selectedDesignation === "ทั้งหมด" || designationMap[user.designation] === selectedDesignation;
                                const workStatusMatch =
                                    selectedWorkStatus === "ทั้งหมด" || getStatusForEmployee(user.userID).text === selectedWorkStatus;
                                return roleMatch && designationMatch && workStatusMatch;
                            })
                            .map((user) => {
                                const profileImageUrl = `https://192.168.1.188/hrwebapi/api/Files/GetProfileImage?userID=${user.userID}`;
                                const status = getStatusForEmployee(user.userID);
                                return (
                                    <div key={user.userID} className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition duration-300 font-FontNoto">
                                        <div className="flex items-center gap-4 mb-3">
                                            <img
                                                src={profileImageUrl || "/placeholder.jpg"}
                                                alt="โปรไฟล์"
                                                className="w-16 h-16 rounded-full border-2 border-blue-400 object-cover cursor-pointer"
                                                onClick={() => openModal(profileImageUrl)}
                                            />
                                            <div>
                                                <p className="font-bold text-blue-900">{user.firstName} {user.lastName}</p>
                                                <p className="text-sm text-gray-500">{roleMapping[user.role]}</p>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-700 space-y-1">
                                            <p><strong>รหัสพนักงาน:</strong> {user.employeeCode}</p>
                                            <p><strong>อีเมล:</strong> {user.email}</p>
                                            <p><strong>เบอร์:</strong> {user.contact}</p>
                                            <div className="flex items-center gap-3">
                                                <div className={`px-3 py-1 text-sm font-FontNoto rounded-full ${status.color}`}>
                                                    {status.text}
                                                </div>
                                                <p className="px-3 py-1 text-sm font-FontNoto rounded-full bg-gray-200 text-gray-700 m-0">
                                                    {designationMap[user.designation] || "-"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex justify-between">
                                            <button
                                                className="min-w-[48%] font-FontNoto text-blue-600 hover:text-blue-800 focus:outline-none flex items-center justify-center gap-1"
                                                onClick={() => handleViewDetails(user)}
                                            >
                                                <FiInfo className="text-base" />
                                                รายละเอียด
                                            </button>
                                            <button
                                                className="w-1/2 font-FontNoto text-red-600 hover:text-red-800 focus:outline-none flex items-center justify-center gap-1"
                                                onClick={() => openDeleteModal(user.userID)}
                                            >
                                                <FiTrash2 className="text-base" />
                                                ลบข้อมูล
                                            </button>
                                        </div>

                                    </div>
                                );
                            })}
                    </div>
                )}
            </div>

            <dialog id="delete_modal" className="modal">
                <div className="modal-box font-FontNoto w-full !max-w-[400px] px-5 py-6 text-center rounded-xl shadow-lg">
                    <h2 className="text-lg font-bold text-red-600 mb-3">
                        ยืนยันการลบข้อมูล
                    </h2>
                    <p className="text-gray-700 mb-5 text-base leading-relaxed">
                        คุณต้องการลบพนักงานคนนี้ออกจากระบบหรือไม่?
                    </p>
                    <div className="flex justify-center gap-3">
                        <button
                            onClick={() => document.getElementById('delete_modal').close()}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm rounded-lg"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleDeleteUser}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg"
                        >
                            ลบข้อมูล
                        </button>
                    </div>
                </div>
            </dialog>

            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-lg  max-w-3xl relative overflow-y-auto max-h-[90vh]">
                        <div className="relative">
                            <div className="bg-blue-600  py-4 px-6 flex items-center justify-between">

                                <h2 className="text-xl font-bold text-white font-FontNoto">
                                    เพิ่มผู้ใช้งานในระบบ
                                </h2>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-white text-2xl font-bold hover:text-gray-200 transition"
                                    aria-label="Close"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
                            {loading && (
                                <p className="text-center text-gray-500 font-FontNoto">
                                    กำลังโหลดข้อมูล...
                                </p>
                            )}

                            {error && (
                                <p className="text-center text-red-600 font-FontNoto">
                                    {error}
                                </p>
                            )}
                            <form onSubmit={handleSubmit}>
                                <div className="font-FontNoto font-bold ">ข้อมูลส่วนตัว</div>
                                <div className="flex flex-row gap-4">
                                    <div className="w-1/2">
                                        <label className="label">
                                            <span className="label-text font-FontNoto">รหัสพนักงาน</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="employeeCode"
                                            placeholder="รหัสพนักงาน"
                                            value={user.employeeCode || ''}
                                            onChange={handleChange}
                                            className="input input-bordered font-FontNoto w-full"
                                            required
                                        />
                                    </div>

                                    <div className="w-1/2">
                                        <label className="label">
                                            <span className="label-text font-FontNoto">Username</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="username"
                                            placeholder="Username"
                                            value={user.username}
                                            onChange={handleChange}
                                            className="input input-bordered font-FontNoto w-full"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="w-1/2">
                                    <label className="label">
                                        <span className="label-text font-FontNoto">คำนำหน้า</span>
                                    </label>
                                    <select
                                        name="prefix"
                                        value={user.prefix}
                                        onChange={handleChange}
                                        className="select select-bordered font-FontNoto w-full"
                                        required
                                    >
                                        <option className="font-FontNoto" value="" disabled>เลือกคำนำหน้า</option>
                                        <option className="font-FontNoto" value="MR">นาย</option>
                                        <option className="font-FontNoto" value="MRS">นาง</option>
                                        <option className="font-FontNoto" value="MISS">นางสาว</option>
                                    </select>
                                </div>

                                <div className="flex flex-row gap-4">
                                    <div className="w-1/2">
                                        <label className="label">
                                            <span className="label-text font-FontNoto">ชื่อภาษาไทย</span>
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
                                            <span className="label-text font-FontNoto">นามสกุลภาษาไทย</span>
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
                                            <span className="label-text font-FontNoto">เบอร์โทรศัพท์</span>
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

                                <div className="flex flex-row gap-4">
                                    <div className="w-1/2">
                                        <label className="label">
                                            <span className="label-text font-FontNoto">ตำแหน่ง</span>
                                        </label>
                                        <select
                                            name="role"
                                            value={user.role}
                                            onChange={handleChange}
                                            className="select select-bordered font-FontNoto w-full"
                                            required
                                        >
                                            <option className="font-FontNoto" value="" disabled>เลือกตำแหน่ง</option>
                                            <option className="font-FontNoto" value="GM">ผู้จัดการทั่วไป</option>
                                            <option className="font-FontNoto" value="Hr">เลขานุการฝ่ายบริหาร</option>
                                            <option className="font-FontNoto" value="HEAD_BA">หัวหน้าฝ่ายนักวิเคราะห์ธุรกิจ</option>
                                            <option className="font-FontNoto" value="SENIOR_DEV">Senior Programmer</option>
                                            <option className="font-FontNoto" value="Dev">Programmer</option>
                                            <option className="font-FontNoto" value="BA">นักวิเคราะห์ธุรกิจ (BA)</option>
                                            <option className="font-FontNoto" value="TESTER">Software Tester</option>
                                            <option className="font-FontNoto" value="JUNIOR_DEV">Junior Programmer</option>
                                            <option className="font-FontNoto" value="ADMIN">Admin</option>
                                        </select>
                                    </div>
                                    <div className="w-1/2">
                                        <label className="label">
                                            <span className="label-text font-FontNoto">สถานะงาน</span>
                                        </label>
                                        <select
                                            name="designation"
                                            value={user.designation}
                                            onChange={handleChange}
                                            className="select select-bordered font-FontNoto w-full"
                                            required
                                        >
                                            <option className="font-FontNoto" value="" disabled>เลือกสถานะงาน</option>
                                            <option className="font-FontNoto" value="FULLTIME">พนักงานประจำ</option>
                                            <option className="font-FontNoto" value="CONTRACT">สัญญาจ้าง</option>
                                            <option className="font-FontNoto" value="INTERN">นักศึกษาฝึกงาน</option>
                                            <option className="font-FontNoto" value="PROBATION">ทดลองงาน</option>
                                            <option className="font-FontNoto" value="ADMIN">Admin</option>
                                        </select>
                                    </div>
                                </div>

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
                                <div className="flex justify-end gap-3 mt-6 font-FontNoto">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-lg transition"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        type="submit"
                                        className={`bg-blue-600 hover:bg-[#125ecc] text-white px-6 py-2 rounded-lg shadow-md transition ${loading ? "opacity-70 cursor-wait" : ""
                                            }`}
                                        disabled={loading}
                                    >
                                        {loading ? "กำลังบันทึก..." : "บันทึก"}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* รูปโปรไฟล์ขยาย */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl max-w-2xl w-full">
                        <button
                            className="absolute top-2 right-3 text-gray-600 hover:text-red-500 text-3xl font-bold"
                            onClick={closeModal}
                        >
                            ×
                        </button>
                        <img
                            src={selectedImage}
                            alt="โปรไฟล์ขยาย"
                            className="w-full h-auto rounded-2xl object-contain"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Allemployee;
