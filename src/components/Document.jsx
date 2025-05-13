import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

  const leavedTypeMapping = {
    sick: "ลาป่วย",
    business: "ลากิจ",
    vacation: "ลาพักร้อน",
    maternity: "ลาคลอด",
    other: "ลาอื่นๆ",
  };
  const getCategoryName = (leaveTypeId) => {
    return leavedTypeMapping[leaveTypeId.toUpperCase()] || "ไม่ระบุหมวดหมู่";
  };

  const userID = localStorage.getItem('userId') || sessionStorage.getItem('userId');

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
 
  useEffect(() => {
    fetchDocuments();

  }, []);

  const handleOpenModal = async (filePathOrDoc) => {
    setSelectedFilePath(typeof filePathOrDoc === 'string' ? filePathOrDoc : null);
    setSelectedDocument(typeof filePathOrDoc === 'object' ? filePathOrDoc : null);
    setPassword('');
    setIsModalOpen(true);

    if (hrdocument.length > 0 && typeof filePathOrDoc === 'object' && filePathOrDoc.documentId) {
      await fetchHistory(filePathOrDoc.documentId);
    } else if (hrdocument.length > 0) {
      await fetchHistory(hrdocument[0].documentId);
    }
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

  useEffect(() => {
    if (activeTab === "leave") {
      sethrdocunet([...hrdocument]);
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

  const createPDF = async (doc) => {
    if (!doc) {
      alert("ไม่พบข้อมูลเอกสาร");
      return;
    }

    const userID = localStorage.getItem("userId") || sessionStorage.getItem("userId");

    let userData = {
      firstName: "",
      lastName: "",
      departmentName: "",
      positionName: "",
      address: "",
      phoneNumber: ""
    };

    try {
      const userResponse = await axios.get(`https://localhost:7039/api/User/${userID}`);
      userData = userResponse.data || userData;
    } catch (error) {
      console.error("Error fetching user data:", error);
      const fullNameParts = doc.fullName?.split(" ") || [];
      userData.firstName = fullNameParts[0] || "ไม่ระบุ";
      userData.lastName = fullNameParts[1] || "";
      userData.departmentName = doc.department || "ไม่ระบุแผนก";
      userData.positionName = doc.position || "ไม่ระบุตำแหน่ง";
      userData.address = "ไม่ระบุที่อยู่";
      userData.phoneNumber = "ไม่ระบุเบอร์โทร";
    }

    const formatDate = (date) => {
      if (!date) return "-";
      return new Intl.DateTimeFormat("th-TH", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).format(new Date(date));
    };

    const safeConcat = (firstName, lastName) => {
      if (firstName && lastName) return `${firstName} ${lastName}`;
      if (firstName) return firstName;
      if (lastName) return lastName;
      return "ไม่ระบุชื่อ";
    };

    const docData = {
      createdAt: doc.createdAt || doc.uploadDate || new Date(),
      fullName: doc.fullName || safeConcat(userData.firstName, userData.lastName),
      department: doc.department || userData.departmentName || "ไม่ระบุแผนก",
      position: doc.position || userData.positionName || "ไม่ระบุตำแหน่ง",
      startDate: doc.startDate || doc.createdAt || doc.uploadDate,
      endDate: doc.endDate || doc.createdAt || doc.uploadDate,
      totalDays: doc.totalDays || "1",
      reason: doc.reason || doc.description || "ไม่ระบุเหตุผล",
      contact: doc.contact || `${userData.address} / ${userData.phoneNumber}`
    };

    let address = "ไม่ระบุที่อยู่";
    let phone = "ไม่ระบุเบอร์โทร";

    if (docData.contact && docData.contact.includes(" / ")) {
      [address, phone] = docData.contact.split(" / ");
    }

    const leavedTypeMapping = {
      sick: "ลาป่วย",
      business: "ลากิจ",
      vacation: "ลาพักร้อน",
      maternity: "ลาคลอด",
      ordination: "ลาบวช",
      other: "ลาอื่นๆ"
    };

    const isHRDocument = doc.leaveType || doc.leaveTypeId;
    let leaveTypeText = "ไม่ระบุ";

    if (isHRDocument) {
      const leaveTypeId = (doc.leaveTypeId || "").toLowerCase();
      const leaveType = (doc.leaveType || "").toLowerCase();
      leaveTypeText = leavedTypeMapping[leaveTypeId] || leavedTypeMapping[leaveType] || "ไม่ระบุ";
    } else if (doc.category === "Leave") {
      const description = (doc.description || "").toLowerCase();
      if (description.includes("ป่วย")) leaveTypeText = "ลาป่วย";
      else if (description.includes("กิจ")) leaveTypeText = "ลากิจ";
      else if (description.includes("พักร้อน")) leaveTypeText = "ลาพักร้อน";
      else if (description.includes("คลอด")) leaveTypeText = "ลาคลอด";
      else if (description.includes("บวช")) leaveTypeText = "ลาบวช";
      else leaveTypeText = "ตามที่ระบุในเอกสาร";
    } else {
      leaveTypeText = "ตามที่ระบุในเอกสาร";
    }

    const docDefinition = {
      content: [
        { text: "แบบฟอร์มใบลา", style: "header" },
        {
          text: `วันที่: ${new Date(docData.createdAt).toLocaleDateString("th-TH", {
            day: "2-digit", month: "2-digit", year: "numeric"
          })}`,
          alignment: "right", margin: [0, 0, 0, 10]
        },


        { text: `เรื่อง: ขออนุญาตลา ${leaveTypeText}`, margin: [0, 0, 0, 10] },
        { text: "เรียน หัวหน้าแผนก/ฝ่ายบุคคล", margin: [0, 0, 0, 10] },
        { text: `ข้าพเจ้า: ${docData.fullName}`, margin: [0, 0, 0, 5] },
        { text: `แผนก: ${docData.department}`, margin: [0, 0, 0, 5] },
        { text: `ตำแหน่ง: ${docData.position}`, margin: [0, 0, 0, 5] },
        { text: `ขอลาในช่วงวันที่: ${formatDate(docData.startDate)} ถึง ${formatDate(docData.endDate)}`, margin: [0, 0, 0, 5] },
        { text: `จำนวน: ${docData.totalDays} วัน`, margin: [0, 0, 0, 5] },
        { text: `เนื่องจาก: ${docData.reason}`, margin: [0, 0, 0, 10] },
        { text: "สามารถติดต่อข้าพเจ้าได้ที่:", bold: true, margin: [0, 10, 0, 5] },
        { text: `ที่อยู่: ${address}`, margin: [0, 0, 0, 3] },
        { text: `เบอร์โทรศัพท์: ${phone}`, margin: [0, 0, 0, 3] },
        { text: "ขอแสดงความนับถือ", alignment: "right", margin: [0, 20, 0, 10] },
        { text: "(ลงชื่อ) ...............................................", alignment: "right", margin: [0, 0, 0, 5] },
        { text: `( ${docData.fullName} )`, alignment: "right" }
      ],
      styles: {
        header: {
          fontSize: 20,
          bold: true,
          alignment: "center",
          margin: [0, 0, 0, 10]
        }
      },
      defaultStyle: {
        font: "THSarabunNew",
        fontSize: 16
      }
    };

    pdfMake.createPdf(docDefinition).download(`เอกสารใบลา_${leaveTypeText}.pdf`);
    console.log("DOC:", doc);
    console.log("createdAt:", doc.createdAt);
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
      <div className="w-full bg-gradient-to-r from-cyan-900 via-cyan-600 to-slate-500 text-white rounded-xl p-4 sm:p-5 md:p-6 mb-6 shadow-lg">
        <h1 className="text-xl sm:text-2xl font-bold font-FontNoto leading-snug">
          จัดการเอกสารพนักงาน
        </h1>
        <p className="text-xs sm:text-sm mt-1 font-FontNoto">ตรวจสอบเอกสารใบลา และเอกสารอัปโหลด</p>
      </div>
      <h2 className="text-2xl font-bold text-black font-FontNoto"></h2>
      <div className="max-w-screen-lg mx-auto bg-transparent rounded-lg p-3">

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
          <div className="relative mt-4 w-full">
            <img
              src="https://cdn-icons-png.flaticon.com/512/337/337946.png"
              alt="document cute"
              className="w-8 h-8 absolute -top-3 -left-3 rotate-[-10deg]"
            />
            <button
              className="btn btn-outline btn-primary w-full font-FontNoto relative"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'กำลังอัปโหลด...' : 'อัปโหลดเอกสาร'}
            </button>
          </div>
        </form>

        <div className="bg-base-100 p-4 rounded-lg shadow mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row w-full font-FontNoto text-base gap-2 sm:gap-2">
              <button
                className={`w-full sm:w-1/3 px-4 py-2 rounded-lg transition-all ${activeTab === 'uploaded'
                  ? 'bg-[#87CEFA] text-white font-bold shadow'
                  : 'bg-[#F2F9FC] text-[#6B7A8F] hover:bg-[#B0D6F1] hover:text-white'}`}
                onClick={() => setActiveTab('uploaded')}
              >
                เอกสารอัปโหลด
              </button>

              <button
                className={`w-full sm:w-1/3 px-4 py-2 rounded-lg transition-all ${activeTab === 'approvedLeave'
                  ? 'bg-[#87CEFA] text-white font-bold shadow'
                  : 'bg-[#F2F9FC] text-[#6B7A8F] hover:bg-[#B0D6F1] hover:text-white'}`}
                onClick={() => setActiveTab('approvedLeave')}
              >
                เอกสารการลา
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
              <button className="btn btn-outline btn-success font-FontNoto" onClick={handleSearch}>
                ค้นหา
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'approvedLeave' && (
          <div className="bg-base-100 p-6 rounded-lg shadow-lg font-FontNoto">
            <h3
              className="text-xl font-bold text-black mb-4 font-FontNoto cursor-pointer hover:text-blue-600 transition"
              onClick={() => {
                const approvedDoc = documents.find(doc => doc.category === 'Leave');
                if (approvedDoc) {
                  createPDF(approvedDoc);
                } else {
                  alert("ไม่พบเอกสารใบลาที่อนุมัติแล้ว");
                }
              }}
            >
              เอกสารการลา (อนุมัติแล้ว)
            </h3>

            {documents.filter(doc => doc.category === 'Leave').length > 0 ? (
              <ul className="space-y-4">
                {documents
                  .filter(doc => doc.category === 'Leave')
                  .map((doc) => {
                    const uploadDate = doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString('th-TH') : "-";
                    return (
                      <li key={doc.fileID} className="p-4 bg-white rounded-lg shadow flex justify-between items-center">
                        <div>
                          <h4 className="text-lg font-bold font-FontNoto">{doc.description || "ใบลา"}</h4>
                          <p className="text-sm text-gray-600 font-FontNoto">วันที่อัปโหลด: {uploadDate}</p>
                          <p className="text-sm text-gray-600 font-FontNoto">หมวดหมู่: ใบลา</p>
                          <p className="text-sm text-gray-600 font-FontNoto">นามสกุลไฟล์: pdf</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="btn btn-outline btn-success font-FontNoto"
                            onClick={() => createPDF(doc)}
                          >
                            ดาวน์โหลด PDF
                          </button>
                        </div>
                      </li>
                    );
                  })}
              </ul>
            ) : (
              <p className="text-gray-500 text-center mt-4 font-FontNoto">ไม่มีเอกสารการลา</p>
            )}
          </div>
        )}

        {activeTab === 'uploaded' && (
          <div className="bg-base-100 p-6 rounded-lg shadow-lg font-FontNoto">
            <h3 className="text-xl font-bold text-black mb-4 font-FontNoto">เอกสารอัปโหลด</h3>
            <ul className="space-y-4 font-FontNoto">
              {filteredDocuments
                .filter((doc) => doc.category !== 'Leave') // ✅ กรองออกใบลา
                .map((doc) => {
                  const fileExtension = doc.filePath ? doc.filePath.split('.').pop().toLowerCase() : "ไม่พบข้อมูล";
                  const uploadDate = doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString('th-TH') : "จาก HR";
                  const fileCategory = doc.category || "ไม่ระบุหมวดหมู่";
                  return (
                    <li key={doc.fileID || Math.random()} className="p-4 bg-white rounded-lg shadow flex justify-between items-center">
                      <div>
                        <h4 className="text-lg font-bold font-FontNoto">{doc.description || "เอกสาร"}</h4>
                        <p className="text-sm text-gray-600 font-FontNoto">หมวดหมู่เอกสาร: {categoryMapping[fileCategory]}</p>
                        <p className="text-sm text-gray-600 font-FontNoto">วันที่อัปโหลด: {uploadDate}</p>
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
            {filteredDocuments.filter((doc) => doc.category !== 'Leave').length === 0 && (
              <p className="text-gray-500 text-center mt-4 font-FontNoto">ไม่มีเอกสารอัปโหลด</p>
            )}
          </div>
        )}
      </div>
    </div>

  );
}

export default Document;
