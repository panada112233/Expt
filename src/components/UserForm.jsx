import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { NavLink } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { GetUser } from '../function/apiservice';


const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState({
    firstname: '',
    lastname: '',
    designation: '',
    contact: '',
    email: '',
    JDate: "",
    gender: "",
    passwordHash: '', // Assuming 'passwordHash' is the field used in the backend
    confirmPassword: '',
    role: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profilePic, setProfilePic] = useState(""); // รูปโปรไฟล์
  const [adminName, setAdminName] = useState(""); // ชื่อจริงของแอดมิน
  const [selectedFile, setSelectedFile] = useState(null); // ไฟล์ที่เลือก
  const [uploadMessage, setUploadMessage] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [showPassword, setShowPassword] = useState({
    passwordHash: false,
    confirmPassword: false,
  });

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // เงื่อนไขสำหรับการอนุญาตเฉพาะภาษาไทยและช่องว่าง
    const noThaiPattern = /^[^\u0E00-\u0E7F]*$/; // ห้ามตัวอักษรภาษาไทย
    const emailPattern = /^[^\u0E00-\u0E7F\s]+$/; // อนุญาตเฉพาะภาษาอังกฤษและไม่มีช่องว่าง

    // ตรวจสอบอีเมล (ห้ามภาษาไทย)
    if (name === "email" && !emailPattern.test(value) && value !== "") {
      return;
    }

    // ตรวจสอบรหัสผ่าน (ห้ามภาษาไทย)
    if ((name === "passwordHash" || name === "confirmPassword") && !noThaiPattern.test(value) && value !== "") {
      return;
    }

    if (name === "contact") {
      const phonePattern = /^[0-9]{0,10}$/; // ยอมรับเฉพาะตัวเลขสูงสุด 10 หลัก
      if (!phonePattern.test(value)) {
        return; // ไม่บันทึกค่าที่ไม่ผ่านเงื่อนไข
      }
    }

    // หากผ่านทุกเงื่อนไข ให้บันทึกค่าลงใน state
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      axios
        .get(`https://localhost:7039/api/Admin/user/${id}`)
        .then((response) => {
          setUser(response.data);
          setLoading(false);
        })
        .catch(() => {
          setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
          setLoading(false);
        });
    }
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const noThaiRegex = /^[^\u0E00-\u0E7F]*$/; // สำหรับตรวจสอบห้ามภาษาไทย
    const emailRegex = /^[^\u0E00-\u0E7F]+$/; // ห้ามตัวอักษรภาษาไทย

    if (user.contact.length !== 10) {
      setError("กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก");
      setLoading(false);
      return;
    }

    // ตรวจสอบว่า Role ถูกเลือกหรือไม่
    if (!user.role) {
      setError("กรุณาเลือกแผนก");
      setLoading(false);
      return;
    }

    if (!emailRegex.test(user.email)) {
      setError("อีเมลต้องเป็นภาษาอังกฤษและอยู่ในรูปแบบที่ถูกต้อง");
      setLoading(false);
      return;
    }

    if (!noThaiRegex.test(user.passwordHash)) {
      setError("รหัสผ่านต้องไม่มีตัวอักษรภาษาไทย");
      setLoading(false);
      return;
    }

    if (user.passwordHash !== user.confirmPassword) {
      setError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      setLoading(false);
      return;
    }

    const apiCall = id
      ? axios.put(`https://localhost:7039/api/Admin/Users/${id}`, user)
      : axios.post("https://localhost:7039/api/Admin/Users", user);

    apiCall
      .then((response) => navigate(`/users/${response.data.userID}`))
      .catch(() => {
        setError("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        setLoading(false);
      });
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
            <li><Link to="/Admintime" className="hover:bg-green-100 font-FontNoto font-bold">รายการเข้า-ออกงาน</Link></li>
            <li><Link to="/Adminplan" className="hover:bg-green-100 font-FontNoto font-bold">การปฎิบัติงานพนักงาน</Link></li>
            <li><Link to="/LeaveGraph" className="hover:bg-green-100 font-FontNoto font-bold">สถิติการลาพนักงาน</Link></li>
            <li><NavLink to="/UserList" className={({ isActive }) => isActive ? "hover:bg-gray-300 hover:text-black font-FontNoto font-bold bg-gray-200" : "hover:bg-yellow-100 hover:text-black font-FontNoto font-bold"}>ข้อมูลพนักงาน</NavLink></li>
            <li><Link to="/AdminLogout" className="hover:bg-error hover:text-white font-FontNoto font-bold">ออกจากระบบ</Link></li>
          </ul>
        </div>
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        {/* Form Section */}
        <div className="flex-1 p-4 md:p-10 bg-white shadow-lg rounded-lg ml-1">
          <div className="w-full bg-gradient-to-r from-cyan-900 via-cyan-600 to-slate-500 text-white rounded-xl p-4 sm:p-5 md:p-6 mb-6 shadow-lg">
            <h1 className="text-xl sm:text-2xl font-bold font-FontNoto leading-snug">
              เพิ่มผู้ใช้งาน
            </h1>
            <p className="text-xs sm:text-sm mt-1 font-FontNoto">สมัครพนักงานเพิ่มผู้ใช้งานในระบบ</p>
          </div>
          <div className="flex overflow-x-auto gap-2 mb-4">
            <Link to="/UserList" className="btn btn-outline btn-success font-FontNoto mt-2" style={{ marginRight: '10px' }}>
              ข้อมูลพนักงาน
            </Link>
            <Link to="/AdminRegistration" className="btn btn-outline btn-secondary font-FontNoto mt-2" style={{ marginRight: '10px' }}>
              เพิ่มแอดมิน
            </Link>
            <Link to="/UserForm/create" className="btn btn-outline btn-primary font-FontNoto mt-2" style={{ marginRight: '10px' }}>
              เพิ่มผู้ใช้งาน
            </Link>
          </div>
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-10">
            <h2 className="text-2xl font-bold text-black font-FontNoto text-center">เพิ่มผู้ใช้งาน</h2>
            {loading && (
              <p style={{ textAlign: "center", color: "#6B7280" }}>กำลังโหลดข้อมูล...</p>)}
            {error && <p className="font-FontNoto text-red-500 text-center">{error}</p>}

            <form onSubmit={handleSubmit}>
              <div className="form-control mb-4">
                <div className="flex flex-row gap-4">
                  <div className="w-1/2">
                    <label className="label">
                      <span className="label-text font-FontNoto">ชื่อ</span>
                    </label>
                    <input
                      type="text"
                      name="firstname"
                      placeholder="ชื่อ"
                      value={user.firstname}
                      onChange={handleChange}
                      className="input input-bordered font-FontNoto w-full"
                      required
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="label">
                      <span className="label-text font-FontNoto">นามสกุล</span>
                    </label>
                    <input
                      type="text"
                      name="lastname"
                      placeholder="นามสกุล"
                      value={user.lastname}
                      onChange={handleChange}
                      className="input input-bordered font-FontNoto w-full"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-control mb-4">
                <div className="flex flex-row gap-4">
                  <div className="w-1/2">
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
                      <option className="font-FontNoto" value="" disabled>เลือกแผนก</option>
                      <option className="font-FontNoto" value="Hr">ทรัพยากรบุคคล</option>
                      <option className="font-FontNoto" value="GM">ผู้จัดการทั่วไป</option>
                      <option className="font-FontNoto" value="Dev">นักพัฒนาระบบ</option>
                      <option className="font-FontNoto" value="BA">นักวิเคราะห์ธุรกิจ</option>
                      <option className="font-FontNoto" value="Employee">พนักงาน</option>
                    </select>
                  </div>
                  <div className="w-1/2">
                    <label className="label">
                      <span className="label-text font-FontNoto">ตำแหน่ง</span>
                    </label>
                    <input
                      type="text"
                      name="designation"
                      placeholder="ตำแหน่ง"
                      value={user.designation}
                      onChange={handleChange}
                      className="input input-bordered font-FontNoto w-full"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="form-control mb-4">
                <div className="flex flex-row gap-4">
                  <div className="w-1/2">
                    <label className="label">
                      <span className="label-text font-FontNoto">อีเมล</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="อีเมล"
                      value={user.email}
                      onChange={handleChange}
                      className="input input-bordered font-FontNoto w-full"
                      required
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="label">
                      <span className="label-text font-FontNoto">โทรศัพท์</span>
                    </label>
                    <input
                      type="text"
                      name="contact"
                      placeholder="โทรศัพท์"
                      value={user.contact}
                      onChange={handleChange}
                      className="input input-bordered font-FontNoto w-full"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="form-control mb-4">
                <div className="flex flex-row gap-4">
                  <div className="w-1/2">
                    <label className="label">
                      <span className="label-text font-FontNoto">วันที่เริ่มงาน</span>
                    </label>
                    <input
                      type="date"
                      name="JDate"
                      placeholder="วันที่เริ่มงาน"
                      value={user.JDate}
                      onChange={handleChange}
                      className="input input-bordered font-FontNoto w-full text-black"
                      required
                      style={{
                        colorScheme: "light", // บังคับไอคอนให้ใช้โหมดสว่าง
                      }}
                    />
                  </div>
                  <div className="w-1/2">
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
              </div>
              <div className="form-control mb-4">
                <div className="flex flex-row gap-4">
                  {/* Password Field */}
                  <div className="w-1/2 relative">
                    <label className="label">
                      <span className="label-text font-FontNoto">รหัสผ่าน</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.passwordHash ? "text" : "password"}
                        name="passwordHash"
                        placeholder="รหัสผ่าน"
                        value={user.passwordHash}
                        onChange={handleChange}
                        className="input input-bordered font-FontNoto bg-gray-700 w-full py-3 px-4 rounded-md border border-gray-600"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-300 font-FontNoto"
                        onClick={() => togglePasswordVisibility("passwordHash")}
                      >
                        {showPassword.passwordHash ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div className="w-1/2 relative">
                    <label className="label">
                      <span className="label-text font-FontNoto">ยืนยันรหัสผ่าน</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.confirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="ยืนยันรหัสผ่าน"
                        value={user.confirmPassword}
                        onChange={handleChange}
                        className="input input-bordered font-FontNoto bg-gray-700 w-full py-3 px-4 rounded-md border border-gray-600"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-300 font-FontNoto"
                        onClick={() => togglePasswordVisibility("confirmPassword")}
                      >
                        {showPassword.confirmPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="form-control font-FontNoto">
                <button type="submit" className={`btn btn-warning ${loading && "loading"}`} disabled={loading}>
                  {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserForm;
