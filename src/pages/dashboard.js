import React from "react";
import { useNavigate } from "react-router-dom";
import {
  LucideBarChart,
  LucideClipboardList,
  LucidePackageCheck,
  LucideUsers,
} from "lucide-react";
import usePageTitle from "../hooks/usePageTitle";

const Dashboard = () => {
  usePageTitle("Dashboard");

  const navigate = useNavigate();

  const cardData = [
    {
      title: "Total Employees",
      value: 0,
      icon: <LucideUsers size={24} className="text-[#1e88e5]" />,
      bgColor: "bg-[#1e88e5]/10",
      shadowColor: "shadow-[0_2px_15px_-3px_rgba(30,136,229,0.2)]",
      route: "/employees",
    },
    {
      title: "Total Designs",
      value: 0,
      icon: <LucideClipboardList size={24} className="text-[#ef5350]" />,
      bgColor: "bg-[#ef5350]/10",
      shadowColor: "shadow-[0_2px_15px_-3px_rgba(239,83,80,0.2)]",
      route: "/design",
    },
    {
      title: "Salary Report",
      value: 0,
      icon: <LucideBarChart size={24} className="text-[#9c27b0]" />,
      bgColor: "bg-[#9c27b0]/10",
      shadowColor: "shadow-[0_2px_15px_-3px_rgba(156,39,176,0.2)]",
      route: "/salary-report",
    },
    {
      title: "Total Pics",
      value: 0,
      icon: <LucidePackageCheck size={24} className="text-[#4caf50]" />,
      bgColor: "bg-[#4caf50]/10",
      shadowColor: "shadow-[0_2px_15px_-3px_rgba(76,175,80,0.2)]",
      route: null,
    },
  ];

  return (
    <div className="min-h-0">
      <div className="flex items-center justify-between !mt-0">
        <h1 className="text-2xl font-bold text-light-darkGrey font-roboto cursor-default">
          Dashboard
        </h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 pt-4">
        {cardData.map((card, index) => (
          <div
            key={index}
            role={card.route ? "button" : undefined}
            tabIndex={card.route ? 0 : undefined}
            onKeyDown={
              card.route
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(card.route);
                    }
                  }
                : undefined
            }
            className={`bg-white rounded-lg p-6 ${card.shadowColor} relative overflow-hidden transition-transform hover:scale-105 ${
              card.route ? "cursor-pointer" : "cursor-default"
            }`}
            onClick={() => card.route && navigate(card.route)}
          >
            <div className="flex items-start gap-4">
              <div className={`${card.bgColor} p-3 rounded-lg`}>{card.icon}</div>
              <div>
                <h3 className="text-gray-600 text-sm font-medium mb-2">{card.title}</h3>
                <p className="text-3xl font-bold text-gray-800 text-start">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
