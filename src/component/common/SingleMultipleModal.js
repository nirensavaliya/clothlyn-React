import React, { useState } from 'react';
import Modal from './Modal';
import SelectElement from './Select';
import Button from './Button';
import LoaderComponent from './Loader';

const SingleMultipleModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  fields = {},
  onFieldChange,
  size = 'md',
}) => {
  const [showSelectionError, setShowSelectionError] = useState(false);

  const selectionOptions = [
    { value: 'single', label: 'Single' },
    { value: 'multiple', label: 'Multiple' },
  ];

  let parsedFields = fields;
  if (fields && typeof fields.barcodeValue === 'string') {
    try {
      parsedFields = { ...JSON.parse(fields.barcodeValue), ...fields };
    } catch (e) {
      parsedFields = fields;
    }
  }

  const handleSubmit = () => {
    if (!parsedFields.selection) {
      setShowSelectionError(true);
      return;
    }
    setShowSelectionError(false);
    const payload = {
      ...parsedFields,
      selection: parsedFields.selection,
      dashboardDataId: parsedFields.id,
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
        label={isLoading ? 'Submit...' : 'Submit'}
        onClick={handleSubmit}
        disabled={isLoading}
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
        title="Selection Details"
        footerContent={footerContent}
        size={size}
      >
        <div className="p-4 space-y-3">
          <div className="mb-4 bg-light-white/80 text-left">
           
            <div className="mt-3">
              <SelectElement
                name="Select Doracut Type"
                options={selectionOptions}
                value={parsedFields.selection}
                onChange={val => {
                  onFieldChange('selection', val);
                  // Auto-submit when "single" or "multiple" is selected
                  if (val === 'single' || val === 'multiple') {
                    const payload = {
                      ...parsedFields,
                      selection: val,
                      dashboardDataId: parsedFields.id,
                    };
                    onSubmit(payload);
                  }
                }}
                placeholder="Select Doracut Type"
                isClearable={false}
                className="w-full mb-2"
                isMulti={false}
                menuPortalTarget={document.body}
              />
              {showSelectionError && (
                <div className="text-xs text-[#f44336] mt-1">Please select a type (Single or Multiple)</div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SingleMultipleModal; 