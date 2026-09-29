import React, { useState, useRef, useEffect } from 'react';
import { LucideFilter, LucideX } from 'lucide-react';
import Button from './Button';
import InputElement from './InputElement';
import SelectElement from './Select';

const SalaryReportFilter = ({
  isOpen,
  onClose,
  onApplyFilter,
  onClearFilter,
  appliedFilters,
  tempFilters,
  onTempFilterChange,
  employeeOptions = [],
  lotNoOptions = [],
  dNoOptions = [],
  picOptions = [],
  filterOptionsLoading = false,
  statusOptions = [],
  sizeOptions = [],
  colorOptions = []
}) => {
  const filterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleApplyFilter = () => {
    onApplyFilter(tempFilters);
  };

  const handleClearFilter = () => {
    onClearFilter();
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (appliedFilters.employeeName) count++;
    if (appliedFilters.lotNo) count++;
    if (appliedFilters.dNo) count++;
    if (appliedFilters.pic) count++;
    if (appliedFilters.startDate) count++;
    if (appliedFilters.endDate) count++;
    if (appliedFilters.status) count++;
    if (appliedFilters.size) count++;
    if (appliedFilters.color) count++;
    return count;
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-80 rounded-lg bg-light-white shadow-lg border max-sm:w-all border-light-natural_200 z-50 max-h-[35rem] flex flex-col" ref={filterRef}>
      <div className="p-4 overflow-y-auto flex-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-light-darkGrey">Filter Options</h3>
          <button
            onClick={onClose}
            className="text-light-lightGrey hover:text-light-darkGrey transition-colors"
          >
            <LucideX size={20} />
          </button>
        </div>

        <div className="space-y-4">
          
          {/* Emp Name filter */}
          <div>
            <SelectElement
              name="Emp Name"
              options={employeeOptions.length > 0 ? employeeOptions : []}
              value={tempFilters.employeeName}
              onChange={(value) => onTempFilterChange('employeeName', value)}
              placeholder={(employeeOptions.length > 0 ? "Select employee name" : "No employees available")}
              isClearable={true}
              isMulti={false}
              className="w-full"
              menuPortalTarget={document.body}
              isDisabled={employeeOptions.length === 0 }
            />
          </div>

          {/* Lot No Filter - Only show if options provided */}
          {lotNoOptions.length > 0 && (
            <div>
              <SelectElement
                name="Lot No"
                options={lotNoOptions}
                value={tempFilters.lotNo}
                onChange={(value) => onTempFilterChange('lotNo', value)}
                placeholder="Select lot number"
                isClearable={true}
                isMulti={false}
                className="w-full"
                menuPortalTarget={document.body}
              />
            </div>
          )}

          {/* D No Filter */}
          <div>
            <SelectElement
              name="D No"
              options={dNoOptions.length > 0 ? dNoOptions : []}
              value={tempFilters.dNo}
              onChange={(value) => onTempFilterChange('dNo', value)}
              placeholder={(dNoOptions.length > 0 ? "Select D number" : "No D numbers available")}
              isClearable={true}
              isMulti={false}
              className="w-full"
              menuPortalTarget={document.body}
              isDisabled={dNoOptions.length === 0}
            />
          </div>

          {/* Status Filter - New */}
          {statusOptions.length > 0 && (
            <div>
              <SelectElement
                name="Status"
                options={statusOptions}
                value={tempFilters.status}
                onChange={(value) => onTempFilterChange('status', value)}
                placeholder="Select Status"
                isClearable={true}
                isMulti={false}
                className="w-full"
                menuPortalTarget={document.body}
              />
            </div>
          )}

          {/* Size Filter - New */}
          {sizeOptions.length > 0 && (
            <div>
              <SelectElement
                name="Size"
                options={sizeOptions}
                value={tempFilters.size}
                onChange={(value) => onTempFilterChange('size', value)}
                placeholder="Select Size"
                isClearable={true}
                isMulti={false}
                className="w-full"
                menuPortalTarget={document.body}
              />
            </div>
          )}

          {/* Color Filter - New */}
          {colorOptions.length > 0 && (
            <div>
              <SelectElement
                name="Color"
                options={colorOptions}
                value={tempFilters.color}
                onChange={(value) => onTempFilterChange('color', value)}
                placeholder="Select Color"
                isClearable={true}
                isMulti={false}
                className="w-full"
                menuPortalTarget={document.body}
              />
            </div>
          )}

          {/* Pic Filter - Only show if options provided */}
          {picOptions.length > 0 && (
            <div>
              <SelectElement
                name="Pic"
                options={picOptions}
                value={tempFilters.pic}
                onChange={(value) => onTempFilterChange('pic', value)}
                placeholder="Select pic"
                isClearable={true}
                isMulti={false}
                className="w-full"
                menuPortalTarget={document.body}
              />
            </div>
          )}

          {/* Date Range Filter - 2 Column Grid */}
          <div>
            <label className="block text-sm font-semibold text-left text-light-darkGrey mb-2">Date Range</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-left">
                <InputElement
                  type="date"
                  name="startDate"
                  value={tempFilters?.startDate || ''}
                  onChange={(value) => onTempFilterChange('startDate', value)}
                  placeholder="Start Date"
                  className="w-full text-left"
                />
              </div>
              <div className="text-left">
                <InputElement
                  type="date"
                  name="endDate"
                  value={tempFilters?.endDate || ''}
                  onChange={(value) => onTempFilterChange('endDate', value)}
                  placeholder="End Date"
                  className="w-full text-left"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-light-natural_200 bg-light-gray_50">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="medium"
            label="Clear All"
            onClick={handleClearFilter}
            className="flex-1"
          />
          <Button
            variant="primary"
            size="medium"
            label="Apply Filter"
            onClick={handleApplyFilter}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
};

export default SalaryReportFilter;