import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'windesign-invoice-test-'));
process.env.TURSO_DATABASE_URL='file:'+path.join(dir,'state.db');delete process.env.TURSO_AUTH_TOKEN;
const {ensureSchema,writeState,readState,client}=await import('../server/db.js');
const {buildEmpty}=await import('../src/lib/seed.js');
test('Server rejects stale writes and duplicate invoice numbers without losing data',async()=>{
 await ensureSchema();await writeState(buildEmpty());
 const original=await readState();const next={...original,clients:[{id:'client-test',company:'Example'}]};
 const revision=await writeState(next,original._revision);assert.notEqual(revision,original._revision);
 await assert.rejects(writeState(original,original._revision),/Another session/);
 assert.equal((await readState()).clients.length,1);
 const current=await readState();const i={id:'a',number:'INT2601',total:10,amountPaid:10};
 await assert.rejects(writeState({...current,invoices:[i,{...i,id:'b'}]},current._revision),/Duplicate/);
 assert.equal((await readState()).invoices.length,0);
 client.close();fs.rmSync(dir,{recursive:true});
});
