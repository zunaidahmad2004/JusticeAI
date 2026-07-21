import{a as c,R as k,e as ce,b as Nt}from"./vendor-BJY1W1Z5.js";/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const tt=(...e)=>e.filter((t,n,r)=>!!t&&t.trim()!==""&&r.indexOf(t)===n).join(" ").trim();/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ct=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Tt=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(t,n,r)=>r?r.toUpperCase():n.toLowerCase());/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xe=e=>{const t=Tt(e);return t.charAt(0).toUpperCase()+t.slice(1)};/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var Te={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const St=e=>{for(const t in e)if(t.startsWith("aria-")||t==="role"||t==="title")return!0;return!1},Lt=c.createContext({}),At=()=>c.useContext(Lt),Pt=c.forwardRef(({color:e,size:t,strokeWidth:n,absoluteStrokeWidth:r,className:a="",children:l,iconNode:o,...i},s)=>{const{size:f=24,strokeWidth:d=2,absoluteStrokeWidth:h=!1,color:g="currentColor",className:y=""}=At()??{},m=r??h?Number(n??d)*24/Number(t??f):n??d;return c.createElement("svg",{ref:s,...Te,width:t??f??Te.width,height:t??f??Te.height,stroke:e??g,strokeWidth:m,className:tt("lucide",y,a),...!l&&!St(i)&&{"aria-hidden":"true"},...i},[...o.map(([v,p])=>c.createElement(v,p)),...Array.isArray(l)?l:[l]])});/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=(e,t)=>{const n=c.forwardRef(({className:r,...a},l)=>c.createElement(Pt,{ref:l,iconNode:t,className:tt(`lucide-${Ct(Xe(e))}`,`lucide-${e}`,r),...a}));return n.displayName=Xe(e),n};/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ft=[["path",{d:"M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",key:"169zse"}]],ho=u("activity",Ft);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ot=[["rect",{width:"20",height:"5",x:"2",y:"3",rx:"1",key:"1wp1u1"}],["path",{d:"M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8",key:"1s80jp"}],["path",{d:"M10 12h4",key:"a56b0p"}]],po=u("archive",Ot);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Rt=[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]],yo=u("arrow-left",Rt);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ht=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]],mo=u("arrow-right",Ht);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const jt=[["path",{d:"m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526",key:"1yiouv"}],["circle",{cx:"12",cy:"8",r:"6",key:"1vp47v"}]],vo=u("award",jt);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Dt=[["path",{d:"M10.268 21a2 2 0 0 0 3.464 0",key:"vwvbt9"}],["path",{d:"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",key:"11g9vi"}]],go=u("bell",Dt);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zt=[["path",{d:"M12 7v14",key:"1akyts"}],["path",{d:"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",key:"ruj8y"}]],ko=u("book-open",zt);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Vt=[["path",{d:"M12 8V4H8",key:"hb8ula"}],["rect",{width:"16",height:"12",x:"4",y:"8",rx:"2",key:"enze0r"}],["path",{d:"M2 14h2",key:"vft8re"}],["path",{d:"M20 14h2",key:"4cs60a"}],["path",{d:"M15 13v2",key:"1xurst"}],["path",{d:"M9 13v2",key:"rq6x2g"}]],wo=u("bot",Vt);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qt=[["path",{d:"M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",key:"jecpp"}],["rect",{width:"20",height:"14",x:"2",y:"6",rx:"2",key:"i6l2r4"}]],bo=u("briefcase",qt);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const It=[["path",{d:"M10 12h4",key:"a56b0p"}],["path",{d:"M10 8h4",key:"1sr2af"}],["path",{d:"M14 21v-3a2 2 0 0 0-4 0v3",key:"1rgiei"}],["path",{d:"M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2",key:"secmi2"}],["path",{d:"M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16",key:"16ra0t"}]],Mo=u("building-2",It);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Bt=[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]],Eo=u("calendar",Bt);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ut=[["path",{d:"M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z",key:"18u6gg"}],["circle",{cx:"12",cy:"13",r:"3",key:"1vg3eu"}]],$o=u("camera",Ut);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wt=[["path",{d:"M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2",key:"5owen"}],["circle",{cx:"7",cy:"17",r:"2",key:"u2ysq9"}],["path",{d:"M9 17h6",key:"r8uit2"}],["circle",{cx:"17",cy:"17",r:"2",key:"axvx0g"}]],xo=u("car",Wt);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Yt=[["path",{d:"M3 3v16a2 2 0 0 0 2 2h16",key:"c24i48"}],["path",{d:"M18 17V9",key:"2bz60n"}],["path",{d:"M13 17V5",key:"1frdt8"}],["path",{d:"M8 17v-3",key:"17ska0"}]],_o=u("chart-column",Yt);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Gt=[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]],No=u("check",Gt);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Kt=[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]],Co=u("chevron-down",Kt);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xt=[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]],To=u("chevron-left",Xt);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zt=[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]],So=u("chevron-right",Zt);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qt=[["path",{d:"m18 15-6-6-6 6",key:"153udz"}]],Lo=u("chevron-up",Qt);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Jt=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]],Ao=u("circle-alert",Jt);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const en=[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]],Po=u("circle-check-big",en);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const tn=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],Fo=u("circle-check",tn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const nn=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]],Oo=u("circle-x",nn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const rn=[["rect",{width:"8",height:"4",x:"8",y:"2",rx:"1",ry:"1",key:"tgr4d6"}],["path",{d:"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",key:"116196"}],["path",{d:"M12 11h4",key:"1jrz19"}],["path",{d:"M12 16h4",key:"n85exb"}],["path",{d:"M8 11h.01",key:"1dfujw"}],["path",{d:"M8 16h.01",key:"18s6g9"}]],Ro=u("clipboard-list",rn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const an=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 6v6l4 2",key:"mmk7yg"}]],Ho=u("clock",an);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const on=[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]],jo=u("copy",on);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ln=[["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M17 20v2",key:"1rnc9c"}],["path",{d:"M17 2v2",key:"11trls"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M2 17h2",key:"7oei6x"}],["path",{d:"M2 7h2",key:"asdhe0"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"M20 17h2",key:"1fpfkl"}],["path",{d:"M20 7h2",key:"1o8tra"}],["path",{d:"M7 20v2",key:"4gnj0m"}],["path",{d:"M7 2v2",key:"1i4yhu"}],["rect",{x:"4",y:"4",width:"16",height:"16",rx:"2",key:"1vbyd7"}],["rect",{x:"8",y:"8",width:"8",height:"8",rx:"1",key:"z9xiuo"}]],Do=u("cpu",ln);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const sn=[["path",{d:"M12 15V3",key:"m9g1x1"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["path",{d:"m7 10 5 5 5-5",key:"brsn70"}]],zo=u("download",sn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const cn=[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"M10 14 21 3",key:"gplh6r"}],["path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",key:"a6xqqp"}]],Vo=u("external-link",cn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const un=[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]],qo=u("eye-off",un);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const dn=[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],Io=u("eye",dn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fn=[["path",{d:"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",key:"1oefj6"}],["path",{d:"M14 2v5a1 1 0 0 0 1 1h5",key:"wfsgrz"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]],Bo=u("file-text",fn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const hn=[["path",{d:"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",key:"1oefj6"}],["path",{d:"M14 2v5a1 1 0 0 0 1 1h5",key:"wfsgrz"}]],Uo=u("file",hn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pn=[["path",{d:"M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4",key:"1nerag"}],["path",{d:"M14 13.12c0 2.38 0 6.38-1 8.88",key:"o46ks0"}],["path",{d:"M17.29 21.02c.12-.6.43-2.3.5-3.02",key:"ptglia"}],["path",{d:"M2 12a10 10 0 0 1 18-6",key:"ydlgp0"}],["path",{d:"M2 16h.01",key:"1gqxmh"}],["path",{d:"M21.8 16c.2-2 .131-5.354 0-6",key:"drycrb"}],["path",{d:"M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2",key:"1tidbn"}],["path",{d:"M8.65 22c.21-.66.45-1.32.57-2",key:"13wd9y"}],["path",{d:"M9 6.8a6 6 0 0 1 9 5.2v2",key:"1fr1j5"}]],Wo=u("fingerprint-pattern",pn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const yn=[["path",{d:"m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2",key:"usdka0"}]],Yo=u("folder-open",yn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const mn=[["path",{d:"M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z",key:"sc7q7i"}]],Go=u("funnel",mn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vn=[["path",{d:"m14 13-8.381 8.38a1 1 0 0 1-3.001-3l8.384-8.381",key:"pgg06f"}],["path",{d:"m16 16 6-6",key:"vzrcl6"}],["path",{d:"m21.5 10.5-8-8",key:"a17d9x"}],["path",{d:"m8 8 6-6",key:"18bi4p"}],["path",{d:"m8.5 7.5 8 8",key:"1oyaui"}]],Ko=u("gavel",vn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gn=[["line",{x1:"4",x2:"20",y1:"9",y2:"9",key:"4lhtct"}],["line",{x1:"4",x2:"20",y1:"15",y2:"15",key:"vyu0kd"}],["line",{x1:"10",x2:"8",y1:"3",y2:"21",key:"1ggp8o"}],["line",{x1:"16",x2:"14",y1:"3",y2:"21",key:"weycgp"}]],Xo=u("hash",gn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const kn=[["path",{d:"M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5",key:"mvr1a0"}]],Zo=u("heart",kn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wn=[["path",{d:"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",key:"5wwlr5"}],["path",{d:"M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",key:"r6nss1"}]],Qo=u("house",wn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const bn=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2",key:"1m3agn"}],["circle",{cx:"9",cy:"9",r:"2",key:"af1f0g"}],["path",{d:"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",key:"1xmnt7"}]],Jo=u("image",bn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Mn=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]],el=u("info",Mn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const En=[["path",{d:"m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4",key:"g0fldk"}],["path",{d:"m21 2-9.6 9.6",key:"1j0ho8"}],["circle",{cx:"7.5",cy:"15.5",r:"5.5",key:"yqb3hr"}]],tl=u("key",En);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $n=[["path",{d:"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",key:"zw3jo"}],["path",{d:"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",key:"1wduqc"}],["path",{d:"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",key:"kqbvx6"}]],nl=u("layers",$n);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xn=[["rect",{width:"7",height:"9",x:"3",y:"3",rx:"1",key:"10lvy0"}],["rect",{width:"7",height:"5",x:"14",y:"3",rx:"1",key:"16une8"}],["rect",{width:"7",height:"9",x:"14",y:"12",rx:"1",key:"1hutg5"}],["rect",{width:"7",height:"5",x:"3",y:"16",rx:"1",key:"ldoo1y"}]],rl=u("layout-dashboard",xn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _n=[["path",{d:"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5",key:"1gvzjb"}],["path",{d:"M9 18h6",key:"x1upvd"}],["path",{d:"M10 22h4",key:"ceow96"}]],al=u("lightbulb",_n);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Nn=[["path",{d:"M9 17H7A5 5 0 0 1 7 7h2",key:"8i5ue5"}],["path",{d:"M15 7h2a5 5 0 1 1 0 10h-2",key:"1b9ql8"}],["line",{x1:"8",x2:"16",y1:"12",y2:"12",key:"1jonct"}]],ol=u("link-2",Nn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Cn=[["line",{x1:"2",x2:"5",y1:"12",y2:"12",key:"bvdh0s"}],["line",{x1:"19",x2:"22",y1:"12",y2:"12",key:"1tbv5k"}],["line",{x1:"12",x2:"12",y1:"2",y2:"5",key:"11lu5j"}],["line",{x1:"12",x2:"12",y1:"19",y2:"22",key:"x3vr5v"}],["circle",{cx:"12",cy:"12",r:"7",key:"fim9np"}]],ll=u("locate",Cn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Tn=[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]],il=u("lock",Tn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Sn=[["path",{d:"m16 17 5-5-5-5",key:"1bji2h"}],["path",{d:"M21 12H9",key:"dn1m92"}],["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}]],sl=u("log-out",Sn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ln=[["path",{d:"m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7",key:"132q7q"}],["rect",{x:"2",y:"4",width:"20",height:"16",rx:"2",key:"izxlao"}]],cl=u("mail",Ln);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const An=[["path",{d:"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",key:"1r0f0z"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]],ul=u("map-pin",An);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pn=[["path",{d:"M4 5h16",key:"1tepv9"}],["path",{d:"M4 12h16",key:"1lakjw"}],["path",{d:"M4 19h16",key:"1djgab"}]],dl=u("menu",Pn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fn=[["path",{d:"M12 19v3",key:"npa21l"}],["path",{d:"M19 10v2a7 7 0 0 1-14 0v-2",key:"1vc78b"}],["rect",{x:"9",y:"2",width:"6",height:"13",rx:"3",key:"s6n7sd"}]],fl=u("mic",Fn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const On=[["path",{d:"M6 18h8",key:"1borvv"}],["path",{d:"M3 22h18",key:"8prr45"}],["path",{d:"M14 22a7 7 0 1 0 0-14h-1",key:"1jwaiy"}],["path",{d:"M9 14h2",key:"197e7h"}],["path",{d:"M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z",key:"1bmzmy"}],["path",{d:"M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3",key:"1drr47"}]],hl=u("microscope",On);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Rn=[["path",{d:"M15 18h-5",key:"95g1m2"}],["path",{d:"M18 14h-8",key:"sponae"}],["path",{d:"M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2",key:"39pd36"}],["rect",{width:"8",height:"4",x:"10",y:"6",rx:"1",key:"aywv1n"}]],pl=u("newspaper",Rn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Hn=[["path",{d:"M13 2a9 9 0 0 1 9 9",key:"1itnx2"}],["path",{d:"M13 6a5 5 0 0 1 5 5",key:"11nki7"}],["path",{d:"M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",key:"9njp5v"}]],yl=u("phone-call",Hn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const jn=[["path",{d:"M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",key:"9njp5v"}]],ml=u("phone",jn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Dn=[["path",{d:"M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",key:"10ikf1"}]],vl=u("play",Dn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zn=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]],gl=u("plus",zn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Vn=[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]],kl=u("refresh-cw",Vn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qn=[["path",{d:"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",key:"1c8476"}],["path",{d:"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7",key:"1ydtos"}],["path",{d:"M7 3v4a1 1 0 0 0 1 1h7",key:"t51u73"}]],wl=u("save",qn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const In=[["path",{d:"M12 3v18",key:"108xh3"}],["path",{d:"m19 8 3 8a5 5 0 0 1-6 0zV7",key:"zcdpyk"}],["path",{d:"M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1",key:"1yorad"}],["path",{d:"m5 8 3 8a5 5 0 0 1-6 0zV7",key:"eua70x"}],["path",{d:"M7 21h10",key:"1b0cd5"}]],bl=u("scale",In);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Bn=[["path",{d:"M15 12h-5",key:"r7krc0"}],["path",{d:"M15 8h-5",key:"1khuty"}],["path",{d:"M19 17V5a2 2 0 0 0-2-2H4",key:"zz82l3"}],["path",{d:"M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3",key:"1ph1d7"}]],Ml=u("scroll-text",Bn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Un=[["path",{d:"m21 21-4.34-4.34",key:"14j7rj"}],["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}]],El=u("search",Un);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wn=[["path",{d:"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",key:"1ffxy3"}],["path",{d:"m21.854 2.147-10.94 10.939",key:"12cjpa"}]],$l=u("send",Wn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Yn=[["path",{d:"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",key:"1i5ecw"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],xl=u("settings",Yn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Gn=[["circle",{cx:"18",cy:"5",r:"3",key:"gq8acd"}],["circle",{cx:"6",cy:"12",r:"3",key:"w7nqdw"}],["circle",{cx:"18",cy:"19",r:"3",key:"1xt0gg"}],["line",{x1:"8.59",x2:"15.42",y1:"13.51",y2:"17.49",key:"47mynk"}],["line",{x1:"15.41",x2:"8.59",y1:"6.51",y2:"10.49",key:"1n3mei"}]],_l=u("share-2",Gn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Kn=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"M12 8v4",key:"1got3b"}],["path",{d:"M12 16h.01",key:"1drbdi"}]],Nl=u("shield-alert",Kn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xn=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],Cl=u("shield-check",Xn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zn=[["path",{d:"m2 2 20 20",key:"1ooewy"}],["path",{d:"M5 5a1 1 0 0 0-1 1v7c0 5 3.5 7.5 7.67 8.94a1 1 0 0 0 .67.01c2.35-.82 4.48-1.97 5.9-3.71",key:"1jlk70"}],["path",{d:"M9.309 3.652A12.252 12.252 0 0 0 11.24 2.28a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1v7a9.784 9.784 0 0 1-.08 1.264",key:"18rp1v"}]],Tl=u("shield-off",Zn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qn=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}]],Sl=u("shield",Qn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Jn=[["rect",{width:"14",height:"20",x:"5",y:"2",rx:"2",ry:"2",key:"1yt0o3"}],["path",{d:"M12 18h.01",key:"mhygvu"}]],Ll=u("smartphone",Jn);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const er=[["path",{d:"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",key:"1s2grr"}],["path",{d:"M20 2v4",key:"1rf3ol"}],["path",{d:"M22 4h-4",key:"gwowj6"}],["circle",{cx:"4",cy:"20",r:"2",key:"6kqj1y"}]],Al=u("sparkles",er);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const tr=[["path",{d:"M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",key:"1m0v6g"}],["path",{d:"M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z",key:"ohrbg2"}]],Pl=u("square-pen",tr);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const nr=[["path",{d:"M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z",key:"vktsd0"}],["circle",{cx:"7.5",cy:"7.5",r:".5",fill:"currentColor",key:"kqv944"}]],Fl=u("tag",nr);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const rr=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["circle",{cx:"12",cy:"12",r:"6",key:"1vlfrh"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}]],Ol=u("target",rr);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ar=[["path",{d:"M12 19h8",key:"baeox8"}],["path",{d:"m4 17 6-6-6-6",key:"1yngyt"}]],Rl=u("terminal",ar);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const or=[["path",{d:"M10 11v6",key:"nco0om"}],["path",{d:"M14 11v6",key:"outv1u"}],["path",{d:"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",key:"miytrc"}],["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",key:"e791ji"}]],Hl=u("trash-2",or);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const lr=[["path",{d:"M16 17h6v-6",key:"t6n2it"}],["path",{d:"m22 17-8.5-8.5-5 5L2 7",key:"x473p"}]],jl=u("trending-down",lr);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ir=[["path",{d:"M16 7h6v6",key:"box55l"}],["path",{d:"m22 7-8.5 8.5-5-5L2 17",key:"1t1m79"}]],Dl=u("trending-up",ir);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const sr=[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]],zl=u("triangle-alert",sr);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const cr=[["path",{d:"M12 3v12",key:"1x0j5s"}],["path",{d:"m17 8-5-5-5 5",key:"7q97r8"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}]],Vl=u("upload",cr);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ur=[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]],ql=u("user",ur);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const dr=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["path",{d:"M16 3.128a4 4 0 0 1 0 7.744",key:"16gr8j"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}]],Il=u("users",dr);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fr=[["path",{d:"m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5",key:"ftymec"}],["rect",{x:"2",y:"6",width:"14",height:"12",rx:"2",key:"158x01"}]],Bl=u("video",fr);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const hr=[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]],Ul=u("x",hr);/**
 * @license lucide-react v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pr=[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]],Wl=u("zap",pr);function nt(e){var t,n,r="";if(typeof e=="string"||typeof e=="number")r+=e;else if(typeof e=="object")if(Array.isArray(e)){var a=e.length;for(t=0;t<a;t++)e[t]&&(n=nt(e[t]))&&(r&&(r+=" "),r+=n)}else for(n in e)e[n]&&(r&&(r+=" "),r+=n);return r}function Yl(){for(var e,t,n=0,r="",a=arguments.length;n<a;n++)(e=arguments[n])&&(t=nt(e))&&(r&&(r+=" "),r+=t);return r}var yr=Object.defineProperty,mr=(e,t,n)=>t in e?yr(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,Se=(e,t,n)=>(mr(e,typeof t!="symbol"?t+"":t,n),n);let vr=class{constructor(){Se(this,"current",this.detect()),Se(this,"handoffState","pending"),Se(this,"currentId",0)}set(t){this.current!==t&&(this.handoffState="pending",this.currentId=0,this.current=t)}reset(){this.set(this.detect())}nextId(){return++this.currentId}get isServer(){return this.current==="server"}get isClient(){return this.current==="client"}detect(){return typeof window>"u"||typeof document>"u"?"server":"client"}handoff(){this.handoffState==="pending"&&(this.handoffState="complete")}get isHandoffComplete(){return this.handoffState==="complete"}},H=new vr,S=(e,t)=>{H.isServer?c.useEffect(e,t):c.useLayoutEffect(e,t)};function j(e){let t=c.useRef(e);return S(()=>{t.current=e},[e]),t}let b=function(e){let t=j(e);return k.useCallback((...n)=>t.current(...n),[t])};function Ee(e){typeof queueMicrotask=="function"?queueMicrotask(e):Promise.resolve().then(e).catch(t=>setTimeout(()=>{throw t}))}function X(){let e=[],t={addEventListener(n,r,a,l){return n.addEventListener(r,a,l),t.add(()=>n.removeEventListener(r,a,l))},requestAnimationFrame(...n){let r=requestAnimationFrame(...n);return t.add(()=>cancelAnimationFrame(r))},nextFrame(...n){return t.requestAnimationFrame(()=>t.requestAnimationFrame(...n))},setTimeout(...n){let r=setTimeout(...n);return t.add(()=>clearTimeout(r))},microTask(...n){let r={current:!0};return Ee(()=>{r.current&&n[0]()}),t.add(()=>{r.current=!1})},style(n,r,a){let l=n.style.getPropertyValue(r);return Object.assign(n.style,{[r]:a}),this.add(()=>{Object.assign(n.style,{[r]:l})})},group(n){let r=X();return n(r),this.add(()=>r.dispose())},add(n){return e.push(n),()=>{let r=e.indexOf(n);if(r>=0)for(let a of e.splice(r,1))a()}},dispose(){for(let n of e.splice(0))n()}};return t}function Ie(){let[e]=c.useState(X);return c.useEffect(()=>()=>e.dispose(),[e]),e}function gr(){let e=typeof document>"u";return"useSyncExternalStore"in ce?(t=>t.useSyncExternalStore)(ce)(()=>()=>{},()=>!1,()=>!e):!1}function ee(){let e=gr(),[t,n]=c.useState(H.isHandoffComplete);return t&&H.isHandoffComplete===!1&&n(!1),c.useEffect(()=>{t!==!0&&n(!0)},[t]),c.useEffect(()=>H.handoff(),[]),e?!1:t}var Ze;let te=(Ze=k.useId)!=null?Ze:function(){let e=ee(),[t,n]=k.useState(e?()=>H.nextId():null);return S(()=>{t===null&&n(H.nextId())},[t]),t!=null?""+t:void 0};function E(e,t,...n){if(e in t){let a=t[e];return typeof a=="function"?a(...n):a}let r=new Error(`Tried to handle "${e}" but there is no handler defined. Only defined handlers are: ${Object.keys(t).map(a=>`"${a}"`).join(", ")}.`);throw Error.captureStackTrace&&Error.captureStackTrace(r,E),r}function rt(e){return H.isServer?null:e instanceof Node?e.ownerDocument:e!=null&&e.hasOwnProperty("current")&&e.current instanceof Node?e.current.ownerDocument:document}let Re=["[contentEditable=true]","[tabindex]","a[href]","area[href]","button:not([disabled])","iframe","input:not([disabled])","select:not([disabled])","textarea:not([disabled])"].map(e=>`${e}:not([tabindex='-1'])`).join(",");var Y=(e=>(e[e.First=1]="First",e[e.Previous=2]="Previous",e[e.Next=4]="Next",e[e.Last=8]="Last",e[e.WrapAround=16]="WrapAround",e[e.NoScroll=32]="NoScroll",e))(Y||{}),at=(e=>(e[e.Error=0]="Error",e[e.Overflow=1]="Overflow",e[e.Success=2]="Success",e[e.Underflow=3]="Underflow",e))(at||{}),kr=(e=>(e[e.Previous=-1]="Previous",e[e.Next=1]="Next",e))(kr||{});function wr(e=document.body){return e==null?[]:Array.from(e.querySelectorAll(Re)).sort((t,n)=>Math.sign((t.tabIndex||Number.MAX_SAFE_INTEGER)-(n.tabIndex||Number.MAX_SAFE_INTEGER)))}var ot=(e=>(e[e.Strict=0]="Strict",e[e.Loose=1]="Loose",e))(ot||{});function br(e,t=0){var n;return e===((n=rt(e))==null?void 0:n.body)?!1:E(t,{0(){return e.matches(Re)},1(){let r=e;for(;r!==null;){if(r.matches(Re))return!0;r=r.parentElement}return!1}})}var Mr=(e=>(e[e.Keyboard=0]="Keyboard",e[e.Mouse=1]="Mouse",e))(Mr||{});typeof window<"u"&&typeof document<"u"&&(document.addEventListener("keydown",e=>{e.metaKey||e.altKey||e.ctrlKey||(document.documentElement.dataset.headlessuiFocusVisible="")},!0),document.addEventListener("click",e=>{e.detail===1?delete document.documentElement.dataset.headlessuiFocusVisible:e.detail===0&&(document.documentElement.dataset.headlessuiFocusVisible="")},!0));function K(e){e==null||e.focus({preventScroll:!0})}let Er=["textarea","input"].join(",");function $r(e){var t,n;return(n=(t=e==null?void 0:e.matches)==null?void 0:t.call(e,Er))!=null?n:!1}function xr(e,t=n=>n){return e.slice().sort((n,r)=>{let a=t(n),l=t(r);if(a===null||l===null)return 0;let o=a.compareDocumentPosition(l);return o&Node.DOCUMENT_POSITION_FOLLOWING?-1:o&Node.DOCUMENT_POSITION_PRECEDING?1:0})}function ge(e,t,{sorted:n=!0,relativeTo:r=null,skipElements:a=[]}={}){let l=Array.isArray(e)?e.length>0?e[0].ownerDocument:document:e.ownerDocument,o=Array.isArray(e)?n?xr(e):e:wr(e);a.length>0&&o.length>1&&(o=o.filter(y=>!a.includes(y))),r=r??l.activeElement;let i=(()=>{if(t&5)return 1;if(t&10)return-1;throw new Error("Missing Focus.First, Focus.Previous, Focus.Next or Focus.Last")})(),s=(()=>{if(t&1)return 0;if(t&2)return Math.max(0,o.indexOf(r))-1;if(t&4)return Math.max(0,o.indexOf(r))+1;if(t&8)return o.length-1;throw new Error("Missing Focus.First, Focus.Previous, Focus.Next or Focus.Last")})(),f=t&32?{preventScroll:!0}:{},d=0,h=o.length,g;do{if(d>=h||d+h<=0)return 0;let y=s+d;if(t&16)y=(y+h)%h;else{if(y<0)return 3;if(y>=h)return 1}g=o[y],g==null||g.focus(f),d+=i}while(g!==l.activeElement);return t&6&&$r(g)&&g.select(),2}function lt(){return/iPhone/gi.test(window.navigator.platform)||/Mac/gi.test(window.navigator.platform)&&window.navigator.maxTouchPoints>0}function _r(){return/Android/gi.test(window.navigator.userAgent)}function Nr(){return lt()||_r()}function me(e,t,n){let r=j(t);c.useEffect(()=>{function a(l){r.current(l)}return document.addEventListener(e,a,n),()=>document.removeEventListener(e,a,n)},[e,n])}function it(e,t,n){let r=j(t);c.useEffect(()=>{function a(l){r.current(l)}return window.addEventListener(e,a,n),()=>window.removeEventListener(e,a,n)},[e,n])}function Cr(e,t,n=!0){let r=c.useRef(!1);c.useEffect(()=>{requestAnimationFrame(()=>{r.current=n})},[n]);function a(o,i){if(!r.current||o.defaultPrevented)return;let s=i(o);if(s===null||!s.getRootNode().contains(s)||!s.isConnected)return;let f=(function d(h){return typeof h=="function"?d(h()):Array.isArray(h)||h instanceof Set?h:[h]})(e);for(let d of f){if(d===null)continue;let h=d instanceof HTMLElement?d:d.current;if(h!=null&&h.contains(s)||o.composed&&o.composedPath().includes(h))return}return!br(s,ot.Loose)&&s.tabIndex!==-1&&o.preventDefault(),t(o,s)}let l=c.useRef(null);me("pointerdown",o=>{var i,s;r.current&&(l.current=((s=(i=o.composedPath)==null?void 0:i.call(o))==null?void 0:s[0])||o.target)},!0),me("mousedown",o=>{var i,s;r.current&&(l.current=((s=(i=o.composedPath)==null?void 0:i.call(o))==null?void 0:s[0])||o.target)},!0),me("click",o=>{Nr()||l.current&&(a(o,()=>l.current),l.current=null)},!0),me("touchend",o=>a(o,()=>o.target instanceof HTMLElement?o.target:null),!0),it("blur",o=>a(o,()=>window.document.activeElement instanceof HTMLIFrameElement?window.document.activeElement:null),!0)}function ue(...e){return c.useMemo(()=>rt(...e),[...e])}let st=Symbol();function Tr(e,t=!0){return Object.assign(e,{[st]:t})}function A(...e){let t=c.useRef(e);c.useEffect(()=>{t.current=e},[e]);let n=b(r=>{for(let a of t.current)a!=null&&(typeof a=="function"?a(r):a.current=r)});return e.every(r=>r==null||(r==null?void 0:r[st]))?void 0:n}function Be(e,t){let n=c.useRef([]),r=b(e);c.useEffect(()=>{let a=[...n.current];for(let[l,o]of t.entries())if(n.current[l]!==o){let i=r(t,a);return n.current=t,i}},[r,...t])}function ke(...e){return Array.from(new Set(e.flatMap(t=>typeof t=="string"?t.split(" "):[]))).filter(Boolean).join(" ")}var we=(e=>(e[e.None=0]="None",e[e.RenderStrategy=1]="RenderStrategy",e[e.Static=2]="Static",e))(we||{}),q=(e=>(e[e.Unmount=0]="Unmount",e[e.Hidden=1]="Hidden",e))(q||{});function L({ourProps:e,theirProps:t,slot:n,defaultTag:r,features:a,visible:l=!0,name:o,mergeRefs:i}){i=i??Sr;let s=ct(t,e);if(l)return ve(s,n,r,o,i);let f=a??0;if(f&2){let{static:d=!1,...h}=s;if(d)return ve(h,n,r,o,i)}if(f&1){let{unmount:d=!0,...h}=s;return E(d?0:1,{0(){return null},1(){return ve({...h,hidden:!0,style:{display:"none"}},n,r,o,i)}})}return ve(s,n,r,o,i)}function ve(e,t={},n,r,a){let{as:l=n,children:o,refName:i="ref",...s}=Le(e,["unmount","static"]),f=e.ref!==void 0?{[i]:e.ref}:{},d=typeof o=="function"?o(t):o;"className"in s&&s.className&&typeof s.className=="function"&&(s.className=s.className(t));let h={};if(t){let g=!1,y=[];for(let[m,v]of Object.entries(t))typeof v=="boolean"&&(g=!0),v===!0&&y.push(m);g&&(h["data-headlessui-state"]=y.join(" "))}if(l===c.Fragment&&Object.keys(Qe(s)).length>0){if(!c.isValidElement(d)||Array.isArray(d)&&d.length>1)throw new Error(['Passing props on "Fragment"!',"",`The current component <${r} /> is rendering a "Fragment".`,"However we need to passthrough the following props:",Object.keys(s).map(v=>`  - ${v}`).join(`
`),"","You can apply a few solutions:",['Add an `as="..."` prop, to ensure that we render an actual element instead of a "Fragment".',"Render a single element as the child so that we can forward the props onto that element."].map(v=>`  - ${v}`).join(`
`)].join(`
`));let g=d.props,y=typeof(g==null?void 0:g.className)=="function"?(...v)=>ke(g==null?void 0:g.className(...v),s.className):ke(g==null?void 0:g.className,s.className),m=y?{className:y}:{};return c.cloneElement(d,Object.assign({},ct(d.props,Qe(Le(s,["ref"]))),h,f,{ref:a(d.ref,f.ref)},m))}return c.createElement(l,Object.assign({},Le(s,["ref"]),l!==c.Fragment&&f,l!==c.Fragment&&h),d)}function Sr(...e){return e.every(t=>t==null)?void 0:t=>{for(let n of e)n!=null&&(typeof n=="function"?n(t):n.current=t)}}function ct(...e){if(e.length===0)return{};if(e.length===1)return e[0];let t={},n={};for(let r of e)for(let a in r)a.startsWith("on")&&typeof r[a]=="function"?(n[a]!=null||(n[a]=[]),n[a].push(r[a])):t[a]=r[a];if(t.disabled||t["aria-disabled"])return Object.assign(t,Object.fromEntries(Object.keys(n).map(r=>[r,void 0])));for(let r in n)Object.assign(t,{[r](a,...l){let o=n[r];for(let i of o){if((a instanceof Event||(a==null?void 0:a.nativeEvent)instanceof Event)&&a.defaultPrevented)return;i(a,...l)}}});return t}function N(e){var t;return Object.assign(c.forwardRef(e),{displayName:(t=e.displayName)!=null?t:e.name})}function Qe(e){let t=Object.assign({},e);for(let n in t)t[n]===void 0&&delete t[n];return t}function Le(e,t=[]){let n=Object.assign({},e);for(let r of t)r in n&&delete n[r];return n}let Lr="div";var be=(e=>(e[e.None=1]="None",e[e.Focusable=2]="Focusable",e[e.Hidden=4]="Hidden",e))(be||{});function Ar(e,t){var n;let{features:r=1,...a}=e,l={ref:t,"aria-hidden":(r&2)===2?!0:(n=a["aria-hidden"])!=null?n:void 0,hidden:(r&4)===4?!0:void 0,style:{position:"fixed",top:1,left:1,width:1,height:0,padding:0,margin:-1,overflow:"hidden",clip:"rect(0, 0, 0, 0)",whiteSpace:"nowrap",borderWidth:"0",...(r&4)===4&&(r&2)!==2&&{display:"none"}}};return L({ourProps:l,theirProps:a,slot:{},defaultTag:Lr,name:"Hidden"})}let He=N(Ar),Ue=c.createContext(null);Ue.displayName="OpenClosedContext";var _=(e=>(e[e.Open=1]="Open",e[e.Closed=2]="Closed",e[e.Closing=4]="Closing",e[e.Opening=8]="Opening",e))(_||{});function We(){return c.useContext(Ue)}function Pr({value:e,children:t}){return k.createElement(Ue.Provider,{value:e},t)}function Fr(e){function t(){document.readyState!=="loading"&&(e(),document.removeEventListener("DOMContentLoaded",t))}typeof window<"u"&&typeof document<"u"&&(document.addEventListener("DOMContentLoaded",t),t())}let V=[];Fr(()=>{function e(t){t.target instanceof HTMLElement&&t.target!==document.body&&V[0]!==t.target&&(V.unshift(t.target),V=V.filter(n=>n!=null&&n.isConnected),V.splice(10))}window.addEventListener("click",e,{capture:!0}),window.addEventListener("mousedown",e,{capture:!0}),window.addEventListener("focus",e,{capture:!0}),document.body.addEventListener("click",e,{capture:!0}),document.body.addEventListener("mousedown",e,{capture:!0}),document.body.addEventListener("focus",e,{capture:!0})});function Or(e){let t=e.parentElement,n=null;for(;t&&!(t instanceof HTMLFieldSetElement);)t instanceof HTMLLegendElement&&(n=t),t=t.parentElement;let r=(t==null?void 0:t.getAttribute("disabled"))==="";return r&&Rr(n)?!1:r}function Rr(e){if(!e)return!1;let t=e.previousElementSibling;for(;t!==null;){if(t instanceof HTMLLegendElement)return!1;t=t.previousElementSibling}return!0}var ut=(e=>(e.Space=" ",e.Enter="Enter",e.Escape="Escape",e.Backspace="Backspace",e.Delete="Delete",e.ArrowLeft="ArrowLeft",e.ArrowUp="ArrowUp",e.ArrowRight="ArrowRight",e.ArrowDown="ArrowDown",e.Home="Home",e.End="End",e.PageUp="PageUp",e.PageDown="PageDown",e.Tab="Tab",e))(ut||{});function dt(e,t,n,r){let a=j(n);c.useEffect(()=>{e=e??window;function l(o){a.current(o)}return e.addEventListener(t,l,r),()=>e.removeEventListener(t,l,r)},[e,t,r])}function de(){let e=c.useRef(!1);return S(()=>(e.current=!0,()=>{e.current=!1}),[]),e}function ft(e){let t=b(e),n=c.useRef(!1);c.useEffect(()=>(n.current=!1,()=>{n.current=!0,Ee(()=>{n.current&&t()})}),[t])}var se=(e=>(e[e.Forwards=0]="Forwards",e[e.Backwards=1]="Backwards",e))(se||{});function Hr(){let e=c.useRef(0);return it("keydown",t=>{t.key==="Tab"&&(e.current=t.shiftKey?1:0)},!0),e}function ht(e){if(!e)return new Set;if(typeof e=="function")return new Set(e());let t=new Set;for(let n of e.current)n.current instanceof HTMLElement&&t.add(n.current);return t}let jr="div";var pt=(e=>(e[e.None=1]="None",e[e.InitialFocus=2]="InitialFocus",e[e.TabLock=4]="TabLock",e[e.FocusLock=8]="FocusLock",e[e.RestoreFocus=16]="RestoreFocus",e[e.All=30]="All",e))(pt||{});function Dr(e,t){let n=c.useRef(null),r=A(n,t),{initialFocus:a,containers:l,features:o=30,...i}=e;ee()||(o=1);let s=ue(n);qr({ownerDocument:s},!!(o&16));let f=Ir({ownerDocument:s,container:n,initialFocus:a},!!(o&2));Br({ownerDocument:s,container:n,containers:l,previousActiveElement:f},!!(o&8));let d=Hr(),h=b(v=>{let p=n.current;p&&($=>$())(()=>{E(d.current,{[se.Forwards]:()=>{ge(p,Y.First,{skipElements:[v.relatedTarget]})},[se.Backwards]:()=>{ge(p,Y.Last,{skipElements:[v.relatedTarget]})}})})}),g=Ie(),y=c.useRef(!1),m={ref:r,onKeyDown(v){v.key=="Tab"&&(y.current=!0,g.requestAnimationFrame(()=>{y.current=!1}))},onBlur(v){let p=ht(l);n.current instanceof HTMLElement&&p.add(n.current);let $=v.relatedTarget;$ instanceof HTMLElement&&$.dataset.headlessuiFocusGuard!=="true"&&(yt(p,$)||(y.current?ge(n.current,E(d.current,{[se.Forwards]:()=>Y.Next,[se.Backwards]:()=>Y.Previous})|Y.WrapAround,{relativeTo:v.target}):v.target instanceof HTMLElement&&K(v.target)))}};return k.createElement(k.Fragment,null,!!(o&4)&&k.createElement(He,{as:"button",type:"button","data-headlessui-focus-guard":!0,onFocus:h,features:be.Focusable}),L({ourProps:m,theirProps:i,defaultTag:jr,name:"FocusTrap"}),!!(o&4)&&k.createElement(He,{as:"button",type:"button","data-headlessui-focus-guard":!0,onFocus:h,features:be.Focusable}))}let zr=N(Dr),le=Object.assign(zr,{features:pt});function Vr(e=!0){let t=c.useRef(V.slice());return Be(([n],[r])=>{r===!0&&n===!1&&Ee(()=>{t.current.splice(0)}),r===!1&&n===!0&&(t.current=V.slice())},[e,V,t]),b(()=>{var n;return(n=t.current.find(r=>r!=null&&r.isConnected))!=null?n:null})}function qr({ownerDocument:e},t){let n=Vr(t);Be(()=>{t||(e==null?void 0:e.activeElement)===(e==null?void 0:e.body)&&K(n())},[t]),ft(()=>{t&&K(n())})}function Ir({ownerDocument:e,container:t,initialFocus:n},r){let a=c.useRef(null),l=de();return Be(()=>{if(!r)return;let o=t.current;o&&Ee(()=>{if(!l.current)return;let i=e==null?void 0:e.activeElement;if(n!=null&&n.current){if((n==null?void 0:n.current)===i){a.current=i;return}}else if(o.contains(i)){a.current=i;return}n!=null&&n.current?K(n.current):ge(o,Y.First)===at.Error&&console.warn("There are no focusable elements inside the <FocusTrap />"),a.current=e==null?void 0:e.activeElement})},[r]),a}function Br({ownerDocument:e,container:t,containers:n,previousActiveElement:r},a){let l=de();dt(e==null?void 0:e.defaultView,"focus",o=>{if(!a||!l.current)return;let i=ht(n);t.current instanceof HTMLElement&&i.add(t.current);let s=r.current;if(!s)return;let f=o.target;f&&f instanceof HTMLElement?yt(i,f)?(r.current=f,K(f)):(o.preventDefault(),o.stopPropagation(),K(s)):K(r.current)},!0)}function yt(e,t){for(let n of e)if(n.contains(t))return!0;return!1}let mt=c.createContext(!1);function Ur(){return c.useContext(mt)}function je(e){return k.createElement(mt.Provider,{value:e.force},e.children)}function Wr(e){let t=Ur(),n=c.useContext(vt),r=ue(e),[a,l]=c.useState(()=>{if(!t&&n!==null||H.isServer)return null;let o=r==null?void 0:r.getElementById("headlessui-portal-root");if(o)return o;if(r===null)return null;let i=r.createElement("div");return i.setAttribute("id","headlessui-portal-root"),r.body.appendChild(i)});return c.useEffect(()=>{a!==null&&(r!=null&&r.body.contains(a)||r==null||r.body.appendChild(a))},[a,r]),c.useEffect(()=>{t||n!==null&&l(n.current)},[n,l,t]),a}let Yr=c.Fragment;function Gr(e,t){let n=e,r=c.useRef(null),a=A(Tr(d=>{r.current=d}),t),l=ue(r),o=Wr(r),[i]=c.useState(()=>{var d;return H.isServer?null:(d=l==null?void 0:l.createElement("div"))!=null?d:null}),s=c.useContext(De),f=ee();return S(()=>{!o||!i||o.contains(i)||(i.setAttribute("data-headlessui-portal",""),o.appendChild(i))},[o,i]),S(()=>{if(i&&s)return s.register(i)},[s,i]),ft(()=>{var d;!o||!i||(i instanceof Node&&o.contains(i)&&o.removeChild(i),o.childNodes.length<=0&&((d=o.parentElement)==null||d.removeChild(o)))}),f?!o||!i?null:Nt.createPortal(L({ourProps:{ref:a},theirProps:n,defaultTag:Yr,name:"Portal"}),i):null}let Kr=c.Fragment,vt=c.createContext(null);function Xr(e,t){let{target:n,...r}=e,a={ref:A(t)};return k.createElement(vt.Provider,{value:n},L({ourProps:a,theirProps:r,defaultTag:Kr,name:"Popover.Group"}))}let De=c.createContext(null);function Zr(){let e=c.useContext(De),t=c.useRef([]),n=b(l=>(t.current.push(l),e&&e.register(l),()=>r(l))),r=b(l=>{let o=t.current.indexOf(l);o!==-1&&t.current.splice(o,1),e&&e.unregister(l)}),a=c.useMemo(()=>({register:n,unregister:r,portals:t}),[n,r,t]);return[t,c.useMemo(()=>function({children:l}){return k.createElement(De.Provider,{value:a},l)},[a])]}let Qr=N(Gr),Jr=N(Xr),ze=Object.assign(Qr,{Group:Jr});function ea(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}const ta=typeof Object.is=="function"?Object.is:ea,{useState:na,useEffect:ra,useLayoutEffect:aa,useDebugValue:oa}=ce;function la(e,t,n){const r=t(),[{inst:a},l]=na({inst:{value:r,getSnapshot:t}});return aa(()=>{a.value=r,a.getSnapshot=t,Ae(a)&&l({inst:a})},[e,r,t]),ra(()=>(Ae(a)&&l({inst:a}),e(()=>{Ae(a)&&l({inst:a})})),[e]),oa(r),r}function Ae(e){const t=e.getSnapshot,n=e.value;try{const r=t();return!ta(n,r)}catch{return!0}}function ia(e,t,n){return t()}const sa=typeof window<"u"&&typeof window.document<"u"&&typeof window.document.createElement<"u",ca=!sa,ua=ca?ia:la,da="useSyncExternalStore"in ce?(e=>e.useSyncExternalStore)(ce):ua;function fa(e){return da(e.subscribe,e.getSnapshot,e.getSnapshot)}function ha(e,t){let n=e(),r=new Set;return{getSnapshot(){return n},subscribe(a){return r.add(a),()=>r.delete(a)},dispatch(a,...l){let o=t[a].call(n,...l);o&&(n=o,r.forEach(i=>i()))}}}function pa(){let e;return{before({doc:t}){var n;let r=t.documentElement;e=((n=t.defaultView)!=null?n:window).innerWidth-r.clientWidth},after({doc:t,d:n}){let r=t.documentElement,a=r.clientWidth-r.offsetWidth,l=e-a;n.style(r,"paddingRight",`${l}px`)}}}function ya(){return lt()?{before({doc:e,d:t,meta:n}){function r(a){return n.containers.flatMap(l=>l()).some(l=>l.contains(a))}t.microTask(()=>{var a;if(window.getComputedStyle(e.documentElement).scrollBehavior!=="auto"){let i=X();i.style(e.documentElement,"scrollBehavior","auto"),t.add(()=>t.microTask(()=>i.dispose()))}let l=(a=window.scrollY)!=null?a:window.pageYOffset,o=null;t.addEventListener(e,"click",i=>{if(i.target instanceof HTMLElement)try{let s=i.target.closest("a");if(!s)return;let{hash:f}=new URL(s.href),d=e.querySelector(f);d&&!r(d)&&(o=d)}catch{}},!0),t.addEventListener(e,"touchstart",i=>{if(i.target instanceof HTMLElement)if(r(i.target)){let s=i.target;for(;s.parentElement&&r(s.parentElement);)s=s.parentElement;t.style(s,"overscrollBehavior","contain")}else t.style(i.target,"touchAction","none")}),t.addEventListener(e,"touchmove",i=>{if(i.target instanceof HTMLElement)if(r(i.target)){let s=i.target;for(;s.parentElement&&s.dataset.headlessuiPortal!==""&&!(s.scrollHeight>s.clientHeight||s.scrollWidth>s.clientWidth);)s=s.parentElement;s.dataset.headlessuiPortal===""&&i.preventDefault()}else i.preventDefault()},{passive:!1}),t.add(()=>{var i;let s=(i=window.scrollY)!=null?i:window.pageYOffset;l!==s&&window.scrollTo(0,l),o&&o.isConnected&&(o.scrollIntoView({block:"nearest"}),o=null)})})}}:{}}function ma(){return{before({doc:e,d:t}){t.style(e.documentElement,"overflow","hidden")}}}function va(e){let t={};for(let n of e)Object.assign(t,n(t));return t}let G=ha(()=>new Map,{PUSH(e,t){var n;let r=(n=this.get(e))!=null?n:{doc:e,count:0,d:X(),meta:new Set};return r.count++,r.meta.add(t),this.set(e,r),this},POP(e,t){let n=this.get(e);return n&&(n.count--,n.meta.delete(t)),this},SCROLL_PREVENT({doc:e,d:t,meta:n}){let r={doc:e,d:t,meta:va(n)},a=[ya(),pa(),ma()];a.forEach(({before:l})=>l==null?void 0:l(r)),a.forEach(({after:l})=>l==null?void 0:l(r))},SCROLL_ALLOW({d:e}){e.dispose()},TEARDOWN({doc:e}){this.delete(e)}});G.subscribe(()=>{let e=G.getSnapshot(),t=new Map;for(let[n]of e)t.set(n,n.documentElement.style.overflow);for(let n of e.values()){let r=t.get(n.doc)==="hidden",a=n.count!==0;(a&&!r||!a&&r)&&G.dispatch(n.count>0?"SCROLL_PREVENT":"SCROLL_ALLOW",n),n.count===0&&G.dispatch("TEARDOWN",n)}});function ga(e,t,n){let r=fa(G),a=e?r.get(e):void 0,l=a?a.count>0:!1;return S(()=>{if(!(!e||!t))return G.dispatch("PUSH",e,n),()=>G.dispatch("POP",e,n)},[t,e]),l}let Pe=new Map,ie=new Map;function Je(e,t=!0){S(()=>{var n;if(!t)return;let r=typeof e=="function"?e():e.current;if(!r)return;function a(){var o;if(!r)return;let i=(o=ie.get(r))!=null?o:1;if(i===1?ie.delete(r):ie.set(r,i-1),i!==1)return;let s=Pe.get(r);s&&(s["aria-hidden"]===null?r.removeAttribute("aria-hidden"):r.setAttribute("aria-hidden",s["aria-hidden"]),r.inert=s.inert,Pe.delete(r))}let l=(n=ie.get(r))!=null?n:0;return ie.set(r,l+1),l!==0||(Pe.set(r,{"aria-hidden":r.getAttribute("aria-hidden"),inert:r.inert}),r.setAttribute("aria-hidden","true"),r.inert=!0),a},[e,t])}function ka({defaultContainers:e=[],portals:t,mainTreeNodeRef:n}={}){var r;let a=c.useRef((r=n==null?void 0:n.current)!=null?r:null),l=ue(a),o=b(()=>{var i,s,f;let d=[];for(let h of e)h!==null&&(h instanceof HTMLElement?d.push(h):"current"in h&&h.current instanceof HTMLElement&&d.push(h.current));if(t!=null&&t.current)for(let h of t.current)d.push(h);for(let h of(i=l==null?void 0:l.querySelectorAll("html > *, body > *"))!=null?i:[])h!==document.body&&h!==document.head&&h instanceof HTMLElement&&h.id!=="headlessui-portal-root"&&(h.contains(a.current)||h.contains((f=(s=a.current)==null?void 0:s.getRootNode())==null?void 0:f.host)||d.some(g=>h.contains(g))||d.push(h));return d});return{resolveContainers:o,contains:b(i=>o().some(s=>s.contains(i))),mainTreeNodeRef:a,MainTreeNode:c.useMemo(()=>function(){return n!=null?null:k.createElement(He,{features:be.Hidden,ref:a})},[a,n])}}let Ye=c.createContext(()=>{});Ye.displayName="StackContext";var Ve=(e=>(e[e.Add=0]="Add",e[e.Remove=1]="Remove",e))(Ve||{});function wa(){return c.useContext(Ye)}function ba({children:e,onUpdate:t,type:n,element:r,enabled:a}){let l=wa(),o=b((...i)=>{t==null||t(...i),l(...i)});return S(()=>{let i=a===void 0||a===!0;return i&&o(0,n,r),()=>{i&&o(1,n,r)}},[o,n,r,a]),k.createElement(Ye.Provider,{value:o},e)}let gt=c.createContext(null);function kt(){let e=c.useContext(gt);if(e===null){let t=new Error("You used a <Description /> component, but it is not inside a relevant parent.");throw Error.captureStackTrace&&Error.captureStackTrace(t,kt),t}return e}function Ma(){let[e,t]=c.useState([]);return[e.length>0?e.join(" "):void 0,c.useMemo(()=>function(n){let r=b(l=>(t(o=>[...o,l]),()=>t(o=>{let i=o.slice(),s=i.indexOf(l);return s!==-1&&i.splice(s,1),i}))),a=c.useMemo(()=>({register:r,slot:n.slot,name:n.name,props:n.props}),[r,n.slot,n.name,n.props]);return k.createElement(gt.Provider,{value:a},n.children)},[t])]}let Ea="p";function $a(e,t){let n=te(),{id:r=`headlessui-description-${n}`,...a}=e,l=kt(),o=A(t);S(()=>l.register(r),[r,l.register]);let i={ref:o,...l.props,id:r};return L({ourProps:i,theirProps:a,slot:l.slot||{},defaultTag:Ea,name:l.name||"Description"})}let xa=N($a),_a=Object.assign(xa,{});var Na=(e=>(e[e.Open=0]="Open",e[e.Closed=1]="Closed",e))(Na||{}),Ca=(e=>(e[e.SetTitleId=0]="SetTitleId",e))(Ca||{});let Ta={0(e,t){return e.titleId===t.id?e:{...e,titleId:t.id}}},Me=c.createContext(null);Me.displayName="DialogContext";function fe(e){let t=c.useContext(Me);if(t===null){let n=new Error(`<${e} /> is missing a parent <Dialog /> component.`);throw Error.captureStackTrace&&Error.captureStackTrace(n,fe),n}return t}function Sa(e,t,n=()=>[document.body]){ga(e,t,r=>{var a;return{containers:[...(a=r.containers)!=null?a:[],n]}})}function La(e,t){return E(t.type,Ta,e,t)}let Aa="div",Pa=we.RenderStrategy|we.Static;function Fa(e,t){let n=te(),{id:r=`headlessui-dialog-${n}`,open:a,onClose:l,initialFocus:o,role:i="dialog",__demoMode:s=!1,...f}=e,[d,h]=c.useState(0),g=c.useRef(!1);i=(function(){return i==="dialog"||i==="alertdialog"?i:(g.current||(g.current=!0,console.warn(`Invalid role [${i}] passed to <Dialog />. Only \`dialog\` and and \`alertdialog\` are supported. Using \`dialog\` instead.`)),"dialog")})();let y=We();a===void 0&&y!==null&&(a=(y&_.Open)===_.Open);let m=c.useRef(null),v=A(m,t),p=ue(m),$=e.hasOwnProperty("open")||y!==null,F=e.hasOwnProperty("onClose");if(!$&&!F)throw new Error("You have to provide an `open` and an `onClose` prop to the `Dialog` component.");if(!$)throw new Error("You provided an `onClose` prop to the `Dialog`, but forgot an `open` prop.");if(!F)throw new Error("You provided an `open` prop to the `Dialog`, but forgot an `onClose` prop.");if(typeof a!="boolean")throw new Error(`You provided an \`open\` prop to the \`Dialog\`, but the value is not a boolean. Received: ${a}`);if(typeof l!="function")throw new Error(`You provided an \`onClose\` prop to the \`Dialog\`, but the value is not a function. Received: ${l}`);let w=a?0:1,[C,he]=c.useReducer(La,{titleId:null,descriptionId:null,panelRef:c.createRef()}),x=b(()=>l(!1)),Z=b(M=>he({type:0,id:M})),I=ee()?s?!1:w===0:!1,O=d>1,B=c.useContext(Me)!==null,[ne,Q]=Zr(),re={get current(){var M;return(M=C.panelRef.current)!=null?M:m.current}},{resolveContainers:ae,mainTreeNodeRef:U,MainTreeNode:Ne}=ka({portals:ne,defaultContainers:[re]}),W=O?"parent":"leaf",pe=y!==null?(y&_.Closing)===_.Closing:!1,Ce=B||pe?!1:I,J=c.useCallback(()=>{var M,R;return(R=Array.from((M=p==null?void 0:p.querySelectorAll("body > *"))!=null?M:[]).find(T=>T.id==="headlessui-portal-root"?!1:T.contains(U.current)&&T instanceof HTMLElement))!=null?R:null},[U]);Je(J,Ce);let oe=O?!0:I,D=c.useCallback(()=>{var M,R;return(R=Array.from((M=p==null?void 0:p.querySelectorAll("[data-headlessui-portal]"))!=null?M:[]).find(T=>T.contains(U.current)&&T instanceof HTMLElement))!=null?R:null},[U]);Je(D,oe),Cr(ae,M=>{M.preventDefault(),x()},!(!I||O));let P=!(O||w!==0);dt(p==null?void 0:p.defaultView,"keydown",M=>{P&&(M.defaultPrevented||M.key===ut.Escape&&(M.preventDefault(),M.stopPropagation(),x()))}),Sa(p,!(pe||w!==0||B),ae),c.useEffect(()=>{if(w!==0||!m.current)return;let M=new ResizeObserver(R=>{for(let T of R){let ye=T.target.getBoundingClientRect();ye.x===0&&ye.y===0&&ye.width===0&&ye.height===0&&x()}});return M.observe(m.current),()=>M.disconnect()},[w,m,x]);let[Et,$t]=Ma(),xt=c.useMemo(()=>[{dialogState:w,close:x,setTitleId:Z},C],[w,C,x,Z]),Ke=c.useMemo(()=>({open:w===0}),[w]),_t={ref:v,id:r,role:i,"aria-modal":w===0?!0:void 0,"aria-labelledby":C.titleId,"aria-describedby":Et};return k.createElement(ba,{type:"Dialog",enabled:w===0,element:m,onUpdate:b((M,R)=>{R==="Dialog"&&E(M,{[Ve.Add]:()=>h(T=>T+1),[Ve.Remove]:()=>h(T=>T-1)})})},k.createElement(je,{force:!0},k.createElement(ze,null,k.createElement(Me.Provider,{value:xt},k.createElement(ze.Group,{target:m},k.createElement(je,{force:!1},k.createElement($t,{slot:Ke,name:"Dialog.Description"},k.createElement(le,{initialFocus:o,containers:ae,features:I?E(W,{parent:le.features.RestoreFocus,leaf:le.features.All&~le.features.FocusLock}):le.features.None},k.createElement(Q,null,L({ourProps:_t,theirProps:f,slot:Ke,defaultTag:Aa,features:Pa,visible:w===0,name:"Dialog"}))))))))),k.createElement(Ne,null))}let Oa="div";function Ra(e,t){let n=te(),{id:r=`headlessui-dialog-overlay-${n}`,...a}=e,[{dialogState:l,close:o}]=fe("Dialog.Overlay"),i=A(t),s=b(d=>{if(d.target===d.currentTarget){if(Or(d.currentTarget))return d.preventDefault();d.preventDefault(),d.stopPropagation(),o()}}),f=c.useMemo(()=>({open:l===0}),[l]);return L({ourProps:{ref:i,id:r,"aria-hidden":!0,onClick:s},theirProps:a,slot:f,defaultTag:Oa,name:"Dialog.Overlay"})}let Ha="div";function ja(e,t){let n=te(),{id:r=`headlessui-dialog-backdrop-${n}`,...a}=e,[{dialogState:l},o]=fe("Dialog.Backdrop"),i=A(t);c.useEffect(()=>{if(o.panelRef.current===null)throw new Error("A <Dialog.Backdrop /> component is being used, but a <Dialog.Panel /> component is missing.")},[o.panelRef]);let s=c.useMemo(()=>({open:l===0}),[l]);return k.createElement(je,{force:!0},k.createElement(ze,null,L({ourProps:{ref:i,id:r,"aria-hidden":!0},theirProps:a,slot:s,defaultTag:Ha,name:"Dialog.Backdrop"})))}let Da="div";function za(e,t){let n=te(),{id:r=`headlessui-dialog-panel-${n}`,...a}=e,[{dialogState:l},o]=fe("Dialog.Panel"),i=A(t,o.panelRef),s=c.useMemo(()=>({open:l===0}),[l]),f=b(d=>{d.stopPropagation()});return L({ourProps:{ref:i,id:r,onClick:f},theirProps:a,slot:s,defaultTag:Da,name:"Dialog.Panel"})}let Va="h2";function qa(e,t){let n=te(),{id:r=`headlessui-dialog-title-${n}`,...a}=e,[{dialogState:l,setTitleId:o}]=fe("Dialog.Title"),i=A(t);c.useEffect(()=>(o(r),()=>o(null)),[r,o]);let s=c.useMemo(()=>({open:l===0}),[l]);return L({ourProps:{ref:i,id:r},theirProps:a,slot:s,defaultTag:Va,name:"Dialog.Title"})}let Ia=N(Fa),Ba=N(ja),Ua=N(za),Wa=N(Ra),Ya=N(qa),Kl=Object.assign(Ia,{Backdrop:Ba,Panel:Ua,Overlay:Wa,Title:Ya,Description:_a});function Ga(e=0){let[t,n]=c.useState(e),r=de(),a=c.useCallback(s=>{r.current&&n(f=>f|s)},[t,r]),l=c.useCallback(s=>!!(t&s),[t]),o=c.useCallback(s=>{r.current&&n(f=>f&~s)},[n,r]),i=c.useCallback(s=>{r.current&&n(f=>f^s)},[n]);return{flags:t,addFlag:a,hasFlag:l,removeFlag:o,toggleFlag:i}}function Ka(e){let t={called:!1};return(...n)=>{if(!t.called)return t.called=!0,e(...n)}}function Fe(e,...t){e&&t.length>0&&e.classList.add(...t)}function Oe(e,...t){e&&t.length>0&&e.classList.remove(...t)}function Xa(e,t){let n=X();if(!e)return n.dispose;let{transitionDuration:r,transitionDelay:a}=getComputedStyle(e),[l,o]=[r,a].map(s=>{let[f=0]=s.split(",").filter(Boolean).map(d=>d.includes("ms")?parseFloat(d):parseFloat(d)*1e3).sort((d,h)=>h-d);return f}),i=l+o;if(i!==0){n.group(f=>{f.setTimeout(()=>{t(),f.dispose()},i),f.addEventListener(e,"transitionrun",d=>{d.target===d.currentTarget&&f.dispose()})});let s=n.addEventListener(e,"transitionend",f=>{f.target===f.currentTarget&&(t(),s())})}else t();return n.add(()=>t()),n.dispose}function Za(e,t,n,r){let a=n?"enter":"leave",l=X(),o=r!==void 0?Ka(r):()=>{};a==="enter"&&(e.removeAttribute("hidden"),e.style.display="");let i=E(a,{enter:()=>t.enter,leave:()=>t.leave}),s=E(a,{enter:()=>t.enterTo,leave:()=>t.leaveTo}),f=E(a,{enter:()=>t.enterFrom,leave:()=>t.leaveFrom});return Oe(e,...t.base,...t.enter,...t.enterTo,...t.enterFrom,...t.leave,...t.leaveFrom,...t.leaveTo,...t.entered),Fe(e,...t.base,...i,...f),l.nextFrame(()=>{Oe(e,...t.base,...i,...f),Fe(e,...t.base,...i,...s),Xa(e,()=>(Oe(e,...t.base,...i),Fe(e,...t.base,...t.entered),o()))}),l.dispose}function Qa({immediate:e,container:t,direction:n,classes:r,onStart:a,onStop:l}){let o=de(),i=Ie(),s=j(n);S(()=>{e&&(s.current="enter")},[e]),S(()=>{let f=X();i.add(f.dispose);let d=t.current;if(d&&s.current!=="idle"&&o.current)return f.dispose(),a.current(s.current),f.add(Za(d,r.current,s.current==="enter",()=>{f.dispose(),l.current(s.current)})),f.dispose},[n])}function z(e=""){return e.split(/\s+/).filter(t=>t.length>1)}let $e=c.createContext(null);$e.displayName="TransitionContext";var Ja=(e=>(e.Visible="visible",e.Hidden="hidden",e))(Ja||{});function eo(){let e=c.useContext($e);if(e===null)throw new Error("A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.");return e}function to(){let e=c.useContext(xe);if(e===null)throw new Error("A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.");return e}let xe=c.createContext(null);xe.displayName="NestingContext";function _e(e){return"children"in e?_e(e.children):e.current.filter(({el:t})=>t.current!==null).filter(({state:t})=>t==="visible").length>0}function wt(e,t){let n=j(e),r=c.useRef([]),a=de(),l=Ie(),o=b((y,m=q.Hidden)=>{let v=r.current.findIndex(({el:p})=>p===y);v!==-1&&(E(m,{[q.Unmount](){r.current.splice(v,1)},[q.Hidden](){r.current[v].state="hidden"}}),l.microTask(()=>{var p;!_e(r)&&a.current&&((p=n.current)==null||p.call(n))}))}),i=b(y=>{let m=r.current.find(({el:v})=>v===y);return m?m.state!=="visible"&&(m.state="visible"):r.current.push({el:y,state:"visible"}),()=>o(y,q.Unmount)}),s=c.useRef([]),f=c.useRef(Promise.resolve()),d=c.useRef({enter:[],leave:[],idle:[]}),h=b((y,m,v)=>{s.current.splice(0),t&&(t.chains.current[m]=t.chains.current[m].filter(([p])=>p!==y)),t==null||t.chains.current[m].push([y,new Promise(p=>{s.current.push(p)})]),t==null||t.chains.current[m].push([y,new Promise(p=>{Promise.all(d.current[m].map(([$,F])=>F)).then(()=>p())})]),m==="enter"?f.current=f.current.then(()=>t==null?void 0:t.wait.current).then(()=>v(m)):v(m)}),g=b((y,m,v)=>{Promise.all(d.current[m].splice(0).map(([p,$])=>$)).then(()=>{var p;(p=s.current.shift())==null||p()}).then(()=>v(m))});return c.useMemo(()=>({children:r,register:i,unregister:o,onStart:h,onStop:g,wait:f,chains:d}),[i,o,r,h,g,d,f])}function no(){}let ro=["beforeEnter","afterEnter","beforeLeave","afterLeave"];function et(e){var t;let n={};for(let r of ro)n[r]=(t=e[r])!=null?t:no;return n}function ao(e){let t=c.useRef(et(e));return c.useEffect(()=>{t.current=et(e)},[e]),t}let oo="div",bt=we.RenderStrategy;function lo(e,t){var n,r;let{beforeEnter:a,afterEnter:l,beforeLeave:o,afterLeave:i,enter:s,enterFrom:f,enterTo:d,entered:h,leave:g,leaveFrom:y,leaveTo:m,...v}=e,p=c.useRef(null),$=A(p,t),F=(n=v.unmount)==null||n?q.Unmount:q.Hidden,{show:w,appear:C,initial:he}=eo(),[x,Z]=c.useState(w?"visible":"hidden"),I=to(),{register:O,unregister:B}=I;c.useEffect(()=>O(p),[O,p]),c.useEffect(()=>{if(F===q.Hidden&&p.current){if(w&&x!=="visible"){Z("visible");return}return E(x,{hidden:()=>B(p),visible:()=>O(p)})}},[x,p,O,B,w,F]);let ne=j({base:z(v.className),enter:z(s),enterFrom:z(f),enterTo:z(d),entered:z(h),leave:z(g),leaveFrom:z(y),leaveTo:z(m)}),Q=ao({beforeEnter:a,afterEnter:l,beforeLeave:o,afterLeave:i}),re=ee();c.useEffect(()=>{if(re&&x==="visible"&&p.current===null)throw new Error("Did you forget to passthrough the `ref` to the actual DOM node?")},[p,x,re]);let ae=he&&!C,U=C&&w&&he,Ne=!re||ae?"idle":w?"enter":"leave",W=Ga(0),pe=b(P=>E(P,{enter:()=>{W.addFlag(_.Opening),Q.current.beforeEnter()},leave:()=>{W.addFlag(_.Closing),Q.current.beforeLeave()},idle:()=>{}})),Ce=b(P=>E(P,{enter:()=>{W.removeFlag(_.Opening),Q.current.afterEnter()},leave:()=>{W.removeFlag(_.Closing),Q.current.afterLeave()},idle:()=>{}})),J=wt(()=>{Z("hidden"),B(p)},I),oe=c.useRef(!1);Qa({immediate:U,container:p,classes:ne,direction:Ne,onStart:j(P=>{oe.current=!0,J.onStart(p,P,pe)}),onStop:j(P=>{oe.current=!1,J.onStop(p,P,Ce),P==="leave"&&!_e(J)&&(Z("hidden"),B(p))})});let D=v,Ge={ref:$};return U?D={...D,className:ke(v.className,...ne.current.enter,...ne.current.enterFrom)}:oe.current&&(D.className=ke(v.className,(r=p.current)==null?void 0:r.className),D.className===""&&delete D.className),k.createElement(xe.Provider,{value:J},k.createElement(Pr,{value:E(x,{visible:_.Open,hidden:_.Closed})|W.flags},L({ourProps:Ge,theirProps:D,defaultTag:oo,features:bt,visible:x==="visible",name:"Transition.Child"})))}function io(e,t){let{show:n,appear:r=!1,unmount:a=!0,...l}=e,o=c.useRef(null),i=A(o,t);ee();let s=We();if(n===void 0&&s!==null&&(n=(s&_.Open)===_.Open),![!0,!1].includes(n))throw new Error("A <Transition /> is used but it is missing a `show={true | false}` prop.");let[f,d]=c.useState(n?"visible":"hidden"),h=wt(()=>{d("hidden")}),[g,y]=c.useState(!0),m=c.useRef([n]);S(()=>{g!==!1&&m.current[m.current.length-1]!==n&&(m.current.push(n),y(!1))},[m,n]);let v=c.useMemo(()=>({show:n,appear:r,initial:g}),[n,r,g]);c.useEffect(()=>{if(n)d("visible");else if(!_e(h))d("hidden");else{let w=o.current;if(!w)return;let C=w.getBoundingClientRect();C.x===0&&C.y===0&&C.width===0&&C.height===0&&d("hidden")}},[n,h]);let p={unmount:a},$=b(()=>{var w;g&&y(!1),(w=e.beforeEnter)==null||w.call(e)}),F=b(()=>{var w;g&&y(!1),(w=e.beforeLeave)==null||w.call(e)});return k.createElement(xe.Provider,{value:h},k.createElement($e.Provider,{value:v},L({ourProps:{...p,as:c.Fragment,children:k.createElement(Mt,{ref:i,...p,...l,beforeEnter:$,beforeLeave:F})},theirProps:{},defaultTag:c.Fragment,features:bt,visible:f==="visible",name:"Transition"})))}function so(e,t){let n=c.useContext($e)!==null,r=We()!==null;return k.createElement(k.Fragment,null,!n&&r?k.createElement(qe,{ref:t,...e}):k.createElement(Mt,{ref:t,...e}))}let qe=N(io),Mt=N(lo),co=N(so),Xl=Object.assign(qe,{Child:co,Root:qe});export{qo as $,po as A,wo as B,Eo as C,vl as D,Io as E,Yo as F,Bo as G,Qo as H,Ol as I,$o as J,xo as K,rl as L,hl as M,Mo as N,cl as O,gl as P,ul as Q,kl as R,bl as S,zl as T,Il as U,yl as V,Po as W,Ul as X,Ao as Y,Wl as Z,$l as _,Wo as a,Xo as a0,ml as a1,Fo as a2,el as a3,jl as a4,nl as a5,pl as a6,ll as a7,Vo as a8,Vl as a9,tl as aA,zo as aa,Go as ab,yo as ac,Pl as ad,Hl as ae,Uo as af,wl as ag,fl as ah,Bl as ai,Jo as aj,ol as ak,Fl as al,ko as am,bo as an,al as ao,Lo as ap,Ko as aq,Oo as ar,Rl as as,No as at,jo as au,Xl as av,Kl as aw,Cl as ax,Tl as ay,Ll as az,Zo as b,Yl as c,Nl as d,_l as e,Ro as f,_o as g,go as h,xl as i,Ml as j,Sl as k,So as l,To as m,sl as n,ho as o,Al as p,dl as q,El as r,Co as s,ql as t,Do as u,il as v,Dl as w,vo as x,Ho as y,mo as z};
