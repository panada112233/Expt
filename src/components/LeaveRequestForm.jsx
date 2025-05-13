import React, { useState, useEffect } from "react";
import axios from "axios";

const formatDateThai = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const LeaveRequestForm = () => {
    const userId = sessionStorage.getItem("userId") || "";
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [leaveHistory, setLeaveHistory] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [showLeaveDetailModal, setShowLeaveDetailModal] = useState(false);

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
        "ลาป่วย": "sick",
        "ลากิจ": "personal",
        "ลาพักร้อน": "vacation",
        "ลาบวช": "ordain",
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

    const showLeaveDetail = (leave) => {
        setSelectedLeave(leave);
        setShowLeaveDetailModal(true);
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
                joinDate: user.jDate?.split("T")[0] || "" // ✅ ตั้งชื่อใหม่เป็น joinDate
            }));
        }
    };

    const fetchLeaveHistory = async () => {
        try {
            const res = await axios.get(`https://localhost:7039/api/LeaveRequest/User/${userId}`);

            if (res.status === 200) {
                if (res.data.length === 0) {
                    console.log("ไม่พบข้อมูลการลา");
                    return;
                }

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
                        const days = Math.ceil((new Date(item.endDate) - new Date(item.startDate)) / (1000 * 60 * 60 * 24)) + 1;
                        const key = typeMap[item.leaveType];
                        if (key && stats[key]) stats[key].used += days;
                    }
                });

                const lastLeave = res.data.find(r => r.status === "ApprovedByHR");
                if (lastLeave) {
                    const days = Math.ceil((new Date(lastLeave.endDate) - new Date(lastLeave.startDate)) / (1000 * 60 * 60 * 24)) + 1;
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
                console.error(`Failed to fetch leave history: ${res.statusText}`);
            }
        } catch (error) {
            console.error("Error fetching leave history:", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        console.log("Form Data: ", form); // ตรวจสอบค่าของ form ก่อนการตรวจสอบ

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
            console.log("📤 payload:", payload);

            fetchLeaveHistory(); // โหลดใหม่หลังส่ง
            setShowSuccessModal(true); // ✅ เปิด modal popup สำเร็จ
        } catch (err) {
            alert("เกิดข้อผิดพลาดในการส่งฟอร์ม");
            console.error("🛑 POST ERROR:", err.response?.data || err.message);
            console.log("❌ Validation errors:", err.response?.data?.errors);
        }
    };


    return (
        <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl p-4 sm:p-8 mt-4 sm:mt-10 space-y-4 sm:space-y-6 font-sans">
            <h1 className="text-xl sm:text-2xl font-bold text-center font-FontNoto">แบบฟอร์มใบลา</h1>
            <div className="flex justify-end items-center gap-2 w-full">
                <label className="font-FontNoto whitespace-nowrap">วันที่ :</label>
                <input
                    type="date"
                    name="writtenDate"
                    value={form.writtenDate || ""}
                    onChange={handleChange}
                    className="input input-bordered font-FontNoto w-32 sm:w-40"
                    style={{ colorScheme: "light" }}
                />
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <label className="block font-FontNoto whitespace-nowrap">เรื่อง : ขออนุญาติลา :</label>
                <select
                    name="leaveType"
                    value={form.leaveType}
                    onChange={handleChange}
                    className="input input-bordered font-FontNoto w-full sm:w-auto"
                >
                    <option className="font-FontNoto" value="">-- เลือกการลา --</option>
                    {leaveTypes.map(type => (
                        <option className="font-FontNoto" key={type.leaveTypeid} value={type.leaveTypeTh}>
                            {type.leaveTypeTh}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex items-center gap-2 w-full">
                <label className="font-FontNoto whitespace-nowrap min-w-fit">เรียน หัวหน้าแผนก/ฝ่ายบุคคล</label>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full">
                <div className="flex items-center gap-2 w-full">
                    <label className="font-FontNoto whitespace-nowrap w-16 sm:w-24 text-left sm:text-right">ข้าพเจ้า :</label>
                    <input
                        type="text"
                        name="fullName"
                        value={form.fullName}
                        readOnly
                        className="input input-bordered font-FontNoto flex-1"
                    />
                </div>
                <div className="flex items-center gap-2 w-full">
                    <label className="font-FontNoto whitespace-nowrap w-16 sm:w-24 text-left sm:text-right">แผนก :</label>
                    <input
                        type="text"
                        name="department"
                        value={roleMapping[form.department] || "-"}
                        readOnly
                        className="input input-bordered font-FontNoto flex-1"
                    />
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 w-full">
                <label className="font-FontNoto whitespace-nowrap">ขอลา :</label>
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
                    className="input input-bordered font-FontNoto w-40"
                >
                    <option className="font-FontNoto" value="เต็มวัน">เต็มวัน</option>
                    <option className="font-FontNoto" value="ครึ่งวันเช้า">ครึ่งวันเช้า</option>
                    <option className="font-FontNoto" value="ครึ่งวันบ่าย">ครึ่งวันบ่าย</option>
                </select>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
                <label className="font-FontNoto whitespace-nowrap w-24">เนื่องจาก :</label>
                <input
                    type="text"
                    name="reason"
                    value={form.reason}
                    onChange={handleChange}
                    className="input input-bordered w-full font-FontNoto"
                />
            </div>
            <div className="flex flex-wrap items-center gap-4 w-full">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label className="font-FontNoto whitespace-nowrap sm:w-36">ตั้งแต่วันที่ :</label>
                    <input
                        type="date"
                        name="startDate"
                        value={form.startDate}
                        onChange={handleChange}
                        className="input input-bordered font-FontNoto w-full sm:w-40"
                        style={{ colorScheme: "light" }}
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label className="font-FontNoto whitespace-nowrap sm:w-36">ถึงวันที่ :</label>
                    <input
                        type="date"
                        name="endDate"
                        value={form.endDate}
                        onChange={handleChange}
                        className="input input-bordered font-FontNoto w-full sm:w-40"
                        style={{ colorScheme: "light" }}
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label className="font-FontNoto whitespace-nowrap sm:w-36">มีกำหนด :</label>
                    <input
                        type="number"
                        name="totalDays"
                        value={form.totalDays}
                        readOnly
                        className="input input-bordered font-FontNoto w-full sm:w-20 text-center"
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
                        className="input input-bordered font-FontNoto w-full sm:w-40"
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
                        className="input input-bordered font-FontNoto w-full sm:w-40"
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
                            className="input input-bordered font-FontNoto w-full sm:w-24 text-center"
                        />
                        <span className="font-FontNoto">วัน</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full">
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <label className="font-FontNoto whitespace-nowrap flex-shrink-0 w-full sm:w-64">ในระหว่างลา ติดต่อข้าพเจ้าได้ที่ :</label>
                    <input
                        type="text"
                        value={form.contactAddress || ""}
                        onChange={(e) => {
                            const contact = `${e.target.value} / ${form.contactPhone || ""}`;
                            setForm(prev => ({ ...prev, contact, contactAddress: e.target.value }));
                        }}
                        className="input input-bordered flex-grow font-FontNoto w-full"
                    />
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <label className="font-FontNoto whitespace-nowrap flex-shrink-0 w-full sm:w-44">เบอร์ติดต่อ :</label>
                    <input
                        type="text"
                        value={form.contactPhone || ""}
                        onChange={(e) => {
                            const onlyNumbers = e.target.value.replace(/\D/g, "");
                            const trimmed = onlyNumbers.slice(0, 10);

                            const contact = `${form.contactAddress || ""} / ${trimmed}`;
                            setForm(prev => ({
                                ...prev,
                                contact,
                                contactPhone: trimmed
                            }));
                        }}
                        className="input input-bordered flex-grow font-FontNoto w-full"
                        maxLength={10}
                        inputMode="numeric"
                        pattern="[0-9]*"
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
                                    <td><input type="text" readOnly className="input input-bordered w-16 sm:w-24 text-center font-FontNoto" value={stats.used} /></td>
                                    <td><input type="text" readOnly className="input input-bordered w-16 sm:w-24 text-center font-FontNoto" value={stats.current} /></td>
                                    <td><input type="text" readOnly className="input input-bordered w-16 sm:w-24 text-center font-FontNoto" value={stats.total} /></td>
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
            {showLeaveDetailModal && selectedLeave && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto font-FontNoto">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 space-y-4">
                        <h3 className="text-xl font-bold text-center mb-2 font-FontNoto flex flex-col sm:flex-row items-center justify-center gap-2">
                            แบบฟอร์มใบลา
                            <span className="text-base font-normal text-gray-600 font-FontNoto">
                                ({new Date(selectedLeave.createdAt).toLocaleDateString("th-TH", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric"
                                })})
                            </span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="font-FontNoto"><span className="font-bold font-FontNoto">ประเภทการลา:</span> {selectedLeave.leaveType}</p>
                            </div>
                            <div>
                                <p className="font-FontNoto"><span className="font-bold font-FontNoto">ช่วงเวลา:</span> {selectedLeave.timeType}</p>
                            </div>
                            <div>
                                <p className="font-FontNoto"><span className="font-bold font-FontNoto">ตั้งแต่วันที่:</span> {new Date(selectedLeave.startDate).toLocaleDateString("th-TH", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric"
                                })}</p>
                            </div>
                            <div>
                                <p className="font-FontNoto"><span className="font-bold font-FontNoto">ถึงวันที่:</span> {new Date(selectedLeave.endDate).toLocaleDateString("th-TH", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric"
                                })}</p>
                            </div>
                            <div>
                                <p className="font-FontNoto"><span className="font-bold font-FontNoto">เนื่องจาก:</span> {selectedLeave.reason}</p>
                            </div>
                            {(() => {
                                const [address, phone] = (selectedLeave.contact || "").split(" / ");
                                return (
                                    <>
                                        <div>
                                            <p className="font-FontNoto"><span className="font-bold font-FontNoto">ที่อยู่:</span> {address || "-"}</p>
                                        </div>
                                        <div>
                                            <p className="font-FontNoto"><span className="font-bold font-FontNoto">เบอร์ติดต่อ:</span> {phone || "-"}</p>
                                        </div>
                                    </>
                                );
                            })()}
                            <div className="sm:col-span-2 font-FontNoto">
                                <p className="font-FontNoto">
                                    <span className="font-bold font-FontNoto">สถานะ:</span>
                                    <span className={`ml-2 font-bold font-FontNoto ${selectedLeave.status === "Rejected"
                                        ? "text-red-600"
                                        : selectedLeave.status === "ApprovedByHR"
                                            ? "text-green-600"
                                            : "text-yellow-600"
                                        }`}>
                                        {selectedLeave.status === "ApprovedByHR"
                                            ? "อนุมัติแล้ว"
                                            : selectedLeave.status === "Rejected"
                                                ? "ไม่อนุมัติ"
                                                : "รอดำเนินการ"}
                                    </span>
                                </p>
                            </div>

                            {selectedLeave.status === "Rejected" && (
                                <div className="sm:col-span-2">
                                    <p className="font-FontNoto"><span className="font-bold font-FontNoto">เหตุผลที่ไม่อนุมัติ:</span> {selectedLeave.hrComment || selectedLeave.gmComment || "-"}</p>
                                </div>
                            )}
                        </div>

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
    );
};

export default LeaveRequestForm;