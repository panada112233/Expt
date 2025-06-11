import React, { useState, useEffect } from "react";
import axios from "axios";

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

const LeaveRequestForm = () => {
    const userId = sessionStorage.getItem("userId") || "";
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [leaveHistory, setLeaveHistory] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [showLeaveDetailModal, setShowLeaveDetailModal] = useState(false);
    const [selectedLeaveStats, setSelectedLeaveStats] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);


    const [form, setForm] = useState({
        userID: userId,
        leaveType: "",
        joinDate: "",
        timeType: "เต็มวัน",
        writtenDate: "",
        startDate: "",
        endDate: "",
        reason: "",
        contact: "",
        contactAddress: "",
        contactPhone: "",
        fullName: "",
        department: "",

        totalDays: 0,
        lastLeaveType: "",
        lastLeaveStart: "",
        lastLeaveEnd: "",
        lastLeaveDays: 0,

        leaveStats: {
            sick: { used: 0, current: 0, total: 0 },
            personal: { used: 0, current: 0, total: 0 },
            vacation: { used: 0, current: 0, total: 0 },
            ordain: { used: 0, current: 0, total: 0 },
            maternity: { used: 0, current: 0, total: 0 }

        }
    });
    const typeMap = {
        "ป่วย": "sick",
        "กิจส่วนตัว": "personal",
        "พักร้อน": "vacation",
        "บวช": "ordain",
        "ลาคลอด": "maternity"
    };
    const roleMapping = {
        Hr: "ทรัพยากรบุคคล",
        GM: "ผู้จัดการทั่วไป",
        Dev: "นักพัฒนาระบบ",
        BA: "นักวิเคราะห์ธุรกิจ",
        Employee: "พนักงาน",
    };

    const labelMap = {
        sick: "ป่วย",
        personal: "กิจส่วนตัว",
        vacation: "พักร้อน",
        ordain: "บวช",
        maternity: "ลาคลอด"
    };

    useEffect(() => {
        fetchLeaveTypes();
        fetchProfile();
        fetchLeaveHistory();
    }, []);

    useEffect(() => {
        if (showFormModal && !form.writtenDate) {
            const today = new Date().toISOString().split("T")[0];
            setForm(prev => ({ ...prev, writtenDate: today }));
        }
    }, [showFormModal]);

    useEffect(() => {

        if (form.contact) {
            const [address, phone] = form.contact.split(" / ");
            setForm(prev => ({
                ...prev,
                contactAddress: address || "",
                contactPhone: phone || ""
            }));
        }
        if (form.startDate && form.endDate) {
            const start = new Date(form.startDate);
            const end = new Date(form.endDate);
            let diffDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

            if (form.timeType === "ครึ่งวันเช้า" || form.timeType === "ครึ่งวันบ่าย") {
                diffDays = 0.5;
            }

            setForm(prevForm => ({
                ...prevForm,
                totalDays: diffDays > 0 ? diffDays : 0
            }));

            if (form.leaveType) {
                const typeKey = typeMap[form.leaveType] || null;
                if (!typeKey) return;

                setForm(prev => ({
                    ...prev,
                    leaveStats: {
                        ...prev.leaveStats,
                        [typeKey]: {
                            ...prev.leaveStats[typeKey],
                            current: diffDays > 0 ? diffDays : 0,
                            total: (prev.leaveStats[typeKey]?.used || 0) + (diffDays > 0 ? diffDays : 0)
                        }
                    }
                }));
            }
        }
    }, [form.contact, form.startDate, form.endDate, form.leaveType, form.timeType]);

    const showLeaveDetail = async (leave) => {
        try {
            const res = await axios.get(`https://localhost:7039/api/LeaveRequest/User/${leave.userID}`);
            if (res.status === 200) {
                const stats = {
                    sick: { used: 0, current: 0, total: 0 },
                    personal: { used: 0, current: 0, total: 0 },
                    vacation: { used: 0, current: 0, total: 0 },
                    ordain: { used: 0, current: 0, total: 0 },
                    maternity: { used: 0, current: 0, total: 0 },
                };

                const currentYear = new Date().getFullYear();

                res.data.forEach(item => {
                    const year = new Date(item.startDate).getFullYear();
                    const isHalfDay = item.timeType === "ครึ่งวันเช้า" || item.timeType === "ครึ่งวันบ่าย";
                    const days = isHalfDay
                        ? 0.5
                        : Math.floor((new Date(item.endDate) - new Date(item.startDate)) / (1000 * 60 * 60 * 24)) + 1;

                    // ✅ เฉพาะใบที่อนุมัติ ปีเดียวกัน และ user คนเดียวกัน
                    if (
                        item.status === "ApprovedByHR" &&
                        year === currentYear &&
                        String(item.userID) === String(leave.userID)
                    ) {
                        const type = typeMap[item.leaveType];
                        if (!type || !stats[type]) return;

                        const isSameLeave = String(item.id) === String(leave.id);
                        const isBeforeCurrentLeave = new Date(item.createdAt) < new Date(leave.createdAt);

                        if (isSameLeave) {
                            stats[type].current = days;
                        } else if (isBeforeCurrentLeave) {
                            stats[type].used += days;
                        }

                        stats[type].total = stats[type].used + stats[type].current;
                    }
                });

                Object.keys(stats).forEach(type => {
                    stats[type].total = stats[type].used + stats[type].current;
                });

                setSelectedLeaveStats(stats);
                setSelectedLeave(leave);
                setShowLeaveDetailModal(true); // ✅ เปิด modal หลังโหลดเสร็จ
            }
        } catch (error) {
            console.error("โหลดสถิติล้มเหลว", error);
            setSelectedLeaveStats(null);
        }
    };


    const fetchLeaveTypes = async () => {
        const res = await axios.get("https://localhost:7039/api/Document/GetLeaveTypes");
        setLeaveTypes(res.data);
    };

    const fetchProfile = async () => {
        const res = await axios.get(`https://localhost:7039/api/Users/Profile/${userId}`);
        if (res.data) {
            const user = res.data;
            setForm(prev => ({
                ...prev,
                fullName: `${user.firstName} ${user.lastName}`,
                department: user.role,
                joinDate: user.jDate?.split("T")[0] || "",
                contactPhone: user.contact || "", // ✅ ดึงจาก user
                contact: `${prev.contactAddress || ""} / ${user.contact || ""}`, // ✅ อัปเดต contact รวม
            }));
        }
    };


    const fetchLeaveHistory = async () => {
        try {
            const res = await axios.get(`https://localhost:7039/api/LeaveRequest/User/${userId}`);

            if (res.status === 200) {
                if (res.data.length === 0) {
                    return;
                }
                console.log(res.data)
                setLeaveHistory(res.data);

                const stats = {
                    sick: { used: 0, current: 0, total: 0 },
                    personal: { used: 0, current: 0, total: 0 },
                    vacation: { used: 0, current: 0, total: 0 },
                    ordain: { used: 0, current: 0, total: 0 },
                    maternity: { used: 0, current: 0, total: 0 }
                };

                const currentYear = new Date().getFullYear();

                res.data.forEach(item => {
                    const leaveStartYear = new Date(item.startDate).getFullYear();

                    if (item.status === "ApprovedByHR" && leaveStartYear === currentYear) {
                        let days;

                        if (item.timeType === "ครึ่งวันเช้า" || item.timeType === "ครึ่งวันบ่าย") {
                            days = 0.5;
                        } else {
                            days = Math.ceil((new Date(item.endDate) - new Date(item.startDate)) / (1000 * 60 * 60 * 24)) + 1;
                        }

                        const key = typeMap[item.leaveType];
                        if (key && stats[key]) {
                            stats[key].used += days;
                            stats[key].total = stats[key].used;
                        }
                    }
                });
                const lastLeave = res.data.find(r => r.status === "ApprovedByHR");
                if (lastLeave) {
                    let days = (new Date(lastLeave.endDate) - new Date(lastLeave.startDate)) / (1000 * 60 * 60 * 24) + 1;

                    // ตรวจสอบกรณีครึ่งวัน
                    if (lastLeave.timeType === "ครึ่งวันเช้า" || lastLeave.timeType === "ครึ่งวันบ่าย") {
                        days = 0.5;
                    }

                    setForm(prev => ({
                        ...prev,
                        lastLeaveStart: lastLeave.startDate.split("T")[0],
                        lastLeaveEnd: lastLeave.endDate.split("T")[0],
                        lastLeaveDays: days,
                        lastLeaveType: lastLeave.leaveType
                    }));
                }
                setForm(prev => ({
                    ...prev,
                    leaveStats: stats
                }));
            } else {
            }
        } catch (error) {
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {

        if (!form.userID || !form.leaveType || !form.timeType || !form.startDate || !form.endDate || !form.reason) {
            alert("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }

        const payload = {
            userID: form.userID,
            leaveType: form.leaveType,
            timeType: form.timeType,
            startDate: form.startDate,
            endDate: form.endDate,
            reason: form.reason,
            contact: form.contact || "",
        };

        try {
            const res = await axios.post("https://localhost:7039/api/LeaveRequest", payload);
            fetchLeaveHistory(); // โหลดใหม่หลังส่ง
            setShowSuccessModal(true); // ✅ เปิด modal popup สำเร็จ
        } catch (err) {
            alert("เกิดข้อผิดพลาดในการส่งฟอร์ม");
        }
    };
    return (
        <div className="flex flex-col w-full">
            <div className="w-full bg-gradient-to-r from-cyan-100 via-blue-100 to-blue-50 text-white rounded-xl p-4 sm:p-5 md:p-6 mb-6 shadow-lg">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-xl sm:text-2xl text-cyan-950 font-bold font-FontNoto leading-snug">
                            ระบบลางาน
                        </h1>
                        <p className="text-xs sm:text-sm mt-1 text-cyan-950 font-FontNoto">
                            จัดการข้อมูลการลาของพนักงาน
                        </p>
                    </div>
                    <button
                        onClick={() => setShowFormModal(true)}
                        className="btn btn-sm font-FontNoto !bg-sky-500 !text-white hover:bg-blue-600 flex items-center gap-2"
                    >
                        + แบบฟอร์มใบลา
                    </button>
                </div>
            </div>
            {showFormModal && (
                <div className="w-full bg-white rounded-xl p-4 sm:p-5 md:p-6 mb-6 shadow-lg">
                    <div className="flex justify-between items-start w-full mb-4 border-b-4 border-blue-600 pb-2">
                        <div>
                            <h1 className="text-xl sm:text-xl font-bold font-FontNoto text-black">แบบฟอร์มใบลา</h1>
                            <p className="text-base sm:text-sm font-FontNoto text-blue-800 leading-tight">THE EXPERTISE CO., LTD.</p>
                        </div>
                        <div className="text-right text-black">
                            <p className="text-sm font-FontNoto">วันที่เขียนแบบฟอร์ม</p>
                            <p className="font-FontNoto mt-1">
                                {form.writtenDate ? formatDateThai(form.writtenDate) : formatDateThai(new Date())}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-black">
                        <label className="block font-FontNoto whitespace-nowrap">เรื่อง : ขออนุญาติลา</label>
                        <select
                            name="leaveType"
                            value={form.leaveType}
                            onChange={handleChange}
                            className="font-FontNoto w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                            <option className="font-FontNoto" value=""> เลือกประเภทการลา </option>
                            {leaveTypes.map(type => (
                                <option className="font-FontNoto" key={type.leaveTypeid} value={type.leaveTypeTh}>
                                    {type.leaveTypeTh}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 w-full text-black">
                        <label className="font-FontNoto whitespace-nowrap min-w-fit">เรียน หัวหน้าแผนก/ฝ่ายบุคคล</label>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                        <div className="flex items-center gap-2 w-full">
                            <label className="font-FontNoto whitespace-nowrap w-16 sm:w-24 text-left sm:text-right">ข้าพเจ้า</label>
                            <input
                                type="text"
                                name="fullName"
                                value={form.fullName}
                                readOnly
                                className="font-FontNoto flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-black"
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full">
                            <label className="font-FontNoto whitespace-nowrap w-16 sm:w-24 text-left sm:text-right">ตำแหน่ง</label>
                            <input
                                type="text"
                                name="department"
                                value={roleMapping[form.department] || "-"}
                                readOnly
                                className="font-FontNoto flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-black"
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 w-full">
                        <label className="font-FontNoto whitespace-nowrap">ข้าพเจ้ามีความประสงค์ขอลาหยุดงาน เนื่องจาก</label>
                        <div className="flex flex-wrap gap-2">
                            {leaveTypes.map(type => (
                                <label key={type.leaveTypeid} className="flex items-center gap-2 font-FontNoto">
                                    <input
                                        type="radio"
                                        name="leaveType"
                                        value={type.leaveTypeTh}
                                        checked={form.leaveType === type.leaveTypeTh}
                                        onChange={handleChange}
                                        className="radio radio-sm"
                                    />
                                    {type.leaveTypeTh}
                                </label>
                            ))}
                        </div>
                        <label className="font-FontNoto whitespace-nowrap">ช่วงเวลา :</label>
                        <select
                            name="timeType"
                            value={form.timeType}
                            onChange={handleChange}
                            className="font-FontNoto w-40 px-3 py-2 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                            <option className="font-FontNoto" value="เต็มวัน">เต็มวัน</option>
                            <option className="font-FontNoto" value="ครึ่งวันเช้า">ครึ่งวันเช้า</option>
                            <option className="font-FontNoto" value="ครึ่งวันบ่าย">ครึ่งวันบ่าย</option>
                        </select>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
                        <label className="font-FontNoto whitespace-nowrap w-24">เนื่องจาก</label>
                        <input
                            type="text"
                            name="reason"
                            value={form.reason}
                            onChange={handleChange}
                            className="w-full font-FontNoto px-3 py-2 border border-gray-300 rounded-md bg-white text-black"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-4 w-full">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <label className="font-FontNoto whitespace-nowrap sm:w-36">ตั้งแต่วันที่</label>
                            <input
                                type="date"
                                name="startDate"
                                value={form.startDate}
                                onChange={handleChange}
                                className="font-FontNoto w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-md bg-white text-black"
                                style={{ colorScheme: "light" }}
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <label className="font-FontNoto whitespace-nowrap sm:w-36">ถึงวันที่</label>
                            <input
                                type="date"
                                name="endDate"
                                value={form.endDate}
                                onChange={handleChange}
                                className="font-FontNoto w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-md bg-white text-black"
                                style={{ colorScheme: "light" }}
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <label className="font-FontNoto whitespace-nowrap sm:w-36">จำนวนวันลา</label>
                            <input
                                type="number"
                                name="totalDays"
                                value={form.totalDays}
                                readOnly
                                className="font-FontNoto w-full sm:w-20 text-center px-3 py-2 border border-gray-300 rounded-md bg-white text-black"
                            />
                            <span className="font-FontNoto">วัน</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 w-full">
                        <label className="font-FontNoto whitespace-nowrap">ข้าพเจ้าได้ลา :</label>
                        <div className="flex flex-wrap gap-2">
                            {leaveTypes.map(type => (
                                <label key={type.leaveTypeid} className="flex items-center font-FontNoto gap-2">
                                    <input
                                        type="radio"
                                        name="leaveTypeLast"
                                        value={type.leaveTypeTh}
                                        checked={form.lastLeaveType === type.leaveTypeTh}
                                        disabled
                                        className="radio radio-sm font-FontNoto"
                                    />
                                    <span className="font-FontNoto">{type.leaveTypeTh}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 w-full">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <label className="font-FontNoto whitespace-nowrap sm:w-36">ครั้งสุดท้าย ตั้งแต่วันที่ :</label>
                            <input
                                type="date"
                                name="lastLeaveStart"
                                value={form.lastLeaveStart}
                                onChange={handleChange}
                                readOnly
                                className="font-FontNoto w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-md bg-white text-black"
                                style={{ colorScheme: "light" }}
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <label className="font-FontNoto whitespace-nowrap sm:w-36">ถึงวันที่ :</label>
                            <input
                                type="date"
                                name="lastLeaveEnd"
                                value={form.lastLeaveEnd}
                                onChange={handleChange}
                                readOnly
                                className="font-FontNoto w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-md bg-white text-black"
                                style={{ colorScheme: "light" }}
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <label className="font-FontNoto whitespace-nowrap sm:w-36">จำนวนวัน :</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    name="lastLeaveDays"
                                    value={form.lastLeaveDays}
                                    readOnly
                                    className="font-FontNoto w-full sm:w-20 text-center px-3 py-2 border border-gray-300 rounded-md bg-white text-black"
                                />
                                <span className="font-FontNoto">วัน</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 w-full">
                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                            <label className="font-FontNoto whitespace-nowrap flex-shrink-0 w-full sm:w-64">ช่องทางการติดต่อระหว่างลา</label>
                            <input
                                type="text"
                                value={form.contactAddress || ""}
                                onChange={(e) => {
                                    const contact = `${e.target.value} / ${form.contactPhone || ""}`;
                                    setForm(prev => ({ ...prev, contact, contactAddress: e.target.value }));
                                }}
                                className="font-FontNoto flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-black"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                            <label className="font-FontNoto whitespace-nowrap flex-shrink-0 w-full sm:w-44">
                                เบอร์โทรศัพท์
                            </label>
                            <input
                                type="text"
                                value={form.contactPhone || "-"}
                                readOnly
                                className="font-FontNoto flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-black"
                            />
                        </div>
                    </div>

                    <div className="mt-6 sm:mt-10">
                        <h2 className="font-bold font-FontNoto mb-2">สถิติการลาในปีนี้ (วันเริ่มงาน:) {formatDateThai(form.joinDate) || "ไม่พบข้อมูล"}</h2>
                        <div className="overflow-x-auto">
                            <table className="table w-full text-center text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="font-FontNoto">ประเภทการลา</th>
                                        <th className="font-FontNoto">ลามาแล้ว (วัน)</th>
                                        <th className="font-FontNoto">ลาครั้งนี้ (วัน)</th>
                                        <th className="font-FontNoto">รวม (วัน)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(form.leaveStats).map(([type, stats]) => (
                                        <tr key={type}>
                                            <td className="capitalize font-FontNoto">{labelMap[type]}</td>
                                            <td><input type="text" readOnly className="input input-bordered w-16 sm:w-24 text-center font-FontNoto !bg-white !text-black" value={stats.used} /></td>
                                            <td><input type="text" readOnly className="input input-bordered w-16 sm:w-24 text-center font-FontNoto !bg-white !text-black" value={stats.current} /></td>
                                            <td><input type="text" readOnly className="input input-bordered w-16 sm:w-24 text-center font-FontNoto !bg-white !text-black" value={stats.total} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="text-center mt-6">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="btn btn-primary px-4 sm:px-6 py-2 rounded-xl shadow font-FontNoto"
                        >
                            ส่งใบลา
                        </button>
                    </div>
                    <div className="mt-6 sm:mt-10">
                        <h2 className="text-lg sm:text-xl font-semibold font-FontNoto mb-2">ประวัติการลา</h2>
                        <div className="overflow-x-auto">
                            <table className="table w-full text-xs sm:text-sm">
                                <thead>
                                    <tr className="bg-gray-100 text-gray-700">
                                        <th className="font-FontNoto px-1 sm:px-2">วันที่เขียน</th>
                                        <th className="font-FontNoto px-1 sm:px-2">ประเภท</th>
                                        <th className="font-FontNoto px-1 sm:px-2">เริ่ม</th>
                                        <th className="font-FontNoto px-1 sm:px-2">ถึง</th>
                                        <th className="font-FontNoto px-1 sm:px-2">สถานะ</th>
                                        <th className="font-FontNoto px-1 sm:px-2 ">ดูใบลา</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaveHistory.length > 0 ? (
                                        leaveHistory.map((leave, index) => (
                                            <tr
                                                key={index}
                                                className="hover:bg-gray-50 font-FontNoto cursor-pointer"
                                            >
                                                <td className="font-FontNoto px-1 sm:px-2">{new Date(leave.createdAt).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                                                <td className="font-FontNoto px-1 sm:px-2">{leave.leaveType}</td>
                                                <td className="...">
                                                    {new Date(leave.startDate).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                </td>
                                                <td className="...">
                                                    {new Date(leave.endDate).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                </td>

                                                <td className={`font-semibold font-FontNoto px-1 sm:px-2 ${leave.status === "Rejected" ? "text-red-600" : leave.status === "ApprovedByHR" ? "text-green-600" : "text-yellow-600"}`}>
                                                    {leave.status === "ApprovedByHR" ? "อนุมัติ" : leave.status === "Rejected" ? "ไม่อนุมัติ" : "รอดำเนินการ"}
                                                </td>
                                                <td className="font-FontNoto px-1 sm:px-2">
                                                    <button
                                                        className="btn btn-sm btn-outline btn-info"
                                                        onClick={() => showLeaveDetail(leave)}
                                                    >
                                                        ดูใบลา
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="text-center py-4 font-FontNoto">ไม่พบประวัติการลา</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="flex justify-between items-center mb-6">
                        <button
                            className="btn btn-error btn-sm font-FontNoto"
                            onClick={() => setShowFormModal(false)}
                        >
                            ยกเลิก
                        </button>
                    </div>

                    {showLeaveDetailModal && selectedLeave && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto font-FontNoto">
                            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 space-y-4">
                                <div className="flex justify-center items-center gap-4 mb-4 font-FontNoto text-lg font-bold">
                                    <span className="font-FontNoto">แบบฟอร์มใบลา {new Date(selectedLeave.createdAt).toLocaleDateString("th-TH")}</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                    <p className="font-FontNoto"><span className="font-bold font-FontNoto">ประเภทการลา:</span> {selectedLeave.leaveType}</p>
                                    <p className="font-FontNoto"><span className="font-bold font-FontNoto">ช่วงเวลา:</span> {selectedLeave.timeType}</p>
                                    <p className="font-FontNoto"><span className="font-bold font-FontNoto">ตั้งแต่:</span> {new Date(selectedLeave.startDate).toLocaleDateString("th-TH")}</p>
                                    <p className="font-FontNoto"><span className="font-bold font-FontNoto">ถึง:</span> {new Date(selectedLeave.endDate).toLocaleDateString("th-TH")}</p>
                                    <p className="font-FontNoto">
                                        <span className="font-bold font-FontNoto">เนื่องจาก :</span> {selectedLeave.reason}</p>
                                    <p className="font-FontNoto">
                                        <span className="font-bold font-FontNoto">จำนวนวันลา :</span> {selectedLeave.timeType.includes("ครึ่ง") ? "0.5" : Math.floor((new Date(selectedLeave.endDate) - new Date(selectedLeave.startDate)) / (1000 * 60 * 60 * 24)) + 1} วัน</p>
                                    {(() => {
                                        const [address, phone] = (selectedLeave.contact || "").split(" / ");
                                        return (
                                            <>
                                                <p className="font-FontNoto"><span className="font-bold font-FontNoto">ติดต่อได้ที่ :</span> {address || "-"}</p>
                                                <p className="font-FontNoto"><span className="font-bold font-FontNoto">เบอร์ :</span> {phone || "-"}</p>
                                            </>
                                        );
                                    })()}

                                    <p className="sm:col-span-2">
                                        <span className="font-bold font-FontNoto">สถานะ:</span>{" "}
                                        <span className={`font-bold ml-2 font-FontNoto ${selectedLeave.status === "ApprovedByHR"
                                            ? "text-green-600"
                                            : selectedLeave.status === "Rejected"
                                                ? "text-red-600"
                                                : "text-yellow-600"
                                            }`}>
                                            {selectedLeave.status === "ApprovedByHR"
                                                ? "อนุมัติแล้ว"
                                                : selectedLeave.status === "Rejected"
                                                    ? "ไม่อนุมัติ"
                                                    : "รอดำเนินการ"}
                                        </span>
                                    </p>

                                    {selectedLeave.status === "Rejected" && (
                                        <p className="sm:col-span-2">
                                            <span className="font-bold font-FontNoto">เหตุผลที่ไม่อนุมัติ:</span> {selectedLeave.hrComment || selectedLeave.gmComment || "-"}
                                        </p>
                                    )}
                                </div>

                                {/* ✅ ตารางสถิติจาก selectedLeaveStats */}
                                {selectedLeaveStats && (
                                    <div className="mt-6">
                                        <h4 className="text-lg font-bold mb-2 font-FontNoto">สถิติการลาในปีนี้</h4>
                                        <div className="overflow-x-auto">
                                            <table className="table w-full text-sm text-center">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="font-FontNoto">ประเภทการลา</th>
                                                        <th className="font-FontNoto">ลามาแล้ว (วัน)</th>
                                                        <th className="font-FontNoto">ลาครั้งนี้ (วัน)</th>
                                                        <th className="font-FontNoto">รวม (วัน)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {Object.entries(selectedLeaveStats).map(([type, stats]) => (
                                                        <tr key={type}>
                                                            <td className="font-FontNoto">{labelMap[type]}</td>
                                                            <td>{stats.used}</td>
                                                            <td>{stats.current}</td>
                                                            <td>{stats.total}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                <div className="text-center mt-6">
                                    <button
                                        className="btn btn-primary px-8"
                                        onClick={() => setShowLeaveDetailModal(false)}
                                    >
                                        ปิด
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {isModalOpen && (
                        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
                            <div className="bg-white p-5 rounded-lg shadow-xl w-full max-w-xs sm:max-w-md font-FontNoto">
                                <h3 className="font-bold text-lg mb-3 font-FontNoto">ยืนยันการส่งใบลา</h3>
                                <p className="mb-4 font-FontNoto">คุณตรวจทานใบลาเรียบร้อยแล้วใช่ไหม?</p>
                                <div className="flex justify-end gap-2">
                                    <button
                                        className="btn btn-sm sm:btn-md font-FontNoto"
                                        onClick={() => setIsModalOpen(false)}
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        className="btn btn-sm sm:btn-md btn-primary font-FontNoto"
                                        onClick={async () => {
                                            if (!form.leaveType) {
                                                alert("กรุณาเลือกประเภทการลา");
                                                return;
                                            }
                                            await handleSubmit();
                                            setIsModalOpen(false);
                                        }}
                                    >
                                        ตกลง
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {showSuccessModal && (
                        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
                            <div className="bg-white p-5 rounded-lg shadow-xl w-full max-w-xs sm:max-w-md font-FontNoto">
                                <div className="flex items-center justify-center mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-lg text-center text-green-600 font-FontNoto mb-2">ส่งคำขอลาสำเร็จ</h3>
                                <p className="text-center py-2 font-FontNoto">
                                    ระบบได้รับคำขอลาของคุณแล้ว
                                </p>
                                <div className="flex justify-center mt-4">
                                    <button
                                        className="btn btn-primary font-FontNoto px-8"
                                        onClick={() => setShowSuccessModal(false)}
                                    >
                                        ปิด
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LeaveRequestForm;