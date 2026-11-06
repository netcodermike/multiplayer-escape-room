import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {defaultRooms,solve,validateRooms} from './game.ts';
import type {Room,State} from './game.ts';
type Session = {state:State; rooms:Room[]; touched:number; clients:Set<any>};
const sessions=new Map<string,Session>();
const page=readFileSync(new URL('./public/index.html',import.meta.url));
const fresh=():State=>({stage:0,inventory:[],moves:0,won:false});
function view(s:Session){return {...s.state,clue:s.state.won?'The door is open. You escaped!':s.rooms[s.state.stage].clue,players:s.clients.size};}
function broadcast(s:Session){for(const client of s.clients) client.write('data: '+JSON.stringify(view(s))+'\n\n');}
const server=createServer(async(req,res)=>{
  const url=new URL(req.url??'/', 'http://localhost');
  const json=(status:number,data:unknown)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
  if(req.method==='GET' && url.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(page);return;}
  if(req.method==='POST' && url.pathname==='/api/create'){
    if(sessions.size>=1000){json(503,{error:'Room capacity reached'});return;}
    const id=randomBytes(6).toString('hex');sessions.set(id,{state:fresh(),rooms:structuredClone(defaultRooms),clients:new Set(),touched:Date.now()});json(201,{id});return;
  }
  const id=url.searchParams.get('room')??''; const s=sessions.get(id);
  if(!s){json(404,{error:'Room not found. Create a room first.'});return;}
  s.touched=Date.now();
  if(req.method==='GET' && url.pathname==='/api/events'){
    res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});
    s.clients.add(res);broadcast(s);const timer=setInterval(()=>res.write(': heartbeat\n\n'),15000);
    req.on('close',()=>{clearInterval(timer);s.clients.delete(res);broadcast(s);});return;
  }
  if(req.method!=='POST'){json(404,{error:'Unknown endpoint'});return;}
  try {
    const chunks:Buffer[]=[];let size=0;
    for await(const chunk of req){size+=chunk.length;if(size>32768){json(413,{error:'Body too large'});return;}chunks.push(chunk);}
    const body=JSON.parse(Buffer.concat(chunks).toString());
    if(url.pathname==='/api/solve'){
      if(typeof body.answer!=='string'){json(400,{error:'answer must be text'});return;}
      const correct=solve(s.state,body.answer,s.rooms);broadcast(s);json(200,{correct});
    }else if(url.pathname==='/api/edit'){
      if(!validateRooms(body.rooms)){json(400,{error:'Supply 1–20 puzzles with clue, code, item strings'});return;}
      s.rooms=body.rooms;s.state=fresh();broadcast(s);json(200,{ok:true});
    }else json(404,{error:'Unknown endpoint'});
  }catch{json(400,{error:'Invalid JSON request'});}
});
setInterval(()=>{for(const [id,s] of sessions)if(!s.clients.size && Date.now()-s.touched>3600000)sessions.delete(id);},60000).unref();
const port=Number(process.env.PORT??3000);
server.listen(port,'127.0.0.1',()=>console.log(`Escape room: http://127.0.0.1:${port}`));
