import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  LucideSearch,
  LucideChevronDown,
  LucideChevronUp,
  LucideLoader,
} from "lucide-react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InputElement from "../component/common/InputElement";
import CommonTable from "../component/common/Table/Table";
import LoaderComponent from "../component/common/Loader";
import { getDoracutSendLots } from "../apis/processApi";
import {
  capitalize,
  formatDate,
  formatEmployeeDisplayWithCode,
} from "../helpers/utils";
import usePageTitle from "../hooks/usePageTitle";

const getSendEmployeeDisplay = (row) => {
  if (row?.lastProcess && typeof row.lastProcess === "object") {
    const name = String(row.lastProcess.name || "").trim();
    const code = String(row.lastProcess.employeeCode || "").trim();
    if (name && code) return `${name} (${code})`;
    if (name) return name;
    if (code) return code;
  }

  const doracutSend = (row?.schandProcessEmployee || []).find((entry) => {
    const processName = String(entry?.processName || "").toLowerCase();
    return processName.includes("doracut") && processName.includes("send");
  });
  if (doracutSend?.employeeName) {
    const code = doracutSend.employeeCode || "";
    return code
      ? `${doracutSend.employeeName} (${code})`
      : doracutSend.employeeName;
  }

  const doracutEmployee = row?.doracut;
  if (doracutEmployee && typeof doracutEmployee === "object") {
    const out = formatEmployeeDisplayWithCode(doracutEmployee);
    if (out !== "-") return out;
  }

  if (row?.employeeDetails && typeof row.employeeDetails === "object") {
    const out = formatEmployeeDisplayWithCode(row.employeeDetails);
    if (out !== "-") return out;
  }

  return "-";
};

const normalizeSendLotsResponse = (response) => {
  const payload = response?.data ?? response ?? {};
  const records = Array.isArray(payload)
    ? payload
    : payload.records || payload.items || payload.data || [];
  const pagination = payload.pagination ||
    response?.pagination || {
      total: records.length,
      page: 1,
      pages: 1,
      limit: records.length || 25,
    };

  return { records, pagination };
};

const DoracutSendLots = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [currentLimit, setCurrentLimit] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [loading, setLoading] = useState(false);
  const [listData, setListData] = useState({
    records: [],
    pagination: { total: 0, page: 1, pages: 1, limit: 25 },
  });

  usePageTitle("Doracut Send");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getDoracutSendLots({
        page: currentPage + 1,
        limit: currentLimit,
        search: debouncedSearchQuery || "",
        sortKey: sortConfig.key,
        sortDirection: sortConfig.direction,
      });
      setListData(normalizeSendLotsResponse(response));
    } catch (error) {
      setListData({
        records: [],
        pagination: { total: 0, page: 1, pages: 1, limit: currentLimit },
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
    setCurrentPage(0);
  }, [debouncedSearchQuery]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
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
            className={
              isSorted && sortConfig.direction === "asc"
                ? "text-light-primary"
                : "text-light-lightGrey"
            }
          />
          <LucideChevronDown
            size={14}
            className={
              isSorted && sortConfig.direction === "desc"
                ? "text-light-primary"
                : "text-light-lightGrey"
            }
          />
        </div>
      </div>
    );
  };

  const columns = useMemo(
    () => [
      {
        header: <SortableTableHeader label="Lot No." sortKey="lotNo" />,
        accessor: "lotNo",
        cell: (row) => row?.lotNo || "-",
      },
      {
        header: <SortableTableHeader label="D. No." sortKey="dNo" />,
        accessor: "dNo",
        cell: (row) => row?.dNo || "-",
      },
      {
        header: <SortableTableHeader label="Color" sortKey="colour" />,
        accessor: "colour",
        cell: (row) => row?.colour || row?.color || "-",
      },
      {
        header: <SortableTableHeader label="Size" sortKey="size" />,
        accessor: "size",
        cell: (row) => row?.size || "-",
      },
      {
        header: <SortableTableHeader label="Pic" sortKey="pic" />,
        accessor: "pic",
        cell: (row) => row?.pic || row?.totalPic || "-",
      },
      {
        header: <SortableTableHeader label="Send Date" sortKey="lastScanDate" />,
        accessor: "lastScanDate",
        cell: (row) =>
          row?.lastScanDate || row?.createdAt
            ? formatDate(row.lastScanDate || row.createdAt)
            : "-",
      },
      {
        header: <SortableTableHeader label="Emp Name" sortKey="employeeName" />,
        accessor: "employeeName",
        cell: (row) => getSendEmployeeDisplay(row),
      },
      {
        header: <SortableTableHeader label="Status" sortKey="status" />,
        accessor: "status",
        cell: (row) => {
          const status = row?.currentStatus || row?.status || "";
          return status ? capitalize(status) : "-";
        },
      },
    ],
    [sortConfig]
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

        <div className="flex items-center justify-between !mt-0">
          <h1 className="text-2xl font-bold text-light-darkGrey font-roboto cursor-default">
            Doracut Send
          </h1>
        </div>

        <div className="flex items-center justify-between gap-4 w-full max-w-2xl">
          <div className="flex-grow w-full">
            <InputElement
              type="text"
              placeholder="Search by lot no..."
              value={searchQuery}
              onChange={(value) => {
                setSearchQuery(value);
                setCurrentPage(0);
              }}
              variant="size_44"
              className="w-full"
              is_required={false}
              extra_text_before={
                loading && debouncedSearchQuery !== searchQuery ? (
                  <LucideLoader
                    size={20}
                    className="text-light-primary animate-spin"
                  />
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
            data={listData.records}
            count={listData.pagination?.total || 0}
            page={(listData.pagination?.page || 1) - 1}
            rowsPerPage={listData.pagination?.limit || currentLimit}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={(newLimit) => {
              setCurrentLimit(newLimit);
              setCurrentPage(0);
            }}
            rowsPerPageOptions={[25, 50, 75, 100, 150]}
            emptyDataMessage={
              searchQuery
                ? "No doracut send lots found matching your search."
                : "No doracut send lots available."
            }
            tableClassName="min-w-full divide-y divide-gray-200"
          />
        </div>
      </div>
    </>
  );
};

export default DoracutSendLots;
