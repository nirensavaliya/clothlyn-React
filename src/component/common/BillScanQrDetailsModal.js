import { getAuthToken } from '../../utils/authToken';
import React, { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import SelectElement from './Select';
import Button from './Button';
import { getCompanies } from '../../apis/companiesApi';
import { jwtDecode } from 'jwt-decode';
import LoaderComponent from './Loader';

const BillScanQrDetailsModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  fields = {},
  onFieldChange,
  size = 'md',
}) => {
  const barcodeObj = useMemo(() => {
    const v = fields?.barcodeValue;
    if (!v) return null;
    if (typeof v === 'string') {
      try {
        return JSON.parse(v);
      } catch (e) {
        return null;
      }
    }
    return v;
  }, [fields?.barcodeValue]);

  // Companies for dropdown
  const [companies, setCompanies] = useState([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [companyError, setCompanyError] = useState('');

     const {
  rcDetails = {},
} = fields || {};

const { rcPic = 0, alter = 0, reject = 0 } = rcDetails;

  useEffect(() => {
    if (isOpen) {
      // Fetch companies
      setIsLoadingCompanies(true);
      getCompanies({ limit: 1000, isActive: true })
        .then(res => {
          const companiesList = res.data || res.items || [];
          setCompanies(companiesList);
        })
        .catch(error => {
          console.error("Error fetching companies:", error);
          setCompanies([]);
        })
        .finally(() => {
          setIsLoadingCompanies(false);
      });
    }
  }, [isOpen]);

 const handleBillSubmit = () => {
  if (isLoading) return;

  // Validate company field
  if (!fields.company) {
    setCompanyError('Company is required');
    return;
  }
  setCompanyError('');

  // Get current user ID
  let userId = '';
  try {
    const token = getAuthToken();
    const storedUser = JSON.parse(localStorage.getItem('user'));
    
    if (token) {
      const decoded = jwtDecode(JSON.parse(token));
      userId = decoded?.id || storedUser?._id || storedUser?.data?._id || '';
    }
  } catch (error) {
    console.error('Error getting user ID:', error);
  }

  const payload = {
    pic: fields?.pic || barcodeObj?.pic || "",
    alter: fields?.alter ?? alter ?? "",
    reject: fields?.reject ?? reject ?? "",
    totalPic: fields?.totalPic || "",
    lotNo: fields?.lotNo || barcodeObj?.lotNo || "",
    dNo: fields?.dNo || barcodeObj?.dNo || "",
    size: fields?.size || barcodeObj?.size || "",
    color: fields?.color || fields?.colour || barcodeObj?.color || barcodeObj?.colour || "",
    sortingPic: "", // Removed from UI, sending empty
    billScan: userId, // Use current user ID instead of selection
    status: "", // Removed from UI, sending empty
    dashboardDataId: fields?.id || barcodeObj?.id || "",
    company: fields.company,
  };

  
  onSubmit(payload);
};


  const footerContent = (
    <div className="flex gap-3 justify-end">
      <Button
        type="button"
        variant="default"
        label="Cancel"
        onClick={onClose}
        disabled={isLoading}
      />
      <Button
        type="button"
        variant="primary"
        label={isLoading ? 'Save...' : 'Save'}
        onClick={handleBillSubmit}
        disabled={isLoading}
        loading={isLoading}
      />
    </div>
  );

  return (
    <>
      {isLoading && <LoaderComponent size={56} />}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Qr Details"
        footerContent={footerContent}
        size={size}
      >
      <div className="p-4 space-y-3">
        <div className="text-base font-semibold flex text-center">BILLSCAN</div>
        <div className="mb-4 bg-light-white/80 text-left">

        
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
  <div className="mb-1"><span className="text-sm font-semibold">Lot No:</span> {barcodeObj?.lotNo || fields.lotNo || '1613B'}</div>
          <div className="mb-1"><span className="text-sm font-semibold">D No:</span> {barcodeObj?.dNo || fields.dNo || 'Y-2'}</div>
          <div className="mb-1"><span className="text-sm font-semibold">Total Pcs:</span> {barcodeObj?.pic || fields.pic || fields.totalPic || '-'}</div>
          <div className="mb-1">
            <span className="text-sm font-semibold">RC Pcs:</span>{' '}
            <span style={{ color: rcPic === Number(barcodeObj?.pic || fields.pic || fields.totalPic) ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
              {rcPic ?? '-'}
            </span>
          </div>
          <div className="mb-1">
            <span className="text-sm font-semibold">Alter:</span>{' '}
            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
              {alter ?? '-'}
            </span>
          </div>
          <div className="mb-1">
            <span className="text-sm font-semibold">Reject:</span>{' '}
            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
              {reject ?? '-'}
            </span>
          </div>
          <div className="mb-1"><span className="text-sm font-semibold">Size:</span> {barcodeObj?.size ||  fields.size || 'M'}</div>
          <div className="mb-1"><span className="text-sm font-semibold">Color:</span> {barcodeObj?.colour || barcodeObj?.color || fields.colour || fields.color || 'A-Blue'}</div>
          
        </div>
        
          <div className="mt-3">
            <SelectElement
              name="Company"
              options={companies.map(company => ({
                value: company._id,
                label: company.name
              }))}
              value={fields.company || null}
              onChange={(val) => {
                onFieldChange("company", val);
                if (companyError) setCompanyError('');
              }}
              placeholder="Select Company"
              isClearable={false}
              is_required={true}
              className="w-full mb-2"
              isMulti={false}
              menuPortalTarget={document.body}
              isLoading={isLoadingCompanies}
              error={companyError}
            />
          </div>
        </div>
      </div>
    </Modal>
    </>
  );
};

export default BillScanQrDetailsModal;