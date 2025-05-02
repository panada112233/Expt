import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ManageEquipmentsAdmin = () => {
  const [equipments, setEquipments] = useState([]);
  const [borrows, setBorrows] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newEq, setNewEq] = useState({ name: '', description: '' });

  const fetchData = async () => {
    try {
      const [eqRes, brRes, userRes] = await Promise.all([
        axios.get("https://localhost:7039/api/Equipment/AllEquipments"),
        axios.get("https://localhost:7039/api/Equipment/BorrowRecords"),
        axios.get("https://localhost:7039/api/Admin/users") // ✅ เหมือน CreateWorkExperience.jsx
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
    await axios.post("https://localhost:7039/api/Equipment/Add", newEq);
    setNewEq({ name: '', description: '' });
    fetchData();
  };

  const handleBorrow = async (equipmentId) => {
    if (!selectedUserId) return alert("กรุณาเลือกพนักงานก่อน");
    await axios.post("https://localhost:7039/api/Equipment/Borrow", {
      equipmentId: parseInt(equipmentId),
      userId: parseInt(selectedUserId)
    });
    fetchData();
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4 font-FontNoto">จัดการอุปกรณ์</h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          className="input input-bordered font-FontNoto"
          placeholder="ชื่ออุปกรณ์"
          value={newEq.name}
          onChange={e => setNewEq({ ...newEq, name: e.target.value })}
        />
        <input
          type="text"
          className="input input-bordered font-FontNoto"
          placeholder="รายละเอียด"
          value={newEq.description}
          onChange={e => setNewEq({ ...newEq, description: e.target.value })}
        />
        <button className="btn btn-success font-FontNoto" onClick={handleAdd}>เพิ่ม</button>
      </div>

      <table className="table w-full mb-6">
        <thead><tr><th>ชื่อ</th><th>รายละเอียด</th><th>สถานะ</th></tr></thead>
        <tbody>
          {equipments.map(eq => (
            <tr key={eq.equipmentID}>
              <td>{eq.name}</td>
              <td>{eq.description}</td>
              <td>{eq.isAvailable ? "ว่าง" : "กำลังใช้งาน"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="text-xl font-bold mt-6 mb-2 font-FontNoto">เบิกอุปกรณ์ให้พนักงาน</h3>
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <select
          className="select select-bordered font-FontNoto"
          onChange={e => setSelectedUserId(e.target.value)}
          value={selectedUserId}
        >
          <option value="">-- เลือกพนักงาน --</option>
          {users.map(u => (
            <option key={u.userID} value={u.userID}>
              {u.firstName} {u.lastName}
            </option>
          ))}
        </select>

        {equipments.filter(eq => eq.isAvailable).map(eq => (
          <button
            key={eq.equipmentID}
            className="btn btn-sm btn-outline btn-primary font-FontNoto"
            onClick={() => handleBorrow(eq.equipmentID)}
            disabled={!selectedUserId}
          >
            ยืม: {eq.name}
          </button>
        ))}
      </div>

      <h3 className="text-xl font-bold mb-2 font-FontNoto">ประวัติการยืม/คืน</h3>
      <table className="table w-full">
        <thead><tr><th>พนักงาน</th><th>อุปกรณ์</th><th>ยืม</th><th>คืน</th><th>สถานะ</th></tr></thead>
        <tbody>
          {borrows.map(br => (
            <tr key={br.borrowID}>
              <td>{br.user?.firstName} {br.user?.lastName}</td>
              <td>{br.equipment?.name}</td>
              <td>{new Date(br.borrowDate).toLocaleString()}</td>
              <td>{br.returnDate ? new Date(br.returnDate).toLocaleString() : '-'}</td>
              <td>{br.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageEquipmentsAdmin;
