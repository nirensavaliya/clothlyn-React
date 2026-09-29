import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import SelectElement from './Select';
import Button from './Button';
import { getEmployees } from '../../apis/employeeApi';
import { mapEmployeeToSelectOption } from '../../helpers/utils';
import LoaderComponent from './Loader';

const ThreadQrDetailsModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  title = 'Qr Details',
  fields = {},
  onFieldChange,
  size = 'md',
  designData = null,
}) => {
  const [machineEmployees, setMachineEmployees] = useState({});
  const [selectedEmployees, setSelectedEmployees] = useState({});
  const [machineDetails, setMachineDetails] = useState([]);
  const [stickerPhoto, setStickerPhoto] = useState(null);

  // Extract machine details from design data
  useEffect(() => {
    if (!isOpen || !designData) {
      setMachineDetails([]);
      setMachineEmployees({});
      return;
    }

      const loadingProcess = designData.processes?.find(p => 
      p.processName?.toLowerCase() === 'loading'
    );

    if (loadingProcess && loadingProcess.machineDetails && loadingProcess.machineDetails.length > 0) {
      const details = loadingProcess.machineDetails;
      setMachineDetails(details);

      // Fetch employees for each machine
      const fetchPromises = details.map(machine => {
        const cleanedMachineName = String(machine.machineName || '')
          .trim()
          .replace(/\s*\d+$/, '');
        return getEmployees({ machineName: cleanedMachineName })
          .then(res => ({ 
            machineId: machine.machineId || machine._id, 
            machineName: machine.machineName,
            baseRate: machine.baseRate,
            employees: res.data || [] 
          }))
          .catch(() => ({ 
            machineId: machine.machineId || machine._id,
            machineName: machine.machineName,
            baseRate: machine.baseRate,
            employees: [] 
          }));
      });

      Promise.all(fetchPromises).then(results => {
        const employeesMap = {};
        results.forEach(({ machineId, machineName, employees }) => {
          employeesMap[machineId] = employees.map((emp) => mapEmployeeToSelectOption(emp));
        });
        setMachineEmployees(employeesMap);
      });
    } else {
      setMachineDetails([]);
      setMachineEmployees({});
    }
  }, [isOpen, designData]);

  // Reset selected employees when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedEmployees({});
    }
  }, [isOpen]);

  let parsedFields = fields;
  if (fields && typeof fields.barcodeValue === 'string') {
    try {
      parsedFields = { ...JSON.parse(fields.barcodeValue), ...fields };
    } catch {
      parsedFields = fields;
    }
  }

  const handleThreadSubmit = () => {
    const payload = {
      ...parsedFields,
      dashboardDataId: parsedFields?.id,
      stickerPhoto: stickerPhoto || parsedFields?.stickerPhoto,
      machineEmployees: [], // Array of { machineId, employeeId, baseRate, machineName }
    };

    // Add employee selections for each machine
    machineDetails.forEach(machine => {
      const machineId = machine.machineId || machine._id;
      const employeeId = selectedEmployees[machineId];
      
      if (employeeId) {
        payload.machineEmployees.push({
          machineId: machineId,
          machineName: machine.machineName,
          employeeId: employeeId,
          baseRate: machine.baseRate || 0,
        });
      }
    });

    onSubmit(payload);
  };

  const footerContent = (
    <div className="flex gap-3 justify-end">
      <Button type="button" variant="default" label="Cancel" onClick={onClose} disabled={isLoading} />
      <Button type="button" variant="primary" label={isLoading ? 'Yes...' : 'Yes'} onClick={handleThreadSubmit} disabled={isLoading || (machineDetails.length > 0 && Object.keys(selectedEmployees).length === 0)} loading={isLoading} />
    </div>
  );

  return (
    <>
      {isLoading && <LoaderComponent size={56} />}
      <Modal isOpen={isOpen} onClose={onClose} title={title} footerContent={footerContent} size={size}>
        <div className="p-4 space-y-3">
          <div className="text-base font-semibold flex text-center">LOADING PROCESS</div>
          <div className="mb-4 bg-light-white/80 text-left">
            <div className="mb-1"><span className="text-sm font-semibold">Lot No: </span>{parsedFields?.lotNo || '-'}</div>
            <div className="mb-1"><span className="text-sm font-semibold">D No: </span>{parsedFields?.dNo || '-'}</div>
            <div className="mb-1 font-bold text-light-error_500"><span className="text-sm">Total Pic: </span>{parsedFields?.pic || '-'}</div>
            <div className="mb-1"><span className="text-sm font-semibold">Size: </span>{parsedFields?.size || '-'}</div>
            <div className="mb-1"><span className="text-sm font-semibold">Color: </span>{parsedFields.colour || parsedFields.color || '-'}</div>

            <div className="mt-4 space-y-4">
            {machineDetails.length > 0 ? (
              machineDetails.map((machine) => {
                const machineId = machine.machineId || machine._id;
                const options = machineEmployees[machineId] || [];
                const value = selectedEmployees[machineId] || null;

                // Remove trailing numbers and spaces from machine name (e.g., "For Thread 3" -> "For Thread")
                const displayMachineName = String(machine.machineName).trim().replace(/\s*\d+$/, '');

                return (
                  <div key={machineId} className="space-y-2">
                    <div className="text-sm font-semibold text-gray-700 text-left">{displayMachineName}</div>
                    <SelectElement
                      options={options}
                      value={value}
                      onChange={(val) => {
                        setSelectedEmployees(prev => ({ ...prev, [machineId]: val }));
                      }}
                      placeholder="Select Employee"
                      isClearable={false}
                      isMulti={false}
                      menuPortalTarget={document.body}
                    />
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-gray-500">No machines found for loading process</div>
            )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ThreadQrDetailsModal;
