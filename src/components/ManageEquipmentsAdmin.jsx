import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ManageEquipmentsAdmin = () => {
  const [equipments, setEquipments] = useState([]);
  const [borrows, setBorrows] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState("");
  const [newEq, setNewEq] = useState({ name: '', description: '', totalCount: 0 });
  const [addAmount, setAddAmount] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [activeTab, setActiveTab] = useState("assign");
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedStatus, setSelectedStatus] = useState("ทั้งหมด");
  const [currentPage, setCurrentPage] = useState(1);


  const borrowerName = users.find(u => u.userID === parseInt(selectedUserId));
  const filteredBorrows = borrows.filter(br => {
    const yearMatch = new Date(br.borrowDate).getFullYear() === parseInt(selectedYear);
    const statusMatch = selectedStatus === "ทั้งหมด" || br.status.trim() === selectedStatus;
    return yearMatch && statusMatch;
  });

  const totalPages = Math.ceil(filteredBorrows.length / 5); // หรือจำนวนรายการต่อหน้าอื่นๆ
  const paginatedBorrows = filteredBorrows.slice((currentPage - 1) * 5, currentPage * 5);

  const openModal = (equipment) => {
    setSelectedEquipment(equipment);
    setAddAmount("");
    document.getElementById("update_modal").showModal();
  };

  const openDeleteModal = (equipmentId) => {
    setDeleteTargetId(equipmentId);
    document.getElementById("delete_confirm_modal").checked = true;
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`https://192.168.1.188/hrwebapi/api/Equipment/Delete/${deleteTargetId}`);
      fetchData();
      document.getElementById("delete_confirm_modal").checked = false;
      setDeleteTargetId(null);
    } catch (error) {
      console.error("Delete failed:", error);
      setErrorMessage("ไม่สามารถลบอุปกรณ์ได้");
      document.getElementById("error_modal").showModal();
    }
  };

  const handleUpdateCount = async () => {
    const amount = Number(addAmount);
    if (isNaN(amount)) {
      setErrorMessage("กรุณาใส่จำนวนที่ถูกต้อง");
      document.getElementById("error_modal").showModal();
      return;
    }

    try {
      await axios.post("https://192.168.1.188/hrwebapi/api/Equipment/UpdateCount", {
        equipmentId: selectedEquipment.equipmentID,
        adjustAmount: amount,
      });

      fetchData();
      document.getElementById("update_modal").close();
    } catch (error) {
      console.error("Update failed:", error);
      setErrorMessage("ไม่สามารถอัปเดตจำนวนได้");
      document.getElementById("error_modal").showModal();
    }
  };

  const fetchData = async () => {
    try {
      const [eqRes, brRes, userRes] = await Promise.all([
        axios.get("https://192.168.1.188/hrwebapi/api/Equipment/AllEquipments"),
        axios.get("https://192.168.1.188/hrwebapi/api/Equipment/BorrowRecords"),
        axios.get("https://192.168.1.188/hrwebapi/api/Admin/users")
      ]);
      setEquipments(eqRes.data);
      setBorrows(brRes.data);
      setUsers(userRes.data);
    } catch (err) {
      console.error("โหลดข้อมูลล้มเหลว:", err);
    }
  };

  useEffect(() => { fetchData(); }, []);
  // ✅ ประกาศตัวแปรสรุป
  const totalBorrowed = borrows.length && borrows.filter(b => !b.returnDate).length;
  const totalReturned = borrows.length && borrows.filter(b => b.returnDate).length;
  const totalAvailable = equipments.length && borrows.length
    ? equipments.reduce((sum, eq) => {
      const borrowed = borrows.filter(b => b.equipmentID === eq.equipmentID && !b.returnDate).length;
      return sum + (eq.totalCount - borrowed);
    }, 0)
    : 0;

  const handleAdd = async () => {
    if (newEq.totalCount <= 0) {
      alert("กรุณากรอกจำนวนอุปกรณ์ที่ถูกต้อง");
      return;
    }
    await axios.post("https://192.168.1.188/hrwebapi/api/Equipment/Add", newEq);
    setNewEq({ name: '', description: '', totalCount: 0 });
    fetchData();
  };


  const handleBorrow = (equipment) => {
    if (!selectedUserId) {
      setStatusMessage("กรุณาเลือกพนักงานก่อน");
      document.getElementById("status_modal").showModal();
      return;
    }

    if (!equipment) {
      setStatusMessage("กรุณาเลือกอุปกรณ์ก่อน");
      document.getElementById("status_modal").showModal();
      return;
    }

    // กำหนดอุปกรณ์ที่เลือก แล้วเปิด modal ยืนยัน
    setSelectedEquipment(equipment);
    setIsModalOpen(true);
  };
  const handleConfirmBorrow = async () => {
    if (!selectedUserId || !selectedEquipment) {
      setStatusMessage("ข้อมูลไม่ครบถ้วน กรุณาลองใหม่");
      document.getElementById("status_modal").showModal();
      return;
    }

    try {
      await axios.post("https://192.168.1.188/hrwebapi/api/Equipment/Borrow", {
        equipmentId: parseInt(selectedEquipment.equipmentID),
        userId: parseInt(selectedUserId)
      });

      setStatusMessage("ยืมอุปกรณ์เรียบร้อยแล้ว!");
      document.getElementById("status_modal").showModal();
      fetchData();
      setIsModalOpen(false);
      setSelectedEquipment(null);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการยืมอุปกรณ์:", error);
      setStatusMessage("ไม่สามารถยืมอุปกรณ์ได้ โปรดลองอีกครั้ง");
      document.getElementById("status_modal").showModal();
    }
  };


  const calculateAvailableEquipments = (equipmentId) => {
    const borrowedCount = borrows.filter(br => br.equipmentID === equipmentId && !br.returnDate).length;
    const equipment = equipments.find(eq => eq.equipmentID === equipmentId);

    if (!equipment) {
      console.log(`ไม่พบข้อมูลอุปกรณ์สำหรับ ID: ${equipmentId}`);
      return { borrowedCount: 0, remaining: 0 };
    }

    const remaining = equipment.totalCount - borrowedCount;
    return { borrowedCount, remaining };
  };

  return (
    <div className="flex flex-col w-full">
      <div className="w-full bg-gradient-to-r from-cyan-100 via-blue-100 to-blue-50 text-white rounded-xl p-4 sm:p-5 md:p-6 mb-6 shadow-lg">
        <h1 className="text-xl sm:text-2xl text-cyan-950 font-bold font-FontNoto leading-snug">
          ยืม-คืน อุปกรณ์สำนักงาน
        </h1>
        <p className="text-xs sm:text-sm mt-1 text-cyan-950 font-FontNoto">ตรวจสอบข้อมูลการยืมอุปกรณ์สำนักงานของพนักงาน</p>
      </div>
      <div className="overflow-x-auto sm:overflow-visible px-2 mb-6">
        <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-4 gap-4 font-FontNoto min-w-[640px] sm:min-w-0">
          <div className="flex-shrink-0 w-[250px] sm:w-auto bg-white shadow rounded-xl p-4 text-left">
            <p className="text-sm text-gray-500 mb-1">อุปกรณ์ทั้งหมด</p>
            <p className="text-2xl font-extrabold text-blue-800">{equipments.length}<span className="text-base font-normal ml-1"> รายการ</span></p>
          </div>
          <div className="flex-shrink-0 w-[250px] sm:w-auto bg-white shadow rounded-xl p-4 text-left">
            <p className="text-sm text-gray-500 mb-1">อุปกรณ์ที่พร้อมใช้งาน</p>
            <p className="text-2xl font-extrabold text-green-700">{totalAvailable}<span className="text-base font-normal ml-1"> รายการ</span></p>
          </div>
          <div className="flex-shrink-0 w-[250px] sm:w-auto bg-white shadow rounded-xl p-4 text-left">
            <p className="text-sm text-gray-500 mb-1">อุปกรณ์ที่ถูกยืม</p>
            <p className="text-2xl font-extrabold text-orange-600">{totalBorrowed}<span className="text-base font-normal ml-1"> รายการ</span></p>
          </div>
          <div className="flex-shrink-0 w-[250px] sm:w-auto bg-white shadow rounded-xl p-4 text-left">
            <p className="text-sm text-gray-500 mb-1">อุปกรณ์ที่คืนแล้ว</p>
            <p className="text-2xl font-extrabold text-purple-700">{totalReturned}<span className="text-base font-normal ml-1"> รายการ</span></p>
          </div>
        </div>
      </div>
      <div className="flex gap-4 border-b border-gray-300 mb-4 mt-3">
        <button onClick={() => setActiveTab("assign")} className={`py-2 px-4 font-bold font-FontNoto ${activeTab === "assign" ? "border-b-4 border-blue-500 text-blue-600" : "text-gray-500"}`}>เบิกอุปกรณ์</button>
        <button onClick={() => setActiveTab("manage")} className={`py-2 px-4 font-bold font-FontNoto ${activeTab === "manage" ? "border-b-4 border-blue-500 text-blue-600" : "text-gray-500"}`}>จัดการอุปกรณ์</button>
        <button onClick={() => setActiveTab("history")} className={`py-2 px-4 font-bold font-FontNoto ${activeTab === "history" ? "border-b-4 border-blue-500 text-blue-600" : "text-gray-500"}`}>ประวัติการยืม-คืน</button>
      </div>

      {activeTab === "assign" && (
        <>
          <h3 className="text-xl font-bold mt-6 mb-2 font-FontNoto">เบิกอุปกรณ์ให้พนักงาน</h3>
          <div className="flex flex-col md:flex-row flex-wrap gap-2 items-start md:items-center mb-4">
            <select
              className="select select-bordered font-FontNoto w-full md:w-auto"
              onChange={e => setSelectedUserId(e.target.value)}
              value={selectedUserId}
            >
              <option className="font-FontNoto" value="">-- เลือกพนักงาน --</option>
              {users.map(u => (
                <option className="font-FontNoto" key={u.userID} value={u.userID}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </select>

            <select
              className="select select-bordered font-FontNoto w-full md:w-auto"
              onChange={e => setSelectedEquipmentId(e.target.value)}
              value={selectedEquipmentId}
              disabled={!selectedUserId}
            >
              <option className="font-FontNoto" value="">-- เลือกอุปกรณ์ที่ต้องการยืม --</option>
              {equipments.filter(eq => eq.isAvailable).map(eq => {
                const { remaining } = calculateAvailableEquipments(eq.equipmentID);
                return (
                  <option className="font-FontNoto" key={eq.equipmentID} value={eq.equipmentID}>
                    {eq.name} (เหลือ {remaining})
                  </option>
                );
              })}
            </select>

            <button
              className="btn btn-primary font-FontNoto w-full md:w-auto"
              onClick={() => {
                const eq = equipments.find(e => e.equipmentID === parseInt(selectedEquipmentId));
                handleBorrow(eq);
              }}

              disabled={!selectedUserId || !selectedEquipmentId}
            >
              ยืมอุปกรณ์
            </button>
          </div>
        </>
      )}
      {activeTab === "manage" && (
        <>
          <h2 className="text-2xl font-bold mb-4 font-FontNoto">จัดการอุปกรณ์</h2>
          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <input
              type="text"
              className="input input-bordered font-FontNoto w-full md:w-auto"
              placeholder="ชื่ออุปกรณ์"
              value={newEq.name}
              onChange={e => setNewEq({ ...newEq, name: e.target.value })}
            />
            <input
              type="text"
              className="input input-bordered font-FontNoto w-full md:w-auto"
              placeholder="รายละเอียด"
              value={newEq.description}
              onChange={e => setNewEq({ ...newEq, description: e.target.value })}
            />
            <input
              type="number"
              className="input input-bordered font-FontNoto w-full md:w-auto"
              placeholder="จำนวนอุปกรณ์"
              value={newEq.totalCount}
              onChange={e => setNewEq({ ...newEq, totalCount: parseInt(e.target.value) })}
            />
            <button className="btn btn-success font-FontNoto w-full md:w-auto" onClick={handleAdd}>เพิ่ม</button>
          </div>

          <div className="overflow-x-auto mb-6 font-FontNoto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th className="font-FontNoto">ชื่อ</th>
                  <th className="font-FontNoto">รายละเอียด</th>
                  <th className="font-FontNoto">จำนวนที่เหลือ</th>
                  <th className="font-FontNoto">จำนวนที่ยืม</th>
                  <th className="font-FontNoto">การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {equipments.map(eq => {
                  const { borrowedCount, remaining } = calculateAvailableEquipments(eq.equipmentID);
                  return (
                    <tr key={eq.equipmentID}>
                      <td className="font-FontNoto">{eq.name}</td>
                      <td className="font-FontNoto">{eq.description}</td>
                      <td className="font-FontNoto">{remaining}</td>
                      <td className="font-FontNoto">{borrowedCount}</td>
                      <td className="space-x-2 font-FontNoto">
                        <button
                          className="btn btn-sm btn-info"
                          onClick={() => openModal(eq)}
                        >
                          แก้ไข
                        </button>
                        <button
                          className="btn btn-sm btn-error font-FontNoto"
                          onClick={() => openDeleteModal(eq.equipmentID)}
                        >
                          ลบ
                        </button>

                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <input type="checkbox" id="delete_confirm_modal" className="modal-toggle" />
          <div className="modal">
            <div className="modal-box">
              <h3 className="font-bold text-lg font-FontNoto">ยืนยันการลบ</h3>
              <p className="py-4 font-FontNoto">คุณแน่ใจหรือไม่ว่าต้องการลบอุปกรณ์นี้?</p>
              <div className="modal-action ">
                <label htmlFor="delete_confirm_modal" className="btn font-FontNoto">ยกเลิก</label>
                <button className="btn btn-error font-FontNoto" onClick={handleDeleteConfirm}>ลบ</button>
              </div>
            </div>
          </div>
          <dialog id="update_modal" className="modal">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-2 font-FontNoto">แก้ไขจำนวนอุปกรณ์</h3>
              <p className="font-FontNoto">อุปกรณ์: <span className="font-semibold font-FontNoto">{selectedEquipment?.name}</span></p>
              <input
                type="number"
                placeholder="จำนวนที่ต้องการเพิ่ม"
                className="input input-bordered w-full mt-4 font-FontNoto"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
              />
              <div className="modal-action font-FontNoto">
                <button className="btn btn-success" onClick={handleUpdateCount}>บันทึก</button>
                <form method="dialog">
                  <button className="btn font-FontNoto">ยกเลิก</button>
                </form>
              </div>
            </div>
          </dialog>

          <dialog id="error_modal" className="modal">
            <div className="modal-box">
              <h3 className="font-bold text-lg text-red-600 font-FontNoto">เกิดข้อผิดพลาด</h3>
              <p className="py-2 font-FontNoto">{errorMessage}</p>
              <div className="modal-action">
                <form method="dialog">
                  <button className="btn btn-error text-white font-FontNoto">ปิด</button>
                </form>
              </div>
            </div>
          </dialog>
          <dialog id="status_modal" className="modal">
            <div className="modal-box">
              <h3 className="font-bold text-lg text-green-600 font-FontNoto">แจ้งเตือน</h3>
              <p className="py-2 font-FontNoto">{statusMessage}</p>
              <div className="modal-action">
                <form method="dialog">
                  <button className="btn btn-primary font-FontNoto">ปิด</button>
                </form>
              </div>
            </div>
          </dialog>

          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
                <h2 className="text-xl font-bold mb-4 font-FontNoto">ยืนยันการยืมอุปกรณ์</h2>
                <p className="font-FontNoto mb-2">
                  คุณต้องการยืมอุปกรณ์: <span className="font- font-FontNoto">{selectedEquipment?.name}</span> หรือไม่?
                </p>
                <p className="font-FontNoto mb-4">
                  ผู้ยืม: <span className="font-semibold font-FontNoto">
                    {borrowerName ? `${borrowerName.firstName} ${borrowerName.lastName}` : "ไม่พบข้อมูลผู้ใช้"}
                  </span>
                </p>

                <div className="flex justify-end space-x-2">
                  <button className="btn btn-primary font-FontNoto" onClick={handleConfirmBorrow}>ยืนยัน</button>
                  <button className="btn font-FontNoto" onClick={() => setIsModalOpen(false)}>ยกเลิก</button>
                </div>
              </div>
            </div>
          )
          }
        </>
      )}
      {activeTab === "history" && (
        <>
          <div className="bg-white rounded-xl shadow p-4 font-FontNoto">
            <h2 className="text-xl font-bold mb-4">ประวัติการยืม-คืนอุปกรณ์</h2>

            {/* ตัวกรอง */}
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

            {/* ตารางข้อมูล */}
            <div className="overflow-x-auto">
              <table className="table w-full text-sm whitespace-nowrap">
                <thead className="bg-gray-100 text-gray-700 font-FontNoto">
                  <tr>
                    <th className="px-4 py-2">ชื่อ-นามสกุล</th>
                    <th className="px-4 py-2">ชื่ออุปกรณ์</th>
                    <th className="px-4 py-2">วันที่ยืม</th>
                    <th className="px-4 py-2">วันที่คืน</th>
                    <th className="px-4 py-2">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBorrows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-gray-500 py-4 font-FontNoto">
                        ไม่พบข้อมูลสำหรับปี {selectedYear}
                      </td>
                    </tr>
                  ) : (
                    paginatedBorrows.map((br) => (
                      <tr key={br.borrowID} className="hover:bg-gray-50">
                        <td className="px-4 py-2">{br.user?.firstName} {br.user?.lastName}</td>
                        <td className="px-4 py-2">{br.equipment?.name}</td>
                        <td className="px-4 py-2">
                          {new Date(br.borrowDate).toLocaleDateString('th-TH')}
                        </td>
                        <td className="px-4 py-2">
                          {br.returnDate
                            ? new Date(br.returnDate).toLocaleDateString('th-TH')
                            : '-'}
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

            {/* Pagination */}
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

    </div>
  );
};

export default ManageEquipmentsAdmin;
