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


const roleMapping = {
  GM: "ผู้จัดการทั่วไป",
  Hr: "เลขานุการฝ่ายบริหาร",
  HEAD_BA: "หัวหน้าฝ่ายนักวิเคราะห์ธุรกิจ",
  SENIOR_DEV: "Senior Programmer",
  Dev: "Programmer",
  BA: "นักวิเคราะห์ธุรกิจ (BA)",
  TESTER: "Software Tester",
  JUNIOR_DEV: "Junior Programmer",
  ADMIN: "Admin",
};

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
  const [usageLocation, setUsageLocation] = useState("");
  const [borrowAmount, setBorrowAmount] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedDropdown, setSelectedDropdown] = useState("");
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [attachment, setAttachment] = useState(null);
  const [documentType, setDocumentType] = useState("อื่นๆ");
  const [withBag, setWithBag] = useState(false);

  const [requestReason, setRequestReason] = useState("");
  const [userProfile, setUserProfile] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
  const uploadAttachment = async () => {
    if (!attachment) return null;

    const formData = new FormData();
    formData.append("UserID", userId);
    formData.append("Category", documentType || "อื่นๆ");
    formData.append("Description", "เอกสารประกอบการยืมอุปกรณ์");
    formData.append("File", attachment);

    try {
      const res = await axios.post("https://192.168.1.188/hrwebapi/api/Files/Create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.status === 201) {
        return res.data.filePath;
      }
    } catch (err) {
      console.error("อัปโหลดไฟล์แนบไม่สำเร็จ", err);
      return null;
    }
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
    if (lowerName.includes("หูฟัง") || lowerName.includes("headphone")) {
      return (
        <div className="flex justify-center items-center">
          <Headphones size={100} className="text-fuchsia-500" />
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
  const [borrowDate, setBorrowDate] = useState(() => {
    const today = new Date();
    const iso = today.toISOString().split("T")[0];
    return iso;
  });

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
    setAllBorrows(brRes.data);
    setBorrows(brRes.data.filter(b => b.userID === userId));
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

  const toggleDescription = (equipmentId) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [equipmentId]: !prev[equipmentId],
    }));
  };
  const handleSubmitBorrow = async () => {
    if (!selectedEquipment) return;

    const filePath = await uploadAttachment(); // 👈 แนบไฟล์แนบ
    const payload = {
      equipmentId: selectedEquipment.equipmentID,
      userId,
      usageLocation,
      borrowDate,
      filePath, // 👈 เพิ่ม path
      documentType
    };

    try {
      const res = await axios.post("https://192.168.1.188/hrwebapi/api/Equipment/RequestBorrow", payload);
      alert("ส่งคำขอยืมอุปกรณ์เรียบร้อยแล้ว");
      fetchData(); // refresh ข้อมูล
      document.getElementById("borrow_modal")?.close();
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการยืม:", err);
      alert("ไม่สามารถส่งคำขอยืมได้");
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
              {equipments.reduce((sum, eq) => {
                const borrowed = allBorrows.filter(
                  b => b.equipmentID === eq.equipmentID && b.status.trim() === "กำลังใช้งาน"
                ).length;

                const available = eq.totalCount - borrowed;
                return sum + Math.max(0, available);
              }, 0)}
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
          <div className="bg-white rounded-xl shadow p-4 font-FontNoto">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 font-FontNoto">
              <h2 className="text-xl font-bold mb-4 text-black">รายการอุปกรณ์ทั้งหมด</h2>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
                <input
                  type="text"
                  placeholder="ค้นหาอุปกรณ์..."
                  className="input input-bordered w-full sm:w-[180px] bg-white text-black"
                  value={searchKeyword}
                  onChange={(e) => {
                    setSearchKeyword(e.target.value);
                    setSelectedDropdown("");
                  }}
                />
                <select
                  className="select select-bordered w-full sm:w-[180px] bg-white text-black"
                  value={selectedDropdown}
                  onChange={(e) => {
                    setSelectedDropdown(e.target.value);
                    setSearchKeyword("");
                  }}
                >
                  <option value="">เลือกอุปกรณ์</option>
                  {equipments.map(eq => (
                    <option key={eq.equipmentID} value={eq.name}>{eq.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {equipments
                  .filter(eq => {
                    if (searchKeyword.trim() !== "") {
                      return eq.name.toLowerCase().includes(searchKeyword.toLowerCase());
                    }
                    if (selectedDropdown !== "") {
                      return eq.name === selectedDropdown;
                    }
                    return true;
                  })
                  .map(eq => {
                    const relevantBorrows = allBorrows.filter(
                      b =>
                        b.equipmentID === eq.equipmentID &&
                        b.status.trim() === "กำลังใช้งาน"
                    );
                    const activeCount = relevantBorrows.filter(b => b.status.trim() === "กำลังใช้งาน").length;
                    const pendingCount = relevantBorrows.filter(b => b.status.trim() === "รอดำเนินการ").length;
                    const totalInUseOrPending = activeCount + pendingCount;
                    const isAvailable = eq.totalCount > totalInUseOrPending;

                    let statusText = "";
                    if (activeCount >= eq.totalCount) {
                      statusText = "ถูกยืมไปแล้ว";
                    } else if (pendingCount > 0) {
                      statusText = "รอดำเนินการ";
                    } else {
                      statusText = "พร้อมใช้งาน";
                    }

                    const statusColor = isAvailable ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100";
                    const buttonClass = isAvailable
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-blue-100 text-blue-400 cursor-not-allowed";

                    return (
                      <div
                        key={eq.equipmentID}
                        className="bg-white p-4 rounded-xl shadow border flex flex-col justify-between h-full min-h-[320px]">
                        <div className="flex justify-center mb-3">
                          {getIconByName(eq.name || "")}
                        </div>
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-lg font-bold font-FontNoto">{eq.name}</h3>
                          <span className={`inline-block px-3 py-1 text-sm rounded-full font-FontNoto ${statusColor}`}>
                            {statusText}
                          </span>
                        </div>

                        <div className="text-sm text-gray-600 font-FontNoto mb-2 whitespace-pre-line relative min-h-[72px]">
                          <div
                            className={`transition-all duration-200 ${expandedDescriptions[eq.equipmentID] ? "" : "line-clamp-3"
                              }`}
                          >
                            {eq.description}
                          </div>

                          {eq.description.split("\n").length > 3 && (
                            <button
                              onClick={() => toggleDescription(eq.equipmentID)}
                              className="mt-1 text-blue-600 text-xs underline"
                            >
                              {expandedDescriptions[eq.equipmentID] ? "ย่อ" : "ดูเพิ่มเติม"}
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 font-FontNoto mt-2">
                          จำนวนที่กำลังยืม: <span className="font-semibold">{activeCount} รายการ</span>
                        </p>
                        <p className="text-sm text-gray-700 font-FontNoto">
                          จำนวนที่เหลือให้ยืม:{" "}
                          <span className="font-semibold text-green-700">
                            {eq.totalCount - totalInUseOrPending} รายการ
                          </span>
                        </p>

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
                          {isAvailable ? "ยืมอุปกรณ์" : statusText}
                        </button>
                      </div>
                    );
                  })}

              </div>
            </div>
          </div>
        </>
      )}
      {selectedEquipment && (() => {
        const activeCount = allBorrows.filter(b => b.equipmentID === selectedEquipment.equipmentID && b.status.trim() === "กำลังใช้งาน").length;
        const pendingCount = allBorrows.filter(b => b.equipmentID === selectedEquipment.equipmentID && b.status.trim() === "รอดำเนินการ").length;
        const usedCount = activeCount + pendingCount;
        return (
          <dialog id="borrow_modal" className="modal">
            <div className="modal-box w-full max-w-2xl rounded-xl p-4 sm:p-6 shadow-lg font-FontNoto bg-white text-black overflow-x-hidden">
              <div className="flex justify-between items-start border-b-4 border-blue-600 pb-2 mb-4 flex-wrap">
                <div>
                  <h2 className="text-xl font-bold text-black">แบบฟอร์มขอยืมอุปกรณ์</h2>
                  <p className="text-sm text-blue-800">THE EXPERTISE CO., LTD.</p>
                </div>
                <div className="text-sm text-gray-600 text-right">
                  <p>วันที่เขียนแบบฟอร์ม</p>
                  <p className="mt-1">{formatThaiDate(new Date())}</p>
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
                <div className="mt-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={withBag}
                      onChange={(e) => setWithBag(e.target.checked)}
                      className="checkbox checkbox-sm accent-blue-600"
                    />
                    <span className="text-sm text-gray-800 font-FontNoto">ขอยืมกระเป๋าด้วย</span>
                  </label>
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
                      value={roleMapping[userProfile.role || ""] || ""}
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
                    <label className="font-semibold">จำนวนที่ต้องการยืม</label>
                    <input
                      type="number"
                      min={1}
                      max={selectedEquipment.totalCount - usedCount}
                      value={borrowAmount}
                      onChange={(e) => setBorrowAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black font-FontNoto"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">วันที่ยืม</label>
                    <div className="relative w-full">
                      <input
                        type="text"
                        value={borrowDate ? formatThaiDate(borrowDate) : ""}
                        readOnly
                        onClick={() => document.getElementById("borrowDatePicker").showPicker()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black font-FontNoto"
                        style={{ cursor: "pointer" }}
                      />
                      <input
                        type="date"
                        id="borrowDatePicker"
                        value={borrowDate}
                        onChange={(e) => setBorrowDate(e.target.value)}
                        className="absolute opacity-0 pointer-events-none"
                        style={{ colorScheme: "light" }}
                      />
                      <div
                        className="absolute right-3 top-3 text-gray-500 cursor-pointer"
                        onClick={() => document.getElementById("borrowDatePicker").showPicker()}
                      >
                        <i className="fas fa-calendar-alt"></i>
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-semibold">สถานที่ใช้งาน</label>
                    <input
                      type="text"
                      value={usageLocation}
                      onChange={(e) => setUsageLocation(e.target.value)}
                      placeholder="กรอกสถานที่ใช้งาน"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black font-FontNoto"
                    />
                  </div>
                </div>
                <div className="mb-1">
                  <label className="font-FontNoto sm:w-48 whitespace-nowrap pt-1 text-gray-800 font-semibold">
                    แนบรูปอุปกรณ์ที่ขอยืม
                  </label>
                </div>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 w-full">
                  <div className="flex flex-wrap gap-3">
                    {["Notebook", "อื่นๆ"].map((docType) => (
                      <label
                        key={docType}
                        className="flex items-center gap-2 font-FontNoto text-sm text-gray-700"
                      >
                        <input
                          type="radio"
                          name="documentType"
                          value={docType}
                          checked={documentType === docType}
                          onChange={(e) => setDocumentType(e.target.value)}
                          className="radio radio-sm accent-sky-500"
                        />
                        {docType}
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      onChange={(e) => setAttachment(e.target.files[0])}
                      className="font-FontNoto w-full max-w-xs
        file:px-2 file:py-0.5 file:rounded 
        file:border file:border-gray-300 
        file:text-gray-600 file:text-xs
        file:bg-gray-100 hover:file:bg-gray-200 transition px-2 py-1 border border-gray-300 rounded-md bg-white text-black"
                    />
                    {attachment && (
                      <p className="text-sm text-green-600 font-FontNoto whitespace-nowrap">
                        {attachment.name}
                      </p>
                    )}
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
                  onClick={handleSubmitBorrow}
                >
                  ส่งคำขอยืมอุปกรณ์
                </button>

              </div>
            </div>
          </dialog>
        );
      })()}

      <dialog id="success_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg text-green-600 font-FontNoto">ส่งคำขอยืมอุปกรณ์เรียบร้อยแล้ว</h3>
          <p className="py-2 font-FontNoto">รอการอนุมัติจากฝ่ายทรัพยากรบุคคล</p>
          <div className="modal-action">
            <form method="dialog">
              <button className="bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 
                     text-white font-FontNoto px-5 py-2 rounded-lg shadow-lg transition duration-300 ease-in-out">
                ปิด
              </button>
            </form>
          </div>
        </div>
      </dialog>

      {activeTab === "borrow" && (
        <>
          <div className="bg-white rounded-xl shadow p-4 font-FontNoto ">
            <h2 className="text-xl font-bold whitespace-nowrap text-black">รายการอุปกรณ์ที่กำลังยืม</h2>
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
                          <div className="text-sm text-gray-500 font-FontNoto whitespace-pre-line relative min-h-[72px]">
                            <div
                              className={`transition-all duration-200 ${expandedDescriptions[br.equipment?.equipmentID] ? "" : "line-clamp-3"
                                }`}
                            >
                              {br.equipment?.description || "-"}
                            </div>
                            {br.equipment?.description?.split("\n").length > 3 && (
                              <button
                                onClick={() =>
                                  setExpandedDescriptions((prev) => ({
                                    ...prev,
                                    [br.equipment?.equipmentID]: !prev[br.equipment?.equipmentID],
                                  }))
                                }
                                className="mt-1 text-blue-600 text-xs underline"
                              >
                                {expandedDescriptions[br.equipment?.equipmentID] ? "ย่อ" : "ดูเพิ่มเติม"}
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 font-FontNoto">สถานที่ใช้งาน: {br.usageLocation || "-"}</p>
                          <p className="text-sm text-gray-500 font-FontNoto">
                            วันที่ยืม: {br.borrowDate ? formatThaiDate(br.borrowDate) : "-"}
                          </p>

                          {br.filePath && (
                            <div className="flex items-center gap-2 mt-1">
                              <label className="text-sm font-bold text-gray-600 font-FontNoto">ไฟล์แนบ:</label>
                              <a
                                href={`https://192.168.1.188${br.filePath}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline text-sm font-FontNoto"
                              >
                                🔗 ดูรูปภาพ
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          className="bg-green-600 hover:bg-green-700 text-white text-sm font-FontNoto px-4 py-1.5 rounded-md shadow"
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
          </div>
        </>
      )}

      {activeTab === "history" && (
        <>
          <div className="bg-white rounded-xl shadow p-4 font-FontNoto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-FontNoto">
              <h2 className="text-xl font-bold whitespace-nowrap text-black">ประวัติการยืม-คืนอุปกรณ์</h2>
              <div className="flex flex-row flex-wrap justify-end items-center gap-2 mb-4 font-FontNoto">
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <label className="text-sm text-gray-600">ปี:</label>
                  <select
                    className="select select-sm border-gray-300 w-auto bg-white text-black"
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
                    className="select select-sm border-gray-300 w-auto bg-white text-black"
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
                    <th className="px-4 py-2">ชื่ออุปกรณ์</th>
                    <th className="px-4 py-2">รายละเอียดอุปกรณ์</th>
                    <th className="px-4 py-2">วันที่ยืม</th>
                    <th className="px-4 py-2">วันที่คืน</th>
                    <th className="px-4 py-2">สถานะ</th>
                    <th className="px-4 py-2">รูปอุปกรณ์ที่ยืม</th>
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
                        <td className="px-4 py-2 text-sm text-gray-700 whitespace-pre-line min-w-[200px]">
                          <div className={`transition-all duration-200 ${expandedDescriptions[br.borrowID] ? "" : "line-clamp-2"}`}>
                            {br.equipment.description || "-"}
                          </div>
                          {br.equipment.description?.split('\n').length > 3 && (
                            <button
                              onClick={() => toggleDescription(br.borrowID)}
                              className="text-blue-600 text-xs underline mt-1"
                            >
                              {expandedDescriptions[br.borrowID] ? "ย่อ" : "ดูเพิ่มเติม"}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {br.borrowDate ? formatThaiDate(br.borrowDate) : "-"}
                        </td>
                        <td className="px-4 py-2">
                          {br.returnDate ? formatThaiDate(br.returnDate) : "-"}
                        </td>

                        <td className="px-4 py-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${br.status.includes("คืน")
                            ? "bg-green-100 text-green-700"
                            : br.status.includes("เกิน")
                              ? "bg-red-100 text-red-700"
                              : br.status.includes("ไม่อนุมัติ")
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}>
                            {br.status}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {br.filePath ? (
                            <a
                              href={`https://192.168.1.188${br.filePath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline"
                            >
                              🔗 ดูรูปภาพ
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
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
        <div className="modal-box rounded-xl shadow-lg font-FontNoto">
          <h3 className="text-lg font-bold text-red-600 mb-2">ยืนยันการคืนอุปกรณ์</h3>
          <p className="text-sm text-gray-700 mb-4">คุณแน่ใจหรือไม่ว่าต้องการคืนอุปกรณ์นี้?</p>

          <div className="modal-action flex justify-end gap-3 mt-4">
            <form method="dialog">
              <button
                className="bg-gray-300 hover:bg-gray-500 text-black px-4 py-2 rounded shadow"
              >
                ยกเลิก
              </button>
            </form>
            <button
              onClick={async () => {
                await handleReturn(selectedBorrowId);
                document.getElementById('confirm_return_modal')?.close();
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow"
            >
              ยืนยัน
            </button>
          </div>
        </div>
      </dialog>

    </div>
  );
};

export default BorrowEquipmentsEmp;
