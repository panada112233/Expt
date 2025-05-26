import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { NavLink } from 'react-router-dom';
import { GetUser } from '../function/apiservice';


const Admintime = () => {
    const [profilePic, setProfilePic] = useState(""); // รูปโปรไฟล์
    const [adminName, setAdminName] = useState(""); // ชื่อจริงของแอดมิน
    const [selectedFile, setSelectedFile] = useState(null); // ไฟล์ที่เลือก
    const [uploadMessage, setUploadMessage] = useState("");
    const [isEditingName, setIsEditingName] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const [worktimes, setWorktimes] = useState([]);
    const [users, setUsers] = useState([]);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [wtRes, userRes] = await Promise.all([
                    axios.get("https://localhost:7039/api/Worktime"),
                    axios.get("https://localhost:7039/api/Users")
                ]);
                setWorktimes(wtRes.data);
                setUsers(userRes.data);
            } catch (err) {
                console.error("โหลดข้อมูลเข้า-ออกงานล้มเหลว:", err);
            }
        };
        fetchAll();
    }, []);

    useEffect(() => {
        axios
            .get("https://localhost:7039/api/Admin/Users")
            .then((response) => {
                if (Array.isArray(response.data)) {
                    setUsers(response.data);
                    setFilteredUsers(response.data); // ตั้งค่า filteredUsers
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

    useEffect(() => {
        const fetchAdminInfo = async () => {
            try {
                const response = await GetUser(); // ใช้ฟังก์ชันจาก apiservice
                setAdminName(response.name || "ไม่มีชื่อแอดมิน");
                setProfilePic(
                    response.profilePictureUrl
                        ? `https://localhost:7039/api${response.profilePictureUrl}`
                        : "https://localhost:7039/api/uploads/admin/default-profile.jpg"
                );

            } catch (error) {
                console.error("Error fetching admin data:", error);
                setAdminName("ไม่สามารถดึงข้อมูลได้");
            }
        };

        fetchAdminInfo();
    }, []);

    const getFullName = (userId) => {
        const user = users.find(u => u.userID === userId);
        return user ? `${user.firstName} ${user.lastName}` : "ไม่ทราบชื่อ";
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("th-TH", {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    const filteredWorktimes = worktimes.filter(w => {
        const d = new Date(w.date);
        return d.getMonth() + 1 === parseInt(month) && d.getFullYear() === parseInt(year);
    });

    const grouped = filteredWorktimes.reduce((acc, w) => {
        const key = w.date;
        if (!acc[key]) acc[key] = [];
        acc[key].push(w);
        return acc;
    }, {});

    const handleProfilePicChange = (event) => {
        const file = event.target.files[0]; // เลือกไฟล์แรกจากไฟล์ที่เลือก
        if (file) {
            setSelectedFile(file); // เก็บไฟล์ที่เลือกลงใน state
            // อัปเดตข้อความแสดงชื่อไฟล์
            document.getElementById("fileName").textContent = file.name;
        } else {
            // ถ้าไม่ได้เลือกไฟล์ ให้แสดงข้อความเริ่มต้น
            document.getElementById("fileName").textContent = "ไม่ได้เลือกไฟล์";
        }
    };

    const handleNameUpdate = async () => {
        if (!adminName) {
            console.error("Admin name is empty, cannot update.");
            setUploadMessage(<p className="text-red-500 font-FontNoto">กรุณากรอกชื่อแอดมิน</p>);
            return;
        }

        // ดึงข้อมูล User ID จาก localStorage
        const userInfo = JSON.parse(localStorage.getItem("userinfo"));
        if (!userInfo || !userInfo.userid) {
            console.error("User ID is missing in localStorage.");
            setUploadMessage(<p className="text-red-500 font-FontNoto">ไม่พบข้อมูลผู้ใช้</p>);
            return;
        }

        const formData = new FormData();
        formData.append("name", adminName);
        formData.append("id", userInfo.userid);

        try {
            const response = await axios.post(
                "https://localhost:7039/api/Admin/UpdateAdminInfo",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            setIsEditingName(false);
            setUploadMessage(<p className="text-green-500 font-FontNoto">บันทึกชื่อสำเร็จ!</p>);
        } catch (error) {
            console.error("Error updating admin name:", error.response?.data || error);
            setUploadMessage(<p className="text-red-500 font-FontNoto">เกิดข้อผิดพลาดในการบันทึกชื่อ</p>);
        }
    };


    // อัปโหลดรูปโปรไฟล์ใหม่
    const handleUpload = async () => {
        if (!selectedFile) {
            setUploadMessage(
                <p className="font-FontNoto text-red-500">กรุณาเลือกไฟล์ก่อนอัปโหลด</p>
            );
            return;
        }

        var userinfolocalStorage = localStorage.getItem('userinfo')
        const objUser = JSON.parse(userinfolocalStorage)
        console.log(objUser.userid)

        const formData = new FormData();
        formData.append("profilePictures", selectedFile); // ส่งเฉพาะรูปภาพ
        formData.append("id", objUser.userid);
        console.log(formData)
        try {
            const response = await axios.post("https://localhost:7039/api/Admin/UpdateAdminInfo", formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );

            if (response.data && response.data.profilePictureUrl) {
                const profilePictureUrl = response.data.profilePictureUrl
                    ? `https://localhost:7039/api${response.data.profilePictureUrl}`
                    : "https://localhost:7039/api/uploads/users/default-profile.jpg";

                setProfilePic(profilePictureUrl);
                setUploadMessage(
                    <p className="font-FontNoto text-green-500">อัปโหลดสำเร็จ!</p>
                );
            } else {
                setUploadMessage(
                    <p className="font-FontNoto text-red-500">
                        อัปโหลดสำเร็จ แต่ไม่ได้รับ URL ของรูปโปรไฟล์
                    </p>
                );
            }
        } catch (error) {
            console.error("Error uploading profile picture:", error);

            const errorMessage =
                error.response?.data?.Message || "เกิดข้อผิดพลาดในการอัปโหลด";
            setUploadMessage(
                <p className="font-FontNoto text-red-500">{errorMessage}</p>
            );
        }
    };
    return (
        <div className="flex flex-col min-h-screen">
            {/* Navbar */}
            <div className="navbar bg-gradient-to-r from-cyan-950 via-blue-900 to-purple-950 shadow-lg flex flex-wrap justify-between items-center px-4 py-2">
                <div className="flex items-center">
                    <div>
                        <span className="font-bold text-white">THE</span>&nbsp;
                        <span className="font-bold text-white">EXPERTISE</span>&nbsp;
                        <span className="font-bold text-white">CO, LTD.</span>
                    </div>
                </div>
                {/* ปุ่มเปิด sidebar เฉพาะบนมือถือ */}
                <div className="md:hidden flex justify-start px-4 py-2">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="text-white text-2xl font-FontNoto focus:outline-none"
                    >
                        ☰
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row min-h-screen bg-base-200">
                {/* Sidebar */}
                <div className={`fixed md:static top-0 left-0 bg-white w-[70%] md:w-1/5 h-full md:h-auto z-40 shadow-lg p-6 rounded-none md:rounded-lg transform transition-transform duration-300 ease-in-out 
  ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>

                    <div className="">
                        <div className="font-FontNoto">
                            {uploadMessage && <div>{uploadMessage}</div>}
                        </div>

                        <div className="flex flex-col items-center justify-center">
                            {profilePic ? (
                                <img
                                    src={`${profilePic}?t=${new Date().getTime()}`} // ✅ ป้องกันการแคช
                                    alt="Admin Profile"
                                    className="rounded-full border-4 border-cyan-700 object-cover w-32 h-32"
                                    onError={(e) => { e.target.src = "https://localhost:7039/api/uploads/admin/default-profile.jpg"; }} // ✅ ถ้าโหลดรูปไม่ได้ ให้ใช้รูป default
                                />
                            ) : (
                                <p className="text-red-500 font-FontNoto"></p> // ✅ แสดงข้อความถ้าไม่มีรูป
                            )}

                            <p className="text-lg text-black font-FontNoto mt-4">
                                {adminName || "กำลังโหลด..."}
                            </p>
                        </div>
                        <div className="mt-4">
                            {!isEditingName ? (
                                <div className="flex justify-center items-center w-full flex-wrap gap-2">
                                    <button
                                        onClick={() => setIsEditingName(true)}
                                        className="ml-2 text-sm text-blue-500 hover:underline font-FontNoto"
                                    >
                                        คลิกเพื่อเปลี่ยนชื่อแอดมิน
                                    </button>
                                </div>
                            ) : (
                                <div className="flex justify-center items-center w-full flex-wrap gap-2">
                                    <input
                                        type="text"
                                        value={adminName}
                                        onChange={(e) => setAdminName(e.target.value)}
                                        className="border border-gray-300 rounded-md p-1 bg-white text-black font-FontNoto"
                                    />
                                    <button
                                        onClick={handleNameUpdate}
                                        className="ml-2 text-sm text-green-500 hover:underline font-FontNoto"
                                    >
                                        บันทึก
                                    </button>
                                    <button
                                        onClick={() => setIsEditingName(false)}
                                        className="ml-2 text-sm text-red-500 hover:underline font-FontNoto"
                                    >
                                        ยกเลิก
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-center items-center space-x-2">
                            <div className="flex items-center space-x-1 p-0.25 border border-gray-200 rounded-md w-48">
                                <label
                                    htmlFor="fileInput"
                                    className="cursor-pointer text-xs py-1 px-2 bg-gray-200 text-black rounded-md font-FontNoto"
                                >
                                    เลือกไฟล์
                                </label>
                                <input
                                    id="fileInput"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleProfilePicChange}
                                    className="hidden"
                                />
                                <span id="fileName" className="text-xs text-black font-FontNoto py-1 px-2 ">
                                    ไม่ได้เลือกไฟล์
                                </span>
                            </div>

                            <button
                                onClick={handleUpload}
                                className="cursor-pointer text-xs py-1 px-2 bg-gray-200 rounded-md font-FontNoto"
                            >
                                อัปโหลด
                            </button>
                        </div>
                    </div>

                    <ul className="menu bg-base-100 text-black rounded-box w-full text-lg">
                        <li><Link to="/AdminDashboard" className="hover:bg-green-100 hover:text-black font-FontNoto font-bold">Dashboard</Link></li>
                        <li><NavLink to="/Admintime" className={({ isActive }) => isActive ? "hover:bg-gray-300 hover:text-black font-FontNoto font-bold bg-gray-200" : "hover:bg-yellow-100 hover:text-black font-FontNoto font-bold"}>รายการเข้า-ออกงาน</NavLink></li>
                        <li><Link to="/Adminplan" className="hover:bg-green-100 font-FontNoto font-bold">การปฎิบัติงานพนักงาน</Link></li>
                        <li><Link to="/LeaveGraph" className="hover:bg-green-100 font-FontNoto font-bold">สถิติการลาพนักงาน</Link></li>
                        <li><Link to="/UserList" className="hover:bg-green-100 font-FontNoto font-bold">ข้อมูลพนักงาน</Link></li>
                        <li><Link to="/AdminLogout" className="hover:bg-error hover:text-white font-FontNoto font-bold">ออกจากระบบ</Link></li>
                    </ul>
                </div>

                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-30"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
                {/* Content */}
                <div className="flex-1 p-4 md:p-10 bg-white shadow-lg rounded-none md:rounded-lg">
                    <div className="w-full bg-gradient-to-r from-cyan-900 via-cyan-600 to-slate-500 text-white rounded-xl p-4 sm:p-5 md:p-6 mb-6 shadow-lg">
                        <h1 className="text-xl sm:text-2xl font-bold font-FontNoto leading-snug">
                            บันทึกรายการเข้า-ออกงานพนักงาน
                        </h1>
                        <p className="text-xs sm:text-sm mt-1 font-FontNoto">ตรวจสอบข้อมูลการเข้า-ออกงานของพนักงาน</p>
                    </div>
                    <div className="flex justify-end gap-4 mb-4">
                        <select className="select select-bordered w-40 text-black font-FontNoto" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                            {["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"].map((m, idx) => (
                                <option className="font-FontNoto" key={idx + 1} value={idx + 1}>{m}</option>
                            ))}
                        </select>
                        <select className="select select-bordered w-40 text-black font-FontNoto" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                            {Array.from({ length: 11 }, (_, i) => 2024 + i).map((y) => (
                                <option className="font-FontNoto" key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    {Object.entries(grouped).sort((a, b) => new Date(b[0]) - new Date(a[0])).map(([date, records]) => (
                        <div key={date} className="bg-white rounded-xl shadow border border-gray-200 p-4 mb-6">
                            <h3 className="font-semibold mb-2 font-FontNoto">📅 วันที่ {formatDate(date)}</h3>
                            <div className="overflow-x-auto">
                                <table className="table text-sm text-center border border-gray-300">
                                    <thead className="text-center bg-blue-100 text-black font-FontNoto">
                                        <tr>
                                            <th>ชื่อพนักงาน</th>
                                            <th>สถานที่</th>
                                            <th>เข้างาน</th>
                                            <th>ออกงาน</th>
                                            <th>มาสาย</th>
                                            <th>พิกัด</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {records.map((rec, idx) => (
                                            <tr key={idx}>
                                                <td className="font-FontNoto">{getFullName(rec.userID)}</td>
                                                <td className={`font-FontNoto ${rec.location.includes("ลา") ? "text-red-600" : ""}`}>{rec.location}</td>
                                                <td className="font-FontNoto">{rec.checkIn || "-"}</td>
                                                <td className="font-FontNoto">{rec.checkOut || "-"}</td>
                                                <td className={`font-FontNoto ${rec.lateMinutes > 0 ? "text-red-600" : ""}`}>
                                                    {rec.lateMinutes > 0
                                                        ? `${Math.floor(rec.lateMinutes / 60) > 0 ? `${Math.floor(rec.lateMinutes / 60)} ชม ` : ""}${rec.lateMinutes % 60} นาที`
                                                        : "0 นาที"}
                                                </td>
                                                <td className="font-FontNoto text-blue-600">
                                                    {rec.photoPath?.includes("Lat")
                                                        ? <a href={`https://maps.google.com/?q=${rec.photoPath.replace('Lat: ', '').replace(', Lng: ', ',')}`} target="_blank" rel="noreferrer" className="underline">{rec.photoPath}</a>
                                                        : rec.photoPath || "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}

                </div>
            </div>
        </div>

    );
};

export default Admintime;
