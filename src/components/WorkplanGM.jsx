import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const WorkplanGM = () => {
    const [plans, setPlans] = useState([]);
    const [users, setUsers] = useState([]);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    const thaiMonths = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];

    const [yesterdayLabel, setYesterdayLabel] = useState("เมื่อวาน");

    useEffect(() => {
        const today = new Date();
        const isMonday = today.getDay() === 1;
        setYesterdayLabel(isMonday ? "เมื่อวันศุกร์" : "เมื่อวาน");

        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            const [planRes, userRes] = await Promise.all([
                axios.get("https://localhost:7039/api/Workplan"),
                axios.get("https://localhost:7039/api/Users")
            ]);
            setPlans(planRes.data);
            setUsers(userRes.data);
        } catch (err) {
            console.error("โหลดข้อมูลล้มเหลว:", err);
        }
    };

    const getFullName = (userId) => {
        const user = users.find(u => u.userID === userId);
        return user ? `${user.firstName} ${user.lastName}` : "ไม่ทราบชื่อ";
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("th-TH", {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };
    const exportToExcel = (records, date) => {
        const data = records.map(rec => ({
            "ชื่อพนักงาน": getFullName(rec.userID),
            [yesterdayLabel]: rec.morningTask || "-",
            "วันนี้": rec.eveningTask || "-"
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Workplan");

        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(blob, `แผนการทำงาน_${formatDate(date)}.xlsx`);
    };

    // กรองข้อมูลตามเดือน/ปี
    const filteredPlans = plans.filter(p => {
        const d = new Date(p.date);
        return d.getMonth() + 1 === parseInt(month) && d.getFullYear() === parseInt(year);
    });

    // กลุ่มตามวันที่
    const grouped = filteredPlans.reduce((acc, plan) => {
        const key = plan.date;
        if (!acc[key]) acc[key] = [];
        acc[key].push(plan);
        return acc;
    }, {});

    return (
        <div className="flex-1 p-3 bg-white shadow-lg rounded-lg ml-1">
            
            <div className="p-3">
                <h2 className="text-2xl font-bold mb-4 font-FontNoto">ตารางแผนการปฏิบัติงานพนักงาน</h2>

                {/* ตัวกรองเดือน/ปี */}
                <div className="flex items-center justify-end space-x-4 mb-4">
                    <select className="select select-bordered w-40 font-FontNoto" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                        {thaiMonths.map((m, idx) => (
                            <option key={idx + 1} value={idx + 1}>{m}</option>
                        ))}
                    </select>
                    <select className="select select-bordered w-40 font-FontNoto" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                        {Array.from({ length: 11 }, (_, i) => 2024 + i).map((y) => (
                            <option key={y} value={y}>{y + 543}</option>
                        ))}
                    </select>
                </div>

                {/* ตารางรายวัน */}
                {Object.entries(grouped).sort((a, b) => new Date(b[0]) - new Date(a[0])).map(([date, records]) => (
                    <div key={date} className="bg-white rounded-xl shadow border border-gray-200 p-4 mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold font-FontNoto">📅 วันที่ {formatDate(date)}</h3>
                            <button
                                onClick={() => exportToExcel(records, date)}
                                className="btn btn-sm btn-success font-FontNoto"
                            >
                                📥 ส่งออก Excel
                            </button>
                        </div>
                        <div className="overflow-x-hidden w-full">
                            <table className="table text-sm text-center border border-gray-300 w-full table-fixed">
                                <thead className="bg-blue-100 font-FontNoto text-black">
                                    <tr className="text-black">
                                        <th className="w-[180px] whitespace-nowrap font-FontNoto ">ชื่อพนักงาน</th>
                                        <th className="w-[300px] whitespace-nowrap font-FontNoto">
                                            {(() => {
                                                const d = new Date(date); // date ของแถวนี้
                                                return d.getDay() === 1 ? "เมื่อวันศุกร์" : "เมื่อวาน";
                                            })()}
                                        </th>
                                        <th className="w-[300px] whitespace-nowrap font-FontNoto">วันนี้</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white text-center font-FontNoto">
                                    {records.map((rec, idx) => (
                                        <tr key={idx}>
                                            <td className="text-left px-2 font-FontNoto">{getFullName(rec.userID)}</td>
                                            <td className="bg-blue-50 text-left px-2 whitespace-pre-wrap break-words overflow-hidden font-FontNoto">
                                                {rec.morningTask || "-"}
                                            </td>
                                            <td className="bg-green-50 text-left px-2 whitespace-pre-wrap break-words overflow-hidden font-FontNoto">
                                                {rec.eveningTask || "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                    </div>
                ))}
            </div>
        </div>
    );
};

export default WorkplanGM;
