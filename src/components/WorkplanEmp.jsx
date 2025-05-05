import React, { useEffect, useState } from "react";
import axios from "axios";

const WorkplanEmp = () => {
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

    const filteredPlans = plans.filter(p => {
        const d = new Date(p.date);
        return d.getMonth() + 1 === parseInt(month) && d.getFullYear() === parseInt(year) &&
            (p.morningTask || p.eveningTask); // กรองเฉพาะแผนงานที่มี morningTask หรือ eveningTask
    });
    const grouped = filteredPlans.reduce((acc, plan) => {
        const key = plan.date;
        if (!acc[key]) acc[key] = [];
        acc[key].push(plan);
        return acc;
    }, {});

    return (
        <div className="flex flex-col w-full">
            <div className="w-full bg-gradient-to-r from-cyan-900 via-cyan-600 to-slate-500 text-white rounded-xl p-4 sm:p-5 md:p-6 mb-6 shadow-lg">
                <h1 className="text-xl sm:text-2xl font-bold font-FontNoto leading-snug">
                    ตารางแผนการปฏิบัติงาน
                </h1>
                <p className="text-xs sm:text-sm mt-1 font-FontNoto">ตรวจสอบแผนการปฏิบัติงานของเพื่อนร่วมงาน</p>
            </div>
            <div className="w-full max-w-6xl mx-auto bg-transparent rounded-xl p-6">

                <div className="flex items-center justify-end space-x-4 mb-6">
                    <select className="select select-bordered w-40 font-FontNoto" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                        {thaiMonths.map((m, idx) => (
                            <option className="font-FontNoto" key={idx + 1} value={idx + 1}>{m}</option>
                        ))}
                    </select>
                    <select className="select select-bordered w-40 font-FontNoto" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                        {Array.from({ length: 11 }, (_, i) => 2024 + i).map((y) => (
                            <option className="font-FontNoto" key={y} value={y}>{y + 543}</option>
                        ))}
                    </select>
                </div>

                {Object.entries(grouped).sort((a, b) => new Date(b[0]) - new Date(a[0])).map(([date, records], index) => (
                    <div key={date} className="relative bg-blue-50 rounded-2xl border border-blue-200 shadow mb-8 p-4 animate-fade-in">

                        <div className="flex justify-between items-center mb-4 pt-4">
                            <h3 className="font-semibold text-lg text-blue-700 font-FontNoto">
                                📅 วันที่ {formatDate(date)}
                            </h3>
                        </div>

                        <div className="overflow-x-auto rounded-2xl shadow-lg border border-gray-300 bg-white animate-fade-in">
                            <table className="table text-sm text-center w-full table-fixed">
                                <thead className="bg-blue-100 text-blue-800 font-FontNoto">
                                    <tr>
                                        <th className="w-[180px] py-3 font-bold border-b border-gray-300 font-FontNoto text-black">ชื่อพนักงาน</th>
                                        <th className="w-[300px] py-3 font-bold border-b border-gray-300 font-FontNoto text-black">
                                            {(() => {
                                                const d = new Date(date);
                                                return d.getDay() === 1 ? "เมื่อวันศุกร์" : "เมื่อวาน";
                                            })()}
                                        </th>
                                        <th className="w-[300px] py-3 font-bold border-b border-gray-300 font-FontNoto text-black">วันนี้</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white font-FontNoto">
                                    {records.map((rec, idx) => (
                                        <tr
                                            key={idx}
                                            className="hover:bg-gray-50 transition-colors duration-300 font-FontNoto"
                                        >
                                            <td className="text-left px-3 py-2 border-b border-gray-200 font-FontNoto">{getFullName(rec.userID)}</td>
                                            <td className="text-left px-3 py-2 border-b border-gray-200 whitespace-pre-wrap break-words font-FontNoto">
                                                {rec.morningTask || "-"}
                                            </td>
                                            <td className="text-left px-3 py-2 border-b border-gray-200 whitespace-pre-wrap break-words font-FontNoto">
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

export default WorkplanEmp;
