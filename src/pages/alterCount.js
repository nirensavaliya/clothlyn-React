import React, { useState, useEffect, useMemo } from 'react';
import { LucideSearch, LucideLoader, LucideClipboardList, LucideUser, LucideCalendar, LucideMapPin, LucideClock, LucideScissors, LucideEdit, LucideUserCheck } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import InputElement from '../component/common/InputElement';
import SelectElement from '../component/common/Select';
import CommonTable from '../component/common/Table/Table';
import LoaderComponent from '../component/common/Loader';
import Modal from '../component/common/Modal';
import Button from '../component/common/Button';
import { getAlterCount } from '../apis/dashboardApi';
import { getCompanies } from '../apis/companiesApi';
import { getLotData, updateCompanyAlter } from '../apis/processApi';
// import { updateLotData } from '../apis/processApi';
import usePageTitle from '../hooks/usePageTitle';

const AlterCount = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [allAlterData, setAllAlterData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLimit, setCurrentLimit] = useState(25);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 0,
    limit: 25,
    hasPagination: true,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLotData, setSelectedLotData] = useState(null);
  const [loadingLotData, setLoadingLotData] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentLotNo, setCurrentLotNo] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  usePageTitle('Alter Count');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchAlterCount();
  }, [currentPage, currentLimit, debouncedSearch]);

  useEffect(() => {
    if (!isModalOpen) {
      setSelectedCompany(null);
      return;
    }

    const fetchCompanies = async () => {
      try {
        setIsLoadingCompanies(true);
        const response = await getCompanies({ limit: 1000, isActive: true });
        const companiesList = response?.data || response?.items || [];
        setCompanies(companiesList);
        // Default: first company in the list
        const firstId = companiesList[0]?._id || companiesList[0]?.id || null;
        setSelectedCompany(firstId || null);
      } catch (error) {
        console.error('Error fetching companies:', error);
        setCompanies([]);
        setSelectedCompany(null);
      } finally {
        setIsLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, [isModalOpen]);

  const fetchAlterCount = async () => {
    try {
      setLoading(true);
      const response = await getAlterCount({
        page: currentPage,
        limit: currentLimit,
        search: debouncedSearch || undefined,
      });
      if (response?.status === 'success') {
        const rows = Array.isArray(response.data) ? response.data : [];
        const pag = response.pagination || {
          total: response.total || rows.length,
          page: currentPage,
          pages: 1,
          limit: currentLimit,
          hasPagination: true,
        };
        setAllAlterData(rows.slice(0, pag.limit || currentLimit));
        setPagination(pag);
      } else {
        toast.error('Failed to fetch alter count data', { toastId: 'alter-count-error' });
        setAllAlterData([]);
        setPagination((p) => ({ ...p, total: 0, pages: 0 }));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to fetch alter count data', { 
        toastId: 'alter-count-error' 
      });
      setAllAlterData([]);
      setPagination((p) => ({ ...p, total: 0, pages: 0 }));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e?.target?.value || e || '';
    setSearchQuery(value);
  };

  const handleRowClick = async (row) => {
    if (!row?.lotNo) return;
    
    try {
      setLoadingLotData(true);
      setIsModalOpen(true);
      setCurrentLotNo(row.lotNo);
      const response = await getLotData(row.lotNo);
      // Handle response structure - it might be response.data or response.data.data[0]
      const lotData = response?.data?.[0] || response?.data || response;
      setSelectedLotData(lotData);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to fetch lot details', { 
        toastId: 'lot-details-error' 
      });
      setIsModalOpen(false);
      setSelectedLotData(null);
      setCurrentLotNo(null);
    } finally {
      setLoadingLotData(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLotData(null);
    setCurrentLotNo(null);
    setSelectedCompany(null);
  };

  const handleAlterDone = async () => {
    if (!currentLotNo || !selectedLotData) {
      toast.error('No lot number available for update', { toastId: 'update-error' });
      return;
    }

    if (!selectedCompany) {
      toast.error('Please select a company', { toastId: 'company-required-error' });
      return;
    }

    const alterValue = selectedLotData.alter;
    if (alterValue === null || alterValue === undefined || String(alterValue).trim() === '') {
      toast.error('Alter value not available for this lot', { toastId: 'alter-missing-error' });
      return;
    }

    try {
      setIsUpdating(true);

      await updateCompanyAlter(currentLotNo, selectedCompany, alterValue);

      setAllAlterData((prev) => prev.filter((item) => item.lotNo !== currentLotNo));
      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, (prev.total || 0) - 1),
      }));
      handleCloseModal();
      await fetchAlterCount();
    } catch (error) {
      console.error('Error updating alter:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatProcessLabel = (name) => {
    if (!name) return '-';
    const raw = String(name).trim();
    const n = raw.toLowerCase();
    const map = {
      rc: 'RC',
      billscan: 'Bill Scan',
      doracut: 'DoraCut',
      packing: 'Packing',
      checking: 'Checking',
      press: 'Press',
      loading: 'Loading',
    };
    if (map[n]) return map[n];
    return raw;
  };

  const columns = useMemo(() => [
    {
      header: 'Lot Number',
      accessor: 'lotNo',
      cell: (row) => row.lotNo || '-',
    },
    {
      header: 'Alter Count',
      accessor: 'alterCount',
      cell: (row) => (
        <span className="font-semibold">{row.alterCount || 0}</span>
      ),
    },
    {
      header: 'Current Status',
      accessor: 'status',
      cell: (row) => formatProcessLabel(row.status),
    },
    {
      header: 'Alter From',
      accessor: 'alterFromProcess',
      cell: (row) => formatProcessLabel(row.alterFromProcess),
    },
  ], []);

  const handlePageChangeForTable = (newPageZeroBased) => {
    setCurrentPage(newPageZeroBased + 1);
  };

  const handleRowsPerPageChangeForTable = (newLimit) => {
    setCurrentLimit(newLimit);
    setCurrentPage(1);
  };

  return (
    <>
      {(loading || isUpdating) && <LoaderComponent size={56} />}
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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-light-darkGrey">
              Alter Pic Counting: - {pagination.total || 0}
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex-grow max-w-md">
                <InputElement
                  type="text"
                  placeholder="Search Alter"
                  value={searchQuery}
                  onChange={handleSearch}
                  variant="size_44"
                  className="w-full"
                  is_required={false}
                  extra_text_before={
                    loading ? (
                      <LucideLoader size={20} className="text-light-primary animate-spin" />
                    ) : (
                      <LucideSearch size={20} className="text-light-lightGrey" />
                    )
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 w-full">
          <CommonTable
            columns={columns}
            data={allAlterData}
            count={pagination.total || 0}
            page={(pagination.page || currentPage) - 1}
            rowsPerPage={pagination.limit || currentLimit}
            onPageChange={handlePageChangeForTable}
            onRowsPerPageChange={handleRowsPerPageChangeForTable}
            rowsPerPageOptions={[25, 50, 75, 100]}
            emptyDataMessage="No alter count data available."
            tableClassName="w-full divide-y divide-gray-200"
            onRowClick={handleRowClick}
          />
        </div>
      </div>

      {/* Alter Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Alter Details"
        size="lg"
        footerContent={
          !loadingLotData && selectedLotData ? (
            <div className="flex w-full flex-col gap-4">
              <SelectElement
                name="Company"
                options={companies.map((company) => ({
                  value: company._id,
                  label: company.name,
                }))}
                value={selectedCompany}
                onChange={(val) => setSelectedCompany(val)}
                placeholder="Select Company"
                isClearable={false}
                is_required
                className="w-full"
                isMulti={false}
                menuPortalTarget={document.body}
                isLoading={isLoadingCompanies}
              />
              <div className="flex justify-end gap-2">
                <Button
                  label="Cancel"
                  variant="outline"
                  onClick={handleCloseModal}
                />
                <Button
                  label="Alter Done"
                  variant="primary"
                  onClick={handleAlterDone}
                  loading={isUpdating}
                  disabled={
                    isUpdating ||
                    !selectedCompany ||
                    selectedLotData?.alter === null ||
                    selectedLotData?.alter === undefined ||
                    String(selectedLotData?.alter ?? '').trim() === ''
                  }
                />
              </div>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <Button
                label="Cancel"
                variant="outline"
                onClick={handleCloseModal}
              />
            </div>
          )
        }
      >
        {loadingLotData ? (
          <div className="flex items-center justify-center py-12">
            <LucideLoader size={32} className="text-light-primary animate-spin" />
          </div>
        ) : selectedLotData ? (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between p-4 bg-light-lightGreyBackground rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-light-primary rounded-full flex items-center justify-center">
                  <LucideClipboardList size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-light-darkGrey">{selectedLotData?.lotNo}</h2>
                </div>
              </div>
            </div>

            {/* Lot Information Section */}
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
                      <p className="text-base font-medium text-light-darkGrey text-left">{selectedLotData?.lotNo || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-light-lightGreyBackground rounded-full flex items-center justify-center">
                      <LucideUser size={16} className="text-light-primary" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                        PIC
                      </label>
                      <p className="text-base font-medium text-light-darkGrey">{selectedLotData?.pic || '-'}</p>
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
                      <p className="text-base font-medium text-light-darkGrey">{selectedLotData?.dNo || '-'}</p>
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
                      <p className="text-base font-medium text-light-darkGrey">{selectedLotData?.rcPic ?? '-'}</p>
                    </div>
                    <div className="ml-6">
                      <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                        Alter
                      </label>
                      <p className="text-base font-medium text-light-darkGrey">{selectedLotData?.alter ?? '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-light-lightGreyBackground rounded-full flex items-center justify-center">
                      <LucideMapPin size={16} className="text-light-primary" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                        Size
                      </label>
                      <p className="text-base font-medium text-light-darkGrey">{selectedLotData?.size || '-'}</p>
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
                      <p className="text-base font-medium text-light-darkGrey">₹{selectedLotData?.price || '-'}</p>
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
                      <p className="text-base font-medium text-light-darkGrey">{selectedLotData?.color || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Machine Details Section - Hidden */}
            {(selectedLotData?.single || selectedLotData?.fatlock || selectedLotData?.kansai) && (
              <div className="bg-white border border-light-border rounded-lg p-6 hidden">
                <div className="flex items-center gap-2 mb-4">
                  <LucideUserCheck size={20} className="text-light-primary" />
                  <h3 className="text-lg font-semibold text-light-darkGrey">Machine Details</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Single Machine */}
                  {selectedLotData?.single && (
                    <div className="space-y-4 p-4 bg-light-lightGreyBackground rounded-lg">
                      <h4 className="font-semibold text-light-darkGrey text-center">Single Machine</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                            Emp Name
                          </label>
                          <p className="text-sm font-medium text-light-darkGrey">{selectedLotData?.single?.employeeName || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                            Name
                          </label>
                          <p className="text-sm font-medium text-light-darkGrey">
                            {selectedLotData?.single?.firstName || ''} {selectedLotData?.single?.lastName || ''}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                            Contact
                          </label>
                          <p className="text-sm font-medium text-light-darkGrey">{selectedLotData?.single?.mobileNumber || '-'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fatlock Machine */}
                  {selectedLotData?.fatlock && (
                    <div className="space-y-4 p-4 bg-light-lightGreyBackground rounded-lg">
                      <h4 className="font-semibold text-light-darkGrey text-center">Fatlock Machine</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                            Emp Name
                          </label>
                          <p className="text-sm font-medium text-light-darkGrey">{selectedLotData?.fatlock?.employeeName || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                            Name
                          </label>
                          <p className="text-sm font-medium text-light-darkGrey">
                            {selectedLotData?.fatlock?.firstName || ''} {selectedLotData?.fatlock?.lastName || ''}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                            Contact
                          </label>
                          <p className="text-sm font-medium text-light-darkGrey">{selectedLotData?.fatlock?.mobileNumber || '-'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Kansai Machine */}
                  {selectedLotData?.kansai && (
                    <div className="space-y-4 p-4 bg-light-lightGreyBackground rounded-lg">
                      <h4 className="font-semibold text-light-darkGrey text-center">Kansai Machine</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                            Emp Name
                          </label>
                          <p className="text-sm font-medium text-light-darkGrey">{selectedLotData?.kansai?.employeeName || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                            Name
                          </label>
                          <p className="text-sm font-medium text-light-darkGrey">
                            {selectedLotData?.kansai?.firstName || ''} {selectedLotData?.kansai?.lastName || ''}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-light-lightGrey uppercase tracking-wide">
                            Contact
                          </label>
                          <p className="text-sm font-medium text-light-darkGrey">{selectedLotData?.kansai?.mobileNumber || '-'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-light-lightGrey">No lot data available</p>
          </div>
        )}
      </Modal>
    </>
  );
};

export default AlterCount;
