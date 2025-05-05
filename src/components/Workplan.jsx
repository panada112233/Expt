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
    const [notes, setNotes] = useState({});

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
                        evening: t.eveningTask,
                        privateNote: t.privateNote || "",     // ✅ เพิ่มส่วนนี้
                        noteType: t.noteType || "public"      // ✅ เพิ่มส่วนนี้
                    };

                    // 🔍 ถ้าเจอแผนงานของวันนี้ ให้ตั้งค่า todayPlan ด้วยเลย
                    if (
                        d.getFullYear() === today.getFullYear() &&
                        d.getMonth() === today.getMonth() &&
                        d.getDate() === today.getDate()
                    ) {
                        setTodayPlan({
                            ...t,
                            privateNote: t.privateNote || "",   // ✅ เพิ่มเพื่อให้ใช้งานได้แน่นอน
                            noteType: t.noteType || "public"
                        });
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

    useEffect(() => {
        const storedNotes = JSON.parse(localStorage.getItem("notes") || "{}");
        setNotes(storedNotes);
    }, []);


    const clearPrivateNoteFromDatabase = async (dateToClear) => {
        try {
            const res = await axios.get(`https://localhost:7039/api/Workplan/${userId}`);

            const taskForTheDay = res.data.find(t =>
                new Date(t.date).toDateString() === new Date(dateToClear).toDateString()
            );

            if (taskForTheDay) {
                const updatedTask = {
                    ...taskForTheDay,
                    privateNote: "", // ✅ ล้างโน้ตส่วนตัว
                };

                await axios.put(`https://localhost:7039/api/Workplan/${taskForTheDay.id}`, updatedTask);

            } else {
                console.warn("ไม่พบแผนงานของวันนั้น");
            }
        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการล้างโน้ตส่วนตัว:", error);
        }
    };

    const deleteTaskFromDatabase = async (dateToDelete) => {
        try {
            const res = await axios.get(`https://localhost:7039/api/Workplan/${userId}`);

            const taskForTheDay = res.data.find(t =>
                new Date(t.date).toDateString() === new Date(dateToDelete).toDateString()
            );

            if (taskForTheDay) {
                const updatedTask = {
                    ...taskForTheDay,
                    morningTask: "",
                    eveningTask: "",
                    // ✅ คงค่า privateNote เดิมไว้
                    privateNote: taskForTheDay.privateNote || "",
                    noteType: taskForTheDay.noteType || "public",
                };

                await axios.put(`https://localhost:7039/api/Workplan/${taskForTheDay.id}`, updatedTask);
            } else {
                console.warn("ไม่พบแผนงานของวันนั้น");
            }
        } catch (error) {
            console.error('ล้างแผนงานไม่สำเร็จ:', error);
        }
    };

    const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = getDaysInMonth(month, year);

    const openModal = (date) => {
        const fullDate = new Date(year, month, date);
        const dayOfWeek = fullDate.getDay();

        const key = `${userId}-${year}-${month + 1}-${date}`;
        const existing = tasks[key] || {};

        setSelectedDate(date);

        // ✅ รีเซ็ต noteType เพื่อให้ขึ้นปุ่มเลือกประเภททุกครั้ง
        setTaskData({
            morning: existing.morning || '',
            evening: existing.evening || '',
            privateNote: existing.privateNote || "",
            noteType: '', // บังคับให้เลือกใหม่ทุกครั้ง
        });

        // ✅ เช็ควันหยุด: เสาร์-อาทิตย์ หรือวันหยุดราชการ
        const dateObj = new Date(year, month, date);
        const fullDateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

        const currentYearHolidays = holidaysByYear[year] || {};
        const compensated = getCompensatedHolidays(year, currentYearHolidays);
        const thaiHolidays = { ...currentYearHolidays, ...compensated };
        const holidayName = thaiHolidays[fullDateKey];
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isThaiHoliday = !!holidayName;

        setIsHoliday(isWeekend || isThaiHoliday);
        setShowModal(true);
    };

    const saveOrUpdateTaskToDatabase = async (task) => {
        try {
            // ✨ สร้างอ็อบเจกต์ใหม่ที่แปลงชื่อ field ให้ตรงกับ backend
            const mappedTask = {
                ...task,
                PrivateNote: task.personalNote,     // ✔ แปลงชื่อให้ตรงกับ backend
                NoteType: task.noteType,            // ✔ ชื่อตรง backend แล้ว
            };

            // ดึงข้อมูลแผนในวันเดียวกัน
            const res = await axios.get(`https://localhost:7039/api/Workplan/${task.userID}`);
            const sameDayTasks = res.data.filter(t =>
                new Date(t.date).toDateString() === new Date(task.date).toDateString()
            );

            if (sameDayTasks.length > 0) {
                // แก้ไขตัวแรก และลบตัวอื่น
                await axios.put(`https://localhost:7039/api/Workplan/${sameDayTasks[0].id}`, {
                    ...mappedTask,
                    id: sameDayTasks[0].id
                });

                for (let i = 1; i < sameDayTasks.length; i++) {
                    await axios.delete(`https://localhost:7039/api/Workplan/${sameDayTasks[i].id}`);
                }
            } else {
                // บันทึกใหม่
                await axios.post('https://localhost:7039/api/Workplan', mappedTask);
            }
        } catch (error) {
        }
    };

    const saveTask = async () => {
        const key = `${userId}-${year}-${month + 1}-${selectedDate}`;
        const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
        const newTask = {
            userID: parseInt(userId),
            date: formattedDate,
            morningTask: taskData.morning,
            eveningTask: taskData.evening,
            privateNote: taskData.privateNote || "",
            noteType: taskData.noteType || "public"
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
                    ปฎิทินการทำงาน{" "}
                    <span className="font-normal font-FontNoto text-base sm:text-lg">
                        {roleText ? `(${roleText})` : ""}
                    </span>
                </h1>
                <p className="text-xs sm:text-sm mt-1 font-FontNoto">ตรวจสอบแผนการทำงาน และกิจกรรมที่เกี่ยวข้อง</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-4 mb-6 animate-fade-in ">
                {/* 🟡 การ์ดเวลาเข้า-ออก */}
                <div className="bg-gradient-to-br from-emerald-50 via-teal-100 to-cyan-50 border border-teal-400 rounded-xl p-4 shadow-md w-full sm:w-72 flex flex-col items-center relative overflow-hidden">
                    <h3 className="text-md font-bold text-teal-800 font-FontNoto mb-2 text-center">
                        ⏰ เวลาเข้า-ออกงานวันนี้
                    </h3>
                    {todayWorktime ? (
                        <div className="font-FontNoto text-xs text-gray-800 space-y-1">
                            <p className="font-FontNoto">🕘 เช็คอิน: {todayWorktime.checkIn || "-"}</p>
                            <p className="font-FontNoto">🕔 เช็คเอาท์: {todayWorktime.checkOut || "-"}</p>
                            <p className="font-FontNoto">📍 สถานที่: {todayWorktime.location || "-"}</p>
                        </div>
                    ) : (
                        <p className="font-FontNoto text-xs text-gray-500 text-center">
                            ไม่มีข้อมูลเข้า-ออก
                        </p>
                    )}
                </div>
                {/* 🌸 การ์ดแผนงานวันนี้ */}
                <div className="bg-orange-50 border border-orange-400 rounded-xl p-3 shadow-md w-full sm:w-72 flex flex-col items-center relative overflow-hidden">
                    <h3 className="text-md font-bold text-orange-800 font-FontNoto mb-2 text-center">📝 แผนงานวันนี้</h3>
                    {todayPlan ? (
                        <div className="font-FontNoto text-xs text-gray-800 space-y-1">
                            <p className="font-FontNoto">วันนี้: {todayPlan.eveningTask || "-"}</p>
                        </div>
                    ) : (
                        <p className="font-FontNoto text-xs text-gray-500 text-center">ยังไม่ได้เขียนแผนงาน</p>
                    )}
                </div>

                <div className="bg-green-50 border border-green-400 rounded-xl p-3 shadow-md w-full sm:w-72 flex flex-col items-center relative overflow-hidden">
                    <h3 className="text-md font-bold text-green-800 font-FontNoto mb-2 text-center">🌙 แผนงาน{yesterdayLabel}</h3>
                    {todayPlan ? (
                        <div className="font-FontNoto text-xs text-gray-800 space-y-1 text-center">
                            <p className="font-FontNoto">{yesterdayLabel}: {todayPlan.morningTask || "-"}</p>
                        </div>
                    ) : (
                        <p className="font-FontNoto text-xs text-gray-500 text-center">ยังไม่ได้เขียนแผนงาน</p>
                    )}
                </div>
            </div>

            <div className="w-full max-w-6xl mx-auto bg-transparent rounded-xl p-6 items-center justify-center">
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
                    {/* หัวตารางวัน */}
                    <div className="grid grid-cols-7 gap-[1px] text-center font-bold bg-gray-400">
                        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                            <div key={day} className="bg-gray-100 py-2 font-FontNoto text-sm text-gray-700">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* ตัววันในปฏิทิน */}
                    <div className="grid grid-cols-7 gap-[1px] bg-gray-300">
                        {weeks.map((week, wi) =>
                            week.map((dayObj, di) => {
                                const { day, type, date } = dayObj;
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                const isCurrentMonth = type === 'current';

                                // ✅ ดึงชื่อวันหยุดจาก holidaysByYear โดยไม่จำกัดแค่เดือนปัจจุบัน
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const dayStr = String(date.getDate()).padStart(2, '0');
                                const holidayName = holidaysByYear[year]?.[`${month}-${dayStr}`] || null;

                                const dateKey = `${userId}-${year}-${date.getMonth() + 1}-${date.getDate()}`;
                                const morning = tasks[dateKey]?.morning;
                                const evening = tasks[dateKey]?.evening;
                                const privateNote = tasks[dateKey]?.privateNote;
                                return (
                                    <div
                                        key={`${wi}-${di}`}
                                        onClick={() => isCurrentMonth && openModal(day)}
                                        className={`
                    bg-white h-24 p-1 text-xs font-FontNoto cursor-pointer
                    ${!isCurrentMonth ? 'bg-gray-100 text-gray-400' : ''}
                `}
                                    >
                                        <div className="text-right font-semibold">{day}</div>

                                        {holidayName && (
                                            <div className="text-[10px] text-red-500 leading-tight font-FontNoto">{holidayName}</div>
                                        )}

                                        <div className="text-[8px] mt-1 space-y-1">
                                            {morning && (
                                                <div className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded-sm font-FontNoto">
                                                    {morning}
                                                </div>
                                            )}
                                            {evening && (
                                                <div className="bg-green-100 text-green-800 px-1 py-0.5 rounded-sm font-FontNoto">
                                                    {evening}
                                                </div>
                                            )}
                                            {/* ✅ แสดงโน้ตส่วนตัว ถ้ามี */}
                                            {privateNote && (
                                                <div className="bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded-sm truncate font-FontNoto">
                                                    🗒️ {privateNote}
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
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-96 relative transition-transform duration-300 ease-in-out transform scale-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-pink-600 font-FontNoto">
                                📅 {selectedDate}/{month + 1}/{year + 543}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setTaskData({}); // เคลียร์เมื่อปิด
                                }}
                                className="text-red-500 text-lg font-bold hover:scale-110 transition"
                            >
                                ❌
                            </button>
                        </div>

                        {/* Step 1: เลือกประเภท */}
                        {!taskData.noteType && (
                            <div className="mb-4 flex flex-col gap-3 items-center">
                                <p className="text-center font-bold text-gray-700 font-FontNoto">เลือกประเภทที่ต้องการเพิ่ม</p>
                                <button
                                    className="btn btn-info w-full font-FontNoto"
                                    onClick={() => setTaskData({ ...taskData, noteType: "public" })}
                                >
                                    🗓️ แผนงาน (เพื่อนๆ เห็นได้)
                                </button>
                                <button
                                    className="btn btn-warning w-full font-FontNoto"
                                    onClick={() => setTaskData({ ...taskData, noteType: "private" })}
                                >
                                    🔒 โน้ตส่วนตัว (เห็นคนเดียว)
                                </button>
                            </div>
                        )}

                        {/* Step 2: ถ้าเลือกแล้ว ค่อยแสดงฟอร์ม */}
                        {taskData.noteType === "public" && (
                            <div className="mb-4">
                                <div className="mb-4">
                                    <label className="block mb-1 font-bold text-blue-600 font-FontNoto">{yesterdayLabel}</label>
                                    <textarea
                                        className="textarea textarea-bordered w-full bg-blue-50 font-FontNoto"
                                        value={taskData.morning || ""}
                                        placeholder="กรอกงานเมื่อวาน"
                                        onChange={(e) => setTaskData({ ...taskData, morning: e.target.value })}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block mb-1 font-bold text-green-600 font-FontNoto">วันนี้</label>
                                    <textarea
                                        className="textarea textarea-bordered w-full bg-green-50 font-FontNoto"
                                        value={taskData.evening || ""}
                                        placeholder="กรอกงานวันนี้"
                                        onChange={(e) => setTaskData({ ...taskData, evening: e.target.value })}
                                    />
                                </div>

                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        className="btn btn-outline btn-error font-FontNoto"
                                        onClick={async () => {
                                            const date = new Date(year, month, selectedDate);
                                            await deleteTaskFromDatabase(date);

                                            const key = `${userId}-${year}-${month + 1}-${selectedDate}`;
                                            const updated = { ...tasks };
                                            if (updated[key]) {
                                                updated[key].morning = "";
                                                updated[key].evening = "";
                                            }
                                            setTasks(updated);

                                            if (
                                                new Date().getDate() === selectedDate &&
                                                new Date().getMonth() === month &&
                                                new Date().getFullYear() === year
                                            ) {
                                                setTodayPlan(prev => prev ? { ...prev, morning: "", evening: "" } : null);
                                            }

                                            setShowModal(false);
                                        }}
                                    >
                                        ลบแผนงาน
                                    </button>
                                    <button className="btn btn-outline btn-success font-FontNoto" onClick={saveTask}>
                                        บันทึก
                                    </button>
                                </div>
                            </div>
                        )}

                        {taskData.noteType === "private" && (
                            <div className="mb-4">
                                <label className="block mb-1 font-bold text-purple-600 font-FontNoto">🔒 โน้ตส่วนตัว</label>
                                <textarea
                                    className="textarea textarea-bordered w-full bg-purple-50 font-FontNoto"
                                    value={taskData.privateNote || ""}
                                    placeholder="เขียนโน้ตที่เห็นคนเดียว"
                                    onChange={(e) => setTaskData({ ...taskData, privateNote: e.target.value })}
                                />

                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        className="btn btn-outline btn-warning font-FontNoto"
                                        onClick={async () => {
                                            const date = new Date(year, month, selectedDate);
                                            await clearPrivateNoteFromDatabase(date);

                                            const key = `${userId}-${year}-${month + 1}-${selectedDate}`;
                                            const updatedTasks = { ...tasks };
                                            if (updatedTasks[key]) {
                                                updatedTasks[key].privateNote = "";
                                            }
                                            setTasks(updatedTasks);

                                            if (
                                                date.getDate() === new Date().getDate() &&
                                                date.getMonth() === new Date().getMonth() &&
                                                date.getFullYear() === new Date().getFullYear()
                                            ) {
                                                setTodayPlan(prev => prev ? { ...prev, privateNote: "" } : null);
                                            }
                                            setShowModal(false);
                                        }}
                                    >
                                        ลบโน้ตส่วนตัว
                                    </button>
                                    <button className="btn btn-outline btn-success font-FontNoto" onClick={saveTask}>
                                        บันทึก
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default Workplan;
