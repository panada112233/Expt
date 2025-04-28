import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import imgPath from "../assets/home.png";
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
        "https://localhost:7039/api/Users/ChangePassword",
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
    <div className="min-h-screen bg-gradient-to-r from-blue-100 via-white to-blue-200 flex flex-col md:flex-row items-center justify-center px-4 py-8 font-FontNoto">
      {/* รูปด้านซ้าย */}
      <div className="w-full md:w-1/2 flex justify-center mb-8 md:mb-0">
        <img
          src={imgPath}
          alt="Robot"
          className="w-[900px] md:w-[1000px] animate-bounce-slow"
        />
      </div>

      {/* กล่องฟอร์มด้านขวา */}
      <div className="w-full md:w-1/3 bg-white p-6 md:p-10 rounded-2xl shadow-lg space-y-5">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-blue-700 font-FontNoto">
          เปลี่ยนรหัสผ่าน
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* รหัสยืนยัน */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-FontNoto">
              รหัสยืนยัน
            </label>
            <div className="relative">
              <input
                type={showOldPassword ? "text" : "password"}
                className="input input-bordered w-full text-black bg-white font-FontNoto"
                placeholder="รหัสยืนยัน"
                value={oldPassword}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^[^\u0E00-\u0E7F]*$/.test(value)) {
                    setOldPassword(value);
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
                className="input input-bordered w-full text-black bg-white font-FontNoto"
                placeholder="รหัสผ่านใหม่"
                value={newPassword1}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^[^\u0E00-\u0E7F]*$/.test(value)) {
                    setNewPassword1(value);
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
                className="input input-bordered w-full text-black bg-white font-FontNoto"
                placeholder="ยืนยันรหัสผ่านใหม่"
                value={newPassword2}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^[^\u0E00-\u0E7F]*$/.test(value)) {
                    setNewPassword2(value);
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
            className="btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold font-FontNoto"
            disabled={loading}
          >
            {loading ? "กำลังบันทึก..." : "ยืนยัน"}
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
