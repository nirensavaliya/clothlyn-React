import React, { useEffect, useState, useMemo, useRef } from 'react';
import Modal from './Modal';
import SelectElement from './Select';
import Button from './Button';
import InputElement from './InputElement';
import { getEmployees } from '../../apis/employeeApi';
import { getSuggestedEmployees } from '../../apis/processApi';
import MobileCameraModal from './MobileCameraModal';
import { getEmployeeGroup } from '../../helpers/employeeGroupHelper';
import { mapEmployeeToSelectOption } from '../../helpers/utils';
import LoaderComponent from './Loader';

const ProcessQrDetailsModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  fields = {},
  onFieldChange,
  size = 'md',
  designData = null,
}) => {
  const [machineEmployees, setMachineEmployees] = useState({});
  const [selectedEmployees, setSelectedEmployees] = useState({});
  const [machineDetails, setMachineDetails] = useState([]);

  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [stickerPhoto, setStickerPhoto] = useState(null);
  const [showStickerPhotoError, setShowStickerPhotoError] = useState(false);
  const [rcPicValue, setRcPicValue] = useState('');
  const [alterValue, setAlterValue] = useState('');
  const [rejectValue, setRejectValue] = useState('');
  const hasAutoFilledRef = useRef(false);

  // Extract machine details from design data and fetch suggested employees
  useEffect(() => {
    if (!isOpen || !designData) {
      setMachineDetails([]);
      setMachineEmployees({});
      return;
    }

    const processes = Array.isArray(designData?.processes) ? designData.processes : [];

    // For `RC` popup: show ONLY machines that are configured under RC process in the design.
    const rcProcess = processes.find((p) => {
      const n = p?.processName === undefined || p?.processName === null ? '' : String(p.processName).toLowerCase();
      return n === 'rc' || n.includes('rc');
    });

    const details = Array.isArray(rcProcess?.machineDetails) ? rcProcess.machineDetails : [];

    if (details.length === 0) {
      setMachineDetails([]);
      setMachineEmployees({});
      return;
    }

    setMachineDetails(details);

    // Fetch employees for each machine - clean machine name before fetching
    const fetchPromises = details.map((machine) => {
      const machineName = machine?.machineName || '';
      // Ignore trailing digits (with or without space) like "Kansai 3" or "Fletlok2"
      const cleanedMachineName = String(machineName).trim().replace(/\s*\d+$/, '');

      return getEmployees({ machineName: cleanedMachineName })
        .then((res) => ({
          machineId: machine.machineId || machine._id,
          machineName: machine.machineName,
          originalMachineName: machine.machineName,
          baseRate: machine.baseRate,
          employees: res.data || [],
        }))
        .catch((error) => {
          console.error(`Error fetching employees for machine ${cleanedMachineName}:`, error);
          return {
            machineId: machine.machineId || machine._id,
            machineName: machine.machineName,
            originalMachineName: machine.machineName,
            baseRate: machine.baseRate,
            employees: [],
          };
        });
    });

    Promise.all(fetchPromises).then((results) => {
      const employeesMap = {};
      results.forEach(({ machineId, employees }) => {
        employeesMap[machineId] = employees.map((emp) => mapEmployeeToSelectOption(emp));
      });
      setMachineEmployees(employeesMap);
    });
  }, [isOpen, designData]);

  const parsedFields = useMemo(() => {
    let parsed = fields;
  if (fields && typeof fields.barcodeValue === 'string') {
    try {
        parsed = { ...JSON.parse(fields.barcodeValue), ...fields };
    } catch {
        parsed = fields;
    }
  }
    return parsed;
  }, [fields]);

  // RC Pic / Alter / Reject must be entered manually — do not prefill from lot data.
  useEffect(() => {
    if (isOpen) {
      setRcPicValue('');
      setAlterValue('');
      setRejectValue('');
      return;
    }
    setRcPicValue('');
    setAlterValue('');
    setRejectValue('');
  }, [isOpen]);

  // Fetch suggested employees and auto-fill
  useEffect(() => {
    if (!isOpen) {
      setSelectedEmployees({});
      hasAutoFilledRef.current = false;
      return;
    }

    // Wait for machine details and employees to be loaded
    if (machineDetails.length === 0 || Object.keys(machineEmployees).length === 0) {
      return;
    }

    // Only run auto-fill logic once when modal opens
    if (hasAutoFilledRef.current) return;

    // Check if fields already have employee values for each machine
    const initialEmployees = {};
    machineDetails.forEach(machine => {
      const machineId = machine.machineId || machine._id;
      // Match parsedFields keys without trailing digits.
      const fieldKey = String(machine.machineName)
        .toLowerCase()
        .trim()
        .replace(/\s*\d+$/, '')
        .replace(/\s+/g, '');
      if (parsedFields[fieldKey]) {
        initialEmployees[machineId] = parsedFields[fieldKey];
      }
    });

    if (Object.keys(initialEmployees).length > 0) {
      setSelectedEmployees(initialEmployees);
      hasAutoFilledRef.current = true;
      return;
    }

    // Fetch suggested employees from API
    const fetchSuggestions = async () => {
      if (!parsedFields.lotNo) {
        hasAutoFilledRef.current = true;
        return;
      }

      try {
        const response = await getSuggestedEmployees(parsedFields.lotNo);
        
        if (response?.status === 'success' && response?.data?.length > 0) {
          const suggestedEmployees = {};
          
          response.data.forEach(suggestion => {
            // Match machine by machineId
            const machine = machineDetails.find(m => 
              (m.machineId || m._id) === suggestion.machineId
            );
            
            if (machine && suggestion.employeeId) {
              const machineId = machine.machineId || machine._id;
              suggestedEmployees[machineId] = suggestion.employeeId;
              
              const fieldKey = machine.machineName.toLowerCase().replace(/\s+/g, '');
              onFieldChange(fieldKey, suggestion.employeeId);
            }
          });
          
          if (Object.keys(suggestedEmployees).length > 0) {
            setSelectedEmployees(suggestedEmployees);
          }
        }
      } catch (error) {
        console.error('Failed to fetch suggested employees:', error);
      } finally {
        hasAutoFilledRef.current = true;
      }
    };

    fetchSuggestions();
  }, [isOpen, parsedFields.lotNo, machineDetails, machineEmployees]);

  useEffect(() => {
    if (isOpen && parsedFields.stickerPhoto) {
      setStickerPhoto(parsedFields.stickerPhoto);
    } else if (!isOpen) {
      setStickerPhoto(null);
    }
  }, [isOpen, parsedFields.stickerPhoto]);

  const handleStickerPhotoCapture = data => {
    setStickerPhoto(data.imageData);
    onFieldChange('stickerPhoto', data.imageData);
    setShowStickerPhotoError(false);
  };

  const handleRemovePhoto = () => {
    setStickerPhoto(null);
    onFieldChange('stickerPhoto', '');
    setShowStickerPhotoError(false);
  };

  const getInt = n => (isNaN(parseInt(n)) ? 0 : parseInt(n));
  const isStickerPhotoButtonEnabled =
    getInt(rcPicValue) + getInt(alterValue) + getInt(rejectValue) ===
    getInt(parsedFields.pic);

  const handleSubmit = () => {
    if (!stickerPhoto && !parsedFields.stickerPhoto) {
      setShowStickerPhotoError(true);
      return;
    }

    const payload = {
      ...parsedFields,
      dashboardDataId: parsedFields.id,
      rcPic: rcPicValue,
      alter: alterValue,
      reject: rejectValue,
      stickerPhoto: stickerPhoto || parsedFields.stickerPhoto,
      machineEmployees: [], // Array of { machineId, employeeId, baseRate, machineName }
    };

    // Add employee selections for each machine
    machineDetails.forEach(machine => {
      const machineId = machine.machineId || machine._id;
      const employeeId = selectedEmployees[machineId];
      const fieldKey = String(machine.machineName)
        .toLowerCase()
        .trim()
        .replace(/\s*\d+$/, '')
        .replace(/\s+/g, '');
      
      if (employeeId) {
        payload.machineEmployees.push({
          machineId: machineId,
          machineName: machine.machineName,
          employeeId: employeeId,
          baseRate: machine.baseRate || 0,
        });
      }

      // Also add individual fields for backward compatibility
      payload[fieldKey] = employeeId || null;
      const employeeOptions = machineEmployees[machineId] || [];
      const employeeObj = employeeOptions.find(o => o.value === employeeId);
      payload[`${fieldKey}Name`] = employeeObj?.label || null;
    });

    onSubmit(payload);
  };

  return (
    <>
      {isLoading && <LoaderComponent size={56} />}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Qr Details"
        size={size}
        footerContent={
          <div className="flex gap-3 justify-end">
            <Button label="Cancel" onClick={onClose} />
            <Button
              label="Save"
              loading={isLoading}
              disabled={!isStickerPhotoButtonEnabled || (machineDetails.length > 0 && Object.keys(selectedEmployees).length < machineDetails.length) || (!stickerPhoto && !parsedFields.stickerPhoto)}
              onClick={handleSubmit}
            />
          </div>
        }
      >
        <div className="p-4 space-y-4">
          <h2 className="text-lg font-bold text-center">RC PROCESS</h2>

          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <div><span className="font-semibold">Lot No :</span> {parsedFields.lotNo || '-'}</div>
            <div><span className="font-semibold">D No :</span> {parsedFields.dNo || '-'}</div>
            <div><span className="font-semibold">Total Pic :</span> {parsedFields.pic || '-'}</div>
            <div>
              <span className="font-semibold">RC Pic :</span>{' '}
              <span style={{
                color: rcPicValue !== '' && Number(rcPicValue) === Number(parsedFields.pic || 0) ? '#22c55e' : '#ef4444',
                fontWeight: 'bold',
              }}>
                {rcPicValue !== '' ? rcPicValue : '-'}
              </span>
            </div>
            <div>
              <span className="font-semibold">Alter :</span>{' '}
              <span style={{ fontWeight: 'bold', color: '#ef4444' }}>
                {alterValue !== '' ? alterValue : '-'}
              </span>
            </div>
            <div>
              <span className="font-semibold">Reject :</span>{' '}
              <span style={{ fontWeight: 'bold', color: '#ef4444' }}>
                {rejectValue !== '' ? rejectValue : '-'}
              </span>
            </div>
            <div><span className="font-semibold">Size :</span> {parsedFields.size || '-'}</div>
            <div><span className="font-semibold">Color :</span> {parsedFields.color || parsedFields.colour || '-'}</div>
          </div>

          <div className="space-y-4">
            {machineDetails.length > 0 ? (
              machineDetails.map((machine) => {
                const machineId = machine.machineId || machine._id;
                const fieldKey = String(machine.machineName)
                  .toLowerCase()
                  .trim()
                  .replace(/\s*\d+$/, '')
                  .replace(/\s+/g, '');
                const options = machineEmployees[machineId] || [];
                const value = selectedEmployees[machineId] || null;

                // Remove trailing numbers and spaces from machine name (e.g., "Kansai 3" -> "Kansai")
                const displayMachineName = String(machine.machineName).trim().replace(/\s*\d+$/, '');

                console.log(`Machine ${displayMachineName} (${machineId}):`, {
                  options: options.length,
                  value,
                  machineEmployees: machineEmployees[machineId]
                }); // Debug log

                return (
                  <div key={machineId} className="space-y-2">
                    <div className="text-sm font-semibold text-gray-700 text-left">{displayMachineName}</div>
                    <SelectElement
                      options={options}
                      value={value}
                      onChange={val => {
                        setSelectedEmployees(prev => ({ ...prev, [machineId]: val }));
                        onFieldChange(fieldKey, val);
                      }}
                      placeholder="Select Employee"
                      isClearable={false}
                      isMulti={false}
                      menuPortalTarget={document.body}
                      isSearchable={true}
                    />
                    {options.length === 0 && (
                      <div className="text-xs text-gray-400">No employees found for this machine</div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-gray-500">No machines found for RC process</div>
            )}
          </div>

          <div className="mt-3">
            <div className="mb-1 text-sm font-semibold">Upload Sticker Photo:</div>
            {stickerPhoto || parsedFields.stickerPhoto ? (
              <div className="flex flex-col items-center mb-2">
                <img 
                  src={stickerPhoto || parsedFields.stickerPhoto} 
                  alt="Sticker Preview" 
                  className="w-48 h-48 object-cover rounded mb-2 border border-gray-300" 
                />
                <div className="flex gap-2 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    label="Re-capture"
                    className="flex-1"
                    onClick={() => setIsCameraModalOpen(true)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    label="Remove"
                    className="flex-1"
                    onClick={handleRemovePhoto}
                  />
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="primary"
                label="Upload Sticker Photo"
                className="w-full mb-1"
                onClick={() => setIsCameraModalOpen(true)}
              />
            )}
            {showStickerPhotoError && <p className="text-red-500 text-xs mt-1">Required</p>}
          </div>

          <MobileCameraModal
            isOpen={isCameraModalOpen}
            onClose={() => setIsCameraModalOpen(false)}
            onScanComplete={handleStickerPhotoCapture}
          />

          <div>
            <label className="block mb-1">
              <span className="text-light-darkGrey text-sm font-bold">RC Pic</span>
            </label>
            <InputElement
              name=""
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              placeholder="Enter RC Pic"
              value={rcPicValue}
              onChange={(v) => {
                const digits = String(v ?? '').replace(/\D/g, '');
                setRcPicValue(digits);
                onFieldChange('rcPic', digits);
              }}
            />
          </div>
          <div>
            <label className="block mb-1">
              <span className="text-light-darkGrey text-sm font-bold">Alter</span>
            </label>
            <InputElement
              name=""
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              placeholder="Enter Alter"
              value={alterValue}
              onChange={(v) => {
                const digits = String(v ?? '').replace(/\D/g, '');
                setAlterValue(digits);
                onFieldChange('alter', digits);
              }}
            />
          </div>
          <div>
            <label className="block mb-1">
              <span className="text-light-darkGrey text-sm font-bold">Reject</span>
            </label>
            <InputElement
              name=""
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              placeholder="Enter Reject"
              value={rejectValue}
              onChange={(v) => {
                const digits = String(v ?? '').replace(/\D/g, '');
                setRejectValue(digits);
                onFieldChange('reject', digits);
              }}
            />
          </div>

        </div>
      </Modal>
    </>
  );
};

export default ProcessQrDetailsModal;