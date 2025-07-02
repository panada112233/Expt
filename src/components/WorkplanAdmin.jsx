import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const WorkplanAdmin = () => {
    const [allPlans, setAllPlans] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [historyDate, setHistoryDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [showMoreMap, setShowMoreMap] = useState({});

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [planRes, userRes] = await Promise.all([
                    axios.get("https://192.168.1.188/hrwebapi/api/Workplan"),
                    axios.get("https://192.168.1.188/hrwebapi/api/Users")
                ]);
                setAllPlans(planRes.data);
                setAllUsers(userRes.data);
            } catch (err) {
                console.error("โหลดข้อมูลล้มเหลว:", err);
            }
        };
        fetchAll();
    }, []);

    const selectedDate = new Date(historyDate);
    const day = selectedDate.getDay();
    if (day === 0 || day === 6) return <div className="text-center mt-6 text-red-500">ไม่สามารถดูแผนในวันหยุดได้</div>;

    const yesterday = new Date(selectedDate);
    yesterday.setDate(selectedDate.getDate() - (day === 1 ? 3 : 1));
    const previousLabel = day === 1 ? "ศุกร์" : yesterday.toLocaleDateString("th-TH", { weekday: "long" }).replace("วัน", "");
    const selectedKey = selectedDate.toISOString().split("T")[0];
    const yesterdayKey = yesterday.toISOString().split("T")[0];

    const roleMapping = {
        GM: "ผู้จัดการทั่วไป",
        Hr: "เลขานุการฝ่ายบริหาร",
        HEAD_BA: "หัวหน้าฝ่ายนักวิเคราะห์ธุรกิจ",
        SENIOR_DEV: "Senior Programmer",
        Dev: "Programmer",
        BA: "นักวิเคราะห์ธุรกิจ (BA)",
        TESTER: "Software Tester",
        JUNIOR_DEV: "Junior Programmer",
        ADMIN: "Admin",
    };

    const rolePriority = {
        GM: 1,
        HEAD_BA: 2,
        Hr: 3,
        SENIOR_DEV: 4,
        Dev: 5,
        BA: 6,
        TESTER: 7,
        JUNIOR_DEV: 8,
    };

    const usersWithPlans = allUsers
        .filter((u) => `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()))
        .map((user) => {
            const todayPlan = allPlans.find((p) => p.userID === user.userID && p.date.startsWith(selectedKey));
            const yestPlan = allPlans.find((p) => p.userID === user.userID && p.date.startsWith(yesterdayKey));
            return {
                userID: user.userID,
                fullName: `${user.firstName} ${user.lastName}`,
                role: user.role,
                morningTask: yestPlan?.eveningTask || "-",
                eveningTask: todayPlan?.eveningTask || "",
            };
        })
        .filter((rec) => rec.eveningTask && rec.eveningTask.trim() !== "")
        .sort((a, b) => (rolePriority[a.role] || 99) - (rolePriority[b.role] || 99));

    return (
        <>
            <div className="w-full bg-gradient-to-r from-cyan-100 via-blue-100 to-blue-50 text-white rounded-xl p-4 sm:p-5 md:p-6 mb-6 shadow-lg">
                <h1 className="text-xl sm:text-2xl text-cyan-950 font-bold font-FontNoto leading-snug">
                    จัดการข้อมูลแผนปฏิบัติงาน
                </h1>
                <p className="text-xs sm:text-sm mt-1 text-cyan-950 font-FontNoto">
                    ตรวจสอบแผนที่พนักงานลงไว้ในแต่ละวัน
                </p>
            </div>
            <div className="w-full max-w-8xl mx-auto bg-white rounded-3xl p-6 shadow-md items-center justify-center">
                {(() => {
                    const selectedDate = new Date(historyDate);
                    const day = selectedDate.getDay();

                    if (day === 0 || day === 6) {
                        return null;
                    }

                    const yesterday = new Date(selectedDate);
                    let previousLabel = "";

                    if (day === 1) {
                        yesterday.setDate(selectedDate.getDate() - 3);
                        previousLabel = "ศุกร์";
                    } else {
                        yesterday.setDate(selectedDate.getDate() - 1);
                        previousLabel = yesterday.toLocaleDateString("th-TH", {
                            weekday: "long",
                        }).replace("วัน", "");
                    }

                    const selectedKey = selectedDate.toISOString().split("T")[0];
                    const yesterdayKey = yesterday.toISOString().split("T")[0];

                    const rolePriority = {
                        GM: 1,
                        HEAD_BA: 2,
                        Hr: 3,
                        SENIOR_DEV: 4,
                        Dev: 5,
                        BA: 6,
                        TESTER: 7,
                        JUNIOR_DEV: 8,
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
                                role: user.role,
                                morningTask: yestPlan?.eveningTask || "-",
                                eveningTask: todayPlan?.eveningTask || "",
                            };
                        })
                        .filter((rec) => rec.eveningTask && rec.eveningTask.trim() !== "")
                        .sort((a, b) => (rolePriority[a.role] || 99) - (rolePriority[b.role] || 99));
                    return (
                        <div className="relative  font-FontNoto mb-8  animate-fade-in ">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                                <div>
                                    <h3 className="font-semibold text-lg font-FontNoto text-black">
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
                                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                                    <div className="flex flex-col flex-1 min-w-0 relative sm:w-40">
                                        <input
                                            type="text"
                                            value={new Date(historyDate).toLocaleDateString("th-TH", {
                                                day: "2-digit",
                                                month: "long",
                                                year: "numeric",
                                            })}
                                            readOnly
                                            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-black font-FontNoto pr-10"
                                            onClick={() => document.getElementById("datePicker").showPicker()}
                                            style={{ cursor: "pointer", colorScheme: "light" }}
                                        />
                                        <div
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
                                            onClick={() => document.getElementById("datePicker").showPicker()}
                                        >
                                            <i className="fas fa-calendar-alt"></i>
                                        </div>
                                        <input
                                            type="date"
                                            id="datePicker"
                                            value={historyDate}
                                            onChange={(e) => setHistoryDate(e.target.value)}
                                            className="absolute opacity-0 pointer-events-none"
                                            style={{ colorScheme: "light" }}
                                        />
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <input
                                            type="text"
                                            placeholder="ค้นหาชื่อพนักงาน..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-black font-FontNoto"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                    {usersWithPlans.map((rec, idx) => {
                                        const morningLines = rec.morningTask?.split("\n") || [];
                                        const eveningLines = rec.eveningTask?.split("\n") || [];

                                        const toggleShow = (field) => {
                                            const key = `${rec.userID}-${field}`;
                                            setShowMoreMap((prev) => ({
                                                ...prev,
                                                [key]: !prev[key],
                                            }));
                                        };

                                        const isShowAllMorning = showMoreMap[`${rec.userID}-morning`];
                                        const isShowAllEvening = showMoreMap[`${rec.userID}-evening`];

                                        return (
                                            <div
                                                key={idx}
                                                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                                            >
                                                <div className="flex items-center mb-3 bg-gray-200 rounded-2xl">
                                                    <img
                                                        src={`https://192.168.1.188/hrwebapi/api/Files/GetProfileImage?userID=${rec.userID}`}
                                                        alt={rec.fullName}
                                                        className="w-10 h-10 rounded-full border border-gray-300 mr-3 object-cover font-FontNoto"
                                                    />
                                                    <div>
                                                        <p className="font-bold text-black font-FontNoto">{rec.fullName}</p>
                                                        <p className="text-sm text-gray-600 font-FontNoto">
                                                            {roleMapping[allUsers.find((u) => u.userID === rec.userID)?.role] || "-"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mb-3 min-h-[100px]">
                                                    <p className="text-sm font-semibold font-FontNoto mb-1">
                                                        เมื่อวัน{previousLabel}
                                                    </p>
                                                    <ul className="list-disc list-inside text-sm text-black font-FontNoto space-y-1">
                                                        {(isShowAllMorning ? morningLines : morningLines.slice(0, 3)).map((task, i) => (
                                                            <li key={i}>{task}</li>
                                                        ))}
                                                    </ul>
                                                    {morningLines.length > 3 && (
                                                        <button
                                                            className="text-blue-600 underline text-sm mt-1 font-FontNoto"
                                                            onClick={() => toggleShow("morning")}
                                                        >
                                                            {isShowAllMorning ? "ดูน้อยลง" : "ดูเพิ่มเติม"}
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="min-h-[100px]">
                                                    <p className="text-sm font-semibold font-FontNoto mb-1">
                                                        วันนี้ ({selectedDate.toLocaleDateString("th-TH", { weekday: "long" }).replace("วัน", "")})
                                                    </p>
                                                    <ul className="list-disc list-inside text-sm text-green-700 font-FontNoto space-y-1">
                                                        {(isShowAllEvening ? eveningLines : eveningLines.slice(0, 3)).map((task, i) => (
                                                            <li key={i}>{task}</li>
                                                        ))}
                                                    </ul>
                                                    {eveningLines.length > 3 && (
                                                        <button
                                                            className="text-blue-600 underline text-sm mt-1 font-FontNoto"
                                                            onClick={() => toggleShow("evening")}
                                                        >
                                                            {isShowAllEvening ? "ดูน้อยลง" : "ดูเพิ่มเติม"}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </>
    );
};

export default WorkplanAdmin;
