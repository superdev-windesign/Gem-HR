import { addDays, fiscalYear } from './invoicing.js'
const amount = text => Number(String(text).replace(/[^\d.-]/g, ''))
const clean = s => String(s).replace(/\s+/g, ' ').trim()
const join = items => items.sort((a,b) => Math.abs(a.y-b.y) > 3 ? a.y-b.y : a.x-b.x).map(i => clean(i.s)).join(' ').trim()
export function parseInvoicePage(items, width = 595) {
  const data = items.filter(i => i.s?.trim()).map(i => ({ ...i, x: i.x / width * 595, s: clean(i.s) }))
  const find = re => data.find(i => re.test(i.s))
  const number = find(/^(IND|INT)\d{4,}$/)?.s
  const dateString = find(/^\d{1,2} [A-Za-z]+ \d{4}$/)?.s
  const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
  const dm = dateString?.match(/^(\d+) ([A-Za-z]+) (\d+)$/)
  const date = dm && `${dm[3]}-${String(months.indexOf(dm[2].slice(0,3).toLowerCase())+1).padStart(2,'0')}-${dm[1].padStart(2,'0')}`
  const customerHeading = find(/^Customer Details$/i), tableHeading = find(/^S[e]?r?vice Name$|^Sevice Name$/i)
  if (!number || !date || !customerHeading || !tableHeading) throw new Error('This PDF layout is not recognized. Use a text-based Windesign invoice with Customer Details and a services table.')
  fiscalYear(date)
  const customer = data.filter(i => i.x < 335 && i.y > customerHeading.y+3 && i.y < tableHeading.y-10)
  const countryHeading = customer.find(i => /^Country$/i.test(i.s))
  const addressHeading = customer.find(i => /^Address$/i.test(i.s))
  const country = countryHeading && join(customer.filter(i => Math.abs(i.x-countryHeading.x)<25 && i.y > countryHeading.y+3))
  const top = customer.filter(i => i.y < (addressHeading?.y ?? countryHeading?.y ?? Infinity) && !/^Name$/.test(i.s))
  let company = join(top), address
  if (addressHeading) address = join(customer.filter(i => i.y>addressHeading.y+3 && i.y<countryHeading.y-3))
  else {
    const firstY = Math.min(...top.map(i=>i.y))
    company = join(top.filter(i=>Math.abs(i.y-firstY)<3))
    address = join(top.filter(i=>i.y>firstY+3))
  }
  const gst = customer.find(i=>/^\d{2}[A-Z0-9]{13}$/.test(i.s))?.s || ''
  const rocHead = customer.find(i=>/^ROC$/i.test(i.s))
  const taxNumber = rocHead ? join(customer.filter(i=>Math.abs(i.x-rocHead.x)<25 && i.y>rocHead.y+3)) : ''
  if (!company || !address || !country) throw new Error(`${number}: customer name, address or country could not be read. Please review the original PDF.`)
  const type = number.startsWith('IND') ? 'gst' : 'export'
  const totalLabel = data.find(i=>/^Total Amount/i.test(i.s))
  const totalRow = data.filter(i=>Math.abs(i.y-totalLabel?.y)<5)
  const totalValue = totalRow.find(i=>/^[₹$€£]/.test(i.s))
  const total = totalValue ? amount(totalValue.s) : amount(totalLabel?.s.match(/[₹$€£][\d,.]+/)?.[0])
  if (!totalLabel || !totalValue || !Number.isFinite(total)) throw new Error(`${number}: total could not be read.`)
  const currency = type==='gst' ? 'INR' : totalLabel.s.match(/\(([A-Z]{3})\)/)?.[1] || (totalValue.s.startsWith('$') ? 'USD' : '')
  if (!currency) throw new Error(`${number}: currency could not be read.`)
  const taxLabels = data.filter(i=>/^(CGST|SGST|IGST)\s*[\d.]+%/.test(i.s))
  const taxLines = taxLabels.map(i=>({label:i.s.replace(/\s*:.*$/,''),amount:amount(data.find(v=>v.x>i.x && Math.abs(v.y-i.y)<5 && /^[₹$]/.test(v.s))?.s || i.s.match(/[₹$][\d,.]+/)?.[0])}))
  const end = Math.min(totalLabel.y,...taxLabels.map(i=>i.y))
  const body = data.filter(i=>i.y>tableHeading.y+8 && i.y<end-5)
  const rowMarkers = body.filter(i=>i.x<95 && /^\d+$/.test(i.s)).sort((a,b)=>a.y-b.y)
  if (!rowMarkers.length) throw new Error(`${number}: no service rows were found.`)
  const itemsOut = rowMarkers.map((r,idx)=>{
    const start = idx ? (rowMarkers[idx-1].y+r.y)/2 : tableHeading.y+8
    const stop = idx<rowMarkers.length-1 ? (r.y+rowMarkers[idx+1].y)/2 : end-5
    const row=body.filter(i=>i.y>=start && i.y<stop)
    const desc = row.filter(i=>i.x>=95 && i.x<270)
    const qty = join(row.filter(i=>i.x>=270 && i.x<380)) || '1'
    const rate = amount(join(row.filter(i=>i.x>=380 && i.x<470)))
    const lineTotal = amount(join(row.filter(i=>i.x>=470)))
    const description=join(desc)
    if (!description || !Number.isFinite(rate) || Math.abs(rate*(isNaN(Number(qty))?1:Number(qty))-lineTotal)>.02) throw new Error(`${number}: a service row did not reconcile.`)
    return {id:crypto.randomUUID(),description,note:'',qty,rate}
  })
  const subtotal=itemsOut.reduce((s,i)=>s+i.rate*(isNaN(Number(i.qty))?1:Number(i.qty)),0)
  const taxAmount=taxLines.reduce((s,t)=>s+t.amount,0)
  if (Math.abs(subtotal+taxAmount-total)>.02) throw new Error(`${number}: line items and taxes do not match the printed total.`)
  const warnings=[]
  if (number.slice(3,5)!==String(fiscalYear(date)).slice(-2)) warnings.push(`Printed number series disagrees with issue date ${date}; original preserved.`)
  if (type==='gst' && gst.startsWith('27') && taxLines.some(t=>t.label.startsWith('IGST'))) warnings.push('Original uses IGST for a Maharashtra customer. Confirm the printed GST labels with your accountant; original amounts retained.')
  if (gst && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gst)) warnings.push('Customer GSTIN format needs confirmation; copied exactly from the PDF.')
  if (country==='Paris') warnings.push('Original country is printed as Paris; normalized to France in the client directory.')
  return {
    client: {company,name:'',address,country: country==='Paris'?'France':country,sourceCountry:country,currency,gst,stateCode:gst.slice(0,2),taxNumber,email:'',phone:'',website:'',notes:''},
    invoice: {number,date,dueDate:addDays(date,15),type,currency,items:itemsOut,subtotal,total,discount:0,taxRate:type==='gst'?18:0,taxAmount,
      cgst:taxLines.filter(t=>t.label.startsWith('CGST')).reduce((s,t)=>s+t.amount,0),
      sgst:taxLines.filter(t=>t.label.startsWith('SGST')).reduce((s,t)=>s+t.amount,0),
      igst:taxLines.filter(t=>t.label.startsWith('IGST')).reduce((s,t)=>s+t.amount,0),
      taxLines,importWarnings:warnings,modeOfTransport:'Digital',reverseCharge:'Not specified',notes:'',sourceText:join(data)} }
}
