// src/components/Sidebar.jsx
import { FaThLarge, FaWallet, FaUsers, FaHistory, FaCog } from "react-icons/fa";

import "./Sidebar.css";
import logo from "../assets/logo.png";
export default function Sidebar() {
  return (
    <div className="sidebar">
      <div className="logo">
        <div className="logo-icon">
          <img src={logo} alt="logo" />
        </div>
        <h2>FairSplit</h2>
      </div>

      <ul className="menu">
        <li className="active">
          <FaThLarge className="icon" />
          <span>Dashboard</span>
        </li>

        <li>
          <FaWallet className="icon" />
          <span>Expenses</span>
        </li>

        <li>
          <FaUsers className="icon" />
          <span>Group</span>
        </li>

        <li>
          <FaHistory className="icon" />
          <span>History</span>
        </li>

        <li>
          <FaCog className="icon" />
          <span>Settings</span>
        </li>
      </ul>
    </div>
  );
}
