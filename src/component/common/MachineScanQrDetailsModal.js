import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import SelectElement from './Select';
import Button from './Button';
import { getEmployees } from '../../apis/employeeApi';
import { mapEmployeeToSelectOption } from '../../helpers/utils';
import LoaderComponent from './Loader';

/**
 * Dynamic machine+employee scan modal for any process that has machineDetails on design.
 */
const MachineScanQrDetailsModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  title = 'Qr Details',
  fields = {},
  processName = '',
  size = 'md',
  designData = null,
}) => {
  const [machineEmployees, setMachineEmployees] = useState({});
  const [selectedEmployees, setSelectedEmployees] = useState({});
  const [machineDetails, setMachineDetails] = useState([]);

  const displayProcessName =
    processName || fields?.process || fields?.processName || 'Process';

  useEffect(() => {
    if (!isOpen || !designData) {
      setMachineDetails([]);
      setMachineEmployees({});
      return;
    }

    const targetName = String(displayProcessName).toLowerCase().trim();
    const designProcess =
      designData.processes?.find(
        (p) => String(p.processName || '').toLowerCase().trim() === targetName
      ) ||
      designData.processes?.find(
        (p) =>
          Array.isArray(p.machineDetails) &&
          p.machineDetails.length > 0 &&
          String(p.processName || '').toLowerCase().includes(targetName)
      );

    if (designProcess?.machineDetails?.length > 0) {
      const details = designProcess.machineDetails;
      setMachineDetails(details);

      const fetchPromises = details.map((machine) => {
        const cleanedMachineName = String(machine.machineName || '')
          .trim()
          .replace(/\s*\d+$/, '');
        return getEmployees({ machineName: cleanedMachineName })
          .then((res) => ({
            machineId: machine.machineId || machine._id,
            machineName: machine.machineName,
            baseRate: machine.baseRate,
            employees: res.data || [],
          }))
          .catch(() => ({
            machineId: machine.machineId || machine._id,
            machineName: machine.machineName,
            baseRate: machine.baseRate,
            employees: [],
          }));
      });

      Promise.all(fetchPromises).then((results) => {
        const employeesMap = {};
        results.forEach(({ machineId, employees }) => {
          employeesMap[machineId] = employees.map((emp) => mapEmployeeToSelectOption(emp));
        });
        setMachineEmployees(employeesMap);
      });
    } else {
      setMachineDetails([]);
      setMachineEmployees({});
    }
  }, [isOpen, designData, displayProcessName]);

  useEffect(() => {
    if (!isOpen) setSelectedEmployees({});
  }, [isOpen]);

  let parsedFields = fields;
  if (fields && typeof fields.barcodeValue === 'string') {
    try {
      parsedFields = { ...JSON.parse(fields.barcodeValue), ...fields };
    } catch {
      parsedFields = fields;
    }
  }

  const handleSubmit = () => {
    const payload = {
      ...parsedFields,
      dashboardDataId: parsedFields?.id,
      processName: displayProcessName,
      machineEmployees: [],
    };

    machineDetails.forEach((machine) => {
      const machineId = machine.machineId || machine._id;
      const selected = selectedEmployees[machineId];
      const employeeId =
        selected && typeof selected === 'object'
          ? selected.value || selected._id
          : selected;
      if (employeeId) {
        payload.machineEmployees.push({
          machineId,
          machineName: machine.machineName,
          employeeId: String(employeeId),
          baseRate: machine.baseRate || 0,
        });
      }
    });

    if (payload.machineEmployees.length > 0) {
      payload.employeeId = payload.machineEmployees[0].employeeId;
    }

    onSubmit(payload);
  };

  const footerContent = (
    <div className="flex gap-3 justify-end">
      <Button type="button" variant="default" label="Cancel" onClick={onClose} disabled={isLoading} />
      <Button
        type="button"
        variant="primary"
        label={isLoading ? 'Yes...' : 'Yes'}
        onClick={handleSubmit}
        disabled={
          isLoading ||
          (machineDetails.length > 0 && Object.keys(selectedEmployees).length === 0)
        }
        loading={isLoading}
      />
    </div>
  );

  return (
    <>
      {isLoading && <LoaderComponent size={56} />}
      <Modal isOpen={isOpen} onClose={onClose} title={title} footerContent={footerContent} size={size}>
        <div className="p-4 space-y-3">
          <div className="text-base font-semibold flex text-center uppercase">
            {displayProcessName}
          </div>
          <div className="mb-4 bg-light-white/80 text-left">
            <div className="mb-1">
              <span className="text-sm font-semibold">Lot No: </span>
              {parsedFields?.lotNo || '-'}
            </div>
            <div className="mb-1">
              <span className="text-sm font-semibold">D No: </span>
              {parsedFields?.dNo || '-'}
            </div>
            <div className="mb-1 font-bold text-light-error_500">
              <span className="text-sm">Total Pic: </span>
              {parsedFields?.pic || '-'}
            </div>
            <div className="mb-1">
              <span className="text-sm font-semibold">Size: </span>
              {parsedFields?.size || '-'}
            </div>
            <div className="mb-1">
              <span className="text-sm font-semibold">Color: </span>
              {parsedFields.colour || parsedFields.color || '-'}
            </div>

            <div className="mt-4 space-y-4">
              {machineDetails.length > 0 ? (
                machineDetails.map((machine) => {
                  const machineId = machine.machineId || machine._id;
                  const options = machineEmployees[machineId] || [];
                  const value = selectedEmployees[machineId] || null;
                  const displayMachineName = String(machine.machineName || '')
                    .trim()
                    .replace(/\s*\d+$/, '');

                  return (
                    <div key={machineId} className="space-y-2">
                      <div className="text-sm font-semibold text-gray-700 text-left">
                        {displayMachineName}
                      </div>
                      <SelectElement
                        options={options}
                        value={value}
                        onChange={(val) => {
                          setSelectedEmployees((prev) => ({ ...prev, [machineId]: val }));
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
                <div className="text-sm text-gray-500">
                  No machines found for this process in design. Add machines on the design first.
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default MachineScanQrDetailsModal;
