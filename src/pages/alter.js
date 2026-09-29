import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { LucideSearch, LucideChevronDown, LucideChevronUp, LucideFilter, LucidePlus, LucideEdit, AlertTriangle, ExternalLink, LucideDownload, Edit, Trash2, LucideLoader, Eye, LucideX, LucideCheck, LucideClock, LucideUser, LucideCalendar, LucideMapPin, LucideClipboardList, LucideUserCheck, LucideScissors, LucidePhone, LucideMail } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { formatDate, lowercase } from '../helpers/utils';
import InputElement from '../component/common/InputElement';
import Button from '../component/common/Button';
import Modal from '../component/common/Modal';
import Status from '../component/common/Status';
import SelectElement from '../component/common/Select';
import LoaderComponent from '../component/common/Loader';
import { getLotData, updateLotData } from '../apis/processApi';
import usePageTitle from '../hooks/usePageTitle';

const Alter = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [filteredAlterRequests, setFilteredAlterRequests] = useState([]);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedAlterData, setSelectedAlterData] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [lotData, setLotData] = useState(null);
  const [isLoadingLotData, setIsLoadingLotData] = useState(false);
  const [currentLotNo, setCurrentLotNo] = useState('');
  const [isAlterRequestModalOpen, setIsAlterRequestModalOpen] = useState(false);
  const [alterRequestData, setAlterRequestData] = useState({ alter: '', reject: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const searchRef = useRef(null);
  usePageTitle('Alter');

  // Mock data for alter requests
  const mockAlterRequests = [
    {
      id: 1,
      requestId: 'ALT001',
      employeeName: 'John Doe',
      employeeCode: 'EMP001',
      requestDate: '2024-01-15',
      description: 'Shirt sleeve length adjustment',
      status: 'pending',
      priority: 'medium',
      estimatedTime: '2 hours',
      department: 'Tailoring',
      assignedTo: 'Tailor A',
      notes: 'Customer requested sleeve length to be shortened by 1 inch',
      employeeDetails: {
        name: 'John Doe',
        code: 'EMP001',
        department: 'Tailoring',
        experience: '5 years',
        specialization: 'Shirt alterations',
        contact: '+91 9876543210',
        email: 'john.doe@company.com'
      }
    },
    {
      id: 2,
      requestId: 'ALT002',
      employeeName: 'Jane Smith',
      employeeCode: 'EMP002',
      requestDate: '2024-01-14',
      description: 'Pant waist adjustment',
      status: 'approved',
      priority: 'high',
      estimatedTime: '1 hour',
      department: 'Tailoring',
      assignedTo: 'Tailor B',
      notes: 'Waist needs to be taken in by 2 inches',
      employeeDetails: {
        name: 'Jane Smith',
        code: 'EMP002',
        department: 'Tailoring',
        experience: '3 years',
        specialization: 'Pant alterations',
        contact: '+91 9123456780',
        email: 'jane.smith@company.com'
      }
    },
    {
      id: 3,
      requestId: 'ALT003',
      employeeName: 'Mike Johnson',
      employeeCode: 'EMP003',
      requestDate: '2024-01-13',
      description: 'Dress hem adjustment',
      status: 'rejected',
      priority: 'low',
      estimatedTime: '30 minutes',
      department: 'Tailoring',
      assignedTo: 'Tailor C',
      notes: 'Request rejected due to fabric limitations',
      employeeDetails: {
        name: 'Mike Johnson',
        code: 'EMP003',
        department: 'Tailoring',
        experience: '7 years',
        specialization: 'Dress alterations',
        contact: '+91 9456789012',
        email: 'mike.johnson@company.com'
      }
    },
    {
      id: 4,
      requestId: 'ALT004',
      employeeName: 'Sarah Wilson',
      employeeCode: 'EMP004',
      requestDate: '2024-01-12',
      description: 'Jacket sleeve repair',
      status: 'completed',
      priority: 'high',
      estimatedTime: '3 hours',
      department: 'Repair',
      assignedTo: 'Tailor A',
      notes: 'Sleeve seam repair completed successfully',
      employeeDetails: {
        name: 'Sarah Wilson',
        code: 'EMP004',
        department: 'Repair',
        experience: '4 years',
        specialization: 'Jacket repairs',
        contact: '+91 9234567890',
        email: 'sarah.wilson@company.com'
      }
    },
    {
      id: 5,
      requestId: 'ALT005',
      employeeName: 'David Brown',
      employeeCode: 'EMP005',
      requestDate: '2024-01-11',
      description: 'Suit jacket fitting',
      status: 'pending',
      priority: 'high',
      estimatedTime: '2.5 hours',
      department: 'Tailoring',
      assignedTo: 'Tailor D',
      notes: 'Customer needs suit jacket to be fitted properly',
      employeeDetails: {
        name: 'David Brown',
        code: 'EMP005',
        department: 'Tailoring',
        experience: '6 years',
        specialization: 'Suit alterations',
        contact: '+91 9345678901',
        email: 'david.brown@company.com'
      }
    }
  ];



  // Fetch lot data from API
  const fetchLotData = async (lotNo) => {
    
    if (!lotNo || lotNo.trim() === '') return;
    
    try {
      setIsLoadingLotData(true);
      setCurrentLotNo(lotNo);
      const response = await getLotData(lotNo);
      setLotData(response);
      return response;
    } catch (error) {
      toast.error(error?.message || 'Failed to fetch lot data', { toastId: 'lot-data-error' });
      console.error('Error fetching lot data:', error);
      setLotData(null);
    } finally {
      setIsLoadingLotData(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);


  useEffect(() => {
    if (debouncedSearchQuery) {
      fetchLotData(debouncedSearchQuery);
      setShowDropdown(true);
    } else {
      setLotData(null);
      setShowDropdown(false);
    }
  }, [debouncedSearchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (value) => {
    setSearchQuery(value);
  };

  const handleOpenViewModal = (item) => {
    
    setSelectedAlterData(item);
    // Pre-fill the alter request data with existing values or defaults
    const alterValue = item?.alter || '0';
    const rejectValue = item?.reject || '0';
    setAlterRequestData({ alter: alterValue, reject: rejectValue });
    setIsViewModalOpen(true);
    setShowDropdown(false);
  };

  const handleOpenLotModal = (lotData) => {
    
    setSelectedAlterData(lotData?.data?.[0]);
    // Pre-fill the alter request data with existing values from API
    const alterValue = lotData?.data?.[0]?.alter || '0';
    const rejectValue = lotData?.data?.[0]?.reject || '0';
    setAlterRequestData({ alter: alterValue, reject: rejectValue });
    setIsViewModalOpen(true);
    setShowDropdown(false);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedAlterData(null);
  };

  const handleReject = (item) => {
    setSelectedAlterData(item);
    setIsRejectModalOpen(true);
    setRejectReason('');
    setShowDropdown(false);
  };



 

  const handleAlterRequestUpdate = async () => {
    if (selectedAlterData && currentLotNo) {
      try {
        setIsUpdating(true);
        
        const updateData = {
          alter: alterRequestData?.alter || '0',
          reject: alterRequestData?.reject || '0'
        };
        
        
        await updateLotData(currentLotNo, updateData);
        
        await fetchLotData(currentLotNo);
        
        toast.success('Lot data updated successfully!');
        setIsViewModalOpen(false);
        setAlterRequestData({ alter: '', reject: '' });
      } catch (error) {
        console.error('Error updating lot data:', error);
        toast.error('Failed to update lot data');
      } finally {
        setIsUpdating(false);
      }
    } else {
      const requestId = selectedAlterData?.requestId;
      if (!requestId) {
        toast.error('No request ID available for update');
        return;
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'in_progress':
        return 'info';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };



  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <h1 className="text-2xl font-bold text-light-darkGrey">Alter</h1>
      </div>

      <div className="flex items-center justify-between gap-4 w-[40rem] max-lg:w-full">
        <div className="flex-grow w-full relative" ref={searchRef}>
          <InputElement
            type="text"
            placeholder="Search by LotNo (e.g., 246347A)"
            value={searchQuery}
            onChange={handleSearch}
            variant="size_44"
            className="w-full"
            is_required={false}
            extra_text_before={
              (loading && debouncedSearchQuery !== searchQuery) || isLoadingLotData ? (
                <LucideLoader size={20} className="text-light-primary animate-spin" />
              ) : (
                <LucideSearch size={20} className="text-light-lightGrey" />
              )
            }
          />
          
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-light-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              {isLoadingLotData ? (
                <div className="p-4 text-center">
                  <LucideLoader size={20} className="text-light-primary animate-spin mx-auto mb-2" />
                  <p className="text-light-lightGrey">Searching for "{debouncedSearchQuery}"...</p>
                </div>
              ) : lotData ? (
                <div
                  className="p-4 border-b border-light-border hover:bg-light-lightGreyBackground cursor-pointer transition-colors duration-200"
                  onClick={() => handleOpenLotModal(lotData)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-light-primary rounded-full flex items-center justify-center">
                        <LucideClipboardList size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-light-darkGrey text-left">{debouncedSearchQuery}</h3>
                      </div>
                    </div>
                  </div>
                </div>
              ) : debouncedSearchQuery && !lotData ? (
                <div className="p-4 text-center">
                  <p className="text-light-lightGrey">No results found for "{debouncedSearchQuery}"</p>
                </div>
              ) : null}

              {/* Mock Data Results Section */}
              {filteredAlterRequests.length > 0 && (
                <>
                  {filteredAlterRequests.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 border-b border-light-border hover:bg-light-lightGreyBackground cursor-pointer transition-colors duration-200"
                      onClick={() => handleOpenViewModal(item)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-light-primary rounded-full flex items-center justify-center">
                            <LucideUser size={20} className="text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-light-darkGrey">{item.requestId}</h3>
                            <p className="text-sm text-light-lightGrey">{item.employeeName} ({item.employeeCode})</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Status status={item.status} color={getStatusColor(item.status)} />
                          <Status status={item.priority} color={getPriorityColor(item.priority)} />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm text-light-darkGrey font-medium">{item.description}</p>
                        <div className="flex items-center gap-4 text-xs text-light-lightGrey">
                          <div className="flex items-center gap-1">
                            <LucideCalendar size={14} />
                            <span>{formatDate(item.requestDate)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <LucideMapPin size={14} />
                            <span>{item.department}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <LucideClock size={14} />
                            <span>{item.estimatedTime}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* View Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        title={"Alter Details"}
        size="lg"
         footerContent={
           <div className="flex justify-end gap-2">
             <Button
               label="Cancel"
               variant="outline"
               onClick={handleCloseViewModal}
             />
             <Button
               label="Update"
               variant="primary"
               onClick={handleAlterRequestUpdate}
               loading={isUpdating}
             />
           </div>
         }
      >
        {selectedAlterData && (
          <div className="p-6 space-y-6">
            {selectedAlterData ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-light-lightGreyBackground rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-light-primary rounded-full flex items-center justify-center">
                      <LucideClipboardList size={24} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-light-darkGrey">{selectedAlterData?.lotNo}</h2>
                    </div>
                  </div>
        
                </div>

                {/* Lot Details Section */}
                <div className="bg-white border border-light-border rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <LucideClipboardList size={20} className="text-light-primary" />
                    <h3 className="text-lg font-semibold text-light-darkGrey">Lot Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-light-lightGreyBackground rounded-full flex items-center justify-center">
                          <LucideClipboardList size={16} className="text-light-primary" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                            Lot Number
                          </label>
                          <p className="text-base font-medium text-light-darkGrey text-left">{selectedAlterData?.lotNo}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-light-lightGreyBackground rounded-full flex items-center justify-center">
                          <LucideCalendar size={16} className="text-light-primary" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                            D Number
                          </label>
                          <p className="text-base font-medium text-light-darkGrey">{selectedAlterData?.dNo}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-light-lightGreyBackground rounded-full flex items-center justify-center">
                          <LucideMapPin size={16} className="text-light-primary" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                            Size
                          </label>
                          <p className="text-base font-medium text-light-darkGrey">{selectedAlterData?.size}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-light-lightGreyBackground rounded-full flex items-center justify-center">
                          <LucideClock size={16} className="text-light-primary" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                            Color
                          </label>
                          <p className="text-base font-medium text-light-darkGrey">{selectedAlterData?.color}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-light-lightGreyBackground rounded-full flex items-center justify-center">
                          <LucideUser size={16} className="text-light-primary" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                            PIC
                          </label>
                          <p className="text-base font-medium text-light-darkGrey">{selectedAlterData?.pic}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-light-lightGreyBackground rounded-full flex items-center justify-center">
                          <LucideScissors size={16} className="text-light-primary" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                            RC PIC
                          </label>
                          <p className="text-base font-medium text-light-darkGrey">{selectedAlterData?.rcPic}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-light-lightGreyBackground rounded-full flex items-center justify-center">
                          <LucideEdit size={16} className="text-light-primary" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                            Price
                          </label>
                          <p className="text-base font-medium text-light-darkGrey">₹{selectedAlterData?.price}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Machine Details Section */}
                <div className="bg-white border border-light-border rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <LucideUserCheck size={20} className="text-light-primary" />
                    <h3 className="text-lg font-semibold text-light-darkGrey">Machine Details</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Single Machine */}
                    {selectedAlterData?.single && (
                      <div className="space-y-4 p-4 bg-light-lightGreyBackground rounded-lg">
                        <h4 className="font-semibold text-light-darkGrey text-center">Single Machine</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                              Emp Name
                            </label>
                            <p className="text-sm font-medium text-light-darkGrey">{selectedAlterData?.single?.employeeName}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                              Name
                            </label>
                            <p className="text-sm font-medium text-light-darkGrey">{selectedAlterData?.single.firstName} {selectedAlterData?.single.lastName}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                              Contact
                            </label>
                            <p className="text-sm font-medium text-light-darkGrey">{selectedAlterData?.single.mobileNumber}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fatlock Machine */}
                    {selectedAlterData?.fatlock && (
                      <div className="space-y-4 p-4 bg-light-lightGreyBackground rounded-lg">
                        <h4 className="font-semibold text-light-darkGrey text-center">Fatlock Machine</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                              Emp Name
                            </label>
                            <p className="text-sm font-medium text-light-darkGrey">{selectedAlterData?.fatlock.employeeName}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                              Name
                            </label>
                            <p className="text-sm font-medium text-light-darkGrey">{selectedAlterData?.fatlock.firstName} {selectedAlterData?.fatlock.lastName}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                              Contact
                            </label>
                            <p className="text-sm font-medium text-light-darkGrey">{selectedAlterData?.fatlock.mobileNumber}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Kansai Machine */}
                    {selectedAlterData?.kansai && (
                      <div className="space-y-4 p-4 bg-light-lightGreyBackground rounded-lg">
                        <h4 className="font-semibold text-light-darkGrey text-center">Kansai Machine</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                              Emp Name
                            </label>
                            <p className="text-sm font-medium text-light-darkGrey">{selectedAlterData?.kansai.employeeName}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                              Name
                            </label>
                            <p className="text-sm font-medium text-light-darkGrey">{selectedAlterData?.kansai.firstName} {selectedAlterData?.kansai.lastName}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                              Contact
                            </label>
                            <p className="text-sm font-medium text-light-darkGrey">{selectedAlterData?.kansai.mobileNumber}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Alter/Reject Section */}
                <div className="bg-white border border-light-border rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <LucideEdit size={20} className="text-light-primary" />
                    <h3 className="text-lg font-semibold text-light-darkGrey">Alter/Reject Values</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm text-left font-medium text-light-darkGrey">
                        Alter Value
                      </label>
                      <InputElement
                        type="number"
                        value={alterRequestData?.alter || ''}
                        onChange={(e) => setAlterRequestData(prev => ({ ...prev, alter: e }))}
                        placeholder="Enter alter value"
                        variant="size_44"
                        className="w-full"
                        is_required={false}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm text-left font-medium text-light-darkGrey">
                        Reject Value
                      </label>
                      <InputElement
                        type="number"
                        value={alterRequestData?.reject || ''}
                        onChange={(e) => setAlterRequestData(prev => ({ ...prev, reject: e }))}
                        placeholder="Enter reject value"
                        variant="size_44"
                        className="w-full"
                        is_required={false}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Mock Data Modal Content (for backward compatibility)
              <div className="space-y-6">
                {/* Header Section with Status */}
                <div className="flex items-center justify-between p-4 bg-light-lightGreyBackground rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-light-primary rounded-full flex items-center justify-center">
                      <LucideUser size={24} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-light-darkGrey">{selectedAlterData.requestId}</h2>
                      <p className="text-sm text-light-lightGrey">{selectedAlterData.employeeName} • {selectedAlterData.employeeCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Status status={selectedAlterData.status} color={getStatusColor(selectedAlterData.status)} />
                    <Status status={selectedAlterData.priority} color={getPriorityColor(selectedAlterData.priority)} />
                  </div>
                </div>

                {/* Alter/Reject Section */}
                <div className="bg-white border border-light-border rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <LucideEdit size={20} className="text-light-primary" />
                    <h3 className="text-lg font-semibold text-light-darkGrey">Alter/Reject Values</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm text-left font-medium text-light-darkGrey">
                        Alter Value
                      </label>
                      <InputElement
                        type="number"
                        value={alterRequestData?.alter || ''}
                        onChange={(e) => setAlterRequestData(prev => ({ ...prev, alter: e }))}
                        placeholder="Enter alter value"
                        variant="size_44"
                        className="w-full"
                        is_required={false}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm text-left font-medium text-light-darkGrey">
                        Reject Value
                      </label>
                      <InputElement
                        type="number"
                        value={alterRequestData?.reject || ''}
                        onChange={(e) => setAlterRequestData(prev => ({ ...prev, reject: e }))}
                        placeholder="Enter reject value"
                        variant="size_44"
                        className="w-full"
                        is_required={false}
                      />
                    </div>
                  </div>
                </div>

                {/* Employee Details Section */}
                <div className="bg-white border border-light-border rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <LucideUserCheck size={20} className="text-light-primary" />
                    <h3 className="text-lg font-semibold text-light-darkGrey">Employee Details</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-light-lightGreyBackground rounded-full flex items-center justify-center">
                          <LucideUser size={16} className="text-light-primary" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                            Name
                          </label>
                          <p className="text-base font-medium text-light-darkGrey">{selectedAlterData?.employeeDetails?.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-light-lightGreyBackground rounded-full flex items-center justify-center">
                          <LucideUser size={16} className="text-light-primary" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                            Emp Code
                          </label>
                          <p className="text-base font-medium text-light-darkGrey">{selectedAlterData.employeeDetails?.code}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-light-lightGreyBackground rounded-full flex items-center justify-center">
                          <LucideMapPin size={16} className="text-light-primary" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                            Department
                          </label>
                          <p className="text-base font-medium text-light-darkGrey">{selectedAlterData.employeeDetails?.department}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-light-lightGreyBackground rounded-full flex items-center justify-center">
                          <LucideClock size={16} className="text-light-primary" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                            Experience
                          </label>
                          <p className="text-base font-medium text-light-darkGrey">{selectedAlterData.employeeDetails?.experience}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-light-lightGreyBackground rounded-full flex items-center justify-center">
                          <LucideScissors size={16} className="text-light-primary" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                            Specialization
                          </label>
                          <p className="text-base font-medium text-light-darkGrey">{selectedAlterData.employeeDetails?.specialization}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-light-lightGreyBackground rounded-full flex items-center justify-center">
                          <LucidePhone size={16} className="text-light-primary" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                            Contact
                          </label>
                          <p className="text-base font-medium text-light-darkGrey">{selectedAlterData.employeeDetails?.contact}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-light-lightGreyBackground rounded-full flex items-center justify-center">
                          <LucideMail size={16} className="text-light-primary" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                            Email
                          </label>
                          <p className="text-base font-medium text-light-darkGrey truncate">{selectedAlterData.employeeDetails?.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>



      <ToastContainer />
    </div>
  );
};

export default Alter; 
