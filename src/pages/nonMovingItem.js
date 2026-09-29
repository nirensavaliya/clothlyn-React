import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { LucideSearch, LucideChevronDown, LucideChevronUp, LucideFilter, LucidePlus, LucideEdit, AlertTriangle, ExternalLink, LucideDownload, Edit, Trash2, LucideLoader, Eye } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { formatDate, lowercase } from '../helpers/utils';
import InputElement from '../component/common/InputElement';
import CommonTable from '../component/common/Table/Table';
import Button from '../component/common/Button';
import Modal from '../component/common/Modal';
import Status from '../component/common/Status';
import SelectElement from '../component/common/Select';
import ActionCell from '../component/common/Table/ActionCell';
import LoaderComponent from '../component/common/Loader';
import { getNonMovingItems, exportNonMovingItemsToExcel, exportNonMovingItemsToPDF } from '../apis/nonMovingItemApi';
import { exportToExcelAdvanced, generateNonMovingItemsPDF } from '../helpers/excelExport';
import usePageTitle from '../hooks/usePageTitle';

const NonMovingItem = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [currentLimit, setCurrentLimit] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [filterRef] = useState(useRef(null));
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [seectedNoneMovingData, setSelectedNoneMovingData] = useState(null);

  const [nonMovingItems, setNonMovingItems] = useState({ items: [], pagination: { total: 0, page: 1, limit: 25 } })

  usePageTitle('Non Moving Item');
  // Fetch data from API
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage + 1,
        limit: currentLimit,
        lotNo: debouncedSearchQuery,
        sortKey: sortConfig.key,
        sortDirection: sortConfig.direction
      };
      
      const response = await getNonMovingItems(params);
      setNonMovingItems({
        items: Array.isArray(response?.data) ? response.data : [],
        pagination: response?.pagination || {
          total: response?.total || 0,
          page: response?.page || 1,
          limit: response?.limit || currentLimit,
        },
      });
    } catch (error) {
      console.error('Error fetching non-moving items:', error);
      // Fallback to empty state
      setNonMovingItems({
        items: [],
        pagination: {
          total: 0,
          page: 1,
          limit: currentLimit
        }
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentLimit, debouncedSearchQuery, sortConfig]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(0); // Reset to first page when search changes
  }, [debouncedSearchQuery]);

  const handleSearch = (value) => {
    setSearchQuery(value);
    setCurrentPage(0);
  };

  const handlePageChangeForTable = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleRowsPerPageChangeForTable = (newLimit) => {
    setCurrentLimit(newLimit);
    setCurrentPage(0);
  };

  const handleExcelDownload = async () => {
    setExportLoading(true);
    try {
      const params = {
        isExcel: true,
        lotNo: debouncedSearchQuery,
        sortKey: sortConfig.key,
        sortDirection: sortConfig.direction
      };
      
      const response = await  exportNonMovingItemsToExcel(params);
      exportToExcelAdvanced(response, 'non-moving-items');
      toast.success('Excel file downloaded successfully!', { toastId: 'excel-download-success' });
    } catch (error) {
      console.error('Error downloading Excel:', error);
      // Fallback to CSV download if API fails
    } finally {
      setExportLoading(false);
    }
  };

  const handlePDFDownload = async () => {
    setPdfLoading(true);
    try {
      const params = {
        lotNo: debouncedSearchQuery,
        sortKey: sortConfig.key,
        sortDirection: sortConfig.direction
      };
      
      const response = await exportNonMovingItemsToPDF(params);
      
      if (response ) {
        await generateNonMovingItemsPDF(response, 'non-moving-items');
        toast.success('PDF file downloaded successfully!', { toastId: 'pdf-download-success' });
      } else {
        toast.error('No data found for PDF export.', { toastId: 'pdf-download-error' });
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF file.', { toastId: 'pdf-download-error' });
    } finally {
      setPdfLoading(false);
    }
  };

  const handleCSVDownload = () => {
    try {
      // Create CSV content as fallback
      const csvContent = [
        ['Lot No', 'Design Number', 'Color', 'Size', 'Layer', 'Master', 'Date', 'Pic', 'Quantity', 'Days Since Status Change'],
        ...((nonMovingItems.items || nonMovingItems) || []).map(item => [
          item.lotNo,
          item.designNumber,
          item.color,
          item.size,
          item.layer,
          item.master,
          item.date,
          item.pic,
          item.quantity,
          item.daysSinceLastChange
        ])
      ].map(row => row.join(',')).join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `non-moving-items-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('CSV file downloaded successfully!', { toastId: 'csv-download-success' });
    } catch (error) {
      toast.error('Failed to download file.', { toastId: 'download-error' });
    }
  };

  const columns = useMemo(() => [
    {
      header: "Lot No.",
      accessor: 'lotNo',
      cell: (row) =>  row.lotNo || "-"
    },
    {
      header: "Design Number",
      accessor: 'designNumber',
      cell: (row) => row.designNumber || "-"
    },
    {
      header: "Color",
      accessor: 'color',
      cell: (row) => row.color || "-"
    },
    {
      header: "Size",
      accessor: 'size',
      cell: (row) => row.size || "-"
    },
    {
      header: "Layer",
      accessor: 'layer',
      cell: (row) => row.layer || "-"
    },
    {
      header: "Master",
      accessor: 'master',
      cell: (row) => row.master || "-"
    },
    {
      header: "Date",
      accessor: 'date',
      cell: (row) => row.date ? formatDate(row.date) : "-"
    },
    {
      header: "Pic",
      accessor: 'pic',
      cell: (row) => row.pic || "-"
    },
    {
      header: "Quantity",
      accessor: 'quantity',
      cell: (row) => row.quantity || "-"
    },
    {
      header: "Days Since Status Change",
      accessor: 'daysSinceLastChange',
      cell: (row) => row.daysSinceLastChange || "-"
    },
    {
      header: "Actions",
      id: "actions",
      cell: (row) => {
        const itemOptions = [
          {
            label: "View",
            icon: <Eye size={16} />,
            action: () => handleViewItem(row),
            className: "text-gray-700 hover:text-green-600",
          },
        ];
        return <ActionCell row={row} options={itemOptions} />;
      },
    },
  ], []);

  const handleViewItem = (item) => {
    setSelectedNoneMovingData(item);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedNoneMovingData(null);
  };



  console.log(seectedNoneMovingData, "seectedNoneMovingDataseectedNoneMovingData");
  

  return (
    <>
      {(loading || exportLoading || pdfLoading) && <LoaderComponent size={56}/>}
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
            Non Moving Item
          </h1>

          <div className="relative flex items-center gap-2 max-sm:w-full max-[475px]:!flex-col max-[380px]:gap-2" ref={filterRef}>
            <Button
              variant="outline"
              size="medium"
              icon={<LucideDownload size={20} />}
              label={exportLoading ? "Downloading..." : "Download Excel"}
              onClick={handleExcelDownload}
              disabled={exportLoading}
              className="flex items-center space-x-2 shadow-none font-normal !rounded-md bg-light-primary px-4 py-2 text-light-white hover:bg-light-primary_hover transition-colors duration-200 focus:!ring-0 max-sm:w-full max-sm:justify-center"
            />
            <Button
              variant="outline"
              size="medium"
              icon={<LucideDownload size={20} />}
              label={pdfLoading ? "Downloading..." : "Download PDF"}
              onClick={handlePDFDownload}
              disabled={pdfLoading}
              className="flex items-center space-x-2 shadow-none font-normal !rounded-md bg-light-primary px-4 py-2 text-light-white hover:bg-light-primary_hover transition-colors duration-200 focus:!ring-0 max-sm:w-full max-sm:justify-center"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 w-[40rem] max-lg:w-full">
          <div className="flex-grow w-full">
            <InputElement
              type="text"
              placeholder="Search by Lot No, Design Number, Color, Size..."
              value={searchQuery}
              onChange={(value) => {
                handleSearch(value);
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
            data={nonMovingItems.items || []}
            count={nonMovingItems?.pagination?.total || 0}
            page={(nonMovingItems?.pagination?.page || 1) - 1}
            rowsPerPage={nonMovingItems?.pagination?.limit || currentLimit}
            onPageChange={handlePageChangeForTable}
            onRowsPerPageChange={handleRowsPerPageChangeForTable}
            rowsPerPageOptions={[25, 50, 75, 100, 150]}
            emptyDataMessage={
              searchQuery
                ? "No items found matching your search."
                : "No non-moving items available."
            }
            tableClassName="min-w-full divide-y divide-gray-200"
          />
        </div>
      </div>

      {isViewModalOpen && seectedNoneMovingData && (
          <Modal
            isOpen={isViewModalOpen}
            onClose={handleCloseViewModal}
            title={`Non Moving Items Details`}
            size="md"
          >
            <div className="p-6">
              <div className="space-y-6">
                {/* Basic Details Section */}
                <div>
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Date</label>
                      <p className="text-sm text-gray-900">{seectedNoneMovingData?.date ? formatDate(seectedNoneMovingData?.date) :  '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">D No</label>
                      <p className="text-sm text-gray-900">{seectedNoneMovingData.designNumber || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">LotNo</label>
                      <p className="text-sm text-gray-900">{seectedNoneMovingData.lotNo || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Pic</label>
                      <p className="text-sm text-gray-900">{seectedNoneMovingData.pic || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Master</label>
                      <p className="text-sm text-gray-900">{seectedNoneMovingData.master || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Quantity</label>
                      <p className="text-sm text-gray-900">{seectedNoneMovingData.quantity ||'-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Color</label>
                      <p className="text-sm text-gray-900">{seectedNoneMovingData.color || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Size</label>
                      <p className="text-sm text-gray-900">{seectedNoneMovingData.size || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Layer</label>
                      <p className="text-sm text-gray-900">{seectedNoneMovingData.layer || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Status</label>
                      <p className="text-sm text-gray-900">{seectedNoneMovingData.status || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Days Since Last Change</label>
                      <p className="text-sm text-gray-900">{seectedNoneMovingData.daysSinceLastChange || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Employee Details Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 text-left">Employee Details</h3>
                  {seectedNoneMovingData?.employees && seectedNoneMovingData.employees.length > 0 ? (
                    <div className="space-y-3">
                      {seectedNoneMovingData.employees.map((employee, index) => (
                        <div key={employee._id || index} className="">
                          <div className="grid grid-cols-2 gap-3 text-left">
                            <div>
                              <label className="block text-sm font-medium text-gray-600">Name</label>
                              <p className="text-sm text-gray-900">{employee.name || '-'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-600">Role</label>
                              <p className="text-sm text-gray-900 capitalize">{employee.role || '-'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-600">Phone Number</label>
                              <p className="text-sm text-gray-900">{employee.phoneNumber || '-'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-600">Status</label>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                employee.status === 'active' 
                                  ? 'bg-light-success_50 text-light-success_500' 
                                  : 'bg-light-error_50 text-light-error_500'
                              }`}>
                                {employee.status || '-'}
                              </span>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-600">Type</label>
                              <p className="text-sm text-gray-900 capitalize">{employee.type || '-'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">No employees assigned to this item</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Modal>
        )}
    </>
  );
};

export default NonMovingItem;
