import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LucideSearch, LucideLoader, LucideDownload, Eye } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as ExcelJS from 'exceljs';
import { getSalarySummaryMaster, getSalaryMasterByEmployeeId } from '../apis/upadApi';
import InputElement from '../component/common/InputElement';
import CommonTable from '../component/common/Table/Table';
import Button from '../component/common/Button';
import LoaderComponent from '../component/common/Loader';
import ViewEmployeeModal from '../component/Employees/ViewEmployeeModal';
import usePageTitle from '../hooks/usePageTitle';
import SecureScreen from '../component/common/SecureScreen';

const normalizePagination = (pagination, fallbackLimit, fallbackPage) => {
  const p = pagination || {};
  return {
    totalItems: p.totalItems ?? p.total ?? 0,
    totalPages: p.totalPages ?? p.pages ?? 1,
    pageSize: p.pageSize ?? p.limit ?? fallbackLimit,
    currentPage: p.currentPage ?? p.page ?? fallbackPage,
  };
};

/** Map salary-master row + nested employee into ViewEmployeeModal shape */
const mergeSalaryRowToEmployee = (row) => {
  const e = row?.employee && typeof row.employee === 'object' ? row.employee : {};
  const processNames = Array.isArray(row?.processNames)
    ? row.processNames
    : Array.isArray(e.processNames)
      ? e.processNames
      : [];
  const roleFromNames =
    processNames.length > 0
      ? processNames.map((name) =>
          typeof name === 'object' && name !== null
            ? name
            : { processName: String(name) }
        )
      : null;
  return {
    ...e,
    _id: row.employeeId || e._id,
    firstName: row.firstName ?? e.firstName,
    lastName: row.lastName ?? e.lastName,
    nickname: row.nickname ?? e.nickname,
    employeeName: row.employeeName ?? e.employeeName,
    email: row.email ?? e.email,
    mobileNumber: row.mobileNumber ?? e.mobileNumber,
    referenceName: e.referenceName ?? row.referenceName,
    referenceMobileNumber: e.referenceMobileNumber ?? row.referenceMobileNumber,
    role: e.role ?? row.role ?? roleFromNames,
    employeeRole: e.employeeRole ?? row.employeeRole,
    createdAt: e.createdAt ?? row.employeeCreatedAt ?? row.createdAt,
    adharCardFront: e.adharCardFront,
    adharCardBack: e.adharCardBack,
    accountNumber: e.accountNumber ?? row.accountNumber,
    ifscCode: e.ifscCode ?? row.ifscCode,
    bankName: e.bankName ?? row.bankName,
    bankBranchName: e.bankBranchName ?? row.bankBranchName,
    accountHolderName: e.accountHolderName ?? row.accountHolderName,
  };
};

const salarySummaryFromListRow = (row) => ({
  lastPeriodSalary: row?.lastPeriodSalary ?? row?.totalSalary ?? 0,
  lastPeriodUnpaidAmount: row?.lastPeriodUnpaidAmount ?? row?.unpaidLastPeriodAmount ?? 0,
  unpaidLastPeriodAmount: row?.unpaidLastPeriodAmount ?? row?.lastPeriodUnpaidAmount ?? 0,
  currentPeriodSalary: row?.currentPeriodSalary ?? row?.currentTotalSalary ?? 0,
  upadPaid: row?.upadPaid ?? row?.pastPeriodPaid ?? 0,
  bonusPaid: row?.bonusPaid ?? 0,
  salaryPaid: row?.salaryPaid ?? 0,
  paySalary: row?.paySalary ?? 0,
  pastPeriodPaid: row?.upadPaid ?? row?.pastPeriodPaid ?? 0,
  lastPaidSalary: row?.upadPaid ?? row?.pastPeriodPaid ?? 0,
  totalRemainingAmount: row?.totalRemainingAmount ?? 0,
  totalEarning: row?.totalEarning ?? row?.totalSalary ?? 0,
  totalPaidSalary: row?.totalPaidSalary ?? row?.totalPaid ?? 0,
  totalRemainingToPay: row?.totalRemainingToPay ?? row?.totalRemainingAmount ?? 0,
});

