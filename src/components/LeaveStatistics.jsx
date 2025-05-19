import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const LeaveStatistics = () => {
  const [leaveData, setLeaveData] = useState({});
  const [employeeNames, setEmployeeNames] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [categoryCounts, setCategoryCounts] = useState({});
  const [mostLeavePerson, setMostLeavePerson] = useState("");

  const categoryMapping = {
    sick: "ลาป่วย",
    personal: "ลากิจ",
    vacation: "ลาพักร้อน",
    maternity: "ลาคลอด",
    ordain: "ลาบวช",
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, filesRes] = await Promise.all([
          axios.get("http://192.168.1.188/hrwebapi/api/Users"),
          axios.get("http://192.168.1.188/hrwebapi/api/Files"),
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

  return (
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
  );
};

export default LeaveStatistics;
