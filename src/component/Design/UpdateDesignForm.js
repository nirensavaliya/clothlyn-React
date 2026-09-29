import React, { useState, useEffect, useRef } from "react";
import InputElement from "../common/InputElement";
import SelectElement from "../common/Select";
import Button from "../common/Button";
import { toast } from "react-toastify";
import { getProcesses } from "../../apis/processApi";
import { getMachines } from "../../apis/machineApi";
import classNames from "classnames";
import { PlusIcon, Trash2Icon, GripVertical } from "lucide-react";
import { resolveProcessNeedsMachine } from "../../helpers/utils";
import { getAuthUserId } from "../../utils/authToken";

const createProcessRow = (overrides = {}) => ({
  rowId: `proc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  processId: "",
  rate: "",
  multiRate: "",
  singleRate: "",
  machineId: "",
  machineDetails: [],
  ...overrides,
});

const UpdateDesignForm = ({ designData, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    designNumber: "",
    processes: [createProcessRow()],
  });
  const [errors, setErrors] = useState({ processes: [] });
  const processContainerRef = useRef(null);
  const dragIndexRef = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const [processSubMenuItems, setProcessSubMenuItems] = useState([]);
  const [machines, setMachines] = useState([]);
  const [isLoadingProcessSubItems, setIsLoadingProcessSubItems] =
    useState(false);
  const [isLoadingMachines, setIsLoadingMachines] = useState(false);
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

  useEffect(() => {
    fetchProcessSubItems();
    fetchMachines();
  }, []);

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

  useEffect(() => {
    if (processSubMenuItems.length > 0) {
      if (designData) {
        let processesToInitialize = [];
        
        const sourceProcessesArray =
          (designData.currentProcesses && designData.currentProcesses.length > 0)
          ? designData.currentProcesses
          : (designData.processes && designData.processes.length > 0
              ? designData.processes
              : []);

        if (sourceProcessesArray.length > 0) {
          processesToInitialize = sourceProcessesArray.map(designProc => {                        
            const masterProcess = processSubMenuItems.find(
              option => option.label === designProc.processName
            );
            
            return createProcessRow({
              processId: masterProcess ? masterProcess.value : "",
              rate: designProc.price !== undefined ? String(designProc.price) :
                    (designProc.rate !== undefined ? String(designProc.rate) : ""),
              multiRate: designProc.multiRate !== undefined ? String(designProc.multiRate) : "",
              singleRate: designProc.price !== undefined ? String(designProc.price) : "",
              machineId: designProc.machineId || "",
              machineDetails: designProc.machineDetails || designProc?.machineId || [],
            });
          }).filter(p => p.processId); 
        }

        if (processesToInitialize.length === 0) {
          processesToInitialize = [createProcessRow()];
        }

        setFormData({
          designNumber: designData.designNumber || "",
          processes: processesToInitialize,
        });
        setErrors({ processes: processesToInitialize.map(() => ({})) });

      } else {
        setFormData({
          designNumber: "",
          processes: [createProcessRow()],
        });
        setErrors({ processes: [{}] });
      }
    } else if (!designData) {
       setFormData({
          designNumber: "",
          processes: [createProcessRow()],
        });
        setErrors({ processes: [{}] });
    }
  }, [designData, processSubMenuItems]);

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
    }
    // Reset machine and employee when process changes
    if (name === "processId") {
      newProcesses[index].machineId = "";
      newProcesses[index].machineDetails = [];
      newProcesses[index].rate = "";
      newProcesses[index].multiRate = "";
      newProcesses[index].singleRate = "";
      
      if (!value) {
        if (newErrorsProcesses[index]) {
          delete newErrorsProcesses[index].rate;
          delete newErrorsProcesses[index].multiRate;
          delete newErrorsProcesses[index].singleRate;
        }
      }
      if (newErrorsProcesses[index]) {
        delete newErrorsProcesses[index].processId;
      }
    }

    setFormData((prev) => ({ ...prev, processes: newProcesses }));
    setErrors((prev) => ({ ...prev, processes: newErrorsProcesses }));
  };

  const handleMachineChange = (index, value) => {
  const newProcesses = [...formData.processes];
  const selectedIds = Array.isArray(value) ? value : [];
  const prevDetails = newProcesses[index].machineDetails || [];

  const updatedDetails = selectedIds.map(machineId => {
    const existing = prevDetails.find(m => m._id === machineId);
    if (existing) {
      return existing;
    }

    const machine = machines.find(m => m.value === machineId);
    return {
      _id: machineId,
      machineName: machine ? machine.label : "",
      baseRate: ""
    };
  });
  newProcesses[index] = {
    ...newProcesses[index],
    machineId: selectedIds,
    machineDetails: updatedDetails
  };

  setFormData(prev => ({ ...prev, processes: newProcesses }));
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
        "Please select a process for the current row before adding a new one.",
        { toastId: 'process-current-adding-error' }
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
      if (index !== currentIndex) {
        // Check machineDetails array for _id
        if (proc.machineDetails && Array.isArray(proc.machineDetails)) {
          proc.machineDetails.forEach(detail => {
            if (detail._id) {
              usedMachineIds.push(detail._id);
            }
          });
        }
        // Also check machineId array
        if (proc.machineId && Array.isArray(proc.machineId)) {
          usedMachineIds.push(...proc.machineId);
        }
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
      if (proc.processId) {
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
      
      if (!proc.processId && (proc.rate?.toString().trim() || proc.multiRate?.toString().trim() || proc.singleRate?.toString().trim())) {
        newErrors.processes[index].processId =
          "Process is required if rate is entered.";
        formIsValid = false;
      }
    });

    setErrors(newErrors);
    return formIsValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const updatePayload = {
        designNumber: formData.designNumber,
        userId: user?._id || user?.data?._id || user?.id || getAuthUserId(),
        process: formData.processes
          .filter((p) => p.processId)
          .map((p) => {
            const baseProcessData = {
              status: p.processId,
              timestamp: p.timestamp || new Date().toISOString(),
            };

            // Handle DoraCut process with multi and single rates
            if (isSendReceiveProcess(p.processId)) {
              return {
                ...baseProcessData,
                multiRate: p.multiRate,
                price: p.singleRate,
              };
            } else if (processNeedsMachine(p.processId)) {
              // Handle RC and Loading process with machine details
              return {
                ...baseProcessData,
                rate: p.rate,
                machineDetails: p.machineDetails,
                machineId: p.machineId,

              };
            }
            else {
              // Handle regular process with single rate
              return {
                ...baseProcessData,
                price : p.rate,
              };
            }
          }),
      };

      if (updatePayload.process.length === 0) {
        updatePayload.process = [];
      }

      onSubmit(designData._id, updatePayload);
    } else {
      toast.error("Please correct the errors in the form.", { toastId: 'design-update-form-error' });
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
        <div ref={processContainerRef} className="space-y-0 p-3 border border-[#E8DFD4] bg-[#EFE7DC] rounded-lg max-h-[250px] overflow-scroll scrollbar">
          {formData.processes.map((proc, index) => (
                        <div
                          key={proc.rowId || index}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            if (dragOverIndex !== index) setDragOverIndex(index);
                          }}
                          onDragLeave={() => {
                            if (dragOverIndex === index) setDragOverIndex(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const from =
                              dragIndexRef.current ??
                              Number(e.dataTransfer.getData("text/plain"));
                            reorderProcesses(from, index);
                            dragIndexRef.current = null;
                            setDragOverIndex(null);
                          }}
                          className={classNames(
                            "space-y-3 py-3",
                            index < formData.processes.length - 1 &&
                              "border-b-2 border-gray-300 mb-1",
                            dragOverIndex === index && "bg-sky-50 rounded-md px-1"
                          )}
                        >
              <div
                draggable
                onDragStart={(e) => {
                  dragIndexRef.current = index;
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", String(index));
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
                  Process {index + 1} — drag to change order
                </span>
              </div>
              <div className="flex gap-2 items-baseline space-x-2 max-sm:flex-col">
                <div className="flex-grow max-sm:w-full">
                  <SelectElement
                    name={`Process`}
                    id={`process-${index}`}
                    value={proc.processId}
                    onChange={(value) =>
                      handleProcessChange(index, "processId", value)
                    }
                    options={getAvailableProcessOptions(index)}
                    placeholder="Select process"
                    error={errors.processes && errors.processes[index]?.processId}
                    is_required={true}
                    isMulti={false}
                    variant="solid"
                    className="w-full flex-1"
                    getOptionLabel={(option) => option.label}
                    getOptionValue={(option) => option.value}
                    menuPortalTarget={document.body}
                  />
                </div>
                
                <div
                  className={classNames(
                    "flex items-end !m-0 gap-1 max-sm:w-full",
                    proc.processId ? "justify-between" : "justify-end"
                  )}
                >
                  {proc.processId && (
                    <>
                      {/* Show different rate fields based on process type */}
                      {isSendReceiveProcess(proc.processId) ? (
                        // DoraCut process - show Multi and Single rate fields
                        <>
                          <div className="flex-grow">
                            <InputElement
                              name={`Multi Rate`}
                              label="Multi Rate"
                              type="text"
                              placeholder="Enter Multi Rate"
                              value={proc.multiRate}
                              onChange={(val) =>
                                handleProcessChange(index, "multiRate", val)
                              }
                              error={errors.processes && errors.processes[index]?.multiRate}
                              is_required={true}
                            />
                          </div>
                          <div className="flex-grow">
                            <InputElement
                              name={`Single Rate`}
                              label="Single Rate"
                              type="text"
                              placeholder="Enter Single Rate"
                              value={proc.singleRate}
                              onChange={(val) =>
                                handleProcessChange(index, "singleRate", val)
                              }
                              error={errors.processes && errors.processes[index]?.singleRate}
                              is_required={true}
                            />
                          </div>
                        </>
                      ) : (
                        // Regular process - show single rate field (except RC and Loading)
                        !processNeedsMachine(proc.processId) && (
                        <div className="flex-grow">
                          <InputElement
                            name={`Rate`}
                            label="Rate"
                            type="text"
                            placeholder="Enter Rate"
                            value={proc.rate}
                            onChange={(val) =>
                              handleProcessChange(index, "rate", val)
                            }
                            error={errors.processes && errors.processes[index]?.rate}
                            is_required={true}
                          />
                        </div>
                        )
                      )}
                    </>
                  )}
                  {formData.processes.length > 1 && (
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => removeProcessRow(index)}
                      label="Remove"
                      className="h-full focus:!ring-0"
                    />
                  )}
                </div>
              </div>

              {/* Show Machine dropdown for RC and Loading process */}
              {proc.processId && processNeedsMachine(proc.processId) && (                
                <div className="space-y-3">
                  <div className="flex-grow max-sm:w-full">
                    <SelectElement
                      name={`Select Machine`}
                      id={`machine-${index}`}
                      value={proc.machineDetails?.map(data => data?._id)|| proc.machineId}
                      onChange={(value) => handleMachineChange(index, value)}
                      options={getAvailableMachineOptions(index)}
                      placeholder="Select Machine"
                      error={errors.processes && errors.processes[index]?.machineId}
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
                                onChange={(val) => handleMachineDetailChange(index, machineIndex, "machineName", val)}
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
                                onChange={(val) => handleMachineDetailChange(index, machineIndex, "baseRate", val)}
                                is_required={false}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="danger"
                              onClick={() => removeMachineDetail(index, machineIndex)}
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
            icon={<PlusIcon />}
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
          label={ "Update Design"}
        />
      </div>
    </form>
  );
};

export default UpdateDesignForm;
