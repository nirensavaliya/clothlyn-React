import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import InputElement from '../common/InputElement';
import SelectElement from '../common/Select';

const EditUpadModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  employees = [],
  isLoadingEmployees = false,
  error = null,
  upadData = null
}) => {
  const [editData, setEditData] = useState({
    employeeId: '',
    upadAmount: '',

  });

  useEffect(() => {
    if (upadData) {
      let employeeId = '';
      if (upadData.employeeId) {
        if (typeof upadData.employeeId === 'object' && upadData.employeeId._id) {
          employeeId = upadData.employeeId._id;
        } else if (typeof upadData.employeeId === 'string') {
          employeeId = upadData.employeeId;
        }
      }

      setEditData({
        employeeId: employeeId,
        upadAmount: upadData.upadAmount || upadData.amount || '',

      });
    }
  }, [upadData]);

  const isFormValid = editData.employeeId && editData.upadAmount && editData.upadAmount > 0;

  const handleSubmit = () => {
    if (!isFormValid) {
      return;
    }
    
    const apiData = {
      employeeId: editData.employeeId,
      upadAmount: editData.upadAmount,

    };
    
    onSubmit(upadData._id || upadData.id, apiData);
  };

  const handleClose = () => {
    setEditData({
      employeeId: '',
      upadAmount: '',

    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit UPAD Record"
      size="md"
      footerContent={
        <div className="flex justify-end gap-2">
          <Button label="Cancel" variant="secondary" onClick={handleClose} />
          <Button 
            label="Update UPAD" 
            variant="primary" 
            onClick={handleSubmit} 
            loading={isLoading}
            disabled={!isFormValid}
          />
        </div>
      }
    >
      <div className="p-6 space-y-4">
        <SelectElement
          name="Select Employee"
          value={editData.employeeId}
          onChange={(value) => setEditData({ ...editData, employeeId: value })}
          options={employees}
          placeholder="Select an employee"
          is_required
          menuPortalTarget={document.body}
          disabled
        />
        
        <InputElement
          name="UPAD Amount"
          value={editData.upadAmount}
          onChange={(value) => setEditData({ ...editData, upadAmount: value })}
          placeholder="Enter UPAD amount"
          type="number"
          is_required
        />
        
        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
      </div>
    </Modal>
  );
};

export default EditUpadModal;
