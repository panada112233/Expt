import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const sexLabels = {
    Male: "ชาย",
    Female: "หญิง",
};

const roleMapping = {
    Hr: "ทรัพยากรบุคคล",
    GM: "ผู้จัดการทั่วไป",
    Dev: "นักพัฒนาระบบ",
    BA: "นักวิเคราะห์ธุรกิจ",
    Employee: "พนักงาน",
};

// ฟังก์ชันแปลงวันที่ให้เป็นรูปแบบ DD-MM-YYYY
const formatDateForDisplay = (date) => {
    if (!date) return "-";
    const nDate = new Date(date);
    if (isNaN(nDate)) return "-";
    const day = String(nDate.getDate()).padStart(2, "0");
    const month = String(nDate.getMonth() + 1).padStart(2, "0");
    const year = nDate.getFullYear();
    return `${day}-${month}-${year}`;
};

const Allemployee = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        axios
            .get("https://localhost:7039/api/Admin/Users")
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

    const handleViewDetails = (user) => {
        navigate(`/EmpHome/Alldocuments`, { state: { user } });
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
            <div className="w-full bg-gradient-to-r from-cyan-900 via-cyan-600 to-slate-500 text-white rounded-xl p-4 sm:p-5 md:p-6 mb-6 shadow-lg">
                <h1 className="text-xl sm:text-2xl font-bold font-FontNoto leading-snug">
                    ข้อมูลพนักงานในระบบ
                </h1>
                <span className="text-xs sm:text-sm mt-1 font-FontNoto">
                    จำนวนพนักงานทั้งหมด: {users.length} คน
                </span>
            </div>
            <div className="flex-1 bg-transparent p-6 rounded-3xl">
                {/* Search Form */}
                <div className="flex items-center justify-end space-x-4 mb-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="input input-bordered font-FontNoto w-60"
                            placeholder="ค้นหาชื่อหรือสกุล..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button
                            className="btn btn-primary font-FontNoto"
                            onClick={handleSearch}
                        >
                            ค้นหา
                        </button>
                    </div>
                </div>

                {/* ตาราง */}
                {loading ? (
                    <div className="text-center py-6 font-FontNoto text-blue-700">
                        กำลังโหลดข้อมูล...
                    </div>
                ) : error ? (
                    <div className="text-center py-6 text-red-500 font-FontNoto">
                        {error}
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl">
                        <table className="min-w-full bg-white">
                            <thead className="bg-blue-800 text-white font-FontNoto">
                                <tr>
                                    <th className="py-3 px-4 font-FontNoto">โปรไฟล์</th>
                                    <th className="py-3 px-4 font-FontNoto">ชื่อ-นามสกุล</th>
                                    <th className="py-3 px-4 font-FontNoto">อีเมล</th>
                                    <th className="py-3 px-4 font-FontNoto">โทรศัพท์</th>
                                    <th className="py-3 px-4 font-FontNoto">แผนก</th>
                                    <th className="py-3 px-4 font-FontNoto">ตำแหน่ง</th>
                                    <th className="py-3 px-4 font-FontNoto">วันเริ่มงาน</th>
                                    <th className="py-3 px-4 font-FontNoto">เพศ</th>
                                    <th className="py-3 px-4 font-FontNoto">ข้อมูล</th>
                                </tr>
                            </thead>
                            <tbody className="text-center">
                                {(searchTerm ? filteredUsers : users).length > 0 ? (
                                    (searchTerm ? filteredUsers : users).map((user) => {
                                        const profileImageUrl = `https://localhost:7039/api/Files/GetProfileImage?userID=${user.userID}`;
                                        return (
                                            <tr key={user.userID} className="hover:bg-blue-100 transition">
                                                <td className="py-2">
                                                    <img
                                                        src={profileImageUrl || "/placeholder.jpg"}
                                                        alt="โปรไฟล์"
                                                        className="w-20 h-20 rounded-xl object-cover mx-auto cursor-pointer border-2 border-blue-400"
                                                        onClick={() => openModal(profileImageUrl)}
                                                    />
                                                </td>
                                                <td className="py-2 font-FontNoto">{user.firstName} {user.lastName}</td>
                                                <td className="py-2 font-FontNoto">{user.email}</td>
                                                <td className="py-2 font-FontNoto">{user.contact}</td>
                                                <td className="py-2 font-FontNoto">{roleMapping[user.role]}</td>
                                                <td className="py-2 font-FontNoto">{user.designation}</td>
                                                <td className="py-2 font-FontNoto">{formatDateForDisplay(user.jDate)}</td>
                                                <td className="py-2 font-FontNoto">{sexLabels[user.gender]}</td>
                                                <td className="py-2">
                                                    <button
                                                        className="btn btn-info btn-sm font-FontNoto"
                                                        onClick={() => handleViewDetails(user)}
                                                    >
                                                        ดูเพิ่มเติม
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td className="py-6 font-FontNoto text-gray-500" colSpan="9">
                                            ไม่มีข้อมูล
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

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
