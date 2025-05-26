import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { CalendarIcon, BriefcaseIcon, ClockIcon, AwardIcon, Printer } from "lucide-react";
import { pdfMake, font } from "../libs/pdfmake";

const roleMapping = {
  Hr: "ทรัพยากรบุคคล",
  GM: "ผู้จัดการทั่วไป",
  Dev: "นักพัฒนาระบบ",
  BA: "นักวิเคราะห์ธุรกิจ",
  Employee: "พนักงาน",
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
  const [employee, setEmployee] = useState({
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
    role: "Hr",
    updatedAt: "",
    userID: "",
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [currentProfileImage, setCurrentProfileImage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState(""); // เก็บข้อความใน Modal
  const [activeTab, setActiveTab] = useState("profile");
  const userID = sessionStorage.getItem("userId") || "";
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
    salary: "",
  });
  const [errors, setErrors] = useState({ startDate: "", endDate: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
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

  const getWorkingHoursThisMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0 = ม.ค.

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let workingDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // จันทร์ถึงศุกร์
        workingDays++;
      }
    }

    return workingDays * 8;
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
    if (userID) {
      fetch(`https://localhost:7039/api/Users/Profile/${userID}`, {
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
          const imageUrl = `https://localhost:7039/api/Files/GetProfileImage?userID=${userID}`;
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
      const response = await axios.get(`https://localhost:7039/api/Educations/GetById/${userID}`);
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
      const res = await axios.get(`https://localhost:7039/api/WorkExperiences/GetById/${userID}`);
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

    fetch(`https://localhost:7039/api/Users/Update`, {
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
      const response = await axios.post(`https://localhost:7039/api/Files/UploadProfile?userID=${userID}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.status === 200) {
        setMessages([{ tags: "success", text: "อัปโหลดรูปโปรไฟล์สำเร็จ!", className: "font-FontNoto" }]);
        setCurrentProfileImage(`https://localhost:7039/api/Files/GetProfileImage?userID=${userID}`);
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
      setNewExperience((prev) => ({ ...prev, [name]: value }));
    } else {
      const pattern = /^[ก-๙a-zA-Z\s]*$/;
      if (pattern.test(value) || value === "") {
        setNewExperience((prev) => ({ ...prev, [name]: value }));
      }
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

    if (newEducation.gpa < 0 || newEducation.gpa > 4) {
      setModalMessage("กรุณากรอกเกรดเฉลี่ยสะสมให้ถูกต้อง (0.00 - 4.00)");
      setIsModalOpen(true);
      return;
    }

    try {
      if (isEditing) {
        const updated = { ...educations[editIndex], ...newEducation };
        const res = await axios.put(
          `https://localhost:7039/api/Educations/Update/${updated.educationID}`,
          updated
        );
        const updatedList = educations.map((edu, i) => i === editIndex ? res.data : edu);
        setEducations(updatedList);
      } else {
        await axios.post("https://localhost:7039/api/Educations/Insert", {
          ...newEducation,
          userID,
        });
        fetchEducations();
      }

      setNewEducation({ level: "", institute: "", fieldOfStudy: "", year: "", gpa: "" });
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
        await axios.delete(`https://localhost:7039/api/Educations/Delete/${edu.educationID}`);
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
        await axios.put(`https://localhost:7039/api/WorkExperiences/Update/${updated.experienceID}`, updated);
        fetchExperiences();
      } else {
        await axios.post(`https://localhost:7039/api/WorkExperiences/Insert`, {
          userID,
          jobTitle: newExperience.jobTitle,
          companyName: newExperience.companyName,
          startDate: newExperience.startDate,
          endDate: newExperience.endDate,
          salary: newExperience.salary,
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
      await axios.delete(`https://localhost:7039/api/WorkExperiences/Delete/${experience.experienceID}`);
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
  const handleExportEducationPDF = () => {
    const docDefinition = {
      pageSize: 'A4',
      content: [
        {
          text: "การศึกษา",
          style: "header"
        },
        {
          table: {
            widths: ['*'],
            body: [
              ...educations.map((edu, i) => [
                [
                  {
                    stack: [
                      { text: `${i + 1}. ระดับ: ${levelLabels[edu.level]}`, style: "subHeader" },
                      { text: `สถาบัน: ${edu.institute}`, style: "detail" },
                      { text: `สาขา: ${edu.fieldOfStudy}`, style: "detail" },
                      { text: `ปี: ${edu.year}`, style: "detail" },
                      { text: `GPA: ${edu.gpa}`, style: "detail" },
                    ],
                    margin: [5, 5, 5, 5],
                  }
                ]
              ]),
            ],
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => "#bfbfbf",
            vLineColor: () => "#bfbfbf",
            paddingLeft: () => 5,
            paddingRight: () => 5,
            paddingTop: () => 5,
            paddingBottom: () => 5,
          },
        },
      ],
      styles: {
        header: { fontSize: 20, bold: true, alignment: "center", margin: [0, 0, 0, 10] },
        subHeader: { fontSize: 16, bold: true, margin: [0, 5, 0, 2] },
        detail: { fontSize: 14, margin: [0, 2, 0, 0] },
      },
      defaultStyle: { font: "THSarabunNew" },
    };

    pdfMake.createPdf(docDefinition).download('การศึกษา.pdf');
  };

  const handleExportExperiencePDF = () => {
    const docDefinition = {
      pageSize: 'A4',
      content: [
        {
          text: "ประสบการณ์ทำงาน",
          style: "header"
        },
        {
          table: {
            widths: ['*'],
            body: [
              ...experiences.map((exp, index) => [
                [
                  {
                    stack: [
                      { text: `${index + 1}. บริษัท: ${exp.companyName}`, style: "subHeader" },
                      { text: `ตำแหน่ง: ${exp.jobTitle}`, style: "detail" },
                      { text: `เงินเดือน: ${exp.salary} บาท`, style: "detail" },
                      { text: `ปีที่ทำงาน: ${exp.endDate ? `${exp.startDate} - ${exp.endDate}` : `${exp.startDate}`}`, style: "detail" },
                    ],
                    margin: [5, 5, 5, 5],
                  },
                ],
              ]),
            ],
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => "#bfbfbf",
            vLineColor: () => "#bfbfbf",
            paddingLeft: () => 5,
            paddingRight: () => 5,
            paddingTop: () => 5,
            paddingBottom: () => 5,
          },
        },
      ],
      styles: {
        header: { fontSize: 20, bold: true, alignment: "center", margin: [0, 0, 0, 10] },
        subHeader: { fontSize: 16, bold: true, margin: [0, 5, 0, 2] },
        detail: { fontSize: 14, margin: [0, 2, 0, 0] },
      },
      defaultStyle: { font: "THSarabunNew" },
    };

    pdfMake.createPdf(docDefinition).download("ประสบการณ์ทำงาน.pdf");
  };

  // ฟังก์ชันสร้าง PDF ด้วย PDFMake
  const handleExportProfilePDF = () => {
    const formattedDate = formatDateForDisplay(employee.JDate || "");
    console.log("วันที่แปลงแล้ว: ", formattedDate);

    // แปลงค่าเพศที่เลือกเป็นภาษาไทยสำหรับการแสดงใน PDF
    const roleText = roleMapping[employee.role] || "ไม่ระบุ";
    const genderText = employee.gender === "Male" ? "ชาย" : employee.gender === "Female" ? "หญิง" : "ไม่ระบุ";

    const docDefinition = {
      pageSize: 'A4', // ขนาดกระดาษ A4
      content: [
        {
          text: "โปรไฟล์พนักงาน",
          style: "header",
          alignment: "center"
        },
        {
          image: currentProfileImage, // ใส่ Base64 ที่แปลงมาแล้ว
          width: 150,
          height: 150,
          alignment: "center",
          margin: [0, 20, 0, 20]
        },
        {
          table: {
            widths: [150, '*'],
            body: [
              [{ text: "หัวข้อ", style: "tableHeader" }, { text: "ข้อมูล", style: "tableHeader" }],
              ["ชื่อ", employee.firstName || "-"],
              ["นามสกุล", employee.lastName || "-"],
              ["แผนกพนักงาน", roleText || "-"],
              ["ตำแหน่งพนักงาน", employee.designation || "-"],
              ["ติดต่อ", employee.contact || "-"],
              ["อีเมล", employee.email || "-"],
              ["วันที่เข้าร่วม", formattedDate || "-"],
              ["เพศ", genderText || "-"],
            ],
          },
          layout: {
            hLineWidth: function (i, node) {
              return 0.5; // ความหนาของเส้นขอบแนวนอน
            },
            vLineWidth: function (i, node) {
              return 0.5; // ความหนาของเส้นขอบแนวตั้ง
            },
            hLineColor: function (i, node) {
              return '#bfbfbf'; // สีเส้นขอบแนวนอน
            },
            vLineColor: function (i, node) {
              return '#bfbfbf'; // สีเส้นขอบแนวตั้ง
            },
          },
          margin: [40, 20, 40, 0],
        },
      ],
      styles: {
        header: {
          fontSize: 20,
          bold: true,
          margin: [0, 0, 0, 14],
        },
        tableHeader: {
          bold: true,
          fontSize: 16,
          color: "black",
          fillColor: null,
          alignment: "center",
        },
        tableContent: {
          fontSize: 16,
          bold: true,
          color: "black",
        },
      },
      defaultStyle: {
        font: "THSarabunNew",
      },
    };
    pdfMake.createPdf(docDefinition).download("โปรไฟล์ของฉัน.pdf");
  };



  return (
    <div className=" ">
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
            </h2>
            <p className="text-sm text-gray-600 font-FontNoto">
              {employee.designation || "ไม่ระบุตำแหน่ง"}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-white text-gray-800 px-3 py-1 rounded-full text-xs font-medium font-FontNoto border border-gray-300 shadow-sm">
                {roleMapping[employee.role] || "ไม่ระบุแผนก"}
              </span>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium font-FontNoto border border-green-300 shadow-sm">
                พนักงานประจำ
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

        {/* ปุ่มพิมพ์ข้อมูล */}
        <div className=" p-2 rounded-md inline-block">
          <button
            onClick={handleExportProfilePDF}
            className="btn btn-sm font-FontNoto !bg-white !text-indigo-800 border border-gray-400 hover:bg-gray-100 flex items-center gap-2"
          >
            <Printer size={16} />
            พิมพ์ข้อมูล
          </button>
        </div>
      </div>



      {/* แสดงข้อมูลเพิ่มเติม 4 ช่อง */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6 font-FontNoto">
        <div className="bg-white shadow rounded-xl p-4 text-center">
          <div className="flex flex-col items-center mb-2">
            <CalendarIcon size={24} className="text-indigo-600 mb-1" />
            <p className="text-sm text-gray-500 font-FontNoto">วันเริ่มงาน</p>
          </div>
          <p className="text-base font-bold text-indigo-800 font-FontNoto">{formatThaiDate(employee.JDate)}</p>
        </div>
        <div className="bg-white shadow rounded-xl p-4 text-center">
          <div className="flex flex-col items-center mb-2">
            <BriefcaseIcon size={24} className="text-green-700 mb-1" />
            <p className="text-sm text-gray-500 font-FontNoto">อายุการทำงาน</p>
          </div>
          <p className="text-base font-bold text-indigo-800 font-FontNoto">
            {calculateWorkDuration(employee.JDate)}
          </p>
        </div>

        <div className="bg-white shadow rounded-xl p-4 text-center">
          <div className="flex flex-col items-center mb-2">
            <ClockIcon size={24} className="text-yellow-600 mb-1" />
            <p className="text-sm text-gray-500 font-FontNoto">ชั่วโมงทำงาน</p>
          </div>
          <p className="text-base font-bold text-indigo-800 font-FontNoto">
            {getWorkingHoursThisMonth()} ชม./เดือน
          </p>
        </div>
        <div className="bg-white shadow rounded-xl p-4 text-center">
          <div className="flex flex-col items-center mb-2">
            <AwardIcon size={24} className="text-pink-600 mb-1" />
            <p className="text-sm text-gray-500 font-FontNoto">ผลประเมิน</p>
          </div>
          <p className="text-base font-bold text-indigo-800 font-FontNoto">ยังไม่มีการประเมิน</p>
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
          <div className="max-w-3xl mx-auto rounded-lg relative">
            {/* แสดงสถานะการโหลดข้อมูล */}
            {loading ? (
              <div className="text-center py-6">กำลังโหลดข้อมูล...</div>
            ) : error ? (
              <div className="alert alert-error">{error}</div>
            ) : (
              <>
                {/* ฟอร์มแสดงข้อมูล */}
                <div className="w-full bg-transparent rounded-xl p-3">
                  {messages.length > 0 &&
                    messages.map((message, index) => (
                      <div key={index} className={`alert alert-${message.tags} mb-4 ${message.className || ""}`}>
                        {message.text}
                      </div>
                    ))
                  }

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-FontNoto">
                      <div className="form-control font-FontNoto">
                        <label className="label">
                          <span className="label-text font-FontNoto">ชื่อ</span>
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          className="input font-FontNoto input-bordered"
                          placeholder="กรอกชื่อจริง"
                          value={employee.firstName}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="form-control font-FontNoto">
                        <label className="label">
                          <span className="label-text font-FontNoto">นามสกุล</span>
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          className="input font-FontNoto input-bordered"
                          placeholder="กรอกนามสกุล"
                          value={employee.lastName}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="form-control font-FontNoto">
                        <label className="label">
                          <span className="label-text font-FontNoto">แผนก</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered font-FontNoto"
                          value={roleMapping[employee.role] || "ไม่ระบุแผนก"}
                          readOnly
                        />
                      </div>

                      <div className="form-control font-FontNoto">
                        <label className="label">
                          <span className="label-text font-FontNoto">ตำแหน่ง</span>
                        </label>
                        <input
                          type="text"
                          name="designation"
                          className="input font-FontNoto input-bordered"
                          placeholder="กรอกตำแหน่งพนักงาน"
                          value={employee.designation}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="form-control font-FontNoto">
                        <label className="label">
                          <span className="label-text font-FontNoto">ติดต่อ</span>
                        </label>
                        <input
                          type="text"
                          name="contact"
                          className={`input font-FontNoto ${!/^\d{10}$/.test(employee.contact) && employee.contact !== '' ? 'border-red-500' : 'input-bordered'}`}
                          placeholder="กรอกข้อมูลการติดต่อ"
                          value={employee.contact}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow only numeric characters and limit to 10 digits
                            if (/^\d{0,10}$/.test(value)) {
                              handleChange(e); // Only call handleChange if the input is valid
                            }
                          }}
                        />
                        {!/^\d{10}$/.test(employee.contact) && employee.contact !== '' && (
                          <span className="text-red-500 text-sm mt-1 font-FontNoto">กรุณากรอกหมายเลขติดต่อ 10 หลัก</span>
                        )}
                      </div>

                      <div className="form-control font-FontNoto">
                        <label className="label">
                          <span className="label-text font-FontNoto">อีเมล</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          className={`input font-FontNoto ${!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email) && employee.email !== '' ? 'border-red-500' : 'input-bordered'}`}
                          placeholder="กรอกอีเมลของคุณ"
                          value={employee.email}
                          onChange={handleChange}
                        />
                        {!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email) && employee.email !== '' && (
                          <span className="text-red-500 text-sm mt-1 font-FontNoto">กรุณากรอกอีเมลให้ถูกต้อง</span>
                        )}
                      </div>

                      <div className="form-control font-FontNoto">
                        <label className="label">
                          <span className="label-text font-FontNoto">วันที่เริ่มงาน</span>
                        </label>
                        <input
                          type="date"
                          name="JDate"
                          className="input input-bordered font-FontNoto"
                          value={
                            employee.JDate
                          }
                          onChange={handleChange}
                          style={{
                            colorScheme: "light", // บังคับไอคอนให้ใช้โหมดสว่าง
                          }}
                        />

                      </div>
                      <div className="form-control font-FontNoto">
                        <label className="label">
                          <span className="label-text font-FontNoto">เพศ</span>
                        </label>
                        <select
                          name="gender"
                          className="select select-bordered font-FontNoto"
                          value={employee.gender}
                          onChange={handleChange}
                        >
                          <option className="font-FontNoto" value="None">กรุณาเลือกเพศ</option>
                          <option className="font-FontNoto" value="Male">ชาย</option>
                          <option className="font-FontNoto" value="Female">หญิง</option>
                        </select>
                      </div>
                      {isModalOpen && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                          <div className="bg-white p-6 rounded-lg shadow-lg">
                            <p className="text-lg font-FontNoto">{modalMessage}</p>
                            <div className="flex justify-end mt-4">
                              <button
                                className="btn btn-outline btn-primary"
                                onClick={() => setIsModalOpen(false)}
                              >
                                ตกลง
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                    <div className="flex w-full justify-end gap-4">
                      <button
                        type="submit"
                        className="btn btn-outline btn-success font-FontNoto"
                        style={{ flexBasis: "20%", flexShrink: 0 }}
                      >
                        ยืนยัน
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        </>
      )}
      {activeTab === "education" && (
        <>
          <div className="">

            {isModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fade-in">
                <div
                  className="bg-white p-6 rounded-2xl shadow-2xl w-96 relative transition-transform duration-300 ease-in-out transform scale-100"
                  data-aos="zoom-in"
                  data-aos-duration="500"
                  data-aos-easing="ease-in-out"
                >

                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-pink-600 font-FontNoto">
                      ⚡ แจ้งเตือน
                    </h3>
                    <button
                      onClick={handleCloseModal}
                      className="text-red-500 text-lg font-bold hover:scale-110 transition"
                    >
                      ❌
                    </button>
                  </div>

                  <div className="mb-4 text-gray-700 font-FontNoto">
                    {modalMessage}
                  </div>

                  <div className="flex justify-end gap-2">
                    {modalConfirmAction && (
                      <button
                        className="btn btn-outline btn-error font-FontNoto"
                        onClick={modalConfirmAction}
                      >
                        ยืนยัน
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="max-w-4xl mx-auto  rounded-lg p-6 relative">
              <form onSubmit={handleAddOrEditEducation} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-FontNoto">ระดับการศึกษา</span>
                    </label>
                    <select
                      name="level"
                      className="select select-bordered font-FontNoto"
                      value={newEducation.level}
                      onChange={handleChangeEducation}
                      required
                    >
                      <option className="font-FontNoto" value="">กรุณาเลือกระดับการศึกษา</option>
                      {Object.entries(levelLabels).map(([key, label]) => (
                        <option className="font-FontNoto" key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-FontNoto">ชื่อสถาบัน</span>
                    </label>
                    <input
                      type="text"
                      name="institute"
                      className="input font-FontNoto input-bordered"
                      placeholder="กรอกชื่อสถาบัน"
                      value={newEducation.institute}
                      onChange={handleChangeEducation}
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-FontNoto">สาขาวิชา</span>
                    </label>
                    <input
                      type="text"
                      name="fieldOfStudy"
                      className="input font-FontNoto input-bordered"
                      placeholder="กรอกสาขาวิชา"
                      value={newEducation.fieldOfStudy}
                      onChange={handleChangeEducation}
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-FontNoto">ปีที่ศึกษา</span>
                    </label>
                    <input
                      type="text"
                      name="year"
                      className="input input-bordered font-FontNoto"
                      placeholder="กรอกปีที่ศึกษา (ตัวอย่าง: 2567-2568)"
                      value={newEducation.year}
                      onChange={handleChangeEducation}
                      required
                      pattern="\d{4}-\d{4}" // บังคับรูปแบบ 4 ตัวเลข-4 ตัวเลข
                      title="กรอกปีในรูปแบบ 2567-2568"
                      inputMode="numeric" // บังคับเฉพาะตัวเลข
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-FontNoto">เกรดเฉลี่ยสะสม</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="gpa"
                      className="input input-bordered font-FontNoto"
                      placeholder="กรอกเกรดเฉลี่ยสะสม (สูงสุด 4.00)"
                      value={newEducation.gpa}
                      onChange={handleChangeEducation}
                      required
                      max="4.00"  // Restrict input to a maximum value of 4.00
                    />
                  </div>

                </div>
                <div className="relative mt-4 w-full">
                  <button
                    type="submit"
                    className="btn btn-outline btn-primary w-full font-FontNoto relative"
                  >
                    {isEditing ? "บันทึกการแก้ไข" : "เพิ่มการศึกษา"}
                  </button>
                </div>

              </form>

              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold font-FontNoto">ประวัติการศึกษา</h3>
                  <button
                    className="btn btn-outline btn-error font-FontNoto"
                    onClick={handleExportEducationPDF}
                  >
                    Export PDF
                  </button>
                </div>
                {educations.length === 0 ? (
                  <p className="text-gray-500 font-FontNoto">ไม่มีข้อมูลการศึกษา</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                      <thead>
                        <tr className="text-black text-center bg-blue-100 font-FontNoto">
                          {/* <th className="table-header font-FontNoto w-10">#</th> */}
                          <th className="table-header font-FontNoto w-80">สถาบัน</th>
                          <th className="table-header font-FontNoto w-40">ระดับ</th>
                          <th className="table-header font-FontNoto w-40">สาขา</th>
                          <th className="table-header font-FontNoto w-40">ปีที่ศึกษา</th>
                          <th className="table-header font-FontNoto w-10">GPA</th>
                          <th className="table-header font-FontNoto w-40">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {educations.map((edu, index) => (
                          <tr key={index}>
                            {/* <td className="table-header font-FontNoto">{index + 1}</td> */}
                            <td className="table-header font-FontNoto">{edu.institute}</td>
                            <td className="table-header font-FontNoto">{levelLabels[edu.level]}</td>
                            <td className="table-header font-FontNoto">{edu.fieldOfStudy}</td>
                            <td className="table-header font-FontNoto text-center">{edu.year}</td>
                            <td className="table-header font-FontNoto text-center">{edu.gpa}</td>
                            <td className="font-FontNoto text-center">
                              <div className="flex flex-col sm:flex-row justify-center items-center gap-2">
                                <button
                                  className="btn btn-xs btn-warning mr-2 font-FontNoto"
                                  onClick={() => handleEditEducation(index)}
                                >
                                  แก้ไข
                                </button>
                                <button
                                  className="btn btn-xs btn-error font-FontNoto"
                                  onClick={() => handleDeleteEducation(index)}
                                >
                                  ลบ
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </div>
        </>
      )}
      {activeTab === "experience" && (
        <>
          <div className="">

            {isModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fade-in">
                <div
                  className="bg-white p-6 rounded-2xl shadow-2xl w-96 relative transition-transform duration-300 ease-in-out transform scale-100"
                  data-aos="zoom-in"
                  data-aos-duration="500"
                  data-aos-easing="ease-in-out"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-pink-600 font-FontNoto">
                      ⚠️ แจ้งเตือน
                    </h3>
                    <button
                      onClick={closeModal}
                      className="text-red-500 text-lg font-bold hover:scale-110 transition"
                    >
                      ❌
                    </button>
                  </div>

                  <div className="mb-4 text-gray-700 font-FontNoto">
                    {modalMessage}
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      className="btn btn-outline btn-error font-FontNoto"
                      onClick={modalConfirmAction}
                    >
                      ยืนยัน
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="max-w-4xl mx-auto  rounded-lg p-6 relative">
              <form onSubmit={handleAddOrEditExperience} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-FontNoto">บริษัท</span>
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      className="input input-bordered font-FontNoto"
                      placeholder="กรอกชื่อบริษัท"
                      value={newExperience.companyName}
                      onChange={handleChangeExperience}
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-FontNoto">ตำแหน่ง</span>
                    </label>
                    <input
                      type="text"
                      name="jobTitle"
                      className="input input-bordered font-FontNoto"
                      placeholder="กรอกตำแหน่ง"
                      value={newExperience.jobTitle}
                      onChange={handleChangeExperience}
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-FontNoto">เงินเดือน</span>
                    </label>
                    <input
                      type="number"
                      name="salary"
                      className="input input-bordered font-FontNoto"
                      placeholder="กรอกเงินเดือน"
                      value={newExperience.salary}
                      onChange={handleChangeExperience}
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-FontNoto">ปี พ.ศ. เริ่มต้น</span>
                    </label>
                    <input
                      type="text"
                      name="startDate"
                      className={`input input-bordered font-FontNoto ${errors.startDate ? "border-red-500" : ""}`}
                      placeholder="กรอกปีที่ทำงาน"
                      value={newExperience.startDate}
                      onChange={handleChangeExperience}
                      required
                    />
                    {errors.startDate && <span className="text-red-500 text-sm font-FontNoto">{errors.startDate}</span>}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-FontNoto">ปี พ.ศ. สิ้นสุด</span>
                    </label>
                    <input
                      type="text"
                      name="endDate"
                      className={`input input-bordered font-FontNoto ${errors.endDate ? "border-red-500" : ""}`}
                      placeholder="กรอกปีสิ้นสุด (เว้นว่างหากยังทำงาน)"
                      value={newExperience.endDate}
                      onChange={handleChangeExperience}
                    />
                    {errors.endDate && <span className="text-red-500 text-sm font-FontNoto">{errors.endDate}</span>}
                  </div>
                </div>
                <div className="relative mt-4 w-full">
                  <button
                    type="submit"
                    className="btn btn-outline btn-primary w-full font-FontNoto relative"
                  >
                    {isEditing ? "บันทึกการแก้ไข" : "เพิ่มประสบการณ์"}
                  </button>
                </div>
              </form>

              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold font-FontNoto">ประวัติการทำงาน</h3>
                  <button
                    className="btn btn-outline btn-error font-FontNoto"
                    onClick={handleExportExperiencePDF}
                  >
                    Export PDF
                  </button>
                </div>
                {experiences.length === 0 ? (
                  <p className="text-gray-500 font-FontNoto">ไม่มีข้อมูลประสบการณ์ทำงาน</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table table-zebra w-full text-center">
                      <thead>
                        <tr className="text-black text-center bg-blue-100 font-FontNoto">
                          {/* <th className="table-header font-FontNoto">#</th> */}
                          <th className="table-header font-FontNoto">บริษัท</th>
                          <th className="table-header font-FontNoto">ตำแหน่ง</th>
                          <th className="table-header font-FontNoto">เงินเดือน</th>
                          <th className="table-header font-FontNoto">ปี พ.ศ.</th>
                          <th className="table-header font-FontNoto">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {experiences.map((exp, index) => (
                          <tr key={index}>
                            {/* <td className="table-header font-FontNoto">{index + 1}</td> */}
                            <td className="table-header font-FontNoto">{exp.companyName}</td>
                            <td className="table-header font-FontNoto ">{exp.jobTitle}</td>
                            <td className="table-header font-FontNoto text-center">{exp.salary} บาท</td>
                            <td className="table-header font-FontNoto text-center">
                              {exp.endDate ? `${exp.startDate}-${exp.endDate}` : exp.startDate}
                            </td>
                            <td className="font-FontNoto text-center">
                              <div className="flex flex-col sm:flex-row justify-center items-center gap-2">
                                <button
                                  className="btn btn-xs btn-warning font-FontNoto"
                                  onClick={() => handleEditExperience(index)}
                                >
                                  แก้ไข
                                </button>
                                <button
                                  className="btn btn-xs btn-error font-FontNoto"
                                  onClick={() => openModal(index)}
                                >
                                  ลบ
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Profile;
