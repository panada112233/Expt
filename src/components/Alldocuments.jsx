import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, Link } from "react-router-dom";

const Alldocuments = () => {
    const location = useLocation();
    const user = location.state?.user || {};  // รับข้อมูลจาก `state`
    const [educations, setEducations] = useState([]);
    const [experiences, setExperiences] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("User data received:", user);  // ตรวจสอบค่า user
        fetchData();
    }, [user]); // เรียกใช้งานใหม่หาก user เปลี่ยนแปลง

    const fetchData = async () => {
        try {
            if (!user.userID) {
                console.warn("Missing userID:", user);
                setLoading(false);
                return;
            }
            const [eduResponse, expResponse] = await Promise.all([
                axios.get(`https://localhost:7039/api/Admin/educations/user/${user.userID}`),
                axios.get(`https://localhost:7039/api/Admin/WorkExperiences/user/${user.userID}`)
            ]);

            setEducations(eduResponse.data || []);
            setExperiences(expResponse.data || []);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };
    const levelLabels = {
        Primary: "ประถมศึกษา",
        Secondary: "มัธยมศึกษา",
        Voc: "ประกาศนียบัตรวิชาชีพ (ปวช.)",
        Dip: "ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)",
        Bachelor: "ปริญญาตรี",
        Master: "ปริญญาโท",
        Doctorate: "ปริญญาเอก",
    };

    return (
        <div className="flex flex-col min-h-screen">
            <div className="">
                <div className="w-full md:w-[90%] lg:w-[75%] mx-auto p-4 sm:p-6 bg-white shadow-lg rounded-lg mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-black mb-4 font-FontNoto">
                            ข้อมูลของ คุณ {user.firstName} {user.lastName}
                        </h2>
                        <Link to="/EmpHome/Allemployee" className="btn btn-outline btn-error font-FontNoto mb-4">
                            กลับไปยังพนักงานทั้งหมด
                        </Link>
                    </div>
                    {loading ? (
                        <div className="text-center py-6 font-FontNoto">กำลังโหลดข้อมูล...</div>
                    ) : (
                        <>
                            <div className="overflow-x-auto w-full max-w-full">
                                <div className="">
                                    <h3 className="text-xl font-bold mb-2 font-FontNoto">ข้อมูลการศึกษา</h3>
                                    <table className="table-auto w-full border-collapse border border-gray-300 mb-6">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="border px-4 py-2 font-FontNoto">ระดับการศึกษา</th>
                                                <th className="border px-4 py-2 font-FontNoto">สถาบัน</th>
                                                <th className="border px-4 py-2 font-FontNoto">สาขาวิชา</th>
                                                <th className="border px-4 py-2 font-FontNoto">ปีที่ศึกษา</th>
                                                <th className="border px-4 py-2 font-FontNoto">GPA</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {educations.length > 0 ? educations.map((edu) => (
                                                <tr key={edu.educationID}>
                                                    <td className="border px-4 py-2 font-FontNoto">{levelLabels[edu.level]}</td>
                                                    <td className="border px-4 py-2 font-FontNoto">{edu.institute}</td>
                                                    <td className="border px-4 py-2 font-FontNoto">{edu.fieldOfStudy}</td>
                                                    <td className="border px-4 py-2 font-FontNoto text-center">{edu.year}</td>
                                                    <td className="border px-4 py-2 font-FontNoto text-center">{edu.gpa}</td>
                                                </tr>
                                            )) : <tr><td className="border px-4 py-2 text-center font-FontNoto" colSpan="5">ไม่มีข้อมูลการศึกษา</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="overflow-x-auto w-full max-w-full">
                                <div className="">
                                    <h3 className="text-xl font-bold mb-2 font-FontNoto">ประสบการณ์ทำงาน</h3>
                                    <table className="table-auto w-full border-collapse border border-gray-300">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="border px-4 py-2 font-FontNoto">บริษัท</th>
                                                <th className="border px-4 py-2 font-FontNoto">ตำแหน่ง</th>
                                                <th className="border px-4 py-2 font-FontNoto">เงินเดือน</th>
                                                <th className="border px-4 py-2 font-FontNoto">ปีเริ่มต้น</th>
                                                <th className="border px-4 py-2 font-FontNoto">ปีสิ้นสุด</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {experiences.length > 0 ? experiences.map((exp) => (
                                                <tr key={exp.experienceID}>
                                                    <td className="border px-4 py-2 font-FontNoto">{exp.companyName}</td>
                                                    <td className="border px-4 py-2 font-FontNoto">{exp.jobTitle}</td>
                                                    <td className="border px-4 py-2 font-FontNoto text-center">{exp.salary}</td>
                                                    <td className="border px-4 py-2 font-FontNoto text-center">{exp.startDate}</td>
                                                    <td className="border px-4 py-2 font-FontNoto text-center">{exp.endDate}</td>
                                                </tr>
                                            )) : <tr><td className="border px-4 py-2 text-center font-FontNoto" colSpan="5">ไม่มีข้อมูลประสบการณ์ทำงาน</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div >
    );
};

export default Alldocuments;
