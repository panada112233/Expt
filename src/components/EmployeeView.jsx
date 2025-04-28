import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pdfMake, font } from "../libs/pdfmake";

const EmployeeView = () => {
    const [documents, setDocuments] = useState([]);
    const userId = sessionStorage.getItem("userId");  // Get userId from sessionStorage
    console.log("Logged in userId: ", userId);
    const role = sessionStorage.getItem("role");  // Get role from sessionStorage


    useEffect(() => {
        const fetchDocuments = () => {
            try {
                // โหลดเอกสารที่ส่งจาก HR ไปยังพนักงาน
                const savedDocuments = JSON.parse(localStorage.getItem("sentToEmployeesForms")) || [];

                // กรองเอกสารตาม userId ของพนักงาน
                const employeeDocuments = savedDocuments.filter(doc => doc.userId === userId);

                // ตั้งค่าเอกสารที่กรองแล้ว
                setDocuments(employeeDocuments);
            } catch (error) {
                console.error("Error loading documents:", error);
            }
        };

        fetchDocuments();
    }, [userId]);

    const downloadDocument = (doc) => {
        const formatDate = (date) => {
            if (!date || isNaN(new Date(date).getTime())) {
                return "-";
            }
            const options = { year: "numeric", month: "2-digit", day: "2-digit" };
            return new Intl.DateTimeFormat("th-TH", options).format(new Date(date));
        };

        const docDefinition = {
            content: [
                { text: "แบบฟอร์มใบลา", style: "header" },
                {
                    text: `วันที่ : ${formatDate(doc.date)}`,
                    margin: [0, 10, 0, 10],
                    alignment: 'right' // ทำให้ข้อความชิดขวา
                },
                { text: `เรื่อง : ขออนุญาติลา : ${doc.aa || "-"}`, margin: [0, 10, 0, 10] },
                { text: `เรียน หัวหน้าแผนก/ฝ่ายบุคคล`, margin: [0, 10, 0, 10] },
                {
                    table: {
                        widths: ["auto", "*"],
                        body: [
                            ["ข้าพเจ้า :", `${doc.department || "-"} ตำแหน่ง ${doc.position || "-"}`],
                            ["ขอลา :", `${doc.leaveType || "-"} เนื่องจาก ${doc.reason || "-"}`],
                            [
                                "ตั้งแต่วันที่ :",
                                `${formatDate(doc.fromDate)} ถึงวันที่ : ${formatDate(doc.toDate)} รวม : ${doc.totalDays || "0"} วัน`
                            ],
                            [
                                "ข้าพเจ้าได้ลา :",
                                `${doc.leT || "-"} ครั้งสุดท้าย ตั้งแต่วันที่ : ${formatDate(doc.fromd)} ถึงวันที่ : ${formatDate(doc.tod)} รวม ${doc.totald || "0"} วัน`
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
                                `${doc.contact || "-"}, เบอร์ติดต่อ ${doc.phone || "-"}`
                            ],
                        ],
                    },
                    layout: "noBorders",
                    margin: [0, 0, 0, 20],
                },
                {
                    text: [
                        { text: "สถิติการลาในปีนี้ (วันเริ่มงาน)", style: "subheader" },
                        { text: ` วันที่: ${formatDate(doc.tt)}`, style: "subheader" }
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
                                { text: doc.sickDaysUsed || "-", alignment: 'center' },
                                { text: doc.sickDaysCurrent || "-", alignment: 'center' },
                                { text: doc.sickDaysTotal || "-", alignment: 'center' }
                            ],
                            [
                                { text: "กิจส่วนตัว", alignment: 'center' },
                                { text: doc.personalDaysUsed || "-", alignment: 'center' },
                                { text: doc.personalDaysCurrent || "-", alignment: 'center' },
                                { text: doc.personalDaysTotal || "-", alignment: 'center' }
                            ],
                            [
                                { text: "พักร้อน", alignment: 'center' },
                                { text: doc.vacationDaysUsed || "-", alignment: 'center' },
                                { text: doc.vacationDaysCurrent || "-", alignment: 'center' },
                                { text: doc.vacationDaysTotal || "-", alignment: 'center' }
                            ],
                            [
                                { text: "คลอดบุตร", alignment: 'center' },
                                { text: doc.maternityDaysUsed || "-", alignment: 'center' },
                                { text: doc.maternityDaysCurrent || "-", alignment: 'center' },
                                { text: doc.maternityDaysTotal || "-", alignment: 'center' }
                            ],
                            [
                                { text: "บวช", alignment: 'center' },
                                { text: doc.ordinationDaysUsed || "-", alignment: 'center' },
                                { text: doc.ordinationDaysCurrent || "-", alignment: 'center' },
                                { text: doc.ordinationDaysTotal || "-", alignment: 'center' }
                            ]
                        ]
                    },
                    margin: [0, 0, 0, 20]
                },
                {
                    text: `ขอแสดงความนับถือ              .`,
                    margin: [0, 10, 0, 0],
                    alignment: 'right' // ทำให้ข้อความชิดขวา
                },
                {
                    columns: [
                        {
                            width: '33%',
                            text: `ลงชื่อ :  ... ${doc.department|| "...............................พนักงาน"} ...`,
                            alignment: 'center',
                            margin: [0, 10, 0, 0],
                        },
                        {
                            width: '33%',
                            text: `ลงชื่อ :  ... ${doc.managerName || "...............................หัวหน้าแผนก"} ...`,
                            alignment: 'center',
                            margin: [0, 10, 0, 0]
                        },
                        {
                            width: '33%',
                            text: `ลงชื่อ : ... ${doc.hrSignature || "...............................ผู้ตรวจสอบ"} ...`,
                            alignment: 'center',
                            margin: [0, 10, 0, 0]
                        }
                    ]
                },
                {
                    columns: [
                        {
                            width: '33%',  // กำหนดความกว้างให้เป็น 1/3 ของพื้นที่
                            text: `( ... ${doc.department || "(..............................)"} ...)`,
                            alignment: 'center',
                            margin: [0, 10, 0, 0]
                        },
                        {
                            width: '33%',  // กำหนดความกว้างให้เป็น 1/3 ของพื้นที่
                            text: `( ... ${doc.managerName || "(..............................)"} ...)`,
                            alignment: 'center',
                            margin: [0, 10, 0, 0]
                        },
                        {
                            width: '33%',  // กำหนดความกว้างให้เป็น 1/3 ของพื้นที่
                            text: `( ... ${doc.hrSignature || "(..............................)"} ...)`,
                            alignment: 'center',
                            margin: [0, 10, 0, 0]
                        }
                    ]
                },
                {
                    columns: [
                        {
                            width: '33%',
                            text: `วันที่ ${formatDate(doc.date) || "วันที่ ......../......../........."}`,
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
                            text: `วันที่ ${doc.approvedDate || "วันที่ ......../......../........."}`,
                            alignment: 'center',
                            margin: [0, 10, 0, 0]
                        },
                        {
                            width: '33%',
                            text: `วันที่ ${doc.hrApprovedDate || "วันที่ ......../......../........."}`,
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

    const deleteDocumentForEmployee = (docId) => {
        // โหลดข้อมูลของพนักงานเท่านั้น
        const savedDocumentsForEmployee = JSON.parse(localStorage.getItem("sentToEmployeesFormsForEmployee")) || [];
        const updatedDocumentsForEmployee = savedDocumentsForEmployee.filter(doc => doc.id !== docId);

        // อัปเดตข้อมูลเฉพาะส่วนของพนักงาน
        setDocuments(updatedDocumentsForEmployee);
        localStorage.setItem("sentToEmployeesFormsForEmployee", JSON.stringify(updatedDocumentsForEmployee));

        console.log(`Document with ID ${docId} has been deleted for Employee only.`);
    };

    return (
        <div className="">
            <div className="flex justify-start gap-4 mb-4">
                <Link
                    to="/EmpHome/LeaveForm"
                    className="btn btn-outline font-FontNoto"
                >
                    แบบฟอร์มใบลา
                </Link>
                <Link
                    to="/EmpHome/EmployeeView"
                    className="btn btn-outline font-FontNoto"
                >
                    เอกสารใบลาจาก HR
                </Link>
            </div>
            <div className="max-w-5xl mx-auto rounded-lg  p-6 ">
                <h1 className="text-2xl font-bold mb-4 font-FontNoto">ใบลาที่ HR ส่งคืน</h1>
                {documents.length > 0 ? (
                    <table className="table-auto w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-amber-300">
                                <th className="border border-gray-300 px-4 py-2 font-FontNoto">#</th>
                                <th className="font-FontNoto">ชื่อเอกสาร</th>
                                <th className="font-FontNoto">ลายเซ็นผู้จัดการทั่วไป</th>
                                <th className="font-FontNoto">ความคิดเห็น</th>
                                <th className="font-FontNoto">ชื่อฝ่ายบุคคล</th>
                                <th className="font-FontNoto">วันที่ อนุมัติ</th>
                                <th className="font-FontNoto">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.map((doc, index) => (
                                <tr key={doc.id} className="hover:bg-gray-100">
                                    <td className="border border-gray-300 px-4 py-2 text-center font-FontNoto">{index + 1}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-center font-FontNoto">{`ใบลา ${doc.aa}`}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-center font-FontNoto">{doc.managerName}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-center font-FontNoto">{doc.managerComment}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-center font-FontNoto">{doc.hrSignature}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-center font-FontNoto">{doc.hrApprovedDate}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-center font-FontNoto">
                                        <button
                                            className="btn btn-sm btn-outline btn-secondary font-FontNoto"
                                            onClick={() => downloadDocument(doc)}
                                        >
                                            ดาวน์โหลด
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline btn-error ml-2 font-FontNoto"
                                            onClick={() => deleteDocumentForEmployee(doc.id)}
                                        >
                                            ลบ
                                        </button>

                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center text-gray-500 font-FontNoto">ยังไม่มีเอกสารที่ส่งจาก HR</p>
                )}
            </div>
        </div>
    );
};

export default EmployeeView;
