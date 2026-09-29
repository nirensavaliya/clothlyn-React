import React, { useState, useEffect, useMemo } from 'react';
import { LucideSearch, LucideFilter, LucideLoader } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import InputElement from '../component/common/InputElement';
import Button from '../component/common/Button';
import CommonTable from '../component/common/Table/Table';
import LoaderComponent from '../component/common/Loader';
import { getRejectList } from '../apis/dashboardApi';
import usePageTitle from '../hooks/usePageTitle';

const Reject = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [rejectData, setRejectData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLimit, setCurrentLimit] = useState(25);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 0,
    limit: 25,
    hasPagination: true,
  });
  usePageTitle('Reject');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchRejectList();
  }, [currentPage, currentLimit, debouncedSearch]);

  const fetchRejectList = async () => {
    try {
      setLoading(true);
      const response = await getRejectList({
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
        setRejectData(rows.slice(0, pag.limit || currentLimit));
        setPagination(pag);
      } else {
        toast.error('Failed to fetch reject list data', { toastId: 'reject-error' });
        setRejectData([]);
        setPagination((p) => ({ ...p, total: 0, pages: 0 }));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to fetch reject list data', {
        toastId: 'reject-error',
      });
      setRejectData([]);
      setPagination((p) => ({ ...p, total: 0, pages: 0 }));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e?.target?.value || e || '');
  };

  const handleFilter = () => {
    toast.info('Filter functionality coming soon', { toastId: 'filter-info' });
  };

  const handlePageChangeForTable = (newPageZeroBased) => {
    setCurrentPage(newPageZeroBased + 1);
  };

  const handleRowsPerPageChangeForTable = (newLimit) => {
    setCurrentLimit(newLimit);
    setCurrentPage(1);
  };

  const columns = useMemo(
    () => [
      {
        header: 'LOT NO',
        accessor: 'lotNo',
        cell: (row) => row.lotNo || '-',
      },
      {
        header: 'REJECT PIC',
        accessor: 'rejectPic',
        cell: (row) => <span className="font-semibold">{row.rejectPic || 0}</span>,
      },
    ],
    []
  );

  return (
    <>
      {loading && <LoaderComponent size={56} />}
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
              Reject Counting: - {pagination.total || 0}
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex-grow max-w-md">
                <InputElement
                  type="text"
                  placeholder="Search Reject"
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
              <Button
                variant="primary"
                size="medium"
                icon={<LucideFilter size={20} />}
                label="FILTER"
                onClick={handleFilter}
                className="flex items-center space-x-2"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 w-full">
          <CommonTable
            columns={columns}
            data={rejectData}
            count={pagination.total || 0}
            page={(pagination.page || currentPage) - 1}
            rowsPerPage={pagination.limit || currentLimit}
            onPageChange={handlePageChangeForTable}
            onRowsPerPageChange={handleRowsPerPageChangeForTable}
            rowsPerPageOptions={[25, 50, 75, 100]}
            emptyDataMessage="No reject data available."
            tableClassName="w-full divide-y divide-gray-200"
          />
        </div>
      </div>
    </>
  );
};

export default Reject;
