import React, { useState, useEffect } from "react";
import InputElement from "../common/InputElement";
import Button from "../common/Button";
import { toast } from "react-toastify";
import { getProcesses } from "../../apis/processApi";
import { capitalize } from "../../helpers/utils";

const UpdateDesignRateByDateForm = ({
  designData,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    designId: "",
    designNumber: "",
    processes: [],
  });
  const [errors, setErrors] = useState({ processes: [] });
  const [processMasterList, setProcessMasterList] = useState([]);
  const [isLoadingProcesses, setIsLoadingProcesses] = useState(false);

  useEffect(() => {
    const fetchProcessMaster = async () => {
      setIsLoadingProcesses(true);
      try {
        const response = await getProcesses();
        const uniqueItems =
          response?.data?.reduce((acc, item) => {
            if (
              !acc.some(
                (existingItem) => existingItem.processName === item.processName
              )
            ) {
              acc.push(item);
            }
            return acc;
          }, []) || [];
        setProcessMasterList(
          uniqueItems.map((p) => ({ value: p._id, label: p.processName }))
        );
      } catch (error) {
        toast.error("Failed to load process master list.", { toastId: 'process-master-list-error' });
      } finally {
        setIsLoadingProcesses(false);
      }
    };
    fetchProcessMaster();
  }, []);

  
  useEffect(() => {
    if (designData?.processes?.length > 0) {
      

      setFormData({
        designId: designData._id,
        designNumber: designData.designNumber || "",
        processes: designData?.processes,
      });
      setErrors({ processes: designData?.processes.map(() => ({})) });
    }
  }, [designData]);

  const handleChange = (index, fieldName, value) => {
    const newProcesses = [...formData.processes];
    const newProcessErrors = errors.processes ? [...errors.processes] : [];
    
    if (!newProcessErrors[index]) {
      newProcessErrors[index] = {};
    }

    newProcesses[index] = { ...newProcesses[index], [fieldName]: value };

    if (fieldName === "price") {
      if (value && !/^[0-9]*\.?[0-9]*$/.test(value)) {
        newProcessErrors[index].price = "Rate must be a valid number.";
      } else {
        delete newProcessErrors[index].price;
      }
    } else if (fieldName === "startDate" || fieldName === "endDate") {
      const { startDate, endDate } = newProcesses[index];
      if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
        newProcessErrors[index].endDate = "End date cannot be before start date.";
      } else {
        delete newProcessErrors[index].endDate;
      }
      if (fieldName === "endDate" && newProcessErrors[index].endDate === undefined) {
         delete newProcessErrors[index].startDate;
      }
      if (fieldName === "startDate" && newProcessErrors[index].startDate === undefined) {
         delete newProcessErrors[index].endDate;
      }
    }

    setFormData((prev) => ({ ...prev, processes: newProcesses }));
    setErrors((prev) => ({ ...prev, processes: newProcessErrors }));
  };

  const handleMachineDetailChange = (processIndex, machineIndex, field, value) => {
    const newProcesses = [...formData.processes];
    if (!newProcesses[processIndex].machineDetails) return;
    newProcesses[processIndex].machineDetails[machineIndex][field] = value;
    setFormData((prev) => ({ ...prev, processes: newProcesses }));
  };

  const processHasMachines = (proc) =>
    Array.isArray(proc?.machineDetails) && proc.machineDetails.length > 0;

  const validateForm = () => {
    let formIsValid = true;
    const newProcessErrors = formData.processes.map((proc, index) => {
      const currentErrors = errors.processes[index] ? {...errors.processes[index]} : {};
      const isMachineProcess = processHasMachines(proc);
      
      const hasRate = isMachineProcess 
        ? proc.machineDetails?.some(m => m.baseRate && m.baseRate.toString().trim() !== "") 
        : (proc.price && proc.price.toString().trim() !== "");

      if (hasRate && !proc.startDate) {
        currentErrors.startDate = "Start date is required if rate is provided.";
        formIsValid = false;
      }
      
      if (proc.startDate && proc.endDate && new Date(proc.endDate) < new Date(proc.startDate)) {
        currentErrors.endDate = "End date cannot be before start date.";
        formIsValid = false;
      }
      return currentErrors;
    });
    
    setErrors(prev => ({...prev, processes: newProcessErrors }));
    return formIsValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const payload = {
        designId: formData.designId,
        processRateUpdates: formData.processes
          .filter(p => {
            const isMachineProcess = processHasMachines(p);
            const hasRate = isMachineProcess 
              ? p.machineDetails?.some(m => m.baseRate !== undefined && m.baseRate !== null && m.baseRate.toString().trim() !== "") 
              : (p.price !== undefined && p.price !== null && p.price.toString().trim() !== "");
            return hasRate && p.startDate;
          })
          .map(p => {
            const isMachineProcess = processHasMachines(p);
            
            // Find the actual master process ID
            const masterProcess = processMasterList.find(m => 
              m.label?.toLowerCase() === p.processName?.toLowerCase()
            );
            const actualProcessId = masterProcess ? masterProcess.value : (p.processId || p._id);

            const update = {
              processId: actualProcessId,
              startDate: p.startDate,
              endDate: p.endDate || null,
            };

            if (isMachineProcess) {
              update.machineDetails = p.machineDetails.map(m => ({
                ...m,
                baseRate: parseFloat(m.baseRate) || 0
              }));
              // Sum up machine rates for the total process price
              update.newPrice = update.machineDetails.reduce((sum, m) => sum + (m.baseRate || 0), 0);
            } else {
              update.newPrice = parseFloat(p.price) || 0;
            }

            return update;
          }),
      };
      
      console.log('Update Rates Payload:', payload);
      
      if (payload.processRateUpdates.length === 0) {
        toast.info("No rate information provided to update.");
        return;
      }
      onSubmit(payload);
    } else {
      toast.error("Please correct the errors in the form.", { toastId: 'design-rate-update-form-error' });
    }
  };

  if (isLoadingProcesses || !designData) {
    return <div>Loading form...</div>;
  }
  
  if (!formData.processes || formData.processes.length === 0) {
    return <div className="p-4">No processes associated with this design to update rates for.</div>
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="p-6 space-y-6">
        <h3 className="text-lg font-semibold">
          Design: {capitalize(formData.designNumber)}
        </h3>
        {formData.processes.map((process, index) => {
          const today = new Date();
          const defaultEndDate = today.toISOString().slice(0, 10);
          const isMachineProcess = processHasMachines(process);
          
          return (
            <div
              key={process.processId || index}
              className="p-4 border border-light-natural_300 rounded-md space-y-3"
            >
              <p className="font-medium text-left text-[18px]">Process: {capitalize(process.processName)}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {!isMachineProcess ? (
                  <InputElement
                    name={`Rate`}
                    label="Rate"
                    type="text"
                    placeholder="Enter Rate"
                    value={process?.price}
                    onChange={(val) => handleChange(index, "price", val)}
                    error={errors.processes[index]?.price}
                  />
                ) : (
                  <div className="md:col-span-2 space-y-3">
                    <p className="text-sm font-semibold text-gray-600 text-left">Machine Rates</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {process.machineDetails?.map((machine, mIdx) => (
                        <InputElement
                          key={mIdx}
                          name={machine.machineName || `Machine ${mIdx + 1}`}
                          label={machine.machineName || `Machine ${mIdx + 1}`}
                          type="text"
                          placeholder="Enter Rate"
                          value={machine.baseRate}
                          onChange={(val) => handleMachineDetailChange(index, mIdx, "baseRate", val)}
                          is_required={false}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                <InputElement
                  name={`StartDate`}
                  label="Start Date"
                  type="date"
                  value={process.startDate ? process.startDate.slice(0, 10) : ''}
                  onChange={(val) => handleChange(index, "startDate", val)}
                  error={errors.processes[index]?.startDate}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end space-x-3 p-6 border-t border-light-border">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          label="Cancel"
        />
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          label={ "Update Rates"}
        />
      </div>
    </form>
  );
};

export default UpdateDesignRateByDateForm;