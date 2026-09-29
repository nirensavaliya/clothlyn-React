import React from 'react';

const Button = ({ onClick, disabled, children, ...props }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    type="button"
    className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg border border-[#E8DFD4] bg-[#F9F6F1] text-sm text-[#4C463D] transition-colors ${
      disabled
        ? 'cursor-not-allowed bg-[#EFE7DC] text-[#C4BBB0]'
        : 'hover:bg-[#EFE7DC] hover:text-[#0B1C30]'
    }`}
    {...props}
  >
    {children}
  </button>
);

const TablePagination = ({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [25, 50, 75, 100, 150],
  /** Actual rows rendered this page (for accurate "x–y of z" when API/page size differs). */
  rowsOnPage,
}) => {
  const handleRowsPerPageChange = (event) => {
    onRowsPerPageChange(parseInt(event.target.value, 10));
  };

  const handleBackButtonClick = () => {
    onPageChange(page - 1);
  };

  const handleNextButtonClick = () => {
    onPageChange(page + 1);
  };

  const from = count === 0 ? 0 : page * rowsPerPage + 1;
  const to =
    count === 0
      ? 0
      : typeof rowsOnPage === "number" && rowsOnPage >= 0
        ? Math.min(count, from + rowsOnPage - 1)
        : Math.min(count, (page + 1) * rowsPerPage);

  return (
    <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 px-4 py-3 text-sm text-[#4C463D]">
      <div className="flex items-center gap-2">
        <span className="text-[#7D766C]">Rows per page:</span>
        <select
          value={rowsPerPage}
          onChange={handleRowsPerPageChange}
          className="h-8 rounded-lg border border-[#E8DFD4] bg-[#F9F6F1] px-2 text-sm text-[#4C463D] focus:border-[#7D766C] focus:outline-none focus:ring-1 focus:ring-[#C5B396]"
          aria-label="Rows per page"
        >
          {rowsPerPageOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="text-[#7D766C]">
        {from}–{to} of {count}
      </div>
      <div className="flex items-center gap-1">
        <Button
          onClick={handleBackButtonClick}
          disabled={page === 0}
          aria-label="Previous page"
        >
          &lt;
        </Button>
        <Button
          onClick={handleNextButtonClick}
          disabled={page >= Math.ceil(count / rowsPerPage) - 1}
          aria-label="Next page"
        >
          &gt;
        </Button>
      </div>
    </div>
  );
};

export default TablePagination;
