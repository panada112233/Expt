import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

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
            await axios.delete(`https://localhost:7039/api/Worktime/${deleteRecordID}`);
            setDeleteRecordID(null);
            fetchAll();
        } catch (error) {
            alert("เกิดข้อผิดพลาดในการลบข้อมูล");
            console.error(error);
        }
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
        <div className="flex-1 p-3 bg-white shadow-lg rounded-lg ml-1">

            {/* หัวเรื่อง */}
            <h2 className="text-2xl font-bold mb-4 font-FontNoto">รายการเข้า-ออกงานพนักงาน</h2>

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

            {/* 🔶 สรุป */}
            <div className="bg-base-100 p-4 rounded-lg mb-6 font-FontNoto">
                <p className="mb-2 text-lg font-FontNoto">
                    <strong className="font-FontNoto">🥇 คนที่มาสายมากที่สุด:</strong>{" "}
                    {mostLate ? `${mostLate.fullName} (${mostLate.totalLateMinutes} นาที)` : "-"}
                </p>
                <p className="text-lg font-FontNoto">
                    <strong className="font-FontNoto">✅ พนักงานที่ไม่มาสายเลย:</strong>{" "}
                    {neverLate.length > 0
                        ? neverLate.map(u => u.fullName).join(", ")
                        : "-"}
                </p>
            </div>

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
                <dialog open className="modal">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">แก้ไขเวลา</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="label">เวลาเข้า (HH:mm)</label>
                                <input
                                    type="time"
                                    value={editForm.checkIn}
                                    onChange={(e) => setEditForm({ ...editForm, checkIn: e.target.value })}
                                    className="input input-bordered w-full"
                                />
                            </div>
                            <div>
                                <label className="label">เวลาออก (HH:mm)</label>
                                <input
                                    type="text"
                                    value={editForm.checkOut}
                                    onChange={(e) => setEditForm({ ...editForm, checkOut: e.target.value })}
                                    className="input input-bordered w-full"
                                    placeholder="17:30 หรือ -"
                                />

                            </div>
                        </div>
                        <div className="modal-action">
                            <button onClick={handleEditSubmit} className="btn btn-success">บันทึก</button>
                            <button onClick={() => setEditingRecord(null)} className="btn btn-ghost">ยกเลิก</button>
                        </div>
                    </div>
                </dialog>
            )}
            {deleteRecordID && (
                <dialog open className="modal">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?</h3>
                        <div className="modal-action">
                            <button onClick={handleDelete} className="btn btn-error">ลบ</button>
                            <button onClick={() => setDeleteRecordID(null)} className="btn btn-ghost">ยกเลิก</button>
                        </div>
                    </div>
                </dialog>
            )}

        </div>

    );
};

export default WorktimeEmp;
