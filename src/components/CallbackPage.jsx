import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CallbackPage = () => {
  const [status, setStatus] = useState("กำลังเชื่อมบัญชี LINE...");
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      const userID = parseInt(localStorage.getItem("userID") || "0", 10);

      if (userID === 0) {
        setStatus("ไม่พบข้อมูลผู้ใช้");
        return;
      }

      fetch("http://192.168.1.188/hrwebapi/api/Users/Callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          userID,
          redirectUri: "http://192.168.1.188/callback"
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("LINE link result:", data);

          // ✅ กรณี LINE บัญชีนี้ถูกใช้แล้วกับคนอื่น
          if (data.message === "LINE บัญชีนี้ถูกเชื่อมกับผู้ใช้อื่นแล้ว") {
            setStatus("บัญชี LINE นี้ถูกเชื่อมกับผู้ใช้งานคนอื่นแล้ว กรุณาใช้บัญชีอื่น");
            return;
          }

          if (data.message === "เชื่อมบัญชีสำเร็จแล้ว") {
            setStatus("เชื่อมบัญชี LINE สำเร็จแล้ว 🎉");
            navigate("/EmpHome/Workplan");
          } else {
            setStatus("เกิดข้อผิดพลาดในการเชื่อมบัญชี");
          }
        })
        .catch((error) => {
          console.error("Callback Error:", error);
          setStatus("ไม่สามารถเชื่อมบัญชีได้");
        });
    } else {
      setStatus("ไม่พบ code จาก LINE");
    }
  }, [navigate]);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>กำลังเชื่อมบัญชี LINE...</h2>
      <p>{status}</p>
    </div>
  );
};

export default CallbackPage;
