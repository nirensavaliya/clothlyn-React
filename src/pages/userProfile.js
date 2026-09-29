import React, { useEffect, useState } from "react";
import { LucidePhone } from "lucide-react";
import usePageTitle from "../hooks/usePageTitle";

const formatRole = (role) => {
  if (!role) return "User";
  return role.charAt(0).toUpperCase() + role.slice(1);
};

const UserProfile = () => {
  const [userDetails, setUserDetails] = useState({});
  usePageTitle("Profile");

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user) {
        const name =
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          user.employeeName ||
          user?.data?.username ||
          user?.username ||
          "User";
        const userData = {
          name,
          phone:
            user.phoneNumber ||
            user?.data?.phoneNumber ||
            "+91 9999999999",
          role: formatRole(user.employeeRole || user.accountRole || "user"),
        };
        setUserDetails(userData);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }, []);

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start space-x-4 p-4 rounded-lg bg-light-lightGreyBackground hover:bg-opacity-70 transition-all duration-200">
      <div className="shrink-0 p-2 rounded-full bg-light-primary bg-opacity-10">
        <Icon size={20} className="text-light-primary" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm text-light-lightGrey font-roboto mb-1">{label}</p>
        <p className="font-medium text-light-darkGrey font-roboto break-words">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-14">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-light-darkGrey font-roboto cursor-default text-left">
          User Profile
        </h1>
      </div>

      <div className="relative rounded-lg bg-light-white p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
        <div className="absolute left-1/2 transform -translate-x-1/2 top-[-38px] mb-6 flex items-center flex-col justify-center">
          <div className="shrink-0 flex h-20 w-20 items-center justify-center rounded-full bg-light-primary text-2xl font-bold text-light-white font-roboto">
            {userDetails?.name?.split(" ")?.map((n) => n[0])?.join("")}
          </div>
          <div className="text-center mt-2">
            <h2 className="text-xl font-semibold text-light-darkGrey font-roboto">
              {userDetails?.name}
            </h2>
            <p className="text-sm text-light-lightGrey font-roboto">
              {userDetails.role}
            </p>
          </div>
        </div>

        <div className="space-y-4 mt-20 md:mt-28">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow
              icon={LucidePhone}
              label="Phone Number"
              value={userDetails.phone || "-"}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
