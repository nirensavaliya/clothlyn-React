import React, { useEffect, useState } from "react";
import InputElement from "../common/InputElement";
import PhoneInput from "../common/PhoneInput";
import Button from "../common/Button";
import { toast } from "react-toastify";
import { addEmployee } from "../../apis/employeeApi";
import { getProcesses } from "../../apis/processApi";
import SelectElement from "../common/Select";
import { getMachines } from '../../apis/machineApi';
import { getEmployees } from '../../apis/employeeApi';
import ToggleSwitch from "../common/ToggleSwitch";

const AddEmployeeForm = ({ onSubmitSuccess, onCancel, processSubMenuItems, setProcessSubMenuItems , isLoading, setIsLoading , machines, allEmployees = []}) => {
  const [formData, setFormData] = useState({
    employeeName: "",
    firstName: "",
    lastName: "",
    nickname: "",
    email: "",
    adharNumber: "",
    adharCardFront: null,
    adharCardBack: null,
    mobileNumber: "",
    referenceName: "",
    referenceMobileNumber: "",
    role: [],
    employeeRole: [], // New field for User/Employee role - now supports multiple selection
    scanPermission: [],
    accountNumber: "",
    accountHolderName: "",
    ifscCode: "",
    bankName: "",
    bankBranchName: "",
    machine: [],
    isHalfMonthSalary: false,
  });
  
  const [errors, setErrors] = useState({});
  const [selectedMachines, setSelectedMachines] = useState([]);

const getAvailableMachines = () => {
    if (!machines || !allEmployees) return machines || [];

    // Build a set of machine IDs that are assigned to ACTIVE employees.
    // Supports both single machine object and array of machines on employee records.
    const assignedSet = new Set();
    allEmployees
      .filter(emp => emp?.status === 'active')
      .forEach(emp => {
        const m = emp?.machine;
        if (!m) return;
        if (Array.isArray(m)) {
          m.forEach(item => {
            if (item && item._id) assignedSet.add(item._id);
          });
        } else if (typeof m === 'object' && m._id) {
          assignedSet.add(m._id);
        }
      });

    // Exclude assigned machines; deactivated employees' machines will not be in the set
    return machines.filter(machine => !assignedSet.has(machine._id));
  };

  

  // Role options for the new field
  const roleOptions = [
    { value: "user", label: "User" },
    { value: "employee", label: "Employee" }
  ];

  // Helper to check if Employee role includes 'User'
  const hasUserRole = () => {
    return Array.isArray(formData.employeeRole) && formData.employeeRole.includes('user');
  };
   
  const validateRoll = (role) => {
    if (!role || role.length === 0) {
      return "Please select at least one role";
    }
    return null;
  };
  const validateScanPermission = (permission) => {
    if (!permission || permission.length === 0) {
      return "Please select at least one permission";
    }
    return null;
  };

  // Helper function to check if RC role is selected (handles both 'rc' and 'RC')
  const hasRCRole = () => {
    return formData.role && formData.role.some(roleId => {
      const processItem = processSubMenuItems.find(item => item.value === roleId);
      if (!processItem || !processItem.label) return false;
      const labelLower = processItem.label.toLowerCase();
      return labelLower.includes('rc') || labelLower === 'rc';
    });
  };

  const validateMachine = (machine, role) => {
    // Check if any of the selected roles includes "RC" (case-insensitive)
    const hasRCRole = role && role.some(roleId => {
      const processItem = processSubMenuItems.find(item => item.value === roleId);
      if (!processItem || !processItem.label) return false;
      const labelLower = processItem.label.toLowerCase();
      return labelLower.includes('rc') || labelLower === 'rc';
    });
    
    // Machine is required only if RC role is selected
    if (hasRCRole && (!machine || machine.length === 0)) {
      return "Machine is required";
    }
    return null;
  };

  const validateEmployeeRole = (employeeRole) => {
    if (!employeeRole || employeeRole.length === 0) {
      return "Please select at least one role";
    }
    return null;
  };

  const handleChange = (fieldName, data) => {   
    if (fieldName === "employeeName") {
      const numericValue = typeof data === 'string' ? data.replace(/[^0-9]/g, '').slice(0, 4) : '';
      setFormData((prev) => ({ ...prev, [fieldName]: numericValue }));
      if (errors[fieldName]) {
        setErrors((prev) => ({ ...prev, [fieldName]: null }));
      }
      return;
    }
    if (fieldName === "ifscCode") {
      const upperValue = typeof data === 'string' ? data.toUpperCase() : '';
      setFormData((prev) => ({ ...prev, [fieldName]: upperValue }));
      if (errors[fieldName]) {
        setErrors((prev) => ({ ...prev, [fieldName]: null }));
      }
      return;
    }
      if (fieldName === "role") {
    const selectedRolls = Array.isArray(data) ? data : [];
    setFormData((prev) => ({ ...prev, [fieldName]: selectedRolls }));
    setErrors((prev) => ({ ...prev, [fieldName]: validateRoll(selectedRolls) }));
    
    // Clear machine error when role changes since requirement might change
    if (errors.machine) {
      setErrors((prev) => ({ ...prev, machine: null }));
    }
  } 
  if (fieldName === "scanPermission") {
    const selectedPermission = Array.isArray(data) ? data : [];
    setFormData((prev) => ({ ...prev, [fieldName]: selectedPermission }));
    setErrors((prev) => ({ ...prev, [fieldName]: validateScanPermission(selectedPermission) }));
  } 
    if (fieldName === "employeeRole") {
      const selectedRoles = Array.isArray(data) ? data : [];
      setFormData((prev) => ({ ...prev, [fieldName]: selectedRoles }));
      setErrors((prev) => ({ ...prev, [fieldName]: validateEmployeeRole(selectedRoles) }));
      // If 'User' role is not selected anymore, clear scanPermission and related error
      const isUserSelected = selectedRoles.includes('user');
      if (!isUserSelected) {
        setFormData((prev) => ({ ...prev, scanPermission: [] }));
        setErrors((prev) => ({ ...prev, scanPermission: null }));
      }
      return;
    }
    if (typeof data === 'object' && data !== null && data.hasOwnProperty('value')) {
      setFormData((prev) => ({ ...prev, [fieldName]: data.value }));
      setErrors((prev) => ({ ...prev, [fieldName]: data.error || null }));
    } else if (data && data.target && data.target.type === 'file') {
      setFormData((prev) => ({ ...prev, [fieldName]: data.target.files[0] }));
      if (errors[fieldName]) {
        setErrors((prev) => ({ ...prev, [fieldName]: null }));
      }
    } else {
      const directValue = data;
      setFormData((prev) => ({ ...prev, [fieldName]: directValue }));
      if (fieldName === "adharNumber") {
        const aadhaarError = validateAadhaar(directValue);
        setErrors((prev) => ({ ...prev, adharNumber: aadhaarError }));
      } else {
        if (errors[fieldName]) {
          setErrors((prev) => ({ ...prev, [fieldName]: null }));
        }
      }
    }
  };
  
  const handlePhoneChange = (fieldName, { value, error }) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  const validateAadhaar = (aadhaarNum) => {
    if (!aadhaarNum) return "Aadhaar Number is required.";
    if (!/^\d{12}$/.test(aadhaarNum)) return "Aadhaar Number must be 12 digits.";
    return "";
  };

  const validate = () => {
    const newErrors = { ...errors };
    let isValid = true;

    if (!formData.employeeName.trim()) {
      newErrors.employeeName = "Emp Code is required.";
      isValid = false;
    }
    if (!formData.firstName.trim()) { newErrors.firstName = "First Name is required."; isValid = false; }
    if (!formData.lastName.trim()) { newErrors.lastName = "Last Name is required."; isValid = false; }
    if (!formData.nickname.trim()) { newErrors.nickname = "Nick Name is required."; isValid = false; }
    if (!formData.role) { newErrors.role = "Process Name is required."; isValid = false; }
    // Scan Permission is required only when employee role contains 'User'
    if (hasUserRole()) {
      if (!formData.scanPermission || formData.scanPermission.length === 0) {
        newErrors.scanPermission = "Scan Permission is required.";
        isValid = false;
      } else {
        newErrors.scanPermission = "";
      }
    } else {
      newErrors.scanPermission = ""; // clear any previous error when not applicable
    }
    if (!formData.accountNumber.trim()) { newErrors.accountNumber = "Account Number is required."; isValid = false; }
    if (!formData.accountHolderName.trim()) { newErrors.accountHolderName = "Account Holder Name is required."; isValid = false; }
    if (!formData.ifscCode.trim()) { newErrors.ifscCode = "IFSC Code is required."; isValid = false; }
    if (!formData.bankName.trim()) { newErrors.bankName = "Bank Name is required."; isValid = false; }
    if (!formData.bankBranchName.trim()) { newErrors.bankBranchName = "Bank Branch Name is required."; isValid = false; }

    if (errors.email) isValid = false;
    else if (!formData.email) { newErrors.email = "Email is required."; isValid = false;}

      const rollError = validateRoll(formData.role);
      if (rollError) { 
        newErrors.role = rollError; 
        isValid = false;
      } else { 
        newErrors.role = ""; 
      }

    const employeeRoleError = validateEmployeeRole(formData.employeeRole);
    if (employeeRoleError) { 
      newErrors.employeeRole = employeeRoleError; 
      isValid = false;
    } else { 
      newErrors.employeeRole = ""; 
    }

    // Validate machine field based on RC role
    const machineError = validateMachine(formData.machine, formData.role);
    if (machineError) {
      newErrors.machine = machineError;
      isValid = false;
    } else {
      newErrors.machine = "";
    }

    const aadhaarError = validateAadhaar(formData.adharNumber);
    if (aadhaarError) { newErrors.adharNumber = aadhaarError; isValid = false; }
    else { newErrors.adharNumber = "";} 


    if (errors.mobileNumber) isValid = false;
    else if (!formData.mobileNumber) { newErrors.mobileNumber = "Mobile No. is required."; isValid = false; }

    if (!formData.adharCardFront) { newErrors.adharCardFront = "Aadhaar Card Front Photo is required."; isValid = false; }
    else { newErrors.adharCardFront = ""; }

    if (!formData.adharCardBack) { newErrors.adharCardBack = "Aadhaar Card Back Photo is required."; isValid = false; }
    else { newErrors.adharCardBack = ""; }

    if (errors.referenceMobileNumber) isValid = false;

    setErrors(newErrors);
    
    for (const key in newErrors) {
        if (newErrors[key]) {
            isValid = false;
            break;
        }
    }
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fill all required fields correctly.", { toastId: "add-employee-validation-error" });
      return;
    }
    setIsLoading(true);
    const payload = {
        employeeName: formData.employeeName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        nickname: formData.nickname,
        email: formData.email,
        adharNumber: formData.adharNumber,
        mobileNumber: formData.mobileNumber,
        referenceName: formData.referenceName,
        referenceMobileNumber: formData.referenceMobileNumber,
        adharCardFront: formData.adharCardFront,
        adharCardBack: formData.adharCardBack,
        role: formData.role || [],
        scanPermission: formData.scanPermission || [], // New field
        employeeRole: formData.employeeRole, // New field
        accountNumber: formData.accountNumber,
        accountHolderName: formData.accountHolderName,
        ifscCode: formData.ifscCode,
        bankName: formData.bankName,
        bankBranchName: formData.bankBranchName,
        machine: formData.machine || [],
        isHalfMonthSalary: Boolean(formData.isHalfMonthSalary),
    };

    try {
      await addEmployee(payload);
     
      onSubmitSuccess(); 
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

 

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-5 md:pb-6 ">
        <InputElement
          name="Emp Code"
          type="text"
          value={formData.employeeName}
          onChange={(val) => handleChange("employeeName", val)}
          placeholder="Enter Emp Code"
          is_required={true}
          error={errors.employeeName}
        />
        <InputElement
          name="First Name"
          type="text"
          value={formData.firstName}
          onChange={(val) => handleChange("firstName", val)}
          placeholder="Enter first name"
          is_required={true}
          error={errors.firstName}
        />
        <InputElement
          name="Last Name"
          type="text"
          value={formData.lastName}
          onChange={(val) => handleChange("lastName", val)}
          placeholder="Enter last name"
          is_required={true}
          error={errors.lastName}
        />
        <InputElement
          name="Nick Name"
          type="text"
          value={formData.nickname}
          onChange={(val) => handleChange("nickname", val)}
          placeholder="Enter nick name"
          is_required={true}
          error={errors.nickname}
        />
         <SelectElement
          name="Process Name"
          id="process-name"
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
        {hasRCRole() &&
        
        <SelectElement
          name="Machine"
          id="machine-select"
          value={formData.machine}
          // onChange={setSelectedMachines}
          onChange={(value) => handleChange("machine", value)}
          options={getAvailableMachines().map(m => ({ value: m._id, label: m.machineName }))}
          placeholder="Select Machine"
          is_required={true}
          variant="solid"
          className="w-full"
          isMulti={true}
          error={errors.machine}
        />
        }
       
        <InputElement
          name="Email"
          type="email"
          value={formData.email}
          onChange={(data) => handleChange("email", data)}
          placeholder="Enter email address"
          is_required={true}
          error={errors.email}
        />
        <InputElement
          name="Aadhaar Number"
          type="text" 
          value={formData.adharNumber}
          onChange={(val) => handleChange("adharNumber", val)}
          placeholder="Enter 12-digit Aadhaar number"
          is_required={true}
          error={errors.adharNumber}
          maxLength={12}
        />
        <div className="md:col-span-1">
          <InputElement
            name="Upload AadhaarCard Front Photo"
            type="file"
            onChange={(e) => handleChange("adharCardFront", e)}
            is_required={true}
            error={errors.adharCardFront}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-light-primary/10 file:text-light-primary hover:file:bg-light-primary/20"
          />
        </div>
        <div className="md:col-span-1">
          <InputElement
            name="Upload AadhaarCard Back Photo"
            type="file"
            onChange={(e) => handleChange("adharCardBack", e)}
            is_required={true}
            error={errors.adharCardBack}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-light-primary/10 file:text-light-primary hover:file:bg-light-primary/20"
          />
        </div>
        <div className="md:col-span-1">
          <PhoneInput
            name="Mobile No."
            value={formData.mobileNumber}
            onChange={(data) => handlePhoneChange("mobileNumber", data)}
            is_required={true}
            error={errors.mobileNumber}
          />
        </div>
        <SelectElement
          name="Role"
          id="employee-role"
          value={formData.employeeRole}
          onChange={(value) => handleChange("employeeRole", value)}
          options={roleOptions}
          placeholder="Select Role"
          error={errors?.employeeRole}
          is_required={true}
          isMulti={true}
          variant="solid"
          className="w-full"
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
         {hasUserRole() && (
            <SelectElement
          name="Scan Permission"
          id="scan-permission"
          value={formData.scanPermission}
          onChange={(value) => handleChange("scanPermission", value)}
          options={processSubMenuItems}
          placeholder="Select Scan Permission"
          error={errors?.scanPermission}
          is_required={true}
          isMulti={true}
          variant="solid"
          className="w-full scrollbar-hide"
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
        )}
        <InputElement
          name="Reference Name"
          type="text"
          value={formData.referenceName}
          onChange={(val) => handleChange("referenceName", val)}
          placeholder="Enter reference name"
          is_required={false}
          error={errors.referenceName}
        />
            <div className="">

        <PhoneInput
          name="Reference Mobile Number"
          value={formData.referenceMobileNumber}
          onChange={(data) => handlePhoneChange("referenceMobileNumber", data)}
          is_required={false}
          error={errors.referenceMobileNumber}
        />
        </div>

      </div>
        <div className="w-full px-4 md:p-5 md:pt-0 !m-0">
          <p className="pb-5 text-[18px] font-semibold text-light-darkGrey text-left">Bank Details</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

        <InputElement
          name="Account Number"
          type="text"
          value={formData.accountNumber}
          onChange={(val) => handleChange("accountNumber", val)}
          placeholder="Enter Account Number"
          is_required={true}
          error={errors.accountNumber}
        />
        <InputElement
          name="Account Holder Name"
          type="text"
          value={formData.accountHolderName}
          onChange={(val) => handleChange("accountHolderName", val)}
          placeholder="Enter Account Holder Name"
          is_required={true}
          error={errors.accountHolderName}
        />
        <InputElement
          name="IFSC Code"
          type="text"
          value={formData.ifscCode}
          onChange={(val) => handleChange("ifscCode", val)}
          placeholder="Enter IFSC Code"
          is_required={true}
          error={errors.ifscCode}
          className="uppercase"
        />
        <InputElement
          name="Bank Name"
          type="text"
          value={formData.bankName}
          onChange={(val) => handleChange("bankName", val)}
          placeholder="Enter Bank Name"
          is_required={true}
          error={errors.bankName}
        />
        <InputElement
          name="Bank Branch Name"
          type="text"
          value={formData.bankBranchName}
          onChange={(val) => handleChange("bankBranchName", val)}
          placeholder="Enter Bank Branch Name"
          is_required={true}
          error={errors.bankBranchName}
        />
        <div className="md:col-span-2">
          <div className="flex items-center justify-between rounded-md border border-light-border px-4 py-3">
            <span className="text-sm font-medium text-gray-700">Half month salary</span>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-semibold ${formData.isHalfMonthSalary ? 'text-light-primary' : 'text-gray-600'}`}>
                {formData.isHalfMonthSalary ? 'Half Month' : 'Full Month'}
              </span>
              <ToggleSwitch
                enabled={Boolean(formData.isHalfMonthSalary)}
                onChange={(nextValue) =>
                  setFormData((prev) => ({ ...prev, isHalfMonthSalary: Boolean(nextValue) }))
                }
              />
            </div>
          </div>
        </div>
          </div>

        </div>
        <div className="flex justify-end space-x-3 p-4 md:p-5 mt-2 bg-[#F7F3EE] border-t border-[#E8DFD4]">
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
                label={isLoading ? "Saving..." : "Submit"} 
                onClick={handleSubmit}
                disabled={isLoading}
                loading={isLoading}
                className="flex items-center space-x-2 shadow-none font-normal !rounded-md  px-4 py-2  transition-colors duration-200 focus:ring-0"
              />
            </div>
    
    </form>
  );
};

export default AddEmployeeForm;