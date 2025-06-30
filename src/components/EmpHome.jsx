import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

function EmpHome() {
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
  const [selectedFilePath, setSelectedFilePath] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hrdocument, sethrdocunet] = useState([]);
  const [deleteDocumentId, setDeleteDocumentId] = useState(null);
  const [deleteType, setDeleteType] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [activeTab, setActiveTab] = useState('approvedLeave');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [allLeaveDocuments, setAllLeaveDocuments] = useState([]);

  const categoryMapping = {
    sick: "ใบลาป่วย",
    personal: "ใบลากิจ",
    vacation: "ใบลาพักร้อน",
    maternity: "ใบลาคลอด",
    ordain: "ใบลาบวช",
    Others: 'อื่นๆ',
    Doc: 'เอกสารส่วนตัว',
  };

  const getCategoryName = (leaveTypeId) => {
    return categoryMapping[leaveTypeId.toUpperCase()] || "ไม่ระบุหมวดหมู่";
  };

  const userID = localStorage.getItem('userId') || sessionStorage.getItem('userId');
  const fetchDocuments = async () => {
    try {
      const response = await fetch(`https://localhost:7039/api/Files/Document?userID=${userID}`);
      const data = await response.json();
      setDocuments(data);
      setFilteredDocuments(data);
    } catch (error) {
      alert("ไม่สามารถโหลดข้อมูลเอกสารได้");
    }
  };
  const loadLeaveJsonAndCreatePDF = async (filePath) => {
    try {
      const response = await axios.get(`https://localhost:7039/api/Files${filePath}`);
      const data = response.data;
      const latestReq = await axios.get(`https://localhost:7039/api/LeaveRequest/User/${data.userID}`);
      const updated = latestReq.data.find(r => r.id === data.id);
      if (updated) {
        Object.assign(data, updated);
      }
      const userRes = await axios.get(`https://localhost:7039/api/User/${data.userID}`);
      const user = userRes.data;

      const statRes = await axios.get(`https://localhost:7039/api/LeaveRequest/stats/${data.userID}?excludeId=${data.id}`);
      const leaveStats = statRes.data.stats || {};
      const lastLeave = statRes.data.lastLeave;
      const [contactAddress, contactPhone] = (data.contact || "").split(" / ");

      const enrichedForm = {
        ...data,
        writtenDate: data.createdAt,
        fullName: `${user.firstName} ${user.lastName}`,
        department: user.role || "-",
        joinDate: user.jDate?.split("T")[0] || "-",
        contactAddress: contactAddress || "-",
        contactPhone: contactPhone || "-",
        leaveStats,
        lastLeaveType: lastLeave?.leaveType || "-",
        lastLeaveStart: lastLeave?.startDate || "-",
        lastLeaveEnd: lastLeave?.endDate || "-",
        lastLeaveDays: lastLeave?.totalDays || 0,
        gmComment: data.gmComment || "-",
        hrComment: data.hrComment || "-"
      };

      createPDF(enrichedForm);
    } catch (error) {
      console.error("❌ Error loading and enriching leave JSON:", error);
      alert("ไม่สามารถโหลดข้อมูลใบลาจากไฟล์ได้");
    }
  };

  useEffect(() => {
    fetchDocuments();

  }, []);

  const handleOpenModal = async (filePathOrDoc) => {
    if (typeof filePathOrDoc === "object" && filePathOrDoc !== null) {
      setSelectedFilePath(null);
      setSelectedDocument(filePathOrDoc);
      setSelectedDoc(filePathOrDoc);
      setPassword("");
      setIsModalOpen(true);

      if (filePathOrDoc.documentId) {
        await fetchHistory(filePathOrDoc.documentId);
      }
    } else if (typeof filePathOrDoc === "string") {
      setSelectedFilePath(filePathOrDoc);
      setSelectedDocument(null);
      setSelectedDoc(null);
      setPassword("");
      setIsModalOpen(true);
    } else {
      alert("ไม่พบข้อมูลเอกสาร");
    }
  };

  const handlePasswordSubmit = async () => {
    try {
      const response = await axios.post('https://localhost:7039/api/Files/VerifyPassword', {
        userID: selectedDoc.userID,
        password: inputPassword
      });
      if (response.data.isValid) {
        setShowPasswordPrompt(false);
        setErrorPassword("");
        setInputPassword("");
        if (selectedDoc?.filePath) {
          window.open(`https://localhost:7039/api/Files${selectedDoc.filePath}`, '_blank');
        } else {

          createPDF(selectedDoc);
        }
      } else {
        setErrorPassword("รหัสไม่ถูกต้อง");
      }
    } catch (error) {
      setErrorPassword("เกิดข้อผิดพลาดในการตรวจสอบรหัสผ่าน");
    }
  };

  const handleVerifyPassword = async () => {
    if (!password) {
      alert('กรุณาใส่รหัสผ่าน');
      return;
    }

    const userIDToUse = selectedDocument?.userID || userID;

    try {
      const data = JSON.stringify({
        userID: userIDToUse,
        passwordHash: password,
      });

      const config = {
        method: 'post',
        url: 'https://localhost:7039/api/Files/VerifyPassword',
        headers: {
          'Content-Type': 'application/json',
        },
        data: data,
      };

      const response = await axios.request(config);
      if (response.data.isValid) {
        if (selectedDocument?.filePath) {
          const fileExt = selectedDocument.filePath.split('.').pop().toLowerCase();
          if (fileExt === "json") {
            await loadLeaveJsonAndCreatePDF(selectedDocument.filePath);
          } else {
            window.open('https://localhost:7039/api/Files' + selectedDocument.filePath, '_blank');
          }
        } else if (selectedDocument) {
          createPDF(selectedDocument);
        }

        setIsModalOpen(false);
        setErrorPassword('');
        setInputPassword('');
      } else {
        setErrorPassword('รหัสไม่ถูกต้อง');
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      setErrorPassword('เกิดข้อผิดพลาดในการตรวจสอบรหัสผ่าน');
    }
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
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
        setIsSuccessModalOpen(true);
        await fetchDocuments();

        setNewDocument({
          category: '',
          file: null,
          description: '',
        });
      } else {
        console.error('Error creating document:', response.statusText);
        setModalMessage('เกิดข้อผิดพลาดในการสร้างเอกสาร');
        setIsErrorModalOpen(true);
      }
    } catch (error) {
      console.error('Error creating document:', error);
      setModalMessage('เกิดข้อผิดพลาดในการสร้างเอกสาร');
      setIsErrorModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearch = () => {
    const lowerSearchTerm = searchTerm.trim().toLowerCase();

    if (lowerSearchTerm === "") {
      if (activeTab === "approvedLeave") {
        sethrdocunet([...allLeaveDocuments]);
      } else {
        setFilteredDocuments([...documents]);
      }
      return;
    }

    if (activeTab === "approvedLeave") {
      const filteredLeaves = allLeaveDocuments.filter(
        (doc) =>
          (doc.category && doc.category.toLowerCase().includes(lowerSearchTerm)) ||
          (doc.description && doc.description.toLowerCase().includes(lowerSearchTerm))
      );
      sethrdocunet(filteredLeaves);
    } else {
      const filteredUploads = documents.filter(
        (doc) =>
          (doc.category && doc.category.toLowerCase().includes(lowerSearchTerm)) ||
          (doc.description && doc.description.toLowerCase().includes(lowerSearchTerm))
      );
      setFilteredDocuments(filteredUploads);
    }
  };

  useEffect(() => {
    const fetchLeaveDocs = async () => {
      const res = await axios.get("https://localhost:7039/api/Files/Document?userID=" + userID);
      const data = res.data;

      const leaveOnly = data.filter(doc =>
        ["sick", "personal", "vacation", "maternity", "ordain"].includes(doc.category)
      );

      setAllLeaveDocuments(leaveOnly);
      sethrdocunet(leaveOnly);
    };

    if (activeTab === "approvedLeave") {
      fetchLeaveDocs();
    }
  }, [activeTab]);

  const handleDeleteDocument = async () => {
    if (!deleteDocumentId || !deleteType) return;

    let apiUrl = deleteType === "upload"
      ? `https://localhost:7039/api/Files/${deleteDocumentId}`
      : `https://localhost:7039/api/Document/DeleteDocument/${deleteDocumentId}`;

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
    } finally {
      handleCloseDeleteModal();
    }
  };
  const handleOpenDeleteModal = (id, type) => {
    setDeleteDocumentId(id);
    setDeleteType(type);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteDocumentId(null);
    setDeleteType(null);
    setIsDeleteModalOpen(false);
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
    <div className="flex flex-col w-full">
      <div className="w-full bg-gradient-to-r from-cyan-100 via-blue-100 to-blue-50 text-white rounded-xl p-4 sm:p-5 md:p-6 mb-6 shadow-lg">
        <h1 className="text-xl sm:text-2xl text-cyan-950 font-bold font-FontNoto leading-snug">
          จัดการเอกสารพนักงาน
        </h1>
        <p className="text-xs sm:text-sm mt-1 text-cyan-950 font-FontNoto">ตรวจสอบไฟล์เอกสารที่อัปโหลด</p>
      </div>
      <h2 className="text-2xl font-bold text-black font-FontNoto"></h2>
      <div className="">
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white text-black p-6 rounded-lg shadow-lg w-[400px] relative">
              <h3 className="text-lg font-bold mb-4 font-FontNoto">
                กรุณาใส่รหัสผ่าน
              </h3>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input input-bordered w-full mb-4 font-FontNoto 
             bg-white text-black 
             dark:bg-gray-800 dark:text-white 
             dark:placeholder-gray-400"
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
            <div className="bg-white text-black p-6 rounded-lg shadow-lg w-[400px] relative">
              <h3 className="text-lg font-bold mb-4 font-FontNoto">ยืนยันการลบ</h3>
              <p className="font-FontNoto">คุณต้องการลบเอกสารนี้หรือไม่?</p>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  className="btn btn-outline btn-warning bg-white text-black border-yellow-500 hover:bg-yellow-100 font-FontNoto"
                  onClick={handleCloseDeleteModal}
                >
                  ยกเลิก
                </button>
                <button
                  className="btn btn-outline btn-error bg-white text-black border-red-500 hover:bg-red-100 font-FontNoto"
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
            <div className="modal-box bg-white text-black">
              <h3 className="font-bold text-lg font-FontNoto">สำเร็จ</h3>
              <p className="text-lg font-FontNoto">{modalMessage}</p>
              <div className="modal-action">
                <button
                  className="btn btn-outline btn-error bg-white text-black border-red-500 hover:bg-red-100 font-FontNoto"
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
          className="space-y-4 mb-8 bg-white p-4 rounded-lg shadow text-black"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-FontNoto text-black">ชื่อเอกสาร</span>
              </label>
              <input
                type="text"
                className="input input-bordered bg-white text-black font-FontNoto"
                placeholder="กรอกชื่อเอกสาร"
                value={newDocument.description}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, description: e.target.value })
                }
              />
            </div>

            <div className="form-control font-FontNoto">
              <label className="label">
                <span className="label-text text-black font-FontNoto">หมวดหมู่เอกสาร</span>
              </label>
              <select
                className="select select-bordered bg-white text-black font-FontNoto"
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
                <span className="label-text text-black font-FontNoto">ไฟล์เอกสาร</span>
              </label>
              <input
                type="file"
                className="file-input file-input-sm file-input-bordered bg-white text-black font-FontNoto"
                onChange={handleFileChange}
              />
            </div>
          </div>
          <div className="relative mt-4 w-full">

            <button
              className="btn btn-outline btn-primary w-full font-FontNoto relative"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'กำลังอัปโหลด...' : 'อัปโหลดเอกสาร'}
            </button>
          </div>
        </form>
        <div className="bg-white text-black p-4 rounded-lg shadow mb-8 font-FontNoto max-w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
            <div className="flex flex-row gap-2 w-full sm:w-1/3 items-center max-w-full min-w-0">
              <input
                type="text"
                className="input input-bordered bg-white text-black flex-grow max-w-full min-w-0 font-FontNoto"
                placeholder="ค้นหาชื่อเอกสาร..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                className="btn btn-outline btn-success bg-white text-black border-green-500 hover:bg-green-100 whitespace-nowrap max-w-[120px] shrink-0 font-FontNoto"
                onClick={handleSearch}
              >
                ค้นหา
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg font-FontNoto text-black">
          <h3 className="text-xl font-bold text-black mb-4 font-FontNoto">เอกสารอัปโหลด</h3>
          <ul className="space-y-4 font-FontNoto">
            {filteredDocuments
              .filter(doc => ["Others", "Doc"].includes(doc.category))
              .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
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
                      <button
                        className="btn btn-outline btn-info font-FontNoto"
                        onClick={() => handleOpenModal(doc)}
                      >
                        ดูไฟล์
                      </button>

                      <button
                        className="btn btn-outline btn-error font-FontNoto"
                        onClick={() => handleOpenDeleteModal(doc.fileID, "upload")}
                      >
                        ลบ
                      </button>
                    </div>
                  </li>
                );
              })}
          </ul>
          {filteredDocuments
            .filter(doc => ["Others", "Doc"].includes(doc.category))
            .length === 0 && (
              <p className="text-gray-500 text-center mt-4 font-FontNoto">ไม่มีเอกสารอัปโหลด</p>
            )}
        </div>
      </div>
    </div>
  );
}

export default EmpHome;
