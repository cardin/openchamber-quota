(()=>{var S="openchamber.sdk",T=1;var ct=`
:root {
  /* Quiet at rest like the app's own thumbs; hover gives a clear grab target. */
  --oc-scrollbar-thumb: color-mix(in srgb, var(--oc-muted, currentColor) 18%, transparent);
  --oc-scrollbar-thumb-hover: color-mix(in srgb, var(--oc-muted, currentColor) 36%, transparent);
  scrollbar-gutter: stable;
}
* {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}
:hover, [data-oc-scrolling] {
  scrollbar-color: var(--oc-scrollbar-thumb) transparent;
}
/* Chromium's standard scrollbar properties otherwise override its pseudo-elements. */
@supports selector(::-webkit-scrollbar) {
  *, :hover, [data-oc-scrolling] { scrollbar-width: auto; scrollbar-color: auto; }
  ::-webkit-scrollbar { width: 6px; height: 6px; background: transparent; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 999px;
    min-width: 24px;
    min-height: 24px;
  }
  :hover::-webkit-scrollbar-thumb, [data-oc-scrolling]::-webkit-scrollbar-thumb { background: var(--oc-scrollbar-thumb); }
  ::-webkit-scrollbar-thumb:hover { background: var(--oc-scrollbar-thumb-hover); }
  ::-webkit-scrollbar-corner { background: transparent; }
  ::-webkit-scrollbar-button { display: none; width: 0; height: 0; }
}
@media (forced-colors: active) {
  *, :hover, [data-oc-scrolling] { scrollbar-color: auto; }
  ::-webkit-scrollbar-thumb, ::-webkit-scrollbar-thumb:hover { background: CanvasText; }
}
`;function Ao(e){let o=e.documentElement;if(o.hasAttribute("data-oc-scrollbar-activity"))return;o.setAttribute("data-oc-scrollbar-activity","");let n=new WeakMap;e.addEventListener("scroll",(i)=>{let a=i.target===e?o:i.target;if(!(a instanceof Element))return;if(!a.hasAttribute("data-oc-scrolling"))a.setAttribute("data-oc-scrolling","");let u=n.get(a);if(u!==void 0)clearTimeout(u);n.set(a,setTimeout(()=>{n.delete(a),a.removeAttribute("data-oc-scrolling")},1000))},{capture:!0,passive:!0})}var kr=`(${Ao.toString()})(document);`;var lt=128,dt=65536;var ve=128;var Ne=65536;var ut=8000,pt=192000,_t=120000;var Oo=(e)=>{let o=[],n=0,i=0;return{push:(a)=>{o.push(a),i+=a.length;while(i-n>e&&o.length>1){let u=o.shift();i-=u?.length??0,n=0}},pull:(a)=>{let u=0;while(u<a.length&&o.length>0){let h=o[0],f=Math.min(a.length-u,h.length-n);if(a.set(h.subarray(n,n+f),u),u+=f,n+=f,n>=h.length)o.shift(),i-=h.length,n=0}a.fill(0,u)},clear:()=>{o.length=0,n=0,i=0},get size(){return i-n}}};var go=/^[a-z][a-z0-9-]{0,39}$/;var ho=(e)=>Object(e)===e&&!Array.isArray(e),Et=(e,o)=>Object.keys(e).every((n)=>o.includes(n)),mo=(e)=>String(e)===e&&e.length>=1&&e.length<=60,Ro=(e)=>String(e)===e&&e.length>=1&&e.length<=80,Io=(e)=>{if(!Array.isArray(e)||e.length>4)return!1;let o=new Set;for(let n of e){if(!ho(n)||!go.test(n.id)||!mo(n.label))return!1;if(n.disabled!==void 0&&n.disabled!==!0&&n.disabled!==!1)return!1;if(o.has(n.id))return!1;if(o.add(n.id),n.kind==="button"){if(!Et(n,["kind","id","label","disabled"]))return!1;continue}if(n.kind!=="select"||!Et(n,["kind","id","label","value","options","disabled"]))return!1;if(!Ro(n.value)||!Array.isArray(n.options)||n.options.length<1||n.options.length>16)return!1;let i=new Set;for(let a of n.options){if(!ho(a)||!Et(a,["value","label"])||!Ro(a.value)||!mo(a.label)||i.has(a.value))return!1;i.add(a.value)}if(!i.has(n.value))return!1}return!0};var xo=["{id}","{segment}","{segments+}"];var Tn=new Set(xo);var bo=["turn-finished","turn-failed","permission-asked","question-asked","turn-started","session-created","session-archived","session-deleted"];var An=new Set(bo);var Le=20000000,we=256;var St=(e)=>("bytes"in e)?e.bytes.byteLength:e.content.length,Co=(e,o)=>{if(e.path!==o.path||e.readOnly!==o.readOnly)return!1;if(e.encoding==="text"||o.encoding==="text")return e.encoding==="text"&&o.encoding==="text"&&e.content===o.content;if(e.bytes.byteLength!==o.bytes.byteLength)return!1;for(let n=0;n<e.bytes.byteLength;n+=1)if(e.bytes[n]!==o.bytes[n])return!1;return!0};var yo=/^[A-Za-z0-9_-]{1,80}$/;var ko=["left","right","top","bottom"];var Uo=(e,o=0,n={remaining:16000})=>{if(--n.remaining<0||o>=32)return!1;if(e===null)return!0;let i=Array.isArray(e)?e:Object(e)===e?Object.values(e):[];for(let a of i)if(!Uo(a,o+1,n))return!1;return!0},Tt=(e)=>{if(e===null||e===!0||e===!1)return!0;if(Array.isArray(e))return Object.keys(e).every((o)=>/^(0|[1-9]\d*)$/.test(o)&&Number(o)<e.length)&&e.every(Tt);if(Object(e)===e){let o=Object.getPrototypeOf(e);return(o===null||o===Object.prototype)&&Object.values(e).every(Tt)}return String(e)===e||Number.isFinite(e)},ft=(e)=>{try{if(String(e.id)!==e.id||!yo.test(e.id)||!Number.isFinite(e.anchor.x)||Math.abs(e.anchor.x)>1e5||!Number.isFinite(e.anchor.y)||Math.abs(e.anchor.y)>1e5||!Number.isFinite(e.anchor.width)||!Number.isFinite(e.anchor.height)||e.anchor.width<=0||e.anchor.height<=0||e.anchor.width>1e5||e.anchor.height>1e5||!Number.isInteger(e.width)||e.width<160||e.width>640||!Number.isInteger(e.height)||e.height<48||e.height>480||e.side!==void 0&&!ko.includes(e.side)||e.focus!==void 0&&e.focus!==!0&&e.focus!==!1||!Uo(e.data)||!Tt(e.data))return!1;return JSON.stringify(e.data).length<=16000}catch{return!1}};var Ot=2000;var vo=["file","directory","other","missing"],ht=(e)=>Boolean(e&&"sessionId"in e),mt=(e)=>Boolean(e&&"sent"in e&&!("sessionId"in e));var No=/^[0-9a-f]{7,64}$/i,Rt=(e)=>No.test(e),Pe=500,De=32000,Lo=16000,wo=128,Po=200,Do=2000,Go=16000,$o=80,Xo=200,Ho=16000;var Vo=2000;var gt=20000,Ge=1024,$e=2000000;var Xe=64000,He=8000,It=4000;var xt=960000;var Fo=999,Bo=1e4,he=500,Ko=["HOST_UNAVAILABLE","HOST_TIMEOUT","HOST_REJECTED","DISCONNECTED","DISABLED","BAD_PATH","NO_INTEGRATION","NO_SERVICE","SERVICE_FAILED","REQUEST_FAILED","RESPONSE_TOO_LARGE","NO_SESSION","SESSION_BUSY","NOT_GRANTED","NO_DIRECTORY","NOT_FOUND","FILE_TOO_LARGE","DENIED","NO_MODEL","MODEL_FAILED","UNSUPPORTED"],Wo=["stopped","starting","ready","failed"],Mr=new Set(Ko),jo=(e)=>Mr.has(e),zo=(e)=>e&&jo(e)?e:"HOST_REJECTED",ae=(e)=>{if(e===void 0)return!1;if(e===null||e===!0||e===!1)return!0;if(String(e)===e)return!0;if(Number(e)===e)return Number.isFinite(e);if(Array.isArray(e))return e.every(ae);if(Object(e)===e)return Object.values(e).every(ae);return!1},qo=(e)=>ae(e)&&JSON.stringify(e).length<=Ho,Mo=(e)=>e?.trim().slice(0,Xo)??"",ce=(e)=>{let o=e.id.trim().slice(0,wo),n=e.title.trim().slice(0,Po),i=e.url.trim().slice(0,Do),a=e.text?.trim().slice(0,Go),u=e.author?.trim().slice(0,$o),h=e.kind==="pull"?"pull":"issue",f={providerId:e.providerId.trim(),id:o,title:n||o,url:i,kind:h};if(a)f.text=a;if(u)f.author=u;if(h==="pull"){let C=Mo(e.branches?.head),G=Mo(e.branches?.base);if(C&&G)f.branches={head:C,base:G}}if(qo(e.data))f.data=e.data;return f},bt=(e)=>{let o=ce(e);if(e.projectId)o.projectId=e.projectId;if(e.navigation)o.navigation=e.navigation;if(e.worktree)o.worktree=e.worktree;return o},Ct=(e)=>{let o={text:e.text.trim().slice(0,Lo)};if(e.send)o.send=!0;return o},yt=(e)=>{if(e===null||!Number.isFinite(e))return null;return Math.min(Fo,Math.max(0,Math.round(e)))},kt=(e)=>{if(!Number.isFinite(e))return 0;return Math.min(Bo,Math.max(0,Math.ceil(e)))};var le=(e)=>e.length>0&&e.length<=Ge&&!e.includes("\x00")&&!e.includes("\\");var Ve=(e)=>{if(!e.startsWith("/")||e.includes("\x00")||e.includes("\\")||e.includes("://"))return!1;if(e.length>Vo)return!1;return!e.split("/").some((n)=>n==="."||n==="..")},vr=new Set(Wo),Ut=(e)=>Boolean(e&&"status"in e&&vr.has(String(e.status))&&!("body"in e)),Fe=(e)=>Boolean(e&&"status"in e&&"body"in e&&Number.isInteger(e.status)),Mt=(e)=>Boolean(e&&"content"in e&&String(e.content)===e.content),vt=(e)=>Boolean(e&&"written"in e&&e.written===!0),Nt=(e)=>Boolean(e&&"entries"in e&&Array.isArray(e.entries)),Nr=new Set(vo),Lt=(e)=>Boolean(e&&"kind"in e&&"size"in e&&Nr.has(String(e.kind))&&Number.isFinite(e.size)),wt=(e)=>Boolean(e&&"text"in e&&String(e.text)===e.text&&!("status"in e)),Lr=new Set(["workspace","shells","ready","directory","session","connection","settings","session-lifecycle","item","resolve","action","service-event","status-control-event","popover-closed","file-open","file-snapshot","file-saved","generate-late","microphone-audio","microphone-ended"]),wr=(e)=>Object(e)===e?e:null,At=(e)=>String(e)===e&&e.length>0,Pr=(e)=>{if(!At(e.id))return null;if(e.ok===!0){let o={channel:S,v:T,type:"result",id:e.id,ok:!0};if(Object(e.payload)===e.payload)o.payload=e.payload;return o}if(e.ok===!1&&At(e.error))return{channel:S,v:T,type:"result",id:e.id,ok:!1,error:e.error,code:zo(At(e.code)?e.code:void 0)};return null},Pt=(e)=>{let o=wr(e);if(!o||o.channel!==S||o.v!==T)return null;if(o.type==="result")return Pr(o);if(!Lr.has(String(o.type))||Object(o.payload)!==o.payload)return null;return o};var Qo=(e)=>("key"in e)&&("metaKey"in e)&&("ctrlKey"in e),Dr=(e)=>(e.metaKey||e.ctrlKey)&&!e.altKey&&!e.shiftKey&&e.key.toLowerCase()==="s";class d extends Error{code;constructor(e,o){super(o);this.name="HostRequestError",this.code=e}}var Yo=()=>Promise.reject(new d("BAD_PATH",'Request path must start with "/" and stay on the declared origin.')),Be=()=>Promise.reject(new d("BAD_PATH",`File path must be 1 to ${Ge} characters without NUL or backslash.`)),Ke=(e)=>{if(e===void 0)return;if(Object(e)!==e||Array.isArray(e)||e.scope!==void 0&&e.scope!=="instance"&&e.scope!=="device")throw new d("HOST_REJECTED",'Storage scope must be "instance" or "device".');return e.scope==="device"?"device":void 0},E=(e)=>(e.value+=1,`oc-${e.value}`),Dt=(e={})=>{let o=e.target??("window"in globalThis?window:null);if(!o)throw new d("HOST_UNAVAILABLE","No window. connectHost runs in a browser frame.");let n=e.acceptSource??((t)=>t===o.parent),i=e.requestTimeoutMs??gt,a=new Set,u=new Set,h=new Set,f=new Set,C=new Set,G=new Set,q=new Set,te=new Set,Ie=new Set,xe=new Set,be=new Set,oe=new Set,ot=[],Ee=null,Se=null,Ce=new Set,ye=new Set,Te=null,fe=null,rt=!1,re=new Map,ne=new Map,se=new Map,H=!1,_={value:0},p=null,K=null,Ae=!1,Oe=!1,so=null,P=null,io=(t)=>{if(!t)return null;return{sessionId:t.id,phase:t.busy?"started":"completed"}},v=(t)=>{o.parent.postMessage(t,"*")},ao=()=>{if(H||o.parent===o||oe.size===0||p?.features?.lateGenerateResults!==!0)return;v({channel:S,v:T,type:"generate-late-listen"})},m=(t,r)=>{for(let l of t)try{l(r)}catch(c){console.error(c)}},co=(t)=>{if(!(t instanceof MessageEvent))return;if(!n(t.source))return;let r=Pt(t.data);if(!r)return;if(r.type==="workspace"){let c=ne.get(r.payload.subscriptionId);if(c)m([c],r.payload.snapshot);return}if(r.type==="shells"){let c=se.get(r.payload.subscriptionId);if(c)m([c],r.payload.snapshot);return}if(r.type==="microphone-audio"){P?.queue.push(r.payload.samples);return}if(r.type==="microphone-ended"){let c=P;if(!c)return;P=null,c.release(),m(c.endedListeners,r.payload.reason);return}if(r.type==="ready"){if(p=r.payload,K=io(r.payload.session),m(a,r.payload),m(u,r.payload.directory),m(h,r.payload.session),K)m(f,K);if(m(C,r.payload.connection),m(G,r.payload.settings),m(q,r.payload.item),r.payload.block)m(te,r.payload.block);ao();return}if(r.type==="service-event"){m(Ie,r.payload);return}if(r.type==="generate-late"){if(oe.size===0)ot.push(r.payload);else m(oe,r.payload);return}if(r.type==="directory"){if(p)p={...p,directory:r.payload.directory};m(u,r.payload.directory);return}if(r.type==="session"){if(p)p={...p,session:r.payload.session};if(!r.payload.session)K=null;else if(K?.sessionId!==r.payload.session.id)K=io(r.payload.session);m(h,r.payload.session);return}if(r.type==="session-lifecycle"){K=r.payload,m(f,r.payload);return}if(r.type==="connection"){if(p)p={...p,connection:r.payload.connection};m(C,r.payload.connection);return}if(r.type==="settings"){if(p)p={...p,settings:r.payload.settings};m(G,r.payload.settings);return}if(r.type==="item"){if(p)p={...p,item:r.payload.item};m(q,r.payload.item);return}if(r.type==="status-control-event"){m(xe,r.payload);return}if(r.type==="popover-closed"){m(be,r.payload);return}if(r.type==="action"){let c=(O)=>{if(!H)v({channel:S,v:T,type:"action-result",id:r.id,payload:O})},A=Se;if(!A){c({ok:!1,error:"This extension does not handle background actions."});return}Promise.resolve().then(()=>A(r.payload)).then(()=>c({ok:!0}),(O)=>{let R=(O instanceof Error?O.message:String(O)).trim();c({ok:!1,error:(R||"Action failed.").slice(0,he)})});return}if(r.type==="file-open"){let c=r.payload;if(fe&&Co(fe,c))return;fe=c,m(Ce,r.payload);return}if(r.type==="file-saved"){m(ye,r.payload.version);return}if(r.type==="file-snapshot"){let c=(R)=>{if(!H)v({channel:S,v:T,type:"file-snapshot-result",id:r.id,payload:R})},A=(R)=>c({error:(R.trim()||"Could not read the edited file.").slice(0,he)}),O=Te;if(!O){A("This extension does not edit files.");return}Promise.resolve().then(()=>O(r.payload.purpose)).then((R)=>{if(St(R)>Le){A(`The file is over ${Le} ${"bytes"in R?"bytes":"characters"}.`);return}if(R.version.length>we){A(`The snapshot version is over ${we} characters.`);return}c({snapshot:"bytes"in R?{bytes:R.bytes,version:R.version}:{content:R.content,version:R.version}})},(R)=>A(R instanceof Error?R.message:String(R)));return}if(r.type==="resolve"){let c=(O)=>{v({channel:S,v:T,type:"resolve-result",id:r.id,payload:O})},A=Ee;if(!A){c({error:"This extension does not resolve commands."});return}Promise.resolve().then(()=>A(r.payload)).then((O)=>c({item:O?ce(O):null}),(O)=>{let R=(O instanceof Error?O.message:String(O)).trim();c({error:(R||"Command failed.").slice(0,he)})});return}let l=re.get(r.id);if(!l)return;if(clearTimeout(l.timer),re.delete(r.id),r.ok){l.resolve(r.payload);return}l.reject(new d(r.code,r.error))};o.addEventListener("message",co),v({channel:S,v:T,type:"hello"});let k=(t,r=i)=>{if(H||o.parent===o)return Promise.reject(new d("HOST_UNAVAILABLE","No host frame. This page is not in an iframe."));return new Promise((l,c)=>{let A=setTimeout(()=>{re.delete(t.id),c(new d("HOST_TIMEOUT","Host did not answer in time."))},r);re.set(t.id,{resolve:l,reject:c,timer:A}),v(t)})},y=(t)=>k(t).then(()=>{return}),I={channel:S,v:T},nt=(t)=>{if(!H&&o.parent!==o)v(t)},lo=()=>nt({...I,type:"file-save"}),st=()=>{if(!H&&o.parent!==o)v({...I,type:"microphone-close",id:E(_)})},Cr=async()=>{if(P)throw new d("HOST_REJECTED","The microphone is already open in this frame.");if(p?.features?.microphone!==!0)throw new d("UNSUPPORTED","This OpenChamber cannot share the microphone with extensions.");let t=globalThis.AudioContext;if(typeof t!=="function")throw new d("UNSUPPORTED","This frame has no Web Audio.");let r=new t;if(r.sampleRate<ut||r.sampleRate>pt)throw r.close().catch(()=>{return}),new d("UNSUPPORTED",`Audio at ${r.sampleRate} Hz is not supported.`);let l=r.state==="suspended"?r.resume().catch(()=>{return}):void 0,c=Oo(Math.round(r.sampleRate/4)),A=r.createScriptProcessor(1024,1,1);A.onaudioprocess=(X)=>c.pull(X.outputBuffer.getChannelData(0));let O=r.createMediaStreamDestination();A.connect(O);let R=new Set,ie={queue:c,endedListeners:R,release:()=>{A.onaudioprocess=null,A.disconnect(),c.clear();for(let X of O.stream.getTracks())X.stop();r.close().catch(()=>{return})}};P=ie;try{let X=await k({...I,type:"microphone-open",id:E(_),payload:{sampleRate:r.sampleRate}},_t);if(!X||!("opened"in X)||X.opened!==!0)throw new d("HOST_REJECTED","Host did not open the microphone.");if(await l,P!==ie)throw new d("DISCONNECTED","The microphone closed while it was opening.")}catch(X){if(P===ie)P=null;throw ie.release(),st(),X}return{stream:O.stream,close:()=>{if(P!==ie)return;P=null,ie.release(),st()},onEnded:(X)=>(R.add(X),()=>{R.delete(X)})}},uo=(t)=>{if(!Qo(t)||!Dr(t))return;t.preventDefault(),lo()},po=(t)=>{if(!Qo(t)||t.key!=="Escape"||p?.surface!=="popover"||!p.popover)return;t.preventDefault(),To(p.popover.id,"escape").catch(()=>{return})},ke=()=>{let t=p?.surface==="popover"?p.popover:void 0;if(!t)return;let r=Ae||Oe;if(so===r)return;so=r,fo(t.id,r).catch(()=>{return})},Ue=()=>{if(p?.surface!=="popover"||Ae)return;Ae=!0,ke()},_o=(t)=>{if(p?.surface!=="popover"||t.relatedTarget!==null||!Ae)return;Ae=!1,ke()},Eo=()=>{if(p?.surface!=="popover"||Oe)return;Oe=!0,ke()},So=()=>{if(p?.surface!=="popover"||!Oe)return;Oe=!1,ke()},V=(t,r=1024)=>{if(!t.trim()||t.length>r)throw new d("HOST_REJECTED",`Identity must contain 1 to ${r} characters.`)},it=async(t)=>{if(t.kind!=="projects")V(t.projectId);let r=await k({...I,type:"workspace-read",id:E(_),payload:t});if(!r||!("kind"in r)||!("state"in r)||r.kind!==t.kind)throw new d("HOST_REJECTED","Host did not return workspace data.");return r},at=async(t,r)=>{if(t.kind!=="projects")V(t.projectId);let l=E(_);ne.set(l,r);try{await y({...I,type:"workspace-subscribe",id:E(_),payload:{subscriptionId:l,query:t}})}catch(c){if(ne.delete(l),!H)v({...I,type:"workspace-unsubscribe",id:E(_),payload:{subscriptionId:l}});throw c}return()=>{if(!ne.delete(l)||H)return;v({...I,type:"workspace-unsubscribe",id:E(_),payload:{subscriptionId:l}})}},yr=async(t,r)=>{if(t.kind==="session")V(t.sessionId);if(t.kind==="project")V(t.projectId);let l=E(_);se.set(l,r);try{await y({...I,type:"shells-subscribe",id:E(_),payload:{subscriptionId:l,scope:t}})}catch(c){if(se.delete(l),!H)v({...I,type:"shells-unsubscribe",id:E(_),payload:{subscriptionId:l}});throw c}return()=>{if(!se.delete(l)||H)return;v({...I,type:"shells-unsubscribe",id:E(_),payload:{subscriptionId:l}})}},Me=async(t)=>{if("key"in t&&(t.key.length===0||t.key.length>lt))throw new d("HOST_REJECTED","Storage key must contain 1 to 128 characters.");if(t.op==="set"&&!ae(t.value))throw new d("HOST_REJECTED","Storage values must be JSON.");if(t.op==="set"&&new TextEncoder().encode(JSON.stringify(t.value)).length>dt)throw new d("HOST_REJECTED","Storage value exceeds 64 KiB.");if(t.scope==="device"&&p?.features?.deviceStorage!==!0)throw new d("UNSUPPORTED","This host does not support device storage.");let r=await k({...I,type:"storage",id:E(_),payload:t});if(!r||!("storage"in r)||r.op!==t.op)throw new d("HOST_REJECTED","Host did not return storage data.");return r},To=(t,r)=>p?.features?.popovers!==!0&&!(p?.surface==="popover"&&p.popover?.id===t)?Promise.reject(new d("UNSUPPORTED","This host does not support popovers.")):y({...I,type:"popover-close",id:E(_),payload:r?{id:t,reason:r}:{id:t}}),fo=(t,r)=>p?.features?.popovers!==!0&&!(p?.surface==="popover"&&p.popover?.id===t)?Promise.reject(new d("UNSUPPORTED","This host does not support popovers.")):y({...I,type:"popover-anchor",id:E(_),payload:{id:t,active:r}});return o.addEventListener("keydown",po,!0),o.addEventListener("pointerover",Ue),o.addEventListener("pointermove",Ue),o.addEventListener("pointerout",_o),o.addEventListener("focus",Eo),o.addEventListener("blur",So),{onAction:(t)=>(Se=t,()=>{if(Se===t)Se=null}),listProjects:async()=>{let t=await it({kind:"projects"});if(t.kind!=="projects")throw new d("HOST_REJECTED","Expected projects.");return t},listWorktrees:async(t)=>{let r=await it({kind:"worktrees",projectId:t});if(r.kind!=="worktrees")throw new d("HOST_REJECTED","Expected worktrees.");return r},listSessions:async(t)=>{let r=await it({kind:"sessions",projectId:t});if(r.kind!=="sessions")throw new d("HOST_REJECTED","Expected sessions.");return r},onProjects:(t)=>at({kind:"projects"},(r)=>{if(r.kind==="projects")t(r)}),onWorktrees:(t,r)=>at({kind:"worktrees",projectId:t},(l)=>{if(l.kind==="worktrees")r(l)}),onSessions:(t,r)=>at({kind:"sessions",projectId:t},(l)=>{if(l.kind==="sessions")r(l)}),onRunningShells:(t,r)=>yr(t,r),readShellOutput:async(t,r)=>{V(t,ve);let l=r?.cursor;if(l!==void 0&&(!Number.isInteger(l)||l<0))throw new d("HOST_REJECTED","Shell output cursor must be a non-negative integer.");let c=r?.tailBytes;if(c!==void 0&&(!Number.isInteger(c)||c<1||c>Ne))throw new d("HOST_REJECTED",`Shell output tailBytes must be an integer between 1 and ${Ne}.`);let O=await k({...I,type:"shell-output",id:E(_),payload:{shellId:t,cursor:l,tailBytes:c}});if(!O||typeof O.output!=="string"||!Number.isFinite(O.cursor))throw new d("HOST_REJECTED","Host did not return shell output.");return O},stopShell:async(t)=>{if(V(t,ve),(await k({...I,type:"shell-stop",id:E(_),payload:{shellId:t}}))?.stopped!==!0)throw new d("HOST_REJECTED","Host did not stop the shell.");return{stopped:!0}},openSession:async(t)=>{V(t),await y({...I,type:"open-session",id:E(_),payload:{sessionId:t}})},storage:{get:async(t,r)=>{let l=Ke(r),c={op:"get",key:t};if(l)c.scope=l;let A=await Me(c);return A.op==="get"&&A.found?A.value:void 0},set:async(t,r,l)=>{let c=Ke(l),A={op:"set",key:t,value:r};if(c)A.scope=c;await Me(A)},delete:async(t,r)=>{let l=Ke(r),c={op:"delete",key:t};if(l)c.scope=l;await Me(c)},keys:async(t)=>{let r=Ke(t),l={op:"keys"};if(r)l.scope=r;let c=await Me(l);if(c.op!=="keys")throw new d("HOST_REJECTED","Expected storage keys.");return c.keys}},onReady:(t)=>{if(a.add(t),p)t(p);return()=>{a.delete(t)}},onDirectory:(t)=>{if(u.add(t),p)t(p.directory);return()=>{u.delete(t)}},onSession:(t)=>{if(h.add(t),p)t(p.session);return()=>{h.delete(t)}},onSessionLifecycle:(t)=>{if(f.add(t),K)t(K);return()=>{f.delete(t)}},onConnection:(t)=>{if(C.add(t),p)t(p.connection);return()=>{C.delete(t)}},onSettings:(t)=>{if(G.add(t),p)t(p.settings);return()=>{G.delete(t)}},onItem:(t)=>{if(q.add(t),p)t(p.item);return()=>{q.delete(t)}},onBlock:(t)=>{if(te.add(t),p?.block)t(p.block);return()=>{te.delete(t)}},onServiceEvent:(t)=>(Ie.add(t),()=>{Ie.delete(t)}),onStatusControl:(t)=>(xe.add(t),()=>{xe.delete(t)}),onPopoverClosed:(t)=>(be.add(t),()=>{be.delete(t)}),setStatusControls:(t)=>{if(p?.features?.statusControls!==!0)return Promise.reject(new d("UNSUPPORTED","This host does not support status controls."));if(!Io(t))return Promise.reject(new d("HOST_REJECTED","Status controls must have unique bounded ids and valid selected options."));return y({...I,type:"status-controls",id:E(_),payload:{controls:t}})},openPopover:(t)=>{if(p?.features?.popovers!==!0)return Promise.reject(new d("UNSUPPORTED","This host does not support popovers."));if(!ft(t))return Promise.reject(new d("HOST_REJECTED","Popover requests need bounded geometry and JSON data."));return y({...I,type:"popover-open",id:E(_),payload:t})},closePopover:To,setPopoverAnchorActive:fo,onResolve:(t)=>(Ee=t,()=>{if(Ee===t)Ee=null}),toast:(t)=>{let r=t.message.trim();if(!r||r.length>Pe)return Promise.reject(new d("HOST_REJECTED",`Toast message must contain 1 to ${Pe} characters.`));if(t.copy&&t.copy!==!0&&(!t.copy.text.length||t.copy.text.length>De))return Promise.reject(new d("HOST_REJECTED",`Toast copy text must contain 1 to ${De} characters.`));return y({channel:S,v:T,type:"toast",id:E(_),payload:{...t,message:r}})},openUrl:(t)=>y({channel:S,v:T,type:"open-url",id:E(_),payload:{url:t}}),openCommit:(t)=>Rt(t)?y({channel:S,v:T,type:"open-commit",id:E(_),payload:{sha:t}}):Promise.reject(new d("HOST_REJECTED","Commit id must be 7 to 64 hex characters.")),answerBlock:(t)=>y({channel:S,v:T,type:"block-answer",id:E(_),payload:{text:t.trim().slice(0,Ot)}}),openSurface:(t)=>y({channel:S,v:T,type:"open-surface",id:E(_),payload:{surfaceId:t}}),writeClipboard:(t)=>y({channel:S,v:T,type:"clipboard-write",id:E(_),payload:{text:t}}),compose:(t)=>y({channel:S,v:T,type:"compose",id:E(_),payload:t}),attach:(t)=>y({channel:S,v:T,type:"attach",id:E(_),payload:ce(t)}),startSession:async(t)=>{if(t.projectId!==void 0)V(t.projectId);let r=t.worktree;if(r&&r!==!0)if(r.kind==="existing")V(r.directory);else{if(r.name!==void 0)V(r.name,200);if(r.baseBranch!==void 0)V(r.baseBranch,200)}let l=await k({channel:S,v:T,type:"start-session",id:E(_),payload:bt(t)},e.requestTimeoutMs??180000);if(!ht(l))throw new d("HOST_REJECTED","Host did not return a session.");return l},prompt:(t)=>k({channel:S,v:T,type:"prompt",id:E(_),payload:Ct(t)}).then((r)=>{if(!mt(r))throw new d("HOST_REJECTED","Host did not return a prompt result.");return r}),sessionLink:(t)=>y({channel:S,v:T,type:"session-link",id:E(_),payload:ce(t)}),close:()=>y({channel:S,v:T,type:"close",id:E(_)}),oauthStart:()=>y({channel:S,v:T,type:"oauth-start",id:E(_)}),oauthDisconnect:()=>y({channel:S,v:T,type:"oauth-disconnect",id:E(_)}),request:(t)=>(Ve(t.path)?k({channel:S,v:T,type:"request",id:E(_),payload:t}):Yo()).then((r)=>{if(!Fe(r))throw new d("HOST_REJECTED","Host request result was empty.");return r}),serviceRequest:(t)=>(Ve(t.path)?k({channel:S,v:T,type:"service-request",id:E(_),payload:t}):Yo()).then((r)=>{if(!Fe(r))throw new d("HOST_REJECTED","Host service request result was empty.");return r}),serviceStatus:()=>k({channel:S,v:T,type:"service-status",id:E(_)}).then((t)=>{if(!Ut(t))throw new d("HOST_REJECTED","Host did not return service status.");return t}),readFile:(t)=>(le(t)?k({channel:S,v:T,type:"file-read",id:E(_),payload:{path:t}}):Be()).then((r)=>{if(!Mt(r))throw new d("HOST_REJECTED","Host did not return file content.");return r}),writeFile:(t,r)=>{if(!le(t))return Be();if(r.length>$e)return Promise.reject(new d("FILE_TOO_LARGE",`Content is over ${$e} characters.`));return k({channel:S,v:T,type:"file-write",id:E(_),payload:{path:t,content:r}}).then((l)=>{if(!vt(l))throw new d("HOST_REJECTED","Host did not confirm the write.");return l})},listDir:(t)=>(le(t)?k({channel:S,v:T,type:"file-list",id:E(_),payload:{path:t}}):Be()).then((r)=>{if(!Nt(r))throw new d("HOST_REJECTED","Host did not return directory entries.");return r}),stat:(t)=>(le(t)?k({channel:S,v:T,type:"file-stat",id:E(_),payload:{path:t}}):Be()).then((r)=>{if(!Lt(r))throw new d("HOST_REJECTED","Host did not return file status.");return r}),generate:(t)=>{let r=t.prompt.trim(),l=t.system?.trim();if(r.length===0||r.length>Xe)return Promise.reject(new d("HOST_REJECTED",`Prompt must be 1 to ${Xe} characters.`));if(l!==void 0&&(l.length===0||l.length>He))return Promise.reject(new d("HOST_REJECTED",`System prompt must be 1 to ${He} characters.`));let c=t.maxOutputTokens===void 0?void 0:Math.min(It,Math.max(1,Math.floor(t.maxOutputTokens)));if(c!==void 0&&!Number.isFinite(c))return Promise.reject(new d("HOST_REJECTED","maxOutputTokens must be a number."));let A={prompt:r};if(l!==void 0)A.system=l;if(c!==void 0)A.maxOutputTokens=c;return k({channel:S,v:T,type:"generate",id:E(_),payload:A},e.requestTimeoutMs??xt).then((O)=>{if(!wt(O))throw new d("HOST_REJECTED","Host did not return generated text.");return O})},onLateGenerateResult:(t)=>{oe.add(t);for(let r of ot.splice(0))m([t],r);return ao(),()=>{oe.delete(t)}},openMicrophone:Cr,setBadge:(t)=>y({channel:S,v:T,type:"badge",id:E(_),payload:{count:yt(t)}}),setHeight:(t)=>y({channel:S,v:T,type:"resize",id:E(_),payload:{height:kt(t)}}),onFileOpen:(t)=>{if(Ce.add(t),!rt)rt=!0,o.addEventListener("keydown",uo,!0);if(fe)t(fe);return()=>{Ce.delete(t)}},onFileSnapshot:(t)=>(Te=t,()=>{if(Te===t)Te=null}),onFileSaved:(t)=>(ye.add(t),()=>{ye.delete(t)}),reportFileChange:(t)=>nt({...I,type:"file-change",payload:{dirty:t.dirty,edited:t.edited}}),requestFileSave:lo,reportFileUnsupported:()=>nt({...I,type:"file-unsupported"}),dispose:()=>{for(let t of ne.keys())v({...I,type:"workspace-unsubscribe",id:E(_),payload:{subscriptionId:t}});ne.clear();for(let t of se.keys())v({...I,type:"shells-unsubscribe",id:E(_),payload:{subscriptionId:t}});if(se.clear(),P)st(),P.release(),P=null;if(H=!0,Ee=null,Se=null,Te=null,Ce.clear(),ye.clear(),rt)o.removeEventListener("keydown",uo,!0);o.removeEventListener("message",co),o.removeEventListener("keydown",po,!0),o.removeEventListener("pointerover",Ue),o.removeEventListener("pointermove",Ue),o.removeEventListener("pointerout",_o),o.removeEventListener("focus",Eo),o.removeEventListener("blur",So);for(let t of re.values())clearTimeout(t.timer),t.reject(new d("HOST_UNAVAILABLE","Host client was disposed."));re.clear(),a.clear(),u.clear(),h.clear(),f.clear(),C.clear(),G.clear(),q.clear(),te.clear(),Ie.clear(),xe.clear(),be.clear(),oe.clear(),ot.length=0}}};var Jo=["browser.open","browser.snapshot","browser.click","browser.type","browser.select","browser.scroll","browser.back","browser.forward","browser.inspect","browser.capture","browser.resize","browser.close"];var wn=new Set(Jo);var Zo=["none","agent","user"];var Dn=new Set(Zo);var Gr=[["--oc-bg","background"],["--oc-elevated","elevated"],["--oc-fg","foreground"],["--oc-muted","muted"],["--oc-subtle","subtle"],["--oc-border","border"],["--oc-hover","hover"],["--oc-selection","selection"],["--oc-focus","focus"],["--oc-primary","primary"],["--oc-muted-surface","mutedSurface"],["--oc-elevated-fg","elevatedForeground"],["--oc-active","active"],["--oc-selection-fg","selectionForeground"],["--oc-primary-fg","primaryForeground"],["--oc-primary-text","primaryText"],["--oc-success-text","successText"],["--oc-warning-text","warningText"],["--oc-error-text","errorText"],["--oc-info-text","infoText"],["--oc-success","success"],["--oc-warning","warning"],["--oc-error","error"],["--oc-info","info"],["--oc-font","font"],["--oc-mono","mono"],["--oc-radius","radius"],["--surface-background","background"],["--surface-elevated","elevated"],["--surface-foreground","foreground"],["--surface-muted-foreground","muted"],["--surface-subtle","subtle"],["--interactive-border","border"],["--interactive-hover","hover"],["--interactive-selection","selection"],["--interactive-focus-ring","focus"],["--primary","primary"],["--surface-muted","mutedSurface"],["--surface-elevated-foreground","elevatedForeground"],["--interactive-active","active"],["--interactive-selection-foreground","selectionForeground"],["--primary-foreground","primaryForeground"],["--primary-text","primaryText"],["--success-text","successText"],["--warning-text","warningText"],["--error-text","errorText"],["--info-text","infoText"],["--status-success","success"],["--status-warning","warning"],["--status-error","error"],["--status-info","info"],["--font-sans","font"],["--font-mono","mono"],["--radius","radius"]],$r=[["--oc-syntax-keyword","--syntax-keyword","syntaxKeyword"],["--oc-syntax-string","--syntax-string","syntaxString"],["--oc-syntax-number","--syntax-number","syntaxNumber"],["--oc-syntax-function","--syntax-function","syntaxFunction"],["--oc-syntax-type","--syntax-type","syntaxType"],["--oc-syntax-comment","--syntax-comment","syntaxComment"],["--oc-syntax-variable","--syntax-variable","syntaxVariable"],["--oc-syntax-operator","--syntax-operator","syntaxOperator"]],er=(e,o)=>{o.style.colorScheme=e.mode;for(let[n,i]of Gr)o.style.setProperty(n,e.tokens[i]);for(let[n,i,a]of $r){let u=e.tokens[a]??"";o.style.setProperty(n,u),o.style.setProperty(i,u)}o.style.setProperty("font-family",e.tokens.font),o.style.setProperty("font-size",e.tokens.fontSize??"0.875rem"),o.style.setProperty("line-height","1.45"),o.style.setProperty("color",e.tokens.foreground)},Gt=(e,o)=>{if(er(e.theme,o),o.dataset)o.dataset.ocSurface=e.surface,o.dataset.ocTheme=e.theme.mode};var Xr={"surface-background":"bg","surface-elevated":"elevated","surface-elevated-foreground":"elevated-fg","surface-foreground":"fg","surface-muted-foreground":"muted","surface-muted":"muted-surface","surface-subtle":"subtle","interactive-border":"border","interactive-hover":"hover","interactive-active":"active","interactive-selection":"selection","interactive-selection-foreground":"selection-fg","interactive-focus-ring":"focus",primary:"primary","primary-foreground":"primary-fg","primary-text":"primary-text","success-text":"success-text","warning-text":"warning-text","error-text":"error-text","info-text":"info-text","status-success":"success","status-warning":"warning","status-error":"error","status-info":"info","font-sans":"font","font-mono":"mono",radius:"radius"},g=(e,o)=>`var(--${e}, var(--oc-${Xr[e]}, ${o}))`,j=g("surface-background","transparent"),je=g("surface-elevated","transparent"),de=g("surface-elevated-foreground","inherit"),D=g("surface-foreground","inherit"),x=g("surface-muted-foreground","gray"),Hr=g("surface-muted","transparent"),Q=g("interactive-border","currentColor"),N=g("interactive-hover","transparent"),Y=g("interactive-active","transparent"),$t=g("interactive-selection","transparent"),Xt=g("interactive-selection-foreground","inherit"),W=g("primary","currentColor"),Ht=g("primary-text","inherit"),Vt=g("error-text","inherit"),Vr=g("font-sans","inherit"),Ft=g("font-mono","monospace"),nr=g("radius","9px"),Bt=`calc(${nr} - 2px)`,tr=`calc(${nr} - 4px)`,b=(e,o,n="transparent")=>`color-mix(in srgb, ${e} ${o}%, ${n})`,or=`background-image: linear-gradient(${N}, ${N});`,Kt=(e,o="0.5px")=>`box-shadow: inset 0 0 0 ${o} ${e}, var(--oc-sdk-field-lift);`,Wt="border-color: var(--oc-sdk-edge); box-shadow: var(--oc-sdk-raised-lift);",rr="box-shadow: var(--oc-sdk-lit);",jt=`inset 0 0.5px 0 0 ${b(D,8)}, 0 1px 2px 0 rgb(0 0 0 / 0.4)`,Fr=`
:root {
  --oc-sdk-edge: ${b(D,16)};
  --oc-sdk-field-bg: ${je};
  --oc-sdk-raised-bg: ${j};
  --oc-sdk-field-lift: inset 0 1px 2px 0 rgb(0 0 0 / 0.04);
  --oc-sdk-raised-lift: 0 1px 1.5px 0 rgb(0 0 0 / 0.08);
  --oc-sdk-lit: inset 0 1px 0 0 rgb(255 255 255 / 0.2), 0 1px 1.5px 0 rgb(0 0 0 / 0.1);
  --oc-sdk-float-edge: rgb(0 0 0 / 0.14);
  --oc-sdk-float: inset 0 1px 0 0 rgb(255 255 255 / 0.7), 0 1px 2px -0.5px rgb(0 0 0 / 0.06), 0 4px 8px -2px rgb(0 0 0 / 0.08), 0 12px 20px -4px rgb(0 0 0 / 0.06);
}
:root[data-oc-theme="dark"] {
  --oc-sdk-edge: ${b(D,14)};
  --oc-sdk-field-bg: ${b(j,50,je)};
  --oc-sdk-raised-bg: ${je};
  --oc-sdk-field-lift: ${jt};
  --oc-sdk-raised-lift: ${jt};
  --oc-sdk-lit: ${jt};
  --oc-sdk-float-edge: rgb(0 0 0 / 0.55);
  --oc-sdk-float: inset 0 1px 0 0 rgb(255 255 255 / 0.04), inset 0 0 0 0.5px rgb(255 255 255 / 0.08), 0 8px 16px 0 rgb(0 0 0 / 0.25), 0 4px 8px 0 rgb(0 0 0 / 0.25);
}`,We=(e)=>{let o=g(`status-${e}`,"currentColor");return`
.oc-sdk[data-tone="${e}"], .oc-sdk [data-tone="${e}"] { --oc-sdk-tone: ${o}; --oc-sdk-tone-text: ${g(`${e}-text`,"inherit")}; }`},s=(e)=>`calc(${e}rem / 14)`,Br=`
.oc-sdk { box-sizing: border-box; font-size: 0.875rem; line-height: 1.45; }
.oc-sdk *, .oc-sdk *::before, .oc-sdk *::after { box-sizing: border-box; }
/* :where() keeps the reset at zero specificity so every primitive class below overrides it. */
:where(.oc-sdk) :where(button, input, textarea), :where(button.oc-sdk, input.oc-sdk, textarea.oc-sdk) { font: inherit; color: inherit; margin: 0; }
:where(.oc-sdk) :where(button), :where(button.oc-sdk) { cursor: pointer; background: none; border: 0; padding: 0; }
.oc-sdk button:disabled, button.oc-sdk:disabled, .oc-sdk[aria-disabled="true"], .oc-sdk [aria-disabled="true"] { opacity: .5; pointer-events: none; }

.oc-sdk-btn { display: inline-flex; align-items: center; justify-content: center; gap: ${s(8)}; height: ${s(32)}; padding: 0 ${s(12)}; border: 1px solid transparent; font-size: 0.875rem; font-weight: 500; line-height: 1; white-space: nowrap; }
.oc-sdk-btn[data-size="sm"] { gap: ${s(6)}; height: ${s(28)}; padding: 0 ${s(10)}; font-size: 0.8125rem; }
.oc-sdk-btn[data-size="xs"] { gap: ${s(4)}; height: ${s(24)}; padding: 0 ${s(8)}; font-size: 0.75rem; }
.oc-sdk-btn[data-loading="true"] { opacity: .5; pointer-events: none; }
.oc-sdk-btn > .oc-sdk-spinner-ring { width: ${s(14)}; height: ${s(14)}; }

.oc-sdk-field { display: flex; flex-direction: column; gap: ${s(4)}; min-width: 0; }
.oc-sdk-field-label { font-size: 0.8125rem; font-weight: 500; }
.oc-sdk-field-note { font-size: 0.75rem; }
.oc-sdk-input { display: block; width: 100%; min-width: 0; height: ${s(32)}; padding: 0 ${s(10)}; border: 0; font-size: 0.875rem; line-height: 1.45; appearance: none; }
textarea.oc-sdk-input { height: auto; padding: ${s(8)} ${s(10)}; resize: vertical; }

.oc-sdk-search { position: relative; min-width: 0; }
.oc-sdk-search .oc-sdk-input { padding-left: ${s(34)}; padding-right: ${s(34)}; }
.oc-sdk-search-icon { position: absolute; left: ${s(11)}; top: 50%; transform: translateY(-50%); pointer-events: none; }
.oc-sdk-search-clear { position: absolute; right: ${s(6)}; top: 50%; transform: translateY(-50%); display: none; align-items: center; justify-content: center; width: ${s(24)}; height: ${s(24)}; }
.oc-sdk-search[data-active="true"] .oc-sdk-search-clear { display: inline-flex; }

.oc-sdk-select { position: relative; display: flex; flex-direction: column; gap: ${s(4)}; min-width: 0; }
.oc-sdk-trigger { display: inline-flex; align-items: center; gap: ${s(6)}; align-self: flex-start; width: auto; max-width: 100%; min-width: 0; height: ${s(28)}; padding: 0 ${s(10)}; border: 1px solid transparent; font-size: 0.8125rem; text-align: left; }
.oc-sdk-trigger-value { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-trigger-chevron { flex: 0 0 auto; }
.oc-sdk-popup { position: fixed; z-index: 50; display: flex; flex-direction: column; gap: ${s(2)}; min-width: ${s(160)}; max-width: calc(100vw - ${s(16)}); max-height: min(${s(320)}, calc(100vh - ${s(16)})); overflow: auto; padding: ${s(4)}; border: 1px solid transparent; }
.oc-sdk-popup-search { flex: 0 0 auto; padding: ${s(2)} ${s(2)} ${s(4)}; }
.oc-sdk-popup-search .oc-sdk-input { height: ${s(28)}; font-size: 0.8125rem; }
.oc-sdk-option { display: flex; align-items: center; gap: ${s(8)}; width: 100%; padding: ${s(6)} ${s(8)}; font-size: 0.8125rem; text-align: left; }
.oc-sdk-option-label { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-option-hint { flex: 0 0 auto; font-size: 0.75rem; }
.oc-sdk-option-check { flex: 0 0 auto; display: inline-flex; width: ${s(14)}; visibility: hidden; }
.oc-sdk-option[aria-selected="true"] > .oc-sdk-option-check { visibility: visible; }
.oc-sdk-popup-empty { padding: ${s(8)}; font-size: 0.8125rem; }

.oc-sdk-check { display: inline-flex; align-items: flex-start; gap: ${s(8)}; width: 100%; text-align: left; }
.oc-sdk-check-box { flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; width: ${s(14)}; height: ${s(14)}; margin-top: ${s(3)}; border: 1px solid transparent; }
.oc-sdk-check-box > svg { display: none; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-box > svg { display: block; }
.oc-sdk-check-thumb { flex: 0 0 auto; position: relative; width: ${s(36)}; height: ${s(20)}; --oc-sdk-thumb-travel: ${s(16)}; }
.oc-sdk-check-thumb::after { content: ""; position: absolute; top: ${s(2)}; left: ${s(2)}; width: ${s(16)}; height: ${s(16)}; }
.oc-sdk-check-text { display: flex; flex-direction: column; min-width: 0; }
.oc-sdk-check-label { font-size: 0.875rem; }
.oc-sdk-check-desc { font-size: 0.75rem; }

.oc-sdk-tabs { display: inline-flex; gap: ${s(2)}; padding: ${s(2)}; max-width: 100%; overflow: auto; }
.oc-sdk-tab { display: inline-flex; align-items: center; gap: ${s(6)}; height: ${s(28)}; padding: 0 ${s(10)}; border: 1px solid transparent; font-size: 0.8125rem; font-weight: 500; white-space: nowrap; }
.oc-sdk-tab-count { font-size: 0.75rem; font-variant-numeric: tabular-nums; }

.oc-sdk-badge { display: inline-flex; align-items: center; padding: ${s(1)} ${s(6)}; font-size: ${s(11)}; font-weight: 500; line-height: ${s(16)}; white-space: nowrap; }

.oc-sdk-list { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.oc-sdk-row { display: flex; align-items: center; gap: ${s(8)}; width: 100%; padding: ${s(6)} ${s(8)}; text-align: left; }
.oc-sdk-row-lead { flex: 0 0 auto; width: ${s(64)}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.75rem; }
.oc-sdk-row-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; }
.oc-sdk-row-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-row-sub { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.75rem; }
.oc-sdk-row-meta { flex: 0 0 auto; font-size: 0.75rem; font-variant-numeric: tabular-nums; }
.oc-sdk-list-empty { padding: ${s(16)} ${s(8)}; text-align: center; font-size: 0.8125rem; }

.oc-sdk-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: ${s(4)}; padding: ${s(40)} ${s(16)}; text-align: center; }
.oc-sdk-empty-title { margin: 0; font-size: 0.8125rem; font-weight: 600; }
.oc-sdk-empty-body { margin: 0; max-width: 32rem; font-size: 0.8125rem; }
.oc-sdk-empty-action { margin-top: ${s(12)}; }

@keyframes oc-sdk-spin { to { transform: rotate(360deg); } }
.oc-sdk-spinner { display: inline-flex; align-items: center; gap: ${s(8)}; font-size: 0.8125rem; }
.oc-sdk-spinner-ring { width: ${s(16)}; height: ${s(16)}; border: 2px solid transparent; animation: oc-sdk-spin .8s linear infinite; }
.oc-sdk-spinner[data-size="sm"] .oc-sdk-spinner-ring { width: ${s(12)}; height: ${s(12)}; }

.oc-sdk-banner { display: flex; align-items: flex-start; gap: ${s(12)}; padding: ${s(8)} ${s(12)}; border: 1px solid transparent; }
.oc-sdk-banner-text { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: ${s(2)}; }
.oc-sdk-banner-title { font-size: 0.8125rem; font-weight: 500; }
.oc-sdk-banner-body { font-size: 0.8125rem; }
.oc-sdk-banner-action { flex: 0 0 auto; }

.oc-sdk-separator { display: flex; align-items: center; gap: ${s(8)}; width: 100%; margin: ${s(8)} 0; font-size: 0.75rem; }
.oc-sdk-separator::before, .oc-sdk-separator::after { content: ""; flex: 1 1 auto; height: 1px; }
.oc-sdk-separator[data-labeled="false"]::after { display: none; }
.oc-sdk-popup > .oc-sdk-separator { margin: ${s(4)} 0; }

.oc-sdk-progress { display: flex; flex-direction: column; gap: ${s(4)}; min-width: 0; }
.oc-sdk-progress-label { display: flex; justify-content: space-between; font-size: 0.75rem; font-variant-numeric: tabular-nums; }
.oc-sdk-progress-track { height: ${s(6)}; overflow: hidden; }
.oc-sdk-progress-fill { height: 100%; transform-origin: left; transition: transform 200ms ease-out; }
.oc-sdk-progress-value { display: inline-flex; align-items: center; gap: ${s(2)}; }
.oc-sdk-progress[data-done="true"] .oc-sdk-progress-value { font-weight: 600; }

.oc-sdk-menu { position: relative; display: inline-flex; }

.oc-sdk-text { white-space: pre-wrap; overflow-wrap: anywhere; }
.oc-sdk-text img { display: block; max-width: 100%; margin: ${s(8)} 0; }

/* Under a finger the controls reach the app's touch sizes: rows and options 44px like its sheets, every other
   control at least 36px. Inputs keep 16px text, below which iOS zooms the page on focus. */
@media (pointer: coarse) {
  .oc-sdk-btn, .oc-sdk-input { height: ${s(40)}; }
  .oc-sdk-btn[data-size="sm"], .oc-sdk-btn[data-size="xs"], .oc-sdk-trigger, .oc-sdk-tab, .oc-sdk-popup-search .oc-sdk-input { height: ${s(36)}; }
  .oc-sdk-input, .oc-sdk-popup-search .oc-sdk-input { font-size: max(16px, 0.875rem); }
  .oc-sdk-search-clear { width: ${s(36)}; height: ${s(36)}; right: 0; }
  .oc-sdk-row, .oc-sdk-option { min-height: ${s(44)}; }
  .oc-sdk-check { min-height: ${s(36)}; padding: ${s(8)} 0; }
}
`,sr=`${Fr}
.oc-sdk { color: ${D}; font-family: ${Vr}; }
.oc-sdk :focus-visible, .oc-sdk:focus-visible { outline: none; }
.oc-sdk :where(button, a[href], [role="button"], [role="tab"], [role="option"]):focus-visible, button.oc-sdk:focus-visible { ${or} }
.oc-sdk-mono { font-family: ${Ft}; }
.oc-sdk-muted { color: ${x}; }
${We("success")}${We("warning")}${We("error")}${We("info")}
.oc-sdk[data-tone="primary"], .oc-sdk [data-tone="primary"] { --oc-sdk-tone: ${W}; --oc-sdk-tone-text: ${Ht}; }

.oc-sdk-btn { border-radius: ${Bt}; transition: background 150ms ease-out, color 150ms ease-out; }
.oc-sdk-btn[data-size="xs"] { border-radius: ${tr}; }
.oc-sdk-btn[data-variant="default"] { color: ${Ht}; background: ${b(W,10,j)}; border-color: ${b(W,12)}; ${rr} }
.oc-sdk-btn[data-variant="default"]:hover { background: ${b(W,16,j)}; }
.oc-sdk-btn[data-variant="default"]:active { background: ${b(W,22,j)}; box-shadow: none; }
.oc-sdk-btn[data-variant="secondary"] { background: ${Hr}; color: var(--oc-fg); }
.oc-sdk-btn[data-variant="secondary"]:hover { background-image: linear-gradient(${N}, ${N}); }
.oc-sdk-btn[data-variant="secondary"]:active { background-image: linear-gradient(${Y}, ${Y}); }
.oc-sdk-btn[data-variant="outline"] { background: var(--oc-sdk-raised-bg); color: ${de}; ${Wt} }
.oc-sdk-btn[data-variant="outline"]:hover { background-image: linear-gradient(${N}, ${N}); }
.oc-sdk-btn[data-variant="outline"]:active { background-image: linear-gradient(${Y}, ${Y}); box-shadow: none; }
.oc-sdk-btn[data-variant="ghost"] { background: transparent; }
.oc-sdk-btn[data-variant="ghost"]:hover { background: ${N}; }
.oc-sdk-btn[data-variant="ghost"]:active { background: ${Y}; }
.oc-sdk-btn[data-variant="destructive"] { --oc-sdk-tone: ${g("status-error","red")}; color: ${Vt}; background: ${b("var(--oc-sdk-tone)",7,j)}; border-color: ${b("var(--oc-sdk-tone)",12)}; ${rr} }
.oc-sdk-btn[data-variant="destructive"]:hover { background: ${b("var(--oc-sdk-tone)",9,j)}; }
.oc-sdk-btn[data-variant="destructive"]:active { background: ${b("var(--oc-sdk-tone)",11,j)}; box-shadow: none; }

.oc-sdk-field-note { color: ${x}; }
.oc-sdk-field[data-invalid="true"] .oc-sdk-field-note { color: ${Vt}; }
.oc-sdk-input { border-radius: ${Bt}; background: var(--oc-sdk-field-bg); color: ${de}; ${Kt("var(--oc-sdk-edge)")} transition: background 150ms ease-out; }
.oc-sdk-input::placeholder { color: ${x}; }
.oc-sdk-input:hover:not(:focus) { background-image: linear-gradient(${N}, ${N}); }
.oc-sdk-input:focus, .oc-sdk-input:focus-visible { ${Kt(b(D,26),"1px")} }
.oc-sdk-field[data-invalid="true"] .oc-sdk-input, .oc-sdk-field[data-invalid="true"] .oc-sdk-input:focus { ${Kt(g("status-error","red"),"1px")} }
.oc-sdk-input[data-mono="true"] { font-family: ${Ft}; }

.oc-sdk-search-icon { color: ${x}; }
.oc-sdk-search[data-active="true"] .oc-sdk-search-icon { color: ${W}; }
.oc-sdk-search-clear { border-radius: ${tr}; color: ${x}; }
.oc-sdk-search-clear:hover { background: ${N}; color: ${D}; }

.oc-sdk-trigger { border-radius: ${Bt}; background: var(--oc-sdk-raised-bg); color: ${de}; ${Wt} transition: background 150ms ease-out; }
.oc-sdk-trigger:hover { background-image: linear-gradient(${N}, ${N}); }
.oc-sdk-trigger[aria-expanded="true"] { background-image: linear-gradient(${Y}, ${Y}); }
.oc-sdk-trigger-value[data-empty="true"] { color: ${x}; }
.oc-sdk-trigger-chevron { color: ${x}; }
/* The app's floating level: the glass edge (a hairline ring and a lit top line, dark outside and light inside in dark themes) over soft shadows. The outer ring is the border, over the page like the app's. */
.oc-sdk-popup { --surface-foreground: ${de}; border-color: var(--oc-sdk-float-edge); border-radius: 12px; background: ${je}; background-clip: padding-box; color: ${de}; box-shadow: var(--oc-sdk-float); }
.oc-sdk-option { border-radius: 8px; }
.oc-sdk-option[data-active="true"] { background: ${N}; }
/* A selected option shows a check mark in the text colour, like the app's own pickers. Options without the mark come
   from bundles built before it existed and keep the selection fill as their only sign of the choice. */
.oc-sdk-option[aria-selected="true"]:not([data-mark]) { background: ${$t}; color: ${Xt}; }
.oc-sdk-option-check { color: ${D}; }
.oc-sdk-option[data-destructive="true"] { color: ${Vt}; }
.oc-sdk-option[data-destructive="true"][data-active="true"] { background: ${b(g("status-error","red"),10)}; }
.oc-sdk-option-hint { color: ${x}; }
.oc-sdk-popup-empty { color: ${x}; }

/* Checked stays neutral: the mark carries the state, and the primary colour stays with primary actions. */
.oc-sdk-check-box { border-color: ${Q}; border-radius: 4px; color: ${D}; transition: border-color 150ms ease-out; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-box { border-color: ${b(D,60,Q)}; }
.oc-sdk-check-thumb { border-radius: 9999px; background: ${Q}; transition: background 150ms ease-out; }
.oc-sdk-check-thumb::after { border-radius: 9999px; background: ${j}; transition: transform 150ms ease-out; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-thumb { background: ${W}; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-thumb::after { transform: translateX(var(--oc-sdk-thumb-travel, 16px)); }
.oc-sdk-check:focus-visible { box-shadow: none; }
.oc-sdk-check:focus-visible .oc-sdk-check-box, .oc-sdk-check:focus-visible .oc-sdk-check-thumb { ${or} }
.oc-sdk-check-desc { color: ${x}; }

.oc-sdk-tabs { border-radius: 10px; }
.oc-sdk-tabs[data-track="true"] { background: ${b(D,4)}; box-shadow: inset 0 1px 2px 0 rgb(0 0 0 / 0.16); }
.oc-sdk-tab { border-radius: 8px; color: ${x}; transition: color 150ms ease-out, background 150ms ease-out; }
.oc-sdk-tab:hover { color: ${D}; }
.oc-sdk-tab[aria-selected="true"] { color: ${Xt}; background: ${$t}; border-color: ${Q}; }
.oc-sdk-tabs[data-track="true"] .oc-sdk-tab[aria-selected="true"] { color: ${de}; background: var(--oc-sdk-raised-bg); ${Wt} }
.oc-sdk-tab-count { color: ${x}; }

/* The app's neutral badge: a step of the text colour, the same in every theme. */
.oc-sdk-badge { border-radius: 9999px; background: ${b(D,6)}; color: ${x}; }
.oc-sdk-badge[data-tone] { color: var(--oc-sdk-tone-text, var(--oc-sdk-tone)); background: ${b("var(--oc-sdk-tone)",15)}; }

.oc-sdk-row { border-radius: 6px; transition: background 120ms ease-out; }
.oc-sdk-row:hover, .oc-sdk-row[data-active="true"] { background: ${N}; }
.oc-sdk-row[aria-selected="true"] { background: ${$t}; color: ${Xt}; }
.oc-sdk-row-lead { font-family: ${Ft}; color: ${x}; }
.oc-sdk-row-sub { color: ${x}; }
.oc-sdk-row-meta { color: ${x}; }
.oc-sdk-row[aria-selected="true"] .oc-sdk-row-lead, .oc-sdk-row[aria-selected="true"] .oc-sdk-row-sub, .oc-sdk-row[aria-selected="true"] .oc-sdk-row-meta { color: inherit; opacity: .75; }
.oc-sdk-list-empty { color: ${x}; }

.oc-sdk-empty-body { color: ${x}; }

.oc-sdk-spinner { color: ${x}; }
.oc-sdk-spinner-ring { border-color: ${Q}; border-top-color: ${W}; border-radius: 9999px; }

/* Set apart by its tint alone, like the app's banners. */
.oc-sdk-banner { border-color: transparent; border-radius: 8px; background: ${b("var(--oc-sdk-tone)",10)}; }
.oc-sdk-banner-title { color: var(--oc-sdk-tone-text, var(--oc-sdk-tone)); }
.oc-sdk-banner-body { color: ${x}; }

.oc-sdk-separator { color: ${x}; }
.oc-sdk-separator::before, .oc-sdk-separator::after { background: ${b(Q,40)}; }

.oc-sdk-progress-label { color: ${x}; }
/* The app's progress: a groove a step of the text colour, green once done. Older bundles mark done only through aria-valuenow. */
.oc-sdk-progress-track { border-radius: 9999px; background: ${b(D,6)}; }
.oc-sdk-progress-fill { border-radius: 9999px; background: var(--oc-sdk-tone, ${W}); }
.oc-sdk-progress-track[aria-valuenow="100"] > .oc-sdk-progress-fill:not([data-tone]) { background: ${g("status-success","currentColor")}; }
.oc-sdk-progress[data-done="true"] .oc-sdk-progress-value { color: ${g("success-text","inherit")}; }

.oc-sdk-text a { color: ${Ht}; text-decoration: underline; text-underline-offset: 2px; }
.oc-sdk-text img { border-radius: 8px; border: 1px solid ${b(Q,60)}; }
`,U=`
${ct}
${Br}
${sr}`;var ar=(e)=>Math.min(100,Math.max(0,e)),qt=(e)=>Math.max(0,e.limit-e.used),Je=(e)=>e.filter((o)=>o.id!=="key-used"&&o.label!=="Key credits used"),cr=(e)=>e.limit>0?ar(qt(e)/e.limit*100):0,lr=(e,o)=>{if(!e.resetAt)return null;let n=Date.parse(e.resetAt),i=e.durationSeconds;if(!Number.isFinite(n)||!i||i<=0)return null;let a=n-o;return ar(a/(i*1000)*100)},dr=(e,o)=>{if(!e.resetAt)return!1;let n=Date.parse(e.resetAt);return Number.isFinite(n)&&o>=n},qr=(e,o)=>{let n=Date.parse(e);if(!Number.isFinite(n))return"unknown";let i=n-o;if(i<=0)return"now";let a=Math.ceil(i/60000);if(a<60)return`in ${a}m`;let u=Math.floor(a/60),h=a%60;if(u<24)return h?`in ${u}h ${h}m`:`in ${u}h`;let f=Math.floor(u/24),C=u%24;return C?`in ${f}d ${C}h`:`in ${f}d`},Qt=(e,o)=>{let n=Date.parse(e);if(!Number.isFinite(n))return"unknown";let i=n-o;if(i<=0)return"now";let a=Math.ceil(i/60000);if(a<60)return`${a}m`;let u=Math.floor(a/60),h=a%60;if(u<24)return h?`${u}h ${h}m`:`${u}h`;let f=Math.floor(u/24),C=u%24;return C?`${f}d ${C}h`:`${f}d`},ir=(e)=>Date.UTC(e.getFullYear(),e.getMonth(),e.getDate()),ur=(e,o,n)=>{let i=new Date(e);if(Number.isNaN(i.getTime()))return"unknown";if(o==="relative")return Qt(e,n);let a=i.getTime()-n;if(a>=0&&a<86400000)return new Intl.DateTimeFormat(void 0,{hour:"numeric",minute:"2-digit"}).format(i);let u=Math.round((ir(i)-ir(new Date(n)))/86400000);if(u===0)return new Intl.DateTimeFormat(void 0,{hour:"numeric",minute:"2-digit"}).format(i);if(u>0&&u<7)return new Intl.DateTimeFormat(void 0,{weekday:"short",hour:"numeric",minute:"2-digit"}).format(i);return new Intl.DateTimeFormat(void 0,{month:"short",day:"numeric"}).format(i)},pr=(e,o,n)=>{let i=new Date(e);if(Number.isNaN(i.getTime()))return"unknown";if(o==="relative")return qr(e,n);return i.toLocaleString()},Ze=(e,o)=>{if(o==="USD")return new Intl.NumberFormat(void 0,{style:"currency",currency:"USD",maximumFractionDigits:2}).format(e);return`${e} ${o}`};var pe={saved:!1,providers:[],windows:{},hiddenBalances:[],cutoffPercent:10,resetTime:"relative"};var _r="quota.display.v1",Yt=(e)=>!!e&&typeof e==="object"&&!Array.isArray(e),Qr=(e)=>{if(!Yt(e))return{...pe};let o=Array.isArray(e.providers)?e.providers.filter((u)=>typeof u==="string"):[],n={};if(Yt(e.windows)){for(let[u,h]of Object.entries(e.windows))if(Array.isArray(h))n[u]=h.filter((f)=>typeof f==="string")}let i=Array.isArray(e.hiddenBalances)?e.hiddenBalances.filter((u)=>typeof u==="string"):[],a=typeof e.cutoffPercent==="number"&&Number.isFinite(e.cutoffPercent)?Math.min(100,Math.max(0,e.cutoffPercent)):pe.cutoffPercent;return{saved:e.saved===!0,providers:o,windows:n,hiddenBalances:i,cutoffPercent:a,resetTime:e.resetTime==="absolute"?"absolute":"relative"}},Yr=(e)=>{if(e.saved&&e.providers.includes("tavily")&&e.windows.tavily===void 0)return{...e,windows:{...e.windows,tavily:["plan","key","paygo"]}};return e},Jt=async(e)=>{try{let o=await e.get(_r),n=Qr(o);if(!Yt(o)||o.tavilyMonthlyWindowsMigrated===!0)return n;let i=Yr(n);try{await Jr(e,i)}catch{}return i}catch{return{...pe}}},Jr=async(e,o)=>{await e.set(_r,{...o,tavilyMonthlyWindowsMigrated:!0})},Er=(e,o)=>!e.saved||e.providers.includes(o),Sr=(e,o,n)=>!e.saved||(e.windows[o]??[]).includes(n),Tr=(e,o)=>!e.hiddenBalances.includes(o);var fr=(e)=>async(o)=>{let n=await e.serviceRequest({method:o.method,path:o.path,...o.body!==void 0?{body:JSON.stringify(o.body)}:{}}),i=n.body;if(typeof n.body==="string")try{i=JSON.parse(n.body)}catch{i=null}return{status:n.status,body:i}};class Zt{call;onSnapshot;intervalMs;refreshIntervalMs;timer=null;refreshTimer=null;refreshing=!1;generation=0;stopped=!1;cancelPollDelay=null;constructor(e,o,n=5000,i=60000){this.call=e;this.onSnapshot=o;this.intervalMs=n;this.refreshIntervalMs=i}async load(){if(this.stopped)return null;let e=this.generation;try{let o=await this.call({method:"GET",path:"/snapshot"});if(e!==this.generation)return null;if(o.status===200&&o.body&&typeof o.body==="object"){let n=o.body;if(n.version===1)return this.onSnapshot(n),n}}catch{}return null}async refresh(e){if(this.stopped||this.refreshing)return;let o=this.generation;this.refreshing=!0;try{await this.call({method:"POST",path:"/refresh",...e?{body:{connectionId:e}}:{}}),await this.pollUntilIdle(o)}catch{if(o===this.generation)await this.load()}finally{if(o===this.generation)this.refreshing=!1}}start(){if(this.timer!==null)return;this.stopped=!1,this.load(),this.refresh(),this.timer=setInterval(()=>void this.load(),this.intervalMs),this.refreshTimer=setInterval(()=>void this.refresh(),this.refreshIntervalMs)}stop(){if(this.stopped=!0,this.generation++,this.refreshing=!1,this.timer!==null)clearInterval(this.timer);if(this.refreshTimer!==null)clearInterval(this.refreshTimer);this.timer=null,this.refreshTimer=null,this.cancelPollDelay?.()}async pollUntilIdle(e){let o=Date.now()+15000;while(e===this.generation&&Date.now()<o){let n=await this.load();if(e!==this.generation||!n||n.providers.every((i)=>!i.refreshing))return;await new Promise((i)=>{let a=setTimeout(()=>{this.cancelPollDelay=null,i()},500);this.cancelPollDelay=()=>{clearTimeout(a),this.cancelPollDelay=null,i()}})}}}var Ar=(e,o)=>{if(!e)return`<div class="quota-empty" role="status">
      <strong>No providers configured.</strong>
      <p>Add one in <strong>Quota settings</strong> (sidebar → Pages).</p>
    </div>`;if(!o)return`<div class="quota-empty" role="status">
      <strong>All quotas are hidden.</strong>
      <p>Adjust the selection in <strong>Quota settings</strong> (sidebar → Pages).</p>
    </div>`;return""};var F=(e)=>e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),M=(e)=>F(e);var Or=(e,o,n)=>{if(e<n)return"danger";if(o!==null&&e<o)return"warning";return"default"},hr=(e)=>`state-${e}`;var eo=(e)=>`<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"><path d="${e}"/></svg>`,mr=(e)=>`<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${e}</svg>`;var Rr=(e)=>{if(e==="codex")return eo("M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.073zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z");if(e==="opencode-go"||e==="opencode-zen")return eo("M22 24H2V0h20zM17 4.8H7v14.4h10z");if(e==="openrouter")return eo("M16.778 1.844v1.919q-.569-.026-1.138-.032-.708-.008-1.415.037c-1.93.126-4.023.728-6.149 2.237-2.911 2.066-2.731 1.95-4.14 2.75-.396.223-1.342.574-2.185.798-.841.225-1.753.333-1.751.333v4.229s.768.108 1.61.333c.842.224 1.789.575 2.185.799 1.41.798 1.228.683 4.14 2.75 2.126 1.509 4.22 2.11 6.148 2.236.88.058 1.716.041 2.555.005v1.918l7.222-4.168-7.222-4.17v2.176c-.86.038-1.611.065-2.278.021-1.364-.09-2.417-.357-3.979-1.465-2.244-1.593-2.866-2.027-3.68-2.508.889-.518 1.449-.906 3.822-2.59 1.56-1.109 2.614-1.377 3.978-1.466.667-.044 1.418-.017 2.278.02v2.176L24 6.014Z");if(e==="tavily")return mr('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>');return mr('<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8H6a2 2 0 0 0-2 2v2a6 6 0 0 0 6 6h4a6 6 0 0 0 6-6v-2a2 2 0 0 0-2-2Z"/>')};var B=(e)=>F(e),to=(e)=>`<h3><span class="quota-provider-icon">${Rr(e.kind)}</span>${B(e.label)}</h3>`,Zr=(e,o,n)=>{if(e.error)return`<div class="quota-row quota-row-line quota-row-window quota-window-status quota-window-error" data-window="${M(e.id)}">
      <span class="quota-label">${B(e.label)}</span>
      <span class="quota-status-text" role="alert">${B(e.error.message)}</span>
    </div>`;if(typeof e.remainingPercent!=="number"||!Number.isFinite(e.remainingPercent))return`<div class="quota-row quota-row-line quota-row-window quota-window-status quota-window-error" data-window="${M(e.id)}">
      <span class="quota-label">${B(e.label)}</span>
      <span class="quota-status-text" role="alert">quota unavailable</span>
    </div>`;if(!e.resetAt||!Number.isFinite(Date.parse(e.resetAt)))return`<div class="quota-row quota-row-line quota-row-window quota-window-status quota-window-error" data-window="${M(e.id)}">
      <span class="quota-label">${B(e.label)}</span>
      <span class="quota-status-text" role="alert">reset time unavailable</span>
    </div>`;if(dr(e,n))return`<div class="quota-row quota-row-line quota-row-window quota-window-status" data-window="${M(e.id)}">
      <span class="quota-label">${B(e.label)}</span>
      <span class="quota-status-text" role="status">refreshing…</span>
    </div>`;let{remainingPercent:i,limit:a,used:u}=e,h=a&&u?`${Math.max(0,a.value-u.value)} / ${a.value}${e.label.toLowerCase().includes(a.unit.toLowerCase())?"":` ${a.unit}`}`:`${i.toFixed(0)}%`,f=lr(e,n),C=Or(i,f,o.cutoffPercent),G=ur(e.resetAt,o.resetTime,n),q=pr(e.resetAt,o.resetTime,n),te=f===null?"":`<span class="quota-benchmark" style="left:${f.toFixed(2)}%" title="Even-use benchmark ${f.toFixed(0)}%"></span>`;return`
    <div class="quota-row quota-row-line quota-row-window" data-window="${M(e.id)}">
      <span class="quota-label">${B(e.label)}</span>
      <div class="quota-bar ${hr(C)}" role="img" aria-label="${M(e.label)} ${i.toFixed(0)}% remaining, resets ${M(q)}">
        <span class="quota-fill" style="width:${i.toFixed(2)}%"></span>
        ${te}
      </div>
      <span class="quota-value">${F(h)}</span>
      <span class="quota-reset" title="resets ${M(q)}">${F(G)}</span>
    </div>`},en=(e)=>{let o=qt(e),n=cr(e),i=e.unit==="USD"?`${Ze(o,e.unit)} / ${Ze(e.limit,e.unit)}`:e.label.toLowerCase().includes(e.unit.toLowerCase())?`${o} / ${e.limit}`:`${o} / ${e.limit} ${e.unit}`;return`
    <div class="quota-row quota-row-line quota-row-cap" data-cap="${M(e.id)}" title="no reset">
      <span class="quota-label">${B(e.label)}</span>
      <div class="quota-bar" role="img" aria-label="${M(e.label)} ${n.toFixed(0)}% remaining">
        <span class="quota-fill" style="width:${n.toFixed(2)}%"></span>
      </div>
      <span class="quota-value">${F(i)}</span>
    </div>`},tn=(e)=>`
  <div class="quota-row quota-row-line quota-row-balance" data-balance="${M(e.id)}">
    <span class="quota-label">${B(e.label)}</span>
    <span class="quota-value">${F(Ze(e.value,e.unit))}</span>
  </div>`,gr=(e,o,n)=>{if(e.state==="error"){let C=e.error?.retryAt?Date.parse(e.error.retryAt):NaN,G=Number.isFinite(C)&&C>n?` Retry in ${Qt(e.error.retryAt,n)}.`:"";return`<section class="quota-provider" data-provider="${M(e.connectionId)}">
      ${to(e)}
      <div class="quota-error" role="alert">${B(e.error?.message??"Could not load quota.")}${F(G)}</div>
    </section>`}if(e.state==="loading")return`<section class="quota-provider" data-provider="${M(e.connectionId)}">
      ${to(e)}
      <div class="quota-row quota-row-loading" role="status">Loading quota…</div>
    </section>`;let i=e.windows.length?`<div class="quota-window-rows">${e.windows.map((C)=>Zr(C,o,n)).join("")}</div>`:"",a=e.caps.map(en).join(""),u=Je(e.balances).map(tn).join(""),h=e.refreshing?'<div class="quota-row-loading" role="status">Refreshing…</div>':"",f=!i&&!a&&!u?'<div class="quota-empty">No quota windows reported.</div>':"";return`<section class="quota-provider" data-provider="${M(e.connectionId)}">
    ${to(e)}
    ${h}${i}${a}${u}${f}
  </section>`};var J=Dt(),on=fr(J),ge=document.querySelector("#root");if(!ge)throw Error("Missing #root");var et=null,_e={...pe},Ir=!1,no=!1,ro="",ee=null,Z=null,tt=!1,oo=0,rn=`<svg class="lucide lucide-rotate-cw" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M21 3v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,nn=(e)=>{if(Z)clearTimeout(Z);Z=null;let o=Date.now(),n=e.providers.flatMap((i)=>i.windows).map((i)=>i.resetAt?Date.parse(i.resetAt):NaN).filter((i)=>Number.isFinite(i)&&i>o).sort((i,a)=>i-a)[0];if(!n)return;Z=setTimeout(()=>void ee?.refresh(),Math.min(n-o+1000,86400000))},xr=()=>{let e=document.body;if(!e)return;let o=Math.ceil(e.getBoundingClientRect().height);if(!Number.isFinite(o)||o<1||o===oo)return;oo=o,J.setHeight(o).catch(()=>{oo=0})},br=()=>{if(typeof requestAnimationFrame==="function")requestAnimationFrame(xr);else xr()},Re=()=>{if(no)return;let e=Date.now(),o=(et?.providers??[]).flatMap((i)=>{if(!Er(_e,i.connectionId))return[];let a=i.windows.filter((f)=>Sr(_e,i.connectionId,f.id)),u=Je(i.balances).filter(()=>Tr(_e,i.connectionId));if((i.windows.length>0||i.caps.length>0||i.balances.length>0)&&!a.length&&!i.caps.length&&!u.length)return[];return[{...i,windows:a,balances:u}]}),n=!et?'<div class="quota-row quota-row-loading" role="status">Loading quota…</div>':o.length?o.map((i)=>gr(i,_e,e)).join(""):Ar((et.providers.length??0)>0,o.length>0);ge.innerHTML=`${tt?"":`<button type="button" class="quota-icon-button" data-action="refresh" aria-label="Refresh quota" title="Refresh">${rn}</button>`}
  ${ro?`<div class="quota-error" role="alert">${F(ro)}</div>`:""}
  ${n}`,ge.classList.toggle("body-refresh",!tt),br()};if(typeof ResizeObserver==="function")new ResizeObserver(br).observe(ge);J.onStatusControl((e)=>{if(e.id==="refresh")ee?.refresh().then(Re)});ge.addEventListener("click",(e)=>{if(e.target.closest("[data-action]")?.dataset.action!=="refresh")return;(async()=>{if(!ee)return;await ee.refresh(),Re()})()});window.addEventListener("pagehide",(e)=>{if(e.persisted)return;if(no=!0,ee?.stop(),Z!==null)clearTimeout(Z);Z=null});J.onReady((e)=>{if(Gt(e,document.documentElement),Ir)return;Ir=!0,(async()=>{try{if(e.features?.statusControls)try{await J.setStatusControls([{kind:"button",id:"refresh",label:"↻"}]),tt=!0}catch{tt=!1}if(_e=await Jt(J.storage),no)return;ee=new Zt(on,(o)=>{et=o,nn(o),Jt(J.storage).then((n)=>{_e=n,Re()})}),ee.start(),Re()}catch(o){ro=o instanceof Error?o.message:"The quota service is unavailable.",Re()}})()});})();
