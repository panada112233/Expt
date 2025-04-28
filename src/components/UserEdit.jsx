import React, { useState, useEffect } from "react";
import axios from "axios";
import { NavLink } from 'react-router-dom';
import { useParams, useNavigate, Link } from "react-router-dom"; // ใช้ Link สำหรับเมนู
import { GetUser } from '../function/apiservice';
import logo from "../assets/1.png";

const roleMapping = {
  Hr: "ทรัพยากรบุคคล",
  GM: "ผู้จัดการทั่วไป",
  Dev: "นักพัฒนาระบบ",
  BA: "นักวิเคราะห์ธุรกิจ",
  Employee: "พนักงาน",
};

const UserEdit = () => {
  const { UserID } = useParams(); // รับ UserID จาก URL
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    designation: "",
    contact: "",
    email: "",
    JDate: "",
    gender: "None",
    createdAt: "",
    isActive: "",
    passwordHash: "",
    role: "",
    updatedAt: "",
    userID: "",
  });
  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [profilePic, setProfilePic] = useState(""); // รูปโปรไฟล์
  const [adminName, setAdminName] = useState(""); // ชื่อจริงของแอดมิน
  const [selectedFile, setSelectedFile] = useState(null); // ไฟล์ที่เลือก
  const [uploadMessage, setUploadMessage] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const navigate = useNavigate();

  // โหลดข้อมูลจาก API
  useEffect(() => {
    if (UserID) {
      axios
        .get(`https://localhost:7039/api/Admin/users/${UserID}`)
        .then((response) => {
          const userRespose = response.data;
          console.log(userRespose)

          setUser({
            ...userRespose,
            JDate: userRespose.jDate
          });
        })
        .catch((error) => {
          console.error("Error loading user data:", error);
          setModalMessage("ไม่พบข้อมูลผู้ใช้งาน");
          setShowModal(true);
        });
    } else {
      setModalMessage("ไม่พบ UserID");
      setShowModal(true);
    }
  }, [UserID, navigate]);

  function handleChange(e) {
    const { name, value } = e.target;
    console.log(value)
    // เงื่อนไขสำหรับวันที่
    if (name === "JDate") {
      setUser((prevUser) => ({
        ...prevUser,
        JDate: value, // เก็บฟอร์แมต YYYY-MM-DD ตรงๆ
      }));
      return;
    }

    // เงื่อนไขสำหรับเบอร์โทรศัพท์
    if (name === "contact") {
      const numericPattern = /^\d*$/; // ยอมรับเฉพาะตัวเลข
      if (!numericPattern.test(value)) {
        return; // ถ้าไม่ใช่ตัวเลข ให้หยุดการเปลี่ยนแปลง
      }

      // อัปเดตค่าได้เฉพาะเมื่อจำนวนตัวเลขไม่เกิน 10 หลัก
      if (value.length <= 10) {
        setUser((prevUser) => ({ ...prevUser, [name]: value }));
      }
      return; // ไม่ต้องให้โค้ดส่วนอื่นทำงาน
    }

    // เงื่อนไขสำหรับอีเมล (ห้ามภาษาไทย)
    if (name === "email") {
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailPattern.test(value)) {
        return; // หยุดการเปลี่ยนแปลงหากไม่ใช่อีเมลที่ถูกต้อง
      }
    }

    // อัปเดตค่าใน state สำหรับฟิลด์อื่นๆ
    setUser((prevUser) => ({ ...prevUser, [name]: value }));
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    if (user.contact.length !== 10) {
      setModalMessage("กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก");
      setShowModal(true);
      return;
    }

    const userToSubmit = { ...user, JDate: formatDateForBackend(user.JDate) }; // แปลงฟอร์แมตวันที่
    console.log(userToSubmit)
    axios
      .put(`https://localhost:7039/api/Admin/Users/${UserID}`, userToSubmit)
      .then(() => {
        setModalMessage("แก้ไขข้อมูลสำเร็จ");
        setShowModal(true);
      })
      .catch((error) => {
        console.error("Error updating user:", error);
        setModalMessage("เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
        setShowModal(true);
      });
  };
  const formatDateForDisplay = (date) => {
    if (!date) return null;

    const nDate = new Date(date);
    if (isNaN(nDate)) return "";

    const day = String(nDate.getDate()).padStart(2, '0'); // วันที่
    const month = String(nDate.getMonth() + 1).padStart(2, '0'); // เดือน
    const year = nDate.getFullYear(); // ปี

    // return `${day}-${month}-${year}`; // คืนค่าในรูปแบบ DD-MM-YYYY
    return `${year}-${month}-${day}`; // คืนค่าในรูปแบบ DD-MM-YYYY
  };

  const formatDateForBackend = (date) => {
    if (!date) return ""; // ถ้าไม่มีค่าให้คืนค่าว่าง
    const [year, month, day] = date.split("-");
    return `${year}-${month}-${day}`; // ฟอร์แมต YYYY-MM-DD
  };

  const closeModal = () => {
    setShowModal(false);
    if (modalMessage === "แก้ไขข้อมูลสำเร็จ") {
      navigate("/UserList");
    }
  };
  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const response = await GetUser(); // ใช้ฟังก์ชันจาก apiservice
        setAdminName(response.name || "ไม่มีชื่อแอดมิน");
        setProfilePic(
          response.profilePictureUrl
            ? `https://localhost:7039${response.profilePictureUrl}`
            : "https://localhost:7039/uploads/admin/default-profile.jpg"
        );

      } catch (error) {
        console.error("Error fetching admin data:", error);
        setAdminName("ไม่สามารถดึงข้อมูลได้");
      }
    };

    fetchAdminInfo();
  }, []);


  const handleProfilePicChange = (event) => {
    const file = event.target.files[0]; // เลือกไฟล์แรกจากไฟล์ที่เลือก
    if (file) {
      setSelectedFile(file); // เก็บไฟล์ที่เลือกลงใน state
      // อัปเดตข้อความแสดงชื่อไฟล์
      document.getElementById("fileName").textContent = file.name;
    } else {
      // ถ้าไม่ได้เลือกไฟล์ ให้แสดงข้อความเริ่มต้น
      document.getElementById("fileName").textContent = "ไม่ได้เลือกไฟล์";
    }
  };

  const handleNameUpdate = async () => {
    if (!adminName) {
      console.error("Admin name is empty, cannot update.");
      setUploadMessage(<p className="text-red-500 font-FontNoto">กรุณากรอกชื่อแอดมิน</p>);
      return;
    }

    // ดึงข้อมูล User ID จาก localStorage
    const userInfo = JSON.parse(localStorage.getItem("userinfo"));
    if (!userInfo || !userInfo.userid) {
      console.error("User ID is missing in localStorage.");
      setUploadMessage(<p className="text-red-500 font-FontNoto">ไม่พบข้อมูลผู้ใช้</p>);
      return;
    }

    const formData = new FormData();
    formData.append("name", adminName);
    formData.append("id", userInfo.userid);

    try {
      const response = await axios.post(
        "https://localhost:7039/api/Admin/UpdateAdminInfo",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setIsEditingName(false);
      setUploadMessage(<p className="text-green-500 font-FontNoto">บันทึกชื่อสำเร็จ!</p>);
    } catch (error) {
      console.error("Error updating admin name:", error.response?.data || error);
      setUploadMessage(<p className="text-red-500 font-FontNoto">เกิดข้อผิดพลาดในการบันทึกชื่อ</p>);
    }
  };


  // อัปโหลดรูปโปรไฟล์ใหม่
  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadMessage(
        <p className="font-FontNoto text-red-500">กรุณาเลือกไฟล์ก่อนอัปโหลด</p>
      );
      return;
    }

    var userinfolocalStorage = localStorage.getItem('userinfo')
    const objUser = JSON.parse(userinfolocalStorage)
    console.log(objUser.userid)

    const formData = new FormData();
    formData.append("profilePictures", selectedFile); // ส่งเฉพาะรูปภาพ
    formData.append("id", objUser.userid);
    console.log(formData)
    try {
      const response = await axios.post("https://localhost:7039/api/Admin/UpdateAdminInfo", formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data && response.data.profilePictureUrl) {
        const profilePictureUrl = response.data.profilePictureUrl
          ? `https://localhost:7039${response.data.profilePictureUrl}`
          : "https://localhost:7039/uploads/users/default-profile.jpg";

        setProfilePic(profilePictureUrl);
        setUploadMessage(
          <p className="font-FontNoto text-green-500">อัปโหลดสำเร็จ!</p>
        );
      } else {
        setUploadMessage(
          <p className="font-FontNoto text-red-500">
            อัปโหลดสำเร็จ แต่ไม่ได้รับ URL ของรูปโปรไฟล์
          </p>
        );
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);

      const errorMessage =
        error.response?.data?.Message || "เกิดข้อผิดพลาดในการอัปโหลด";
      setUploadMessage(
        <p className="font-FontNoto text-red-500">{errorMessage}</p>
      );
    }
  };
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <div className="navbar bg-amber-400 shadow-lg flex flex-wrap justify-between items-center px-4 py-2">
        <div className="flex items-center mb-2 md:mb-0">
          <div className="flex items-center bg-white rounded-lg px-2 py-1 max-w-full border-2 border-white">
            <img src={logo} className="h-8 w-auto mr-2" alt="Logo" />
            <span className="font-bold text-black">THE</span>&nbsp;
            <span className="font-bold text-[#FF8800]">EXPERTISE</span>&nbsp;
            <span className="font-bold text-black">CO, LTD.</span>
          </div>
        </div>
        <div className="text-center text-xl font-bold text-black bg-amber-400 p-2 rounded-md font-FontNoto w-full md:w-auto">
          ระบบจัดเก็บเอกสารพนักงาน
        </div>
      </div>
      <div className="flex flex-col md:flex-row min-h-screen bg-base-200">
        {/* Sidebar */}
        <div className="w-full md:w-1/5 bg-white shadow-lg p-6 rounded-none md:rounded-lg">
          <div className="">
            <div className="font-FontNoto">
              {uploadMessage && <div>{uploadMessage}</div>}
            </div>

            <div className="flex flex-col items-center justify-center">
              {profilePic ? (
                <img
                  src={`${profilePic}?t=${new Date().getTime()}`} // ✅ ป้องกันการแคช
                  alt="Admin Profile"
                  className="rounded-full border-4 border-yellow-500 object-cover w-32 h-32"
                  onError={(e) => { e.target.src = "https://localhost:7039/uploads/admin/default-profile.jpg"; }} // ✅ ถ้าโหลดรูปไม่ได้ ให้ใช้รูป default
                />
              ) : (
                <p className="text-red-500 font-FontNoto"></p> // ✅ แสดงข้อความถ้าไม่มีรูป
              )}

              <p className="text-lg text-black font-FontNoto mt-4">
                {adminName || "กำลังโหลด..."}
              </p>
            </div>
            <div className="mt-4">
              {!isEditingName ? (
                <div className="flex justify-center items-center w-full flex-wrap gap-2">
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="ml-2 text-sm text-blue-500 hover:underline font-FontNoto"
                  >
                    คลิกเพื่อเปลี่ยนชื่อแอดมิน
                  </button>
                </div>
              ) : (
                <div className="flex justify-center items-center w-full flex-wrap gap-2">
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="border border-gray-300 rounded-md p-1 bg-white text-black font-FontNoto"
                  />
                  <button
                    onClick={handleNameUpdate}
                    className="ml-2 text-sm text-green-500 hover:underline font-FontNoto"
                  >
                    บันทึก
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="ml-2 text-sm text-red-500 hover:underline font-FontNoto"
                  >
                    ยกเลิก
                  </button>
                </div>
              )}
            </div>
            <div className="flex justify-center items-center space-x-2">
              <div className="flex items-center space-x-1 p-0.25 border border-gray-200 rounded-md w-48">
                <label
                  htmlFor="fileInput"
                  className="cursor-pointer text-xs py-1 px-2 bg-gray-200 text-black rounded-md font-FontNoto"
                >
                  เลือกไฟล์
                </label>
                <input
                  id="fileInput"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicChange}
                  className="hidden"
                />
                <span id="fileName" className="text-xs text-black font-FontNoto py-1 px-2 ">
                  ไม่ได้เลือกไฟล์
                </span>
              </div>

              <button
                onClick={handleUpload}
                className="cursor-pointer text-xs py-1 px-2 bg-gray-200 rounded-md font-FontNoto"
              >
                อัปโหลด
              </button>
            </div>
          </div>

          <ul className="menu bg-base-100 text-black rounded-box w-full text-lg">
            <li><Link to="/AdminDashboard" className="hover:bg-green-100 hover:text-black font-FontNoto font-bold">Dashboard</Link></li>
            <li><Link to="/LeaveGraph" className="hover:bg-green-100 font-FontNoto font-bold">สถิติการลาพนักงาน</Link></li>
            <li><NavLink to="/UserList" className={({ isActive }) => isActive ? "hover:bg-gray-300 hover:text-black font-FontNoto font-bold bg-gray-200" : "hover:bg-yellow-100 hover:text-black font-FontNoto font-bold"}>ข้อมูลพนักงาน</NavLink></li>
            <li><Link to="/AdminLogout" className="hover:bg-error hover:text-white font-FontNoto font-bold">ออกจากระบบ</Link></li>
          </ul>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row h-full min-h-screen w-full bg-base-200 overflow-x-hidden">
          <div className="flex-1 p-4 md:p-10 bg-white shadow-lg rounded-none md:rounded-lg">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-4 md:p-6">
              <div className="mt-4 md:mt-6 flex flex-col md:flex-row justify-between gap-4">
                <h2 className="text-2xl font-bold text-black font-FontNoto">แก้ไขข้อมูลพนักงาน</h2>
                <button
                  onClick={() => navigate("/UserList")}
                  className="btn btn-outline btn-error font-FontNoto"
                >
                  กลับไปยังรายการ
                </button>
              </div>
              <div className="flex flex-col gap-4">
                <div> </div>
                <div> </div>
              </div>
              <form onSubmit={handleSubmit} className="mt-6">
                <div className="flex flex-row gap-4 mb-4 w-full">
                  {/* ชื่อ (ด้านซ้าย) */}
                  <div className="w-1/2 form-control">
                    <label className="label">
                      <span className="label-text font-FontNoto">ชื่อ</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={user.firstName}
                      onChange={handleChange}
                      className="input input-bordered font-FontNoto w-full"
                      required
                    />
                  </div>

                  {/* นามสกุล (ด้านขวา) */}
                  <div className="w-1/2 form-control">
                    <label className="label">
                      <span className="label-text font-FontNoto">นามสกุล</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={user.lastName}
                      onChange={handleChange}
                      className="input input-bordered font-FontNoto w-full"
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-row gap-4 mb-4 w-full">
                  <div className="w-1/2 form-control">
                    <label className="label">
                      <span className="label-text font-FontNoto">อีเมล</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={user.email}
                      onChange={handleChange}
                      className="input input-bordered font-FontNoto w-full"
                      required
                    />
                  </div>
                  {/* เบอร์โทรศัพท์ */}
                  <div className="w-1/2 form-control">
                    <label className="label">
                      <span className="label-text font-FontNoto">เบอร์โทรศัพท์</span>
                    </label>
                    <input
                      type="text"
                      name="contact"
                      value={user.contact}
                      onChange={handleChange}
                      inputMode="numeric"
                      pattern="\d{10}"
                      className="input input-bordered font-FontNoto w-full"
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-row gap-4 mb-4 w-full">
                  {/* แผนก */}
                  <div className="w-1/2 form-control">
                    <label className="label">
                      <span className="label-text font-FontNoto">แผนก</span>
                    </label>
                    <select
                      name="role"
                      value={user.role}
                      onChange={handleChange}
                      className="select select-bordered font-FontNoto w-full"
                      required
                    >
                      <option value="">เลือกแผนก</option>
                      {Object.entries(roleMapping).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* ตำแหน่ง */}
                  <div className="w-1/2 form-control">
                    <label className="label">
                      <span className="label-text font-FontNoto">ตำแหน่ง</span>
                    </label>
                    <input
                      type="text"
                      name="designation"
                      value={user.designation}
                      onChange={handleChange}
                      className="input input-bordered font-FontNoto w-full"
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-row gap-4 mb-4 w-full">
                  <div className="w-1/2 form-control">
                    <label className="label">
                      <span className="label-text font-FontNoto">วันที่เริ่มงาน</span>
                    </label>

                    <input
                      type="date"
                      name="JDate"
                      placeholder="วันที่เริ่มงาน"
                      value={formatDateForDisplay(user.JDate)}

                      onChange={handleChange}
                      className="input input-bordered font-FontNoto w-full text-black"
                      required
                      style={{
                        colorScheme: "light", // บังคับไอคอนให้ใช้โหมดสว่าง
                      }}
                    />
                  </div>
                  {/* ตำแหน่ง */}
                  <div className="w-1/2 form-control">
                    <label className="label">
                      <span className="label-text font-FontNoto">เพศ</span>
                    </label>
                    <select
                      name="gender"
                      value={user.gender}
                      onChange={handleChange}
                      className="select select-bordered font-FontNoto w-full"
                      required
                    >
                      <option className="font-FontNoto" value="" disabled>เลือกเพศ</option>
                      <option className="font-FontNoto" value="Male">ชาย</option>
                      <option className="font-FontNoto" value="Female">หญิง</option>
                    </select>
                  </div>
                </div>
                {/* ปุ่มบันทึก */}
                <div className="form-control mt-6">
                  <button type="submit" className="btn btn-warning w-full font-FontNoto">
                    บันทึกการแก้ไข
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* Modal */}
      {showModal && (
        <dialog open className="modal" onClick={closeModal}>
          <div className="modal-box">
            <h3 className="font-bold text-lg font-FontNoto">{modalMessage}</h3>
            <div className="modal-action">
              <button className="btn btn-outline btn-error font-FontNoto" onClick={closeModal}>
                ปิด
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
};

export default UserEdit;