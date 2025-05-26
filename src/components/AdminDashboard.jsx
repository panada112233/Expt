import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { NavLink } from 'react-router-dom';
import axios from "axios";
import { Bar } from "react-chartjs-2";
import { GetUser } from '../function/apiservice'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const [statistics, setStatistics] = useState({
    totalEmployees: 0,
    totalDocuments: 0,
    totalExperience: 0,
  });
  const [employeeData, setEmployeeData] = useState([]);
  const [filesData, setFilesData] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [profilePic, setProfilePic] = useState(""); // รูปโปรไฟล์
  const [adminName, setAdminName] = useState(""); // ชื่อจริงของแอดมิน
  const [selectedFile, setSelectedFile] = useState(null); // ไฟล์ที่เลือก
  const [uploadMessage, setUploadMessage] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [userinfostate, setuserinfoState] = useState(0);
  const [leaveData, setLeaveData] = useState([]); // ✅ เพิ่มตัวแปรเก็บข้อมูลใบลา

  const categoryMapping = {
    sick: "ใบลาป่วย",
    personal: "ใบลากิจ",
    vacation: "ใบลาพักร้อน",
    maternity: "ใบลาคลอด",
    ordain: "ใบลาบวช",
    Doc: "เอกสารส่วนตัว",
    Others: "อื่นๆ",
  };

  const iconMapping = {
    "ใบลาป่วย": "https://img.icons8.com/ios-filled/50/survival-bag.png",
    "ใบลากิจ": "https://img.icons8.com/ios-filled/50/leave-house.png",
    "ใบลาพักร้อน": "https://img.icons8.com/ios-filled/50/beach.png",
    "ใบลาคลอด": "https://img.icons8.com/glyph-neue/64/mothers-health.png",
    "ใบลาบวช": "https://img.icons8.com/external-ddara-fill-ddara/64/external-monk-religion-buddha-Buddhist-meditation-Buddhism-goodness-avatar-ddara-fill-ddara.png",
    "เอกสารส่วนตัว": "https://img.icons8.com/ios-filled/50/document.png",
    "อื่นๆ": "https://img.icons8.com/ios-filled/50/briefcase.png",
  };


  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await axios.get("https://192.168.1.188/hrwebapi/api/Files");

        const filteredFiles = response.data.filter(doc =>
          new Date(doc.uploadDate).getFullYear() === selectedYear
        );

        setFilesData(filteredFiles);

        const counts = {
          'ใบลาป่วย': 0,
          'ใบลากิจ': 0,
          'ใบลาพักร้อน': 0,
          'ใบลาคลอด': 0,
          'ใบลาบวช': 0,
          'เอกสารส่วนตัว': 0,
          'อื่นๆ': 0
        };

        filteredFiles.forEach((doc) => {
          const category = categoryMapping[doc.category] || 'อื่นๆ';
          counts[category] = (counts[category] || 0) + 1;
        });

        setCategoryCounts(counts);
        setStatistics(prevStats => ({
          ...prevStats,
          totalDocuments: filteredFiles.length,
        }));
      } catch (error) {
        console.error("Error fetching document data:", error);
      }
    };

    fetchDocuments();
  }, [selectedYear]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const responseUser = await GetUser();
        console.log("📸 Response from GetUser:", responseUser);

        if (!responseUser || !responseUser.userid) {
          throw new Error("User ID not found in response");
        }

        setuserinfoState(responseUser.userid);
        setAdminName(responseUser.name || "ไม่มีชื่อแอดมิน");
        setProfilePic(
          responseUser.profilePictureUrl
            ? `https://192.168.1.188/hrwebapi${responseUser.profilePictureUrl}`
            : "https://192.168.1.188/hrwebapi/uploads/admin/default-profile.jpg"
        );

      } catch (e) {
        console.error("❌ Error fetching user info:", e);
      }
    };


    fetchUserInfo();
  }, []); // ✅ ทำงานแค่ครั้งเดียว


  useEffect(() => {
    const fetchData = async () => {
      try {
        const employeeResponse = await axios.get("https://192.168.1.188/hrwebapi/api/Users");
        const experienceResponse = await axios.get("https://192.168.1.188/hrwebapi/api/WorkExperiences");

        if (employeeResponse.status === 200) {
          setEmployeeData(employeeResponse.data);
          setStatistics(prevStats => ({
            ...prevStats,
            totalEmployees: employeeResponse.data.length,
            totalExperience: experienceResponse.data.length,
          }));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []); // ✅ โหลดข้อมูลพนักงานครั้งเดียวตอนเปิดหน้า

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
    if (!userinfostate) {
      console.error("User ID is missing, cannot update admin name");
      setUploadMessage(<p className="text-red-500 font-FontNoto">กรุณาตรวจสอบข้อมูลผู้ใช้</p>);
      return;
    }

    const formData = new FormData();
    formData.append("name", adminName);
    formData.append("id", userinfostate);

    try {
      const response = await axios.post(
        "https://192.168.1.188/hrwebapi/api/Admin/UpdateAdminInfo",
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
      const response = await axios.post("https://192.168.1.188/hrwebapi/api/Admin/UpdateAdminInfo", formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data && response.data.profilePictureUrl) {
        const profilePictureUrl = response.data.profilePictureUrl
          ? `https://192.168.1.188/hrwebapi${response.data.profilePictureUrl}`
          : "https://192.168.1.188/hrwebapi/uploads/users/default-profile.jpg";
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

  const handleYearChange = (e) => {
    setSelectedYear(parseInt(e.target.value));
  };

  const getUniqueYears = () => {
    const startYear = 2024;
    const endYear = 2034;
    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
    return years;
  };

  const createEmployeesChartData = () => {
    const months = Array.from({ length: 12 }, (_, i) => `เดือน ${i + 1}`);
    const employeeCounts = Array.from({ length: 12 }, (_, i) =>
      employeeData.filter(
        employee =>
          new Date(employee.createdAt).getFullYear() === selectedYear &&
          new Date(employee.createdAt).getMonth() === i
      ).length
    );

    return {
      labels: months,
      datasets: [
        {
          label: `จำนวนพนักงานที่เพิ่มในปี ${selectedYear}`,
          data: employeeCounts,
          backgroundColor: "#34D399",
        },
      ],
      options: {
        responsive: true,
        plugins: {
          legend: { position: "top" },
        },
        scales: {
          x: {
            ticks: {
              font: {
                family: 'Noto Sans Thai, sans-serif', // ใช้ฟอนต์ Noto Sans Thai
              }
            }
          },
          y: {
            ticks: {
              font: {
                family: 'Noto Sans Thai, sans-serif', // ใช้ฟอนต์ Noto Sans Thai
              }
            }
          }
        }
      }
    };
  };

  const createDocumentsChartData = () => {
    const months = Array.from({ length: 12 }, (_, i) => `เดือน ${i + 1}`);
    const categories = Object.values(categoryMapping); // เช่น ใบลาป่วย, ใบลากิจ...

    // ✅ เตรียมข้อมูลแต่ละหมวดหมู่สำหรับแต่ละเดือน
    const categoryData = categories.map(category => {
      return Array.from({ length: 12 }, (_, i) => {
        return filesData.filter(
          f =>
            new Date(f.uploadDate).getFullYear() === selectedYear &&
            new Date(f.uploadDate).getMonth() === i &&
            categoryMapping[f.category] === category
        ).length;
      });
    });

    return {
      labels: months,
      datasets: categories.map((category, index) => ({
        label: category,
        data: categoryData[index],
        backgroundColor: [
          'rgba(102, 204, 153, 1)',  // Soft Green
          'rgba(100, 181, 246, 1)',  // Soft Blue
          'rgba(255, 138, 128, 1)',  // Soft Red
          'rgba(240, 98, 146, 1)',   // Soft Pink
          'rgba(255, 213, 79, 1)',   // Soft Yellow
          'rgba(255, 167, 38, 1)',   // Soft Orange
          'rgba(171, 71, 188, 1)',   // Soft Purple
        ][index],
      })),
      options: {
        responsive: true,
        plugins: {
          legend: { position: "top" },
        },
        scales: {
          x: {
            ticks: {
              font: {
                family: 'font-FontNoto',
              }
            }
          },
          y: {
            ticks: {
              font: {
                family: 'font-FontNoto',
              }
            }
          }
        }
      }
    };
  };


  const trendsChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
    },
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

      {/* Main Content */}
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
                  src={`${profilePic}?t=${new Date().getTime()}`}
                  alt="Admin Profile"
                  className="rounded-full border-4 border-cyan-700 object-cover w-32 h-32"
                  onError={(e) => {
                    console.error("❌ โหลดรูปโปรไฟล์ไม่สำเร็จ:", e.target.src);
                    e.target.onerror = null; // ป้องกัน Loop Error
                    e.target.src = "https://192.168.1.188/hrwebapi/uploads/admin/default-profile.jpg";
                  }}
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
                    className="text-sm text-green-500 hover:underline font-FontNoto"
                  >
                    บันทึก
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="text-sm text-red-500 hover:underline font-FontNoto"
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
            <li><NavLink to="/AdminDashboard" className={({ isActive }) => isActive ? "hover:bg-gray-300 hover:text-black font-FontNoto font-bold bg-gray-200" : "hover:bg-yellow-100 hover:text-black font-FontNoto font-bold"}>Dashboard</NavLink></li>
            <li><Link to="/Admintime" className="hover:bg-green-100 font-FontNoto font-bold">รายการเข้า-ออกงาน</Link></li>
            <li><Link to="/Adminplan" className="hover:bg-green-100 font-FontNoto font-bold">การปฎิบัติงานพนักงาน</Link></li>
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
        {/* Content */}
        <div className="flex-1 p-4 md:p-10 bg-white shadow-lg rounded-none md:rounded-lg">
          <div className="w-full bg-gradient-to-r from-cyan-900 via-cyan-600 to-slate-500 text-white rounded-xl p-4 sm:p-5 md:p-6 mb-6 shadow-lg">
            <h1 className="text-xl sm:text-2xl font-bold font-FontNoto leading-snug">
              แดชบอร์ด แอดมิน
            </h1>
            <p className="text-xs sm:text-sm mt-1 font-FontNoto">กราฟตรวจสอบจำนวนเอกสารของพนักงาน</p>
          </div>
          <div className="flex flex-row justify-between items-center mb-6 gap-4">
            <div>
              <Link to="/AdminManagement" className="btn btn-outline font-FontNoto">
                ข้อมูลแอดมิน
              </Link>
            </div>

            <label htmlFor="yearSelect">
              <select
                id="yearSelect"
                value={selectedYear}
                onChange={handleYearChange}
                className="select select-bordered font-FontNoto text-black w-48"
              >
                {getUniqueYears().map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* ข้อมูลประเภทเอกสาร */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
            {Object.keys(categoryCounts).map((category) => (
              <div key={category} className="bg-white border border-black p-4 rounded-lg shadow-md flex flex-col items-center">
                <h3 className="text-lg font-bold font-FontNoto mb-2">{category}</h3>
                <div className="flex items-center space-x-2">
                  <img src={iconMapping[category]} alt={category} className="w-7 h-7" />
                  <p className="text-3xl font-FontNoto">{categoryCounts[category] || 0}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Chart Section */}
          <div className="w-full mt-6 md:mt-10 flex justify-center">
            <div className="bg-base-100 shadow-lg p-4 rounded-lg w-full max-w-screen-md min-h-[300px]">
              <h3 className="text-lg font-bold text-black mb-4 font-FontNoto text-center">
                แนวโน้มการเพิ่มจำนวนไฟล์เอกสาร
              </h3>
              <div className="relative w-full h-[300px]">
                <Bar className="font-FontNoto"
                  data={createDocumentsChartData()}
                  options={{
                    ...trendsChartOptions,
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
