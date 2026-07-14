import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

async function run() {
  const dir = './data/incoming';
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~'));
  for (const file of files) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(path.join(dir, file));
    const ws = wb.worksheets[0];
    let found = false;
    ws.eachRow(row => {
      const label = String(row.getCell(1).value || '').trim().toLowerCase();
      if (label.includes('media assets')) {
        const v = row.getCell(2).value;
        console.log(`${file} => ${v}`);
        found = true;
      }
    });
    if (!found) console.log(`${file} => NO MEDIA ASSETS ROW`);
  }
}
run();
