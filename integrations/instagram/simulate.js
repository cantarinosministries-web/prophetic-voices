import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {processEvent} from './worker.js';
const db=new DatabaseSync(':memory:');
db.exec(readFileSync(new URL('./migrations/0001.sql',import.meta.url),'utf8'));
const env={MODE:'simulation',SEND_ENABLED:'false',DB:{prepare(sql){let args=[];return {bind(...a){args=a;return this;},async all(){return {results:db.prepare(sql).all(...args)};},async run(){return {meta:db.prepare(sql).run(...args)};}};}}};
for(const [id,handle] of [['test-personal','ocantarino'],['test-institutional','thepropheticvoices']]) {
 db.prepare('INSERT INTO accounts VALUES (?,?,?,1)').run(id,handle,'TEST_ONLY');
 db.prepare('INSERT INTO rules VALUES (?,?,?,?,?,1)').run(`spirit-${id}`,id,'test-post','spirit','Conheça o Spirit Immersion: https://thepropheticvoices.com.br/spirit-immersion.html');
 const e={account:id,comment:`test-${id}`,media:'test-post',text:'Quero SPIRIT!',at:Math.floor(Date.now()/1000)};
 await processEvent(e,env,()=>{throw new Error('No network allowed');});
 await processEvent(e,env,()=>{throw new Error('No network allowed');});
}
await processEvent({account:'test-personal',comment:'wrong-post',media:'unselected-post',text:'SPIRIT',at:Date.now()/1000},env,()=>{throw new Error('No network allowed');});
await processEvent({account:'unknown-account',comment:'wrong-account',media:'test-post',text:'SPIRIT',at:Date.now()/1000},env,()=>{throw new Error('No network allowed');});
const rows=db.prepare('SELECT * FROM deliveries').all();
if(rows.length!==2 || rows.some(r=>r.status!=='simulated')) throw new Error('Simulation failed');
console.log(JSON.stringify({result:'passed',accounts:2,simulated:rows.length,duplicateSends:0,networkCalls:0},null,2));
