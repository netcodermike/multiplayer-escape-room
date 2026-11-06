import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
test('HTTP room lifecycle, validation, and SSE inventory updates',async()=>{
 const port=33000+Math.floor(Math.random()*2000);
 const child=spawn(process.execPath,['server.ts'],{cwd:import.meta.dirname,env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
 try {
  await Promise.race([once(child.stdout!,'data'),once(child,'exit').then(()=>{throw Error('server exited');}),new Promise((_,reject)=>setTimeout(()=>reject(Error('startup timeout')),5000).unref())]);
  const base=`http://127.0.0.1:${port}`;
  const post=(path:string,data:unknown)=>fetch(base+path,{method:'POST',body:JSON.stringify(data)});
  const created=await post('/api/create',{});assert.equal(created.status,201);const {id}=await created.json();
  const events=await fetch(base+'/api/events?room='+id);const reader=events.body!.getReader();
  try{const first=await reader.read();assert.match(new TextDecoder().decode(first.value),/7:42/);}
  finally{await reader.cancel();}
  assert.equal((await post('/api/edit?room='+id,{rooms:[]})).status,400);
  for(const answer of ['742','reward','12'])assert.equal((await (await post('/api/solve?room='+id,{answer})).json()).correct,true);
  assert.equal((await post('/api/solve?room=unknown',{answer:'x'})).status,404);
  assert.equal((await fetch(base)).status,200);
 }finally{child.kill();await once(child,'exit');}
});
