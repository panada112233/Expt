import React, { useState, useEffect } from "react";
import axios from "axios";
import clsx from "clsx";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


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
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;


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
        GM: "ผู้จัดการทั่วไป",
        Hr: "เลขานุการฝ่ายบริหาร",
        HEAD_BA: "หัวหน้าฝ่ายนักวิเคราะห์ธุรกิจ",
        SENIOR_DEV: "Senior Programmer",
        Dev: "Programmer",
        BA: "นักวิเคราะห์ธุรกิจ (BA)",
        TESTER: "Software Tester",
        JUNIOR_DEV: "Junior Programmer",
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

    const uploadAttachment = async () => {
        if (!form.attachment) return;

        const formData = new FormData();
        formData.append("UserID", form.userID);
        formData.append("Category", form.documentType || "อื่นๆ");
        formData.append("Description", "เอกสารประกอบใบลา");
        formData.append("File", form.attachment);

        try {
            const res = await axios.post("https://192.168.1.188/hrwebapi/api/Files/Create", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.status === 201) {
                // บันทึกเสร็จแล้ว
                const newFile = res.data;
                setForm((prev) => ({
                    ...prev,
                    uploadedFileUrl: `https://192.168.1.188${newFile.filePath}`,
                    filePath: newFile.filePath
                }));
            }

        } catch (error) {
            console.error("อัปโหลดไฟล์ไม่สำเร็จ", error);
        }
    };

    const showLeaveDetail = async (leave) => {
        try {
            const res = await axios.get(`https://192.168.1.188/hrwebapi/api/LeaveRequest/User/${leave.userID}`);
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
                const latestLeave = res.data.find(l => l.id === leave.id) || leave;
                setSelectedLeave(latestLeave);

                setShowLeaveDetailModal(true);
            }
        } catch (error) {
            console.error("โหลดสถิติล้มเหลว", error);
            setSelectedLeaveStats(null);
        }
    };

    const fetchLeaveTypes = async () => {
        const res = await axios.get("https://192.168.1.188/hrwebapi/api/Document/GetLeaveTypes");
        setLeaveTypes(res.data);
    };

    const fetchProfile = async () => {
        const res = await axios.get(`https://192.168.1.188/hrwebapi/api/Users/Profile/${userId}`);
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
            const res = await axios.get(`https://192.168.1.188/hrwebapi/api/LeaveRequest/User/${userId}`);

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

                // ✅ เพิ่มส่วน monthly data สำหรับกราฟประเภทการลา
                const monthly = Array.from({ length: 12 }, () => ({
                    sick: 0,
                    personal: 0,
                    vacation: 0,
                    ordain: 0,
                    maternity: 0
                }));

                res.data.forEach(item => {
                    const leaveStart = new Date(item.startDate);
                    const leaveStartYear = leaveStart.getFullYear();

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

                            // ✅ เพิ่ม: บันทึกค่าแบบรายเดือน
                            const monthIndex = leaveStart.getMonth(); // 0-11
                            monthly[monthIndex][key] += days;
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

                // ✅ เพิ่ม: ตั้งค่า leaveStats + monthly + leaveHistory
                setForm(prev => ({
                    ...prev,
                    leaveStats: {
                        ...stats,
                        monthly: monthly.map((m, i) => ({ month: i + 1, ...m }))
                    },
                    leaveHistory: res.data
                }));
            } else {
                // ถ้า status ไม่ใช่ 200
            }
        } catch (error) {
            // จัดการ error ที่อาจเกิดขึ้น
            console.error("โหลดประวัติการลาล้มเหลว", error);
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

        let filePath = null;

        // ⬅️ 1. ถ้ามีไฟล์แนบ อัปโหลดก่อน
        if (form.attachment) {
            const fileData = new FormData();
            fileData.append("UserID", form.userID);
            fileData.append("Category", form.documentType || "อื่นๆ");
            fileData.append("Description", "เอกสารประกอบใบลา");
            fileData.append("File", form.attachment);

            try {
                const fileRes = await axios.post("https://192.168.1.188/hrwebapi/api/Files/Create", fileData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });

                if (fileRes.status === 201) {
                    filePath = fileRes.data.filePath; // ✅ ดึง path จาก response
                }
            } catch (uploadErr) {
                console.error("อัปโหลดไฟล์ไม่สำเร็จ", uploadErr);
                alert("อัปโหลดไฟล์แนบไม่สำเร็จ");
                return;
            }
        }

        const payload = {
            userID: form.userID,
            leaveType: form.leaveType,
            timeType: form.timeType,
            startDate: form.startDate,
            endDate: form.endDate,
            reason: form.reason,
            contact: form.contact || "",
            filePath: filePath || null // ✅ ใช้ค่าที่ได้จากการอัปโหลด
        };

        try {
            const res = await axios.post("https://192.168.1.188/hrwebapi/api/LeaveRequest", payload);
            fetchLeaveHistory(); // โหลดใหม่
            setShowSuccessModal(true);
        } catch (err) {
            console.error("ส่งใบลาไม่สำเร็จ", err);
            alert("เกิดข้อผิดพลาดในการส่งฟอร์ม");
        }
    };

    const createPDF = (form) => {
        if (!form) {
            alert("ไม่พบข้อมูลเอกสาร");
            return;
        }

        const formatDate = (date) => {
            try {
                if (!date) return "-";
                const d = new Date(date);
                if (isNaN(d)) return "-";
                return new Intl.DateTimeFormat("th-TH", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit"
                }).format(d);
            } catch {
                return "-";
            }
        };

        const docDefinition = {
            content: [
                { text: "แบบฟอร์มใบลา", style: "header" },
                { text: `วันที่ : ${formatDate(form.writtenDate)}`, alignment: "right", margin: [0, 0, 0, 10] },
                { text: `เรื่อง : ขออนุญาติลา : ${form.leaveType || '-'}`, margin: [0, 0, 0, 10] },
                { text: `เรียน หัวหน้าแผนก/ฝ่ายบุคคล`, margin: [0, 0, 0, 10] },
                {
                    table: {
                        widths: ["auto", "*"],
                        body: [
                            ["ข้าพเจ้า :", `${form.fullName || '-'} ตำแหน่ง ${roleMapping[form.department] || '-'}`],
                            ["ขอลา :", `${form.leaveType || '-'} เนื่องจาก ${form.reason || '-'}`],
                            ["ตั้งแต่วันที่ :", ` ${formatDate(form.startDate)} ถึงวันที่ :${formatDate(form.endDate)} มีกำหนด : ${form.totalDays || '0'} วัน | ช่วงเวลา : ${form.timeType || '-'}`],
                            ["ข้าพเจ้าได้ลา :", `${form.lastLeaveType || '-'} ครั้งสุดท้าย ตั้งแต่วันที่ : ${formatDate(form.lastLeaveStart)} ถึงวันที่ : ${formatDate(form.lastLeaveEnd)} รวม ${form.lastLeaveDays || '0'} วัน`]
                        ]
                    },
                    layout: "noBorders",
                    margin: [0, 0, 0, 20]
                },
                {
                    text: `ในระหว่างลา ติดต่อข้าพเจ้าได้ที่ : ${form.contactAddress || '-'}, เบอร์ติดต่อ ${form.contactPhone || '-'}`,
                    margin: [0, 0, 0, 20]
                },
                {
                    text: `สถิติการลาในปีนี้ (วันเริ่มงาน: ${formatDate(form.joinDate)})`, style: "subheader", margin: [0, 0, 0, 10]
                },
                {
                    table: {
                        widths: ["*", "*", "*", "*"],
                        body: [
                            [
                                { text: "ประเภทลา", style: "tableHeader" },
                                { text: "ลามาแล้ว", style: "tableHeader" },
                                { text: "ลาครั้งนี้", style: "tableHeader" },
                                { text: "รวมเป็น", style: "tableHeader" }
                            ],
                            ...Object.entries(form.leaveStats || {}).map(([type, stats]) => [
                                labelMap[type] || type,
                                stats.used || 0,
                                stats.current || 0,
                                stats.total || 0
                            ])
                        ]
                    },
                    layout: "lightHorizontalLines",
                    margin: [0, 0, 0, 20]
                },
                {
                    columns: [
                        { width: '*', text: '' },
                        { width: '*', text: '' },
                        { width: '*', text: `ลงชื่อ ....${form.fullName || '-'}.....`, alignment: "center" },
                    ],
                    margin: [0, 20, 0, 0]
                },
                {
                    columns: [
                        { width: '*', text: '' },
                        { width: '*', text: '' },
                        { width: '*', text: `(${form.fullName || '-'})`, alignment: "center" },
                    ],
                    margin: [0, 0, 0, 0]
                },
                {
                    columns: [
                        { width: '*', text: '' },
                        { width: '*', text: '' },
                        { width: '*', text: "พนักงาน", alignment: "center" },
                    ],
                    margin: [0, 0, 0, 10]
                },
                {
                    columns: [
                        { width: '*', text: '' },
                        { width: '*', text: '' },
                        { width: '*', text: "ขอแสดงความนับถือ", alignment: "center" },
                    ],
                    margin: [0, 0, 0, 10]
                },
                {
                    columns: [
                        { width: '33.33%', text: `ลงชื่อ ....${(form.gmComment || '-').replace('อนุมัติ ', '')}.....`, alignment: "center" },
                        { width: '33.33%', text: `ลงชื่อ ....${(form.headComment || '-').replace('อนุมัติ ', '')}.....`, alignment: "center" },
                        { width: '33.33%', text: `ลงชื่อ ....${(form.hrComment || '-').replace('อนุมัติ ', '')}.....`, alignment: "center" },
                    ],
                    margin: [0, 10, 0, 0]
                },
                {
                    columns: [
                        { width: '33.33%', text: `(${(form.gmComment || '-').replace('อนุมัติ ', '')})`, alignment: "center" },
                        { width: '33.33%', text: `(${(form.headComment || '-').replace('อนุมัติ ', '')})`, alignment: "center" },
                        { width: '33.33%', text: `(${(form.hrComment || '-').replace('อนุมัติ ', '')})`, alignment: "center" },
                    ],
                    margin: [0, 0, 0, 0]
                },
                {
                    columns: [
                        { width: '33.33%', text: "ผู้จัดการทั่วไป", alignment: "center" },
                        { width: '33.33%', text: "หัวหน้าฝ่ายนักวิเคราะห์ธุรกิจ", alignment: "center" },
                        { width: '33.33%', text: "ทรัพยากรบุคคล", alignment: "center" },
                    ],
                    margin: [0, 5, 0, 0]
                }

            ],
            styles: {
                header: { fontSize: 18, bold: true, alignment: "center" },
                subheader: { fontSize: 16, bold: true },
                tableHeader: { bold: true }
            },
            defaultStyle: {
                font: "THSarabunNew",
                fontSize: 16
            }
        };

        pdfMake.createPdf(docDefinition).download("ใบลาที่อนุมัติแล้ว.pdf");
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
            {!showFormModal && (
                <>
                    <div className="overflow-x-auto sm:overflow-visible px-3 ">
                        <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-5 gap-4 font-FontNoto min-w-[640px] sm:min-w-0">
                            <div className="flex-shrink-0 w-[250px] sm:w-auto bg-white shadow rounded-xl p-4">
                                <p className="text-sm text-gray-600 font-FontNoto mb-1 flex justify-between items-center">
                                    ลาป่วยที่ใช้ไป <span className="text-blue-500"><i className="fas fa-clock"></i></span>
                                </p>
                                <p className="text-xl font-bold font-FontNoto">{form.leaveStats.sick.used || 0}/30 วัน</p>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(form.leaveStats.sick.used / 30) * 100}%` }}></div>
                                </div>
                            </div>
                            <div className="flex-shrink-0 w-[250px] sm:w-auto bg-white shadow rounded-xl p-4">
                                <p className="text-sm text-gray-600 font-FontNoto mb-1 flex justify-between items-center">
                                    ลากิจส่วนตัวที่ใช้ไป <span className="text-green-500"><i className="fas fa-envelope-open-text"></i></span>
                                </p>
                                <p className="text-xl font-bold font-FontNoto">{form.leaveStats.personal.used || 0}/7 วัน</p>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(form.leaveStats.personal.used / 7) * 100}%` }}></div>
                                </div>
                            </div>
                            <div className="flex-shrink-0 w-[250px] sm:w-auto bg-white shadow rounded-xl p-4">
                                <p className="text-sm text-gray-600 font-FontNoto mb-1 flex justify-between items-center">
                                    ลาพักร้อนที่ใช้ไป <span className="text-orange-500"><i className="fas fa-home"></i></span>
                                </p>
                                <p className="text-xl font-bold font-FontNoto">{form.leaveStats.vacation.used || 0}/7 วัน</p>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div className="bg-orange-400 h-2 rounded-full" style={{ width: `${(form.leaveStats.vacation.used / 7) * 100}%` }}></div>
                                </div>
                            </div>
                            <div className="flex-shrink-0 w-[250px] sm:w-auto bg-white shadow rounded-xl p-4">
                                <p className="text-sm text-gray-600 font-FontNoto mb-1 flex justify-between items-center">
                                    ลาคลอดที่ใช้ไป <span className="text-purple-500"><i className="fas fa-calendar-check"></i></span>
                                </p>
                                <p className="text-xl font-bold font-FontNoto">{form.leaveStats.maternity.used || 0}/90 วัน</p>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${(form.leaveStats.maternity.used / 90) * 100}%` }}></div>
                                </div>
                            </div>
                            <div className="flex-shrink-0 w-[250px] sm:w-auto bg-white shadow rounded-xl p-4">
                                <p className="text-sm text-gray-600 font-FontNoto mb-1 flex justify-between items-center">
                                    ลาบวชที่ใช้ไป <span className="text-red-500"><i className="fas fa-calendar-alt"></i></span>
                                </p>
                                <p className="text-xl font-bold font-FontNoto">{form.leaveStats.ordain.used || 0}/15 วัน</p>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(form.leaveStats.ordain.used / 15) * 100}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 px-3">
                        {/* กราฟสถิติประเภทการลา (รายเดือน) */}
                        <div className="bg-white shadow rounded-xl p-4">
                            <h2 className="font-bold text-lg mb-4 text-black font-FontNoto">สถิติประเภทการลา (รายปี)</h2>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart
                                    data={Array.from({ length: 12 }, (_, i) => {
                                        const monthData = form.leaveStats.monthly?.find(m => m.month === i + 1) || {};
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
                                        const currentYear = new Date().getFullYear();

                                        const monthlyStatus = Array.from({ length: 12 }, (_, i) => ({
                                            month: thaiMonths[i],
                                            approved: 0,
                                            pending: 0,
                                            rejected: 0,
                                            noForm: 0,
                                        }));

                                        form.leaveHistory?.forEach((item) => {
                                            const start = new Date(item.startDate);
                                            if (start.getFullYear() !== currentYear) return;

                                            const m = start.getMonth(); // 0-11
                                            const status = item.status;

                                            if (status === "ApprovedByManager" || status === "ApprovedByHR") {
                                                monthlyStatus[m].approved += 1;
                                            } else if (status === "Rejected") {
                                                monthlyStatus[m].rejected += 1;
                                            } else {
                                                monthlyStatus[m].pending += 1;
                                            }
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

                    <div className="flex flex-col lg:flex-row gap-4 mt-6 px-3">
                        <div className="flex-1 bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-lg font-bold font-FontNoto text-black mb-4">
                                ประวัติการลา&nbsp;
                                <span className="font-normal text-black text-base">
                                    (วันเริ่มงาน: {formatDateThai(form.joinDate) || "ไม่พบข้อมูล"})
                                </span>
                            </h2>

                            <div className="grid grid-cols-1 gap-4 font-FontNoto">
                                {leaveHistory.length > 0 ? (
                                    leaveHistory
                                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                        .map((leave, index) => {
                                            const borderColorClass = {
                                                "พักร้อน": "!border-l-orange-500",
                                                "ป่วย": "!border-l-blue-500",
                                                "กิจส่วนตัว": "!border-l-green-500",
                                                "ลาคลอด": "!border-l-purple-500",
                                            }[leave.leaveType] || "!border-l-red-600";

                                            return (
                                                <div
                                                    key={index}
                                                    className={clsx(
                                                        "relative p-2 pt-1 rounded-xl bg-gray-50 min-h-[100px] shadow-sm flex flex-col justify-between border-l-4",
                                                        borderColorClass
                                                    )}
                                                >
                                                    <span
                                                        className={`absolute top-3 right-4 text-sm font-semibold ${leave.status === "ApprovedByHR"
                                                            ? "text-green-600"
                                                            : leave.status === "Rejected"
                                                                ? "text-red-500"
                                                                : leave.status === "Edited"
                                                                    ? "text-purple-500"
                                                                    : "text-yellow-500"
                                                            }`}
                                                    >
                                                        {leave.status === "ApprovedByHR"
                                                            ? "อนุมัติแล้ว"
                                                            : leave.status === "Rejected"
                                                                ? "ไม่อนุมัติ"
                                                                : leave.status === "Edited"
                                                                    ? "แก้ไขแบบฟอร์มใบลา"
                                                                    : "รอดำเนินการ"}
                                                    </span>

                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-600 mb-1">
                                                            <span className="text-base font-bold text-current">
                                                                {leave.leaveType === "ลาคลอด"
                                                                    ? "ลาคลอด"
                                                                    : `ลา${leave.leaveType}`}
                                                            </span>{" "}
                                                            {Math.ceil(
                                                                (new Date(leave.endDate) - new Date(leave.startDate)) /
                                                                (1000 * 60 * 60 * 24)
                                                            ) + 1}{" "}
                                                            วัน
                                                        </div>
                                                        <div className="text-sm font-semibold text-black mb-1">
                                                            เนื่องจาก:{" "}
                                                            <span className="font-semibold text-gray-700">{leave.reason}</span>
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {new Date(leave.startDate).toLocaleDateString("th-TH", {
                                                                day: "numeric",
                                                                month: "long",
                                                                year: "numeric",
                                                            })}{" "}
                                                            -{" "}
                                                            {new Date(leave.endDate).toLocaleDateString("th-TH", {
                                                                day: "numeric",
                                                                month: "long",
                                                                year: "numeric",
                                                            })}
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 flex justify-end gap-2">
                                                        <button
                                                            className="px-4 py-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-FontNoto w-fit"
                                                            onClick={() => showLeaveDetail(leave)}
                                                        >
                                                            แสดงรายละเอียด
                                                        </button>

                                                        {leave.status === "ApprovedByHR" && (
                                                            <button
                                                                onClick={() => {
                                                                    if (!selectedLeaveStats) {
                                                                        alert("กรุณากด 'แสดงรายละเอียด' ก่อนดาวน์โหลด เพื่อให้ข้อมูลการลาครั้งก่อนแสดงถูกต้อง");
                                                                        return;
                                                                    }

                                                                    const fullName = form.fullName || "ไม่พบข้อมูล";
                                                                    const department = form.department || "ไม่พบข้อมูล";

                                                                    createPDF({
                                                                        ...leave,
                                                                        writtenDate: leave.createdAt,
                                                                        fullName,
                                                                        department,
                                                                        joinDate: form.joinDate || leave.user?.jDate?.split("T")[0] || "-",
                                                                        contact: leave.contact || "",
                                                                        contactAddress: leave.contact?.split(" / ")[0] || "",
                                                                        contactPhone: leave.contact?.split(" / ")[1] || "",
                                                                        timeType: leave.timeType || "",
                                                                        reason: leave.reason || "",
                                                                        totalDays:
                                                                            leave.timeType?.includes("ครึ่ง")
                                                                                ? 0.5
                                                                                : Math.floor(
                                                                                    (new Date(leave.endDate) - new Date(leave.startDate)) /
                                                                                    (1000 * 60 * 60 * 24)
                                                                                ) + 1,
                                                                        leaveStats: selectedLeaveStats,

                                                                        headComment: leave.headBAComment || "-",
                                                                        gmComment: leave.gmComment || "-",
                                                                        hrComment: leave.hrComment || "-",
                                                                        lastLeaveType: form.lastLeaveType || "-",
                                                                        lastLeaveStart: form.lastLeaveStart || "-",
                                                                        lastLeaveEnd: form.lastLeaveEnd || "-",
                                                                        lastLeaveDays: form.lastLeaveDays || 0
                                                                    });
                                                                }}
                                                                className="px-4 py-1.5 text-white bg-green-600 hover:bg-green-700 rounded-md text-sm font-FontNoto w-fit"
                                                            >
                                                                ดาวน์โหลด
                                                            </button>
                                                        )}
                                                    </div>

                                                </div>
                                            );
                                        })
                                ) : (
                                    <p className="text-center col-span-full text-gray-500">
                                        ไม่พบประวัติการลา
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-center items-center gap-2 mt-4">
                                <button
                                    className="btn btn-sm font-FontNoto !bg-white border !border-gray-300 !text-gray-700 !hover:bg-gray-100"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                >
                                    ก่อนหน้า
                                </button>
                                {[...Array(Math.ceil(leaveHistory.length / itemsPerPage)).keys()].map((num) => (
                                    <button
                                        key={num + 1}
                                        onClick={() => setCurrentPage(num + 1)}
                                        className={`btn btn-sm font-FontNoto ${currentPage === num + 1
                                            ? "!bg-blue-500 !text-white"
                                            : "!bg-white border border-gray-300 !text-gray-700 hover:bg-gray-100"
                                            }`}
                                    >
                                        {num + 1}
                                    </button>
                                ))}
                                <button
                                    className="btn btn-sm font-FontNoto !bg-white border !border-gray-300 !text-gray-700 !hover:bg-gray-100"
                                    disabled={currentPage === Math.ceil(leaveHistory.length / itemsPerPage)}
                                    onClick={() => setCurrentPage((prev) => prev + 1)}
                                >
                                    ถัดไป
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 w-full lg:w-[25%] xl:w-[35%]">

                            <div className="bg-white shadow-md rounded-xl p-5 flex-1">
                                <h3 className="text-md font-bold font-FontNoto mb-2 text-black">วันหยุดประจำปี 2568</h3>
                                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-800 font-FontNoto">
                                    <li><span className="font-bold text-black">วันพุธที่ 1 มกราคม :</span> วันขึ้นปีใหม่</li>
                                    <li><span className="font-bold text-black">วันพุธที่ 12 กุมภาพันธ์ :</span> วันมาฆบูชา</li>
                                    <li><span className="font-bold text-black">วันจันทร์ที่ 7 เมษายน :</span> ชดเชยวันจักรี (อาทิตย์ที่ 6 เมษายน : วันจักรี)</li>
                                    <li><span className="font-bold text-black">วันจันทร์ที่ 14 - 15 เมษายน :</span> วันสงกรานต์</li>
                                    <li><span className="font-bold text-black">วันพุธที่ 16 เมษายน :</span> ชดเชยวันสงกรานต์ (อาทิตย์ที่ 13 เมษายน : วันสงกรานต์)</li>
                                    <li><span className="font-bold text-black">วันพฤหัสบดีที่ 1 พฤษภาคม :</span> วันแรงงาน</li>
                                    <li><span className="font-bold text-black">วันจันทร์ที่ 5 พฤษภาคม :</span> ชดเชยวันฉัตรมงคล (อาทิตย์ที่ 4 พฤษภาคม : วันฉัตรมงคล)</li>
                                    <li><span className="font-bold text-black">วันจันทร์ที่ 12 :</span> ชดเชยวันวิสาขบูชา (อาทิตย์ที่ 11 พฤษภาคม : วันวิสาขบูชา)</li>
                                    <li><span className="font-bold text-black">วันจันทร์ที่ 3 มิถุนายน :</span> วันเฉลิมราชินี</li>
                                    <li><span className="font-bold text-black">วันพฤหัสบดีที่ 10 กรกฎาคม :</span> วันอาสาฬหบูชา</li>
                                    <li><span className="font-bold text-black">วันศุกร์ที่ 11 กรกฎาคม :</span> วันเข้าพรรษา</li>
                                    <li><span className="font-bold text-black">วันจันทร์ที่ 28 กรกฎาคม :</span> วันเฉลิมพระชนมพรรษา</li>
                                    <li><span className="font-bold text-black">วันจันทร์ที่ 12 สิงหาคม :</span> วันแม่แห่งชาติ</li>
                                    <li><span className="font-bold text-black">วันจันทร์ที่ 13 ตุลาคม :</span> วันน้อมรำลึกในพระมหากรุณาธิคุณ ร.9</li>
                                    <li><span className="font-bold text-black">วันพฤหัสบดีที่ 23 ตุลาคม :</span> วันปิยมหาราช</li>
                                    <li><span className="font-bold text-black">วันศุกร์ที่ 5 ธันวาคม :</span> วันพ่อแห่งชาติ</li>
                                    <li><span className="font-bold text-black">วันพุธที่ 10 ธันวาคม :</span> วันรัฐธรรมนูญ</li>
                                    <li><span className="font-bold text-black">วันพุธที่ 31 ธันวาคม :</span> วันสิ้นปี</li>
                                </ul>
                            </div>
                            <div className="bg-white shadow-md rounded-xl p-5 flex-1">
                                <h3 className="text-md font-bold font-FontNoto mb-2 text-black">หมายเหตุ: การลาทุกประเภทต้องได้รับการอนุมัติจากหัวหน้างานก่อนจึงสามารถลาได้</h3>
                                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-800 font-FontNoto">
                                    <li><span className="font-bold text-black">ลาป่วย :</span> แจ้งล่วงหน้าก่อนเวลาเริ่มงาน 8:30 น. (30 วัน/ปี) (หากกรณีลาป่วยเกิน 3 วัน แนบใบรับรองแพทย์) </li>
                                    <li> <span className="font-bold text-black">ลากิจส่วนตัว :</span> แจ้งล่วงหน้า 1 วัน (7 วัน/ปี อายุงาน 1 ปี หากไม่ถึงพิจารณาเป็นพิเศษ)  </li>
                                    <li><span className="font-bold text-black">ลาพักร้อน :</span> แจ้งล่วงหน้า 7 วัน (7 วัน/ปี อายุงานมากกว่า 1 ปี) </li>
                                    <li><span className="font-bold text-black">ลาคลอดบุตร :</span> แจ้งล่วงหน้า 30 วัน (90 วัน/ปี) </li>
                                    <li><span className="font-bold text-black">ลาบวช :</span> แจ้งล่วงหน้า 15 วัน (15 วัน/ปี อายุงานมากกว่า 1 ปี)  </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {showLeaveDetailModal && selectedLeave && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto font-FontNoto px-2 py-4">
                            <div className="relative bg-white rounded-2xl border border-gray-300 w-full max-w-2xl sm:max-w-3xl md:max-w-4xl mx-auto p-4 sm:p-6 shadow-md max-h-[90vh] overflow-y-auto">
                                <div className="absolute top-0 left-0 w-full h-1 rounded-t-lg" />
                                <button
                                    onClick={() => setShowLeaveDetailModal(false)}
                                    className="absolute top-[-10px] right-0 sm:top-[0px] sm:right-2 bg-white rounded-full w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 text-xl sm:text-2xl shadow-md z-50"
                                    aria-label="Close"
                                >
                                    &times;
                                </button>
                                <div className="pt-2">
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
                                                    {form.fullName}
                                                </div>
                                            </div>

                                            <div className="flex items-center w-full sm:w-1/2">
                                                <label className="mr-2 font-bold">ตำแหน่ง :</label>
                                                <div className="flex-1 text-black bg-white border border-gray-200 rounded px-3 py-1.5">
                                                    {roleMapping[form.department] || "-"}
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
                                        <div className="mt-2">
                                            <label className="font-FontNoto sm:w-32 whitespace-nowrap  text-gray-800 font-semibold">
                                                การอนุมัติ
                                            </label>
                                        </div>
                                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-FontNoto text-sm text-black">
                                            <div className="border border-gray-300 rounded-lg p-4 shadow-sm whitespace-nowrap bg-white text-gray-700 font-FontNoto text-sm max-w-sm">
                                                <p className="font-bold text-center mb-2">ผู้ขอลา</p>
                                                <div className="mb-1">ลายมือชื่อ: <span className="inline-block border-b border-gray-400 w-28 h-6 align-bottom ml-1 whitespace-nowrap">{form.fullName}</span></div>
                                                <div>วันที่ : {formatDateThai(selectedLeave.createdAt)}</div>
                                            </div>
                                            <div className="border border-gray-300 rounded-lg p-4 shadow-sm bg-white text-gray-700 font-FontNoto text-sm max-w-sm">
                                                <p className="font-bold text-center mb-2">ผู้จัดการทั่วไป</p>
                                                <div className="mb-2 flex items-center whitespace-nowrap">
                                                    <span className="text-gray-600 mr-2">ลายมือชื่อ:</span>
                                                    <span className="inline-block border-b border-gray-400 w-48 h-6 align-bottom ml-1 px-2 text-black whitespace-nowrap">
                                                        {selectedLeave?.gmApprovedAt
                                                            ? selectedLeave?.gmComment?.replace("อนุมัติ ", "") || "ไม่ระบุชื่อ"
                                                            : "รอดำเนินการ"}
                                                    </span>
                                                </div>
                                                <div className="mb-2 flex items-center gap-2 whitespace-nowrap">
                                                    <span className="text-gray-600 mr-2 whitespace-nowrap">วันที่:</span>
                                                    <input
                                                        type="date"
                                                        disabled
                                                        value={
                                                            selectedLeave?.gmApprovedAt
                                                                ? new Date(selectedLeave.gmApprovedAt).toISOString().split("T")[0]
                                                                : ""
                                                        }
                                                        className="border border-gray-300 text-gray-600 bg-gray-100 rounded px-2 py-1 cursor-default w-full"
                                                        style={{ minWidth: '100px' }}
                                                    />
                                                </div>

                                                <div className="flex gap-4 mt-2">
                                                    {selectedLeave?.gmApprovedAt || selectedLeave?.status?.startsWith("Rejected") ? (
                                                        selectedLeave.status?.startsWith("Rejected") ? (
                                                            <label className="flex items-center gap-2 text-red-600 font-semibold">
                                                                <span className="w-4 h-4 rounded-full border-2 border-red-500 bg-red-500 inline-block shadow-inner"></span>
                                                                ไม่อนุมัติ
                                                            </label>
                                                        ) : (
                                                            <label className="flex items-center gap-2 text-green-600 font-semibold">
                                                                <span className="w-4 h-4 rounded-full border-2 border-green-500 bg-green-500 inline-block shadow-inner"></span>
                                                                อนุมัติ
                                                            </label>
                                                        )
                                                    ) : (
                                                        <>
                                                            <label className="flex items-center gap-2 text-green-600 font-semibold">
                                                                <span className="w-4 h-4 rounded-full border-2 border-gray-200 bg-white inline-block shadow-inner"></span>
                                                                อนุมัติ
                                                            </label>
                                                            <label className="flex items-center gap-2 text-red-600 font-semibold">
                                                                <span className="w-4 h-4 rounded-full border-2 border-gray-200 bg-white inline-block shadow-inner"></span>
                                                                ไม่อนุมัติ
                                                            </label>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="border border-gray-300 rounded-lg p-4 shadow-sm bg-white text-gray-700 font-FontNoto text-sm max-w-sm">
                                                <p className="font-bold text-center mb-2">หัวหน้าฝ่ายนักวิเคราะห์ธุรกิจ</p>
                                                <div className="mb-2 flex items-center">
                                                    <span className="text-gray-600 mr-2 whitespace-nowrap">ลายมือชื่อ:</span>
                                                    <span className="inline-block border-b border-gray-400 w-48 h-6 align-bottom ml-1 px-2 text-black whitespace-nowrap">
                                                        {selectedLeave?.headBAApprovedAt
                                                            ? selectedLeave?.headBAComment?.replace("อนุมัติ ", "") || "ไม่ระบุชื่อ"
                                                            : "รอดำเนินการ"}
                                                    </span>
                                                </div>

                                                <div className="mb-2 flex items-center gap-2">
                                                    <span className="text-gray-600 mr-2 whitespace-nowrap">วันที่:</span>
                                                    <input
                                                        type="date"
                                                        disabled
                                                        value={
                                                            selectedLeave?.headBAApprovedAt
                                                                ? new Date(selectedLeave.headBAApprovedAt).toISOString().split("T")[0]
                                                                : ""
                                                        }
                                                        className="border border-gray-300 text-gray-600 bg-gray-100 rounded px-2 py-1 cursor-default w-full"
                                                        style={{ minWidth: '100px' }}
                                                    />
                                                </div>

                                                <div className="flex gap-4 mt-2">
                                                    {selectedLeave?.headBAApprovedAt || selectedLeave?.status?.startsWith("Rejected") ? (
                                                        selectedLeave.status?.startsWith("Rejected") ? (
                                                            <label className="flex items-center gap-2 text-red-600 font-semibold">
                                                                <span className="w-4 h-4 rounded-full border-2 border-red-500 bg-red-500 inline-block shadow-inner"></span>
                                                                ไม่อนุมัติ
                                                            </label>
                                                        ) : (
                                                            <label className="flex items-center gap-2 text-green-600 font-semibold">
                                                                <span className="w-4 h-4 rounded-full border-2 border-green-500 bg-green-500 inline-block shadow-inner"></span>
                                                                อนุมัติ
                                                            </label>
                                                        )
                                                    ) : (
                                                        <>
                                                            <label className="flex items-center gap-2 text-green-600 font-semibold">
                                                                <span className="w-4 h-4 rounded-full border-2 border-gray-200 bg-white inline-block shadow-inner"></span>
                                                                อนุมัติ
                                                            </label>
                                                            <label className="flex items-center gap-2 text-red-600 font-semibold">
                                                                <span className="w-4 h-4 rounded-full border-2 border-gray-200 bg-white inline-block shadow-inner"></span>
                                                                ไม่อนุมัติ
                                                            </label>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="border border-gray-300 rounded-lg p-4 shadow-sm bg-white text-gray-700 font-FontNoto text-sm max-w-sm">
                                                <p className="font-bold text-center mb-2">ฝ่ายทรัพยากรบุคคล</p>
                                                <div className="mb-2 flex items-center">
                                                    <span className="text-gray-600 mr-2 whitespace-nowrap">ลายมือชื่อ:</span>
                                                    <span className="inline-block border-b border-gray-400 w-48 h-6 align-bottom ml-1 px-2 text-black whitespace-nowrap">
                                                        {selectedLeave?.hrApprovedAt
                                                            ? selectedLeave?.hrComment?.replace("อนุมัติ ", "") || "ไม่ระบุชื่อ"
                                                            : "รอดำเนินการ"}
                                                    </span>
                                                </div>

                                                <div className="mb-2 flex items-center gap-2">
                                                    <span className="text-gray-600 mr-2 whitespace-nowrap">วันที่:</span>
                                                    <input
                                                        type="date"
                                                        disabled
                                                        value={
                                                            selectedLeave?.hrApprovedAt
                                                                ? new Date(selectedLeave.hrApprovedAt).toISOString().split("T")[0]
                                                                : ""
                                                        }
                                                        className="border border-gray-300 text-gray-600 bg-gray-100 rounded px-2 py-1 cursor-default w-full"
                                                        style={{ minWidth: '100px' }}
                                                    />
                                                </div>
                                                <div className="flex gap-4 mt-2">
                                                    {selectedLeave?.hrApprovedAt || selectedLeave?.status?.startsWith("Rejected") ? (
                                                        selectedLeave.status?.startsWith("Rejected") ? (
                                                            <label className="flex items-center gap-2 text-red-600 font-semibold">
                                                                <span className="w-4 h-4 rounded-full border-2 border-red-500 bg-red-500 inline-block shadow-inner"></span>
                                                                ไม่อนุมัติ
                                                            </label>
                                                        ) : (
                                                            <label className="flex items-center gap-2 text-green-600 font-semibold">
                                                                <span className="w-4 h-4 rounded-full border-2 border-green-500 bg-green-500 inline-block shadow-inner"></span>
                                                                อนุมัติ
                                                            </label>
                                                        )
                                                    ) : (
                                                        <>
                                                            <label className="flex items-center gap-2 text-green-600 font-semibold">
                                                                <span className="w-4 h-4 rounded-full border-2 border-gray-200 bg-white inline-block shadow-inner"></span>
                                                                อนุมัติ
                                                            </label>
                                                            <label className="flex items-center gap-2 text-red-600 font-semibold">
                                                                <span className="w-4 h-4 rounded-full border-2 border-gray-200 bg-white inline-block shadow-inner"></span>
                                                                ไม่อนุมัติ
                                                            </label>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

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
                        <label className="block font-FontNoto whitespace-nowrap">เรื่อง : ขออนุญาตลา</label>
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

                        <div className="flex flex-col w-full mt-2">
                            <label className="font-FontNoto min-w-fit">ข้าพเจ้า</label>
                            <input
                                type="text"
                                name="fullName"
                                value={form.fullName}
                                readOnly
                                className="font-FontNoto px-3 py-2 border border-gray-300 rounded-md bg-white text-black"
                            />
                        </div>

                        <div className="flex flex-col w-full mt-2">
                            <label className="font-FontNoto min-w-fit">ตำแหน่ง</label>
                            <input
                                type="text"
                                name="department"
                                value={roleMapping[form.department] || "-"}
                                readOnly
                                className="font-FontNoto px-3 py-2 border border-gray-300 rounded-md bg-white text-black"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col w-full mt-2"><label className="font-FontNoto whitespace-nowrap">ข้าพเจ้ามีความประสงค์ขอลาหยุดงาน เนื่องจาก</label></div>
                    <div className="flex flex-wrap items-center gap-4 w-full">

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
                    <div className="flex flex-col w-full">
                        <label className="font-FontNoto min-w-fit">เนื่องจาก</label>
                        <input
                            type="text"
                            name="reason"
                            value={form.reason}
                            onChange={handleChange}
                            className="w-full font-FontNoto px-3 py-2 border border-gray-300 rounded-md bg-white text-black"
                        />
                    </div>
                    <div className="flex flex-wrap gap-4 w-full mt-2">
                        <div className="flex flex-col flex-1 min-w-0">
                            <label className="font-FontNoto min-w-fit">ตั้งแต่วันที่</label>
                            <input
                                type="date"
                                name="startDate"
                                value={form.startDate}
                                onChange={handleChange}
                                className="px-3 py-2 border border-gray-300 rounded-md bg-white text-black font-FontNoto"
                                style={{ colorScheme: "light" }}
                            />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <label className="font-FontNoto min-w-fit">ถึงวันที่</label>
                            <input
                                type="date"
                                name="endDate"
                                value={form.endDate}
                                onChange={handleChange}
                                className="px-3 py-2 border border-gray-300 rounded-md bg-white text-black font-FontNoto"
                                style={{ colorScheme: "light" }}
                            />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <label className="font-FontNoto min-w-fit mb-1">จำนวนวันลา</label>
                            <input
                                type="text"
                                name="totalDaysDisplay"
                                value={`${form.totalDays} วัน`}
                                readOnly
                                className="px-3 py-2 border border-gray-300 rounded-md bg-white text-black font-FontNoto"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4 w-full mt-2">
                        <div className="flex-1 sm:mr-2">
                            <label className="font-FontNoto min-w-fit ">ช่องทางการติดต่อระหว่างลา</label>
                            <input
                                type="text"
                                value={form.contactAddress || ""}
                                onChange={(e) => {
                                    const contact = `${e.target.value} / ${form.contactPhone || ""}`;
                                    setForm((prev) => ({
                                        ...prev,
                                        contact,
                                        contactAddress: e.target.value,
                                    }));
                                }}
                                className="font-FontNoto w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black"
                            />
                        </div>

                        <div className="sm:w-1/2 mt-4 sm:mt-0">
                            <label className="font-FontNoto min-w-fit mb-1">เบอร์โทรศัพท์</label>
                            <input
                                type="text"
                                value={form.contactPhone || "-"}
                                readOnly
                                className="font-FontNoto w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black"
                            />
                        </div>
                    </div>
                    <div className="mt-2">
                        <label className="font-FontNoto sm:w-48 whitespace-nowrap pt-1 text-gray-800 font-semibold">
                            แนบเอกสารประกอบ
                        </label>
                    </div>
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 w-full">
                        <div className="flex flex-wrap gap-3">
                            {["ใบรับรองแพทย์", "อื่นๆ"].map((docType) => (
                                <label
                                    key={docType}
                                    className="flex items-center gap-2 font-FontNoto text-sm text-gray-700"
                                >
                                    <input
                                        type="radio"
                                        name="documentType"
                                        value={docType}
                                        checked={form.documentType === docType}
                                        onChange={handleChange}
                                        className="radio radio-sm accent-sky-500"
                                    />
                                    {docType}
                                </label>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="file"
                                name="attachment"
                                onChange={(e) =>
                                    setForm({ ...form, attachment: e.target.files[0] })
                                }
                                className="font-FontNoto w-full max-w-xs
      file:px-2 file:py-0.5 file:rounded 
      file:border file:border-gray-300 
      file:text-gray-600 file:text-xs
      file:bg-gray-100 hover:file:bg-gray-200 transition px-2 py-1 border border-gray-300 rounded-md bg-white text-black"
                            />
                            {form.attachment && (
                                <p className="text-sm text-green-600 font-FontNoto whitespace-nowrap">
                                    {form.attachment.name}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="mt-2">
                        <label className="font-FontNoto sm:w-32 whitespace-nowrap  text-gray-800 font-semibold">
                            การอนุมัติ
                        </label>
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-FontNoto text-sm text-black">
                        <div className="border border-gray-300 rounded-lg p-4 shadow-sm bg-white whitespace-nowrap text-gray-700 font-FontNoto text-sm max-w-sm">
                            <p className="font-bold text-center mb-2">ผู้ขอลา</p>
                            <div className="mb-1">ลายมือชื่อ: <span className="inline-block border-b border-gray-400 w-40 h-6 align-bottom ml-1">{form.fullName}</span></div>
                            <div>วันที่: {form.writtenDate ? formatDateThai(form.writtenDate) : ".............."}</div>
                        </div>
                        <div className="border border-gray-300 rounded-lg p-4 shadow-sm bg-white text-gray-700 font-FontNoto text-sm max-w-sm">
                            <p className="font-bold text-center mb-2">ผู้จัดการทั่วไป</p>

                            <div className="mb-2 flex items-center">
                                <span className="text-gray-600 mr-2">ลายมือชื่อ:</span>
                                <span className="inline-block border-b border-gray-400 w-48 h-6 align-bottom ml-1"></span>
                            </div>

                            <div className="mb-2 flex items-center gap-2">
                                <span className="text-gray-600 mr-2 whitespace-nowrap">วันที่:</span>
                                <input
                                    type="date"
                                    disabled
                                    className="border border-gray-300 text-gray-600 bg-gray-100 rounded px-2 py-1 cursor-default w-full"
                                    style={{ minWidth: '150px' }}
                                />
                            </div>

                            <div className="flex gap-4 mt-2">
                                <label className="flex items-center gap-2 text-green-600 font-semibold">
                                    <span className="w-4 h-4 rounded-full border-2 border-gray-200 bg-white inline-block shadow-inner"></span>
                                    อนุมัติ
                                </label>
                                <label className="flex items-center gap-2 text-red-600 font-semibold">
                                    <span className="w-4 h-4 rounded-full border-2 border-gray-200 bg-white inline-block shadow-inner"></span>
                                    ไม่อนุมัติ
                                </label>
                            </div>
                        </div>

                        <div className="border border-gray-300 rounded-lg p-4 shadow-sm bg-white text-gray-700 font-FontNoto text-sm max-w-sm">
                            <p className="font-bold text-center mb-2">หัวหน้าฝ่ายนักวิเคราะห์ธุรกิจ</p>

                            <div className="mb-2 flex items-center">
                                <span className="text-gray-600 mr-2">ลายมือชื่อ:</span>
                                <span className="inline-block border-b border-gray-400 w-48 h-6 align-bottom ml-1"></span>
                            </div>

                            <div className="mb-2 flex items-center gap-2">
                                <span className="text-gray-600 mr-2 whitespace-nowrap">วันที่:</span>
                                <input
                                    type="date"
                                    disabled
                                    className="border border-gray-300 text-gray-600 bg-gray-100 rounded px-2 py-1 cursor-default w-full"
                                    style={{ minWidth: '150px' }}
                                />
                            </div>

                            <div className="flex gap-4 mt-2">
                                <label className="flex items-center gap-2 text-green-600 font-semibold">
                                    <span className="w-4 h-4 rounded-full border-2 border-gray-200 bg-white inline-block shadow-inner"></span>
                                    อนุมัติ
                                </label>
                                <label className="flex items-center gap-2 text-red-600 font-semibold">
                                    <span className="w-4 h-4 rounded-full border-2 border-gray-200 bg-white inline-block shadow-inner"></span>
                                    ไม่อนุมัติ
                                </label>
                            </div>
                        </div>
                        <div className="border border-gray-300 rounded-lg p-4 shadow-sm bg-white text-gray-700 font-FontNoto text-sm max-w-sm">
                            <p className="font-bold text-center mb-2">ฝ่ายทรัพยากรบุคคล</p>
                            <div className="mb-2 flex items-center">
                                <span className="text-gray-600 mr-2">ลายมือชื่อ:</span>
                                <span className="inline-block border-b border-gray-400 w-48 h-6 align-bottom ml-1"></span>
                            </div>

                            <div className="mb-2 flex items-center gap-2">
                                <span className="text-gray-600 mr-2 whitespace-nowrap">วันที่:</span>
                                <input
                                    type="date"
                                    disabled
                                    className="border border-gray-300 text-gray-600 bg-gray-100 rounded px-2 py-1 cursor-default w-full"
                                    style={{ minWidth: '150px' }}
                                />
                            </div>

                            <div className="flex gap-4 mt-2">
                                <label className="flex items-center gap-2 text-green-600 font-semibold">
                                    <span className="w-4 h-4 rounded-full border-2 border-gray-200 bg-white inline-block shadow-inner"></span>
                                    อนุมัติ
                                </label>
                                <label className="flex items-center gap-2 text-red-600 font-semibold">
                                    <span className="w-4 h-4 rounded-full border-2 border-gray-200 bg-white inline-block shadow-inner"></span>
                                    ไม่อนุมัติ
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end items-center gap-4 mt-6">
                        <button
                            className="bg-gray-300 hover:bg-gray-500 text-black font-FontNoto px-4 py-2 rounded shadow"
                            onClick={() => setShowFormModal(false)}
                        >
                            ยกเลิก
                        </button>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-FontNoto px-4 py-2 rounded shadow"
                        >
                            ส่งใบลา
                        </button>
                    </div>

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