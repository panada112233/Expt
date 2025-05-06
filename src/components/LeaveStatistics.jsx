import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Link } from "react-router-dom";
import axios from "axios";
import { Icon } from "@iconify/react"; // ใช้ Icons8

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

const LeaveStatistics = () => {
  const [employeeNames, setEmployeeNames] = useState([]);
  const [fileData, setFileData] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [categoryCounts, setCategoryCounts] = useState({});
  const [documentTypes, setDocumentTypes] = useState([]);

  const categoryMapping = {
    Certificate: 'ลาป่วย',
    WorkContract: 'ลากิจ',
    Identification: 'ลาพักร้อน',
    Maternity: 'ลาคลอด',
    Ordination: 'ลาบวช',
  };
  const categoryMappingg = {
    "A461E72F-B9A3-4F9D-BF69-1BBE6EA514EC": "ลาป่วย",
    "6CF7C54A-F9BA-4151-A554-6487FDD7ED8D": "ลาพักร้อน",
    "1799ABEB-158C-479E-A9DC-7D45E224E8ED": "ลากิจ",
    "DAA14555-28E7-497E-B1D8-E0DA1F1BE283": "ลาคลอด",
    "AE3C3A05-1FCB-4B8A-9044-67A83E781ED6": "ลาบวช",
  };

  const iconMapping = {
    "ลาป่วย": "https://img.icons8.com/ios-filled/50/survival-bag.png",
    "ลากิจ": "https://img.icons8.com/ios-filled/50/leave-house.png",
    "ลาพักร้อน": "https://img.icons8.com/ios-filled/50/beach.png",
    "ลาคลอด": "https://img.icons8.com/glyph-neue/64/mothers-health.png",
    "ลาบวช": "https://img.icons8.com/external-ddara-fill-ddara/64/external-monk-religion-buddha-Buddhist-meditation-Buddhism-goodness-avatar-ddara-fill-ddara.png",
  };

  useEffect(() => {
    const fetchFileData = async () => {
      try {
        const filesResponse = await axios.get("https://localhost:7039/api/Files");
        const usersResponse = await axios.get("https://localhost:7039/api/Users");
        const leaveResponse = await axios.get("https://localhost:7039/api/Document/GetAllCommitedDocuments");

        console.log("📌 จำนวนพนักงานที่ดึงมา:", usersResponse.data.length);

        const userMapping = usersResponse.data.reduce((acc, user) => {
          acc[user.userID] = `${user.firstName} ${user.lastName}`;
          return acc;
        }, {});

        const docTypes = Object.values(categoryMapping); // ใช้ชื่อไทยจาก categoryMapping
        setDocumentTypes(docTypes);

        const groupedData = {};
        const categoryCountData = {}; // ตัวแปรสำหรับนับ category

        usersResponse.data.forEach((user) => {
          const userName = `${user.firstName} ${user.lastName}`;
          groupedData[userName] = docTypes.reduce((typeCount, type) => {
            typeCount[type] = 0;
            return typeCount;
          }, {});
        });

        leaveResponse.data.forEach((doc) => {
          if (!doc || !doc.userId) {
            console.warn("⚠️ พบข้อมูลเอกสารที่ไม่มี userId:", doc);
            return;
          }

          const docDate = new Date(doc.startdate);
          if (docDate.getMonth() === selectedMonth && docDate.getFullYear() === selectedYear) {
            const leaveTypeKey = doc.leaveTypeId?.trim().toUpperCase();
            console.log("🔍 ตรวจสอบ leaveTypeKey:", leaveTypeKey);
            console.log("🛠️ categoryMappingg:", categoryMappingg);

            if (!categoryMappingg.hasOwnProperty(leaveTypeKey)) {
              console.warn("⚠️ ไม่มีค่าใน categoryMappingg สำหรับ leaveTypeKey:", leaveTypeKey);
              return;
            }

            const leaveName = categoryMappingg[leaveTypeKey];
            console.log("📌 leaveName ที่ได้:", leaveName);

            if (!leaveName) {
              console.warn("⚠️ ไม่พบประเภทใบลา:", leaveTypeKey);
              return;
            }

            const userName = userMapping[doc.userId];

            if (!userName || userName === "Unknown") {
              console.warn("⚠️ ข้ามข้อมูลของพนักงานที่ไม่รู้จัก:", doc);
              return;
            }

            console.log("👤 userName:", userName);

            if (!groupedData[userName]) {
              groupedData[userName] = {};
            }

            if (!groupedData[userName].hasOwnProperty(leaveName)) {
              console.warn(`⚠️ ไม่พบประเภทใบลา '${leaveName}' ใน groupedData[${userName}]. กำหนดค่าเริ่มต้นเป็น 0`);
              groupedData[userName][leaveName] = 0;
            }

            groupedData[userName][leaveName] += 1;
            categoryCountData[leaveName] = (categoryCountData[leaveName] || 0) + 1;
          }
        });

        filesResponse.data
          .filter((file) => file.category !== "Others" && file.category !== "Doc")
          .forEach((file) => {
            if (!file || !file.userID) {
              console.warn("⚠️ พบไฟล์ที่ไม่มี userID:", file);
              return;
            }

            const fileDate = new Date(file.uploadDate);
            if (fileDate.getMonth() === selectedMonth && fileDate.getFullYear() === selectedYear) {
              const userName = userMapping[file.userID];

              if (!userName || userName === "Unknown") {
                console.warn("⚠️ ข้ามเอกสารของพนักงานที่ไม่รู้จัก:", file);
                return;
              }

              const thaiCategory = categoryMapping[file.category];

              if (thaiCategory) {
                if (!groupedData[userName]) {
                  groupedData[userName] = {};
                }

                groupedData[userName][thaiCategory] = (groupedData[userName][thaiCategory] || 0) + 1;
                categoryCountData[thaiCategory] = (categoryCountData[thaiCategory] || 0) + 1;
              }
            }
          });

        setEmployeeNames(Object.keys(groupedData).filter(name => name !== "Unknown"));
        setFileData(groupedData);
        setCategoryCounts(categoryCountData);

        console.log("📌 รายชื่อพนักงานที่ได้หลังอัปเดต:", Object.keys(groupedData));

      } catch (error) {
        console.error("❌ Error fetching file data:", error);
      }
    };

    fetchFileData();
  }, [selectedMonth, selectedYear]);


  const createChartData = () => {
    const totalDocuments = employeeNames.map((name) =>
      documentTypes.reduce((sum, type) => sum + (fileData[name][type] || 0), 0)
    );

    const colors = [
      "#81C784", // เขียวพาสเทลสดใส (ใบลาป่วย)
      "#64B5F6", // ฟ้าพาสเทล (ใบลากิจ)
      "#FF8A65", // ส้มพาสเทลสด (ใบลาพักร้อน)
      "#F48FB1", // ชมพูพาสเทลชัด (ใบลาคลอด)
      "#FFD54F", // เหลืองพาสเทลสด (ใบลาบวช)
    ];

    const datasets = [
      ...documentTypes.map((type, index) => ({
        label: type,
        data: employeeNames.map((name) => fileData[name][type] || 0),
        backgroundColor: colors[index % colors.length], // ใช้สีวนซ้ำหากจำนวนประเภทเอกสารเกินสีที่กำหนด
      })),
      {
        label: "รวมใบลา",
        data: totalDocuments,
        backgroundColor: "#90A4AE", // สีสำหรับข้อมูลรวม
      },
    ];

    return {
      labels: employeeNames,
      datasets: datasets,
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => {
            const datasetLabel = tooltipItem.dataset.label; // ชื่อประเภทเอกสาร
            const value = tooltipItem.raw; // ค่าของข้อมูลในจุดนี้
            return `${datasetLabel}: ${value}`; // แสดงชื่อเอกสารและจำนวน
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 12,
          },
        },
      },
      y: {
        ticks: {
          stepSize: 1,
          callback: function (value) {
            return Math.floor(value);
          },
        },
        title: {
          display: true,
          text: "จำนวนการลา",
          font: {
            size: 14,
          },
        },
      },
    },
    layout: {
      padding: {
        top: 20,
        bottom: 20,
      },
    },
    barThickness: 15, // ลดความหนาของแท่งกราฟ
  };

  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  const years = Array.from({ length: 11 }, (_, i) => 2024 + i); // ปี 2024 ถึง 2034

  return (
    <div className="flex flex-col w-full">
      <div className="w-full bg-gradient-to-r from-cyan-900 via-cyan-600 to-slate-500 text-white rounded-xl p-4 sm:p-5 md:p-6 mb-6 shadow-lg">
        <h1 className="text-xl sm:text-2xl font-bold font-FontNoto leading-snug">
          สถิติการลาพนักงาน
        </h1>
        <p className="text-xs sm:text-sm mt-1 font-FontNoto">กราฟตรวจสอบข้อมูลการลาของพนักงาน</p>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-end space-x-4 mb-4">
          <select
            id="monthSelect"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="select select-bordered w-40 text-black font-FontNoto"
          >
            {months.map((month, index) => (
              <option className="font-FontNoto" key={index} value={index}>{month}</option>
            ))}
          </select>
          <select
            id="yearSelect"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="select select-bordered w-40 text-black font-FontNoto"
          >
            {years.map((year) => (
              <option className="font-FontNoto" key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        {/* ข้อมูลประเภทเอกสาร */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
          {Object.keys(categoryCounts).map((category) => (
            <div key={category} className="bg-white border border-black p-4 rounded-lg shadow-md flex flex-col items-center">
              <div className="flex flex-col items-center justify-center">
                <h3 className="text-lg font-bold font-FontNoto mb-2">{category}</h3>
                <div className="flex items-center space-x-2">
                  <img src={iconMapping[category]} alt={category} className="w-7 h-7" />
                  <p className="text-3xl font-FontNoto">{categoryCounts[category] || 0}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="w-full mt-6 md:mt-10 flex justify-center px-2">
          <div className="bg-base-100 shadow-lg p-4 rounded-lg w-full max-w-screen-md min-h-[250px]">
            <h3 className="text-lg font-bold text-black mb-4 font-FontNoto text-center">
              สถิติการลาของพนักงาน
            </h3>
            <div className="relative w-full overflow-x-auto">
              <div className="min-w-[600px] h-[350px] sm:h-[400px]">
                <Bar className="font-FontNoto" data={createChartData()} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveStatistics;
