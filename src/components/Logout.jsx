import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Logout({ setIsLoggedIn }) {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/');
  }, [setIsLoggedIn, navigate]);

  return null; 
}
