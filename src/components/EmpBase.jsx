import React, { useState, useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import axios from "axios";
import ChatPage from "../components/ChatPage"; // ขึ้นอยู่กับตำแหน่งที่เก็บไฟล์

const EmpBase = () => {
  const [currentProfileImage, setCurrentProfileImage] = useState("");
  const [userName, setUserName] = useState("กำลังโหลด...");
  const [role, setRole] = useState(null); // state สำหรับ role
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  // ✅ ใช้ useState แทนการดึงทันที
  const [currentUserId, setCurrentUserId] = useState("");
  const [userID, setUserID] = useState("");

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
    try {
      // ✅ ดึงข้อมูลโปรไฟล์รูปภาพ
      const profileResponse = await axios.get(
        `https://localhost:7039/api/Files/GetProfileImage?userID=${id}`
      );

      if (profileResponse.status === 200) {
        const fullImageUrl = `https://localhost:7039/api/Files/GetProfileImage?userID=${id}`;
        setCurrentProfileImage(fullImageUrl);
      }

      // ✅ ดึงข้อมูลผู้ใช้งาน
      const userResponse = await axios.get(
        `https://localhost:7039/api/Users/Getbyid/${id}`
      );
      if (userResponse.status === 200) {
        const userData = userResponse.data;
        setUserName(`${userData.firstName} ${userData.lastName}` || "ไม่ทราบชื่อ");
      }
    } catch (error) {
      console.error("Error fetching profile image or user data:", error);
    }
  };


  return (
    <div className="flex flex-col min-h-screen">
      {/* ✅ ปุ่มลอย: เปิด/ปิดแชท */}
      <button
        onClick={() => setShowChat(prev => !prev)}
        className="fixed bottom-24 right-6 z-50 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 hover:scale-105 transform transition duration-300 text-white rounded-full p-4 shadow-lg"
        title={showChat ? "ปิดแชท" : "เปิดแชท"}
      >
        {showChat ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4.23-.93L3 20l1.23-3.23A8.97 8.97 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>


      {/* ✅ แสดง ChatPage เป็น popup เมื่อเปิด */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl h-full max-h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">

            {/* ปุ่มปิด */}
            <button
              onClick={() => setShowChat(false)}
              className="absolute top-2 right-3 text-gray-500 hover:text-red-500 text-2xl font-bold z-50"
              title="ปิดแชท"
            >
              ×
            </button>

            {/* เนื้อหา ChatPage */}
            <div className="flex-1 p-4">
              {currentUserId ? (
                <ChatPage currentUserId={currentUserId} popupMode={true} />
              ) : (
                <div className="flex justify-center items-center h-full text-gray-500 font-FontNoto text-lg">
                  กำลังโหลดข้อมูลผู้ใช้...
                </div>
              )}
            </div>

          </div>
        </div>
      )}


      {/* Navbar */}
      <div className="navbar fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-cyan-950 via-blue-900 to-purple-950 justify-between items-center px-4 py-2 h-[64px]">
        <div className="flex items-center">
          <div

          >
            {/* <img src={logo} className="h-8 w-auto mr-2" alt="Logo" /> */}
            <span style={{ color: "white", fontWeight: "bold" }}>THE </span>
            &nbsp;
            <span style={{ color: "white", fontWeight: "bold" }}>EXPERTISE </span>
            &nbsp;
            <span style={{ color: "white", fontWeight: "bold" }}>CO, LTD.</span>
          </div>
        </div>
        {/* Hamburger Button แสดงเฉพาะมือถือ */}
        <div className="md:hidden flex justify-end px-4 py-2">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <svg
              className="w-8 h-8 text-white"
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

      <div className="flex flex-col md:flex-row flex-1 py-2">
        {/* Sidebar */}
        <aside
          className={`bg-white shadow-md text-black fixed top-[64px] left-0 h-[calc(100vh-64px)] w-[60vw] md:w-[17vw] p-6 z-50 transform transition-transform
  ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
        >
          {/* Profile Image */}
          {/* User Name Display */}
          <div className="text-center mt-4 break-words">
            <div className="avatar mb-4 flex justify-center">
              <div className="ring-4 ring-offset-2 ring-gradient-to-r from-cyan-700 via-blue-800 to-purple-900 w-24 h-24 rounded-full">
                <img
                  src={currentProfileImage}
                  alt="โปรไฟล์พนักงาน"
                  className="object-cover w-full h-full rounded-full"
                />
              </div>
            </div>
            <h4 className="text-xl text-black font-FontNoto">{userName}</h4>
          </div>
          {/* Sidebar Links */}
          <ul className="menu bg-white text-black rounded-box w-full text-lg space-y-2">
            <details className="mb-2 group">
              <summary className="cursor-pointer flex items-center justify-between px-4 py-2 rounded-md bg-white text-black hover:bg-blue-900 hover:text-white font-FontNoto font-bold">
                Dashboard
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>

              <ul className="mt-2 ml-2 space-y-1" style={{ fontSize: '14px' }}>
                <li>
                  <Link
                    to="/EmpHome/Workplan"
                    onClick={() => setIsSidebarOpen(false)}
                    className="block px-3 py-1.5 rounded-md hover:bg-blue-100 text-black font-bold font-FontNoto transition duration-150"
                  >
                    ปฎิทินการทำงาน
                  </Link>
                </li>
                <li>
                  <Link
                    to="/EmpHome/WorkplanEmp"
                    onClick={() => setIsSidebarOpen(false)}
                    className="block px-3 py-1.5 rounded-md hover:bg-blue-100 text-black font-bold font-FontNoto transition duration-150"
                  >
                    แผนงานพนักงาน
                  </Link>
                </li>
              </ul>
            </details>
            <details className="mb-2 group">
              <summary className="cursor-pointer flex items-center justify-between px-4 py-2 rounded-md bg-white text-black hover:bg-blue-900 hover:text-white font-FontNoto font-bold">
                จัดการเอกสาร
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>

              <ul className="mt-2 ml-2 space-y-1" style={{ fontSize: '14px' }}>
                <li>
                  <Link
                    to="/EmpHome/LeaveForm"
                    onClick={() => setIsSidebarOpen(false)}
                    className="block px-3 py-1.5 rounded-md hover:bg-blue-100 text-black font-bold font-FontNoto transition duration-150"
                  >
                    แบบฟอร์มใบลา
                  </Link>
                </li>
                <li>
                  <Link
                    to="/EmpHome/Document"
                    onClick={() => setIsSidebarOpen(false)}
                    className="block px-3 py-1.5 rounded-md hover:bg-blue-100 text-black font-bold font-FontNoto transition duration-150"
                  >
                    เอกสาร ใบลา-อัปโหลด
                  </Link>
                </li>

                <li>
                  <Link
                    to="/EmpHome"
                    onClick={() => setIsSidebarOpen(false)}
                    className="block px-3 py-1.5 rounded-md hover:bg-blue-100 text-black font-bold font-FontNoto transition duration-150"
                  >
                    กราฟจำนวนเอกสาร
                  </Link>
                </li>
              </ul>
            </details>

            <details className="mb-2 group">
              <summary className="cursor-pointer flex items-center justify-between px-4 py-2 rounded-md bg-white text-black hover:bg-blue-900 hover:text-white font-FontNoto font-bold">
                ข้อมูลส่วนตัว
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>

              <ul className="mt-2 ml-2 space-y-1" style={{ fontSize: '14px' }}>
              <li>
                  <Link
                    to="/EmpHome/Worktime"
                    onClick={() => setIsSidebarOpen(false)}
                    className="block px-3 py-1.5 rounded-md hover:bg-blue-100 text-black font-bold font-FontNoto transition duration-150"
                  >
                    การเข้า-ออกงาน
                  </Link>
                </li>

                <li>
                  <Link
                    to="/EmpHome/Profile"
                    onClick={() => setIsSidebarOpen(false)}
                    className="block px-3 py-1.5 rounded-md hover:bg-blue-100 text-black font-bold font-FontNoto transition duration-150"
                  >
                    โปรไฟล์ของฉัน
                  </Link>
                </li>
                
                <li>
                  <Link
                    to="/EmpHome/My_experience"
                    onClick={() => setIsSidebarOpen(false)}
                    className="block px-3 py-1.5 rounded-md hover:bg-blue-100 text-black font-bold font-FontNoto transition duration-150"
                  >
                    ประสบการณ์ทำงาน
                  </Link>
                </li>
                <li>
                  <Link
                    to="/EmpHome/My_education"
                    onClick={() => setIsSidebarOpen(false)}
                    className="block px-3 py-1.5 rounded-md hover:bg-blue-100 text-black font-bold font-FontNoto transition duration-150"
                  >
                    การศึกษา
                  </Link>
                </li>
              </ul>
            </details>
            {role === "Hr" ? (
              <>
                <li>
                  <Link
                    to="/EmpHome/HRView"
                    onClick={() => setIsSidebarOpen(false)}
                    className="block w-full text-left px-4 py-2 rounded-md hover:bg-orange-400 hover:text-black font-FontNoto font-bold"
                  >
                    ใบลาพนักงาน
                  </Link>
                </li>

              </>
            ) : null}
            {role === "GM" ? (
              <>
                <li>
                  <Link
                    to="/EmpHome/ManagerView"
                    onClick={() => setIsSidebarOpen(false)}
                    className="block w-full text-left px-4 py-2 rounded-md hover:bg-orange-400 hover:text-black font-FontNoto font-bold"
                  >
                    ใบลาพนักงาน
                  </Link>
                </li>
              </>
            ) : null}
            {role === "GM" || role === "Hr" ? (
              <>
                <details className="mb-2 group">
                  <summary className="cursor-pointer flex items-center justify-between px-4 py-2 rounded-md bg-white text-black hover:bg-blue-900 hover:text-white font-FontNoto font-bold">
                    ข้อมูลพนักงาน
                    <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>

                  <ul className="mt-2 ml-2 space-y-1" style={{ fontSize: '14px' }}>
                    <li>
                      <Link
                        to="/EmpHome/WorktimeEmp"
                        onClick={() => setIsSidebarOpen(false)}
                        className="block px-3 py-1.5 rounded-md hover:bg-blue-100 text-black font-bold font-FontNoto transition duration-150"
                      >
                        รายการเข้า-ออกงาน
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/EmpHome/WorkplanGM"
                        onClick={() => setIsSidebarOpen(false)}
                        className="block px-3 py-1.5 rounded-md hover:bg-blue-100 text-black font-bold font-FontNoto transition duration-150"
                      >
                        แผนการทำงาน
                      </Link>
                    </li>

                    <li>
                      <Link
                        to="/EmpHome/LeaveStatistics"
                        onClick={() => setIsSidebarOpen(false)}
                        className="block px-3 py-1.5 rounded-md hover:bg-blue-100 text-black font-bold font-FontNoto transition duration-150"
                      >
                        สถิติการลา
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/EmpHome/TrendStatistics"
                        onClick={() => setIsSidebarOpen(false)}
                        className="block px-3 py-1.5 rounded-md hover:bg-blue-100 text-black font-bold font-FontNoto transition duration-150"
                      >
                        กราฟเอกสารรายปี
                      </Link>
                    </li>
                  </ul>
                </details>
                <details className="mb-2 group">
                  <summary className="cursor-pointer flex items-center justify-between px-4 py-2 rounded-md bg-white text-black hover:bg-blue-900 hover:text-white font-FontNoto font-bold">
                    พนักงานในระบบ
                    <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>

                  <ul className="mt-2 ml-2 space-y-1" style={{ fontSize: '14px' }}>
                    <li>
                      <Link
                        to="/EmpHome/Allemployee"
                        onClick={() => setIsSidebarOpen(false)}
                        className="block px-3 py-1.5 rounded-md hover:bg-blue-100 text-black font-bold font-FontNoto transition duration-150"
                      >
                        พนักงานในระบบ
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/EmpHome/Allcreate"
                        onClick={() => setIsSidebarOpen(false)}
                        className="block px-3 py-1.5 rounded-md hover:bg-blue-100 text-black font-bold font-FontNoto transition duration-150"
                      >
                        เพิ่มพนักงานใหม่
                      </Link>
                    </li>
                  </ul>
                </details>
              </>
            ) : null}

            <li>
              <Link
                to="/EmpHome/Logout"
                onClick={() => setIsSidebarOpen(false)}
                className="cursor-pointer block px-4 py-2 rounded-md bg-white text-black hover:bg-blue-900 hover:text-red-500 font-FontNoto font-bold"
              >
                ออกจากระบบ
              </Link>
            </li>
          </ul>
        </aside>
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        {/* Main Content */}
        <div className="md:ml-[17vw] mt-[64px] p-4 w-full min-h-[calc(100vh-64px)] overflow-auto bg-gradient-to-br from-cyan-100 via-blue-100 to-purple-100">
          <div className="w-full max-w-screen-xl mx-auto rounded-2xl shadow-xl p-6 bg-white backdrop-blur-md min-h-full">
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
