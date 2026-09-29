import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportToExcel = (data, filename = 'export.xlsx', sheetName = 'Sheet1') => {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Convert data to worksheet format
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate Excel file
    XLSX.writeFile(workbook, filename);
    
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export data to Excel');
  }
};

export const formatSalaryDataForExport = (salaryData) => {
  return salaryData.map((item, index) => {
    // For BillscanProcess, use username; for other processes, use firstName + lastName or nickname
    let employeeName = '-';
    if (item?.user && typeof item.user === 'object') {
      if (item.model === 'BillscanProcess' || item.model === 'BillScanProcess') {
        employeeName = item.user.username || '-';
      } else {
        employeeName = `${item.user.firstName || ''} ${item.user.lastName || ''}`.trim() || 
                       item.user.nickname || '-';
      }
    }

    return {
    'S.No': index + 1,
      'Emp Name': employeeName,
    'Emp Code': item?.user?.employeeName || '-',
    'D. No.': item.dNo || '-',
    'Lot No.': item.lotNo || '-',
    'Employee Role': item?.processId?.processName || '-',
    'Price': item.price || item.singlePrice || '-',
    'Total Price': item.totalPicPrice || '-',
    'Pic': item.pic || '-',
    'Created Date': item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-',
    'Updated Date': item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '-'
    };
  });
};

