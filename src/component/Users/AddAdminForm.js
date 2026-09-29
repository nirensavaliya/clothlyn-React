import React, { forwardRef, useImperativeHandle } from 'react';
import InputElement from '../common/InputElement';
import PhoneInput from '../common/PhoneInput';

const AddAdminForm = forwardRef(({ form, onChange, mode = 'add' }, ref) => {
  const [errors, setErrors] = React.useState({});

  const validate = () => {
    const newErrors = {};
    const emp = String(form.employeeCode || '').trim();
    if (!emp) {
      newErrors.employeeCode = 'Emp Code is required.';
    } else if (!/^\d{1,4}$/.test(emp)) {
      newErrors.employeeCode = 'Emp Code must be 1–4 digits.';
    }
    if (!String(form.username || '').trim()) {
      newErrors.username = 'Name is required.';
    }
    if (!String(form.phoneNumber || '').trim()) {
      newErrors.phoneNumber = 'Mobile number is required.';
    } else if (!/^\d{10}$/.test(String(form.phoneNumber).trim())) {
      newErrors.phoneNumber = 'Mobile number must be 10 digits.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useImperativeHandle(ref, () => ({ validate }));

  const handleChange = (field, value) => {
    if (field === 'employeeCode') {
      const numericValue = String(value || '').replace(/[^0-9]/g, '').slice(0, 4);
      onChange({ ...form, [field]: numericValue });
      setErrors((prev) => ({ ...prev, [field]: undefined }));
      return;
    }
    onChange({ ...form, [field]: value });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    validate();
  };

  return (
    <form className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-5" onSubmit={onSubmit}>
      <div className="col-span-1 max-sm:col-span-2">
        <InputElement
          name="Emp Code"
          value={form?.employeeCode}
          onChange={(value) => handleChange('employeeCode', value)}
          placeholder="Enter Emp Code"
          is_required
          error={errors.employeeCode}
          type="text"
        />
      </div>
      <div className="col-span-1 max-sm:col-span-2">
        <InputElement
          name="Name"
          value={form?.username}
          onChange={(value) => handleChange('username', value)}
          placeholder="Enter name"
          is_required
          error={errors.username}
          type="text"
        />
      </div>
      <div className="col-span-2">
        <PhoneInput
          name="Mobile Number"
          value={form?.phoneNumber}
          onChange={({ value }) => handleChange('phoneNumber', value)}
          placeholder="Enter mobile number"
          is_required
          error={errors.phoneNumber}
          type="tel"
        />
      </div>
    </form>
  );
});

AddAdminForm.displayName = 'AddAdminForm';

export default AddAdminForm;
