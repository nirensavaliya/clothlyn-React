import React from "react";
import SalaryReport from "./salaryReport";
import {
  getAdminSalaryReportNew,
  downloadAdminSalaryReportNewExcel,
} from "../apis/salaryReportApiAdmin";

const SalaryReportNew = () => {
  return (
    <SalaryReport
      pageTitle="Salary Report New"
      getSalaryReportApi={getAdminSalaryReportNew}
      downloadExcelApi={downloadAdminSalaryReportNewExcel}
    />
  );
};

export default SalaryReportNew;

