/**
 * 山河入梦 — an original, deterministic 180-second miniature for strings,
 * bamboo flute, low drones, water, wood and distant thunder.
 *
 * No recordings, external assets, musical timers or accumulating live voices.
 * A cooperatively rendered stereo score makes seeking and replay sample-stable.
 *
 *   import { FilmScore } from './score.js';
 *   const score = new FilmScore();
 *   soundButton.onclick = async () => { await score.enable(); score.setMuted(false); };
 *   // In the film's render loop, including while paused:
 *   score.update(filmTimeSeconds, playing);
 */

export const SCORE_DURATION = 180;
const SR = 32000;
const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const hz = midi => 440 * 2 ** ((midi - 69) / 12);
const yieldUI = () => new Promise(resolve => setTimeout(resolve, 0));

function random(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let x = Math.imul(seed ^ seed >>> 15, 1 | seed);
    x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x;
    return ((x ^ x >>> 14) >>> 0) / 4294967296;
  };
}

// Actual phrases, with rests and responses; all pitches belong to D gong.
// A different instrumentation, register and density gives each act its own arc.
function composition() {
  const notes = [];
  const add = (type, t, midi, dur, gain, pan = 0, seed = notes.length + 73) =>
    notes.push({ type, t, midi, dur, gain, pan, seed });
  [[2.8,50],[7.1,57],[11.3,62]].forEach(([t,m],i) => add('pluck',t,m,5.8,.27,-.35+i*.3));
  add('bell',13.2,81,6,.08,.42);

  const river = [50,57,62,64,66,69,66,64,62,59,57,62];
  [16.5,36.8].forEach((start,phrase) => river.forEach((m,i) => {
    const rhythm = [0,1.3,3.2,4.65,6.6,8.8,10.5,12.4,14.7,16.0,17.7,19.2];
    add('pluck',start+rhythm[i],m+(phrase && i===7 ? 5 : 0),4.5,
      i%3===0 ? .27 : .20,Math.sin(i*1.3)*.43);
  }));
  [[26.5,69,3.4],[30.7,66,2.4],[33.9,64,2.5],
   [44.4,66,3.5],[48.5,69,3.1],[52.1,71,2.7],[55.5,69,3.0]]
    .forEach(([t,m,d],i) => add('flute',t,m,d,.14,Math.sin(i)*.18));
  [22.4,34.0,46.5,57.6].forEach(t => add('wood',t,70,.27,.09,-.6));

  const cascade = [62,66,69,74,71,69,66,64,62,59,57,64];
  cascade.forEach((m,i) => add('pluck',61+i*1.32,m,3.8,.25,Math.sin(i*.8)*.6));
  cascade.forEach((m,i) => add('pluck',78+i*1.25,m+(i<4?0:-12),3.7,.27,Math.sin(i*.9+2)*.55));
  [[65.5,74,3.6],[70.1,71,3.0],[75.0,69,4.1],[83.2,66,3.6],[88.0,69,4.6]]
    .forEach(([t,m,d],i) => add('flute',t,m,d,.18,i%2?.2:-.2));
  [63,69,75,81,87,93].forEach((t,i) => add('drum',t,38,2,.20+i*.012,0));
  [66.2,72.1,78.15,84.2,90.1].forEach(t => add('wood',t,69,.27,.12,.45));
  add('bell',94,78,5,.08,-.35);

  [[98.2,50],[102.1,57],[105.1,52],[109.0,59],[113.0,54],[117.1,57],[122.0,50]]
    .forEach(([t,m],i) => add('pluck',t,m,4.7,.25,Math.sin(i)*.35));
  [99,110.8,120.3].forEach((t,i) => add('thunder',t,30,7.0,.32+i*.025,-.4+i*.4));
  [97.8,103.8,107.2,110.3,113.8,117,120.2,123.3]
    .forEach((t,i) => add('drum',t,35,2.3,.24+(i%3)*.035,Math.sin(i)*.15));
  [106.6,106.8,107.0,118.2,118.38,118.58]
    .forEach((t,i) => add('wood',t,65,.24,.065+i%3*.014,.2));
  add('flute',100.4,64,4.4,.085,-.1);
  add('flute',115.7,62,5.3,.105,.1);

  [[127.2,50],[130.0,57],[133.4,62],[136.0,66],[139.4,69],[142.0,66],[146.0,64],[149.4,62]]
    .forEach(([t,m],i) => add('pluck',t,m,5.0,.24,Math.sin(i)*.4));
  [[128.4,74,2.7],[131.8,76,1.8],[134.1,78,3.2],[138.0,81,2.8],
   [141.5,78,2.3],[144.5,76,3.1],[148.2,74,3.5]]
    .forEach(([t,m,d]) => add('flute',t,m,d,.14,-.1));
  [130.5,132.1,142.7,144.2,150.6].forEach((t,i) => add('bird',t,86+i%3,1.0,.055,-.7+i*.32));
  add('bell',127.0,81,6,.075,.45);

  [[154.2,50],[157.0,57],[161.5,62],[166.0,66],[170.5,64],[174.0,62]]
    .forEach(([t,m],i) => add('pluck',t,m,5.7,.22,Math.sin(i)*.3));
  add('flute',156.5,69,5.8,.10,.08);
  add('flute',165.2,66,4.0,.095,-.1);
  add('flute',170.5,62,5.5,.11,0);
  add('bell',153.4,86,7.5,.06,-.35);
  add('bell',174.1,74,5.8,.06,.3);
  return notes.sort((a,b) => a.t-b.t);
}