export const downloadSalaryReport = async (data, filename) => {
  // console.log(data, "data");
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Salary Report");

  worksheet.columns = [
    { header: "Emp Name", key: "employeeName" },
    { header: "D. No.", key: "dNo" },
    { header: "Lot No.", key: "lotNo" },
    { header: "Employee Role", key: "processName" },
    { header: "Emp Code", key: "employeeCode" },
    { header: "Price", key: "price" },
    { header: "Total Price", key: "totalPicPrice" },
    { header: "Pic", key: "pic" },
    { header: "Alter", key: "alter" },
    { header: "Reject", key: "reject" },
    { header: "Total Pic", key: "totalPic" },
    { header: "Total Effective Pic", key: "totalEffectivePic" },
    { header: "Total Alter", key: "totalAlter" },
    { header: "Total Reject", key: "totalReject" },
  ];

  data.forEach((item) => {
    let employeeName = "-";
    let employeeCode = "-";

    if (Array.isArray(item.user) && item.user.length > 0) {
      const u = item.user[0];
      // For BillscanProcess, use username; for other processes, use firstName + lastName or nickname
      if (item.model === "BillscanProcess" || item.model === "BillScanProcess") {
        employeeName = u.username || "-";
      } else {
        employeeName = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.nickname || "-";
      }
      employeeCode = u.employeeName || "-";
    } else if (item.user && typeof item.user === "object") {
      // For BillscanProcess, use username; for other processes, use firstName + lastName or nickname
      if (item.model === "BillscanProcess" || item.model === "BillScanProcess") {
        employeeName = item.user.username || "-";
      } else {
        employeeName = `${item.user.firstName || ""} ${item.user.lastName || ""}`.trim() || item.user.nickname || "-";
      }
      employeeCode = item.user.employeeName || "-";
    }

    worksheet.addRow({
      employeeName,
      dNo: item?.dNo || "-",
      lotNo: item?.lotNo || "-",
      processName: item?.processId?.processName || item?.model || "-",
      employeeCode,
      price: item?.price || 0,
      totalPicPrice: item?.totalPicPrice || 0,
      pic: item?.pic || 0,
      alter: item?.alter || 0,
      reject: item?.reject || 0,
      totalPic: item?.rcTotals?.totalPic || 0,
      totalEffectivePic: item?.rcTotals?.totalEffectivePic || 0,
      totalAlter: item?.rcTotals?.totalAlter || 0,
      totalReject: item?.rcTotals?.totalReject || 0,
    });
  });

  // ✅ Totals calculation (including rcTotals values)
  const totalPicPrice = data.reduce((acc, val) => acc + (val.totalPicPrice || 0), 0);
  const totalAlter = data.reduce((acc, val) => acc + (val.alter || 0), 0);
  const totalReject = data.reduce((acc, val) => acc + (val.reject || 0), 0);
  const totalRcPic = data.reduce((acc, val) => acc + (val.rcTotals?.totalPic || 0), 0);
  const totalRcEffective = data.reduce((acc, val) => acc + (val.rcTotals?.totalEffectivePic || 0), 0);
  const totalRcAlter = data.reduce((acc, val) => acc + (val.rcTotals?.totalAlter || 0), 0);
  const totalRcReject = data.reduce((acc, val) => acc + (val.rcTotals?.totalReject || 0), 0);

  worksheet.addRow({});
  worksheet.addRow({
    employeeName: "Totals",
    totalPicPrice,
    alter: totalAlter,
    reject: totalReject,
    totalPic: totalRcPic,
    totalEffectivePic: totalRcEffective,
    totalAlter: totalRcAlter,
    totalReject: totalRcReject,
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};



export const generateSalaryReportPDF = (data, filename = "salary-report") => {
  // console.log(data,"dadadasdada")
  const doc = new jsPDF();

  const tableData = data.map((item) => {
      let employeeName = "-";
      let employeeCode = "-";

      if (Array.isArray(item.user) && item.user.length > 0) {
          const u = item.user[0];
          // For BillscanProcess, use username; for other processes, use firstName + lastName or nickname
          if (item.model === "BillscanProcess" || item.model === "BillScanProcess") {
            employeeName = u.username || "-";
          } else {
            employeeName = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.nickname || "-";
          }
          employeeCode = u.employeeName || "-";
      } else if (item.user && typeof item.user === "object") {
          // For BillscanProcess, use username; for other processes, use firstName + lastName or nickname
          if (item.model === "BillscanProcess" || item.model === "BillScanProcess") {
            employeeName = item.user.username || "-";
          } else {
            employeeName = `${item.user.firstName || ""} ${item.user.lastName || ""}`.trim() || item.user.nickname || "-";
          }
          employeeCode = item.user.employeeName || "-";
      }

      return [
          employeeName,
          item?.dNo || "-",
          item?.lotNo || "-",
          item?.processId?.processName || item?.model || "-",
          employeeCode,
          item?.price || 0,
          item?.totalPicPrice || 0,
          item?.pic || 0,
          item?.alter || 0,
          item?.reject || 0
      ];
  });

  // Totals
  const totalPicPrice = data.reduce((acc, val) => acc + (val.totalPicPrice || 0), 0);
  const totalAlter = data.reduce((acc, val) => acc + (val.alter || 0), 0);
  const totalReject = data.reduce((acc, val) => acc + (val.reject || 0), 0);

  // Add total row
  tableData.push([
      "Total", "", "", "", "", "", totalPicPrice, "", totalAlter, totalReject
  ]);

  const tableHead = [
      [
          "Emp Name",
          "D. No.",
          "Lot No.",
          "Employee Role",
          "Emp Code",
          "Price",
          "Total Price",
          "Pic",
          "Alter",
          "Reject"
      ]
  ];

  doc.text("Salary Report", 14, 15);
  autoTable(doc,{
      startY: 20,
      head: tableHead,
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [63, 81, 181] },
  });

  doc.save(`${filename}.pdf`);
};



export const generateNonMovingItemsPDF = (responseData, filename = "unchanged_status_report") => {
  if (!responseData?.data?.items || !Array.isArray(responseData.data.items)) {
    console.error("Invalid data format");
    return;
  }

  const data = responseData.data.items;
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Non-Moving Items Report", 14, 15);
  
  // Add metadata
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
  doc.text(`Total Items: ${data.length}`, 14, 28);

  // Define table headers
  const headers = [
    "S.No",
    "Lot No",
    "Design No.",
    "Color",
    "Size", 
    "Pic",
    "Layer",
    "Status",
    "Days Unchanged"
  ];

  // Prepare table data
  const tableData = data.map((item, index) => [
    index + 1,
    item.lotNo || "-",
    item.designNumber || "-",
    item.color || "-",
    item.size || "-",
    item.pic || "-",
    item.layer || "-",
    item.status.toUpperCase() || "-",
    item.daysSinceLastStatusChange || 0
  ]);

  // Generate table
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 40,
    margin: { top: 40 },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [40, 40, 40],
      font: "helvetica"
    },
    headStyles: {
      fillColor: [51, 122, 183],
      textColor: [255, 255, 255],
      fontStyle: "bold"
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 25 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 15 },
      5: { cellWidth: 15 },
      6: { cellWidth: 15 },
      7: { cellWidth: 20 },
      8: { cellWidth: 20 }
    },
    didDrawPage: (data) => {
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()}`,
        doc.internal.pageSize.width - 30,
        doc.internal.pageSize.height - 10
      );
    }
  });

  // Save PDF
  doc.save(`${filename}.pdf`);
};



export const exportToExcelAdvanced = async (responseData, filename = "report") => {
    if (!responseData?.data?.items || !Array.isArray(responseData.data.items)) {
    console.error("Invalid data format");
    return;
  }

  const data = responseData.data.items;
  // Create workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Report");
  
  // Define columns
  worksheet.columns = [
    { header: "S.No", key: "sno", width: 8 },
    { header: "Lot No", key: "lotNo", width: 15 },
    { header: "Design No.", key: "designNo", width: 15 },
    { header: "Color", key: "color", width: 15 },
    { header: "Size", key: "size", width: 10 },
    { header: "Pic", key: "pic", width: 10 },
    { header: "Layer", key: "layer", width: 10 },
    { header: "Status", key: "status", width: 15 },
    { header: "Days Unchanged", key: "daysUnchanged", width: 15 }
  ];
  
  // Add header style
  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '337AB7' }
    };
    cell.font = {
      bold: true,
      color: { argb: 'FFFFFF' }
    };
  });
  
  // Add data rows
  data.forEach((item, index) => {
    worksheet.addRow({
      sno: index + 1,
      lotNo: item.lotNo || "-",
      designNo: item.designNumber || "-",
      color: item.color || "-",
      size: item.size || "-",
      pic: item.pic || "-",
      layer: item.layer || "-",
      status: item.status.toUpperCase() || "-",
      daysUnchanged: item.daysSinceLastStatusChange || 0
    });
  });
  
  // Apply alternate row coloring
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: rowNumber % 2 === 0 ? 'F5F5F5' : 'FFFFFF' }
        };
      });
    }
  });
  
  // Save file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.xlsx`;
  link.click();
};



