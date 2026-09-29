import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import SelectElement from './Select';
import Button from './Button';
import { getEmployees } from '../../apis/employeeApi';
import { mapEmployeeToSelectOption } from '../../helpers/utils';
import MobileCameraModal from './MobileCameraModal';
import LoaderComponent from './Loader';
import InputElement from './InputElement';


const PackingQrDetailsModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  fields = {},
  onFieldChange,
  size = 'md',
}) => {
  const [employees, setEmployees] = useState([]);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [stickerPhoto, setStickerPhoto] = useState(null);
  const [showStickerPhotoError, setShowStickerPhotoError] = useState(false);

  const {
  rcDetails = {},
} = fields || {};

const { rcPic = 0, alter = 0, reject = 0 } = rcDetails;

console.log(rcPic, alter, reject);

  // const packingOptions = employees.map(emp => ({
  //   value: emp._id,
  //   label: emp.employeeName || `${emp.firstName} ${emp.lastName}`,
  // }));

  const packingOptions = employees.map((emp) => mapEmployeeToSelectOption(emp));

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


 useEffect(() => {
    if (isOpen) {
      getEmployees({processName: 'packing'}).then(res => setEmployees(res.data || []));
    }
  }, [isOpen]);

  useEffect(() => {
  const newRcPic =
    totalPic - Number(alterValue || 0) - Number(rejectValue || 0);

  setRcPicValue(newRcPic >= 0 ? newRcPic : 0);

  // parent fields update (important for payload)
  onFieldChange('alter', alterValue);
  onFieldChange('reject', rejectValue);
  onFieldChange('rcPic', newRcPic >= 0 ? newRcPic : 0);
}, [alterValue, rejectValue]);


  const handleStickerPhotoCapture = (data) => {
    setStickerPhoto(data.imageData);
    if (onFieldChange) onFieldChange('stickerPhoto', data.imageData);
    // setShowStickerPhotoError(false);
  };

  const handleSubmit = () => {
    // if (!stickerPhoto && !parsedFields.stickerPhoto) {
    //   setShowStickerPhotoError(true);
    //   return;
    // }
    // setShowStickerPhotoError(false);
      const payload = {
        ...parsedFields,
        alter: Number(alterValue),
        reject: Number(rejectValue),
        rcPic: Number(rcPicValue),
        packing: parsedFields.packing,
        dashboardDataId: parsedFields.id,
      };

    console.log('Submitting payload:', payload);
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
        disabled={isLoading || !parsedFields.packing}
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
      title="Qr Details"
      footerContent={footerContent}
      size={size}
    >
      <div className="p-4 space-y-3">
        <div className="text-base font-semibold flex text-center">PACKING</div>
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

          {/* <div className="mt-3">
            <div className="mb-1 text-sm font-semibold">Upload Sticker Photo:</div>
            {stickerPhoto ? (
              <div className="flex flex-col items-center mb-2">
                <img src={stickerPhoto} alt="Sticker Preview" className="w-32 h-32 object-cover rounded mb-2 border" />
                <Button
                  type="button"
                  variant="outline"
                  label="Retake Photo"
                  className="w-full mb-1"
                  onClick={() => setIsCameraModalOpen(true)}
                />
              </div>
            ) : (
              <Button
                type="button"
                variant="primary"
                label="UPLOAD STICKER PHOTO"
                className="w-full mb-1"
                onClick={() => setIsCameraModalOpen(true)}
              />
            )}
            {showStickerPhotoError && (
              <div className="text-xs text-[#f44336] mt-1">Upload Sticker photo is a required field</div>
            )}
          </div>
          <MobileCameraModal
            isOpen={isCameraModalOpen}
            onClose={() => setIsCameraModalOpen(false)}
            onScanComplete={handleStickerPhotoCapture}
            processId={parsedFields.id}
          /> */}

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
              name="Select Packing"
              options={packingOptions}
              value={parsedFields.packing}
              onChange={val => onFieldChange('packing', val)}
              placeholder="Select Packing"
              isClearable={false}
              className="w-full mb-2"
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

export default PackingQrDetailsModal; 