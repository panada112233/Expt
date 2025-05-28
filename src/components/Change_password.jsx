import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

function ChangePassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword1, setNewPassword1] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword1, setShowNewPassword1] = useState(false);
  const [showNewPassword2, setShowNewPassword2] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupVisible, setPopupVisible] = useState(false);
  const [isThaiOldPassword, setIsThaiOldPassword] = useState(false);
  const [isThaiNewPassword1, setIsThaiNewPassword1] = useState(false);
  const [isThaiNewPassword2, setIsThaiNewPassword2] = useState(false);


  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword1 !== newPassword2) {
      setPopupMessage("รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน!");
      setPopupVisible(true);
      return;
    }

    setLoading(true);

    const resetData = {
      oldPassword: oldPassword,
      newPassword: newPassword1,
    };

    try {
      const response = await axios.post(
        "https://192.168.1.188/hrwebapi/api/Users/ChangePassword",
        resetData,
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status === 200) {
        setPopupMessage(response.data.message || "เปลี่ยนรหัสผ่านสำเร็จ!");
        setPopupVisible(true);
        setOldPassword("");
        setNewPassword1("");
        setNewPassword2("");
        setTimeout(() => navigate("/"), 3000);
      }
    } catch (error) {
      setPopupMessage(
        error.response?.data?.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้!"
      );
      setPopupVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-100 via-white to-blue-200 px-4">
      {/* ข้อความหัวเรื่อง */}
      <h1 className="text-3xl md:text-4xl text-blue-700 font-FontInter p-6">
        THE EXPERTISE CO,LTD.
      </h1>

      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg space-y-6">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-blue-700 font-FontNoto">
          เปลี่ยนรหัสผ่าน
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* รหัสยืนยัน */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-FontNoto">
              รหัสยืนยันจากอีเมลของคุณ
            </label>
            <div className="relative">
              <input
                type={showOldPassword ? "text" : "password"}
                className={`input input-bordered w-full text-black bg-white font-FontNoto ${isThaiOldPassword ? "placeholder-red-500" : ""
                  }`}
                placeholder={
                  isThaiOldPassword ? "กรุณากรอกเป็นภาษาอังกฤษเท่านั้น" : "กรุณาระบุรหัสยืนยันจากอีเมล"
                }
                value={oldPassword}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^[^\u0E00-\u0E7F]*$/.test(value)) {
                    setOldPassword(value);
                    setIsThaiOldPassword(false);
                  }
                }}
                onBeforeInput={(e) => {
                  const char = e.data;
                  if (char && /[ก-๙]/.test(char)) {
                    e.preventDefault();
                    setIsThaiOldPassword(true);
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
                  <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          {/* รหัสผ่านใหม่ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-FontNoto">
              รหัสผ่านใหม่
            </label>
            <div className="relative">
              <input
                type={showNewPassword1 ? "text" : "password"}
                className={`input input-bordered w-full text-black bg-white font-FontNoto ${isThaiNewPassword1 ? "placeholder-red-500" : ""
                  }`}
                placeholder={
                  isThaiNewPassword1 ? "กรุณากรอกเป็นภาษาอังกฤษเท่านั้น" : "กรุณาระบุรหัสผ่านใหม่"
                }
                value={newPassword1}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^[^\u0E00-\u0E7F]*$/.test(value)) {
                    setNewPassword1(value);
                    setIsThaiNewPassword1(false);
                  }
                }}
                onBeforeInput={(e) => {
                  const char = e.data;
                  if (char && /[ก-๙]/.test(char)) {
                    e.preventDefault();
                    setIsThaiNewPassword1(true);
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
                  <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          {/* ยืนยันรหัสผ่านใหม่ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-FontNoto">
              ยืนยันรหัสผ่านใหม่
            </label>
            <div className="relative">
              <input
                type={showNewPassword2 ? "text" : "password"}
                className={`input input-bordered w-full text-black bg-white font-FontNoto ${isThaiNewPassword2 ? "placeholder-red-500" : ""
                  }`}
                placeholder={
                  isThaiNewPassword2 ? "กรุณากรอกเป็นภาษาอังกฤษเท่านั้น" : "กรุณายืนยันรหัสผ่านใหม่"
                }
                value={newPassword2}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^[^\u0E00-\u0E7F]*$/.test(value)) {
                    setNewPassword2(value);
                    setIsThaiNewPassword2(false);
                  }
                }}
                onBeforeInput={(e) => {
                  const char = e.data;
                  if (char && /[ก-๙]/.test(char)) {
                    e.preventDefault();
                    setIsThaiNewPassword2(true);
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
                  <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn w-full !bg-blue-500 hover:bg-blue-700 !text-white font-bold font-FontNoto"
            disabled={loading}
          >
            {loading ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
          </button>
        </form>
      </div>

      {/* Popup */}
      {popupVisible && (
        <dialog id="popup_modal" className="modal" open>
          <div className="modal-box">
            <p className="py-4 font-FontNoto">{popupMessage}</p>
          </div>
        </dialog>
      )}
    </div>
  );

}

export default ChangePassword;
