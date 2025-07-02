import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Laptop,
  Monitor,
  Mouse,
  Projector,
  Tablet,
  Server,
  Keyboard,
  HardDrive,
  Camera,
  Smartphone,
  Package,
  Headphones

} from "lucide-react";

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
  const [activeTab, setActiveTab] = useState("manage");
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedStatus, setSelectedStatus] = useState("ทั้งหมด");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFull, setShowFull] = useState(false);
  const [confirmType, setConfirmType] = useState("");
  const [confirmBorrowId, setConfirmBorrowId] = useState(null);
  const [selectedBorrowDetail, setSelectedBorrowDetail] = useState(null);
  const [rejectionReason, setRejectionReason] = useState(""); // 👈 เพิ่มตรงนี้

  const [expandedDescriptions, setExpandedDescriptions] = useState({});

  const borrowerName = users.find(u => u.userID === parseInt(selectedUserId));
  const filteredBorrows = borrows.filter(br => {
    const yearMatch = new Date(br.borrowDate).getFullYear() === parseInt(selectedYear);
    const statusMatch = selectedStatus === "ทั้งหมด" || br.status.trim() === selectedStatus;
    return yearMatch && statusMatch;
  });

  const totalPages = Math.ceil(filteredBorrows.length / 10);
  const paginatedBorrows = filteredBorrows.slice((currentPage - 1) * 10, currentPage * 10);

  const openModal = (equipment) => {
    setSelectedEquipment(equipment);
    setAddAmount("");
    document.getElementById("update_modal").showModal();
  };

  const formatThaiDate = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const monthNames = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  };

  const openDeleteModal = (equipmentId) => {
    setDeleteTargetId(equipmentId);
    document.getElementById("delete_confirm_modal").checked = true;
  };

  const getIconByName = (name) => {
    const lowerName = name.toLowerCase();

    if (
      lowerName.includes("คอมพิวเตอร์") ||
      lowerName.includes("computer") ||
      lowerName.includes("pc") ||
      lowerName.includes("desktop")
    ) {
      return (
        <div className="flex justify-center items-center">
          <Monitor size={100} className="text-cyan-600" />
        </div>
      );
    }

    if (
      lowerName.includes("โน๊ตบุ๊ก") ||
      lowerName.includes("laptop") ||
      lowerName.includes("notebook")
    ) {
      return (
        <div className="flex justify-center items-center">
          <Laptop size={100} className="text-blue-500" />
        </div>
      );
    }

    if (
      lowerName.includes("จอ") ||
      lowerName.includes("monitor") ||
      lowerName.includes("display")
    ) {
      return (
        <div className="flex justify-center items-center">
          <Monitor size={100} className="text-green-500" />
        </div>
      );
    }

    if (lowerName.includes("เมาส์") || lowerName.includes("mouse")) {
      return (
        <div className="flex justify-center items-center">
          <Mouse size={100} className="text-red-500" />
        </div>
      );
    }

    if (lowerName.includes("โปรเจคเตอร์") || lowerName.includes("projector")) {
      return (
        <div className="flex justify-center items-center">
          <Projector size={100} className="text-purple-500" />
        </div>
      );
    }

    if (lowerName.includes("แท็บเล็ต") || lowerName.includes("tablet")) {
      return (
        <div className="flex justify-center items-center">
          <Tablet size={100} className="text-pink-500" />
        </div>
      );
    }

    if (lowerName.includes("เซิร์ฟเวอร์") || lowerName.includes("server")) {
      return (
        <div className="flex justify-center items-center">
          <Server size={100} className="text-yellow-500" />
        </div>
      );
    }

    if (lowerName.includes("คีย์บอร์ด") || lowerName.includes("keyboard")) {
      return (
        <div className="flex justify-center items-center">
          <Keyboard size={100} className="text-orange-500" />
        </div>
      );
    }
    if (lowerName.includes("หูฟัง") || lowerName.includes("headphone")) {
      return (
        <div className="flex justify-center items-center">
          <Headphones size={100} className="text-fuchsia-500" />
        </div>
      );
    }

    if (
      lowerName.includes("ฮาร์ดดิสก์") ||
      lowerName.includes("hard drive") ||
      lowerName.includes("ssd")
    ) {
      return (
        <div className="flex justify-center items-center">
          <HardDrive size={100} className="text-gray-500" />
        </div>
      );
    }

    if (lowerName.includes("กล้อง") || lowerName.includes("camera")) {
      return (
        <div className="flex justify-center items-center">
          <Camera size={100} className="text-indigo-500" />
        </div>
      );
    }
    if (lowerName.includes("ไอโฟน") || lowerName.includes("iphone") || lowerName.includes("โทรศัพท์")) {
      return (
        <div className="flex justify-center items-center">
          <Smartphone size={100} className="text-pink-600" />
        </div>
      );
    }
    return (
      <div className="flex justify-center items-center">
        <Package size={100} className="text-yellow-500" />
      </div>
    );
  };

  const handleReject = async (borrowId, reason) => {
    try {
      await axios.post(`https://192.168.1.188/hrwebapi/api/Equipment/RejectRequest/${borrowId}`, {
        reason,
      });

      setStatusMessage("ปฏิเสธคำขอยืมเรียบร้อยแล้ว");
      document.getElementById("status_modal").showModal();
      fetchData();
    } catch (error) {
      console.error("ไม่สามารถปฏิเสธคำขอได้:", error);
      setStatusMessage("เกิดข้อผิดพลาดขณะปฏิเสธคำขอ");
      document.getElementById("status_modal").showModal();
    }
  };

  const handleApprove = async (borrowId) => {
    try {
      await axios.post(`https://192.168.1.188/hrwebapi/api/Equipment/ApproveRequest/${borrowId}`);
      setStatusMessage("อนุมัติคำขอยืมเรียบร้อยแล้ว");
      document.getElementById("status_modal").showModal();
      fetchData();
    } catch (error) {
      console.error("ไม่สามารถอนุมัติคำขอได้:", error);
      setStatusMessage("เกิดข้อผิดพลาดขณะอนุมัติคำขอ");
      document.getElementById("status_modal").showModal();
    }
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
  const totalBorrowed = borrows.filter(
    b => b.status.trim() === "กำลังใช้งาน"
  ).length;

  const totalReturned = borrows.length && borrows.filter(b => b.returnDate).length;

  const totalAvailable = equipments.reduce((sum, eq) => {
    const borrowed = borrows.filter(
      b => b.equipmentID === eq.equipmentID && b.status.trim() === "กำลังใช้งาน"
    ).length;

    const available = eq.totalCount - borrowed;
    return sum + Math.max(0, available);
  }, 0);


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

    setSelectedEquipment(equipment);
    setIsModalOpen(true);
  };

  const toggleDescription = (equipmentId) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [equipmentId]: prev[equipmentId] ? null : true,
    }));
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
    // ✅ เอาเฉพาะสถานะ "กำลังใช้งาน" เท่านั้นที่นับว่ายืมอยู่จริง
    const borrowedCount = borrows.filter(br =>
      br.equipmentID === equipmentId &&
      br.status.trim() === "กำลังใช้งาน"
    ).length;

    const equipment = equipments.find(eq => eq.equipmentID === equipmentId);
    if (!equipment) return { borrowedCount: 0, remaining: 0 };

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
        <button onClick={() => setActiveTab("manage")} className={`py-2 px-4 font-bold font-FontNoto ${activeTab === "manage" ? "border-b-4 border-blue-500 text-blue-600" : "text-gray-500"}`}>จัดการอุปกรณ์</button>
        <button onClick={() => setActiveTab("assign")} className={`py-2 px-4 font-bold font-FontNoto ${activeTab === "assign" ? "border-b-4 border-blue-500 text-blue-600" : "text-gray-500"}`}>เบิกอุปกรณ์</button>
        <button onClick={() => setActiveTab("history")} className={`py-2 px-4 font-bold font-FontNoto ${activeTab === "history" ? "border-b-4 border-blue-500 text-blue-600" : "text-gray-500"}`}>ประวัติการยืม-คืน</button>
      </div>
      <dialog id="status_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg text-green-600 font-FontNoto">แจ้งเตือน</h3>
          <p className="py-2 font-FontNoto">{statusMessage}</p>
          <div className="modal-action">
            <form method="dialog">
              <button
                className="bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 
                     text-white font-FontNoto px-5 py-2 rounded-lg shadow-lg transition duration-300 ease-in-out"
              >
                ปิด
              </button>
            </form>
          </div>
        </div>
      </dialog>

      {activeTab === "manage" && (
        <>
          <div className="bg-white rounded-xl shadow p-4 font-FontNoto">
            <div className="mb-4 flex flex-row items-center justify-between gap-4 font-FontNoto">
              <h2 className="text-xl font-bold whitespace-nowrap text-black">จัดการอุปกรณ์</h2>
              <div className="flex justify-end">
                <button
                  onClick={() => document.getElementById("add_equipment_modal").showModal()}
                  className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white font-FontNoto"
                >
                  เพิ่มอุปกรณ์
                </button>
              </div>
            </div>

            <dialog id="add_equipment_modal" className="modal">
              <div className="modal-box font-FontNoto bg-white text-black">
                <h3 className="font-bold text-lg mb-3">เพิ่มอุปกรณ์ใหม่</h3>

                <div className="mb-3">
                  <label className="block mb-1 text-sm font-medium">ชื่ออุปกรณ์</label>
                  <input
                    type="text"
                    className="input input-bordered w-full bg-white text-black"
                    value={newEq.name}
                    onChange={(e) => setNewEq({ ...newEq, name: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="block mb-1 text-sm font-medium">รายละเอียด</label>
                  <textarea
                    rows={4}
                    className="textarea textarea-bordered w-full font-FontNoto bg-white text-black"
                    value={newEq.description}
                    placeholder="• กรอกรายละเอียด"
                    onChange={(e) => {
                      let val = e.target.value;
                      const lines = val.split("\n");

                      if (lines.length === 1 && !lines[0].startsWith("• ")) {
                        val = "• " + lines[0];
                      }

                      setNewEq({ ...newEq, description: val });
                    }}
                    onKeyDown={(e) => {
                      const textarea = e.target;
                      const { selectionStart } = textarea;
                      const valueBeforeCursor = textarea.value.slice(0, selectionStart);
                      const currentLine = valueBeforeCursor.split("\n").pop();

                      if (
                        e.key === "Backspace" &&
                        currentLine.trim() === "•"
                      ) {
                        return;
                      }
                      if (
                        e.key === "Backspace" &&
                        currentLine === "• "
                      ) {
                        e.preventDefault();
                        return;
                      }
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const { selectionStart, selectionEnd } = textarea;
                        const newValue =
                          newEq.description.slice(0, selectionStart) + "\n• " +
                          newEq.description.slice(selectionEnd);

                        setNewEq({ ...newEq, description: newValue });

                        setTimeout(() => {
                          textarea.selectionStart = textarea.selectionEnd = selectionStart + 3;
                        }, 0);
                      }
                    }}
                  />
                </div>

                <div className="mb-3">
                  <label className="block mb-1 text-sm font-medium">จำนวนอุปกรณ์</label>
                  <input
                    type="number"
                    className="input input-bordered w-full bg-white text-black"
                    value={newEq.totalCount}
                    onChange={(e) =>
                      setNewEq({ ...newEq, totalCount: parseInt(e.target.value) })
                    }
                  />
                </div>

                <div className="flex justify-end items-center gap-4 mt-4">
                  <button
                    className="bg-gray-300 hover:bg-gray-500 text-black font-FontNoto px-4 py-2 rounded shadow"
                    onClick={() => document.getElementById("add_equipment_modal").close()}
                  >
                    ยกเลิก
                  </button>

                  <button
                    onClick={async () => {
                      await handleAdd();
                      document.getElementById("add_equipment_modal").close();
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-FontNoto px-4 py-2 rounded shadow"
                  >
                    บันทึก
                  </button>
                </div>

              </div>
            </dialog>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 font-FontNoto">
              {equipments.map(eq => {
                const { borrowedCount, remaining } = calculateAvailableEquipments(eq.equipmentID);

                return (
                  <div key={eq.equipmentID} className="bg-white border rounded-xl shadow p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-center mb-3">
                        {getIconByName(eq.name)}
                      </div>

                      <h3 className="text-lg font-bold mb-1">{eq.name}</h3>
                      <div className="text-sm text-gray-600 whitespace-pre-line mb-2 min-h-[72px]">
                        {expandedDescriptions[eq.equipmentID] || eq.description.split('\n').length <= 3
                          ? eq.description
                          : eq.description.split('\n').slice(0, 3).join('\n') + "\n..."}

                        {eq.description.split('\n').length > 3 && (
                          <button
                            onClick={() => toggleDescription(eq.equipmentID)}
                            className="mt-1 text-blue-600 text-xs underline ml-1"
                          >
                            {expandedDescriptions[eq.equipmentID] ? "ย่อ" : "ดูเพิ่มเติม"}
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-orange-600">กำลังถูกยืม : {borrowedCount} รายการ</p>
                      <p className="text-sm text-green-600">เหลือใช้งานได้ : {remaining} รายการ</p>
                    </div>

                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-FontNoto px-4 py-1.5 rounded shadow text-sm"
                        onClick={() => openModal(eq)}
                      >
                        แก้ไข
                      </button>

                      <button
                        className="bg-red-500 hover:bg-red-600 text-white font-FontNoto px-4 py-1.5 rounded shadow text-sm"
                        onClick={() => openDeleteModal(eq.equipmentID)}
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <input type="checkbox" id="delete_confirm_modal" className="modal-toggle" />
          <div className="modal">
            <div className="modal-box rounded-xl shadow-lg font-FontNoto bg-white text-black">
              <h3 className="font-bold text-lg font-FontNoto text-red-600">ยืนยันการลบ</h3>
              <p className="py-4 font-FontNoto text-gray-700">
                คุณแน่ใจหรือไม่ว่าต้องการลบอุปกรณ์นี้?
              </p>
              <div className="modal-action flex justify-end gap-4 mt-4">
                <label
                  htmlFor="delete_confirm_modal"
                  className="bg-gray-300 hover:bg-gray-500 text-black font-FontNoto px-4 py-2 rounded shadow cursor-pointer"
                >
                  ยกเลิก
                </label>

                <button
                  className="bg-red-500 hover:bg-red-500 text-white font-FontNoto px-4 py-2 rounded shadow"
                  onClick={handleDeleteConfirm}
                >
                  ลบ
                </button>
              </div>
            </div>
          </div>

          <dialog id="update_modal" className="modal">
            <div className="modal-box font-FontNoto bg-white text-black">
              <h3 className="font-bold text-lg mb-4">แก้ไขอุปกรณ์</h3>

              <div className="mb-3">
                <label className="block mb-1 text-sm font-medium">ชื่ออุปกรณ์</label>
                <input
                  type="text"
                  className="input input-bordered w-full bg-white text-black"
                  value={selectedEquipment?.name || ""}
                  onChange={(e) =>
                    setSelectedEquipment({ ...selectedEquipment, name: e.target.value })
                  }
                />
              </div>

              <div className="mb-3">
                <label className="block mb-1 text-sm font-medium">รายละเอียด</label>
                <textarea
                  rows={4}
                  className="textarea textarea-bordered w-full font-FontNoto bg-white text-black"
                  value={selectedEquipment?.description || ""}
                  onChange={(e) => {
                    const lines = e.target.value.split("\n");
                    const formatted = lines.map(line => {
                      const trimmed = line.trim();
                      if (trimmed === "") return "";
                      if (trimmed.startsWith("•")) return line;
                      return `• ${trimmed}`;
                    });

                    setSelectedEquipment({ ...selectedEquipment, description: formatted.join("\n") });
                  }}

                  onKeyDown={(e) => {
                    const textarea = e.target;
                    const { selectionStart } = textarea;
                    const lines = textarea.value.split("\n");
                    const currentLineIndex = textarea.value.slice(0, selectionStart).split("\n").length - 1;
                    const currentLine = lines[currentLineIndex];

                    const isOnlyBullets = currentLine
                      .replace(/•/g, '')  // ลบ • ออก
                      .trim() === '';

                    if (e.key === "Backspace" && isOnlyBullets) {
                      e.preventDefault();

                      lines.splice(currentLineIndex, 1); // ลบบรรทัดนั้นออก

                      const newText = lines.join("\n");
                      setSelectedEquipment({ ...selectedEquipment, description: newText });

                      setTimeout(() => {
                        const beforeCursor = lines.slice(0, currentLineIndex).join("\n");
                        let pos = beforeCursor.length;
                        if (lines.length === 0 || pos > newText.length) {
                          pos = 0;
                        }
                        textarea.selectionStart = textarea.selectionEnd = pos;
                      }, 0);
                      return;
                    }
                    if (e.key === "Enter") {
                      if (lines.length >= 10) {
                        e.preventDefault();
                        return;
                      }

                      e.preventDefault();
                      const { selectionStart, selectionEnd } = textarea;
                      const newValue =
                        textarea.value.slice(0, selectionStart) + "\n• " +
                        textarea.value.slice(selectionEnd);

                      setSelectedEquipment({ ...selectedEquipment, description: newValue });

                      setTimeout(() => {
                        textarea.selectionStart = textarea.selectionEnd = selectionStart + 3;
                      }, 0);
                    }
                  }}

                />
              </div>
              <div className="mb-3">
                <label className="block mb-1 text-sm font-medium">จำนวนที่ต้องการเพิ่ม</label>
                <input
                  type="number"
                  placeholder="จำนวนที่ต้องการเพิ่ม"
                  className="input input-bordered w-full font-FontNoto bg-white text-black"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                />
              </div>

              <div className="flex justify-end items-center gap-4 mt-4 font-FontNoto">
                <button
                  className="bg-gray-300 hover:bg-gray-500 text-black px-4 py-2 rounded shadow"
                  onClick={() => document.getElementById("update_modal").close()}
                >
                  ยกเลิก
                </button>

                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow"
                  onClick={async () => {
                    await axios.post("https://192.168.1.188/hrwebapi/api/Equipment/UpdateInfo", {
                      equipmentID: selectedEquipment.equipmentID,
                      name: selectedEquipment.name,
                      description: selectedEquipment.description,
                      addAmount: Number(addAmount),
                    });
                    document.getElementById("update_modal").close();
                    fetchData();
                  }}
                >
                  บันทึก
                </button>
              </div>
            </div>
          </dialog>
          <dialog id="error_modal" className="modal">
            <div className="modal-box">
              <h3 className="font-bold text-lg text-red-600 font-FontNoto">เกิดข้อผิดพลาด</h3>
              <p className="py-2 font-FontNoto">{errorMessage}</p>
              <div className="modal-action">
                <form method="dialog">
                  <button
                    className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800
                     text-white font-FontNoto px-5 py-2 rounded-lg shadow-lg
                     transition duration-300 ease-in-out"
                  >
                    ปิด
                  </button>
                </form>
              </div>
            </div>
          </dialog>

        </>
      )}
      {activeTab === "assign" && (
        <>
          <div className="bg-white rounded-xl shadow p-4 font-FontNoto">
            <h3 className="text-xl font-bold mb-4 text-black">คำขอยืมอุปกรณ์จากพนักงาน</h3>
            <div className="overflow-x-auto">
              <table className="table w-full text-sm whitespace-nowrap">
                <thead className="bg-gray-100 text-gray-700 font-FontNoto">
                  <tr>
                    <th className="px-4 py-2">ชื่อพนักงาน</th>
                    <th className="px-4 py-2">ชื่ออุปกรณ์</th>
                    <th className="px-4 py-2">รายละเอียดอุปกรณ์</th>
                    <th className="px-4 py-2">สถานที่ใช้งาน</th>
                    <th className="px-4 py-2">วันที่ขอ</th>
                    <th className="px-4 py-2 text-center">รูปอุปกรณ์ที่ยืม</th>
                    <th className="px-4 py-2 text-center">การอนุมัติ</th>
                  </tr>
                </thead>
                <tbody>
                  {borrows.filter(b => b.approvalStatus === 0).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-gray-500 py-4 font-FontNoto">
                        ยังไม่มีคำขอยืมอุปกรณ์
                      </td>
                    </tr>
                  ) : (
                    borrows.filter(b => b.approvalStatus === 0).map((br) => (
                      <tr key={br.borrowID} className="hover:bg-gray-50">
                        <td className="px-4 py-2">{br.user?.firstName} {br.user?.lastName}</td>
                        <td className="px-4 py-2">{br.equipment?.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 whitespace-pre-line min-w-[200px]">
                          <div className={`transition-all duration-200 ${expandedDescriptions[br.borrowID] ? "" : "line-clamp-3"}`}>
                            {br.equipment?.description || "-"}
                          </div>
                          {br.equipment?.description?.split('\n').length > 3 && (
                            <button
                              onClick={() => toggleDescription(br.borrowID)}
                              className="text-blue-600 text-xs underline mt-1"
                            >
                              {expandedDescriptions[br.borrowID] ? "ย่อ" : "ดูเพิ่มเติม"}
                            </button>
                          )}
                        </td>

                        <td className="px-4 py-2">{br.usageLocation || '-'}</td>
                        <td className="px-4 py-2">
                          {br.borrowDate ? formatThaiDate(br.borrowDate) : "-"}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {br.filePath ? (
                            <a
                              href={`https://192.168.1.188${br.filePath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline text-sm"
                            >
                              ดูรูปภาพ
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>

                        <td className="px-4 py-2 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => {
                                setConfirmType("approve");
                                setConfirmBorrowId(br.borrowID);
                                document.getElementById("confirm_modal").showModal();
                              }}
                              className="btn btn-sm bg-green-500 hover:bg-green-600 text-white font-FontNoto"
                            >
                              อนุมัติ
                            </button>
                            <button
                              onClick={() => {
                                setConfirmType("reject");
                                setConfirmBorrowId(br.borrowID);
                                document.getElementById("confirm_modal").showModal();
                              }}
                              className="btn btn-sm bg-red-500 hover:bg-red-600 text-white font-FontNoto"
                            >
                              ไม่อนุมัติ
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      <dialog id="confirm_modal" className="modal">
        <div className="modal-box rounded-xl font-FontNoto">
          <h3 className="font-bold text-lg text-blue-700">ยืนยันการดำเนินการ</h3>

          <p className="py-4">
            คุณต้องการ<strong>{confirmType === "approve" ? "อนุมัติ" : "ไม่อนุมัติ"}</strong>คำขอยืมอุปกรณ์นี้หรือไม่?
          </p>

          {confirmType === "reject" && (
            <div className="mt-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">ระบุเหตุผล:</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="กรุณาระบุเหตุผลที่ไม่อนุมัติ..."
                className="textarea textarea-bordered w-full text-sm text-black"
              />
            </div>
          )}

          <div className="modal-action flex justify-end items-center gap-4 mt-6">
            <form method="dialog">
              <button
                className="bg-gray-300 hover:bg-gray-500 text-black px-4 py-2 rounded shadow"
              >
                ยกเลิก
              </button>
            </form>

            <button
              onClick={() => {
                if (confirmType === "approve") {
                  handleApprove(confirmBorrowId);
                  document.getElementById("confirm_modal")?.close();
                } else {
                  if (!rejectionReason.trim()) {
                    alert("กรุณาระบุเหตุผลที่ไม่อนุมัติ");
                    return;
                  }
                  handleReject(confirmBorrowId, rejectionReason); // 👈 ส่งเหตุผลไปด้วย
                  setRejectionReason(""); // เคลียร์หลังใช้งาน
                  document.getElementById("confirm_modal")?.close();
                }
              }}
              className={`${confirmType === "approve"
                ? "bg-green-500 hover:bg-green-600"
                : "bg-red-500 hover:bg-red-600"
                } text-white px-4 py-2 rounded shadow`}
            >
              ยืนยัน
            </button>
          </div>
        </div>
      </dialog>
      {selectedBorrowDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-2 py-4 overflow-y-auto font-FontNoto">
          <div className="relative bg-white rounded-2xl border border-gray-300 w-full max-w-3xl p-6 shadow-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b-4 border-blue-600 pb-3 mb-4">
              <div>
                <h1 className="text-xl font-bold text-black">แบบฟอร์มการยืมอุปกรณ์</h1>
                <p className="text-sm text-blue-800">THE EXPERTISE CO., LTD.</p>
              </div>
              <div className="text-sm text-gray-600 text-right">
                <p>วันที่ยืม</p>
                <p className="mt-1">
                  {selectedBorrowDetail?.borrowDate
                    ? formatThaiDate(selectedBorrowDetail.borrowDate)
                    : "-"}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-black">
              <div className="flex flex-wrap sm:flex-nowrap gap-4">
                <div className="w-full sm:w-1/2">
                  <p className="font-bold mb-1">ชื่ออุปกรณ์:</p>
                  <div className="bg-white border border-gray-200 rounded px-3 py-1.5">
                    {selectedBorrowDetail?.equipment?.name || "-"}
                  </div>
                </div>

                <div className="w-full sm:w-1/2">
                  <p className="font-bold mb-1">ผู้ยืม:</p>
                  <div className="bg-white border border-gray-200 rounded px-3 py-1.5">
                    {users.find(u => u.userID === selectedBorrowDetail.userID)?.firstName || "-"}{" "}
                    {users.find(u => u.userID === selectedBorrowDetail.userID)?.lastName || ""}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-4">
                <div className="w-full sm:w-1/2">
                  <p className="font-bold mb-1">สถานที่ใช้งาน:</p>
                  <div className="bg-white border border-gray-200 rounded px-3 py-1.5">
                    {selectedBorrowDetail.usageLocation || "-"}
                  </div>
                </div>

                <div className="w-full sm:w-1/2">
                  <p className="font-bold mb-1">สถานะ:</p>
                  <div className="bg-white border border-gray-200 rounded px-3 py-1.5">
                    {selectedBorrowDetail.status || "-"}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <p className="font-bold mb-1">รายละเอียดอุปกรณ์:</p>
                <div className="bg-white border border-gray-200 rounded px-3 py-1.5 text-sm whitespace-pre-line">
                  {selectedBorrowDetail?.equipment?.description || "-"}
                </div>
              </div>

              {selectedBorrowDetail.returnDate && (
                <div>
                  <p className="font-bold mb-1">วันที่คืน:</p>
                  <div className="bg-white border border-gray-200 rounded px-3 py-1.5">
                    {new Date(selectedBorrowDetail.returnDate).toLocaleDateString("th-TH")}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap sm:flex-nowrap gap-4 mt-4">
                <div className="w-full sm:w-1/2">
                  <p className="font-bold mb-1">รูปอุปกรณ์ที่ยืม:</p>
                  <div className="bg-white border border-gray-200 rounded px-3 py-1.5">
                    {selectedBorrowDetail?.filePath ? (
                      <a
                        href={`https://192.168.1.188${selectedBorrowDetail.filePath}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline"
                      >
                        ดูรูปภาพ/เอกสารแนบ
                      </a>
                    ) : (
                      <span className="text-gray-400">ไม่มีไฟล์แนบ</span>
                    )}
                  </div>
                </div>

                {selectedBorrowDetail.status === "ไม่อนุมัติ" && selectedBorrowDetail.rejectionReason ? (
                  <div className="w-full sm:w-1/2">
                    <p className="font-bold mb-1 text-red-600">เหตุผลที่ไม่อนุมัติ:</p>
                    <div className="bg-red-50 border border-red-300 text-red-800 rounded px-3 py-2 text-sm whitespace-pre-line">
                      {selectedBorrowDetail.rejectionReason}
                    </div>
                  </div>
                ) : (
                  <div className="w-full sm:w-1/2" />
                )}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded shadow"
                onClick={() => setSelectedBorrowDetail(null)} // หรือ setShowModal(false) ถ้าคุณใช้ state แบบนี้
              >
                ปิด
              </button>

            </div>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <>
          <div className="bg-white rounded-xl shadow p-4 font-FontNoto">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-FontNoto">
              <h2 className="text-xl font-bold whitespace-nowrap bg-white text-black">ประวัติการยืม-คืนอุปกรณ์</h2>

              <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <label className="text-sm text-gray-600">ปี:</label>
                  <select
                    className="select select-sm border-gray-300 w-[100px] bg-white text-black"
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    {Array.from({ length: 11 }, (_, i) => 2024 + i).map((year) => (
                      <option key={year} value={year}>
                        {year + 543}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <label className="text-sm text-gray-600">สถานะ:</label>
                  <select
                    className="select select-sm border-gray-300 w-[130px] bg-white text-black"
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="ทั้งหมด">ทั้งหมด</option>
                    <option value="กำลังใช้งาน">กำลังใช้งาน</option>
                    <option value="คืนแล้ว">คืนแล้ว</option>
                    <option value="ไม่อนุมัติ">ไม่อนุมัติ</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="table w-full text-sm whitespace-nowrap">
                <thead className="bg-gray-100 text-gray-700 font-FontNoto">
                  <tr>
                    <th className="px-4 py-2">ชื่อ-นามสกุล</th>
                    <th className="px-4 py-2">ชื่ออุปกรณ์</th>
                    <th className="px-4 py-2">วันที่ยืม</th>
                    <th className="px-4 py-2">วันที่คืน</th>
                    <th className="px-4 py-2">สถานะ</th>
                    <th className="px-4 py-2 text-center">ดูเพิ่มเติม</th>

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
                          {br.borrowDate ? formatThaiDate(br.borrowDate) : '-'}
                        </td>
                        <td className="px-4 py-2">
                          {br.returnDate ? formatThaiDate(br.returnDate) : '-'}
                        </td>

                        <td className="px-4 py-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${br.status.trim() === "คืนแล้ว"
                              ? "bg-green-100 text-green-700"
                              : br.status.trim() === "ไม่อนุมัติ"
                                ? "bg-red-100 text-red-700"
                                : br.status.trim() === "กำลังใช้งาน"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : br.status.trim() === "รอดำเนินการ"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-600"
                              }`}
                          >
                            {br.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => {
                              setSelectedBorrowDetail(br);
                              document.getElementById("borrow_detail_modal_admin")?.showModal();
                            }}
                            className="px-4 py-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-FontNoto"
                          >
                            รายละเอียด
                          </button>
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

    </div >
  );
};

export default ManageEquipmentsAdmin;