export const downloadUpadReport = async (data, filename) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("UPAD Report");

  // Set column widths and formatting
  worksheet.columns = [
    { header: "Emp Name", key: "employeeName" },
    { header: "Base Salary", key: "salary"},
    { header: "Bounce", key: "bounce"},
    { header: "Total Salary", key: "totalSalary" },
    { header: "Total UPAD", key: "totalUpad" },
    { header: "Final Salary", key: "finalSalary"},
    { header: "UPAD Count", key: "upadCount"},
    { header: "Latest Date", key: "latestDate" },
  ];

  // Group data by employee
  const groupedData = {};
  
  data.forEach((item) => {
    const employeeId = item?.employeeId?._id || item?.employeeId?.id || item?.employeeId || 'unknown';
    const employeeName = item?.employeeId
      ? `${item.employeeId.firstName || ""} ${item.employeeId.lastName || ""}`.trim()
      : item.employeeName || "Unknown Employee";

    if (!groupedData[employeeId]) {
      groupedData[employeeId] = {
        employeeName: employeeName,
        salary: 0,
        bounce: 0,
        totalSalary: 0,
        totalUpad: 0,
        finalSalary: 0,
        upadCount: 0,
        latestDate: null,
        dates: []
      };
    }

    // Sum up the values for the same employee
    groupedData[employeeId].salary += item.salary || 0;
    groupedData[employeeId].bounce += item.bounce || 0;
    groupedData[employeeId].totalSalary += item.totalSalary || 0;
    groupedData[employeeId].totalUpad += item.upadAmount || item.totalUpad || 0;
    groupedData[employeeId].finalSalary += item.availableAmount || item.finalTotalSalary || 0;
    groupedData[employeeId].upadCount += 1;
    
    // Track dates to find the latest one
    if (item.createdAt) {
      groupedData[employeeId].dates.push(new Date(item.createdAt));
    }
  });

  // Convert grouped data to array and find latest dates
  const consolidatedData = Object.values(groupedData).map(employee => {
    if (employee.dates.length > 0) {
      employee.latestDate = new Date(Math.max(...employee.dates));
    }
    return employee;
  });

  // Sort by employee name
  consolidatedData.sort((a, b) => a.employeeName.localeCompare(b.employeeName));



  // Add data rows
  consolidatedData.forEach((employee) => {
    worksheet.addRow({
      employeeName: employee.employeeName,
      salary: employee.salary,
      bounce: employee.bounce,
      totalSalary: employee.totalSalary,
      totalUpad: employee.totalUpad,
      finalSalary: employee.finalSalary,
      upadCount: employee.upadCount,
      latestDate: employee.latestDate ? employee.latestDate.toLocaleDateString() : "-",
    });
  });

  // Add totals row
  const totalRow = consolidatedData.length + 2;
  worksheet.addRow({});
  
  const totalsRowData = {
    employeeName: "TOTALS",
    salary: consolidatedData.reduce((sum, emp) => sum + emp.salary, 0),
    bounce: consolidatedData.reduce((sum, emp) => sum + emp.bounce, 0),
    totalSalary: consolidatedData.reduce((sum, emp) => sum + emp.totalSalary, 0),
    totalUpad: consolidatedData.reduce((sum, emp) => sum + emp.totalUpad, 0),
    finalSalary: consolidatedData.reduce((sum, emp) => sum + emp.finalSalary, 0),
    upadCount: consolidatedData.reduce((sum, emp) => sum + emp.upadCount, 0),
    latestDate: "-",
  };
  
  worksheet.addRow(totalsRowData);



  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

