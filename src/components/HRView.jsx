import axios from "axios";
import React, { useState, useEffect } from "react";

const HRView = () => {
    const [hrApprovedForms, setHrApprovedForms] = useState([]); // ฟอร์มที่ HR เซ็นชื่ออนุมัติ
    const [hrForms, setHrForms] = useState([]);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [selectedFilePath, setSelectedFilePath] = useState('');
    const [savedDocuments, setSavedDocuments] = useState([]); // เอกสารที่บันทึกไว้ดูส่วนตัว
    const [formToApprove, setFormToApprove] = useState(null);
    const [hrName, setHrName] = useState(""); // เพิ่ม state สำหรับชื่อ HR
    const [selectedFormForEdit, setSelectedFormForEdit] = useState(null); // ฟอร์มที่เลือกแก้ไข
    const [selectedFormForDetails, setSelectedFormForDetails] = useState(null); // ฟอร์มที่เลือกดูรายละเอียด
    const currentUserRole = sessionStorage.getItem("role");
    const [sentForms, setSentForms] = useState({});
    const [roleState, setRolesState] = useState(null)
    const [historyState, sethistoryState] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [leaveTypesState, setleaveTypesState] = useState(null)
    const [newDocument, setNewDocument] = useState({
        category: '',
        file: null,
        description: '',
    });

    const leavedTypeMapping = {
        "A461E72F-B9A3-4F9D-BF69-1BBE6EA514EC": "ป่วย",
        "6CF7C54A-F9BA-4151-A554-6487FDD7ED8D": "พักร้อน",
        "AE3C3A05-1FCB-4B8A-9044-67A83E781ED6": "บวช",
        "1799ABEB-158C-479E-A9DC-7D45E224E8ED": "กิจส่วนตัว",
        "DAA14555-28E7-497E-B1D8-E0DA1F1BE283": "ลาคลอด",
    }
    const rolesMapping = {
        "17E87D2B-94C5-44A3-AD5C-1A6669FE46AF": "พนักงาน",
        "54DFE7BA-8EEC-40AD-9CDE-37A78E9CB045": "ผู้จัดการทั่วไป",
        "9D97FB2C-4356-417E-84BC-44A76EF7E301": "นักวิเคราะห์ธุรกิจ",
        "34801390-360B-450E-92B4-6493E1CFC146": "ทรัพยากรบุคคล",
        "26090F1D-A579-4242-969D-F16DD921EB05": "นักพัฒนาระบบ",
    }

    useEffect(() => {
        //  loadLocalStorageData();
        fetchHRForms();
        fetchRole()
        fetchLeaveType()
    }, []);
    const fetchRole = async () => {
        const roleRes = await axios.get(`https://localhost:7039/api/Users/GetRoles`);

        setRolesState(roleRes.data)
    }
    const fetchLeaveType = async () => {
        const res = await axios.get(`https://localhost:7039/api/Document/GetLeaveTypes`);

        setleaveTypesState(res.data)
    }
    const handleApprove = async () => {
        if (!hrName) {
            alert("กรุณากรอกชื่อ HR ก่อนอนุมัติ!");
            return;
        }

        if (!formToApprove || !formToApprove.documentId) {
            alert("ไม่พบฟอร์มที่ต้องการอนุมัติ");
            return;
        }

        const approvalData = {
            DocumentID: formToApprove.documentId,
            HRSignature: hrName,
        };

        try {
            const response = await fetch("https://localhost:7039/api/Document/ApproveByHR", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(approvalData),
            });

            if (response.ok) {
                setHrForms(prevForms => prevForms.filter(form => form.documentId !== formToApprove.documentId));

                // ✅ อัปเดตค่าฟอร์มที่อนุมัติแล้ว
                const updatedHrApprovedForms = [...hrApprovedForms, {
                    ...formToApprove,
                    hrSignature: hrName,
                    hrApprovedDate: new Date().toISOString()
                }];
                setHrApprovedForms(updatedHrApprovedForms);

                // ✅ บันทึกลง Local Storage
                localStorage.setItem("hrApprovedForms", JSON.stringify(updatedHrApprovedForms));

                setFormToApprove(null);
                setHrName("");

                console.log("✅ ฟอร์มถูกอนุมัติและบันทึกไว้เรียบร้อย!");
            } else {
                const errorText = await response.text();
                console.error("❌ Server error:", errorText);
                alert("❌ เกิดข้อผิดพลาด: " + errorText);
            }
        } catch (error) {
            console.error("❌ Error:", error);
        }
    };

    useEffect(() => {
        fetchApprovedForms(); // โหลดฟอร์มที่ HR อนุมัติแล้ว
        loadSavedDocuments(); // โหลดเอกสารที่บันทึกไว้
    }, []);

    const loadSavedDocuments = () => {
        const saved = JSON.parse(localStorage.getItem("savedHRDocuments")) || [];
        setSavedDocuments(saved);
    };
    const handleSavePersonalDocument = (doc) => {
        const updatedDocs = [...savedDocuments, doc];
        localStorage.setItem("savedHRDocuments", JSON.stringify(updatedDocs));
        setSavedDocuments(updatedDocs);
    };

    const handleOpenModal = async (filePathOrDoc) => {
        if (!filePathOrDoc) {
            alert("❌ ไม่พบข้อมูลเอกสาร");
            return;
        }

        if (typeof filePathOrDoc === 'string') {
            // ✅ เปิดไฟล์ PDF โดยตรง
            window.open(`https://localhost:7039${filePathOrDoc}`, '_blank');
            return;
        }

        if (filePathOrDoc?.filePath) {
            // ✅ เปิดไฟล์ที่ถูกอัปโหลด
            window.open(`https://localhost:7039${filePathOrDoc.filePath}`, '_blank');
            return;
        }

        if (filePathOrDoc?.documentId) {
            // ✅ โหลดข้อมูล historyState ก่อน
            const historyData = await fetchHistory(filePathOrDoc.documentId);

            if (!historyData) {
                alert("❌ ไม่พบข้อมูลสถิติการลา");
                return;
            }

            console.log("✅ ข้อมูล historyState ที่ใช้สร้าง PDF:", historyData);

            // ✅ สร้าง PDF พร้อมข้อมูลที่ถูกต้อง
            createPDF({ ...filePathOrDoc, history: historyData });
            return;
        }

        alert("❌ ไม่สามารถเปิดเอกสารได้");
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedDocument(null);
        setSelectedFilePath('');
    };

    const createPDF = (doc) => {
        if (!doc) {
            alert("ไม่พบข้อมูลเอกสาร");
            return;
        }
        const history = doc.history; // ✅ ใช้ข้อมูลที่โหลดมาใหม่แทน `historyState`
        // Helper function แปลงวันที่defaultStyle
        const formatDate = (date) => {
            if (!date) return "-";
            return new Intl.DateTimeFormat("th-TH", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(date));
        };

        const docDefinition = {
            content: [
                { text: "แบบฟอร์มใบลา", style: "header" },
                {
                    text: `วันที่ : ${formatDate(doc.createdate)}`,
                    margin: [0, 10, 0, 10],
                    alignment: 'right' // ทำให้ข้อความชิดขวา
                },
                { text: `เรื่อง : ขออนุญาติลา : ${leavedTypeMapping[doc.leaveTypeId.toUpperCase()] || "-"}`, margin: [0, 10, 0, 10] },
                { text: `เรียน หัวหน้าแผนก/ฝ่ายบุคคล`, margin: [0, 10, 0, 10] },
                {
                    table: {
                        widths: ["auto", "*"],
                        body: [
                            ["ข้าพเจ้า :", `${doc.fullname || "-"} แผนก ${rolesMapping[doc.rolesid.toUpperCase()] || "-"}`],
                            ["ขอลา :", `${leavedTypeMapping[doc.leaveTypeId.toUpperCase()] || "-"} เนื่องจาก ${doc.reason || "-"}`],
                            [
                                "ตั้งแต่วันที่ :",
                                `${formatDate(doc.startdate)} ถึงวันที่ : ${formatDate(doc.enddate)} รวม : ${doc.totalleave || "0"} วัน`
                            ],
                            [
                                "ข้าพเจ้าได้ลา :",
                                `${leavedTypeMapping[doc.leavedType.toUpperCase()] || "-"} ครั้งสุดท้าย ตั้งแต่วันที่ : ${formatDate(doc.leavedStartdate)} ถึงวันที่ : ${formatDate(doc.leavedEnddate)} รวม ${doc.totalleaved || "0"} วัน`
                            ],
                        ],
                    },
                    layout: "noBorders",
                    margin: [0, 0, 0, 20],
                },
                {
                    table: {
                        widths: ["auto", "*"],
                        body: [
                            [
                                "ในระหว่างลา ติดต่อข้าพเจ้าได้ที่ :",
                                `${doc.friendeContact || "-"}, เบอร์ติดต่อ ${doc.contact || "-"}`
                            ],
                        ],
                    },
                    layout: "noBorders",
                    margin: [0, 0, 0, 20],

                },
                {
                    text: [
                        { text: "สถิติการลาในปีนี้ (วันเริ่มงาน)", style: "subheader" },
                        { text: ` วันที่: ${formatDate(doc.workingstart)}`, style: "subheader" }
                    ]
                },
                {
                    table: {
                        widths: ["auto", "*", "*", "*"],
                        body: [
                            [
                                { text: "ประเภทลา", alignment: 'center' },
                                { text: "ลามาแล้ว", alignment: 'center' },
                                { text: "ลาครั้งนี้", alignment: 'center' },
                                { text: "รวมเป็น", alignment: 'center' }
                            ],
                            [
                                { text: "ป่วย", alignment: 'center' },
                                { text: history?.lastTotalStickDay ?? "0", alignment: 'center' },
                                { text: history?.totalStickDay ?? "0", alignment: 'center' },
                                { text: history?.sumStickDay ?? "0", alignment: 'center' }
                            ],
                            [
                                { text: "กิจส่วนตัว", alignment: 'center' },
                                { text: history?.lastTotalPersonDay ?? "0", alignment: 'center' },
                                { text: history?.totalPersonDay ?? "0", alignment: 'center' },
                                { text: history?.sumPersonDay ?? "0", alignment: 'center' }
                            ],
                            [
                                { text: "พักร้อน", alignment: 'center' },
                                { text: history?.lastTotalVacationDays ?? "0", alignment: 'center' },
                                { text: history?.totalVacationDays ?? "0", alignment: 'center' },
                                { text: history?.sumVacationDays ?? "0", alignment: 'center' }
                            ],
                            [
                                { text: "คลอดบุตร", alignment: 'center' },
                                { text: history?.lastTotalMaternityDaystotal ?? "0", alignment: 'center' },
                                { text: history?.totalMaternityDaystotal ?? "0", alignment: 'center' },
                                { text: history?.sumMaternityDaystotal ?? "0", alignment: 'center' }
                            ],
                            [
                                { text: "บวช", alignment: 'center' },
                                { text: history?.lastTotalOrdinationDays ?? "0", alignment: 'center' },
                                { text: history?.totalOrdinationDays ?? "0", alignment: 'center' },
                                { text: history?.sumOrdinationDays ?? "0", alignment: 'center' }
                            ]
                        ]
                    },
                    margin: [0, 0, 0, 20]
                },
                {
                    text: `ขอแสดงความนับถือ          .`,
                    margin: [0, 10, 0, 0],
                    alignment: 'right' // ทำให้ข้อความชิดขวา
                },
                {
                    columns: [
                        {
                            width: '33%',  // กำหนดความกว้างให้เป็น 1/3 ของพื้นที่
                            text: `ลงชื่อ: ... ${doc.fullname || "-"} ...`,
                            alignment: 'center',
                            margin: [0, 10, 0, 0]
                        },
                        {
                            width: '33%',
                            text: `ลงชื่อ:  ... ${doc.managerName || "-"} ...`,
                            alignment: 'center',
                            margin: [0, 10, 0, 0]
                        },
                        {
                            width: '33%',
                            text: `ลงชื่อ:  ... ${doc.hrSignature || "-"} ...`,
                            alignment: 'center',
                            margin: [0, 10, 0, 0]
                        }
                    ]
                },
                {
                    columns: [
                        {
                            width: '33%',  // กำหนดความกว้างให้เป็น 1/3 ของพื้นที่
                            text: `(... ${doc.fullname || "-"} ...)`,
                            alignment: 'center',
                            margin: [0, 10, 0, 0]
                        },
                        {
                            width: '33%',  // กำหนดความกว้างให้เป็น 1/3 ของพื้นที่
                            text: `(... ${doc.managerName || "-"} ...)`,
                            alignment: 'center',
                            margin: [0, 10, 0, 0]
                        },
                        {
                            width: '33%',  // กำหนดความกว้างให้เป็น 1/3 ของพื้นที่
                            text: `(... ${doc.hrSignature || "-"} ...)`,
                            alignment: 'center',
                            margin: [0, 10, 0, 0]
                        }
                    ]
                },
                {
                    columns: [
                        {
                            width: '33%',
                            text: `วันที่ ${formatDate(doc.createdate)}`,
                            alignment: 'center',
                            margin: [0, 10, 0, 0]
                        },
                        {
                            width: '33%',
                            text: `แผนก... ผู้จัดการทั่วไป ...`,
                            alignment: 'center',
                            margin: [0, 10, 0, 0]
                        },
                        {
                            width: '33%',
                            text: `แผนก... ทรัพยากรบุคคล ...`,
                            alignment: 'center',
                            margin: [0, 10, 0, 0]
                        }
                    ]
                },
                {
                    columns: [
                        {
                            width: '33%',
                            text: ``,
                            alignment: 'center',
                            margin: [0, 10, 0, 0]
                        },
                        {
                            width: '33%',
                            text: `วันที่ ${formatDate(doc.approvedDate)}`,
                            alignment: 'center',
                            margin: [0, 10, 0, 0]
                        },
                        {
                            width: '33%',
                            text: `วันที่ ${formatDate(doc.hrApprovedDate)}`,
                            alignment: 'center',
                            margin: [0, 10, 0, 0]
                        }
                    ]
                },
            ],
            styles: {
                header: {
                    fontSize: 18,
                    bold: true,
                    alignment: "center"
                },
                subheader: {
                    fontSize: 18,
                    bold: true,
                    margin: [0, 10, 0, 5]
                }
            },
            defaultStyle: {
                font: "THSarabunNew",
                fontSize: 16, // ตั้งค่าขนาดฟ้อนต์เป็น 16
            },
        };

        pdfMake.createPdf(docDefinition).download("เอกสารใบลา.pdf");
    };

    const setdetailFromView = async (from) => {
        console.log(from)

        setSelectedFormForDetails({
            ...from,
            roleid: from.rolesid,
            leavedType: from.leavedType,
            leaveTypeId: from.leaveTypeId
        })
        await fetchHistory(from.documentId)
        // roleid: roles,
    }
    const fetchHistory = async (documentid) => {
        try {
            const res = await axios.get(`https://localhost:7039/api/Document/GetDocumentWithHistory/${documentid}`);
            console.log("📌 ข้อมูลที่ได้จาก API fetchHistory:", res.data.historyleave);

            const historyRes = res.data.historyleave;
            sethistoryState(historyRes);

            return historyRes; // ✅ คืนค่าข้อมูลเพื่อนำไปใช้ต่อ
        } catch (e) {
            console.log("❌ Error fetching history:", e);
            return null;
        }
    };
    const fetchHRForms = async () => {
        try {
            const response = await fetch("https://localhost:7039/api/Document/GetPendingFormsForHR");

            if (response.ok) {
                const data = await response.json();
                console.log("📌 ข้อมูลจาก API:", data);

                // ✅ กรองเฉพาะฟอร์มที่ GM อนุมัติแล้ว แต่ HR ยังไม่ได้อนุมัติ
                const filteredForms = data.filter((form) => form.status === "pending_hr");

                setHrForms(filteredForms);
            } else {
                console.warn("❌ ไม่พบฟอร์มที่ต้องอนุมัติ");
                setHrForms([]);
            }
        } catch (error) {
            console.error("❌ Error fetching HR pending forms:", error);
        }
    };

    const fetchApprovedForms = async () => {
        try {
            const response = await fetch("https://localhost:7039/api/Document/GetApprovedFormsForHR");

            if (response.ok) {
                const apiData = await response.json();

                if (apiData.length === 0) {
                    console.warn("❌ API ไม่ส่งข้อมูลกลับมา, ใช้ข้อมูลจาก Local Storage");
                    const storedHrApprovedForms = JSON.parse(localStorage.getItem("hrApprovedForms")) || [];
                    setHrApprovedForms(storedHrApprovedForms);
                    return;
                }

                // ✅ ดึงข้อมูลที่เก็บไว้จาก Local Storage
                const storedHrApprovedForms = JSON.parse(localStorage.getItem("hrApprovedForms")) || [];

                // ✅ อัปเดตข้อมูลเก่าด้วยข้อมูลใหม่จาก API โดยไม่ให้ค่าซ้ำ
                const updatedForms = storedHrApprovedForms.map(storedForm => {
                    const updatedForm = apiData.find(apiForm => apiForm.documentId === storedForm.documentId);
                    return updatedForm ? updatedForm : storedForm;
                });

                // ✅ รวมข้อมูลใหม่จาก API ที่ไม่มีใน Local Storage
                const newForms = apiData.filter(apiForm =>
                    !storedHrApprovedForms.some(storedForm => storedForm.documentId === apiForm.documentId)
                );

                // ✅ รวมข้อมูลทั้งหมด
                const finalForms = [...updatedForms, ...newForms];

                // ✅ อัปเดต UI และเก็บข้อมูลลง Local Storage
                setHrApprovedForms(finalForms);
                localStorage.setItem("hrApprovedForms", JSON.stringify(finalForms));

                console.log("✅ โหลดข้อมูลสำเร็จ:", finalForms);
            } else {
                console.error("❌ API Error:", response.status);
                const storedHrApprovedForms = JSON.parse(localStorage.getItem("hrApprovedForms")) || [];
                setHrApprovedForms(storedHrApprovedForms);
            }
        } catch (error) {
            console.error("❌ Error fetching approved HR forms:", error);
            const storedHrApprovedForms = JSON.parse(localStorage.getItem("hrApprovedForms")) || [];
            setHrApprovedForms(storedHrApprovedForms);
        }
    };

    const handleEditHRSignature = async () => {
        if (!selectedFormForEdit || !selectedFormForEdit.documentId) {
            alert("ไม่พบฟอร์มที่ต้องการแก้ไข");
            return;
        }

        if (!selectedFormForEdit.hrSignature) {
            alert("กรุณากรอกชื่อ HR");
            return;
        }

        const updateData = {
            DocumentID: selectedFormForEdit.documentId,
            HRSignature: selectedFormForEdit.hrSignature,
        };

        try {
            console.log("📤 กำลังส่งข้อมูลไปยัง API:", updateData);

            const response = await fetch("https://localhost:7039/api/Document/EditHRSignature", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData),
            });

            if (response.ok) {
                console.log("✅ อัปเดตชื่อ HR สำเร็จ!");

                // ✅ โหลดข้อมูลใหม่จาก API
                await fetchApprovedForms();

                // ✅ อัปเดต UI โดยตรง (ป้องกัน delay)
                setHrApprovedForms(prevForms =>
                    prevForms.map(form =>
                        form.documentId === selectedFormForEdit.documentId
                            ? { ...form, hrSignature: selectedFormForEdit.hrSignature }
                            : form
                    )
                );

                // ✅ ล้างค่าฟอร์มที่กำลังแก้ไข
                setSelectedFormForEdit(null);
            } else {
                const errorText = await response.text();
                console.error("❌ Server error:", errorText);
                alert("❌ เกิดข้อผิดพลาด: " + errorText);
            }
        } catch (error) {
            console.error("❌ Error:", error);
            alert("❌ เกิดข้อผิดพลาดในการอัปเดตชื่อ HR");
        }
    };


    // ฟังก์ชันแปลงวันที่เป็นรูปแบบ "DD/MM/YYYY"
    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return date.toLocaleDateString("th-TH", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };
    const handleSendToEmployee = async (form) => {
        try {
            const response = await fetch("https://localhost:7039/api/Document/SendDocumentToEmployee", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: form.userId || 0,
                    fullname: form.fullname || "ไม่ระบุชื่อ",
                    documentId: form.documentId || "",
                    leaveTypeId: form.leaveTypeId || ""
                }),
            });

            if (response.ok) {
                setModalMessage("✅ ส่งเอกสารให้พนักงานสำเร็จ!");

                // ✅ อัปเดต `sentForms` และบันทึกลง Local Storage
                const updatedSentForms = { ...sentForms, [form.documentId]: true };
                setSentForms(updatedSentForms);
                localStorage.setItem("sentForms", JSON.stringify(updatedSentForms));

                // ✅ อัปเดต `hrApprovedForms` และบันทึกลง Local Storage
                const updatedHrApprovedForms = hrApprovedForms.map(f =>
                    f.documentId === form.documentId ? { ...f, sent: true } : f
                );
                setHrApprovedForms(updatedHrApprovedForms);
                localStorage.setItem("hrApprovedForms", JSON.stringify(updatedHrApprovedForms));
            } else {
                setModalMessage("❌ ไม่สามารถส่งเอกสารให้พนักงานได้");
            }
        } catch (error) {
            console.error("❌ Error:", error);
            setModalMessage("❌ เกิดข้อผิดพลาดในการส่งเอกสารให้พนักงาน");
        } finally {
            setIsModalOpen(true); // เปิด Modal แจ้งเตือน
        }
    };


    useEffect(() => {
        fetchApprovedForms();
        const storedSentForms = JSON.parse(localStorage.getItem("sentForms")) || {};
        setSentForms(storedSentForms);

        // ✅ โหลด `hrApprovedForms` จาก Local Storage ก่อน
        const storedHrApprovedForms = JSON.parse(localStorage.getItem("hrApprovedForms")) || [];
        setHrApprovedForms(storedHrApprovedForms);

        // ✅ โหลดข้อมูลใหม่จาก API และรวมกับ Local Storage
        fetchApprovedForms().then((apiForms) => {
            if (apiForms) {
                // ✅ รวมข้อมูลจาก Local Storage และ API ป้องกันค่าหาย
                const mergedForms = [...apiForms, ...storedHrApprovedForms].reduce((acc, form) => {
                    acc[form.documentId] = form; // ใช้ documentId เป็น key ป้องกันค่าซ้ำ
                    return acc;
                }, {});

                const finalForms = Object.values(mergedForms); // แปลงกลับเป็น array
                setHrApprovedForms(finalForms);
                localStorage.setItem("hrApprovedForms", JSON.stringify(finalForms)); // ✅ บันทึกข้อมูลลง Local Storage
            }
        }).catch((error) => {
            console.error("❌ Error fetching approved HR forms:", error);
        });
    }, []);


    return (
        <div className="p-4 sm:p-6">
            {/* ฟอร์มที่หัวหน้าอนุมัติ */}
            <section>
                <h2 className="text-xl font-bold mt-8 font-FontNoto">ฟอร์มที่หัวหน้าอนุมัติ</h2>
                {hrForms.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="table table-zebra w-full text-sm">
                            <thead>
                                <tr className="text-black bg-blue-100">
                                    <th>#</th>
                                    <th className="font-FontNoto">ชื่อพนักงาน</th>
                                    <th className="font-FontNoto">วันที่อนุมัติ</th>
                                    <th className="font-FontNoto">ลายเซ็นผู้จัดการทั่วไป</th>
                                    <th className="font-FontNoto">ความคิดเห็น</th>
                                    <th className="font-FontNoto text-center">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {hrForms.filter((form) => form.status === "pending_hr").map((form, index) => (
                                    <tr key={form.id || index}>
                                        <td className="font-FontNoto">{index + 1}</td>
                                        <td className="font-FontNoto">{form.fullname}</td>
                                        <td className="font-FontNoto">{formatDate(form.approvedDate)}</td>
                                        <td className="font-FontNoto">{form.managerName}</td>
                                        <td className="font-FontNoto">{form.managerComment}</td>
                                        <td className="text-center">
                                            <button
                                                className="btn btn-sm btn-outline btn-info ml-2 font-FontNoto"
                                                onClick={() => setdetailFromView(form)} // เปิด Modal ดูรายละเอียด
                                            >
                                                ดูรายละเอียด
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline btn-success ml-2 font-FontNoto"
                                                onClick={() => {
                                                    if (form) {
                                                        setFormToApprove(form); // ตรวจสอบฟอร์มก่อนเปิด Modal
                                                    } else {
                                                        alert("ฟอร์มไม่ถูกต้อง!");
                                                    }
                                                }}
                                            >
                                                เซ็นชื่อ
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="font-FontNoto text-center">ยังไม่มีฟอร์มที่หัวหน้าอนุมัติ</p>
                )}
                {formToApprove && (
                    <dialog open className="modal modal-open">
                        <div className="modal-box">
                            <h3 className="font-bold text-lg font-FontNoto">เซ็นชื่ออนุมัติ</h3>
                            <p className="font-FontNoto">คุณกำลัง อนุมัติฟอร์มของ : {formToApprove.fullname}</p>
                            <div className="mt-4">
                                <label className="label">
                                    <span className="label-text font-FontNoto">ชื่อ ทรัพยากรบุคคล :</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full font-FontNoto"
                                    value={hrName}
                                    onChange={(e) => {
                                        const onlyText = e.target.value.replace(/[0-9]/g, ""); // ✅ ลบเฉพาะตัวเลขออก
                                        setHrName(onlyText);
                                    }}
                                />
                            </div>

                            <div className="modal-action">
                                <button
                                    className="btn btn-outline btn-success font-FontNoto"
                                    onClick={handleApprove} // เรียก handleApprove เมื่อกดปุ่ม
                                >
                                    ยืนยัน
                                </button>
                                <button
                                    className="btn btn-outline btn-error font-FontNoto"
                                    onClick={() => setFormToApprove(null)}
                                >
                                    ยกเลิก
                                </button>
                            </div>
                        </div>
                    </dialog>
                )}
            </section>

            {/* ฟอร์มที่ HR เซ็นชื่ออนุมัติ */}
            <section className="mt-8">
                <h2 className="text-lg font-bold mb-2 font-FontNoto">ฟอร์มที่ HR อนุมัติแล้ว</h2>
                {hrApprovedForms.length > 0 ? (
                    <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr className="text-black bg-blue-100">
                                <th>#</th>
                                <th className="font-FontNoto text-center">ชื่อพนักงาน</th>
                                {/* <th className="font-FontNoto text-center">วันที่อนุมัติ</th> */}
                                <th className="font-FontNoto text-center">ลายเซ็นการอนุมัติ</th>
                                <th className="font-FontNoto text-center">ความคิดเห็น</th>
                                <th className="font-FontNoto text-center">วันที่อนุมัติ</th>
                                <th className="font-FontNoto text-center">ลายเซ็น HR</th>
                                <th className="font-FontNoto text-center">สถานะ</th>
                                <th className="font-FontNoto text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...hrApprovedForms].sort((a, b) => (sentForms[a.documentId] ? 1 : -1)).map((form, index) => (
                                <tr key={`${form.id}-${index}`}>  {/* ใช้ combination ของ `form.id` และ `index` เพื่อให้ key เป็นเอกลักษณ์ */}
                                    <td className="font-FontNoto text-center">{index + 1}</td>
                                    <td className="font-FontNoto text-center">{form.fullname}</td>
                                    {/* <td className="font-FontNoto text-center">{formatDate(form.approvedDate)}</td> */}
                                    <td className="font-FontNoto text-center">{form.managerName}</td>
                                    <td className="font-FontNoto text-center">{form.managerComment}</td>
                                    <td className="font-FontNoto text-center">{formatDate(form?.hrApprovedDate)}</td>
                                    <td className="font-FontNoto text-center">{form.hrSignature}</td>

                                    <td className="font-FontNoto text-center" style={{ color: sentForms[form.documentId] ? 'green' : 'red' }}>
                                        {sentForms[form.documentId] ? "✅ ส่งแล้ว" : "❌ ยังไม่ส่ง"}
                                    </td>

                                    <td className="font-FontNoto text-center flex space-x-2">
                                        <button
                                            className="btn btn-sm btn-outline btn-info font-FontNoto"
                                            onClick={() => handleOpenModal(form)}
                                        >
                                            ดูไฟล์
                                        </button>
                                        {!sentForms[form.documentId] && (
                                            <button
                                                className="btn btn-sm btn-outline btn-primary font-FontNoto text-center"
                                                onClick={() => handleSendToEmployee(form)}
                                            >
                                                ส่งให้พนักงาน
                                            </button>
                                        )}
                                        {!sentForms[form.documentId] && (
                                            <button
                                                className="btn btn-sm btn-outline btn-warning font-FontNoto text-center"
                                                onClick={() => setSelectedFormForEdit(form)}
                                            >
                                                แก้ไข
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                ) : (
                    <p className="font-FontNoto text-center">ยังไม่มีฟอร์มที่ HR เซ็นชื่ออนุมัติ</p>
                )}
                {selectedFormForEdit && (
                    <dialog open className="modal modal-open">
                        <div className="modal-box">
                            <h3 className="font-bold text-lg font-FontNoto">แก้ไขชื่อทรัพยากรบุคคล</h3>
                            <div className="mt-4">
                                <label className="label">
                                    <span className="label-text font-FontNoto">ชื่อ ทรัพยากรบุคคล :</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full font-FontNoto"
                                    value={selectedFormForEdit.hrSignature}
                                    onChange={(e) => {
                                        const onlyText = e.target.value.replace(/[0-9]/g, ""); // ✅ ลบเฉพาะตัวเลขออก
                                        setSelectedFormForEdit({
                                            ...selectedFormForEdit,
                                            hrSignature: onlyText,
                                        });
                                    }}
                                />
                            </div>
                            <div className="modal-action">
                                <button
                                    className="btn btn-outline btn-success font-FontNoto"
                                    onClick={handleEditHRSignature} // ✅ เรียกใช้ฟังก์ชันอัปเดตชื่อ HR
                                >
                                    บันทึก
                                </button>
                                <button
                                    className="btn btn-outline btn-error font-FontNoto"
                                    onClick={() => setSelectedFormForEdit(null)} // ปิด Modal
                                >
                                    ยกเลิก
                                </button>
                            </div>
                        </div>
                    </dialog>
                )}
                {isModalOpen && (
                    <dialog open className="modal modal-open">
                        <div className="modal-box">
                            <h3 className="font-bold text-lg font-FontNoto">แจ้งเตือน</h3>
                            <p className="font-FontNoto">{modalMessage}</p>
                            <div className="modal-action">
                                <button className="btn btn-outline btn-success font-FontNoto" onClick={() => setIsModalOpen(false)}>
                                    ตกลง
                                </button>
                            </div>
                        </div>
                    </dialog>
                )}

                {selectedFormForDetails && (
                    <dialog open className="modal modal-open">
                        <div className="modal-box">
                            <h3 className="font-bold text-lg font-FontNoto text-center">รายละเอียดฟอร์ม</h3>
                            <table className="table table-zebra w-full mt-6">
                                <tbody>
                                    <tr>
                                        <td colSpan="2" style={{ display: 'flex' }}>
                                            <div className="font-FontNoto" style={{ marginRight: '40px' }}><strong className="font-FontNoto">ชื่อ :</strong> {selectedFormForDetails.fullname}</div>
                                            <div className="font-FontNoto"><strong className="font-FontNoto">ตำแหน่ง :</strong> {
                                                roleState.find(x => x.rolesid == selectedFormForDetails.roleid)?.rolesname

                                            }</div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan="2" style={{ display: 'flex' }}>
                                            <div className="font-FontNoto" style={{ marginRight: '100px' }}><strong className="font-FontNoto">ขอลา :</strong> {
                                                leaveTypesState.find(x => x.leaveTypeid == selectedFormForDetails.leaveTypeId)?.leaveTypeTh
                                            }
                                            </div>
                                            <div className="font-FontNoto"><strong className="font-FontNoto">เนื่องจาก :</strong> {selectedFormForDetails.reason}</div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan="2" style={{ display: 'flex' }}>
                                            <div className="font-FontNoto" style={{ marginRight: '25px' }}><strong className="font-FontNoto">ตั้งแต่วันที่ :</strong> {formatDate(selectedFormForDetails?.startdate)}</div>
                                            <div className="font-FontNoto" style={{ marginRight: '20px' }}><strong className="font-FontNoto">ถึงวันที่ :</strong> {formatDate(selectedFormForDetails?.enddate)}</div>
                                            <div className="font-FontNoto"><strong className="font-FontNoto">กำหนด :</strong> {selectedFormForDetails.totalleave} วัน </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan="2" style={{ display: 'flex' }}>
                                            <div className="font-FontNoto"><strong className="font-FontNoto">ข้าพเจ้าได้ลา :</strong>
                                                {leaveTypesState.find(x => x.leaveTypeid == selectedFormForDetails.leavedType)?.leaveTypeTh}
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan="2" style={{ display: 'flex' }}>
                                            <div className="font-FontNoto" style={{ marginRight: '25px' }}><strong className="font-FontNoto">ครั้งสุดท้าย:</strong> {formatDate(selectedFormForDetails?.leavedStartdate)}</div>
                                            <div className="font-FontNoto" style={{ marginRight: '20px' }}><strong className="font-FontNoto">ถึงวันที่ :</strong> {formatDate(selectedFormForDetails?.leavedEnddate)}</div>
                                            <div className="font-FontNoto"><strong className="font-FontNoto">กำหนด :</strong> {selectedFormForDetails.totalleaved} วัน </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan="2" style={{ display: 'flex' }}>
                                            <div className="font-FontNoto" style={{ marginRight: '50px' }}><strong className="font-FontNoto">ระหว่างลา ติดต่อได้ที่:</strong> {selectedFormForDetails?.friendeContact}</div>
                                            <div><strong className="font-FontNoto">เบอร์ติดต่อ :</strong> {selectedFormForDetails?.contact}</div>
                                        </td>
                                    </tr>
                                    <tr className="font-FontNoto text-center">
                                        <td style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <div className="font-FontNoto text-center">
                                                <strong className="font-FontNoto text-center">สถิติการลาในปีนี้ วันเริ่มงาน:</strong> {formatDate(selectedFormForDetails?.workingstart)}
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <thead className="text-center font-FontNoto">
                                            <tr>
                                                <th className="font-FontNoto">ประเภทการลา</th>
                                                <th className="font-FontNoto">ลามาแล้ว (วัน)</th>
                                                <th className="font-FontNoto">ลาครั้งนี้ (วัน)</th>
                                                <th className="font-FontNoto">รวม (วัน)</th>
                                            </tr>
                                            <tr>
                                                <th className="font-FontNoto">ป่วย</th>
                                                <td className="font-FontNoto text-center">{historyState?.lastTotalStickDay}</td>
                                                <td className="font-FontNoto text-center">{historyState?.totalStickDay}</td>
                                                <td className="font-FontNoto text-center">{historyState?.sumStickDay}</td>
                                            </tr>
                                            <tr>
                                                <th className="font-FontNoto">กิจส่วนตัว</th>
                                                <td className="font-FontNoto text-center">{historyState?.lastTotalPersonDay}</td>
                                                <td className="font-FontNoto text-center">{historyState?.totalPersonDay}</td>
                                                <td className="font-FontNoto text-center">{historyState?.sumPersonDay}</td>
                                            </tr>
                                            <tr>
                                                <th className="font-FontNoto">พักร้อน</th>
                                                <td className="font-FontNoto text-center">{historyState?.lastTotalVacationDays}</td>
                                                <td className="font-FontNoto text-center">{historyState?.totalVacationDays}</td>
                                                <td className="font-FontNoto text-center">{historyState?.sumVacationDays}</td>
                                            </tr>
                                            <tr>
                                                <th className="font-FontNoto">คลอดบุตร</th>
                                                <td className="font-FontNoto text-center">{historyState?.lastTotalMaternityDaystotal}</td>
                                                <td className="font-FontNoto text-center">{historyState?.totalMaternityDaystotal}</td>
                                                <td className="font-FontNoto text-center">{historyState?.sumMaternityDaystotal}</td>
                                            </tr>
                                            <tr>
                                                <th className="font-FontNoto">บวช</th>
                                                <td className="font-FontNoto text-center">{historyState?.lastTotalOrdinationDays}</td>
                                                <td className="font-FontNoto text-center">{historyState?.totalOrdinationDays}</td>
                                                <td className="font-FontNoto text-center">{historyState?.sumOrdinationDays}</td>
                                            </tr>
                                        </thead>
                                    </tr>
                                </tbody>
                            </table>
                            {/* เพิ่มข้อมูลเพิ่มเติมตามที่คุณต้องการ */}
                            <div className="modal-action">
                                <button
                                    className="btn btn-outline btn-error font-FontNoto"
                                    onClick={() => setSelectedFormForDetails(null)} // ปิด Modal
                                >
                                    ปิด
                                </button>
                            </div>
                        </div>
                    </dialog>
                )}

            </section>
        </div>
    );
};

export default HRView;
