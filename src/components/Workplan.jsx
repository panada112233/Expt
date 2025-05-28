import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AOS from 'aos';
import { FcOvertime, FcConferenceCall, FcExpired, FcOrganization } from "react-icons/fc";
import remove from '../assets/remove.png';
import bin from '../assets/icons8-bin-24.png';
import calendar from '../assets/calendar1.png';
import calenda from '../assets/calendar.png';
import note from '../assets/post-it.png';
import 'aos/dist/aos.css';

const Workplan = () => {
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth());
    const [year, setYear] = useState(today.getFullYear());
    const [tasks, setTasks] = useState({});
    const [selectedDate, setSelectedDate] = useState(null);
    const [taskData, setTaskData] = useState({ morning: '', evening: '', privateNote: [], privateNoteTitles: [], noteType: '' });
    const [showModal, setShowModal] = useState(false);
    const [userName, setUserName] = useState('พนักงาน');
    const [userId, setUserId] = useState(null);
    const [roleText, setRoleText] = useState("กำลังโหลด...");
    const [isHoliday, setIsHoliday] = useState(false);
    const [todayWorktime, setTodayWorktime] = useState(null);
    const [notes, setNotes] = useState({});
    const [monthlyWorktime, setMonthlyWorktime] = useState({});
    const [confirmDeleteIdx, setConfirmDeleteIdx] = useState(null);
    const [selectedDay, setSelectedDay] = useState("yesterday");
    const [todayPlan, setTodayPlan] = useState(null);
    const [summaryDay, setSummaryDay] = useState("yesterday");
    const [activeTab, setActiveTab] = useState("calendar");
    const [allPlans, setAllPlans] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [editedNote, setEditedNote] = useState("");
    const [editedTitle, setEditedTitle] = useState("");
    const [searchTerm, setSearchTerm] = useState("");



    const [viewDetail, setViewDetail] = useState(null);
    const [historyDate, setHistoryDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0]; // รูปแบบ yyyy-MM-dd
    });


    const thaiDayNames = {
        "sunday": "วันอาทิตย์",
        "monday": "วันจันทร์",
        "tuesday": "วันอังคาร",
        "wednesday": "วันพุธ",
        "thursday": "วันพฤหัสบดี",
        "friday": "วันศุกร์",
        "saturday": "วันเสาร์",
        "yesterday": "เมื่อวาน"
    };
    const filteredPlans = allPlans.filter((p) => {
        const d = new Date(p.date);
        return d.getMonth() + 1 === month + 1 && d.getFullYear() === year && (p.morningTask || p.eveningTask);
    });
    const groupedPlans = filteredPlans.reduce((acc, plan) => {
        const d = new Date(plan.date);
        const key = d.toISOString().split('T')[0];
        if (!acc[key]) acc[key] = [];
        acc[key].push(plan);
        return acc;
    }, {});

    const getFullName = (userId) => {
        const user = allUsers.find((u) => u.userID === userId);
        return user ? `${user.firstName} ${user.lastName}` : "ไม่ทราบชื่อ";
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("th-TH", {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    const getCompensatedHolidays = (year, holidays) => {
        const compensated = {};
        // สร้าง Set ของวันที่มีการใช้งานแล้ว (ทั้งวันหยุดปกติและวันหยุดชดเชย)
        const usedDates = new Set(Object.keys(holidays));

        Object.entries(holidays).forEach(([key, name]) => {
            const [mm, dd] = key.split('-');
            const date = new Date(`${year}-${mm}-${dd}`);
            const day = date.getDay();

            if (day === 0 || day === 6) {
                // ถ้าเป็นเสาร์-อาทิตย์ → หา "วันทำงานถัดไป" ที่ยังไม่ถูกใช้
                let next = new Date(date);
                let maxAttempts = 10; // ป้องกันลูปไม่สิ้นสุด
                let attemptCount = 0;

                do {
                    next.setDate(next.getDate() + 1);
                    const newKey = `${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;

                    // ตรวจสอบว่าไม่ซ้ำกับวันหยุดที่มีอยู่แล้ว และไม่ใช่วันเสาร์-อาทิตย์
                    if (!usedDates.has(newKey) && (next.getDay() !== 0 && next.getDay() !== 6)) {
                        compensated[newKey] = `ชดเชย${name}`;
                        usedDates.add(newKey); // เพิ่มวันหยุดชดเชยเข้าไปใน Set
                        break;
                    }
                    attemptCount++;
                    if (attemptCount >= maxAttempts) {
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

    // แก้ตรงนี้ให้แน่ใจว่าวันหยุดชดเชยถูกรวมเข้าไปใน thaiHolidays
    const currentYearHolidays = holidaysByYear[year] || {};
    const compensated = getCompensatedHolidays(year, currentYearHolidays);
    const thaiHolidays = { ...currentYearHolidays, ...compensated };

    const getDateFromSelectedDay = (selectedDay, specificDate = null) => {
        // ถ้ามีการระบุวันที่เฉพาะ (เช่นเมื่อเลือกวันในปฏิทิน)
        const baseDate = specificDate ? new Date(specificDate) : new Date();
        let targetDate = new Date(baseDate);

        if (selectedDay === "yesterday") {
            // ถอยหลังไป 1 วัน
            targetDate.setDate(baseDate.getDate() - 1);
        } else {
            // แปลงชื่อวันเป็นตัวเลข
            const dayMapping = {
                "sunday": 0,
                "monday": 1,
                "tuesday": 2,
                "wednesday": 3,
                "thursday": 4,
                "friday": 5,
                "saturday": 6
            };

            // หาวันที่ต้องการในสัปดาห์ที่ผ่านมา
            const currentDayOfWeek = baseDate.getDay();
            let daysToSubtract = currentDayOfWeek - dayMapping[selectedDay];

            if (daysToSubtract <= 0) {
                daysToSubtract += 7; // ถอยไปสัปดาห์ที่แล้ว
            }

            targetDate.setDate(baseDate.getDate() - daysToSubtract);
        }

        return targetDate;
    };
    const getPreviousDayPlan = (selectedDay, specificDate = null) => {
        const targetDate = getDateFromSelectedDay(selectedDay, specificDate);
        const targetKey = `${userId}-${targetDate.getFullYear()}-${targetDate.getMonth() + 1}-${targetDate.getDate()}`;
        return tasks[targetKey]?.evening || '';
    };

    useEffect(() => {
        const loadUserDataAndTodayData = async () => {
            const id = parseInt(sessionStorage.getItem('userId'));
            if (!id) return;
            setUserId(id);

            try {
                // 🔹 โหลดข้อมูลผู้ใช้
                const userRes = await axios.get(`https://192.168.1.188/hrwebapi/api/Users/Getbyid/${id}`);
                if (userRes.status === 200) {
                    const userData = userRes.data;
                    setUserName(`${userData.firstName} ${userData.lastName}`);

                    const role = userData.role;
                    const mapped = roleMapping[role] || "ไม่ทราบตำแหน่ง";
                    setRoleText(mapped);
                }

                // 🔹 โหลดแผนงานทั้งหมดของผู้ใช้
                const planRes = await axios.get(`https://192.168.1.188/hrwebapi/api/Workplan/${id}`);
                const loadedTasks = {};
                const today = new Date();
                const todayKey = `${id}-${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

                planRes.data.forEach((t) => {
                    const d = new Date(t.date);
                    const key = `${t.userID}-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

                    loadedTasks[key] = {
                        morning: t.morningTask,
                        evening: t.eveningTask,
                        privateNote: t.privateNote || "",
                        noteType: t.noteType || "public"
                    };

                    if (
                        d.getFullYear() === today.getFullYear() &&
                        d.getMonth() === today.getMonth() &&
                        d.getDate() === today.getDate()
                    ) {
                        setTodayPlan({
                            ...t,
                            privateNote: t.privateNote || "",
                            noteType: t.noteType || "public"
                        });
                    }
                });

                setTasks(loadedTasks);

                // 🔹 โหลดข้อมูลเวลาเข้า-ออกทั้งหมดของผู้ใช้
                const worktimeRes = await axios.get("https://192.168.1.188/hrwebapi/api/Worktime");
                const allWorktimes = worktimeRes.data.filter(item => item.userID === id);

                // แปลงเป็น map: key = userID-year-month-day
                const worktimeMap = {};
                allWorktimes.forEach(item => {
                    const d = new Date(item.date);
                    const key = `${item.userID}-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
                    worktimeMap[key] = item;
                });

                setMonthlyWorktime(worktimeMap); // ✅ ใช้สำหรับปฏิทิน

                // 🔹 สำหรับวันนี้โดยเฉพาะ
                const todayWorkKey = `${id}-${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
                setTodayWorktime(worktimeMap[todayWorkKey] || {});

            } catch (error) {
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
        const fetchAllPlansAndUsers = async () => {
            try {
                const [planRes, userRes] = await Promise.all([
                    axios.get("https://192.168.1.188/hrwebapi/api/Workplan"),
                    axios.get("https://192.168.1.188/hrwebapi/api/Users"),
                ]);
                setAllPlans(planRes.data);
                setAllUsers(userRes.data);
            } catch (err) {
                console.error("โหลดข้อมูลรวมล้มเหลว:", err);
            }
        };

        fetchAllPlansAndUsers();
    }, []);
    useEffect(() => {
        const storedNotes = JSON.parse(localStorage.getItem("notes") || "{}");
        setNotes(storedNotes);
    }, []);


    const clearPrivateNoteFromDatabase = async (dateToClear) => {
        try {
            const res = await axios.get(`https://192.168.1.188/hrwebapi/api/Workplan/${userId}`);

            const taskForTheDay = res.data.find(t =>
                new Date(t.date).toDateString() === new Date(dateToClear).toDateString()
            );

            if (taskForTheDay) {
                const updatedTask = {
                    ...taskForTheDay,
                    privateNote: "", // ✅ ล้างโน้ตส่วนตัว
                };

                await axios.put(`https://192.168.1.188/hrwebapi/api/Workplan/${taskForTheDay.id}`, updatedTask);

            } else {
            }
        } catch (error) {
        }
    };

    const deleteTaskFromDatabase = async (dateToDelete) => {
        try {
            const res = await axios.get(`https://192.168.1.188/hrwebapi/api/Workplan/${userId}`);

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

                await axios.put(`https://192.168.1.188/hrwebapi/api/Workplan/${taskForTheDay.id}`, updatedTask);
            } else {
            }
        } catch (error) {
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

        // แปลง privateNote ให้ปลอดภัยเสมอ
        let privateNoteArray = [];
        let privateNoteTitlesArray = [];

        if (typeof existing.privateNote === "string" && existing.privateNote.trim() !== "") {
            const rawNotes = existing.privateNote.split('\n\n');
            rawNotes.forEach(n => {
                const titleMatch = n.match(/หัวข้อ:\s*(.*)/);
                const detailMatch = n.match(/รายละเอียด:\s*([\s\S]*)/);
                privateNoteTitlesArray.push(titleMatch ? titleMatch[1] : "");
                privateNoteArray.push(detailMatch ? detailMatch[1].trim() : "");
            });
        } else if (Array.isArray(existing.privateNote)) {
            privateNoteArray = existing.privateNote;
            privateNoteTitlesArray = existing.privateNoteTitles || new Array(existing.privateNote.length).fill("");
        } else {
            privateNoteArray = [""];
            privateNoteTitlesArray = [""];
        }

        const savedNoteType = existing.noteType || "public";
        const specificDate = new Date(year, month, date);
        const prevPlan = getPreviousDayPlan(selectedDay, specificDate);

        setTaskData({
            morning: existing.morning || '',
            evening: existing.evening || '',
            privateNote: privateNoteArray,
            privateNoteTitles: privateNoteTitlesArray,
            noteType: "",
            _cachedNoteType: savedNoteType
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
                PrivateNote: task.privateNote,     // ✔ แปลงชื่อให้ตรงกับ backend
                NoteType: task.noteType,            // ✔ ชื่อตรง backend แล้ว
            };

            // ดึงข้อมูลแผนในวันเดียวกัน
            const res = await axios.get(`https://192.168.1.188/hrwebapi/api/Workplan/${task.userID}`);
            const sameDayTasks = res.data.filter(t =>
                new Date(t.date).toDateString() === new Date(task.date).toDateString()
            );

            if (sameDayTasks.length > 0) {
                // แก้ไขตัวแรก และลบตัวอื่น
                await axios.put(`https://192.168.1.188/hrwebapi/api/Workplan/${sameDayTasks[0].id}`, {
                    ...mappedTask,
                    id: sameDayTasks[0].id
                });

                for (let i = 1; i < sameDayTasks.length; i++) {
                    await axios.delete(`https://192.168.1.188/hrwebapi/api/Workplan/${sameDayTasks[i].id}`);
                }
            } else {
                // บันทึกใหม่
                await axios.post('https://192.168.1.188/hrwebapi/api/Workplan', mappedTask);
            }
        } catch (error) {
        }
    };

    const saveTask = async () => {
        const key = `${userId}-${year}-${month + 1}-${selectedDate}`;
        const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;

        // ตรวจสอบและแปลงค่า privateNote ให้เป็นสตริงถ้าเป็นอาร์เรย์
        let privateNoteValue = taskData.privateNote || "";
        if (Array.isArray(privateNoteValue)) {
            privateNoteValue = privateNoteValue.join('\n');
        }

        const newTask = {
            userID: parseInt(userId),
            date: formattedDate,
            morningTask: taskData.morning,
            eveningTask: taskData.evening,
            privateNote: privateNoteValue,
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
            <div className="w-full bg-gradient-to-r from-cyan-100 via-blue-100 to-blue-50 text-white rounded-xl p-4 sm:p-5 md:p-6 mb-6 shadow-lg">
                <h1 className="text-xl sm:text-2xl text-cyan-950 font-bold font-FontNoto leading-snug">
                    ภาพรวมการทำงานวันนี้
                </h1>
                <p className="text-xs sm:text-sm mt-1 text-cyan-950 font-FontNoto">
                    ตรวจสอบแผนการทำงาน และกิจกรรมที่เกี่ยวข้อง
                </p>
            </div>
            <h2 className="text-base sm:text-lg text-cyan-950 font-bold font-FontNoto leading-snug">
                แจ้งเตือนวันนี้
            </h2>
            <div className="flex flex-wrap gap-4 mt-4 mb-6 animate-fade-in">
                {/* 🟡 การ์ดเวลาเข้า-ออก */}
                <div className="w-full sm:w-[350px] group rounded-xl bg-gradient-to-r from-pink-100 via-pink-200 to-rose-100 p-5 shadow-md transition duration-300 cursor-pointer hover:translate-y-[3px] hover:shadow-xl relative">
                    <p className="text-blue-950 font-semibold text-xl font-FontNoto mb-2">เวลาเข้า-เลิกงาน วันนี้</p>
                    {todayWorktime ? (
                        <div className="font-FontNoto text-sm text-blue-950 space-y-1">
                            <p className="font-FontNoto">เช็คอิน: {todayWorktime.checkIn || "-"}</p>
                            <p className="font-FontNoto">เช็คเอาท์: {todayWorktime.checkOut || "-"}</p>
                            <p className="font-FontNoto">ประเภทการทำงาน: {todayWorktime.location || "-"}</p>
                        </div>
                    ) : (
                        <p className="text-blue-950 text-sm font-FontNoto">ไม่มีข้อมูลเข้า-ออก</p>
                    )}
                    <FcExpired className="absolute right-[10%] top-[50%] translate-y-[-50%] opacity-90 group-hover:opacity-100 group-hover:scale-110 transition duration-300 w-16 h-16 text-blue-700" />
                </div>

                {/* 🌸 การ์ดแผนงานวันนี้ */}
                <div className="w-full sm:w-[350px] group rounded-xl bg-gradient-to-r from-green-100 via-green-200 to-lime-100 p-5 shadow-md transition duration-300 cursor-pointer hover:translate-y-[3px] hover:shadow-xl relative">
                    <p className="text-blue-950 font-semibold text-xl font-FontNoto mb-2">แผนงานวันนี้</p>
                    {todayPlan ? (
                        <p className="font-FontNoto text-sm text-blue-950">วันนี้: {todayPlan.eveningTask || "-"}</p>
                    ) : (
                        <p className="text-blue-950 text-sm font-FontNoto">ยังไม่ได้เขียนแผนงาน</p>
                    )}
                    <FcConferenceCall className="absolute right-[10%] top-[50%] translate-y-[-50%] opacity-90 group-hover:opacity-100 group-hover:scale-110 transition duration-300 w-16 h-16 text-blue-700" />
                </div>

                {/* 🌙 การ์ดแผนงานย้อนหลัง */}
                <div className="w-full sm:w-[350px] group rounded-xl bg-gradient-to-r from-sky-200 via-blue-100 to-white p-5 shadow-md transition duration-300 cursor-pointer hover:translate-y-[3px] hover:shadow-xl relative">
                    <p className="text-blue-950 font-semibold text-xl font-FontNoto mb-2">แผนงานย้อนหลัง</p>
                    <p className="font-FontNoto text-sm text-blue-950">
                        เมื่อวาน: {getPreviousDayPlan(summaryDay) || "-"}
                    </p>
                    <FcOvertime className="absolute right-[10%] top-[50%] translate-y-[-50%] opacity-90 group-hover:opacity-100 group-hover:scale-110 transition duration-300 w-16 h-16 text-blue-700" />
                </div>
            </div>

            <h2 className="text-base sm:text-lg text-cyan-950 font-bold font-FontNoto leading-snug">
                แผนการทำงาน
            </h2>
            <div className="flex gap-4 border-b border-gray-300 mb-4 mt-6">
                <button
                    onClick={() => setActiveTab("calendar")}
                    className={`py-2 px-4 font-FontNoto font-bold ${activeTab === "calendar" ? "border-b-4 border-blue-500 text-blue-600" : "text-gray-500"}`}
                >
                    ปฏิทินการทำงาน
                </button>
                <button
                    onClick={() => setActiveTab("history")}
                    className={`py-2 px-4 font-FontNoto font-bold ${activeTab === "history" ? "border-b-4 border-blue-500 text-blue-600" : "text-gray-500"}`}
                >
                    ประวัติแผนงาน
                </button>
            </div>

            {activeTab === "history" && (
                <div className="w-full max-w-8xl mx-auto bg-gradient-to-br from-blue-50 via-cyan-50 to-white rounded-3xl p-6 shadow-md items-center justify-center">
                    {/* สร้างตัวแปรก่อนใช้ */}
                    {(() => {
                        const selectedDate = new Date(historyDate);
                        const yesterday = new Date(selectedDate);
                        yesterday.setDate(selectedDate.getDate() - 1);

                        const selectedKey = selectedDate.toISOString().split("T")[0];
                        const yesterdayKey = yesterday.toISOString().split("T")[0];

                        const rolePriority = {
                            GM: 1,
                            Hr: 2,
                            BA: 3,
                            Dev: 4,
                            Employee: 5,
                        };

                        const usersWithPlans = allUsers
                            .filter((user) =>
                                `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map((user) => {
                                const todayPlan = allPlans.find(
                                    (p) => p.userID === user.userID && p.date.startsWith(selectedKey)
                                );
                                const yestPlan = allPlans.find(
                                    (p) => p.userID === user.userID && p.date.startsWith(yesterdayKey)
                                );
                                return {
                                    userID: user.userID,
                                    fullName: `${user.firstName} ${user.lastName}`,
                                    role: user.role, // เพิ่ม role มาให้สำหรับจัดเรียง
                                    morningTask: yestPlan?.eveningTask || "-",
                                    eveningTask: todayPlan?.eveningTask || "-",
                                };
                            })
                            .sort((a, b) => (rolePriority[a.role] || 99) - (rolePriority[b.role] || 99)); // เรียงตามลำดับตำแหน่ง



                        return (
                            <div className="relative  font-FontNoto mb-8  animate-fade-in ">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                                    {/* ซ้าย: วันที่ + คนลงแผน */}
                                    <div>
                                        <h3 className="font-semibold text-lg font-FontNoto">
                                            {(() => {
                                                const daysInThai = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];
                                                const dayName = daysInThai[selectedDate.getDay()];
                                                const todayCount = usersWithPlans.filter(p =>
                                                    p.eveningTask && p.eveningTask.trim() !== "-"
                                                ).length;

                                                return (
                                                    <>
                                                        วันที่ : {dayName} ที่ {selectedDate.toLocaleDateString("th-TH", {
                                                            day: "2-digit",
                                                            month: "long",
                                                            year: "numeric",
                                                        })}
                                                        {todayCount > 0 && (
                                                            <span className="text-green-700 font-FontNoto font-bold ml-2"> ลงแผนงานแล้ว {todayCount} คน</span>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </h3>
                                    </div>

                                    {/* ขวา: ช่องเลือกวันที่ + ค้นหา */}
                                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                                        <input
                                            type="date"
                                            value={historyDate}
                                            onChange={(e) => setHistoryDate(e.target.value)}
                                            className="input input-bordered font-FontNoto w-full sm:w-40 bg-white text-black"
                                            style={{ colorScheme: "light" }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="ค้นหาชื่อพนักงาน..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="input input-bordered font-FontNoto w-full sm:w-64 bg-white text-black"
                                        />
                                    </div>
                                </div>

                                <div className="overflow-x-auto ">
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                        {usersWithPlans.map((rec, idx) => (
                                            <div
                                                key={idx}
                                                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-md hover:shadow-xl transition-all duration-300"
                                            >
                                                {/* ชื่อพนักงาน + รูปโปรไฟล์ */}
                                                <div className="flex items-center mb-3 bg-gray-200 rounded-2xl">
                                                    <img
                                                        src={`https://192.168.1.188/hrwebapi/api/Files/GetProfileImage?userID=${rec.userID}`}
                                                        alt={rec.fullName}
                                                        className="w-10 h-10 rounded-full border border-gray-300 mr-3 object-cover font-FontNoto"
                                                    />
                                                    <div>
                                                        <p className="font-bold text-black font-FontNoto">{rec.fullName}</p>
                                                        <p className="text-sm text-gray-600 font-FontNoto">
                                                            {
                                                                roleMapping[
                                                                allUsers.find(u => u.userID === rec.userID)?.role
                                                                ] || "-"
                                                            }
                                                        </p>
                                                    </div>
                                                </div>


                                                {/* แผนงานเมื่อวาน */}
                                                <div className="mb-3">
                                                    <p className="text-sm  font-semibold font-FontNoto mb-1">
                                                        เมื่อวาน ({yesterday.toLocaleDateString("th-TH", { weekday: "long" }).replace("วัน", "")})
                                                    </p>
                                                    <ul className="list-disc list-inside text-sm text-black font-FontNoto space-y-1">
                                                        {rec.morningTask
                                                            ? rec.morningTask.split("\n").map((task, index) => (
                                                                <li className="font-FontNoto" key={index}>{task}</li>
                                                            ))
                                                            : <li>-</li>}
                                                    </ul>
                                                </div>

                                                {/* แผนงานวันนี้ */}
                                                <div>
                                                    <p className="text-sm  font-semibold font-FontNoto mb-1">
                                                        วันนี้ ({selectedDate.toLocaleDateString("th-TH", { weekday: "long" }).replace("วัน", "")})
                                                    </p>
                                                    <ul className="list-disc list-inside text-sm text-green-700 font-FontNoto space-y-1">
                                                        {rec.eveningTask
                                                            ? rec.eveningTask.split("\n").map((task, index) => (
                                                                <li className="font-FontNoto" key={index}>{task}</li>
                                                            ))
                                                            : <li>-</li>}
                                                    </ul>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                </div>

                            </div>
                        );
                    })()}
                </div>
            )}

            {activeTab === "calendar" && (
                <div className="w-full max-w-7xl mx-auto bg-slate-50 rounded-xl p-6 items-center justify-center">
                    <div className="flex items-center justify-center gap-x-2 mb-2">
                        <FcOrganization className="w-8 h-8" />
                        <h2 className="sm:text-xl font-bold font-FontNoto text-blue-950 text-center">
                            ปฏิทินบันทึกการทำงาน
                        </h2>
                    </div>

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
                            {["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"].map((day) => (
                                <div key={day} className="bg-gray-300 py-2 font-FontNoto text-sm text-gray-700">
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
                                    const isToday =
                                        date.getDate() === new Date().getDate() &&
                                        date.getMonth() === new Date().getMonth() &&
                                        date.getFullYear() === new Date().getFullYear();

                                    const year = date.getFullYear();
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const dayStr = String(date.getDate()).padStart(2, '0');

                                    // คีย์สำหรับ tasks และ worktime
                                    const fullDateKey = `${userId}-${year}-${parseInt(month)}-${parseInt(dayStr)}`;
                                    const worktimeKey = `${year}-${month}-${dayStr}`;
                                    const mmddKey = `${month}-${dayStr}`;

                                    const morning = tasks[fullDateKey]?.morning;
                                    const evening = tasks[fullDateKey]?.evening;
                                    const privateNote = tasks[fullDateKey]?.privateNote;
                                    const workLocation = monthlyWorktime[fullDateKey]?.location;

                                    // รวมวันหยุด + วันหยุดชดเชย
                                    const currentYearHolidays = holidaysByYear[year] || {};
                                    const compensated = getCompensatedHolidays(year, currentYearHolidays);
                                    const allHolidays = { ...currentYearHolidays, ...compensated };

                                    // ตรวจสอบชื่อวันหยุด
                                    const holidayName = allHolidays[mmddKey] || null;

                                    return (
                                        <div
                                            key={`${wi}-${di}`}
                                            onClick={() => isCurrentMonth && openModal(day)}
                                            className={`
    h-24 p-1 text-xs font-FontNoto cursor-pointer
    ${!isCurrentMonth ? 'bg-gray-100 text-gray-400' : 'bg-white'}
    ${isToday ? '!bg-blue-100' : ''}
  `}
                                        >
                                            <div className="text-right font-semibold">{day}</div>
                                            {holidayName && (
                                                <div className="text-[10px] text-red-500 leading-tight font-FontNoto">{holidayName}</div>
                                            )}

                                            <div className="text-[8px] mt-1 space-y-1">
                                                {workLocation?.includes("ลา") && (
                                                    <div className="bg-pink-100 text-pink-800 px-1 py-0.5 rounded-sm truncate font-FontNoto">
                                                        {workLocation}
                                                    </div>
                                                )}
                                                {morning && (
                                                    <div
                                                        className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded-sm truncate font-FontNoto cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // ป้องกันการเปิด modal ของวัน
                                                            setViewDetail({ title: "แผนงานเมื่อวาน", content: morning });
                                                        }}
                                                    >
                                                        เมื่อวาน : {morning}
                                                    </div>
                                                )}

                                                {evening && (
                                                    <div
                                                        className="bg-green-100 text-green-800 px-1 py-0.5 rounded-sm truncate font-FontNoto cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setViewDetail({ title: "แผนงานวันนี้", content: evening });
                                                        }}
                                                    >
                                                        วันนี้ : {evening}
                                                    </div>
                                                )}
                                                {(() => {
                                                    const noteArray = Array.isArray(privateNote)
                                                        ? privateNote
                                                        : typeof privateNote === 'string'
                                                            ? privateNote.split('\n\n')
                                                            : [];

                                                    const filteredNotes = noteArray.filter(n => n.trim() !== "");

                                                    if (filteredNotes.length > 0) {
                                                        return (
                                                            <div
                                                                className="bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded-sm truncate font-FontNoto cursor-pointer"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setViewDetail({
                                                                        title: `โน้ตทั้งหมด (${filteredNotes.length})`,
                                                                        content: filteredNotes.join('\n\n')
                                                                    });
                                                                }}
                                                            >
                                                                📝 Note ({filteredNotes.length})
                                                            </div>
                                                        );
                                                    }

                                                    return null;
                                                })()}

                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}
            {viewDetail && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="relative bg-white p-6 rounded-xl w-[90%] max-w-md shadow-xl font-FontNoto border border-gray-300">

                        {/* ปุ่มปิด */}
                        <button
                            onClick={() => {
                                setViewDetail(null);
                                setIsEditingNote(false);
                            }}
                            className="absolute top-3 right-3 text-gray-600 hover:text-red-500 text-xl font-bold"
                        >
                            ×
                        </button>

                        <h2 className="text-xl font-bold text-cyan-950 mb-3 font-FontNoto">รายละเอียด</h2>

                        <h3 className="sm:text-base font-bold text-gray-800 mb-3 flex items-center gap-2 font-FontNoto">
                            {viewDetail.title?.startsWith("โน้ตทั้งหมด") ? (
                                <>
                                    <span className="font-FontNoto" role="img" aria-label="note"></span>
                                    {isEditingNote ? (
                                        <input
                                            type="text"
                                            value={editedTitle}
                                            onChange={(e) => setEditedTitle(e.target.value)}
                                            className="input input-bordered input-sm font-FontNoto w-full"
                                        />
                                    ) : (
                                        <span className="font-FontNoto">{viewDetail.title}</span>
                                    )}
                                </>
                            ) : viewDetail.title === "แผนงานเมื่อวาน" ? (
                                <>
                                    <span className="font-FontNoto" role="img" aria-label="clipboard">📋 เมื่อวาน</span>
                                </>
                            ) : (
                                <>
                                    <span className="font-FontNoto" role="img" aria-label="calendar">📅 วันนี้</span>
                                </>
                            )}
                        </h3>

                        {viewDetail.title?.startsWith("โน้ตทั้งหมด") ? (
                            <div className="space-y-4">
                                {viewDetail.content.split('\n\n').map((block, idx) => {
                                    const titleMatch = block.match(/หัวข้อ:\s*(.*)/);
                                    const detailMatch = block.match(/รายละเอียด:\s*([\s\S]*)/);

                                    const title = titleMatch ? titleMatch[1] : "";
                                    const detail = detailMatch ? detailMatch[1].trim() : "";

                                    return (
                                        <div
                                            key={idx}
                                            className="border border-gray-300 rounded-lg p-4 shadow-md bg-white"
                                        >
                                            <p className="font-bold text-blue-900 font-FontNoto">หัวข้อ: {title || "-"}</p>
                                            <p className="ml-2 text-gray-700 font-FontNoto whitespace-pre-line">รายละเอียด: {detail || "-"}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed border border-gray-300 rounded-lg p-4 shadow-sm">
                                {viewDetail.content.split('\n').map((line, idx) => (
                                    <p key={idx} className="mb-1 font-FontNoto"> {line}</p>
                                ))}
                            </div>
                        )}

                    </div>
                </div>
            )}

            {showModal && (
                <div
                    className="fixed inset-0 bg-opacity-40 flex items-center justify-center z-50 animate-fade-in"
                    data-aos="zoom-in"
                    data-aos-duration="800"
                >
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-96 relative transition-transform duration-300 ease-in-out transform scale-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-cyan-950 font-FontNoto flex items-center gap-1">
                                <img src={calenda} alt="calendar" className="w-6 h-6" />
                                {selectedDate}/{month + 1}/{year + 543}
                            </h3>

                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setTaskData({}); // เคลียร์เมื่อปิด
                                }}
                                className="text-red-500 text-lg font-bold hover:scale-110 transition"
                            >
                                <img src={remove} alt="remove" className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Step 1: เลือกประเภท */}
                        {!taskData.noteType && (
                            <div className="mb-4 flex flex-col gap-3 items-center">
                                <p className="text-center font-bold text-cyan-950 font-FontNoto">เลือกประเภทการบันทึก</p>

                                <button
                                    className="btn w-full font-FontNoto !bg-blue-400 hover:!bg-blue-600 !text-white"
                                    onClick={() => {
                                        const specificDate = new Date(year, month, selectedDate);
                                        const prevPlan = getPreviousDayPlan(selectedDay, specificDate);

                                        setTaskData({
                                            ...taskData,
                                            noteType: "public",
                                            morning: taskData.morning || prevPlan // ✅ เติมเฉพาะเมื่อเลือก "ลงแผนงาน"
                                        });
                                    }}
                                >
                                    <img src={calendar} alt="calendar" className="w-6 h-6" /> ลงแผนงาน
                                </button>

                                <button
                                    className="btn !bg-gray-200 w-full font-FontNoto"
                                    onClick={() =>
                                        setTaskData({
                                            ...taskData,
                                            noteType: "private",
                                            privateNote: taskData.privateNote.length > 0 ? taskData.privateNote : [""]
                                            // ❌ ไม่ยุ่งกับ morning หรือ evening
                                        })
                                    }
                                >
                                    <img src={note} alt="note" className="w-6 h-6" /> โน้ตส่วนตัว
                                </button>
                            </div>

                        )}
                        {/* Step 2: ถ้าเลือกแล้ว ค่อยแสดงฟอร์ม */}
                        {taskData.noteType === "public" && (
                            <div className="mb-4">
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="font-bold text-cyan-950 font-FontNoto">แผนงานย้อนหลัง</label>
                                        <select
                                            className="select select-sm select-bordered font-FontNoto"
                                            value={selectedDay}
                                            onChange={(e) => {
                                                const newDay = e.target.value;
                                                setSelectedDay(newDay); // ใช้ใน modal

                                                const specificDate = new Date(year, month, selectedDate);
                                                const prevPlan = getPreviousDayPlan(newDay, specificDate);
                                                setTaskData((prev) => ({ ...prev, morning: prevPlan }));
                                            }}
                                        >
                                            <option className="font-FontNoto" value="yesterday">เมื่อวาน</option>
                                            <option className="font-FontNoto" value="monday">วันจันทร์</option>
                                            <option className="font-FontNoto" value="tuesday">วันอังคาร</option>
                                            <option className="font-FontNoto" value="wednesday">วันพุธ</option>
                                            <option className="font-FontNoto" value="thursday">วันพฤหัสบดี</option>
                                            <option className="font-FontNoto" value="friday">วันศุกร์</option>
                                            <option className="font-FontNoto" value="saturday">วันเสาร์</option>
                                            <option className="font-FontNoto" value="sunday">วันอาทิตย์</option>
                                        </select>
                                    </div>
                                    <textarea
                                        className="textarea textarea-bordered w-full bg-blue-50 font-FontNoto"
                                        value={taskData.morning || ""}
                                        placeholder={`กรอกงาน${thaiDayNames[selectedDay] || "เมื่อวาน"}`}
                                        onChange={async (e) => {
                                            const newText = e.target.value;
                                            setTaskData((prev) => ({ ...prev, morning: newText }));

                                            const prevDate = getDateFromSelectedDay(selectedDay, new Date(year, month, selectedDate));
                                            const prevKey = `${userId}-${prevDate.getFullYear()}-${prevDate.getMonth() + 1}-${prevDate.getDate()}`;
                                            const prevTask = tasks[prevKey] || {};

                                            setTasks((prevTasks) => ({
                                                ...prevTasks,
                                                [prevKey]: {
                                                    ...prevTask,
                                                    evening: newText
                                                }
                                            }));

                                            const formattedDate = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`;

                                            const updatedTask = {
                                                userID: parseInt(userId),
                                                date: formattedDate,
                                                morningTask: prevTask.morning || "",
                                                eveningTask: newText,
                                                privateNote: Array.isArray(prevTask.privateNote)
                                                    ? prevTask.privateNote.join('\n')
                                                    : prevTask.privateNote || "",
                                                noteType: prevTask.noteType || "public"
                                            };

                                            await saveOrUpdateTaskToDatabase(updatedTask);
                                        }}
                                    />
                                </div>


                                <div className="mb-4">
                                    <label className="block mb-1 font-bold text-cyan-950 font-FontNoto">วันนี้</label>
                                    <textarea
                                        className="textarea textarea-bordered w-full bg-green-50 font-FontNoto"
                                        value={taskData.evening || ""}
                                        placeholder="กรอกงานวันนี้"
                                        onChange={(e) => setTaskData({ ...taskData, evening: e.target.value })}
                                    />
                                </div>

                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        className="btn !bg-slate-200 font-FontNoto"
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
                                    <button
                                        className="btn !bg-green-400 hover:!bg-green-500 text-white font-FontNoto "
                                        onClick={saveTask}
                                    >
                                        บันทึก
                                    </button>

                                </div>
                            </div>
                        )}

                        {taskData.noteType === "private" && (
                            <div className="mb-4">
                                {(Array.isArray(taskData.privateNote) ? taskData.privateNote : []).map((note, idx) => (
                                    <div key={idx} className="relative mb-4">
                                        <label className="flex items-center gap-2 mb-1 font-bold text-cyan-950 font-FontNoto text-sm">
                                            หัวเรื่องโน้ต :
                                        </label>
                                        <input
                                            type="text"
                                            className="input input-sm input-bordered w-full font-FontNoto mb-1"
                                            placeholder={`หัวข้อโน้ต... ${idx + 1}`}
                                            value={taskData.privateNoteTitles?.[idx] || ""}
                                            onChange={(e) => {
                                                const titles = [...(taskData.privateNoteTitles || [])];
                                                titles[idx] = e.target.value;
                                                setTaskData({ ...taskData, privateNoteTitles: titles });
                                            }}
                                        />
                                        <label className="flex items-center gap-2 mb-1 font-bold text-cyan-950 font-FontNoto text-sm">
                                            รายละเอียดโน้ต :
                                        </label>
                                        <textarea
                                            className="textarea textarea-bordered w-full bg-purple-50 font-FontNoto pr-10"
                                            value={note}
                                            placeholder={`ใส่ข้อความ Note งาน... ${idx + 1}`}
                                            onChange={(e) => {
                                                const updated = [...taskData.privateNote];
                                                updated[idx] = e.target.value;
                                                setTaskData({ ...taskData, privateNote: updated });
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className="absolute top-0 right-0 btn btn-xs btn-circle bg-gray-100 hover:bg-gray-300 text-gray-600 border-none shadow-sm"
                                            onClick={() => setConfirmDeleteIdx(idx)}
                                            title="ลบโน้ตนี้"
                                        >
                                            <img src={bin} alt="bin" className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}

                                <button
                                    className="btn btn-sm !bg-gray-200 w-full font-FontNoto mb-2"
                                    onClick={() =>
                                        setTaskData({
                                            ...taskData,
                                            privateNote: [...(Array.isArray(taskData.privateNote) ? taskData.privateNote : []), ""],
                                            privateNoteTitles: [...(Array.isArray(taskData.privateNoteTitles) ? taskData.privateNoteTitles : []), ""],
                                        })
                                    }
                                >
                                    <img src={note} alt="note" className="w-5 h-5" /> เพิ่มโน้ต
                                </button>

                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        className="btn !bg-green-400 hover:!bg-green-500 text-white font-FontNoto"
                                        onClick={async () => {
                                            const joinedNote = taskData.privateNote.map((n, i) => {
                                                const title = taskData.privateNoteTitles?.[i] || `หัวข้อ ${i + 1}`;
                                                return `หัวข้อ: ${title}\nรายละเอียด: ${n}`;
                                            }).join('\n\n');

                                            const key = `${userId}-${year}-${month + 1}-${selectedDate}`;
                                            const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;

                                            const newTask = {
                                                userID: parseInt(userId),
                                                date: formattedDate,
                                                morningTask: taskData.morning,
                                                eveningTask: taskData.evening,
                                                privateNote: joinedNote,
                                                noteType: "private"
                                            };

                                            await saveOrUpdateTaskToDatabase(newTask);

                                            setTasks(prev => ({
                                                ...prev,
                                                [key]: {
                                                    morning: newTask.morningTask,
                                                    evening: newTask.eveningTask,
                                                    privateNote: taskData.privateNote,
                                                    privateNoteTitles: taskData.privateNoteTitles,
                                                    noteType: "private"
                                                }
                                            }));

                                            setShowModal(false);

                                            // ✅ อัปเดต viewDetail ใหม่ทันที
                                            setViewDetail({
                                                title: `โน้ตทั้งหมด (${taskData.privateNote.length})`,
                                                content: joinedNote
                                            });
                                        }}
                                    >
                                        บันทึก
                                    </button>

                                    {confirmDeleteIdx !== null && (
                                        <dialog id="deleteNoteModal" className="modal modal-open">
                                            <div className="modal-box font-FontNoto">
                                                <h3 className="font-bold text-lg text-red-600 font-FontNoto">⚠️ ยืนยันการลบ</h3>
                                                <p className="py-4 font-FontNoto">คุณต้องการลบโน้ตนี้ ใช่หรือไม่?</p>
                                                <div className="modal-action">
                                                    <form method="dialog" className="flex gap-2">
                                                        <button
                                                            className="btn btn-sm btn-outline font-FontNoto"
                                                            onClick={() => setConfirmDeleteIdx(null)}
                                                        >
                                                            ยกเลิก
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-error text-white font-FontNoto"
                                                            onClick={async () => {
                                                                // 🔸 ลบโน้ตที่เลือก
                                                                const updated = [...taskData.privateNote];
                                                                const updatedTitles = [...(taskData.privateNoteTitles || [])];
                                                                updated.splice(confirmDeleteIdx, 1);
                                                                updatedTitles.splice(confirmDeleteIdx, 1);

                                                                const finalNote = updated.length > 0 ? updated : [];
                                                                const finalTitles = updatedTitles.length > 0 ? updatedTitles : [];

                                                                const joinedNote = finalNote.length === 0
                                                                    ? ""
                                                                    : finalNote.map((n, i) => {
                                                                        const title = finalTitles[i] || `หัวข้อ ${i + 1}`;
                                                                        return `หัวข้อ: ${title}\nรายละเอียด: ${n}`;
                                                                    }).join('\n\n');

                                                                const key = `${userId}-${year}-${month + 1}-${selectedDate}`;
                                                                const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;

                                                                const updatedTask = {
                                                                    userID: parseInt(userId),
                                                                    date: formattedDate,
                                                                    morningTask: taskData.morning,
                                                                    eveningTask: taskData.evening,
                                                                    privateNote: joinedNote,
                                                                    noteType: "private"
                                                                };

                                                                await saveOrUpdateTaskToDatabase(updatedTask);

                                                                setTasks(prev => ({
                                                                    ...prev,
                                                                    [key]: {
                                                                        morning: updatedTask.morningTask,
                                                                        evening: updatedTask.eveningTask,
                                                                        privateNote: finalNote,
                                                                        privateNoteTitles: finalTitles,
                                                                        noteType: "private"
                                                                    }
                                                                }));

                                                                setTaskData({
                                                                    ...taskData,
                                                                    privateNote: finalNote,
                                                                    privateNoteTitles: finalTitles
                                                                });

                                                                setConfirmDeleteIdx(null);

                                                                // ✅ อัปเดต viewDetail ให้แสดงข้อมูลล่าสุดทันที
                                                                if (viewDetail?.title?.startsWith("โน้ตทั้งหมด")) {
                                                                    setViewDetail({
                                                                        title: `โน้ตทั้งหมด (${finalNote.length})`,
                                                                        content: joinedNote
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            ลบ
                                                        </button>
                                                    </form>
                                                </div>
                                            </div>
                                        </dialog>
                                    )}

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