import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Link, NavLink } from "react-router-dom";
import axios from "axios";
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const LeaveGraph = () => {
  const [fileData, setFileData] = useState([]);
  const [employeeNames, setEmployeeNames] = useState([]);
  const [fileCounts, setFileCounts] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [profilePic, setProfilePic] = useState(""); // รูปโปรไฟล์
  const [adminName, setAdminName] = useState(""); // ชื่อจริงของแอดมิน
  const [selectedFile, setSelectedFile] = useState(null); // ไฟล์ที่เลือก
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false); // เพิ่มตัวแปร isEditingName
  const [uploadMessage, setUploadMessage] = useState("");
  const [categoryCounts, setCategoryCounts] = useState({});
  const [mostLeavePerson, setMostLeavePerson] = useState("");
  const [leaveData, setLeaveData] = useState({});

  const categoryMapping = {
    sick: "ลาป่วย",
    personal: "ลากิจ",
    vacation: "ลาพักร้อน",
    maternity: "ลาคลอด",
    ordain: "ลาบวช",
  };
  const iconMapping = {
    "ลาป่วย": "https://img.icons8.com/ios-filled/50/survival-bag.png",
    "ลากิจ": "https://img.icons8.com/ios-filled/50/leave-house.png",
    "ลาพักร้อน": "https://img.icons8.com/ios-filled/50/beach.png",
    "ลาคลอด": "https://img.icons8.com/glyph-neue/64/mothers-health.png",
    "ลาบวช": "https://img.icons8.com/external-ddara-fill-ddara/64/external-monk-religion-buddha-Buddhist-meditation-Buddhism-goodness-avatar-ddara-fill-ddara.png",
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, filesRes] = await Promise.all([
          axios.get("https://localhost:7039/api/Users"),
          axios.get("https://localhost:7039/api/Files"),
        ]);

        const userMap = usersRes.data.reduce((acc, user) => {
          acc[user.userID] = `${user.firstName} ${user.lastName}`;
          return acc;
        }, {});

        const grouped = {};
        const categorySum = {};

        usersRes.data.forEach((user) => {
          const name = `${user.firstName} ${user.lastName}`;
          grouped[name] = {
            "ลาป่วย": 0,
            "ลากิจ": 0,
            "ลาพักร้อน": 0,
            "ลาคลอด": 0,
            "ลาบวช": 0,
            "รวม": 0,
          };
        });

        filesRes.data.forEach((file) => {
          const fileDate = new Date(file.uploadDate);
          if (
            fileDate.getMonth() === selectedMonth &&
            fileDate.getFullYear() === selectedYear &&
            file.category in categoryMapping
          ) {
            const name = userMap[file.userID];
            const leaveType = categoryMapping[file.category];
            if (grouped[name]) {
              grouped[name][leaveType] += 1;
              grouped[name]["รวม"] += 1;
              categorySum[leaveType] = (categorySum[leaveType] || 0) + 1;
            }
          }
        });

        const sorted = Object.entries(grouped).sort(
          (a, b) => b[1]["รวม"] - a[1]["รวม"]
        );

        setLeaveData(grouped);
        setEmployeeNames(Object.keys(grouped));
        setCategoryCounts(categorySum);
        setMostLeavePerson(sorted[0]?.[0] || "");
      } catch (err) {
        console.error("\u274C ดึงข้อมูลลาพนักงานล้มเหลว:", err);
      }
    };

    fetchData();
  }, [selectedMonth, selectedYear]);

  const documentTypes = [...Object.values(categoryMapping), "รวม"];

  const chartData = {
    labels: employeeNames,
    datasets: documentTypes.map((type, index) => ({
      label: type,
      data: employeeNames.map((name) => leaveData[name]?.[type] || 0),
      backgroundColor: [
        "#4FC3F7",
        "#81C784",
        "#FFD54F",
        "#F48FB1",
        "#A1887F",
        "#90A4AE",
      ][index % 6],
      barThickness: 20,
    })),
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
    },
    scales: {
      x: { stacked: false, ticks: { autoSkip: false, maxRotation: 45 } },
      y: { beginAtZero: true },
    },
  };

  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];
  const years = Array.from({ length: 11 }, (_, i) => 2024 + i);
  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const response = await GetUser(); // ใช้ฟังก์ชันจาก apiservice
        setAdminName(response.name || "ไม่มีชื่อแอดมิน");
        setProfilePic(
          response.profilePictureUrl
            ? `https://localhost:7039/hrwebapi${response.profilePictureUrl}`
            : "https://localhost:7039/hrwebapi/uploads/admin/default-profile.jpg"
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
        "https://localhost:7039/hrwebapi/api/Admin/UpdateAdminInfo",
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
          ? `https://localhost:7039/hrwebapi${response.data.profilePictureUrl}`
          : "https://localhost:7039/hrwebapi/uploads/users/default-profile.jpg";

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
                  src={`${profilePic}?t=${new Date().getTime()}`} // ✅ ป้องกันการแคช
                  alt="Admin Profile"
                  className="rounded-full border-4 border-cyan-700 object-cover w-32 h-32"
                  onError={(e) => { e.target.src = "https://localhost:7039/hrwebapi/uploads/admin/default-profile.jpg"; }} // ✅ ถ้าโหลดรูปไม่ได้ ให้ใช้รูป default
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
            <li><Link to="/Admintime" className="hover:bg-green-100 font-FontNoto font-bold">รายการเข้า-ออกงาน</Link></li>
            <li><Link to="/Adminplan" className="hover:bg-green-100 font-FontNoto font-bold">การปฎิบัติงานพนักงาน</Link></li>
            <li><NavLink to="/LeaveGraph" className={({ isActive }) => isActive ? "hover:bg-gray-300 hover:text-black font-FontNoto font-bold bg-gray-200" : "hover:bg-yellow-100 hover:text-black font-FontNoto font-bold"}>สถิติการลาพนักงาน</NavLink></li>
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
        <div className="p-4 sm:p-6">
          <div className="bg-gradient-to-r from-blue-900 via-blue-600 to-cyan-500 text-white rounded-xl p-4 mb-6 shadow-lg">
            <h1 className="text-xl sm:text-2xl font-bold font-FontNoto">สถิติใบลาพนักงาน</h1>
            <p className="text-sm font-FontNoto">แสดงจำนวนใบลาแยกตามประเภทและรายชื่อพนักงาน</p>
          </div>

          <div className="flex flex-wrap gap-4 items-center mb-6">
            <label className="text-black font-FontNoto">เดือน:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="select select-bordered font-FontNoto"
            >
              {months.map((month, idx) => (
                <option className="font-FontNoto" key={idx} value={idx}>{month}</option>
              ))}
            </select>

            <label className="text-black font-FontNoto">ปี:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="select select-bordered font-FontNoto"
            >
              {years.map((year) => (
                <option className="font-FontNoto" key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {Object.entries(categoryCounts).map(([type, count]) => (
              <div key={type} className="bg-white shadow rounded-lg p-4 text-center font-FontNoto">
                <h3 className="font-semibold text-sm text-gray-600 font-FontNoto">{type}</h3>
                <p className="text-2xl text-blue-700 font-bold font-FontNoto">{count}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg p-4 shadow-md overflow-x-auto">
            <h2 className="text-lg font-semibold text-center mb-4 font-FontNoto">กราฟแสดงการลาพนักงาน</h2>
            <div className="min-w-[700px] font-FontNoto">
              <Bar className="font-FontNoto" data={chartData} options={chartOptions} />
            </div>
          </div>

          {mostLeavePerson && (
            <div className="mt-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded shadow font-FontNoto">
              <p className="text-yellow-800 font-semibold font-FontNoto">
                พนักงานที่ลามากที่สุดในเดือนนี้: <span className="font-bold font-FontNoto">{mostLeavePerson}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveGraph;
