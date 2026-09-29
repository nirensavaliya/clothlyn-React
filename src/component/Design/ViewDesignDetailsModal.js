import React, { useState, useMemo } from 'react';
import Button from '../common/Button';
import { formatDate } from '../../helpers/utils';
import { LucideSearch, LucideLoader } from 'lucide-react';

const ViewDesignDetailsModal = ({ designItem, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const getProcessName = (processEntry) => {
    if (processEntry.processName) {
      return processEntry.processName;
    }
    return 'Unknown Process';
  };

  const allProcesses = designItem?.processes || [];
  const currentProcesses = designItem?.currentProcesses || [];

  const filteredCurrentProcesses = useMemo(() => {
    if (!searchQuery.trim()) return currentProcesses;
    
    return currentProcesses.filter(process => {
      const processName = getProcessName(process).toLowerCase();
      const price = process.price?.toString() || '';
      const startDate = process.startDate ? formatDate(process.startDate).toLowerCase() : '';
      const endDate = process.endDate ? formatDate(process.endDate).toLowerCase() : '';
      const oldRate = process.oldRate?.toString() || '';
      
      const searchTerm = searchQuery.toLowerCase();
      
      return processName.includes(searchTerm) ||
             price.includes(searchTerm) ||
             startDate.includes(searchTerm) ||
             endDate.includes(searchTerm) ||
             oldRate.includes(searchTerm);
    });
  }, [currentProcesses, searchQuery]);

  const filteredAllProcesses = useMemo(() => {
    if (!searchQuery.trim()) return allProcesses;
    
    return allProcesses.filter(process => {
      const processName = getProcessName(process).toLowerCase();
      const price = process.price?.toString() || '';
      const startDate = process.startDate ? formatDate(process.startDate).toLowerCase() : '';
      const endDate = process.endDate ? formatDate(process.endDate).toLowerCase() : '';
      const oldRate = process.oldRate?.toString() || '';
      const status = (process.isActive ? 'active' : 'inactive');
      
      const searchTerm = searchQuery.toLowerCase();
      
      return processName.includes(searchTerm) ||
             price.includes(searchTerm) ||
             startDate.includes(searchTerm) ||
             endDate.includes(searchTerm) ||
             oldRate.includes(searchTerm) ||
             status.includes(searchTerm);
    });
  }, [allProcesses, searchQuery]);

  const handleSearch = (value) => {
    setSearchQuery(value);
    if (value.trim()) {
      setIsSearching(true);
      setTimeout(() => setIsSearching(false), 300);
    } else {
      setIsSearching(false);
    }
  };

  if (!designItem) {
    return null;
  }

  return (
    <div className="p-6 bg-gray-50">
      <h3 className="text-2xl font-bold mb-6 text-gray-800 pb-3 text-left">
        Design: {designItem.designNumber || 'N/A'}
      </h3>

      <div className="mb-6 space-y-3 bg-[#F9F6F1] p-4 rounded-lg shadow flex justify-between items-center">
        <div className='!m-0'>
          <span className="font-semibold text-gray-700 text-left">Design Number:</span>
          <span className="ml-2 text-gray-900">{designItem.designNumber || 'N/A'}</span>
        </div>
        <div className='!m-0'>
          <span className="font-semibold text-gray-700">Date Created:</span>
          <span className="ml-2 text-gray-900">{designItem.createdAt ? formatDate(designItem.createdAt) : 'N/A'}</span>
        </div>
        {designItem.description && (
          <div className='!m-0'>
            <span className="font-semibold text-gray-700">Description:</span>
            <span className="ml-2 text-gray-900">{designItem.description}</span>
          </div>
        )}
        {designItem.status && (
          <div className='!m-0'>
            <span className="font-semibold text-gray-700">Status:</span>
            <span className="ml-2 text-gray-900 capitalize">{designItem.status}</span>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder={isSearching ? "Searching processes..." : "Search processes by name, rate, or date..."}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isSearching ? (
              <LucideLoader size={20} className="text-blue-500 animate-spin" />
            ) : (
              <LucideSearch size={20} className="text-gray-400" />
            )}
          </div>
        </div>
        {searchQuery && (
          <div className="mt-2 text-sm text-gray-600">
            Found {filteredCurrentProcesses.length} active processes and {filteredAllProcesses.length} total processes matching "{searchQuery}"
          </div>
        )}
      </div>

      <div className="mb-6">
        <h4 className="text-xl font-semibold mb-4 text-gray-700">
          Current Active Processes {searchQuery && `(${filteredCurrentProcesses.length} found)`}:
        </h4>
        {filteredCurrentProcesses.length > 0 ? (
          <div className="space-y-4 max-h-80 overflow-y-auto pr-2 bg-[#F9F6F1] p-4 rounded-lg shadow">
            {filteredCurrentProcesses.map((p, index) => (
              <div key={p._id || index} className={`p-4 border rounded-lg shadow-sm transition-shadow ${p.isCurrentlyActive ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'} hover:shadow-md`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-lg font-semibold text-indigo-700">
                    {getProcessName(p)}
                  </p>
                  {p.isCurrentlyActive && (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm mb-2">
                  <div>
                    <span className="font-medium text-gray-600">Current Rate:</span>
                    <span className="ml-1 text-gray-800">{p.price ? `₹${p.price}` : 'Not specified'}</span>
                  </div>
                  {(p.startDate || p.endDate) && (
                    <div>
                      <span className="font-medium text-gray-600">Effective Period:</span>
                      <span className="ml-1 text-gray-800">
                        {p.startDate ? formatDate(p.startDate) : 'N/A'}
                        {p.endDate ? ` - ${formatDate(p.endDate)}` : (p.startDate ? ' onwards' : '')}
                      </span>
                    </div>
                  )}
                  {p.oldRate && (
                    <div>
                      <span className="font-medium text-gray-600">Previous Rate:</span>
                      <span className="ml-1 text-gray-800">₹{p.oldRate}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : searchQuery ? (
          <div className="text-center py-10 bg-[#F9F6F1] p-6 rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No Active Processes Found</h3>
            <p className="mt-1 text-sm text-gray-500">No active processes match your search "{searchQuery}"</p>
          </div>
        ) : (
          <div className="text-center py-10 bg-[#F9F6F1] p-6 rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No Active Processes</h3>
            <p className="mt-1 text-sm text-gray-500">No currently active processes found for this design.</p>
          </div>
        )}
      </div>

      {allProcesses.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xl font-semibold mb-4 text-gray-700">
            All Processes History {searchQuery && `(${filteredAllProcesses.length} found)`}:
          </h4>
          {filteredAllProcesses.length > 0 ? (
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2 bg-[#F9F6F1] p-4 rounded-lg shadow">
              {filteredAllProcesses.map((p, index) => (
                <div key={p._id || index} className="p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50 hover:shadow-md transition-shadow">
                  <p className="text-lg font-semibold text-indigo-700 mb-2">
                    {getProcessName(p)}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm mb-2">
                    <div>
                      <span className="font-medium text-gray-600">Rate:</span>
                      <span className="ml-1 text-gray-800">{p.price ? `₹${p.price}` : 'Not specified'}</span>
                    </div>
                    {(p.startDate || p.endDate) && (
                      <div>
                        <span className="font-medium text-gray-600">Period:</span>
                        <span className="ml-1 text-gray-800">
                          {p.startDate ? formatDate(p.startDate) : 'N/A'}
                          {p.endDate ? ` - ${formatDate(p.endDate)}` : (p.startDate ? ' onwards' : '')}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-600">Status:</span>
                      <span className={`ml-1 px-2 py-1 text-xs font-medium rounded-full ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {p.oldRate && (
                      <div>
                        <span className="font-medium text-gray-600">Previous Rate:</span>
                        <span className="ml-1 text-gray-800">₹{p.oldRate}</span>
                      </div>
                    )}
                  </div>
                  {p.createdAt && (
                    <div className="text-xs text-gray-500 mt-2">
                      Created: {formatDate(p.createdAt)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-10 bg-[#F9F6F1] p-6 rounded-lg shadow">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No Processes Found</h3>
              <p className="mt-1 text-sm text-gray-500">No processes match your search "{searchQuery}"</p>
            </div>
          ) : null}
        </div>
      )}

      <div className="mt-8 pt-5 border-t border-gray-200 flex justify-end">
        <Button
          variant="outline"
          onClick={onClose}
          label="Close"
          className="focus:!ring-0"
        />
      </div>
    </div>
  );
};

export default ViewDesignDetailsModal;