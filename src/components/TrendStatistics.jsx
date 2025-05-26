import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";

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

const TrendStatistics = () => {
    const [statistics, setStatistics] = useState({
        totalEmployees: 0,
        totalDocuments: 0,
        totalExperience: 0,
    });
    const [employeeData, setEmployeeData] = useState([]);
    const [filesData, setFilesData] = useState([]);
    const [categoryCounts, setCategoryCounts] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [leaveData, setLeaveData] = useState([]); // ✅ เพิ่ม state สำหรับเก็บข้อมูลใบลา


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
                const response = await axios.get("https://localhost:7039/api/Files");

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
        const fetchData = async () => {
            try {
                const employeeResponse = await axios.get("https://localhost:7039/api/Users");
                const experienceResponse = await axios.get("https://localhost:7039/api/WorkExperiences");

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


    const handleYearChange = (e) => {
        setSelectedYear(parseInt(e.target.value));
    };

    const getUniqueYears = () => {
        const startYear = 2024;
        const endYear = 2034;
        const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
        return years;
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
            <div className="w-full bg-gradient-to-r from-cyan-900 via-cyan-600 to-slate-500 text-white rounded-xl p-4 sm:p-5 md:p-6 mb-6 shadow-lg">
                <h1 className="text-xl sm:text-2xl font-bold font-FontNoto leading-snug">
                    สถิติแนวโน้มไฟล์เอกสาร
                </h1>
                <p className="text-xs sm:text-sm mt-1 font-FontNoto">กราฟตรวจสอบจำนวนไฟล์เอกสารในแต่ละปี</p>
            </div>
            <div className="flex items-center justify-end space-x-4 mb-4">
                <label htmlFor="yearSelect" className="label flex justify-between">
                    <select
                        id="yearSelect"
                        value={selectedYear}
                        onChange={handleYearChange}
                        className="select select-bordered font-FontNoto text-black w-48"
                    >
                        {getUniqueYears().map(year => (
                            <option key={year} value={year}>{year}</option>
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
    );
};

export default TrendStatistics;
