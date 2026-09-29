import React, { useState, useEffect } from "react";
import InputElement from "../common/InputElement";
import PhoneInput from "../common/PhoneInput";
import Button from "../common/Button";
import { toast } from "react-toastify";
import SelectElement from "../common/Select";
import { getProcesses } from "../../apis/processApi";

const EditUserForm = ({ onSubmit, onCancel, userData, processSubMenuItems, isLoading }) => {
  const [formData, setFormData] = useState({
    clientCode: "",
    username: "",
    nickname: "",
    email: "",
    role: [],
    phoneNumber: "",
    status: "active",
    company: ""
  });
  const [errors, setErrors] = useState({});

  const roleOptions = processSubMenuItems.map(item => ({
    ...item,
    label: item.label,
    value: item._id
  }));

  useEffect(() => {
    if (userData) {
      const existingRoles = userData.role
        .map((role) => {
          const matchingItem = processSubMenuItems.find(
            (item) => item.value === role._id
          );
          return matchingItem;
        })
        .filter((item) => item !== undefined);

      setFormData({
        clientCode: userData.clientCode || "",
        username: userData.username || "",
        nickname: userData.nickname || "",
        email: userData.email || "",
        role: existingRoles.map((item) => item.value) || [],
        phoneNumber: userData.phoneNumber || "",
        status: userData.status || "active",
        company: userData.company || "",
      });
    }
  }, [userData]);



  const validateRole = (role) => {
    if (!role || role.length === 0) {
      return "Please select at least one role";
    }
    return null;
  };


  const handleChange = (fieldName, data) => {
      if (fieldName === "role") {
      setFormData((prev) => ({ ...prev, [fieldName]: data }));
      setErrors((prev) => ({ ...prev, [fieldName]: validateRole(data) }));
      return;
    }
    if (typeof data === 'object' && data !== null && (data.hasOwnProperty('value') || data.hasOwnProperty('error'))) {
      setFormData((prev) => ({ ...prev, [fieldName]: data.value }));
      setErrors((prev) => ({ ...prev, [fieldName]: data.error || null }));
    } else {
      setFormData((prev) => ({ ...prev, [fieldName]: data }));
      if (errors[fieldName]) {
        setErrors((prev) => ({ ...prev, [fieldName]: null }));
      }
    }
  };

  const handlePhoneChange = (fieldName, { value, error }) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  };


  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!formData.username?.trim()) {
      newErrors.username = "Username is required";
      isValid = false;
    }
    if (!formData.nickname?.trim()) {
      newErrors.nickname = "Nickname is required";
      isValid = false;
    }

    if (!formData.role || formData.role.length === 0) {
      newErrors.role = "Role is required";
      isValid = false;
    }
    
    if (!formData.phoneNumber?.trim()) {
      newErrors.phoneNumber = "Phone Number is required";
      isValid = false;
    }

    if (!formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
        if (!validateForm()) {
          toast.error("Please fill all required fields correctly.", { toastId: "add-user-validation-error" });
          return;
        }

      onSubmit(userData._id, formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-5 mb-[92px]">
        <InputElement
          name="Emp Code"
          type="text"
          value={formData.clientCode}
          onChange={(val) => handleChange("clientCode", val)}
          placeholder="Enter Emp Code"
          is_required={false}
          variant="size_44"
          readOnly
          disabled
          className="cursor-not-allowed"
        />
        <InputElement
          name="Username"
          type="text"
          value={formData.username}
          onChange={(val) => handleChange("username", val)}
          placeholder="Enter username"
          is_required={true}
          error={errors?.username}
          variant="size_44"
        />
        <InputElement
          name="Nickname"
          type="text"
          value={formData.nickname}
          onChange={(val) => handleChange("nickname", val)}
          placeholder="Enter nickname"
          is_required={true}
          error={errors?.nickname}
          variant="size_44"
        />
        <InputElement
          name="Email"
          type="email"
          value={formData.email}
          onChange={(data) => handleChange("email", data)}
          placeholder="Enter email address"
          is_required={true}
          error={errors?.email}
          variant="size_44"
        />
        {/* <SelectElement
          name="Select Role"
          id="role"
          value={formData.role}
          onChange={(value) => handleChange("role", value)}
          options={roles}
          placeholder="Select Role"
          error={errors.role}
          is_required={true}
          variant="solid"
          className="w-full"
          menuPortalTarget={document.body}
        /> */}
   
         <SelectElement
          name="Select Role"
          id="select-role"
          value={formData.role}
          onChange={(value) => handleChange("role", value)}
          options={processSubMenuItems}
          placeholder="Select Role"
          error={errors?.role}
          is_required={true}
          isMulti={true}
          variant="solid"
          className="w-full scrollbar-hide"
          getOptionValue={(option) => option.value}
          getOptionLabel={(option) => option.label}
          menuPortalTarget={document.body}
          customStyle={{
              valueContainer: (provided) => ({
                ...provided,
                maxHeight: "80px",
                overflowY: "auto",
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": {
                  display: "none"
                }
              }),
          }}
        />
        <PhoneInput
          name="Mobile Number"
          value={formData.phoneNumber}
          onChange={(data) => handlePhoneChange("phoneNumber", data)}
          is_required={false}
          error={errors.phoneNumber}
          readOnly
          disabled
          id="phoneNumberField"
          className="cursor-not-allowed"
        />
     
      </div>

      <div className="flex justify-end space-x-3 p-4 md:p-5 absolute bottom-0 w-full bg-[#F7F3EE] border-t border-[#E8DFD4]">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          label="Cancel"
          className="flex items-center space-x-2 shadow-none font-normal !rounded-md px-4 py-2 transition-colors duration-200 focus:ring-0"
        />
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          label={isLoading ? "Updating..." : "Update"}
          className="flex items-center space-x-2 shadow-none font-normal !rounded-md px-4 py-2 transition-colors duration-200 focus:ring-0"
        />
      </div>
    </form>
  );
};

export default EditUserForm; 