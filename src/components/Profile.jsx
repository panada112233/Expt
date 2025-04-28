import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from 'react-router-dom';
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

  // return `${day}-${month}-${year}`; // คืนค่าในรูปแบบ DD-MM-YYYY
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
  const userID = sessionStorage.getItem("userId") || ""; // ดึง userID จาก sessionStorage


  // ฟังก์ชันแปลง URL เป็น Base64
  const convertToBase64 = async (imageUrl) => {
    try {
      // ดึงข้อมูลรูปภาพเป็น blob (binary large object)
      const response = await axios.get(imageUrl, { responseType: 'blob' });
      const imageBlob = response.data;

      // ใช้ FileReader เพื่อแปลง blob เป็น Base64
      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onloadend = () => {
          resolve(reader.result); // เมื่อแปลงเสร็จแล้วให้ส่งค่าที่แปลงเป็น Base64
        };

        reader.onerror = reject; // ถ้ามีข้อผิดพลาดในการแปลงให้ reject

        reader.readAsDataURL(imageBlob); // แปลง Blob เป็น Base64
      });
    } catch (error) {
      console.error("Error converting image to Base64: ", error);
      return null; // คืนค่า null ถ้าแปลงไม่สำเร็จ
    }
  };

  // ดึงข้อมูลโปรไฟล์เมื่อ Component ถูกโหลด
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
    setProfilePicture(e.target.files[0]);
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
        setCurrentProfileImage(`https://localhost:7039${response.data.filePath}`);
        setProfilePicture(null);
      }
    } catch (error) {
      console.error("API Error:", error.response ? error.response.data : error.message);
      setMessages([{ tags: "error", text: "เกิดข้อผิดพลาดในการอัปโหลดรูปโปรไฟล์!", className: "font-FontNoto" }]);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันสร้าง PDF ด้วย PDFMake
  const handleExportPDF = () => {
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
          alignment: "center" // จัดข้อความให้อยู่ตรงกลางแนวนอน
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
            widths: [150, '*'], // คอลัมน์แรกความกว้างคงที่ 150px, คอลัมน์สองปรับขนาดอัตโนมัติ
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
          margin: [40, 20, 40, 0], // ชิดขอบซ้าย-ขวา และมีระยะห่างด้านบน
        },
      ],
      styles: {
        header: {
          fontSize: 20,
          bold: true,
          margin: [0, 0, 0, 14], // ระยะห่างด้านล่างหัวข้อ
        },
        tableHeader: {
          bold: true,
          fontSize: 16,
          color: "black", // สีข้อความของ header ตาราง
          fillColor: null, // ไม่มีสีพื้นหลัง
          alignment: "center",
        },
        tableContent: {
          fontSize: 16, // ขนาดฟ้อนต์ในตาราง
          bold: true, // ตัวหนา
          color: "black", // สีตัวอักษรดำ
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

      <h2 className="text-2xl font-bold text-black font-FontNoto">โปรไฟล์ของฉัน</h2>
      <div className="max-w-3xl mx-auto rounded-lg shadow-md relative">
        {/* แสดงสถานะการโหลดข้อมูล */}
        {loading ? (
          <div className="text-center py-6">กำลังโหลดข้อมูล...</div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : (
          <>
            {/* ฟอร์มแสดงข้อมูล */}
            <div className="p-6">
              {messages.length > 0 &&
                messages.map((message, index) => (
                  <div key={index} className={`alert alert-${message.tags} mb-4 ${message.className || ""}`}>
                    {message.text}
                  </div>
                ))
              }
              {currentProfileImage && (
                <div className="flex items-center justify-between mb-4 font-FontNoto">
                  {/* รูปโปรไฟล์ */}
                  <img
                    src={currentProfileImage}
                    alt="โปรไฟล์ปัจจุบัน"
                    className="rounded-lg w-48 h-48 object-cover"
                  />
                </div>
              )}
              {/* ฟอร์ม */}
              <form onSubmit={handleProfileSubmit} className="">
                {/* ช่องเลือกไฟล์ */}
                <input
                  type="file"
                  className="file-input file-input-bordered file-input-sm font-FontNoto mb-2"
                  onChange={handleFileChange}
                  accept="image/*"
                  required
                  style={{ width: '30%' }}
                />
                <span>&nbsp;</span>
                {/* แสดงตัวอย่างไฟล์ */}
                {profilePicture && (
                  <div className="mt-4">
                    <img
                      src={URL.createObjectURL(profilePicture)}
                      alt="Profile Preview"
                      className="rounded-lg w-32 h-32 object-cover"
                    />
                  </div>
                )}
                {/* ปุ่มยืนยัน */}
                <button type="submit" className="btn btn-active btn-sm font-FontNoto" disabled={loading}>
                  {loading ? "กำลังอัปโหลด..." : "อัปโหลด"}
                </button>
              </form>
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
                  {/* <div className="form-control font-FontNoto">
                    <label className="label">
                      <span className="label-text font-FontNoto">แผนก</span>
                    </label>
                    <select
                      name="role"
                      className="select select-bordered font-FontNoto"
                      value={employee.role}
                      onChange={handleChange}
                    >
                      <option className="font-FontNoto" value="">กรุณาเลือกแผนก</option>
                      <option className="font-FontNoto" value="Hr">ทรัพยากรบุคคล</option>
                      <option className="font-FontNoto" value="GM">ผู้จัดการทั่วไป</option>
                      <option className="font-FontNoto" value="Dev">นักพัฒนาระบบ</option>
                      <option className="font-FontNoto" value="BA">นักวิเคราะห์ธุรกิจ</option>
                      <option className="font-FontNoto" value="Employee">พนักงาน</option>
                    </select>
                  </div> */}
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
                  <button
                    type="button"
                    onClick={handleExportPDF}
                    className="btn btn-outline btn-error font-FontNoto"
                    style={{ flexBasis: "20%", flexShrink: 0 }}
                  >
                    Export PDF
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Profile;
