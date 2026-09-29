import React from 'react';
import Button from '../common/Button';
import InputElement from '../common/InputElement';

const EditMachineForm = ({ form, onChange }, ref) => {
  const [errors, setErrors] = React.useState({});

  const validate = () => {
    const newErrors = {};
    if (!form.machineName.trim()) {
      newErrors.machineName = 'Machine name is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    onChange({ ...form, [field]: value });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  React.useImperativeHandle(ref, () => ({
    validate,
  }));

  return (
    <form className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-5" onSubmit={e => e.preventDefault()}>
      <div className="col-span-2">
        <InputElement
          name="Machine Name"
          value={form.machineName}
          onChange={(value) => handleChange('machineName', value)}
          placeholder="Enter machine name"
          is_required
          error={errors.machineName}
          type="text"
        />
      </div>
    </form>
  );
};

export default EditMachineForm; 