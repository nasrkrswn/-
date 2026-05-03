import type { ReportRow } from "@/lib/types";
import { attendanceStatusLabels } from "@/lib/labels";

function getFileDate() {
  return new Date().toISOString().slice(0, 10);
}

function toExportRows(rows: ReportRow[]) {
  return rows.map((row) => ({
    "اسم الموظف": row.employeeName,
    "القسم": row.departmentName,
    "الموقع": row.locationName,
    "الحالة": attendanceStatusLabels[row.status],
    "الحضور": row.checkIn,
    "الانصراف": row.checkOut,
    "ملاحظات": row.notes
  }));
}

function downloadBlob(content: string, fileName: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCell(value: unknown) {
  const text = String(value ?? "").replaceAll('"', '""');
  return `"${text}"`;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function exportAttendanceExcel(rows: ReportRow[]) {
  const exportRows = toExportRows(rows);
  const headers = Object.keys(exportRows[0] ?? {});
  const csv = [
    headers.map(escapeCell).join(","),
    ...exportRows.map((row) => headers.map((header) => escapeCell(row[header as keyof typeof row])).join(","))
  ].join("\n");

  downloadBlob(`\uFEFF${csv}`, `attendance-${getFileDate()}.csv`, "text/csv;charset=utf-8");
}

export async function exportAttendancePdf(rows: ReportRow[]) {
  const printWindow = window.open("", "_blank", "width=1200,height=800");

  if (!printWindow) {
    return;
  }

  const tableRows = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.employeeName)}</td>
          <td>${escapeHtml(row.departmentName)}</td>
          <td>${escapeHtml(row.locationName)}</td>
          <td>${escapeHtml(attendanceStatusLabels[row.status])}</td>
          <td>${escapeHtml(row.checkIn)}</td>
          <td>${escapeHtml(row.checkOut)}</td>
          <td>${escapeHtml(row.notes)}</td>
        </tr>
      `
    )
    .join("");

  printWindow.document.write(`
    <!doctype html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <title>تقرير الحضور</title>
        <style>
          body { font-family: Tahoma, Arial, sans-serif; padding: 24px; color: #111827; }
          h1 { margin: 0 0 18px; font-size: 22px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: right; }
          th { background: #ecfdf5; color: #047857; }
        </style>
      </head>
      <body>
        <h1>تقرير الحضور</h1>
        <table>
          <thead>
            <tr>
              <th>اسم الموظف</th>
              <th>القسم</th>
              <th>الموقع</th>
              <th>الحالة</th>
              <th>الحضور</th>
              <th>الانصراف</th>
              <th>ملاحظات</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
