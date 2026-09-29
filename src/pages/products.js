import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { LucideSearch, LucideChevronDown, LucideChevronUp, LucideFilter, LucidePlus, LucideEdit, AlertTriangle, ExternalLink, LucideDownload, Edit, Trash2, LucideLoader, Eye } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import { getAuthHeaders, getAuthToken } from '../utils/authToken';
import 'react-toastify/dist/ReactToastify.css';
import { getItems, addItem, updateItem, deleteItem, getUniqueColors, getUniqueSizes } from '../apis/itemsApi';
import { getProcesses } from '../apis/processApi';
import { formatDate, lowercase } from '../helpers/utils';
import InputElement from '../component/common/InputElement';
import CommonTable from '../component/common/Table/Table';
import Button from '../component/common/Button';
import Modal from '../component/common/Modal';
import Status from '../component/common/Status';
import SelectElement from '../component/common/Select';
import ActionCell from '../component/common/Table/ActionCell';
import AddProductForm from '../component/Products/AddProductForm';
import UpdateProductForm from '../component/Products/UpdateProductForm';
import LoaderComponent from '../component/common/Loader';
import usePageTitle from '../hooks/usePageTitle';

// Status options for filter dropdown
const STATUS_OPTIONS = [
  { value: 'Unloading', label: 'Unloading' },
  { value: 'RC', label: 'RC' },
  { value: 'Doracut', label: 'Doracut' },
  { value: 'Logo', label: 'Logo' },
  { value: 'Press', label: 'Press' },
  { value: 'Packing', label: 'Packing' },
  { value: 'Checking', label: 'Checking' },
  { value: 'Billscan', label: 'Billscan' },
  { value: 'Complete', label: 'Complete' }
];

