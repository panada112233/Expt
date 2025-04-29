import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { NavLink } from 'react-router-dom';
import { GetUser } from '../function/apiservice';
import logo from "../assets/1.png";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [profilePic, setProfilePic] = useState(""); // รูปโปรไฟล์
  const [adminName, setAdminName] = useState(""); // ชื่อจริงของแอดมิน
  const [selectedFile, setSelectedFile] = useState(null); // ไฟล์ที่เลือก
  const [uploadMessage, setUploadMessage] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

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

  const handleDelete = (id) => {
    axios
      .delete(`https://localhost:7039/api/Admin/users/${id}`)
      .then(() => {
        setUsers(users.filter((user) => user.userID !== id));
        // ลบข้อมูลสำเร็จโดยไม่มีการแสดง alert
      })
      .catch((error) => {
        console.error("Error deleting user:", error.response || error);
        alert("เกิดข้อผิดพลาดในการลบข้อมูล");
      });
  };

  const handleSearch = () => {
    const results = users.filter((user) =>
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(results);
  };

  const handleViewDetails = (user) => {
    navigate(`/users/${user.userID}`);
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
            <li><NavLink to="/UserList" className={({ isActive }) => isActive ? "hover:bg-gray-300 hover:text-black font-FontNoto font-bold bg-gray-200" : "hover:bg-yellow-100 hover:text-black font-FontNoto font-bold"}>ข้อมูลพนักงาน</NavLink></li>
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
          <h2 className="text-2xl font-bold text-black font-FontNoto">จัดการข้อมูลพนักงาน</h2>
          {/* Search Form */}
          <div className="flex justify-start md:justify-end gap-2 mt-4 overflow-x-auto whitespace-nowrap px-1">
            <input
              type="text"
              className="input input-bordered font-FontNoto w-[160px] sm:w-auto"
              placeholder="ค้นหาชื่อ-นามสกุล..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn btn-outline btn-success font-FontNoto" onClick={handleSearch}>
              ค้นหา
            </button>
            <Link to="/AdminRegistration" className="btn btn-outline btn-secondary font-FontNoto">
              เพิ่มแอดมิน
            </Link>
            <Link to="/UserForm/create" className="btn btn-outline btn-primary font-FontNoto">
              เพิ่มผู้ใช้งาน
            </Link>
          </div>

          <div className="mt-4 text-center md:text-left">
            <span className="font-FontNoto text-lg">จำนวนพนักงานทั้งหมด: {users.length} คน</span>
          </div>
          {loading ? (
            <div className="text-center py-6 font-FontNoto">กำลังโหลดข้อมูล...</div>
          ) : error ? (
            <div className="text-center py-6 text-red-500 font-FontNoto">{error}</div>
          ) : (
            <>
              {/* Responsive Table */}
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">

                      <th className="border px-4 py-2 font-FontNoto">ชื่อ</th>
                      <th className="border px-4 py-2 font-FontNoto">นามสกุล</th>
                      <th className="border px-4 py-2 font-FontNoto">อีเมล</th>
                      <th className="border px-4 py-2 font-FontNoto">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(searchTerm ? filteredUsers : users).length > 0 ? (
                      (searchTerm ? filteredUsers : users).map((user) => (
                        <tr key={user.userID} className="hover:bg-gray-50">

                          <td className="border px-4 py-2 font-FontNoto">{user.firstName}</td>
                          <td className="border px-4 py-2 font-FontNoto">{user.lastName}</td>
                          <td className="border px-4 py-2 font-FontNoto">{user.email}</td>
                          <td className="border px-4 py-2 space-x-2 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                className="btn btn-outline btn-info btn-sm font-FontNoto"
                                onClick={() => handleViewDetails(user)}
                              >
                                ดูข้อมูล
                              </button>
                              <Link
                                to={`/users/edit/${user.userID}`}
                                className="btn btn-outline btn-warning btn-sm font-FontNoto"
                              >
                                แก้ไข
                              </Link>
                              <button
                                className="btn btn-outline btn-error btn-sm font-FontNoto"
                                onClick={() => document.getElementById(`delete_modal_${user.userID}`).showModal()}
                              >
                                ลบ
                              </button>

                              {/* Modal สำหรับยืนยันการลบ */}
                              <dialog id={`delete_modal_${user.userID}`} className="modal">
                                <div className="modal-box">
                                  <h3 className="font-bold text-lg font-FontNoto text-left">คุณแน่ใจหรือไม่?</h3>
                                  <p className="py-4 font-FontNoto text-left">การลบผู้ใช้งานนี้จะไม่สามารถกู้คืนได้!</p>
                                  <div className="modal-action">
                                    {/* ปุ่มยกเลิก */}
                                    <button className="btn btn-warning font-FontNoto" onClick={() => document.getElementById(`delete_modal_${user.userID}`).close()}>
                                      ยกเลิก
                                    </button>
                                    {/* ปุ่มยืนยันการลบ */}
                                    <button
                                      className="btn btn-success font-FontNoto"
                                      onClick={() => {
                                        handleDelete(user.userID); // เรียกฟังก์ชันลบ
                                        document.getElementById(`delete_modal_${user.userID}`).close(); // ปิด Modal
                                      }}
                                    >
                                      ยืนยัน
                                    </button>
                                  </div>
                                </div>
                              </dialog>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="border px-4 py-2 text-center font-FontNoto" colSpan="10">
                          ไม่มีข้อมูล
                        </td>
                      </tr>
                    )}
                  </tbody>

                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>

  );
};

export default UserList;