function makeSine() {
  const table = new Float32Array(16384);
  for (let i=0;i<table.length;i++) table[i]=Math.sin(TAU*i/table.length);
  return phase => table[(phase*2607.5945876176133)&16383];
}

// Each instrument is rendered once per phrase, not kept alive as an oscillator.
function instrument(note, sin) {
  const n = Math.ceil(note.dur*SR), data = new Float32Array(n);
  const rng=random(note.seed*7919), freq=hz(note.midi), delta=TAU*freq/SR;
  let phase=0, low=0, slow=0;
  if(note.type==='pluck') {
    // Fractional-delay Karplus–Strong string, with a little body resonance.
    const delay=SR/freq-.5, size=Math.ceil(delay)+2, ring=new Float32Array(size);
    for(let i=0;i<size;i++) ring[i]=(rng()*2-1)*.76;
    const feedback=Math.exp(-1/(freq*2.55));
    let previous=0, write=0;
    for(let i=0;i<n;i++) {
      const t=i/SR;
      let read=write-delay; if(read<0) read+=size;
      const a=Math.floor(read), f=read-a;
      const v=ring[a]*(1-f)+ring[(a+1)%size]*f;
      ring[write]=.5*(v+previous)*feedback; previous=v;
      if(++write===size) write=0;
      phase+=delta*(1+.0025*Math.exp(-t*16));
      const body=(sin(phase)*.18+sin(phase*2.003)*.035)*Math.exp(-t/1.8);
      data[i]=(v*.94+body)*ease(t/.004)*ease((note.dur-t)/.5);
    }
  } else if(note.type==='flute') {
    for(let i=0;i<n;i++) {
      const t=i/SR, breath=rng()*2-1;
      low+=.12*(breath-low);
      const vibrato=sin(t*TAU*5.05)*.0037*ease((t-.28)/.65);
      phase+=delta*(1+vibrato-.009*Math.exp(-t*16));
      const air=(breath-low)*.026;
      const body=sin(phase)*.71+sin(phase*2+.1)*.20+sin(phase*3)*.075+sin(phase*4)*.017;
      const envelope=ease(t/.23)*ease((note.dur-t)/.42)*(.93+.07*sin(t*TAU*.72));
      data[i]=(body+air)*envelope;
    }
  } else if(note.type==='bell') {
    for(let i=0;i<n;i++) {
      const t=i/SR; phase+=delta;
      data[i]=ease(t/.005)*(sin(phase)*Math.exp(-t/.95)+
        sin(phase*2.009)*.40*Math.exp(-t/1.6)+sin(phase*4.017)*.18*Math.exp(-t/.53))*.65;
    }
  } else if(note.type==='drum') {
    for(let i=0;i<n;i++) {
      const t=i/SR; phase+=TAU*(freq+75*Math.exp(-t*30))/SR;
      const noise=rng()*2-1; low+=.095*(noise-low);
      data[i]=ease(t/.002)*(sin(phase)*.85*Math.exp(-t*3.7)+
        sin(phase*1.61)*.12*Math.exp(-t*6)+low*.6*Math.exp(-t*20));
    }
  } else if(note.type==='wood') {
    for(let i=0;i<n;i++) {
      const t=i/SR;
      data[i]=ease(t/.001)*(sin(t*TAU*810)*.7+sin(t*TAU*1263)*.3)*Math.exp(-t*40);
    }
  } else if(note.type==='thunder') {
    for(let i=0;i<n;i++) {
      const t=i/SR, x=rng()*2-1;
      low+=.014*(x-low); slow+=.003*(x-slow);
      const shape=ease(t/1.1)*ease((note.dur-t)/3.4)*(.65+.35*sin(t*2.8)**2);
      data[i]=(low*2.6+slow*3.2)*shape;
    }
  } else if(note.type==='bird') {
    for(let i=0;i<n;i++) {
      const t=i/SR, syllable=t% .31;
      const chirp=ease(syllable/.026)*ease((.16-syllable)/.05)*ease((note.dur-t)/.3);
      phase+=TAU*(1800+1100*ease(syllable/.14)+160*sin(t*TAU*37))/SR;
      data[i]=(sin(phase)+.15*sin(phase*2))*chirp*.65;
    }
  }
  return data;
}

