import {test} from 'node:test';import assert from 'node:assert/strict';
import {solve,defaultRooms,validateRooms} from './game.ts';
test('incorrect answers do not advance; all three puzzles unlock exit',()=>{
 const s={stage:0,inventory:[],moves:0,won:false};
 assert.equal(solve(s,'bad',defaultRooms),false);assert.equal(s.stage,0);
 for(const r of defaultRooms)assert.equal(solve(s,r.code,defaultRooms),true);
 assert.equal(s.won,true);assert.equal(s.inventory.length,3);assert.equal(solve(s,'12',defaultRooms),false);
});
test('editor rejects malformed rooms',()=>{assert.equal(validateRooms([]),false);assert.equal(validateRooms([{clue:'x'}]),false);assert.equal(validateRooms(defaultRooms),true);});
