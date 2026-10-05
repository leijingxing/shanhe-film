export const DURATION = 180;
export const CHAPTERS = [
 {start:0,name:'墨生',en:'FROM A SINGLE DROP',title:'一墨生万象',sub:'山在水中醒来。'},
 {start:15,name:'行舟',en:'THE RIVER REMEMBERS',title:'一叶渡千山',sub:'此身随流水，\n不问几重山。'},
 {start:60,name:'飞瀑',en:'THE VOICE OF STONE',title:'万壑生风',sub:'飞流落九天。'},
 {start:96,name:'风起',en:'WHEN INK BECOMES WIND',title:'天地入笔',sub:'风起，山河有回声。'},
 {start:126,name:'逐光',en:'ON THE WINGS OF LIGHT',title:'乘风归去',sub:'借一双羽翼，\n越过山海。'},
 {start:153,name:'归梦',en:'ALL RIVERS RETURN',title:'千山同月',sub:'山河在眼底，\n明月照归心。'},
];
export const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
export const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
export const ease=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10)};
export const mix=(a,b,t)=>a+(b-a)*t;
export const range=(t,a,b)=>smooth((t-a)/(b-a));
export function chapterAt(t){let i=CHAPTERS.length-1;while(i>0&&t<CHAPTERS[i].start)i--;return i}
// Each shot is a continuous camera move in the same three-dimensional river valley.
export const SHOTS=[
 {start:0,end:15,from:[0,160,370],to:[5,50,250],look0:[0,70,-150],look1:[0,60,-140],fov:47},
 {start:15,end:30,from:[5,78,290],to:[-36,31,123],look0:[0,52,-145],look1:[6,23,-65],fov:48},
 {start:30,end:47,from:[-30,13,92],to:[24,10,-6],look0:[5,6,35],look1:[4,8,-74],fov:46},
 {start:47,end:60,from:[30,22,-25],to:[-20,37,-218],look0:[0,40,-190],look1:[-45,85,-391],fov:53},
 {start:60,end:79,from:[0,28,-255],to:[-5,145,-270],look0:[-78,72,-391],look1:[-78,130,-391],fov:56},
 {start:79,end:96,from:[-5,145,-270],to:[-90,215,-305],look0:[-78,130,-391],look1:[-78,60,-391],fov:52},
 {start:96,end:112,from:[-40,70,145],to:[72,87,-85],look0:[0,67,-155],look1:[0,82,-260],fov:56},
 {start:112,end:126,from:[72,87,-85],to:[23,142,-293],look0:[0,82,-260],look1:[0,148,-485],fov:56},
 {start:126,end:141,from:[-38,110,50],to:[70,133,-169],look0:[20,105,-65],look1:[90,120,-299],fov:52},
 {start:141,end:153,from:[70,133,-169],to:[25,285,-340],look0:[90,120,-299],look1:[-50,150,-540],fov:54},
 {start:153,end:168,from:[-55,48,205],to:[-80,68,290],look0:[0,95,-150],look1:[0,95,-180],fov:49},
 {start:168,end:180,from:[-80,68,290],to:[0,175,445],look0:[0,95,-180],look1:[0,100,-200],fov:49},
];
export function shotAt(t){return SHOTS.find(s=>t<s.end)||SHOTS.at(-1)}
export function cameraAt(t){const s=shotAt(t), p=ease((t-s.start)/(s.end-s.start)); return {position:s.from.map((v,i)=>mix(v,s.to[i],p)),look:s.look0.map((v,i)=>mix(v,s.look1[i],p)),fov:s.fov,shot:SHOTS.indexOf(s)}}
export function atmosphereAt(t){return {night:range(t,151,163),storm:range(t,94,103)*(1-range(t,118,128)),sunset:range(t,124,136)*(1-range(t,151,164)),reveal:range(t,1,12),resolve:range(t,170,179)}};
