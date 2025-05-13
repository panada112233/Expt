import React, { useEffect, useState } from "react";
import axios from "axios";

const HRInbox = () => {
  const [requests, setRequests] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [signature, setSignature] = useState("");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hrComment, setHrComment] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("https://localhost:7039/api/LeaveRequest/hr/pending");
      console.log("📥 API กลับมาว่า:", res.data);
      setRequests(res.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const showDetailModal = (request) => {
    setCurrentRequest(request);
    setIsDetailModalOpen(true);
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getRoleDisplay = (role) => {
    const roleMapping = {
      Hr: "ทรัพยากรบุคคล",
      GM: "ผู้จัดการทั่วไป",
      Dev: "นักพัฒนาระบบ",
      BA: "นักวิเคราะห์ธุรกิจ",
      Employee: "พนักงาน",
    };

    return roleMapping[role] || role;
  };
  const approve = async () => {
    if (!signature.trim()) {
      alert("กรุณาพิมพ์ชื่อก่อนอนุมัติ");
      return;
    }

    try {
      setIsModalOpen(false);
      await axios.post(
        `https://localhost:7039/api/LeaveRequest/hr/approve/${currentRequest.id}`,
        {
          comment: hrComment.trim() !== "" ? hrComment.trim() : "HR อนุมัติแล้ว"
        },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      await sendBackToDocument();

      setRequests(prev => prev.filter(r => r.id !== currentRequest.id));
      setCurrentRequest(null);
      setSignature("");
      setHrComment("");
      setConfirmationModalOpen(false);
    } catch (error) {
      console.error("Error approving request:", error);
      alert("เกิดข้อผิดพลาดในการอนุมัติคำขอ");
    }
  };

  const sendBackToDocument = async () => {
    try {
      const formData = new FormData();
      formData.append("Category", "Leave");
      formData.append("Description", `ใบลา ${currentRequest.leaveType} อนุมัติโดย HR`);
      formData.append("UserID", currentRequest.userID);
      formData.append("File", new Blob([JSON.stringify(currentRequest)], { type: 'application/json' }), "leave-details.json");

      await axios.post("https://localhost:7039/api/Files/Create", formData);
      console.log("📤 ส่งข้อมูลใบลาคืนพนักงานแล้ว");
    } catch (err) {
      console.error("Upload failed", err);
      throw new Error("เกิดข้อผิดพลาดในการส่งข้อมูลกลับพนักงาน");
    }
  };

  const handleAction = (request) => {
    setCurrentRequest(request);
    setIsModalOpen(true);
  };

  const confirmAction = () => {
    setIsModalOpen(false);
    setConfirmationModalOpen(true);
  };

  return (
    <div className="w-full sm:max-w-5xl mx-auto p-4 sm:p-6 min-h-screen bg-white rounded-xl shadow-lg mt-6 sm:mt-10 font-sans">
      <h1 className="text-2xl sm:text-3xl font-bold text-blue-800 text-center mb-6 sm:mb-8 font-FontNoto">รายการใบลาที่ผู้จัดการทั่วไปอนุมัติแล้ว</h1>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-6 sm:p-10 text-center">
          <p className="text-lg sm:text-xl text-gray-500 font-FontNoto">ไม่มีคำขอลาที่รออนุมัติในขณะนี้</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req.id} className="border border-gray-200 rounded-xl p-3 sm:p-4 shadow-md hover:shadow-lg transition bg-white">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-0">
                <div>
                  <p className="text-lg font-semibold text-blue-700 font-FontNoto">{req.user?.firstName} {req.user?.lastName}</p>
                  <div className="flex flex-col sm:flex-row sm:space-x-4 text-sm text-gray-600">
                    <p className="font-FontNoto">ประเภท: <span className="font-FontNoto">{req.leaveType}</span> ({req.timeType})</p>
                    <p className="font-FontNoto">วันที่: <span className="font-FontNoto">{formatDate(req.startDate)}</span> - <span className="font-FontNoto">{formatDate(req.endDate)}</span></p>
                  </div>
                </div>
                <div className="flex justify-end items-center mt-2 sm:mt-0 w-full sm:w-auto">
                  <button
                    className="text-sm text-blue-600 underline hover:text-blue-800 font-FontNoto whitespace-nowrap"
                    onClick={() => showDetailModal(req)}
                  >
                    ดูรายละเอียดทั้งหมด
                  </button>
                </div>
              </div>

              {expandedId === req.id && (
                <div className="mt-4 bg-gray-50 p-4 sm:p-6 rounded-xl space-y-3 overflow-x-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-FontNoto"><span className="font-semibold">แผนก:</span> {getRoleDisplay(req.user?.role)}</p>
                      <p className="font-FontNoto"><span className="font-semibold">เหตุผล:</span> {req.reason}</p>
                      <p className="font-FontNoto"><span className="font-semibold">เบอร์ติดต่อ:</span> {req.contact || "-"}</p>
                    </div>
                    <div>
                      <p className="font-FontNoto"><span className="font-semibold">จำนวนวันลา:</span> {req.totalDays} วัน</p>
                      <p className="font-FontNoto"><span className="font-semibold">วันที่ส่งคำขอ:</span> {formatDate(req.createdAt)}</p>
                      <p className="font-FontNoto"><span className="font-semibold">ลายเช็นผู้จัดการทั่วไป:</span> {req.gmComment || "-"}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleAction(req)}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition font-FontNoto flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      ตรวจสอบ และส่งคืนพนักงาน
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isModalOpen && currentRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 font-FontNoto">
              อนุมัติคำขอลา
            </h2>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-lg mb-2 font-FontNoto">ข้อมูลการลา</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-x-auto">
                <p className="font-FontNoto"><span className="font-semibold font-FontNoto">ชื่อผู้ขอลา:</span> {currentRequest.user?.firstName} {currentRequest.user?.lastName}</p>
                <p className="font-FontNoto"><span className="font-semibold font-FontNoto">แผนก:</span> {getRoleDisplay(currentRequest.user?.role)}</p>
                <p className="font-FontNoto"><span className="font-semibold font-FontNoto">ประเภทการลา:</span> {currentRequest.leaveType}</p>
                <p className="font-FontNoto"><span className="font-semibold font-FontNoto">ช่วงเวลา:</span> {currentRequest.timeType}</p>
                <p className="font-FontNoto"><span className="font-semibold font-FontNoto">วันที่เริ่มลา:</span> {formatDate(currentRequest.startDate)}</p>
                <p className="font-FontNoto"><span className="font-semibold font-FontNoto">วันที่สิ้นสุด:</span> {formatDate(currentRequest.endDate)}</p>
                <p className="font-FontNoto"><span className="font-semibold font-FontNoto">จำนวนวัน:</span> {currentRequest.totalDays} วัน</p>
                <p className="font-FontNoto"><span className="font-semibold font-FontNoto">เนื่องจาก :</span> {currentRequest.reason}</p>
                <p className="font-FontNoto">
                  <span className="font-semibold font-FontNoto">ติดต่อได้ที่ :</span> {(currentRequest.contact || "").split(" / ")[0] || "-"}
                </p>
                <p className="font-FontNoto">
                  <span className="font-semibold font-FontNoto">โทร :</span> {(currentRequest.contact || "").split(" / ")[1] || "-"}
                </p>
                <p className="font-FontNoto">
                  <span className="font-semibold font-FontNoto">ลายเช็นผู้จัดการทั่วไป :</span> {currentRequest.gmComment || "-"}
                </p>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 font-FontNoto mb-2">ชื่อ-สกุล (ลายเซ็น):</label>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg font-FontNoto bg-white text-black placeholder-gray-500"
                placeholder="พิมพ์ชื่อ-นามสกุล"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-FontNoto"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmAction}
                className="px-6 py-2 rounded-lg text-white transition font-FontNoto bg-yellow-500 hover:bg-yellow-600"
              >
                อนุมัติและส่งคืนพนักงาน
              </button>
            </div>
          </div>
        </div>
      )}

      {isDetailModalOpen && currentRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-800 font-FontNoto">รายละเอียดใบลา</h2>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                <h3 className="text-xl font-semibold text-blue-800 font-FontNoto">แบบฟอร์มใบลา</h3>
                <p className="text-sm font-FontNoto">วันที่ยื่น: {formatDate(currentRequest.createdAt)}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 font-FontNoto">ข้อมูลพนักงาน</h4>
                    <div className="space-y-2">
                      <p className="font-FontNoto"><span className="font-semibold font-FontNoto">ชื่อ-นามสกุล:</span> {currentRequest.user?.firstName} {currentRequest.user?.lastName}</p>
                      <p className="font-FontNoto"><span className="font-semibold font-FontNoto">แผนก:</span> {getRoleDisplay(currentRequest.user?.role)}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 font-FontNoto">รายละเอียดการลา</h4>
                    <div className="space-y-2">
                      <p className="font-FontNoto"><span className="font-semibold font-FontNoto">ประเภทการลา:</span> {currentRequest.leaveType}</p>
                      <p className="font-FontNoto"><span className="font-semibold font-FontNoto">ช่วงเวลา:</span> {currentRequest.timeType}</p>
                      <p className="font-FontNoto"><span className="font-semibold font-FontNoto">เนื่องจาก:</span> {currentRequest.reason}</p>
                      <p className="font-FontNoto"><span className="font-semibold font-FontNoto">วันที่เริ่มลา:</span> {formatDate(currentRequest.startDate)}</p>
                      <p className="font-FontNoto"><span className="font-semibold font-FontNoto">วันที่สิ้นสุด:</span> {formatDate(currentRequest.endDate)}</p>
                      <p className="font-FontNoto"><span className="font-semibold font-FontNoto">จำนวนวัน:</span> {currentRequest.totalDays} วัน</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 font-FontNoto">การติดต่อ</h4>
                    <div className="space-y-2">
                      <p className="font-FontNoto"><span className="font-semibold font-FontNoto">ติดต่อได้ที่:</span> {(currentRequest.contact || "").split(" / ")[0] || "-"}</p>
                      <p className="font-FontNoto"><span className="font-semibold font-FontNoto">โทร:</span> {(currentRequest.contact || "").split(" / ")[1] || "-"}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 font-FontNoto">ลายเซ็นผู้จัดการทั่วไป</h4>
                    <div className="space-y-2">
                      <p className="font-FontNoto">{currentRequest.gmComment || "-"}</p>
                    </div>
                  </div>

                  {currentRequest?.leaveStats && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 font-FontNoto">สถิติการลาในปีนี้</h4>
                      <div className="overflow-x-auto">
                        <table className="table w-full text-sm text-center">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="font-FontNoto p-2">ประเภท</th>
                              <th className="font-FontNoto p-2">ลามาแล้ว</th>
                              <th className="font-FontNoto p-2">ลาครั้งนี้</th>
                              <th className="font-FontNoto p-2">รวม</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(currentRequest.leaveStats).map(([key, stat]) => (
                              <tr key={key}>
                                <td className="capitalize font-FontNoto p-2">{key}</td>
                                <td className="p-2">{stat.used}</td>
                                <td className="p-2">{stat.current}</td>
                                <td className="p-2">{stat.total}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 font-FontNoto">การดำเนินการ</h4>
                    <button
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        handleAction(currentRequest);
                      }}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition w-full font-FontNoto"
                    >
                      ตรวจสอบ และส่งคืนพนักงาน
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal สำหรับยืนยันการดำเนินการ */}
      {confirmationModalOpen && currentRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md">
            <h3 className="text-lg sm:text-xl font-bold mb-4 text-center font-FontNoto">ยืนยันการดำเนินการ</h3>

            <div className="mb-6 text-center">
              <p className="font-FontNoto mb-2">ส่งใบลาคืนพนักงาน</p>
              <p className="font-FontNoto font-semibold text-lg">
                {currentRequest.user?.firstName} {currentRequest.user?.lastName}
              </p>
              <p className="font-FontNoto text-sm text-gray-600 mt-2">
                {currentRequest.leaveType} • {formatDate(currentRequest.startDate)} - {formatDate(currentRequest.endDate)}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => setConfirmationModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-FontNoto"
              >
                ยกเลิก
              </button>
              <button
                onClick={approve}
                className="px-6 py-2 rounded-lg text-white transition font-FontNoto bg-yellow-500 hover:bg-yellow-600"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRInbox;