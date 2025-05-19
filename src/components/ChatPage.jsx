import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import AOS from 'aos';
import 'aos/dist/aos.css';


const ChatPage = ({ currentUserId, popupMode = false }) => {
    const [chatMode, setChatMode] = useState('private');
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState(null);
    const [showSidebar, setShowSidebar] = useState(true);
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groupMessages, setGroupMessages] = useState([]);
    const messagesContainerRef = useRef(null); // ✅ เพิ่มตัวนี้

    const [text, setText] = useState('');

    const api = axios.create({
        baseURL: "http://192.168.1.188/hrwebapi/api",
        headers: {
            'Content-Type': 'application/json'
        }
    });

    useEffect(() => {
        console.log("[ChatPage] currentUserId:", currentUserId);
        if (!currentUserId) {
            alert("กรุณาเข้าสู่ระบบก่อนใช้งาน");
        } else {
            // 📥 โหลดรายชื่อผู้ใช้ทั้งหมด
            api.get(`/Chat/Users?currentUserId=${currentUserId}`)
                .then(async res => {
                    const usersWithLastMessage = await Promise.all(res.data.map(async user => {
                        try {
                            const messageRes = await api.get(`/Chat?user1=${currentUserId}&user2=${user.userID}`);
                            const lastMessage = messageRes.data.length > 0 ? messageRes.data[messageRes.data.length - 1] : null;
                            return {
                                ...user,
                                lastMessageTime: lastMessage ? new Date(lastMessage.timestamp) : new Date(0)
                            };
                        } catch (err) {
                            console.error("โหลดข้อความผู้ใช้ล้มเหลว", err);
                            return {
                                ...user,
                                lastMessageTime: new Date(0)
                            };
                        }
                    }));

                    // 🔥 Sort users ตามเวลาข้อความล่าสุด
                    usersWithLastMessage.sort((a, b) => b.lastMessageTime - a.lastMessageTime);

                    setUsers(usersWithLastMessage);
                })
                .catch(err => console.error("โหลดรายชื่อผู้ใช้ล้มเหลว", err));

            // 📥 โหลดกลุ่มชื่อ The ex และข้อความ
            if (chatMode === 'group') {
                api.get("/Chat/Groups")
                    .then(res => {
                        const group = res.data.find(g => g.groupName === "THE EXPERTISE CO,LTD.");
                        if (group) {
                            setGroups(res.data);
                            setSelectedGroup(group); // ตั้ง selectedGroup ด้วย
                            return api.get(`/Chat/Groups/${group.groupID}/Messages`);
                        } else {
                            // ถ้ายังไม่มี กลุ่ม The ex ให้สร้าง
                            return api.post("/Chat/CreateDefaultGroup")
                                .then(createRes => {
                                    setGroups(prevGroups => [...prevGroups, createRes.data]);
                                    setSelectedGroup(createRes.data); // ตั้ง selectedGroup ด้วย
                                    return api.get(`/Chat/Groups/${createRes.data.groupID}/Messages`);
                                })
                                .catch(err => {
                                    throw new Error("ไม่สามารถสร้างกลุ่ม The ex ได้");
                                });
                        }
                    })
                    .then(res => setGroupMessages(res.data))
                    .catch(err => console.error("โหลดกลุ่มหรือข้อความกลุ่มล้มเหลว", err));
            }
        }
    }, [currentUserId, chatMode]);

    // 📥 โหลดข้อความส่วนตัวเมื่อเลือก user (เฉพาะโหมด private)
    useEffect(() => {
        // โหลดข้อความส่วนตัวเมื่อเลือก user (เฉพาะโหมด private)
        if (chatMode === 'private' && selectedUser && currentUserId) {
            api.get(`/Chat?user1=${currentUserId}&user2=${selectedUser.userID}`)
                .then(res => setMessages(res.data))
                .catch(err => console.error("โหลดข้อความส่วนตัวล้มเหลว", err));
        }

        // เริ่มต้น AOS
        AOS.init();

        // เลื่อนข้อความไปที่ด้านล่างเมื่อมีการเปลี่ยนแปลงใน messages หรือ groupMessages
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [chatMode, selectedUser, currentUserId, messages, groupMessages]);


    const getSenderName = (id) => {
        const user = users.find(u => u.userID === id);
        return user ? user.fullName : 'ไม่ทราบชื่อ';
    };

    const askDeleteGroupMessage = (id) => {
        setMessageToDelete({ id, type: 'group' });
        setShowDeleteModal(true);
    };

    const askDeletePrivateMessage = (id) => {
        setMessageToDelete({ id, type: 'private' });
        setShowDeleteModal(true);
    };



    // 📨 Send private message
    const sendPrivateMessage = async () => {
        if (!text.trim() || !selectedUser?.userID || !currentUserId) {
            console.warn("[ChatPage] ข้อมูลไม่ครบ", { text, currentUserId, receiverID: selectedUser?.userID });
            alert("กรุณาเลือกผู้ใช้ และตรวจสอบว่าเข้าสู่ระบบถูกต้องก่อนส่งข้อความ");
            return;
        }

        const newMessage = {
            senderID: currentUserId,
            receiverID: selectedUser.userID,
            content: text
        };

        console.log("[ChatPage] ส่งข้อความส่วนตัว", newMessage);
        try {
            const res = await api.post("/Chat", newMessage);
            setMessages(prev => [...prev, res.data]);
            setText('');

            // ✅ เพิ่มตรงนี้: อัปเดตเวลาแชทของ user แล้วเรียงใหม่
            setUsers(prevUsers => {
                const updatedUsers = prevUsers.map(user => {
                    if (user.userID === selectedUser.userID) {
                        return { ...user, lastMessageTime: new Date() };
                    }
                    return user;
                });
                return updatedUsers.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
            });

        } catch (err) {
            console.error("ส่งข้อความส่วนตัวล้มเหลว", err);
            alert("เกิดข้อผิดพลาดในการส่งข้อความ");
        }
    };

    const sendGroupMessage = async () => {
        if (!text.trim()) return;

        // ถ้า selectedGroup ยังไม่ถูกตั้ง แต่ chatMode เป็น group
        if (chatMode === 'group' && (!selectedGroup || !selectedGroup.groupID)) {
            try {
                const groupRes = await api.get("/Chat/Groups");
                const theExGroup = groupRes.data.find(g => g.groupName === "THE EXPERTISE CO,LTD.");
                if (!theExGroup) {
                    alert("ไม่พบกลุ่ม The ex");
                    return;
                }
                setSelectedGroup(theExGroup); // ตั้ง selectedGroup ให้ทัน
                const newMessage = {
                    senderID: currentUserId,
                    content: text
                };
                const res = await api.post(`/Chat/Groups/${theExGroup.groupID}/Messages`, newMessage);
                setGroupMessages(prev => [...prev, res.data]);
                setText('');
            } catch (err) {
                console.error("ส่งข้อความกลุ่มล้มเหลว (จาก fallback)", err);
                alert("ไม่สามารถส่งข้อความกลุ่มได้");
            }
        }

        // ถ้า selectedGroup พร้อมแล้ว
        else if (selectedGroup && currentUserId) {
            const newMessage = {
                senderID: currentUserId,
                content: text
            };

            try {
                const res = await api.post(`/Chat/Groups/${selectedGroup.groupID}/Messages`, newMessage);
                setGroupMessages(prev => [...prev, res.data]);
                setText('');
            } catch (err) {
                console.error("ส่งข้อความกลุ่มล้มเหลว", err);
                alert("เกิดข้อผิดพลาดในการส่งข้อความกลุ่ม");
            }
        }
    };


    return (
        <div className="p-6 bg-gradient-to-b from-cyan-50 to-white">


            <div className="flex gap-4 mb-6">
                <button
                    className={`btn ${chatMode === 'private' ? 'btn-primary' : 'btn-outline'} font-FontNoto`}
                    onClick={() => setChatMode('private')}
                >💬 แชทส่วนตัว</button>
                <button
                    className={`btn ${chatMode === 'group' ? 'btn-primary' : 'btn-outline'} font-FontNoto`}
                    onClick={() => setChatMode('group')}
                >👥 แชทกลุ่ม</button>
            </div>

            <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-120px)]">
                <div className="relative md:w-1/4 w-full">
                    {/* ปุ่ม toggle เฉพาะมือถือ */}
                    <button
                        className="text-3xl mb-4 md:hidden"
                        onClick={() => setShowSidebar(v => !v)}
                    >
                        ☰
                    </button>

                    {/* Sidebar */}
                    {showSidebar && (
                        <div className="h-[80vh] overflow-y-auto overflow-x-hidden bg-white bg-opacity-70 rounded-2xl p-4 shadow-xl backdrop-blur-md">
                            <h3 className="text-xl font-bold font-FontNoto mb-4 text-cyan-700">
                                {chatMode === 'private' ? '👤 ผู้ใช้' : '👥 กลุ่มแชท'}
                            </h3>
                            {(chatMode === 'private' ? users : groups).map((item) => (
                                (chatMode === 'private' && item.userID === currentUserId) ? null : (
                                    <div
                                        key={chatMode === 'private' ? item.userID : item.groupID}
                                        onClick={() => chatMode === 'private' ? setSelectedUser(item) : setSelectedGroup(item)}
                                        className={`cursor-pointer p-3 mb-2 rounded-xl transition-all duration-150 font-FontNoto
                             ${((chatMode === 'private' && selectedUser?.userID === item.userID) ||
                                                (chatMode === 'group' && selectedGroup?.groupID === item.groupID))
                                                ? 'bg-cyan-400 text-white font-bold scale-105 shadow-md'
                                                : 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200'}`}
                                        title={chatMode === 'private' ? item.fullName : item.groupName}
                                    >
                                        <span className="break-words whitespace-normal font-FontNoto text-sm">
                                            {chatMode === 'private'
                                                ? ` ${item.fullName}`
                                                : ` ${item.groupName}`}
                                        </span>
                                    </div>
                                )
                            ))}
                        </div>

                    )}
                </div>

                {/* Main chat area */}
                <div className="flex flex-col w-full md:w-3/4 h-full">
                    <div className="text-center mb-4">
                        {chatMode === 'private' && selectedUser && (
                            <h3 className="text-2xl font-bold font-FontNoto text-blue-700">
                                💬 แชทกับ {selectedUser.fullName}
                            </h3>
                        )}
                        {chatMode === 'group' && selectedGroup && (
                            <h3 className="text-2xl font-bold font-FontNoto text-blue-700">
                                👥 กลุ่ม: {selectedGroup.groupName}
                            </h3>
                        )}
                    </div>
                    <div
                        ref={messagesContainerRef}  // ✅ ผูก ref ตรงนี้
                        className="
        flex-1
        border p-4 rounded-2xl
        bg-gradient-to-br from-white via-cyan-50 to-white
        overflow-y-auto shadow-inner backdrop-blur-md space-y-3
        max-h-[40vh] md:max-h-[45vh]
    "
                    >

                        {(() => {
                            let lastDate = null;
                            return (chatMode === 'private' ? messages : groupMessages).map((m, i) => {
                                const messageDate = new Date(m.timestamp).toDateString(); // แปลงเป็น "รูปแบบวัน"
                                const isNewDate = messageDate !== lastDate;
                                lastDate = messageDate;

                                return (
                                    <React.Fragment key={i}>
                                        {/* ถ้าเป็นวันใหม่ ➔ แทรกแถบวันที่ */}
                                        {isNewDate && (
                                            <div className="text-center text-xs text-gray-500 my-3 font-FontNoto">
                                                🗓️ {new Date(m.timestamp).toLocaleDateString('th-TH', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        )}

                                        {/* แชทแต่ละข้อความ */}
                                        <div className={`mb-1 ${parseInt(m.senderID) === parseInt(currentUserId) ? 'text-right' : 'text-left'}`}>
                                            <div className="relative inline-block">

                                                {/* แสดงชื่อผู้ส่ง (เฉพาะ group และไม่ใช่ตัวเอง) */}
                                                {chatMode === 'group' && parseInt(m.senderID) !== parseInt(currentUserId) && (
                                                    <div className="text-xs text-gray-600 font-FontNoto mb-0.5">
                                                        {getSenderName(m.senderID)}
                                                    </div>
                                                )}

                                                {/* กล่องข้อความ */}
                                                <span className={`inline-block px-3 py-2 rounded-2xl shadow-md max-w-xs font-FontNoto text-white bg-gradient-to-br
                                ${parseInt(m.senderID) === parseInt(currentUserId)
                                                        ? 'from-blue-400 to-blue-600'
                                                        : 'from-blue-700 to-blue-900'} text-left`}>
                                                    {m.content}
                                                </span>

                                                {/* ปุ่มลบ (เฉพาะข้อความตัวเอง) */}
                                                {parseInt(m.senderID) === parseInt(currentUserId) && (
                                                    <button
                                                        onClick={() => {
                                                            chatMode === 'private'
                                                                ? askDeletePrivateMessage(m.messageID)
                                                                : askDeleteGroupMessage(m.messageID)
                                                        }}
                                                        className="absolute -top-2 -right-2 text-xs bg-red-500 text-white rounded-full w-5 h-5 hover:scale-110"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            });
                        })()}

                    </div>

                    {showDeleteModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fade-in">
                            <div
                                className="bg-white p-6 rounded-2xl shadow-2xl w-96 relative transition-transform duration-300 ease-in-out transform scale-100"
                                data-aos="zoom-in"
                                data-aos-duration="500" // ปรับระยะเวลาการซูม
                                data-aos-easing="ease-in-out" // ใช้การเคลื่อนที่แบบ smooth
                            >
                                {/* 🎀 ไอคอนน่ารัก */}
                                <img src="https://cdn-icons-png.flaticon.com/512/1214/1214428.png" alt="delete" className="w-12 h-12 absolute -top-6 left-4 rounded-full border-4 border-white shadow-lg bg-red-100" />

                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-red-600 font-FontNoto">⚡ ยืนยันการลบ</h3>
                                    <button
                                        onClick={() => setShowDeleteModal(false)}
                                        className="text-gray-400 text-lg font-bold hover:scale-110 transition"
                                    >
                                        ❌
                                    </button>
                                </div>

                                <p className="text-gray-600 font-FontNoto text-center mb-4">คุณต้องการลบข้อความนี้หรือไม่?</p>

                                <div className="flex justify-end gap-2">
                                    <button
                                        className="btn btn-outline btn-error font-FontNoto"
                                        onClick={async () => {
                                            if (messageToDelete) {
                                                try {
                                                    if (messageToDelete.type === 'group') {
                                                        await api.delete(`/Chat/Groups/Messages/${messageToDelete.id}`);
                                                        setGroupMessages(prev => prev.filter(m => m.messageID !== messageToDelete.id));
                                                    } else if (messageToDelete.type === 'private') {
                                                        await api.delete(`/Chat/${messageToDelete.id}`);
                                                        setMessages(prev => prev.filter(m => m.messageID !== messageToDelete.id));
                                                    }
                                                    setShowDeleteModal(false);
                                                } catch (err) {
                                                    console.error("ลบข้อความล้มเหลว", err);
                                                    alert("เกิดข้อผิดพลาดในการลบข้อความ");
                                                }
                                            }
                                        }}
                                    >
                                        ลบ
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ช่องพิมพ์ */}
                    <div className="flex mt-4">
                        <input
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    chatMode === 'private' ? sendPrivateMessage() : sendGroupMessage();
                                }
                            }}
                            className="input input-bordered flex-1 font-FontNoto bg-white bg-opacity-70 border-cyan-300 text-cyan-800"
                            placeholder="พิมพ์ข้อความ..."
                        />
                        <button
                            onClick={chatMode === 'private' ? sendPrivateMessage : sendGroupMessage}
                            className="btn btn-primary ml-2 font-FontNoto bg-cyan-500 hover:bg-cyan-600 border-none"
                        >
                            ส่ง
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ChatPage;
