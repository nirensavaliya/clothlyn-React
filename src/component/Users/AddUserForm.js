import React, { useEffect, useState } from "react";
import InputElement from "../common/InputElement";
import PhoneInput from "../common/PhoneInput";
import Button from "../common/Button";
import { toast } from "react-toastify";
import SelectElement from "../common/Select";
import { addUser } from "../../apis/userApi";
import { getProcesses } from "../../apis/processApi";
import { Loader } from "lucide-react";

const AddUserForm = ({ onSubmit, onCancel, processSubMenuItems, isLoading , setIsLoading }) => {
  const [formData, setFormData] = useState({
    userName: "",
    nickName: "",
    email: "",
    role: [],
    mobileNo: "",
    clientCode: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (fieldName, data) => {
    if (fieldName === "clientCode") {
      const numericValue =
        typeof data === "string" ? data.replace(/[^0-9]/g, "").slice(0, 4) : "";
      setFormData((prev) => ({ ...prev, [fieldName]: numericValue }));
      if (errors[fieldName]) {
        setErrors((prev) => ({ ...prev, [fieldName]: null }));
      }
      return;
    }
    if (fieldName === "role") {
      setFormData((prev) => ({ ...prev, [fieldName]: data }));
      if (!data || (Array.isArray(data) && data.length === 0)) {
        setErrors((prev) => ({ ...prev, [fieldName]: "Please select at least one role" }));
      } else {
        setErrors((prev) => ({ ...prev, [fieldName]: null }));
      }
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
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));
  };

  const validate = () => {
    let formIsValid = true;

    const newErrors = { ...errors };

    if (!formData.userName.trim()) {
      newErrors.userName = "User Name is required.";
    } else if (newErrors.userName === "User Name is required.") {
      newErrors.userName = "";
    }

    if (!formData.nickName.trim()) {
      newErrors.nickName = "Nick Name is required.";
    } else if (newErrors.nickName === "Nick Name is required.") {
      newErrors.nickName = "";
    }

    if (!formData.role || (Array.isArray(formData.role) && formData.role.length === 0)) {
      newErrors.role = "Please select at least one role";
    } else {
      newErrors.role = "";
    }

    if (!formData.clientCode.trim()) {
      newErrors.clientCode = "Emp Code is required.";
    } else if (formData.clientCode.trim().length !== 4) {
      newErrors.clientCode = "Emp Code must be 4 digits";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Email address is invalid.";
    } else {
      newErrors.email = "";
    }

    if (!formData.mobileNo.trim()) {
      newErrors.mobileNo = "Mobile No. is required.";
    } else if (!/^[0-9]{10}$/.test(formData.mobileNo)) {
      newErrors.mobileNo = "Mobile No. must be 10 digits.";
    } else {
      newErrors.mobileNo = "";
    }

    setErrors(newErrors);
    for (const key in newErrors) {
      if (newErrors[key]) {
        formIsValid = false;
        break;
      }
    }
    return formIsValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      setIsLoading(true);
      const payload = {
        username: formData.userName,
        phoneNumber: formData.mobileNo,
        nickname: formData.nickName,
        role: formData.role || [],
        status: "active",
        email: formData.email,
        clientCode: formData.clientCode
      };
      try {
        const response = await addUser(payload);
        onSubmit(response);
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    } else {
      toast.error("Please fill all required fields correctly.", { toastId: "form-validation-error" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-5 mb-[92px]">
        <InputElement
          name="Emp Code"
          type="text"
          value={formData.clientCode}
          onChange={(val) => handleChange("clientCode", val)}
          placeholder="Enter Emp Code"
          is_required={true}
          error={errors?.clientCode}
          variant="size_44"
        />
        <InputElement
          name="User Name"
          type="text"
          value={formData.userName}
          onChange={(val) => handleChange("userName", val)}
          placeholder="Enter Username"
          is_required={true}
          error={errors?.userName}
          variant="size_44"
        />
        <InputElement
          name="Nick Name"
          type="text"
          value={formData.nickName}
          onChange={(val) => handleChange("nickName", val)}
          placeholder="Enter nick name"
          is_required={true}
          error={errors?.nickName}
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
          <SelectElement
          name="Select Role"
          id="role"
          value={formData.role}
          onChange={(value) => handleChange("role", value)}
          options={processSubMenuItems}
          placeholder="Select Role"
          error={errors?.role}
          is_required={true}
          isMulti={true}
          variant="solid"
          className="w-full scrollbar-hide"
          getOptionLabel={(option) => option.label}
          getOptionValue={(option) => option.value}
          menuPortalTarget={document.body}
          customStyle={{
            valueContainer: (provided) => ({
              ...provided,
              maxHeight: "80px",
              overflowY: "auto",
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": {
                display: "none",
              },
            }),
          }}
        />
        <PhoneInput
          name="Mobile No."
          value={formData.mobileNo}
          onChange={(data) => handlePhoneChange("mobileNo", data)}
          is_required={true}
          error={errors.mobileNo}
          id="mobileNoField"
        />
      </div>
      <div className="flex justify-end space-x-3 p-4 md:p-5 absolute bottom-0 w-full bg-[#F7F3EE] border-t border-[#E8DFD4]">
        <Button
          variant="outline"
          size="medium"
          label="Cancel"
          onClick={onCancel}
          className="flex items-center space-x-2 shadow-none font-normal !rounded-md  px-4 py-2  transition-colors duration-200 focus:ring-0"
        />
        <Button
          variant="primary"
          size="medium"
          label={"Submit"}
          loading={isLoading}
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex items-center space-x-2 shadow-none font-normal !rounded-md  px-4 py-2  transition-colors duration-200 focus:ring-0"
        />
      </div>
    </div>
  );
};

export default AddUserForm;
