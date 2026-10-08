import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {fiscalYear,nextNumber,duplicateInvoice,mergeInvoiceImport,clientForInvoice,validateInvoice,reserveNumber} from '../src/lib/invoicing.js';
import {computeInvoiceTax,invoiceHTML} from '../src/lib/documents.js';
const entries=JSON.parse(fs.readFileSync(new URL('./fixtures/invoices.json',import.meta.url)));
const empty={clients:[],invoices:[],settings:{invoice:{}},employees:[],customPayments:[{id:'unchanged'}]};
const imported=mergeInvoiceImport(empty,entries,true).state;
test('20 invoice fixtures reconcile and dedupe to 10 clients',()=>{
 assert.equal(imported.invoices.length,20);assert.equal(imported.clients.length,10);
 for(const inv of imported.invoices){assert.equal(inv.status,'Paid');assert.equal(inv.amountPaid,inv.total);assert.equal(inv.payments.length,0);assert.equal(inv.paymentDateUnknown,true)}
 assert.deepEqual(imported.customPayments,empty.customPayments);
 assert.equal(imported.invoices.find(i=>i.number==='IND2602').total,118000);
 assert.equal(imported.invoices.find(i=>i.number==='INT2611').total,6104.78);
});
test('Financial year boundary and series isolation, including deleted high-water mark',()=>{
 assert.equal(fiscalYear('2026-03-31'),2025);assert.equal(fiscalYear('2026-04-01'),2026);
 assert.equal(nextNumber(imported.invoices,'gst','2026-10-09'),'IND2603');assert.equal(nextNumber(imported.invoices,'export','2026-10-09'),'INT2613');
 assert.equal(nextNumber(imported.invoices,'export','2027-04-01'),'INT2701');assert.equal(nextNumber(imported.invoices,'export','2026-03-31'),'INT2555');
 assert.equal(nextNumber([],'export','2026-10-09',reserveNumber({},'INT2612')),'INT2613');
});
test('Reimport is idempotent and differing number conflicts never overwrite',()=>{
 const r=mergeInvoiceImport(imported,entries,true);assert.equal(r.result.skipped.length,20);assert.equal(r.result.added.length,0);
 const bad=structuredClone(entries[0]);bad.invoice.sourceHash='different';const c=mergeInvoiceImport(imported,[bad],false);assert.equal(c.result.conflicts.length,1);assert.deepEqual(c.state,imported);
});
test('Duplicate resets payments, identity, date, source and taxes and fills current client',()=>{
 const src=imported.invoices.find(i=>i.number==='IND2601');const clients=structuredClone(imported.clients);clients.find(c=>c.id===src.clientId).address='Updated billing address';
 const d=duplicateInvoice(src,imported.invoices,clients,'2026-10-09');assert.equal(d.number,'IND2603');assert.equal(d.status,'Draft');assert.equal(d.amountPaid,0);assert.equal(d.clientSnapshot.address,'Updated billing address');assert.equal(d.dueDate,'2026-10-24');assert.equal(d.imported,undefined);assert.equal(d.sourceHash,undefined);assert.equal(d.igst,undefined);assert.notEqual(d.id,src.id);
 assert.equal(clientForInvoice(src,[]).company,src.clientSnapshot.company);
});
test('GST split uses state, paise precision, and original labels survive historic rendering',()=>{
 const input={type:'gst',items:[{qty:1,rate:100.05}],taxRate:18};const provider={gstin:'27AADCW8668C1ZZ'};
 const intra=computeInvoiceTax(input,{gst:'27AAHCB8903D1ZS'},provider);assert.equal(intra.cgst,9);assert.equal(intra.sgst,9);assert.equal(intra.igst,0);
 const inter=computeInvoiceTax(input,{gst:'29AAJCC9988K1ZJ'},provider);assert.equal(inter.igst,18.01);
 const inv=imported.invoices.find(i=>i.number==='IND2601');const html=invoiceHTML(inv,null,provider);assert.match(html,/IGST 9%/);assert.match(html,/SGST 9%/);
});
test('Invalid and duplicate invoices are blocked; imported HTML is escaped',()=>{
 const inv=imported.invoices[0];assert.ok(validateInvoice({...inv,id:'new'},imported.invoices,inv.clientSnapshot).some(x=>x.includes('already exists')));
 const html=invoiceHTML({...inv,notes:'<script>alert(1)</script>',clientSnapshot:{company:'<img src=x onerror=alert(1)>'}},null,{});
 assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img src=x'));assert.match(html,/&lt;script&gt;/);
});
