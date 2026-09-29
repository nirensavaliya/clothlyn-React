import React, { useState } from 'react';
import SelectElement from '../component/common/Select';
import Button from '../component/common/Button';
import { toast } from 'react-toastify';
import { updateUserStatus } from '../apis/userApi';
import LoaderComponent from '../component/common/Loader';

const statusOptions = [
  { value: 'loading', label: 'Loading', isDisabled: true },
  { value: 'unloading', label: 'Unloading' },
];

const BASE_URL = process.env.REACT_APP_BASE_URL_VERCEL;

const BarcodeStatusAction = ({ }) => {
  const [selectedStatus, setSelectedStatus] = useState(statusOptions[0].value);
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?._id || user?.data?._id || ''
  const storedProcess = localStorage.getItem('selectedProcess');
  const processData = storedProcess ? JSON.parse(storedProcess) : null;


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStatus) return;
    try {
        setLoading(true);
       const response = await updateUserStatus(userId, { status: selectedStatus , userId:userId, processId: processData?._id })
      } catch (error) {
       
      } finally {
        setLoading(false);
      }
    };

  return (
    <>
        {(loading) && <LoaderComponent size={56}/>}
    
      <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
        <SelectElement
          name="Status"
          id="status-select"
          value={selectedStatus}
          onChange={setSelectedStatus}
          options={statusOptions}
          placeholder="Select Scan Status"
          is_required={true}
          variant="solid"
          className="w-full"
          menuPortalTarget={document.body}
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            label="Cancel"
            onClick={()  => {}}
            className="min-w-[90px]"
          />
          <Button
            type="submit"
            variant="primary"
            label={loading ? 'Submitting...' : 'Submit'}
            disabled={!selectedStatus || loading}
            loading={loading}
            className="min-w-[90px]"
          />
        </div>
      </form>
      </>
  );
};

export default BarcodeStatusAction; 