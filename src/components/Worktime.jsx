import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Worktime = () => {
    const [worktimes, setWorktimes] = useState([]);
    const [userName, setUserName] = useState('พนักงาน');
    const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
    const [userId, setUserId] = useState(null);
    const [upcomingLeaves, setUpcomingLeaves] = useState([]);
    const [leaveDates, setLeaveDates] = useState([]);


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
    useEffect(() => {
        const stored = sessionStorage.getItem('leaveDates');
        if (stored) {
            setLeaveDates(JSON.parse(stored));
        }
    }, []);

    const fetchUpcomingLeaves = async (id) => {
        try {
            const res = await axios.get(`https://localhost:7039/api/Worktime/UpcomingLeaves?userId=${id}`);
            if (res.status === 200) {
                setUpcomingLeaves(res.data);
            }
        } catch (error) {
            console.error("ไม่สามารถโหลดวันลาล่วงหน้าได้:", error);
        }
    };

    useEffect(() => {
        const id = sessionStorage.getItem('userId');
        if (!id) return;
        setUserId(id);
        fetchData(id);
        fetchUpcomingLeaves(id); // <--- เรียกฟังก์ชันที่โหลดวันลาล่วงหน้า
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
    const generateLeaveDates = (start, end) => {
        const dates = [];
        let currentDate = new Date(start);
        const lastDate = new Date(end);

        while (currentDate <= lastDate) {
            dates.push(new Date(currentDate)); // clone
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dates;
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

    const getTotalLateTimeThisMonth = () => {
        let totalLateMinutes = 0;
        filteredWorktimes.forEach((item) => {
            const date = new Date(item.date);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            // ข้ามวันหยุดสุดสัปดาห์ และวันที่ไม่มีข้อมูลเช็คอิน
            if (isWeekend || !item.checkIn) return;
            const locationText = (item.location || '').toLowerCase().replace(/\s/g, '');
            const leaveType = locationText.includes('ครึ่งวันเช้า')
                ? 'morning'
                : locationText.includes('ครึ่งวันบ่าย')
                    ? 'afternoon'
                    : locationText.includes('ลาทั้งวัน') || locationText.includes('ลาป่วย-เต็มวัน') || locationText.includes('ลากิจทั้งวัน') || locationText.includes('ลากิจส่วนตัว-เต็มวัน')
                        ? 'full'
                        : '';

            // ข้ามกรณีลาทั้งวัน (ไม่ต้องนับวันลาทั้งวัน)
            if (leaveType === 'full') return;

            const timeParts = item.checkIn.split(':');
            if (timeParts.length >= 2) {
                const checkIn = new Date(item.date);
                checkIn.setHours(Number(timeParts[0]));
                checkIn.setMinutes(Number(timeParts[1]));
                checkIn.setSeconds(0);

                const expected = new Date(item.date);

                // ถ้าลาครึ่งวันเช้า เริ่มงาน 13:00
                if (leaveType === 'morning') {
                    expected.setHours(13, 0, 0);
                } else {
                    expected.setHours(8, 30, 0);
                }

                const diff = (checkIn - expected) / (1000 * 60);
                if (diff > 0) totalLateMinutes += diff; // ไม่ต้องปัดรอบนี้
            }
        });
        const roundedTotal = Math.round(totalLateMinutes); // ปัดรวมทีเดียว
        const hours = Math.floor(roundedTotal / 60);
        const minutes = roundedTotal % 60;
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

    const filteredWorktimes = worktimes.filter(item => {
        const date = new Date(item.date);
        const matchMonth = date.getMonth() + 1 === parseInt(monthFilter);
        const matchYear = date.getFullYear() === parseInt(yearFilter);
        const matchUser = item.userID === parseInt(userId);
        return matchMonth && matchYear && matchUser;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    const workingDays = filteredWorktimes.filter(item => !item.location?.includes('ลา'));
    const leaveDays = filteredWorktimes.filter(item => item.location?.includes('ลา'));


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
                </div>
                {/* ตารางเวลา */}
                <div className="overflow-x-auto bg-blue-50 p-4 rounded-xl shadow-lg relative">
                    <div className="overflow-x-auto">
                        <h2 className="text-lg font-bold font-FontNoto mb-4">ตารางการทำงานและการลา</h2>
                        <table className="table w-full text-center">
                            <thead className="bg-blue-300 text-blue-900 text-sm">
                                <tr>
                                    <th className="py-3 font-FontNoto">วันที่</th>
                                    <th className="py-3 font-FontNoto">สถานที่</th>
                                    <th className="py-3 font-FontNoto">ประเภทการลา</th>
                                    <th className="py-3 font-FontNoto">พิกัด</th>
                                    <th className="py-3 font-FontNoto">สาย</th>
                                    <th className="py-3 font-FontNoto">Check-in</th>
                                    <th className="py-3 font-FontNoto">Check-out</th>
                                    <th className="py-3 font-FontNoto">เวลาทำงาน</th>
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
                                            className={`border-b transition duration-300 font-FontNoto ${isLeave ? 'bg-green-50 hover:bg-green-100 text-green-700' : 'hover:bg-blue-100 font-FontNoto'
                                                }`}
                                        >
                                            <td className="py-2 font-FontNoto">{formatDate(item.date)}</td>

                                            {isLeave ? (
                                                <>
                                                    <td className="py-2 font-FontNoto">-</td>
                                                    <td className="py-2 font-FontNoto">
                                                        {/* ✅ แก้ตรงนี้ */}
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
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Worktime;
