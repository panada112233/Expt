import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import 'daisyui/dist/full.css'; // Import daisyUI styles
import { GetUser } from '../function/apiservice';

const EditWorkExperience = () => {
  const [workExperience, setWorkExperience] = useState({
    companyName: "",
    jobTitle: "",
    salary: "",
    startDate: "",
    endDate: "",
  });
  const [modalMessage, setModalMessage] = useState("");
  const [profilePic, setProfilePic] = useState(""); // รูปโปรไฟล์
  const [adminName, setAdminName] = useState(""); // ชื่อจริงของแอดมิน
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null); // ไฟล์ที่เลือก
  const [uploadMessage, setUploadMessage] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const navigate = useNavigate();
  const { experienceID, userid } = useParams();  // ดึง userID และ experienceID จาก URL params

  // Fetch work experience data
  useEffect(() => {
    const fetchWorkExperience = async () => {
      try {
        console.log(experienceID)
        console.log(userid)
        const response = await axios.get(`http://192.168.1.188/hrwebapi/api/Admin/WorkExperiences/${experienceID}`);
        setWorkExperience(response.data);
      } catch (error) {
        setModalMessage("ไม่สามารถโหลดข้อมูลประสบการณ์ทำงานได้");
        document.getElementById("error_modal").showModal();
      }
    };

    fetchWorkExperience();

    fetchAdminInfo();
  }, [experienceID]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "salary") {
      // ป้องกันค่าติดลบ
      if (value < 0) return;
    }

    if (name === "startDate" || name === "endDate") {
      // อนุญาตเฉพาะตัวเลขเท่านั้น
      const numberOnly = /^[0-9]*$/; // รับเฉพาะตัวเลข
      if (!numberOnly.test(value)) return;
      if (value.length > 4) return; // จำกัดความยาวไม่เกิน 4 หลัก
    }

    setWorkExperience((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };
  const fetchAdminInfo = async () => {
    try {
      const response = await GetUser(); // ใช้ฟังก์ชันจาก apiservice
      setAdminName(response.name || "ไม่มีชื่อแอดมิน");
      setProfilePic(
        response.profilePictureUrl
          ? `http://192.168.1.188/hrwebapi${response.profilePictureUrl}`
          : "http://192.168.1.188/hrwebapi/uploads/admin/default-profile.jpg"
      );
    } catch (error) {
      console.error("Error fetching admin data:", error);
      setAdminName("ไม่สามารถดึงข้อมูลได้");
    }
  };

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
        "http://192.168.1.188/hrwebapi/api/Admin/UpdateAdminInfo",
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
      const response = await axios.post("http://192.168.1.188/hrwebapi/api/Admin/UpdateAdminInfo", formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data && response.data.profilePictureUrl) {
        const profilePictureUrl = response.data.profilePictureUrl
          ? `http://192.168.1.188/hrwebapi${response.data.profilePictureUrl}`
          : "http://192.168.1.188/hrwebapi/uploads/users/default-profile.jpg";

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

  // ตั้งค่า modalMessage และแสดง Success Modal หลังการบันทึกสำเร็จ
  const handleSave = async (e) => {
    e.preventDefault();

    try {
      // ตรวจสอบข้อมูลก่อนบันทึก
      if (!workExperience.companyName || !workExperience.jobTitle || !workExperience.salary || !workExperience.startDate || !workExperience.endDate) {
        setModalMessage("กรุณากรอกข้อมูลให้ครบถ้วน");
        document.getElementById("error_modal").showModal();
        return;
      }

      // ตรวจสอบความถูกต้องของ startDate และ endDate
      if (
        workExperience.startDate.length !== 4 ||
        workExperience.endDate.length !== 4
      ) {
        setModalMessage("กรุณากรอกปีเริ่มต้นและปีสิ้นสุดเป็นตัวเลข 4 หลัก");
        document.getElementById("error_modal").showModal();
        return;
      }

      // บันทึกข้อมูล
      await axios.put(
        `http://192.168.1.188/hrwebapi/api/Admin/WorkExperiences/${experienceID}`,
        workExperience
      );

      // ตั้งค่าข้อความสำเร็จ
      setModalMessage("บันทึกข้อมูลสำเร็จ");
      document.getElementById("success_modal").showModal();
    } catch (error) {
      console.error("Error saving data:", error);

      // แสดงข้อผิดพลาด
      setModalMessage("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      document.getElementById("error_modal").showModal();
    }
  };

  // ตรวจสอบการส่ง userID ที่ไม่ใช่ undefined
  const handleCloseSuccessModal = () => {

    if (userid !== null && userid !== "") {
      navigate(`/users/${userid}`);
    }
    // ไปยังหน้า WorkExperienceDetail พร้อม userID
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <div className="navbar bg-gradient-to-r from-cyan-950 via-blue-900 to-purple-950 shadow-lg flex flex-wrap justify-between items-center px-4 py-2">
        <div className="flex items-center">
          <div>
            <span className="font-bold text-white">THE</span>&nbsp;
            <span className="font-bold text-white">EXPERTISE</span>&nbsp;
            <span className="font-bold text-white">CO, LTD.</span>
          </div>
        </div>
        <div className="md:hidden flex justify-start px-4 py-2">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-white text-2xl font-FontNoto focus:outline-none"
          >
            ☰
          </button>
        </div>
      </div>
      <div className="flex flex-col md:flex-row min-h-screen bg-base-200">
        {/* Sidebar */}
        <div className={`fixed md:static top-0 left-0 bg-white w-[70%] md:w-1/5 h-full md:h-auto z-40 shadow-lg p-6 rounded-none md:rounded-lg transform transition-transform duration-300 ease-in-out 
  ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
          <div className="">
            <div className="font-FontNoto">
              {uploadMessage && <div>{uploadMessage}</div>}
            </div>

            <div className="flex flex-col items-center justify-center">
              {profilePic ? (
                <img
                  src={`${profilePic}?t=${new Date().getTime()}`} // ✅ ป้องกันการแคช
                  alt="Admin Profile"
                  className="rounded-full border-4 border-cyan-700 object-cover w-32 h-32"
                  onError={(e) => { e.target.src = "http://192.168.1.188/hrwebapi/uploads/admin/default-profile.jpg"; }} // ✅ ถ้าโหลดรูปไม่ได้ ให้ใช้รูป default
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
            <li><Link to="/Admintime" className="hover:bg-green-100 font-FontNoto font-bold">รายการเข้า-ออกงาน</Link></li>
            <li><Link to="/Adminplan" className="hover:bg-green-100 font-FontNoto font-bold">การปฎิบัติงานพนักงาน</Link></li>
            <li><Link to="/LeaveGraph" className="hover:bg-green-100 font-FontNoto font-bold">สถิติการลาพนักงาน</Link></li>
            <li><Link to="/UserList" className="hover:bg-green-100 hover:text-black font-FontNoto font-bold">ข้อมูลพนักงาน</Link></li>
            <li><Link to="/AdminLogout" className="hover:bg-error hover:text-white font-FontNoto font-bold">ออกจากระบบ</Link></li>
          </ul>
        </div>
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        {/* Main Content */}
        <div className="flex-1 p-4 md:p-10 bg-white shadow-lg rounded-none md:rounded-lg">
          <div className="w-full bg-gradient-to-r from-cyan-900 via-cyan-600 to-slate-500 text-white rounded-xl p-4 sm:p-5 md:p-6 mb-6 shadow-lg">
            <h1 className="text-xl sm:text-2xl font-bold font-FontNoto leading-snug">
            แก้ไขข้อมูลประสบการณ์ทำงาน
            </h1>
            <p className="text-xs sm:text-sm mt-1 font-FontNoto">แก้ไขข้อมูลประสบการณ์ทำงานให้พนักงาน</p>
          </div>
          <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-end space-x-4 mb-4">
              <button
                onClick={() => history.back()}
                className="btn btn-outline btn-error font-FontNoto"
              >
                กลับไปยังรายการ
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label font-FontNoto text-black">บริษัท</label>
                  <input
                    type="text"
                    className="input input-bordered font-FontNoto"
                    name="companyName"
                    value={workExperience.companyName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-control">
                  <label className="label font-FontNoto text-black">ตำแหน่ง</label>
                  <input
                    type="text"
                    className="input input-bordered font-FontNoto"
                    name="jobTitle"
                    value={workExperience.jobTitle}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-control">
                  <label className="label font-FontNoto text-black">เงินเดือน</label>
                  <input
                    type="number"
                    className="input input-bordered font-FontNoto"
                    name="salary"
                    value={workExperience.salary}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-control">
                  <label className="label font-FontNoto text-black">ปีเริ่มต้น</label>
                  <input
                    type="text"
                    className="input input-bordered font-FontNoto"
                    name="startDate"
                    value={workExperience.startDate}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-control">
                  <label className="label font-FontNoto text-black">ปีสิ้นสุด</label>
                  <input
                    type="text"
                    className="input input-bordered font-FontNoto"
                    name="endDate"
                    value={workExperience.endDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="mt-6 text-center">
                <button type="submit" className="btn btn-warning w-full md:w-1/2 font-FontNoto">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <dialog id="success_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg text-success font-FontNoto">สำเร็จ</h3>
          <p className="py-4 font-FontNoto">{modalMessage}</p>
          <div className="modal-action">
            <button
              className="btn btn-outline btn-error font-FontNoto"
              onClick={handleCloseSuccessModal} // ฟังก์ชันที่ตรวจสอบ userID และกลับไปหน้าก่อนหน้า
            >
              ปิด
            </button>
          </div>
        </div>
      </dialog>

      {/* Error Modal */}
      <dialog id="error_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg text-red-500 font-FontNoto">ข้อผิดพลาด</h3>
          <p className="py-4 font-FontNoto">{modalMessage}</p>
          <div className="modal-action">
            <button className="btn btn-outline btn-error font-FontNoto" onClick={() => document.getElementById("error_modal").close()}>ปิด</button>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default EditWorkExperience;
