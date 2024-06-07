import { Workbook } from 'exceljs';

export const createExcelWorkbook = async (audit_data: any) => {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet('AuditLogs');
  worksheet.columns = [
    { header: 'User', key: 'user_name' },
    { header: 'Viewed At', key: 'created_at' },
  ];

  audit_data.forEach((val) => {
    worksheet.addRow(val);
  });

  // const path = `../src/excel-files/data-${new Date()}.xlsx`
  // const file = await workbook.xlsx.writeFile(path);
  // return { file, path };
  const buffer = await workbook.xlsx.writeBuffer();

    return buffer;
};
