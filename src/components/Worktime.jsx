import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Worktime = () => {
    const [worktimes, setWorktimes] = useState([]);
    const [userName, setUserName] = useState('พนักงาน');
    const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
    const [userId, setUserId] = useState(null);

    const thaiMonths = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];

    useEffect(() => {
        const id = sessionStorage.getItem('userId');
        if (!id) return;
        setUserId(id);
        fetchData(id);
    }, []);

    const fetchData = async (id) => {
        try {
            const userRes = await axios.get(`https://localhost:7039/api/Users/Getbyid/${id}`);
            if (userRes.status === 200) {
                const userData = userRes.data;
                setUserName(`${userData.firstName} ${userData.lastName}`);
            }

            const worktimeRes = await axios.get('https://localhost:7039/api/Worktime');
            setWorktimes(worktimeRes.data);
        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการโหลดข้อมูล:', error);
        }
    };

    const calculateLateMinutes = (checkInTime, dateStr) => {
        if (!checkInTime) return '0 นาที';

        const timeParts = checkInTime.split(':');
        if (timeParts.length < 2) return '0 นาที';

        const checkIn = new Date(dateStr);
        checkIn.setHours(Number(timeParts[0]));
        checkIn.setMinutes(Number(timeParts[1]));
        checkIn.setSeconds(0);

        const expected = new Date(dateStr);
        expected.setHours(8, 30, 0); // เวลาเริ่มงาน 8:30

        const diffMinutes = (checkIn - expected) / (1000 * 60);
        if (diffMinutes <= 0) return '0 นาที';

        const hours = Math.floor(diffMinutes / 60);
        const minutes = Math.round(diffMinutes % 60);

        if (hours > 0 && minutes > 0) return `${hours} ชั่วโมง ${minutes} นาที`;
        if (hours > 0) return `${hours} ชั่วโมง`;
        return `${minutes} นาที`;
    };

    const calculateRawLateMinutes = (checkInTime, dateStr) => {
        if (!checkInTime) return 0;

        const timeParts = checkInTime.split(':');
        if (timeParts.length < 2) return 0;

        const checkIn = new Date(dateStr);
        checkIn.setHours(Number(timeParts[0]));
        checkIn.setMinutes(Number(timeParts[1]));
        checkIn.setSeconds(0);

        const expected = new Date(dateStr);
        expected.setHours(8, 30, 0);

        const diffMinutes = (checkIn - expected) / (1000 * 60);
        return diffMinutes > 0 ? diffMinutes : 0;
    };

    const getTotalLateTimeThisMonth = () => {
        let totalLateMinutes = 0;

        filteredWorktimes.forEach((item) => {
            const date = new Date(item.date);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isLeave = item.location?.includes('ลา');
            if (isLeave || isWeekend || !item.checkIn) return;

            const timeParts = item.checkIn.split(':');
            if (timeParts.length >= 2) {
                const checkIn = new Date(item.date);
                checkIn.setHours(Number(timeParts[0]));
                checkIn.setMinutes(Number(timeParts[1]));
                checkIn.setSeconds(0);

                const expected = new Date(item.date);
                expected.setHours(8, 30, 0);

                const diff = (checkIn - expected) / (1000 * 60);
                if (diff > 0) totalLateMinutes += Math.round(diff);
            }
        });

        const hours = Math.floor(totalLateMinutes / 60);
        const minutes = totalLateMinutes % 60;
        return { hours, minutes };
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('th-TH', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const filteredWorktimes = worktimes
        .filter((item) => {
            const date = new Date(item.date);
            const matchMonth = date.getMonth() + 1 === parseInt(monthFilter);
            const matchYear = date.getFullYear() === parseInt(yearFilter);
            const matchUser = item.userID === parseInt(userId);
            return matchMonth && matchYear && matchUser;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // 🔁 เรียงจากใหม่ไปเก่า

    return (
        <div className=" ">
            <div className="w-full bg-gradient-to-r from-cyan-900 via-cyan-600 to-slate-500 text-white rounded-xl p-4 sm:p-5 md:p-6 mb-6 shadow-lg">
                <h1 className="text-xl sm:text-2xl font-bold font-FontNoto leading-snug">
                    บันทึกเวลาเข้า-ออกงาน
                </h1>
                <p className="text-xl font-FontNoto">คุณ {userName}</p>
            </div>
            <h2 className="text-2xl font-bold mb-2 font-FontNoto"></h2>
            <div className="w-full bg-transparent rounded-xl p-3">
                {/* ตัวกรองเดือนและปี */}
                <div className="flex items-center justify-end space-x-4 mb-4">
                    <select className="select select-bordered w-40 text-black font-FontNoto" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
                        {thaiMonths.map((month, index) => (
                            <option className="font-FontNoto" key={index + 1} value={index + 1}>
                                {month}
                            </option>
                        ))}
                    </select>
                    <select className="select select-bordered w-40 text-black font-FontNoto" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                        {Array.from({ length: 11 }, (_, i) => (
                            <option className="font-FontNoto" key={i} value={2024 + i}>{2024 + i}</option>
                        ))}
                    </select>
                </div>

                {/* สรุปเวลาสายทั้งเดือน */}
                <div className="mb-4 text-lg font-FontNoto text-red-700 font-semibold">
                    {(() => {
                        const { hours, minutes } = getTotalLateTimeThisMonth();
                        if (hours === 0 && minutes === 0) {
                            return 'เดือนนี้คุณยังไม่มาสายเลย! 🎉';
                        }
                        return `เดือนนี้คุณมาสายไปทั้งหมด ${hours > 0 ? `${hours} ชั่วโมง` : ''} ${minutes > 0 ? `${minutes} นาที` : ''}`;
                    })()}
                </div> <img
                    src="https://cdn-icons-png.flaticon.com/512/616/616408.png"
                    alt="cute paw"
                    className="absolute -top-6 -left-6 w-16 h-16 object-contain animate-float-slow opacity-80"
                />

                {/* 🐾 รูปสัตว์น่ารักมุมขวา */}
                <img
                    src="https://cdn-icons-png.flaticon.com/512/616/616430.png"
                    alt="cute paw right"
                    className="absolute -top-6 -right-6 w-16 h-16 object-contain animate-float-slow opacity-80"
                />

                {/* ตารางเวลา */}
                <div className="overflow-x-auto bg-blue-50 p-4 rounded-xl shadow-lg relative">

                    {/* 🐾 รูปสัตว์น่ารักมุมซ้าย */}

                    <div className="overflow-x-auto">
                        <table className="table w-full text-center">
                            <thead className="bg-blue-200 text-blue-900 text-sm">
                                <tr>
                                    <th className="py-3 font-FontNoto">วันที่</th>
                                    <th className="py-3 font-FontNoto">สถานที่</th>
                                    <th className="py-3 font-FontNoto">พิกัด</th>
                                    <th className="py-3 font-FontNoto">สาย</th>
                                    <th className="py-3 font-FontNoto">Check-in</th>
                                    <th className="py-3 font-FontNoto">Check-out</th>
                                </tr>
                            </thead>

                            <tbody className="bg-white">
                                {filteredWorktimes.length > 0 ? (
                                    filteredWorktimes.map((item, index) => (
                                        <tr
                                            key={index}
                                            className="border-b hover:bg-blue-100 transition duration-300 rounded-lg overflow-hidden font-FontNoto"
                                        >
                                            <td className="py-2 font-FontNoto">{formatDate(item.date)}</td>
                                            <td
                                                className={`py-2 font-FontNoto ${item.location?.includes('ลา') ? 'text-green-600' : 'text-black'
                                                    }`}
                                            >
                                                {item.location}
                                            </td>

                                            <td className="font-FontNoto">
                                                {item.photoPath && item.photoPath.includes('Lat') ? (
                                                    <a
                                                        href={`https://maps.google.com/?q=${item.photoPath.split('|')[0].replace('Lat: ', '').replace(', Lng: ', ',')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 underline text-sm"
                                                    >
                                                        {item.photoPath.trim()}
                                                    </a>
                                                ) : (
                                                    item.photoPath || '-'
                                                )}
                                            </td>
                                            <td
                                                className={`py-2 font-FontNoto ${(() => {
                                                    const date = new Date(item.date);
                                                    const isLeave = item.location?.includes('ลา');
                                                    const isWeekend = [0, 6].includes(date.getDay());
                                                    const isLate = calculateRawLateMinutes(item.checkIn, item.date) > 0;

                                                    if (isLeave) return 'text-green-600 ';                  // สีเขียวเวลาเป็นลา
                                                    if (!isWeekend && isLate) return 'text-red-600';        // สีแดงเมื่อมาสาย
                                                    return 'text-black';                                             // ปกติสีดำ
                                                })()
                                                    }`}
                                            >
                                                {(() => {
                                                    const date = new Date(item.date);
                                                    const isWeekend = [0, 6].includes(date.getDay());
                                                    const isLeave = item.location?.includes('ลา');
                                                    if (isLeave) return 'ลา';
                                                    if (!item.checkIn && isWeekend) return '-';
                                                    return calculateLateMinutes(item.checkIn, item.date);
                                                })()}
                                            </td>

                                            <td className="py-2 font-FontNoto">{item.checkIn || '-'}</td>
                                            <td className="py-2 font-FontNoto">{item.checkOut || '-'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="py-6 text-gray-400 font-FontNoto">ไม่พบข้อมูล</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Worktime;
