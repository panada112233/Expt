import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import { GetUser } from '../function/apiservice';


function CreateWorkExperience() {
    const [newExperience, setNewExperience] = useState({
        companyName: "",
        jobTitle: "",
        startDate: "",
        endDate: "",
        salary: "",
    });

    const [users, setUsers] = useState([]);
    const [selectedUserID, setSelectedUserID] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [errors, setErrors] = useState({});
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [profilePic, setProfilePic] = useState(""); // รูปโปรไฟล์
    const [adminName, setAdminName] = useState(""); // ชื่อจริงของแอดมิน
    const [selectedFile, setSelectedFile] = useState(null); // ไฟล์ที่เลือก
    const [uploadMessage, setUploadMessage] = useState("");
    const [isEditingName, setIsEditingName] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get("https://localhost:7039/api/Admin/users");
                setUsers(response.data);
            } catch (error) {
                console.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน:", error);
            }
        };
        fetchUsers();
    }, []);
    useEffect(() => {
        const fetchAdminInfo = async () => {
            try {
                const response = await GetUser(); // ใช้ฟังก์ชันจาก apiservice
                setAdminName(response.name || "ไม่มีชื่อแอดมิน");
                setProfilePic(
                    response.profilePictureUrl
                        ? `https://localhost:7039${response.profilePictureUrl}`
                        : "https://localhost:7039/uploads/admin/default-profile.jpg"
                );
            } catch (error) {
                console.error("Error fetching admin data:", error);
                setAdminName("ไม่สามารถดึงข้อมูลได้");
            }
        };

        fetchAdminInfo();
    }, []);


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
                    ? `https://localhost:7039${response.data.profilePictureUrl}`
                    : "https://localhost:7039/uploads/users/default-profile.jpg";

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

    const handleChange = (e) => {
        const { name, value } = e.target;

        // ตรวจสอบปีเริ่มต้นและปีสิ้นสุดให้กรอกเฉพาะตัวเลข 4 หลัก
        if ((name === "startDate" || name === "endDate") && !/^\d{0,4}$/.test(value)) {
            return; // หยุดการอัปเดต state ถ้าค่าไม่ใช่ตัวเลข 4 หลัก
        }

        // ตรวจสอบเงินเดือนว่าห้ามติดลบ
        if (name === "salary" && value < 0) {
            return; // หยุดการอัปเดต state ถ้าเงินเดือนเป็นค่าติดลบ
        }

        setNewExperience({ ...newExperience, [name]: value });
    };

    const handleUserChange = (e) => {
        setSelectedUserID(e.target.value);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false); // ปิด Modal
        console.log(selectedUserID)
        if (selectedUserID != null && selectedUserID !== "") {
            navigate(`/users/${selectedUserID}`);
        }
        //  // เด้งไปหน้า /users/:UserID
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};

        // ตรวจสอบ startDate และ endDate ว่ามีความยาวครบ 4 หลัก
        if (newExperience.startDate.length !== 4 || isNaN(newExperience.startDate)) {
            newErrors.startDate = "กรุณากรอกปีที่เริ่มต้นให้ครบ 4 หลัก";
        }

        if (newExperience.endDate && (newExperience.endDate.length !== 4 || isNaN(newExperience.endDate))) {
            newErrors.endDate = "กรุณากรอกปีที่สิ้นสุดให้ครบ 4 หลัก";
        }

        // ตรวจสอบว่า salary ไม่ติดลบ
        const salary = parseFloat(newExperience.salary);
        if (salary < 0 || isNaN(salary)) {
            newErrors.salary = "เงินเดือนไม่สามารถเป็นค่าติดลบได้";
        }

        // หากมีข้อผิดพลาดให้แสดงข้อความและหยุดการดำเนินการ
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({}); // ล้างข้อผิดพลาดเมื่อไม่มีปัญหา
        console.log(selectedUserID)
        try {
            const response = await axios.post("https://localhost:7039/api/Admin/WorkExperiences", {
                userID: parseInt(selectedUserID),
                companyName: newExperience.companyName,
                jobTitle: newExperience.jobTitle,
                startDate: newExperience.startDate,
                endDate: newExperience.endDate || null, // อนุญาตให้ endDate เป็น null
                salary: salary,
            });

            console.log("เพิ่มข้อมูลประสบการณ์ทำงานสำเร็จ", response.data);

            setNewExperience({
                companyName: "",
                jobTitle: "",
                startDate: "",
                endDate: "",
                salary: "",
            });

            setIsModalOpen(true); // เปิด Modal
        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการเพิ่มข้อมูล:", error);
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
                                    onError={(e) => { e.target.src = "https://localhost:7039/uploads/admin/default-profile.jpg"; }} // ✅ ถ้าโหลดรูปไม่ได้ ให้ใช้รูป default
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
                        <li><Link to="/LeaveGraph" className="hover:bg-green-100 font-FontNoto font-bold">สถิติการลาพนักงาน</Link></li>
                        <li><Link to="/UserList" className="hover:bg-green-100 hover:text-black font-FontNoto font-bold">ข้อมูลพนักงาน</Link></li>
                        <li><Link to="/AdminLogout" className="hover:bg-error hover:text-white font-FontNoto font-bold">ออกจากระบบ</Link></li>
                    </ul>
                </div>
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-30"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
                {isModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                        <div className="bg-white rounded-lg shadow-lg p-6 w-1/3">
                            <h2 className="text-xl font-bold mb-4 font-FontNoto">เพิ่มข้อมูลสำเร็จ</h2>
                            <p className="font-FontNoto">ข้อมูลประสบการณ์ทำงานถูกบันทึกเรียบร้อยแล้ว</p>
                            <div className="mt-4 flex justify-center">
                                <button
                                    className="btn btn-primary font-FontNoto"
                                    onClick={() => handleCloseModal(false)} // ปิด Modal
                                >
                                    ตกลง
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Main Content */}
                <div className="flex-1 p-4 md:p-10 bg-white shadow-lg rounded-none md:rounded-lg">
                    <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md p-6">
                        <div className="mt-6 flex justify-between ">
                            <h2 className="text-2xl font-bold mb-4 font-FontNoto">เพิ่มประสบการณ์ทำงาน</h2>
                            <button
                                onClick={() => history.back()}
                                className="btn btn-outline btn-error font-FontNoto"
                            >
                                กลับไปยังรายการ
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-FontNoto">เลือกพนักงาน</span>
                                </label>
                                <select
                                    className="select select-bordered text-black bg-white focus:bg-white focus:text-black font-FontNoto"
                                    value={selectedUserID}
                                    onChange={handleUserChange}
                                    required
                                >
                                    <option className="font-FontNoto" value="" disabled>กรุณาเลือกพนักงาน</option>
                                    {users.map((user) => (
                                        <option className="font-FontNoto" key={user.userID} value={user.userID}>
                                            {user.firstName || ''} {user.lastName || ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-FontNoto">ชื่อบริษัท</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="companyName"
                                        className="input input-bordered font-FontNoto"
                                        placeholder="กรอกชื่อบริษัท"
                                        value={newExperience.companyName}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.companyName && <p className="text-red-500 text-sm font-FontNoto">{errors.companyName}</p>}
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-FontNoto">ตำแหน่ง</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="jobTitle"
                                        className="input input-bordered font-FontNoto"
                                        placeholder="กรอกตำแหน่ง"
                                        value={newExperience.jobTitle}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.jobTitle && <p className="text-red-500 text-sm font-FontNoto">{errors.jobTitle}</p>}
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-FontNoto">เงินเดือน</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="salary"
                                        className="input input-bordered font-FontNoto"
                                        placeholder="กรอกเงินเดือน"
                                        value={newExperience.salary}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.salary && <p className="text-red-500 text-sm font-FontNoto">{errors.salary}</p>}
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-FontNoto">ปีที่เริ่มต้น</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="startDate"
                                        className="input input-bordered font-FontNoto"
                                        placeholder="กรอกปีที่เริ่มต้น (ตัวอย่าง: 2567)"
                                        value={newExperience.startDate}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.startDate && <p className="text-red-500 text-sm font-FontNoto">{errors.startDate}</p>}
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-FontNoto">ปีที่สิ้นสุด</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="endDate"
                                        className="input input-bordered font-FontNoto"
                                        placeholder="กรอกปีที่สิ้นสุด (ตัวอย่าง: 2568)"
                                        value={newExperience.endDate}
                                        onChange={handleChange}
                                    />
                                    {errors.endDate && <p className="text-red-500 text-sm font-FontNoto">{errors.endDate}</p>}
                                </div>
                            </div>
                            <button type="submit" className="btn btn-warning w-full font-FontNoto">เพิ่มประสบการณ์ทำงาน</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreateWorkExperience;
