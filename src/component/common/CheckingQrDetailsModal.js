import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import SelectElement from './Select';
import Button from './Button';
import { getEmployees } from '../../apis/employeeApi';
import { mapEmployeeToSelectOption } from '../../helpers/utils';
import MobileCameraModal from './MobileCameraModal';
import InputElement from './InputElement';
import LoaderComponent from './Loader';

const CheckingQrDetailsModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  title = 'Checking Qr Details',
  fields = {},
  onFieldChange,
  size = 'md',
}) => {
  const [employees, setEmployees] = useState([]);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [stickerPhoto, setStickerPhoto] = useState(null);

  const {
  rcDetails = {},
} = fields || {};

const { rcPic = 0, alter = 0, reject = 0 } = rcDetails;

console.log(rcPic, alter, reject);

  useEffect(() => {
    if (isOpen) {
      getEmployees({ processName: 'checking' })
        .then(res => setEmployees(res.data || []))
        .catch(() => setEmployees([]));
    }
  }, [isOpen]);

  let parsedFields = fields;
  if (fields && typeof fields.barcodeValue === 'string') {
    try {
      parsedFields = { ...JSON.parse(fields.barcodeValue), ...fields };
    } catch (e) {
      parsedFields = fields;
    }
  }

  const totalPic = Number(parsedFields.pic || 0);
  
  const [alterValue, setAlterValue] = useState(alter);
  const [rejectValue, setRejectValue] = useState(reject);
  const [rcPicValue, setRcPicValue] = useState(
    totalPic - Number(alter) - Number(reject)
  );

  // Remove conflicting fetch that was overriding the checking list with packing employees
  
    useEffect(() => {
    const newRcPic =
      totalPic - Number(alterValue || 0) - Number(rejectValue || 0);
  
    setRcPicValue(newRcPic >= 0 ? newRcPic : 0);
  
    // parent fields update (important for payload)
    onFieldChange('alter', alterValue);
    onFieldChange('reject', rejectValue);
    onFieldChange('rcPic', newRcPic >= 0 ? newRcPic : 0);
  }, [alterValue, rejectValue]);
  
  

  const checkingOptions = employees.map((emp) => mapEmployeeToSelectOption(emp));

//   const employeeOptions = employees.map(emp => {
//   const code = emp._id; // eg: 0010
//   const name = `${emp.employeeName ?? ''} - ${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim();

//   return {
//     value: code,                 // backend ko sirf CODE
//     label: `${name}`,  // UI me CODE - NAME
//   };
// });

  const handleStickerPhotoCapture = (data) => {
    setStickerPhoto(data.imageData);
    if (onFieldChange) onFieldChange('stickerPhoto', data.imageData);
  };

  
  const handleSubmit = () => {
        const payload = {
      ...parsedFields,
      alter: Number(alterValue),
      reject: Number(rejectValue),
      rcPic: Number(rcPicValue),
      checking: parsedFields.checking,
      dashboardDataId: parsedFields.id,
      stickerPhoto: stickerPhoto || parsedFields.stickerPhoto,
    };
     console.log("📦 Checking Payload =>", payload); // 👈 PRINT HERE
    onSubmit(payload);
  };

  const footerContent = (
    <div className="flex gap-3 justify-end">
      <Button
        type="button"
        variant="default"
        label="Cancel"
        onClick={onClose}
        disabled={isLoading}
      />
      <Button
        type="button"
        variant="primary"
        label={isLoading ? 'Yes...' : 'Yes'}
        onClick={handleSubmit}
        disabled={isLoading || !parsedFields.checking}
        loading={isLoading}
      />
    </div>
  );

  return (
    <>
      {isLoading && <LoaderComponent size={56} />}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        footerContent={footerContent}
        size={size}
      >
        <div className="p-4 space-y-3">
          <div className="text-base font-semibold flex text-center">CHECKING</div>
          <div className="mb-4 bg-light-white/80 text-left">
          
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">

    <div><span className="font-semibold">Lot No :</span> {parsedFields.lotNo || '-'}</div>
    <div><span className="font-semibold">D No :</span> {parsedFields.dNo || '-'}</div>

    <div><span className="font-semibold">Total Pic :</span> {parsedFields.pic || '-'}</div>
    <div>
      <span className="font-semibold">RC Pic :</span>{' '}
      <span style={{ 
        color: Number(rcPicValue || 0) === Number(totalPic || 0) ? '#22c55e' : '#ef4444', 
        fontWeight: 'bold' 
      }}>
        {rcPicValue ?? '-'}
      </span>
    </div>

    <div>
      <span className="font-semibold">Alter :</span>{' '}
      <span style={{ fontWeight: 'bold', color: '#ef4444' }}>
        {alterValue ?? '-'}
      </span>
    </div>
    <div>
      <span className="font-semibold">Reject :</span>{' '}
      <span style={{ fontWeight: 'bold', color: '#ef4444' }}>
        {rejectValue ?? '-'}
      </span>
    </div>

    <div><span className="font-semibold">Size :</span> {parsedFields.size || '-'}</div>
    <div><span className="font-semibold">Color :</span> {parsedFields.colour || parsedFields.color || '-'}</div>

  </div>
  
      <InputElement
          name="Alter"
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          value={alterValue}
          onChange={v => setAlterValue(String(v ?? '').replace(/\D/g, '') || 0)}
        />

        <InputElement
          name="Reject"
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          value={rejectValue}
          onChange={v => setRejectValue(String(v ?? '').replace(/\D/g, '') || 0)}
        />

            <div className="mt-3">
              <SelectElement
                name="Employee"
                options={checkingOptions}
                value={parsedFields.checking}
                onChange={(val) => onFieldChange('checking', val)}
                placeholder="Select Employee"
                isClearable={false}
                className="w-full"
                isMulti={false}
                menuPortalTarget={document.body}
              />
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CheckingQrDetailsModal;