import React from 'react';
import Modal from './Modal';
import InputElement from './InputElement';
import Button from './Button';

const AddModal = ({
  isOpen,
  onClose,
  onAdd,
  isLoading = false,
  title = 'Add New Item',
  inputLabel = 'Name',
  placeholder = 'Enter name',
  value = '',
  onChange,
  error = '',
  buttonLabel = 'Add',
  size = 'md',
}) => {
  const footerContent = (
    <div className="flex gap-3 justify-end">
      <Button
        type="button"
        variant="default"
        label="Cancel"
        className='focus:!ring-0'
        onClick={onClose}
        disabled={isLoading}
      />
      <Button
        type="button"
        variant="primary"
        label={isLoading ? `${buttonLabel}...` : buttonLabel}
        onClick={onAdd}
        disabled={isLoading}
        loading={isLoading}
      />
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footerContent={footerContent}
      size={size}
    >
      <div className="p-4">
        <InputElement
          name={inputLabel}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          is_required={true}
          error={error}
        />
      </div>
    </Modal>
  );
};

export default AddModal; 