import React, { useState } from 'react';
import InputElement from '../common/InputElement';
import SelectElement from '../common/Select';
import Button from '../common/Button';

const AddProductForm = ({ onSubmit, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState({
    date: '',
    lotNo: '',
    designNumber: '',
    color: '',
    size: '',
    layer: '',
    master: '',
    pic: '',
    // status: '',
    process: '',
    quantity: '',
    price: ''
  });

  const [errors, setErrors] = useState({});

  const sizeOptions = [
    { value: 'S', label: 'Small' },
    { value: 'M', label: 'Medium' },
    { value: 'L', label: 'Large' },
    { value: 'XL', label: 'Extra Large' }
  ];

  const validate = () => {
    const newErrors = {};
    const requiredFields = ['date', 'lotNo', 'designNumber', 'color', 'size', 'layer', 'master', 'pic'];
    
    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required.`;
      }
    });

    if (formData.quantity && (isNaN(formData.quantity) || Number(formData.quantity) <= 0)) {
      newErrors.quantity = 'Quantity must be a positive number.';
    }

    if (formData.price && (isNaN(formData.price) || Number(formData.price) <= 0)) {
      newErrors.price = 'Price must be a positive number.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field) => (value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        date:formData?.date,
        designNumber:formData?.designNumber,
        color: formData?.color,
        size: formData?.size,
        layer: formData?.layer,
        master: formData?.master,
        pic: formData?.pic,
        lotNo: formData?.lotNo,
        // status: formData?.status,

      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-5 mb-[92px]">
        <InputElement
          name="Date"
          type="date"
          value={formData.date}
          onChange={handleChange('date')}
          error={errors.date}
          is_required={true}
        />

        <InputElement
          name="Lot No"
          type="text"
          placeholder="Enter lot number"
          value={formData.lotNo}
          onChange={handleChange('lotNo')}
          error={errors.lotNo}
          is_required={true}
        />

        <InputElement
          name="D. No"
          type="text"
          placeholder="Enter D number"
          value={formData.designNumber}
          onChange={handleChange('designNumber')}
          error={errors.designNumber}
          is_required={true}
        />

        <InputElement
          name="Color"
          type="text"
          placeholder="Enter color"
          value={formData.color}
          onChange={handleChange('color')}
          error={errors.color}
          is_required={true}
        />
        
        <InputElement
          name="Size"
          type="text"
          placeholder="Enter size"
          value={formData.size}
          onChange={handleChange('size')}
          error={errors.color}
          is_required={true}
        />

        <InputElement
          name="Layer"
          type="text"
          placeholder="Enter layer"
          value={formData.layer}
          onChange={handleChange('layer')}
          error={errors.layer}
          is_required={true}
        />

        <InputElement
          name="Master"
          type="text"
          placeholder="Enter master"
          value={formData.master}
          onChange={handleChange('master')}
          error={errors.master}
          is_required={true}
        />

        <InputElement
          name="Pic"
          type="text"
          placeholder="Enter pic"
          value={formData.pic}
          onChange={handleChange('pic')}
          error={errors.pic}
          is_required={true}
        />

        {/* <InputElement
          name="Status"
          type="text"
          placeholder="Enter status"
          value={formData.status}
          onChange={handleChange('status')}
          error={errors.status}
          is_required={true}
        /> */}
      </div>

      <div className="flex justify-end space-x-3 p-4 md:p-5 absolute bottom-0 w-full bg-[#F7F3EE] border-t border-[#E8DFD4]">
        <Button 
          type="button" 
          variant="default" 
          onClick={onCancel} 
          label="Cancel" 
          className='focus:!ring-0' 
          disabled={isLoading} 
        />
        <Button 
          type="button" 
          variant="primary"
          loading={isLoading} 
          label={isLoading ? 'Adding...' : 'Add Product'} 
          className='focus:!ring-0' 
          onClick={handleSubmit}
        />
      </div>
    </form>
  );
};

export default AddProductForm;