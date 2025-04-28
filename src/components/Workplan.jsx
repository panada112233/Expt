import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AOS from 'aos';
import 'aos/dist/aos.css';

const Workplan = () => {
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth());
    const [year, setYear] = useState(today.getFullYear());
    const [tasks, setTasks] = useState({});
    const [selectedDate, setSelectedDate] = useState(null);
    const [taskData, setTaskData] = useState({ morning: '', evening: '' });
    const [showModal, setShowModal] = useState(false);
    const [userName, setUserName] = useState('พนักงาน');
    const [userId, setUserId] = useState(null);
    const [roleText, setRoleText] = useState("กำลังโหลด...");
    const [isHoliday, setIsHoliday] = useState(false);
    const [todayWorktime, setTodayWorktime] = useState(null);
    const [todayPlan, setTodayPlan] = useState(null);

    const getCompensatedHolidays = (year, holidays) => {
        const compensated = {};
        const usedDates = new Set(Object.keys(holidays));

        Object.entries(holidays).forEach(([key, name]) => {
            const [mm, dd] = key.split('-');
            const date = new Date(`${year}-${mm}-${dd}`);
            const day = date.getDay();

            if (day === 0 || day === 6) {
                // ถ้าเป็นเสาร์-อาทิตย์ → หา "วันทำงานถัดไป" ที่ยังไม่ถูกใช้
                let next = new Date(date);
                do {
                    next.setDate(next.getDate() + 1);
                    const newKey = `${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
                    if (!usedDates.has(newKey) && (next.getDay() !== 0 && next.getDay() !== 6)) {
                        compensated[newKey] = `ชดเชย${name}`;
                        usedDates.add(newKey);
                        break;
                    }
                } while (true);
            }
        });

        return compensated;
    };

    const thaiMonths = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];

    const roleMapping = {
        Hr: "ทรัพยากรบุคคล",
        GM: "ผู้จัดการทั่วไป",
        Dev: "นักพัฒนาระบบ",
        BA: "นักวิเคราะห์ธุรกิจ",
        Employee: "พนักงาน",
    };

    const holidaysByYear = {
        2024: {
            "01-01": "วันขึ้นปีใหม่",
            "04-06": "วันจักรี",
            "04-13": "วันสงกรานต์",
            "04-14": "วันสงกรานต์",
            "04-15": "วันสงกรานต์",
            "05-01": "วันแรงงาน",
            "05-04": "วันฉัตรมงคล",
            "06-03": "วันเฉลิมราชินี",
            "07-28": "วันเฉลิมพระเจ้าอยู่หัว",
            "08-12": "วันแม่แห่งชาติ",
            "10-13": "วันคล้ายวันสวรรคต ร.9",
            "10-23": "วันปิยมหาราช",
            "12-05": "วันพ่อแห่งชาติ",
            "12-10": "วันรัฐธรรมนูญ",
            "12-31": "วันสิ้นปี"
        },
        2025: {
            "01-01": "วันขึ้นปีใหม่",
            "02-12": "วันมาฆบูชา",
            "04-06": "วันจักรี",
            "04-13": "วันสงกรานต์",
            "04-14": "วันสงกรานต์",
            "04-15": "วันสงกรานต์",
            "05-01": "วันแรงงาน",
            "05-04": "วันฉัตรมงคล",
            "05-11": "วันวิสาขบูชา",
            "06-03": "วันเฉลิมราชินี",
            "07-10": "วันอาสาฬหบูชา",
            "07-11": "วันเข้าพรรษา",
            "07-28": "วันเฉลิมพระเจ้าอยู่หัว",
            "08-12": "วันแม่แห่งชาติ",
            "10-13": "วันคล้ายวันสวรรคต ร.9",
            "10-23": "วันปิยมหาราช",
            "12-05": "วันพ่อแห่งชาติ",
            "12-10": "วันรัฐธรรมนูญ",
            "12-31": "วันสิ้นปี"
        },
        2026: {
            "01-01": "วันขึ้นปีใหม่",
            "01-02": "วันหยุดพิเศษ (ครม.)",
            "03-03": "วันมาฆบูชา",
            "04-06": "วันจักรี",
            "04-13": "วันสงกรานต์",
            "04-14": "วันสงกรานต์",
            "04-15": "วันสงกรานต์",
            "05-01": "วันแรงงาน",
            "05-04": "วันฉัตรมงคล",
            "05-31": "วันวิสาขบูชา",
            "06-03": "วันเฉลิมราชินี",
            "07-28": "วันเฉลิมพระเจ้าอยู่หัว",
            "07-29": "วันอาสาฬหบูชา",
            "07-30": "วันเข้าพรรษา",
            "08-12": "วันแม่แห่งชาติ",
            "10-13": "วันคล้ายวันสวรรคต ร.9",
            "10-23": "วันปิยมหาราช",
            "12-05": "วันพ่อแห่งชาติ",
            "12-10": "วันรัฐธรรมนูญ",
            "12-31": "วันสิ้นปี"
        },
        2027: {
            "01-01": "วันขึ้นปีใหม่",
            "02-21": "วันมาฆบูชา",
            "04-06": "วันจักรี",
            "04-13": "วันสงกรานต์",
            "04-14": "วันสงกรานต์",
            "04-15": "วันสงกรานต์",
            "05-01": "วันแรงงาน",
            "05-04": "วันฉัตรมงคล",
            "05-20": "วันวิสาขบูชา",
            "06-03": "วันเฉลิมราชินี",
            "07-18": "วันอาสาฬหบูชา",
            "07-20": "วันเข้าพรรษา",
            "07-28": "วันเฉลิมพระเจ้าอยู่หัว",
            "08-12": "วันแม่แห่งชาติ",
            "10-13": "วันคล้ายวันสวรรคต ร.9",
            "10-23": "วันปิยมหาราช",
            "12-05": "วันพ่อแห่งชาติ",
            "12-10": "วันรัฐธรรมนูญ",
            "12-31": "วันสิ้นปี"
        }
    };

    // Template วันหยุดที่เหมือนกันทุกปี 2028-2034
    const baseHolidayTemplate = {
        "01-01": "วันขึ้นปีใหม่",
        "04-06": "วันจักรี",
        "04-13": "วันสงกรานต์",
        "04-14": "วันสงกรานต์",
        "04-15": "วันสงกรานต์",
        "05-01": "วันแรงงาน",
        "05-04": "วันฉัตรมงคล",
        "06-03": "วันเฉลิมราชินี",
        "07-28": "วันเฉลิมพระเจ้าอยู่หัว",
        "08-12": "วันแม่แห่งชาติ",
        "10-13": "วันคล้ายวันสวรรคต ร.9",
        "10-23": "วันปิยมหาราช",
        "12-05": "วันพ่อแห่งชาติ",
        "12-10": "วันรัฐธรรมนูญ",
        "12-31": "วันสิ้นปี"
    };

    // เพิ่มปี 2028–2034 โดยใช้ template เดียวกัน
    for (let year = 2028; year <= 2034; year++) {
        holidaysByYear[year] = { ...baseHolidayTemplate };
    }

    // ภายใน Workplan component:
    const currentYearHolidays = holidaysByYear[year] || {};
    const compensated = getCompensatedHolidays(year, currentYearHolidays);
    const thaiHolidays = { ...currentYearHolidays, ...compensated };

    useEffect(() => {
        const loadUserDataAndTodayData = async () => {
            const id = parseInt(sessionStorage.getItem('userId'));
            if (!id) return;

            setUserId(id);

            try {
                // 🔹 โหลดข้อมูลผู้ใช้
                const userRes = await axios.get(`https://localhost:7039/api/Users/Getbyid/${id}`);
                if (userRes.status === 200) {
                    const userData = userRes.data;
                    setUserName(`${userData.firstName} ${userData.lastName}`);

                    const role = userData.role; // เช่น "Dev", "Hr"
                    const mapped = roleMapping[role] || "ไม่ทราบตำแหน่ง";
                    setRoleText(mapped);
                }

                // 🔹 โหลดแผนงานทั้งหมดของผู้ใช้
                const planRes = await axios.get(`https://localhost:7039/api/Workplan/${id}`);
                const loadedTasks = {};
                const today = new Date();
                const todayKey = `${id}-${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

                planRes.data.forEach((t) => {
                    const d = new Date(t.date);
                    const key = `${t.userID}-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
                    loadedTasks[key] = {
                        morning: t.morningTask,
                        evening: t.eveningTask
                    };

                    // 🔍 ถ้าเจอแผนงานของวันนี้ ให้ตั้งค่า todayPlan ด้วยเลย
                    if (
                        d.getFullYear() === today.getFullYear() &&
                        d.getMonth() === today.getMonth() &&
                        d.getDate() === today.getDate()
                    ) {
                        setTodayPlan(t);
                    }
                });

                setTasks(loadedTasks);

                // 🔹 โหลดข้อมูลเวลาเข้า-ออกวันนี้
                const worktimeRes = await axios.get("https://localhost:7039/api/Worktime");
                const userWork = worktimeRes.data.find(item => item.userID === id && item.date.startsWith(today.toISOString().split("T")[0]));
                setTodayWorktime(userWork || {});

            } catch (error) {
                console.error('เกิดข้อผิดพลาดในการโหลดข้อมูล:', error);
            }
        };
        // เริ่มการตั้งค่า AOS
        AOS.init({
            duration: 1500,  // เวลาในการทำให้การซูมช้าๆ
            easing: 'ease-in-out',  // ให้การซูมเรียบขึ้น
        });

        loadUserDataAndTodayData();
    }, []);

    const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = getDaysInMonth(month, year);

    const openModal = (date) => {
        const fullDate = new Date(year, month, date);
        const dayOfWeek = fullDate.getDay();

        const key = `${userId}-${year}-${month + 1}-${date}`;
        setSelectedDate(date);
        setTaskData(tasks[key] || { morning: '', evening: '' });

        // ✅ เช็ควันหยุด: เสาร์-อาทิตย์ หรือวันหยุดราชการจาก holidaysByYear
        const mmddKey = `${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
        const currentYearHolidays = holidaysByYear[year] || {};
        const compensated = getCompensatedHolidays(year, currentYearHolidays);
        const thaiHolidays = { ...currentYearHolidays, ...compensated };

        const holidayName = thaiHolidays[mmddKey];
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isThaiHoliday = !!holidayName;

        setIsHoliday(isWeekend || isThaiHoliday);
        setShowModal(true);
    };

    const saveOrUpdateTaskToDatabase = async (task) => {
        try {
            const res = await axios.get(`https://localhost:7039/api/Workplan/${task.userID}`);

            // 🔍 ค้นหาเรคคอร์ดวันเดียวกันทั้งหมด (ไม่ใช่แค่ตัวเดียว)
            const sameDayTasks = res.data.filter(t =>
                new Date(t.date).toDateString() === new Date(task.date).toDateString()
            );

            if (sameDayTasks.length > 0) {
                // ✅ มีหลายตัว → แก้ไขตัวแรก และ optionally ลบตัวอื่น
                await axios.put(`https://localhost:7039/api/Workplan/${sameDayTasks[0].id}`, task);

                // ❌ ลบตัวซ้ำ (เหลือแค่ 1 ตัว)
                for (let i = 1; i < sameDayTasks.length; i++) {
                    await axios.delete(`https://localhost:7039/api/Workplan/${sameDayTasks[i].id}`);
                }

                console.log('อัปเดตข้อมูลสำเร็จ และลบข้อมูลซ้ำแล้ว');
            } else {
                // ❇️ ไม่มี → บันทึกใหม่
                await axios.post('https://localhost:7039/api/Workplan', task);
                console.log('บันทึกใหม่สำเร็จ');
            }
        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการบันทึกหรืออัปเดต:', error);
        }
    };

    const deleteTaskFromDatabase = async (dateToDelete) => {
        try {
            const res = await axios.get(`https://localhost:7039/api/Workplan/${userId}`);

            const tasksToDelete = res.data.filter(t =>
                new Date(t.date).toDateString() === new Date(dateToDelete).toDateString()
            );

            for (const task of tasksToDelete) {
                await axios.delete(`https://localhost:7039/api/Workplan/${task.id}`);
            }

            console.log(`ลบแผนงานทั้งหมดของวันที่ ${dateToDelete.toDateString()} แล้ว`);
        } catch (error) {
            console.error('ลบไม่สำเร็จ:', error);
        }
    };
    const saveTask = async () => {
        const key = `${userId}-${year}-${month + 1}-${selectedDate}`;
        const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
        const newTask = {
            userID: parseInt(userId),
            date: formattedDate,
            morningTask: taskData.morning,
            eveningTask: taskData.evening
        };

        await saveOrUpdateTaskToDatabase(newTask);
        setTasks({ ...tasks, [key]: { ...taskData } });

        // ✅ ถ้าเป็นวันปัจจุบัน ให้เซ็ต todayPlan ทันที
        const today = new Date();
        const isToday =
            today.getDate() === selectedDate &&
            today.getMonth() === month &&
            today.getFullYear() === year;

        if (isToday) {
            setTodayPlan(newTask); // อัปเดตการ์ด
        }

        setShowModal(false);
    };

    const selectedFullDate = selectedDate ? new Date(year, month, selectedDate) : null;
    const isMonday = selectedFullDate?.getDay() === 1;
    const yesterdayLabel = isMonday ? "เมื่อวันศุกร์" : "เมื่อวาน";

    const prevMonth = month === 0 ? 11 : month - 1;
    const nextMonth = month === 11 ? 0 : month + 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const nextMonthYear = month === 11 ? year + 1 : year;

    const daysInPrevMonth = getDaysInMonth(prevMonth, prevMonthYear);
    const weeks = [];
    let currentWeek = [];

    // เติมวันของเดือนก่อนหน้า
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        currentWeek.push({
            day: daysInPrevMonth - i,
            type: 'prev',
            date: new Date(prevMonthYear, prevMonth, daysInPrevMonth - i)
        });
    }

    // วันที่ของเดือนปัจจุบัน
    for (let day = 1; day <= daysInMonth; day++) {
        currentWeek.push({
            day,
            type: 'current',
            date: new Date(year, month, day)
        });

        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    }

    // เติมวันของเดือนถัดไป
    let nextDay = 1;
    while (currentWeek.length < 7) {
        currentWeek.push({
            day: nextDay,
            type: 'next',
            date: new Date(nextMonthYear, nextMonth, nextDay)
        });
        nextDay++;
    }
    weeks.push(currentWeek);


    return (
        <div className="flex flex-col w-full">
            <div className="w-full bg-gradient-to-r from-cyan-900 via-cyan-600 to-slate-500 text-white rounded-xl p-4 sm:p-5 md:p-6 mb-6 shadow-lg">
                <h1 className="text-xl sm:text-2xl font-bold font-FontNoto leading-snug">
                    ระบบบันทึกเข้า-ออกงาน{" "}
                    <span className="font-normal font-FontNoto text-base sm:text-lg">
                        {roleText ? `(${roleText})` : ""}
                    </span>
                </h1>
                <p className="text-xs sm:text-sm mt-1 font-FontNoto">ตรวจสอบเวลาเข้า-ออกงาน และกิจกรรมที่เกี่ยวข้อง</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-4 mb-6 animate-fade-in ">
                {/* 🟡 การ์ดเวลาเข้า-ออก */}
                <div className="bg-yellow-50 border border-yellow-400 rounded-xl p-3 shadow-md w-full sm:w-72 flex flex-col items-center relative overflow-hidden">
                    <img src="https://cdn-icons-png.flaticon.com/512/3595/3595455.png" alt="clock cute" className="w-10 h-10 absolute -top-3 -left-3 rotate-[-10deg]" />
                    <h3 className="text-md font-bold text-yellow-800 font-FontNoto mb-2 text-center">⏰ เวลาเข้า-ออกงานวันนี้</h3>
                    {todayWorktime ? (
                        <div className="font-FontNoto text-xs text-gray-800 space-y-1">
                            <p className="font-FontNoto">🕘 เช็คอิน: {todayWorktime.checkIn || "-"}</p>
                            <p className="font-FontNoto">🕔 เช็คเอาท์: {todayWorktime.checkOut || "-"}</p>
                            <p className="font-FontNoto">📍 สถานที่: {todayWorktime.location || "-"}</p>
                        </div>
                    ) : (
                        <p className="font-FontNoto text-xs text-gray-500 text-center">ไม่มีข้อมูลเข้า-ออก</p>
                    )}
                </div>

                {/* 🌸 การ์ดแผนงานวันนี้ */}
                <div className="bg-pink-50 border border-pink-400 rounded-xl p-3 shadow-md w-full sm:w-72 flex flex-col items-center relative overflow-hidden">
                    <img src="https://cdn-icons-png.flaticon.com/512/616/616430.png" alt="plan cute" className="w-10 h-10 absolute -top-3 -right-3 rotate-[10deg]" />
                    <h3 className="text-md font-bold text-pink-800 font-FontNoto mb-2 text-center">📝 แผนงานวันนี้</h3>
                    {todayPlan ? (
                        <div className="font-FontNoto text-xs text-gray-800 space-y-1">
                            <p className="font-FontNoto">วันนี้: {todayPlan.eveningTask || "-"}</p>
                        </div>
                    ) : (
                        <p className="font-FontNoto text-xs text-gray-500 text-center">ยังไม่ได้เขียนแผนงาน</p>
                    )}
                </div>
                <div className="bg-blue-50 border border-blue-400 rounded-xl p-3 shadow-md w-full sm:w-72 flex flex-col items-center relative overflow-hidden">
                    <img src="https://cdn-icons-png.flaticon.com/512/616/616408.png" alt="yesterday plan" className="w-10 h-10 absolute -top-3 -right-3 rotate-[10deg]" />
                    <h3 className="text-md font-bold text-blue-800 font-FontNoto mb-2 text-center">🌙 แผนงาน{yesterdayLabel}</h3>
                    {todayPlan ? (
                        <div className="font-FontNoto text-xs text-gray-800 space-y-1 text-center">
                            <p className="font-FontNoto">{yesterdayLabel}: {todayPlan.morningTask || "-"}</p>
                        </div>
                    ) : (
                        <p className="font-FontNoto text-xs text-gray-500 text-center">ยังไม่ได้เขียนแผนงาน</p>
                    )}
                </div>

            </div>

            <div className="w-full max-w-6xl mx-auto bg-white shadow-xl rounded-xl p-6 items-center justify-center">

                <h2 className="text-2xl font-bold mb-2 font-FontNoto text-blue-800 text-center">🐾 ปฏิทินการทำงานของคุณ {userName} 🐾</h2>

                {/* ตัวกรองเดือนและปี */}
                <div className="flex items-center justify-end space-x-4 mb-4">
                    <select
                        className="select select-bordered w-40 text-black font-FontNoto"
                        value={month}
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                    >
                        {thaiMonths.map((m, idx) => (
                            <option className="font-FontNoto" key={idx} value={idx}>
                                {m}
                            </option>
                        ))}
                    </select>

                    <select
                        className="select select-bordered w-40 text-black font-FontNoto"
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                    >
                        {Array.from({ length: 11 }, (_, i) => 2024 + i).map((y) => (
                            <option className="font-FontNoto" key={y} value={y}>
                                {y + 543}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="relative">
                    {/* ☁️ เมฆฟุ้งฟิ้งมุมซ้าย */}
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/414/414927.png"
                        alt="cloud left"
                        className="w-16 h-16 absolute -top-6 -left-6 opacity-80 animate-float-slow"
                    />

                    {/* ☁️ เมฆฟุ้งฟิ้งมุมขวา */}
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/414/414927.png"
                        alt="cloud right"
                        className="w-16 h-16 absolute -top-6 -right-6 opacity-80 animate-float-slow"
                    />
                    <div className="grid grid-cols-7 gap-1 text-center font-bold border rounded-xl overflow-hidden shadow-lg">

                        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                            <div key={day} className="border p-2 bg-blue-100 text-blue-800 font-FontNoto shadow-lg">
                                {day}
                            </div>
                        ))}

                        {weeks.map((week, wi) =>
                            week.map((dayObj, di) => {
                                const { day, type, date } = dayObj;
                                const isSaturdayOrSunday = date.getDay() === 0 || date.getDay() === 6;
                                const monthDayKey = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const holidayName = thaiHolidays[monthDayKey];
                                const isSelected = selectedDate === day && type === 'current';

                                return (
                                    <div
                                        key={`${wi}-${di}`}
                                        className={`border h-28 relative p-1 text-left cursor-pointer
        ${type === 'prev' || type === 'next' ? 'bg-gray-100 text-gray-400' :
                                                isSelected ? (isSaturdayOrSunday ? 'bg-red-200' : 'bg-yellow-100') :
                                                    isSaturdayOrSunday ? 'bg-white hover:bg-red-200' : 'bg-white hover:bg-yellow-100'}
    `}
                                        onClick={() => {
                                            if (type === 'current') openModal(day);
                                        }}
                                    >

                                        <div className="font-bold text-right pr-1 font-FontNoto">{day}</div>

                                        {holidayName && (
                                            <div className="text-[10px] text-red-500 font-FontNoto leading-tight">{holidayName}</div>
                                        )}

                                        <div className="text-[8px] font-FontNoto flex flex-col gap-1 leading-tight">
                                            {tasks[`${userId}-${year}-${month + 1}-${day}`]?.morning && type === 'current' && (
                                                <div className="bg-blue-100 text-blue-800 rounded-md px-1 py-0.5 shadow-sm">
                                                    {tasks[`${userId}-${year}-${month + 1}-${day}`].morning}
                                                </div>
                                            )}
                                            {tasks[`${userId}-${year}-${month + 1}-${day}`]?.evening && type === 'current' && (
                                                <div className="bg-green-100 text-green-800 rounded-md px-1 py-0.5 shadow-sm">
                                                    {tasks[`${userId}-${year}-${month + 1}-${day}`].evening}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fade-in">
                    <div
                        className="bg-white p-6 rounded-2xl shadow-2xl w-96 relative transition-transform duration-300 ease-in-out transform scale-100"
                        data-aos="zoom-in"
                        data-aos-duration="500" // ปรับระยะเวลาการซูม
                        data-aos-easing="ease-in-out" // ใช้การเคลื่อนที่แบบ smooth
                    >
                        {/* 🎀 รูปน่ารัก */}
                        <img src="https://cdn-icons-png.flaticon.com/512/616/616408.png" alt="cute" className="w-12 h-12 absolute -top-6 left-4 rounded-full border-4 border-white shadow-lg bg-pink-100" />

                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-pink-600 font-FontNoto">
                                📅 {selectedDate}/{month + 1}/{year + 543}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-red-500 text-lg font-bold hover:scale-110 transition"
                            >
                                ❌
                            </button>
                        </div>

                        {isHoliday ? (
                            <div className="text-red-500 text-center font-FontNoto mb-4">
                                วันนี้เป็นวันหยุด ไม่สามารถบันทึกงานได้
                            </div>
                        ) : (
                            <>
                                <div className="mb-4">
                                    <label className="block mb-1 font-bold text-blue-600 font-FontNoto">{yesterdayLabel}</label>
                                    <textarea
                                        className="textarea textarea-bordered w-full bg-blue-50 font-FontNoto"
                                        value={taskData.morning}
                                        placeholder="กรอกงานเมื่อวาน"
                                        onChange={(e) => setTaskData({ ...taskData, morning: e.target.value })}
                                    ></textarea>
                                </div>

                                <div className="mb-4">
                                    <label className="block mb-1 font-bold text-green-600 font-FontNoto">วันนี้</label>
                                    <textarea
                                        className="textarea textarea-bordered w-full bg-green-50 font-FontNoto"
                                        value={taskData.evening}
                                        placeholder="กรอกงานวันนี้"
                                        onChange={(e) => setTaskData({ ...taskData, evening: e.target.value })}
                                    ></textarea>
                                </div>

                                <div className="flex justify-end gap-2 ">
                                    <button
                                        className="btn btn-outline btn-error font-FontNoto"
                                        onClick={async () => {
                                            const key = `${userId}-${year}-${month + 1}-${selectedDate}`;
                                            const date = new Date(year, month, selectedDate);

                                            await deleteTaskFromDatabase(date);

                                            const newTasks = { ...tasks };
                                            delete newTasks[key];
                                            setTasks(newTasks);

                                            // ✅ เคลียร์ todayPlan ถ้าวันที่ลบตรงกับวันนี้
                                            const today = new Date();
                                            const isToday =
                                                today.getDate() === selectedDate &&
                                                today.getMonth() === month &&
                                                today.getFullYear() === year;

                                            if (isToday) {
                                                setTodayPlan(null);
                                            }

                                            setShowModal(false);
                                        }}
                                    >
                                        ลบ
                                    </button>

                                    <button className="btn btn-outline btn-success font-FontNoto" onClick={saveTask}>บันทึก</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default Workplan;
