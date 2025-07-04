import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import imgPath from '../assets/schedule.png';
import imgPat from '../assets/clock1.png';
import remove from '../assets/remove.png';
import AOS from 'aos';
import 'aos/dist/aos.css';

const LandingAfterLogin = () => {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [userName, setUserName] = useState('ผู้ใช้งาน');
    const [worktimes, setWorktimes] = useState([]);
    const [profileImage, setProfileImage] = useState(null);
    const [todayWorktime, setTodayWorktime] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalConfirmAction, setModalConfirmAction] = useState(null);
    const [simpleModal, setSimpleModal] = useState(false);
    const [loadingFullScreen, setLoadingFullScreen] = useState(false);
    const [leaveType, setLeaveType] = useState("");
    const [location, setLocation] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [todayLeave, setTodayLeave] = useState(null);
    const [showLeaveForm, setShowLeaveForm] = useState(false);

    const userID = sessionStorage.getItem('userId');

    const generateLeaveDates = (start, end) => {
        const dates = [];
        let currentDate = new Date(start);
        const lastDate = new Date(end);

        if (isNaN(currentDate.getTime()) || isNaN(lastDate.getTime())) {
            return [];
        }

        while (currentDate <= lastDate) {
            dates.push(new Date(currentDate)); // clone
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dates;
    };
    const getNextLeaveInfo = () => {
        const leaveKeywords = ['ป่วย', 'กิจส่วนตัว', 'บวช', 'พักร้อน', 'ลาคลอด'];

        const sortedLeaveDates = worktimes
            .filter(item =>
                item.userID === parseInt(userID) &&
                item.date &&
                item.location &&
                leaveKeywords.some(keyword => item.location.includes(keyword))
            )
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (sortedLeaveDates.length === 0) return null;

        const leaveRanges = [];
        let currentRange = [sortedLeaveDates[0]];

        for (let i = 1; i < sortedLeaveDates.length; i++) {
            const currentDate = new Date(sortedLeaveDates[i].date);
            const prevDate = new Date(sortedLeaveDates[i - 1].date);

            const diffDays = Math.ceil((currentDate - prevDate) / (1000 * 60 * 60 * 24));
            const sameLocation = sortedLeaveDates[i].location === sortedLeaveDates[i - 1].location;

            if (diffDays === 1 && sameLocation) {
                currentRange.push(sortedLeaveDates[i]);
            } else {
                leaveRanges.push([...currentRange]);
                currentRange = [sortedLeaveDates[i]];
            }
        }
        leaveRanges.push([...currentRange]);

        const today = new Date().setHours(0, 0, 0, 0);
        const now = new Date();

        for (const range of leaveRanges) {
            for (const item of range) {
                const leaveDate = new Date(item.date).setHours(0, 0, 0, 0);
                const leaveType = item.location?.split('|')[1]?.trim(); // เช่น "ครึ่งวันเช้า", "เต็มวัน"

                if (leaveDate >= today) {
                    if (leaveDate === today && leaveType === 'ครึ่งวันเช้า' && now.getHours() >= 12) {
                        continue;
                    }

                    return {
                        startDate: range[0].date,
                        endDate: range[range.length - 1].date,
                        location: range[0].location
                    };
                }
            }
        }

        return null;
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        AOS.init({
            duration: 500,
            once: true,
        });
        return () => clearInterval(interval);
    }, []);

    const fetchData = async (userId) => {
        try {
            const profileImgUrl = `https://192.168.1.188/hrwebapi/api/Files/GetProfileImage?userID=${userId}`;
            setProfileImage(profileImgUrl);

            const userRes = await axios.get(`https://192.168.1.188/hrwebapi/api/Users/Getbyid/${userId}`);
            const userData = userRes.data;
            setUserName(`${userData.firstName} ${userData.lastName}`);
            const today = new Date().toISOString().split("T")[0];
            const worktimeRes = await axios.get("https://192.168.1.188/hrwebapi/api/Worktime");
            setWorktimes(worktimeRes.data);
            const userWorktimes = worktimeRes.data.filter(item => item.userID === parseInt(userId));
            const userWork = userWorktimes.find(item =>
                item.date.startsWith(today)
            );
            setTodayWorktime(userWork || {});
            const leaveKeywords = ['ป่วย', 'กิจส่วนตัว', 'บวช', 'พักร้อน', 'ลาคลอด'];
            const todayLeaveData = userWorktimes.find(item => {
                if (item.date !== today) return false;
                const loc = item.location?.toLowerCase().replace(/\s/g, '') || '';
                return leaveKeywords.some(keyword =>
                    loc.includes(keyword.toLowerCase().replace(/\s/g, ''))
                );
            });
            setTodayLeave(todayLeaveData || null);
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

            return 'เกิดข้อผิดพลาด';
        }
    };
    const leaveKeywords = ['ป่วย', 'กิจส่วนตัว', 'บวช', 'พักร้อน', 'ลาคลอด'];
    const leaveDates = worktimes
        .filter(item => {
            if (!item.date || !item.location) return false;

            const loc = item.location.toLowerCase().replace(/\s/g, ''); // 🔁 ตัดช่องว่างทั้งหมด
            return leaveKeywords.some(keyword =>
                loc.includes(keyword.toLowerCase().replace(/\s/g, ''))
            );
        })
        .map(item => new Date(item.date).toISOString().split("T")[0])
        .sort();

    const isTodayLeaveFullDay = () => {
        const todayISO = new Date().toISOString().split("T")[0];

        const todayLeave = worktimes.find(item =>
            item.userID === parseInt(userID) &&
            item.date.startsWith(todayISO) &&
            item.location?.includes("เต็มวัน")
        );

        return !!todayLeave;
    };

    const handleCheckIn = () => {
        if (!location) {
            setModalMessage("กรุณาเลือกสถานที่ทำงานก่อนเช็คอิน");
            setModalConfirmAction(null);
            setModalOpen(true);
            return;
        }

        if (isTodayLeaveFullDay()) {
            setModalMessage("เราทำการลาให้คุณเรียบร้อยแล้ว");
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
                        ? `${location} | ${leaveType}`
                        : location === 'ลาบวช'
                            ? 'ลาบวช | เต็มวัน'
                            : location;

                const today = new Date().toLocaleDateString('th-TH', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                });

                const address = await getAddressFromCoords(latitude, longitude);
                const message = (
                    <p className="whitespace-pre-wrap font-FontNoto text-gray-700">
                        <strong className="font-FontNoto">วันที่ :</strong> {today}
                        {"\n"}
                        <strong className="font-FontNoto">ประเภทการทำงาน :</strong> {finalLocation}
                        {"\n"}
                        <strong className="font-FontNoto">สถานที่ :</strong> {address}
                        {"\n\n"}
                        <strong className="font-FontNoto">คุณต้องการลงเวลาเข้างานหรือไม่?</strong>
                    </p>
                );

                setModalMessage(message);
                setModalConfirmAction(() => async () => {
                    try {
                        const formData = new FormData();
                        formData.append('userID', userID);
                        formData.append('location', finalLocation);
                        formData.append('latitude', latitude);
                        formData.append('longitude', longitude);
                        formData.append('address', address);

                        await axios.post('https://192.168.1.188/hrwebapi/api/Worktime/CheckIn', formData);

                        setModalMessage(
                            <div className="flex flex-col items-center justify-center text-center">
                                <img src={imgPat} alt="clock1" className="w-8 h-8 mb-2" />
                                <strong className="font-FontNoto">คุณลงเวลาเข้างานเรียบร้อยแล้ว</strong>
                            </div>
                        );

                        setSimpleModal(true);
                        setModalOpen(true);
                        setTimeout(() => {
                            setModalOpen(false);
                            setModalMessage('');
                            setModalConfirmAction(null);
                            setSimpleModal(false);
                        }, 3000);

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

    const formatThaiDate = (dateStr) => {
        const monthsThai = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
            "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
        const d = new Date(dateStr);
        return `${d.getDate()} ${monthsThai[d.getMonth()]} ${d.getFullYear() + 543}`;
    };

    const leaveRange = leaveDates.length > 0
        ? `${formatThaiDate(leaveDates[0])} - ${formatThaiDate(leaveDates[leaveDates.length - 1])}`
        : new Date().toLocaleDateString('th-TH', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });

    const handleCheckOut = async () => {
        try {
            const formData = new FormData();
            formData.append('userID', userID);
            const response = await axios.post('https://192.168.1.188/hrwebapi/api/Worktime/CheckOut', formData);

            setModalMessage(
                <div className="flex flex-col items-center justify-center text-center">
                    <img src={imgPat} alt="clock1" className="w-8 h-8 mb-2" />
                    <strong className="font-FontNoto">คุณเช็คเอาท์เรียบร้อยแล้ว</strong>
                </div>
            );

            setSimpleModal(true);
            setModalOpen(true);
            setTimeout(() => {
                setModalOpen(false);
                setModalMessage('');
                setModalConfirmAction(null);
                setSimpleModal(false);
            }, 3000);

            await fetchData(userID);
        } catch (error) {
            if (error.response && error.response.status === 400) {
                const errorText = error.response.data;
                if (errorText.includes("เช็คเอาท์ไปแล้ว")) {
                    setModalMessage("คุณได้เช็คเอาท์ไปแล้ว");
                } else {
                    setModalMessage(errorText);
                }
            } else {
                setModalMessage("เกิดข้อผิดพลาดขณะเช็คเอาท์");
            }
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-r from-blue-100 via-white to-blue-200">
            <div className="flex flex-col items-center justify-center flex-1 py-10">
                <div className="text-xl mb-2 text-blue-900 font-bold font-FontNoto">สวัสดี คุณ {userName}</div>
                <div className="text-lg mb-6 bg-white/70 px-4 py-2 rounded-full shadow-md font-bold flex items-center space-x-2 font-FontInter">
                    <img src={imgPat} alt="clock1" className="w-8 h-8" />
                    <span className="font-FontNoto text-black">{currentTime.toLocaleTimeString('th-TH', { hour12: false })}</span>
                </div>
                <div className="flex flex-wrap justify-center gap-6 sm:gap-10 bg-bg-transparent  p-4 sm:p-8 rounded-xl w-[80%] max-w-md sm:max-w-lg lg:max-w-2xl mx-auto">
                    <div
                        data-aos="zoom-in"
                        data-aos-duration="1200"
                        onClick={() => setModalOpen(true)}
                        className="relative group cursor-pointer p-6 rounded-xl w-64 shadow-lg transition-all duration-300 overflow-hidden bg-white"
                    >
                        <div className="circle absolute h-20 w-20 -top-10 -right-10 rounded-full bg-green-200 group-hover:scale-[800%] duration-500 z-[-1]"></div>
                        <div className="flex items-center justify-center mb-4">
                            <img src={imgPath} alt="clock" className="w-20 h-20 object-contain animate-float-slow z-10" />
                        </div>
                        <h1 className="font-bold text-md text-center font-FontNoto group-hover:text-black duration-500 z-10 text-black">
                            {todayLeave
                                ? `วันนี้ลา: ${todayLeave.location?.split('|')[0]?.trim() || ''} (${todayLeave.location?.split('|')[1]?.trim() || ''})`
                                : 'เวลาเข้า-ออกงาน'}
                        </h1>

                    </div>
                    <div
                        data-aos="zoom-in"
                        data-aos-duration="1200"
                        onClick={() => {
                            setLoadingFullScreen(true);
                            setTimeout(() => {
                                navigate('/EmpHome/Workplan');
                            }, 2000);
                        }}
                        className="relative group cursor-pointer p-6 rounded-xl w-64 shadow-lg transition-all duration-300 overflow-hidden bg-white flex flex-col items-center justify-center"
                    >
                        <div className="circle absolute h-20 w-20 -top-10 -right-10 rounded-full bg-blue-300 group-hover:scale-[800%] duration-500 z-[-1]"></div>
                        <img
                            src={profileImage}
                            alt="profile"
                            className="w-20 h-20 rounded-full object-cover shadow-lg border-2 border-white mb-2 z-10"
                        />
                        <h1 className="font-bold text-md text-center font-FontNoto group-hover:text-black duration-500 z-10 text-black">
                            เข้าสู่ระบบ EXPT
                        </h1>
                    </div>
                </div>
            </div>

            {modalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fade-in">
                    <div
                        className="bg-white p-6 rounded-2xl shadow-2xl w-96 relative transition-transform"
                        data-aos-duration="500"
                        data-aos="zoom-in"
                    >
                        {!simpleModal && (
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    <img src={imgPat} alt="clock1" className="w-5 h-5" />
                                    <h3 className="text-lg font-bold text-cyan-950 font-FontNoto">
                                        {todayWorktime?.checkIn && todayWorktime?.checkOut
                                            ? 'ลงเวลาเข้า-เลิกงาน'
                                            : todayWorktime?.checkIn
                                                ? 'ลงเวลาเลิกงาน'
                                                : 'ลงเวลาเข้างาน'}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => {
                                        setModalOpen(false);
                                        setModalMessage('');
                                        setModalConfirmAction(null);
                                        setSimpleModal(false);
                                    }}
                                    className="text-red-500 text-lg font-bold"
                                >
                                    <img src={remove} alt="remove" className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        {(() => {
                            const nextLeave = getNextLeaveInfo();
                            const nextLeaveDate = nextLeave ? new Date(nextLeave.startDate).setHours(0, 0, 0, 0) : null;
                            const today = new Date().setHours(0, 0, 0, 0);
                            const leaveType = nextLeave?.location?.split('|')[1]?.trim() || '';

                            if (modalMessage) {
                                return (
                                    <p className="text-gray-700 mb-4 whitespace-pre-wrap font-FontNoto">{modalMessage}</p>
                                );
                            }
                            if (
                                nextLeaveDate === today &&
                                leaveType === 'ครึ่งวันเช้า' &&
                                todayWorktime?.checkIn
                            ) {
                                return (
                                    <>
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <img src={imgPat} alt="clock1" className="w-8 h-8 mb-2" />
                                            <strong className="font-FontNoto">คุณลงเวลาเข้างานเรียบร้อยแล้ว</strong>
                                        </div>
                                    </>
                                );
                            }
                            if (
                                nextLeaveDate === today &&
                                leaveType === 'ครึ่งวันบ่าย' &&
                                todayWorktime?.checkIn &&
                                !todayWorktime?.checkOut
                            ) {
                                return (
                                    <>
                                        <div className="text-blue-600 font-FontNoto mb-4 font-bold">
                                            เช็คอินแล้ววันนี้: {todayWorktime.checkIn}
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={handleCheckOut}
                                                className="relative rounded-full bg-red-500 px-4 py-2 font-FontNoto text-white font-bold transition-colors duration-300 ease-linear 
before:absolute before:right-1/2 before:top-1/2 before:-z-[1] 
before:h-3/4 before:w-2/3 before:origin-bottom-left before:-translate-y-1/2 
before:translate-x-1/2 before:animate-ping before:rounded-full 
before:bg-red-500 hover:bg-red-700 hover:before:bg-red-700"
                                            >
                                                ลงเวลาเลิกงาน
                                            </button>
                                        </div>
                                    </>
                                );
                            }
                            if (todayLeave) {
                                return (
                                    <div className="text-red-600 font-FontNoto mb-4 font-bold">
                                        วันนี้คุณได้ลาไว้แล้ว<br />
                                        <span className="text-gray-700 text-sm font-FontNoto">
                                            ประเภทการลา: {todayLeave.location?.split('|')[0]?.trim() || todayLeave.location || '-'}<br />
                                            {todayLeave.location?.includes('|') && (
                                                <>ช่วงเวลา: {todayLeave.location?.split('|')[1]?.trim() || '-'}</>
                                            )}
                                        </span>
                                    </div>
                                );
                            }
                            if (nextLeave) {
                                return (
                                    <div className="text-red-600 font-FontNoto mb-4 font-bold">
                                        <div className="font-FontNoto">
                                            ลางานล่วงหน้า วันที่ {formatThaiDate(nextLeave.startDate)} - {formatThaiDate(nextLeave.endDate)}
                                        </div>
                                        <p className="text-gray-600 text-sm mt-1 font-FontNoto">
                                            ประเภทการลา: {nextLeave.location?.split('|')[0]?.replace('ลา', '').trim() || '-'}<br />
                                            ช่วงเวลา: {leaveType}
                                        </p>
                                    </div>
                                );
                            }
                            if (todayWorktime?.checkIn) {
                                return (
                                    <>
                                        <div className="text-blue-600 font-FontNoto mb-4 font-bold">
                                            เช็คอินแล้ววันนี้: {todayWorktime.checkIn}
                                            {todayWorktime?.checkOut && (
                                                <div className="text-red-700 mt-2 font-FontNoto">
                                                    เช็คเอาท์แล้วเวลา {todayWorktime.checkOut}
                                                </div>
                                            )}
                                        </div>

                                        {!todayWorktime?.checkOut && (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={handleCheckOut}
                                                    className="relative rounded-full bg-red-500 px-4 py-2 font-FontNoto text-white font-bold transition-colors duration-300 ease-linear 
before:absolute before:right-1/2 before:top-1/2 before:-z-[1] 
before:h-3/4 before:w-2/3 before:origin-bottom-left before:-translate-y-1/2 
before:translate-x-1/2 before:animate-ping before:rounded-full 
before:bg-red-500 hover:bg-red-700 hover:before:bg-red-700"
                                                >
                                                    ลงเวลาเลิกงาน
                                                </button>
                                            </div>
                                        )}
                                    </>
                                );
                            }
                            return (
                                <>
                                    <div className="mb-3">
                                        <label className="block text-sm font-FontNoto mb-1 text-black">ประเภทการทำงาน</label>
                                        <select
                                            className="select select-bordered w-full font-FontNoto !bg-white text-black"
                                            value={location}
                                            onChange={(e) => {
                                                const selected = e.target.value;
                                                setLocation(selected);

                                                if (['ลาพักร้อน', 'ลาคลอด', 'ลาบวช'].includes(selected)) {
                                                    setLeaveType('เต็มวัน');
                                                } else if (!['ลาป่วย', 'ลากิจส่วนตัว'].includes(selected)) {
                                                    setLeaveType('');
                                                }

                                            }}
                                        >
                                            <option className="font-FontNoto " value="" disabled>-- กรุณาเลือก --</option>
                                            {[
                                                'Office', 'Work from home', 'Off-site (เข้าหน่วยงาน)', 'เช้า Work from home บ่าย Office',
                                                'ลาป่วย', 'ลากิจส่วนตัว'
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
                                                defaultValue={leaveType}
                                                onChange={(e) => {
                                                    setLeaveType(e.target.value);
                                                }}
                                            >
                                                <option className="font-FontNoto" value="">-- เลือกช่วงเวลา --</option>
                                                <option className="font-FontNoto" value="ครึ่งวันเช้า">ครึ่งวันเช้า</option>
                                                <option className="font-FontNoto" value="ครึ่งวันบ่าย">ครึ่งวันบ่าย</option>
                                            </select>
                                        </div>
                                    )}

                                    {leaveType === 'เต็มวัน' && (
                                        <div className="mb-4">
                                            <label className="block text-sm font-FontNoto mb-1">ระหว่างวันที่</label>
                                            <input
                                                type="date"
                                                name="startDate"
                                                value={startDate || ""}
                                                className="input input-bordered w-full font-FontNoto"
                                                onChange={(e) => setStartDate(e.target.value)}
                                                style={{ colorScheme: "light" }}
                                            />
                                            <label className="block text-sm font-FontNoto mt-2">ถึงวันที่</label>
                                            <input
                                                type="date"
                                                name="endDate"
                                                value={endDate || ""}
                                                className="input input-bordered w-full font-FontNoto mt-2"
                                                onChange={(e) => setEndDate(e.target.value)}
                                                style={{ colorScheme: "light" }}
                                            />
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-2">
                                        {!todayLeave &&
                                            !todayWorktime?.checkIn &&
                                            !(leaveType === 'เต็มวัน' ||
                                                location === 'ลาบวช' ||
                                                location === 'ลาพักร้อน' ||
                                                location === 'ลาคลอด') && (
                                                <button
                                                    onClick={handleCheckIn}
                                                    className="relative rounded-full bg-green-500 px-4 py-2 font-FontNoto text-white font-bold transition-colors duration-300 ease-linear 
before:absolute before:right-1/2 before:top-1/2 before:-z-[1] 
before:h-3/4 before:w-2/3 before:origin-bottom-left before:-translate-y-1/2 
before:translate-x-1/2 before:animate-ping before:rounded-full 
before:bg-green-500 hover:bg-green-700 hover:before:bg-green-700"
                                                >
                                                    ลงเวลาเข้างาน
                                                </button>
                                            )}
                                    </div>
                                </>
                            );
                        })()}

                        {modalConfirmAction && (
                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    onClick={modalConfirmAction}
                                    className="cursor-pointer w-20 h-12 bg-blue-400 text-white rounded-lg hover:bg-blue-700 hover:shadow-lg transition-all group active:w-11 active:h-11 active:rounded-full active:duration-300 ease-in-out font-FontNoto"
                                >
                                    <svg
                                        className="animate-spin hidden group-active:block mx-auto"
                                        width="14"
                                        height="14"
                                        viewBox="0 0 14 14"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M13.1792 0.129353C10.6088 0.646711 8.22715 1.74444 6.16886 3.36616C4.13416 4.96799 2.42959 7.14686 1.38865 9.48493C0.202866 12.1414 -0.241805 15.156 0.125386 18.0413C0.684593 22.4156 3.02922 26.3721 6.63375 29.0186C8.01155 30.0301 9.65549 30.8757 11.2725 31.3997C12.0405 31.6518 13.4857 32 13.7518 32H13.8361V30.7232V29.4464L13.762 29.4331C11.8485 29.0252 10.2787 28.3818 8.7493 27.3802C7.50961 26.5644 6.29688 25.4402 5.40416 24.2794C3.88824 22.3095 2.98206 20.0908 2.66203 17.5736C2.57781 16.8905 2.57781 15.1029 2.66203 14.4396C2.88773 12.7317 3.31556 11.3288 4.06678 9.863C5.88589 6.3045 9.23103 3.67791 13.1286 2.746C13.4352 2.67303 13.7182 2.60671 13.762 2.59676L13.8361 2.58349V1.29009C13.8361 0.577066 13.8327 -0.00330353 13.8293 1.33514e-05C13.8226 1.33514e-05 13.5329 0.0597076 13.1792 0.129353Z"
                                            fill="white"
                                        ></path>
                                        <path
                                            d="M19.563 1.38627V2.67967L19.7078 2.71615C20.8768 3.01463 21.7527 3.32968 22.6723 3.78071C24.8249 4.84528 26.6878 6.467 28.042 8.47011C29.248 10.251 29.9858 12.2375 30.2654 14.4562C30.3126 14.831 30.326 15.1792 30.326 16.0149C30.326 17.169 30.2923 17.5869 30.1205 18.5022C29.7365 20.575 28.8404 22.5681 27.5266 24.2761C26.8158 25.2014 25.8019 26.2029 24.862 26.9027C23.3056 28.0634 21.7324 28.7997 19.7078 29.3137L19.563 29.3502V30.6436V31.9403L19.691 31.9204C20.0616 31.8541 21.1362 31.5689 21.6516 31.4031C24.8216 30.365 27.6041 28.3951 29.6152 25.7652C30.2789 24.8996 30.7337 24.1667 31.2356 23.1618C31.8959 21.8419 32.3102 20.6479 32.5999 19.2318C33.4354 15.1394 32.6606 10.9441 30.417 7.40886C28.4126 4.24833 25.3067 1.8373 21.692 0.640079C21.1867 0.470943 20.038 0.169149 19.7078 0.112772L19.563 0.0895557V1.38627Z"
                                            fill="white"
                                        ></path>
                                    </svg>
                                    <span className="group-active:hidden font-FontNoto">ยืนยัน</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {loadingFullScreen && (
                <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-[9999]">
                    <div className="flex flex-row gap-2">
                        <div className="w-4 h-4 rounded-full bg-blue-700 animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-4 h-4 rounded-full bg-blue-700 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-4 h-4 rounded-full bg-blue-700 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingAfterLogin;
