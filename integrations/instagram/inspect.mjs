import {readFileSync} from 'node:fs';
import {createHmac} from 'node:crypto';
const values=Object.fromEntries(readFileSync('.dev.vars','utf8').trim().split('\n').map(line=>line.split('=')));
if(!values.ADMIN_TOKEN) throw new Error('ADMIN_TOKEN is not configured locally');
const account=process.argv[2];if(!/^\d+$/.test(account||''))throw new Error('Supply an official account ID');
const body=JSON.stringify({account,ts:Math.floor(Date.now()/1000)});
const signature='sha256='+createHmac('sha256',values.ADMIN_TOKEN).update(body).digest('hex');
const response=await fetch('https://pv-instagram-simulation.cantarinosministries.workers.dev/admin/inspect',{method:'POST',headers:{'content-type':'application/json','x-admin-signature':signature},body});
console.log(JSON.stringify({status:response.status,result:await response.json()},null,2));
