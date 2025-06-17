import React, { useEffect, useState } from "react";
import axios from "axios";
import clsx from "clsx";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const roleMapping = {
    GM: "ผู้จัดการทั่วไป",
    Hr: "เลขานุการฝ่ายบริหาร",
    HEAD_BA: "หัวหน้าฝ่ายนักวิเคราะห์ธุรกิจ",
    SENIOR_DEV: "Senior Programmer",
    Dev: "Programmer",
    BA: "นักวิเคราะห์ธุรกิจ (BA)",
    TESTER: "Software Tester",
    JUNIOR_DEV: "Junior Programmer",
};

const formatDateThai = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate();
    const monthNames = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear() + 543; // แปลงเป็น พ.ศ.
    return `${day} ${month} ${year}`;
};

const LeaveRequestAdmin = () => {
    const [leaveHistory, setLeaveHistory] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [fromPendingList, setFromPendingList] = useState(false);
    const [leaveSummary, setLeaveSummary] = useState({});
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [hasSignedGM, setHasSignedGM] = useState(false);
    const [hasSignedHead, setHasSignedHead] = useState(false);
    const [hasSignedHR, setHasSignedHR] = useState(false);
    const [currentUserName, setCurrentUserName] = useState("ไม่ทราบชื่อ");
    const [activeLeaveTab, setActiveLeaveTab] = useState("pending");


    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const years = Array.from({ length: 7 }, (_, i) => 2024 + i);
    const currentUserRole = sessionStorage.getItem("role"); // GM, Hr, HEAD_BA

    const handleConfirmApproval = async () => {
        if (!confirmAction) return;

        await handleApprovalChange(confirmAction);
        setConfirmAction(null);
        setShowConfirmModal(false);
    };

    const calculateLeaveDays = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diff = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
        return diff;
    };

    const formatDateThai = (dateStr) => {
        const date = new Date(dateStr);
        const day = date.getDate();
        const month = date.toLocaleString("th-TH", { month: "long" });
        const year = date.getFullYear() + 543;
        return `${day} ${month} ${year}`;
    };

    const handleApprovalChange = async (decision) => {
        if (!selectedLeave) return;

        let apiEndpoint = "";

        if (currentUserRole === "GM") {
            apiEndpoint = `https://192.168.1.188/hrwebapi/api/LeaveRequest/gm/${decision === "approve" ? "approve" : "reject"}/${selectedLeave.id}`;
        } else if (currentUserRole === "HEAD_BA") {
            apiEndpoint = `https://192.168.1.188/hrwebapi/api/User/headba/${decision === "approve" ? "approve" : "reject"}/${selectedLeave.id}`;
        } else if (currentUserRole === "Hr") {
            apiEndpoint = `https://192.168.1.188/hrwebapi/api/LeaveRequest/hr/${decision === "approve" ? "approve" : "reject"}/${selectedLeave.id}`;
        } else {
            alert("สิทธิ์ของคุณไม่สามารถอนุมัติได้");
            return;
        }

        try {
            await axios.post(apiEndpoint, {
                comment: `${decision === "approve" ? "อนุมัติ" : "ไม่อนุมัติ"} ${currentUserName}`,
                signature: currentUserName,
            });
            setShowModal(false);
            fetchLeaveData(); // โหลดข้อมูลใหม่
        } catch (error) {
            console.error("การอนุมัติล้มเหลว", error);
            alert("เกิดข้อผิดพลาดในการอนุมัติ");
        }
    };

    const fetchProfile = async () => {
        const userId = sessionStorage.getItem("userId");
        if (!userId) return;

        try {
            const res = await axios.get(`https://192.168.1.188/hrwebapi/api/Users/Profile/${userId}`);
            if (res.data) {
                const user = res.data;
                const fullName = `${user.firstName} ${user.lastName}`;
                setCurrentUserName(fullName);        // เอาไว้ใช้ลงชื่อในใบลาฯ เท่านั้น
            }
        } catch (error) {
            console.error("ไม่สามารถโหลดโปรไฟล์ผู้ใช้:", error);
        }
    };

    const [leaveStats, setLeaveStats] = useState({
        sick: 0,
        personal: 0,
        vacation: 0,
        maternity: 0,
        ordain: 0,
    });

    const labelMap = {
        sick: "ป่วย",
        personal: "กิจส่วนตัว",
        vacation: "พักร้อน",
        maternity: "ลาคลอด",
        ordain: "บวช",
    };

    const borderColorMap = {
        "ลาป่วย": "border-l-blue-500",
        "ลากิจส่วนตัว": "border-l-green-500",
        "ลาพักร้อน": "border-l-orange-500",
        "ลาคลอด": "border-l-purple-500",
        "ลาบวช": "border-l-red-500",
    };

    const formatLeaveLabel = (type) => {
        return type?.startsWith("ลา") ? type : `ลา${type}`;
    };

    useEffect(() => {
        fetchPendingRequests(selectedYear);
        fetchLeaveData();
        fetchProfile();
    }, [selectedYear]);

    const fetchLeaveData = async () => {
        const res = await axios.get("https://192.168.1.188/hrwebapi/api/User/all");
        const all = res.data || [];

        const filteredAll = all.filter(item => {
            const leaveYear = new Date(item.startDate).getFullYear();
            return leaveYear === selectedYear && item.status === "ApprovedByHR";
        });

        const pendingRes = await axios.get("https://192.168.1.188/hrwebapi/api/User/all");
        const allPending = pendingRes.data || [];

        const filteredPending = allPending.filter(item => {
            const yearMatch = new Date(item.startDate).getFullYear() === selectedYear;
            const stillWaiting = !item.hrApprovedAt;
            const isNotRejected = item.status !== "Rejected" && item.status !== "RejectedByHR";

            return yearMatch && stillWaiting && isNotRejected;
        });

        setLeaveHistory(filteredAll);
        setPendingRequests(filteredPending);

        const summary = {
            sick: { approved: 0, pending: 0 },
            personal: { approved: 0, pending: 0 },
            vacation: { approved: 0, pending: 0 },
            maternity: { approved: 0, pending: 0 },
            ordain: { approved: 0, pending: 0 },
        };

        filteredAll.forEach(item => {
            const key = Object.keys(labelMap).find(k => labelMap[k] === item.leaveType);
            if (key && item.status === "ApprovedByGM") {
                summary[key].approved += 1;
            }
        });

        filteredPending.forEach(item => {
            const key = Object.keys(labelMap).find(k => labelMap[k] === item.leaveType);
            if (key) {
                summary[key].pending += 1;
            }
        });

        setLeaveSummary(summary);

        const statsByMonth = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            sick: 0,
            personal: 0,
            vacation: 0,
            ordain: 0,
            maternity: 0,
        }));

        filteredAll.forEach(item => {
            const leaveDate = new Date(item.startDate);
            const monthIndex = leaveDate.getMonth(); // 0-11
            const key = Object.keys(labelMap).find(k => labelMap[k] === item.leaveType);
            if (!key) return;

            const isHalfDay = item.timeType === "ครึ่งวันเช้า" || item.timeType === "ครึ่งวันบ่าย";
            const leaveDays = isHalfDay
                ? 0.5
                : Math.floor((new Date(item.endDate) - new Date(item.startDate)) / (1000 * 60 * 60 * 24)) + 1;

            statsByMonth[monthIndex][key] += leaveDays;
        });

        setLeaveStats(prev => ({
            ...prev,
            monthly: statsByMonth,
        }));
    };
    const fetchPendingRequests = async (year) => {
        const res = await axios.get("https://192.168.1.188/hrwebapi/api/User/all");

        const data = res.data || [];

        const filtered = data.filter(item => {
            const yearMatch = new Date(item.startDate).getFullYear() === year;
            const stillWaiting = !item.hrApprovedAt;

            // ✅ ยังไม่ถูกปฏิเสธ
            const isNotRejected = item.status !== "Rejected" && item.status !== "RejectedByHR";

            return yearMatch && stillWaiting && isNotRejected;
        });

        setPendingRequests(filtered);
    };

    const showDetail = (item, fromPending = false) => {
        setSelectedLeave(item);
        setFromPendingList(fromPending); // ✅ รับจาก argument
        setShowModal(true);
    };
    return (
        <div className="flex flex-col w-full">
            <div className="w-full bg-gradient-to-r from-cyan-100 via-blue-100 to-blue-50 text-white rounded-xl p-4 sm:p-5 md:p-6 mb-6 shadow-lg">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-xl sm:text-2xl text-cyan-950 font-bold font-FontNoto leading-snug">
                            ใบลาพนักงาน
                        </h1>
                        <p className="text-xs sm:text-sm mt-1 text-cyan-950 font-FontNoto">
                            จัดการข้อมูลการลาของพนักงาน
                        </p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto sm:overflow-visible px-2 mb-6">
                <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 min-w-[640px] sm:min-w-0">
                    {Object.entries(labelMap).map(([key, label]) => {
                        const isAlreadyHasLa = label.startsWith("ลา");
                        const fullLabel = isAlreadyHasLa ? label : `ลา${label}`;
                        const displayLabel = isAlreadyHasLa ? label : `ลา${label}`;

                        return (
                            <div
                                key={key}
                                className={`bg-white rounded-xl shadow border-l-4 
            ${borderColorMap[fullLabel] || "border-l-gray-300"} 
            flex-shrink-0 w-[250px] sm:w-auto
            p-4 flex flex-col justify-between
          `}
                            >
                                <div className="mb-2">
                                    <p className="text-base font-bold text-black font-FontNoto whitespace-nowrap overflow-hidden text-ellipsis">
                                        ใบ{displayLabel}
                                    </p>
                                </div>
                                <div className="space-y-1 text-sm font-FontNoto">
                                    <p className="text-green-600">
                                        อนุมัติแล้ว {leaveSummary[key]?.approved || 0} ใบ
                                    </p>
                                    <p className="text-red-700">
                                        รออนุมัติ {leaveSummary[key]?.pending || 0} ใบ
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
                <div className="bg-white shadow rounded-xl p-4">
                    <h2 className="font-bold text-lg mb-4 text-black font-FontNoto">สถิติประเภทการลา (รายปี)</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart
                            data={Array.from({ length: 12 }, (_, i) => {
                                const monthData = leaveStats.monthly?.find(m => m.month === i + 1) || {};

                                const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
                                return {
                                    month: thaiMonths[i],
                                    "ลาป่วย": monthData.sick || 0,
                                    "ลากิจส่วนตัว": monthData.personal || 0,
                                    "ลาพักร้อน": monthData.vacation || 0,
                                    "ลาบวช": monthData.ordain || 0,
                                    "ลาคลอด": monthData.maternity || 0,
                                };
                            })}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" tick={{ fontFamily: "Noto Sans Thai", fontSize: 12 }} />
                            <YAxis tick={{ fontFamily: "Noto Sans Thai", fontSize: 12 }} />
                            <Tooltip contentStyle={{ fontFamily: "Noto Sans Thai", fontSize: 12 }} />
                            <Legend wrapperStyle={{ fontFamily: "Noto Sans Thai", fontSize: 12 }} />
                            <Line type="monotone" dataKey="ลาป่วย" stroke="#3b82f6" />
                            <Line type="monotone" dataKey="ลากิจส่วนตัว" stroke="#22c55e" />
                            <Line type="monotone" dataKey="ลาพักร้อน" stroke="#f97316" />
                            <Line type="monotone" dataKey="ลาบวช" stroke="#ef4444" />
                            <Line type="monotone" dataKey="ลาคลอด" stroke="#a855f7" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white shadow rounded-xl p-4">
                    <h2 className="font-bold text-lg mb-4 text-black font-FontNoto">สถิติสถานะใบลา (รายปี)</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart
                            data={(() => {
                                const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
                                const monthlyStatus = Array.from({ length: 12 }, (_, i) => ({
                                    month: thaiMonths[i],
                                    approved: 0,
                                    pending: 0,
                                    rejected: 0,
                                    noForm: 0,
                                }));

                                // ✅ Approved / Rejected จาก leaveHistory
                                leaveHistory?.forEach((item) => {
                                    const m = new Date(item.startDate).getMonth();
                                    if (item.status === "ApprovedByManager" || item.status === "ApprovedByHR") {
                                        monthlyStatus[m].approved += 1;
                                    } else if (item.status === "Rejected") {
                                        monthlyStatus[m].rejected += 1;
                                    }
                                });

                                // ✅ Pending จาก pendingRequests
                                pendingRequests?.forEach((item) => {
                                    const m = new Date(item.startDate).getMonth();
                                    monthlyStatus[m].pending += 1;
                                });

                                return monthlyStatus;
                            })()}

                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" tick={{ fontFamily: "Noto Sans Thai", fontSize: 12 }} />
                            <YAxis tick={{ fontFamily: "Noto Sans Thai", fontSize: 12 }} />
                            <Tooltip contentStyle={{ fontFamily: "Noto Sans Thai", fontSize: 12 }} />
                            <Legend wrapperStyle={{ fontFamily: "Noto Sans Thai", fontSize: 12 }} />
                            <Line type="monotone" dataKey="approved" stroke="#22c55e" name="อนุมัติแล้ว" />
                            <Line type="monotone" dataKey="pending" stroke="#eab308" name="รอดำเนินการ" />
                            <Line type="monotone" dataKey="rejected" stroke="#ef4444" name="ไม่อนุมัติ" />
                            <Line type="monotone" dataKey="noForm" stroke="#6366f1" name="ยังไม่กรอก" />
                        </LineChart>

                    </ResponsiveContainer>
                </div>
            </div>
            <div className="flex justify-end mt-2 font-FontNoto">
                <select
                    className="select select-bordered w-40 font-FontNoto"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                    {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>
            <div className="flex gap-4 border-b border-gray-300 mb-4 font-FontNoto">
                <button
                    onClick={() => setActiveLeaveTab("pending")}
                    className={`py-2 px-4 font-bold ${activeLeaveTab === "pending"
                        ? "border-b-4 border-green-500 text-green-700"
                        : "text-gray-500"
                        }`}
                >
                    ใบลารออนุมัติ
                </button>
                <button
                    onClick={() => setActiveLeaveTab("history")}
                    className={`py-2 px-4 font-bold ${activeLeaveTab === "history"
                        ? "border-b-4 border-blue-500 text-blue-700"
                        : "text-gray-500"
                        }`}
                >
                    ประวัติใบลาทั้งหมด
                </button>
            </div>

            {activeLeaveTab === "pending" && (
                <div className="bg-white shadow rounded-xl p-4">
                    <h2 className="text-xl font-bold text-green-700 mb-4 font-FontNoto">ใบลา รออนุมัติ</h2>
                    {pendingRequests.length === 0 ? (
                        <p className="text-gray-500 font-FontNoto text-center">ไม่มีคำขอลาที่รออนุมัติ</p>
                    ) : (
                        pendingRequests.map((req) => (
                            <div
                                key={req.id}
                                className={clsx(
                                    "bg-white rounded-xl shadow p-4 mb-4 border-l-4 font-FontNoto",
                                    borderColorMap[formatLeaveLabel(req.leaveType)] || "border-l-gray-300"
                                )}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-black font-FontNoto mb-1">
                                            {req.user?.firstName} {req.user?.lastName}
                                        </p>
                                        <p className="text-sm text-gray-800 font-FontNoto">
                                            {formatLeaveLabel(req.leaveType)}{" "}
                                            {req.timeType.includes("ครึ่ง") ? "0.5" : calculateLeaveDays(req.startDate, req.endDate)} วัน
                                        </p>
                                        <p className="text-sm text-gray-600 font-FontNoto">
                                            เนื่องจาก: {req.reason}
                                        </p>
                                        <p className="text-sm text-gray-500 font-FontNoto">
                                            {formatDateThai(req.startDate)} - {formatDateThai(req.endDate)}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => showDetail(req, true)}
                                        className="px-4 py-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-FontNoto"
                                    >
                                        แสดงละเอียด
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeLeaveTab === "history" && (
                <div className="bg-white shadow rounded-xl p-4">
                    <h2 className="text-xl font-bold text-blue-700 mb-4 font-FontNoto">ประวัติใบลาทั้งหมด</h2>
                    <div className="grid gap-4">
                        {leaveHistory.length === 0 ? (
                            <p className="text-center text-gray-500 font-FontNoto">ไม่มีข้อมูลการลา</p>
                        ) : (
                            leaveHistory.map((leave, idx) => (
                                <div
                                    key={leave.id || idx}
                                    className={clsx(
                                        "bg-white rounded-xl shadow p-4 border-l-4 font-FontNoto",
                                        borderColorMap[formatLeaveLabel(leave.leaveType)] || "border-l-gray-300"
                                    )}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-black font-FontNoto mb-1">
                                                {leave.user?.firstName} {leave.user?.lastName}
                                            </p>
                                            <p className="text-sm text-gray-800 font-FontNoto">
                                                {formatLeaveLabel(leave.leaveType)}{" "}
                                                {leave.timeType.includes("ครึ่ง") ? "0.5" : calculateLeaveDays(leave.startDate, leave.endDate)} วัน
                                            </p>
                                            <p className="text-sm text-gray-600 font-FontNoto">
                                                เนื่องจาก: {leave.reason}
                                            </p>
                                            <p className="text-sm text-gray-500 font-FontNoto">
                                                {formatDateThai(leave.startDate)} - {formatDateThai(leave.endDate)}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => showDetail(leave)}
                                            className="px-4 py-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-FontNoto"
                                        >
                                            แสดงละเอียด
                                        </button>

                                    </div>

                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {showModal && selectedLeave && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto font-FontNoto px-2 py-4">
                    <div className="relative bg-white rounded-2xl border border-gray-300 w-full max-w-2xl sm:max-w-3xl md:max-w-4xl mx-auto p-4 sm:p-6 shadow-md max-h-[90vh] overflow-y-auto">
                        <div className="absolute top-0 left-0 w-full h-1 rounded-t-lg" />
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-[-10px] right-0 sm:top-[0px] sm:right-2 bg-white rounded-full w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 text-xl sm:text-2xl shadow-md z-50"
                            aria-label="Close"
                        >
                            &times;
                        </button>
                        <div className="flex justify-between items-start w-full mb-4 border-b-4 border-blue-600 pb-2">
                            <div>
                                <h1 className="text-xl sm:text-xl font-bold font-FontNoto text-black">แบบฟอร์มใบลา</h1>
                                <p className="text-base sm:text-sm font-FontNoto text-blue-800 leading-tight">THE EXPERTISE CO., LTD.</p>
                            </div>
                            <div className="text-right text-black">
                                <p className="text-sm font-FontNoto">วันที่เขียนแบบฟอร์ม</p>
                                <p className="font-FontNoto mt-1">{formatDateThai(selectedLeave.createdAt)}</p>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm font-FontNoto text-black">
                            <div className="flex flex-wrap sm:flex-nowrap gap-4">
                                <div className="flex items-center w-full sm:w-1/2">
                                    <label className="mr-2 font-bold">เรื่อง : ขออนุญาต</label>
                                    <div className="flex-1 text-black bg-white border border-gray-200 rounded px-3 py-1.5">
                                        {selectedLeave.leaveType.startsWith("ลา")
                                            ? selectedLeave.leaveType
                                            : `ลา${selectedLeave.leaveType}`}
                                    </div>
                                </div>

                                <div className="flex items-center w-full sm:w-1/2">
                                    <label className="mr-2 font-bold">ช่วงเวลา :</label>
                                    <div className="flex-1 text-black bg-white border border-gray-200 rounded px-3 py-1.5">
                                        {selectedLeave.timeType}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <label className="font-bold">เรียน:</label>
                                <div className="flex-1 text-black bg-white  px-3 py-1.5">
                                    หัวหน้าแผนก / ฝ่ายบุคคล
                                </div>
                            </div>
                            <div className="flex flex-wrap sm:flex-nowrap gap-4">
                                <div className="flex items-center w-full sm:w-1/2">
                                    <label className="font-bold mr-2">ข้าพเจ้า :</label>
                                    <div className="flex-1 text-black bg-white border border-gray-200 rounded px-3 py-1.5">
                                        {selectedLeave?.user?.firstName} {selectedLeave?.user?.lastName}
                                    </div>
                                </div>
                                <div className="flex items-center w-full sm:w-1/2">
                                    <label className="mr-2 font-bold">ตำแหน่ง :</label>
                                    <div className="flex-1 text-black bg-white border border-gray-200 rounded px-3 py-1.5">
                                        {roleMapping[selectedLeave?.user?.role] || "-"}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <label className="font-bold">ข้าพเจ้ามีความประสงค์ขอลาหยุดงาน</label>
                            </div>
                            <div className="flex items-start">
                                <label className="mr-2 pt-1 font-bold">เนื่องจาก:</label>
                                <div className="flex-1 text-black bg-white border border-gray-200 rounded px-3 py-1.5">
                                    {selectedLeave.reason}
                                </div>
                            </div>
                            <div className="flex flex-wrap sm:flex-nowrap gap-4">
                                <div className="flex items-center w-full sm:w-1/3">
                                    <label className="mr-2 font-bold">ตั้งแต่วันที่ :</label>
                                    <div className="flex-1 text-black bg-white border border-gray-200 rounded px-3 py-1.5 whitespace-nowrap">
                                        {new Date(selectedLeave.startDate).toLocaleDateString("th-TH")}
                                    </div>
                                </div>
                                <div className="flex items-center w-full sm:w-1/3">
                                    <label className="mr-2 font-bold">ถึงวันที่ :</label>
                                    <div className="flex-1 text-black bg-white border border-gray-200 rounded px-3 py-1.5 whitespace-nowrap">
                                        {new Date(selectedLeave.endDate).toLocaleDateString("th-TH")}
                                    </div>
                                </div>
                                <div className="flex items-center w-full sm:w-1/3">
                                    <label className="mr-2 font-bold">จำนวนวันลา :</label>
                                    <div className="flex-1 text-black bg-white border border-gray-200 rounded px-3 py-1.5 whitespace-nowrap">
                                        {selectedLeave.timeType.includes("ครึ่ง")
                                            ? "0.5"
                                            : Math.floor((new Date(selectedLeave.endDate) - new Date(selectedLeave.startDate)) / (1000 * 60 * 60 * 24)) + 1} วัน
                                    </div>
                                </div>
                            </div>
                            {(() => {
                                const [address, phone] = (selectedLeave.contact || "").split(" / ");
                                return (
                                    <div className="flex flex-wrap sm:flex-nowrap gap-4">
                                        <div className="flex items-center w-full sm:w-2/3">
                                            <label className="mr-2 font-bold whitespace-nowrap">ช่องทางการติดต่อระหว่างลา :</label>
                                            <div className="flex-1 text-black bg-white border border-gray-200 rounded px-3 py-1.5">
                                                {address || "-"}
                                            </div>
                                        </div>
                                        <div className="flex items-center w-full sm:w-1/3">
                                            <label className="mr-2 font-bold">เบอร์โทรศัพท์ :</label>
                                            <div className="flex-1 text-black bg-white border border-gray-200 rounded px-3 py-1.5">
                                                {phone || "-"}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                            <div className="flex items-center">
                                <label className="mr-2 font-bold">สถานะ:</label>
                                <div
                                    className={`flex-1 text-black bg-white border border-gray-200 rounded px-3 py-1.5 ${selectedLeave.status === "ApprovedByHR"
                                        ? "text-green-600"
                                        : selectedLeave.status === "Rejected"
                                            ? "text-red-600"
                                            : "text-yellow-600"
                                        }`}
                                >
                                    {selectedLeave.status === "ApprovedByHR"
                                        ? "อนุมัติแล้ว"
                                        : selectedLeave.status === "Rejected"
                                            ? "ไม่อนุมัติ"
                                            : "รอดำเนินการ"}
                                </div>
                            </div>
                            {selectedLeave.filePath && (
                                <div className="flex items-center">
                                    <label className="mr-2 font-bold">เอกสารแนบ:</label>
                                    <a
                                        href={`https://192.168.1.188${selectedLeave.filePath}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline"
                                    >
                                        🔗 ดูเอกสารแนบ
                                    </a>
                                </div>
                            )}

                            {selectedLeave.status === "Rejected" && (
                                <div className="flex items-start">
                                    <label className="w-28 pt-1 font-bold">เหตุผล:</label>
                                    <div className="flex-1 px-3 py-1.5 bg-gray-100 border border-gray-300 rounded">
                                        {selectedLeave.hrComment || selectedLeave.gmComment || "-"}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="mt-2">
                            <label className="font-FontNoto sm:w-32 whitespace-nowrap  text-gray-800 font-semibold">
                                การอนุมัติ
                            </label>
                        </div>
                        {selectedLeave.status === "ApprovedByHR" && (
                            <div className="mt-2 space-y-2 font-FontNoto text-sm text-black">
                                {[
                                    { label: "ผู้จัดการทั่วไป :", value: selectedLeave.gmComment?.replace("อนุมัติ ", "") || "ไม่ระบุชื่อ" },
                                    { label: "หัวหน้าฝ่ายนักวิเคราะห์ :", value: selectedLeave.headBAComment?.replace("อนุมัติ ", "") || "ไม่ระบุชื่อ" },
                                    { label: "ฝ่ายทรัพยากรบุคคล :", value: selectedLeave.hrComment?.replace("อนุมัติ ", "") || "ไม่ระบุชื่อ" }
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                        <label style={{ width: '17%' }} className="w-full sm:inline-block font-bold text-gray-700 whitespace-nowrap">{label}</label>
                                        <div className="w-full sm:flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded whitespace-nowrap text-left">
                                            {value}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {fromPendingList && (
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-FontNoto text-sm text-black">
                                <div className="border border-gray-300 rounded-lg p-4 shadow-sm whitespace-nowrap bg-white text-gray-700 font-FontNoto text-sm max-w-sm">
                                    <p className="font-bold text-center mb-2">ผู้ขอลา</p>
                                    <div className="mb-1">
                                        ลายมือชื่อ:
                                        <span className="inline-block border-b border-gray-400 w-28 h-6 align-bottom ml-1">
                                            {selectedLeave?.user?.firstName} {selectedLeave?.user?.lastName}
                                        </span>
                                    </div>
                                    <div>วันที่ : {formatDateThai(selectedLeave.createdAt)}</div>
                                </div>
                                <div className="border border-gray-300 rounded-lg p-4 shadow-sm bg-white text-gray-700 font-FontNoto text-sm max-w-sm">
                                    <p className="font-bold text-center mb-2">ผู้จัดการทั่วไป</p>
                                    <div className="mb-2 flex items-center whitespace-nowrap">
                                        <span className="text-gray-600 mr-2">ลายมือชื่อ:</span>
                                        <span
                                            className={`inline-block border-b border-gray-400 w-48 h-6 align-bottom ml-1 px-2
        ${hasSignedGM || selectedLeave.gmApprovedAt ? "text-black" : "text-gray-400 cursor-pointer hover:bg-yellow-100"}`}
                                            onClick={() => {
                                                if (
                                                    currentUserRole === "GM" &&
                                                    !hasSignedGM &&
                                                    !selectedLeave?.gmApprovedAt
                                                ) {
                                                    setHasSignedGM(true);
                                                }
                                            }}
                                        >
                                            {selectedLeave.gmApprovedAt
                                                ? selectedLeave.gmComment?.replace("อนุมัติ ", "") || currentUserName
                                                : hasSignedGM
                                                    ? currentUserName
                                                    : currentUserRole === "GM"
                                                        ? "คลิกเพื่อลงชื่อ"
                                                        : ""}
                                        </span>
                                    </div>

                                    <div className="mb-2 flex items-center gap-2 whitespace-nowrap">
                                        <span className="text-gray-600 mr-2">วันที่:</span>
                                        <input
                                            type="date"
                                            disabled={currentUserRole !== "GM"}
                                            value={new Date().toISOString().split("T")[0]}
                                            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-black font-FontNoto w-full cursor-pointer"
                                            style={{
                                                colorScheme: "light",
                                                minWidth: "100px",
                                            }}
                                        />
                                    </div>

                                    <div className="flex gap-4 mt-2">
                                        {selectedLeave.gmApprovedAt || selectedLeave.status === "Rejected" ? (
                                            selectedLeave.status === "Rejected" ? (
                                                <div className="flex items-center gap-2 text-red-600 font-semibold">
                                                    <input
                                                        type="radio"
                                                        checked
                                                        disabled
                                                        className="h-4 w-4 appearance-none rounded-full border-2 border-red-500 bg-red-500"
                                                    />
                                                    ไม่อนุมัติแล้ว
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-green-600 font-semibold">
                                                    <input
                                                        type="radio"
                                                        checked
                                                        disabled
                                                        className="h-4 w-4 appearance-none rounded-full border-2 border-green-500 bg-green-500"
                                                    />
                                                    อนุมัติแล้ว
                                                </div>
                                            )
                                        ) : (
                                            <>
                                                <label className="flex items-center gap-2 text-green-600 font-semibold cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="approval_gm"
                                                        disabled={currentUserRole !== "GM"}
                                                        onChange={() => {
                                                            setConfirmAction("approve");
                                                            setShowConfirmModal(true);
                                                        }}
                                                        className="h-4 w-4 appearance-none rounded-full border-2 border-gray-300 checked:bg-green-500 checked:border-green-500 transition duration-150"
                                                    />
                                                    อนุมัติ
                                                </label>
                                                <label className="flex items-center gap-2 text-red-600 font-semibold cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="approval_gm"
                                                        disabled={currentUserRole !== "GM"}
                                                        onChange={() => {
                                                            setConfirmAction("reject");
                                                            setShowConfirmModal(true);
                                                        }}
                                                        className="h-4 w-4 appearance-none rounded-full border-2 border-gray-300 checked:bg-red-500 checked:border-red-500 transition duration-150"
                                                    />
                                                    ไม่อนุมัติ
                                                </label>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="border border-gray-300 rounded-lg p-4 shadow-sm bg-white text-gray-700 font-FontNoto text-sm max-w-sm">
                                    <p className="font-bold text-center mb-2">หัวหน้าฝ่ายนักวิเคราะห์ธุรกิจ</p>

                                    <div className="mb-2 flex items-center whitespace-nowrap">
                                        <span className="text-gray-600 mr-2">ลายมือชื่อ:</span>
                                        <span
                                            className={`inline-block border-b border-gray-400 w-48 h-6 align-bottom ml-1 px-2 
        ${hasSignedHead || selectedLeave.headBAApprovedAt ? "text-black" : "text-gray-400 cursor-pointer hover:bg-yellow-100"}`}
                                            onClick={() => {
                                                if (
                                                    currentUserRole === "HEAD_BA" &&
                                                    !hasSignedHead &&
                                                    !selectedLeave?.headBAApprovedAt
                                                ) {
                                                    setHasSignedHead(true);
                                                }
                                            }}
                                        >
                                            {selectedLeave.headBAApprovedAt
                                                ? selectedLeave.headBAComment?.replace("อนุมัติ ", "") || currentUserName
                                                : hasSignedHead
                                                    ? currentUserName
                                                    : currentUserRole === "HEAD_BA"
                                                        ? "คลิกเพื่อลงชื่อ"
                                                        : ""}
                                        </span>
                                    </div>

                                    <div className="mb-2 flex items-center gap-2 whitespace-nowrap">
                                        <span className="text-gray-600 mr-2">วันที่:</span>
                                        <input
                                            type="date"
                                            disabled={currentUserRole !== "HEAD_BA"}
                                            value={new Date().toISOString().split("T")[0]}
                                            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-black font-FontNoto w-full cursor-pointer"
                                            style={{
                                                colorScheme: "light",
                                                minWidth: "100px",
                                            }}
                                        />
                                    </div>

                                    <div className="flex gap-4 mt-2">
                                        {selectedLeave.headBAApprovedAt || selectedLeave.status === "Rejected" ? (
                                            selectedLeave.status === "Rejected" ? (
                                                <div className="flex items-center gap-2 text-red-600 font-semibold">
                                                    <input
                                                        type="radio"
                                                        checked
                                                        disabled
                                                        className="h-4 w-4 appearance-none rounded-full border-2 border-red-500 bg-red-500"
                                                    />
                                                    ไม่อนุมัติแล้ว
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-green-600 font-semibold">
                                                    <input
                                                        type="radio"
                                                        checked
                                                        disabled
                                                        className="h-4 w-4 appearance-none rounded-full border-2 border-green-500 bg-green-500"
                                                    />
                                                    อนุมัติแล้ว
                                                </div>
                                            )
                                        ) : (
                                            <>
                                                <label className="flex items-center gap-2 text-green-600 font-semibold cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="approval_head"
                                                        disabled={currentUserRole !== "HEAD_BA"}
                                                        onChange={() => {
                                                            setConfirmAction("approve");
                                                            setShowConfirmModal(true);
                                                        }}
                                                        className="h-4 w-4 appearance-none rounded-full border-2 border-gray-300 checked:bg-green-500 checked:border-green-500 transition duration-150"
                                                    />
                                                    อนุมัติ
                                                </label>
                                                <label className="flex items-center gap-2 text-red-600 font-semibold cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="approval_head"
                                                        disabled={currentUserRole !== "HEAD_BA"}
                                                        onChange={() => {
                                                            setConfirmAction("reject");
                                                            setShowConfirmModal(true);
                                                        }}
                                                        className="h-4 w-4 appearance-none rounded-full border-2 border-gray-300 checked:bg-red-500 checked:border-red-500 transition duration-150"
                                                    />
                                                    ไม่อนุมัติ
                                                </label>
                                            </>
                                        )}
                                    </div>

                                </div>

                                <div className="border border-gray-300 rounded-lg p-4 shadow-sm bg-white text-gray-700 font-FontNoto text-sm max-w-sm">
                                    <p className="font-bold text-center mb-2">ฝ่ายทรัพยากรบุคคล</p>
                                    <div className="mb-2 flex items-center whitespace-nowrap">
                                        <span className="text-gray-600 mr-2">ลายมือชื่อ:</span>
                                        <span
                                            className={`inline-block border-b border-gray-400 w-48 h-6 align-bottom ml-1 px-2 
        ${hasSignedHR || selectedLeave.hrApprovedAt ? "text-black" : "text-gray-400 cursor-pointer hover:bg-yellow-100"}`}
                                            onClick={() => {
                                                if (
                                                    currentUserRole === "Hr" &&
                                                    !hasSignedHR &&
                                                    !selectedLeave?.hrApprovedAt
                                                ) {
                                                    setHasSignedHR(true);
                                                }
                                            }}
                                        >
                                            {selectedLeave.hrApprovedAt
                                                ? selectedLeave.hrComment?.replace("อนุมัติ ", "") || currentUserName
                                                : hasSignedHR
                                                    ? currentUserName
                                                    : currentUserRole === "Hr"
                                                        ? "คลิกเพื่อลงชื่อ"
                                                        : ""}
                                        </span>
                                    </div>

                                    <div className="mb-2 flex items-center gap-2 whitespace-nowrap">
                                        <span className="text-gray-600 mr-2">วันที่:</span>
                                        <input
                                            type="date"
                                            disabled={currentUserRole !== "Hr"}
                                            value={new Date().toISOString().split("T")[0]}
                                            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-black font-FontNoto w-full cursor-pointer"
                                            style={{
                                                colorScheme: "light",
                                                minWidth: "100px",
                                            }}
                                        />
                                    </div>
                                    <div className="flex gap-4 mt-2">
                                        {/* ปุ่ม อนุมัติ */}
                                        <label className="flex items-center gap-2 text-green-600 font-semibold cursor-pointer">
                                            <input
                                                type="radio"
                                                name="approval_hr"
                                                disabled={
                                                    currentUserRole !== "Hr" ||
                                                    !!selectedLeave.hrApprovedAt ||
                                                    !(selectedLeave.gmApprovedAt && selectedLeave.headBAApprovedAt)
                                                }
                                                onChange={() => {
                                                    if (!(selectedLeave.gmApprovedAt && selectedLeave.headBAApprovedAt)) {
                                                        alert("กรุณารอให้ หัวหน้า อนุมัติให้เรียบร้อยก่อน");
                                                        return;
                                                    }
                                                    setConfirmAction("approve");
                                                    setShowConfirmModal(true);
                                                }}
                                                className="h-4 w-4 appearance-none rounded-full border-2 border-gray-300 checked:bg-green-500 checked:border-green-500 transition duration-150"
                                            />
                                            อนุมัติ
                                        </label>

                                        {/* ปุ่ม ไม่อนุมัติ */}
                                        <label className="flex items-center gap-2 text-red-600 font-semibold cursor-pointer">
                                            <input
                                                type="radio"
                                                name="approval_hr"
                                                disabled={
                                                    currentUserRole !== "Hr" ||
                                                    !!selectedLeave.hrApprovedAt ||
                                                    !(selectedLeave.gmApprovedAt && selectedLeave.headBAApprovedAt)
                                                }
                                                onChange={() => {
                                                    if (!(selectedLeave.gmApprovedAt && selectedLeave.headBAApprovedAt)) {
                                                        alert("กรุณารอให้ หัวหน้า อนุมัติให้เรียบร้อยก่อน");
                                                        return;
                                                    }
                                                    setConfirmAction("reject");
                                                    setShowConfirmModal(true);
                                                }}
                                                className="h-4 w-4 appearance-none rounded-full border-2 border-gray-300 checked:bg-red-500 checked:border-red-500 transition duration-150"
                                            />
                                            ไม่อนุมัติ
                                        </label>
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>
                </div>
            )}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-xl p-6 w-[90%] max-w-md shadow-lg text-center font-FontNoto">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">ยืนยันการดำเนินการ</h2>
                        <p className="text-gray-700 mb-6">
                            คุณต้องการ{confirmAction === "approve" ? "อนุมัติ" : "ไม่อนุมัติ"}ใบลาฉบับนี้ใช่หรือไม่?
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={handleConfirmApproval}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                ยืนยัน
                            </button>
                            <button
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setConfirmAction(null);
                                }}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                            >
                                ยกเลิก
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div >
    );
};

export default LeaveRequestAdmin;