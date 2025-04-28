import React, { useState, useEffect } from "react";
import axios from "axios";

function ChangeProfilePicture() {
  const [profilePicture, setProfilePicture] = useState(null);
  const [currentProfileImage, setCurrentProfileImage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // const userObj = JSON.parse(sessionStorage.getItem("usersobj"));
  const userID = sessionStorage.getItem("userId") || ""; // ดึง userID จาก sessionStorage

  if (!userID) {
    return (
      <div className="alert alert-error font-FontNoto">
        ไม่พบข้อมูลผู้ใช้งาน โปรดเข้าสู่ระบบใหม่!
      </div>
    );
  }

  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        const response = await axios.get(`https://localhost:7039/api/Files/GetProfileImage?userID=${userID}`);
        if (response.status === 200 ) {
          const fullImageUrl = `https://localhost:7039/api/Files/GetProfileImage?userID=${userID}`;
          setCurrentProfileImage(fullImageUrl);
        } else {
          setMessages([{ tags: "error", text: "ไม่พบรูปโปรไฟล์ปัจจุบัน" }]);
        }
      } catch (error) {
        const errorMessage = error.response ? (error.response.data.Message || "ไม่สามารถโหลดรูปโปรไฟล์ได้") : "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์";
        setMessages([{ tags: "error", text: errorMessage }]);
      }
    };

    fetchProfileImage();
  }, [userID]);

  const handleFileChange = (e) => {
    setProfilePicture(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
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
        setMessages([{ tags: "success", text: "อัปโหลดรูปโปรไฟล์สำเร็จ!" }]);
        setCurrentProfileImage(`https://localhost:7039${response.data.filePath}`);
        setProfilePicture(null);
      }
    } catch (error) {
      console.error("API Error:", error.response ? error.response.data : error.message);
      setMessages([{ tags: "error", text: "เกิดข้อผิดพลาดในการอัปโหลดรูปโปรไฟล์!" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 ">
      <div className="max-w-3xl mx-auto  rounded-lg shadow-md relative">
        <h2 className="text-2xl font-bold text-center text-primary font-FontNoto my-4">เปลี่ยนรูปโปรไฟล์</h2>
        {messages.length > 0 &&
          messages.map((message, index) => (
            <div key={index} className={`alert alert-${message.tags} mb-4`}>
              {message.text}
            </div>
          ))}

        {currentProfileImage && (
          <div className="text-center mb-4 font-FontNoto">
            <img
              src={currentProfileImage}
              alt="โปรไฟล์ปัจจุบัน"
              className="rounded-lg w-48 h-48 object-cover mx-auto"
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-FontNoto">เลือกรูปโปรไฟล์ใหม่</span>
            </label>
            <input
              type="file"
              className="file-input file-input-bordered w-full font-FontNoto"
              onChange={handleFileChange}
              accept="image/*"
              required
            />
          </div>

          {profilePicture && (
            <div className="mt-4 text-center">
              <img
                src={URL.createObjectURL(profilePicture)}
                alt="Profile Preview"
                className="rounded-lg w-40 h-40 object-cover mx-auto"
              />
            </div>
          )}

          <div className="form-control mt-6 font-FontNoto">
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? "กำลังอัปโหลด..." : "ยืนยัน"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangeProfilePicture;
