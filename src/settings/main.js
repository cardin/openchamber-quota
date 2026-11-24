(()=>{var T="openchamber.sdk",S=1;var dt=`
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
`;function So(e){let o=e.documentElement;if(o.hasAttribute("data-oc-scrollbar-activity"))return;o.setAttribute("data-oc-scrollbar-activity","");let r=new WeakMap;e.addEventListener("scroll",(i)=>{let a=i.target===e?o:i.target;if(!(a instanceof Element))return;if(!a.hasAttribute("data-oc-scrolling"))a.setAttribute("data-oc-scrolling","");let u=r.get(a);if(u!==void 0)clearTimeout(u);r.set(a,setTimeout(()=>{r.delete(a),a.removeAttribute("data-oc-scrolling")},1000))},{capture:!0,passive:!0})}var Cn=`(${So.toString()})(document);`;var lt=128,pt=65536;var we=128;var De=65536;var ut=8000,_t=192000,Et=120000;var fo=(e)=>{let o=[],r=0,i=0;return{push:(a)=>{o.push(a),i+=a.length;while(i-r>e&&o.length>1){let u=o.shift();i-=u?.length??0,r=0}},pull:(a)=>{let u=0;while(u<a.length&&o.length>0){let A=o[0],f=Math.min(a.length-u,A.length-r);if(a.set(A.subarray(r,r+f),u),u+=f,r+=f,r>=A.length)o.shift(),i-=A.length,r=0}a.fill(0,u)},clear:()=>{o.length=0,r=0,i=0},get size(){return i-r}}};var ho=/^[a-z][a-z0-9-]{0,39}$/;var Ao=(e)=>Object(e)===e&&!Array.isArray(e),Tt=(e,o)=>Object.keys(e).every((r)=>o.includes(r)),Oo=(e)=>String(e)===e&&e.length>=1&&e.length<=60,mo=(e)=>String(e)===e&&e.length>=1&&e.length<=80,Ro=(e)=>{if(!Array.isArray(e)||e.length>4)return!1;let o=new Set;for(let r of e){if(!Ao(r)||!ho.test(r.id)||!Oo(r.label))return!1;if(r.disabled!==void 0&&r.disabled!==!0&&r.disabled!==!1)return!1;if(o.has(r.id))return!1;if(o.add(r.id),r.kind==="button"){if(!Tt(r,["kind","id","label","disabled"]))return!1;continue}if(r.kind!=="select"||!Tt(r,["kind","id","label","value","options","disabled"]))return!1;if(!mo(r.value)||!Array.isArray(r.options)||r.options.length<1||r.options.length>16)return!1;let i=new Set;for(let a of r.options){if(!Ao(a)||!Tt(a,["value","label"])||!mo(a.value)||!Oo(a.label)||i.has(a.value))return!1;i.add(a.value)}if(!i.has(r.value))return!1}return!0};var go=["{id}","{segment}","{segments+}"];var pr=new Set(go);var Io=["turn-finished","turn-failed","permission-asked","question-asked","turn-started","session-created","session-archived","session-deleted"];var _r=new Set(Io);var Ge=20000000,$e=256;var St=(e)=>("bytes"in e)?e.bytes.byteLength:e.content.length,xo=(e,o)=>{if(e.path!==o.path||e.readOnly!==o.readOnly)return!1;if(e.encoding==="text"||o.encoding==="text")return e.encoding==="text"&&o.encoding==="text"&&e.content===o.content;if(e.bytes.byteLength!==o.bytes.byteLength)return!1;for(let r=0;r<e.bytes.byteLength;r+=1)if(e.bytes[r]!==o.bytes[r])return!1;return!0};var bo=/^[A-Za-z0-9_-]{1,80}$/;var Co=["left","right","top","bottom"];var yo=(e,o=0,r={remaining:16000})=>{if(--r.remaining<0||o>=32)return!1;if(e===null)return!0;let i=Array.isArray(e)?e:Object(e)===e?Object.values(e):[];for(let a of i)if(!yo(a,o+1,r))return!1;return!0},ft=(e)=>{if(e===null||e===!0||e===!1)return!0;if(Array.isArray(e))return Object.keys(e).every((o)=>/^(0|[1-9]\d*)$/.test(o)&&Number(o)<e.length)&&e.every(ft);if(Object(e)===e){let o=Object.getPrototypeOf(e);return(o===null||o===Object.prototype)&&Object.values(e).every(ft)}return String(e)===e||Number.isFinite(e)},At=(e)=>{try{if(String(e.id)!==e.id||!bo.test(e.id)||!Number.isFinite(e.anchor.x)||Math.abs(e.anchor.x)>1e5||!Number.isFinite(e.anchor.y)||Math.abs(e.anchor.y)>1e5||!Number.isFinite(e.anchor.width)||!Number.isFinite(e.anchor.height)||e.anchor.width<=0||e.anchor.height<=0||e.anchor.width>1e5||e.anchor.height>1e5||!Number.isInteger(e.width)||e.width<160||e.width>640||!Number.isInteger(e.height)||e.height<48||e.height>480||e.side!==void 0&&!Co.includes(e.side)||e.focus!==void 0&&e.focus!==!0&&e.focus!==!1||!yo(e.data)||!ft(e.data))return!1;return JSON.stringify(e.data).length<=16000}catch{return!1}};var mt=2000;var vo=["file","directory","other","missing"],ht=(e)=>Boolean(e&&"sessionId"in e),Rt=(e)=>Boolean(e&&"sent"in e&&!("sessionId"in e));var Mo=/^[0-9a-f]{7,64}$/i,gt=(e)=>Mo.test(e),He=500,Xe=32000,Uo=16000,No=128,Lo=200,Po=2000,wo=16000,Do=80,Go=200,$o=16000;var Ho=2000;var It=20000,Ve=1024,Be=2000000;var Fe=64000,Ke=8000,xt=4000;var bt=960000;var Xo=999,Vo=1e4,ye=500,Bo=["HOST_UNAVAILABLE","HOST_TIMEOUT","HOST_REJECTED","DISCONNECTED","DISABLED","BAD_PATH","NO_INTEGRATION","NO_SERVICE","SERVICE_FAILED","REQUEST_FAILED","RESPONSE_TOO_LARGE","NO_SESSION","SESSION_BUSY","NOT_GRANTED","NO_DIRECTORY","NOT_FOUND","FILE_TOO_LARGE","DENIED","NO_MODEL","MODEL_FAILED","UNSUPPORTED"],Fo=["stopped","starting","ready","failed"],kn=new Set(Bo),Ko=(e)=>kn.has(e),Wo=(e)=>e&&Ko(e)?e:"HOST_REJECTED",fe=(e)=>{if(e===void 0)return!1;if(e===null||e===!0||e===!1)return!0;if(String(e)===e)return!0;if(Number(e)===e)return Number.isFinite(e);if(Array.isArray(e))return e.every(fe);if(Object(e)===e)return Object.values(e).every(fe);return!1},jo=(e)=>fe(e)&&JSON.stringify(e).length<=$o,ko=(e)=>e?.trim().slice(0,Go)??"",Ae=(e)=>{let o=e.id.trim().slice(0,No),r=e.title.trim().slice(0,Lo),i=e.url.trim().slice(0,Po),a=e.text?.trim().slice(0,wo),u=e.author?.trim().slice(0,Do),A=e.kind==="pull"?"pull":"issue",f={providerId:e.providerId.trim(),id:o,title:r||o,url:i,kind:A};if(a)f.text=a;if(u)f.author=u;if(A==="pull"){let x=ko(e.branches?.head),v=ko(e.branches?.base);if(x&&v)f.branches={head:x,base:v}}if(jo(e.data))f.data=e.data;return f},Ct=(e)=>{let o=Ae(e);if(e.projectId)o.projectId=e.projectId;if(e.navigation)o.navigation=e.navigation;if(e.worktree)o.worktree=e.worktree;return o},yt=(e)=>{let o={text:e.text.trim().slice(0,Uo)};if(e.send)o.send=!0;return o},kt=(e)=>{if(e===null||!Number.isFinite(e))return null;return Math.min(Xo,Math.max(0,Math.round(e)))},vt=(e)=>{if(!Number.isFinite(e))return 0;return Math.min(Vo,Math.max(0,Math.ceil(e)))};var Oe=(e)=>e.length>0&&e.length<=Ve&&!e.includes("\x00")&&!e.includes("\\");var We=(e)=>{if(!e.startsWith("/")||e.includes("\x00")||e.includes("\\")||e.includes("://"))return!1;if(e.length>Ho)return!1;return!e.split("/").some((r)=>r==="."||r==="..")},vn=new Set(Fo),Mt=(e)=>Boolean(e&&"status"in e&&vn.has(String(e.status))&&!("body"in e)),je=(e)=>Boolean(e&&"status"in e&&"body"in e&&Number.isInteger(e.status)),Ut=(e)=>Boolean(e&&"content"in e&&String(e.content)===e.content),Nt=(e)=>Boolean(e&&"written"in e&&e.written===!0),Lt=(e)=>Boolean(e&&"entries"in e&&Array.isArray(e.entries)),Mn=new Set(vo),Pt=(e)=>Boolean(e&&"kind"in e&&"size"in e&&Mn.has(String(e.kind))&&Number.isFinite(e.size)),wt=(e)=>Boolean(e&&"text"in e&&String(e.text)===e.text&&!("status"in e)),Un=new Set(["workspace","shells","ready","directory","session","connection","settings","session-lifecycle","item","resolve","action","service-event","status-control-event","popover-closed","file-open","file-snapshot","file-saved","generate-late","microphone-audio","microphone-ended"]),Nn=(e)=>Object(e)===e?e:null,Ot=(e)=>String(e)===e&&e.length>0,Ln=(e)=>{if(!Ot(e.id))return null;if(e.ok===!0){let o={channel:T,v:S,type:"result",id:e.id,ok:!0};if(Object(e.payload)===e.payload)o.payload=e.payload;return o}if(e.ok===!1&&Ot(e.error))return{channel:T,v:S,type:"result",id:e.id,ok:!1,error:e.error,code:Wo(Ot(e.code)?e.code:void 0)};return null},Dt=(e)=>{let o=Nn(e);if(!o||o.channel!==T||o.v!==S)return null;if(o.type==="result")return Ln(o);if(!Un.has(String(o.type))||Object(o.payload)!==o.payload)return null;return o};var zo=(e)=>("key"in e)&&("metaKey"in e)&&("ctrlKey"in e),Pn=(e)=>(e.metaKey||e.ctrlKey)&&!e.altKey&&!e.shiftKey&&e.key.toLowerCase()==="s";class l extends Error{code;constructor(e,o){super(o);this.name="HostRequestError",this.code=e}}var qo=()=>Promise.reject(new l("BAD_PATH",'Request path must start with "/" and stay on the declared origin.')),ze=()=>Promise.reject(new l("BAD_PATH",`File path must be 1 to ${Ve} characters without NUL or backslash.`)),qe=(e)=>{if(e===void 0)return;if(Object(e)!==e||Array.isArray(e)||e.scope!==void 0&&e.scope!=="instance"&&e.scope!=="device")throw new l("HOST_REJECTED",'Storage scope must be "instance" or "device".');return e.scope==="device"?"device":void 0},E=(e)=>(e.value+=1,`oc-${e.value}`),Gt=(e={})=>{let o=e.target??("window"in globalThis?window:null);if(!o)throw new l("HOST_UNAVAILABLE","No window. connectHost runs in a browser frame.");let r=e.acceptSource??((t)=>t===o.parent),i=e.requestTimeoutMs??It,a=new Set,u=new Set,A=new Set,f=new Set,x=new Set,v=new Set,j=new Set,se=new Set,K=new Set,M=new Set,z=new Set,J=new Set,ce=[],Z=null,ge=null,Me=new Set,Ue=new Set,Ie=null,xe=null,rt=!1,_e=new Map,Ee=new Map,Te=new Map,q=!1,_={value:0},p=null,ee=null,be=!1,Ce=!1,no=null,V=null,ro=(t)=>{if(!t)return null;return{sessionId:t.id,phase:t.busy?"started":"completed"}},w=(t)=>{o.parent.postMessage(t,"*")},so=()=>{if(q||o.parent===o||J.size===0||p?.features?.lateGenerateResults!==!0)return;w({channel:T,v:S,type:"generate-late-listen"})},R=(t,n)=>{for(let d of t)try{d(n)}catch(c){console.error(c)}},io=(t)=>{if(!(t instanceof MessageEvent))return;if(!r(t.source))return;let n=Dt(t.data);if(!n)return;if(n.type==="workspace"){let c=Ee.get(n.payload.subscriptionId);if(c)R([c],n.payload.snapshot);return}if(n.type==="shells"){let c=Te.get(n.payload.subscriptionId);if(c)R([c],n.payload.snapshot);return}if(n.type==="microphone-audio"){V?.queue.push(n.payload.samples);return}if(n.type==="microphone-ended"){let c=V;if(!c)return;V=null,c.release(),R(c.endedListeners,n.payload.reason);return}if(n.type==="ready"){if(p=n.payload,ee=ro(n.payload.session),R(a,n.payload),R(u,n.payload.directory),R(A,n.payload.session),ee)R(f,ee);if(R(x,n.payload.connection),R(v,n.payload.settings),R(j,n.payload.item),n.payload.block)R(se,n.payload.block);so();return}if(n.type==="service-event"){R(K,n.payload);return}if(n.type==="generate-late"){if(J.size===0)ce.push(n.payload);else R(J,n.payload);return}if(n.type==="directory"){if(p)p={...p,directory:n.payload.directory};R(u,n.payload.directory);return}if(n.type==="session"){if(p)p={...p,session:n.payload.session};if(!n.payload.session)ee=null;else if(ee?.sessionId!==n.payload.session.id)ee=ro(n.payload.session);R(A,n.payload.session);return}if(n.type==="session-lifecycle"){ee=n.payload,R(f,n.payload);return}if(n.type==="connection"){if(p)p={...p,connection:n.payload.connection};R(x,n.payload.connection);return}if(n.type==="settings"){if(p)p={...p,settings:n.payload.settings};R(v,n.payload.settings);return}if(n.type==="item"){if(p)p={...p,item:n.payload.item};R(j,n.payload.item);return}if(n.type==="status-control-event"){R(M,n.payload);return}if(n.type==="popover-closed"){R(z,n.payload);return}if(n.type==="action"){let c=(m)=>{if(!q)w({channel:T,v:S,type:"action-result",id:n.id,payload:m})},O=ge;if(!O){c({ok:!1,error:"This extension does not handle background actions."});return}Promise.resolve().then(()=>O(n.payload)).then(()=>c({ok:!0}),(m)=>{let g=(m instanceof Error?m.message:String(m)).trim();c({ok:!1,error:(g||"Action failed.").slice(0,ye)})});return}if(n.type==="file-open"){let c=n.payload;if(xe&&xo(xe,c))return;xe=c,R(Me,n.payload);return}if(n.type==="file-saved"){R(Ue,n.payload.version);return}if(n.type==="file-snapshot"){let c=(g)=>{if(!q)w({channel:T,v:S,type:"file-snapshot-result",id:n.id,payload:g})},O=(g)=>c({error:(g.trim()||"Could not read the edited file.").slice(0,ye)}),m=Ie;if(!m){O("This extension does not edit files.");return}Promise.resolve().then(()=>m(n.payload.purpose)).then((g)=>{if(St(g)>Ge){O(`The file is over ${Ge} ${"bytes"in g?"bytes":"characters"}.`);return}if(g.version.length>$e){O(`The snapshot version is over ${$e} characters.`);return}c({snapshot:"bytes"in g?{bytes:g.bytes,version:g.version}:{content:g.content,version:g.version}})},(g)=>O(g instanceof Error?g.message:String(g)));return}if(n.type==="resolve"){let c=(m)=>{w({channel:T,v:S,type:"resolve-result",id:n.id,payload:m})},O=Z;if(!O){c({error:"This extension does not resolve commands."});return}Promise.resolve().then(()=>O(n.payload)).then((m)=>c({item:m?Ae(m):null}),(m)=>{let g=(m instanceof Error?m.message:String(m)).trim();c({error:(g||"Command failed.").slice(0,ye)})});return}let d=_e.get(n.id);if(!d)return;if(clearTimeout(d.timer),_e.delete(n.id),n.ok){d.resolve(n.payload);return}d.reject(new l(n.code,n.error))};o.addEventListener("message",io),w({channel:T,v:S,type:"hello"});let N=(t,n=i)=>{if(q||o.parent===o)return Promise.reject(new l("HOST_UNAVAILABLE","No host frame. This page is not in an iframe."));return new Promise((d,c)=>{let O=setTimeout(()=>{_e.delete(t.id),c(new l("HOST_TIMEOUT","Host did not answer in time."))},n);_e.set(t.id,{resolve:d,reject:c,timer:O}),w(t)})},k=(t)=>N(t).then(()=>{return}),b={channel:T,v:S},st=(t)=>{if(!q&&o.parent!==o)w(t)},ao=()=>st({...b,type:"file-save"}),it=()=>{if(!q&&o.parent!==o)w({...b,type:"microphone-close",id:E(_)})},xn=async()=>{if(V)throw new l("HOST_REJECTED","The microphone is already open in this frame.");if(p?.features?.microphone!==!0)throw new l("UNSUPPORTED","This OpenChamber cannot share the microphone with extensions.");let t=globalThis.AudioContext;if(typeof t!=="function")throw new l("UNSUPPORTED","This frame has no Web Audio.");let n=new t;if(n.sampleRate<ut||n.sampleRate>_t)throw n.close().catch(()=>{return}),new l("UNSUPPORTED",`Audio at ${n.sampleRate} Hz is not supported.`);let d=n.state==="suspended"?n.resume().catch(()=>{return}):void 0,c=fo(Math.round(n.sampleRate/4)),O=n.createScriptProcessor(1024,1,1);O.onaudioprocess=(W)=>c.pull(W.outputBuffer.getChannelData(0));let m=n.createMediaStreamDestination();O.connect(m);let g=new Set,Se={queue:c,endedListeners:g,release:()=>{O.onaudioprocess=null,O.disconnect(),c.clear();for(let W of m.stream.getTracks())W.stop();n.close().catch(()=>{return})}};V=Se;try{let W=await N({...b,type:"microphone-open",id:E(_),payload:{sampleRate:n.sampleRate}},Et);if(!W||!("opened"in W)||W.opened!==!0)throw new l("HOST_REJECTED","Host did not open the microphone.");if(await d,V!==Se)throw new l("DISCONNECTED","The microphone closed while it was opening.")}catch(W){if(V===Se)V=null;throw Se.release(),it(),W}return{stream:m.stream,close:()=>{if(V!==Se)return;V=null,Se.release(),it()},onEnded:(W)=>(g.add(W),()=>{g.delete(W)})}},co=(t)=>{if(!zo(t)||!Pn(t))return;t.preventDefault(),ao()},lo=(t)=>{if(!zo(t)||t.key!=="Escape"||p?.surface!=="popover"||!p.popover)return;t.preventDefault(),Eo(p.popover.id,"escape").catch(()=>{return})},Ne=()=>{let t=p?.surface==="popover"?p.popover:void 0;if(!t)return;let n=be||Ce;if(no===n)return;no=n,To(t.id,n).catch(()=>{return})},Le=()=>{if(p?.surface!=="popover"||be)return;be=!0,Ne()},po=(t)=>{if(p?.surface!=="popover"||t.relatedTarget!==null||!be)return;be=!1,Ne()},uo=()=>{if(p?.surface!=="popover"||Ce)return;Ce=!0,Ne()},_o=()=>{if(p?.surface!=="popover"||!Ce)return;Ce=!1,Ne()},Q=(t,n=1024)=>{if(!t.trim()||t.length>n)throw new l("HOST_REJECTED",`Identity must contain 1 to ${n} characters.`)},at=async(t)=>{if(t.kind!=="projects")Q(t.projectId);let n=await N({...b,type:"workspace-read",id:E(_),payload:t});if(!n||!("kind"in n)||!("state"in n)||n.kind!==t.kind)throw new l("HOST_REJECTED","Host did not return workspace data.");return n},ct=async(t,n)=>{if(t.kind!=="projects")Q(t.projectId);let d=E(_);Ee.set(d,n);try{await k({...b,type:"workspace-subscribe",id:E(_),payload:{subscriptionId:d,query:t}})}catch(c){if(Ee.delete(d),!q)w({...b,type:"workspace-unsubscribe",id:E(_),payload:{subscriptionId:d}});throw c}return()=>{if(!Ee.delete(d)||q)return;w({...b,type:"workspace-unsubscribe",id:E(_),payload:{subscriptionId:d}})}},bn=async(t,n)=>{if(t.kind==="session")Q(t.sessionId);if(t.kind==="project")Q(t.projectId);let d=E(_);Te.set(d,n);try{await k({...b,type:"shells-subscribe",id:E(_),payload:{subscriptionId:d,scope:t}})}catch(c){if(Te.delete(d),!q)w({...b,type:"shells-unsubscribe",id:E(_),payload:{subscriptionId:d}});throw c}return()=>{if(!Te.delete(d)||q)return;w({...b,type:"shells-unsubscribe",id:E(_),payload:{subscriptionId:d}})}},Pe=async(t)=>{if("key"in t&&(t.key.length===0||t.key.length>lt))throw new l("HOST_REJECTED","Storage key must contain 1 to 128 characters.");if(t.op==="set"&&!fe(t.value))throw new l("HOST_REJECTED","Storage values must be JSON.");if(t.op==="set"&&new TextEncoder().encode(JSON.stringify(t.value)).length>pt)throw new l("HOST_REJECTED","Storage value exceeds 64 KiB.");if(t.scope==="device"&&p?.features?.deviceStorage!==!0)throw new l("UNSUPPORTED","This host does not support device storage.");let n=await N({...b,type:"storage",id:E(_),payload:t});if(!n||!("storage"in n)||n.op!==t.op)throw new l("HOST_REJECTED","Host did not return storage data.");return n},Eo=(t,n)=>p?.features?.popovers!==!0&&!(p?.surface==="popover"&&p.popover?.id===t)?Promise.reject(new l("UNSUPPORTED","This host does not support popovers.")):k({...b,type:"popover-close",id:E(_),payload:n?{id:t,reason:n}:{id:t}}),To=(t,n)=>p?.features?.popovers!==!0&&!(p?.surface==="popover"&&p.popover?.id===t)?Promise.reject(new l("UNSUPPORTED","This host does not support popovers.")):k({...b,type:"popover-anchor",id:E(_),payload:{id:t,active:n}});return o.addEventListener("keydown",lo,!0),o.addEventListener("pointerover",Le),o.addEventListener("pointermove",Le),o.addEventListener("pointerout",po),o.addEventListener("focus",uo),o.addEventListener("blur",_o),{onAction:(t)=>(ge=t,()=>{if(ge===t)ge=null}),listProjects:async()=>{let t=await at({kind:"projects"});if(t.kind!=="projects")throw new l("HOST_REJECTED","Expected projects.");return t},listWorktrees:async(t)=>{let n=await at({kind:"worktrees",projectId:t});if(n.kind!=="worktrees")throw new l("HOST_REJECTED","Expected worktrees.");return n},listSessions:async(t)=>{let n=await at({kind:"sessions",projectId:t});if(n.kind!=="sessions")throw new l("HOST_REJECTED","Expected sessions.");return n},onProjects:(t)=>ct({kind:"projects"},(n)=>{if(n.kind==="projects")t(n)}),onWorktrees:(t,n)=>ct({kind:"worktrees",projectId:t},(d)=>{if(d.kind==="worktrees")n(d)}),onSessions:(t,n)=>ct({kind:"sessions",projectId:t},(d)=>{if(d.kind==="sessions")n(d)}),onRunningShells:(t,n)=>bn(t,n),readShellOutput:async(t,n)=>{Q(t,we);let d=n?.cursor;if(d!==void 0&&(!Number.isInteger(d)||d<0))throw new l("HOST_REJECTED","Shell output cursor must be a non-negative integer.");let c=n?.tailBytes;if(c!==void 0&&(!Number.isInteger(c)||c<1||c>De))throw new l("HOST_REJECTED",`Shell output tailBytes must be an integer between 1 and ${De}.`);let m=await N({...b,type:"shell-output",id:E(_),payload:{shellId:t,cursor:d,tailBytes:c}});if(!m||typeof m.output!=="string"||!Number.isFinite(m.cursor))throw new l("HOST_REJECTED","Host did not return shell output.");return m},stopShell:async(t)=>{if(Q(t,we),(await N({...b,type:"shell-stop",id:E(_),payload:{shellId:t}}))?.stopped!==!0)throw new l("HOST_REJECTED","Host did not stop the shell.");return{stopped:!0}},openSession:async(t)=>{Q(t),await k({...b,type:"open-session",id:E(_),payload:{sessionId:t}})},storage:{get:async(t,n)=>{let d=qe(n),c={op:"get",key:t};if(d)c.scope=d;let O=await Pe(c);return O.op==="get"&&O.found?O.value:void 0},set:async(t,n,d)=>{let c=qe(d),O={op:"set",key:t,value:n};if(c)O.scope=c;await Pe(O)},delete:async(t,n)=>{let d=qe(n),c={op:"delete",key:t};if(d)c.scope=d;await Pe(c)},keys:async(t)=>{let n=qe(t),d={op:"keys"};if(n)d.scope=n;let c=await Pe(d);if(c.op!=="keys")throw new l("HOST_REJECTED","Expected storage keys.");return c.keys}},onReady:(t)=>{if(a.add(t),p)t(p);return()=>{a.delete(t)}},onDirectory:(t)=>{if(u.add(t),p)t(p.directory);return()=>{u.delete(t)}},onSession:(t)=>{if(A.add(t),p)t(p.session);return()=>{A.delete(t)}},onSessionLifecycle:(t)=>{if(f.add(t),ee)t(ee);return()=>{f.delete(t)}},onConnection:(t)=>{if(x.add(t),p)t(p.connection);return()=>{x.delete(t)}},onSettings:(t)=>{if(v.add(t),p)t(p.settings);return()=>{v.delete(t)}},onItem:(t)=>{if(j.add(t),p)t(p.item);return()=>{j.delete(t)}},onBlock:(t)=>{if(se.add(t),p?.block)t(p.block);return()=>{se.delete(t)}},onServiceEvent:(t)=>(K.add(t),()=>{K.delete(t)}),onStatusControl:(t)=>(M.add(t),()=>{M.delete(t)}),onPopoverClosed:(t)=>(z.add(t),()=>{z.delete(t)}),setStatusControls:(t)=>{if(p?.features?.statusControls!==!0)return Promise.reject(new l("UNSUPPORTED","This host does not support status controls."));if(!Ro(t))return Promise.reject(new l("HOST_REJECTED","Status controls must have unique bounded ids and valid selected options."));return k({...b,type:"status-controls",id:E(_),payload:{controls:t}})},openPopover:(t)=>{if(p?.features?.popovers!==!0)return Promise.reject(new l("UNSUPPORTED","This host does not support popovers."));if(!At(t))return Promise.reject(new l("HOST_REJECTED","Popover requests need bounded geometry and JSON data."));return k({...b,type:"popover-open",id:E(_),payload:t})},closePopover:Eo,setPopoverAnchorActive:To,onResolve:(t)=>(Z=t,()=>{if(Z===t)Z=null}),toast:(t)=>{let n=t.message.trim();if(!n||n.length>He)return Promise.reject(new l("HOST_REJECTED",`Toast message must contain 1 to ${He} characters.`));if(t.copy&&t.copy!==!0&&(!t.copy.text.length||t.copy.text.length>Xe))return Promise.reject(new l("HOST_REJECTED",`Toast copy text must contain 1 to ${Xe} characters.`));return k({channel:T,v:S,type:"toast",id:E(_),payload:{...t,message:n}})},openUrl:(t)=>k({channel:T,v:S,type:"open-url",id:E(_),payload:{url:t}}),openCommit:(t)=>gt(t)?k({channel:T,v:S,type:"open-commit",id:E(_),payload:{sha:t}}):Promise.reject(new l("HOST_REJECTED","Commit id must be 7 to 64 hex characters.")),answerBlock:(t)=>k({channel:T,v:S,type:"block-answer",id:E(_),payload:{text:t.trim().slice(0,mt)}}),openSurface:(t)=>k({channel:T,v:S,type:"open-surface",id:E(_),payload:{surfaceId:t}}),writeClipboard:(t)=>k({channel:T,v:S,type:"clipboard-write",id:E(_),payload:{text:t}}),compose:(t)=>k({channel:T,v:S,type:"compose",id:E(_),payload:t}),attach:(t)=>k({channel:T,v:S,type:"attach",id:E(_),payload:Ae(t)}),startSession:async(t)=>{if(t.projectId!==void 0)Q(t.projectId);let n=t.worktree;if(n&&n!==!0)if(n.kind==="existing")Q(n.directory);else{if(n.name!==void 0)Q(n.name,200);if(n.baseBranch!==void 0)Q(n.baseBranch,200)}let d=await N({channel:T,v:S,type:"start-session",id:E(_),payload:Ct(t)},e.requestTimeoutMs??180000);if(!ht(d))throw new l("HOST_REJECTED","Host did not return a session.");return d},prompt:(t)=>N({channel:T,v:S,type:"prompt",id:E(_),payload:yt(t)}).then((n)=>{if(!Rt(n))throw new l("HOST_REJECTED","Host did not return a prompt result.");return n}),sessionLink:(t)=>k({channel:T,v:S,type:"session-link",id:E(_),payload:Ae(t)}),close:()=>k({channel:T,v:S,type:"close",id:E(_)}),oauthStart:()=>k({channel:T,v:S,type:"oauth-start",id:E(_)}),oauthDisconnect:()=>k({channel:T,v:S,type:"oauth-disconnect",id:E(_)}),request:(t)=>(We(t.path)?N({channel:T,v:S,type:"request",id:E(_),payload:t}):qo()).then((n)=>{if(!je(n))throw new l("HOST_REJECTED","Host request result was empty.");return n}),serviceRequest:(t)=>(We(t.path)?N({channel:T,v:S,type:"service-request",id:E(_),payload:t}):qo()).then((n)=>{if(!je(n))throw new l("HOST_REJECTED","Host service request result was empty.");return n}),serviceStatus:()=>N({channel:T,v:S,type:"service-status",id:E(_)}).then((t)=>{if(!Mt(t))throw new l("HOST_REJECTED","Host did not return service status.");return t}),readFile:(t)=>(Oe(t)?N({channel:T,v:S,type:"file-read",id:E(_),payload:{path:t}}):ze()).then((n)=>{if(!Ut(n))throw new l("HOST_REJECTED","Host did not return file content.");return n}),writeFile:(t,n)=>{if(!Oe(t))return ze();if(n.length>Be)return Promise.reject(new l("FILE_TOO_LARGE",`Content is over ${Be} characters.`));return N({channel:T,v:S,type:"file-write",id:E(_),payload:{path:t,content:n}}).then((d)=>{if(!Nt(d))throw new l("HOST_REJECTED","Host did not confirm the write.");return d})},listDir:(t)=>(Oe(t)?N({channel:T,v:S,type:"file-list",id:E(_),payload:{path:t}}):ze()).then((n)=>{if(!Lt(n))throw new l("HOST_REJECTED","Host did not return directory entries.");return n}),stat:(t)=>(Oe(t)?N({channel:T,v:S,type:"file-stat",id:E(_),payload:{path:t}}):ze()).then((n)=>{if(!Pt(n))throw new l("HOST_REJECTED","Host did not return file status.");return n}),generate:(t)=>{let n=t.prompt.trim(),d=t.system?.trim();if(n.length===0||n.length>Fe)return Promise.reject(new l("HOST_REJECTED",`Prompt must be 1 to ${Fe} characters.`));if(d!==void 0&&(d.length===0||d.length>Ke))return Promise.reject(new l("HOST_REJECTED",`System prompt must be 1 to ${Ke} characters.`));let c=t.maxOutputTokens===void 0?void 0:Math.min(xt,Math.max(1,Math.floor(t.maxOutputTokens)));if(c!==void 0&&!Number.isFinite(c))return Promise.reject(new l("HOST_REJECTED","maxOutputTokens must be a number."));let O={prompt:n};if(d!==void 0)O.system=d;if(c!==void 0)O.maxOutputTokens=c;return N({channel:T,v:S,type:"generate",id:E(_),payload:O},e.requestTimeoutMs??bt).then((m)=>{if(!wt(m))throw new l("HOST_REJECTED","Host did not return generated text.");return m})},onLateGenerateResult:(t)=>{J.add(t);for(let n of ce.splice(0))R([t],n);return so(),()=>{J.delete(t)}},openMicrophone:xn,setBadge:(t)=>k({channel:T,v:S,type:"badge",id:E(_),payload:{count:kt(t)}}),setHeight:(t)=>k({channel:T,v:S,type:"resize",id:E(_),payload:{height:vt(t)}}),onFileOpen:(t)=>{if(Me.add(t),!rt)rt=!0,o.addEventListener("keydown",co,!0);if(xe)t(xe);return()=>{Me.delete(t)}},onFileSnapshot:(t)=>(Ie=t,()=>{if(Ie===t)Ie=null}),onFileSaved:(t)=>(Ue.add(t),()=>{Ue.delete(t)}),reportFileChange:(t)=>st({...b,type:"file-change",payload:{dirty:t.dirty,edited:t.edited}}),requestFileSave:ao,reportFileUnsupported:()=>st({...b,type:"file-unsupported"}),dispose:()=>{for(let t of Ee.keys())w({...b,type:"workspace-unsubscribe",id:E(_),payload:{subscriptionId:t}});Ee.clear();for(let t of Te.keys())w({...b,type:"shells-unsubscribe",id:E(_),payload:{subscriptionId:t}});if(Te.clear(),V)it(),V.release(),V=null;if(q=!0,Z=null,ge=null,Ie=null,Me.clear(),Ue.clear(),rt)o.removeEventListener("keydown",co,!0);o.removeEventListener("message",io),o.removeEventListener("keydown",lo,!0),o.removeEventListener("pointerover",Le),o.removeEventListener("pointermove",Le),o.removeEventListener("pointerout",po),o.removeEventListener("focus",uo),o.removeEventListener("blur",_o);for(let t of _e.values())clearTimeout(t.timer),t.reject(new l("HOST_UNAVAILABLE","Host client was disposed."));_e.clear(),a.clear(),u.clear(),A.clear(),f.clear(),x.clear(),v.clear(),j.clear(),se.clear(),K.clear(),M.clear(),z.clear(),J.clear(),ce.length=0}}};var Qo=["browser.open","browser.snapshot","browser.click","browser.type","browser.select","browser.scroll","browser.back","browser.forward","browser.inspect","browser.capture","browser.resize","browser.close"];var vr=new Set(Qo);var Yo=["none","agent","user"];var Ur=new Set(Yo);var wn=[["--oc-bg","background"],["--oc-elevated","elevated"],["--oc-fg","foreground"],["--oc-muted","muted"],["--oc-subtle","subtle"],["--oc-border","border"],["--oc-hover","hover"],["--oc-selection","selection"],["--oc-focus","focus"],["--oc-primary","primary"],["--oc-muted-surface","mutedSurface"],["--oc-elevated-fg","elevatedForeground"],["--oc-active","active"],["--oc-selection-fg","selectionForeground"],["--oc-primary-fg","primaryForeground"],["--oc-primary-text","primaryText"],["--oc-success-text","successText"],["--oc-warning-text","warningText"],["--oc-error-text","errorText"],["--oc-info-text","infoText"],["--oc-success","success"],["--oc-warning","warning"],["--oc-error","error"],["--oc-info","info"],["--oc-font","font"],["--oc-mono","mono"],["--oc-radius","radius"],["--surface-background","background"],["--surface-elevated","elevated"],["--surface-foreground","foreground"],["--surface-muted-foreground","muted"],["--surface-subtle","subtle"],["--interactive-border","border"],["--interactive-hover","hover"],["--interactive-selection","selection"],["--interactive-focus-ring","focus"],["--primary","primary"],["--surface-muted","mutedSurface"],["--surface-elevated-foreground","elevatedForeground"],["--interactive-active","active"],["--interactive-selection-foreground","selectionForeground"],["--primary-foreground","primaryForeground"],["--primary-text","primaryText"],["--success-text","successText"],["--warning-text","warningText"],["--error-text","errorText"],["--info-text","infoText"],["--status-success","success"],["--status-warning","warning"],["--status-error","error"],["--status-info","info"],["--font-sans","font"],["--font-mono","mono"],["--radius","radius"]],Dn=[["--oc-syntax-keyword","--syntax-keyword","syntaxKeyword"],["--oc-syntax-string","--syntax-string","syntaxString"],["--oc-syntax-number","--syntax-number","syntaxNumber"],["--oc-syntax-function","--syntax-function","syntaxFunction"],["--oc-syntax-type","--syntax-type","syntaxType"],["--oc-syntax-comment","--syntax-comment","syntaxComment"],["--oc-syntax-variable","--syntax-variable","syntaxVariable"],["--oc-syntax-operator","--syntax-operator","syntaxOperator"]],Jo=(e,o)=>{o.style.colorScheme=e.mode;for(let[r,i]of wn)o.style.setProperty(r,e.tokens[i]);for(let[r,i,a]of Dn){let u=e.tokens[a]??"";o.style.setProperty(r,u),o.style.setProperty(i,u)}o.style.setProperty("font-family",e.tokens.font),o.style.setProperty("font-size",e.tokens.fontSize??"0.875rem"),o.style.setProperty("line-height","1.45"),o.style.setProperty("color",e.tokens.foreground)},$t=(e,o)=>{if(Jo(e.theme,o),o.dataset)o.dataset.ocSurface=e.surface,o.dataset.ocTheme=e.theme.mode};var Gn={"surface-background":"bg","surface-elevated":"elevated","surface-elevated-foreground":"elevated-fg","surface-foreground":"fg","surface-muted-foreground":"muted","surface-muted":"muted-surface","surface-subtle":"subtle","interactive-border":"border","interactive-hover":"hover","interactive-active":"active","interactive-selection":"selection","interactive-selection-foreground":"selection-fg","interactive-focus-ring":"focus",primary:"primary","primary-foreground":"primary-fg","primary-text":"primary-text","success-text":"success-text","warning-text":"warning-text","error-text":"error-text","info-text":"info-text","status-success":"success","status-warning":"warning","status-error":"error","status-info":"info","font-sans":"font","font-mono":"mono",radius:"radius"},I=(e,o)=>`var(--${e}, var(--oc-${Gn[e]}, ${o}))`,oe=I("surface-background","transparent"),Ye=I("surface-elevated","transparent"),me=I("surface-elevated-foreground","inherit"),B=I("surface-foreground","inherit"),C=I("surface-muted-foreground","gray"),$n=I("surface-muted","transparent"),de=I("interactive-border","currentColor"),D=I("interactive-hover","transparent"),le=I("interactive-active","transparent"),Ht=I("interactive-selection","transparent"),Xt=I("interactive-selection-foreground","inherit"),te=I("primary","currentColor"),Vt=I("primary-text","inherit"),Bt=I("error-text","inherit"),Hn=I("font-sans","inherit"),Ft=I("font-mono","monospace"),on=I("radius","9px"),Kt=`calc(${on} - 2px)`,Zo=`calc(${on} - 4px)`,y=(e,o,r="transparent")=>`color-mix(in srgb, ${e} ${o}%, ${r})`,en=`background-image: linear-gradient(${D}, ${D});`,Wt=(e,o="0.5px")=>`box-shadow: inset 0 0 0 ${o} ${e}, var(--oc-sdk-field-lift);`,jt="border-color: var(--oc-sdk-edge); box-shadow: var(--oc-sdk-raised-lift);",tn="box-shadow: var(--oc-sdk-lit);",zt=`inset 0 0.5px 0 0 ${y(B,8)}, 0 1px 2px 0 rgb(0 0 0 / 0.4)`,Xn=`
:root {
  --oc-sdk-edge: ${y(B,16)};
  --oc-sdk-field-bg: ${Ye};
  --oc-sdk-raised-bg: ${oe};
  --oc-sdk-field-lift: inset 0 1px 2px 0 rgb(0 0 0 / 0.04);
  --oc-sdk-raised-lift: 0 1px 1.5px 0 rgb(0 0 0 / 0.08);
  --oc-sdk-lit: inset 0 1px 0 0 rgb(255 255 255 / 0.2), 0 1px 1.5px 0 rgb(0 0 0 / 0.1);
  --oc-sdk-float-edge: rgb(0 0 0 / 0.14);
  --oc-sdk-float: inset 0 1px 0 0 rgb(255 255 255 / 0.7), 0 1px 2px -0.5px rgb(0 0 0 / 0.06), 0 4px 8px -2px rgb(0 0 0 / 0.08), 0 12px 20px -4px rgb(0 0 0 / 0.06);
}
:root[data-oc-theme="dark"] {
  --oc-sdk-edge: ${y(B,14)};
  --oc-sdk-field-bg: ${y(oe,50,Ye)};
  --oc-sdk-raised-bg: ${Ye};
  --oc-sdk-field-lift: ${zt};
  --oc-sdk-raised-lift: ${zt};
  --oc-sdk-lit: ${zt};
  --oc-sdk-float-edge: rgb(0 0 0 / 0.55);
  --oc-sdk-float: inset 0 1px 0 0 rgb(255 255 255 / 0.04), inset 0 0 0 0.5px rgb(255 255 255 / 0.08), 0 8px 16px 0 rgb(0 0 0 / 0.25), 0 4px 8px 0 rgb(0 0 0 / 0.25);
}`,Qe=(e)=>{let o=I(`status-${e}`,"currentColor");return`
.oc-sdk[data-tone="${e}"], .oc-sdk [data-tone="${e}"] { --oc-sdk-tone: ${o}; --oc-sdk-tone-text: ${I(`${e}-text`,"inherit")}; }`},s=(e)=>`calc(${e}rem / 14)`,Vn=`
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
`,nn=`${Xn}
.oc-sdk { color: ${B}; font-family: ${Hn}; }
.oc-sdk :focus-visible, .oc-sdk:focus-visible { outline: none; }
.oc-sdk :where(button, a[href], [role="button"], [role="tab"], [role="option"]):focus-visible, button.oc-sdk:focus-visible { ${en} }
.oc-sdk-mono { font-family: ${Ft}; }
.oc-sdk-muted { color: ${C}; }
${Qe("success")}${Qe("warning")}${Qe("error")}${Qe("info")}
.oc-sdk[data-tone="primary"], .oc-sdk [data-tone="primary"] { --oc-sdk-tone: ${te}; --oc-sdk-tone-text: ${Vt}; }

.oc-sdk-btn { border-radius: ${Kt}; transition: background 150ms ease-out, color 150ms ease-out; }
.oc-sdk-btn[data-size="xs"] { border-radius: ${Zo}; }
.oc-sdk-btn[data-variant="default"] { color: ${Vt}; background: ${y(te,10,oe)}; border-color: ${y(te,12)}; ${tn} }
.oc-sdk-btn[data-variant="default"]:hover { background: ${y(te,16,oe)}; }
.oc-sdk-btn[data-variant="default"]:active { background: ${y(te,22,oe)}; box-shadow: none; }
.oc-sdk-btn[data-variant="secondary"] { background: ${$n}; color: var(--oc-fg); }
.oc-sdk-btn[data-variant="secondary"]:hover { background-image: linear-gradient(${D}, ${D}); }
.oc-sdk-btn[data-variant="secondary"]:active { background-image: linear-gradient(${le}, ${le}); }
.oc-sdk-btn[data-variant="outline"] { background: var(--oc-sdk-raised-bg); color: ${me}; ${jt} }
.oc-sdk-btn[data-variant="outline"]:hover { background-image: linear-gradient(${D}, ${D}); }
.oc-sdk-btn[data-variant="outline"]:active { background-image: linear-gradient(${le}, ${le}); box-shadow: none; }
.oc-sdk-btn[data-variant="ghost"] { background: transparent; }
.oc-sdk-btn[data-variant="ghost"]:hover { background: ${D}; }
.oc-sdk-btn[data-variant="ghost"]:active { background: ${le}; }
.oc-sdk-btn[data-variant="destructive"] { --oc-sdk-tone: ${I("status-error","red")}; color: ${Bt}; background: ${y("var(--oc-sdk-tone)",7,oe)}; border-color: ${y("var(--oc-sdk-tone)",12)}; ${tn} }
.oc-sdk-btn[data-variant="destructive"]:hover { background: ${y("var(--oc-sdk-tone)",9,oe)}; }
.oc-sdk-btn[data-variant="destructive"]:active { background: ${y("var(--oc-sdk-tone)",11,oe)}; box-shadow: none; }

.oc-sdk-field-note { color: ${C}; }
.oc-sdk-field[data-invalid="true"] .oc-sdk-field-note { color: ${Bt}; }
.oc-sdk-input { border-radius: ${Kt}; background: var(--oc-sdk-field-bg); color: ${me}; ${Wt("var(--oc-sdk-edge)")} transition: background 150ms ease-out; }
.oc-sdk-input::placeholder { color: ${C}; }
.oc-sdk-input:hover:not(:focus) { background-image: linear-gradient(${D}, ${D}); }
.oc-sdk-input:focus, .oc-sdk-input:focus-visible { ${Wt(y(B,26),"1px")} }
.oc-sdk-field[data-invalid="true"] .oc-sdk-input, .oc-sdk-field[data-invalid="true"] .oc-sdk-input:focus { ${Wt(I("status-error","red"),"1px")} }
.oc-sdk-input[data-mono="true"] { font-family: ${Ft}; }

.oc-sdk-search-icon { color: ${C}; }
.oc-sdk-search[data-active="true"] .oc-sdk-search-icon { color: ${te}; }
.oc-sdk-search-clear { border-radius: ${Zo}; color: ${C}; }
.oc-sdk-search-clear:hover { background: ${D}; color: ${B}; }

.oc-sdk-trigger { border-radius: ${Kt}; background: var(--oc-sdk-raised-bg); color: ${me}; ${jt} transition: background 150ms ease-out; }
.oc-sdk-trigger:hover { background-image: linear-gradient(${D}, ${D}); }
.oc-sdk-trigger[aria-expanded="true"] { background-image: linear-gradient(${le}, ${le}); }
.oc-sdk-trigger-value[data-empty="true"] { color: ${C}; }
.oc-sdk-trigger-chevron { color: ${C}; }
/* The app's floating level: the glass edge (a hairline ring and a lit top line, dark outside and light inside in dark themes) over soft shadows. The outer ring is the border, over the page like the app's. */
.oc-sdk-popup { --surface-foreground: ${me}; border-color: var(--oc-sdk-float-edge); border-radius: 12px; background: ${Ye}; background-clip: padding-box; color: ${me}; box-shadow: var(--oc-sdk-float); }
.oc-sdk-option { border-radius: 8px; }
.oc-sdk-option[data-active="true"] { background: ${D}; }
/* A selected option shows a check mark in the text colour, like the app's own pickers. Options without the mark come
   from bundles built before it existed and keep the selection fill as their only sign of the choice. */
.oc-sdk-option[aria-selected="true"]:not([data-mark]) { background: ${Ht}; color: ${Xt}; }
.oc-sdk-option-check { color: ${B}; }
.oc-sdk-option[data-destructive="true"] { color: ${Bt}; }
.oc-sdk-option[data-destructive="true"][data-active="true"] { background: ${y(I("status-error","red"),10)}; }
.oc-sdk-option-hint { color: ${C}; }
.oc-sdk-popup-empty { color: ${C}; }

/* Checked stays neutral: the mark carries the state, and the primary colour stays with primary actions. */
.oc-sdk-check-box { border-color: ${de}; border-radius: 4px; color: ${B}; transition: border-color 150ms ease-out; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-box { border-color: ${y(B,60,de)}; }
.oc-sdk-check-thumb { border-radius: 9999px; background: ${de}; transition: background 150ms ease-out; }
.oc-sdk-check-thumb::after { border-radius: 9999px; background: ${oe}; transition: transform 150ms ease-out; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-thumb { background: ${te}; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-thumb::after { transform: translateX(var(--oc-sdk-thumb-travel, 16px)); }
.oc-sdk-check:focus-visible { box-shadow: none; }
.oc-sdk-check:focus-visible .oc-sdk-check-box, .oc-sdk-check:focus-visible .oc-sdk-check-thumb { ${en} }
.oc-sdk-check-desc { color: ${C}; }

.oc-sdk-tabs { border-radius: 10px; }
.oc-sdk-tabs[data-track="true"] { background: ${y(B,4)}; box-shadow: inset 0 1px 2px 0 rgb(0 0 0 / 0.16); }
.oc-sdk-tab { border-radius: 8px; color: ${C}; transition: color 150ms ease-out, background 150ms ease-out; }
.oc-sdk-tab:hover { color: ${B}; }
.oc-sdk-tab[aria-selected="true"] { color: ${Xt}; background: ${Ht}; border-color: ${de}; }
.oc-sdk-tabs[data-track="true"] .oc-sdk-tab[aria-selected="true"] { color: ${me}; background: var(--oc-sdk-raised-bg); ${jt} }
.oc-sdk-tab-count { color: ${C}; }

/* The app's neutral badge: a step of the text colour, the same in every theme. */
.oc-sdk-badge { border-radius: 9999px; background: ${y(B,6)}; color: ${C}; }
.oc-sdk-badge[data-tone] { color: var(--oc-sdk-tone-text, var(--oc-sdk-tone)); background: ${y("var(--oc-sdk-tone)",15)}; }

.oc-sdk-row { border-radius: 6px; transition: background 120ms ease-out; }
.oc-sdk-row:hover, .oc-sdk-row[data-active="true"] { background: ${D}; }
.oc-sdk-row[aria-selected="true"] { background: ${Ht}; color: ${Xt}; }
.oc-sdk-row-lead { font-family: ${Ft}; color: ${C}; }
.oc-sdk-row-sub { color: ${C}; }
.oc-sdk-row-meta { color: ${C}; }
.oc-sdk-row[aria-selected="true"] .oc-sdk-row-lead, .oc-sdk-row[aria-selected="true"] .oc-sdk-row-sub, .oc-sdk-row[aria-selected="true"] .oc-sdk-row-meta { color: inherit; opacity: .75; }
.oc-sdk-list-empty { color: ${C}; }

.oc-sdk-empty-body { color: ${C}; }

.oc-sdk-spinner { color: ${C}; }
.oc-sdk-spinner-ring { border-color: ${de}; border-top-color: ${te}; border-radius: 9999px; }

/* Set apart by its tint alone, like the app's banners. */
.oc-sdk-banner { border-color: transparent; border-radius: 8px; background: ${y("var(--oc-sdk-tone)",10)}; }
.oc-sdk-banner-title { color: var(--oc-sdk-tone-text, var(--oc-sdk-tone)); }
.oc-sdk-banner-body { color: ${C}; }

.oc-sdk-separator { color: ${C}; }
.oc-sdk-separator::before, .oc-sdk-separator::after { background: ${y(de,40)}; }

.oc-sdk-progress-label { color: ${C}; }
/* The app's progress: a groove a step of the text colour, green once done. Older bundles mark done only through aria-valuenow. */
.oc-sdk-progress-track { border-radius: 9999px; background: ${y(B,6)}; }
.oc-sdk-progress-fill { border-radius: 9999px; background: var(--oc-sdk-tone, ${te}); }
.oc-sdk-progress-track[aria-valuenow="100"] > .oc-sdk-progress-fill:not([data-tone]) { background: ${I("status-success","currentColor")}; }
.oc-sdk-progress[data-done="true"] .oc-sdk-progress-value { color: ${I("success-text","inherit")}; }

.oc-sdk-text a { color: ${Vt}; text-decoration: underline; text-underline-offset: 2px; }
.oc-sdk-text img { border-radius: 8px; border: 1px solid ${y(de,60)}; }
`,P=`
${dt}
${Vn}
${nn}`;var pe={saved:!1,providers:[],windows:{},hiddenBalances:[],cutoffPercent:10,resetTime:"relative"};var rn="quota.display.v1",Qt=(e)=>!!e&&typeof e==="object"&&!Array.isArray(e),jn=(e)=>{if(!Qt(e))return{...pe};let o=Array.isArray(e.providers)?e.providers.filter((u)=>typeof u==="string"):[],r={};if(Qt(e.windows)){for(let[u,A]of Object.entries(e.windows))if(Array.isArray(A))r[u]=A.filter((f)=>typeof f==="string")}let i=Array.isArray(e.hiddenBalances)?e.hiddenBalances.filter((u)=>typeof u==="string"):[],a=typeof e.cutoffPercent==="number"&&Number.isFinite(e.cutoffPercent)?Math.min(100,Math.max(0,e.cutoffPercent)):pe.cutoffPercent;return{saved:e.saved===!0,providers:o,windows:r,hiddenBalances:i,cutoffPercent:a,resetTime:e.resetTime==="absolute"?"absolute":"relative"}},zn=(e)=>{if(e.saved&&e.providers.includes("tavily")&&e.windows.tavily===void 0)return{...e,windows:{...e.windows,tavily:["plan","key","paygo"]}};return e},sn=async(e)=>{try{let o=await e.get(rn),r=jn(o);if(!Qt(o)||o.tavilyMonthlyWindowsMigrated===!0)return r;let i=zn(r);try{await re(e,i)}catch{}return i}catch{return{...pe}}},re=async(e,o)=>{await e.set(rn,{...o,tavilyMonthlyWindowsMigrated:!0})};var an=(e,o,r)=>({...e,hiddenBalances:r?[...new Set([...e.hiddenBalances,o])]:e.hiddenBalances.filter((i)=>i!==o)}),cn=(e,o)=>{if(e.saved)return e;return{...e,saved:!0,providers:o.map((r)=>r.id),windows:Object.fromEntries(o.map((r)=>[r.id,[...r.windows]]))}},dn=(e,o,r=[])=>{let i=cn(e,r),a=!i.providers.includes(o),u=a?[...i.providers,o]:i.providers.filter((x)=>x!==o),A=r.find((x)=>x.id===o)?.windows,f=a&&i.windows[o]===void 0&&A!==void 0?{...i.windows,[o]:[...A]}:i.windows;return{...i,saved:!0,providers:u,windows:f}},ln=(e,o,r,i=[])=>{let a=cn(e,i),u=a.windows[o]??[],A=u.includes(r)?u.filter((f)=>f!==r):[...u,r];return{...a,saved:!0,windows:{...a.windows,[o]:A}}},Yt=(e,o,r)=>{let i=e.providers.includes(o)?e.providers:[...e.providers,o];return{...e,saved:!0,providers:i,windows:e.windows[o]===void 0?{...e.windows,[o]:[...r]}:e.windows}},pn=(e,o)=>({...e,cutoffPercent:Number.isFinite(o)?Math.min(100,Math.max(0,o)):pe.cutoffPercent}),un=(e,o)=>({...e,resetTime:o});var _n=(e)=>async(o)=>{let r=await e.serviceRequest({method:o.method,path:o.path,...o.body!==void 0?{body:JSON.stringify(o.body)}:{}}),i=r.body;if(typeof r.body==="string")try{i=JSON.parse(r.body)}catch{i=null}return{status:r.status,body:i}};var F=(e)=>e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),Y=(e)=>F(e);var Jt=(e)=>`<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"><path d="${e}"/></svg>`,qn=(e)=>`<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${e}</svg>`;var ot=(e)=>{if(e==="codex")return Jt("M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.073zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z");if(e==="opencode-go"||e==="opencode-zen")return Jt("M22 24H2V0h20zM17 4.8H7v14.4h10z");if(e==="openrouter")return Jt("M16.778 1.844v1.919q-.569-.026-1.138-.032-.708-.008-1.415.037c-1.93.126-4.023.728-6.149 2.237-2.911 2.066-2.731 1.95-4.14 2.75-.396.223-1.342.574-2.185.798-.841.225-1.753.333-1.751.333v4.229s.768.108 1.61.333c.842.224 1.789.575 2.185.799 1.41.798 1.228.683 4.14 2.75 2.126 1.509 4.22 2.11 6.148 2.236.88.058 1.716.041 2.555.005v1.918l7.222-4.168-7.222-4.17v2.176c-.86.038-1.611.065-2.278.021-1.364-.09-2.417-.357-3.979-1.465-2.244-1.593-2.866-2.027-3.68-2.508.889-.518 1.449-.906 3.822-2.59 1.56-1.109 2.614-1.377 3.978-1.466.667-.044 1.418-.017 2.278.02v2.176L24 6.014Z");if(e==="tavily")return'<svg class="quota-tavily-mark" viewBox="0 0 55 55" width="14" height="14" aria-hidden="true" fill="#1F1E1E" fill-rule="evenodd" clip-rule="evenodd"><path d="M38.8088 0C44.4762 0 47.3101 9.1895e-05 49.4748 1.10306C51.3788 2.07326 52.927 3.62135 53.8971 5.52544C55.0001 7.69013 55 10.524 55 16.1914V38.8088C55 44.4761 55.0001 47.3099 53.8971 49.4746C52.927 51.3786 51.3788 52.9267 49.4748 53.8969C47.3101 54.9999 44.4762 55 38.8088 55H16.1914C10.5239 55 7.69014 54.9999 5.52544 53.8969C3.62133 52.9267 2.07325 51.3787 1.10306 49.4746C0.000109958 47.3099 0 44.4762 0 38.8088V16.1912C0 10.5238 0.000107614 7.69012 1.10306 5.52544C2.07325 3.62133 3.62133 2.07326 5.52544 1.10306C7.69014 8.88436e-05 10.5239 0 16.1914 0H38.8088ZM23.3863 30.405C23.0885 30.405 22.7934 30.4638 22.5183 30.5782C22.2433 30.6926 21.9933 30.8603 21.7827 31.0716L17.4534 35.4188L16.3029 34.2638C15.4573 33.415 14.0099 33.8346 13.7471 35.0064L12.1073 42.3023C12.0498 42.5532 12.0568 42.8148 12.128 43.0621C12.199 43.3085 12.3313 43.5327 12.5123 43.7136L12.5108 43.7159C12.6915 43.8987 12.9155 44.0321 13.1619 44.1037C13.4083 44.1752 13.6688 44.1824 13.9188 44.1246L21.1862 42.4776C22.3527 42.2137 22.7715 40.7614 21.9259 39.9124L20.7754 38.7574L25.1056 34.411C25.5306 33.9842 25.7695 33.4049 25.7695 32.8013C25.7695 32.1977 25.5306 31.6185 25.1056 31.1916L25.0476 31.1334L25.0497 31.1319L24.9896 31.0716C24.7791 30.8603 24.529 30.6926 24.254 30.5782C23.979 30.4638 23.684 30.4051 23.3863 30.405ZM39.0054 27.6663C37.9941 27.0245 36.6768 27.7546 36.6766 28.9556V30.5884H27.3981C27.7081 31.1832 27.8847 31.8596 27.8847 32.5774C27.8846 33.6152 27.5181 34.5672 26.908 35.3099L36.6758 35.3096L36.6752 36.9424C36.6753 38.1434 37.9941 38.8736 39.0054 38.2319L45.3045 34.2387C45.7757 33.9384 46.0114 33.443 46.0115 32.948C46.0109 32.4536 45.7752 31.9592 45.303 31.6601L39.0054 27.6663ZM23.6104 10.2206C23.3539 10.2194 23.101 10.2839 22.8763 10.4081C22.6514 10.5325 22.4614 10.7132 22.3253 10.9318L18.3472 17.2549H18.3458C17.7067 18.2701 18.4346 19.5933 19.6307 19.5936H21.2578V28.9869C21.9327 28.5406 22.7403 28.2801 23.609 28.2801C24.4781 28.2801 25.2864 28.5407 25.9615 28.9875V19.5936H27.5884C28.7849 19.5936 29.5112 18.2702 28.8728 17.2541L24.8939 10.9318C24.5951 10.4584 24.1029 10.2212 23.6104 10.2206Z"/></svg>';return qn('<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8H6a2 2 0 0 0-2 2v2a6 6 0 0 0 6 6h4a6 6 0 0 0 6-6v-2a2 2 0 0 0-2-2Z"/>')};var En=(e)=>`<section class="quota-settings-section quota-providers-section">
    <div class="quota-section-heading">
      <div>
        <h3>Providers</h3>
        <p class="quota-section-note">Connect the providers shown in the Quotas panel.</p>
      </div>
    </div>
    <ul class="quota-connections">${e.map((r)=>`<li class="quota-connection">
        <div class="quota-connection-main">
          <span class="quota-connection-icon">${ot(r.kind)}</span>
          <span class="quota-connection-label">${F(r.label)}</span>
          <span class="quota-kind-chip">${r.kind==="custom"?"Custom":"Built-in"}</span>
          ${r.endpoint?`<span class="quota-connection-endpoint">${F(r.endpoint)}</span>`:""}
        </div>
        <div class="quota-connection-actions">
          <button type="button" data-action="edit-connection" data-id="${Y(r.id)}">Edit</button>
          <button type="button" data-action="test-connection" data-id="${Y(r.id)}">Test</button>
          <button type="button" class="quota-danger" data-action="delete-connection" data-id="${Y(r.id)}">Remove</button>
        </div>
      </li>`).join("")||'<li class="quota-muted">No providers configured yet.</li>'}</ul>
    <form data-form="connection" class="quota-form">
      <div class="quota-form-error" data-form-error role="alert"></div>
      <label class="quota-field quota-field-full">Provider
        <select name="kind">
          <option value="tavily">Tavily</option>
          <option value="openrouter">OpenRouter</option>
          <option value="opencode-go">OpenCode Go</option>
          <option value="opencode-zen">OpenCode Zen</option>
          <option value="codex">OpenAI / Codex</option>
          <option value="custom">Custom</option>
        </select>
      </label>
      <label class="quota-field" data-field="label">Label <input name="label" maxlength="60" placeholder="Provider name" /></label>
      <label class="quota-field" data-field="key">Key <input name="apiKey" type="password" autocomplete="off" placeholder="API key" /></label>
      <label class="quota-field quota-field-full" data-field="endpoint" hidden>Endpoint <input name="endpoint" type="url" placeholder="https://example.com/quota" /></label>
      <p class="quota-form-hint quota-field-full" data-connection-hint></p>
      <span class="quota-form-actions quota-field-full">
        <button type="button" class="quota-primary" data-action="save-connection">Add provider</button>
        <button type="button" data-action="cancel-edit" hidden>Cancel</button>
      </span>
    </form>
  </section>`,Tn=(e)=>`<section class="quota-settings-section quota-tls-section">
  <div class="quota-section-heading">
    <div>
      <h3>TLS</h3>
      <p class="quota-section-note">Optional corporate root certificate for provider requests.</p>
    </div>
  </div>
  <form data-form="ca" class="quota-form">
    <label class="quota-field quota-field-full">CA bundle path (optional)
      <input name="caBundlePath" value="${e?Y(e):""}" placeholder="C:\\certs\\corporate-root.pem" />
    </label>
    <span class="quota-form-actions quota-field-full">
      <button type="button" data-action="save-ca">Save TLS setting</button>
    </span>
  </form>
</section>`;var nt=(e)=>e.filter((o)=>o.id!=="key-used"&&o.label!=="Key credits used");var Sn=(e,o)=>{if(o==="USD")return new Intl.NumberFormat(void 0,{style:"currency",currency:"USD",maximumFractionDigits:2}).format(e);return`${e} ${o}`};var fn=(e)=>`<section class="quota-settings-section quota-usage-section">
    <div class="quota-section-heading">
      <div>
        <h3>Usage</h3>
        <p class="quota-section-note">Non-resetting balances reported by your providers.</p>
      </div>
    </div>
    ${(e?.providers??[]).map((r)=>{let i=nt(r.balances).map((a)=>`<div class="quota-usage-row">
            <span class="quota-usage-label">${F(a.label)}</span>
            <span class="quota-usage-value">${F(Sn(a.value,a.unit))}</span>
          </div>`).join("");return i?`<div class="quota-usage-group">
            <div class="quota-usage-provider">${F(r.label)}</div>
            ${i}
          </div>`:""}).filter(Boolean).join("")||`<p class="quota-muted">${e?"No non-resetting balances reported.":"Loading usage…"}</p>`}
  </section>`;var An=(e,o)=>`<section class="quota-settings-section quota-display-section">
    <div class="quota-section-heading">
      <div>
        <h3>Display</h3>
        <p class="quota-section-note">Choose which providers and windows appear in the Quotas panel.</p>
      </div>
    </div>
    <div class="quota-selector">
      ${e.providers.map((i)=>{let a=!o.saved||o.providers.includes(i.connectionId),u=nt(i.balances).length>0,A=!o.hiddenBalances.includes(i.connectionId),f=i.windows.map((j)=>{let se=!o.saved||(o.windows[i.connectionId]??[]).includes(j.id);return`<label class="quota-check quota-check-window">
            <input type="checkbox" data-window-toggle data-provider="${Y(i.connectionId)}" data-window="${Y(j.id)}" ${se?"checked":""} />
            ${F(j.label)}
          </label>`}).join(""),x=u?`<label class="quota-check quota-check-window">
            <input type="checkbox" data-balance-toggle data-provider="${Y(i.connectionId)}" ${A?"checked":""} />
            non-reporting balances
          </label>`:"",v=`${f}${x}`;return`<div class="quota-select-provider">
        <label class="quota-check quota-provider-choice">
          <input type="checkbox" data-provider-toggle data-provider="${Y(i.connectionId)}" ${a?"checked":""} />
          <span class="quota-select-icon">${ot(i.kind)}</span>
          <span class="quota-select-label">${F(i.label)}</span>
        </label>
        ${v?`<div class="quota-select-windows">${v}</div>`:""}
      </div>`}).join("")||'<p class="quota-muted">No configured providers.</p>'}
    </div>
    <div class="quota-preferences">
      <label class="quota-preference">Danger cutoff
        <input type="number" min="0" max="100" step="1" data-cutoff value="${o.cutoffPercent}" /> %
      </label>
      <label class="quota-preference">Reset time
        <select data-reset-time>
          <option value="relative" ${o.resetTime==="relative"?"selected":""}>Relative</option>
          <option value="absolute" ${o.resetTime==="absolute"?"selected":""}>Absolute</option>
        </select>
      </label>
    </div>
  </section>`;var Qn={custom:"Custom provider",codex:"OpenAI / Codex","opencode-go":"OpenCode Go","opencode-zen":"OpenCode Zen",openrouter:"OpenRouter",tavily:"Tavily"},On=(e)=>Qn[e]??e;var L=Gt(),ie=_n(L),ae=document.querySelector("#root");if(!ae)throw Error("Missing #root");var ue=null,ve=[],h={...pe},Zt=null,Re="",mn=!1,X=null,eo=async()=>{let o=(await ie({method:"GET",path:"/connections"})).body;ve=Array.isArray(o?.connections)?o.connections:[]},Rn=async()=>{let o=(await ie({method:"GET",path:"/config"})).body;Zt=typeof o?.caBundlePath==="string"?o.caBundlePath:null},gn=async()=>{let e=await ie({method:"GET",path:"/snapshot"});if(e.status===200&&e.body&&typeof e.body==="object")ue=e.body},Yn=(e)=>new Promise((o)=>setTimeout(o,e)),to=async(e)=>{await ie({method:"POST",path:"/refresh"});let o=Date.now()+1e4;do{if(await Yn(e?300:600),await gn(),!e)return;let r=ue?.providers.find((i)=>i.connectionId===e);if(!r||!r.refreshing)return}while(Date.now()<o)},hn=()=>(ue?.providers??[]).map((e)=>({id:e.connectionId,windows:e.windows.map((o)=>o.id)})),oo=()=>{let e=ae.querySelector('[data-form="connection"]');if(!e)return;let o=e.querySelector('select[name="kind"]'),r=o?.value??"tavily";if(o)o.disabled=X!==null;let i=e.querySelector('input[name="label"]');if(i){if(!i.value.trim()||i.dataset.auto==="true")i.value=On(r),i.dataset.auto="true";i.oninput=()=>{i.dataset.auto="false"}}let a=e.querySelector('[data-field="endpoint"]');if(a)a.hidden=r!=="custom";let u=e.querySelector('input[name="endpoint"]');if(u)u.disabled=r!=="custom";let A=e.querySelector('input[name="apiKey"]');if(A)A.disabled=r==="codex",A.placeholder=r==="codex"?"Not needed":"API key";let f=e.querySelector('[data-action="save-connection"]');if(f)f.textContent=X?"Save changes":"Add provider";let x=e.querySelector('[data-action="cancel-edit"]');if(x)x.hidden=X===null;let v=e.querySelector("[data-connection-hint]");if(v)v.textContent=r==="codex"?"OpenAI / Codex imports ~/.codex/auth.json. Run `codex login` first; no key is needed here.":r==="custom"?"Custom endpoints must use HTTPS and return openchamber-quota-v1.":"Paste the API key for this provider."},Jn=(e)=>{let o=ae.querySelector('[data-form="connection"]');if(!o)return;let r=o.querySelector('select[name="kind"]');if(r)r.value=e.kind;let i=o.querySelector('input[name="label"]');if(i)i.value=e.label,i.dataset.auto="false";let a=o.querySelector('input[name="endpoint"]');if(a)a.value=e.endpoint??"";let u=o.querySelector('input[name="apiKey"]');if(u)u.value="";if(oo(),u)u.placeholder=e.kind==="codex"?"Not needed":"Leave blank to keep the current key"},Zn=async()=>{Re="";try{await Promise.all([eo(),Rn()]),await to(),U()}catch(e){Re=e instanceof Error?e.message:"The quota service is unavailable.",U()}},U=()=>{if(ae.innerHTML=`<header class="quota-settings-header">
    <div>
      <h2>Quota settings</h2>
      <p class="quota-settings-subtitle">Manage providers, usage, and what appears in Work Status.</p>
    </div>
  </header>
  ${Re?`<div class="quota-error" role="alert">${F(Re)}</div>`:""}
  ${En(ve)}
  ${Tn(Zt)}
  ${fn(ue)}
  ${ue?An(ue,h):'<div class="quota-row-loading">Loading quota…</div>'}`,oo(),X){let e=ve.find((o)=>o.id===X);if(e)Jn(e);else X=null}},In=(e)=>{let o=new FormData(e),r=String(o.get("kind")??""),i=String(o.get("label")??"").trim(),a=String(o.get("endpoint")??"").trim(),u=String(o.get("apiKey")??""),A=e.querySelector("[data-form-error]"),f=(M)=>{if(A)A.textContent=M};if(f(""),!i){f("Enter a label.");return}if(r==="custom"&&!a){f("Enter an HTTPS endpoint.");return}let x=X?ve.find((M)=>M.id===X):r!=="custom"?ve.find((M)=>M.kind===r):void 0;if(r!=="codex"&&!u&&!x){f("Enter the API key.");return}let v={kind:r,label:i};if(a)v.endpoint=a;if(u)v.apiKey=u;let j=x?"PUT":"POST",se=x?`/connections/${encodeURIComponent(x.id)}`:"/connections",K=e.querySelector('[data-action="save-connection"]');if(K)K.disabled=!0,K.textContent="Saving…";(async()=>{try{let M=await ie({method:j,path:se,body:v});if(M.status>=400){let ce=M.body;f(ce.error?.message??"Could not add the provider.");return}let z=M.body.connection,J=!x;X=null,e.reset(),await eo(),U(),await L.toast({kind:"success",message:"Provider saved."}),to(z?.id).then(async()=>{if(z&&J&&h.saved){let ce=ue?.providers.find((Z)=>Z.connectionId===z.id);h=Yt(h,z.id,ce?.windows.map((Z)=>Z.id)??[]),await re(L.storage,h)}U()}).catch(async()=>{if(z&&J&&h.saved)h=Yt(h,z.id,[]),await re(L.storage,h);U(),await L.toast({kind:"error",message:"Provider saved, but the first quota refresh failed."})})}catch(M){f(M instanceof Error?M.message:"Could not reach the quota service.")}finally{if(K&&K.isConnected)K.disabled=!1,K.textContent=X?"Save changes":"Add provider"}})()},er=(e)=>{let o=new FormData(e),r=String(o.get("caBundlePath")??"").trim();(async()=>{try{if((await ie({method:"PUT",path:"/config",body:{caBundlePath:r||null}})).status>=400){await L.toast({kind:"error",message:"Could not save the TLS setting."});return}Zt=r||null,await L.toast({kind:"success",message:"TLS setting saved."}),U()}catch(i){await L.toast({kind:"error",message:i instanceof Error?i.message:"Could not reach the quota service."})}})()};ae.addEventListener("click",(e)=>{let o=e.target.closest("[data-action]");if(!o)return;let r=o.dataset.action;if(r==="save-connection"){let i=o.closest('[data-form="connection"]');if(i)In(i);return}if(r==="save-ca"){let i=o.closest('[data-form="ca"]');if(i)er(i);return}if(r==="edit-connection"&&o.dataset.id){X=o.dataset.id,U();return}if(r==="cancel-edit"){X=null,U();return}if(r==="delete-connection"&&o.dataset.id){(async()=>{if((await ie({method:"DELETE",path:`/connections/${encodeURIComponent(o.dataset.id)}`})).status>=400){Re="Could not remove the provider.",U();return}if(X===o.dataset.id)X=null;await Zn()})();return}if(r==="test-connection"&&o.dataset.id)(async()=>{let a=(await ie({method:"POST",path:`/connections/${encodeURIComponent(o.dataset.id)}/test`})).body;await L.toast({kind:a.ok?"success":"error",message:a.ok?"Connection works.":a.error?.message??"Connection failed."})})()});ae.addEventListener("change",(e)=>{let o=e.target;if(o.matches('select[name="kind"]')){let r=ae.querySelector('input[name="label"]');if(r)r.value="",r.dataset.auto="true";oo();return}if(o.matches("[data-provider-toggle]")){h=dn(h,o.getAttribute("data-provider"),hn()),re(L.storage,h).then(U);return}if(o.matches("[data-window-toggle]")){h=ln(h,o.getAttribute("data-provider"),o.getAttribute("data-window"),hn()),re(L.storage,h).then(U);return}if(o.matches("[data-balance-toggle]")){h=an(h,o.getAttribute("data-provider"),!o.checked),re(L.storage,h).then(U);return}if(o.matches("[data-cutoff]")){h=pn(h,Number(o.value)),re(L.storage,h).then(U);return}if(o.matches("[data-reset-time]"))h=un(h,o.value==="absolute"?"absolute":"relative"),re(L.storage,h).then(U)});ae.addEventListener("keydown",(e)=>{if(e.key!=="Enter")return;let o=e.target,r=o.closest('[data-form="connection"]');if(!r||o.tagName==="SELECT")return;e.preventDefault(),In(r)});L.onReady((e)=>{if($t(e,document.documentElement),mn)return;mn=!0,(async()=>{try{h=await sn(L.storage),await Promise.all([eo(),Rn(),gn()]),U(),to().then(U).catch(()=>{return})}catch(o){Re=o instanceof Error?o.message:"The quota service is unavailable.",U()}})()});})();
