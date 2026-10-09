// Paste this file into the Apps Script editor. Keep it out of public website assets.
const HEADERS = ['Submitted at','Full Name','Profession','Company','Country','City','Phone','Email','How did you hear about Team 100?','How do you want to contribute?','Submission ID'];
function setup() {
  const props=PropertiesService.getScriptProperties();
  if(!props.getProperty('SPREADSHEET_ID')) props.setProperty('SPREADSHEET_ID','14H3rMah1ziW_HWPTrP3iDkT6dRU2Miy2ncwJd5YcX68');
  if(!props.getProperty('SHARED_SECRET')) props.setProperty('SHARED_SECRET',Utilities.getUuid()+Utilities.getUuid());
  getResponseSheet();
}
function getResponseSheet() {
  const id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if(!id)throw Error('Missing sheet setting');
  const book=SpreadsheetApp.openById(id);
  const sheet=book.getSheetByName('Sheet1') || book.insertSheet('Sheet1');
  const existing=sheet.getRange(1,1,1,11).getValues()[0];
  if(existing.slice(0,10).some((v,i)=>v && v!==HEADERS[i]) || (existing[10] && existing[10]!==HEADERS[10]))throw Error('Header mismatch');
  sheet.getRange(1,1,1,11).setValues([HEADERS]);
  sheet.setFrozenRows(1);sheet.hideColumns(11);book.setSpreadsheetTimeZone('Asia/Kolkata');
  return sheet;
}
function doPost(e) {
  const json=value=>ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
  let lock;
  try {
    if(!e || !e.postData || e.postData.contents.length>12000)return json({ok:false});
    const payload=JSON.parse(e.postData.contents);
    const secret=PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');
    if(!secret || secret.length<32 || payload.secret!==secret)return json({ok:false});
    const d=payload.data;
    if(!d || d.consent!==true || !/^[a-f0-9-]{36}$/i.test(d.submissionId || ''))return json({ok:false});
    const limits={name:120,profession:120,company:160,country:80,city:100,phone:30,email:254};
    for(const key in limits)if(typeof d[key]!=='string' || (key!=='company'&&!d[key].trim()) || d[key].length>limits[key] || /[\x00-\x1f\x7f]/.test(d[key]))return json({ok:false});
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email) || !/^[+\d ()-]{6,30}$/.test(d.phone) || d.phone.replace(/\D/g,'').length<6 || !['Friends','Social Media Ad','Family'].includes(d.referral) || !['Annually once — ₹20,000 / US$250','Twice yearly — ₹10,000 / US$125 per instalment'].includes(d.contribution))return json({ok:false});
    lock=LockService.getScriptLock();lock.waitLock(10000);
    const sheet=getResponseSheet();
    const last=sheet.getLastRow();
    if(last>1 && sheet.getRange(2,11,last-1,1).createTextFinder(d.submissionId).matchEntireCell(true).findNext())return json({ok:true});
    // Treat all user data as literal text, never spreadsheet formulas.
    const text=value=> /^[=+\-@]/.test(value) ? "'"+value : value;
    const values=[d.name,d.profession,d.company,d.country,d.city,d.phone,d.email,d.referral,d.contribution,d.submissionId].map(text);
    const row=last+1;
    sheet.getRange(row,2,1,10).setNumberFormat('@');
    sheet.getRange(row,1,1,11).setValues([[new Date(),...values]]);
    sheet.getRange(row,1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
    SpreadsheetApp.flush();
    return json({ok:true});
  } catch {return json({ok:false});}
  finally {if(lock && lock.hasLock())lock.releaseLock();}
}
