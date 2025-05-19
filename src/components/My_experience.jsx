import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from 'react-router-dom';
import { pdfMake, font } from "../libs/pdfmake";
import AOS from 'aos';
import 'aos/dist/aos.css';

function MyExperience() {
  const [experiences, setExperiences] = useState([]); // เก็บข้อมูลประสบการณ์
  const [newExperience, setNewExperience] = useState({
    userID: "",
    experienceID: "",
    companyName: "",
    jobTitle: "",
    startDate: "",
    endDate: "",
    description: "",
    salary: "",
  }); // เก็บข้อมูลใหม่
  const [errors, setErrors] = useState({
    startDate: "",
    endDate: "",
  }); // สถานะข้อผิดพลาด
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const userID = sessionStorage.getItem("userId") || "";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [experienceToDelete, setExperienceToDelete] = useState(null);
  const [modalMessage, setModalMessage] = useState("");  // ข้อความในป็อปอัพ
  const [modalConfirmAction, setModalConfirmAction] = useState(null);  // ฟังก์ชันการยืนยัน


  const fetchExperiences = async () => {
    if (!userID) {
      console.log("userID ไม่พบหรือไม่ถูกต้อง");
      return;
    }
    try {
      const response = await axios.get(
        `http://192.168.1.188/hrwebapi/api/WorkExperiences/GetById/${userID}`
      );
      if (response.status === 200) {
        console.log("ข้อมูลที่ได้จาก API:", response.data);
        setExperiences(response.data);
      }
    } catch (error) {
      console.error("Error fetching experiences:", error);
    }
  };

  // ดึงข้อมูลจาก API
  useEffect(() => {
    if (userID) {
      fetchExperiences();
    }

    AOS.init({
      duration: 1500,
      easing: 'ease-in-out',
    });
  }, [userID]);


  // ฟังก์ชันเพิ่ม/แก้ไขประสบการณ์
  const handleAddOrEditExperience = async (e) => {
    e.preventDefault();
    const newErrors = {
      startDate: newExperience.startDate.length !== 4 ? "กรุณากรอกปี พ.ศ. ให้ครบ 4 หลัก" : "",
      endDate: newExperience.endDate && newExperience.endDate.length !== 4 ? "กรุณากรอกปี พ.ศ. ให้ครบ 4 หลัก" : "",
    };

    setErrors(newErrors);

    // ตรวจสอบว่ามีข้อผิดพลาดหรือไม่
    if (newErrors.startDate || newErrors.endDate) {
      return;
    }

    try {
      if (isEditing) {
        const updatedExperience = { ...experiences[editIndex], ...newExperience };
        const response = await axios.put(
          `http://192.168.1.188/hrwebapi/api/WorkExperiences/Update/${updatedExperience.experienceID}`,
          updatedExperience
        );
        const updatedExperiences = experiences.map((exp, index) =>
          index === editIndex ? response.data : exp
        );
        setExperiences(updatedExperiences);
        setIsEditing(false);
        setEditIndex(null);
        fetchExperiences();
      } else {
        const data = JSON.stringify({
          userID: userID,
          jobTitle: newExperience.jobTitle,
          companyName: newExperience.companyName,
          startDate: newExperience.startDate,
          endDate: newExperience.endDate,
          salary: newExperience.salary,
        });

        const config = {
          method: "post",
          maxBodyLength: Infinity,
          url: "http://192.168.1.188/hrwebapi/api/WorkExperiences/Insert",
          headers: {
            "Content-Type": "application/json",
          },
          data: data,
        };

        const response = await axios.request(config);

        experiences.push({
          ...newExperience
        });

      }
      setNewExperience({
        companyName: "",
        jobTitle: "",
        startDate: "",
        endDate: "",
        description: "",
        salary: "",
      });
    } catch (error) {
      console.error("Error adding/updating experience:", error);
    }
  };

  // ฟังก์ชันจัดการการเปลี่ยนแปลงในฟอร์ม
  const handleChange = (e) => {
    const { name, value } = e.target;

    // เงื่อนไขสำหรับข้อมูลที่ไม่ต้องการตรวจสอบ (เช่น ตัวเลข)
    if (name === "salary" || name === "startDate" || name === "endDate") {
      setNewExperience((prev) => ({ ...prev, [name]: value }));
      return;
    }

    // เงื่อนไขสำหรับชื่อบริษัทและตำแหน่ง (ภาษาไทยและอังกฤษ)
    const thaiEnglishPattern = /^[ก-๙a-zA-Z\s]*$/;
    if (thaiEnglishPattern.test(value) || value === "") {
      setNewExperience((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ฟังก์ชันเริ่มแก้ไขประสบการณ์
  const handleEditExperience = (index) => {
    setNewExperience(experiences[index]);
    setIsEditing(true);
    setEditIndex(index);
  };
  const openModal = (index) => {
    setExperienceToDelete(experiences[index]);

    // สร้างข้อความด้วยการแยกแท็กที่เหมาะสม
    setModalMessage(
      <>
        <p className="font-FontNoto">
          คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?
        </p>
        <p className="font-FontNoto">
          <strong className="font-FontNoto">บริษัท:</strong> {experiences[index].companyName}
        </p>
        <p className="font-FontNoto">
          <strong className="font-FontNoto">ตำแหน่ง:</strong> {experiences[index].jobTitle}
        </p>
      </>
    );

    setModalConfirmAction(() => () => handleDeleteExperience(experiences[index])); // ตั้งค่าฟังก์ชันการยืนยันการลบ
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setExperienceToDelete(null);
  };
  // ฟังก์ชันลบประสบการณ์
  const handleDeleteExperience = async (experience) => {
    try {
      await axios.delete(
        `http://192.168.1.188/hrwebapi/api/WorkExperiences/Delete/${experience.experienceID}`
      );
      const updatedExperiences = experiences.filter(
        (exp) => exp.experienceID !== experience.experienceID
      );
      setExperiences(updatedExperiences);
      closeModal(); // ปิดป็อปอัพหลังจากลบ
    } catch (error) {
      console.error("Error deleting experience:", error);
    }
  };

  // ฟังก์ชัน Export PDF
  const handleExportPDF = () => {
    const docDefinition = {
      pageSize: 'A4',
      content: [
        {
          text: "ประสบการณ์ทำงาน",
          style: "header"
        },
        {
          table: {
            widths: ['*'], // ปรับความกว้างตารางให้ขยายตามเนื้อหา
            body: [
              ...experiences.map((exp, index) => [
                [
                  {
                    stack: [
                      {
                        text: `${index + 1}. บริษัท: ${exp.companyName}`,
                        style: "subHeader"
                      },
                      {
                        text: `ตำแหน่ง: ${exp.jobTitle}`,
                        style: "detail"
                      },
                      {
                        text: `เงินเดือน: ${exp.salary} บาท`,
                        style: "detail"
                      },
                      {
                        text: `ปีที่ทำงาน: ${exp.endDate ? `${exp.startDate} - ${exp.endDate}` : `${exp.startDate}`}`,
                        style: "detail"
                      },
                    ],
                    margin: [5, 5, 5, 5], // ระยะห่างด้านในของเซลล์
                  },
                ],
              ]),
            ],
          },
          layout: {
            hLineWidth: (i, node) => 0.5, // ความหนาเส้นขอบแนวนอน
            vLineWidth: (i, node) => 0.5, // ความหนาเส้นขอบแนวตั้ง
            hLineColor: (i, node) => "#bfbfbf", // สีเส้นขอบแนวนอน
            vLineColor: (i, node) => "#bfbfbf", // สีเส้นขอบแนวตั้ง
            paddingLeft: (i, node) => 5, // ระยะชิดด้านซ้าย
            paddingRight: (i, node) => 5, // ระยะชิดด้านขวา
            paddingTop: (i, node) => 5, // ระยะชิดด้านบน
            paddingBottom: (i, node) => 5, // ระยะชิดด้านล่าง
          },
        },
      ],
      styles: {
        header: {
          fontSize: 20,
          bold: true,
          alignment: "center",
          margin: [0, 0, 0, 10],
        },
        subHeader: {
          fontSize: 16,
          bold: true,
          margin: [0, 5, 0, 2],
        },
        detail: {
          fontSize: 14,
          margin: [0, 2, 0, 0],
        },
      },
      defaultStyle: {
        font: "THSarabunNew", // ใช้ฟอนต์ THSarabunNew
      },
    };


    pdfMake.createPdf(docDefinition).download("ประสบการณ์ทำงาน.pdf");
  };

  return (
    <div className="">
      <div className="w-full bg-gradient-to-r from-cyan-900 via-cyan-600 to-slate-500 text-white rounded-xl p-4 sm:p-5 md:p-6 mb-6 shadow-lg">
        <h1 className="text-xl sm:text-2xl font-bold font-FontNoto leading-snug">
        ประสบการณ์ทำงาน
        </h1>
        <p className="text-xs sm:text-sm mt-1 font-FontNoto">ตรวจสอบข้อมูลประสบการณ์ทำงาน</p>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fade-in">
          <div
            className="bg-white p-6 rounded-2xl shadow-2xl w-96 relative transition-transform duration-300 ease-in-out transform scale-100"
            data-aos="zoom-in"
            data-aos-duration="500"
            data-aos-easing="ease-in-out"
          >
            {/* 🎀 รูปการ์ตูนน่ารัก */}
            <img
              src="https://cdn-icons-png.flaticon.com/512/1828/1828665.png"
              alt="cute warning"
              className="w-12 h-12 absolute -top-6 left-4 rounded-full border-4 border-white shadow-lg bg-pink-100"
            />

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
              {/* <button
                className="btn btn-outline btn-primary font-FontNoto"
                onClick={closeModal}
              >
                ยกเลิก
              </button> */}
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
                onChange={handleChange}
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
                onChange={handleChange}
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
                onChange={handleChange}
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
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^[0-9]{0,4}$/.test(value)) {
                    setNewExperience((prev) => ({ ...prev, startDate: value }));
                  }
                }}
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
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^[0-9]{0,4}$/.test(value)) {
                    setNewExperience((prev) => ({ ...prev, endDate: value }));
                  }
                }}
              />
              {errors.endDate && <span className="text-red-500 text-sm font-FontNoto">{errors.endDate}</span>}
            </div>
          </div>
          <div className="relative mt-4 w-full">
            <img
              src="https://cdn-icons-png.flaticon.com/512/3377/3377466.png"
              alt="cute icon"
              className="w-8 h-8 absolute -top-3 -left-3 rotate-[-10deg]"
            />
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
              onClick={handleExportPDF}
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
  );
}

export default MyExperience;
