import React, { useState, useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import axios from "axios";

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

const EmpBase = () => {
  const [currentProfileImage, setCurrentProfileImage] = useState("");
  const [userName, setUserName] = useState("กำลังโหลด...");
  const [role, setRole] = useState(null); // state สำหรับ role
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ✅ ใช้ useState แทนการดึงทันที
  const [currentUserId, setCurrentUserId] = useState("");
  const [userID, setUserID] = useState("");
  const [roleText, setRoleText] = useState("กำลังโหลด...");

  // ✅ ดึงข้อมูลจาก sessionStorage หลังจาก component mount
  useEffect(() => {
    const id = sessionStorage.getItem("userId");
    const storedRole = sessionStorage.getItem("role");

    if (id) {
      setCurrentUserId(id);
      setUserID(id);
      fetchProfileImageAndUserData(id); // ส่ง id เข้าไปด้วย
    }

    if (storedRole) {
      setRole(storedRole);
      console.log("Role from sessionStorage:", storedRole);
    } else {
      fetchRole();
    }
  }, []);

  const openModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedImage(null);
    setIsModalOpen(false);
  };

  const fetchRole = async () => {
    try {
      const response = await axios.get("/api/admin/GetUserRole");
      if (response.status === 200) {
        const userRole = response.data.Role;
        setRole(userRole);
        sessionStorage.setItem("role", userRole); // เก็บ role ใน sessionStorage
      } else {
        console.error("Failed to fetch user role");
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const fetchProfileImageAndUserData = async (id) => {
    // แยกการดึงข้อมูลรูปภาพและข้อมูลผู้ใช้ออกจากกัน
    // ดึงข้อมูลรูปภาพ
    try {
      const profileResponse = await axios.get(
        `https://192.168.1.188/hrwebapi/api/Files/GetProfileImage?userID=${id}`
      );

      if (profileResponse.status === 200) {
        const fullImageUrl = `https://192.168.1.188/hrwebapi/api/Files/GetProfileImage?userID=${id}`;
        setCurrentProfileImage(fullImageUrl);
      }
    } catch (error) {
      console.error("Error fetching profile image:", error);
      // กำหนดรูปภาพเริ่มต้น
      setCurrentProfileImage("https://192.168.1.188/hrwebapi/api/Files/GetDefaultProfileImage");
    }

    // ดึงข้อมูลผู้ใช้งานแยกต่างหาก
    try {
      const userResponse = await axios.get(
        `https://192.168.1.188/hrwebapi/api/Users/Getbyid/${id}`
      );
      if (userResponse.status === 200) {
        const userData = userResponse.data;
        if (userData && (userData.firstName || userData.lastName)) {
          setUserName(`${userData.firstName || ""} ${userData.lastName || ""}`.trim());
        } else {
          setUserName("ผู้ใช้งานใหม่");
        }
        const roleName = roleMapping[userData.role] || "ไม่ระบุตำแหน่ง";
        setRoleText(roleName);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserName("ผู้ใช้งานใหม่");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <div className="navbar fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-100 via-blue-50 to-cyan-50 justify-between items-center px-4 py-2 h-[64px]">
        <div className="flex items-center">
          <div className="font-bold text-blue-950 text-lg">
            <h1>THE EXPERTISE CO,LTD.</h1>
          </div>
        </div>
        {/* Hamburger Button แสดงเฉพาะมือถือ */}
        <div className="md:hidden flex justify-end px-4 py-2">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <svg
              className="w-8 h-8 text-blue-950"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 py-2 bg-gradient-to-br from-blue-50 via-blue-50 to-slate-50">
        {/* Sidebar */}
        <aside
          className={`bg-gradient-to-r from-blue-100 via-blue-50 to-cyan-50 shadow-md text-black fixed top-[64px] left-0 h-[calc(100vh-64px)] w-[280px] md:w-[280px] p-4 z-50 transform transition-transform overflow-y-auto
  ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
        >

          <div className="text-center my-4">
            {/* Avatar */}
            <div className="avatar mb-4 mx-auto">
              <div
                className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 cursor-pointer"
                onClick={() => openModal(currentProfileImage)}
              >
                <img
                  src={currentProfileImage}
                  alt="โปรไฟล์พนักงาน"
                  className="object-cover w-full h-full font-FontNoto"
                />
              </div>
            </div>
            <div className="w-full overflow-hidden">
              <h4 className="text-base font-bold text-black font-FontNoto whitespace-nowrap truncate px-2">
                {userName}
              </h4>
              <p className="text-sm text-gray-600 font-FontNoto px-2 truncate">
                {roleText}
              </p>
              <div className="px-2 mt-1 flex justify-center">
                <Link
                  to="/EmpHome/Profile"
                  onClick={() => setIsSidebarOpen(false)}
                  className="px-5 py-1.5 bg-white text-blue-700 border border-blue-300 rounded-full font-FontNoto font-semibold shadow-sm hover:shadow-md hover:bg-blue-50 transition duration-150 text-sm"
                >
                  Portfolio
                </Link>
              </div>
            </div>

            {/* Modal รูปภาพขยาย */}
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
          {/* Sidebar Links */}
          <div className="overflow-y-auto max-h-[calc(100vh-64px)]">
            <ul className="space-y-2 w-full text-sm font-FontNoto">
              {role !== "ADMIN" && (
                <>
                  <Link
                    to="/EmpHome/Workplan"
                    className="flex items-center justify-between px-4 py-3 rounded-lg bg-white text-blue-900 hover:bg-cyan-50 hover:text-blue-800 font-FontNoto font-bold shadow transition duration-200 whitespace-nowrap overflow-hidden"
                  >
                    ปฏิทินการทำงาน
                  </Link>
                  <Link
                    to="/EmpHome/Worktime"
                    className="flex items-center justify-between px-4 py-3 rounded-lg bg-white text-blue-900 hover:bg-cyan-50 hover:text-blue-800 font-FontNoto font-bold shadow transition duration-200 whitespace-nowrap overflow-hidden"
                  >
                    ระบบบันทึกเข้าออกงาน
                  </Link>
                  <Link
                    to="/EmpHome/Document"
                    className="flex items-center justify-between px-4 py-3 rounded-lg bg-white text-blue-900 hover:bg-cyan-50 hover:text-blue-800 font-FontNoto font-bold shadow transition duration-200 whitespace-nowrap overflow-hidden"
                  >
                    จัดการเอกสาร
                  </Link>
                  <Link
                    to="/EmpHome/LeaveRequestForm"
                    className="flex items-center justify-between px-4 py-3 rounded-lg bg-white text-blue-900 hover:bg-cyan-50 hover:text-blue-800 font-FontNoto font-bold shadow transition duration-200 whitespace-nowrap overflow-hidden"
                  >
                    ระบบลางาน
                  </Link>
                  <Link
                    to="/EmpHome/BorrowEquipmentsEmp"
                    className="flex items-center justify-between px-4 py-3 rounded-lg bg-white text-blue-900 hover:bg-cyan-50 hover:text-blue-800 font-FontNoto font-bold shadow transition duration-200 whitespace-nowrap overflow-hidden"
                  >
                    ยืม-คืนอุปกรณ์
                  </Link>
                </>
              )}
              {/* {role !== "ADMIN" && (
                <details className="group ">
                  <summary className="cursor-pointer flex items-center justify-between px-4 py-3 rounded-lg bg-white text-black hover:bg-blue-900 hover:text-white font-FontNoto font-bold shadow transition duration-200 whitespace-nowrap overflow-hidden">
                    จัดการเอกสาร
                    <svg
                      className="w-4 h-4 transition-transform group-open:rotate-180 flex-shrink-0 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </summary>

                  <ul className="mt-2 ml-3 space-y-1 text-sm">
                    <li>
                      <Link
                        to="/EmpHome"
                        onClick={() => setIsSidebarOpen(false)}
                        className="block px-4 py-2 rounded-md bg-white shadow hover:shadow-lg hover:bg-blue-50 text-black font-bold font-FontNoto transition duration-150 whitespace-nowrap overflow-hidden text-ellipsis"
                      >
                        กราฟจำนวนเอกสาร
                      </Link>
                    </li>
                  </ul>
                </details>
              )} */}
              {role === "ADMIN" ? (
                <>
                  <Link
                    to="/EmpHome/Allemployee"
                    className="flex items-center justify-between px-4 py-3 rounded-lg bg-white text-blue-900 hover:bg-cyan-50 hover:text-blue-800 font-FontNoto font-bold shadow transition duration-200 whitespace-nowrap overflow-hidden"
                  >
                    ระบบจัดการข้อมูลพนักงาน
                  </Link>
                  <Link
                    to="/EmpHome/WorkplanAdmin"
                    className="flex items-center justify-between px-4 py-3 rounded-lg bg-white text-blue-900 hover:bg-cyan-50 hover:text-blue-800 font-FontNoto font-bold shadow transition duration-200 whitespace-nowrap overflow-hidden"
                  >
                    แผนการทำงานพนักงาน
                  </Link>
                  <Link
                    to="/EmpHome/WorktimeEmp"
                    className="flex items-center justify-between px-4 py-3 rounded-lg bg-white text-blue-900 hover:bg-cyan-50 hover:text-blue-800 font-FontNoto font-bold shadow transition duration-200 whitespace-nowrap overflow-hidden"
                  >
                    ระบบบันทึกเข้า-ออกงาน
                  </Link>
                  <Link
                    to="/EmpHome/Allemployee"
                    className="flex items-center justify-between px-4 py-3 rounded-lg bg-white text-blue-900 hover:bg-cyan-50 hover:text-blue-800 font-FontNoto font-bold shadow transition duration-200 whitespace-nowrap overflow-hidden"
                  >
                    ระบบลางานพนักงาน
                  </Link>
                  <Link
                    to="/EmpHome/Allemployee"
                    className="flex items-center justify-between px-4 py-3 rounded-lg bg-white text-blue-900 hover:bg-cyan-50 hover:text-blue-800 font-FontNoto font-bold shadow transition duration-200 whitespace-nowrap overflow-hidden"
                  >
                    ระบบยืม-คืนอุปกรณ์
                  </Link>
                </>
              ) : role === "Hr" ? (
                <>
                  <Link
                    to="/EmpHome/HRInbox"
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center justify-between px-4 py-3 rounded-lg bg-white text-blue-900 hover:bg-cyan-50 hover:text-blue-800 font-FontNoto font-bold shadow transition duration-200 whitespace-nowrap overflow-hidden"
                  >
                    ใบลาพนักงาน
                  </Link>
                </>
              ) : role === "GM" ? (
                <>
                  <li>
                    <Link
                      to="/EmpHome/GMInbox"
                      onClick={() => setIsSidebarOpen(false)}
                      className="flex items-center justify-between px-4 py-3 rounded-lg bg-white text-blue-900 hover:bg-cyan-50 hover:text-blue-800 font-FontNoto font-bold shadow transition duration-200 whitespace-nowrap overflow-hidden"
                    >
                      ใบลาพนักงาน
                    </Link>
                  </li>
                </>
              ) : null}
              {role === "GM" || role === "Hr" || role === "HEAD_BA" ? (
                <>
                  <details className="group">
                    <summary className="cursor-pointer flex items-center justify-between px-4 py-3 rounded-lg bg-white text-black hover:bg-blue-900 hover:text-white font-FontNoto font-bold shadow transition duration-200 whitespace-nowrap overflow-hidden">
                      ข้อมูลพนักงาน
                      <svg
                        className="w-4 h-4 transition-transform group-open:rotate-180 flex-shrink-0 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </summary>
                    <ul className="mt-2 ml-3 space-y-1 text-sm">
                      <li>
                        <Link
                          to="/EmpHome/WorktimeEmp"
                          onClick={() => setIsSidebarOpen(false)}
                          className="block px-4 py-2 rounded-md bg-white shadow hover:shadow-lg hover:bg-blue-50 text-black font-bold font-FontNoto transition duration-150 whitespace-nowrap overflow-hidden text-ellipsis"
                        >
                          รายการเข้า-ออกงาน
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/EmpHome/WorkplanGM"
                          onClick={() => setIsSidebarOpen(false)}
                          className="block px-4 py-2 rounded-md bg-white shadow hover:shadow-lg hover:bg-blue-50 text-black font-bold font-FontNoto transition duration-150 whitespace-nowrap overflow-hidden text-ellipsis"
                        >
                          แผนการทำงาน
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/EmpHome/LeaveStatistics"
                          onClick={() => setIsSidebarOpen(false)}
                          className="block px-4 py-2 rounded-md bg-white shadow hover:shadow-lg hover:bg-blue-50 text-black font-bold font-FontNoto transition duration-150 whitespace-nowrap overflow-hidden text-ellipsis"
                        >
                          สถิติการลา
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/EmpHome/ManageEquipmentsAdmin"
                          onClick={() => setIsSidebarOpen(false)}
                          className="block px-4 py-2 rounded-md bg-white shadow hover:shadow-lg hover:bg-blue-50 text-black font-bold font-FontNoto transition duration-150 whitespace-nowrap overflow-hidden text-ellipsis"
                        >
                          รายการยืม-คืนอุปกรณ์
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/EmpHome/TrendStatistics"
                          onClick={() => setIsSidebarOpen(false)}
                          className="block px-4 py-2 rounded-md bg-white shadow hover:shadow-lg hover:bg-blue-50 text-black font-bold font-FontNoto transition duration-150 whitespace-nowrap overflow-hidden text-ellipsis"
                        >
                          กราฟเอกสารรายปี
                        </Link>
                      </li>
                    </ul>
                  </details>
                  <Link
                    to="/EmpHome/Allemployee"
                    className="flex items-center justify-between px-4 py-3 rounded-lg bg-white text-blue-900 hover:bg-cyan-50 hover:text-blue-800 font-FontNoto font-bold shadow transition duration-200 whitespace-nowrap overflow-hidden"
                  >
                    พนักงานในระบบ
                  </Link>
                </>
              ) : null}
              <li>
                <Link
                  to="/EmpHome/Logout"
                  onClick={() => setIsSidebarOpen(false)}
                  className="cursor-pointer block px-4 py-2 rounded-md bg-slate-500 text-white shadow hover:shadow-lg hover:bg-red-400 hover:text-cyan-950 font-FontNoto font-bold transition duration-200"
                >
                  ออกจากระบบ
                </Link>
              </li>
            </ul>
          </div>
        </aside>
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        {/* Main Content */}
        <div className="md:ml-[280px] mt-[64px] p-2 w-full min-h-[calc(100vh-64px)] overflow-auto bg-gradient-to-br from-blue-50 via-blue-50 to-slate-50">
          <div className="max-w-[1550px] mx-auto  ">
            <Outlet />
          </div>
        </div>

        {/* ปุ่มลอย: กลับหน้าหลัก (สีเหลือง) */}
        <Link
          to="/LandingAfterLogin"
          className="fixed bottom-6 right-6 z-50 bg-yellow-400 hover:bg-yellow-500 hover:scale-105 transform transition duration-300 text-white rounded-full p-4 shadow-lg"
          title="กลับหน้าหลัก"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 1.293a1 1 0 00-1.414 0l-7 7A1 1 0 003 9h1v7a2 2 0 002 2h3v-5h2v5h3a2 2 0 002-2V9h1a1 1 0 00.707-1.707l-7-7z" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default EmpBase;
