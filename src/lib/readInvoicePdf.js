import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs'
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url'
import { parseInvoicePage } from './invoiceParser.js'
GlobalWorkerOptions.workerSrc = workerUrl
export async function readInvoicePdf(file) {
  if (file.size>5*1024*1024) throw new Error('Use a PDF smaller than 5 MB.')
  const bytes = new Uint8Array(await file.arrayBuffer())
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('')
  const task = getDocument({data:bytes.slice(),useSystemFonts:true,isEvalSupported:false}); const doc = await task.promise
  try {
    if (doc.numPages!==1) throw new Error('Multi-page invoices need manual review. This importer supports the supplied one-page Windesign layout.')
    const page=await doc.getPage(1), text=await page.getTextContent()
    const entry=parseInvoicePage(text.items.map(i=>({s:i.str,x:i.transform?.[4],y:page.view[3]-i.transform?.[5]})),page.view[2])
    return {...entry,invoice:{...entry.invoice,sourceFile:file.name,sourceHash:hash}}
  } finally {await task.destroy()}
}
