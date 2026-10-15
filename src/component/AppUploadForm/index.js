import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { LucideUploadCloud } from "lucide-react";
import Button from "../common/Button";
import InputElement from "../common/InputElement";
import { getAppRelease, uploadAppRelease } from "../../apis/superAdminApi";

const AppUploadForm = () => {
  const [appRelease, setAppRelease] = useState(null);
  const [appVersionCode, setAppVersionCode] = useState("");
  const [apkFile, setApkFile] = useState(null);
  const [apkInputKey, setApkInputKey] = useState(0);
  const [uploadingApk, setUploadingApk] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const pickApk = (file) => {
    if (!file) return;
    if (!/\.apk$/i.test(file.name)) {
      toast.error("Only .apk files are allowed");
      return;
    }
    setApkFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    pickApk(e.dataTransfer.files?.[0]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    if (e.type === "dragleave") setDragActive(false);
  };

  useEffect(() => {
    let cancelled = false;
    getAppRelease()
      .then((body) => {
        if (cancelled) return;
        setAppRelease(body?.data || null);
        setAppVersionCode(String(body?.data?.versionCode ?? ""));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUploadApp = async () => {
    if (!appVersionCode) return;
    setUploadingApk(true);
    try {
      const body = await uploadAppRelease({ versionCode: appVersionCode, file: apkFile });
      setAppRelease(body?.data || null);
      setAppVersionCode(String(body?.data?.versionCode ?? appVersionCode));
      setApkFile(null);
      setApkInputKey((n) => n + 1);
    } catch (error) {
      toast.error(error.response?.data?.message || "Upload failed");
    } finally {
      setUploadingApk(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border p-5 space-y-4 max-w-xl">
      <h3 className="font-semibold text-lg">Upload APK</h3>
      <p className="text-sm text-gray-600">
        Current version code: {appRelease?.versionCode ?? "-"}
      </p>
      <p className="text-sm break-all">
        <span className="text-gray-600">Permanent link: </span>
        {appRelease?.apkUrl ? (
          <a className="text-blue-600" href={appRelease.apkUrl} target="_blank" rel="noreferrer">
            {appRelease.apkUrl}
          </a>
        ) : (
          "-"
        )}
      </p>
      <InputElement
        name="Version Code"
        type="text"
        value={appVersionCode}
        onChange={(v) => setAppVersionCode(String(v).replace(/[^\d.]/g, ""))}
        placeholder="1.0.1"
      />
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">APK file</label>
        <label
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
            dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"
          }`}
        >
          <LucideUploadCloud size={32} className="mb-2 text-gray-500" />
          {apkFile ? (
            <>
              <span className="text-sm font-medium text-gray-800 break-all">{apkFile.name}</span>
              <span className="mt-1 text-xs text-gray-500">
                {(apkFile.size / (1024 * 1024)).toFixed(1)} MB · click to change
              </span>
            </>
          ) : (
            <>
              <span className="text-sm font-medium text-gray-700">Drag & drop APK here</span>
              <span className="mt-1 text-xs text-gray-500">or click to choose a file</span>
            </>
          )}
          <input
            key={apkInputKey}
            type="file"
            className="hidden"
            accept=".apk,application/vnd.android.package-archive"
            onChange={(e) => pickApk(e.target.files?.[0])}
          />
        </label>
      </div>
      <Button
        label={uploadingApk ? "Uploading..." : "Upload"}
        onClick={handleUploadApp}
        disabled={uploadingApk || !appVersionCode}
      />
    </div>
  );
};

export default AppUploadForm;
