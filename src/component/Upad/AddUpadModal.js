import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import InputElement from '../common/InputElement';
import SelectElement from '../common/Select';

const AddUpadModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  employees = [],
  isLoadingEmployees = false,
  error = null
}) => {
  const [upadData, setUpadData] = useState({
    employeeId: '',
    totalSalary: '',
    upadAmount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const selectedEmployee = employees.find(
    (e) => String(e.value) === String(upadData.employeeId)
  );

  const formatRupee = (n) =>
    `₹${Number(n ?? 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // Check if form is valid (employee selected and amount entered)
  const isFormValid = upadData.employeeId && upadData.upadAmount && upadData.upadAmount > 0;

  const handleSubmit = () => {
    if (!isFormValid) {
      return;
    }
    
    // Prepare data for API call
    const apiData = {
      employeeId: upadData.employeeId,
      upadAmount: Number(upadData.upadAmount),
      totalSalary: Number(upadData.totalSalary ?? 0),
    };
    
    onSubmit(apiData);
  };

  const handleClose = () => {
    setUpadData({
      employeeId: '',
      totalSalary: '',
      upadAmount: '',
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add UPAD"
      size="md"
      footerContent={
        <div className="flex justify-end gap-2">
          <Button label="Cancel" variant="secondary" onClick={handleClose} />
          <Button 
            label="Add UPAD" 
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
          value={upadData.employeeId}
          onChange={(value) => {
            const opt = employees.find((e) => String(e.value) === String(value));
            setUpadData({
              ...upadData,
              employeeId: value,
              totalSalary:
                opt != null && opt.totalSalary != null && opt.totalSalary !== ''
                  ? String(opt.totalSalary)
                  : '0',
            });
          }}
          options={employees}
          placeholder="Select an employee"
          is_required
          isLoading={isLoadingEmployees}
          menuPortalTarget={document.body}
        />

        {upadData.employeeId && selectedEmployee ? (
          <div className="space-y-3 rounded-md border border-light-border bg-light-natural_50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-light-lightGrey">
              Salary summary (from master)
            </p>
            <div className="grid gap-2 text-sm text-light-text sm:grid-cols-2">
              <div className="flex justify-between gap-2 sm:flex-col sm:justify-start">
                <span className="text-light-lightGrey">Total salary</span>
                <span className="font-medium">{formatRupee(selectedEmployee.totalSalary)}</span>
              </div>
              <div className="flex justify-between gap-2 sm:flex-col sm:justify-start">
                <span className="text-light-lightGrey">Current period salary</span>
                <span className="font-medium">{formatRupee(selectedEmployee.currentTotalSalary)}</span>
              </div>
              <div className="flex justify-between gap-2 sm:flex-col sm:justify-start">
                <span className="text-light-lightGrey">Total upad</span>
                <span className="font-medium">{formatRupee(selectedEmployee.totalUpad)}</span>
              </div>
              <div className="flex justify-between gap-2 sm:flex-col sm:justify-start">
                <span className="text-light-lightGrey">Paid salary</span>
                <span className="font-medium">{formatRupee(selectedEmployee.totalPaid)}</span>
              </div>
              <div className="flex justify-between gap-2 border-t border-light-border pt-2 sm:col-span-2 sm:flex-row sm:items-center">
                <span className="font-medium text-light-text">Net amount</span>
                <span className="font-semibold text-light-primary">{formatRupee(selectedEmployee.netSalary)}</span>
              </div>
            </div>
          </div>
        ) : null}
        
        <InputElement
          name="UPAD Amount"
          value={upadData.upadAmount}
          onChange={(value) => setUpadData({ ...upadData, upadAmount: value })}
          placeholder="Enter UPAD amount"
          type="number"
          is_required
        />
        
        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
      </div>
    </Modal>
  );
};

export default AddUpadModal;