import React, { useState, useEffect, useRef } from "react";
import InputElement from "../common/InputElement";
import SelectElement from "../common/Select";
import Button from "../common/Button";
import { toast } from "react-toastify";
import { getProcesses } from "../../apis/processApi";
import { getMachines } from "../../apis/machineApi";
import { getEmployees } from "../../apis/employeeApi";
import { mapEmployeeToSelectOption, resolveProcessNeedsMachine } from "../../helpers/utils";
import classNames from "classnames";
import { PlusIcon, Trash2Icon, GripVertical } from "lucide-react";
import { getAuthUserId } from "../../utils/authToken";

const createProcessRow = (overrides = {}) => ({
  rowId: `proc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  processId: "",
  rate: "",
  multiRate: "",
  singleRate: "",
  machineId: "",
  employeeId: "",
  machineDetails: [],
  ...overrides,
});

const AddDesignForm = ({ designData, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    designNumber: "",
    processes: [createProcessRow()],
  });
  const [errors, setErrors] = useState({ processes: [{}] });
  const processContainerRef = useRef(null);
  const dragIndexRef = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const [processSubMenuItems, setProcessSubMenuItems] = useState([]);
  const [machines, setMachines] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoadingProcessSubItems, setIsLoadingProcessSubItems] = useState(false);
  const [isLoadingMachines, setIsLoadingMachines] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));

  

  const fetchProcessSubItems = async () => {
    setIsLoadingProcessSubItems(true);
    try {
      const subItems = await getProcesses();
      const uniqueItems =
        subItems?.data?.reduce((acc, item) => {
          if (
            !acc.some(
              (existingItem) => existingItem.processName === item.processName
            )
          ) {
            acc.push(item);
          }
          return acc;
        }, []) || [];
      const options = uniqueItems.map((item) => ({
        value: item._id,
        label: item.processName,
        needsMachine: !!item.needsMachine,
        hasSendReceive: !!item.hasSendReceive,
      }));
      setProcessSubMenuItems(options);
    } catch (error) {
      toast.error(error.message || "Could not load Process sub-items.", { toastId: 'process-sub-items-error' });
    } finally {
      setIsLoadingProcessSubItems(false);
    }
  };

  const fetchMachines = async () => {
    setIsLoadingMachines(true);
    try {
      const response = await getMachines();
      const uniqueMachineNames = new Map();
      
      response?.data?.forEach((machine) => {
        const machineName = machine.machineName || machine.name;
        if (machineName) {
          const baseName = machineName.replace(/\s+\d+$/, '').trim();
          
          if (!uniqueMachineNames.has(baseName)) {
            uniqueMachineNames.set(baseName, {
              value: machine._id,
              label: baseName,
              originalMachine: machine
            });
          }
        }
      });
      
      const machineOptions = Array.from(uniqueMachineNames.values());
      setMachines(machineOptions);
    } catch (error) {
      toast.error(error.message || "Could not load machines.",  { toastId: 'machine-error' });
    } finally {
      setIsLoadingMachines(false);
    }
  };

  const fetchEmployees = async (processName) => {
    
    setIsLoadingEmployees(true);
    try {
      const response = await getEmployees({processName: `${processName}`});
      // console.log(response?.data, "response?.dataresponse?.data");
      
      const employeeOptions = response?.data?.map((employee) =>
        mapEmployeeToSelectOption(employee, {
          extra: { clientCode: employee.employeeName },
        })
      ) || [];
      setEmployees(employeeOptions);
    } catch (error) {
      toast.error(error.message || "Could not load employees.", { toastId: 'employee-error' });
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  useEffect(() => {
    fetchProcessSubItems();
    fetchMachines();
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (designData) {
      const existingProcesses =
        designData.process && Array.isArray(designData.process)
          ? designData.process.map((entry) =>
              createProcessRow({
                processId: entry.status || entry._id || "",
                rate: entry.rate || "",
                multiRate: entry.multiRate || "",
                singleRate: entry.singleRate || "",
                machineId: entry.machineId || "",
                employeeId: entry.employeeId || "",
                machineDetails: entry.machineDetails || [],
                timestamp: entry.timestamp,
              })
            )
          : [createProcessRow()];

      setFormData({
        designNumber: designData.designNumber || "",
        processes:
          existingProcesses.length > 0 ? existingProcesses : [createProcessRow()],
      });
      setErrors({ processes: existingProcesses.map(() => ({})) });
    } else {
      setFormData({
        designNumber: "",
        processes: [createProcessRow()],
      });
      setErrors({ processes: [{}] });
    }
  }, [designData]);

  const processNeedsMachine = (processId) => {
    const process = processSubMenuItems.find((p) => p.value === processId);
    return resolveProcessNeedsMachine(process);
  };

  const isDoraCutProcess = (processId) => {
    const process = processSubMenuItems.find(p => p.value === processId);
    return process?.label?.toLowerCase().includes('doracut') || process?.label?.toLowerCase().includes('dora cut');
  };

  const isSendReceiveProcess = (processId) => {
    const process = processSubMenuItems.find((p) => p.value === processId);
    if (!process) return false;
    if (process.hasSendReceive) return true;
    return isDoraCutProcess(processId);
  };

  const handleProcessChange = (index, name, value) => {
    const newProcesses = [...formData.processes];
    const newErrorsProcesses = errors.processes ? [...errors.processes] : [];
    while (newErrorsProcesses.length < newProcesses.length) {
      newErrorsProcesses.push({});
    }

    newProcesses[index] = { ...newProcesses[index], [name]: value };

    // Reset machine and employee when process changes
    if (name === "processId") {
      newProcesses[index].machineId = "";
      newProcesses[index].employeeId = "";
      newProcesses[index].machineDetails = [];
      newProcesses[index].rate = "";
      newProcesses[index].multiRate = "";
      newProcesses[index].singleRate = "";
    }

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
    } else if (name === "multiRate") {
      if (value && !/^[0-9]*\.?[0-9]*$/.test(value)) {
        newErrorsProcesses[index] = {
          ...newErrorsProcesses[index],
          multiRate: "Multi Rate must be a valid number.",
        };
      } else {
        if (newErrorsProcesses[index]) {
          delete newErrorsProcesses[index].multiRate;
        }
      }
    } else if (name === "singleRate") {
      if (value && !/^[0-9]*\.?[0-9]*$/.test(value)) {
        newErrorsProcesses[index] = {
          ...newErrorsProcesses[index],
          singleRate: "Single Rate must be a valid number.",
        };
      } else {
        if (newErrorsProcesses[index]) {
          delete newErrorsProcesses[index].singleRate;
        }
      }
    } else if (name === "processId") {
      if (!value) {
        newProcesses[index].rate = "";
        newProcesses[index].multiRate = "";
        newProcesses[index].singleRate = "";
        if (newErrorsProcesses[index]) {
          delete newErrorsProcesses[index].rate;
          delete newErrorsProcesses[index].multiRate;
          delete newErrorsProcesses[index].singleRate;
        }
      }
      if (newErrorsProcesses[index]) {
        delete newErrorsProcesses[index].processId;
      }
      if (value) {
        const selectedProcess = processSubMenuItems.find(p => p.value === value);
        if (selectedProcess) {
          fetchEmployees(selectedProcess.label);
        }
      }
    }

    setFormData((prev) => ({ ...prev, processes: newProcesses }));
    setErrors((prev) => ({ ...prev, processes: newErrorsProcesses }));
  };

  const handleMachineChange = (index, value) => {
    const newProcesses = [...formData.processes];
    newProcesses[index] = { ...newProcesses[index], machineId: value };
    
    // Preserve existing machine details and only add/remove as needed
    if (value && Array.isArray(value) && value.length > 0) {
      const existingMachineDetails = newProcesses[index].machineDetails || [];
      const newMachineDetails = [];
      
      // For each selected machine ID
      value.forEach(machineId => {
        // Check if this machine already exists in machineDetails
        const existingDetail = existingMachineDetails.find(detail => detail.machineId === machineId);
        
        if (existingDetail) {
          // Keep existing machine detail with preserved baseRate
          newMachineDetails.push(existingDetail);
        } else {
          // Add new machine detail
          const machine = machines.find(m => m.value === machineId);
          newMachineDetails.push({
            machineId: machineId,
            machineName: machine ? machine.label : "",
            baseRate: ""
          });
        }
      });
      
      newProcesses[index].machineDetails = newMachineDetails;
    } else {
      newProcesses[index].machineDetails = [];
    }
    
    setFormData((prev) => ({ ...prev, processes: newProcesses }));
  };


  const removeMachineDetail = (processIndex, machineIndex) => {
    const newProcesses = [...formData.processes];
    newProcesses[processIndex].machineDetails.splice(machineIndex, 1);
    
    // Update machineId array to match remaining machine details
    const remainingMachineIds = newProcesses[processIndex].machineDetails.map(detail => detail.machineId);
    newProcesses[processIndex].machineId = remainingMachineIds;
    
    setFormData((prev) => ({ ...prev, processes: newProcesses }));
  };

  const handleMachineDetailChange = (processIndex, machineIndex, field, value) => {
    const newProcesses = [...formData.processes];
    newProcesses[processIndex].machineDetails[machineIndex][field] = value;
    setFormData((prev) => ({ ...prev, processes: newProcesses }));
  };

  const handleDesignNumberChange = (value) => {
    setFormData((prev) => ({ ...prev, designNumber: value }));
    if (errors.designNumber && value.trim()) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.designNumber;
        return newErrors;
      });
    }
  };

  const addProcessRow = () => {
    const lastProcess = formData.processes[formData.processes.length - 1];
    if (
      formData.processes.length > 0 &&
      (!lastProcess || !lastProcess.processId)
    ) {
      toast.error(
        "Please select a process for the current row before adding a new one.", { toastId: 'process-adding-error' }
      );
      const newErrorsProcesses = errors.processes ? [...errors.processes] : [];
      while (newErrorsProcesses.length < formData.processes.length) {
        newErrorsProcesses.push({});
      }
      if (
        newErrorsProcesses.length > 0 &&
        !newErrorsProcesses[formData.processes.length - 1].processId
      ) {
        newErrorsProcesses[formData.processes.length - 1] = {
          ...newErrorsProcesses[formData.processes.length - 1],
          processId: "Process is required before adding another.",
        };
        setErrors((prev) => ({ ...prev, processes: newErrorsProcesses }));
      }
      return;
    }

    if (
      formData.processes.length >= processSubMenuItems.length &&
      processSubMenuItems.length > 0
    ) {
      toast.info("All available processes have been added.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      processes: [...prev.processes, createProcessRow()],
    }));
    setErrors((prev) => ({
      ...prev,
      processes: [...(prev.processes || []), {}],
    }));

    // Scroll to bottom after adding new process
    setTimeout(() => {
      if (processContainerRef.current) {
        processContainerRef.current.scrollTo({
          top: processContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  const reorderProcesses = (fromIndex, toIndex) => {
    if (
      fromIndex == null ||
      toIndex == null ||
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0
    ) {
      return;
    }
    setFormData((prev) => {
      const processes = [...prev.processes];
      if (fromIndex >= processes.length || toIndex >= processes.length) return prev;
      const [moved] = processes.splice(fromIndex, 1);
      processes.splice(toIndex, 0, moved);
      return { ...prev, processes };
    });
    setErrors((prev) => {
      const processErrors = [...(prev.processes || [])];
      while (processErrors.length < formData.processes.length) {
        processErrors.push({});
      }
      const [movedErr] = processErrors.splice(fromIndex, 1);
      processErrors.splice(toIndex, 0, movedErr || {});
      return { ...prev, processes: processErrors };
    });
  };

  const removeProcessRow = (index) => {
    const newProcesses = formData.processes.filter((_, i) => i !== index);
    const newErrorsProcesses = (errors.processes || []).filter(
      (_, i) => i !== index
    );

    setFormData((prev) => ({
      ...prev,
      processes:
        newProcesses.length > 0 ? newProcesses : [createProcessRow()],
    }));
    setErrors((prev) => ({
      ...prev,
      processes: newErrorsProcesses.length > 0 ? newErrorsProcesses : [{}],
    }));
  };

  const getAvailableProcessOptions = (currentIndex) => {
    const selectedProcessIds = formData.processes
      .map((p, index) => (index !== currentIndex ? p.processId : null))
      .filter(Boolean);
    return processSubMenuItems.filter(
      (option) => !selectedProcessIds.includes(option.value)
    );
  };

  // Get available machines for a process (excluding machines already used in other processes)
  const getAvailableMachineOptions = (currentIndex) => {
    const usedMachineIds = [];
    
    // Collect all machine IDs used in other processes
    formData.processes.forEach((proc, index) => {
      if (index !== currentIndex && proc.machineId && Array.isArray(proc.machineId)) {
        usedMachineIds.push(...proc.machineId);
      }
    });
    
    // Filter out machines that are already used in other processes
    return machines.filter(machine => !usedMachineIds.includes(machine.value));
  };

  const validateForm = () => {
    const newErrors = { processes: formData.processes.map(() => ({})) };
    let formIsValid = true;

    if (!formData.designNumber?.trim()) {
      newErrors.designNumber = "Design Number is required.";
      formIsValid = false;
    }

    formData.processes.forEach((proc, index) => {
      if (proc?.processId) {
        if (isSendReceiveProcess(proc.processId)) {
          // For DoraCut process, both multi and single rates are required
          if (!proc.multiRate?.toString().trim()) {
            newErrors.processes[index].multiRate = "Multi Rate is required for DoraCut process.";
            formIsValid = false;
          }
          if (!proc.singleRate?.toString().trim()) {
            newErrors.processes[index].singleRate = "Single Rate is required for DoraCut process.";
            formIsValid = false;
          }
        } else if (!processNeedsMachine(proc.processId)) {
          if (!proc.rate?.toString().trim()) {
            newErrors.processes[index].rate = "Rate is required.";
            formIsValid = false;
          }
        }
      }
      
      if (!proc?.processId && (proc.rate?.toString().trim() || proc.multiRate?.toString().trim() || proc.singleRate?.toString().trim())) {
        newErrors.processes[index].processId =
          "Process is required if rate is entered.";
        formIsValid = false;
      }

      // Validate machine/employee selection based on process type (now optional)
      // Removed validation for machine and employee as they are now optional
    });

    setErrors(newErrors);
    return formIsValid;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const payload = {
        designNumber: formData.designNumber,
        description: formData.description || "",
        userId: user?._id || user?.data?._id || user?.id || getAuthUserId(),
        processes: formData.processes
           .filter((p) => {
            if (!p.processId) return false;

            if (isSendReceiveProcess(p.processId)) {
              return p.multiRate && p.singleRate;
            } else if (processNeedsMachine(p.processId)) {
              return true;
            } else {
              return !!p.rate;
            }
          })
        .map((p) => {
          const processMenuItem = processSubMenuItems.find(
            (item) => item.value === p.processId
          );
            
            // Process machine details to ensure proper format
            const processedMachineDetails = (p.machineDetails || []).map(detail => ({
              machineId: detail.machineId,
              machineName: detail.machineName || "",
              baseRate: detail.baseRate ? Number(detail.baseRate) : 0
            }));

            const baseProcessData = {
              processName: processMenuItem
                ? processMenuItem.label
                : "Unknown Process",
              price: Number(p.singleRate) || Number(p.rate),
              startDate: new Date().toISOString(),
              machineId: p.machineId,
              employeeId: p.employeeId,
              machineDetails: processedMachineDetails,
            };

            // Handle DoraCut process with multi and single rates
            if (isSendReceiveProcess(p.processId)) {
              return {
                ...baseProcessData,
                multiRate: Number(p.multiRate),
              };
            } else {
              // Handle regular process with single rate
              return {
                ...baseProcessData,
                price: Number(p.singleRate) || Number(p.rate),
              };
            }
          }),
      };     

      if (payload.processes.length === 0) {
        toast.error("Please add at least one valid process with a rate.", { toastId: 'latest-one-process' });
        return;
      }
      
      // console.log("API Payload:", payload); // For debugging
      onSubmit(payload);
    } else {
      toast.error("Please correct the errors in the form.", { toastId: 'latest-one-process-form' });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="p-6 space-y-4">
        <InputElement
          name="Design Number"
          label="Design Number"
          type="text"
          placeholder="Enter Design Number"
          value={formData.designNumber}
          onChange={handleDesignNumberChange}
          error={errors.designNumber}
          is_required={true}
        />

        <div ref={processContainerRef} className="space-y-0 p-3 border border-[#E8DFD4] bg-[#EFE7DC] rounded-lg max-h-[400px] overflow-scroll scrollbar">
          {formData.processes.map((proc, processIndex) => (
      <div
        key={proc.rowId || processIndex}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          if (dragOverIndex !== processIndex) setDragOverIndex(processIndex);
        }}
        onDragLeave={() => {
          if (dragOverIndex === processIndex) setDragOverIndex(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          const from =
            dragIndexRef.current ?? Number(e.dataTransfer.getData("text/plain"));
          reorderProcesses(from, processIndex);
          dragIndexRef.current = null;
          setDragOverIndex(null);
        }}
        className={classNames(
          "space-y-3 py-3",
          processIndex < formData.processes.length - 1 &&
            "border-b-2 border-gray-300 mb-1",
          dragOverIndex === processIndex && "bg-sky-50 rounded-md px-1"
        )}
      >
              <div
                draggable
                onDragStart={(e) => {
                  dragIndexRef.current = processIndex;
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", String(processIndex));
                }}
                onDragEnd={() => {
                  dragIndexRef.current = null;
                  setDragOverIndex(null);
                }}
                className="flex items-center gap-2 cursor-grab active:cursor-grabbing text-gray-500 select-none w-fit"
                title="Drag to reorder process"
              >
                <GripVertical size={18} />
                <span className="text-xs font-medium">
                  Process {processIndex + 1} — drag to change order
                </span>
              </div>
              <div className="flex gap-2 items-end space-x-2 max-sm:flex-col">
                <div className="flex-grow max-sm:w-full">
                  <SelectElement
                    name={`Process`}
                    id={`process-${processIndex}`}
                    value={proc.processId}
                    onChange={(value) =>
                      handleProcessChange(processIndex, "processId", value)
                    }
                    options={getAvailableProcessOptions(processIndex)}
                    placeholder="Select process"
                    error={errors.processes && errors.processes[processIndex]?.processId}
                    is_required={true}
                    isMulti={false}
                    variant="solid"
                    className="w-full flex-1"
                    getOptionLabel={(option) => option.label}
                    getOptionValue={(option) => option.value}
                    menuPortalTarget={document.body}
                  />
                </div>
                
                {/* Show different rate fields based on process type */}
                {proc.processId && isSendReceiveProcess(proc.processId) ? (
                  // DoraCut process - show Multi and Single rate fields
                  <>
                    <div className="flex-grow max-sm:w-full">
                      <InputElement
                        name={`Multi Rate`}
                        label="Multi Rate"
                        type="text"
                        placeholder="Enter Multi Rate"
                        value={proc.multiRate}
                        onChange={(val) =>
                          handleProcessChange(processIndex, "multiRate", val)
                        }
                        error={errors.processes && errors.processes[processIndex]?.multiRate}
                        is_required={true}
                      />
                    </div>
                    <div className="flex-grow max-sm:w-full">
                      <InputElement
                        name={`Single Rate`}
                        label="Single Rate"
                        type="text"
                        placeholder="Enter Single Rate"
                        value={proc.singleRate}
                        onChange={(val) =>
                          handleProcessChange(processIndex, "singleRate", val)
                        }
                        error={errors.processes && errors.processes[processIndex]?.singleRate}
                        is_required={true}
                      />
                    </div>
                  </>
                ) : (
                  // Regular process - show single rate field (except RC and Loading)
                  !processNeedsMachine(proc.processId) && (
                  <div className="flex-grow max-sm:w-full">
                    <InputElement
                      name={`Rate`}
                      label="Rate"
                      type="text"
                      placeholder="Enter Rate"
                      value={proc.rate}
                      onChange={(val) =>
                        handleProcessChange(processIndex, "rate", val)
                      }
                      error={errors.processes && errors.processes[processIndex]?.rate}
                      is_required={true}
                    />
                  </div>
                  )
                  
                )}
                
                {formData.processes.length > 1 && (
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => removeProcessRow(processIndex)}
                    label="Remove"
                    className="h-full focus:!ring-0 max-sm:w-full max-sm:flex max-sm:justify-end"
                  />
                )}
              </div>

              {/* Show Machine dropdown when process needsMachine */}
              {proc.processId && processNeedsMachine(proc.processId) && (
                <div className="space-y-3">
                  <div className="flex-grow max-sm:w-full">
                    <SelectElement
                      name={`Select Machine`}
                      id={`machine-${processIndex}`}
                      value={proc.machineId}
                      onChange={(value) => handleMachineChange(processIndex, value)}
                      options={getAvailableMachineOptions(processIndex)}
                      placeholder="Select Machine"
                      error={errors.processes && errors.processes[processIndex]?.machineId}
                      is_required={false}
                      isMulti={true}
                      variant="solid"
                      className="w-full"
                      getOptionLabel={(option) => option.label}
                      getOptionValue={(option) => option.value}
                      menuPortalTarget={document.body}
                      isLoading={isLoadingMachines}
                    />
                  </div>

                  {/* Dynamic Machine Details */}
                  {proc.machineDetails && proc.machineDetails.length > 0 && (
                    <div className="space-y-3">
                      
                      <div className="space-y-2">
                        {proc.machineDetails.map((machineDetail, machineIndex) => (
                          <div key={machineIndex} className="flex gap-2 items-end space-x-2 max-sm:flex-col">
                            <div className="flex-grow max-sm:w-full">
                              <InputElement
                                name={`Machine Name`}
                                label="Machine Name"
                                type="text"
                                placeholder="Enter Machine Name"
                                value={machineDetail.machineName}
                                onChange={(val) => handleMachineDetailChange(processIndex, machineIndex, "machineName", val)}
                                is_required={false}
                                disabled
                              />
                            </div>
                            <div className="flex-grow max-sm:w-full">
                              <InputElement
                                name={`Base Rate`}
                                label="Base Rate"
                                type="text"
                                placeholder="Enter Base Rate"
                                value={machineDetail.baseRate}
                                onChange={(val) => handleMachineDetailChange(processIndex, machineIndex, "baseRate", val)}
                                is_required={false}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="danger"
                              onClick={() => removeMachineDetail(processIndex, machineIndex)}
                              icon={<Trash2Icon size={16}/>}
                              className="h-full focus:!ring-0"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
            </div>
          ))}
        </div>
        <div className="flex justify-start">
          <Button
            type="button"
            variant="normal"
            className="focus:!ring-0 !font-medium"
            onClick={addProcessRow}
            icon={<PlusIcon/>}
            label="Add New Process"
            disabled={
              isLoadingProcessSubItems ||
              processSubMenuItems.length === 0 ||
              formData.processes.length >= processSubMenuItems.length
            }
          />
        </div>
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
          label={ "Add Design"}
        />
      </div>
    </form>
  );
};

export default AddDesignForm;
