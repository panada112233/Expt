import React, { useEffect, useState } from "react";
import axios from "axios";

const GMInbox = () => {
  const [requests, setRequests] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [signature, setSignature] = useState("");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [actionType, setActionType] = useState("");
  const [history, setHistory] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const labelMap = {
    sick: "ป่วย",
    personal: "กิจส่วนตัว",
    vacation: "พักร้อน",
    ordain: "บวช",
    maternity: "ลาคลอด"
  };

  useEffect(() => {
    fetchRequests();
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get("https://localhost:7039/api/LeaveRequest/gm/history");
      setHistory(res.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };
  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("https://localhost:7039/api/LeaveRequest/gm/pending");
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
  const showDetailModal = async (request) => {
    try {
      const userId = request.userID || request.user?.id;
      if (!userId) throw new Error("ไม่พบ userId");

      const res = await axios.get(`https://localhost:7039/api/LeaveRequest/stats/${userId}`);

      const enrichedRequest = {
        ...request,
        leaveStats: res.data
      };

      setCurrentRequest(enrichedRequest);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error("❌ ดึง leaveStats ไม่สำเร็จ:", error);
      alert("ไม่สามารถโหลดสถิติการลาได้");
      setCurrentRequest(request);
      setIsDetailModalOpen(true);
    }
  };


  const approve = async (id) => {
    if (!signature.trim()) {
      alert("กรุณาพิมพ์ชื่อก่อนอนุมัติ");
      return;
    }

    try {
      setIsModalOpen(false);

      await axios.post(
        `https://localhost:7039/api/LeaveRequest/gm/approve/${id}`,
        {
          Comment: ` ${signature.trim()}`,
          Signature: signature.trim()  // Add Signature here if needed
        },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      setRequests(prev => prev.filter(r => r.id !== id));
      setCurrentRequest(null);
      await fetchHistory();
      setSignature("");
      setConfirmationModalOpen(false);
    } catch (error) {
      console.error("Error approving request:", error);
      alert("เกิดข้อผิดพลาดในการอนุมัติคำขอ");
    }
  };


  const reject = async (id) => {
    if (!rejectionReason.trim()) {
      alert("กรุณากรอกเหตุผลในการไม่อนุมัติ");
      return;
    }

    if (!signature.trim()) {
      alert("กรุณาพิมพ์ชื่อก่อนไม่อนุมัติ");
      return;
    }

    try {
      setIsModalOpen(false);
      await axios.post(
        `https://localhost:7039/api/LeaveRequest/gm/reject/${id}`,
        { Comment: rejectionReason },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      setRequests(prev => prev.filter(r => r.id !== id));

      setCurrentRequest(null);
      setRejectionReason("");
      setSignature("");
      setConfirmationModalOpen(false);
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("เกิดข้อผิดพลาดในการไม่อนุมัติคำขอ");
    }

  };

  const handleAction = (request, action) => {
    setCurrentRequest(request);
    setActionType(action);
    setIsModalOpen(true);
  };

  const confirmAction = () => {
    setIsModalOpen(false);
    setConfirmationModalOpen(true);
  };

  const executeAction = () => {
    if (actionType === "approve") {
      approve(currentRequest.id);
    } else if (actionType === "reject") {
      reject(currentRequest.id);
    }
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

  return (
    <div className="w-full sm:max-w-5xl mx-auto p-4 sm:p-6 min-h-screen bg-white rounded-xl shadow-lg mt-6 sm:mt-10 font-sans">
      <h1 className="text-2xl sm:text-3xl font-bold text-blue-800 text-center mb-6 sm:mb-8 font-FontNoto">รายการใบลา รออนุมัติ</h1>
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
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleAction(req, "approve")}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-FontNoto flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      อนุมัติและส่งต่อ HR
                    </button>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        placeholder="เหตุผลไม่อนุมัติ"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="input input-bordered w-full font-FontNoto p-2 rounded-lg border"
                      />
                      <button
                        onClick={() => handleAction(req, "reject")}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-FontNoto flex items-center justify-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        ไม่อนุมัติ
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="mt-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-blue-800 text-center mb-6 sm:mb-8 font-FontNoto">
          ประวัติการอนุมัติ / ไม่อนุมัติใบลา
        </h2>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-6 sm:p-10 text-center">
            <p className="text-lg sm:text-xl text-gray-500 font-FontNoto">ไม่มีประวัติการอนุมัติ/ไม่อนุมัติใบลา</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-3 font-FontNoto">ชื่อผู้ขอลา</th>
                    <th className="px-4 py-3 font-FontNoto">ประเภท</th>
                    <th className="px-4 py-3 font-FontNoto">ช่วงเวลา</th>
                    <th className="px-4 py-3 font-FontNoto">สถานะ</th>
                    <th className="px-4 py-3 font-FontNoto">ชื่อผู้จัดการ</th>
                    <th className="px-4 py-3 font-FontNoto">วันที่ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(item => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-FontNoto">{item.user?.firstName} {item.user?.lastName}</td>
                      <td className="px-4 py-3 font-FontNoto">{item.leaveType}</td>
                      <td className="px-4 py-3 font-FontNoto">{formatDate(item.startDate)} {item.timeType === "ครึ่งวันเช้า" ? "(เช้า)" : item.timeType === "ครึ่งวันบ่าย" ? "(บ่าย)" : ""} - {formatDate(item.endDate)}</td>
                      <td className="px-4 py-3 font-FontNoto">
                        <span className={`px-2 py-1 rounded-full text-xs ${item.status === "ApprovedByGM" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {item.status === "ApprovedByGM" ? "อนุมัติแล้ว" : "ไม่อนุมัติ"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-FontNoto">{item.gmComment || "-"}</td>
                      <td className="px-4 py-3 font-FontNoto">{formatDate(item.gmApprovedAt || item.createdAt)}</td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {
        isModalOpen && currentRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 font-FontNoto">
                {actionType === "approve" ? "อนุมัติคำขอลา" : "ไม่อนุมัติคำขอลา"}
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


                </div>
              </div>

              {actionType === "reject" && (
                <div className="mb-4">
                  <label className="block text-gray-700 font-FontNoto mb-2">เหตุผลที่ไม่อนุมัติ:</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-FontNoto"
                    rows="3"
                    placeholder="กรุณาระบุเหตุผลที่ไม่อนุมัติ"
                  ></textarea>
                </div>
              )}

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
                  className={`px-6 py-2 rounded-lg text-white transition font-FontNoto ${actionType === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                    }`}
                >
                  {actionType === "approve" ? "อนุมัติ" : "ไม่อนุมัติ"}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {
        isDetailModalOpen && currentRequest && (
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
                        <p className="font-FontNoto"><span className="font-medium">ชื่อ-นามสกุล:</span> {currentRequest.user?.firstName} {currentRequest.user?.lastName}</p>
                        <p className="font-FontNoto"><span className="font-medium">แผนก:</span> {getRoleDisplay(currentRequest.user?.role)}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 font-FontNoto">รายละเอียดการลา</h4>
                      <div className="space-y-2">
                        <p className="font-FontNoto"><span className="font-medium">ประเภทการลา:</span> {currentRequest.leaveType}</p>
                        <p className="font-FontNoto"><span className="font-medium">ช่วงเวลา:</span> {currentRequest.timeType}</p>
                        <p className="font-FontNoto"><span className="font-medium">เนื่องจาก:</span> {currentRequest.reason}</p>
                        <p className="font-FontNoto"><span className="font-medium">วันที่เริ่มลา:</span> {formatDate(currentRequest.startDate)}</p>
                        <p className="font-FontNoto"><span className="font-medium">วันที่สิ้นสุด:</span> {formatDate(currentRequest.endDate)}</p>
                        <p className="font-FontNoto"><span className="font-medium">จำนวนวัน:</span> {currentRequest.totalDays} วัน</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 font-FontNoto">การติดต่อ</h4>
                      <div className="space-y-2 font-FontNoto">
                        <p className="font-FontNoto"><span className="font-FontNoto">ติดต่อได้ที่ :</span> {(currentRequest.contact || "").split(" / ")[0] || "-"}</p>
                        <p className="font-FontNoto"><span className="font-FontNoto">โทร :</span> {(currentRequest.contact || "").split(" / ")[1] || "-"}</p>
                      </div>

                    </div>
                  </div>
                  <div className="space-y-4">

                    <div className="mt-3">
                      <h4 className="font-semibold mb-2 font-FontNoto">สถิติการลาในปีนี้</h4>
                      <div className="overflow-x-auto">
                        <table className="table w-full text-sm text-center">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="font-FontNoto">ประเภท</th>
                              <th className="font-FontNoto">ลามาแล้ว</th>
                              <th className="font-FontNoto">ลาครั้งนี้</th>
                              <th className="font-FontNoto">รวม</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentRequest?.leaveStats &&
                              Object.entries(currentRequest.leaveStats).map(([key, stat]) => (
                                <tr key={key}>
                                  <td className="capitalize font-FontNoto">{labelMap[key] || key}</td>
                                  <td>{stat.used}</td>
                                  <td>{stat.current}</td>
                                  <td>{stat.total}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 font-FontNoto">การดำเนินการ</h4>
                      <div className="space-y-4">
                        <button
                          onClick={() => {
                            setIsDetailModalOpen(false);
                            handleAction(currentRequest, "approve");
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition w-full font-FontNoto"
                        >
                          อนุมัติและส่งต่อ HR
                        </button>

                        <div className="flex flex-col sm:flex-row items-center gap-2">
                          <input
                            type="text"
                            placeholder="เหตุผลไม่อนุมัติ"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="input input-bordered w-full font-FontNoto p-2 rounded-lg border"
                          />
                          <button
                            onClick={() => {
                              setIsDetailModalOpen(false);
                              handleAction(currentRequest, "reject");
                            }}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-FontNoto w-full sm:w-auto"
                          >
                            ไม่อนุมัติ
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Modal สำหรับยืนยันการดำเนินการ */}
      {
        confirmationModalOpen && currentRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md">
              <h3 className="text-lg sm:text-xl font-bold mb-4 text-center font-FontNoto">ยืนยันการดำเนินการ</h3>

              <div className="mb-6 text-center">
                <p className="font-FontNoto mb-2">คุณต้องการ{actionType === "approve" ? "อนุมัติ" : "ไม่อนุมัติ"}คำขอลาของ</p>
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
                  onClick={executeAction}
                  className={`px-6 py-2 rounded-lg text-white transition font-FontNoto ${actionType === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                    }`}
                >
                  ยืนยัน
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default GMInbox;