const SalaryMasterNew = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLimit, setCurrentLimit] = useState(25);
  const [loading, setLoading] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [accountData, setAccountData] = useState({
    items: [],
    pagination: { totalItems: 0, totalPages: 1, pageSize: 25, currentPage: 1 },
  });
  const [detailRow, setDetailRow] = useState(null);
  const [detailEmployeeData, setDetailEmployeeData] = useState(null);
  const [detailSalarySummary, setDetailSalarySummary] = useState(null);
  const [detailPaidHistory, setDetailPaidHistory] = useState([]);
  const [detailPeriodWiseSalary, setDetailPeriodWiseSalary] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  usePageTitle('Salary Master New');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: currentLimit,
        search: debouncedSearchQuery,
        sortKey: null,
        sortDirection: 'asc',
      };
      const response = await getSalarySummaryMaster(params);
      const pagination = normalizePagination(response?.pagination, currentLimit, currentPage);
      setAccountData({
        items: response.data || [],
        pagination,
      });
    } catch (error) {
      setAccountData({
        items: [],
        pagination: {
          totalItems: 0,
          totalPages: 1,
          pageSize: currentLimit,
          currentPage: 1,
        },
      });
      toast.error('Failed to fetch account details. Please try again.', { toastId: 'salary-master-new-fetch-error' });
      console.error('Error fetching salary master (new):', error);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    currentLimit,
    debouncedSearchQuery,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 700);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChangeForTable = (newPageZeroBased) => {
    setCurrentPage(newPageZeroBased + 1);
  };

  const handleRowsPerPageChangeForTable = (newRowsPerPage) => {
    setCurrentLimit(newRowsPerPage);
    setCurrentPage(1);
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleDownloadExcel = async () => {
    try {
      setDownloadingExcel(true);
      const currentFilters = {
        page: 1,
        limit: 10000,
        search: debouncedSearchQuery,
        sortKey: null,
        sortDirection: 'asc',
      };

      // Fetch full filtered dataset and generate Excel on frontend
      const response = await getSalarySummaryMaster(currentFilters);
      const allRows = response?.data || [];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Salary Master New');

      worksheet.columns = [
        { header: 'Nick Name', key: 'nickname', width: 20 },
        { header: 'Emp Code', key: 'employeeName', width: 16 },
        { header: 'Account Holder Name', key: 'accountHolderName', width: 24 },
        { header: 'Account Number', key: 'accountNumber', width: 24 },
        { header: 'IFSC Code', key: 'ifscCode', width: 16 },
        { header: 'Bank Name', key: 'bankName', width: 20 },
        { header: 'Total Remaining', key: 'totalRemainingAmount', width: 18 },
        { header: 'Current Period Salary', key: 'currentPeriodSalary', width: 22 },
        { header: 'Last Period Salary', key: 'lastPeriodSalary', width: 20 },
        { header: 'Bonus', key: 'bonusPaid', width: 18 },
        { header: 'Upad', key: 'upadPaid', width: 18 },
        { header: 'Pay Salary', key: 'paySalary', width: 18 },
      ];

      allRows.forEach((row) => {
        const upad = Number(row?.upadPaid ?? row?.pastPeriodPaid ?? 0);
        const bonus = Number(row?.bonusPaid ?? 0);
        const lastPeriodSalary = Number(row?.lastPeriodSalary ?? row?.totalSalary ?? 0);
        worksheet.addRow({
          nickname: row?.nickname || row?.employee?.nickname || '-',
          employeeName: row?.employeeName || '-',
          accountNumber: row?.accountNumber || row?.employee?.accountNumber || '-',
          accountHolderName: row?.accountHolderName || row?.employee?.accountHolderName || '-',
          ifscCode: row?.ifscCode || row?.employee?.ifscCode || '-',
          bankName: row?.employee?.bankName || '-',
          totalRemainingAmount: Number(row?.totalRemainingAmount ?? 0),
          currentPeriodSalary: Number(row?.currentPeriodSalary ?? row?.currentTotalSalary ?? 0),
          lastPeriodSalary,
          bonusPaid: bonus,
          upadPaid: upad,
          paySalary:
            row?.paySalary != null
              ? Number(row.paySalary)
              : Math.max(
                  0,
                  lastPeriodSalary + bonus - (Number(row?.salaryPaid) || 0) - upad
                ),
        });
      });

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      [
        'totalRemainingAmount',
        'currentPeriodSalary',
        'lastPeriodSalary',
        'bonusPaid',
        'upadPaid',
        'paySalary',
      ].forEach((key) => {
        worksheet.getColumn(key).numFmt = '#,##0';
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `salary-master-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('Excel file downloaded successfully!', { toastId: 'excel-download-success-salary-master' });
    } catch (error) {
      console.error('Error downloading Excel:', error);
      toast.error('Failed to download Excel file.', { toastId: 'excel-download-error-salary-master' });
    } finally {
      setDownloadingExcel(false);
    }
  };

  const openEmployeeDetail = useCallback(async (row) => {
    const employeeId = row?.employeeId || row?.employee?._id;
    if (!employeeId) {
      toast.error('Employee ID not found for this row.', { toastId: 'salary-master-detail-employee-id-missing' });
      return;
    }

    // Instant open from list row — no full-page wait for heavy period-wise API
    const merged = mergeSalaryRowToEmployee(row);
    setDetailRow(row);
    setDetailEmployeeData(merged);
    setDetailSalarySummary(salarySummaryFromListRow(row));
    setDetailPaidHistory([]);
    setDetailPeriodWiseSalary([]);
    setDetailLoading(true);

    try {
      const res = await getSalaryMasterByEmployeeId(employeeId);
      const payload = res?.data || {};
      const employee = payload?.employee && typeof payload.employee === 'object'
        ? payload.employee
        : merged;

      const summaryMaster = payload?.salarySummaryMaster || {};
      const halfSnap = payload?.halfMonthPeriodSnapshot || {};
      const totals = payload?.totals || {};

      setDetailEmployeeData({
        ...merged,
        ...employee,
        createdAt: payload?.joinedAt || employee?.createdAt || merged?.createdAt,
        role: employee?.role?.length ? employee.role : merged.role,
      });
      setDetailSalarySummary({
        lastPeriodSalary:
          summaryMaster?.lastPeriodSalary ??
          halfSnap?.totalSalaryClosedHalf ??
          row?.lastPeriodSalary ??
          row?.totalSalary ??
          0,
        lastPeriodUnpaidAmount:
          summaryMaster?.lastPeriodUnpaidAmount ??
          summaryMaster?.unpaidLastPeriodAmount ??
          totals?.unpaidLastPeriodAmount ??
          row?.lastPeriodUnpaidAmount ??
          row?.unpaidLastPeriodAmount ??
          0,
        unpaidLastPeriodAmount:
          summaryMaster?.lastPeriodUnpaidAmount ??
          summaryMaster?.unpaidLastPeriodAmount ??
          totals?.unpaidLastPeriodAmount ??
          row?.lastPeriodUnpaidAmount ??
          row?.unpaidLastPeriodAmount ??
          0,
        currentPeriodSalary:
          summaryMaster?.currentPeriodSalary ??
          halfSnap?.currentOpenHalfEarned ??
          row?.currentPeriodSalary ??
          row?.currentTotalSalary ??
          0,
        upadPaid:
          summaryMaster?.upadPaid ??
          summaryMaster?.pastPeriodPaid ??
          row?.upadPaid ??
          row?.pastPeriodPaid ??
          0,
        bonusPaid: summaryMaster?.bonusPaid ?? row?.bonusPaid ?? 0,
        salaryPaid: summaryMaster?.salaryPaid ?? row?.salaryPaid ?? 0,
        paySalary:
          summaryMaster?.paySalary ??
          totals?.paySalary ??
          row?.paySalary ??
          0,
        pastPeriodPaid:
          summaryMaster?.upadPaid ??
          summaryMaster?.pastPeriodPaid ??
          row?.upadPaid ??
          row?.pastPeriodPaid ??
          0,
        lastPaidSalary:
          summaryMaster?.upadPaid ??
          summaryMaster?.pastPeriodPaid ??
          row?.upadPaid ??
          0,
        totalRemainingAmount:
          summaryMaster?.totalRemainingAmount ??
          totals?.totalRemainingAmount ??
          row?.totalRemainingAmount ??
          0,
        totalEarning:
          summaryMaster?.totalEarning ??
          totals?.totalEarning ??
          totals?.lifetimeEarnedFromSalaryReports ??
          0,
        totalPaidSalary:
          summaryMaster?.totalPaidSalary ??
          totals?.totalPaidSalary ??
          totals?.lifetimeTotalPaid ??
          summaryMaster?.totalPaid ??
          0,
        totalRemainingToPay:
          summaryMaster?.totalRemainingToPay ??
          totals?.totalRemainingToPay ??
          row?.totalRemainingToPay ??
          0,
        totalSalaryClosedHalf: halfSnap?.totalSalaryClosedHalf ?? 0,
        currentTotalSalary: halfSnap?.currentOpenHalfEarned ?? 0,
        lifetimeEarnedFromSalaryReports: totals?.lifetimeEarnedFromSalaryReports ?? 0,
        lifetimeTotalPaid: totals?.lifetimeTotalPaid ?? 0,
        paidSalaryRecordCount: payload?.paidSalaryRecordCount ?? 0,
      });
      setDetailPaidHistory(Array.isArray(payload?.paidSalaryHistory) ? payload.paidSalaryHistory : []);
      setDetailPeriodWiseSalary(
        Array.isArray(payload?.periodWiseSalary) ? payload.periodWiseSalary : []
      );
    } catch (error) {
      // toast already handled in api layer — keep list-row snapshot visible
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeEmployeeDetail = useCallback(() => {
    setDetailRow(null);
    setDetailEmployeeData(null);
    setDetailSalarySummary(null);
    setDetailPaidHistory([]);
    setDetailPeriodWiseSalary([]);
  }, []);

  const columns = useMemo(
    () => [
      {
        header: 'Nick Name',
        accessor: 'nickname',
        cell: (row) => row?.nickname || row?.employee?.nickname || '-',
      },
      {
        header: 'Emp Code',
        accessor: 'employeeName',
        cell: (row) => row.employeeName || '-',
      },
      {
        header: 'Account Holder Name',
        id: 'accountHolderName',
        accessor: 'accountHolderName',
        cell: (row) => row?.accountHolderName || row?.employee?.accountHolderName || '-',
      },
      {
        header: 'Account Number',
        id: 'accountNumber',
        accessor: 'accountNumber',
        cell: (row) => row?.accountNumber || row?.employee?.accountNumber || '-',
      },
      {
        header: 'IFSC Code',
        accessor: 'ifscCode',
        cell: (row) => row?.employee?.ifscCode || '-',
      },
      {
        header: 'Bank Name',
        accessor: 'bankName',
        cell: (row) => row?.employee?.bankName || '-',
      },
      {
        header: 'Total Remaining',
        accessor: 'totalRemainingAmount',
        cell: (row) => (
          <span style={{ color: '#dc2626', fontWeight: 600 }}>
            ₹
            {Math.round(
              Number(
                row.totalRemainingAmount ?? row.unpaidLastPeriodAmount ?? row.pastUnpaid ?? 0
              )
            ).toLocaleString('en-IN')}
          </span>
        ),
      },
      {
        header: 'Current Period Salary',
        accessor: 'currentPeriodSalary',
        cell: (row) =>
          `₹${Math.round(Number(row.currentPeriodSalary ?? row.currentTotalSalary ?? 0)).toLocaleString('en-IN')}`,
      },
      {
        header: 'Last Period Salary',
        accessor: 'lastPeriodSalary',
        cell: (row) =>
          `₹${Math.round(Number(row.lastPeriodSalary ?? row.totalSalary ?? 0)).toLocaleString('en-IN')}`,
      },
      {
        header: 'Bonus',
        id: 'bonusPaid',
        accessor: 'bonusPaid',
        cell: (row) => {
          const bonus = Math.round(Number(row.bonusPaid ?? 0));
          return (
            <span style={{ color: '#16a34a', fontWeight: 600, whiteSpace: 'nowrap' }}>
              ₹{bonus.toLocaleString('en-IN')}
            </span>
          );
        },
      },
      {
        header: 'Upad',
        id: 'upadPaid',
        accessor: 'upadPaid',
        cell: (row) => {
          const upad = Math.round(Number(row.upadPaid ?? row.pastPeriodPaid ?? 0));
          return (
            <span style={{ color: '#16a34a', fontWeight: 600, whiteSpace: 'nowrap' }}>
              ₹{upad.toLocaleString('en-IN')}
            </span>
          );
        },
      },
      {
        header: 'Pay Salary',
        id: 'paySalary',
        accessor: 'paySalary',
        cell: (row) => {
          const lastPeriod = Number(row.lastPeriodSalary ?? row.totalSalary ?? 0);
          const upad = Number(row.upadPaid ?? row.pastPeriodPaid ?? 0);
          const bonus = Number(row.bonusPaid ?? 0);
          const salary = Number(row.salaryPaid ?? 0);
          const paySalary = Math.round(
            Number(
              row.paySalary != null
                ? row.paySalary
                : Math.max(0, lastPeriod + bonus - salary - upad)
            )
          );
          return (
            <span style={{ color: '#2563eb', fontWeight: 600, whiteSpace: 'nowrap' }}>
              ₹{paySalary.toLocaleString('en-IN')}
            </span>
          );
        },
      },
      {
        header: 'View',
        id: 'viewDetail',
        cell: (row) => (
          <button
            type="button"
            onClick={() => openEmployeeDetail(row)}
            className="inline-flex items-center justify-center rounded-md p-2 text-light-primary hover:bg-light-primary/10 focus:outline-none focus:ring-2 focus:ring-light-primary/30"
            aria-label="View employee details"
          >
            <Eye size={18} />
          </button>
        ),
      },
    ],
    [openEmployeeDetail]
  );

  const pagination = accountData?.pagination || {};

  return (
    <>
      {(loading || downloadingExcel) && <LoaderComponent size={56} />}

      <SecureScreen message="Salary Master — protected">
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
          <h1 className="text-2xl font-bold text-light-darkGrey font-roboto cursor-default max-sm:text-left max-sm:w-full">
            Salary Master New
          </h1>
        </div>

        <div className="flex items-center justify-between gap-4 w-full max-sm:flex-col max-sm:items-stretch">
          <div className="flex-grow w-full">
            <InputElement
              type="text"
              placeholder="Search by employee name or code..."
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
          <Button
            variant="primary"
            size="medium"
            icon={<LucideDownload size={20} />}
            label={downloadingExcel ? 'Downloading...' : 'Download Excel'}
            onClick={handleDownloadExcel}
            disabled={downloadingExcel}
            className="flex items-center space-x-2 shadow-none font-normal !rounded-md px-4 py-2 text-light-white transition-colors duration-200 focus:ring-0 whitespace-nowrap max-sm:w-full max-sm:justify-center"
          />
        </div>

        <div className="w-full">
          <CommonTable
            columns={columns}
            data={accountData?.items || []}
            count={pagination.totalItems ?? 0}
            page={Math.max(0, currentPage - 1)}
            rowsPerPage={pagination.pageSize || currentLimit}
            onPageChange={handlePageChangeForTable}
            onRowsPerPageChange={handleRowsPerPageChangeForTable}
            rowsPerPageOptions={[25, 50, 75, 100, 150]}
            emptyDataMessage={
              searchQuery
                ? 'No account details found matching your search or filters.'
                : 'No account details available.'
            }
            tableClassName="min-w-full divide-y divide-gray-200"
            uniqueRowIdentifier="employeeId"
          />
        </div>

        <ViewEmployeeModal
          isOpen={Boolean(detailRow)}
          onClose={closeEmployeeDetail}
          employeeData={detailEmployeeData || (detailRow ? mergeSalaryRowToEmployee(detailRow) : null)}
          salarySummary={detailSalarySummary}
          paidSalaryHistory={detailPaidHistory}
          periodWiseSalary={detailPeriodWiseSalary}
          detailLoading={detailLoading}
        />
      </div>
      </SecureScreen>
    </>
  );
};

export default SalaryMasterNew;
