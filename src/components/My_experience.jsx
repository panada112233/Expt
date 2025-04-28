import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from 'react-router-dom';
import { pdfMake, font } from "../libs/pdfmake";


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
        `https://localhost:7039/api/WorkExperiences/GetById/${userID}`
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
    fetchExperiences();
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
          `https://localhost:7039/api/WorkExperiences/Update/${updatedExperience.experienceID}`,
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
          url: "https://localhost:7039/api/WorkExperiences/Insert",
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
          <strong>บริษัท:</strong> {experiences[index].companyName}
        </p>
        <p className="font-FontNoto">
          <strong>ตำแหน่ง:</strong> {experiences[index].jobTitle}
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
        `https://localhost:7039/api/WorkExperiences/Delete/${experience.experienceID}`
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
      
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <p className="text-center">{modalMessage}</p>
            <div className="flex justify-center mt-4">
              <button
                className="btn btn-outline btn-primary mx-2"
                onClick={modalConfirmAction}
              >
                ยืนยัน
              </button>
              <button
                className="btn btn-outline btn-error mx-2"
                onClick={closeModal}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold text-black font-FontNoto">ประสบการณ์ทำงาน</h2>
      <div className="max-w-4xl mx-auto  shadow-lg rounded-lg p-6 relative">
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
          <button type="submit" className="btn btn-warning w-full font-FontNoto">
            {isEditing ? "บันทึกการแก้ไข" : "เพิ่มประสบการณ์"}
          </button>
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
                        <button
                          className="btn btn-xs btn-warning mr-2 font-FontNoto"
                          onClick={() => handleEditExperience(index)}
                        >
                          แก้ไข
                        </button>

                        <button
                          className="btn btn-xs btn-error font-FontNoto"
                          onClick={() => openModal(index)} // เปิด modal ยืนยันการลบ
                        >
                          ลบ
                        </button>

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
