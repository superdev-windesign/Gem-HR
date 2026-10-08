// Targeted, append-only import. Dry run unless explicitly passed --apply.
// Reads/writes only clients, invoices and invoice sequencing settings.
import fs from 'node:fs';import path from 'node:path';
import {createClient} from '@libsql/client';
import {mergeInvoiceImport} from '../src/lib/invoicing.js';
const apply=process.argv.includes('--apply');
const bundle=process.argv.find(a=>a.endsWith('.json')) || '../invoice-import.json';
const entries=JSON.parse(fs.readFileSync(bundle));
if(entries.length!==20) throw new Error('Expected the reviewed 20-invoice bundle.');
const c=createClient({url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN});
try{
 const tx=await c.transaction(apply?'write':'read');
 try{
  const old={clients:[],invoices:[],settings:{invoice:{}}};
  for(const name of ['clients','invoices']) old[name]=(await tx.execute(`SELECT data FROM ${name} ORDER BY id`)).rows.map(r=>JSON.parse(r.data));
  const cfg=await tx.execute("SELECT json_extract(data,'$.invoice') AS invoice FROM settings WHERE id=1");
  if(cfg.rows.length!==1) throw new Error('Company settings missing; refusing import.');
  old.settings.invoice=JSON.parse(cfg.rows[0].invoice || '{}');
  const {state,result}=mergeInvoiceImport(old,entries,true);
  if(result.conflicts.length) throw new Error('Existing invoice conflicts: '+result.conflicts.join(', '));
  if(apply){
   const backupPath=path.resolve('../invoice-backup-'+Date.now()+'.json');
   fs.writeFileSync(backupPath,JSON.stringify(old,null,2),{mode:0o600});
   const stmts=[];
   for(const name of ['clients','invoices']) for(const row of state[name]) if(!old[name].some(x=>x.id===row.id)) stmts.push({sql:`INSERT INTO ${name} (id,data) VALUES (?,?)`,args:[row.id,JSON.stringify(row)]});
   stmts.push({sql:"UPDATE settings SET data=json_set(data,'$.invoice',json(?)) WHERE id=1",args:[JSON.stringify(state.settings.invoice)]});
   await tx.batch(stmts);await tx.commit();
   console.log(JSON.stringify({applied:true,...result,backup:backupPath}));
  }else{await tx.commit();console.log(JSON.stringify({dryRun:true,...result}));}
 }finally{tx.close()}
}finally{c.close()}
