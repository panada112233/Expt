import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

function Document() {
  const [documents, setDocuments] = useState([]);
  const [newDocument, setNewDocument] = useState({
    category: '',
    file: null,
    description: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteFileID, setDeleteFileID] = useState(null);
  const [selectedFilePath, setSelectedFilePath] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // เพิ่ม state สำหรับควบคุมการกดปุ่ม
  const [hrdocument, sethrdocunet] = useState([]);
  const [deleteDocumentId, setDeleteDocumentId] = useState(null);
  const [deleteType, setDeleteType] = useState(null); // แยกประเภทเอกสาร
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [activeTab, setActiveTab] = useState('leave'); // ตั้งค่าแท็บเริ่มต้นเป็น "leave"
  const [historyState, sethistoryState] = useState(null)

  const categoryMapping = {
    Certificate: 'ใบลาป่วย',
    WorkContract: 'ใบลากิจ',
    Identification: 'ใบลาพักร้อน',
    Maternity: 'ใบลาคลอด',
    Ordination: 'ใบลาบวช',
    Doc: 'เอกสารส่วนตัว',
    Others: 'อื่นๆ',
  };

  const categoryMappingg = {
    "A461E72F-B9A3-4F9D-BF69-1BBE6EA514EC": "ใบลาป่วย",
    "6CF7C54A-F9BA-4151-A554-6487FDD7ED8D": "ใบลาพักร้อน",
    "1799ABEB-158C-479E-A9DC-7D45E224E8ED": "ใบลากิจ",
    "DAA14555-28E7-497E-B1D8-E0DA1F1BE283": "ใบลาคลอด",
    "AE3C3A05-1FCB-4B8A-9044-67A83E781ED6": "ใบลาบวช",
  };

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
  // ฟังก์ชันแปลง leaveTypeId เป็นชื่อหมวดหมู่ที่อ่านง่าย
  const getCategoryName = (leaveTypeId) => {
    return categoryMappingg[leaveTypeId.toUpperCase()] || "ไม่ระบุหมวดหมู่";
  };

  // ดึง User ID จาก session หรือ localStorage
  const userID = localStorage.getItem('userId') || sessionStorage.getItem('userId');

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      const response = await fetch(`https://localhost:7039/api/Files/Document?userID=${userID}`);
      const data = await response.json();
      setDocuments(data);
      setFilteredDocuments(data);
    } catch (error) {
      console.error("Error fetching documents:", error);
      alert("ไม่สามารถโหลดข้อมูลเอกสารได้");
    }
  };
  const fetchHistory = async (documentid) => {
    try {
      const res = await axios.get(`https://localhost:7039/api/Document/GetDocumentWithHistory/${documentid}`);
      console.log("fetchHistory", res.data.historyleave)

      const historyRes = res.data.historyleave;
      sethistoryState(historyRes)

    } catch (e) {
      console.log(e)
    }
  }
  const fetchDocumentsFromHR = async () => {
    try {
      const response = await fetch(`https://localhost:7039/api/Document/GetCommitedDocumentsByUser/${userID}`);

      if (!response.ok) {
        if (response.status === 404) {
          console.warn("ไม่มีเอกสารใบลา (API คืน 404)");
          sethrdocunet([]); // ตั้งค่าเป็น array ว่าง เพื่อป้องกัน UI พัง
          return;
        }
        throw new Error(`เกิดข้อผิดพลาด: ${response.statusText}`);
      }

      const data = await response.json();
      sethrdocunet(data);
      console.log("Commited Documents:", data);

      // ตรวจสอบว่า API ส่งข้อมูลมาหรือไม่ก่อนเรียก fetchHistory
      if (data.length > 0) {
        await fetchHistory(data[0].documentId);
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดระหว่างดึงข้อมูล:", error);
      sethrdocunet([]); // ป้องกัน UI พังถ้า API มีปัญหา
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchDocumentsFromHR();
  }, []);

  const handleOpenModal = async (filePathOrDoc) => {
    setSelectedFilePath(typeof filePathOrDoc === 'string' ? filePathOrDoc : null);
    setSelectedDocument(typeof filePathOrDoc === 'object' ? filePathOrDoc : null);
    setPassword('');
    setIsModalOpen(true);
    console.log("verifyPassword", hrdocument[0].documentId)

    await fetchHistory(hrdocument[0].documentId)
  };

  const handleVerifyPassword = async () => {
    if (!password) {
      alert('กรุณาใส่รหัสผ่าน');
      return;
    }

    const verifyPassword = async (userID, password) => {
      try {
        const data = JSON.stringify({
          userID: userID,
          passwordHash: password,
        });

        const config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: 'https://localhost:7039/api/Files/VerifyPassword',
          headers: {
            'Content-Type': 'application/json',
          },
          data: data,
        };

        const response = await axios.request(config);

        if (response.data.isValid) {
          if (selectedFilePath) {
            // เปิดไฟล์เอกสารอัปโหลด
            window.open('https://localhost:7039' + selectedFilePath, '_blank');
          } else if (selectedDocument) {
            // สร้าง PDF สำหรับเอกสารใบลา
            createPDF(selectedDocument);
          }
          setIsModalOpen(false); // ปิด modal
        } else {
          alert('รหัสผ่านไม่ถูกต้อง');
        }
      } catch (error) {
        console.error('Error verifying password:', error);
        alert('เกิดข้อผิดพลาดในการตรวจสอบรหัสผ่าน');
      }
    };

    verifyPassword(userID, password);
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();

    if (isSubmitting) return; // ป้องกันการกดซ้ำ
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('File', newDocument.file);
    formData.append('Category', newDocument.category);
    formData.append('Description', newDocument.description);
    formData.append('UserID', userID);

    try {
      const response = await fetch('https://localhost:7039/api/Files/Create', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Response:', result);
        setModalMessage('สร้างเอกสารสำเร็จ');
        setIsSuccessModalOpen(true); // เปิดโมเดลสำเร็จ
        await fetchDocuments(); // โหลดข้อมูลใหม่

        // รีเซ็ตฟอร์มหลังอัปโหลดสำเร็จ
        setNewDocument({
          category: '',
          file: null,
          description: '',
        });
      } else {
        console.error('Error creating document:', response.statusText);
        setModalMessage('เกิดข้อผิดพลาดในการสร้างเอกสาร');
        setIsErrorModalOpen(true); // เปิดโมเดลล้มเหลว
      }
    } catch (error) {
      console.error('Error creating document:', error);
      setModalMessage('เกิดข้อผิดพลาดในการสร้างเอกสาร');
      setIsErrorModalOpen(true); // เปิดโมเดลล้มเหลว
    } finally {
      setIsSubmitting(false); // ตั้งค่า isSubmitting กลับเป็น false
    }
  };

  const handleSearch = () => {
    const lowerSearchTerm = searchTerm.trim().toLowerCase(); // ตัดช่องว่างออกก่อนค้นหา

    if (lowerSearchTerm === "") {
      // รีเซ็ตค่ากลับไปเป็นข้อมูลทั้งหมดตามแท็บที่เลือก
      if (activeTab === "leave") {
        sethrdocunet([...hrdocument]); // ใช้ spread operator เพื่อให้ React รู้ว่ามีการเปลี่ยนแปลง
      } else {
        setFilteredDocuments([...documents]);
      }
      return;
    }

    if (activeTab === "leave") {
      // ค้นหาเฉพาะในเอกสารใบลา
      const filteredLeaves = hrdocument.filter(
        (doc) =>
          (doc.category && doc.category.toLowerCase().includes(lowerSearchTerm)) ||
          (doc.reason && doc.reason.toLowerCase().includes(lowerSearchTerm))
      );
      sethrdocunet(filteredLeaves);
    } else {
      // ค้นหาเฉพาะในเอกสารอัปโหลด
      const filteredUploads = documents.filter(
        (doc) =>
          (doc.category && doc.category.toLowerCase().includes(lowerSearchTerm)) ||
          (doc.description && doc.description.toLowerCase().includes(lowerSearchTerm))
      );
      setFilteredDocuments(filteredUploads);
    }
  };

  // ✅ รีเซ็ตค่า hrdocument ทุกครั้งที่เปลี่ยนแท็บ
  useEffect(() => {
    if (activeTab === "leave") {
      sethrdocunet([...hrdocument]); // ใช้ spread operator เพื่อให้ React อัปเดต UI
    }
  }, [activeTab]); // เรียกเมื่อเปลี่ยนแท็บ


  const handleDeleteDocument = async () => {
    if (!deleteDocumentId || !deleteType) return;

    let apiUrl = deleteType === "upload"
      ? `https://localhost:7039/api/Files/${deleteDocumentId}` // ลบเอกสารที่อัปโหลด
      : `https://localhost:7039/api/Document/DeleteDocument/${deleteDocumentId}`; // ลบเอกสารใบลา

    try {
      const response = await fetch(apiUrl, { method: "DELETE" });

      if (response.ok) {
        if (deleteType === "upload") {
          setDocuments((prev) => prev.filter((doc) => doc.fileID !== deleteDocumentId));
          setFilteredDocuments((prev) => prev.filter((doc) => doc.fileID !== deleteDocumentId));
        } else {
          sethrdocunet((prev) => prev.filter((doc) => doc.documentId !== deleteDocumentId));
        }
      } else {
        console.error("Error deleting document:", response.statusText);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
    } finally {
      handleCloseDeleteModal();
    }
  };
  const handleOpenDeleteModal = (id, type) => {
    setDeleteDocumentId(id);
    setDeleteType(type); // "upload" หรือ "leave"
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteDocumentId(null);
    setDeleteType(null);
    setIsDeleteModalOpen(false);
  };

  const confirmDeleteDocument = () => {
    handleDeleteDocument(deleteFileID);
    handleCloseDeleteModal();
  };

  const createPDF = (doc) => {
    if (!doc) {
      alert("ไม่พบข้อมูลเอกสาร");
      return;
    }

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
                { text: historyState.lastTotalStickDay ?? "0", alignment: 'center' },
                { text: historyState.totalStickDay ?? "0", alignment: 'center' },
                { text: historyState.sumStickDay ?? "0", alignment: 'center' }
              ],
              [
                { text: "กิจส่วนตัว", alignment: 'center' },
                { text: historyState.lastTotalPersonDay ?? "0", alignment: 'center' },
                { text: historyState.totalPersonDay ?? "0", alignment: 'center' },
                { text: historyState.sumPersonDay ?? "0", alignment: 'center' }
              ],
              [
                { text: "พักร้อน", alignment: 'center' },
                { text: historyState.lastTotalVacationDays ?? "0", alignment: 'center' },
                { text: historyState.totalVacationDays ?? "0", alignment: 'center' },
                { text: historyState.sumVacationDays ?? "0", alignment: 'center' }
              ],
              [
                { text: "คลอดบุตร", alignment: 'center' },
                { text: historyState.lastTotalMaternityDaystotal ?? "0", alignment: 'center' },
                { text: historyState.totalMaternityDaystotal ?? "0", alignment: 'center' },
                { text: historyState.sumMaternityDaystotal ?? "0", alignment: 'center' }
              ],
              [
                { text: "บวช", alignment: 'center' },
                { text: historyState.lastTotalOrdinationDays ?? "0", alignment: 'center' },
                { text: historyState.totalOrdinationDays ?? "0", alignment: 'center' },
                { text: historyState.sumOrdinationDays ?? "0", alignment: 'center' }
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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.match('application/*')) {
      setNewDocument({ ...newDocument, file: selectedFile });
    } else {
      alert('กรุณาอัปโหลดไฟล์ที่ถูกต้อง เช่น PDF หรือ Word');
    }
  };
 
  return (
    <div className="">
      <div className="max-w-screen-lg mx-auto bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-2xl font-bold text-black font-FontNoto">จัดการเอกสารพนักงาน</h2>

        {/* Modal ใส่รหัสผ่าน */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] relative">
              <h3 className="text-lg font-bold mb-4 font-FontNoto">
                กรุณาใส่รหัสผ่าน
              </h3>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input input-bordered w-full mb-4 font-FontNoto"
                  placeholder="ใส่รหัสผ่าน"
                  value={password}
                  onChange={(e) => {
                    if (!/[ก-๙]/.test(e.target.value)) {
                      setPassword(e.target.value);
                    }
                  }}
                  onKeyPress={(e) => {
                    if (/[ก-๙]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
                {/* ปุ่มสำหรับแสดง/ซ่อนรหัสผ่าน */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  className="btn btn-outline btn-warning font-FontNoto"
                  onClick={() => setIsModalOpen(false)}
                >
                  ยกเลิก
                </button>
                <button
                  className="btn btn-outline btn-primary font-FontNoto"
                  onClick={handleVerifyPassword}
                >
                  ยืนยัน
                </button>
              </div>
            </div>
          </div>
        )}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] relative">
              <h3 className="text-lg font-bold mb-4 font-FontNoto">ยืนยันการลบ</h3>
              <p className="font-FontNoto">คุณต้องการลบเอกสารนี้หรือไม่?</p>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  className="btn btn-outline btn-warning font-FontNoto"
                  onClick={handleCloseDeleteModal}
                >
                  ยกเลิก
                </button>
                <button
                  className="btn btn-outline btn-error font-FontNoto"
                  onClick={handleDeleteDocument}
                >
                  ยืนยัน
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Modal สำเร็จ */}
        {isSuccessModalOpen && (
          <dialog id="success_modal" className="modal" open>
            <div className="modal-box">
              <h3 className="font-bold text-lg font-FontNoto">สำเร็จ</h3>
              <p className="text-lg font-FontNoto">{modalMessage}</p>
              <div className="modal-action">
                <button
                  className="btn btn-outline btn-error font-FontNoto"
                  onClick={() => setIsSuccessModalOpen(false)}
                >
                  ปิด
                </button>
              </div>
            </div>
          </dialog>
        )}

        {/* Modal ล้มเหลว */}
        {isErrorModalOpen && (
          <dialog id="error_modal" className="modal" open>
            <div className="modal-box">
              <h3 className="font-bold text-lg font-FontNoto">ข้อผิดพลาด</h3>
              <p className="text-lg font-FontNoto">{modalMessage}</p>
              <div className="modal-action">
                <button
                  className="btn btn-outline btn-error font-FontNoto"
                  onClick={() => setIsErrorModalOpen(false)}
                >
                  ปิด
                </button>
              </div>
            </div>
          </dialog>
        )}

        {/* Form อัปโหลดเอกสาร */}
        <form
          onSubmit={handleAddDocument}
          className="space-y-4 mb-8 bg-base-100 p-4 rounded-lg shadow"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-FontNoto">ชื่อเอกสาร</span>
              </label>
              <input
                type="text"
                className="input input-bordered font-FontNoto"
                placeholder="กรอกชื่อเอกสาร"
                value={newDocument.description}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, description: e.target.value })
                }
              />
            </div>
            <div className="form-control font-FontNoto">
              <label className="label">
                <span className="label-text font-FontNoto">หมวดหมู่เอกสาร</span>
              </label>
              <select
                className="select select-bordered font-FontNoto"
                value={newDocument.category}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, category: e.target.value })
                }
              >
                <option className="font-FontNoto" value="">กรุณาเลือกหมวดหมู่เอกสาร</option>
                {/* <option className="font-FontNoto" value="Certificate">ใบลาป่วย</option>
                <option className="font-FontNoto" value="WorkContract">ใบลากิจ</option>
                <option className="font-FontNoto" value="Identification">ใบลาพักร้อน</option>
                <option className="font-FontNoto" value="Maternity">ใบลาคลอด</option>
                <option className="font-FontNoto" value="Ordination">ใบลาบวช</option> */}
                <option className="font-FontNoto" value="Doc">เอกสารส่วนตัว</option>
                <option className="font-FontNoto" value="Others">อื่นๆ</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-FontNoto">ไฟล์เอกสาร</span>
              </label>
              <input
                type="file"
                className="file-input file-input-bordered font-FontNoto"
                onChange={handleFileChange}
              />
            </div>
          </div>
          <button
            className="btn btn-warning mt-4 w-full font-FontNoto"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'กำลังอัปโหลด...' : 'อัปโหลดเอกสาร'}
          </button>
        </form>

        <div className="bg-base-100 p-4 rounded-lg shadow mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">

            {/* Tabs */}
            <div className="flex flex-col sm:flex-row flex-grow font-FontNoto text-lg gap-2 sm:gap-4">
              <button
                className={`tab px-4 py-3 sm:py-6 w-full sm:w-auto rounded-lg transition-all ${activeTab === 'leave' ? 'bg-gray-100 text-black font-bold' : 'text-gray-600'
                  }`}
                onClick={() => setActiveTab('leave')}
              >
                เอกสารใบลา
              </button>
              <button
                className={`tab px-4 py-3 sm:py-6 w-full sm:w-auto rounded-lg transition-all ${activeTab === 'uploaded' ? 'bg-gray-100 text-black font-bold' : 'text-gray-600'
                  }`}
                onClick={() => setActiveTab('uploaded')}
              >
                เอกสารอัปโหลด
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <input
                type="text"
                className="input input-bordered flex-grow font-FontNoto max-w-sm"
                placeholder="ค้นหาชื่อเอกสาร..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="btn btn-info font-FontNoto" onClick={handleSearch}>
                ค้นหา
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'leave' && (
          <div className="bg-base-100 p-6 rounded-lg shadow-lg font-FontNoto">
            <h3 className="text-xl font-bold text-black mb-4 font-FontNoto">เอกสารใบลา</h3>

            {hrdocument.length > 0 ? (
              <ul className="space-y-4 font-FontNoto">
                {hrdocument.map((doc) => (
                  <li key={doc.documentId} className="p-4 bg-white rounded-lg shadow flex justify-between items-center">
                    <div>
                      <h4 className="text-lg font-bold font-FontNoto">{doc.reason || "ใบลา"}</h4>
                      <p className="text-sm text-gray-600 font-FontNoto">
                        หมวดหมู่เอกสาร: <span className="font-FontNoto">{categoryMappingg[doc.leaveTypeId?.toUpperCase()] || "ไม่ระบุหมวดหมู่"}</span>
                      </p>
                      <p className="text-sm text-gray-600 font-FontNoto">
                        วันที่อัปโหลด: <span className="font-FontNoto">{doc.hrApprovedDate ? new Date(doc.hrApprovedDate).toLocaleDateString('th-TH') : "จาก HR"}</span>
                      </p>
                      <p className="text-sm text-gray-600 font-FontNoto">
                        นามสกุลไฟล์: <span className="font-FontNoto">pdf</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-outline btn-info flex items-center gap-2 font-FontNoto hover:bg-blue-500 hover:text-white transition-all"
                        onClick={() => handleOpenModal(doc)}
                      >
                        ดูไฟล์
                      </button>
                      {/* <button
                        className="btn btn-outline btn-error font-FontNoto"
                        onClick={() => handleOpenDeleteModal(doc.documentId, "leave")}
                      >
                        ลบ
                      </button> */}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center mt-4 font-FontNoto">ไม่มีเอกสารใบลา</p>
            )}
          </div>
        )}

        {activeTab === 'uploaded' && (
          <div className="bg-base-100 p-6 rounded-lg shadow-lg font-FontNoto">
            <h3 className="text-xl font-bold text-black mb-4 font-FontNoto">เอกสารอัปโหลด</h3>
            <ul className="space-y-4 font-FontNoto">
              {filteredDocuments.map((doc) => {
                const fileExtension = doc.filePath ? doc.filePath.split('.').pop() : "ไม่พบข้อมูล";
                const uploadDate = doc.uploadDate || "จาก HR";
                const fileCategory = doc.category || "ไม่ระบุหมวดหมู่";
                const fileUrl = doc.filePath ? `https://localhost:7039${doc.filePath}` : null;
                return (
                  <li key={doc.fileID || Math.random()} className="p-4 bg-white rounded-lg shadow flex justify-between items-center">
                    <div>
                      <h4 className="text-lg font-bold font-FontNoto">{doc.description || "เอกสาร"}</h4>
                      <p className="text-sm text-gray-600 font-FontNoto">หมวดหมู่เอกสาร: {categoryMapping[fileCategory]}</p>
                      <p className="text-sm text-gray-600 font-FontNoto">
                        วันที่อัปโหลด: {uploadDate ? new Date(uploadDate).toLocaleDateString('th-TH') : ""}
                      </p>
                      <p className="text-sm text-gray-600 font-FontNoto">นามสกุลไฟล์: {fileExtension}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn btn-outline btn-info font-FontNoto" onClick={() => handleOpenModal(doc.filePath)}>ดูไฟล์</button>
                      <button className="btn btn-outline btn-error font-FontNoto" onClick={() => handleOpenDeleteModal(doc.fileID, "upload")}>ลบ</button>
                    </div>
                  </li>
                );
              })}

            </ul>
            {/* กรณีไม่มีเอกสาร */}
            {filteredDocuments.length === 0 && (
              <p className="text-gray-500 text-center mt-4 font-FontNoto">ไม่มีเอกสารอัปโหลด</p>
            )}
          </div>
        )}
      </div>

    </div>

  );
}

export default Document;
