import React, { useState, useEffect } from "react";
import axios from "axios";

const LeaveForm = () => {

    const userId = String(sessionStorage.getItem("userId") || "");

    const [formData, setFormData] = useState({
        documentId: "",
        userid: userId,
        leaveTypeId: "",
        createdate: "",
        fullname: "",
        rolesid: "",
        reason: "",
        startdate: "",
        totalleave: 0,
        leavedType: "",
        leaved_startdate: "",
        leaved_enddate: "",
        totalleaved: 0,
        friendeContact: "",
        contact: "",
        workingstart: "",
        approvedDate: "",
        hrApprovedDate: "",
        sentToHRDate: "",
        hrSignature: "",
        managerName: "",
        managerComment: "",
        historyRequset: {
            last_total_stickDay: 0,
            last_total_personDay: 0,
            last_total_maternityDaystotal: 0,
            last_total_ordinationDays: 0,
            last_total_vacationDays: 0,
            total_stickDay: 0,
            total_personDay: 0,
            total_maternityDaystotal: 0,
            total_ordinationDays: 0,
            total_vacationDays: 0,
            sum_stickDay: 0,
            sum_personDay: 0,
            sum_maternityDaystotal: 0,
            sum_ordinationDays: 0,
            sum_vacationDays: 0,
        }
    });

    const [savedForms, setSavedForms] = useState([]);

    const [isNotificationModalOpen, setNotificationModalOpen] = useState(false);
    const [isopendeletediglog, setisopendeletediglog] = useState(false)

    const [messageModalState, setmessageModalState] = useState({
        title: "",
        textdetail: ""
    });
    const [leavetpyeState, setleavetpyeState] = useState([]);
    const [rolesState, setrolesState] = useState([]);

    const leaveTypeName = leavetpyeState.find(item => item.leaveTypeid === formData.leaveTypeId)?.leaveTypeTh || "ไม่ระบุ";
    const roleName = rolesState.find(item => item.rolesid === formData.rolesid)?.rolesname || "ไม่ระบุ";
    const leavedTypeName = leavetpyeState.find(item => item.leaveTypeid === formData.leavedType)?.leaveTypeTh || "ไม่ระบุ";

    useEffect(() => {
        if (userId) {
            fetchProfileData(); // ดึงข้อมูลโปรไฟล์มาเติม
            fetchLeaveType().then(() => {
                fetchSavedForms();
            });
            fetchRoles();
        }
    }, [userId]);

    const fetchProfileData = async () => {
        try {
            const profileResponse = await fetch(`https://localhost:7039/api/Users/Profile/${userId}`);
            const rolesResponse = await fetch(`https://localhost:7039/api/Document/GetRoles`);

            if (profileResponse.ok && rolesResponse.ok) {
                const profileData = await profileResponse.json();
                const rolesData = await rolesResponse.json(); // โหลดรายชื่อแผนกทั้งหมด

                // หาว่า roleName (จาก profile) ตรงกับ rolesid ไหน
                const matchingRole = rolesData.find(r => r.rolesname.includes(roleMapping(profileData.role)));

                setFormData(prevData => ({
                    ...prevData,
                    fullname: `${profileData.firstName} ${profileData.lastName}`,
                    workingstart: profileData.jDate ? profileData.jDate.split("T")[0] : "",
                    rolesid: matchingRole ? matchingRole.rolesid : "", // ถ้าเจอก็ set rolesid ถ้าไม่เจอให้ว่าง
                }));
            } else {
                console.warn("ไม่พบข้อมูลโปรไฟล์หรือแผนก");
            }
        } catch (error) {
            console.error("เกิดข้อผิดพลาด:", error);
        }
    };

    // ฟังก์ชันแปลง role short name -> ชื่อเต็มภาษาไทย
    const roleMapping = (role) => {
        switch (role) {
            case "Hr":
                return "ทรัพยากรบุคคล";
            case "GM":
                return "ผู้จัดการทั่วไป";
            case "Dev":
                return "นักพัฒนาระบบ";
            case "BA":
                return "นักวิเคราะห์ธุรกิจ";
            case "Employee":
                return "พนักงาน";
            default:
                return "";
        }
    };

    const fetchLeaveType = async () => {

        try {
            const response = await fetch(`https://localhost:7039/api/Document/GetLeaveTypes`);
            if (response.ok) {
                const data = await response.json();

                setleavetpyeState(data)
            } else {
                console.warn("ไม่พบฟอร์มที่บันทึก");

            }
        } catch (error) {
            console.error("Error fetching saved forms:", error);
        }
    }
    const fetchRoles = async () => {

        try {
            const response = await fetch(`https://localhost:7039/api/Document/GetRoles`);
            if (response.ok) {
                const data = await response.json();
                setrolesState(data)
            } else {
                console.warn("ไม่พบฟอร์มที่บันทึก");

            }
        } catch (error) {
            console.error("Error fetching saved forms:", error);
        }
    }
    const handleChange = (e) => {
        const { name, value } = e.target;

        // ✅ ตรวจสอบเฉพาะช่องเบอร์ติดต่อ
        if (name === "contact") {
            const onlyNumbers = value.replace(/\D/g, ""); // ลบอักขระที่ไม่ใช่ตัวเลขทั้งหมด
            if (onlyNumbers.length > 10) return; // จำกัดให้พิมพ์ได้แค่ 10 ตัว

            setFormData((prevData) => ({
                ...prevData,
                [name]: onlyNumbers, // อัปเดตค่าให้มีเฉพาะตัวเลข
            }));
        } else {
            setFormData((prevData) => ({
                ...prevData,
                [name]: value,
            }));
        }
    };

    const setFormViewData = async (form) => {
        try {
            const response = await fetch(`https://localhost:7039/api/Document/GetDocumentById/${form.documentId}`);
            if (response.ok) {
                const data = await response.json();
                console.log("📌 Data from API:", data); // ✅ เช็คค่าที่ได้จาก API

                // แปลงวันที่ให้รองรับ input[type="date"]
                const formatDate = (date) => date ? date.split("T")[0] : "";

                setFormData({
                    documentId: data.documentId ?? "",
                    userid: String(data.userId) ?? "",
                    fullname: data.fullname ?? "",
                    leaveTypeId: data.leaveTypeId ?? "",
                    rolesid: data.rolesid ?? "",
                    reason: data.reason ?? "",
                    startdate: formatDate(data.startdate),
                    enddate: formatDate(data.enddate),
                    totalleave: data.totalleave ?? 0,
                    contact: data.contact ?? "",
                    createdate: formatDate(data.createdate),
                    leavedType: data.leavedType ?? "",
                    leaved_startdate: formatDate(data.leavedStartdate),
                    leaved_enddate: formatDate(data.leavedEnddate),
                    totalleaved: data.totalleaved ?? 0,
                    friendeContact: data.friendeContact ?? "",
                    workingstart: formatDate(data.workingstart),
                    approvedDate: formatDate(data.approvedDate),
                    hrApprovedDate: formatDate(data.hrApprovedDate),
                    sentToHRDate: formatDate(data.sentToHrdate),
                    hrSignature: data.hrSignature ?? "",
                    managerName: data.managerName ?? "",
                    managerComment: data.managerComment ?? "",
                    historyRequset: {
                        last_total_stickDay: data.historyRequset?.lastTotalStickDay ?? 0,
                        last_total_personDay: data.historyRequset?.lastTotalPersonDay ?? 0,
                        last_total_maternityDaystotal: data.historyRequset?.lastTotalMaternityDaystotal ?? 0,
                        last_total_ordinationDays: data.historyRequset?.lastTotalOrdinationDays ?? 0,
                        last_total_vacationDays: data.historyRequset?.lastTotalVacationDays ?? 0,
                        total_stickDay: data.historyRequset?.totalStickDay ?? 0,
                        total_personDay: data.historyRequset?.totalPersonDay ?? 0,
                        total_maternityDaystotal: data.historyRequset?.totalMaternityDaystotal ?? 0,
                        total_ordinationDays: data.historyRequset?.totalOrdinationDays ?? 0,
                        total_vacationDays: data.historyRequset?.totalVacationDays ?? 0,
                        sum_stickDay: data.historyRequset?.sumStickDay ?? 0,
                        sum_personDay: data.historyRequset?.sumPersonDay ?? 0,
                        sum_maternityDaystotal: data.historyRequset?.sumMaternityDaystotal ?? 0,
                        sum_ordinationDays: data.historyRequset?.sumOrdinationDays ?? 0,
                        sum_vacationDays: data.historyRequset?.sumVacationDays ?? 0,
                    }
                });
            } else {
                console.error("❌ ไม่พบเอกสาร");
            }
        } catch (error) {
            console.error("❌ เกิดข้อผิดพลาด:", error);
        }
    };

    const fetchSavedForms = async () => {
        try {
            const response = await fetch(`https://localhost:7039/api/Document/GetDocumentsByUser/${userId}`);
            if (response.ok) {
                const data = await response.json();
                console.log("📌 ข้อมูลฟอร์มที่โหลดจาก API:", data);

                // ✅ กรองเฉพาะฟอร์มที่ยังไม่ถูกส่ง (เช็คให้แน่ใจว่าไม่มี "pending_manager" หรือ "Commited")
                const filteredForms = data.filter(form => form.status === "draft" || form.status === "created");

                setSavedForms(filteredForms);
            } else {
                console.warn("❌ ไม่พบฟอร์มที่บันทึก");
                setSavedForms([]);
            }
        } catch (error) {
            console.error("Error fetching saved forms:", error);
        }
    };

    const resetFormData = () => {
        setFormData({
            documentId: "",  // ✅ รีเซ็ต documentId ด้วย
            userid: userId,
            leaveTypeId: "",
            createdate: "",
            fullname: "",
            rolesid: "",
            reason: "",
            startdate: "",
            enddate: "",
            totalleave: 0,
            leavedType: "",
            leaved_startdate: "",
            leaved_enddate: "",
            totalleaved: 0,
            friendeContact: "",
            contact: "",
            workingstart: "",
            approvedDate: "",
            hrApprovedDate: "",
            sentToHRDate: "",
            hrSignature: "",
            managerName: "",
            managerComment: "",
            historyRequset: {
                last_total_stickDay: 0,
                last_total_personDay: 0,
                last_total_maternityDaystotal: 0,
                last_total_ordinationDays: 0,
                last_total_vacationDays: 0,
                total_stickDay: 0,
                total_personDay: 0,
                total_maternityDaystotal: 0,
                total_ordinationDays: 0,
                total_vacationDays: 0,
                sum_stickDay: 0,
                sum_personDay: 0,
                sum_maternityDaystotal: 0,
                sum_ordinationDays: 0,
                sum_vacationDays: 0,
            }
        });
    };

    const updateFrom = async () => {
        // ✅ ตรวจสอบค่าของ formData
        const updatedFormData = {
            ...formData,
            historyRequset: {
                last_total_stickDay: Number(formData.historyRequset?.last_total_stickDay) || 0,
                last_total_personDay: Number(formData.historyRequset?.last_total_personDay) || 0,
                last_total_maternityDaystotal: Number(formData.historyRequset?.last_total_maternityDaystotal) || 0,
                last_total_ordinationDays: Number(formData.historyRequset?.last_total_ordinationDays) || 0,
                last_total_vacationDays: Number(formData.historyRequset?.last_total_vacationDays) || 0,
                total_stickDay: Number(formData.historyRequset?.total_stickDay) || 0,
                total_personDay: Number(formData.historyRequset?.total_personDay) || 0,
                total_maternityDaystotal: Number(formData.historyRequset?.total_maternityDaystotal) || 0,
                total_ordinationDays: Number(formData.historyRequset?.total_ordinationDays) || 0,
                total_vacationDays: Number(formData.historyRequset?.total_vacationDays) || 0,
                sum_stickDay: Number(formData.historyRequset?.sum_stickDay) || 0,
                sum_personDay: Number(formData.historyRequset?.sum_personDay) || 0,
                sum_maternityDaystotal: Number(formData.historyRequset?.sum_maternityDaystotal) || 0,
                sum_ordinationDays: Number(formData.historyRequset?.sum_ordinationDays) || 0,
                sum_vacationDays: Number(formData.historyRequset?.sum_vacationDays) || 0,
            }
        };

        const url = `https://localhost:7039/api/Document/UpdateDocument/${updatedFormData.documentId}`;

        axios.put(url, updatedFormData, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                console.log("✅ การบันทึก/อัปเดตสำเร็จ:", response.data);
                setmessageModalState({
                    title: "📌 บันทึกข้อมูลสำเร็จ",
                    textdetail: "✅ ฟอร์มถูกบันทึก/อัปเดตเรียบร้อยแล้ว!",
                });

                setNotificationModalOpen(true);
                fetchSavedForms();
            })
            .catch(error => {
                console.error("❌ เกิดข้อผิดพลาด:", error);
            });
    };

    const handleSaveForm = async () => {
        if (!formData.fullname || !formData.leaveTypeId) {
            alert("❌ กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }

        try {
            let response;
            let url;
            let method;
            console.log(formData.documentId)
            if (formData.documentId) {
                // ✅ ถ้ามี documentId → อัปเดต
                await updateFrom();
            } else {
                // ✅ ถ้าไม่มี documentId → บันทึกใหม่
                url = "https://localhost:7039/api/Document/CreateDocument";
                method = "POST";

                response = await fetch(url, {
                    method: method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });

                console.log(`📌 กำลังส่งคำขอไปที่: ${url}`, formData);

                if (response.ok) {
                    const result = await response.json();
                    console.log("✅ การบันทึก/อัปเดตสำเร็จ:", result);

                    fetchSavedForms(); // โหลดข้อมูลใหม่จากฐานข้อมูล

                    setmessageModalState({
                        title: "📌 บันทึกข้อมูลสำเร็จ",
                        textdetail: "✅ ฟอร์มถูกบันทึก/อัปเดตเรียบร้อยแล้ว!",
                    });

                    setNotificationModalOpen(true);

                    // ✅ รีเซ็ตค่า historyRequset เป็น 0 หลังจากบันทึกสำเร็จ
                    setFormData(prevData => ({
                        ...prevData,
                        historyRequset: {
                            last_total_stickDay: prevData.historyRequset.last_total_stickDay ?? 0,
                            last_total_personDay: prevData.historyRequset.last_total_personDay ?? 0,
                            last_total_maternityDaystotal: prevData.historyRequset.last_total_maternityDaystotal ?? 0,
                            last_total_ordinationDays: prevData.historyRequset.last_total_ordinationDays ?? 0,
                            last_total_vacationDays: prevData.historyRequset.last_total_vacationDays ?? 0,
                            total_stickDay: prevData.historyRequset.total_stickDay ?? 0,
                            total_personDay: prevData.historyRequset.total_personDay ?? 0,
                            total_maternityDaystotal: prevData.historyRequset.total_maternityDaystotal ?? 0,
                            total_ordinationDays: prevData.historyRequset.total_ordinationDays ?? 0,
                            total_vacationDays: prevData.historyRequset.total_vacationDays ?? 0,
                            sum_stickDay: prevData.historyRequset.sum_stickDay ?? 0,
                            sum_personDay: prevData.historyRequset.sum_personDay ?? 0,
                            sum_maternityDaystotal: prevData.historyRequset.sum_maternityDaystotal ?? 0,
                            sum_ordinationDays: prevData.historyRequset.sum_ordinationDays ?? 0,
                            sum_vacationDays: prevData.historyRequset.sum_vacationDays ?? 0,
                        }
                    }));

                    // ✅ รีเซ็ตฟอร์มหลังจากบันทึกเสร็จ (เฉพาะกรณีสร้างใหม่)
                    if (!formData.documentId) {
                        resetFormData();
                    }
                } else {
                    const errorText = await response.text();
                    console.error("❌ Server error:", errorText);
                    alert("❌ เกิดข้อผิดพลาด: " + errorText);
                }
            }
        } catch (error) {
            console.error("❌ Error:", error);
            alert("❌ เกิดข้อผิดพลาดในการส่งฟอร์ม");
        }
    };

    const handleViewForm = (form) => {
        setFormData(form);
    };
    const handleSubmitToGM = async (form) => {
        if (!form || !form.ID) {
            alert("ไม่พบฟอร์มที่ต้องการส่ง กรุณาลองใหม่");
            return;
        }

        const approvalData = {
            DocumentID: form.ID,
            ManagerName: "GM ชื่อจริง",  // แก้เป็นชื่อจริงของ GM
            ManagerComment: "อนุมัติการลา",
        };

        try {
            const response = await fetch("https://localhost:7039/api/Document/ApproveByManager", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(approvalData),
            });

            if (response.ok) {
                alert("ส่งฟอร์มไปยัง GM สำเร็จ!");
            } else {
                const errorText = await response.text();
                console.error("Server error:", errorText);
                alert("เกิดข้อผิดพลาด: " + errorText);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("เกิดข้อผิดพลาดในการส่งฟอร์ม");
        }
    };
    const sendFrom = async (form) => {
        try {
            console.log("📌 กำลังส่งฟอร์ม:", form.documentId);
            const url = `https://localhost:7039/api/Document/SendToManager/${form.documentId}`;

            const response = await fetch(url, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
            });

            if (response.ok) {
                setmessageModalState({
                    title: "📌 ส่งฟอร์มสำเร็จ",
                    textdetail: "✅ ฟอร์มถูกส่งไปยังหัวหน้าเรียบร้อยแล้ว!",
                });

                setTimeout(() => {
                    resetFormData();  // ✅ รีเซ็ตฟอร์ม
                    setSavedForms(prevForms => prevForms.filter(f => f.documentId !== form.documentId)); // ✅ ลบออกจากตาราง
                }, 500);
            } else {
                const errorText = await response.text();
                console.error("❌ Server error:", errorText);
                setmessageModalState({
                    title: "⚠️ กรุณากดดูใบลาก่อนส่ง",
                });
            }
        } catch (error) {
            console.error("❌ Error:", error);
            setmessageModalState({
                title: "⚠️ กรุณากดดูใบลาก่อนส่ง",
                textdetail: "❌ ไม่สามารถส่งฟอร์มได้ กรุณาลองใหม่",
            });
        }

        setNotificationModalOpen(true);
    };

    return (
        <div className="">
            <div className="max-w-screen-lg mx-auto bg-transparent rounded-lg p-4 sm:p-6  overflow-x-auto">
                <h2 className="text-2xl  font-bold text-center font-FontNoto">แบบฟอร์มใบลา</h2>
                <form className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-2">
                        <label className="label">
                            <span className="label-text font-FontNoto">วันที่ :</span>
                        </label>
                        <input
                            type="date"
                            name="createdate"
                            value={formData.createdate || ""} // ใช้ "" เมื่อค่าเป็น undefined
                            className="input input-bordered font-FontNoto"
                            onChange={handleChange}
                            style={{
                                colorScheme: "light", // บังคับไอคอนให้ใช้โหมดสว่าง
                            }}
                        />
                    </div>
                    <div className="flex flex-col gap-4">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label className="label">
                                <span className="label-text font-FontNoto">เรื่อง : ขออนุญาติลา</span>
                            </label>

                            <select
                                name="leaveTypeId"
                                className="input input-bordered font-FontNoto"
                                value={formData.leaveTypeId}
                                onChange={handleChange}
                            >
                                <option value="" className="font-FontNoto">-- เลือกการลา --</option>
                                {leavetpyeState.map((item) => (
                                    <option key={item.leaveTypeid} value={item.leaveTypeid} className="font-FontNoto">
                                        {item.leaveTypeTh}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label className="label">
                                <span className="label-text font-FontNoto">เรียน หัวหน้าแผนก/ฝ่ายบุคคล</span>
                            </label>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
                                <label className="label font-FontNoto whitespace-nowrap">ข้าพเจ้า :</label>
                                <input
                                    type="text"
                                    name="fullname"
                                    className="input input-bordered font-FontNoto w-full"
                                    value={formData.fullname}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
                                <label className="label font-FontNoto whitespace-nowrap">แผนก :</label>
                                <select
                                    name="rolesid"
                                    className="input input-bordered font-FontNoto w-full"
                                    value={formData.rolesid}
                                    onChange={handleChange}
                                >
                                    <option value="" className="font-FontNoto">-- เลือกแผนก --</option>
                                    {rolesState.map((item) => (
                                        <option className="font-FontNoto" key={item.rolesid} value={item.rolesid}>
                                            {item.rolesname}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-wrap">
                        <label className="label font-FontNoto">
                            <span className="label-text font-FontNoto">ขอลา :</span>
                        </label>

                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                            {leavetpyeState.map((item) => (
                                <label key={item.leaveTypeid} className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="leaveTypeId"
                                        value={item.leaveTypeid}
                                        checked={formData.leaveTypeId == item.leaveTypeid}
                                        className="radio"
                                        onChange={handleChange}
                                    />
                                    <span className="font-FontNoto text-black">{item.leaveTypeTh}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
                        <label className="label font-FontNoto whitespace-nowrap">
                            <span className="label-text font-FontNoto">เนื่องจาก :</span>
                        </label>
                        <input
                            type="text"
                            name="reason"
                            className="input input-bordered font-FontNoto w-full"
                            value={formData.reason}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-4 w-full">
                        {/* ตั้งแต่วันที่ */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1">
                            <label className="label font-FontNoto whitespace-nowrap">
                                <span className="label-text font-FontNoto">ตั้งแต่วันที่ :</span>
                            </label>
                            <input
                                type="date"
                                name="startdate"
                                value={formData.startdate || ""}
                                className="input input-bordered font-FontNoto w-full sm:w-auto"
                                onChange={handleChange}
                                style={{ colorScheme: "light" }}
                            />
                        </div>

                        {/* ถึงวันที่ */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1">
                            <label className="label font-FontNoto whitespace-nowrap">
                                <span className="label-text font-FontNoto">ถึงวันที่ :</span>
                            </label>
                            <input
                                type="date"
                                name="enddate"
                                value={formData.enddate || ""}
                                className="input input-bordered font-FontNoto w-full sm:w-auto"
                                onChange={handleChange}
                                style={{ colorScheme: "light" }}
                            />
                        </div>

                        {/* มีกำหนด */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1">
                            <label className="label font-FontNoto whitespace-nowrap">
                                <span className="label-text font-FontNoto">มีกำหนด :</span>
                            </label>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <input
                                    type="number"
                                    name="total_start_leave"
                                    className="input input-bordered w-full sm:w-24"
                                    value={formData.totalleave || ''}
                                    onChange={(e) => {
                                        const value = Math.max(0, Number(e.target.value));
                                        setFormData((prevData) => ({
                                            ...prevData,
                                            totalleave: value,
                                        }));
                                    }}
                                    min="0"
                                />
                                <span className="font-FontNoto">วัน</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full">
                        <label className="label font-FontNoto">
                            <span className="label-text font-FontNoto">ข้าพเจ้าได้ลา :</span>
                        </label>

                        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4">
                            {leavetpyeState.map((item) => (
                                <label key={item.leaveTypeid} className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="leavedType"
                                        value={item.leaveTypeid}
                                        checked={formData.leavedType == item.leaveTypeid}
                                        className="radio"
                                        onChange={handleChange}
                                    />
                                    <span className="font-FontNoto text-black">{item.leaveTypeTh}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-4 w-full">
                        {/* วันที่เริ่มลา */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1">
                            <label className="label font-FontNoto whitespace-nowrap">
                                <span className="label-text font-FontNoto">ครั้งสุดท้าย ตั้งแต่วันที่ :</span>
                            </label>
                            <input
                                type="date"
                                name="leaved_startdate"
                                value={formData.leaved_startdate || ""}
                                className="input input-bordered font-FontNoto w-full sm:w-auto"
                                onChange={handleChange}
                                style={{ colorScheme: "light" }}
                            />
                        </div>

                        {/* วันที่สิ้นสุด */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1">
                            <label className="label font-FontNoto whitespace-nowrap">
                                <span className="label-text font-FontNoto">ถึงวันที่ :</span>
                            </label>
                            <input
                                type="date"
                                name="leaved_enddate"
                                value={formData.leaved_enddate || ""}
                                className="input input-bordered font-FontNoto w-full sm:w-auto"
                                onChange={handleChange}
                                style={{ colorScheme: "light" }}
                            />
                        </div>

                        {/* มีกำหนดกี่วัน */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1">
                            <label className="label font-FontNoto whitespace-nowrap">
                                <span className="label-text font-FontNoto">มีกำหนด :</span>
                            </label>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <input
                                    type="number"
                                    name="totalleaved"
                                    className="input input-bordered w-full sm:w-24"
                                    value={formData.totalleaved || ''}
                                    onChange={handleChange}
                                    min="0"
                                />
                                <span className="font-FontNoto">วัน</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
                            {/* ติดต่อได้ที่ */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
                                <label className="label font-FontNoto whitespace-nowrap">
                                    <span className="label-text font-FontNoto">ในระหว่างลา ติดต่อข้าพเจ้าได้ที่ :</span>
                                </label>
                                <input
                                    type="text"
                                    name="friendeContact"
                                    className="input input-bordered font-FontNoto w-full sm:w-auto"
                                    value={formData.friendeContact}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* เบอร์ติดต่อ */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
                                <label className="label font-FontNoto whitespace-nowrap">
                                    <span className="label-text font-FontNoto">เบอร์ติดต่อ :</span>
                                </label>
                                <input
                                    type="text"
                                    name="contact"
                                    className="input input-bordered font-FontNoto w-full sm:w-auto"
                                    value={formData.contact}
                                    onChange={handleChange}
                                    maxLength="10"
                                    onInput={(e) => e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10)} // ✅ บังคับให้มีแต่ตัวเลข
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-bold font-FontNoto">
                            สถิติการลาในปีนี้ (วันเริ่มงาน)
                        </h2>
                        <input
                            type="date"
                            name="workingstart"
                            value={formData.workingstart || ''}
                            className="input input-bordered font-FontNoto"
                            onChange={handleChange}
                            style={{
                                colorScheme: "light", // บังคับไอคอนให้ใช้โหมดสว่าง
                            }}
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="table w-full text-center">
                            <thead className="text-center font-FontNoto">
                                <tr>
                                    <th className="font-FontNoto">ประเภทการลา</th>
                                    <th className="font-FontNoto">ลามาแล้ว (วัน)</th>
                                    <th className="font-FontNoto">ลาครั้งนี้ (วัน)</th>
                                    <th className="font-FontNoto">รวม (วัน)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="font-FontNoto">ป่วย</td>
                                    <td>
                                        <input
                                            type="number"
                                            // name="sickDaysUsed"
                                            name="last_total_stickDay"

                                            value={formData.historyRequset.last_total_stickDay || ''}
                                            className="input input-bordered w-full text-center font-FontNoto"
                                            maxLength="2"
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prevData) => ({
                                                    ...prevData,
                                                    historyRequset: {
                                                        ...prevData.historyRequset,
                                                        last_total_stickDay: value
                                                    }
                                                }));
                                            }}
                                            onInput={(e) => {
                                                if (e.target.value < 0) e.target.value = 0;  // ป้องกันไม่ให้กรอกตัวเลขติดลบ
                                                if (e.target.value.length > 2) e.target.value = e.target.value.slice(0, 2);
                                            }}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            name="sickDaysCurrent"
                                            value={formData.historyRequset.total_stickDay || ''}
                                            className="input input-bordered w-full text-center font-FontNoto"
                                            maxLength="2"
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prevData) => ({
                                                    ...prevData,
                                                    historyRequset: {
                                                        ...prevData.historyRequset,
                                                        total_stickDay: value
                                                    }
                                                }));
                                            }}
                                            onInput={(e) => {
                                                if (e.target.value < 0) e.target.value = 0;  // ป้องกันไม่ให้กรอกตัวเลขติดลบ
                                                if (e.target.value.length > 2) e.target.value = e.target.value.slice(0, 2);
                                            }}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            name="sickDaysTotal"
                                            value={formData.historyRequset.sum_stickDay || ''}
                                            className="input input-bordered w-full text-center font-FontNoto"
                                            maxLength="2"
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prevData) => ({
                                                    ...prevData,
                                                    historyRequset: {
                                                        ...prevData.historyRequset,
                                                        sum_stickDay: value
                                                    }
                                                }));
                                            }}
                                            onInput={(e) => {
                                                if (e.target.value < 0) e.target.value = 0;  // ป้องกันไม่ให้กรอกตัวเลขติดลบ
                                                if (e.target.value.length > 2) e.target.value = e.target.value.slice(0, 2);
                                            }}
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="font-FontNoto">กิจส่วนตัว</td>
                                    <td>
                                        <input
                                            type="number"
                                            name="personalDaysUsed"
                                            value={formData.historyRequset.last_total_personDay || ''}
                                            className="input input-bordered w-full text-center font-FontNoto"
                                            maxLength="2"
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prevData) => ({
                                                    ...prevData,
                                                    historyRequset: {
                                                        ...prevData.historyRequset,
                                                        last_total_personDay: value
                                                    }
                                                }));
                                            }}
                                            onInput={(e) => {
                                                if (e.target.value < 0) e.target.value = 0;  // ป้องกันไม่ให้กรอกตัวเลขติดลบ
                                                if (e.target.value.length > 2) e.target.value = e.target.value.slice(0, 2);
                                            }}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            name="personalDaysCurrent"
                                            value={formData.historyRequset.total_personDay || ''}
                                            className="input input-bordered w-full text-center font-FontNoto"
                                            maxLength="2"
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prevData) => ({
                                                    ...prevData,
                                                    historyRequset: {
                                                        ...prevData.historyRequset,
                                                        total_personDay: value
                                                    }
                                                }));
                                            }}
                                            onInput={(e) => {
                                                if (e.target.value < 0) e.target.value = 0;  // ป้องกันไม่ให้กรอกตัวเลขติดลบ
                                                if (e.target.value.length > 2) e.target.value = e.target.value.slice(0, 2);
                                            }}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            name="personalDaysTotal"
                                            value={formData.historyRequset.sum_personDay || ''}
                                            className="input input-bordered w-full text-center font-FontNoto"
                                            maxLength="2"
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prevData) => ({
                                                    ...prevData,
                                                    historyRequset: {
                                                        ...prevData.historyRequset,
                                                        sum_personDay: value
                                                    }
                                                }));
                                            }}
                                            onInput={(e) => {
                                                if (e.target.value < 0) e.target.value = 0;  // ป้องกันไม่ให้กรอกตัวเลขติดลบ
                                                if (e.target.value.length > 2) e.target.value = e.target.value.slice(0, 2);
                                            }}
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="font-FontNoto">พักร้อน</td>
                                    <td>
                                        <input
                                            type="number"
                                            name="vacationDaysUsed"
                                            value={formData.historyRequset.last_total_vacationDays || ''}
                                            className="input input-bordered w-full text-center font-FontNoto"
                                            maxLength="2"
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prevData) => ({
                                                    ...prevData,
                                                    historyRequset: {
                                                        ...prevData.historyRequset,
                                                        last_total_vacationDays: value
                                                    }
                                                }));
                                            }}
                                            onInput={(e) => {
                                                if (e.target.value < 0) e.target.value = 0;  // ป้องกันไม่ให้กรอกตัวเลขติดลบ
                                                if (e.target.value.length > 2) e.target.value = e.target.value.slice(0, 2);
                                            }}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            name="vacationDaysCurrent"
                                            value={formData.historyRequset.total_vacationDays || ''}
                                            className="input input-bordered w-full text-center font-FontNoto"
                                            maxLength="2"
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prevData) => ({
                                                    ...prevData,
                                                    historyRequset: {
                                                        ...prevData.historyRequset,
                                                        total_vacationDays: value
                                                    }
                                                }));
                                            }}
                                            onInput={(e) => {
                                                if (e.target.value < 0) e.target.value = 0;  // ป้องกันไม่ให้กรอกตัวเลขติดลบ
                                                if (e.target.value.length > 2) e.target.value = e.target.value.slice(0, 2);
                                            }}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            name="vacationDaysTotal"
                                            value={formData.historyRequset.sum_vacationDays || ''}
                                            className="input input-bordered w-full text-center font-FontNoto"
                                            maxLength="2"
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prevData) => ({
                                                    ...prevData,
                                                    historyRequset: {
                                                        ...prevData.historyRequset,
                                                        sum_vacationDays: value
                                                    }
                                                }));
                                            }}
                                            onInput={(e) => {
                                                if (e.target.value < 0) e.target.value = 0;  // ป้องกันไม่ให้กรอกตัวเลขติดลบ
                                                if (e.target.value.length > 2) e.target.value = e.target.value.slice(0, 2);
                                            }}
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="font-FontNoto">คลอดบุตร</td>
                                    <td>
                                        <input
                                            type="number"
                                            name="maternityDaysUsed"
                                            value={formData.historyRequset.last_total_maternityDaystotal || ''}
                                            className="input input-bordered w-full text-center font-FontNoto"
                                            maxLength="2"
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prevData) => ({
                                                    ...prevData,
                                                    historyRequset: {
                                                        ...prevData.historyRequset,
                                                        last_total_maternityDaystotal: value
                                                    }
                                                }));
                                            }}
                                            onInput={(e) => {
                                                if (e.target.value < 0) e.target.value = 0;  // ป้องกันไม่ให้กรอกตัวเลขติดลบ
                                                if (e.target.value.length > 2) e.target.value = e.target.value.slice(0, 2);
                                            }}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            name="maternityDaysCurrent"
                                            value={formData.historyRequset.total_maternityDaystotal || ''}
                                            className="input input-bordered w-full text-center font-FontNoto"
                                            maxLength="2"
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prevData) => ({
                                                    ...prevData,
                                                    historyRequset: {
                                                        ...prevData.historyRequset,
                                                        total_maternityDaystotal: value
                                                    }
                                                }));
                                            }}
                                            onInput={(e) => {
                                                if (e.target.value < 0) e.target.value = 0;  // ป้องกันไม่ให้กรอกตัวเลขติดลบ
                                                if (e.target.value.length > 2) e.target.value = e.target.value.slice(0, 2);
                                            }}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            name="maternityDaysTotal"
                                            value={formData.historyRequset.sum_maternityDaystotal || ''}
                                            className="input input-bordered w-full text-center font-FontNoto"
                                            maxLength="2"
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prevData) => ({
                                                    ...prevData,
                                                    historyRequset: {
                                                        ...prevData.historyRequset,
                                                        sum_maternityDaystotal: value
                                                    }
                                                }));
                                            }}
                                            onInput={(e) => {
                                                if (e.target.value < 0) e.target.value = 0;  // ป้องกันไม่ให้กรอกตัวเลขติดลบ
                                                if (e.target.value.length > 2) e.target.value = e.target.value.slice(0, 2);
                                            }}
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="font-FontNoto">บวช</td>
                                    <td>
                                        <input
                                            type="number"
                                            name="ordinationDaysUsed"
                                            value={formData.historyRequset.last_total_ordinationDays || ''}
                                            className="input input-bordered w-full text-center font-FontNoto"
                                            maxLength="2"
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prevData) => ({
                                                    ...prevData,
                                                    historyRequset: {
                                                        ...prevData.historyRequset,
                                                        last_total_ordinationDays: value
                                                    }
                                                }));
                                            }}
                                            onInput={(e) => {
                                                if (e.target.value < 0) e.target.value = 0;  // ป้องกันไม่ให้กรอกตัวเลขติดลบ
                                                if (e.target.value.length > 2) e.target.value = e.target.value.slice(0, 2);
                                            }}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            name="ordinationDaysCurrent"
                                            value={formData.historyRequset.total_ordinationDays || ''}
                                            className="input input-bordered w-full text-center font-FontNoto"
                                            maxLength="2"
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prevData) => ({
                                                    ...prevData,
                                                    historyRequset: {
                                                        ...prevData.historyRequset,
                                                        total_ordinationDays: value
                                                    }
                                                }));
                                            }}
                                            onInput={(e) => {
                                                if (e.target.value < 0) e.target.value = 0;  // ป้องกันไม่ให้กรอกตัวเลขติดลบ
                                                if (e.target.value.length > 2) e.target.value = e.target.value.slice(0, 2);
                                            }}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            name="ordinationDaysTotal"
                                            value={formData.historyRequset.sum_ordinationDays || ''}
                                            className="input input-bordered w-full text-center font-FontNoto"
                                            maxLength="2"
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prevData) => ({
                                                    ...prevData,
                                                    historyRequset: {
                                                        ...prevData.historyRequset,
                                                        sum_ordinationDays: value
                                                    }
                                                }));
                                            }}
                                            onInput={(e) => {
                                                if (e.target.value < 0) e.target.value = 0;  // ป้องกันไม่ให้กรอกตัวเลขติดลบ
                                                if (e.target.value.length > 2) e.target.value = e.target.value.slice(0, 2);
                                            }}
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="flex gap-4 my-4">

                        <button
                            type="button"
                            className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded-2xl shadow-md transition-all duration-300 font-FontNoto flex items-center gap-2"
                            onClick={() => {
                                setmessageModalState({
                                    title: "📌 ยืนยันการส่งใบลา",
                                    textdetail: "คุณแน่ใจหรือไม่ว่าต้องการส่งใบลานี้ไปยังหัวหน้า?",
                                    confirmAction: () => sendFrom(formData),  // ✅ ใส่ function ส่งฟอร์มไว้
                                });
                                setNotificationModalOpen(true);
                            }}
                        >
                            ส่งใบลา
                        </button>

                    </div>
                </form>
                <div>
                </div>
            </div>
        </div>
    );
};

export default LeaveForm;