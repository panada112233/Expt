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
import AdminRegistration from './components/AdminRegistration';
import AdminManagement from './components/AdminManagement';
import LandingAfterLogin from './components/LandingAfterLogin';
import BorrowEquipmentsEmp from './components/BorrowEquipmentsEmp';
import ManageEquipmentsAdmin from './components/ManageEquipmentsAdmin';

import TrendStatistics from './components/TrendStatistics';
import Allemployee from './components/Allemployee';
import WorkplanAdmin from "./components/WorkplanAdmin";

import EmployeeView from './components/EmployeeView';

import EmpHome from './components/EmpHome';
import EmpBase from './components/EmpBase';
import Worktime from './components/Worktime';
import WorktimeEmp from './components/WorktimeEmp';
import Workplan from './components/Workplan';

import CallbackPage from './components/CallbackPage';

import Profile from './components/Profile';
import ChangePassword from './components/Change_password';
import Document from './components/Document';
import Logout from './components/Logout';

import ChangeProfile from './components/Change_profile';
import ForgotPassword from './components/ForgotPassword';

import AdminDashboard from "./components/AdminDashboard";

import UserList from "./components/UserList";
import UserDetails from "./components/UserDetails";
import UserEdit from "./components/UserEdit";
import UserForm from "./components/UserForm";
import CreateWorkExperience from "./components/CreateWorkExperience";
import AdminLogout from "./components/AdminLogout";
import EditEducation from "./components/EditEducation";
import EditWorkExperience from './components/EditWorkExperience';
import CreateEducation from './components/CreateEducation';
import pdfmake from 'pdfmake';


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

            <Route path="/callback" element={<CallbackPage />} />
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
              <Route path="Document" element={<Document />} />
              <Route path="Change_profile" element={<ChangeProfile />} />

              <Route path="TrendStatistics" element={<TrendStatistics />} />
              <Route path="Allemployee" element={<Allemployee />} />
              <Route path="EmployeeView" element={<EmployeeView />} />
              <Route path="BorrowEquipmentsEmp" element={<BorrowEquipmentsEmp />} />
              <Route path="ManageEquipmentsAdmin" element={<ManageEquipmentsAdmin />} />
            </Route>

            {/* Route Logout */}
            <Route path="/EmpHome/Logout" element={<Logout setIsLoggedIn={setIsLoggedIn} />} />

            {/* Routes สำหรับการจัดการผู้ดูแลระบบ */}
            <Route path="/AdminDashboard" element={<AdminDashboard />} />
            <Route path="/UserList" element={<UserList />} />
            <Route path="/UserForm/create" element={<UserForm />} />
            <Route path="/UserForm/edit/:id" element={<UserForm />} />
            <Route path="/educations/create" element={<CreateEducation />} />
            <Route path="/AdminLogout" element={<AdminLogout setIsAdminLoggedIn={setIsLoggedIn} />} />
            <Route path="/experiences/create" element={<CreateWorkExperience />} />
            <Route path="/users/:UserID" element={<UserDetails />} />
            <Route path="/users/details/:UserID" element={<UserDetails />} />
            <Route path="/users/edit/:UserID" element={<UserEdit />} />
            <Route path="educations/edit/:id" element={<EditEducation />} />
            <Route path="/work-experience/edit/:experienceID/:userid" element={<EditWorkExperience />} />
            <Route path="/AdminRegistration" element={<AdminRegistration />} />
            <Route path="/AdminManagement" element={<AdminManagement />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
