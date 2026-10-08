import { useState, useEffect } from 'react'
import { useStore } from '../store/StoreContext'
import { Modal, Field, Input, Select, Textarea } from './ui'
import { CURRENCIES, uid } from '../lib/format'
export default function ClientEditor({open,onClose,client,onSaved}) {
 const {saveClient}=useStore()
 const blank=()=>({id:uid('cl'),company:'',name:'',email:'',phone:'',country:'India',currency:'INR',gst:'',stateCode:'',taxNumber:'',address:'',website:'',notes:''})
 const [form,setForm]=useState(blank),[error,setError]=useState('')
 useEffect(()=>{if(open){setForm(client ? {...blank(),...client} : blank());setError('')}},[open,client])
 const set=(key,value)=>setForm(f=>({...f,[key]:value}))
 const save=()=>{
   if(!form.company.trim()&&!form.name.trim()){setError('Enter a company or client name.');return}
   if(!form.country.trim()||!form.address.trim()){setError('Enter the client country and billing address.');return}
   const saved=saveClient({...form,company:form.company.trim(),name:form.name.trim(),gst:form.gst.trim().toUpperCase(),stateCode:form.stateCode||form.gst.slice(0,2)})
   onSaved?.(saved);onClose()
 }
 return <Modal open={open} onClose={onClose} title={client?'Edit Client':'Add Client'} size="lg" footer={<><button className="btn-outline" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={save}>Save Client</button></>}>
 {error&&<p role="alert" className="text-rose-600 mb-3">{error}</p>}
 <div className="grid sm:grid-cols-2 gap-4">
 {[["company","Company / Client Name"],["name","Contact Name"],["email","Email"],["phone","Phone"],["country","Country"]].map(([k,label])=><Field key={k} label={label}><Input aria-label={label} value={form[k]} onChange={e=>{set(k,e.target.value);if(k==='country')set('currency',e.target.value.toLowerCase()==='india'?'INR':'USD')}}/></Field>)}
 <Field label="Currency"><Select aria-label="Client currency" value={form.currency} onChange={e=>set('currency',e.target.value)}>{Object.keys(CURRENCIES).map(c=><option key={c}>{c}</option>)}</Select></Field>
 <Field label="GSTIN"><Input aria-label="Client GSTIN" value={form.gst} onChange={e=>{set('gst',e.target.value);set('stateCode',e.target.value.slice(0,2))}}/></Field>
 <Field label="GST state code"><Input aria-label="GST state code" value={form.stateCode} maxLength={2} onChange={e=>set('stateCode',e.target.value)}/></Field>
 <Field label="Registration / ROC / Tax Number"><Input value={form.taxNumber} onChange={e=>set('taxNumber',e.target.value)}/></Field>
 <Field label="Website"><Input value={form.website} onChange={e=>set('website',e.target.value)}/></Field>
 </div>
 <Field label="Billing address" className="mt-4"><Textarea aria-label="Billing address" value={form.address} onChange={e=>set('address',e.target.value)}/></Field>
 <Field label="Notes" className="mt-4"><Textarea value={form.notes} onChange={e=>set('notes',e.target.value)}/></Field>
 </Modal>
}
