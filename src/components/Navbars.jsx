import React from 'react';
import { Disclosure } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import logo from "../assets/1.png";

const navigation = [
  { name: 'หน้าหลัก', href: '/', current: false },
  { name: 'เกี่ยวกับ', href: '/About', current: false },
  { name: 'เข้าสู่ระบบ', href: '/Login', current: false },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Navbars({ isLoggedIn }) {
  // ซ่อน Navbar เสมอ
  return null; // ไม่แสดง Navbar
}
