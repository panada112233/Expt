import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { CalendarIcon, BriefcaseIcon, ClockIcon, AwardIcon, Printer } from "lucide-react";
import { FiEdit, FiTrash2, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { PencilSquareIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

import { pdfMake, font } from "../libs/pdfmake";
import { useLocation } from "react-router-dom";

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


// ฟังก์ชันแปลง Date object เป็น 'DD-MM-YYYY' พร้อมจัดการ Time Zone และปีพุทธศักราช
const formatDateForDisplay = (date) => {
  if (!date) return null;

  const nDate = new Date(date);
  if (isNaN(nDate)) return "";

  const day = String(nDate.getDate()).padStart(2, '0'); // วันที่
  const month = String(nDate.getMonth() + 1).padStart(2, '0'); // เดือน
  const year = nDate.getFullYear(); // ปี

  return `${year}-${month}-${day}`; // คืนค่าในรูปแบบ DD-MM-YYYY
};

function Profile() {
  const currentUserRole = sessionStorage.getItem("role");
  const [employee, setEmployee] = useState({
    userID: "",
    prefix: "",
    firstName: "",
    lastName: "",
    englishFirstName: "",
    englishLastName: "",
    nickname: "",
    gender: "None",
    maritalStatus: "",
    nationalID: "",
    contact: "",
    email: "",
    currentAddress: "",
    emergencyContact: "",
    designation: "",
    employeeCode: "",
    role: "Hr",
    passwordHash: "",
    isActive: "",
    createdAt: "",
    updatedAt: "",
    JDate: "",
    lineUserId: "",
    birthday: "",
  });
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword1, setNewPassword1] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword1, setShowNewPassword1] = useState(false);
  const [showNewPassword2, setShowNewPassword2] = useState(false);

  const [profilePicture, setProfilePicture] = useState(null);
  const [currentProfileImage, setCurrentProfileImage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [workingHours, setWorkingHours] = useState({ hours: 0, minutes: 0 });

  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState(""); // เก็บข้อความใน Modal
  const [activeTab, setActiveTab] = useState("profile");
  const location = useLocation();
  const passedUserID = location.state?.userID;
  const userID = passedUserID || sessionStorage.getItem("userId") || "";
  const fileInputRef = useRef(null);

  // ======================= ประสบการณ์ทำงาน ===========================
  const [experiences, setExperiences] = useState([]);
  const [newExperience, setNewExperience] = useState({
    userID: userID,
    experienceID: "",
    companyName: "",
    jobTitle: "",
    startDate: "",
    endDate: "",
    description: "",
  });
  const [errors, setErrors] = useState({ startDate: "", endDate: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [experienceToDelete, setExperienceToDelete] = useState(null);
  const [modalConfirmAction, setModalConfirmAction] = useState(null);
  // ======================= การศึกษา ===========================
  const [educations, setEducations] = useState([]);
  const [newEducation, setNewEducation] = useState({
    level: "",
    institute: "",
    fieldOfStudy: "",
    year: "",
    gpa: "",
    thesis: "",
    activities: "",
  });
  const [educationEditIndex, setEducationEditIndex] = useState(null);
  const [levelLabels] = useState({
    Primary: "ประถมศึกษา",
    Secondary: "มัธยมศึกษา",
    Voc: "ประกาศนียบัตรวิชาชีพ (ปวช.)",
    Dip: "ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)",
    Bachelor: "ปริญญาตรี",
    Master: "ปริญญาโท",
    Doctorate: "ปริญญาเอก",
  });

  const maritalStatusMap = {
    single: "โสด",
    married: "สมรส",
    divorced: "หย่าร้าง",
    widowed: "หม้าย",
    complicated: "ค่อนข้างอธิบายยาก",
  };

  const designationMap = {
    FULLTIME: "พนักงานประจำ",
    CONTRACT: "สัญญาจ้าง",
    INTERN: "นักศึกษาฝึกงาน",
    PROBATION: "ทดลองงาน",
    ADMIN: "Admin",
    RESIGNED: "ลาออก",
    EXPIRED: "หมดสัญญา",
  };
  // ฟังก์ชันคำนวณอายุการทำงานจากวันที่เริ่มงาน
  const calculateWorkDuration = (startDateStr) => {
    if (!startDateStr) return "-";

    const startDate = new Date(startDateStr);
    const today = new Date();

    let years = today.getFullYear() - startDate.getFullYear();
    let months = today.getMonth() - startDate.getMonth();
    let days = today.getDate() - startDate.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    return `${years} ปี ${months} เดือน ${days} วัน`;
  };

  // แปลงวันเป็น พ.ศ.
  const formatThaiDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear() + 543;
    return `${day}/${month}/${year}`;
  };
  const handleSubmitChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword1 !== newPassword2) {
      alert("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }

    try {
      const response = await axios.post(
        "https://192.168.1.188/hrwebapi/api/Users/ChangeMyPassword",
        {
          userID: userID,
          oldPassword,
          newPassword: newPassword1,
        },
        { headers: { "Content-Type": "application/json" } }
      );
      if (response.status === 200) {
        alert("เปลี่ยนรหัสผ่านสำเร็จ");
        setShowPasswordModal(false);
        setOldPassword("");
        setNewPassword1("");
        setNewPassword2("");
      }
    } catch (error) {
      alert(error.response?.data?.message || "รหัสผ่านเดิมไม่ถูกต้อง");
    }
  };

  const convertToBase64 = async (imageUrl) => {
    try {

      const response = await axios.get(imageUrl, { responseType: 'blob' });
      const imageBlob = response.data;
      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onloadend = () => {
          resolve(reader.result);
        };

        reader.onerror = reject;

        reader.readAsDataURL(imageBlob); // แปลง Blob เป็น Base64
      });
    } catch (error) {
      console.error("Error converting image to Base64: ", error);
      return null; // คืนค่า null ถ้าแปลงไม่สำเร็จ
    }
  };

  useEffect(() => {
    const fetchWorktimeAndCalculate = async () => {
      const targetUserID = passedUserID || sessionStorage.getItem("userId");
      if (!targetUserID) return;
      try {
        const res = await axios.get("https://192.168.1.188/hrwebapi/api/Worktime");
        const worktimes = res.data;

        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const filtered = worktimes.filter(item => {
          const date = new Date(item.date);
          return (
            item.userID === parseInt(targetUserID) &&
            date.getMonth() + 1 === currentMonth &&
            date.getFullYear() === currentYear
          );
        });

        let totalMinutes = 0;

        for (const item of filtered) {
          const locationText = item.location || '';
          const leaveType = locationText.includes('ครึ่งวันเช้า')
            ? 'morning'
            : locationText.includes('ครึ่งวันบ่าย')
              ? 'afternoon'
              : locationText.includes('ลาทั้งวัน') || locationText.includes('เต็มวัน')
                ? 'full'
                : '';

          if (!item.checkIn || !item.checkOut || leaveType === 'full') continue;

          const [inH, inM] = item.checkIn.split(':').map(Number);
          const [outH, outM] = item.checkOut.split(':').map(Number);

          const inDate = new Date(item.date);
          inDate.setHours(inH, inM, 0);

          const outDate = new Date(item.date);
          outDate.setHours(outH, outM, 0);

          let diff = (outDate - inDate) / (1000 * 60);
          if (leaveType !== 'morning' && leaveType !== 'afternoon') {
            diff -= 60; // หักพักเที่ยง 1 ชม.
          }

          if (diff > 0) totalMinutes += diff;
        }

        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);
        setWorkingHours({ hours, minutes });
      } catch (err) {
        console.error("ดึงเวลาทำงานล้มเหลว", err);
      }
    };

    fetchWorktimeAndCalculate();
  }, []);

  useEffect(() => {
    if (userID) {
      fetch(`https://192.168.1.188/hrwebapi/api/Users/Profile/${userID}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(formatDateForDisplay(data.jDate));

          setEmployee({
            ...data,
            JDate: data.jDate && !isNaN(new Date(data.jDate))
              ? formatDateForDisplay(data.jDate) // แปลงเป็น DD-MM-YYYY
              : null,
          });
        })
        .catch((err) => {
          console.error("Error updating profile: ", err);
          alert("มีข้อผิดพลาดเกิดขึ้น โปรดลองอีกครั้ง");
        });
      const fetchProfileImage = async () => {
        try {
          const imageUrl = `https://192.168.1.188/hrwebapi/api/Files/GetProfileImage?userID=${userID}`;
          const base64Image = await convertToBase64(imageUrl); // แปลง URL เป็น Base64

          if (base64Image) {
            setCurrentProfileImage(base64Image); // ตั้งค่า Base64 ที่แปลงแล้ว
          } else {
            setMessages([{ tags: "error", text: "ไม่สามารถแปลงรูปภาพได้", className: "font-FontNoto" }]);
          }
        } catch (error) {
          const errorMessage = error.response ? (error.response.data.Message || "ไม่สามารถโหลดรูปโปรไฟล์ได้") : "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์";
          setMessages([{ tags: "error", text: errorMessage }]);
        }
      };

      // เรียกใช้งานฟังก์ชัน
      fetchProfileImage();

    } else {
      setError("ไม่พบข้อมูลผู้ใช้ในระบบ");
    }
    setLoading(false);
  }, [userID]);
  const fetchEducations = async () => {
    if (!userID) return;
    try {
      const response = await axios.get(`https://192.168.1.188/hrwebapi/api/Educations/GetById/${userID}`);
      if (response.status === 200) {
        setEducations(response.data);
      }
    } catch (error) {
      console.error("โหลดข้อมูลการศึกษาล้มเหลว:", error);
    }
  };

  const fetchExperiences = async () => {
    if (!userID) return;
    try {
      const res = await axios.get(`https://192.168.1.188/hrwebapi/api/WorkExperiences/GetById/${userID}`);
      setExperiences(res.data);
    } catch (err) {
      console.error("โหลดประสบการณ์ล้มเหลว", err);
    }
  };
  useEffect(() => {
    if (userID) {
      fetchExperiences();
      fetchEducations();
    }
  }, [userID]);


  // อัปเดตข้อมูลใน state เมื่อผู้ใช้แก้ไขฟอร์ม
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployee({ ...employee, [name]: value });
  };

  const calculateAge = (birthday) => {
    if (!birthday) return "-";
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : "-";
  };

  // ส่งข้อมูลที่แก้ไขกลับไปอัปเดตในฐานข้อมูล
  const handleSubmit = (e) => {
    e.preventDefault();
    const userID = employee.userID;
    const contactRegex = /^\d{10}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !contactRegex.test(employee.contact) ||
      !emailRegex.test(employee.email)
    ) {
      setModalMessage("กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้องในทุกช่อง");
      setIsModalOpen(true);
      return;
    }

    if (!userID) {
      setModalMessage("ไม่พบ userID");
      setIsModalOpen(true);
      return;
    }

    fetch(`https://192.168.1.188/hrwebapi/api/Users/Update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(employee), // ข้อมูลทั้งหมดที่ต้องการอัปเดต
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message === "อัปเดตข้อมูลสำเร็จ") {
          setModalMessage("อัปเดตโปรไฟล์สำเร็จ");
          setIsEditMode(false);
        } else {
          setModalMessage("มีข้อผิดพลาดเกิดขึ้น โปรดลองอีกครั้ง");
        }
        setIsModalOpen(true); // เปิด Modal หลังจากตั้งข้อความ
      })
      .catch((err) => {
        console.error("Error updating profile: ", err);
        setModalMessage("มีข้อผิดพลาดเกิดขึ้น โปรดลองอีกครั้ง");
        setIsModalOpen(true); // เปิด Modal หลังจากเกิดข้อผิดพลาด
      });
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      const previewUrl = URL.createObjectURL(file);
      setCurrentProfileImage(previewUrl);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!profilePicture) {
      setMessages([{ tags: "error", text: "กรุณาเลือกรูปภาพ" }]);
      return;
    }

    setLoading(true);
    setMessages([]);

    const formData = new FormData();
    formData.append("file", profilePicture);

    try {
      const response = await axios.post(`https://192.168.1.188/hrwebapi/api/Files/UploadProfile?userID=${userID}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.status === 200) {
        setMessages([{ tags: "success", text: "อัปโหลดรูปโปรไฟล์สำเร็จ!", className: "font-FontNoto" }]);
        setCurrentProfileImage(`https://192.168.1.188/hrwebapi/api/Files/GetProfileImage?userID=${userID}`);
        setProfilePicture(null);
      }
    } catch (error) {
      console.error("API Error:", error.response ? error.response.data : error.message);
      setMessages([{ tags: "error", text: "เกิดข้อผิดพลาดในการอัปโหลดรูปโปรไฟล์!", className: "font-FontNoto" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeExperience = (e) => {
    const { name, value } = e.target;

    if (name === "salary" || name === "startDate" || name === "endDate") {
      const numericOnly = value.replace(/[^0-9]/g, "").slice(0, 4); // เอาแค่ตัวเลข 4 หลัก
      setNewExperience((prev) => ({ ...prev, [name]: numericOnly }));
    } else {
      setNewExperience((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleChangeEducation = (e) => {
    const { name, value } = e.target;
    if (name === "year") {
      const filtered = value.replace(/[^0-9\-]/g, "");
      setNewEducation({ ...newEducation, [name]: filtered });
    } else {
      setNewEducation({ ...newEducation, [name]: value });
    }
  };

  const handleAddOrEditEducation = async (e) => {
    e.preventDefault();
    const yearRegex = /^\d{4}-\d{4}$/;

    if (!yearRegex.test(newEducation.year)) {
      setModalMessage("กรุณากรอกปีในรูปแบบ 2567-2568");
      setIsModalOpen(true);
      return;
    }

    if (newEducation.gpa !== "" && (newEducation.gpa < 0 || newEducation.gpa > 4)) {
      setModalMessage("กรุณากรอกเกรดเฉลี่ยสะสมให้ถูกต้อง (0.00 - 4.00)");
      setIsModalOpen(true);
      return;
    }

    try {
      const gpaValue =
        newEducation.gpa === "" || newEducation.gpa === null || isNaN(newEducation.gpa)
          ? 0 // ✅ ส่ง 0 แทน null ถ้าไม่ได้กรอก
          : parseFloat(newEducation.gpa);
      if (isEditing) {
        const updated = {
          educationID: educations[editIndex].educationID,
          userID: userID,
          level: newEducation.level,
          institute: newEducation.institute,
          fieldOfStudy: newEducation.fieldOfStudy,
          year: newEducation.year,
          gpa: gpaValue,
          thesis: newEducation.thesis || "",
          activities: newEducation.activities || "",
          createdAt: educations[editIndex].createdAt,
          updatedAt: new Date().toISOString(),
        };

        const res = await axios.put(
          `https://192.168.1.188/hrwebapi/api/Educations/Update/${updated.educationID}`,
          updated
        );

        const updatedList = educations.map((edu, i) =>
          i === editIndex ? res.data : edu
        );
        setEducations(updatedList);
      } else {
        const educationToSend = {
          ...newEducation,
          userID,
          gpa: gpaValue,
        };
        await axios.post(
          "https://192.168.1.188/hrwebapi/api/Educations/Insert",
          educationToSend
        );
        fetchEducations();
      }

      setNewEducation({
        level: "",
        institute: "",
        fieldOfStudy: "",
        year: "",
        gpa: "",
        thesis: "",
        activities: "",
      });
      setIsEditing(false);
      setEditIndex(null);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการเพิ่ม/แก้ไขข้อมูล:", error);
    }
  };

  const handleEditEducation = (index) => {
    setNewEducation(educations[index]);
    setIsEditing(true);
    setEditIndex(index);
  };

  const handleDeleteEducation = (index) => {
    const edu = educations[index];
    setModalMessage(
      <>
        <p className="font-FontNoto">คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?</p>
        <p className="font-FontNoto"><strong>สถาบัน:</strong> {edu.institute}</p>
        <p className="font-FontNoto"><strong>ระดับ:</strong> {levelLabels[edu.level]}</p>
      </>
    );

    setModalConfirmAction(() => async () => {
      try {
        await axios.delete(`https://192.168.1.188/hrwebapi/api/Educations/Delete/${edu.educationID}`);
        const updatedList = educations.filter((_, i) => i !== index);
        setEducations(updatedList);
        setIsModalOpen(false);
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการลบข้อมูล:", error);
      }
    });

    setIsModalOpen(true);
  };

  const handleAddOrEditExperience = async (e) => {
    e.preventDefault();
    const newErrors = {
      startDate: newExperience.startDate.length !== 4 ? "กรุณากรอกปี พ.ศ. ให้ครบ 4 หลัก" : "",
      endDate: newExperience.endDate && newExperience.endDate.length !== 4 ? "กรุณากรอกปี พ.ศ. ให้ครบ 4 หลัก" : "",
    };
    setErrors(newErrors);
    if (newErrors.startDate || newErrors.endDate) return;

    try {
      if (isEditing) {
        const updated = { ...experiences[editIndex], ...newExperience };
        await axios.put(`https://192.168.1.188/hrwebapi/api/WorkExperiences/Update/${updated.experienceID}`, updated);
        fetchExperiences();
      } else {
        await axios.post(`https://192.168.1.188/hrwebapi/api/WorkExperiences/Insert`, {
          userID,
          jobTitle: newExperience.jobTitle,
          companyName: newExperience.companyName,
          startDate: newExperience.startDate,
          endDate: newExperience.endDate,
        });
        fetchExperiences();
      }

      setNewExperience({ companyName: "", jobTitle: "", startDate: "", endDate: "", description: "", salary: "" });
      setIsEditing(false);
      setEditIndex(null);
    } catch (err) {
      console.error("บันทึกประสบการณ์ล้มเหลว", err);
    }
  };

  const handleEditExperience = (index) => {
    setNewExperience(experiences[index]);
    setIsEditing(true);
    setEditIndex(index);
  };

  const handleDeleteExperience = async (experience) => {
    try {
      await axios.delete(`https://192.168.1.188/hrwebapi/api/WorkExperiences/Delete/${experience.experienceID}`);
      fetchExperiences();
    } catch (err) {
      console.error("ลบประสบการณ์ล้มเหลว", err);
    }
  };

  const openModal = (index) => {
    setExperienceToDelete(experiences[index]);
    setModalMessage(
      <>
        <p className="font-FontNoto">คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?</p>
        <p className="font-FontNoto"><strong>บริษัท:</strong> {experiences[index].companyName}</p>
        <p className="font-FontNoto"><strong>ตำแหน่ง:</strong> {experiences[index].jobTitle}</p>
      </>
    );
    setModalConfirmAction(() => () => handleDeleteExperience(experiences[index]));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setExperienceToDelete(null);
  };
  return (
    <div className=" ">
      <div className="w-full bg-gradient-to-r from-cyan-100 via-blue-100 to-blue-50 text-white rounded-xl p-4 sm:p-5 md:p-6 mb-6 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* รูปโปรไฟล์ + ข้อมูลพื้นฐาน */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentProfileImage}
                alt="Profile"
                className="w-28 h-28 rounded-full border-4 border-white shadow-md object-cover cursor-pointer hover:opacity-80 transition"
                onClick={() => fileInputRef.current.click()}
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 font-FontNoto">
                {employee.firstName} {employee.lastName}
                {employee.nickname && ` (${employee.nickname})`}
              </h2>

              <p className="text-sm text-gray-600 font-FontNoto">
                {roleMapping[employee.role] || "ไม่ระบุแผนก"}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium font-FontNoto border border-green-300 shadow-sm">
                  {designationMap[employee.designation] || "สถานะงาน"}
                </span>
              </div>
              {profilePicture && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={handleProfileSubmit}
                    className="btn btn-sm font-FontNoto !bg-white !text-indigo-800"
                  >
                    บันทึกรูปโปรไฟล์
                  </button>
                </div>
              )}
            </div>
          </div>

          {employee.userID?.toString() === sessionStorage.getItem("userId") && (
            <div className="p-2 rounded-md inline-block">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="btn btn-sm font-FontNoto !bg-white !text-indigo-800 border border-gray-400 hover:bg-gray-100 flex items-center gap-2"
              >
                <FiLock className="w-4 h-4" />
                เปลี่ยนรหัสผ่าน
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto sm:overflow-visible px-3 mt-6">
        <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-4 gap-4 font-FontNoto min-w-[640px] sm:min-w-0">
          <div className="flex-shrink-0 w-[250px] sm:w-auto bg-white shadow rounded-xl p-4 text-center">
            <div className="flex flex-col items-center mb-2">
              <CalendarIcon size={24} className="text-indigo-600 mb-1" />
              <p className="text-sm text-gray-500 font-FontNoto">วันเริ่มงาน</p>
            </div>
            <p className="text-base font-bold text-indigo-800 font-FontNoto">
              {formatThaiDate(employee.JDate)}
            </p>
          </div>

          <div className="flex-shrink-0 w-[250px] sm:w-auto bg-white shadow rounded-xl p-4 text-center">
            <div className="flex flex-col items-center mb-2">
              <BriefcaseIcon size={24} className="text-green-700 mb-1" />
              <p className="text-sm text-gray-500 font-FontNoto">อายุการทำงาน</p>
            </div>
            <p className="text-base font-bold text-indigo-800 font-FontNoto">
              {calculateWorkDuration(employee.JDate)}
            </p>
          </div>

          <div className="flex-shrink-0 w-[250px] sm:w-auto bg-white shadow rounded-xl p-4 text-center">
            <div className="flex flex-col items-center mb-2">
              <ClockIcon size={24} className="text-yellow-600 mb-1" />
              <p className="text-sm text-gray-500 font-FontNoto">ชั่วโมงทำงาน</p>
            </div>
            <p className="text-base font-bold text-indigo-800 font-FontNoto">
              {workingHours.hours} ชม. {workingHours.minutes} น./เดือน
            </p>
          </div>

          <div className="flex-shrink-0 w-[250px] sm:w-auto bg-white shadow rounded-xl p-4 text-center">
            <div className="flex flex-col items-center mb-2">
              <AwardIcon size={24} className="text-pink-600 mb-1" />
              <p className="text-sm text-gray-500 font-FontNoto">ผลประเมิน</p>
            </div>
            <p className="text-base font-bold text-indigo-800 font-FontNoto">ยังไม่มีการประเมิน</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-300 mb-4 mt-6">
        <button
          onClick={() => setActiveTab("profile")}
          className={`py-2 px-4 font-bold font-FontNoto ${activeTab === "profile" ? "border-b-4 border-blue-500 text-blue-600" : "text-gray-500"}`}
        >
          ข้อมูลส่วนตัว
        </button>
        <button
          onClick={() => setActiveTab("experience")}
          className={`py-2 px-4 font-bold font-FontNoto ${activeTab === "experience" ? "border-b-4 border-blue-500 text-blue-600" : "text-gray-500"}`}
        >
          ประวัติการทำงาน
        </button>
        <button
          onClick={() => setActiveTab("education")}
          className={`py-2 px-4 font-bold font-FontNoto ${activeTab === "education" ? "border-b-4 border-blue-500 text-blue-600" : "text-gray-500"}`}
        >
          ข้อมูลการศึกษา
        </button>
      </div>

      {activeTab === "profile" && (
        <>
          <div className="w-full rounded-lg relative bg-white md:shadow-lg p-3">
            {loading ? (
              <div className="text-center py-6">กำลังโหลดข้อมูล...</div>
            ) : error ? (
              <div className="alert alert-error">{error}</div>
            ) : (
              <>
                <form id="profileForm" onSubmit={handleSubmit}>
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold font-FontNoto">ข้อมูลส่วนบุคคล</h2>
                    {!isEditMode ? (
                      <button
                        type="button"
                        onClick={() => setIsEditMode(true)}
                        className="flex items-center px-4 py-1 text-white bg-blue-600 rounded hover:bg-blue-700 font-FontNoto"
                      >
                        <PencilSquareIcon className="w-5 h-5 mr-1" />
                        แก้ไขข้อมูลส่วนบุคคล
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            const form = document.getElementById("profileForm");
                            if (form) form.requestSubmit();
                          }}
                          className="flex items-center px-4 py-1 text-white bg-green-600 rounded hover:bg-green-700 font-FontNoto"
                        >
                          <PlusIcon className="w-5 h-5 mr-1" />
                          บันทึก
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditMode(false)}
                          className="flex items-center px-4 py-1 text-white bg-red-600 rounded hover:bg-red-700 font-FontNoto"
                        >
                          <XMarkIcon className="w-5 h-5 mr-1" />
                          ยกเลิก
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="p-6 text-sm text-gray-700 space-y-6 font-FontNoto">
                    <h2 className="text-lg font-semibold border-b pb-2 mb-4">ข้อมูลส่วนตัว</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <label className="w-32 text-sm font-medium whitespace-nowrap">ชื่อ-นามสกุล :</label>
                          {!isEditMode ? (
                            <p className="text-sm">
                              {employee.prefix === "MR" && "นาย "}
                              {employee.prefix === "MRS" && "นาง "}
                              {employee.prefix === "MISS" && "นางสาว "}
                              {employee.firstName} {employee.lastName}
                            </p>
                          ) : (
                            <div className="flex gap-2 w-full">
                              <select
                                name="prefix"
                                className="select select-sm select-bordered w-1/4"
                                value={employee.prefix}
                                onChange={handleChange}
                              >
                                <option value="">เลือกคำนำหน้า</option>
                                <option value="MR">นาย</option>
                                <option value="MRS">นาง</option>
                                <option value="MISS">นางสาว</option>
                              </select>
                              <input
                                type="text"
                                name="firstName"
                                placeholder="ชื่อ"
                                className="input input-sm input-bordered w-1/4"
                                value={employee.firstName}
                                onChange={handleChange}
                              />
                              <input
                                type="text"
                                name="lastName"
                                placeholder="นามสกุล"
                                className="input input-sm input-bordered w-1/2"
                                value={employee.lastName}
                                onChange={handleChange}
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <label className="w-32 text-sm font-medium whitespace-nowrap">ชื่อภาษาอังกฤษ :</label>
                          {!isEditMode ? (
                            <p className="text-sm">{employee.englishFirstName} {employee.englishLastName}</p>
                          ) : (
                            <div className="flex gap-2 w-full">
                              <input
                                type="text"
                                name="englishFirstName"
                                className="input input-sm input-bordered w-1/2"
                                value={employee.englishFirstName}
                                onChange={handleChange}
                              />
                              <input
                                type="text"
                                name="englishLastName"
                                className="input input-sm input-bordered w-1/2"
                                value={employee.englishLastName}
                                onChange={handleChange}
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="w-32 text-sm font-medium">ชื่อเล่น :</label>
                          {!isEditMode ? (
                            <p className="text-sm">{employee.nickname}</p>
                          ) : (
                            <input
                              type="text"
                              name="nickname"
                              className="input input-sm input-bordered w-full"
                              value={employee.nickname}
                              onChange={handleChange}
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="w-32 text-sm font-medium">เพศ :</label>
                          {!isEditMode ? (
                            <p className="text-sm">{employee.gender === "Male" ? "ชาย" : employee.gender === "Female" ? "หญิง" : "ไม่ระบุ"}</p>
                          ) : (
                            <select
                              name="gender"
                              className="select select-sm select-bordered w-full"
                              value={employee.gender}
                              onChange={handleChange}
                            >
                              <option value="None">ไม่ระบุ</option>
                              <option value="Male">ชาย</option>
                              <option value="Female">หญิง</option>
                            </select>

                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <label className="w-32 text-sm font-medium">วันเกิด :</label>
                          {!isEditMode ? (
                            <p className="text-sm">
                              {employee.birthday
                                ? new Date(employee.birthday).toLocaleDateString("th-TH")
                                : "-"}
                            </p>
                          ) : (
                            <input
                              type="date"
                              name="birthday"
                              value={employee.birthday || ""}
                              onChange={handleChange}
                              className="input input-sm input-bordered w-full font-FontNoto"
                              style={{ colorScheme: "light" }}
                              max={new Date().toISOString().split("T")[0]}
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="w-32 text-sm font-medium">สถานภาพ :</label>
                          {!isEditMode ? (
                            <p className="text-sm">{maritalStatusMap[employee.maritalStatus] || "ไม่ระบุ"}</p>
                          ) : (
                            <select
                              name="maritalStatus"
                              className="select select-sm select-bordered w-full"
                              value={employee.maritalStatus}
                              onChange={handleChange}
                            >
                              <option value="">ไม่ระบุ</option>
                              <option value="single">โสด</option>
                              <option value="married">สมรส</option>
                              <option value="divorced">หย่าร้าง</option>
                              <option value="widowed">หม้าย</option>
                              <option value="complicated">ค่อนข้างอธิบายยาก</option>
                            </select>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <label className="w-32 text-sm font-medium whitespace-nowrap">เลขบัตรประชาชน :</label>
                          {!isEditMode ? (
                            <p className="text-sm">{employee.nationalID}</p>
                          ) : (
                            <input
                              type="text"
                              name="nationalID"
                              className="input input-sm input-bordered w-full"
                              value={employee.nationalID}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, ""); // เอาเฉพาะตัวเลข
                                if (value.length <= 13) {
                                  setEmployee((prev) => ({ ...prev, nationalID: value }));
                                }
                              }}
                              inputMode="numeric"
                              maxLength={13}
                              pattern="\d{13}"
                              placeholder="กรอกเลขบัตร 13 หลัก"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="w-32 text-sm font-medium">อายุ :</label>
                          <p className="text-sm">{calculateAge(employee.birthday)} ปี</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="w-32 text-sm font-medium">Username :</label>
                          {!isEditMode ? (
                            <p className="text-sm">{employee.username}</p>
                          ) : (
                            <input
                              type="text"
                              name="username"
                              className="input input-sm input-bordered w-full"
                              value={employee.username}
                              onChange={(e) => {
                                const value = e.target.value;
                                const noThaiPattern = /^[^\u0E00-\u0E7F]*$/;
                                if (noThaiPattern.test(value)) {
                                  setEmployee((prev) => ({ ...prev, username: value }));
                                }
                              }}
                              required
                            />
                          )}
                        </div>
                      </div>

                      {/* ขวา: ข้อมูลติดต่อ */}
                      <div className="space-y-4">

                        <div className="flex items-center gap-4">
                          <label className="w-32 text-sm font-medium">อีเมล :</label>
                          {!isEditMode ? (
                            <p className="text-sm">{employee.email}</p>
                          ) : (
                            <input
                              type="email"
                              name="email"
                              className="input input-sm input-bordered w-full"
                              value={employee.email}
                              onChange={handleChange}
                            />
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <label className="w-32 text-sm font-medium">โทรศัพท์ :</label>
                          {!isEditMode ? (
                            <p className="text-sm">{employee.contact}</p>
                          ) : (
                            <input
                              type="text"
                              name="contact"
                              className="input input-sm input-bordered w-full"
                              value={employee.contact}
                              onChange={handleChange}
                            />
                          )}
                        </div>

                        <div className="flex items-start gap-4">
                          <label className="w-32 pt-1 text-sm font-medium">ที่อยู่ :</label>
                          {!isEditMode ? (
                            <p className="text-sm">{employee.currentAddress}</p>
                          ) : (
                            <input
                              type="text"
                              name="currentAddress"
                              rows={2}
                              className="input input-sm input-bordered w-full"
                              value={employee.currentAddress}
                              onChange={handleChange}
                            />
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <label className="w-32 text-sm font-medium whitespace-nowrap">
                            บุคคลติดต่อฉุกเฉิน :
                          </label>

                          {!isEditMode ? (
                            <p className="text-sm">{employee.emergencyContact}</p>
                          ) : (
                            <input
                              type="text"
                              name="emergencyContact"
                              className="input input-sm input-bordered w-full"
                              value={employee.emergencyContact}
                              onChange={handleChange}
                            />
                          )}
                        </div>
                      </div>

                    </div>
                    <div className="grid md:grid-cols-2 gap-8 text-sm text-gray-700 font-FontNoto">
                      <div className="space-y-4">
                        <h2 className="text-lg font-semibold border-b border-gray-300 pb-2 mb-4">ข้อมูลการทำงาน</h2>

                        {(currentUserRole === "ADMIN" && isEditMode) ? (
                          <>
                            <div className="flex items-center gap-2">
                              <label className="w-32 text-sm font-medium whitespace-nowrap">รหัสพนักงาน :</label>
                              <input
                                type="text"
                                name="employeeCode"
                                className="input input-sm input-bordered w-full text-sm"
                                value={employee.employeeCode}
                                onChange={handleChange}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="w-32 text-sm font-medium whitespace-nowrap">ตำแหน่ง :</label>
                              <select
                                name="role"
                                value={employee.role || ""}
                                onChange={handleChange}
                                className="select select-sm select-bordered w-full text-sm font-FontNoto"
                                required
                              >
                                <option className="font-FontNoto" value="" disabled>เลือกตำแหน่ง</option>
                                <option className="font-FontNoto" value="GM">ผู้จัดการทั่วไป</option>
                                <option className="font-FontNoto" value="Hr">เลขานุการฝ่ายบริหาร</option>
                                <option className="font-FontNoto" value="HEAD_BA">หัวหน้าฝ่ายนักวิเคราะห์ธุรกิจ</option>
                                <option className="font-FontNoto" value="SENIOR_DEV">Senior Programmer</option>
                                <option className="font-FontNoto" value="Dev">Programmer</option>
                                <option className="font-FontNoto" value="BA">นักวิเคราะห์ธุรกิจ (BA)</option>
                                <option className="font-FontNoto" value="TESTER">Software Tester</option>
                                <option className="font-FontNoto" value="JUNIOR_DEV">Junior Programmer</option>
                                <option className="font-FontNoto" value="ADMIN">Admin</option>
                              </select>
                            </div>

                            {currentUserRole === "ADMIN" && (
                              <div className="flex items-center gap-2">
                                <label className="w-32 text-sm font-medium whitespace-nowrap">สถานะงาน :</label>
                                {!isEditMode ? (
                                  <p className="text-sm">{designationMap[employee.designation] || "ไม่ระบุ"}</p>
                                ) : (
                                  <select
                                    name="designation"
                                    value={employee.designation || ""}
                                    onChange={handleChange}
                                    className="select select-sm select-bordered w-full text-sm font-FontNoto"
                                    required
                                  >
                                    <option value="" disabled>เลือกสถานะงาน</option>
                                    <option value="FULLTIME">พนักงานประจำ</option>
                                    <option value="CONTRACT">สัญญาจ้าง</option>
                                    <option value="INTERN">นักศึกษาฝึกงาน</option>
                                    <option value="PROBATION">ทดลองงาน</option>
                                    <option value="EXPIRED">หมดสัญญา</option>
                                    <option value="RESIGNED">ลาออก</option>
                                    <option value="ADMIN">Admin</option>
                                  </select>
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <label className="w-32 text-sm font-medium whitespace-nowrap">วันที่เริ่มงาน :</label>
                              <input
                                type="date"
                                name="JDate"
                                value={employee.JDate || ""}
                                onChange={handleChange}
                                className="input input-sm input-bordered w-full text-sm font-FontNoto"
                                style={{ colorScheme: "light" }}
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <p><strong>รหัสพนักงาน :</strong> {employee.employeeCode}</p>
                            <p><strong>ตำแหน่ง :</strong> {roleMapping[employee.role]}</p>
                            {currentUserRole === "ADMIN" && (
                              <p><strong>สถานะงาน :</strong> {designationMap[employee.designation] || "ไม่ระบุ"}</p>
                            )}
                            <p><strong>วันที่เริ่มงาน :</strong> {formatThaiDate(employee.JDate)}</p>
                            <p><strong>อายุงาน :</strong> {calculateWorkDuration(employee.JDate)}</p>
                          </>
                        )}
                      </div>
                      <div className="space-y-4">
                        <h2 className="text-lg font-semibold border-b border-gray-300 pb-2 mb-4">ข้อมูลการศึกษา</h2>
                        {educations.length > 0 ? (() => {
                          const sorted = [...educations].sort((a, b) => {
                            const aEnd = parseInt(a.year.split("-")[1]) || 0;
                            const bEnd = parseInt(b.year.split("-")[1]) || 0;
                            return bEnd - aEnd;
                          });
                          const latest = sorted[0];
                          return (
                            <>
                              <p><strong>ระดับการศึกษา :</strong> {levelLabels[latest.level]}</p>
                              <p><strong>ชื่อสถาบัน :</strong> {latest.institute}</p>
                              <p><strong>ปีการศึกษา :</strong> {latest.year}</p>
                              <p><strong>เกรดเฉลี่ย (GPA) :</strong> {latest.gpa}</p>
                            </>
                          );
                        })() : (
                          <p className="text-gray-500 font-FontNoto">ยังไม่มีข้อมูลการศึกษา</p>
                        )}
                      </div>
                    </div>

                  </div>

                </form>
              </>
            )}
          </div>
        </>
      )}
      {activeTab === "education" && (
        <>
          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-2xl shadow-2xl w-96 relative">
                <div className="mb-2">
                  <h3 className="text-lg font-bold text-red-600 text-center font-FontNoto">
                    ยืนยันการลบข้อมูล
                  </h3>
                </div>
                <div className="mb-6 text-gray-700 text-center font-FontNoto">
                  {modalMessage || "คุณต้องการลบข้อมูลนี้ออกจากระบบหรือไม่?"}
                </div>
                <div className="flex justify-center gap-4">
                  <button
                    className="px-4 py-2 rounded-md border text-gray-700 bg-gray-100 hover:bg-gray-200 transition font-FontNoto"
                    onClick={() => setIsModalOpen(false)}
                  >
                    ยกเลิก
                  </button>
                  <button
                    className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition font-FontNoto"
                    onClick={modalConfirmAction}
                  >
                    ลบข้อมูล
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="w-full rounded-lg relative bg-white md:shadow-lg p-3">
            <div className="w-full mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold font-FontNoto">ข้อมูลการศึกษา</h2>
                <button
                  className="btn btn-sm btn-primary font-FontNoto"
                  onClick={() => {
                    setIsEditing(false);
                    setEditIndex(null);
                    setNewEducation({ level: "", institute: "", fieldOfStudy: "", year: "", gpa: "" });
                    setShowEducationModal(true);
                  }}
                >
                  เพิ่มข้อมูลการศึกษา
                </button>
              </div>
              {educations.length === 0 ? (
                <p className="text-center text-gray-500 mt-4 font-FontNoto">ไม่มีข้อมูลการศึกษา</p>
              ) : (
                <div className="space-y-4">
                  {educations.map((edu, index) => (
                    <div key={index} className="bg-white rounded-xl shadow p-4 border border-gray-200 relative">
                      <div className="absolute top-4 right-4 bg-gray-100 px-3 py-1 rounded-full text-sm text-blue-600 font-FontNoto shadow-sm">
                        {edu.year}
                      </div>
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-purple-800 font-FontNoto">{levelLabels[edu.level]}</h3>
                        {edu.fieldOfStudy && edu.fieldOfStudy !== "-" && (
                          <p className="text-lg font-semibold text-blue-700 font-FontNoto">
                            สาขาวิชา{edu.fieldOfStudy}
                          </p>
                        )}

                        <p className="text-sm text-gray-600 font-FontNoto">{edu.institute}</p>
                        {edu.gpa && (
                          <p className="text-sm text-gray-600 font-FontNoto">เกรดเฉลี่ย : {edu.gpa}</p>
                        )}
                        {edu.thesis && (
                          <p className="text-sm text-gray-600 font-FontNoto">วิทยานิพนธ์ : {edu.thesis}</p>
                        )}
                        {edu.activities && (
                          <p className="text-sm text-gray-600 font-FontNoto">กิจกรรม : {edu.activities}</p>
                        )}
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          className="flex items-center gap-1 text-blue-600 bg-transparent hover:underline font-FontNoto"
                          onClick={() => {
                            setIsEditing(true);
                            setEditIndex(index);
                            setNewEducation(edu);
                            setShowEducationModal(true);
                          }}
                        >
                          <FiEdit />
                          แก้ไข
                        </button>
                        <button
                          className="flex items-center gap-1 text-red-600 bg-transparent hover:underline font-FontNoto"
                          onClick={() => handleDeleteEducation(index)}
                        >
                          <FiTrash2 />
                          ลบ
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {showEducationModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg relative">
                <h3 className="text-lg font-semibold mb-4 text-center text-indigo-700 font-FontNoto">
                  {isEditing ? "แก้ไขข้อมูลการศึกษา" : "เพิ่มข้อมูลการศึกษา"}
                </h3>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const yearRegex = /^\d{4}-\d{4}$/;
                    if (!yearRegex.test(newEducation.year)) {
                      setModalMessage("กรุณากรอกปีในรูปแบบ 2567-2568");
                      setIsModalOpen(true);
                      return;
                    }
                    if (newEducation.gpa < 0 || newEducation.gpa > 4) {
                      setModalMessage("กรุณากรอกเกรดเฉลี่ยสะสมให้ถูกต้อง (0.00 - 4.00)");
                      setIsModalOpen(true);
                      return;
                    }

                    try {
                      if (isEditing) {
                        const updated = { ...educations[editIndex], ...newEducation };
                        await axios.put(
                          `https://192.168.1.188/hrwebapi/api/Educations/Update/${updated.educationID}`,
                          updated
                        );
                      } else {
                        await axios.post("https://192.168.1.188/hrwebapi/api/Educations/Insert", {
                          ...newEducation,
                          userID,
                        });
                      }

                      await fetchEducations();
                      setNewEducation({ level: "", institute: "", fieldOfStudy: "", year: "", gpa: "" });
                      setIsEditing(false);
                      setEditIndex(null);
                      setShowEducationModal(false);
                    } catch (error) {
                      console.error("เกิดข้อผิดพลาดในการบันทึก:", error);
                    }
                  }}
                  className="space-y-4 font-FontNoto"
                >
                  <div className="form-control">
                    <select
                      name="level"
                      className="select select-bordered w-full"
                      value={newEducation.level}
                      onChange={handleChangeEducation}
                      required
                    >
                      <option value="">-- เลือกระดับการศึกษา --</option>
                      {Object.entries(levelLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-control md:col-span-2">
                    <input
                      type="text"
                      name="fieldOfStudy"
                      className="input input-bordered w-full"
                      value={newEducation.fieldOfStudy}
                      onChange={handleChangeEducation}
                      placeholder="สาขาวิชา"
                      required
                    />
                  </div>
                  <div className="form-control">
                    <input
                      type="text"
                      name="institute"
                      className="input input-bordered w-full"
                      value={newEducation.institute}
                      onChange={handleChangeEducation}
                      placeholder="มหาวิทยาลัย, โรงเรียน, สถาบัน"
                      required
                    />
                  </div>

                  <div className="form-control">
                    <input
                      type="number"
                      name="gpa"
                      step="0.01"
                      min="0"
                      max="4"
                      required
                      className="input input-bordered w-full"
                      value={newEducation.gpa}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewEducation({
                          ...newEducation,
                          gpa: val,
                        });
                      }}
                      placeholder="เกรดเฉลี่ย (0.00 - 4.00)"
                    />
                  </div>


                  <div className="form-control md:col-span-2">
                    <textarea
                      name="thesis"
                      className="textarea textarea-bordered w-full"
                      value={newEducation.thesis}
                      onChange={handleChangeEducation}
                      placeholder="วิทยานิพนธ์ (ถ้ามี)"
                    />
                  </div>

                  <div className="form-control md:col-span-2">
                    <textarea
                      name="activities"
                      className="textarea textarea-bordered w-full"
                      value={newEducation.activities}
                      onChange={handleChangeEducation}
                      placeholder="กิจกรรม (ถ้ามี)"
                    />
                  </div>
                  <div className="form-control">
                    <input
                      type="text"
                      name="year"
                      className="input input-bordered w-full"
                      value={newEducation.year}
                      onChange={handleChangeEducation}
                      required
                      pattern="\d{4}-\d{4}"
                      title="เช่น 2565-2569"
                      placeholder="ปีที่ศึกษา (เช่น 2565-2569)"
                    />
                  </div>
                  {/* ปุ่ม */}
                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      type="button"
                      className="btn !bg-gray-200 !text-black !hover:bg-gray-300 font-FontNoto"
                      onClick={() => setShowEducationModal(false)}
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="btn !bg-blue-600 !text-white !hover:bg-blue-700 font-FontNoto"
                    >
                      บันทึก
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "experience" && (
        <>
          {/* Modal ลบ */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-2xl shadow-2xl w-96 relative">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-red-600 text-center font-FontNoto">
                    ยืนยันการลบข้อมูล
                  </h3>
                </div>

                <div className="mb-6 text-gray-700 text-center font-FontNoto">
                  {modalMessage || "คุณต้องการลบข้อมูลนี้ออกจากระบบหรือไม่?"}
                </div>

                <div className="flex justify-center gap-4">
                  <button
                    className="px-4 py-2 rounded-md border text-gray-700 bg-gray-100 hover:bg-gray-200 transition font-FontNoto"
                    onClick={closeModal}
                  >
                    ยกเลิก
                  </button>
                  <button
                    className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition font-FontNoto"
                    onClick={() => {
                      modalConfirmAction();
                      closeModal();
                    }}
                  >
                    ลบข้อมูล
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="w-full rounded-lg relative bg-white md:shadow-lg p-3">
            <div className="w-full mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold font-FontNoto">ประวัติการทำงาน</h2>
                <button
                  className="btn btn-sm btn-primary font-FontNoto"
                  onClick={() => {
                    setIsEditing(false);
                    setEditIndex(null);
                    setNewExperience({ companyName: "", jobTitle: "", startDate: "", endDate: "", description: "" });
                    setShowExperienceModal(true);
                  }}
                >
                  เพิ่มประวัติการทำงาน
                </button>
              </div>
              <div className="space-y-4">
                {experiences.length === 0 ? (
                  <p className="text-center text-gray-500 mt-4 font-FontNoto">ไม่มีข้อมูลประสบการณ์ทำงาน</p>
                ) : (
                  experiences.map((exp, index) => (
                    <div key={index} className="bg-white rounded-xl shadow p-4 border border-gray-200 relative">
                      {/* วันที่ฝั่งขวาบน */}
                      <div className="absolute top-4 right-4 bg-gray-100 px-3 py-1 rounded-full text-sm text-blue-600 font-FontNoto shadow-sm">
                        {exp.startDate} - {exp.endDate || "ปัจจุบัน"}
                      </div>

                      {/* เนื้อหาหลัก */}
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-purple-800 font-FontNoto">{exp.jobTitle}</h3>
                        <p className="text-lg font-semibold text-blue-700 font-FontNoto">{exp.companyName}</p>
                        {exp.description && (
                          <ul className="list-disc list-inside mt-2 text-sm text-gray-600 font-FontNoto">
                            {exp.description.split(/[\n,]+/).map((item, i) => (
                              <li key={i}>{item.trim()}</li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* ปุ่มล่างขวา */}
                      <div className="flex justify-end gap-2">
                        <button
                          className="flex items-center gap-1 text-blue-600 bg-transparent hover:underline font-FontNoto"
                          onClick={() => {
                            setIsEditing(true);
                            setEditIndex(index);
                            setNewExperience(exp);
                            setShowExperienceModal(true);
                          }}
                        >
                          <FiEdit />
                          แก้ไข
                        </button>
                        <button
                          className="flex items-center gap-1 text-red-600 bg-transparent hover:underline font-FontNoto"
                          onClick={() => openModal(index)}
                        >
                          <FiTrash2 />
                          ลบ
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {showExperienceModal && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg relative">

                  <h3 className="text-lg font-semibold mb-4 font-FontNoto">
                    {isEditing ? "แก้ไขประสบการณ์" : "เพิ่มประวัติการทำงาน"}
                  </h3>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();

                      const startInvalid = newExperience.startDate.length !== 4;
                      const endInvalid = newExperience.endDate && newExperience.endDate.length !== 4;

                      if (startInvalid || endInvalid) {
                        setErrors({
                          startDate: startInvalid ? "กรุณากรอกปี พ.ศ. 4 หลัก" : "",
                          endDate: endInvalid ? "กรุณากรอกปี พ.ศ. 4 หลัก" : "",
                        });
                        return;
                      }

                      try {
                        if (isEditing) {
                          const item = { ...experiences[editIndex], ...newExperience };
                          await axios.put(
                            `https://192.168.1.188/hrwebapi/api/WorkExperiences/Update/${item.experienceID}`,
                            item
                          );
                        } else {
                          await axios.post("https://192.168.1.188/hrwebapi/api/WorkExperiences/Insert", {
                            userID,
                            companyName: newExperience.companyName,
                            jobTitle: newExperience.jobTitle,
                            startDate: newExperience.startDate,
                            endDate: newExperience.endDate,
                            description: newExperience.description || "",
                          });
                        }

                        await fetchExperiences();
                        setShowExperienceModal(false);
                        setIsEditing(false);
                        setEditIndex(null);
                        setNewExperience({
                          companyName: "",
                          jobTitle: "",
                          startDate: "",
                          endDate: "",
                          description: "",
                        });
                        setErrors({});
                      } catch (err) {
                        console.error("บันทึกประสบการณ์ล้มเหลว", err);
                      }
                    }}
                    className="space-y-4"
                  >
                    <div className="form-control">
                      <input
                        type="text"
                        name="jobTitle"
                        placeholder="ตำแหน่งงาน"
                        className="input input-bordered font-FontNoto"
                        value={newExperience.jobTitle}
                        onChange={handleChangeExperience}
                        required
                      />
                    </div>

                    <div className="form-control">
                      <input
                        type="text"
                        name="companyName"
                        placeholder="ชื่อบริษัท"
                        className="input input-bordered font-FontNoto"
                        value={newExperience.companyName}
                        onChange={handleChangeExperience}
                        required
                      />
                    </div>

                    <div className="form-control">
                      <textarea
                        name="description"
                        placeholder="หน้าที่ความรับผิดชอบ (คั่นด้วย , หรือ Enter)"
                        className="textarea textarea-bordered font-FontNoto"
                        rows={3}
                        value={newExperience.description}
                        onChange={handleChangeExperience}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <input
                          type="text"
                          name="startDate"
                          inputMode="numeric"
                          maxLength={4}
                          pattern="\d{4}"
                          placeholder="กรอกปี พ.ศ. เริ่มงาน"
                          className={`input input-bordered font-FontNoto ${errors.startDate ? "border-red-500" : ""}`}
                          value={newExperience.startDate}
                          onChange={handleChangeExperience}
                          required
                        />

                        {errors.startDate && (
                          <span className="text-red-500 text-sm font-FontNoto">{errors.startDate}</span>
                        )}
                      </div>

                      <div className="form-control">
                        <input
                          type="text"
                          name="endDate"
                          inputMode="numeric"
                          maxLength={4}
                          pattern="\d{4}"
                          placeholder="เว้นว่างหากยังทำงานอยู่"
                          className={`input input-bordered font-FontNoto ${errors.endDate ? "border-red-500" : ""}`}
                          value={newExperience.endDate}
                          onChange={handleChangeExperience}
                        />

                        {errors.endDate && (
                          <span className="text-red-500 text-sm font-FontNoto">{errors.endDate}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                      <button
                        type="button"
                        className="btn !bg-gray-200 !text-black !hover:bg-gray-300 font-FontNoto"
                        onClick={() => setShowExperienceModal(false)}
                      >
                        ยกเลิก
                      </button>
                      <button type="submit" className="btn !bg-blue-600 !text-white !hover:bg-blue-700 font-FontNoto">
                        บันทึก
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </>
      )}
      {showPasswordModal && (
        <dialog open className="modal modal-open z-50">
          <div className="modal-box font-FontNoto">
            <h3 className="font-bold text-lg text-blue-700 mb-4">เปลี่ยนรหัสผ่าน</h3>
            <form onSubmit={handleSubmitChangePassword} className="space-y-3">
              {/* รหัสผ่านปัจจุบัน */}
              <div className="relative">
                <input
                  type={showOldPassword ? "text" : "password"}
                  placeholder="รหัสผ่านปัจจุบัน"
                  className="input input-bordered w-full"
                  value={oldPassword}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^[A-Za-z0-9@#&]*$/.test(value)) {
                      setOldPassword(value);
                    }
                  }}
                  onBeforeInput={(e) => {
                    const char = e.data;
                    if (char && !/^[A-Za-z0-9@#&]$/.test(char)) {
                      e.preventDefault();
                    }
                  }}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                >
                  {showOldPassword ? (
                    <FiEyeOff className="w-5 h-5 text-gray-500" />
                  ) : (
                    <FiEye className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              </div>

              {/* รหัสผ่านใหม่ */}
              <div className="relative">
                <input
                  type={showNewPassword1 ? "text" : "password"}
                  placeholder="รหัสผ่านใหม่"
                  className="input input-bordered w-full"
                  value={newPassword1}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^[A-Za-z0-9@#&]*$/.test(value)) {
                      setNewPassword1(value);
                    }
                  }}
                  onBeforeInput={(e) => {
                    const char = e.data;
                    if (char && !/^[A-Za-z0-9@#&]$/.test(char)) {
                      e.preventDefault();
                    }
                  }}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center"
                  onClick={() => setShowNewPassword1(!showNewPassword1)}
                >
                  {showNewPassword1 ? (
                    <FiEyeOff className="w-5 h-5 text-gray-500" />
                  ) : (
                    <FiEye className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              </div>

              {/* ยืนยันรหัสผ่านใหม่ */}
              <div className="relative">
                <input
                  type={showNewPassword2 ? "text" : "password"}
                  placeholder="ยืนยันรหัสผ่านใหม่"
                  className="input input-bordered w-full"
                  value={newPassword2}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^[A-Za-z0-9@#&]*$/.test(value)) {
                      setNewPassword2(value);
                    }
                  }}
                  onBeforeInput={(e) => {
                    const char = e.data;
                    if (char && !/^[A-Za-z0-9@#&]$/.test(char)) {
                      e.preventDefault();
                    }
                  }}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center"
                  onClick={() => setShowNewPassword2(!showNewPassword2)}
                >
                  {showNewPassword2 ? (
                    <FiEyeOff className="w-5 h-5 text-gray-500" />
                  ) : (
                    <FiEye className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" className="btn" onClick={() => setShowPasswordModal(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn !text-white !bg-blue-600">
                  ยืนยัน
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </div>
  );
}

export default Profile;
