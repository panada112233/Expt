import React, { useEffect, useState } from "react";
import axios from "axios";

const WorktimeEmp = () => {
    const [worktimes, setWorktimes] = useState([]);
    const [users, setUsers] = useState([]);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [editingRecord, setEditingRecord] = useState(null);
    const [deleteRecordID, setDeleteRecordID] = useState(null);
    const [editForm, setEditForm] = useState({ checkIn: "", checkOut: "" });
    const thaiMonths = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            const [wtRes, userRes] = await Promise.all([
                axios.get("https://localhost:7039/api/Worktime"),
                axios.get("https://localhost:7039/api/Users")
            ]);
            setWorktimes(wtRes.data);
            setUsers(userRes.data);
        } catch (err) {
            console.error("Error loading data:", err);
        }
    };

    const getFullName = (userId) => {
        const user = users.find(u => u.userID === userId);
        return user ? `${user.firstName} ${user.lastName}` : "ไม่ทราบชื่อ";
    };

    const handleEdit = (record) => {
        setEditingRecord(record);
        setEditForm({
            checkIn: record.checkIn || "",
            checkOut: record.checkOut || ""
        });
    };

    const handleEditSubmit = async () => {
        try {
            console.log("Sending edit:", editForm);
            await axios.put(`https://localhost:7039/api/Worktime/${editingRecord.worktimeID}`, editForm);
            setEditingRecord(null);
            fetchAll();
        } catch (err) {
            alert("เกิดข้อผิดพลาดในการแก้ไข");
            console.error(err);
        }
    };

    const handleDelete = async () => {
        try {
            await axios.delete(
                `https://localhost:7039/api/Worktime/${deleteRecordID}`,
                { headers: { "Content-Type": "application/json" } }
            );

            setDeleteRecordID(null);
            fetchAll();
        } catch (error) {
            alert("เกิดข้อผิดพลาดในการลบข้อมูล");
            console.error(error);
        }
    };

    const calculateWorkingHours = (checkIn, checkOut, dateStr) => {
        if (!checkIn || !checkOut) return '-';

        const [inH, inM] = checkIn.split(':').map(Number);
        const [outH, outM] = checkOut.split(':').map(Number);

        const checkInDate = new Date(dateStr);
        checkInDate.setHours(inH, inM, 0);

        const checkOutDate = new Date(dateStr);
        checkOutDate.setHours(outH, outM, 0);

        const diffMs = checkOutDate - checkInDate;
        if (diffMs <= 0) return '-';

        const totalMinutes = diffMs / (1000 * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);

        return `${hours} ชั่วโมง ${minutes} นาที`;
    };


    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("th-TH", {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    // กรองตามเดือน/ปี
    const filteredWorktimes = worktimes.filter(w => {
        const d = new Date(w.date);
        return d.getMonth() + 1 === parseInt(month) && d.getFullYear() === parseInt(year);
    });

    // กลุ่มข้อมูลตามวันที่
    const grouped = filteredWorktimes.reduce((acc, w) => {
        const key = w.date;
        if (!acc[key]) acc[key] = [];
        acc[key].push(w);
        return acc;
    }, {});

    // 🔧 ปรับให้เช็กว่า user มีข้อมูลในเดือนนี้จริงหรือไม่
    const lateSummary = users.map(user => {
        const records = filteredWorktimes.filter(w => w.userID === user.userID);
        const totalLate = records
            .filter(w => w.lateMinutes > 0)
            .reduce((sum, w) => sum + w.lateMinutes, 0);

        return {
            fullName: `${user.firstName} ${user.lastName}`,
            totalLateMinutes: totalLate,
            hasData: records.length > 0
        };
    });

    const mostLate = [...lateSummary]
        .filter(u => u.hasData)
        .sort((a, b) => b.totalLateMinutes - a.totalLateMinutes)[0];

    const neverLate = lateSummary
        .filter(u => u.totalLateMinutes === 0 && u.hasData);

    return (
        <div className="flex flex-col w-full">
            <div className="w-full bg-gradient-to-r from-cyan-900 via-cyan-600 to-slate-500 text-white rounded-xl p-4 sm:p-5 md:p-6 mb-6 shadow-lg">
                <h1 className="text-xl sm:text-2xl font-bold font-FontNoto leading-snug">
                    รายการเข้า-ออกงานพนักงาน
                </h1>
                <p className="text-xs sm:text-sm mt-1 font-FontNoto">ตรวจสอบข้อมูลการเข้า-ออกงาน และกิจกรรมที่เกี่ยวข้อง</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 font-FontNoto p-3">

                {/* การ์ด คนที่มาสายมากที่สุด */}
                <div className="bg-red-50 border border-red-400 rounded-xl p-4 shadow-md w-full sm:w-80 flex flex-col relative overflow-hidden">
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/3917/3917754.png"
                        alt="Most Late"
                        className="w-10 h-10 absolute -top-3 -right-3 rotate-[10deg]"
                    />
                    <h3 className="text-md font-bold text-red-800 mb-3 text-center font-FontNoto ">🥇 คนที่มาสายมากที่สุด</h3>
                    <p className="text-sm text-gray-800 font-FontNoto text-left">
                        {mostLate ? `${mostLate.fullName} (${mostLate.totalLateMinutes} นาที)` : "-"}
                    </p>
                </div>

                {/* การ์ด พนักงานที่ไม่มาสายเลย */}
                <div className="bg-green-50 border border-green-400 rounded-xl p-4 shadow-md w-full sm:w-80 flex flex-col relative overflow-hidden">
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/190/190411.png"
                        alt="Never Late"
                        className="w-10 h-10 absolute -top-3 -right-3 rotate-[10deg]"
                    />
                    <h3 className="text-md font-bold text-green-800 mb-3 text-center font-FontNoto ">✅ พนักงานที่ไม่มาสายเลย</h3>
                    <p className="text-sm text-gray-800 font-FontNoto text-left ">
                        {neverLate.length > 0 ? neverLate.map(u => u.fullName).join(", ") : "-"}
                    </p>
                </div>
            </div>
            {/* ตัวกรองเดือน/ปี */}
            <div className="flex items-center justify-end space-x-4 mb-4">
                <select className="select select-bordered w-40 text-black font-FontNoto" value={month} onChange={(e) => setMonth(e.target.value)}>
                    {thaiMonths.map((m, idx) => (
                        <option className="font-FontNoto" key={idx + 1} value={idx + 1}>{m}</option>
                    ))}
                </select>
                <select className="select select-bordered w-40 text-black font-FontNoto" value={year} onChange={(e) => setYear(e.target.value)}>
                    {Array.from({ length: 11 }, (_, i) => 2024 + i).map((y) => (
                        <option className="font-FontNoto" key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>
            <button
                onClick={() => {
                    fetch("https://localhost:7039/api/Worktime/NotifyLineNow", {
                        method: "POST"
                    })
                        .then((res) => res.text())
                        .then((msg) => alert(msg))
                        .catch((err) => console.error(err));
                }}
                className="btn btn-warning"
            >
                ทดสอบส่งแจ้งเตือน LINE ตอนนี้
            </button>


            {/* ตารางข้อมูลรายวัน */}
            {Object.entries(grouped).sort((a, b) => new Date(b[0]) - new Date(a[0])).map(([date, records]) => (
                <div key={date} className="bg-white rounded-xl shadow border border-gray-200 p-4 mb-6">
                    <h3 className="font-semibold mb-2 font-FontNoto">📅 วันที่ {formatDate(date)}</h3>
                    <div className="overflow-x-auto">
                        <table className="table text-sm text-center border border-gray-300">
                            <thead className="text-center">
                                <tr className="text-black bg-blue-100 font-FontNoto">
                                    <th className="font-FontNoto">ชื่อพนักงาน</th>
                                    <th className="font-FontNoto">สถานที่</th>
                                    <th className="font-FontNoto">เข้างาน</th>
                                    <th className="font-FontNoto">ออกงาน</th>
                                    <th className="font-FontNoto">มาสาย</th>
                                    <th className="font-FontNoto">พิกัด</th>
                                    <th className="font-FontNoto">เวลาทำงาน</th>
                                    <th className="font-FontNoto">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white text-center">
                                {records.map((rec, idx) => (
                                    <tr key={idx}>
                                        <td className="font-FontNoto">{getFullName(rec.userID)}</td>
                                        <td className={`font-FontNoto ${rec.location.includes("ลา") ? "text-red-600" : ""}`}>
                                            {rec.location}
                                        </td>
                                        <td className="font-FontNoto">{rec.checkIn || '-'}</td>
                                        <td className="font-FontNoto">
                                            {rec.checkOut && rec.checkOut !== "-" ? rec.checkOut : "-"}
                                        </td>

                                        <td className={`font-FontNoto ${rec.lateMinutes > 0 ? 'text-red-600' : 'text-black'}`}>
                                            {rec.lateMinutes > 0
                                                ? `${Math.floor(rec.lateMinutes / 60) > 0 ? `${Math.floor(rec.lateMinutes / 60)} ชั่วโมง ` : ''}${rec.lateMinutes % 60 > 0 ? `${rec.lateMinutes % 60} นาที` : ''}`
                                                : '0 นาที'}
                                        </td>

                                        <td className="font-FontNoto text-blue-600">
                                            {rec.photoPath?.includes("Lat")
                                                ? <a href={`https://maps.google.com/?q=${rec.photoPath.replace('Lat: ', '').replace(', Lng: ', ',')}`} target="_blank" rel="noreferrer" className="underline">{rec.photoPath}</a>
                                                : rec.photoPath || '-'}
                                        </td>
                                        <td className="font-FontNoto">
                                            {calculateWorkingHours(rec.checkIn, rec.checkOut, rec.date)}
                                        </td>
                                        <td className="font-FontNoto flex justify-center gap-2">
                                            <button onClick={() => handleEdit(rec)} className="btn btn-xs btn-warning">แก้ไข</button>
                                            <button onClick={() => setDeleteRecordID(rec.worktimeID)} className="btn btn-xs btn-error">ลบ</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
            {editingRecord && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-start justify-center pt-20 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h3 className="font-bold text-lg mb-4 font-FontNoto">แก้ไขเวลา</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="label font-FontNoto">เวลาเข้า (HH:mm)</label>
                                <input
                                    type="time"
                                    value={editForm.checkIn}
                                    onChange={(e) => setEditForm({ ...editForm, checkIn: e.target.value })}
                                    className="input input-bordered w-full font-FontNoto"
                                />
                            </div>
                            <div>
                                <label className="label font-FontNoto">เวลาออก (HH:mm)</label>
                                <input
                                    type="text"
                                    value={editForm.checkOut}
                                    onChange={(e) => setEditForm({ ...editForm, checkOut: e.target.value })}
                                    className="input input-bordered w-full font-FontNoto"
                                    placeholder="17:30 หรือ -"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={handleEditSubmit} className="btn btn-success font-FontNoto">บันทึก</button>
                            <button onClick={() => setEditingRecord(null)} className="btn btn-ghost font-FontNoto">ยกเลิก</button>
                        </div>
                    </div>
                </div>
            )}

            {deleteRecordID && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-start justify-center pt-20 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-auto">
                        <h3 className="font-bold text-lg mb-4 font-FontNoto">คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?</h3>
                        <div className="flex justify-end gap-2 font-FontNoto">
                            <button onClick={handleDelete} className="btn btn-error">ลบ</button>
                            <button onClick={() => setDeleteRecordID(null)} className="btn btn-ghost">ยกเลิก</button>
                        </div>
                    </div>
                </div>
            )}
        </div>

    );
};

export default WorktimeEmp;
