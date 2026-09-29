import React from 'react';
import InputElement from '../common/InputElement';
import PhoneInput from '../common/PhoneInput';

const EditAdminForm = ({ form, onChange }) => {
  const handleChange = (field, value) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <form className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-5" onSubmit={e => e.preventDefault()}>
            <div className="col-span-2">

      <InputElement
        name="Emp Code"
        value={form?.employeeCode ?? ''}
        onChange={(value) => {
          const numericValue = String(value || '').replace(/[^0-9]/g, '').slice(0, 4);
          handleChange('employeeCode', numericValue);
        }}
        placeholder="Enter Emp Code"
        is_required
        type="text"
      />
      </div>
            <div className="col-span-1 max-sm:col-span-2">

      <InputElement
        name="Name"
        value={form?.username ?? ''}
        onChange={(value) => handleChange('username', value)}
        placeholder="Enter name"
        is_required
        type="text"
      />
      </div>
      <div className="col-span-1 max-sm:col-span-2">
        <PhoneInput
          name="Mobile Number"
          value={form?.phoneNumber ?? ''}
          onChange={({ value }) => handleChange('phoneNumber', value)}
          placeholder="Enter mobile number"
          is_required
          type="tel"
        />
      </div>
    </form>
  );
};

export default EditAdminForm; 