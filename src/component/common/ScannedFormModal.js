import React from 'react';
import Modal from './Modal';
import { toast } from 'react-toastify';

const ScannedFormModal = ({ isOpen, onClose, formData, setFormData, onSubmit }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enter Details"
      size="md"
    >
      <form
        className="flex flex-col gap-4 p-4"
        onSubmit={e => {
          e.preventDefault();
          if (onSubmit) {
            onSubmit();
          } else {
            onClose();
            toast.success('Form submitted!', { toastId: 'form-submit-success' });
          }
        }}
      >
        <div>
          <label className="block font-bold">Process Name</label>
          <input
            type="text"
            value={formData.processName}
            readOnly
            className="w-full border rounded p-2 bg-gray-100"
          />
        </div>
        <div>
          <label className="block font-bold">Scanned Value</label>
          <input
            type="text"
            value={formData.scannedValue}
            readOnly
            className="w-full border rounded p-2 bg-gray-100"
          />
        </div>
        <div>
          <label className="block font-bold">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block font-bold">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            required
            className="w-full border rounded p-2"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white rounded p-2 font-bold mt-2"
        >
          Submit
        </button>
      </form>
    </Modal>
  );
};

export default ScannedFormModal; 