import React, { useEffect, useState } from "react";
import axios from "axios";

const WorktimeEmp = () => {
    const [worktimes, setWorktimes] = useState([]);
    const [users, setUsers] = useState([]);
    const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
    const [selectedUser, setSelectedUser] = useState("all");
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

    const calculateLateMinutes = (checkInTime, dateStr, leaveType = '') => {
        if (!checkInTime) return '0 นาที';

        const timeParts = checkInTime.split(':');
        if (timeParts.length < 2) return '0 นาที';

        const checkIn = new Date(dateStr);
        checkIn.setHours(Number(timeParts[0]));
        checkIn.setMinutes(Number(timeParts[1]));
        checkIn.setSeconds(0);

        const expected = new Date(dateStr);

        // กรณีลาครึ่งวันเช้า (เริ่มงานบ่าย 1 โมง)
        if (leaveType === 'morning') {
            expected.setHours(13, 0, 0); // ถ้าลาครึ่งวันเช้า เริ่มงานบ่าย 1
        } else if (leaveType === 'full') {
            return 'ไม่สามารถเช็คอินได้ เนื่องจากลาทั้งวัน';
        } else {
            expected.setHours(8, 30, 0); // เวลาปกติเริ่มงาน 8:30
        }

        const diffMinutes = (checkIn - expected) / (1000 * 60);
        if (diffMinutes <= 0) return '0 นาที';

        const hours = Math.floor(diffMinutes / 60);
        const minutes = Math.round(diffMinutes % 60);

        if (hours > 0 && minutes > 0) return `${hours} ชั่วโมง ${minutes} นาที`;
        if (hours > 0) return `${hours} ชั่วโมง`;
        return `${minutes} นาที`;
    };

    const calculateRawLateMinutes = (checkInTime, dateStr, leaveType = '') => {
        if (!checkInTime) return 0;

        const timeParts = checkInTime.split(':');
        if (timeParts.length < 2) return 0;

        const checkIn = new Date(dateStr);
        checkIn.setHours(Number(timeParts[0]));
        checkIn.setMinutes(Number(timeParts[1]));
        checkIn.setSeconds(0);

        const expected = new Date(dateStr);

        if (leaveType === 'morning') {
            expected.setHours(13, 0, 0);
        } else if (leaveType === 'full') {
            return 0;
        } else {
            expected.setHours(8, 30, 0);
        }

        const diffMinutes = (checkIn - expected) / (1000 * 60);
        return diffMinutes > 0 ? diffMinutes : 0;
    };

    const calculateWorkingHours = (checkIn, checkOut, dateStr, leaveType) => {
        if (!checkIn || !checkOut) return '-';

        const [inH, inM] = checkIn.split(':').map(Number);
        const [outH, outM] = checkOut.split(':').map(Number);

        const checkInDate = new Date(dateStr);
        checkInDate.setHours(inH, inM, 0);

        const checkOutDate = new Date(dateStr);
        checkOutDate.setHours(outH, outM, 0);

        let diffMs = checkOutDate - checkInDate;
        if (diffMs <= 0) return '-';

        let totalMinutes = diffMs / (1000 * 60);

        // ถ้าลาครึ่งวัน ไม่หักเวลา 1 ชั่วโมง
        if (leaveType !== 'morning' && leaveType !== 'afternoon') {
            totalMinutes -= 60; // หักเวลาออก 1 ชั่วโมง (60 นาที) สำหรับกรณีที่ไม่ได้ลา
        }

        if (totalMinutes <= 0) return '0 ชั่วโมง 0 นาที';

        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);

        return `${hours} ชั่วโมง ${minutes} นาที`;
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('th-TH', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const filteredWorktimes = worktimes.filter(item => {
        const date = new Date(item.date);
        const matchMonth = date.getMonth() + 1 === parseInt(monthFilter);
        const matchYear = date.getFullYear() === parseInt(yearFilter);
        const matchUser = selectedUser === "all" || item.userID === parseInt(selectedUser);
        return matchMonth && matchYear && matchUser;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    // สำหรับแสดงสถิติและข้อมูลสรุป
    const getUserLateStatistics = () => {
        const stats = {};

        users.forEach(user => {
            stats[user.userID] = {
                name: `${user.firstName} ${user.lastName}`,
                totalLateMinutes: 0,
                lateCount: 0,
                totalWorkdays: 0
            };
        });

        worktimes.filter(item => {
            const date = new Date(item.date);
            return date.getMonth() + 1 === parseInt(monthFilter) &&
                date.getFullYear() === parseInt(yearFilter);
        }).forEach(item => {
            if (!stats[item.userID]) return;

            const date = new Date(item.date);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            if (isWeekend) return;

            const locationText = (item.location || '').toLowerCase().replace(/\s/g, '');
            const leaveKeywords = ['ป่วย', 'กิจส่วนตัว', 'บวช', 'พักร้อน', 'ลาคลอด'];
            const isLeave = leaveKeywords.some(keyword => locationText.includes(keyword));
            const leaveType = locationText.includes('ครึ่งวันเช้า')
                ? 'morning'
                : locationText.includes('ครึ่งวันบ่าย')
                    ? 'afternoon'
                    : locationText.includes('ลาทั้งวัน') || locationText.includes('ลาป่วย-เต็มวัน') || locationText.includes('ลากิจทั้งวัน') || locationText.includes('ลากิจส่วนตัว-เต็มวัน')
                        ? 'full'
                        : '';

            if (!isLeave || leaveType !== 'full') {
                stats[item.userID].totalWorkdays++;
            }

            if (item.checkIn && !isWeekend && (!isLeave || leaveType !== 'full')) {
                const lateMinutes = calculateRawLateMinutes(item.checkIn, item.date, leaveType);
                if (lateMinutes > 0) {
                    stats[item.userID].totalLateMinutes += lateMinutes;
                    stats[item.userID].lateCount++;
                }
            }
        });

        return Object.values(stats).filter(stat => stat.totalWorkdays > 0);
    };

    const lateStats = getUserLateStatistics();

    // เรียงลำดับตามเวลาสายมากที่สุด
    const sortedLateStats = [...lateStats].sort((a, b) => b.totalLateMinutes - a.totalLateMinutes);
    const mostLate = sortedLateStats.length > 0 ? sortedLateStats[0] : null;
    const neverLate = lateStats.filter(stat => stat.totalLateMinutes === 0 && stat.totalWorkdays > 0);

    return (
        <div className="">
            <div className="w-full bg-gradient-to-r from-cyan-900 via-cyan-600 to-slate-500 text-white rounded-xl p-4 sm:p-5 md:p-6 mb-6 shadow-lg">
                <h1 className="text-xl sm:text-2xl font-bold font-FontNoto leading-snug">
                    รายการเข้า-ออกงานพนักงาน
                </h1>
                <p className="text-xs sm:text-sm mt-1 font-FontNoto">ตรวจสอบข้อมูลการเข้า-ออกงาน และกิจกรรมที่เกี่ยวข้อง</p>
            </div>

            {/* การ์ดสรุปข้อมูล */}
            <div className="flex flex-col sm:flex-row gap-4 font-FontNoto p-3 mb-4">
                {/* การ์ด คนที่มาสายมากที่สุด */}
                <div className="bg-red-50 border border-red-400 rounded-xl p-4 shadow-md w-full sm:w-80 flex flex-col relative overflow-hidden">
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/3917/3917754.png"
                        alt="Most Late"
                        className="w-10 h-10 absolute -top-3 -right-3 rotate-[10deg]"
                    />
                    <h3 className="text-md font-bold text-red-800 mb-3 text-center font-FontNoto">🥇 คนที่มาสายมากที่สุด</h3>
                    <p className="text-sm text-gray-800 font-FontNoto text-left">
                        {mostLate ? `${mostLate.name} (${Math.floor(mostLate.totalLateMinutes / 60)} ชั่วโมง ${Math.round(mostLate.totalLateMinutes % 60)} นาที)` : "-"}
                    </p>
                </div>

                {/* การ์ด พนักงานที่ไม่มาสายเลย */}
                <div className="bg-green-50 border border-green-400 rounded-xl p-4 shadow-md w-full sm:w-80 flex flex-col relative overflow-hidden">
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/190/190411.png"
                        alt="Never Late"
                        className="w-10 h-10 absolute -top-3 -right-3 rotate-[10deg]"
                    />
                    <h3 className="text-md font-bold text-green-800 mb-3 text-center font-FontNoto">✅ พนักงานที่ไม่มาสายเลย</h3>
                    <p className="text-sm text-gray-800 font-FontNoto text-left">
                        {neverLate.length > 0 ? neverLate.map(u => u.name).join(", ") : "-"}
                    </p>
                </div>
            </div>

            {/* ตัวกรองข้อมูล */}
            <div className="flex flex-wrap items-center justify-between space-y-2 sm:space-y-0 mb-4 bg-blue-50 p-4 rounded-xl shadow">
                <div className="flex flex-wrap items-center space-x-4 w-full sm:w-auto">
                    <select
                        className="select select-bordered flex-1 text-black font-FontNoto"
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                    >
                        <option value="all" className="font-FontNoto">ทุกคน</option>
                        {users.map(user => (
                            <option key={user.userID} value={user.userID} className="font-FontNoto">
                                {user.firstName} {user.lastName}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-wrap items-center space-x-4 w-full sm:w-auto">
                    <select
                        className="select select-bordered flex-1 text-black font-FontNoto"
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                    >
                        {thaiMonths.map((month, index) => (
                            <option className="font-FontNoto" key={index + 1} value={index + 1}>
                                {month}
                            </option>
                        ))}
                    </select>
                    <select
                        className="select select-bordered flex-1 text-black font-FontNoto"
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                    >
                        {Array.from({ length: 11 }, (_, i) => (
                            <option className="font-FontNoto" key={i} value={2024 + i}>{2024 + i}</option>
                        ))}
                    </select>
                </div>
            </div>
            {/* ตารางข้อมูล */}
            <div className="overflow-x-auto bg-blue-50 p-4 rounded-xl shadow-lg relative mb-8">
                <div className="overflow-x-auto">
                    <h2 className="text-lg font-bold font-FontNoto mb-4">ตารางการทำงานและการลาของพนักงาน</h2>

                    {filteredWorktimes.length === 0 ? (
                        <div className="bg-white p-8 text-center rounded-lg shadow font-FontNoto">
                            ไม่พบข้อมูลที่ตรงกับเงื่อนไขที่เลือก
                        </div>
                    ) : (
                        <table className="table w-full text-center">
                            <thead className="bg-blue-300 text-blue-900 text-sm">
                                <tr>
                                    <th className="py-3 font-FontNoto">วันที่</th>
                                    <th className="py-3 font-FontNoto">พนักงาน</th>
                                    <th className="py-3 font-FontNoto">สถานที่</th>
                                    <th className="py-3 font-FontNoto">ประเภทการลา</th>
                                    <th className="py-3 font-FontNoto">พิกัด</th>
                                    <th className="py-3 font-FontNoto">สาย</th>
                                    <th className="py-3 font-FontNoto">Check-in</th>
                                    <th className="py-3 font-FontNoto">Check-out</th>
                                    <th className="py-3 font-FontNoto">เวลาทำงาน</th>
                                    <th className="py-3 font-FontNoto">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {filteredWorktimes.map((item, index) => {
                                    const locationText = item.location || '';
                                    const leaveKeywords = ['ป่วย', 'กิจส่วนตัว', 'บวช', 'พักร้อน', 'ลาคลอด'];
                                    const isLeave = leaveKeywords.some(keyword => locationText.includes(keyword));
                                    const leaveType = locationText.includes('ครึ่งวันเช้า')
                                        ? 'morning'
                                        : locationText.includes('ครึ่งวันบ่าย')
                                            ? 'afternoon'
                                            : locationText.includes('ลาทั้งวัน')
                                                ? 'full'
                                                : '';

                                    const shouldShowTime = !isLeave || leaveType === 'morning' || leaveType === 'afternoon';

                                    return (
                                        <tr
                                            key={index}
                                            className={`border-b transition duration-300 font-FontNoto ${isLeave ? 'bg-green-50 hover:bg-green-100 text-green-700' : 'hover:bg-blue-100 font-FontNoto'}`}
                                        >
                                            <td className="py-2 font-FontNoto">{formatDate(item.date)}</td>
                                            <td className="py-2 font-FontNoto">{getFullName(item.userID)}</td>

                                            {isLeave ? (
                                                <>
                                                    <td className="py-2 font-FontNoto">-</td>
                                                    <td className="py-2 font-FontNoto">
                                                        {locationText.split('|')[0]?.trim() || '-'}<br />
                                                        <span className="text-sm text-gray-600 font-FontNoto">
                                                            {locationText.split('|')[1]?.trim() || ''}
                                                        </span>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="py-2 font-FontNoto">{locationText}</td>
                                                    <td className="py-2 font-FontNoto">-</td>
                                                </>
                                            )}

                                            <td className="py-2 font-FontNoto">
                                                {item.photoPath && item.photoPath.includes('|') ? (
                                                    <span className="text-sm text-gray-800 font-FontNoto">{item.photoPath.split('|')[1]?.trim()}</span>
                                                ) : (
                                                    item.photoPath || '-'
                                                )}
                                            </td>

                                            <td className={`py-2 font-FontNoto ${shouldShowTime && calculateRawLateMinutes(item.checkIn, item.date, leaveType) > 0 ? 'text-red-600' : ''}`}>
                                                {shouldShowTime ? calculateLateMinutes(item.checkIn, item.date, leaveType) : '-'}
                                            </td>

                                            <td className="py-2 font-FontNoto">{shouldShowTime ? item.checkIn || '-' : '-'}</td>
                                            <td className="py-2 font-FontNoto">{shouldShowTime ? item.checkOut || '-' : '-'}</td>
                                            <td className="py-2 font-FontNoto">
                                                {shouldShowTime ? calculateWorkingHours(item.checkIn, item.checkOut, item.date, leaveType) : '-'}
                                            </td>
                                            <td className="py-2 font-FontNoto">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => handleEdit(item)} className="btn btn-xs btn-warning">แก้ไข</button>
                                                    <button onClick={() => setDeleteRecordID(item.worktimeID)} className="btn btn-xs btn-error">ลบ</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* โมดัลแก้ไขข้อมูล */}
            {editingRecord && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-start justify-center pt-20 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h3 className="font-bold text-lg mb-4 font-FontNoto">แก้ไขเวลา</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="label font-FontNoto">พนักงาน</label>
                                <input
                                    type="text"
                                    value={getFullName(editingRecord.userID)}
                                    disabled
                                    className="input input-bordered w-full font-FontNoto bg-gray-100"
                                />
                            </div>
                            <div>
                                <label className="label font-FontNoto">วันที่</label>
                                <input
                                    type="text"
                                    value={formatDate(editingRecord.date)}
                                    disabled
                                    className="input input-bordered w-full font-FontNoto bg-gray-100"
                                />
                            </div>
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

            {/* โมดัลยืนยันการลบ */}
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