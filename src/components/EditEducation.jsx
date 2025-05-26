import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import 'daisyui/dist/full.css'; // Import daisyUI styles
import { GetUser } from '../function/apiservice';


const levelLabels = {
  Primary: "ประถมศึกษา",
  Secondary: "มัธยมศึกษา",
  Voc: "ประกาศนียบัตรวิชาชีพ (ปวช.)",
  Dip: "ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)",
  Bachelor: "ปริญญาตรี",
  Master: "ปริญญาโท",
  Doctorate: "ปริญญาเอก",
};

const EditEducation = () => {
  const [education, setEducation] = useState({
    level: "",
    institute: "",
    fieldOfStudy: "",
    year: "",
    gpa: "",
  });
  const [modalMessage, setModalMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(true);
  const [profilePic, setProfilePic] = useState(""); // รูปโปรไฟล์
  const [adminName, setAdminName] = useState(""); // ชื่อจริงของแอดมิน
  const [selectedFile, setSelectedFile] = useState(null); // ไฟล์ที่เลือก
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  // Fetch education data
  useEffect(() => {
    const fetchEducation = async () => {
      try {
        const response = await axios.get(`https://localhost:7039/api/Admin/educations/${id}`);
        setEducation(response.data);
      } catch (error) {
        setModalMessage("ไม่สามารถโหลดข้อมูลการศึกษาได้");
        setIsSuccess(false);
        document.getElementById("error_modal").showModal();

      }
    };
    fetchEducation();
  }, [id]);

  // Save data function
  const handleSave = async (e) => {
    e.preventDefault();

    const yearFormat = /^\d{4}-\d{4}$/;
    if (!yearFormat.test(education.year)) {
      setModalMessage("กรุณากรอกปีการศึกษาให้ถูกต้องในรูปแบบ 2567-2568");
      setIsSuccess(false);
      document.getElementById("error_modal").showModal();
      return;
    }
    try {
      await axios.put(`https://localhost:7039/api/Admin/educations/${id}`, education);
      setModalMessage("บันทึกข้อมูลสำเร็จ");
      setIsSuccess(true);
      document.getElementById("success_modal").showModal();
    } catch (error) {
      setModalMessage("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      setIsSuccess(false);
      document.getElementById("error_modal").showModal();
    }
  };
  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const response = await GetUser(); // ใช้ฟังก์ชันจาก apiservice
        setAdminName(response.name || "ไม่มีชื่อแอดมิน");
        setProfilePic(
          response.profilePictureUrl
            ? `https://localhost:7039/api${response.profilePictureUrl}`
            : "https://localhost:7039/api/uploads/admin/default-profile.jpg"
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
          ? `https://localhost:7039/api${response.data.profilePictureUrl}`
          : "https://localhost:7039/api/uploads/users/default-profile.jpg";

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

  // Update form values
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "gpa") {
      if (value < 0 || value > 4.00) return;
      const gpaFormat = /^(\d{1,1}(\.\d{0,2})?)?$/;
      if (!gpaFormat.test(value)) return;
    }

    if (name === "year") {
      const yearPartialFormat = /^(\d{0,4})(-?)(\d{0,4})$/;
      if (!yearPartialFormat.test(value)) return;
    }

    setEducation((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // ฟังก์ชันสำหรับปิด error modal
  const handleCloseErrorModal = () => {
    document.getElementById("error_modal").close();
    navigate(-1); // กลับไปหน้าก่อนหน้า
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
                  onError={(e) => { e.target.src = "https://localhost:7039/api/uploads/admin/default-profile.jpg"; }} // ✅ ถ้าโหลดรูปไม่ได้ ให้ใช้รูป default
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
              แก้ไขข้อมูลการศึกษา
            </h1>
            <p className="text-xs sm:text-sm mt-1 font-FontNoto">แก้ไขข้อมูลการศึกษาให้พนักงาน</p>
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
                {/* Degree Level */}
                <div className="form-control">
                  <label className="label font-FontNoto text-black">ระดับการศึกษา</label>
                  <select
                    className="select select-bordered font-FontNoto"
                    name="level"
                    value={education.level}
                    onChange={handleChange}
                  >
                    <option value="">-- กรุณาเลือกระดับการศึกษา --</option>
                    {Object.entries(levelLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Institute */}
                <div className="form-control">
                  <label className="label font-FontNoto text-black">สถาบัน</label>
                  <input
                    type="text"
                    className="input input-bordered font-FontNoto"
                    name="institute"
                    value={education.institute}
                    onChange={handleChange}
                  />
                </div>

                {/* Field of Study */}
                <div className="form-control">
                  <label className="label font-FontNoto text-black">สาขาวิชา</label>
                  <input
                    type="text"
                    className="input input-bordered font-FontNoto"
                    name="fieldOfStudy"
                    value={education.fieldOfStudy}
                    onChange={handleChange}
                  />
                </div>

                {/* Year */}
                <div className="form-control">
                  <label className="label font-FontNoto text-black">ปีที่ศึกษา</label>
                  <input
                    type="text"
                    className="input input-bordered font-FontNoto"
                    name="year"
                    value={education.year}
                    onChange={handleChange}
                    placeholder="เช่น 2567-2568"
                  />
                </div>

                {/* GPA */}
                <div className="form-control">
                  <label className="label font-FontNoto text-black">GPA</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input input-bordered font-FontNoto"
                    name="gpa"
                    value={education.gpa}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="mt-6 text-center">
                <button type="submit" className="btn btn-warning w-full md:w-1/2 font-FontNoto">
                  บันทึก
                </button>
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
              onClick={handleCloseErrorModal}
            >
              ปิด
            </button>
          </div>
        </div>
      </dialog>

      {/* Error Modal */}
      <dialog id="error_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg text-error font-FontNoto">เกิดข้อผิดพลาด</h3>
          <p className="py-4 font-FontNoto">{modalMessage}</p>
          <div className="modal-action">
            <button
              className="btn btn-outline btn-error font-FontNoto"
              onClick={() => document.getElementById("error_modal").close()}
            >
              ปิด
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default EditEducation;
