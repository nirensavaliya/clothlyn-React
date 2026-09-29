import React, { useState, useEffect, useMemo } from "react";
import {
    LucideSearch,
    LucideChevronDown,
    LucideChevronUp,
    LucideLoader
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InputElement from "../component/common/InputElement";
import CommonTable from "../component/common/Table/Table";
import Button from "../component/common/Button";

const SalesReport = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [currentLimit, setCurrentLimit] = useState(25);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [salesData, setSalesData] = useState({
        records: [],
        pagination: {
            total: 0,
            page: 0,
            pages: 1,
            limit: 10
        }
    });

    const staticData = [
        {
            medicineName: "Cotton T-Shirt",
            salesDate: "Feb 19, 2025",
            invoiceNumber: "INV-00270",
            quantity: 541,
            totalAmount: "$350.00",
            customerName: "Tahsan Khan",
            customerAvatar: "https://xsgames.co/randomusers/assets/avatars/male/1.jpg"
        },
        {
            medicineName: "Denim Jeans",
            salesDate: "Feb 20, 2025",
            invoiceNumber: "INV-00271",
            quantity: 213,
            totalAmount: "$650.00",
            customerName: "Anwar Hussen",
            customerAvatar: "https://xsgames.co/randomusers/assets/avatars/male/2.jpg"
        },
        {
            medicineName: "Polo Shirt",
            salesDate: "Feb 21, 2025",
            invoiceNumber: "INV-00272",
            quantity: 143,
            totalAmount: "$560.00",
            customerName: "Jaman Khan",
            customerAvatar: "https://xsgames.co/randomusers/assets/avatars/male/3.jpg"
        },
        {
            medicineName: "Casual Shirt",
            salesDate: "Feb 22, 2025",
            invoiceNumber: "INV-00273",
            quantity: 435,
            totalAmount: "$240.00",
            customerName: "Hasan Khan",
            customerAvatar: "https://xsgames.co/randomusers/assets/avatars/male/4.jpg"
        },
        {
            medicineName: "Formal Pants",
            salesDate: "Feb 23, 2025",
            invoiceNumber: "INV-00274",
            quantity: 324,
            totalAmount: "$820.00",
            customerName: "Ali Khan",
            customerAvatar: "https://xsgames.co/randomusers/assets/avatars/male/5.jpg"
        },
        {
            medicineName: "Sports T-Shirt",
            salesDate: "Feb 24, 2025",
            invoiceNumber: "INV-00275",
            quantity: 324,
            totalAmount: "$924.00",
            customerName: "Nahid Khan",
            customerAvatar: "https://xsgames.co/randomusers/assets/avatars/male/6.jpg"
        },
        {
            medicineName: "Cargo Pants",
            salesDate: "Feb 25, 2025",
            invoiceNumber: "INV-00276",
            quantity: 165,
            totalAmount: "$627.00",
            customerName: "Jayed Khan",
            customerAvatar: "https://xsgames.co/randomusers/assets/avatars/male/7.jpg"
        },
        {
            medicineName: "Hooded Sweatshirt",
            salesDate: "Feb 26, 2025",
            invoiceNumber: "INV-00277",
            quantity: 542,
            totalAmount: "$182.00",
            customerName: "Herry Kane",
            customerAvatar: "https://xsgames.co/randomusers/assets/avatars/male/8.jpg"
        },
        {
            medicineName: "Track Pants",
            salesDate: "Feb 27, 2025",
            invoiceNumber: "INV-00278",
            quantity: 321,
            totalAmount: "$786.00",
            customerName: "James Jack",
            customerAvatar: "https://xsgames.co/randomusers/assets/avatars/male/9.jpg"
        },
        {
            medicineName: "Winter Jacket",
            salesDate: "Feb 28, 2025",
            invoiceNumber: "INV-00279",
            quantity: 214,
            totalAmount: "$827.00",
            customerName: "Matt Henry",
            customerAvatar: "https://xsgames.co/randomusers/assets/avatars/male/10.jpg"
        }
    ];

    const fetchData = async () => {
        try {
            setLoading(true);
            setSearchLoading(true);

            await new Promise(resolve => setTimeout(resolve, 500));

            let filteredRecords = staticData;
            if (searchQuery) {
                filteredRecords = staticData.filter(item =>
                    Object.values(item).some(value =>
                        value.toString().toLowerCase().includes(searchQuery.toLowerCase())
                    )
                );
            }

            if (sortConfig.key) {
                filteredRecords.sort((a, b) => {
                    if (a[sortConfig.key] < b[sortConfig.key]) {
                        return sortConfig.direction === "asc" ? -1 : 1;
                    }
                    if (a[sortConfig.key] > b[sortConfig.key]) {
                        return sortConfig.direction === "asc" ? 1 : -1;
                    }
                    return 0;
                });
            }

            const startIndex = currentPage * currentLimit;
            const endIndex = startIndex + currentLimit;
            const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

            setSalesData({
                records: paginatedRecords,
                pagination: {
                    total: filteredRecords.length,
                    page: currentPage,
                    pages: Math.ceil(filteredRecords.length / currentLimit),
                    limit: currentLimit
                }
            });
        } catch (error) {
            toast.error("Error fetching data", { toastId: "fetch-error" });
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
            setSearchLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentPage, currentLimit, searchQuery, sortConfig]);

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

    const columns = useMemo(
        () => [
            {
                header: <SortableTableHeader label="Item Name" sortKey="itemName" />,
                accessor: "medicineName",
                cell: (row) => row.medicineName || "-"
            },
            {
                header: <SortableTableHeader label="Sales Date" sortKey="salesDate" />,
                accessor: "salesDate",
                cell: (row) => row.salesDate || "-"
            },
            {
                header: <SortableTableHeader label="Invoice Number" sortKey="invoiceNumber" />,
                accessor: "invoiceNumber",
                cell: (row) => row.invoiceNumber || "-"
            },
            {
                header: <SortableTableHeader label="Quantity" sortKey="quantity" />,
                accessor: "quantity",
                cell: (row) => (row.quantity !== undefined && row.quantity !== null) ? row.quantity : "-"
            },
            {
                header: <SortableTableHeader label="Total Amount" sortKey="totalAmount" />,
                accessor: "totalAmount",
                cell: (row) => (row.totalAmount !== undefined && row.totalAmount !== null) ? row.totalAmount : "-"
            },
            {
                header: <SortableTableHeader label="Customer Name" sortKey="customerName" />,
                cell: (row) => (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                            <img
                                src={row.customerAvatar}
                                alt={row.customerName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";
                                }}
                            />
                        </div>
                        <span className="font-medium text-light-darkGrey">{row.customerName}</span>
                    </div>
                ),
            },
        ],
        [sortConfig]
    );

    return (
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

            <div className="flex items-center justify-between !mt-0 max-[320px]:flex-col">
                <h1 className="text-2xl font-bold text-light-darkGrey font-roboto cursor-default">
                    Sales Report
                </h1>

                <Button
                    variant="primary"
                    size="medium"
                    label="Generate Report"
                    className="flex items-center space-x-2 shadow-none font-normal !rounded-md px-4 py-2 text-light-white transition-colors duration-200 focus:ring-0"
                />
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className="w-[40rem]">
                    <div>
                        <InputElement
                            type="text"
                            placeholder="Search report..."
                            value={searchQuery}
                            onChange={(value) => {
                                setSearchQuery(value);
                                setCurrentPage(0);
                            }}
                            variant="size_44"
                            className="w-full"
                            is_required={false}
                            extra_text_before={
                                searchLoading ? (
                                    <LucideLoader size={20} className="text-light-primary animate-spin" />
                                ) : (
                                    <LucideSearch size={20} className="text-light-lightGrey" />
                                )
                            }
                        />
                    </div>
                </div>
            </div>

            <div className="w-full">
                <CommonTable
                    columns={columns}
                    data={salesData.records}
                    count={salesData.pagination.total}
                    page={currentPage}
                    rowsPerPage={currentLimit}
                    onPageChange={handlePageChangeForTable}
                    onRowsPerPageChange={handleRowsPerPageChangeForTable}
                    rowsPerPageOptions={[25, 50, 75, 100, 150]}
                    emptyDataMessage={searchQuery ? "No items found matching your search." : "No items available."}
                    tableClassName="min-w-full divide-y divide-gray-200"
                    loading={loading}
                />
            </div>
        </div>
    );
};

export default SalesReport;