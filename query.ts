import ExcelJS from "exceljs";

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('./data/incoming/Creators Sobha Aurum.xlsx');
  const ws = wb.worksheets[0];
  ws.eachRow((row) => {
    const label = row.getCell(1).value;
    if (label && String(label).toLowerCase().includes('cover')) {
      console.log('Row with cover:', row.values);
    }
    if (label && String(label).toLowerCase().includes('media')) {
      console.log('Row with media:', row.values);
    }
  });
}
main().catch(console.error);
