import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import SelectElement from './Select';
import Button from './Button';
import { getEmployees } from '../../apis/employeeApi';
import LoaderComponent from './Loader';
import { mapEmployeeToSelectOption, pickLotMetric } from '../../helpers/utils';

const GenericScanQrDetailsModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  fields = {},
  onFieldChange,
  processName = '',
  size = 'md',
}) => {
  const [employees, setEmployees] = useState([]);

  const { rcDetails = {} } = fields || {};
  const {
    rcPic: rcPicFromDetails = 0,
    alter: alterFromDetails = 0,
    reject: rejectFromDetails = 0,
  } = rcDetails;

  let parsedFields = fields;
  if (fields && typeof fields.barcodeValue === 'string') {
    try {
      parsedFields = { ...JSON.parse(fields.barcodeValue), ...fields };
    } catch (e) {
      parsedFields = fields;
    }
  }

  const displayProcessName =
    processName || parsedFields.process || parsedFields.processName || 'Process';

  const rcPic = pickLotMetric(parsedFields?.rcPic, rcPicFromDetails);
  const alter = pickLotMetric(parsedFields?.alter, alterFromDetails);
  const reject = pickLotMetric(parsedFields?.reject, rejectFromDetails);

  useEffect(() => {
    if (isOpen && displayProcessName) {
      getEmployees({ processName: displayProcessName }).then((res) =>
        setEmployees(res.data || [])
      );
    }
  }, [isOpen, displayProcessName]);

  const employeeOptions = employees.map((emp) => mapEmployeeToSelectOption(emp));

  const handleSubmit = () => {
    const payload = {
      ...parsedFields,
      alter: alter ?? 0,
      rcPic: rcPic ?? 0,
      reject: reject ?? 0,
      employeeId: parsedFields.employeeId,
      dashboardDataId: parsedFields.id,
      processName: displayProcessName,
    };
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
        disabled={isLoading || !parsedFields.employeeId}
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
          <div className="text-base font-semibold flex text-center uppercase">
            {displayProcessName}
          </div>
          <div className="mb-4 bg-light-white/80 text-left">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <div>
                <span className="font-semibold">Lot No :</span> {parsedFields.lotNo || '-'}
              </div>
              <div>
                <span className="font-semibold">D No :</span> {parsedFields.dNo || '-'}
              </div>
              <div>
                <span className="font-semibold">Total Pic :</span> {parsedFields.pic || '-'}
              </div>
              <div>
                <span className="font-semibold">RC Pic :</span>{' '}
                <span
                  style={{
                    color: rcPic === Number(parsedFields.pic) ? '#22c55e' : '#ef4444',
                    fontWeight: 'bold',
                  }}
                >
                  {rcPic ?? '-'}
                </span>
              </div>
              <div>
                <span className="font-semibold">Alter :</span>{' '}
                <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{alter ?? '-'}</span>
              </div>
              <div>
                <span className="font-semibold">Reject :</span>{' '}
                <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{reject ?? '-'}</span>
              </div>
              <div>
                <span className="font-semibold">Size :</span> {parsedFields.size || '-'}
              </div>
              <div>
                <span className="font-semibold">Color :</span>{' '}
                {parsedFields.colour || parsedFields.color || '-'}
              </div>
            </div>

            <div className="mt-3">
              <SelectElement
                name={`Select ${displayProcessName}`}
                options={employeeOptions}
                value={parsedFields.employeeId}
                onChange={(val) => onFieldChange('employeeId', val)}
                placeholder={`Select ${displayProcessName}`}
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

export default GenericScanQrDetailsModal;
