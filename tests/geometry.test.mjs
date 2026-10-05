import * as THREE from '../vendor/three.module.js';
import {Landscape} from '../world.js';
import {cameraAt} from '../timeline.js';
const landscape=Object.create(Landscape.prototype);landscape.mobile=false;landscape.scene=new THREE.Scene();landscape.rockMaterial=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});landscape.makeMountains();landscape.scene.updateMatrixWorld(true);
const ray=new THREE.Raycaster(),near=[],inside=[];let triangles=0;for(const m of landscape.scene.children){triangles+=m.geometry.index.count/3;for(const v of m.geometry.attributes.position.array)if(!Number.isFinite(v))throw Error('nonfinite peak');}
for(let t=0;t<=180;t+=.5){const c=cameraAt(t),p=new THREE.Vector3().fromArray(c.position),dir=new THREE.Vector3().fromArray(c.look).sub(p).normalize();ray.set(p,dir);const hit=ray.intersectObjects(landscape.scene.children);if(hit[0]?.distance<10)near.push({t,d:hit[0].distance});ray.set(p,new THREE.Vector3(1,0,0));const xs=ray.intersectObjects(landscape.scene.children);const within=new Map();for(const h of xs)within.set(h.object.id,(within.get(h.object.id)||0)+1);if([...within.values()].some(v=>v%2))inside.push(t);}
console.log(JSON.stringify({mountains:landscape.scene.children.length,triangles,near,inside},null,2));if(inside.length)process.exitCode=1;