async function renderScore() {
  const length=SR*SCORE_DURATION;
  const left=new Float32Array(length), right=new Float32Array(length);
  const send=new Float32Array(length), sin=makeSine(), rng=random(0x7368616e);
  // [seconds, river, wind, D/A drone, B/E colour]. Gradual harmonic lighting.
  const points=[
    [0,.020,.023,.64,.04],[15,.050,.015,.76,.09],
    [58,.067,.018,.78,.18],[68,.110,.020,.87,.36],
    [94,.105,.024,.87,.30],[102,.110,.079,.99,.31],
    [120,.102,.088,1.03,.26],[128,.047,.021,.87,.08],
    [151,.031,.014,.78,.06],[161,.023,.013,.65,.025],[180,.014,.009,.42,0]
  ];
  let point=0, lpL=0,lpR=0,windL=0,windR=0,deep=0;
  let water=.02,wind=.02,drone=.6,color=.04;
  const f=[hz(38),hz(45),hz(50),hz(38)*1.0008,hz(47),hz(52)];
  const phases=f.map(()=>0), deltas=f.map(x=>TAU*x/SR);
  for(let i=0;i<length;i++) {
    const t=i/SR;
    if((i&511)===0) {
      while(point<points.length-2 && t>points[point+1][0]) point++;
      const a=points[point],b=points[point+1],u=ease((t-a[0])/(b[0]-a[0]));
      water=a[1]+(b[1]-a[1])*u;wind=a[2]+(b[2]-a[2])*u;
      drone=a[3]+(b[3]-a[3])*u;color=a[4]+(b[4]-a[4])*u;
    }
    const a=rng()*2-1,b=rng()*2-1;
    lpL+=.115*(a-lpL); lpR+=.115*(b-lpR);
    windL+=.006*(a-windL); windR+=.006*(b-windR); deep+=.0014*(a+b-deep);
    for(let j=0;j<6;j++) { phases[j]+=deltas[j]; if(phases[j]>TAU) phases[j]-=TAU; }
    const tide=.78+.15*sin(t*.34)+.07*sin(t*.83);
    const base=(sin(phases[0])*.033+sin(phases[1])*.017+sin(phases[2])*.006+
      sin(phases[3])*.011)*drone*(.92+.08*sin(t*.27));
    const shade=(sin(phases[4])*.013+sin(phases[5])*.009)*color;
    left[i]=base+shade+lpL*water*tide+windL*wind*3.3+deep*wind;
    right[i]=base+shade+lpR*water*tide+windR*wind*3.3+deep*wind;
    if((i&131071)===0) await yieldUI();
  }
  const notes=composition();
  for(let k=0;k<notes.length;k++) {
    const note=notes[k],wave=instrument(note,sin),start=Math.round(note.t*SR);
    const l=Math.sqrt((1-note.pan)*.5)*note.gain;
    const r=Math.sqrt((1+note.pan)*.5)*note.gain;
    const wet=note.type==='thunder'?.11:note.type==='bird'?.19:note.type==='flute'?.30:.40;
    const count=Math.min(wave.length,length-start);
    for(let i=0;i<count;i++) {
      left[start+i]+=wave[i]*l; right[start+i]+=wave[i]*r;
      send[start+i]+=wave[i]*note.gain*wet;
    }
    if(k%6===0) await yieldUI();
  }
  // Small stereo Schroeder hall: four damped combs followed by two allpasses.
  // Tail lengths are fixed and the whole effect is baked into the film clock.
  const combTimes=[.0371,.0411,.0437,.0513];
  const combs=[0,1].map(side=>combTimes.map((seconds,j)=>({
    data:new Float32Array(Math.round((seconds+side*.00107)*SR)),p:0,lp:0,
    feedback:.80-j*.017
  })));
  const aps=[0,1].map(side=>[.0051,.0017].map(seconds=>({
    data:new Float32Array(Math.round((seconds+side*.00029)*SR)),p:0
  })));
  let peak=0;
  for(let i=0;i<length;i++) {
    for(let side=0;side<2;side++) {
      let wet=0;
      for(const c of combs[side]) {
        const v=c.data[c.p];c.lp+=.30*(v-c.lp);
        c.data[c.p]=send[i]+c.lp*c.feedback;
        if(++c.p===c.data.length)c.p=0;
        wet+=v*.23;
      }
      for(const ap of aps[side]) {
        const old=ap.data[ap.p],v=wet;
        wet=old-v*.5;ap.data[ap.p]=v+wet*.5;
        if(++ap.p===ap.data.length)ap.p=0;
      }
      const out=side?right:left,t=i/SR;
      const fade=ease(t/3.4)*ease((SCORE_DURATION-t)/5.5);
      const x=(out[i]+wet)*fade;
      out[i]=x/(1+Math.abs(x)*.22);
      peak=Math.max(peak,Math.abs(out[i]));
    }
    if((i&131071)===0) await yieldUI();
  }
  // Preserve orchestral dynamics, with enough headroom even at the storm peak.
  const normalise=Math.min(2.25,.86/Math.max(.01,peak));
  for(let i=0;i<length;i++) {left[i]*=normalise;right[i]*=normalise;}
  return {left,right,sampleRate:SR,duration:SCORE_DURATION,eventCount:notes.length};
}

