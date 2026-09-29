import React, { useState, useEffect, useMemo } from 'react';
import { FileText, LucideChevronUp, LucideChevronDown, Eye, Download, ArrowLeft } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import { getAuthHeaders, getAuthToken } from '../utils/authToken';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import CommonTable from '../component/common/Table/Table';
import LoaderComponent from '../component/common/Loader';
import SelectElement from '../component/common/Select';
import Button from '../component/common/Button';
import { getCompanies } from '../apis/companiesApi';
import usePageTitle from '../hooks/usePageTitle';

const BASE_URL = process.env.REACT_APP_BASE_URL;

const TH =
  "px-2 py-1.5 text-center text-[11px] font-semibold text-[#0B1C30] uppercase tracking-wider bg-[#EFE7DC] leading-tight border-b border-[#E8DFD4]";
const TD =
  "border-b border-[#E8DFD4] px-2 py-1.5 text-[#4C463D] text-center text-[13px] leading-tight h-9";
const rowBg = (idx) =>
  idx % 2 === 0
    ? "bg-white group-hover:bg-[#F3EEE7]"
    : "bg-light-primary/15 group-hover:bg-light-primary/25";

const CompaniesReport = () => {
  const [loading, setLoading] = useState(false);
  const [billingDates, setBillingDates] = useState([]);
  const [billingDetails, setBillingDetails] = useState([]);
  const [billingGrandTotal, setBillingGrandTotal] = useState(0);
  const [challanData, setChallanData] = useState({ report: [], grandTotal: 0 });
  const [viewMode, setViewMode] = useState('list'); // 'list', 'billing', 'challan'
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [currentLimit, setCurrentLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: "desc" });

  usePageTitle(viewMode === 'list' ? 'Company Reports' : (viewMode === 'billing' ? `Challan - ${selectedDate}` : `Bill - ${selectedDate}`));

  // Fetch Companies
  useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoadingCompanies(true);
      try {
        const response = await getCompanies({ limit: 1000, isActive: true });
        const companiesList = response?.data?.items || response?.data || response?.items || [];
        const options = companiesList.map(company => ({
          value: company._id,
          label: company.name
        }));
        setCompanies(options);
        
        if (options.length > 0 && !selectedCompany) {
          setSelectedCompany(options[0].value);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
        setCompanies([]);
      } finally {
        setIsLoadingCompanies(false);
      }
    };
    fetchCompanies();
  }, []);

  const fetchBillingDates = async () => {
    if (!selectedCompany) return;
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await axios.get(`${BASE_URL}/api/companies/billing/dates`, {
        params: {
          companyId: selectedCompany,
          page: currentPage + 1,
          limit: currentLimit
        },
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      if (response.data.status === 'success') {
        setBillingDates(response.data.data || []);
        setTotalRecords(response.data.pagination?.total || (response.data.data?.length || 0));
      }
    } catch (error) {
      console.error('Error fetching dates:', error);
      toast.error('Failed to load dates');
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingDetails = async (date) => {
    if (!selectedCompany) {
      toast.error('Please select a company first');
      return;
    }
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await axios.get(`${BASE_URL}/api/companies/billing/details`, {
        params: {
          date,
          companyId: selectedCompany,
          limit: 0,
        },
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      if (response.data.status === 'success') {
        const rows = response.data.data || [];
        const computedTotal = rows.reduce(
          (sum, row) => sum + (Number(row.totalAmount) || 0),
          0
        );
        const apiTotal = Number(response.data.grandTotal);
        const grandTotal =
          Number.isFinite(apiTotal) && (apiTotal > 0 || computedTotal === 0)
            ? apiTotal
            : computedTotal;
        setBillingDetails(rows);
        setBillingGrandTotal(grandTotal);
        setSelectedDate(date);
        setViewMode('billing');
      }
    } catch (error) {
      console.error('Error fetching challan details:', error);
      toast.error('Failed to load challan details');
    } finally {
      setLoading(false);
    }
  };

  const fetchChallanDetails = async (date) => {
    if (!selectedCompany) {
      toast.error('Please select a company first');
      return;
    }
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await axios.get(`${BASE_URL}/api/companies/billing/challan`, {
        params: {
          date,
          companyId: selectedCompany,
          limit: 0,
        },
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      if (response.data.status === 'success') {
        setChallanData(response.data.data || { report: [], grandTotal: 0 });
        setSelectedDate(date);
        setViewMode('challan');
      }
    } catch (error) {
      console.error('Error fetching bill details:', error);
      toast.error('Failed to load bill details');
    } finally {
      setLoading(false);
    }
  };

  const downloadBillingExcel = async (date) => {
    if (!selectedCompany) {
      toast.error('Please select a company first');
      return;
    }
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await axios.get(`${BASE_URL}/api/companies/billing/excel`, {
        params: {
          date,
          companyId: selectedCompany,
        },
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Challan_${date}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Challan Excel downloaded successfully');
    } catch (error) {
      console.error('Error downloading challan excel:', error);
      toast.error('Failed to download challan Excel');
    } finally {
      setLoading(false);
    }
  };

  const downloadChallanExcel = async (date) => {
    if (!selectedCompany) {
      toast.error('Please select a company first');
      return;
    }
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await axios.get(`${BASE_URL}/api/companies/billing/challan/excel`, {
        params: {
          date,
          companyId: selectedCompany,
        },
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bill_${date}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Bill Excel downloaded successfully');
    } catch (error) {
      console.error('Error downloading bill excel:', error);
      toast.error('Failed to download bill Excel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingDates();
  }, [selectedCompany, currentPage, currentLimit]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    setCurrentPage(0);
  };

  const handlePageChangeForTable = (newPageZeroBased) => {
    setCurrentPage(newPageZeroBased);
  };

  const handleRowsPerPageChangeForTable = (newRowsPerPage) => {
    setCurrentLimit(newRowsPerPage);
    setCurrentPage(0);
  };

  const SortableTableHeader = ({ label, sortKey }) => {
    const isSorted = sortConfig.key === sortKey;
    return (
      <div
        className="flex items-center space-x-2 cursor-pointer w-max"
        onClick={() => handleSort(sortKey)}
      >
        <span>{label}</span>
        <div className="flex flex-col">
          <LucideChevronUp
            size={14}
            className={`${isSorted && sortConfig.direction === "asc"
              ? "text-light-primary"
              : "text-light-lightGrey"
              }`}
          />
          <LucideChevronDown
            size={14}
            className={`${isSorted && sortConfig.direction === "desc"
              ? "text-light-primary"
              : "text-light-lightGrey"
              }`}
          />
        </div>
      </div>
    );
  };

  const mainColumns = useMemo(() => {
    return [
      {
        header: <SortableTableHeader label="Date" sortKey="date" />,
        accessor: "date",
        cell: (row) => <span className="text-light-text">{row.date || "-"}</span>
      },
      {
        header: "View Bill",
        id: "view_bill",
        cell: (row) => (
          <button 
            onClick={() => fetchChallanDetails(row.date)}
            className="p-2 border border-light-border rounded-md hover:bg-light-gray_50 text-light-primary transition-colors"
          >
            <Eye size={18} />
          </button>
        )
      },
      {
        header: "Challan",
        id: "challan",
        cell: (row) => (
          <button 
            onClick={() => fetchBillingDetails(row.date)}
            className="p-2 border border-light-border rounded-md hover:bg-light-gray_50 text-light-primary transition-colors"
          >
            <FileText size={18} />
          </button>
        )
      },
      {
        header: "Download Bill",
        id: "download_bill",
        cell: (row) => (
          <button 
            onClick={() => downloadChallanExcel(row.date)}
            className="flex items-center gap-2 px-4 py-2 bg-light-primary hover:bg-light-primary_hover rounded text-xs font-bold uppercase transition-colors shadow-sm"
          >
            <Download size={14} style={{ color: "#fff" }} />
            <span style={{ color: "#fff" }}>Download Bill</span>
          </button>
        )
      },
      {
        header: "Download Challan",
        id: "download_challan",
        cell: (row) => (
          <button 
            onClick={() => downloadBillingExcel(row.date)}
            className="flex items-center gap-2 px-4 py-2 bg-light-primary hover:bg-light-primary_hover rounded text-xs font-bold uppercase transition-colors shadow-sm"
          >
            <Download size={14} style={{ color: "#fff" }} />
            <span style={{ color: "#fff" }}>Download Challan</span>
          </button>
        )
      }
    ];
  }, [sortConfig, selectedCompany]);

  if (viewMode === 'billing') {
    const detailColumns = [
      { header: "No", key: "no" },
      { header: "D No", key: "dNo" },
      { header: "Lot No", key: "lotNo" },
      { header: "Color", key: "color" },
      { header: "Size", key: "size" },
      { header: "Pic", key: "pic" },
      { header: "Alter", key: "alter" },
      { header: "Reject", key: "reject" },
      { header: "Rc Pic", key: "rcPic" },
      { header: "Amount", key: "amount" },
      { header: "Total Amount", key: "totalAmount" },
    ];

    return (
      <>
        {loading && <LoaderComponent size={56}/>}
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4 !mt-0 max-sm:flex-col max-sm:items-stretch">
            <Button
              variant="outline"
              size="medium"
              label="Back"
              icon={<ArrowLeft size={18} />}
              onClick={() => setViewMode('list')}
              className="!shadow-none font-normal !rounded-md px-4 py-2 shrink-0"
            />
            <div className="flex-1 text-center">
              <h1 className="text-2xl font-bold text-[#0B1C30] font-roboto">Challan</h1>
              <p className="text-sm font-medium text-[#7D766C]">{selectedDate}</p>
            </div>
            <div className="flex items-center gap-4 shrink-0 max-sm:justify-between">
              <div className="text-right">
                <p className="text-xs font-semibold text-[#7D766C] uppercase tracking-wider">Total Amount</p>
                <p className="text-lg font-bold text-[#0B1C30]">
                  ₹{billingGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <Button
                variant="primary"
                size="medium"
                label="Download XLSX"
                icon={<Download size={18} />}
                onClick={() => downloadBillingExcel(selectedDate)}
                className="!shadow-none font-normal !rounded-md px-4 py-2 uppercase text-sm"
              />
            </div>
          </div>

          <div className="clothlyn-table flex w-full flex-col overflow-hidden rounded-2xl border border-[#E8DFD4] bg-[#EFE7DC] shadow-none">
            <div className="min-w-0 overflow-x-auto scrollbar bg-[#F9F6F1]">
              <table className="min-w-full">
                <thead>
                  <tr>
                    {detailColumns.map((col, idx) => (
                      <th key={idx} className={TH}>
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {billingDetails.map((row, idx) => (
                    <tr key={idx} className={`group ${rowBg(idx)}`}>
                      <td className={`${TD} ${rowBg(idx)}`}>{row.no ?? idx + 1}</td>
                      <td className={`${TD} ${rowBg(idx)}`}>{row.dNo}</td>
                      <td className={`${TD} ${rowBg(idx)}`}>{row.lotNo}</td>
                      <td className={`${TD} ${rowBg(idx)}`}>{row.color}</td>
                      <td className={`${TD} ${rowBg(idx)}`}>{row.size}</td>
                      <td className={`${TD} ${rowBg(idx)}`}>{row.pic ?? 0}</td>
                      <td className={`${TD} ${rowBg(idx)}`}>{row.alter ?? 0}</td>
                      <td className={`${TD} ${rowBg(idx)}`}>{row.reject ?? 0}</td>
                      <td className={`${TD} ${rowBg(idx)}`}>{row.rcPic ?? 0}</td>
                      <td className={`${TD} ${rowBg(idx)}`}>{row.amount ?? 0}</td>
                      <td className={`${TD} ${rowBg(idx)} font-semibold`}>{row.totalAmount ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (viewMode === 'challan') {
    return (
      <>
        {loading && <LoaderComponent size={56}/>}
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4 !mt-0 max-sm:flex-col max-sm:items-stretch">
            <Button
              variant="outline"
              size="medium"
              label="Back"
              icon={<ArrowLeft size={18} />}
              onClick={() => setViewMode('list')}
              className="!shadow-none font-normal !rounded-md px-4 py-2 shrink-0"
            />
            <div className="flex-1 text-center">
              <h1 className="text-2xl font-bold text-[#0B1C30] font-roboto">Bill</h1>
              <p className="text-sm font-medium text-[#7D766C]">{selectedDate}</p>
            </div>
            <Button
              variant="primary"
              size="medium"
              label="Download XLSX"
              icon={<Download size={18} />}
              onClick={() => downloadChallanExcel(selectedDate)}
              className="!shadow-none font-normal !rounded-md px-4 py-2 uppercase text-sm shrink-0"
            />
          </div>

          <div className="clothlyn-table flex w-full flex-col overflow-hidden rounded-2xl border border-[#E8DFD4] bg-[#EFE7DC] shadow-none">
            <div className="min-w-0 overflow-x-auto scrollbar bg-[#F9F6F1]">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className={TH}>No</th>
                    <th className={TH}>D No</th>
                    <th className={TH}>Pic</th>
                    <th className={TH}>Alter</th>
                    <th className={TH}>Reject</th>
                    <th className={TH}>Rc Pic</th>
                    <th className={TH}>Amount</th>
                    <th className={TH}>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {challanData.report && challanData.report.map((row, idx) => (
                    <tr key={idx} className={`group ${rowBg(idx)}`}>
                      <td className={`${TD} ${rowBg(idx)}`}>{row.no}</td>
                      <td className={`${TD} ${rowBg(idx)} font-medium`}>{row.dNo}</td>
                      <td className={`${TD} ${rowBg(idx)}`}>{row.pic ?? 0}</td>
                      <td className={`${TD} ${rowBg(idx)}`}>{row.alter || 0}</td>
                      <td className={`${TD} ${rowBg(idx)}`}>{row.reject || 0}</td>
                      <td className={`${TD} ${rowBg(idx)}`}>{row.rcPic ?? 0}</td>
                      <td className={`${TD} ${rowBg(idx)}`}>{row.price ?? row.amount ?? 0}</td>
                      <td className={`${TD} ${rowBg(idx)} font-semibold`}>{row.totalAmount || 0}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#EFE7DC]">
                    <td colSpan="7" className={`${TD} bg-[#EFE7DC] text-right font-semibold uppercase text-[#0B1C30]`}>
                      Total Amount :
                    </td>
                    <td className={`${TD} bg-[#EFE7DC] font-bold text-[#0B1C30]`}>
                      {challanData.grandTotal}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {loading && <LoaderComponent size={56}/>}

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

        <div className="flex items-center justify-between gap-4 !mt-0 max-sm:flex-col max-sm:items-stretch max-sm:gap-2">
          <h1 className="text-2xl font-bold text-light-darkGrey font-roboto cursor-default max-sm:text-left max-sm:w-full shrink-0">
            Billing
          </h1>
          <div className="w-full max-w-xs max-sm:max-w-full">
            <SelectElement
              options={companies}
              value={selectedCompany || null}
              onChange={(val) => {
                setSelectedCompany(val);
                setCurrentPage(0);
              }}
              placeholder={isLoadingCompanies ? "Loading companies..." : "Select Company"}
              isClearable={false}
              className="w-full"
              isMulti={false}
              menuPortalTarget={document.body}
              isLoading={isLoadingCompanies}
              is_required={false}
            />
          </div>
        </div>

        <div className="w-full">
          <CommonTable
            columns={mainColumns}
            data={billingDates}
            count={totalRecords}
            page={currentPage}
            rowsPerPage={currentLimit}
            onPageChange={handlePageChangeForTable}
            onRowsPerPageChange={handleRowsPerPageChangeForTable}
            rowsPerPageOptions={[25, 50, 75, 100, 150]}
            emptyDataMessage="No billing data available for selected company."
            tableClassName="min-w-full divide-y divide-gray-200"
            loading={loading}
          />
        </div>
      </div>
    </>
  );
};

export default CompaniesReport;
