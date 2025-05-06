import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BorrowEquipmentsEmp = () => {
  const [equipments, setEquipments] = useState([]);
  const [borrows, setBorrows] = useState([]);
  const userId = parseInt(sessionStorage.getItem("userId"));
  const [selectedBorrowId, setSelectedBorrowId] = useState(null);


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
    <div className="">
      <div className="w-full bg-gradient-to-r from-cyan-900 via-cyan-600 to-slate-500 text-white rounded-xl p-4 sm:p-5 md:p-6 mb-6 shadow-lg">
        <h1 className="text-xl sm:text-2xl font-bold font-FontNoto leading-snug">
          ยืม-คืน อุปกรณ์สำนักงาน
        </h1>
        <p className="text-xs sm:text-sm mt-1 font-FontNoto">ตรวจสอบข้อมูลการยืมอุปกรณ์สำนักงาน</p>
      </div>
      <h2 className="text-2xl font-bold mb-4 font-FontNoto">รายการอุปกรณ์ทั้งหมด</h2>
      <div className="overflow-x-auto">
        <table className="table w-full min-w-max mb-6">
          <thead>
            <tr>
              <th className="font-FontNoto">ชื่อ</th>
              <th className="font-FontNoto">รายละเอียด</th>
              <th className="font-FontNoto">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {equipments.map(eq => (
              <tr key={eq.equipmentID}>
                <td className="font-FontNoto">{eq.name}</td>
                <td className="font-FontNoto">{eq.description}</td>
                <td className="font-FontNoto">{eq.isAvailable ? "ว่าง" : "ถูกยืม"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-bold mb-2 font-FontNoto">ประวัติการยืมของฉัน</h2>
      <div className="overflow-x-auto">
        <table className="table w-full min-w-max">
          <thead>
            <tr>
              <th className="font-FontNoto">ชื่อ</th>
              <th className="font-FontNoto">ยืมเมื่อ</th>
              <th className="font-FontNoto">คืนเมื่อ</th>
              <th className="font-FontNoto">สถานะ</th>
              <th className="font-FontNoto">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {borrows.map(br => (
              <tr key={br.borrowID}>
                <td className="font-FontNoto">{br.equipment.name}</td>
                <td className="font-FontNoto">
                  {new Date(br.borrowDate).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </td>
                <td className="font-FontNoto">
                  {br.returnDate
                    ? new Date(br.returnDate).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                    : "-"}
                </td>
                <td className="font-FontNoto">{br.status}</td>
                <td className="font-FontNoto">
                  {br.status.trim() === "กำลังใช้งาน" && (
                    <button
                      className="btn btn-sm btn-warning"
                      onClick={() => {
                        setSelectedBorrowId(br.borrowID);
                        document.getElementById('confirm_return_modal')?.showModal();
                      }}
                    >
                      คืน
                    </button>

                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </dialog>

      </div>
    </div>
  );
};

export default BorrowEquipmentsEmp;
