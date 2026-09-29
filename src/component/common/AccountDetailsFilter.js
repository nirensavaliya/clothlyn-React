import React, { useState, useRef, useEffect } from 'react';
import { LucideFilter, LucideX, LucideCalendar } from 'lucide-react';
import moment from 'moment';
import Button from './Button';
import InputElement from './InputElement';
import SelectElement from './Select';

const AccountDetailsFilter = ({
  isOpen,
  onClose,
  onApplyFilter,
  onClearFilter,
  appliedFilters,
  tempFilters,
  onTempFilterChange,
  employeeCodeOptions = [],
  nickNameOptions = [],
  processRoleOptions = []
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
    if (appliedFilters.employeeCode) count++;
    if (appliedFilters.nickName) count++;
    if (appliedFilters.processRole) count++;
    if (appliedFilters.startDate || appliedFilters.endDate) count++;
    return count;
  };

  const handleDateChange = (field, value) => {
    const formattedDate = value ? moment(value).format('YYYY-MM-DD') : null;
    onTempFilterChange(field, formattedDate);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-96 max-sm:w-auto rounded-lg bg-light-white shadow-lg border border-light-natural_200 z-50 max-h-[35rem] flex flex-col">
      <div className="p-4 overflow-y-auto flex-1">
        <div className="space-y-4">
          {/* Emp Code Filter */}
          <div>
            <SelectElement
              name="Emp Code"
              options={employeeCodeOptions}
              value={tempFilters.employeeCode}
              onChange={(value) => onTempFilterChange('employeeCode', value)}
              placeholder="Select employee code"
              isClearable={true}
              isMulti={false}
              className="w-full"
              menuPortalTarget={document.body}
            />
          </div>

          {/* Nick Name Filter */}
          <div className="pt-3 border-t border-light-natural_100">
            <SelectElement
              name="Nick Name"
              options={nickNameOptions}
              value={tempFilters.nickName}
              onChange={(value) => onTempFilterChange('nickName', value)}
              placeholder="Select nick name"
              isClearable={true}
              isMulti={false}
              className="w-full"
              menuPortalTarget={document.body}
            />
          </div>

          {/* Process Role Filter */}
          <div className="pt-3 border-t border-light-natural_100">
<SelectElement
  name="Emp Code"
  options={employeeCodeOptions}
  value={
    employeeCodeOptions.find((opt) => opt.value === tempFilters.employeeCode) ||
    null
  }
  onChange={(opt) => onTempFilterChange("employeeCode", opt?.value)}
  placeholder="Select employee code"
  isClearable
  isMulti={false}
  className="w-full"
  menuPortalTarget={document.body}
/>


          </div>

          {/* Date Range Filter */}
          <div className="pt-3 border-t border-light-natural_100">
            <div className="text-light-darkGrey text-sm font-semibold mb-2 text-left">
              Date Range
            </div>
            <div className="grid grid-cols-2 gap-2">
                <InputElement
                  type="date"
                  name={'Start Date'}
                  placeholder="Start Date"
                  value={tempFilters.startDate || ''}
                  onChange={(value) => handleDateChange('startDate', value)}
                  variant="size_44"
                  className="w-full"
                  is_required={false}
                  extra_text_before={<LucideCalendar size={20} className="text-light-lightGrey" />}
                />
                <InputElement
                  type="date"
                  name={'End Date'}
                  placeholder="End Date"
                  value={tempFilters.endDate || ''}
                  onChange={(value) => handleDateChange('endDate', value)}
                  variant="size_44"
                  className="w-full"
                  is_required={false}
                  extra_text_before={<LucideCalendar size={20} className="text-light-lightGrey" />}
                />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-light-natural_200 bg-light-white sticky bottom-0">
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="medium"
            label="Clear"
            onClick={handleClearFilter}
            className="flex-1 text-light-natural_700 hover:bg-light-natural_50"
          />
          <Button
            variant="primary"
            size="medium"
            label="Apply"
            onClick={handleApplyFilter}
            className="flex-1 shadow-none font-normal !rounded-md px-4 py-2 text-light-white transition-colors duration-200 focus:ring-0"
          />
        </div>
      </div>
    </div>
  );
};

export default AccountDetailsFilter;
