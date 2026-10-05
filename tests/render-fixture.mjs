// Model-state tests use the real scene implementation with GPU calls stubbed.
// Browser acceptance separately exercises the genuine WebGL renderer.
import fs from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=new URL('../',import.meta.url);
let src=fs.readFileSync(new URL('world.js',root),'utf8').replace('./vendor/','../vendor/').replace('./timeline.js','../timeline.js');
src=src.replace("new THREE.TextureLoader().load('assets/01-dawn.webp',()=>this.onAssetsReady?.(),undefined,()=>this.onAssetError?.())",'new THREE.Texture()').replace(/new THREE.WebGLRenderer\(\{[^;]*?\}\)/,'({setPixelRatio(){},setSize(){},setRenderTarget(){},render(){},info:{reset(){},render:{calls:0,triangles:0}}})');
const file=new URL('.generated-world.mjs',import.meta.url);fs.writeFileSync(file,src);
globalThis.innerWidth=1280;globalThis.innerHeight=800;globalThis.devicePixelRatio=1;
export const {Landscape}=await import(file.href);
