import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import worker,{validate} from '../_worker.js';
const data={name:'Test User',profession:'Teacher',company:'',country:'India',city:'Jaipur',phone:'+91 9000000000',email:'test@example.com',referral:'Friends',contribution:'Annually once — ₹20,000 / US$250',consent:true,submissionId:'12345678-1234-1234-1234-123456789abc',token:'test-token'};
const env={SHEETS_WEB_APP_URL:'https://script.google.com/macros/s/test/exec',SHEETS_SHARED_SECRET:'test-secret-that-is-at-least-32-characters',TURNSTILE_SITE_KEY:'test-site',TURNSTILE_SECRET_KEY:'test-secret'};
const req=(body=data,origin='https://team100india.org')=>new Request('https://team100india.org/api/register',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
test('validation rejects incomplete, unexpected and oversized input',()=>{assert.ok(validate(data));assert.ok(validate({...data,contribution:'Twice yearly — ₹10,000 / US$125 per instalment'}));assert.equal(validate({...data,contribution:'arbitrary'}),null);for(const bad of [{...data,email:'bad'},{...data,name:'x'.repeat(121)},{...data,consent:false},{...data,website:'bot'},{...data,referral:'Unknown'}])assert.equal(validate(bad),null);});
test('unconfigured, foreign-origin and oversized requests fail closed',async()=>{assert.equal((await worker.fetch(req(),{})).status,503);assert.equal((await worker.fetch(req(data,'https://other.example'),env)).status,403);assert.equal((await worker.fetch(req({...data,extra:'x'.repeat(9000)}),env)).status,400);});
test('only verified submissions reach the sheet; upstream failures are not success',async()=>{
 const original=globalThis.fetch;let calls=0;
 try {globalThis.fetch=async()=>{calls++;return Response.json({success:false});};assert.equal((await worker.fetch(req(),env)).status,400);assert.equal(calls,1);
 globalThis.fetch=async url=>url.includes('siteverify')?Response.json({success:true,hostname:'wrong.example',action:'registration'}):assert.fail('Should not save');assert.equal((await worker.fetch(req(),env)).status,400);
 globalThis.fetch=async url=>url.includes('siteverify')?Response.json({success:true,hostname:'team100india.org',action:'registration'}):Response.json({ok:false});assert.equal((await worker.fetch(req(),env)).status,502);
 globalThis.fetch=async(url,opts)=>{if(url.includes('siteverify'))return Response.json({success:true,hostname:'team100india.org',action:'registration'});const sent=JSON.parse(opts.body);assert.equal(sent.secret,env.SHEETS_SHARED_SECRET);assert.equal(sent.data.token,undefined);return Response.json({ok:true});};assert.deepEqual(await (await worker.fetch(req(),env)).json(),{ok:true});
 }finally{globalThis.fetch=original;}
});
test('Apps Script authenticates, neutralizes formulas and deduplicates retries',async()=>{
 const rows=[];let locked=false;
 const headers=['Submitted at','Full Name','Profession','Company','Country','City','Phone','Email','How did you hear about Team 100?','How do you want to contribute?','Submission ID'];
 const sheet={getLastRow:()=>rows.length+1,setFrozenRows(){},hideColumns(){},getRange(row,col){return {getValues:()=>[headers],setNumberFormat(){return this;},setValues(values){if(row>1)rows.push(values[0]);return this;},createTextFinder(id){return {matchEntireCell(){return this;},findNext:()=>rows.some(r=>r[10]===id)};}};}};
 const context=vm.createContext({PropertiesService:{getScriptProperties:()=>({getProperty:key=>key==='SHARED_SECRET'?env.SHEETS_SHARED_SECRET:'sheet'})},SpreadsheetApp:{openById:()=>({getSheetByName:()=>sheet,setSpreadsheetTimeZone(){}}),flush(){}},ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({setMimeType:()=>JSON.parse(text)})},LockService:{getScriptLock:()=>({waitLock(){locked=true;},hasLock:()=>locked,releaseLock(){locked=false;}})}});
 vm.runInContext(await readFile(new URL('./Code.gs',import.meta.url),'utf8'),context);
 const post=(secret,d)=>context.doPost({postData:{contents:JSON.stringify({secret,data:d})}});
 assert.equal(post('wrong',data).ok,false);assert.equal(rows.length,0);
 assert.equal(post(env.SHEETS_SHARED_SECRET,{...data,name:'=1+1'}).ok,true);assert.equal(rows[0][1],"'=1+1");assert.equal(rows[0][6],"'+91 9000000000");
 assert.equal(post(env.SHEETS_SHARED_SECRET,data).ok,true);assert.equal(rows.length,1);assert.equal(locked,false);
 assert.equal(post(env.SHEETS_SHARED_SECRET,{...data,contribution:'Twice yearly — ₹10,000 / US$125 per instalment',submissionId:'22345678-1234-1234-1234-123456789abc'}).ok,true);assert.equal(rows.length,2);assert.equal(rows[1][9],'Twice yearly — ₹10,000 / US$125 per instalment');
});

test('Google Workspace deployment URLs are accepted, unrelated hosts rejected', async()=>{
 const config=url=>worker.fetch(new Request('https://team100india.org/api/registration-config'),{...env,SHEETS_WEB_APP_URL:url}).then(r=>r.json());
 assert.equal((await config('https://script.google.com/a/macros/pilani.bits-pilani.ac.in/s/test-id/exec')).ready,true);
 assert.equal((await config('https://script.google.com.evil.example/macros/s/test/exec')).ready,false);
});
