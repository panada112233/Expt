import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './Home.css'
// import {pdfmake,font} from "./libs/pdfmake.js";


import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

document.addEventListener('DOMContentLoaded', function (event) {
  

});