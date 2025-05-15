import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const LeaveStatistics = () => {
  const userId = sessionStorage.getItem("userId") || "";
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [departmentStats, setDepartmentStats] = useState({});
  const [monthlyStats, setMonthlyStats] = useState(Array(12).fill(0));
  const [typeStats, setTypeStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  // ตัวแปรสำหรับการแปลงค่าต่างๆ
  const typeMap = {
    "ป่วย": "sick",
    "กิจส่วนตัว": "personal",
    "พักร้อน": "vacation",
    "บวช": "ordain",
    "ลาคลอด": "maternity"
  };
  
  const labelMap = {
    sick: "ป่วย",
    personal: "กิจส่วนตัว",
    vacation: "พักร้อน",
    ordain: "บวช",
    maternity: "ลาคลอด"
  };
  
  const roleMapping = {
    Hr: "ทรัพยากรบุคคล",
    GM: "ผู้จัดการทั่วไป",
    Dev: "นักพัฒนาระบบ",
    BA: "นักวิเคราะห์ธุรกิจ",
    Employee: "พนักงาน",
  };

  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  const statusColors = {
    Pending: "#FFD700",
    ApprovedByHR: "#4CAF50",
    Rejected: "#F44336"
  };

  const leaveTypeColors = {
    "ป่วย": "#81C784", // เขียว
    "กิจส่วนตัว": "#64B5F6", // ฟ้า
    "พักร้อน": "#FF8A65", // ส้ม
    "บวช": "#FFD54F", // เหลือง
    "ลาคลอด": "#F48FB1", // ชมพู
  };

  // อาเรย์สำหรับปีที่แสดงในดรอปดาวน์
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedUser, selectedDepartment]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchLeaveTypes(),
        fetchUsers(),
        fetchLeaveHistory()
      ]);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const res = await axios.get("https://localhost:7039/api/Document/GetLeaveTypes");
      setLeaveTypes(res.data);
    } catch (error) {
      console.error("Error fetching leave types:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get("https://localhost:7039/api/Users");
      setUsers(res.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchLeaveHistory = async () => {
    try {
      // เรียกข้อมูลการลาทั้งหมด
      let url = "https://localhost:7039/api/LeaveRequest";
      
      // ถ้าเป็น HR หรือ GM ให้ดูข้อมูลรวมได้ แต่ถ้าเป็นพนักงานทั่วไปให้ดูได้เฉพาะของตัวเอง
      // ในตัวอย่างนี้เราจะดึงข้อมูลทั้งหมดมาก่อน แล้วค่อยกรองทีหลัง
      const res = await axios.get(url);
      
      if (res.status === 200) {
        // กรองข้อมูลตามปีที่เลือก
        const filteredData = res.data.filter(item => {
          const leaveYear = new Date(item.startDate).getFullYear();
          return leaveYear === selectedYear;
        });
        
        // กรองตามพนักงานที่เลือก (ถ้าเลือกพนักงานเฉพาะ)
        const userFiltered = selectedUser === "all" 
          ? filteredData 
          : filteredData.filter(item => item.userID === selectedUser);
        
        // กรองตามแผนกที่เลือก (ถ้าเลือกแผนกเฉพาะ)
        let deptFiltered = userFiltered;
        if (selectedDepartment !== "all") {
          const usersByDept = users.filter(user => user.role === selectedDepartment).map(u => u.userID);
          deptFiltered = userFiltered.filter(item => usersByDept.includes(item.userID));
        }
        
        setLeaveHistory(deptFiltered);
        
        // ประมวลผลข้อมูลสำหรับกราฟต่างๆ
        processLeaveData(deptFiltered);
      }
    } catch (error) {
      console.error("Error fetching leave history:", error);
    }
  };

  const processLeaveData = (data) => {
    // ประมวลผลข้อมูลตามแผนก
    const deptData = {};
    // ประมวลผลข้อมูลตามประเภทการลา
    const typeData = {};
    // ประมวลผลข้อมูลตามเดือน
    const monthData = Array(12).fill(0);
    
    // เตรียมข้อมูลเริ่มต้น
    leaveTypes.forEach(type => {
      typeData[type.leaveTypeTh] = 0;
    });
    
    Object.keys(roleMapping).forEach(role => {
      deptData[roleMapping[role]] = 0;
    });
    
    // ประมวลผลข้อมูล
    data.forEach(item => {
      // นับข้อมูลตามประเภทการลา
      if (typeData.hasOwnProperty(item.leaveType)) {
        typeData[item.leaveType]++;
      }
      
      // นับข้อมูลตามเดือน
      const month = new Date(item.startDate).getMonth();
      monthData[month]++;
      
      // นับข้อมูลตามแผนก (ต้องหาแผนกของผู้ใช้ก่อน)
      const user = users.find(u => u.userID === item.userID);
      if (user && deptData.hasOwnProperty(roleMapping[user.role])) {
        deptData[roleMapping[user.role]]++;
      }
    });
    
    setDepartmentStats(deptData);
    setTypeStats(typeData);
    setMonthlyStats(monthData);
  };

  // สร้างข้อมูลสำหรับกราฟแท่งประเภทการลา
  const createLeaveTypeData = () => {
    return {
      labels: Object.keys(typeStats),
      datasets: [
        {
          label: 'จำนวนการลา',
          data: Object.values(typeStats),
          backgroundColor: Object.keys(typeStats).map(type => leaveTypeColors[type] || '#777'),
          borderColor: Object.keys(typeStats).map(type => leaveTypeColors[type] || '#777'),
          borderWidth: 1,
        },
      ],
    };
  };

  // สร้างข้อมูลสำหรับกราฟแท่งแผนก
  const createDepartmentData = () => {
    return {
      labels: Object.keys(departmentStats),
      datasets: [
        {
          label: 'จำนวนการลา',
          data: Object.values(departmentStats),
          backgroundColor: [
            '#FFB74D', // ส้มอ่อน
            '#9575CD', // ม่วง
            '#4FC3F7', // ฟ้า
            '#AED581', // เขียวอ่อน
            '#F06292', // ชมพู
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // สร้างข้อมูลสำหรับกราฟเส้นรายเดือน
  const createMonthlyData = () => {
    return {
      labels: months,
      datasets: [
        {
          label: 'จำนวนการลารายเดือน',
          data: monthlyStats,
          fill: false,
          borderColor: '#3F51B5',
          backgroundColor: '#3F51B5',
          tension: 0.1,
          pointBackgroundColor: '#3F51B5',
          pointRadius: 4,
        },
      ],
    };
  };

  // สร้างข้อมูลสำหรับกราฟวงกลมประเภทการลา
  const createPieData = () => {
    return {
      labels: Object.keys(typeStats),
      datasets: [
        {
          data: Object.values(typeStats),
          backgroundColor: Object.keys(typeStats).map(type => leaveTypeColors[type] || '#777'),
        },
      ],
    };
  };

  // ตัวเลือกสำหรับกราฟแท่ง
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'สถิติการลาแยกตามประเภท',
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  // ตัวเลือกสำหรับกราฟเส้น
  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'สถิติการลารายเดือน',
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  // ตัวเลือกสำหรับกราฟวงกลม
  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'สัดส่วนการลาแต่ละประเภท',
        font: {
          size: 16,
        },
      },
    },
  };

  return (
    <div className="flex flex-col w-full">
      {/* ส่วนหัว */}
      <div className="w-full bg-gradient-to-r from-cyan-900 via-cyan-600 to-slate-500 text-white rounded-xl p-4 sm:p-5 md:p-6 mb-6 shadow-lg">
        <h1 className="text-xl sm:text-2xl font-bold font-FontNoto leading-snug">
          รายงานสถิติการลาพนักงาน
        </h1>
        <p className="text-xs sm:text-sm mt-1 font-FontNoto">
          วิเคราะห์ข้อมูลการลาของพนักงานตามประเภท แผนก และช่วงเวลา
        </p>
      </div>

      {/* ตัวกรองข้อมูล */}
      <div className="p-4 bg-white rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-bold font-FontNoto mb-4">ตัวกรองข้อมูล</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium font-FontNoto mb-1">ปี</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="select select-bordered w-full font-FontNoto"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium font-FontNoto mb-1">แผนก</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="select select-bordered w-full font-FontNoto"
            >
              <option value="all">ทั้งหมด</option>
              {Object.keys(roleMapping).map(role => (
                <option key={role} value={role}>{roleMapping[role]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium font-FontNoto mb-1">พนักงาน</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="select select-bordered w-full font-FontNoto"
            >
              <option value="all">ทั้งหมด</option>
              {users.map(user => (
                <option key={user.userID} value={user.userID}>
                  {user.firstName} {user.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      ) : (
        <>
          {/* บัตรแสดงภาพรวม */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-bold font-FontNoto mb-2">การลาทั้งหมด</h3>
              <div className="text-3xl font-bold text-cyan-600">
                {leaveHistory.length}
              </div>
              <p className="text-sm text-gray-500 font-FontNoto">ครั้ง</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-bold font-FontNoto mb-2">ประเภทที่ลามากที่สุด</h3>
              <div className="text-3xl font-bold text-cyan-600">
                {Object.entries(typeStats).sort((a, b) => b[1] - a[1])[0]?.[0] || "-"}
              </div>
              <p className="text-sm text-gray-500 font-FontNoto">
                {Object.entries(typeStats).sort((a, b) => b[1] - a[1])[0]?.[1] || 0} ครั้ง
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-bold font-FontNoto mb-2">เดือนที่ลามากที่สุด</h3>
              <div className="text-3xl font-bold text-cyan-600">
                {months[monthlyStats.indexOf(Math.max(...monthlyStats))]}
              </div>
              <p className="text-sm text-gray-500 font-FontNoto">
                {Math.max(...monthlyStats)} ครั้ง
              </p>
            </div>
          </div>

          {/* กราฟประเภทการลา */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="h-64">
                <Bar options={barOptions} data={createLeaveTypeData()} />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="h-64">
                <Pie options={pieOptions} data={createPieData()} />
              </div>
            </div>
          </div>

          {/* กราฟแสดงการลารายเดือน */}
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <div className="h-64">
              <Line options={lineOptions} data={createMonthlyData()} />
            </div>
          </div>

          {/* กราฟแสดงการลาตามแผนก */}
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <h3 className="text-lg font-bold font-FontNoto mb-4">สถิติการลาตามแผนก</h3>
            <div className="h-64">
              <Bar 
                options={{
                  ...barOptions,
                  plugins: {
                    ...barOptions.plugins,
                    title: {
                      ...barOptions.plugins.title,
                      text: 'สถิติการลาแยกตามแผนก'
                    }
                  }
                }} 
                data={createDepartmentData()} 
              />
            </div>
          </div>

          {/* ตารางประวัติการลา */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-bold font-FontNoto mb-4">ประวัติการลาล่าสุด</h3>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="font-FontNoto">พนักงาน</th>
                    <th className="font-FontNoto">แผนก</th>
                    <th className="font-FontNoto">ประเภทการลา</th>
                    <th className="font-FontNoto">ช่วงเวลา</th>
                    <th className="font-FontNoto">วันที่เริ่ม</th>
                    <th className="font-FontNoto">วันที่สิ้นสุด</th>
                    <th className="font-FontNoto">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveHistory.length > 0 ? (
                    leaveHistory.slice(0, 10).map((leave, index) => {
                      const user = users.find(u => u.userID === leave.userID);
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="font-FontNoto">
                            {user ? `${user.firstName} ${user.lastName}` : 'ไม่ระบุ'}
                          </td>
                          <td className="font-FontNoto">
                            {user ? roleMapping[user.role] || 'ไม่ระบุ' : 'ไม่ระบุ'}
                          </td>
                          <td className="font-FontNoto">{leave.leaveType}</td>
                          <td className="font-FontNoto">{leave.timeType}</td>
                          <td className="font-FontNoto">
                            {new Date(leave.startDate).toLocaleDateString('th-TH')}
                          </td>
                          <td className="font-FontNoto">
                            {new Date(leave.endDate).toLocaleDateString('th-TH')}
                          </td>
                          <td>
                            <span 
                              className="px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: statusColors[leave.status] || '#777',
                                color: '#fff'
                              }}
                            >
                              {leave.status === "ApprovedByHR" ? "อนุมัติ" : 
                               leave.status === "Rejected" ? "ไม่อนุมัติ" : "รออนุมัติ"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4">ไม่พบข้อมูลการลา</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LeaveStatistics;