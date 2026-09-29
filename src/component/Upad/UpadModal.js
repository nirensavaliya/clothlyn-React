import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import InputElement from '../common/InputElement';
import { toast } from 'react-toastify';
import { addUpad, getUpadData, getUserUpadData } from '../../apis/upadApi';
import LoaderComponent from '../common/Loader';

const UpadModal = ({ isOpen, onClose, employeeId, employeeName }) => {
  const [upadData, setUpadData] = useState({
    employeeId: employeeId || '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [upadHistory, setUpadHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddingUpad, setIsAddingUpad] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && employeeId) {
      fetchUpadHistory();
    }
  }, [isOpen, employeeId]);

  const fetchUpadHistory = async () => {
    try {
      setLoading(true);      
      // If employeeId is provided, use getUpadData, otherwise use getUserUpadData
      const response = employeeId 
        ? await getUpadData()
        : await getUserUpadData(employeeId);
        
      setUpadHistory(response.data || []);
    } catch (error) {
      console.error('Failed to fetch UPAD history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUpad = async () => {
    if (!upadData.employeeId || !upadData.amount) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsAddingUpad(true);
      setError(null);
      
      // If employeeId is null, we're in user profile mode, so don't include employeeId
      const upadDataToSend = employeeId ? upadData : {
        amount: upadData.amount,
        date: upadData.date,
        description: upadData.description,
      };
      
      await addUpad(upadDataToSend);
      setUpadData({
        employeeId: employeeId || '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
      });
      fetchUpadHistory();
    } catch (error) {
      setError(error.message || "Failed to add UPAD");
    } finally {
      setIsAddingUpad(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`UPAD Details - ${employeeName}`}
      size="lg"
    >
      <div className="p-6">
        {/* Add New UPAD Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Add New UPAD</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputElement
              name="UPAD Amount"
              value={upadData.amount}
              onChange={(value) => setUpadData({ ...upadData, amount: value })}
              placeholder="Enter amount"
              type="number"
              is_required
            />
            
            <InputElement
              name="Date"
              value={upadData.date}
              onChange={(value) => setUpadData({ ...upadData, date: value })}
              placeholder="Select date"
              type="date"
              is_required
            />

          </div>
          
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          
          <div className="mt-4">
            <Button
              label="Add UPAD"
              variant="primary"
              onClick={handleAddUpad}
              isLoading={isAddingUpad}
            />
          </div>
        </div>

        {/* UPAD History Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">UPAD History</h3>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <LoaderComponent size={40} />
            </div>
          ) : upadHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No UPAD history found for this employee.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-[#F9F6F1] border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {upadHistory.map((upad, index) => (
                    <tr
                      key={upad._id || index}
                      className={
                        index % 2 === 0
                          ? 'bg-[#F9F6F1] hover:bg-gray-50'
                          : 'bg-light-primary/15 hover:bg-light-primary/25'
                      }
                    >
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {formatDate(upad.date)}
                      </td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">
                        {formatCurrency(upad.amount)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {upad.description || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            label="Close"
            variant="secondary"
            onClick={onClose}
          />
        </div>
      </div>
    </Modal>
  );
};

export default UpadModal; 