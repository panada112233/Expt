import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BorrowEquipmentsEmp = () => {
  const [equipments, setEquipments] = useState([]);
  const [borrows, setBorrows] = useState([]);
  const userId = parseInt(sessionStorage.getItem("userId"));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [eqRes, brRes] = await Promise.all([
      axios.get("https://localhost:7039/api/Equipment/AllEquipments"),
      axios.get("https://localhost:7039/api/Equipment/BorrowRecords")
    ]);
    setEquipments(eqRes.data);
    setBorrows(brRes.data.filter(b => b.userID === userId));
  };

  const handleBorrow = async (equipmentId) => {
    await axios.post("https://localhost:7039/api/Equipment/Borrow", { equipmentId, userId });
    fetchData();
  };

  const handleReturn = async (borrowId) => {
    try {
      await axios.post("https://localhost:7039/api/Equipment/Return", {
        borrowId: borrowId,
      });
      fetchData(); // โหลดข้อมูลใหม่
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการคืนอุปกรณ์:", error);
      alert("ไม่สามารถคืนอุปกรณ์ได้");
    }
  };
  

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">รายการอุปกรณ์ทั้งหมด</h2>
      <table className="table w-full mb-6">
        <thead><tr><th>ชื่อ</th><th>รายละเอียด</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
        <tbody>
          {equipments.map(eq => (
            <tr key={eq.equipmentID}>
              <td>{eq.name}</td>
              <td>{eq.description}</td>
              <td>{eq.isAvailable ? "ว่าง" : "ถูกยืม"}</td>
              <td>
                {eq.isAvailable && <button className="btn btn-primary btn-sm" onClick={() => handleBorrow(eq.equipmentID)}>ยืม</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-xl font-bold mb-2">ประวัติการยืมของฉัน</h2>
      <table className="table w-full">
        <thead><tr><th>ชื่อ</th><th>ยืมเมื่อ</th><th>คืนเมื่อ</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
        <tbody>
          {borrows.map(br => (
            <tr key={br.borrowID}>
              <td>{br.equipment.name}</td>
              <td>{new Date(br.borrowDate).toLocaleString()}</td>
              <td>{br.returnDate ? new Date(br.returnDate).toLocaleString() : "-"}</td>
              <td>{br.status}</td>
              <td>
                {br.status === "ยืมอยู่" && (
                  <button className="btn btn-sm btn-warning" onClick={() => handleReturn(br.borrowID)}>คืน</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BorrowEquipmentsEmp;