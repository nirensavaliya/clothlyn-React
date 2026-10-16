import React, { useCallback, useEffect, useState } from "react";
import { LucideRefreshCw, LucideSearch } from "lucide-react";
import Button from "../common/Button";
import InputElement from "../common/InputElement";
import LoaderComponent from "../common/Loader";
import { listOtpLogs } from "../../apis/superAdminApi";

const PAGE_SIZE = 50;
const AUTO_REFRESH_MS = 15000;

const cardClass =
  "bg-[#F9F6F1] rounded-2xl border border-[#E8DFD4] shadow-[0_8px_24px_-12px_rgba(75,68,58,0.18)]";
const thClass = "px-3 py-2 text-left font-semibold text-[11px] uppercase tracking-wider text-[#0B1C30] whitespace-nowrap";
const tdClass = "px-3 py-2 text-left text-[13px] leading-tight text-[#4C463D] whitespace-nowrap";
const btnClass =
  "!bg-[#7D766C] hover:!bg-[#6A645C] !text-white !rounded-xl focus:!ring-[#C5B396]";

const STATUS_STYLES = {
  active: "bg-[#E8F0E6] text-[#3D5C3A]",
  used: "bg-[#E6ECF5] text-[#1E3A8A]",
  replaced: "bg-[#FDF0DF] text-[#B45309]",
  expired: "bg-[#F5E8E6] text-[#8B3A32]",
};
const STATUS_LABELS = {
  active: "Active",
  used: "Used",
  replaced: "Replaced",
  expired: "Expired",
};
const LOGIN_TYPE_LABELS = {
  admin: "Admin",
  employee: "Employee",
  superadmin: "Super Admin",
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

const formatRemaining = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const OtpLogs = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [now, setNow] = useState(Date.now());

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      try {
        const res = await listOtpLogs({ page, limit: PAGE_SIZE, search: appliedSearch });
        setRows(res?.data || []);
        setPagination({
          total: res?.pagination?.total || 0,
          totalPages: Math.max(res?.pagination?.totalPages || 1, 1),
        });
      } catch (error) {
        console.error(error);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [page, appliedSearch]
  );

  useEffect(() => {
    load();
    const id = setInterval(() => load({ silent: true }), AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setAppliedSearch(search.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const rowStatus = (row) => {
    if (row.status === "active" && new Date(row.expiresAt).getTime() <= now) return "expired";
    return row.status || "expired";
  };

  return (
    <div className="space-y-4">
      <div className={`${cardClass} p-4 flex flex-wrap items-end gap-3`}>
        <div className="flex-1 min-w-[240px]">
          <InputElement
            name="Search"
            value={search}
            onChange={(v) => setSearch(v)}
            placeholder="Phone, name or client code"
            is_required={false}
            extra_text_before={<LucideSearch size={18} className="text-light-lightGrey" />}
          />
        </div>
        <Button
          label="Refresh"
          icon={<LucideRefreshCw size={16} />}
          onClick={() => load()}
          disabled={loading}
          className={`${btnClass} flex items-center gap-2 !py-2.5 !px-4`}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoaderComponent size={48} />
        </div>
      ) : (
        <div className={`${cardClass} overflow-x-auto`}>
          <table className="min-w-full text-sm">
            <thead className="bg-[#EFE7DC] border-b border-[#E8DFD4]">
              <tr className="text-left">
                <th className={thClass}>#</th>
                <th className={thClass}>Phone</th>
                <th className={thClass}>Name</th>
                <th className={thClass}>Client</th>
                <th className={thClass}>Login</th>
                <th className={thClass}>OTP</th>
                <th className={thClass}>Sent At</th>
                <th className={thClass}>Valid Till</th>
                <th className={thClass}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const status = rowStatus(row);
                const remaining = new Date(row.expiresAt).getTime() - now;
                return (
                  <tr key={row._id} className="border-b border-[#E8DFD4] hover:bg-[#F3EEE7]">
                    <td className={tdClass}>{(page - 1) * PAGE_SIZE + index + 1}</td>
                    <td className={`${tdClass} font-medium text-[#0B1C30]`}>{row.phoneNumber || "-"}</td>
                    <td className={tdClass}>{row.targetName || "-"}</td>
                    <td className={tdClass}>
                      {row.clientCode || "-"}
                      {row.tenantName ? (
                        <span className="block text-[11px] text-[#7D766C]">{row.tenantName}</span>
                      ) : null}
                    </td>
                    <td className={tdClass}>{LOGIN_TYPE_LABELS[row.loginType] || row.loginType || "-"}</td>
                    <td className={`${tdClass} font-mono font-semibold tracking-widest text-[#0B1C30]`}>
                      {row.otp || "-"}
                    </td>
                    <td className={tdClass}>{formatDateTime(row.createdAt)}</td>
                    <td className={tdClass}>{formatDateTime(row.expiresAt)}</td>
                    <td className={tdClass}>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${STATUS_STYLES[status] || ""}`}>
                        {STATUS_LABELS[status] || status}
                        {status === "active" ? ` · ${formatRemaining(remaining)} left` : ""}
                      </span>
                      {status === "used" && row.usedAt ? (
                        <span className="block mt-1 text-[11px] text-[#7D766C]">
                          {formatDateTime(row.usedAt)}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="p-6 text-center text-[#7D766C]">
              {appliedSearch ? `No OTP found for "${appliedSearch}"` : "No OTP sent yet"}
            </p>
          )}
          {pagination.total > 0 && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[#E8DFD4] text-sm text-[#4C463D]">
              <span>
                Total {pagination.total} · Page {page} / {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="small"
                  label="Previous"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className={btnClass}
                />
                <Button
                  size="small"
                  label="Next"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className={btnClass}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OtpLogs;
