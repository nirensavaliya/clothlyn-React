import React, { useState, useEffect } from "react";
import InputElement from "../common/InputElement";
import SelectElement from "../common/Select";
import Button from "../common/Button";
import { toast } from "react-toastify";
import { getProcesses } from "../../apis/processApi";
import classNames from "classnames";
import { PlusIcon } from "lucide-react";
import moment from 'moment';

const sizeOptions = [
  { value: 'S', label: 'Small' },
  { value: 'M', label: 'Medium' },
  { value: 'L', label: 'Large' },
  { value: 'XL', label: 'Extra Large' }
];

const UpdateProductForm = ({ itemData, onSubmit, onCancel, isLoading }) => {
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

    quantity: '',
    price: '',
    processes: [{ processId: '', rate: '' }],
  });
  const [errors, setErrors] = useState({ processes: [] });
  const [processSubMenuItems, setProcessSubMenuItems] = useState([]);
  const [isLoadingProcessSubItems, setIsLoadingProcessSubItems] = useState(false);

  useEffect(() => {
    const fetchProcessSubItems = async () => {
      setIsLoadingProcessSubItems(true);
      try {
        const subItems = await getProcesses();
        const uniqueItems =
          subItems?.data?.reduce((acc, item) => {
            if (!acc.some((existingItem) => existingItem.processName === item.processName)) {
              acc.push(item);
            }
            return acc;
          }, []) || [];
        const options = uniqueItems.map((item) => ({
          value: item._id,
          label: item.processName,
        }));
        setProcessSubMenuItems(options);
      } catch (error) {
        toast.error(error.message || "Could not load Process sub-items.", { toastId: 'process-sub-items-error' });
      } finally {
        setIsLoadingProcessSubItems(false);
      }
    };
    fetchProcessSubItems();
  }, []);

  useEffect(() => {
    if (itemData) {
      setFormData({
        date: itemData.date || '',
        lotNo: itemData.lotNo || '',
        designNumber: itemData.designNumber || '',
        color: itemData.color || '',
        size: itemData.size || '',
        layer: itemData.layer || '',
        master: itemData.master || '',
        pic: itemData.pic || '',
        // status: itemData.status || '',
        quantity: itemData.quantity || '',
        price: itemData.price || '',
        processes: itemData.process && Array.isArray(itemData.process)
          ? itemData.process.map((entry) => ({
              processId: entry.status || entry._id || '',
              rate: entry.rate || '',
              timestamp: entry.timestamp,
            }))
          : [{ processId: '', rate: '' }],
      });
      setErrors({ processes: itemData.process && Array.isArray(itemData.process) ? itemData.process.map(() => ({})) : [{}] });
    } else {
      setFormData(prev => ({ ...prev, processes: [{ processId: '', rate: '' }] }));
      setErrors(prev => ({ ...prev, processes: [{}] }));
    }
  }, [itemData]);

  const handleChange = (field) => (value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleProcessChange = (index, name, value) => {
    const newProcesses = [...formData.processes];
    const newErrorsProcesses = errors.processes ? [...errors.processes] : [];
    while (newErrorsProcesses.length < newProcesses.length) {
      newErrorsProcesses.push({});
    }
    newProcesses[index] = { ...newProcesses[index], [name]: value };
    if (name === "rate") {
      if (value && !/^[0-9]*\.?[0-9]*$/.test(value)) {
        newErrorsProcesses[index] = {
          ...newErrorsProcesses[index],
          rate: "Rate must be a valid number.",
        };
      } else {
        if (newErrorsProcesses[index]) {
          delete newErrorsProcesses[index].rate;
        }
      }
    } else if (name === "processId") {
      if (!value) {
        newProcesses[index].rate = "";
        if (newErrorsProcesses[index]) {
          delete newErrorsProcesses[index].rate;
        }
      }
      if (newErrorsProcesses[index]) {
        delete newErrorsProcesses[index].processId;
      }
    }
    setFormData((prev) => ({ ...prev, processes: newProcesses }));
    setErrors((prev) => ({ ...prev, processes: newErrorsProcesses }));
  };

  const addProcessRow = () => {
    const lastProcess = formData.processes[formData.processes.length - 1];
    if (formData.processes.length > 0 && (!lastProcess || !lastProcess.processId)) {
      toast.error("Please select a process for the current row before adding a new one.", { toastId: 'process-current-adding-error' });
      const newErrorsProcesses = errors.processes ? [...errors.processes] : [];
      while (newErrorsProcesses.length < formData.processes.length) {
        newErrorsProcesses.push({});
      }
      if (newErrorsProcesses.length > 0 && !newErrorsProcesses[formData.processes.length - 1].processId) {
        newErrorsProcesses[formData.processes.length - 1] = {
          ...newErrorsProcesses[formData.processes.length - 1],
          processId: "Process is required before adding another.",
        };
        setErrors((prev) => ({ ...prev, processes: newErrorsProcesses }));
      }
      return;
    }
    if (formData.processes.length >= processSubMenuItems.length && processSubMenuItems.length > 0) {
      toast.info("All available processes have been added.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      processes: [...prev.processes, { processId: '', rate: '' }],
    }));
    setErrors((prev) => ({
      ...prev,
      processes: [...(prev.processes || []), {}],
    }));
  };

  const removeProcessRow = (index) => {
    const newProcesses = formData.processes.filter((_, i) => i !== index);
    const newErrorsProcesses = (errors.processes || []).filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, processes: newProcesses.length > 0 ? newProcesses : [{ processId: '', rate: '' }] }));
    setErrors((prev) => ({ ...prev, processes: newErrorsProcesses.length > 0 ? newErrorsProcesses : [{}] }));
  };

  const getAvailableProcessOptions = (currentIndex) => {
    const selectedProcessIds = formData.processes
      .map((p, index) => (index !== currentIndex ? p.processId : null))
      .filter(Boolean);
    return processSubMenuItems.filter(
      (option) => !selectedProcessIds.includes(option.value)
    );
  };

  const validate = () => {
    const newErrors = { processes: formData.processes.map(() => ({})) };
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
    formData.processes.forEach((proc, index) => {
      if (proc.processId && !proc.rate?.toString().trim()) {
        newErrors.processes[index].rate = "Rate is required.";
      } else if (proc.processId && proc.rate?.toString().trim() && errors.processes[index]?.rate) {
        newErrors.processes[index].rate = errors.processes[index].rate;
      }
      if (!proc.processId && proc.rate?.toString().trim()) {
        newErrors.processes[index].processId = "Process is required if rate is entered.";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).filter(key => key !== 'processes' || newErrors.processes.some(e => Object.keys(e).length > 0)).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const updatePayload = {
        date: formData.date,
        lotNo: formData.lotNo,
        designNumber: formData.designNumber,
        color: formData.color,
        size: formData.size,
        layer: formData.layer,
        master: formData.master,
        pic: formData.pic,
        // status: formData.status,
        // quantity: formData.quantity,
        // price: formData.price,
        process: formData.processes
          .filter(p => p.processId)
          .map(p => ({
            status: p.processId,
            rate: p.rate,
            timestamp: p.timestamp || new Date().toISOString()
          })),
      };
      onSubmit(itemData._id, updatePayload);
    } else {
      toast.error("Please correct the errors in the form.", { toastId: 'product-update-form-error' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-5 mb-[90px]">
        <InputElement
          name="Date"
          type="date"
          value={formData.date}
          onChange={handleChange('date')}
          error={errors.date}
          is_required={true}
          max={moment().format('YYYY-MM-DD')}
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
          error={errors.size}
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
        {/* <InputElement
          name="Quantity"
          type="text"
          placeholder="Enter quantity"
          value={formData.quantity}
          onChange={handleChange('quantity')}
          error={errors.quantity}
          is_required={false}
        />
        <InputElement
          name="Price"
          type="text"
          placeholder="Enter price"
          value={formData.price}
          onChange={handleChange('price')}
          error={errors.price}
          is_required={false}
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
          type="submit"
          variant="primary"
          loading={isLoading}
          label={"Update Product"}
          className='focus:!ring-0'
        />
      </div>
    </form>
  );
};

export default UpdateProductForm;
