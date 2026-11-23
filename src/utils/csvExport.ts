/**
 * Safe CSV export utility with spreadsheet formula-injection neutralization
 * and proper RFC 4180 double-quote escaping.
 */

const FORMULA_PREFIX_REGEX = /^[\s\uFEFF]*[=+\-@\t\r]/;

export function escapeCsvCell(value: unknown): string {
  let str = String(value ?? '');
  // Neutralize Excel/Sheets formula injection prefixes
  if (FORMULA_PREFIX_REGEX.test(str)) {
    str = `'${str}`;
  }
  // Escape internal quotes and always wrap in double quotes
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function downloadSafeCsv(
  fileName: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): void {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const bodyLines = rows.map((row) => row.map(escapeCsvCell).join(','));
  // Prepend UTF-8 BOM so Microsoft Excel displays Indonesian characters cleanly
  const csvContent = `\uFEFF${[headerLine, ...bodyLines].join('\r\n')}`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
