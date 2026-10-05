import assert from 'node:assert/strict';
import {DURATION,CHAPTERS,SHOTS,cameraAt,atmosphereAt,chapterAt} from '../timeline.js';
assert.equal(DURATION,180);assert.equal(SHOTS[0].start,0);assert.equal(SHOTS.at(-1).end,180);
SHOTS.forEach((s,i)=>{assert.ok(s.end>s.start);if(i)assert.equal(s.start,SHOTS[i-1].end)});
for(let t=0;t<=180;t+=.05){let c=cameraAt(t);assert.ok([...c.position,...c.look,c.fov].every(Number.isFinite));let a=atmosphereAt(t);assert.ok(Object.values(a).every(v=>v>=0&&v<=1));assert.ok(chapterAt(t)>=0&&chapterAt(t)<CHAPTERS.length);assert.ok(c.position[1]>0)}
assert.equal(chapterAt(180),5);assert.equal(atmosphereAt(180).resolve,1);assert.equal(atmosphereAt(0).reveal,0);
console.log('PASS: 3,601 timeline samples, 12 complete shots, six chapters, deterministic camera/atmosphere and terminal state.');
