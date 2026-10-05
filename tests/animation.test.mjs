import assert from 'node:assert/strict';
globalThis.innerWidth=1280;globalThis.innerHeight=800;globalThis.devicePixelRatio=1;
const {Landscape}=await import('./render-fixture.mjs');
const world=new Landscape({});
const snap=()=>({camera:world.camera.position.toArray(),boat:world.boat.position.toArray(),oar:world.oar.rotation.toArray(),tree:world.trees[0].tree.rotation.toArray(),mist:world.mists[0].m.position.toArray(),wing:world.birds[0].wings[0].rotation.toArray(),fallTime:world.fall.material.uniforms.uTime.value});
world.render(35);const before=snap();world.render(38,false,true);const after=snap();assert.deepEqual(before.camera,after.camera);for(const k of ['boat','oar','tree','mist','wing','fallTime'])assert.notDeepEqual(before[k],after[k]);
world.render(35);assert.deepEqual(snap(),before);world.render(116);const r1=Array.from(world.ribbons[0].p);world.render(119);const r2=Array.from(world.ribbons[0].p);assert.notDeepEqual(r1,r2);world.render(116);assert.deepEqual(Array.from(world.ribbons[0].p),r1);
console.log('PASS: locked camera + independently changing boat/oar/pine/mist/wing/waterfall; exact deterministic seek; deforming ink ribbons.');

world.setQuality(.6);assert.equal(world.stats.quality,.6,'Quality resize must immediately redraw the canvas');
