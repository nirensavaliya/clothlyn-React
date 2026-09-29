import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { formatDate, formatRegularText } from '../../helpers/utils';

const formatRupee = (n) =>
  `₹${Math.round(Number(n ?? 0)).toLocaleString('en-IN')}`;

const amountStyle = (tone) => {
  if (tone === 'unpaid') return { color: '#dc2626' }; // red
  if (tone === 'paid') return { color: '#16a34a' }; // green
  if (tone === 'current') return { color: '#2563eb' }; // blue (Pay Salary)
  return undefined;
};

const ViewEmployeeModal = ({
  isOpen,
  onClose,
  employeeData,
  salarySummary = null,
  paidSalaryHistory = [],
  periodWiseSalary = [],
  detailLoading = false,
}) => {
  if (!isOpen || !employeeData) {
    return null;
  }

  const footer = (
    <Button
      onClick={onClose}
      label="Close"
      variant="outline"
      className="font-normal focus:ring-0"
    />
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Employee Details"
      footerContent={footer}
      size="3xl"
    >
      <div className="p-4 max-h-[75vh] overflow-y-auto space-y-6">
        <div className="bg-[#F9F6F1] rounded-xl border  shadow p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            {[
              { label: 'Emp Code', value: formatRegularText(employeeData.employeeCode || employeeData.employeeName) },
              { label: 'First Name', value: formatRegularText(employeeData.firstName || '-') },
              { label: 'Last Name', value: formatRegularText(employeeData.lastName || '-') },
              { label: 'Nickname', value: formatRegularText(employeeData.nickname || '-') },
              { label: 'Joined Date', value: formatDate(employeeData.createdAt || '-') },
              { label: 'Email', value: formatRegularText(employeeData.email || '-') },
              { label: 'Mobile Number', value: formatRegularText(employeeData.mobileNumber || '-') },
              { label: 'Reference Name', value: formatRegularText(employeeData.referenceName || '-') },
              { label: 'Reference Mobile', value: formatRegularText(employeeData.referenceMobileNumber || '-') },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-light-border p-3 bg-gray-50">
                <div className="text-xs text-gray-500 font-medium">{item.label}</div>
                <div className="text-gray-900 font-semibold break-words">{item.value || '—'}</div>
              </div>
            ))}
            <div className="rounded-lg border border-light-border p-3 bg-gray-50 sm:col-span-2">
              <div className="text-xs text-gray-500 font-medium mb-2">Process Name</div>
              <div className="flex flex-wrap gap-2">
            {employeeData.role && Array.isArray(employeeData.role) && employeeData.role.length > 0 ? (
              employeeData.role.map((process, idx) => (
                <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-light-primary/10 text-light-primary">
                  {typeof process === 'object' && process !== null
                    ? (process.processName || process.name || '-')
                    : String(process)}
                </span>
              ))
            ) : (
              <span className="text-gray-500">No process name assigned</span>
            )}
              </div>
            </div>
            <div className="rounded-lg border border-light-border p-3 bg-gray-50 sm:col-span-2">
              <div className="text-xs text-gray-500 font-medium mb-2">Employee Role</div>
              <div className="flex flex-wrap gap-2">
            {employeeData.employeeRole && Array.isArray(employeeData.employeeRole) && employeeData.employeeRole.length > 0 ? (
              employeeData.employeeRole.map((role, idx) => (
                <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {role === 'user' ? 'User' : role === 'employee' ? 'Employee' : role}
                </span>
              ))
            ) : employeeData.employeeRole ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {employeeData.employeeRole === 'user' ? 'User' : employeeData.employeeRole === 'employee' ? 'Employee' : employeeData.employeeRole}
              </span>
            ) : (
              <span className="text-gray-500">No employee role assigned</span>
            )}
              </div>
            </div>
          </div>
        </div>

        {(employeeData.accountNumber ||
          employeeData.ifscCode ||
          employeeData.bankName ||
          employeeData.bankBranchName ||
          employeeData.accountHolderName) && (
          <div className="bg-[#F9F6F1] rounded-xl border shadow p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Bank details</h3>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Account holder', value: formatRegularText(employeeData.accountHolderName) || '—' },
                  { label: 'Account number', value: formatRegularText(employeeData.accountNumber) || '—' },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-light-border bg-gray-50 p-3">
                    <div className="text-xs text-gray-500 font-medium">{item.label}</div>
                    <div className="text-gray-900 font-semibold break-words">{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'IFSC', value: formatRegularText(employeeData.ifscCode) || '—' },
                  { label: 'Bank', value: formatRegularText(employeeData.bankName) || '—' },
                  { label: 'Branch', value: formatRegularText(employeeData.bankBranchName) || '—' },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-light-border bg-gray-50 p-3">
                    <div className="text-xs text-gray-500 font-medium">{item.label}</div>
                    <div className="text-gray-900 font-semibold break-words">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {salarySummary && (
          <div className="bg-[#F9F6F1] rounded-xl border shadow p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Salary summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              {[
                {
                  label: 'Total Remaining',
                  key: 'totalRemainingAmount',
                  tone: 'unpaid',
                  emphasize: true,
                },
                { label: 'Current Period Salary', key: 'currentPeriodSalary' },
                { label: 'Last Period Salary', key: 'lastPeriodSalary' },
                { label: 'Bonus', key: 'bonusPaid', tone: 'paid' },
                { label: 'Upad', key: 'upadPaid', tone: 'paid' },
                { label: 'Salary Paid', key: 'salaryPaid', tone: 'paid' },
              ].map(({ label, key, tone, toneFromValue, emphasize }) => {
                const value = Number(salarySummary[key] ?? 0);
                const resolvedTone = toneFromValue
                  ? value < 0
                    ? 'paid'
                    : 'unpaid'
                  : tone;
                const borderColor =
                  emphasize && resolvedTone === 'paid'
                    ? '#16a34a'
                    : emphasize
                      ? '#dc2626'
                      : undefined;
                return (
                <div
                  key={key}
                  className={`rounded-lg bg-gray-50 p-3 ${emphasize ? '' : 'border border-light-border'}`}
                  style={
                    emphasize
                      ? { border: `2px solid ${borderColor}` }
                      : undefined
                  }
                >
                  <div className="text-xs text-gray-500 font-medium">{label}</div>
                  <div
                    className={`font-semibold tabular-nums ${resolvedTone ? '' : 'text-light-primary'}`}
                    style={amountStyle(resolvedTone)}
                  >
                    {formatRupee(value)}
                  </div>
                </div>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm border-t border-light-border pt-4">
              {[
                { label: 'Total Earning', key: 'totalEarning' },
                { label: 'Total Paid Salary', key: 'totalPaidSalary', tone: 'paid' },
                {
                  label: 'Pay Salary',
                  key: 'paySalary',
                  tone: 'current',
                },
              ].map(({ label, key, tone }) => (
                <div
                  key={`footer-${key}`}
                  className="rounded-lg bg-gray-50 p-3 border border-light-border"
                >
                  <div className="text-xs text-gray-500 font-medium">{label}</div>
                  <div
                    className={`font-semibold tabular-nums ${tone ? '' : 'text-light-primary'}`}
                    style={amountStyle(tone)}
                  >
                    {formatRupee(salarySummary[key])}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {detailLoading && (!Array.isArray(periodWiseSalary) || periodWiseSalary.length === 0) && (
          <div className="bg-[#F9F6F1] rounded-xl border shadow p-4 text-sm text-gray-500">
            Loading period-wise salary…
          </div>
        )}

        {Array.isArray(periodWiseSalary) && periodWiseSalary.length > 0 && (
          <div className="bg-[#F9F6F1] rounded-xl border shadow p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Period-wise salary</h3>
            <div className="overflow-x-auto rounded-md border border-light-border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Period</th>
                    <th className="px-3 py-2 text-left font-semibold">Status</th>
                    <th className="px-3 py-2 text-right font-semibold">Earned</th>
                    <th className="px-3 py-2 text-right font-semibold">Bonus</th>
                    <th className="px-3 py-2 text-right font-semibold">Paid</th>
                    <th className="px-3 py-2 text-right font-semibold">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {periodWiseSalary.map((row, idx) => (
                    <tr
                      key={row?.key || idx}
                      className={idx % 2 === 0 ? 'bg-[#F9F6F1]' : 'bg-light-primary/10'}
                    >
                      <td className="px-3 py-2 text-left tabular-nums whitespace-nowrap">
                        {row?.label || '—'}
                      </td>
                      <td className="px-3 py-2 text-left">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                          style={
                            row?.status === 'current'
                              ? { background: '#dbeafe', color: '#1d4ed8' }
                              : row?.status === 'lastClosed'
                                ? { background: '#fef3c7', color: '#b45309' }
                                : { background: '#f3f4f6', color: '#4b5563' }
                          }
                        >
                          {row?.statusLabel || 'Past'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">
                        {formatRupee(row?.earned)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatRupee(row?.bonus)}
                      </td>
                      <td
                        className="px-3 py-2 text-right font-semibold tabular-nums"
                        style={amountStyle('paid')}
                      >
                        {formatRupee(row?.paid)}
                      </td>
                      <td
                        className="px-3 py-2 text-right font-semibold tabular-nums"
                        style={amountStyle(Number(row?.balance) >= 0 ? 'unpaid' : 'paid')}
                      >
                        {formatRupee(row?.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Half-month: 1–15 / 16–end. Full-month: 1st → 1st. Each row Balance =
              Earned + Bonus − Paid (plus previous Balance). Open Bonus/Upad (after
              last Salary) go to Pay. When you record Salary, that Bonus settles on
              the period before that Salary (not dumped into older Past). Pay Salary
              = Last Period + Bonus − Salary − Upad. Total Remaining = Pay + Current.
            </p>
          </div>
        )}

        <div className="bg-[#F9F6F1] rounded-xl border shadow p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Paid salary history</h3>
          {detailLoading && (!Array.isArray(paidSalaryHistory) || paidSalaryHistory.length === 0) ? (
            <p className="text-sm text-gray-500">Loading paid salary history…</p>
          ) : (
          <div className="overflow-x-auto rounded-md border border-light-border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="w-1/3 px-4 py-2 text-left font-semibold">Date</th>
                  <th className="w-1/3 px-4 py-2 text-left font-semibold">Type</th>
                  <th className="w-1/3 px-4 py-2 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(paidSalaryHistory) && paidSalaryHistory.length > 0 ? (
                  paidSalaryHistory.map((item, idx) => (
                    <tr key={item?._id || idx} className={idx % 2 === 0 ? 'bg-[#F9F6F1]' : 'bg-light-primary/10'}>
                      <td className="px-4 py-2 text-left tabular-nums">
                        {formatDate(item?.recordedAt || item?.createdAt || item?.updatedAt, 'DD/MM/YYYY')}
                      </td>
                      <td className="px-4 py-2 text-left">{item?.typeLabel || (item?.isUpad ? 'Upad' : 'Salary')}</td>
                      <td className="px-4 py-2 text-right font-semibold tabular-nums" style={{ color: '#16a34a' }}>{formatRupee(item?.paid)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-3 py-3 text-center text-gray-500" colSpan={3}>
                      No paid salary history found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ViewEmployeeModal;