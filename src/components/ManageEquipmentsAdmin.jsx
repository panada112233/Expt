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
  const borrowerName = users.find(u => u.userID === parseInt(selectedUserId));

  

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
      await axios.delete(`http://192.168.1.188/hrwebapi/api/Equipment/Delete/${deleteTargetId}`);
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
      await axios.post("http://192.168.1.188/hrwebapi/api/Equipment/UpdateCount", {
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
        axios.get("http://192.168.1.188/hrwebapi/api/Equipment/AllEquipments"),
        axios.get("http://192.168.1.188/hrwebapi/api/Equipment/BorrowRecords"),
        axios.get("http://192.168.1.188/hrwebapi/api/Admin/users")
      ]);
      setEquipments(eqRes.data);
      setBorrows(brRes.data);
      setUsers(userRes.data);
    } catch (err) {
      console.error("โหลดข้อมูลล้มเหลว:", err);
    }
  };

  useEffect(() => { fetchData(); }, []);
  const handleAdd = async () => {
    if (newEq.totalCount <= 0) {
      alert("กรุณากรอกจำนวนอุปกรณ์ที่ถูกต้อง");
      return;
    }
    await axios.post("http://192.168.1.188/hrwebapi/api/Equipment/Add", newEq);
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
      await axios.post("http://192.168.1.188/hrwebapi/api/Equipment/Borrow", {
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
    <div className="">
      <div className="w-full bg-gradient-to-r from-cyan-900 via-cyan-600 to-slate-500 text-white rounded-xl p-4 sm:p-5 md:p-6 mb-6 shadow-lg">
        <h1 className="text-xl sm:text-2xl font-bold font-FontNoto leading-snug">
          ยืม-คืน อุปกรณ์สำนักงาน
        </h1>
        <p className="text-xs sm:text-sm mt-1 font-FontNoto">ตรวจสอบข้อมูลการยืมอุปกรณ์สำนักงาน</p>
      </div>
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
      )}

      <h3 className="text-xl font-bold mb-2 font-FontNoto">ประวัติการยืม/คืน</h3>
      <div className="overflow-x-auto">
        <table className="table w-full min-w-max">
          <thead>
            <tr>
              <th className="font-FontNoto">พนักงาน</th>
              <th className="font-FontNoto">อุปกรณ์</th>
              <th className="font-FontNoto">ยืม</th>
              <th className="font-FontNoto">คืน</th>
              <th className="font-FontNoto">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {borrows.map(br => (
              <tr key={br.borrowID}>
                <td className="font-FontNoto">{br.user?.firstName} {br.user?.lastName}</td>
                <td className="font-FontNoto">{br.equipment?.name}</td>
                <td className="font-FontNoto">{new Date(br.borrowDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                <td className="font-FontNoto">{br.returnDate ? new Date(br.returnDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</td>
                <td className="font-FontNoto">{br.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default ManageEquipmentsAdmin;