export class FilmScore {
  constructor({volume=.86}={}) {
    this.duration=SCORE_DURATION;
    this.volume=clamp(volume);
    this.muted=false;
    this.context=null;
    this.buffer=null;
    this._master=null;
    this._source=null;
    this._sourceGain=null;
    this._sourceAt=0;
    this._filmAt=0;
    this._time=0;
    this._playing=false;
    this._preparing=null;
    this._resumePending=null;
    this._suspendTimer=null;
    this._disposed=false;
    this._retiring=new Set();
  }

  get ready() { return !!this.buffer && !this._disposed; }

  // Call from a real click/tap. Resume is requested before the first await.
  async enable() {
    if(this._disposed) throw new Error('This film score has been disposed.');
    if(!this.context) {
      const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
      if(!Audio) throw new Error('Web Audio is not supported in this browser.');
      this.context=new Audio({latencyHint:'playback'});
      this._master=this.context.createGain();
      this._master.gain.value=0;
      this._master.connect(this.context.destination);
    }
    const resumed=this.context.resume();
    if(!this._preparing && !this.buffer) {
      this._preparing=renderScore().then(pcm=>{
        if(this._disposed)return;
        const buffer=this.context.createBuffer(2,pcm.left.length,pcm.sampleRate);
        buffer.copyToChannel(pcm.left,0);buffer.copyToChannel(pcm.right,1);
        this.buffer=buffer;
      }).finally(()=>{this._preparing=null;});
    }
    await Promise.all([resumed,this._preparing]);
    if(!this._disposed)this.update(this._time,this._playing);
    return this.ready;
  }

