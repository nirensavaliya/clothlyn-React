import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { LucideSearch, LucideLoader } from 'lucide-react';
import CommonTable from '../component/common/Table/Table';
import InputElement from '../component/common/InputElement';
import usePageTitle from '../hooks/usePageTitle';
import { getDesignByNumberDetails } from '../apis/designApi';

const DesignReport = () => {
  
  const [searchParams] = useSearchParams();
  const [designNumber, setDesignNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [designData, setDesignData] = useState([]);
  const [searchPerformed, setSearchPerformed] = useState(false); 
  usePageTitle('Product Report');


 const fetchDesigneDetails = async (dNo) => {
  const targetDno = (dNo ?? '').trim();
  if (!targetDno) return;
  setIsLoading(true);
  try {
    const response = await getDesignByNumberDetails(targetDno);
    const allDesignes = response?.data?.lots || response || [];
    setDesignData(allDesignes);
    setSearchPerformed(true);
    if (!Array.isArray(allDesignes) || allDesignes.length === 0) {
      toast.info('No data found for this design number');
    }
  } catch (err) {
    console.error(err);
    toast.error('Failed to load product report');
  } finally {
    setIsLoading(false);
  }
};

const handleSearch = (searchValue = null) => {
  const searchDesignNumber = (searchValue || designNumber || '').trim();    
  if (!searchDesignNumber) {
    if (!searchValue) {
      toast.error('Please enter a design number');
    }
    return;
  }
  fetchDesigneDetails(searchDesignNumber);
};



  useEffect(() => {
    const urlDesignNumber = searchParams.get('dNo');
    if (urlDesignNumber) {
      setDesignNumber(urlDesignNumber);
      fetchDesigneDetails(urlDesignNumber);
    }
  }, [searchParams]);

  const columns = [
    {
      header: 'Color',
      accessor: 'color',
      cell: (row) => row.color || row.colour || '-',
    },
    {
      header: 'Size',
      accessor: 'size',
      cell: (row) => row.size || '-',
    },
    {
      header: 'For Thread',
      accessor: 'forThread',
      cell: (row) => row.forThread || '-',
    },
    {
      header: 'RC PIC',
      accessor: 'rcPic',
      cell: (row) => row.rcPic || '-',
    },
    {
      header: 'Doracut',
      accessor: 'doraCut',
      cell: (row) => row.doraCut || '-',
    },
    {
      header: 'Doracut RECIVE',
      accessor: 'doracutReceive',
      cell: (row) => row.doracutReceive || '-',
    },
    {
      header: 'Press',
      accessor: 'press',
      cell: (row) => row.press || '-',
    },
    {
      header: 'Packing',
      accessor: 'packing',
      cell: (row) => row.packing || '-',
    },
    {
      header: 'Bill scan',
      accessor: 'billScan',
      cell: (row) => row.billScan || '-',
    },
    {
      header: 'Total',
      accessor: 'total',
      cell: (row) => (
        <span className="font-semibold text-blue-600">
          {row.total || '-'}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-light-darkGrey font-roboto cursor-default mb-4 text-start">Product Report</h1>
        <div className="mb-6">
          <InputElement
            type="text"
            placeholder="Search Design Number (e.g., Y-102)..."
            value={designNumber}
            onChange={(value) => {
              setDesignNumber(value);
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            variant="size_44"
            className="w-full"
            is_required={false}
            extra_text_before={
              isLoading ? (
                <LucideLoader size={20} className="text-light-primary animate-spin" />
              ) : (
                <LucideSearch size={20} className="text-light-lightGrey" />
              )
            }
          />
        </div>
      </div>

      {searchPerformed && (
        <div className="w-full">
          {designData.length > 0 ? (
            <CommonTable
              data={designData}
              columns={columns}
              isLoading={isLoading}
              emptyMessage="No data found for this design number"
              tableClassName="min-w-full divide-y divide-gray-200"
            />
          ) : (
            <div className="p-8 text-center text-gray-500">
              No data available for the searched design number
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DesignReport;