// (เหมือนเดิม)
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import imgPath from '../assets/clock.png';
import AOS from 'aos';
import 'aos/dist/aos.css';


const LandingAfterLogin = () => {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [userName, setUserName] = useState('ผู้ใช้งาน');
    const [profileImage, setProfileImage] = useState(null);
    const [todayWorktime, setTodayWorktime] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalConfirmAction, setModalConfirmAction] = useState(null);

    const [location, setLocation] = useState('');
    const [leaveType, setLeaveType] = useState('');

    const userID = sessionStorage.getItem('userId');

    useEffect(() => {
        // ⏰ ตั้งเวลาอัปเดตนาฬิกา
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        // ✨ เรียก AOS.init() ตรงนี้ด้วย
        AOS.init({
            duration: 1000, // ความเร็ว animation
            once: true,     // เล่นแค่ครั้งเดียว
        });

        // 🧹 เคลียร์ interval ตอน component ถูกทำลาย (unmount)
        return () => clearInterval(interval);
    }, []);


    const fetchData = async (userId) => {
        try {
            const profileImgUrl = `https://localhost:7039/api/Files/GetProfileImage?userID=${userId}`;
            setProfileImage(profileImgUrl);

            const userRes = await axios.get(`https://localhost:7039/api/Users/Getbyid/${userId}`);
            const userData = userRes.data;
            setUserName(`${userData.firstName} ${userData.lastName}`);

            const today = new Date().toISOString().split("T")[0];
            const worktimeRes = await axios.get("https://localhost:7039/api/Worktime");
            const userWork = worktimeRes.data.find(item =>
                item.userID === parseInt(userId) && item.date.startsWith(today)
            );
            setTodayWorktime(userWork || {});
        } catch (error) {
            console.error("โหลดข้อมูลล้มเหลว:", error);
        }
    };

    useEffect(() => {
        if (userID) {
            fetchData(userID);
        }
    }, [userID]);

    const getAddressFromCoords = async (lat, lng) => {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=th`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            const address = data.address;
            if (!address) return 'ไม่พบที่อยู่';
            const road = address.road || '';
            const suburb = address.suburb || '';
            const district = address.city_district || address.district || '';
            const city = address.city || address.town || address.village || '';
            const state = address.state || '';
            const postcode = address.postcode || '';
            return [road, suburb, district, city, state, postcode].filter(part => part && part.trim() !== '').join(', ');
        } catch (error) {
            console.error('เกิดข้อผิดพลาดขณะดึงที่อยู่:', error);
            return 'เกิดข้อผิดพลาด';
        }
    };

    const handleCheckIn = () => {
        if (!location) {
            setModalMessage("กรุณาเลือกสถานที่ทำงานก่อนเช็คอิน");
            setModalConfirmAction(null);
            setModalOpen(true);
            return;
        }

        if (['ลาป่วย', 'ลากิจส่วนตัว'].includes(location) && !leaveType) {
            setModalMessage("กรุณาเลือกช่วงเวลาการลา");
            setModalConfirmAction(null);
            setModalOpen(true);
            return;
        }

        if (!navigator.geolocation) {
            setModalMessage("เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง");
            setModalConfirmAction(null);
            setModalOpen(true);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                const finalLocation =
                    ['ลากิจส่วนตัว', 'ลาป่วย'].includes(location)
                        ? `${location} - ${leaveType}`
                        : location === 'ลาบวช'
                            ? 'ลาบวช - เต็มวัน'
                            : location;

                const today = new Date().toLocaleDateString('th-TH', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                });

                const address = await getAddressFromCoords(latitude, longitude);

                const message = `วันที่: ${today}
สถานที่: ${finalLocation}
พิกัด: Lat: ${latitude}, Lng: ${longitude}
ที่อยู่: ${address}

คุณต้องการเช็คอินใช่หรือไม่?`;

                setModalMessage(message);
                setModalConfirmAction(() => async () => {
                    try {
                        const formData = new FormData();
                        formData.append('userID', userID);
                        formData.append('location', finalLocation);
                        formData.append('latitude', latitude);
                        formData.append('longitude', longitude);
                        formData.append('address', address);

                        await axios.post('https://localhost:7039/api/Worktime/CheckIn', formData);
                        setModalMessage("✅ เช็คอินสำเร็จ\nสถานที่ : " + finalLocation);
                        await fetchData(userID);
                    } catch (error) {
                        if (error.response && error.response.status === 400) {
                            const errorText = error.response.data;
                            if (errorText.includes("เช็คอินแล้วในวันนี้")) {
                                setModalMessage("มีการเช็คอินไปแล้วในวันนี้");
                            } else {
                                setModalMessage(errorText);
                            }
                        } else {
                            setModalMessage("เกิดข้อผิดพลาดขณะเช็คอิน");
                        }
                    }
                    setModalConfirmAction(null);
                    setModalOpen(true);
                });
                setModalOpen(true);
            },
            (error) => {
                setModalMessage(`ไม่สามารถระบุตำแหน่งได้: ${error.message}`);
                setModalConfirmAction(null);
                setModalOpen(true);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleCheckOut = () => {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();

        // ❌ ห้ามเช็คเอาท์ก่อนเวลา 17:30
        if (hour < 17 || (hour === 17 && minute < 30)) {
            setModalMessage("ไม่สามารถเช็คเอาท์ได้ก่อนเวลา 17:30");
            setModalConfirmAction(null);
            setModalOpen(true);
            return;
        }

        // ✅ แสดงป็อปอัปยืนยัน
        const today = now.toLocaleDateString('th-TH', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });

        const message = `📅 วันที่: ${today}
⏱ เวลา: ${now.toLocaleTimeString('th-TH', { hour12: false })}
    
คุณต้องการเช็คเอาท์ใช่หรือไม่?`;

        setModalMessage(message);
        setModalConfirmAction(() => async () => {
            try {
                const formData = new FormData();
                formData.append('userID', userID);

                await axios.post('https://localhost:7039/api/Worktime/CheckOut', formData);
                setModalMessage("✅ เช็คเอาท์เรียบร้อย");
                await fetchData(userID);
            } catch (error) {
                if (error.response && error.response.status === 400) {
                    setModalMessage(error.response.data);
                } else if (error.response && error.response.status === 404) {
                    setModalMessage("ยังไม่มีการเช็คอินวันนี้");
                } else {
                    setModalMessage("เกิดข้อผิดพลาดขณะเช็คเอาท์");
                }
            }
            setModalConfirmAction(null);
            setModalOpen(true);
        });

        setModalOpen(true);
    };

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-r from-blue-100 via-white to-blue-200">
            <div className="flex flex-col items-center justify-center flex-1 py-10">
                <div className="text-lg mb-2 text-blue-900 font-bold font-FontNoto">สวัสดี คุณ {userName}</div>
                <div className="text-lg mb-6 font-mono bg-white/70 px-4 py-2 rounded-full shadow-md font-bold">
                    ⏰ {currentTime.toLocaleTimeString('th-TH', { hour12: false })}
                </div>

                <div className="flex flex-wrap justify-center gap-6 sm:gap-10 bg-white p-4 sm:p-8 rounded-xl shadow-xl w-[80%] max-w-md sm:max-w-lg lg:max-w-2xl mx-auto">

                    {/* กล่องที่ 1: เวลาเข้า-ออกงาน */}
                    <div
                        data-aos="zoom-in"            // ใส่ AOS ตรงนี้
                        data-aos-duration="1200"      // ความช้า (ms) 1200 = 1.2 วิ
                        onClick={() => setModalOpen(true)}
                        className="bg-blue-300 hover:bg-blue-400 cursor-pointer text-black p-6 rounded-xl w-64 flex flex-col items-center shadow-lg transition-all duration-300"
                    >
                        <img src={imgPath} alt="clock" className="w-20 h-20 object-contain mb-4 animate-float-slow" />
                        <p className="font-bold text-md text-center font-FontNoto">เวลาเข้า-ออกงาน</p>
                        <div className="w-full text-left space-y-1 mt-2">
                            <p className="text-sm font-FontNoto">🕘 เช็คอิน: {todayWorktime?.checkIn || '-'}</p>
                            <p className="text-sm font-FontNoto">🕔 เช็คเอาท์: {todayWorktime?.checkOut || '-'}</p>
                            <p className="text-sm font-FontNoto">📍 สถานที่: {todayWorktime?.location || '-'}</p>
                        </div>
                    </div>

                    {/* กล่องที่ 2: Profile */}
                    <div
                        data-aos="zoom-in"            // ใส่ AOS ตรงนี้
                        data-aos-duration="1200"      // ความช้า (ms) 1200 = 1.2 วิ
                        onClick={() => navigate('/EmpHome/Workplan')}
                        className="bg-pink-300 hover:bg-pink-400 cursor-pointer text-black p-6 rounded-xl w-64 flex flex-col items-center shadow-lg transition-all duration-300"
                    >
                        <img
                            src={profileImage}
                            alt="profile"
                            className="w-20 h-20 rounded-full object-cover shadow-lg border-2 border-white"
                        />
                        <p className="font-bold text-md text-center font-FontNoto mt-3">{userName}</p>
                        <p className="text-sm text-center mt-2 font-FontNoto font-bold">เข้าสู่ระบบ EXPT</p>
                    </div>

                </div>

            </div>

            {modalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-96 relative transition-transform">
                        <img src="https://cdn-icons-png.flaticon.com/512/616/616408.png" alt="cute"
                            className="w-12 h-12 absolute -top-6 left-4 rounded-full border-4 border-white shadow-lg bg-pink-100" />
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-pink-600 font-FontNoto">บันทึกเวลา</h3>
                            <button
                                onClick={() => {
                                    setModalOpen(false);
                                    setModalMessage('');
                                    setModalConfirmAction(null); // ✅ เพิ่มด้วย
                                }}
                                className="text-red-500 text-lg font-bold"
                            >
                                ❌
                            </button>

                        </div>
                        {modalMessage ? (
                            <p className="text-gray-700 mb-4 whitespace-pre-wrap font-FontNoto">{modalMessage}</p>
                        ) : (
                            <>
                                {todayWorktime?.checkIn ? (
                                    // 🔒 เช็คอินแล้ว แสดงข้อความค้างไว้
                                    <div className="text-gray-600 font-FontNoto mb-4">
                                        เช็คอินแล้ววันนี้: {todayWorktime.checkIn}
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-3">
                                            <label className="block text-sm font-FontNoto mb-1">เลือกสถานที่ทำงาน</label>
                                            <select
                                                className="select select-bordered w-full font-FontNoto"
                                                value={location}
                                                onChange={(e) => {
                                                    setLocation(e.target.value);
                                                    setLeaveType('');
                                                }}
                                            >
                                                <option value="" disabled>-- กรุณาเลือก --</option>
                                                {[
                                                    'Office', 'WFH', 'Off-site (เข้าหน่วยงาน)', 'เช้า WFH บ่าย Office',
                                                    'ลาป่วย', 'ลากิจส่วนตัว', 'ลาพักร้อน', 'ลาคลอด', 'ลาบวช'
                                                ].map(place => (
                                                    <option className="font-FontNoto" key={place} value={place}>{place}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {['ลาป่วย', 'ลากิจส่วนตัว'].includes(location) && (
                                            <div className="mb-4">
                                                <label className="block text-sm font-FontNoto mb-1">เลือกช่วงเวลา</label>
                                                <select
                                                    className="select select-bordered w-full font-FontNoto"
                                                    value={leaveType}
                                                    onChange={(e) => setLeaveType(e.target.value)}
                                                >
                                                    <option value="" disabled>-- เลือกช่วงเวลา --</option>
                                                    <option className="font-FontNoto" value="เต็มวัน">เต็มวัน</option>
                                                    <option className="font-FontNoto" value="ครึ่งวันเช้า">ครึ่งวันเช้า</option>
                                                    <option className="font-FontNoto" value="ครึ่งวันบ่าย">ครึ่งวันบ่าย</option>
                                                </select>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* เช็คว่าเช็คเอาท์แล้วหรือยัง */}
                                {todayWorktime?.checkOut ? (
                                    <div className="text-green-700 font-FontNoto mb-2">
                                        เช็คเอาท์แล้วเวลา {todayWorktime.checkOut}
                                    </div>
                                ) : (
                                    <div className="flex justify-end gap-2">
                                        {!todayWorktime?.checkIn && (
                                            <button className="btn btn-success font-FontNoto" onClick={handleCheckIn}>เช็คอิน</button>
                                        )}
                                        {todayWorktime?.checkIn && (
                                            <button className="btn btn-warning font-FontNoto" onClick={handleCheckOut}>เช็คเอาท์</button>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        {modalConfirmAction && (
                            <div className="flex justify-end gap-2 mt-4">
                                <button className="btn btn-success font-FontNoto" onClick={modalConfirmAction}>ยืนยัน</button>
                                <button
                                    onClick={() => {
                                        setModalOpen(false);
                                        setModalMessage('');
                                        setModalConfirmAction(null); // ✅ เพิ่มบรรทัดนี้
                                    }}
                                    className="btn btn-outline font-FontNoto"
                                >
                                    ยกเลิก
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingAfterLogin;