  setMuted(muted) {
    this.muted=!!muted;
    this.update(this._time,this._playing);
  }

  _ramp(param,value,seconds=.035) {
    const now=this.context.currentTime;
    if(param.cancelAndHoldAtTime)param.cancelAndHoldAtTime(now);
    else {param.cancelScheduledValues(now);param.setValueAtTime(param.value,now);}
    param.linearRampToValueAtTime(value,now+seconds);
  }

  _stop(fade=.032) {
    if(!this._source)return;
    const source=this._source,gain=this._sourceGain,ctx=this.context;
    this._source=null;this._sourceGain=null;
    this._ramp(gain.gain,0,fade);
    // At most one old crossfade voice can remain, including frantic scrubbing.
    for(const old of this._retiring) {
      try{old.source.stop();}catch{}
      old.source.disconnect();old.gain.disconnect();
    }
    this._retiring.clear();
    const retiring={source,gain};this._retiring.add(retiring);
    source.onended=()=>{source.disconnect();gain.disconnect();this._retiring.delete(retiring);};
    try{source.stop(ctx.currentTime+fade+.004);}catch{}
  }

  _start() {
    const ctx=this.context;
    this._stop(.016);
    const source=ctx.createBufferSource(),gain=ctx.createGain();
    source.buffer=this.buffer;
    gain.gain.setValueAtTime(0,ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1,ctx.currentTime+.024);
    source.connect(gain);gain.connect(this._master);
    this._source=source;this._sourceGain=gain;
    this._sourceAt=ctx.currentTime;this._filmAt=this._time;
    source.onended=()=>{
      if(this._source===source){this._source=null;this._sourceGain=null;}
      source.disconnect();gain.disconnect();
    };
    source.start(ctx.currentTime,this._time);
  }

  /** Synchronise with the actual film timeline, not the number of render calls. */
  update(timeSeconds,isPlaying) {
    if(this._disposed)return;
    const next=Number.isFinite(timeSeconds)?clamp(timeSeconds,0,SCORE_DURATION):0;
    const moved=Math.abs(next-this._time);
    this._time=next;this._playing=!!isPlaying;
    if(!this.context||!this.buffer)return;
    const ctx=this.context;
    const audible=this._playing&&!this.muted&&next<SCORE_DURATION;
    if(!audible) {
      if(this._source) {
        this._ramp(this._master.gain,0,.035);
        this._stop();
      }
      if(!this._suspendTimer&&ctx.state==='running') {
        this._suspendTimer=setTimeout(()=>{
          this._suspendTimer=null;
          if(!this._disposed&&(!this._playing||this.muted||this._time>=SCORE_DURATION))
            ctx.suspend().catch(()=>{});
        },65);
      }
      return;
    }
    clearTimeout(this._suspendTimer);this._suspendTimer=null;
    if(ctx.state!=='running') {
      if(!this._resumePending) {
        this._resumePending=ctx.resume().then(()=>{
          this._resumePending=null;
          if(ctx.state==='running')this.update(this._time,this._playing);
        }).catch(()=>{this._resumePending=null;});
      }
      return;
    }
    const expected=this._filmAt+(ctx.currentTime-this._sourceAt);
    // Scrubs, backward jumps and throttled animation frames are resynchronised.
    if(!this._source||Math.abs(expected-next)>.115||moved>.25)this._start();
    if(this._master.gain.value!==this.volume)this._ramp(this._master.gain,this.volume,.045);
  }

  async dispose() {
    if(this._disposed)return;
    this._disposed=true;
    clearTimeout(this._suspendTimer);
    this._stop(.005);
    for(const old of this._retiring) {
      try{old.source.stop();}catch{}
      old.source.disconnect();old.gain.disconnect();
    }
    this._retiring.clear();
    if(this._master)this._master.disconnect();
    if(this.context&&this.context.state!=='closed')await this.context.close();
    this.buffer=null;
  }
}
