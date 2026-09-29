import React, { useEffect, useState } from 'react';
import { useMachines } from '../contexts/MachineContext';
import { getUsers } from '../apis/userApi';
import { createAssignment } from '../apis/assignmentApi';
import { toast } from 'react-toastify';
import Button from '../component/common/Button';
import SelectElement from '../component/common/Select';


const BarcodeActionForm = ({}) => {
  const [userOptions, setUserOptions] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { machines: machineOptions, loading: loadingMachines, fetchMachines } = useMachines();

  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);


      const fetchUsersData = async () => {
  try {
    const response = await getUsers();

    console.log("USER LIST", response.data?.users[0]); // 👈 yahi add karna hai

    // ... baaki code
  } catch (error) {
    console.log(error);
  }
};


  useEffect(() => {
    fetchUsersData()
  }, []);



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMachine || !selectedUser) {
      toast.error('Please select both machine and user', { toastId: 'assignment-create-error' });
      return;
    }
    setLoading(true);
    try {
      const storedProcess = localStorage.getItem('selectedProcess');
      const processData = storedProcess ? JSON.parse(storedProcess) : null;
      
      // if (!processData || !processData._id) {
      //   toast.error('Process information not found');
      //   return;
      // }

      const assignmentData = {
        userId: selectedUser,
        machineId: selectedMachine,
        processId: processData?._id,
        // barcodeData: barcodeData?.barcodeValue || 'manual-scan',
        notes: `Assignment created via barcode scan`
      };

      const response = await createAssignment(assignmentData);
      
      if (response.status === 'success') {
        toast.success('Assignment created successfully!', { toastId: 'assignment-create-success' });
            setLoading(false);

        
        if (handleSubmit) {
          handleSubmit({
            machineId: selectedMachine,
            userId: selectedUser,
            assignmentId: response.data._id
          });
        }
        
        setSelectedMachine(null);
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Assignment creation error:', error);
      toast.error(error.message || 'Failed to create assignment', { toastId: 'assignment-create-error' });
    } finally{
      setLoading(false);
    }
  };

  return (
      <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div>
  <SelectElement
  name="Machine"
  id="machine-select"
  value={selectedMachine}
  onChange={setSelectedMachine}
  options={machineOptions.map(m => ({ value: m._id, label: m.machineName }))}
  placeholder="Select Machine"
  is_required={true}
  variant="solid"
  className="w-full"
  isMulti={false}   // ✅ Single select
  menuPortalTarget={document.body}
/>

        </div>
        <div>
          <SelectElement
            name="User"
            id="user-select"
            value={selectedUser}
            onChange={setSelectedUser}
            options={userOptions.map(m => ({ value: m._id, label: m.username }))}
            placeholder={loadingUsers ? 'Loading users...' : 'Select user'}
            is_required
            disabled={loadingUsers}
            menuPortalTarget={document.body}
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {}}
                label="Cancel"
              />
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!selectedMachine || !selectedUser || loading}
                label={loading ? 'Submitting...': "Submit"}
                loading={loading}
              />
        </div>
      </form>
  );
};

export default BarcodeActionForm; 