import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { GetUser } from '../function/apiservice';


function CreateEducation() {
    const [newEducation, setNewEducation] = useState({
        level: "",
        institute: "",
        fieldOfStudy: "",
        year: "",
        gpa: "",
    });

    const [users, setUsers] = useState([]);
    const [selectedUserID, setSelectedUserID] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false); // Manage modal state
    const [errorMessage, setErrorMessage] = useState("");
    const [profilePic, setProfilePic] = useState(""); // รูปโปรไฟล์
    const [adminName, setAdminName] = useState(""); // ชื่อจริงของแอดมิน
    const [selectedFile, setSelectedFile] = useState(null); // ไฟล์ที่เลือก
    const [uploadMessage, setUploadMessage] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

    const levelLabels = {
        Primary: "ประถมศึกษา",
        Secondary: "มัธยมศึกษา",
        Voc: "ประกาศนียบัตรวิชาชีพ (ปวช.)",
        Dip: "ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)",
        Bachelor: "ปริญญาตรี",
        Master: "ปริญญาโท",
        Doctorate: "ปริญญาเอก",
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // ตรวจสอบว่า year มีเฉพาะตัวเลขและเครื่องหมายขีดตามรูปแบบ
        if (name === "year" && !/^\d{0,4}(-\d{0,4})?$/.test(value)) {
            return; // หยุดการอัปเดต state ถ้าค่าไม่ตรงรูปแบบที่กำหนด
        }

        // ตรวจสอบว่า gpa อยู่ในช่วง 0.01 ถึง 4.00
        if (name === "gpa") {
            const gpa = parseFloat(value);
            if (gpa < 0.01 || gpa > 4.00) {
                return; // หยุดการอัปเดต state ถ้าค่าไม่อยู่ในช่วงที่กำหนด
            }
        }

        setNewEducation({ ...newEducation, [name]: value });
    };

    const handleUserChange = (e) => {
        setSelectedUserID(e.target.value);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false); // ปิด Modal
        if (selectedUserID !== null && selectedUserID !== '') {
            navigate(`/users/${selectedUserID}`); // เด้งไปหน้า /users/:UserID
        }

    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // ตรวจสอบข้อมูล Validation
        if (!selectedUserID) {
            setErrorMessage("กรุณาเลือกพนักงานก่อนบันทึกข้อมูลการศึกษา");
            return;
        }

        const yearRegex = /^\d{4}-\d{4}$/; // รูปแบบปี เช่น 2567-2568
        if (newEducation.year && !yearRegex.test(newEducation.year)) {
            setErrorMessage("กรุณากรอกปีในรูปแบบ 2567-2568");
            return;
        }

        if (newEducation.gpa < 0 || newEducation.gpa > 4) {
            setErrorMessage("กรุณากรอกเกรดเฉลี่ยสะสมให้ถูกต้อง (0.00 - 4.00)");
            return;
        }

        // ล้างข้อความข้อผิดพลาดหากการตรวจสอบผ่าน
        setErrorMessage("");

        try {
            // ส่งข้อมูลการศึกษาไปยัง API
            await axios.post("https://localhost:7039/api/Admin/educations", {
                ...newEducation,
                userID: selectedUserID,
            });

            // แสดง Modal เมื่อเพิ่มข้อมูลสำเร็จ
            setIsModalOpen(true);

            // ล้างฟิลด์ข้อมูลหลังการบันทึกสำเร็จ
            setNewEducation({
                level: "",
                institute: "",
                fieldOfStudy: "",
                year: "",
                gpa: "",
            });
        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการเพิ่มข้อมูล:", error);
            alert("เกิดข้อผิดพลาดในการเพิ่มข้อมูลการศึกษา");
        }
    };
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
                            <h2 className="text-xl font-bold text-center mb-4 font-FontNoto">เพิ่มข้อมูลสำเร็จ</h2>
                            <p className="text-center font-FontNoto">ข้อมูลการศึกษาถูกบันทึกเรียบร้อยแล้ว</p>
                            <div className="mt-4 flex justify-center">
                                <button
                                    className="btn btn-primary font-FontNoto"
                                    onClick={() => handleCloseModal(false)}
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
                            <h2 className="text-2xl font-bold mb-4 font-FontNoto">เพิ่มการศึกษา</h2>
                            <button
                                onClick={() => history.back()}
                                className="btn btn-outline btn-error font-FontNoto"
                            >
                                กลับไปยังรายการ
                            </button>
                        </div>
                        {errorMessage && (
                            <div className="alert alert-error shadow-lg mb-4">
                                <div>
                                    <span className="font-FontNoto">{errorMessage}</span>
                                </div>
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-FontNoto">เลือกพนักงาน</span>
                                </label>
                                <select
                                    name="userID"
                                    className="select select-bordered text-black bg-white focus:bg-white focus:text-black font-FontNoto"
                                    value={selectedUserID}
                                    onChange={handleUserChange}
                                    required
                                >
                                    <option value="" disabled className="text-gray-500 font-FontNoto">
                                        กรุณาเลือกพนักงาน
                                    </option>
                                    {users.map((user) => (
                                        <option
                                            key={user.userID}
                                            value={user.userID}
                                            className="select select-bordered text-black bg-white focus:bg-white focus:text-black font-FontNoto"
                                        >
                                            {user.firstName || ''} {user.lastName || ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-FontNoto">ระดับการศึกษา</span>
                                    </label>
                                    <select
                                        name="level"
                                        className="select select-bordered text-black bg-white focus:bg-white focus:text-black font-FontNoto"
                                        value={newEducation.level}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="" disabled className="text-gray-500 font-FontNoto">กรุณาเลือกระดับการศึกษา</option>
                                        {Object.entries(levelLabels).map(([key, label]) => (
                                            <option key={key} value={key} className="select select-bordered text-black bg-white focus:bg-white focus:text-black font-FontNoto">
                                                {label}
                                            </option>
                                        ))}
                                    </select>

                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-FontNoto">ชื่อสถาบัน</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="institute"
                                        className="input input-bordered font-FontNoto"
                                        placeholder="กรอกชื่อสถาบัน"
                                        value={newEducation.institute}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-FontNoto">สาขาวิชา</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="fieldOfStudy"
                                        className="input input-bordered font-FontNoto"
                                        placeholder="กรอกสาขาวิชา"
                                        value={newEducation.fieldOfStudy}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-FontNoto">ปีที่ศึกษา</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="year"
                                        className="input input-bordered font-FontNoto"
                                        placeholder="กรอกปีที่ศึกษา (ตัวอย่าง: 2567-2568)"
                                        value={newEducation.year}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-FontNoto">เกรดเฉลี่ยสะสม</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="gpa"
                                        className="input input-bordered font-FontNoto"
                                        placeholder="กรอกเกรดเฉลี่ยสะสม"
                                        value={newEducation.gpa}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-warning w-full font-FontNoto">เพิ่มการศึกษา</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreateEducation;
