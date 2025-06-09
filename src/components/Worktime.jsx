import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

import axios from 'axios';

const Worktime = () => {
    const [worktimes, setWorktimes] = useState([]);
    const [userName, setUserName] = useState('พนักงาน');
    const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
    const [userId, setUserId] = useState(null);
    const [upcomingLeaves, setUpcomingLeaves] = useState([]);
    const [leaveDates, setLeaveDates] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [location, setLocation] = useState('');
    const [leaveType, setLeaveType] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalConfirmAction, setModalConfirmAction] = useState(null);
    const [showCheckinForm, setShowCheckinForm] = useState(true);
    const [simpleModal, setSimpleModal] = useState(false);
    const [modalTitle, setModalTitle] = useState('ลงเวลาเข้างาน');


    const [checkinStatus, setCheckinStatus] = useState({
        text: 'ยังไม่ได้ลงเวลาเข้างาน',
        color: 'bg-red-200 text-red-600',
    });

    const thaiMonths = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];

    useEffect(() => {
        const today = new Date().toISOString().split("T")[0];
        const found = worktimes.find(
            (item) =>
                item.userID === parseInt(userId) && item.date.startsWith(today)
        );

        if (found && found.checkIn) {
            setCheckinStatus({
                text: 'ทำงานอยู่',
                color: 'bg-green-100 text-green-700',
            });
        } else {
            setCheckinStatus({
                text: 'ยังไม่ได้ลงเวลาเข้างาน',
                color: 'bg-red-200 text-red-600',
            });
        }
    }, [worktimes, userId]);


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

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const getAddressFromCoords = async (lat, lng) => {
        const proxy = "https://corsproxy.io/?";
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=th`;

        try {
            const response = await fetch(proxy + encodeURIComponent(url));
            const data = await response.json();
            const address = data.address;
            if (!address) return 'ไม่พบที่อยู่';

            return [
                address.road,
                address.suburb,
                address.city_district || address.district,
                address.city || address.town || address.village,
                address.state,
                address.postcode
            ].filter(Boolean).join(', ');
        } catch (err) {
            console.error("Error fetching address:", err);
            return 'เกิดข้อผิดพลาด';
        }
    };

    const fetchUpcomingLeaves = async (id) => {
        try {
            const res = await axios.get(`https://192.168.1.188/hrwebapi/api/Worktime/UpcomingLeaves?userId=${id}`);
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

    const handleCheckIn = () => {
        if (!navigator.geolocation) {
            alert("เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง");
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const finalLocation = location === 'ลาบวช' ? 'ลาบวช | เต็มวัน' : location;
            const address = await getAddressFromCoords(latitude, longitude);

            const formData = new FormData();
            formData.append('userID', userId);
            formData.append('location', finalLocation);
            formData.append('latitude', latitude);
            formData.append('longitude', longitude);
            formData.append('address', address);

            try {
                await axios.post('https://192.168.1.188/hrwebapi/api/Worktime/CheckIn', formData);
                alert("เช็คอินเรียบร้อยแล้ว");
                fetchData(userId); // รีโหลดข้อมูล
            } catch (error) {
                alert("เกิดข้อผิดพลาดขณะเช็คอิน");
            }
        });
    };
    const handleCheckinConfirm = () => {
        if (!location) {
            setModalMessage("กรุณาเลือกสถานที่ทำงานก่อนเช็คอิน");
            setModalOpen(true);
            return;
        }

        if (['ลาป่วย', 'ลากิจส่วนตัว'].includes(location) && !leaveType) {
            setModalMessage("กรุณาเลือกช่วงเวลาการลา");
            setModalOpen(true);
            return;
        }

        if (!navigator.geolocation) {
            setModalMessage("เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง");
            setModalOpen(true);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                console.log(position.coords);
                const { latitude, longitude } = position.coords;
                const finalLocation =
                    ['ลาป่วย', 'ลากิจส่วนตัว'].includes(location)
                        ? `${location} | ${leaveType}`
                        : location === 'ลาบวช'
                            ? 'ลาบวช | เต็มวัน'
                            : location;

                const address = await getAddressFromCoords(latitude, longitude);

                const today = new Date().toLocaleDateString('th-TH', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                });

                setModalMessage(
                    `วันที่ : ${today}\nประเภทการทำงาน : ${finalLocation}\nพิกัด : ${address}\n\nคุณต้องการเช็คอินใช่หรือไม่?`
                );
                setModalConfirmAction(() => async () => {
                    try {
                        const formData = new FormData();
                        formData.append('userID', userId);
                        formData.append('location', finalLocation);
                        formData.append('latitude', latitude);
                        formData.append('longitude', longitude);
                        formData.append('address', address);

                        await axios.post('https://192.168.1.188/hrwebapi/api/Worktime/CheckIn', formData);

                        // ✅ ปรับให้แสดง popup แบบสวยงาม
                        setModalMessage(
                            <div className="flex flex-col items-center justify-center text-center">
                                <img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" alt="checkin" className="w-10 h-10 mb-2" />
                                <strong className="font-FontNoto">คุณลงเวลาเข้างานเรียบร้อยแล้ว</strong>
                            </div>
                        );

                        setSimpleModal(true);

                        // ✅ ปิดอัตโนมัติ
                        setTimeout(() => {
                            setModalOpen(false);
                            setModalMessage('');
                            setModalConfirmAction(null);
                            setSimpleModal(false);
                            setLocation('');
                            setLeaveType('');
                        }, 3000);

                        fetchData(userId);
                    } catch (error) {
                        setModalMessage("❌ เช็คอินล้มเหลว");
                    }

                    setModalConfirmAction(null);
                });

                setModalOpen(true);
            },
            (error) => {
                setModalMessage(`ไม่สามารถระบุตำแหน่งได้: ${error.message}`);
                setModalOpen(true);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleCheckOut = async () => {
        const formData = new FormData();
        formData.append('userID', userId);
        try {
            await axios.post('https://192.168.1.188/hrwebapi/api/Worktime/CheckOut', formData);

            // ✅ แสดงข้อความสำเร็จสำหรับเช็คเอาท์
            setModalMessage(
                <div className="flex flex-col items-center justify-center text-center">
                    <img src="https://cdn-icons-png.flaticon.com/512/1828/1828490.png" alt="checkout" className="w-16 h-16 mb-4" />
                    <h3 className="text-lg font-bold font-FontNoto text-red-600 mb-2">
                        เช็คเอาท์สำเร็จ!
                    </h3>
                    <p className="font-FontNoto text-gray-700">
                        คุณลงเวลาเลิกงานเรียบร้อยแล้ว
                    </p>
                </div>
            );

            setSimpleModal(true);
            setModalConfirmAction(null); // ✅ ล้าง confirm action

            // ✅ ปิด modal อัตโนมัติหลัง 3 วินาที
            setTimeout(() => {
                setModalOpen(false);
                setModalMessage('');
                setSimpleModal(false);
            }, 3000);

            fetchData(userId); // รีโหลดข้อมูล

        } catch (error) {
            // ✅ แสดงข้อความข้อผิดพลาด
            setModalMessage(
                <div className="flex flex-col items-center justify-center text-center">
                    <h3 className="text-lg font-bold font-FontNoto text-red-600 mb-2">
                        เช็คเอาท์ล้มเหลว
                    </h3>
                    <p className="font-FontNoto text-gray-700">
                        กรุณาลองใหม่อีกครั้ง
                    </p>
                </div>
            );
            setSimpleModal(true);
            setModalConfirmAction(null);

            // ✅ ปิด modal หลัง 2 วินาที กรณีเกิดข้อผิดพลาด  
            setTimeout(() => {
                setModalOpen(false);
                setModalMessage('');
                setSimpleModal(false);
            }, 2000);
        }
    };
    const fetchData = async (id) => {
        try {
            const userRes = await axios.get(`https://192.168.1.188/hrwebapi/api/Users/Getbyid/${id}`);
            if (userRes.status === 200) {
                const userData = userRes.data;
                setUserName(`${userData.firstName} ${userData.lastName}`);
            }

            const worktimeRes = await axios.get('https://192.168.1.188/hrwebapi/api/Worktime');
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
        if (diffMinutes <= 0) return '0 น.';

        const hours = Math.floor(diffMinutes / 60);
        const minutes = Math.round(diffMinutes % 60);

        if (hours > 0 && minutes > 0) return `${hours} ชม. ${minutes} น.`;
        if (hours > 0) return `${hours} ชม.`;
        return `${minutes} น.`;
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

        if (totalMinutes <= 0) return '0 ชม. 0 น.';

        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);

        return `${hours} ชม. ${minutes} น.`;
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


    // สถิติเพื่อแสดงในกล่องสรุป
    const totalDaysInMonth = new Date(yearFilter, monthFilter, 0).getDate();
    const workingDayCount = filteredWorktimes.length;
    const standardWorkingDays = 25;
    const averageHoursPerDay = (() => {
        const totalMinutes = filteredWorktimes.reduce((sum, item) => {
            const result = calculateWorkingHours(item.checkIn, item.checkOut, item.date, '');
            if (result !== '-' && result.includes('ชม.')) {
                const [hStr, mStr] = result.replace('ชม.', '').replace('น.', '').split(' ').map(t => t.trim());
                const h = parseInt(hStr || '0');
                const m = parseInt(mStr || '0');
                return sum + h * 60 + m;
            }
            return sum;
        }, 0);
        return (totalMinutes / 60 / workingDayCount || 0).toFixed(1);
    })();

    const daysSummary = {
        มาตรงเวลา: filteredWorktimes.filter(w => {
            const rawLate = calculateRawLateMinutes(w.checkIn, w.date);
            return w.checkIn && rawLate <= 0 && !w.location?.includes('ลา');
        }).length,
        มาสาย: filteredWorktimes.filter(w => {
            const rawLate = calculateRawLateMinutes(w.checkIn, w.date);
            return w.checkIn && rawLate > 0 && !w.location?.includes('ลา');
        }).length,
        ขาดงาน: filteredWorktimes.filter(w => !w.checkIn && !w.location?.includes('ลา')).length,
        ลางาน: filteredWorktimes.filter(w => w.location?.includes('ลา')).length
    };

    const pieData = Object.entries(daysSummary).map(([name, value]) => ({ name, value }));
    const pieColors = ['#34d399', '#facc15', '#f87171', '#60a5fa'];

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalItems = filteredWorktimes.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const paginatedWorktimes = filteredWorktimes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );


    const workingDays = filteredWorktimes.filter(item => !item.location?.includes('ลา'));
    const leaveDays = filteredWorktimes.filter(item => item.location?.includes('ลา'));


    return (
        <div className=" ">
            <div className="w-full bg-gradient-to-r from-cyan-100 via-blue-100 to-blue-50 text-white rounded-xl p-4 sm:p-5 md:p-6 mb-6 shadow-lg">
                <h1 className="text-xl sm:text-2xl text-cyan-950 font-bold font-FontNoto leading-snug">
                    ระบบบันทึกเข้า-ออกงาน
                </h1>
                <p className="text-xs sm:text-sm mt-1 text-cyan-950 font-FontNoto">ตรวจสอบเวลาเข้า-ออกงาน และกิจกรรมที่เกี่ยวข้อง</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 ">
                <div className="flex flex-col gap-4 w-full lg:w-[75%] xl:w-[80%]">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-full text-center mb-6">
                        <h2 className="text-xl font-bold text-gray-700 font-FontNoto mb-1">เวลาปัจจุบัน</h2>
                        <div className="text-3xl font-extrabold text-green-600 font-FontNoto">
                            {currentTime.toLocaleTimeString('th-TH', { hour12: false })}
                        </div>
                        <div className="text-gray-500 font-FontNoto mb-2">
                            {new Date().toLocaleDateString("th-TH", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric"
                            })}
                        </div>

                        <div className="mb-2">
                            {(() => {
                                const today = new Date().toISOString().split("T")[0];
                                const todayWork = worktimes.find(
                                    (item) => item.userID === parseInt(userId) && item.date.startsWith(today)
                                );

                                // ถ้ามีเช็คอินแล้วแต่ยังไม่มีเช็คเอาท์
                                if (todayWork && todayWork.checkIn && !todayWork.checkOut) {
                                    return (
                                        <button
                                            onClick={() => {
                                                setModalTitle('ลงเวลาเลิกงาน');
                                                setModalMessage("คุณต้องการลงเวลาเลิกงานใช่หรือไม่?");
                                                setModalConfirmAction(() => handleCheckOut);
                                                setModalOpen(true);
                                            }}
                                            className="bg-red-400 hover:bg-red-500 text-white px-3 py-1 rounded-lg font-FontNoto transition"
                                        >
                                            ลงเวลาเลิกงาน
                                        </button>

                                    );
                                } else {
                                    return (
                                        <button
                                            onClick={() => setModalOpen(true)}
                                            className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-1 rounded-lg font-FontNoto transition"
                                        >
                                            ลงเวลาเข้างาน
                                        </button>
                                    );
                                }
                            })()}
                        </div>

                        <div className="mt-2 px-4 py-2 rounded-lg font-semibold font-FontNoto text-center">
                            <span className="text-gray-700 font-FontNoto">สถานะปัจจุบัน : </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-FontNoto font-medium ${checkinStatus.color} bg-opacity-20`}>
                                {checkinStatus.text}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="overflow-x-auto">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
                                <h2 className="text-lg font-bold font-FontNoto text-black">ประวัติการลงเวลา</h2>
                                <div className="flex flex-wrap items-center justify-start md:justify-end gap-2">
                                    <select
                                        className="select select-bordered w-36 md:w-40 text-black font-FontNoto !bg-white"
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
                                        className="select select-bordered w-36 md:w-40 text-black font-FontNoto !bg-white"
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
                            </div>

                            <div className='overflow-x-auto w-full'>
                                <table className="table min-w-700px w-full  !text-center">
                                    <thead className="!bg-gray-100 !text-slate-800 !text-sm">
                                        <tr>
                                            <th className="py-3 font-FontNoto whitespace-nowrap">วันที่</th>
                                            <th className="py-3 font-FontNoto whitespace-nowrap">ประเภทการทำงาน</th>
                                            <th className="py-3 font-FontNoto whitespace-nowrap">ประเภทการลา</th>
                                            <th className="py-3 font-FontNoto whitespace-nowrap">สถานที่</th>

                                            <th className="py-3 font-FontNoto whitespace-nowrap">เวลาเข้า</th>
                                            <th className="py-3 font-FontNoto whitespace-nowrap">เวลาออก</th>
                                            <th className="py-3 font-FontNoto whitespace-nowrap">ชั่วโมงทำงาน</th>
                                            <th className="py-3 font-FontNoto whitespace-nowrap min-w-[120px] text-center">สถานะ</th>

                                        </tr>
                                    </thead>
                                    <tbody className="bg-white ">
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
                                                    className={`border-b transition !text-md duration-300 font-FontNoto ${isLeave ? 'bg-green-50 hover:bg-green-100 text-green-700' : 'hover:bg-blue-100 font-FontNoto'
                                                        }`}
                                                >
                                                    <td className="py-2 font-FontNoto whitespace-nowrap">{formatDate(item.date)}</td>

                                                    {isLeave ? (
                                                        <>
                                                            <td className="py-2 font-FontNoto whitespace-nowrap">-</td>
                                                            <td className="py-2 font-FontNoto whitespace-nowrap">
                                                                {/* ✅ แก้ตรงนี้ */}
                                                                {locationText.split('|')[0]?.trim() || '-'}<br />
                                                                <span className="text-sm text-gray-600 font-FontNoto">
                                                                    {locationText.split('|')[1]?.trim() || ''}
                                                                </span>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="py-2 font-FontNoto !text-sm whitespace-nowrap">{locationText}</td>
                                                            <td className="py-2 font-FontNoto whitespace-nowrap">-</td>
                                                        </>
                                                    )}
                                                    <td className="py-2 font-FontNoto text-left whitespace-nowrap">
                                                        {item.photoPath && item.photoPath.includes('|') ? (
                                                            <span className="text-sm text-gray-800 font-FontNoto">{item.photoPath.split('|')[1]?.trim()}</span>
                                                        ) : (
                                                            item.photoPath || '-'
                                                        )}
                                                    </td>



                                                    <td className="py-2 font-FontNoto whitespace-nowrap">{shouldShowTime ? item.checkIn || '-' : '-'}</td>
                                                    <td className="py-2 font-FontNoto whitespace-nowrap">{shouldShowTime ? item.checkOut || '-' : '-'}</td>
                                                    <td className="py-2 font-FontNoto whitespace-nowrap">
                                                        {shouldShowTime ? calculateWorkingHours(item.checkIn, item.checkOut, item.date, leaveType) : '-'}
                                                    </td>
                                                    <td className="py-2 font-FontNoto text-center  whitespace-nowrap">
                                                        <span
                                                            className={`inline-block px-3 py-1  font-semibold rounded-full
      ${!shouldShowTime
                                                                    ? 'bg-gray-100 text-gray-600'
                                                                    : calculateRawLateMinutes(item.checkIn, item.date, leaveType) > 0
                                                                        ? 'bg-yellow-100 text-yellow-700'
                                                                        : 'bg-green-100 text-green-700'}
    `}
                                                        >
                                                            {shouldShowTime
                                                                ? calculateRawLateMinutes(item.checkIn, item.date, leaveType) > 0
                                                                    ? `สาย ${calculateLateMinutes(item.checkIn, item.date, leaveType)}`
                                                                    : 'ปกติ'
                                                                : '-'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex flex-col md:flex-row justify-between items-center mt-4 text-sm font-FontNoto text-gray-600">
                                <div className="font-FontNoto">
                                    แสดง {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}-
                                    {Math.min(currentPage * itemsPerPage, totalItems)} จาก {totalItems} รายการ
                                </div>

                                <div className="join mt-2 md:mt-0">
                                    <button
                                        className="join-item btn btn-sm font-FontNoto !bg-white"
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        &lt; ก่อนหน้า
                                    </button>

                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            className={`join-item btn btn-sm font-FontNoto transition-all duration-150 ${currentPage === i + 1
                                                ? '!bg-blue-300 !-white hover:bg-blue-700'
                                                : '!bg-blue-100 !text-blue-800 hover:bg-blue-200'
                                                }`}
                                            onClick={() => setCurrentPage(i + 1)}
                                        >
                                            {i + 1}
                                        </button>

                                    ))}

                                    <button
                                        className="join-item btn btn-sm font-FontNoto !bg-white text-black"
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                    >
                                        ถัดไป &gt;
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-4 w-full lg:w-[25%] xl:w-[20%]">
                    {/* กล่อง 1 */}
                    <div className="bg-white shadow-md rounded-xl p-5 flex-1">
                        <h3 className="text-md font-bold font-FontNoto mb-3">สรุปการทำงาน/เดือน</h3>
                        {/* สรุปเวลาสายทั้งเดือน */}
                        <div className="mb-4 text-sm font-FontNoto text-red-700 font-semibold">
                            {(() => {
                                const { hours, minutes } = getTotalLateTimeThisMonth();
                                if (hours === 0 && minutes === 0) {
                                    return 'เดือนนี้คุณยังไม่มาสายเลย! 🎉';
                                }
                                return `เดือนนี้คุณมาสายไปทั้งหมด ${hours > 0 ? `${hours} ชั่วโมง` : ''} ${minutes > 0 ? `${minutes} นาที` : ''}`;
                            })()}
                        </div>
                        <div className="mt-2 text-sm text-gray-700 font-FontNoto">
                            <div className="flex justify-between ">
                                <span className="font-FontNoto">ชั่วโมงทำงานเฉลี่ย/วัน:</span>
                                <span className="font-FontNoto">{averageHoursPerDay} ชม.</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1 mb-1">
                                <div
                                    className="bg-blue-500 h-2.5 rounded-full"
                                    style={{
                                        width: `${Math.min((averageHoursPerDay / 8) * 100, 100)}%`
                                    }}
                                ></div>
                            </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-700 font-FontNoto">
                            <div className="flex justify-between">
                                <span className="font-FontNoto">อัตราการมาตรงเวลา/เดือน:</span>
                                <span className="font-FontNoto">{Math.round((daysSummary['มาตรงเวลา'] / standardWorkingDays) * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1 mb-1">
                                <div
                                    className="bg-green-500 h-2.5 rounded-full"
                                    style={{
                                        width: `${(daysSummary['มาตรงเวลา'] / standardWorkingDays) * 100}%`
                                    }}
                                ></div>
                            </div>
                        </div>

                        <div className="mt-2 text-sm text-gray-700 font-FontNoto">
                            <div className="flex justify-between">
                                <span className="font-FontNoto">วันทำงาน/ต่อเดือน:</span>
                                <span className="font-FontNoto">{workingDayCount} วัน</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1 mb-1">
                                <div
                                    className="bg-yellow-500 h-2.5 rounded-full"
                                    style={{
                                        width: `${(workingDayCount / standardWorkingDays) * 100}%`
                                    }}
                                ></div>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2 font-FontNoto space-y-1">
                            <div className="flex justify-between">
                                <span className="font-FontNoto">วันทำงานทั้งหมด:</span>
                                <span className="font-FontNoto">{standardWorkingDays} วัน</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-FontNoto">เวลาทำงานที่ทำไป/เดือน:</span>
                                <span className="font-FontNoto">{(averageHoursPerDay * workingDayCount).toFixed(1)} ชั่วโมง</span>
                            </div>
                        </div>
                    </div>

                    {/* กล่อง 2 */}
                    <div className="bg-white shadow-md rounded-xl p-5 flex-1 font-FontNoto">
                        <h3 className="text-md font-bold font-FontNoto mb-3">สรุปวันทำงาน/เดือน</h3>

                        {/* ครอบ PieChart ด้วย div จัดกลาง */}
                        <div className="flex justify-center items-center">
                            <PieChart width={280} height={220}>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={70}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                                    ))}
                                </Pie>

                                <Tooltip
                                    formatter={(value, name, props) => {
                                        const total = pieData.reduce((sum, entry) => sum + entry.value, 0);
                                        const percent = ((value / total) * 100).toFixed(0);
                                        return [`${percent}%`, name];
                                    }}
                                    wrapperStyle={{
                                        fontFamily: '"Noto Sans Thai", sans-serif',
                                        fontSize: '13px'
                                    }}
                                />

                            </PieChart>
                        </div>
                        <div className="mt-4 space-y-1 text-sm text-gray-700 font-FontNoto">
                            {pieData.map((entry, index) => (
                                <div key={index} className="flex justify-between">
                                    <span className="flex items-center gap-2">
                                        <span
                                            className="inline-block w-3 h-3 rounded-full"
                                            style={{ backgroundColor: pieColors[index % pieColors.length] }}
                                        ></span>
                                        {entry.name}
                                    </span>
                                    <span>{entry.value} วัน</span>
                                </div>
                            ))}
                        </div>

                    </div>
                    {/* กล่อง 3 */}
                    <div className="bg-white shadow-md rounded-xl p-5 flex-1">
                        <h3 className="text-md font-bold font-FontNoto mb-2">ข้อมูลการทำงาน</h3>
                        <div className="text-sm text-gray-700 font-FontNoto">เวลาทำงาน: <span className="font-bold">08:30 - 17:30 น.</span></div>
                        <div className="text-sm text-gray-700 font-FontNoto">วันทำงาน: <span className="font-bold">จันทร์ - ศุกร์</span></div>
                        <div className="text-sm text-gray-700 font-FontNoto">พักกลางวัน: <span className="font-bold">12:00 - 13:00 น.</span></div>
                    </div>
                </div>
            </div>
            <div className="w-full bg-transparent rounded-xl p-3">

                {modalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full font-FontNoto text-gray-700 relative">
                            {/* ปุ่มปิดมุมขวาบน */}
                            <button
                                className="absolute top-2 right-2 text-red-500 font-bold"
                                onClick={() => {
                                    setModalOpen(false);
                                    setLocation('');
                                    setLeaveType('');
                                    setModalMessage('');
                                    setModalConfirmAction(null);
                                    setSimpleModal(false);
                                }}
                            >
                                ✖
                            </button>

                            {/* ถ้าไม่มี modalMessage แสดงฟอร์มเช็คอิน */}
                            {!modalMessage ? (
                                <>
                                    <h2 className="text-lg font-bold font-FontNoto mb-4 text-center">ลงเวลาเข้างาน</h2>

                                    {/* ประเภทการทำงาน */}
                                    <div className="mb-3">
                                        <label className="block text-sm mb-1 font-FontNoto">ประเภทการทำงาน</label>
                                        <select
                                            className="select select-bordered w-full font-FontNoto"
                                            value={location}
                                            onChange={(e) => {
                                                const selected = e.target.value;
                                                setLocation(selected);
                                                if (['ลาพักร้อน', 'ลาคลอด', 'ลาบวช'].includes(selected)) {
                                                    setLeaveType('เต็มวัน');
                                                } else if (!['ลาป่วย', 'ลากิจส่วนตัว'].includes(selected)) {
                                                    setLeaveType('');
                                                }
                                            }}
                                        >
                                            <option className="font-FontNoto" value="">-- กรุณาเลือก --</option>
                                            {[
                                                'Office', 'Work from home', 'Off-site (เข้าหน่วยงาน)', 'เช้า Work from home บ่าย Office',
                                                'ลาป่วย', 'ลากิจส่วนตัว', 'ลาพักร้อน', 'ลาคลอด', 'ลาบวช'
                                            ].map((place) => (
                                                <option className="font-FontNoto" key={place} value={place}>{place}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* ช่วงเวลาการลา */}
                                    {['ลาป่วย', 'ลากิจส่วนตัว'].includes(location) && (
                                        <div className="mb-4">
                                            <label className="block text-sm mb-1 font-FontNoto">เลือกช่วงเวลา</label>
                                            <select
                                                className="select select-bordered w-full font-FontNoto"
                                                value={leaveType}
                                                onChange={(e) => setLeaveType(e.target.value)}
                                            >
                                                <option className="font-FontNoto" value="">-- เลือกช่วงเวลา --</option>
                                                <option className="font-FontNoto" value="ครึ่งวันเช้า">ครึ่งวันเช้า</option>
                                                <option className="font-FontNoto" value="ครึ่งวันบ่าย">ครึ่งวันบ่าย</option>
                                            </select>
                                        </div>
                                    )}


                                    <div className="text-right mt-4">
                                        <button
                                            onClick={handleCheckinConfirm}
                                            className="relative rounded-full bg-green-500 px-4 py-2 font-FontNoto text-white font-bold transition-colors duration-300 ease-linear 
            before:absolute before:right-1/2 before:top-1/2 before:-z-[1] 
            before:h-3/4 before:w-2/3 before:origin-bottom-left before:-translate-y-1/2 
            before:translate-x-1/2 before:animate-ping before:rounded-full 
            before:bg-green-500 hover:bg-green-700 hover:before:bg-green-700"
                                        >
                                            ลงเวลาเข้างาน
                                        </button>
                                    </div>
                                </>
                            ) : (

                                <div className="text-center">
                                    {simpleModal ? (
                                        /* แสดงผลลัพธ์สำเร็จ */
                                        <div className="text-center">
                                            {modalMessage}
                                        </div>
                                    ) : (
                                        /* แสดง Modal ยืนยัน */
                                        <>
                                            <h3 className="text-lg font-bold font-FontNoto mb-4">{modalTitle}</h3>
                                            <div className="text-left mb-4">
                                                <p className="text-sm font-FontNoto text-gray-700 whitespace-pre-line">
                                                    {modalMessage}
                                                </p>
                                            </div>

                                            {modalConfirmAction && (
                                                <div className="flex gap-3 justify-center">

                                                    <button
                                                        onClick={modalConfirmAction}
                                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg font-FontNoto hover:bg-blue-600 transition"
                                                    >
                                                        ยืนยัน
                                                    </button>
                                                </div>
                                            )}

                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>

    );
};

export default Worktime;
