import {
  HashRouter,
  BrowserRouter,
  Routes,
  Route
} from 'react-router-dom';

import { useEffect, useState } from 'react';
import LeaveRequestForm from './components/LeaveRequestForm';
import LeaveRequestAdmin from './components/LeaveRequestAdmin';

import Login from './components/Login';
import Navbars from './components/Navbars';


import LandingAfterLogin from './components/LandingAfterLogin';
import BorrowEquipmentsEmp from './components/BorrowEquipmentsEmp';
import ManageEquipmentsAdmin from './components/ManageEquipmentsAdmin';

import Allemployee from './components/Allemployee';
import WorkplanAdmin from "./components/WorkplanAdmin";

import EmpHome from './components/EmpHome';
import EmpBase from './components/EmpBase';
import Worktime from './components/Worktime';
import WorktimeEmp from './components/WorktimeEmp';
import Workplan from './components/Workplan';

import Profile from './components/Profile';
import ChangePassword from './components/Change_password';
import Logout from './components/Logout';

import ChangeProfile from './components/Change_profile';
import ForgotPassword from './components/ForgotPassword';

import pdfmake from 'pdfmake';
import '@fortawesome/fontawesome-free/css/all.min.css';


const Router = import.meta.env.DEV ? BrowserRouter : HashRouter;

function App() {
  useEffect(() => {
    console.log(pdfmake)
  }, []);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        {/* Navbar: แสดงเมื่อไม่ได้ล็อกอิน */}
        {!isLoggedIn && <Navbars isLoggedIn={isLoggedIn} />}

        <main className="flex-grow">
          <Routes>

            {/* กำหนดให้ / เป็นหน้าเข้าสู่ระบบ */}
            <Route path="/" element={<Login setIsLoggedIn={setIsLoggedIn} />} />

            {/* เส้นทางใหม่สำหรับหน้า Landing หลัง Login */}
            <Route path="/LandingAfterLogin" element={<LandingAfterLogin />} />

            {/* Routes อื่นๆ */}
            <Route path="/ForgotPassword" element={<ForgotPassword />} />
            <Route path="/ChangePassword" element={<ChangePassword />} />

            {/* Routes สำหรับผู้ใช้ที่ล็อกอิน */}
            <Route path="/EmpHome" element={<EmpBase />}>
              <Route index element={<EmpHome />} />

              <Route path="LeaveRequestForm" element={<LeaveRequestForm />} />
              <Route path="LeaveRequestAdmin" element={<LeaveRequestAdmin />} />
              
              <Route path="Profile" element={<Profile />} />
              <Route path="Worktime" element={<Worktime />} />
              <Route path="WorktimeEmp" element={<WorktimeEmp />} />
              <Route path="Workplan" element={<Workplan />} />
              <Route path="WorkplanAdmin" element={<WorkplanAdmin />} />              
              <Route path="Change_password" element={<ChangePassword />} />
              <Route path="Change_profile" element={<ChangeProfile />} />

              <Route path="Allemployee" element={<Allemployee />} />
              <Route path="BorrowEquipmentsEmp" element={<BorrowEquipmentsEmp />} />
              <Route path="ManageEquipmentsAdmin" element={<ManageEquipmentsAdmin />} />
            </Route>

            {/* Route Logout */}
            <Route path="/EmpHome/Logout" element={<Logout setIsLoggedIn={setIsLoggedIn} />} />

            {/* Routes สำหรับการจัดการผู้ดูแลระบบ */}
            
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
