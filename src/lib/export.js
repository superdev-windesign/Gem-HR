// Export helpers — dependency-free CSV / Excel / PDF / DOCX / JSON exporters.

function download(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

function esc(v) {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

export function exportCSV(rows, columns, filename = 'export.csv') {
  const header = columns.map((c) => esc(c.label)).join(',')
  const body = rows
    .map((r) => columns.map((c) => esc(typeof c.value === 'function' ? c.value(r) : r[c.key])).join(','))
    .join('\n')
  download(new Blob([header + '\n' + body], { type: 'text/csv;charset=utf-8' }), filename)
}

// "Excel" via an HTML table that Excel opens natively as .xls
export function exportExcel(rows, columns, filename = 'export.xls', title = '') {
  const head = columns.map((c) => `<th style="background:#1f47f5;color:#fff;padding:6px;border:1px solid #ccc">${c.label}</th>`).join('')
  const body = rows
    .map(
      (r) =>
        '<tr>' +
        columns.map((c) => `<td style="padding:6px;border:1px solid #ddd">${(typeof c.value === 'function' ? c.value(r) : r[c.key]) ?? ''}</td>`).join('') +
        '</tr>'
    )
    .join('')
  const html = `<html><head><meta charset="utf-8"></head><body>${title ? `<h3>${title}</h3>` : ''}<table>${`<tr>${head}</tr>`}${body}</table></body></html>`
  download(new Blob([html], { type: 'application/vnd.ms-excel' }), filename)
}

export function exportJSON(data, filename = 'backup.json') {
  download(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), filename)
}

// DOCX-compatible: Word opens well-formed HTML saved as .doc
export function exportDOC(htmlBody, filename = 'document.doc') {
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>Document</title></head><body>${htmlBody}</body></html>`
  download(new Blob(['﻿', html], { type: 'application/msword' }), filename)
}

// PDF via the browser print dialog on an isolated document window.
export function exportPDF(htmlBody, title = 'Document') {
  const w = window.open('', '_blank', 'width=860,height=1000')
  if (!w) {
    alert('Please allow popups to export PDF.')
    return
  }
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>
      *{box-sizing:border-box} body{font-family:Inter,Arial,sans-serif;color:#1e293b;margin:0;padding:40px;line-height:1.55}
      h1,h2,h3{margin:0 0 8px} table{width:100%;border-collapse:collapse}
      @media print{ @page{ margin:14mm } }
    </style></head><body>${htmlBody}
    <script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script>
    </body></html>`)
  w.document.close()
}

export function printArea() {
  window.print()
}