const Products = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLimit, setCurrentLimit] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [allItems, setAllItems] = useState({ items: [], pagination: { total: 0, page: 1, pages: 1, limit: 10 } });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedSize, setAppliedSize] = useState('');
  const filterRef = useRef(null);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isUpdateItemModalOpen, setIsUpdateItemModalOpen] = useState(false);
  const [editingItemData, setEditingItemData] = useState(null);
  const [isUpdatingItem, setIsUpdatingItem] = useState(false);
  const [sizes, setSizes] = useState([]);
  const [tempSelectedSize, setTempSelectedSize] = useState('');
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [colors, setColors] = useState([]);
  const [tempSelectedColor, setTempSelectedColor] = useState('');
  const [appliedColor, setAppliedColor] = useState('');
  const [isColorsLoading, setIsColorsLoading] = useState(false);
  const [isSizesLoading, setIsSizesLoading] = useState(false);
  const [tempSelectedDesignNumber, setTempSelectedDesignNumber] = useState(null);
  const [appliedDesignNumber, setAppliedDesignNumber] = useState(null);
  const [tempSelectedStatus, setTempSelectedStatus] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');
  const [tempSelectedPic, setTempSelectedPic] = useState('');
  const [appliedPic, setAppliedPic] = useState('');
  const [tempDateRange, setTempDateRange] = useState({ startDate: '', endDate: '' });
  const [appliedDateRange, setAppliedDateRange] = useState({ startDate: '', endDate: '' });
  const [designOptions, setDesignOptions] = useState([]);
  const [processOptions, setProcessOptions] = useState([]);
  const [isProcessesLoading, setIsProcessesLoading] = useState(false);
  const [tempEmployeeCode, setTempEmployeeCode] = useState('');
  const [appliedEmployeeCode, setAppliedEmployeeCode] = useState('');
  const [tempSelectedSendReceive, setTempSelectedSendReceive] = useState('');
  const [appliedSendReceive, setAppliedSendReceive] = useState('');
  const [tempNickName, setTempNickName] = useState('');
  const [appliedNickName, setAppliedNickName] = useState('');

  // New state for view modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProductData, setSelectedProductData] = useState(null);
  const [productEmployeeDetails, setProductEmployeeDetails] = useState([]);
  const [isLoadingEmployeeDetails, setIsLoadingEmployeeDetails] = useState(false);

  usePageTitle('Products');

  const picOptions = [
    { value: 'pic1', label: 'PIC 1' },
    { value: 'pic2', label: 'PIC 2' },
    { value: 'pic3', label: 'PIC 3' },
    { value: 'pic4', label: 'PIC 4' }
  ];

  const sendReceiveOptions = [
    { value: 'send', label: 'Send' },
    { value: 'receive', label: 'Receive' }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: currentLimit, 
        search: debouncedSearchQuery, 
        ...(sortConfig.key && { sortKey: sortConfig.key, sortDirection: sortConfig.direction }), 
        ...(appliedSize && { size: appliedSize }),
        ...(appliedColor && { color: appliedColor }),
        ...(appliedDesignNumber && appliedDesignNumber && { designNumber: appliedDesignNumber }), 
        ...(appliedStatus && { status: appliedStatus }),
        ...(appliedPic && { pic: appliedPic }),
        ...(appliedDateRange.startDate && { startDate: appliedDateRange.startDate }),
        ...(appliedDateRange.endDate && { endDate: appliedDateRange.endDate }),
        ...(appliedEmployeeCode && { employeeCode: appliedEmployeeCode }),
        ...(appliedSendReceive && { sendReceive: appliedSendReceive }),
        ...(appliedNickName && { nickName: appliedNickName })
      };
      
      const response = await getItems(params);
      setAllItems(response?.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setAllItems({ items: [], pagination: { total: 0, page: 1, pages: 1, limit: currentLimit } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchColors = async () => {
      try {
        setIsColorsLoading(true);
        const response = await getUniqueColors();
        if (response.status === 'success') {
          setColors(response.data);
        }
      } catch (error) {
        console.error('Error fetching colors:', error);
      } finally {
        setIsColorsLoading(false);
      }
    };

    fetchColors();
  }, []);

  useEffect(() => {
    const fetchSizes = async () => {
      try {
        setIsSizesLoading(true);
        const response = await getUniqueSizes();
        if (response.status === 'success') {
          setSizes(response.data);
        }
      } catch (error) {
        console.error('Error fetching sizes:', error);
      } finally {
        setIsSizesLoading(false);
      }
    };

    fetchSizes();
  }, []);

  useEffect(() => {
    const fetchProcesses = async () => {
      try {
        setIsProcessesLoading(true);
        const response = await getProcesses();        
        if (response && response.data && Array.isArray(response.data)) {
          const processOptions = response?.data?.map(process => ({
            value: process?.processName,
            label: process?.processName
          }));
          setProcessOptions(processOptions);
        }
      } catch (error) {
        console.error('Error fetching processes:', error);
      } finally {
        setIsProcessesLoading(false);
      }
    };

    fetchProcesses();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 700);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchData();
  }, [currentPage, currentLimit, debouncedSearchQuery, sortConfig, appliedSize, appliedColor, appliedDesignNumber, appliedStatus, appliedPic, appliedDateRange.startDate, appliedDateRange.endDate, appliedEmployeeCode, appliedSendReceive , appliedNickName]);

  useEffect(() => {
    const fetchDesignNumbers = async () => {
      try {
        const response = await getItems({ page: 1, limit: 1000 });
        if (response && response.data && Array.isArray(response.data.items)) {
          const seen = new Map();
          response.data.items.forEach(d => {
            if (d.designNumber && typeof d.designNumber === 'string' && d.designNumber.trim()) {
              const key = d.designNumber.trim().toLowerCase();
              if (!seen.has(key)) {
                seen.set(key, d.designNumber.trim());
              }
            }
          });
          const sorted = Array.from(seen.values()).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
          setDesignOptions(sorted.map(dn => ({ value: dn, label: dn })));
        }
      } catch (error) {
      }
    };
    fetchDesignNumbers();
  }, []);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const handlePageChangeForTable = (newPageZeroBased) => {
    setCurrentPage(newPageZeroBased + 1);
  };

  const handleRowsPerPageChangeForTable = (newRowsPerPage) => {
    setCurrentLimit(newRowsPerPage);
    setCurrentPage(1);
  };

  const isAnyFilterApplied = () => {
    return appliedSize || appliedColor || appliedDesignNumber || appliedStatus || appliedPic || appliedDateRange.startDate || appliedDateRange.endDate || appliedEmployeeCode || appliedSendReceive || appliedNickName;
  };
                             
  const getActiveFilterCount = () => {
    let count = 0;
    if (appliedSize) count++;
    if (appliedColor) count++;
    if (appliedDesignNumber) count++;
    if (appliedStatus) count++;
    if (appliedPic) count++;
    if (appliedDateRange.startDate) count++;
    if (appliedDateRange.endDate) count++;
    if (appliedEmployeeCode) count++;
    if (appliedSendReceive) count++;
    if (appliedNickName) count++;
    return count;
  };

  const handleFilterClick = () => {
    if (!isFilterOpen) {
      setTempSelectedSize(appliedSize);
      setTempSelectedColor(appliedColor);
      setTempSelectedDesignNumber(appliedDesignNumber);
      setTempSelectedStatus(appliedStatus);
      setTempSelectedPic(appliedPic);
      setTempDateRange(appliedDateRange);
      setTempEmployeeCode(appliedEmployeeCode);
      setTempSelectedSendReceive(appliedSendReceive);
      setTempNickName(appliedNickName);
    }
    setIsFilterOpen(!isFilterOpen);
  };
                                      
    const handleApplyFilter = () => {                                                                                   
    let startDateISO = tempDateRange.startDate ? new Date(tempDateRange.startDate + 'T00:00:00.000Z').toISOString() : '';
    let endDateISO = tempDateRange.endDate ? new Date(tempDateRange.endDate + 'T23:59:59.999Z').toISOString() : '';
    setAppliedSize(tempSelectedSize);
    setAppliedColor(tempSelectedColor);
    setAppliedDesignNumber(tempSelectedDesignNumber);
    setAppliedStatus(tempSelectedStatus);
    setAppliedPic(tempSelectedPic);
    setAppliedDateRange({ startDate: startDateISO, endDate: endDateISO });
    setAppliedEmployeeCode(tempEmployeeCode);
    setAppliedSendReceive(tempSelectedSendReceive);
    setAppliedNickName(tempNickName);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };                      
                                    
  const handleCancelFilter = () => {
    setAppliedSize('');
    setAppliedColor('');
    setAppliedDesignNumber(null);
    setAppliedStatus('');
    setAppliedPic('');
    setAppliedDateRange({ startDate: '', endDate: '' });
    setAppliedEmployeeCode('');
    setAppliedNickName('');
    setAppliedSendReceive('');
    setTempSelectedSize('');
    setTempSelectedColor('');
    setTempSelectedDesignNumber(null);
    setTempSelectedStatus('');
    setTempSelectedPic('');
    setTempDateRange({ startDate: '', endDate: '' });
    setTempEmployeeCode('');
    setTempSelectedSendReceive('');
    setTempNickName('');
    setIsFilterOpen(false);
    setCurrentPage(1);
  };


  const handleOpenUpdateItemModal = (item) => {
    setEditingItemData(item);
    setIsUpdateItemModalOpen(true);
  };


  const SortableTableHeader = ({ label, sortKey }) => {
    const isSorted = sortConfig.key === sortKey;
    return (
      <div className="flex items-center space-x-2 cursor-pointer w-max" onClick={() => handleSort(sortKey)}>
        <span>{label}</span>
        <div className="flex flex-col">
          <LucideChevronUp
            size={14}
            className={`${isSorted && sortConfig.direction === 'asc' ? 'text-light-primary' : 'text-light-lightGrey'}`}
          />
          <LucideChevronDown
            size={14}
            className={`${isSorted && sortConfig.direction === 'desc' ? 'text-light-primary' : 'text-light-lightGrey'}`}
          />
        </div>
      </div>
    );
  };

  const columns = useMemo(() => [
    {
      header: <SortableTableHeader label="Date" sortKey="createdAt" />,
      accessor: 'createdAt',
      cell: (row) => row.date ? formatDate(row.date) : "-",
      isDate: true
    },
    {
      header: <SortableTableHeader label="Lot No." sortKey="lotNo" />,
      accessor: 'lotNo',
      cell: (row) => row.lotNo ? (
        <a 
          href={`/product-report?lotNo=${encodeURIComponent(row.lotNo)}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.lotNo}
        </a>
      ) : "-"
    },
    {
      header: <SortableTableHeader label="D. No." sortKey="designNumber" />,
      accessor: 'designNumber',
      cell: (row) => row.designNumber ? (
        <a 
          href={`/product-report?dNo=${encodeURIComponent(row.designNumber)}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.designNumber}
        </a>
      ) : "-"
    },
    {
      header: <SortableTableHeader label="Color" sortKey="color" />,
      accessor: 'color',
        cell: (row) => row.color ? (
        <a 
          href={`/product-report?color=${encodeURIComponent(row.color)}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.color}
        </a>
      ) : "-"
    },
    {
      header: <SortableTableHeader label="Size" sortKey="size" />,
      accessor: 'size',      
        cell: (row) => row.size ? (
        <a 
          href={`/product-report?size=${encodeURIComponent(row.size)}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.size}
        </a>
      ) : "-"
    },
    {
      header: <SortableTableHeader label="Layer" sortKey="layer" />,
      accessor: 'layer',
      cell: (row) => row.layer || "-"
    },
    {
      header: <SortableTableHeader label="Master" sortKey="master" />,
      accessor: 'master',
      cell: (row) => row.master || "-"
    },
    {
      header: <SortableTableHeader label="Pic" sortKey="pic" />,
      accessor: 'pic',
        cell: (row) => row.pic ? (
        <a 
          href={`/product-report?pic=${encodeURIComponent(row.pic)}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.pic}
        </a>
      ) : "-"
    },
    {
      header: <SortableTableHeader label="Process Name" sortKey="processName" />,
      cell: (row) => {
        if (row?.designData?.processes && row?.designData?.processes.length > 0) {
          const filteredProcesses = row?.designData?.processes?.filter(process => {
            const processName = process.processName?.toLowerCase() || '';
            return processName !== 'rc' && processName !== 'loading' && processName !== 'loding';
          });
          
          if (filteredProcesses.length > 0) {
            return (
                <div className="flex flex-wrap gap-1">
                {filteredProcesses?.map((process, index) => (
                  <span key={index} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium ${process.isCurrentlyActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {process.processName} (₹{process.price})
                  </span>
                ))}
              </div>
            );
          }
        }
        return "-";
      }
    },
    {
      header: <SortableTableHeader label="Status" sortKey="status" />,
      cell: (row) => row.status ? <Status status={lowercase(row.status)} /> : "-"
    },
    // {
    //   header: <SortableTableHeader label="Send/Receive" sortKey="sendReceive" />,
    //   accessor: 'sendReceive',
    //   cell: (row) => row.sendReceive || "-"
    // },
    // {
    //   header: <SortableTableHeader label="Rate" sortKey="rate" />,
    //   accessor: 'rate',
    //   cell: (row) => row.rate || "-"
    // },
    {
      header: "Actions",
      id: "actions",
      cell: (row) => {
        const itemOptions = [
          {
            label: "Edit",
            icon: <Edit size={16} />,
            action: () => handleEditItem(row),
            className: "text-gray-700",
          },
          {
            label: "Delete",
            icon: <Trash2 size={16} />,
            action: () => handleDeleteItem(row),
            className: "text-red-600",
          },
          {
            label: "View",
            icon: <Eye  size={16} />,
            action: () => handleOpenViewModal(row),
            className: "text-blue-600",
          },
        ];
        return <ActionCell row={row} options={itemOptions} />;
      },
    },
  ], [sortConfig]);

  const handleEditItem = (item) => {
    handleOpenUpdateItemModal(item);
  };

  const handleOpenAddItemModal = () => {
    setIsAddItemModalOpen(true);
  };

  const handleCloseAddItemModal = () => {
    setIsAddItemModalOpen(false);
  };

  const handleAddItemSubmit = async (newItemData) => {
    setIsAddingItem(true);
    try {
      await addItem(newItemData);
      fetchData();
      handleCloseAddItemModal();
    } catch (error) {
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleDeleteItem = (item) => {
    setItemToDelete(item);
    setIsDeleteConfirmModalOpen(true);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    setIsDeletingItem(true);
    try {
      await deleteItem(itemToDelete._id);
      fetchData();
      toast.success(`Item Lot No. ${itemToDelete.lotNo} deleted successfully.`, { toastId: 'item-updated-status' });
    } catch (error) {
    } finally {
      setIsDeletingItem(false);
      setIsDeleteConfirmModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleCloseDeleteConfirmModal = () => {
    setIsDeleteConfirmModalOpen(false);
    setItemToDelete(null);
  };

  const handleCloseUpdateItemModal = () => {
    setEditingItemData(null);
    setIsUpdateItemModalOpen(false);
  };

  const handleUpdateItemSubmit = async (itemId, updatedData) => {
    setIsUpdatingItem(true);
    try {
      await updateItem(itemId, updatedData);
      fetchData();
      handleCloseUpdateItemModal();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to update product.', { toastId: 'item-update-error' });
    } finally {
      setIsUpdatingItem(false);
    }
  };

  // View modal handlers
  const handleOpenViewModal = async (item) => {
    setSelectedProductData(item);
    setIsViewModalOpen(true);
    // setIsLoadingEmployeeDetails(true);
    console.log(item, "itemitem");
    
    setProductEmployeeDetails(item || []);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedProductData(null);
    setProductEmployeeDetails([]);
  };

  // Excel export function - Commented out old functionality
  /*
  const handleExcelDownload = async () => {
    try {
      setExportLoading(true);
      const formattedData = allItems.items.map((item, index) => ({
        'S.No': index + 1,
        'Date': item.date ? new Date(item.date).toLocaleDateString() : '-',
        'Lot No.': item.lotNo || '-',
        'D. No.': item.designNumber || '-',
        'Color': item.color || '-',
        'Size': item.size || '-',
        'Layer': item.layer || '-',
        'Master': item.master || '-',
        'Pic': item.pic || '-',
        'Process Name': item.progressWithNames && item.progressWithNames.length > 0 
          ? item.progressWithNames.map(process => process.processName).join(', ') 
          : '-',
        'Status': item.status || '-',
        'Send/Receive': item.sendReceive || '-',
        'Rate': item.rate || '-',
        'Created Date': item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-',
        'Updated Date': item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '-'
      }));

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Products_Report_${timestamp}.xlsx`;
      
      // Import and use the exportToExcel function
      const { exportToExcel } = await import('../helpers/excelExport');
      exportToExcel(formattedData, filename, 'Products Report');
      
      toast.success('Excel file downloaded successfully!', { toastId: 'excel-download-success' });
    } catch (error) {
      toast.error('Failed to download Excel file. Please try again.', { toastId: 'excel-download-error' });
      console.error('Error downloading Excel:', error);
    } finally {
      setExportLoading(false);
    }
  };
  */

  // New Excel download function that calls API with isExcel=true
  const handleExcelDownload = async () => {
    try {
      setExportLoading(true);
      
      // Call API with isExcel=true parameter and all current filters
      const params = {
        isExcel: true,
        search: debouncedSearchQuery,
        ...(sortConfig.key && { sortKey: sortConfig.key, sortDirection: sortConfig.direction }),
        ...(appliedSize && { size: appliedSize }),
        ...(appliedColor && { color: appliedColor }),
        ...(appliedDesignNumber && appliedDesignNumber && { designNumber: appliedDesignNumber }),
        ...(appliedStatus && { status: appliedStatus }),
        ...(appliedPic && { pic: appliedPic }),
        ...(appliedDateRange.startDate && { startDate: appliedDateRange.startDate }),
        ...(appliedDateRange.endDate && { endDate: appliedDateRange.endDate }),
        ...(appliedEmployeeCode && { employeeCode: appliedEmployeeCode }),
        ...(appliedSendReceive && { sendReceive: appliedSendReceive }),
        ...(appliedNickName && { nickName: appliedNickName })
      };
      
      // Make a direct fetch call to handle binary response
      const queryString = new URLSearchParams(params).toString();
      const BASE_URL = process.env.REACT_APP_BASE_URL;
      const url = `${BASE_URL}/api/items?${queryString}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders()['Authorization'] ? { Authorization: getAuthHeaders().Authorization } : {},
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Set filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Products_Report_${timestamp}.xlsx`;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('Excel file downloaded successfully!', { toastId: 'excel-download-success' });
      
    } catch (error) {
      toast.error('Failed to download Excel file. Please try again.', { toastId: 'excel-download-error' });
      console.error('Error downloading Excel:', error);
    } finally {
      setExportLoading(false);
    }
  };


  return (
    <>
    {(loading || isAddingItem || isUpdatingItem || isDeletingItem || isSizesLoading || isColorsLoading || isProcessesLoading || exportLoading || isLoadingEmployeeDetails) && <LoaderComponent size={56}/>}
    <div className="space-y-6">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <div className="flex items-center justify-between !mt-0 max-sm:flex-col max-sm:gap-2">
        <h1 className="text-2xl font-bold text-light-darkGrey font-roboto cursor-default max-sm:w-full max-sm:text-left">
          Products
        </h1>

        <div className="relative flex items-center gap-2 max-sm:w-full max-[475px]:!flex-col max-[380px]:gap-2" ref={filterRef}>

          <Button
            variant="outline"
            size="medium"
            icon={<LucideDownload size={20} />}
            label={exportLoading ? "Downloading..." : "Excel Download"}
            onClick={handleExcelDownload}
            disabled={exportLoading}
            className="flex items-center space-x-2 shadow-none font-normal !rounded-md bg-light-primary px-4 py-2 text-light-white hover:bg-light-primary_hover transition-colors duration-200 focus:!ring-0 max-sm:w-full max-sm:justify-center"
          />
          <div className='relative max-sm:w-full max-sm:justify-center '>
            <Button
              variant="outline"
              size="medium"
              icon={<LucideFilter size={20} />}
              label={isAnyFilterApplied() ? `Filter (${getActiveFilterCount()})` : "Filter"}
              onClick={handleFilterClick}
              className={`flex items-center space-x-2 shadow-none font-normal !rounded-md bg-light-primary px-4 py-2 text-light-white hover:bg-light-primary_hover transition-colors duration-200 focus:!ring-0 max-sm:w-full max-sm:justify-center ${isAnyFilterApplied() ? 'bg-light-primary_hover' : ''}`}
            />
                         {isFilterOpen && (
               <div className="absolute right-0 mt-2 w-80 rounded-lg max-sm:w-auto bg-light-white shadow-lg border border-light-natural_200 z-50 max-h-[35rem] flex flex-col">
                 <div className="p-4 overflow-y-auto flex-1">
                   <div className="space-y-4">
                  <div>
                    <SelectElement
                      name="Filter by Design Number"
                      options={designOptions}
                      value={tempSelectedDesignNumber}
                      onChange={(val) => setTempSelectedDesignNumber(val)}
                      placeholder="Select design number"
                      isClearable={false}
                      isMulti={false}
                      className="w-full"
                      menuPortalTarget={document.body}
                    />
                  </div>
                  
                  <div>
                    <SelectElement
                      key="status-filter"
                      name="Filter by Status"
                      options={STATUS_OPTIONS}
                      value={tempSelectedStatus || null}
                      onChange={(val) => setTempSelectedStatus(val || '')}
                      placeholder="Select status"
                      isClearable={false}
                      isMulti={false}
                      className="w-full"
                      menuPortalTarget={document.body}
                    />
                  </div>

                  {(tempSelectedStatus === 'Doracut' || tempSelectedStatus?.toLowerCase() === 'doracut') && (
                    <div>
                      <SelectElement
                        name="Filter by Send/Receive"
                        options={sendReceiveOptions}
                        value={tempSelectedSendReceive}
                        onChange={(val) => setTempSelectedSendReceive(val)}
                        placeholder="Select Send/Receive"
                        isClearable={false}
                        isMulti={false}
                        className="w-full"
                        menuPortalTarget={document.body}
                      />
                    </div>
                  )}

                  <div>
                    <SelectElement
                      name="Filter by Color"
                      options={colors.map((color) => ({
                        value: color,
                        label: color,
                      }))}
                      value={tempSelectedColor}
                      onChange={(val) => setTempSelectedColor(val)}
                      placeholder={isColorsLoading ? "Loading colors..." : "Select color"}
                      isClearable={false}
                      isMulti={false}
                      className="w-full"
                      menuPortalTarget={document.body}
                    />
                  </div>
                  
                  <div>
                    <SelectElement
                      name="Filter by Size"
                      options={sizes.map((size) => ({
                        value: size,
                        label: size,
                      }))}
                      value={tempSelectedSize}
                      onChange={(val) => setTempSelectedSize(val)}
                      placeholder={isSizesLoading ? "Loading sizes..." : "Select size"}
                      isClearable={false}
                      isMulti={false}
                      className="w-full"
                      menuPortalTarget={document.body}
                    />
                  </div>

                  <div>
                    <SelectElement
                      name="Filter by Pic"
                      options={picOptions}
                      value={tempSelectedPic}
                      onChange={(val) => setTempSelectedPic(val)}
                      placeholder="Select Pic"
                      isClearable={false}
                      isMulti={true}
                      className="w-full"
                      menuPortalTarget={document.body}
                    />
                  </div>

                  <div>
                    <InputElement
                      type="text"
                      name="Emp Code"
                      placeholder="Filter by Emp Code"
                      value={tempEmployeeCode}
                      onChange={(value) => setTempEmployeeCode(value)}
                      variant="size_44"
                      className="w-full"
                      is_required={false}
                    />
                  </div>
                       <div>
                       <InputElement
                         type="text"
                         name="Nick Name"
                         placeholder="Filter by Nick Name"
                         value={tempNickName}
                         onChange={(value) => setTempNickName(value)}
                         variant="size_44"
                         className="w-full"
                         is_required={false}
                       />
                     </div>

                  <div>
                    <label className="block text-sm font-medium text-light-darkGrey mb-2">
                      Date Range
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <InputElement
                        type="date"
                        placeholder="Start Date"
                        value={tempDateRange.startDate}
                        onChange={(value) => setTempDateRange(prev => ({ ...prev, startDate: value }))}
                        variant="size_44"
                        className="w-full"
                        is_required={false}
                      />
                      <InputElement
                        type="date"
                        placeholder="End Date"
                        value={tempDateRange.endDate}
                        onChange={(value) => setTempDateRange(prev => ({ ...prev, endDate: value }))}
                        variant="size_44"
                        className="w-full"
                        is_required={false}
                      />
                    </div>
                  </div>

                                     </div>
                 </div>
                 
                 <div className="p-4 border-t border-light-natural_200 bg-light-white sticky bottom-0">
                   <div className="flex gap-3">
                     <Button
                       variant="outline"
                       size="medium"
                       label="Clear"
                       onClick={handleCancelFilter}
                       className="flex-1 text-light-natural_700 hover:bg-light-natural_50"
                     />
                     <Button
                       variant="primary"
                       size="medium"
                       label="Apply"
                       onClick={handleApplyFilter}
                       className="flex-1 shadow-none font-normal !rounded-md px-4 py-2 text-light-white transition-colors duration-200 focus:ring-0"
                     />
                   </div>
                 </div>
               </div>
             )}
          </div>

        </div>
      </div>

      <div className="flex items-center justify-between gap-4 w-[40rem] max-lg:w-full">
        <div className="flex-grow w-full">
          <InputElement
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(value) => {
              setSearchQuery(value);
              setCurrentPage(1);
            }}
            variant="size_44"
            className="w-full"
            is_required={false}
            extra_text_before={
              loading && debouncedSearchQuery !== searchQuery ? (
                <LucideLoader size={20} className="text-light-primary animate-spin" />
              ) : (
                <LucideSearch size={20} className="text-light-lightGrey" />
              )
            }
          />
        </div>
      </div>

      <div className="w-full">
        <CommonTable
          columns={columns}
          data={allItems?.items || []}
          count={allItems?.pagination?.total || 0}
          page={(allItems?.pagination?.page || 1) - 1}
          rowsPerPage={allItems?.pagination?.limit || currentLimit}
          onPageChange={handlePageChangeForTable}
          onRowsPerPageChange={handleRowsPerPageChangeForTable}
          rowsPerPageOptions={[25, 50, 75, 100, 150]}
          emptyDataMessage={
            searchQuery
              ? "No items found matching your search."
              : "No items available."
          }
          tableClassName="min-w-full divide-y divide-gray-200"
        />
      </div>

      {isAddItemModalOpen && (
        <Modal
          isOpen={isAddItemModalOpen}
          onClose={handleCloseAddItemModal}
          title="Add New Product"
          size="3xl"
        >
          <AddProductForm
            onSubmit={handleAddItemSubmit}
            onCancel={handleCloseAddItemModal}
            isLoading={isAddingItem}
          />
        </Modal>
      )}

      {isUpdateItemModalOpen && editingItemData && (
        <Modal
          isOpen={isUpdateItemModalOpen}
          onClose={handleCloseUpdateItemModal}
          title={`Update Product`}
          size="3xl"
        >
          <UpdateProductForm
            itemData={editingItemData}
            onSubmit={handleUpdateItemSubmit}
            onCancel={handleCloseUpdateItemModal}
            isLoading={isUpdatingItem}
          />
        </Modal>
      )}

      {isDeleteConfirmModalOpen && itemToDelete && (
        <Modal
          isOpen={isDeleteConfirmModalOpen}
          onClose={handleCloseDeleteConfirmModal}
          title=""
          size="sm"
        >
          <div className="p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-2">
              <AlertTriangle size={28} className="text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Confirm Delete
            </h3>
            <p className="text-sm text-gray-600 mb-6 w-full">
              Are you sure you want to delete item <br /><strong>{itemToDelete.lotNo}</strong>?.
            </p>
            <div className="flex justify-center space-x-3 w-full">
              <Button
                variant="outline"
                size="medium"
                label="Cancel"
                onClick={handleCloseDeleteConfirmModal}
                disabled={isDeletingItem}
                className="flex-1 focus:!ring-0 border-gray-300 hover:bg-gray-50"
              />
              <Button
                variant="primary"
                size="medium"
                label={isDeletingItem ? "Deleting..." : "Yes, Delete"}
                onClick={confirmDeleteItem}
                isLoading={isDeletingItem}
                disabled={isDeletingItem}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white focus:!ring-0"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* View Product Employee Details Modal */}
      {isViewModalOpen && selectedProductData && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={handleCloseViewModal}
          title={`Product Details - ${selectedProductData.lotNo}`}
          size="xl"
        >
          <div className="p-6">
            {/* Product Information */}
            <div className="mb-6 text-left">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text">Product Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Lot No.</label>
                  <p className="text-sm text-gray-900">{selectedProductData.lotNo || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Design No.</label>
                  <p className="text-sm text-gray-900">{selectedProductData.designNumber || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Color</label>
                  <p className="text-sm text-gray-900">{selectedProductData.color || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Size</label>
                  <p className="text-sm text-gray-900">{selectedProductData.size || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Pic</label>
                  <p className="text-sm text-gray-900">{selectedProductData.pic || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Rate</label>
                  <p className="text-sm text-gray-900">{selectedProductData.rate || '-'}</p>
                </div>
              </div>
            </div>

            {/* Employee Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Employee Work Details</h3>
              {isLoadingEmployeeDetails ? (
                <div className="flex justify-center items-center py-8">
                  <LoaderComponent size={40} />
                </div>
              ) : productEmployeeDetails.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Emp Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Process
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Alter
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reject
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pick
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {productEmployeeDetails.map((detail, index) => (
                        <tr
                          key={index}
                          className={
                            index % 2 === 0
                              ? 'bg-white hover:bg-gray-50'
                              : 'bg-light-primary/15 hover:bg-light-primary/25'
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {detail.employeeName || `${detail.firstName} ${detail.lastName}` || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {detail.processName || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {detail.alter || '0'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {detail.reject || '0'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {detail.pick || detail.pic || '0'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {detail.createdAt ? formatDate(detail.createdAt) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No employee details found for this product.</p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

    </div>
    </>
  );
};

export default Products;