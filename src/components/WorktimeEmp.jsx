import React, { useEffect, useState } from "react";
import axios from "axios";
import { FcAlarmClock, FcLeave, FcOk, FcClock } from "react-icons/fc";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useMemo } from 'react';

const WorktimeEmp = () => {
    const [worktimes, setWorktimes] = useState([]);
    const [users, setUsers] = useState([]);
    const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
    const [selectedUser, setSelectedUser] = useState("all");
    const [editingRecord, setEditingRecord] = useState(null);
    const [deleteRecordID, setDeleteRecordID] = useState(null);
    const [editForm, setEditForm] = useState({ checkIn: "", checkOut: "" });
    const [showAllLate, setShowAllLate] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [showAllLeave, setShowAllLeave] = useState(false);
    const [showAllFullAttendance, setShowAllFullAttendance] = useState(false);
    const [showAllNeverLate, setShowAllNeverLate] = useState(false);

    const itemsPerPage = 10;

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
                axios.get("https://192.168.1.188/hrwebapi/api/Worktime"),
                axios.get("https://192.168.1.188/hrwebapi/api/Users")
            ]);
            console.log("worktimes from API", wtRes.data);
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

    const handleExportExcel = () => {
        const exportData = filteredWorktimes.map(item => {
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
            const lateText = shouldShowTime
                ? (calculateRawLateMinutes(item.checkIn, item.date, leaveType) > 0
                    ? `มาสาย ${calculateLateMinutes(item.checkIn, item.date, leaveType)}`
                    : 'ปกติ')
                : '-';

            return {
                "วันที่": formatDate(item.date),
                "ชื่อ-นามสกุล": getFullName(item.userID),
                "ประเภทการทำงาน": isLeave ? '-' : item.location || '-',
                "ประเภทการลา": isLeave ? locationText : '-',
                "สถานที่": item.photoPath?.split('|')[1]?.trim() || item.photoPath || '-',
                "เวลาเข้า": shouldShowTime ? item.checkIn || '-' : '-',
                "เวลาออก": shouldShowTime ? item.checkOut || '-' : '-',
                "ชั่วโมงทำงาน": shouldShowTime
                    ? calculateWorkingHours(item.checkIn, item.checkOut, item.date, leaveType)
                    : '-',
                "สถานะ": lateText
            };
        });

        const lateStats = getUserLateStatistics().filter(stat => stat.totalLateMinutes > 0);
        const lateSummarySheet = lateStats.map(stat => ({
            "ชื่อ-นามสกุล": stat.name,
            "รวมเวลามาสาย": `${Math.floor(stat.totalLateMinutes / 60)} ชั่วโมง ${Math.round(stat.totalLateMinutes % 60)} นาที`
        }));

        const wb = XLSX.utils.book_new();

        const ws1 = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws1, "ลงเวลาทำงาน");

        const ws2 = XLSX.utils.json_to_sheet(lateSummarySheet);
        XLSX.utils.book_append_sheet(wb, ws2, "รวมเวลามาสาย");

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(data, "Worktime_Report.xlsx");
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
            await axios.put(`https://192.168.1.188/hrwebapi/api/Worktime/${editingRecord.worktimeID}`, editForm);
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
                `https://192.168.1.188/hrwebapi/api/Worktime/${deleteRecordID}`,
                { headers: { "Content-Type": "application/json" } }
            );
            setDeleteRecordID(null);
            fetchAll();
        } catch (error) {
            alert("เกิดข้อผิดพลาดในการลบข้อมูล");
            console.error(error);
        }
    };

    const getUsersWithFullAttendance = () => {
        const results = [];

        users.forEach(user => {
            const userWorktimes = worktimes.filter(item =>
                item.userID === user.userID &&
                new Date(item.date).getMonth() + 1 === parseInt(monthFilter) &&
                new Date(item.date).getFullYear() === parseInt(yearFilter)
            );

            const daysInMonth = new Date(yearFilter, monthFilter, 0).getDate();
            let isFullAttendance = true;

            for (let d = 1; d <= daysInMonth; d++) {
                const date = new Date(yearFilter, monthFilter - 1, d);
                const dayOfWeek = date.getDay(); // 0=Sunday, 6=Saturday
                if (dayOfWeek === 0 || dayOfWeek === 6) continue;

                const dateISO = date.toISOString().split('T')[0];
                const entry = userWorktimes.find(item => item.date.startsWith(dateISO));

                const location = entry?.location?.toLowerCase().replace(/\s/g, '') || '';
                const leaveKeywords = ['ป่วย', 'กิจส่วนตัว', 'บวช', 'พักร้อน', 'ลาคลอด'];
                const isLeave = leaveKeywords.some(keyword => location.includes(keyword));

                if (isLeave) {
                    isFullAttendance = false;
                    break;
                }
            }
            const hasAtLeastOneCheckIn = userWorktimes.some(item => !!item.checkIn);

            if (isFullAttendance && hasAtLeastOneCheckIn) {
                results.push({
                    name: `${user.firstName} ${user.lastName}`
                });
            }
        });

        return results;
    };

    const fullAttendanceUsers = getUsersWithFullAttendance();

    const calculateLateMinutes = (checkInTime, dateStr, leaveType = '') => {
        if (!checkInTime) return '0 นาที';

        const timeParts = checkInTime.split(':');
        if (timeParts.length < 2) return '0 นาที';

        const checkIn = new Date(dateStr);
        checkIn.setHours(Number(timeParts[0]));
        checkIn.setMinutes(Number(timeParts[1]));
        checkIn.setSeconds(0);

        const expected = new Date(dateStr);
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
        checkIn.setMilliseconds(0); // ป้องกันเวลาเกินแบบ .001

        const expected = new Date(dateStr);
        expected.setSeconds(0);
        expected.setMilliseconds(0);

        if (leaveType === 'morning') {
            expected.setHours(13, 0, 0);
        } else if (leaveType === 'full') {
            return 0;
        } else {
            expected.setHours(8, 30, 0); // เวลาปกติเริ่มงาน
        }

        const diffMinutes = (checkIn - expected) / (1000 * 60);
        return diffMinutes > 0 ? Math.ceil(diffMinutes) : 0;
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

    const paginatedWorktimes = filteredWorktimes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

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

        worktimes
            .filter(item => {
                const date = new Date(item.date);
                return date.getMonth() + 1 === parseInt(monthFilter) &&
                    date.getFullYear() === parseInt(yearFilter);
            })
            .forEach(item => {
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

    const usersWithLeave = users.map(user => {
        const leaveSummary = {};

        worktimes.forEach(item => {
            const date = new Date(item.date);
            const isSameMonth = date.getMonth() + 1 === parseInt(monthFilter);
            const isSameYear = date.getFullYear() === parseInt(yearFilter);
            const isThisUser = item.userID === user.userID;

            if (!isSameMonth || !isSameYear || !isThisUser || !item.location) return;

            const location = item.location.toLowerCase().replace(/\s/g, '');
            const leaveTypes = ['ป่วย', 'กิจส่วนตัว', 'บวช', 'พักร้อน', 'ลาคลอด'];
            const matchedType = leaveTypes.find(type => location.includes(type));

            if (matchedType) {
                let dayValue = 1;
                if (location.includes('ครึ่งวันเช้า') || location.includes('ครึ่งวันบ่าย')) {
                    dayValue = 0.5;
                }

                leaveSummary[matchedType] = (leaveSummary[matchedType] || 0) + dayValue;
            }
        });
        return {
            name: `${user.firstName} ${user.lastName}`,
            leaves: leaveSummary
        };
    }).filter(u => Object.keys(u.leaves).length > 0);



    const lateStats = getUserLateStatistics();

    const sortedLateStats = useMemo(() =>
        [...lateStats]
            .filter(stat => stat.totalLateMinutes > 0) // ✅ กรองก่อน
            .sort((a, b) => b.totalLateMinutes - a.totalLateMinutes),
        [lateStats]);


    const neverLate = useMemo(() =>
        lateStats.filter(stat => stat.totalLateMinutes === 0 && stat.totalWorkdays > 0),
        [lateStats]);

    const mostLate = sortedLateStats.length > 0 ? sortedLateStats[0] : null;

    return (
        <div className="">
            <div className="w-full bg-gradient-to-r from-cyan-100 via-blue-100 to-blue-50 text-white rounded-xl p-4 sm:p-5 md:p-6 mb-6 shadow-lg">
                <h1 className="text-xl sm:text-2xl text-cyan-950 font-bold font-FontNoto leading-snug">
                    จัดการลงเวลาเข้า-ออก ของพนักงาน
                </h1>
                <p className="text-xs sm:text-sm mt-1 text-cyan-950 font-FontNoto">ตรวจสอบการลงเวลาเข้า-ออก</p>
            </div>
            <h2 className="text-base sm:text-lg text-cyan-950 font-bold font-FontNoto leading-snug">
                แจ้งเตือนการทำงานต่อเดือน
            </h2>
            <div className="overflow-x-auto sm:overflow-visible">
                <div className="flex overflow-x-auto sm:flex-wrap sm:gap-4 space-x-4 sm:space-x-0 snap-x snap-mandatory font-FontNoto px-3 py-3">
                    <div className="snap-start flex-shrink-0 w-[90%] sm:w-[350px] mx-auto sm:mx-0 group rounded-xl bg-white p-4 shadow-md transition duration-300 cursor-pointer hover:translate-y-[3px] hover:shadow-xl relative overflow-hidden min-h-[160px]">
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 transform opacity-80 group-hover:scale-110 transition duration-300 text-red-500">
                            <FcAlarmClock className="w-10 h-10" />
                        </div>
                        <h3 className="text-lg font-bold text-blue-800 mb-2 text-left font-FontNoto">
                            พนักงานที่มาสาย
                        </h3>
                        <div className="text-sm text-gray-800 font-FontNoto">
                            {sortedLateStats.length > 0 ? (
                                <>
                                    {(showAllLate ? sortedLateStats : sortedLateStats.slice(0, 3)).map((person, index) => (
                                        <p key={index}>
                                            {index + 1}. {person.name} ({Math.floor(person.totalLateMinutes / 60)} ชั่วโมง {Math.round(person.totalLateMinutes % 60)} นาที)
                                        </p>
                                    ))}
                                    {sortedLateStats.length > 3 && (
                                        <button
                                            onClick={() => setShowAllLate(!showAllLate)}
                                            className="mt-2 text-xs text-blue-600 hover:underline font-FontNoto"
                                        >
                                            {showAllLate ? "ดูน้อยลง" : "ดูเพิ่มเติม"}
                                        </button>
                                    )}
                                </>
                            ) : (
                                <p>-</p>
                            )}
                        </div>
                    </div>
                    <div className="snap-start flex-shrink-0 w-[90%] sm:w-[350px] mx-auto sm:mx-0 group rounded-xl bg-white p-4 shadow-md transition duration-300 cursor-pointer hover:translate-y-[3px] hover:shadow-xl relative overflow-hidden min-h-[160px]">
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 transform opacity-80 group-hover:scale-110 transition duration-300 text-green-500">
                            <FcOk className="w-10 h-10" />
                        </div>
                        <h3 className="text-lg font-bold text-blue-800 mb-2 text-left font-FontNoto">
                            พนักงานที่ไม่มาสาย
                        </h3>
                        <div className="text-sm text-gray-800 font-FontNoto">
                            {neverLate.length > 0 ? (
                                <>
                                    {(showAllNeverLate ? neverLate : neverLate.slice(0, 3)).map((u, idx) => (
                                        <p key={idx}>{idx + 1}. {u.name}</p>
                                    ))}
                                    {neverLate.length > 3 && (
                                        <button
                                            onClick={() => setShowAllNeverLate(!showAllNeverLate)}
                                            className="mt-2 text-xs text-blue-600 hover:underline font-FontNoto"
                                        >
                                            {showAllNeverLate ? "ดูน้อยลง" : "ดูเพิ่มเติม"}
                                        </button>
                                    )}
                                </>
                            ) : (
                                <p>-</p>
                            )}
                        </div>
                    </div>
                    <div className="snap-start flex-shrink-0 w-[90%] sm:w-[350px] mx-auto sm:mx-0 group rounded-xl bg-white p-4 shadow-md transition duration-300 cursor-pointer hover:translate-y-[3px] hover:shadow-xl relative overflow-hidden min-h-[160px]">
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 transform opacity-80 group-hover:scale-110 transition duration-300 text-blue-500">
                            <FcClock className="w-10 h-10" />
                        </div>
                        <h3 className="text-lg font-bold text-blue-800 mb-2 text-left font-FontNoto">
                            พนักงานที่มาทำงานครบ
                        </h3>
                        <div className="text-sm text-gray-800 font-FontNoto">
                            {fullAttendanceUsers.length > 0 ? (
                                <>
                                    {(showAllFullAttendance ? fullAttendanceUsers : fullAttendanceUsers.slice(0, 3)).map((u, idx) => (
                                        <p key={idx}>{idx + 1}. {u.name}</p>
                                    ))}
                                    {fullAttendanceUsers.length > 3 && (
                                        <button
                                            onClick={() => setShowAllFullAttendance(!showAllFullAttendance)}
                                            className="mt-2 text-xs text-blue-600 hover:underline font-FontNoto"
                                        >
                                            {showAllFullAttendance ? "ดูน้อยลง" : "ดูเพิ่มเติม"}
                                        </button>
                                    )}
                                </>
                            ) : (
                                <p>-</p>
                            )}
                        </div>
                    </div>
                    <div className="snap-start flex-shrink-0 w-[90%] sm:w-[350px] mx-auto sm:mx-0 group rounded-xl bg-white p-4 shadow-md transition duration-300 cursor-pointer hover:translate-y-[3px] hover:shadow-xl relative overflow-hidden min-h-[160px]">
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 transform opacity-80 group-hover:scale-110 transition duration-300 text-yellow-500">
                            <FcLeave className="w-10 h-10" />
                        </div>
                        <h3 className="text-lg font-bold text-blue-800 mb-2 text-left font-FontNoto">
                            พนักงานที่มีการลา
                        </h3>
                        <div className="text-sm text-gray-800 font-FontNoto">
                            {usersWithLeave.length > 0 ? (
                                <>
                                    {(showAllLeave ? usersWithLeave : usersWithLeave.slice(0, 3)).map((u, idx) => (
                                        <p key={idx}>
                                            {idx + 1}. {u.name}{" "}
                                            ({Object.entries(u.leaves).map(
                                                ([type, days], i) =>
                                                    `ลา${type} ${days % 1 === 0 ? days : days.toFixed(1)} วัน${i < Object.entries(u.leaves).length - 1 ? ', ' : ''}`
                                            )} รวม {(Object.values(u.leaves).reduce((sum, d) => sum + d, 0)).toFixed(1).replace(/\.0$/, '')} วัน)

                                        </p>

                                    ))}
                                    {usersWithLeave.length > 3 && (
                                        <button
                                            onClick={() => setShowAllLeave(!showAllLeave)}
                                            className="mt-2 text-xs text-blue-600 hover:underline font-FontNoto"
                                        >
                                            {showAllLeave ? "ดูน้อยลง" : "ดูเพิ่มเติม"}
                                        </button>
                                    )}
                                </>
                            ) : (
                                <p>-</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <h2 className="text-lg font-bold font-FontNoto py-4 text-black">ตารางลงเวลาเข้า-ออกงานของพนักงาน</h2>
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between mb-4 bg-white p-4 rounded-xl shadow gap-4">

                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-y-2 sm:space-x-4 w-full">
                    <select
                        className="select select-bordered w-full sm:w-auto text-black font-FontNoto bg-white"
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

                    <select
                        className="select select-bordered w-full sm:w-auto text-black font-FontNoto bg-white"
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
                        className="select select-bordered w-full sm:w-auto text-black font-FontNoto bg-white"
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                    >
                        {Array.from({ length: 11 }, (_, i) => (
                            <option className="font-FontNoto" key={i} value={2024 + i}>
                                {2024 + i}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-wrap items-center space-x-4 w-full sm:w-auto">
                    <div className="p-1 space-x-2 ml-auto">
                        <button
                            onClick={handleExportExcel}
                            className="btn btn-sm !bg-green-500 !text-white !hover:bg-green-600 font-FontNoto whitespace-nowrap"
                        >
                            Export Excel
                        </button>
                    </div>
                </div>
            </div>
            <div className="bg-white p-2 rounded-xl shadow-lg relative">
                <h2 className="text-lg font-bold font-FontNoto mb-4 text-black">ประวัติการลงเวลา</h2>
                <div className="overflow-x-auto">
                    {filteredWorktimes.length === 0 ? (
                        <div className="bg-white p-8 text-center rounded-lg shadow font-FontNoto">
                            ไม่พบข้อมูลที่ตรงกับเงื่อนไขที่เลือก
                        </div>
                    ) : (
                        <div className='overflow-x-auto w-full'>
                            <table className="table min-w-700px w-full text-sm !text-center">
                                <thead className="!bg-gray-100 !text-slate-800 !text-sm">
                                    <tr>
                                        <th className="py-3 font-FontNoto whitespace-nowrap">วันที่</th>
                                        <th className="py-3 font-FontNoto whitespace-nowrap">ชื่อ-นามสกุล</th>
                                        <th className="py-3 font-FontNoto whitespace-nowrap">ประเภทการทำงาน</th>
                                        <th className="py-3 font-FontNoto whitespace-nowrap">ประเภทการลา</th>
                                        <th className="py-3 font-FontNoto whitespace-nowrap">สถานที่</th>
                                        <th className="py-3 font-FontNoto whitespace-nowrap">สถานะ</th>
                                        <th className="py-3 font-FontNoto whitespace-nowrap">เวลาเข้า</th>
                                        <th className="py-3 font-FontNoto whitespace-nowrap">เวลาออก</th>
                                        <th className="py-3 font-FontNoto whitespace-nowrap">ชั่วโมงการทำงาน</th>
                                        <th className="py-3 font-FontNoto whitespace-nowrap">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white text-slate-800">
                                    {paginatedWorktimes.map((item, index) => {
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
                                                <td className="py-2 font-FontNoto text-center whitespace-nowrap">{formatDate(item.date)}</td>
                                                <td className="py-2 font-FontNoto text-left whitespace-nowrap">{getFullName(item.userID)}</td>

                                                {isLeave ? (
                                                    <>
                                                        <td className="py-2 font-FontNoto text-center whitespace-nowrap">-</td>
                                                        <td className="py-2 font-FontNoto  whitespace-nowrap">
                                                            {locationText.split('|')[0]?.trim() || '-'}<br />
                                                            <span className="text-sm text-gray-600 font-FontNoto ">
                                                                {locationText.split('|')[1]?.trim() || ''}
                                                            </span>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="py-2 font-FontNoto text-center whitespace-nowrap">{locationText}</td>
                                                        <td className="py-2 font-FontNoto text-center whitespace-nowrap">-</td>
                                                    </>
                                                )}

                                                <td className="py-2 font-FontNoto text-left whitespace-nowrap">
                                                    {item.photoPath && item.photoPath.includes('|') ? (
                                                        <span className="text-sm text-gray-800 font-FontNoto">{item.photoPath.split('|')[1]?.trim()}</span>
                                                    ) : (
                                                        item.photoPath || '-'
                                                    )}
                                                </td>
                                                <td className="py-2 font-FontNoto whitespace-nowrap text-center">
                                                    {shouldShowTime ? (
                                                        calculateRawLateMinutes(item.checkIn, item.date, leaveType) > 0 ? (
                                                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                                                                มาสาย {calculateLateMinutes(item.checkIn, item.date, leaveType)}
                                                            </span>
                                                        ) : (
                                                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                                                                ปกติ
                                                            </span>
                                                        )
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td className="py-2 font-FontNoto text-center whitespace-nowrap">{shouldShowTime ? item.checkIn || '-' : '-'}</td>
                                                <td className="py-2 font-FontNoto text-center whitespace-nowrap">{shouldShowTime ? item.checkOut || '-' : '-'}</td>
                                                <td className="py-2 font-FontNoto text-center whitespace-nowrap">
                                                    {shouldShowTime ? calculateWorkingHours(item.checkIn, item.checkOut, item.date, leaveType) : '-'}
                                                </td>
                                                <td className="py-2 font-FontNoto text-center whitespace-nowrap">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(item)}
                                                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-FontNoto px-3 py-1 rounded shadow text-xs"
                                                        >
                                                            แก้ไข
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteRecordID(item.worktimeID)}
                                                            className="bg-red-500 hover:bg-red-600 text-white font-FontNoto px-3 py-1 rounded shadow text-xs"
                                                        >
                                                            ลบ
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <div className="flex justify-between items-center mt-4 font-FontNoto text-sm">
                        <button
                            className="btn btn-sm border border-blue-400 !text-blue-600 hover:bg-blue-100"
                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            &lt;
                        </button>
                        <div className="flex gap-1">
                            {[...Array(Math.ceil(filteredWorktimes.length / itemsPerPage)).keys()].map(i => (
                                <button
                                    key={i}
                                    className={`btn btn-sm border ${currentPage === i + 1
                                        ? '!bg-blue-500 !text-white'
                                        : '!bg-white !text-blue-600 !border-blue-400 hover:bg-blue-100'
                                        }`}
                                    onClick={() => setCurrentPage(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            className="btn btn-sm border border-blue-400 !text-blue-600 hover:bg-blue-100"
                            onClick={() => setCurrentPage(p => Math.min(p + 1, Math.ceil(filteredWorktimes.length / itemsPerPage)))}
                            disabled={currentPage === Math.ceil(filteredWorktimes.length / itemsPerPage)}
                        >
                            &gt;
                        </button>
                    </div>
                </div>
            </div>

            {editingRecord && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 overflow-y-auto"
                >
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
                        <h3 className="font-bold text-lg mb-4 font-FontNoto text-black">แก้ไขข้อมูลลงเวลาเข้า-ออกงาน</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="label font-FontNoto">ชื่อ-นามสกุล</label>
                                <input
                                    type="text"
                                    value={getFullName(editingRecord.userID)}
                                    disabled
                                    className="input input-bordered w-full font-FontNoto !bg-gray-100 !text-black"
                                />
                            </div>
                            <div>
                                <label className="label font-FontNoto">วันที่</label>
                                <input
                                    type="text"
                                    value={formatDate(editingRecord.date)}
                                    disabled
                                    className="input input-bordered w-full font-FontNoto !bg-gray-100 !text-black"
                                />
                            </div>
                            <div>
                                <label className="label font-FontNoto">เวลาเข้างาน</label>
                                <input
                                    type="time"
                                    value={editForm.checkIn}
                                    onChange={(e) => setEditForm({ ...editForm, checkIn: e.target.value })}
                                    className="input input-bordered w-full font-FontNoto bg-white text-black"
                                />
                            </div>
                            <div>
                                <label className="label font-FontNoto">เวลาออกงาน</label>
                                <input
                                    type="text"
                                    value={editForm.checkOut}
                                    onChange={(e) => setEditForm({ ...editForm, checkOut: e.target.value })}
                                    className="input input-bordered w-full font-FontNoto bg-white text-black"
                                    placeholder="17:30 หรือ -"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setEditingRecord(null)}
                                className="px-4 py-2 rounded-md bg-gray-300 text-gray-800 hover:bg-gray-400 transition font-FontNoto"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleEditSubmit}
                                className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition font-FontNoto"
                            >
                                บันทึก
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {deleteRecordID && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 overflow-y-auto"
                >
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
                        <h3 className="font-bold text-lg mb-4 font-FontNoto text-red-500">ยืนยันการลบข้อมูล</h3>
                        <p className="mb-4 font-FontNoto">คุณต้องการลบข้อมูลรายการนี้ใช่หรือไม่?</p>
                        <div className="flex justify-end gap-2 font-FontNoto">
                            <button
                                onClick={() => setDeleteRecordID(null)}
                                className="px-4 py-2 rounded-md bg-gray-300 text-gray-800 hover:bg-gray-400 transition"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition"
                            >
                                ลบ
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default WorktimeEmp;