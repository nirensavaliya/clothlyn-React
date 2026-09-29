import React, { useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import TablePagination from './Pagination';
import { LucideLoader } from 'lucide-react';
import { bundleRowTransition } from '../PageTransition';

const CommonTable = ({
  columns,
  data,
  initialRowsPerPage = 25,
  rowsPerPageOptions = [25, 50, 75, 100, 150],
  tableClassName = "min-w-full",
  theadClassName = "bg-[#EFE7DC]",
  thClassName =
    "sticky top-0 px-2 py-1.5 text-left text-[11px] font-semibold text-[#0B1C30] uppercase tracking-wider bg-[#EFE7DC] leading-tight border-b border-[#E8DFD4]",
  tbodyClassName = "!border-t-0",
  tdClassName =
    "border-b border-[#E8DFD4] px-2 py-1.5 text-[#4C463D] text-left text-[13px] leading-tight h-9",
  emptyDataMessage = "No data available",
  showPagination = true,
  /** null = full table height, page scroll (same as Lots). Pass a calc() for inner scroll. */
  maxHeight = null,

  count: controlledCount,
  page: controlledPage,
  rowsPerPage: controlledRowsPerPage,
  onPageChange: controlledOnPageChange,
  onRowsPerPageChange: controlledOnRowsPerPageChange,

  selectableRows = false,
  onSelectedRowsChange,
  selectedItems = [],
  uniqueRowIdentifier = 'id',
  onRowClick,
  loading = false,
  /** Odd rows use a light primary tint (even rows stay white). Set false for gray zebra only. */
  stripePrimary = true,
  /** Optional: return a Tailwind bg class for a row (overrides zebra). e.g. Complete → light green */
  getRowBgClassName = null,
}) => {
  const reduceMotion = useReducedMotion();
  const isControlled = controlledOnPageChange !== undefined;

  const [internalPage, setInternalPage] = useState(0);
  const [internalRowsPerPage, setInternalRowsPerPage] = useState(initialRowsPerPage);

  const currentPage = isControlled ? controlledPage : internalPage;
  const currentRowsPerPage = isControlled ? controlledRowsPerPage : internalRowsPerPage;
  const totalCount = isControlled ? controlledCount : data.length;

  const handlePageChange = (newPage) => {
    if (isControlled) {
      controlledOnPageChange(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  const handleRowsPerPageChange = (newRowsPerPage) => {
    if (isControlled) {
      controlledOnRowsPerPageChange(newRowsPerPage);
    } else {
      setInternalRowsPerPage(newRowsPerPage);
      setInternalPage(0);
    }
  };

  const displayData = useMemo(() => {
    if (isControlled || !showPagination) {
      return data;
    }
    const startIndex = currentPage * currentRowsPerPage;
    return data.slice(startIndex, startIndex + currentRowsPerPage);
  }, [data, currentPage, currentRowsPerPage, showPagination, isControlled]);

  const handleSelectAllClick = (event) => {
    if (!onSelectedRowsChange) return;
    if (event.target.checked) {
      const allRowIdentifiers = displayData.map(row => row[uniqueRowIdentifier]);
      onSelectedRowsChange(allRowIdentifiers);
    } else {
      onSelectedRowsChange([]);
    }
  };

  const handleRowSelectClick = (rowIdentifier) => {
    if (!onSelectedRowsChange) return;
    const selectedIndex = selectedItems.indexOf(rowIdentifier);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedItems, rowIdentifier);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedItems.slice(1));
    } else if (selectedIndex === selectedItems.length - 1) {
      newSelected = newSelected.concat(selectedItems.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedItems.slice(0, selectedIndex),
        selectedItems.slice(selectedIndex + 1),
      );
    }
    onSelectedRowsChange(newSelected);
  };

  const isRowSelected = (rowIdentifier) => selectedItems.indexOf(rowIdentifier) !== -1;

  const numSelected = selectedItems.length;
  const rowCount = displayData.length;


  if (!columns || columns.length === 0) {
    return <div className="p-4 text-red-500">Table columns are not defined.</div>;
  }

  const showFooter = showPagination && totalCount > 0;

  return (
    <div className="clothlyn-table flex w-full flex-col overflow-hidden rounded-2xl border border-[#E8DFD4] bg-[#EFE7DC] shadow-none">
      <div
        className="min-w-0 overflow-x-auto overflow-y-auto scrollbar bg-[#F9F6F1]"
        style={maxHeight == null ? undefined : { maxHeight }}
      >
        <table
          className={`${tableClassName} w-full min-w-full border-collapse${showFooter ? ' [&_tbody_tr:last-child_td]:border-b-0' : ''}`}
        >
                <thead className={`${theadClassName} sticky top-0 z-10`}>
                  <tr>
                    {selectableRows && (
                      <th scope="col" className={`${thClassName} w-12`}>
                        <input
                          type="checkbox"
                          className="form-checkbox h-5 w-5 text-light-primary border-[#CFC5B9] rounded-sm focus:ring-1 focus:ring-[#C5B396]"
                          indeterminate={numSelected > 0 && numSelected < rowCount}
                          checked={rowCount > 0 && numSelected === rowCount}
                          onChange={handleSelectAllClick}
                          disabled={rowCount === 0}
                        />
                      </th>
                    )}
                    {columns.map((column, columnIndex) => (
                      <th
                        key={column.id || column.accessor || `th-${columnIndex}`}
                        scope="col"
                        className={thClassName}
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={tbodyClassName} key={`page-${currentPage}-${currentRowsPerPage}-${displayData.length}`}>
                  {loading ? (
                    <tr>
                      <td colSpan={selectableRows ? columns.length + 1 : columns.length} className={`${tdClassName} text-center`}>
                        <div className="flex items-center justify-center space-x-2 py-8">
                          <LucideLoader size={24} className="text-light-primary animate-spin" />
                          <span className="text-[#7D766C] font-roboto">Loading data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : displayData.length > 0 ? (
                    displayData.map((row, rowIndex) => {
                      const rowIdentifier =
                        row[uniqueRowIdentifier] ?? row._id ?? row.id ?? rowIndex;
                      const isItemSelected = selectableRows ? isRowSelected(rowIdentifier) : false;
                      const customRowBg =
                        typeof getRowBgClassName === 'function'
                          ? getRowBgClassName(row, rowIndex)
                          : null;
                      const isHighlighted =
                        Boolean(customRowBg) && customRowBg !== false;
                      const highlightClass =
                        typeof customRowBg === 'string'
                          ? customRowBg
                          : 'bg-[#C8D9C4] group-hover:bg-[#B9CEB4]';
                      const cellStripe = isItemSelected
                        ? 'bg-[#EFE7DC] group-hover:bg-[#E8DFD4]'
                        : isHighlighted
                          ? highlightClass
                          : stripePrimary
                          ? rowIndex % 2 === 0
                            ? 'bg-white group-hover:bg-[#F3EEE7]'
                            : 'bg-light-primary/15 group-hover:bg-light-primary/25'
                          : rowIndex % 2 === 0
                            ? 'bg-white group-hover:bg-[#F3EEE7]'
                            : 'bg-[#EFE7DC]/70 group-hover:bg-[#E8DFD4]';
                      return (
                        <motion.tr
                          key={rowIdentifier}
                          className={`group ${onRowClick ? 'cursor-pointer' : ''}`}
                          onClick={() => onRowClick && onRowClick(row)}
                          {...(reduceMotion ? {} : bundleRowTransition(rowIndex))}
                        >
                          {selectableRows && (
                            <td
                              className={`${tdClassName} ${cellStripe}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                className="form-checkbox h-5 w-5 text-light-primary border-[#CFC5B9] rounded-sm focus:ring-1 focus:ring-[#C5B396]"
                                checked={isItemSelected}
                                onChange={() => handleRowSelectClick(rowIdentifier)}
                              />
                            </td>
                          )}
                          {columns.map((column, columnIndex) => (
                            <td
                              key={column.id ? `${column.id}-${rowIndex}` : `${column.accessor || `td-${columnIndex}`}-${rowIndex}`}
                              className={`${tdClassName} ${cellStripe}`}
                            >
                              {column.cell ? column.cell(row) : (column.accessor ? row[column.accessor] : 'N/A')}
                            </td>
                          ))}
                        </motion.tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={selectableRows ? columns.length + 1 : columns.length} className={`${tdClassName} text-center text-[#7D766C]`}>
                        {emptyDataMessage}
                      </td>
                    </tr>
                  )}
                </tbody>
        </table>
      </div>
      {showFooter && (
        <div className="shrink-0 border-t border-[#E8DFD4] bg-[#F9F6F1]">
          <TablePagination
            count={totalCount}
            rowsPerPage={currentRowsPerPage}
            page={currentPage}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={rowsPerPageOptions}
            rowsOnPage={displayData.length}
          />
        </div>
      )}
    </div>
  );
};

export default CommonTable;
