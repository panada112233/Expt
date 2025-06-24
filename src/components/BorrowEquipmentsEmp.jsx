import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BorrowEquipmentsEmp = () => {
  const [equipments, setEquipments] = useState([]);
  const [allBorrows, setAllBorrows] = useState([]);
  const [borrows, setBorrows] = useState([]);
  const userId = parseInt(sessionStorage.getItem("userId"));
  const [activeTab, setActiveTab] = useState("equipments");
  const [selectedBorrowId, setSelectedBorrowId] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedStatus, setSelectedStatus] = useState("ทั้งหมด");

  const [requestReason, setRequestReason] = useState("");
  const [userProfile, setUserProfile] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredBorrows = borrows.filter(br => {
    const yearMatch = new Date(br.borrowDate).getFullYear() === parseInt(selectedYear);
    const statusMatch = selectedStatus === "ทั้งหมด" || br.status.trim() === selectedStatus;
    return yearMatch && statusMatch;
  });

  const totalPages = Math.ceil(filteredBorrows.length / itemsPerPage);
  const paginatedBorrows = filteredBorrows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    fetchData();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await axios.get(`https://192.168.1.188/hrwebapi/api/Users/Profile/${userId}`);
      setUserProfile(res.data);
    } catch (error) {
      console.error("ไม่สามารถโหลดข้อมูลผู้ใช้ได้", error);
    }
  };
  const fetchData = async () => {
    const [eqRes, brRes] = await Promise.all([
      axios.get("https://192.168.1.188/hrwebapi/api/Equipment/AllEquipments"),
      axios.get("https://192.168.1.188/hrwebapi/api/Equipment/BorrowRecords")
    ]);
    setEquipments(eqRes.data);
    setAllBorrows(brRes.data); // 👈 ใช้ข้อมูลทั้งหมด
    setBorrows(brRes.data.filter(b => b.userID === userId)); // 👈 ของเฉพาะ user นี้
  };

  const handleReturn = async (borrowId) => {
    try {
      await axios.post("https://192.168.1.188/hrwebapi/api/Equipment/Return", {
        borrowId: borrowId,
      });
      fetchData();
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการคืนอุปกรณ์:", error);
      alert("ไม่สามารถคืนอุปกรณ์ได้");
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="w-full bg-gradient-to-r from-cyan-100 via-blue-100 to-blue-50 text-white rounded-xl p-4 sm:p-5 md:p-6 mb-6 shadow-lg">
        <h1 className="text-xl sm:text-2xl text-cyan-950 font-bold font-FontNoto leading-snug">
          ยืม-คืน อุปกรณ์สำนักงาน
        </h1>
        <p className="text-xs sm:text-sm mt-1 text-cyan-950 font-FontNoto">ตรวจสอบข้อมูลการยืมอุปกรณ์สำนักงาน</p>
      </div>

      <div className="overflow-x-auto sm:overflow-visible px-2">
        <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-4 gap-4 font-FontNoto min-w-[640px] sm:min-w-0">
          <div className="flex-shrink-0 w-[250px] sm:w-auto bg-white shadow rounded-xl p-4 text-left">
            <p className="text-sm text-gray-500 mb-1">อุปกรณ์ทั้งหมด</p>
            <p className="text-2xl font-extrabold text-blue-800">
              {equipments.length}
              <span className="text-base font-normal text-blue-800 ml-1">รายการ</span>
            </p>
          </div>
          <div className="flex-shrink-0 w-[250px] sm:w-auto bg-white shadow rounded-xl p-4 text-left">
            <p className="text-sm text-gray-500 mb-1">อุปกรณ์ที่พร้อมใช้งาน</p>
            <p className="text-2xl font-extrabold text-green-700">
              {equipments.filter(eq => eq.isAvailable).length}
              <span className="text-base font-normal text-green-700 ml-1">รายการ</span>
            </p>
          </div>
          <div className="flex-shrink-0 w-[250px] sm:w-auto bg-white shadow rounded-xl p-4 text-left">
            <p className="text-sm text-gray-500 mb-1">อุปกรณ์ที่ยืมอยู่</p>
            <p className="text-2xl font-extrabold text-orange-600">
              {borrows.filter(b => b.status.trim() === "กำลังใช้งาน").length}
              <span className="text-base font-normal text-orange-600 ml-1">รายการ</span>
            </p>
          </div>
          <div className="flex-shrink-0 w-[250px] sm:w-auto bg-white shadow rounded-xl p-4 text-left">
            <p className="text-sm text-gray-500 mb-1">อุปกรณ์ที่คืนแล้ว</p>
            <p className="text-2xl font-extrabold text-purple-700">
              {borrows.filter(b => b.status.trim() === "คืนแล้ว").length}
              <span className="text-base font-normal text-purple-700 ml-1">รายการ</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-300 mb-4 mt-3">
        <button onClick={() => setActiveTab("equipments")} className={`py-2 px-4 font-bold font-FontNoto ${activeTab === "equipments" ? "border-b-4 border-blue-500 text-blue-600" : "text-gray-500"}`}>รายการอุปกรณ์</button>
        <button onClick={() => setActiveTab("borrow")} className={`py-2 px-4 font-bold font-FontNoto ${activeTab === "borrow" ? "border-b-4 border-blue-500 text-blue-600" : "text-gray-500"}`}>คืนอุปกรณ์</button>
        <button onClick={() => setActiveTab("history")} className={`py-2 px-4 font-bold font-FontNoto ${activeTab === "history" ? "border-b-4 border-blue-500 text-blue-600" : "text-gray-500"}`}>ประวัติการยืม-คืน</button>
      </div>

      {activeTab === "equipments" && (
        <>
          <h2 className="text-2xl font-bold mb-4 font-FontNoto">รายการอุปกรณ์ทั้งหมด</h2>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {equipments.map(eq => {
                const borrowedCount = allBorrows.filter(b => b.equipmentID === eq.equipmentID && b.status.trim() === "กำลังใช้งาน").length;
                const isAvailable = eq.totalCount > borrowedCount;
                const statusText = isAvailable ? "พร้อมใช้งาน" : "ถูกยืมไปแล้ว";
                const statusColor = isAvailable ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100";
                const buttonClass = isAvailable
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-100 text-blue-400 cursor-not-allowed";

                return (
                  <div key={eq.equipmentID} className="bg-white p-4 rounded-xl shadow border">
                    <div className="text-5xl mb-3 text-center">🖥️</div>
                    <h3 className="text-lg font-bold font-FontNoto mb-1">{eq.name}</h3>
                    <p className="text-sm text-gray-600 font-FontNoto mb-2">{eq.description}</p>
                    <p className="text-sm text-gray-400 font-FontNoto mb-1">{eq.code}</p> {/* รหัสอุปกรณ์ */}
                    <span className={`inline-block px-3 py-1 text-sm rounded-full font-FontNoto ${statusColor}`}>
                      {statusText}
                    </span>
                    <button
                      className={`btn btn-sm w-full mt-3 font-FontNoto rounded-md ${buttonClass}`}
                      disabled={!isAvailable}
                      onClick={() => {
                        if (isAvailable) {
                          setSelectedEquipment(eq);
                          document.getElementById('borrow_modal')?.showModal();
                        }
                      }}
                    >
                      {isAvailable ? "ยืมอุปกรณ์" : "ไม่สามารถยืมได้"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </>
      )}
      {selectedEquipment && (
        <dialog id="borrow_modal" className="modal">
          <div className="modal-box w-full max-w-2xl rounded-xl p-4 sm:p-6 shadow-lg font-FontNoto">
            <div className="flex justify-between items-start border-b-4 border-blue-600 pb-2 mb-4">
              <div>
                <h2 className="text-xl font-bold text-black">แบบฟอร์มขอยืมอุปกรณ์</h2>
                <p className="text-sm text-blue-800">บริษัท ดิเอคซ-เพอะทีส จำกัด</p>
              </div>
              <div className="text-sm text-gray-600 text-right">
                <p>วันที่เขียนแบบฟอร์ม</p>
                <p className="mt-1">{new Date().toLocaleDateString("th-TH")}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="w-full sm:w-1/2">
                  <label className="font-semibold">ชื่ออุปกรณ์</label>
                  <input
                    type="text"
                    value={selectedEquipment?.name}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black font-FontNoto"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold">รายละเอียดอุปกรณ์</label>
                <textarea
                  value={selectedEquipment?.description || "-"}
                  readOnly
                  className="textarea w-full border-gray-300 rounded-md bg-white text-black font-FontNoto"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold">ชื่อ-นามสกุล</label>
                  <input
                    type="text"
                    value={`${userProfile.firstName || ""} ${userProfile.lastName || ""}`}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black font-FontNoto"
                  />
                </div>
                <div>
                  <label className="font-semibold">ตำแหน่ง</label>
                  <input
                    type="text"
                    value={userProfile.role || ""}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black font-FontNoto"
                  />
                </div>
                <div>
                  <label className="font-semibold">อีเมล</label>
                  <input
                    type="email"
                    value={userProfile.email || ""}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black font-FontNoto"
                  />
                </div>
                <div>
                  <label className="font-semibold">โทรศัพท์ที่ติดต่อได้</label>
                  <input
                    type="text"
                    value={userProfile.contact || ""}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black font-FontNoto"
                  />
                </div>
                <div>
                  <label className="font-semibold">จำนวนที่กำลังยืม</label>
                  <input
                    type="number"
                    value={borrows.filter(b => b.status.trim() === "กำลังใช้งาน").length}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black font-FontNoto"
                  />
                </div>

                <div>
                  <label className="font-semibold">วันที่ยืม</label>
                  <input
                    type="date"
                    value={new Date().toISOString().split("T")[0]}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black font-FontNoto"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold">สถานที่ใช้งาน</label>
                  <input
                    type="text"
                    placeholder="กรอกสถานที่ใช้งาน"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black font-FontNoto"
                  />
                </div>
              </div>

              <div className="text-sm text-black mt-1">
                ผู้ยืมควรอ่านทำความเข้าใจ และโปรดตรวจสอบ ดังนี้ <br />
                1. ข้อมูลที่มีการบันทึกไว้ในอุปกรณ์ หากสูญหายหรือเสียหาย ศูนย์ข้อมูลและสารสนเทศจะไม่รับผิดชอบ <br /> 2. หากอุปกรณ์ที่ยืมเกิดการชำรุดเสียหายหรือสูญหาย ผู้ยืมต้องรับผิดชอบค่าเสียหาย
              </div>
            </div>

            <div className="modal-action mt-6 flex justify-end gap-3">
              <form method="dialog">
                <button className="bg-gray-300 hover:bg-gray-500 text-black font-FontNoto px-4 py-2 rounded shadow">ยกเลิก</button>
              </form>
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white font-FontNoto px-4 py-2 rounded shadow"
                onClick={async () => {
                  if (!requestReason.trim()) {
                    alert("กรุณากรอกเหตุผลในการยืม");
                    return;
                  }
                  try {
                    await axios.post("https://192.168.1.188/hrwebapi/api/Equipment/RequestBorrow", {
                      userId,
                      equipmentId: selectedEquipment.equipmentID,
                      reason: requestReason
                    });
                    alert("ส่งคำขอยืมเรียบร้อย รอการอนุมัติจากแอดมิน");
                    document.getElementById('borrow_modal').close();
                    fetchData();
                  } catch (error) {
                    console.error("ส่งคำขอล้มเหลว", error);
                    alert("ไม่สามารถส่งคำขอได้");
                  }
                }}
              >
                ส่งคำขอยืมอุปกรณ์
              </button>
            </div>
          </div>
        </dialog>
      )}

      {activeTab === "borrow" && (
        <>
          <h2 className="text-xl font-bold mb-4 font-FontNoto">รายการอุปกรณ์ที่กำลังยืม</h2>
          <div className="space-y-4">
            {borrows
              .filter(br => br.status.trim() === "กำลังใช้งาน")
              .map(br => {
                const dueDate = new Date(br.dueDate || br.returnDate || "").toLocaleDateString('th-TH');
                const borrowDate = new Date(br.borrowDate).toLocaleDateString('th-TH');
                const isOverdue = new Date() > new Date(br.dueDate);

                return (
                  <div
                    key={br.borrowID}
                    className="flex items-start justify-between border border-gray-200 rounded-lg p-4 shadow bg-white"
                  >
                    <div className="flex items-start gap-4">
                      <div>
                        <h3 className="text-lg font-bold font-FontNoto">{br.equipment?.name}</h3>
                        <p className="text-sm text-gray-500 font-FontNoto">รายละเอียด: {br.equipment?.description || "-"}</p>
                        <p className="text-sm text-gray-500 font-FontNoto">สถานที่ใช้งาน: {br.usageLocation || "-"}</p>
                        <p className="text-sm text-gray-500 font-FontNoto">วันที่ยืม: {borrowDate}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        className="btn btn-sm btn-success font-FontNoto"
                        onClick={() => {
                          setSelectedBorrowId(br.borrowID);
                          document.getElementById('confirm_return_modal')?.showModal();
                        }}
                      >
                        คืนอุปกรณ์
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}

      {activeTab === "history" && (
        <>
          <div className="bg-white rounded-xl shadow p-4 font-FontNoto">
            <h2 className="text-xl font-bold mb-4">ประวัติการยืม-คืนอุปกรณ์</h2>
            <div className="flex flex-row flex-wrap justify-end items-center gap-2 mb-4 font-FontNoto">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <label className="text-sm text-gray-600">ปี:</label>
                <select
                  className="select select-sm border-gray-300 w-auto"
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  {Array.from({ length: 11 }, (_, i) => 2024 + i).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 whitespace-nowrap">
                <label className="text-sm text-gray-600">สถานะ:</label>
                <select
                  className="select select-sm border-gray-300 w-auto"
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="ทั้งหมด">ทั้งหมด</option>
                  <option value="กำลังใช้งาน">กำลังใช้งาน</option>
                  <option value="คืนแล้ว">คืนแล้ว</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="table w-full text-sm whitespace-nowrap">
                <thead className="bg-gray-100 text-gray-700 font-FontNoto">
                  <tr>
                    <th className="px-4 py-2">ชื่ออุปกรณ์</th>
                    <th className="px-4 py-2">วันที่ยืม</th>
                    <th className="px-4 py-2">วันที่คืน</th>
                    <th className="px-4 py-2">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBorrows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center text-gray-500 py-4 font-FontNoto">
                        ไม่พบข้อมูลสำหรับปี {selectedYear}
                      </td>
                    </tr>
                  ) : (
                    paginatedBorrows.map((br) => (
                      <tr key={br.borrowID} className="hover:bg-gray-50">
                        <td className="px-4 py-2">{br.equipment.name}</td>
                        <td className="px-4 py-2">
                          {new Date(br.borrowDate).toLocaleDateString("th-TH")}
                        </td>
                        <td className="px-4 py-2">
                          {br.returnDate
                            ? new Date(br.returnDate).toLocaleDateString("th-TH")
                            : "-"}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${br.status.includes("คืน")
                              ? "bg-green-100 text-green-700"
                              : br.status.includes("เกิน")
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                              }`}
                          >
                            {br.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-center items-center gap-2 mt-6 font-FontNoto flex-wrap">
              <button
                className={`px-4 py-1 rounded-full border text-sm shadow-sm transition-all duration-150 ${currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-blue-600 border-blue-300 hover:bg-blue-50"
                  }`}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                ก่อนหน้า
              </button>

              {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`px-4 py-1 rounded-full border text-sm shadow-sm transition-all duration-150 ${currentPage === page
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-blue-600 border-blue-300 hover:bg-blue-50"
                    }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                className={`px-4 py-1 rounded-full border text-sm shadow-sm transition-all duration-150 ${currentPage === totalPages || totalPages === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-blue-600 border-blue-300 hover:bg-blue-50"
                  }`}
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                ถัดไป
              </button>
            </div>
          </div>
        </>
      )}

      <dialog id="confirm_return_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4 text-warning font-FontNoto">ยืนยันการคืนอุปกรณ์</h3>
          <p className="mb-4 font-FontNoto">คุณแน่ใจหรือไม่ว่าต้องการคืนอุปกรณ์นี้?</p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn font-FontNoto">ยกเลิก</button>
            </form>
            <button
              className="btn btn-primary font-FontNoto"
              onClick={async () => {
                await handleReturn(selectedBorrowId);
                document.getElementById('confirm_return_modal')?.close();
              }}
            >ยืนยัน</button>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default BorrowEquipmentsEmp;
