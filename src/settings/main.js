(()=>{var S="openchamber.sdk",T=1;var ut=`
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
`;function mo(e){let t=e.documentElement;if(t.hasAttribute("data-oc-scrollbar-activity"))return;t.setAttribute("data-oc-scrollbar-activity","");let r=new WeakMap;e.addEventListener("scroll",(i)=>{let a=i.target===e?t:i.target;if(!(a instanceof Element))return;if(!a.hasAttribute("data-oc-scrolling"))a.setAttribute("data-oc-scrolling","");let c=r.get(a);if(c!==void 0)clearTimeout(c);r.set(a,setTimeout(()=>{r.delete(a),a.removeAttribute("data-oc-scrolling")},1000))},{capture:!0,passive:!0})}var Un=`(${mo.toString()})(document);`;var _t=128,Et=65536;var De=128;var Ge=65536;var St=8000,Tt=192000,ft=120000;var Ro=(e)=>{let t=[],r=0,i=0;return{push:(a)=>{t.push(a),i+=a.length;while(i-r>e&&t.length>1){let c=t.shift();i-=c?.length??0,r=0}},pull:(a)=>{let c=0;while(c<a.length&&t.length>0){let h=t[0],m=Math.min(a.length-c,h.length-r);if(a.set(h.subarray(r,r+m),c),c+=m,r+=m,r>=h.length)t.shift(),i-=h.length,r=0}a.fill(0,c)},clear:()=>{t.length=0,r=0,i=0},get size(){return i-r}}};var xo=/^[a-z][a-z0-9-]{0,39}$/;var go=(e)=>Object(e)===e&&!Array.isArray(e),At=(e,t)=>Object.keys(e).every((r)=>t.includes(r)),Io=(e)=>String(e)===e&&e.length>=1&&e.length<=60,bo=(e)=>String(e)===e&&e.length>=1&&e.length<=80,Co=(e)=>{if(!Array.isArray(e)||e.length>4)return!1;let t=new Set;for(let r of e){if(!go(r)||!xo.test(r.id)||!Io(r.label))return!1;if(r.disabled!==void 0&&r.disabled!==!0&&r.disabled!==!1)return!1;if(t.has(r.id))return!1;if(t.add(r.id),r.kind==="button"){if(!At(r,["kind","id","label","disabled"]))return!1;continue}if(r.kind!=="select"||!At(r,["kind","id","label","value","options","disabled"]))return!1;if(!bo(r.value)||!Array.isArray(r.options)||r.options.length<1||r.options.length>16)return!1;let i=new Set;for(let a of r.options){if(!go(a)||!At(a,["value","label"])||!bo(a.value)||!Io(a.label)||i.has(a.value))return!1;i.add(a.value)}if(!i.has(r.value))return!1}return!0};var vo=["{id}","{segment}","{segments+}"];var fr=new Set(vo);var yo=["turn-finished","turn-failed","permission-asked","question-asked","turn-started","session-created","session-archived","session-deleted"];var Or=new Set(yo);var $e=20000000,Ve=256;var Ot=(e)=>("bytes"in e)?e.bytes.byteLength:e.content.length,ko=(e,t)=>{if(e.path!==t.path||e.readOnly!==t.readOnly)return!1;if(e.encoding==="text"||t.encoding==="text")return e.encoding==="text"&&t.encoding==="text"&&e.content===t.content;if(e.bytes.byteLength!==t.bytes.byteLength)return!1;for(let r=0;r<e.bytes.byteLength;r+=1)if(e.bytes[r]!==t.bytes[r])return!1;return!0};var Mo=/^[A-Za-z0-9_-]{1,80}$/;var Uo=["left","right","top","bottom"];var No=(e,t=0,r={remaining:16000})=>{if(--r.remaining<0||t>=32)return!1;if(e===null)return!0;let i=Array.isArray(e)?e:Object(e)===e?Object.values(e):[];for(let a of i)if(!No(a,t+1,r))return!1;return!0},ht=(e)=>{if(e===null||e===!0||e===!1)return!0;if(Array.isArray(e))return Object.keys(e).every((t)=>/^(0|[1-9]\d*)$/.test(t)&&Number(t)<e.length)&&e.every(ht);if(Object(e)===e){let t=Object.getPrototypeOf(e);return(t===null||t===Object.prototype)&&Object.values(e).every(ht)}return String(e)===e||Number.isFinite(e)},mt=(e)=>{try{if(String(e.id)!==e.id||!Mo.test(e.id)||!Number.isFinite(e.anchor.x)||Math.abs(e.anchor.x)>1e5||!Number.isFinite(e.anchor.y)||Math.abs(e.anchor.y)>1e5||!Number.isFinite(e.anchor.width)||!Number.isFinite(e.anchor.height)||e.anchor.width<=0||e.anchor.height<=0||e.anchor.width>1e5||e.anchor.height>1e5||!Number.isInteger(e.width)||e.width<160||e.width>640||!Number.isInteger(e.height)||e.height<48||e.height>480||e.side!==void 0&&!Uo.includes(e.side)||e.focus!==void 0&&e.focus!==!0&&e.focus!==!1||!No(e.data)||!ht(e.data))return!1;return JSON.stringify(e.data).length<=16000}catch{return!1}};var gt=2000;var wo=["file","directory","other","missing"],It=(e)=>Boolean(e&&"sessionId"in e),bt=(e)=>Boolean(e&&"sent"in e&&!("sessionId"in e));var Lo=/^[0-9a-f]{7,64}$/i,xt=(e)=>Lo.test(e),He=500,Xe=32000,Do=16000,Go=128,$o=200,Vo=2000,Ho=16000,Xo=80,Bo=200,Fo=16000;var Wo=2000;var Ct=20000,Be=1024,Fe=2000000;var We=64000,Ke=8000,vt=4000;var yt=960000;var Ko=999,jo=1e4,ye=500,zo=["HOST_UNAVAILABLE","HOST_TIMEOUT","HOST_REJECTED","DISCONNECTED","DISABLED","BAD_PATH","NO_INTEGRATION","NO_SERVICE","SERVICE_FAILED","REQUEST_FAILED","RESPONSE_TOO_LARGE","NO_SESSION","SESSION_BUSY","NOT_GRANTED","NO_DIRECTORY","NOT_FOUND","FILE_TOO_LARGE","DENIED","NO_MODEL","MODEL_FAILED","UNSUPPORTED"],qo=["stopped","starting","ready","failed"],Pn=new Set(zo),Qo=(e)=>Pn.has(e),Yo=(e)=>e&&Qo(e)?e:"HOST_REJECTED",Te=(e)=>{if(e===void 0)return!1;if(e===null||e===!0||e===!1)return!0;if(String(e)===e)return!0;if(Number(e)===e)return Number.isFinite(e);if(Array.isArray(e))return e.every(Te);if(Object(e)===e)return Object.values(e).every(Te);return!1},Jo=(e)=>Te(e)&&JSON.stringify(e).length<=Fo,Po=(e)=>e?.trim().slice(0,Bo)??"",fe=(e)=>{let t=e.id.trim().slice(0,Go),r=e.title.trim().slice(0,$o),i=e.url.trim().slice(0,Vo),a=e.text?.trim().slice(0,Ho),c=e.author?.trim().slice(0,Xo),h=e.kind==="pull"?"pull":"issue",m={providerId:e.providerId.trim(),id:t,title:r||t,url:i,kind:h};if(a)m.text=a;if(c)m.author=c;if(h==="pull"){let y=Po(e.branches?.head),G=Po(e.branches?.base);if(y&&G)m.branches={head:y,base:G}}if(Jo(e.data))m.data=e.data;return m},kt=(e)=>{let t=fe(e);if(e.projectId)t.projectId=e.projectId;if(e.navigation)t.navigation=e.navigation;if(e.worktree)t.worktree=e.worktree;return t},Mt=(e)=>{let t={text:e.text.trim().slice(0,Do)};if(e.send)t.send=!0;return t},Ut=(e)=>{if(e===null||!Number.isFinite(e))return null;return Math.min(Ko,Math.max(0,Math.round(e)))},Nt=(e)=>{if(!Number.isFinite(e))return 0;return Math.min(jo,Math.max(0,Math.ceil(e)))};var Ae=(e)=>e.length>0&&e.length<=Be&&!e.includes("\x00")&&!e.includes("\\");var je=(e)=>{if(!e.startsWith("/")||e.includes("\x00")||e.includes("\\")||e.includes("://"))return!1;if(e.length>Wo)return!1;return!e.split("/").some((r)=>r==="."||r==="..")},wn=new Set(qo),Pt=(e)=>Boolean(e&&"status"in e&&wn.has(String(e.status))&&!("body"in e)),ze=(e)=>Boolean(e&&"status"in e&&"body"in e&&Number.isInteger(e.status)),wt=(e)=>Boolean(e&&"content"in e&&String(e.content)===e.content),Lt=(e)=>Boolean(e&&"written"in e&&e.written===!0),Dt=(e)=>Boolean(e&&"entries"in e&&Array.isArray(e.entries)),Ln=new Set(wo),Gt=(e)=>Boolean(e&&"kind"in e&&"size"in e&&Ln.has(String(e.kind))&&Number.isFinite(e.size)),$t=(e)=>Boolean(e&&"text"in e&&String(e.text)===e.text&&!("status"in e)),Dn=new Set(["workspace","shells","ready","directory","session","connection","settings","session-lifecycle","item","resolve","action","service-event","status-control-event","popover-closed","file-open","file-snapshot","file-saved","generate-late","microphone-audio","microphone-ended"]),Gn=(e)=>Object(e)===e?e:null,Rt=(e)=>String(e)===e&&e.length>0,$n=(e)=>{if(!Rt(e.id))return null;if(e.ok===!0){let t={channel:S,v:T,type:"result",id:e.id,ok:!0};if(Object(e.payload)===e.payload)t.payload=e.payload;return t}if(e.ok===!1&&Rt(e.error))return{channel:S,v:T,type:"result",id:e.id,ok:!1,error:e.error,code:Yo(Rt(e.code)?e.code:void 0)};return null},Vt=(e)=>{let t=Gn(e);if(!t||t.channel!==S||t.v!==T)return null;if(t.type==="result")return $n(t);if(!Dn.has(String(t.type))||Object(t.payload)!==t.payload)return null;return t};var Zo=(e)=>("key"in e)&&("metaKey"in e)&&("ctrlKey"in e),Vn=(e)=>(e.metaKey||e.ctrlKey)&&!e.altKey&&!e.shiftKey&&e.key.toLowerCase()==="s";class p extends Error{code;constructor(e,t){super(t);this.name="HostRequestError",this.code=e}}var en=()=>Promise.reject(new p("BAD_PATH",'Request path must start with "/" and stay on the declared origin.')),qe=()=>Promise.reject(new p("BAD_PATH",`File path must be 1 to ${Be} characters without NUL or backslash.`)),Qe=(e)=>{if(e===void 0)return;if(Object(e)!==e||Array.isArray(e)||e.scope!==void 0&&e.scope!=="instance"&&e.scope!=="device")throw new p("HOST_REJECTED",'Storage scope must be "instance" or "device".');return e.scope==="device"?"device":void 0},E=(e)=>(e.value+=1,`oc-${e.value}`),Ht=(e={})=>{let t=e.target??("window"in globalThis?window:null);if(!t)throw new p("HOST_UNAVAILABLE","No window. connectHost runs in a browser frame.");let r=e.acceptSource??((o)=>o===t.parent),i=e.requestTimeoutMs??Ct,a=new Set,c=new Set,h=new Set,m=new Set,y=new Set,G=new Set,K=new Set,te=new Set,ae=new Set,ce=new Set,oe=new Set,z=new Set,de=[],X=null,ne=null,le=new Set,pe=new Set,f=null,q=null,at=!1,ue=new Map,_e=new Map,Ee=new Map,F=!1,_={value:0},u=null,Q=null,Ce=!1,ve=!1,co=null,V=null,lo=(o)=>{if(!o)return null;return{sessionId:o.id,phase:o.busy?"started":"completed"}},N=(o)=>{t.parent.postMessage(o,"*")},po=()=>{if(F||t.parent===t||z.size===0||u?.features?.lateGenerateResults!==!0)return;N({channel:S,v:T,type:"generate-late-listen"})},R=(o,n)=>{for(let l of o)try{l(n)}catch(d){console.error(d)}},uo=(o)=>{if(!(o instanceof MessageEvent))return;if(!r(o.source))return;let n=Vt(o.data);if(!n)return;if(n.type==="workspace"){let d=_e.get(n.payload.subscriptionId);if(d)R([d],n.payload.snapshot);return}if(n.type==="shells"){let d=Ee.get(n.payload.subscriptionId);if(d)R([d],n.payload.snapshot);return}if(n.type==="microphone-audio"){V?.queue.push(n.payload.samples);return}if(n.type==="microphone-ended"){let d=V;if(!d)return;V=null,d.release(),R(d.endedListeners,n.payload.reason);return}if(n.type==="ready"){if(u=n.payload,Q=lo(n.payload.session),R(a,n.payload),R(c,n.payload.directory),R(h,n.payload.session),Q)R(m,Q);if(R(y,n.payload.connection),R(G,n.payload.settings),R(K,n.payload.item),n.payload.block)R(te,n.payload.block);po();return}if(n.type==="service-event"){R(ae,n.payload);return}if(n.type==="generate-late"){if(z.size===0)de.push(n.payload);else R(z,n.payload);return}if(n.type==="directory"){if(u)u={...u,directory:n.payload.directory};R(c,n.payload.directory);return}if(n.type==="session"){if(u)u={...u,session:n.payload.session};if(!n.payload.session)Q=null;else if(Q?.sessionId!==n.payload.session.id)Q=lo(n.payload.session);R(h,n.payload.session);return}if(n.type==="session-lifecycle"){Q=n.payload,R(m,n.payload);return}if(n.type==="connection"){if(u)u={...u,connection:n.payload.connection};R(y,n.payload.connection);return}if(n.type==="settings"){if(u)u={...u,settings:n.payload.settings};R(G,n.payload.settings);return}if(n.type==="item"){if(u)u={...u,item:n.payload.item};R(K,n.payload.item);return}if(n.type==="status-control-event"){R(ce,n.payload);return}if(n.type==="popover-closed"){R(oe,n.payload);return}if(n.type==="action"){let d=(O)=>{if(!F)N({channel:S,v:T,type:"action-result",id:n.id,payload:O})},A=ne;if(!A){d({ok:!1,error:"This extension does not handle background actions."});return}Promise.resolve().then(()=>A(n.payload)).then(()=>d({ok:!0}),(O)=>{let g=(O instanceof Error?O.message:String(O)).trim();d({ok:!1,error:(g||"Action failed.").slice(0,ye)})});return}if(n.type==="file-open"){let d=n.payload;if(q&&ko(q,d))return;q=d,R(le,n.payload);return}if(n.type==="file-saved"){R(pe,n.payload.version);return}if(n.type==="file-snapshot"){let d=(g)=>{if(!F)N({channel:S,v:T,type:"file-snapshot-result",id:n.id,payload:g})},A=(g)=>d({error:(g.trim()||"Could not read the edited file.").slice(0,ye)}),O=f;if(!O){A("This extension does not edit files.");return}Promise.resolve().then(()=>O(n.payload.purpose)).then((g)=>{if(Ot(g)>$e){A(`The file is over ${$e} ${"bytes"in g?"bytes":"characters"}.`);return}if(g.version.length>Ve){A(`The snapshot version is over ${Ve} characters.`);return}d({snapshot:"bytes"in g?{bytes:g.bytes,version:g.version}:{content:g.content,version:g.version}})},(g)=>A(g instanceof Error?g.message:String(g)));return}if(n.type==="resolve"){let d=(O)=>{N({channel:S,v:T,type:"resolve-result",id:n.id,payload:O})},A=X;if(!A){d({error:"This extension does not resolve commands."});return}Promise.resolve().then(()=>A(n.payload)).then((O)=>d({item:O?fe(O):null}),(O)=>{let g=(O instanceof Error?O.message:String(O)).trim();d({error:(g||"Command failed.").slice(0,ye)})});return}let l=ue.get(n.id);if(!l)return;if(clearTimeout(l.timer),ue.delete(n.id),n.ok){l.resolve(n.payload);return}l.reject(new p(n.code,n.error))};t.addEventListener("message",uo),N({channel:S,v:T,type:"hello"});let k=(o,n=i)=>{if(F||t.parent===t)return Promise.reject(new p("HOST_UNAVAILABLE","No host frame. This page is not in an iframe."));return new Promise((l,d)=>{let A=setTimeout(()=>{ue.delete(o.id),d(new p("HOST_TIMEOUT","Host did not answer in time."))},n);ue.set(o.id,{resolve:l,reject:d,timer:A}),N(o)})},v=(o)=>k(o).then(()=>{return}),b={channel:S,v:T},ct=(o)=>{if(!F&&t.parent!==t)N(o)},_o=()=>ct({...b,type:"file-save"}),dt=()=>{if(!F&&t.parent!==t)N({...b,type:"microphone-close",id:E(_)})},kn=async()=>{if(V)throw new p("HOST_REJECTED","The microphone is already open in this frame.");if(u?.features?.microphone!==!0)throw new p("UNSUPPORTED","This OpenChamber cannot share the microphone with extensions.");let o=globalThis.AudioContext;if(typeof o!=="function")throw new p("UNSUPPORTED","This frame has no Web Audio.");let n=new o;if(n.sampleRate<St||n.sampleRate>Tt)throw n.close().catch(()=>{return}),new p("UNSUPPORTED",`Audio at ${n.sampleRate} Hz is not supported.`);let l=n.state==="suspended"?n.resume().catch(()=>{return}):void 0,d=Ro(Math.round(n.sampleRate/4)),A=n.createScriptProcessor(1024,1,1);A.onaudioprocess=(B)=>d.pull(B.outputBuffer.getChannelData(0));let O=n.createMediaStreamDestination();A.connect(O);let g=new Set,Se={queue:d,endedListeners:g,release:()=>{A.onaudioprocess=null,A.disconnect(),d.clear();for(let B of O.stream.getTracks())B.stop();n.close().catch(()=>{return})}};V=Se;try{let B=await k({...b,type:"microphone-open",id:E(_),payload:{sampleRate:n.sampleRate}},ft);if(!B||!("opened"in B)||B.opened!==!0)throw new p("HOST_REJECTED","Host did not open the microphone.");if(await l,V!==Se)throw new p("DISCONNECTED","The microphone closed while it was opening.")}catch(B){if(V===Se)V=null;throw Se.release(),dt(),B}return{stream:O.stream,close:()=>{if(V!==Se)return;V=null,Se.release(),dt()},onEnded:(B)=>(g.add(B),()=>{g.delete(B)})}},Eo=(o)=>{if(!Zo(o)||!Vn(o))return;o.preventDefault(),_o()},So=(o)=>{if(!Zo(o)||o.key!=="Escape"||u?.surface!=="popover"||!u.popover)return;o.preventDefault(),Oo(u.popover.id,"escape").catch(()=>{return})},Pe=()=>{let o=u?.surface==="popover"?u.popover:void 0;if(!o)return;let n=Ce||ve;if(co===n)return;co=n,ho(o.id,n).catch(()=>{return})},we=()=>{if(u?.surface!=="popover"||Ce)return;Ce=!0,Pe()},To=(o)=>{if(u?.surface!=="popover"||o.relatedTarget!==null||!Ce)return;Ce=!1,Pe()},fo=()=>{if(u?.surface!=="popover"||ve)return;ve=!0,Pe()},Ao=()=>{if(u?.surface!=="popover"||!ve)return;ve=!1,Pe()},W=(o,n=1024)=>{if(!o.trim()||o.length>n)throw new p("HOST_REJECTED",`Identity must contain 1 to ${n} characters.`)},lt=async(o)=>{if(o.kind!=="projects")W(o.projectId);let n=await k({...b,type:"workspace-read",id:E(_),payload:o});if(!n||!("kind"in n)||!("state"in n)||n.kind!==o.kind)throw new p("HOST_REJECTED","Host did not return workspace data.");return n},pt=async(o,n)=>{if(o.kind!=="projects")W(o.projectId);let l=E(_);_e.set(l,n);try{await v({...b,type:"workspace-subscribe",id:E(_),payload:{subscriptionId:l,query:o}})}catch(d){if(_e.delete(l),!F)N({...b,type:"workspace-unsubscribe",id:E(_),payload:{subscriptionId:l}});throw d}return()=>{if(!_e.delete(l)||F)return;N({...b,type:"workspace-unsubscribe",id:E(_),payload:{subscriptionId:l}})}},Mn=async(o,n)=>{if(o.kind==="session")W(o.sessionId);if(o.kind==="project")W(o.projectId);let l=E(_);Ee.set(l,n);try{await v({...b,type:"shells-subscribe",id:E(_),payload:{subscriptionId:l,scope:o}})}catch(d){if(Ee.delete(l),!F)N({...b,type:"shells-unsubscribe",id:E(_),payload:{subscriptionId:l}});throw d}return()=>{if(!Ee.delete(l)||F)return;N({...b,type:"shells-unsubscribe",id:E(_),payload:{subscriptionId:l}})}},Le=async(o)=>{if("key"in o&&(o.key.length===0||o.key.length>_t))throw new p("HOST_REJECTED","Storage key must contain 1 to 128 characters.");if(o.op==="set"&&!Te(o.value))throw new p("HOST_REJECTED","Storage values must be JSON.");if(o.op==="set"&&new TextEncoder().encode(JSON.stringify(o.value)).length>Et)throw new p("HOST_REJECTED","Storage value exceeds 64 KiB.");if(o.scope==="device"&&u?.features?.deviceStorage!==!0)throw new p("UNSUPPORTED","This host does not support device storage.");let n=await k({...b,type:"storage",id:E(_),payload:o});if(!n||!("storage"in n)||n.op!==o.op)throw new p("HOST_REJECTED","Host did not return storage data.");return n},Oo=(o,n)=>u?.features?.popovers!==!0&&!(u?.surface==="popover"&&u.popover?.id===o)?Promise.reject(new p("UNSUPPORTED","This host does not support popovers.")):v({...b,type:"popover-close",id:E(_),payload:n?{id:o,reason:n}:{id:o}}),ho=(o,n)=>u?.features?.popovers!==!0&&!(u?.surface==="popover"&&u.popover?.id===o)?Promise.reject(new p("UNSUPPORTED","This host does not support popovers.")):v({...b,type:"popover-anchor",id:E(_),payload:{id:o,active:n}});return t.addEventListener("keydown",So,!0),t.addEventListener("pointerover",we),t.addEventListener("pointermove",we),t.addEventListener("pointerout",To),t.addEventListener("focus",fo),t.addEventListener("blur",Ao),{onAction:(o)=>(ne=o,()=>{if(ne===o)ne=null}),listProjects:async()=>{let o=await lt({kind:"projects"});if(o.kind!=="projects")throw new p("HOST_REJECTED","Expected projects.");return o},listWorktrees:async(o)=>{let n=await lt({kind:"worktrees",projectId:o});if(n.kind!=="worktrees")throw new p("HOST_REJECTED","Expected worktrees.");return n},listSessions:async(o)=>{let n=await lt({kind:"sessions",projectId:o});if(n.kind!=="sessions")throw new p("HOST_REJECTED","Expected sessions.");return n},onProjects:(o)=>pt({kind:"projects"},(n)=>{if(n.kind==="projects")o(n)}),onWorktrees:(o,n)=>pt({kind:"worktrees",projectId:o},(l)=>{if(l.kind==="worktrees")n(l)}),onSessions:(o,n)=>pt({kind:"sessions",projectId:o},(l)=>{if(l.kind==="sessions")n(l)}),onRunningShells:(o,n)=>Mn(o,n),readShellOutput:async(o,n)=>{W(o,De);let l=n?.cursor;if(l!==void 0&&(!Number.isInteger(l)||l<0))throw new p("HOST_REJECTED","Shell output cursor must be a non-negative integer.");let d=n?.tailBytes;if(d!==void 0&&(!Number.isInteger(d)||d<1||d>Ge))throw new p("HOST_REJECTED",`Shell output tailBytes must be an integer between 1 and ${Ge}.`);let O=await k({...b,type:"shell-output",id:E(_),payload:{shellId:o,cursor:l,tailBytes:d}});if(!O||typeof O.output!=="string"||!Number.isFinite(O.cursor))throw new p("HOST_REJECTED","Host did not return shell output.");return O},stopShell:async(o)=>{if(W(o,De),(await k({...b,type:"shell-stop",id:E(_),payload:{shellId:o}}))?.stopped!==!0)throw new p("HOST_REJECTED","Host did not stop the shell.");return{stopped:!0}},openSession:async(o)=>{W(o),await v({...b,type:"open-session",id:E(_),payload:{sessionId:o}})},storage:{get:async(o,n)=>{let l=Qe(n),d={op:"get",key:o};if(l)d.scope=l;let A=await Le(d);return A.op==="get"&&A.found?A.value:void 0},set:async(o,n,l)=>{let d=Qe(l),A={op:"set",key:o,value:n};if(d)A.scope=d;await Le(A)},delete:async(o,n)=>{let l=Qe(n),d={op:"delete",key:o};if(l)d.scope=l;await Le(d)},keys:async(o)=>{let n=Qe(o),l={op:"keys"};if(n)l.scope=n;let d=await Le(l);if(d.op!=="keys")throw new p("HOST_REJECTED","Expected storage keys.");return d.keys}},onReady:(o)=>{if(a.add(o),u)o(u);return()=>{a.delete(o)}},onDirectory:(o)=>{if(c.add(o),u)o(u.directory);return()=>{c.delete(o)}},onSession:(o)=>{if(h.add(o),u)o(u.session);return()=>{h.delete(o)}},onSessionLifecycle:(o)=>{if(m.add(o),Q)o(Q);return()=>{m.delete(o)}},onConnection:(o)=>{if(y.add(o),u)o(u.connection);return()=>{y.delete(o)}},onSettings:(o)=>{if(G.add(o),u)o(u.settings);return()=>{G.delete(o)}},onItem:(o)=>{if(K.add(o),u)o(u.item);return()=>{K.delete(o)}},onBlock:(o)=>{if(te.add(o),u?.block)o(u.block);return()=>{te.delete(o)}},onServiceEvent:(o)=>(ae.add(o),()=>{ae.delete(o)}),onStatusControl:(o)=>(ce.add(o),()=>{ce.delete(o)}),onPopoverClosed:(o)=>(oe.add(o),()=>{oe.delete(o)}),setStatusControls:(o)=>{if(u?.features?.statusControls!==!0)return Promise.reject(new p("UNSUPPORTED","This host does not support status controls."));if(!Co(o))return Promise.reject(new p("HOST_REJECTED","Status controls must have unique bounded ids and valid selected options."));return v({...b,type:"status-controls",id:E(_),payload:{controls:o}})},openPopover:(o)=>{if(u?.features?.popovers!==!0)return Promise.reject(new p("UNSUPPORTED","This host does not support popovers."));if(!mt(o))return Promise.reject(new p("HOST_REJECTED","Popover requests need bounded geometry and JSON data."));return v({...b,type:"popover-open",id:E(_),payload:o})},closePopover:Oo,setPopoverAnchorActive:ho,onResolve:(o)=>(X=o,()=>{if(X===o)X=null}),toast:(o)=>{let n=o.message.trim();if(!n||n.length>He)return Promise.reject(new p("HOST_REJECTED",`Toast message must contain 1 to ${He} characters.`));if(o.copy&&o.copy!==!0&&(!o.copy.text.length||o.copy.text.length>Xe))return Promise.reject(new p("HOST_REJECTED",`Toast copy text must contain 1 to ${Xe} characters.`));return v({channel:S,v:T,type:"toast",id:E(_),payload:{...o,message:n}})},openUrl:(o)=>v({channel:S,v:T,type:"open-url",id:E(_),payload:{url:o}}),openCommit:(o)=>xt(o)?v({channel:S,v:T,type:"open-commit",id:E(_),payload:{sha:o}}):Promise.reject(new p("HOST_REJECTED","Commit id must be 7 to 64 hex characters.")),answerBlock:(o)=>v({channel:S,v:T,type:"block-answer",id:E(_),payload:{text:o.trim().slice(0,gt)}}),openSurface:(o)=>v({channel:S,v:T,type:"open-surface",id:E(_),payload:{surfaceId:o}}),writeClipboard:(o)=>v({channel:S,v:T,type:"clipboard-write",id:E(_),payload:{text:o}}),compose:(o)=>v({channel:S,v:T,type:"compose",id:E(_),payload:o}),attach:(o)=>v({channel:S,v:T,type:"attach",id:E(_),payload:fe(o)}),startSession:async(o)=>{if(o.projectId!==void 0)W(o.projectId);let n=o.worktree;if(n&&n!==!0)if(n.kind==="existing")W(n.directory);else{if(n.name!==void 0)W(n.name,200);if(n.baseBranch!==void 0)W(n.baseBranch,200)}let l=await k({channel:S,v:T,type:"start-session",id:E(_),payload:kt(o)},e.requestTimeoutMs??180000);if(!It(l))throw new p("HOST_REJECTED","Host did not return a session.");return l},prompt:(o)=>k({channel:S,v:T,type:"prompt",id:E(_),payload:Mt(o)}).then((n)=>{if(!bt(n))throw new p("HOST_REJECTED","Host did not return a prompt result.");return n}),sessionLink:(o)=>v({channel:S,v:T,type:"session-link",id:E(_),payload:fe(o)}),close:()=>v({channel:S,v:T,type:"close",id:E(_)}),oauthStart:()=>v({channel:S,v:T,type:"oauth-start",id:E(_)}),oauthDisconnect:()=>v({channel:S,v:T,type:"oauth-disconnect",id:E(_)}),request:(o)=>(je(o.path)?k({channel:S,v:T,type:"request",id:E(_),payload:o}):en()).then((n)=>{if(!ze(n))throw new p("HOST_REJECTED","Host request result was empty.");return n}),serviceRequest:(o)=>(je(o.path)?k({channel:S,v:T,type:"service-request",id:E(_),payload:o}):en()).then((n)=>{if(!ze(n))throw new p("HOST_REJECTED","Host service request result was empty.");return n}),serviceStatus:()=>k({channel:S,v:T,type:"service-status",id:E(_)}).then((o)=>{if(!Pt(o))throw new p("HOST_REJECTED","Host did not return service status.");return o}),readFile:(o)=>(Ae(o)?k({channel:S,v:T,type:"file-read",id:E(_),payload:{path:o}}):qe()).then((n)=>{if(!wt(n))throw new p("HOST_REJECTED","Host did not return file content.");return n}),writeFile:(o,n)=>{if(!Ae(o))return qe();if(n.length>Fe)return Promise.reject(new p("FILE_TOO_LARGE",`Content is over ${Fe} characters.`));return k({channel:S,v:T,type:"file-write",id:E(_),payload:{path:o,content:n}}).then((l)=>{if(!Lt(l))throw new p("HOST_REJECTED","Host did not confirm the write.");return l})},listDir:(o)=>(Ae(o)?k({channel:S,v:T,type:"file-list",id:E(_),payload:{path:o}}):qe()).then((n)=>{if(!Dt(n))throw new p("HOST_REJECTED","Host did not return directory entries.");return n}),stat:(o)=>(Ae(o)?k({channel:S,v:T,type:"file-stat",id:E(_),payload:{path:o}}):qe()).then((n)=>{if(!Gt(n))throw new p("HOST_REJECTED","Host did not return file status.");return n}),generate:(o)=>{let n=o.prompt.trim(),l=o.system?.trim();if(n.length===0||n.length>We)return Promise.reject(new p("HOST_REJECTED",`Prompt must be 1 to ${We} characters.`));if(l!==void 0&&(l.length===0||l.length>Ke))return Promise.reject(new p("HOST_REJECTED",`System prompt must be 1 to ${Ke} characters.`));let d=o.maxOutputTokens===void 0?void 0:Math.min(vt,Math.max(1,Math.floor(o.maxOutputTokens)));if(d!==void 0&&!Number.isFinite(d))return Promise.reject(new p("HOST_REJECTED","maxOutputTokens must be a number."));let A={prompt:n};if(l!==void 0)A.system=l;if(d!==void 0)A.maxOutputTokens=d;return k({channel:S,v:T,type:"generate",id:E(_),payload:A},e.requestTimeoutMs??yt).then((O)=>{if(!$t(O))throw new p("HOST_REJECTED","Host did not return generated text.");return O})},onLateGenerateResult:(o)=>{z.add(o);for(let n of de.splice(0))R([o],n);return po(),()=>{z.delete(o)}},openMicrophone:kn,setBadge:(o)=>v({channel:S,v:T,type:"badge",id:E(_),payload:{count:Ut(o)}}),setHeight:(o)=>v({channel:S,v:T,type:"resize",id:E(_),payload:{height:Nt(o)}}),onFileOpen:(o)=>{if(le.add(o),!at)at=!0,t.addEventListener("keydown",Eo,!0);if(q)o(q);return()=>{le.delete(o)}},onFileSnapshot:(o)=>(f=o,()=>{if(f===o)f=null}),onFileSaved:(o)=>(pe.add(o),()=>{pe.delete(o)}),reportFileChange:(o)=>ct({...b,type:"file-change",payload:{dirty:o.dirty,edited:o.edited}}),requestFileSave:_o,reportFileUnsupported:()=>ct({...b,type:"file-unsupported"}),dispose:()=>{for(let o of _e.keys())N({...b,type:"workspace-unsubscribe",id:E(_),payload:{subscriptionId:o}});_e.clear();for(let o of Ee.keys())N({...b,type:"shells-unsubscribe",id:E(_),payload:{subscriptionId:o}});if(Ee.clear(),V)dt(),V.release(),V=null;if(F=!0,X=null,ne=null,f=null,le.clear(),pe.clear(),at)t.removeEventListener("keydown",Eo,!0);t.removeEventListener("message",uo),t.removeEventListener("keydown",So,!0),t.removeEventListener("pointerover",we),t.removeEventListener("pointermove",we),t.removeEventListener("pointerout",To),t.removeEventListener("focus",fo),t.removeEventListener("blur",Ao);for(let o of ue.values())clearTimeout(o.timer),o.reject(new p("HOST_UNAVAILABLE","Host client was disposed."));ue.clear(),a.clear(),c.clear(),h.clear(),m.clear(),y.clear(),G.clear(),K.clear(),te.clear(),ae.clear(),ce.clear(),oe.clear(),z.clear(),de.length=0}}};var tn=["browser.open","browser.snapshot","browser.click","browser.type","browser.select","browser.scroll","browser.back","browser.forward","browser.inspect","browser.capture","browser.resize","browser.close"];var Lr=new Set(tn);var on=["none","agent","user"];var Gr=new Set(on);var Hn=[["--oc-bg","background"],["--oc-elevated","elevated"],["--oc-fg","foreground"],["--oc-muted","muted"],["--oc-subtle","subtle"],["--oc-border","border"],["--oc-hover","hover"],["--oc-selection","selection"],["--oc-focus","focus"],["--oc-primary","primary"],["--oc-muted-surface","mutedSurface"],["--oc-elevated-fg","elevatedForeground"],["--oc-active","active"],["--oc-selection-fg","selectionForeground"],["--oc-primary-fg","primaryForeground"],["--oc-primary-text","primaryText"],["--oc-success-text","successText"],["--oc-warning-text","warningText"],["--oc-error-text","errorText"],["--oc-info-text","infoText"],["--oc-success","success"],["--oc-warning","warning"],["--oc-error","error"],["--oc-info","info"],["--oc-font","font"],["--oc-mono","mono"],["--oc-radius","radius"],["--surface-background","background"],["--surface-elevated","elevated"],["--surface-foreground","foreground"],["--surface-muted-foreground","muted"],["--surface-subtle","subtle"],["--interactive-border","border"],["--interactive-hover","hover"],["--interactive-selection","selection"],["--interactive-focus-ring","focus"],["--primary","primary"],["--surface-muted","mutedSurface"],["--surface-elevated-foreground","elevatedForeground"],["--interactive-active","active"],["--interactive-selection-foreground","selectionForeground"],["--primary-foreground","primaryForeground"],["--primary-text","primaryText"],["--success-text","successText"],["--warning-text","warningText"],["--error-text","errorText"],["--info-text","infoText"],["--status-success","success"],["--status-warning","warning"],["--status-error","error"],["--status-info","info"],["--font-sans","font"],["--font-mono","mono"],["--radius","radius"]],Xn=[["--oc-syntax-keyword","--syntax-keyword","syntaxKeyword"],["--oc-syntax-string","--syntax-string","syntaxString"],["--oc-syntax-number","--syntax-number","syntaxNumber"],["--oc-syntax-function","--syntax-function","syntaxFunction"],["--oc-syntax-type","--syntax-type","syntaxType"],["--oc-syntax-comment","--syntax-comment","syntaxComment"],["--oc-syntax-variable","--syntax-variable","syntaxVariable"],["--oc-syntax-operator","--syntax-operator","syntaxOperator"]],nn=(e,t)=>{t.style.colorScheme=e.mode;for(let[r,i]of Hn)t.style.setProperty(r,e.tokens[i]);for(let[r,i,a]of Xn){let c=e.tokens[a]??"";t.style.setProperty(r,c),t.style.setProperty(i,c)}t.style.setProperty("font-family",e.tokens.font),t.style.setProperty("font-size",e.tokens.fontSize??"0.875rem"),t.style.setProperty("line-height","1.45"),t.style.setProperty("color",e.tokens.foreground)},Xt=(e,t)=>{if(nn(e.theme,t),t.dataset)t.dataset.ocSurface=e.surface,t.dataset.ocTheme=e.theme.mode};var Bn={"surface-background":"bg","surface-elevated":"elevated","surface-elevated-foreground":"elevated-fg","surface-foreground":"fg","surface-muted-foreground":"muted","surface-muted":"muted-surface","surface-subtle":"subtle","interactive-border":"border","interactive-hover":"hover","interactive-active":"active","interactive-selection":"selection","interactive-selection-foreground":"selection-fg","interactive-focus-ring":"focus",primary:"primary","primary-foreground":"primary-fg","primary-text":"primary-text","success-text":"success-text","warning-text":"warning-text","error-text":"error-text","info-text":"info-text","status-success":"success","status-warning":"warning","status-error":"error","status-info":"info","font-sans":"font","font-mono":"mono",radius:"radius"},I=(e,t)=>`var(--${e}, var(--oc-${Bn[e]}, ${t}))`,J=I("surface-background","transparent"),Je=I("surface-elevated","transparent"),Oe=I("surface-elevated-foreground","inherit"),H=I("surface-foreground","inherit"),x=I("surface-muted-foreground","gray"),Fn=I("surface-muted","transparent"),re=I("interactive-border","currentColor"),P=I("interactive-hover","transparent"),se=I("interactive-active","transparent"),Bt=I("interactive-selection","transparent"),Ft=I("interactive-selection-foreground","inherit"),Y=I("primary","currentColor"),Wt=I("primary-text","inherit"),Kt=I("error-text","inherit"),Wn=I("font-sans","inherit"),jt=I("font-mono","monospace"),cn=I("radius","9px"),zt=`calc(${cn} - 2px)`,rn=`calc(${cn} - 4px)`,C=(e,t,r="transparent")=>`color-mix(in srgb, ${e} ${t}%, ${r})`,sn=`background-image: linear-gradient(${P}, ${P});`,qt=(e,t="0.5px")=>`box-shadow: inset 0 0 0 ${t} ${e}, var(--oc-sdk-field-lift);`,Qt="border-color: var(--oc-sdk-edge); box-shadow: var(--oc-sdk-raised-lift);",an="box-shadow: var(--oc-sdk-lit);",Yt=`inset 0 0.5px 0 0 ${C(H,8)}, 0 1px 2px 0 rgb(0 0 0 / 0.4)`,Kn=`
:root {
  --oc-sdk-edge: ${C(H,16)};
  --oc-sdk-field-bg: ${Je};
  --oc-sdk-raised-bg: ${J};
  --oc-sdk-field-lift: inset 0 1px 2px 0 rgb(0 0 0 / 0.04);
  --oc-sdk-raised-lift: 0 1px 1.5px 0 rgb(0 0 0 / 0.08);
  --oc-sdk-lit: inset 0 1px 0 0 rgb(255 255 255 / 0.2), 0 1px 1.5px 0 rgb(0 0 0 / 0.1);
  --oc-sdk-float-edge: rgb(0 0 0 / 0.14);
  --oc-sdk-float: inset 0 1px 0 0 rgb(255 255 255 / 0.7), 0 1px 2px -0.5px rgb(0 0 0 / 0.06), 0 4px 8px -2px rgb(0 0 0 / 0.08), 0 12px 20px -4px rgb(0 0 0 / 0.06);
}
:root[data-oc-theme="dark"] {
  --oc-sdk-edge: ${C(H,14)};
  --oc-sdk-field-bg: ${C(J,50,Je)};
  --oc-sdk-raised-bg: ${Je};
  --oc-sdk-field-lift: ${Yt};
  --oc-sdk-raised-lift: ${Yt};
  --oc-sdk-lit: ${Yt};
  --oc-sdk-float-edge: rgb(0 0 0 / 0.55);
  --oc-sdk-float: inset 0 1px 0 0 rgb(255 255 255 / 0.04), inset 0 0 0 0.5px rgb(255 255 255 / 0.08), 0 8px 16px 0 rgb(0 0 0 / 0.25), 0 4px 8px 0 rgb(0 0 0 / 0.25);
}`,Ye=(e)=>{let t=I(`status-${e}`,"currentColor");return`
.oc-sdk[data-tone="${e}"], .oc-sdk [data-tone="${e}"] { --oc-sdk-tone: ${t}; --oc-sdk-tone-text: ${I(`${e}-text`,"inherit")}; }`},s=(e)=>`calc(${e}rem / 14)`,jn=`
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
`,dn=`${Kn}
.oc-sdk { color: ${H}; font-family: ${Wn}; }
.oc-sdk :focus-visible, .oc-sdk:focus-visible { outline: none; }
.oc-sdk :where(button, a[href], [role="button"], [role="tab"], [role="option"]):focus-visible, button.oc-sdk:focus-visible { ${sn} }
.oc-sdk-mono { font-family: ${jt}; }
.oc-sdk-muted { color: ${x}; }
${Ye("success")}${Ye("warning")}${Ye("error")}${Ye("info")}
.oc-sdk[data-tone="primary"], .oc-sdk [data-tone="primary"] { --oc-sdk-tone: ${Y}; --oc-sdk-tone-text: ${Wt}; }

.oc-sdk-btn { border-radius: ${zt}; transition: background 150ms ease-out, color 150ms ease-out; }
.oc-sdk-btn[data-size="xs"] { border-radius: ${rn}; }
.oc-sdk-btn[data-variant="default"] { color: ${Wt}; background: ${C(Y,10,J)}; border-color: ${C(Y,12)}; ${an} }
.oc-sdk-btn[data-variant="default"]:hover { background: ${C(Y,16,J)}; }
.oc-sdk-btn[data-variant="default"]:active { background: ${C(Y,22,J)}; box-shadow: none; }
.oc-sdk-btn[data-variant="secondary"] { background: ${Fn}; color: var(--oc-fg); }
.oc-sdk-btn[data-variant="secondary"]:hover { background-image: linear-gradient(${P}, ${P}); }
.oc-sdk-btn[data-variant="secondary"]:active { background-image: linear-gradient(${se}, ${se}); }
.oc-sdk-btn[data-variant="outline"] { background: var(--oc-sdk-raised-bg); color: ${Oe}; ${Qt} }
.oc-sdk-btn[data-variant="outline"]:hover { background-image: linear-gradient(${P}, ${P}); }
.oc-sdk-btn[data-variant="outline"]:active { background-image: linear-gradient(${se}, ${se}); box-shadow: none; }
.oc-sdk-btn[data-variant="ghost"] { background: transparent; }
.oc-sdk-btn[data-variant="ghost"]:hover { background: ${P}; }
.oc-sdk-btn[data-variant="ghost"]:active { background: ${se}; }
.oc-sdk-btn[data-variant="destructive"] { --oc-sdk-tone: ${I("status-error","red")}; color: ${Kt}; background: ${C("var(--oc-sdk-tone)",7,J)}; border-color: ${C("var(--oc-sdk-tone)",12)}; ${an} }
.oc-sdk-btn[data-variant="destructive"]:hover { background: ${C("var(--oc-sdk-tone)",9,J)}; }
.oc-sdk-btn[data-variant="destructive"]:active { background: ${C("var(--oc-sdk-tone)",11,J)}; box-shadow: none; }

.oc-sdk-field-note { color: ${x}; }
.oc-sdk-field[data-invalid="true"] .oc-sdk-field-note { color: ${Kt}; }
.oc-sdk-input { border-radius: ${zt}; background: var(--oc-sdk-field-bg); color: ${Oe}; ${qt("var(--oc-sdk-edge)")} transition: background 150ms ease-out; }
.oc-sdk-input::placeholder { color: ${x}; }
.oc-sdk-input:hover:not(:focus) { background-image: linear-gradient(${P}, ${P}); }
.oc-sdk-input:focus, .oc-sdk-input:focus-visible { ${qt(C(H,26),"1px")} }
.oc-sdk-field[data-invalid="true"] .oc-sdk-input, .oc-sdk-field[data-invalid="true"] .oc-sdk-input:focus { ${qt(I("status-error","red"),"1px")} }
.oc-sdk-input[data-mono="true"] { font-family: ${jt}; }

.oc-sdk-search-icon { color: ${x}; }
.oc-sdk-search[data-active="true"] .oc-sdk-search-icon { color: ${Y}; }
.oc-sdk-search-clear { border-radius: ${rn}; color: ${x}; }
.oc-sdk-search-clear:hover { background: ${P}; color: ${H}; }

.oc-sdk-trigger { border-radius: ${zt}; background: var(--oc-sdk-raised-bg); color: ${Oe}; ${Qt} transition: background 150ms ease-out; }
.oc-sdk-trigger:hover { background-image: linear-gradient(${P}, ${P}); }
.oc-sdk-trigger[aria-expanded="true"] { background-image: linear-gradient(${se}, ${se}); }
.oc-sdk-trigger-value[data-empty="true"] { color: ${x}; }
.oc-sdk-trigger-chevron { color: ${x}; }
/* The app's floating level: the glass edge (a hairline ring and a lit top line, dark outside and light inside in dark themes) over soft shadows. The outer ring is the border, over the page like the app's. */
.oc-sdk-popup { --surface-foreground: ${Oe}; border-color: var(--oc-sdk-float-edge); border-radius: 12px; background: ${Je}; background-clip: padding-box; color: ${Oe}; box-shadow: var(--oc-sdk-float); }
.oc-sdk-option { border-radius: 8px; }
.oc-sdk-option[data-active="true"] { background: ${P}; }
/* A selected option shows a check mark in the text colour, like the app's own pickers. Options without the mark come
   from bundles built before it existed and keep the selection fill as their only sign of the choice. */
.oc-sdk-option[aria-selected="true"]:not([data-mark]) { background: ${Bt}; color: ${Ft}; }
.oc-sdk-option-check { color: ${H}; }
.oc-sdk-option[data-destructive="true"] { color: ${Kt}; }
.oc-sdk-option[data-destructive="true"][data-active="true"] { background: ${C(I("status-error","red"),10)}; }
.oc-sdk-option-hint { color: ${x}; }
.oc-sdk-popup-empty { color: ${x}; }

/* Checked stays neutral: the mark carries the state, and the primary colour stays with primary actions. */
.oc-sdk-check-box { border-color: ${re}; border-radius: 4px; color: ${H}; transition: border-color 150ms ease-out; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-box { border-color: ${C(H,60,re)}; }
.oc-sdk-check-thumb { border-radius: 9999px; background: ${re}; transition: background 150ms ease-out; }
.oc-sdk-check-thumb::after { border-radius: 9999px; background: ${J}; transition: transform 150ms ease-out; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-thumb { background: ${Y}; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-thumb::after { transform: translateX(var(--oc-sdk-thumb-travel, 16px)); }
.oc-sdk-check:focus-visible { box-shadow: none; }
.oc-sdk-check:focus-visible .oc-sdk-check-box, .oc-sdk-check:focus-visible .oc-sdk-check-thumb { ${sn} }
.oc-sdk-check-desc { color: ${x}; }

.oc-sdk-tabs { border-radius: 10px; }
.oc-sdk-tabs[data-track="true"] { background: ${C(H,4)}; box-shadow: inset 0 1px 2px 0 rgb(0 0 0 / 0.16); }
.oc-sdk-tab { border-radius: 8px; color: ${x}; transition: color 150ms ease-out, background 150ms ease-out; }
.oc-sdk-tab:hover { color: ${H}; }
.oc-sdk-tab[aria-selected="true"] { color: ${Ft}; background: ${Bt}; border-color: ${re}; }
.oc-sdk-tabs[data-track="true"] .oc-sdk-tab[aria-selected="true"] { color: ${Oe}; background: var(--oc-sdk-raised-bg); ${Qt} }
.oc-sdk-tab-count { color: ${x}; }

/* The app's neutral badge: a step of the text colour, the same in every theme. */
.oc-sdk-badge { border-radius: 9999px; background: ${C(H,6)}; color: ${x}; }
.oc-sdk-badge[data-tone] { color: var(--oc-sdk-tone-text, var(--oc-sdk-tone)); background: ${C("var(--oc-sdk-tone)",15)}; }

.oc-sdk-row { border-radius: 6px; transition: background 120ms ease-out; }
.oc-sdk-row:hover, .oc-sdk-row[data-active="true"] { background: ${P}; }
.oc-sdk-row[aria-selected="true"] { background: ${Bt}; color: ${Ft}; }
.oc-sdk-row-lead { font-family: ${jt}; color: ${x}; }
.oc-sdk-row-sub { color: ${x}; }
.oc-sdk-row-meta { color: ${x}; }
.oc-sdk-row[aria-selected="true"] .oc-sdk-row-lead, .oc-sdk-row[aria-selected="true"] .oc-sdk-row-sub, .oc-sdk-row[aria-selected="true"] .oc-sdk-row-meta { color: inherit; opacity: .75; }
.oc-sdk-list-empty { color: ${x}; }

.oc-sdk-empty-body { color: ${x}; }

.oc-sdk-spinner { color: ${x}; }
.oc-sdk-spinner-ring { border-color: ${re}; border-top-color: ${Y}; border-radius: 9999px; }

/* Set apart by its tint alone, like the app's banners. */
.oc-sdk-banner { border-color: transparent; border-radius: 8px; background: ${C("var(--oc-sdk-tone)",10)}; }
.oc-sdk-banner-title { color: var(--oc-sdk-tone-text, var(--oc-sdk-tone)); }
.oc-sdk-banner-body { color: ${x}; }

.oc-sdk-separator { color: ${x}; }
.oc-sdk-separator::before, .oc-sdk-separator::after { background: ${C(re,40)}; }

.oc-sdk-progress-label { color: ${x}; }
/* The app's progress: a groove a step of the text colour, green once done. Older bundles mark done only through aria-valuenow. */
.oc-sdk-progress-track { border-radius: 9999px; background: ${C(H,6)}; }
.oc-sdk-progress-fill { border-radius: 9999px; background: var(--oc-sdk-tone, ${Y}); }
.oc-sdk-progress-track[aria-valuenow="100"] > .oc-sdk-progress-fill:not([data-tone]) { background: ${I("status-success","currentColor")}; }
.oc-sdk-progress[data-done="true"] .oc-sdk-progress-value { color: ${I("success-text","inherit")}; }

.oc-sdk-text a { color: ${Wt}; text-decoration: underline; text-underline-offset: 2px; }
.oc-sdk-text img { border-radius: 8px; border: 1px solid ${C(re,60)}; }
`,U=`
${ut}
${jn}
${dn}`;var Me={saved:!1,providers:[],providerOrder:[],windows:{},collapsedProviders:[],collapsedQuota:{},hiddenBalances:[],cutoffPercent:10,resetTime:"relative",quotaDisplay:"remaining",encounteredBridgeProviders:[],initializedBridgeWindows:[],explicitProviderSelections:[],explicitWindowSelections:[]};var Ue=[{id:"openrouter",connectionId:"bridge-openrouter",kind:"openrouter",label:"OpenRouter"},{id:"opencode-go",connectionId:"bridge-opencode-go",kind:"opencode-go",label:"OpenCode Go"},{id:"opencode",connectionId:"bridge-opencode-zen",kind:"opencode-zen",label:"OpenCode Zen"},{id:"openai",connectionId:"bridge-codex",kind:"codex",label:"OpenAI"},{id:"tavily",connectionId:"bridge-tavily",kind:"tavily",label:"Tavily"},{id:"exa",connectionId:"bridge-exa",kind:"exa",label:"Exa"}],L_=Ue.map((e)=>e.id),D_=new Map(Ue.map((e)=>[e.id,e])),G_=Ue.map((e)=>e.connectionId);var nt=(e,t)=>{let r=new Set,i=[];for(let a of t)if(e.includes(a)&&!r.has(a))i.push(a),r.add(a);for(let a of e)if(!r.has(a))i.push(a),r.add(a);return i},Zt=(e,t)=>!e.saved&&!e.explicitProviderSelections.includes(t)||e.providers.includes(t),me=(e,t,r)=>!e.saved&&!e.explicitWindowSelections.includes(t)&&!e.initializedBridgeWindows.includes(t)||(e.windows[t]??[]).includes(r);var ln="The OpenCode plugin is unavailable; showing the last reading.",pn="The OpenCode plugin is not connected. If you just approved the extension, restart OpenCode or OpenChamber.",un="Waiting for the next scheduled refresh.";var Jn=(e)=>e.state==="unconfigured"||e.error?.code==="not_configured",eo=(e)=>{let t=e.error?.message??"";return e.state==="error"&&e.error?.code==="provider_error"&&(t.startsWith("The OpenCode plugin ")||t===pn||t===ln)},to=(e)=>!Jn(e)&&!eo(e)&&e.error?.message!==un,Zn=(e)=>e.error?.code==="auth",rt=(e)=>to(e)&&!Zn(e),oo=(e)=>{let t=e.filter((i)=>typeof i.remainingPercent==="number"&&!i.error),r=new Set(t.map((i)=>Date.parse(i.resetAt??"")).filter(Number.isFinite));return{leastRemaining:t.length>=2,earliestReset:r.size>=2}},ge=(e,t)=>e==="window"&&!/^(?:window:|cap:|balance:|least-remaining$|earliest-reset$)/.test(t)?t:`${e}:${t}`,_n=(e,t)=>{let r=oo(t);if(e==="least-remaining"&&r.leastRemaining)return e;if(e==="earliest-reset"&&r.earliestReset)return e;let i=t.find((a)=>ge("window",a.id)===e)??t.find((a)=>a.id===e)??t.find((a)=>typeof a.remainingPercent==="number"&&!a.error);return i?ge("window",i.id):e};var En=(e,t,r)=>({...e,hiddenBalances:r?[...new Set([...e.hiddenBalances,t])]:e.hiddenBalances.filter((i)=>i!==t)});var Sn=(e,t)=>({...e,cutoffPercent:Number.isFinite(t)?Math.min(100,Math.max(0,t)):Me.cutoffPercent}),Tn=(e,t)=>({...e,resetTime:t}),fn=(e,t)=>({...e,quotaDisplay:t}),An=(e,t,r,i)=>{let a=nt([...i,...e.providerOrder],e.providerOrder),c=a.filter((K)=>i.includes(K)),h=c.indexOf(t),m=c[h+r];if(h<0||m===void 0)return e;let y=a.indexOf(t),G=a.indexOf(m);return[a[y],a[G]]=[a[G],a[y]],{...e,providerOrder:a}},On=(e,t,r)=>({...e,collapsedQuota:{...e.collapsedQuota,[t]:r}}),Re=(e,t)=>JSON.stringify(e)===JSON.stringify(t),hn=(e,t)=>{let r={};if(e.saved!==t.saved)r.saved=t.saved;if(!Re(e.providers,t.providers))r.providers=t.providers;if(!Re(e.providerOrder,t.providerOrder))r.providerOrder=t.providerOrder;if(!Re(e.collapsedQuota,t.collapsedQuota)){let i={};for(let[a,c]of Object.entries(t.collapsedQuota))if(e.collapsedQuota[a]!==c)i[a]=c;if(Object.keys(i).length>0)r.collapsedQuota=i}if(!Re(e.windows,t.windows)){let i={};for(let[a,c]of Object.entries(t.windows))if(!Re(e.windows[a],c))i[a]=c;if(Object.keys(i).length>0)r.windows=i}if(!Re(e.hiddenBalances,t.hiddenBalances))r.hiddenBalances=t.hiddenBalances;if(e.cutoffPercent!==t.cutoffPercent)r.cutoffPercent=t.cutoffPercent;if(e.resetTime!==t.resetTime)r.resetTime=t.resetTime;if(e.quotaDisplay!==t.quotaDisplay)r.quotaDisplay=t.quotaDisplay;return r};var mn=(e)=>async(t)=>{let r=await e.serviceRequest({method:t.method,path:t.path,...t.body!==void 0?{body:JSON.stringify(t.body)}:{}}),i=r.body;if(typeof r.body==="string")try{i=JSON.parse(r.body)}catch{i=null}return{status:r.status,body:i}};var M=(e)=>e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),D=(e)=>M(e);var Rn=(e)=>`<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"><path d="${e}"/></svg>`,er=(e)=>`<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${e}</svg>`;var Ie=(e)=>{if(e==="codex")return Rn("M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.073zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z");if(e==="exa")return'<svg class="quota-exa-mark" viewBox="0 0 182 182" width="14" height="14" aria-hidden="true" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"><g transform="translate(15.5 0)"><path d="M150.5 14.1064C150.5 14.3356 150.421 14.5579 150.277 14.736L88.4766 91L150.277 167.264C150.421 167.442 150.5 167.664 150.5 167.894V181C150.5 181.552 150.052 182 149.5 182H1C0.44772 182 0 181.552 0 181V0.999995C0 0.44771 0.447715 0 1 0H149.5C150.052 0 150.5 0.447715 150.5 1V14.1064ZM30.4059 162.719H121.728L76.0664 106.326L30.4059 162.719ZM19.2949 100.261V145.787L56.1572 100.261H19.2949ZM19.2949 80.9801H55.5434L19.2949 36.2121V80.9801ZM76.0664 75.6731L121.728 19.281H30.4059L76.0664 75.6731Z"/></g></svg>';if(e==="opencode-go"||e==="opencode-zen")return'<svg viewBox="0 0 300 300" width="14" height="14" aria-hidden="true"><g transform="translate(30,0)"><path d="M180 240H60V120H180V240Z" fill="currentColor" opacity=".45"/><path d="M180 60H60V240H180V60ZM240 300H0V0H240V300Z" fill="currentColor"/></g></svg>';if(e==="openrouter")return Rn("M16.778 1.844v1.919q-.569-.026-1.138-.032-.708-.008-1.415.037c-1.93.126-4.023.728-6.149 2.237-2.911 2.066-2.731 1.95-4.14 2.75-.396.223-1.342.574-2.185.798-.841.225-1.753.333-1.751.333v4.229s.768.108 1.61.333c.842.224 1.789.575 2.185.799 1.41.798 1.228.683 4.14 2.75 2.126 1.509 4.22 2.11 6.148 2.236.88.058 1.716.041 2.555.005v1.918l7.222-4.168-7.222-4.17v2.176c-.86.038-1.611.065-2.278.021-1.364-.09-2.417-.357-3.979-1.465-2.244-1.593-2.866-2.027-3.68-2.508.889-.518 1.449-.906 3.822-2.59 1.56-1.109 2.614-1.377 3.978-1.466.667-.044 1.418-.017 2.278.02v2.176L24 6.014Z");if(e==="tavily")return'<svg class="quota-tavily-mark" viewBox="0 0 55 55" width="14" height="14" aria-hidden="true" fill="#1F1E1E" fill-rule="evenodd" clip-rule="evenodd"><path d="M38.8088 0C44.4762 0 47.3101 9.1895e-05 49.4748 1.10306C51.3788 2.07326 52.927 3.62135 53.8971 5.52544C55.0001 7.69013 55 10.524 55 16.1914V38.8088C55 44.4761 55.0001 47.3099 53.8971 49.4746C52.927 51.3786 51.3788 52.9267 49.4748 53.8969C47.3101 54.9999 44.4762 55 38.8088 55H16.1914C10.5239 55 7.69014 54.9999 5.52544 53.8969C3.62133 52.9267 2.07325 51.3787 1.10306 49.4746C0.000109958 47.3099 0 44.4762 0 38.8088V16.1912C0 10.5238 0.000107614 7.69012 1.10306 5.52544C2.07325 3.62133 3.62133 2.07326 5.52544 1.10306C7.69014 8.88436e-05 10.5239 0 16.1914 0H38.8088ZM23.3863 30.405C23.0885 30.405 22.7934 30.4638 22.5183 30.5782C22.2433 30.6926 21.9933 30.8603 21.7827 31.0716L17.4534 35.4188L16.3029 34.2638C15.4573 33.415 14.0099 33.8346 13.7471 35.0064L12.1073 42.3023C12.0498 42.5532 12.0568 42.8148 12.128 43.0621C12.199 43.3085 12.3313 43.5327 12.5123 43.7136L12.5108 43.7159C12.6915 43.8987 12.9155 44.0321 13.1619 44.1037C13.4083 44.1752 13.6688 44.1824 13.9188 44.1246L21.1862 42.4776C22.3527 42.2137 22.7715 40.7614 21.9259 39.9124L20.7754 38.7574L25.1056 34.411C25.5306 33.9842 25.7695 33.4049 25.7695 32.8013C25.7695 32.1977 25.5306 31.6185 25.1056 31.1916L25.0476 31.1334L25.0497 31.1319L24.9896 31.0716C24.7791 30.8603 24.529 30.6926 24.254 30.5782C23.979 30.4638 23.684 30.4051 23.3863 30.405ZM39.0054 27.6663C37.9941 27.0245 36.6768 27.7546 36.6766 28.9556V30.5884H27.3981C27.7081 31.1832 27.8847 31.8596 27.8847 32.5774C27.8846 33.6152 27.5181 34.5672 26.908 35.3099L36.6758 35.3096L36.6752 36.9424C36.6753 38.1434 37.9941 38.8736 39.0054 38.2319L45.3045 34.2387C45.7757 33.9384 46.0114 33.443 46.0115 32.948C46.0109 32.4536 45.7752 31.9592 45.303 31.6601L39.0054 27.6663ZM23.6104 10.2206C23.3539 10.2194 23.101 10.2839 22.8763 10.4081C22.6514 10.5325 22.4614 10.7132 22.3253 10.9318L18.3472 17.2549H18.3458C17.7067 18.2701 18.4346 19.5933 19.6307 19.5936H21.2578V28.9869C21.9327 28.5406 22.7403 28.2801 23.609 28.2801C24.4781 28.2801 25.2864 28.5407 25.9615 28.9875V19.5936H27.5884C28.7849 19.5936 29.5112 18.2702 28.8728 17.2541L24.8939 10.9318C24.5951 10.4584 24.1029 10.2212 23.6104 10.2206Z"/></svg>';return er('<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8H6a2 2 0 0 0-2 2v2a6 6 0 0 0 6 6h4a6 6 0 0 0 6-6v-2a2 2 0 0 0-2-2Z"/>')};var tr=(e)=>{if(e.error?.code==="auth")return{label:"Authentication failed",tone:"error",detail:e.error.message};if(e.state==="error")return{label:"Error",tone:"error",detail:e.error?.message??"The provider request failed."};if(e.state==="loading")return{label:"Checking",tone:"loading",detail:"Waiting for the first reading."};if(e.error)return{label:"Stale reading",tone:"warning",detail:e.error.message};return{label:"Connected",tone:"ok",detail:""}},or=(e)=>{if(e.kind==="custom")return"Custom connection";if(e.kind==="tavily"||e.kind==="exa")return"OpenCode key or environment";return"OpenCode sign-in"},gn=(e)=>{let t=e.providers.filter((a)=>to(a)),r=e.providers.some((a)=>eo(a)),i=t.map((a)=>{let c=tr(a);return`<tr data-provider-row="${M(a.connectionId)}">
        <td data-label="Provider">
          <span class="quota-provider-cell">
            <span class="quota-connection-icon">${Ie(a.kind)}</span>
            <span>${M(a.label)}</span>
          </span>
        </td>
        <td data-label="Setup">${M(or(a))}</td>
        <td data-label="Status">
          <span class="quota-provider-status quota-provider-status-${c.tone}">${M(c.label)}</span>
        </td>
        <td data-label="Details" class="quota-provider-detail${c.tone==="error"?" quota-provider-detail-error":""}">${M(c.detail)}</td>
      </tr>`}).join("");return`<div class="quota-provider-status-block">
    <h4>Provider status</h4>
    <p class="quota-section-note">See what’s connected and what needs attention.</p>
    ${r?'<p class="quota-provider-notice" role="status">The OpenCode plugin is not connected yet. If you just approved the extension, restart OpenCode or OpenChamber.</p>':""}
    ${t?`<div class="quota-provider-table-wrap">
            <table class="quota-provider-table">
              <thead><tr><th>Provider</th><th>Setup</th><th>Status</th><th>Details</th></tr></thead>
              <tbody>${i}</tbody>
            </table>
          </div>`:'<p class="quota-muted">No providers connected yet.</p>'}
  </div>`};var In=(e,t)=>{let r=e.map((i)=>`<li class="quota-connection">
        <div class="quota-connection-main">
          <span class="quota-connection-icon">${Ie(i.kind)}</span>
          <span class="quota-connection-label">${M(i.label)}</span>
          <span class="quota-kind-chip">${i.kind==="custom"?"Custom":"Built-in"}</span>
          ${i.endpoint?`<span class="quota-connection-endpoint">${M(i.endpoint)}</span>`:""}
        </div>
        <div class="quota-connection-actions">
          <button type="button" data-action="test-connection" data-id="${D(i.id)}">Test</button>
          <button type="button" class="quota-danger" data-action="delete-connection" data-id="${D(i.id)}">Remove</button>
        </div>
      </li>`).join("");return`<section class="quota-settings-section quota-providers-section">
    <div class="quota-section-heading">
      <div>
        <h3>Providers</h3>
        <p class="quota-section-note">Manage provider sign-ins and keys in OpenCode.</p>
      </div>
    </div>
    ${t?gn(t):""}
    ${r?`<ul class="quota-connections">${r}</ul>`:""}
  </section>`};var bn=(e)=>e.filter((t)=>t.id!=="key-used"&&t.label!=="Key credits used");var xn=(e,t)=>{let r=e.providers.filter((c)=>rt(c)),i=nt(r.map((c)=>c.connectionId),t.providerOrder).map((c)=>r.find((h)=>h.connectionId===c)).filter((c)=>c!==void 0);return`<section class="quota-settings-section quota-display-section">
    <div class="quota-section-heading">
      <div>
        <h3>Display</h3>
        <p class="quota-section-note">Choose which providers and windows appear in the Quotas panel.</p>
      </div>
    </div>
    <div class="quota-selector">
      ${i.map((c,h)=>{let m=Zt(t,c.connectionId),y=bn(c.balances),G=y.length>0,K=!t.hiddenBalances.includes(c.connectionId),te=c.windows.filter((f)=>me(t,c.connectionId,f.id)),ae=c.windows.map((f)=>{let q=me(t,c.connectionId,f.id);return`<label class="quota-check quota-check-window">
            <input type="checkbox" data-window-toggle data-provider="${D(c.connectionId)}" data-window="${D(f.id)}" ${q?"checked":""} />
            ${M(f.label)}
          </label>`}).join(""),ce=G?`<label class="quota-check quota-check-window">
            <input type="checkbox" data-balance-toggle data-provider="${D(c.connectionId)}" ${K?"checked":""} />
            non-reporting balances
          </label>`:"",oe=`${ae}${ce}`,z=t.collapsedQuota[c.connectionId]??"least-remaining",de=oo(te),X=[...de.leastRemaining?[{value:"least-remaining",label:"Least remaining"}]:[],...de.earliestReset?[{value:"earliest-reset",label:"Earliest reset"}]:[],...te.map((f)=>({value:ge("window",f.id),label:f.label})),...c.caps.map((f)=>({value:ge("cap",f.id),label:f.label})),...K?y.map((f)=>({value:ge("balance",f.id),label:f.label})):[]],ne=_n(z,te),le=X.find((f)=>f.value===z)??X.find((f)=>f.value===ne)??X.find((f)=>/^(cap|balance):/.test(f.value))??X[0],pe=X.map(({value:f,label:q})=>`<option value="${D(f)}" ${le?.value===f?"selected":""}>${M(q)}</option>`).join("");return`<div class="quota-select-provider">
        <div class="quota-select-row">
          <label class="quota-check quota-provider-choice">
            <input type="checkbox" data-provider-toggle data-provider="${D(c.connectionId)}" ${m?"checked":""} />
            <span class="quota-select-icon">${Ie(c.kind)}</span>
            <span class="quota-select-label">${M(c.label)}</span>
          </label>
          <span class="quota-reorder">
            <button type="button" data-action="move-provider-up" data-provider="${D(c.connectionId)}" aria-label="Move ${D(c.label)} up" title="Move up" ${h===0?"disabled":""}>↑</button>
            <button type="button" data-action="move-provider-down" data-provider="${D(c.connectionId)}" aria-label="Move ${D(c.label)} down" title="Move down" ${h===i.length-1?"disabled":""}>↓</button>
          </span>
        </div>
        ${oe?`<div class="quota-select-windows">${oe}</div>`:""}
        ${X.length>0?`<label class="quota-check quota-collapsed-choice">Collapsed shows
          <select data-collapsed-quota data-provider="${D(c.connectionId)}">${pe}</select>
        </label>`:""}
      </div>`}).join("")||'<p class="quota-muted">No signed-in OpenCode providers. Sign in through OpenCode, then refresh.</p>'}
    </div>
    <div class="quota-preferences">
      <label class="quota-preference">Show quota as
        <select data-quota-display>
          <option value="remaining" ${t.quotaDisplay==="remaining"?"selected":""}>Remaining</option>
          <option value="used" ${t.quotaDisplay==="used"?"selected":""}>Used</option>
        </select>
      </label>
      <label class="quota-preference">Danger cutoff
        <span class="quota-cutoff-row">
          <input type="number" min="0" max="100" step="1" data-cutoff value="${t.cutoffPercent}" />
          <span aria-hidden="true">%</span>
        </span>
      </label>
      <label class="quota-preference">Reset time
        <select data-reset-time>
          <option value="relative" ${t.resetTime==="relative"?"selected":""}>Relative</option>
          <option value="absolute" ${t.resetTime==="absolute"?"selected":""}>Absolute</option>
        </select>
      </label>
    </div>
  </section>`};var io=Ht(),ie=mn(io),it=document.querySelector("#root");if(!it)throw Error("Missing #root");var j=null,st=[],ao={...Me},no=0,ee="",Cn=!1,Ne=0,nr=async()=>{let e=Ne,t=await ie({method:"GET",path:"/connections"});if(e!==Ne)return;let r=t.body;st=Array.isArray(r?.connections)?r.connections:[]},rr=async()=>{let e=Ne,t=await ie({method:"GET",path:"/snapshot"});if(e===Ne&&t.status===200&&t.body&&typeof t.body==="object")j=t.body},ro=(e)=>{let t=e;if(t?.version!==1||!t.selection||typeof t.revision!=="number")return!1;if(t.revision>=no)ao=t.selection,no=t.revision;return!0},sr=async()=>{let e=await ie({method:"GET",path:"/settings"});if(e.status===200)ro(e.body)},so=async(e)=>{try{for(let t=0;t<2;t++){let r=e(ao);if(Object.keys(r).length===0)break;let i=await ie({method:"PATCH",path:"/settings",body:{expectedRevision:no,changes:r}});if(i.status===200&&ro(i.body))break;if(i.status===409&&t===0&&ro(i.body))continue;ee="Could not save the display settings.";break}}catch{ee="Could not reach the quota service."}xe()},be=(e)=>so((t)=>hn(t,e(t))),vn=async()=>{await Promise.all([sr(),nr(),rr()]),xe()},ir=async()=>{await ie({method:"POST",path:"/refresh",body:{}}),await new Promise((e)=>setTimeout(e,600)),await vn()},yn=(e)=>{ee=e instanceof Error?e.message:"The quota service is unavailable.",xe()},xe=()=>{it.innerHTML=`<header class="quota-settings-header">
    <div>
      <h2>Quota settings</h2>
      <p class="quota-settings-subtitle">Choose providers and windows, reorder them, and set shared display options.</p>
    </div>
  </header>
  ${ee?`<div class="quota-error" role="alert">${M(ee)}</div>`:""}
  ${In(st,j)}
  ${j?xn(j,ao):'<div class="quota-row-loading">Loading quota…</div>'}`};it.addEventListener("click",(e)=>{let t=e.target.closest("[data-action]");if(!t)return;let r=t.dataset.action;if(r==="move-provider-up"||r==="move-provider-down"){let i=t.dataset.provider;if(!i)return;let a=r==="move-provider-up"?-1:1;be((c)=>{let h=(j?.providers??[]).filter(rt).map((m)=>m.connectionId);return An(c,i,a,h)});return}if(r==="delete-connection"&&t.dataset.id){let i=t.dataset.id;(async()=>{if((await ie({method:"DELETE",path:`/connections/${encodeURIComponent(i)}`})).status>=400){ee="Could not remove the provider.",xe();return}if(ee="",Ne++,st=st.filter((c)=>c.id!==i),j)j={...j,providers:j.providers.filter((c)=>c.connectionId!==i)};xe()})().catch(yn);return}if(r==="test-connection"&&t.dataset.id)(async()=>{let a=(await ie({method:"POST",path:`/connections/${encodeURIComponent(t.dataset.id)}/test`})).body;await io.toast({kind:a.ok?"success":"error",message:a.ok?"Connection works.":a.error?.message??"Connection failed."})})()});it.addEventListener("change",(e)=>{let t=e.target;if(t.matches("[data-provider-toggle]")){let r=t.getAttribute("data-provider"),i=t.checked;so(()=>({providerVisibility:{[r]:i}}));return}if(t.matches("[data-window-toggle]")){let r=t.getAttribute("data-provider"),i=t.getAttribute("data-window"),a=t.checked;so((c)=>{let h=new Set(c.windows[r]??[]),m=j?.providers.find((y)=>y.connectionId===r);for(let y of m?.windows??[])if(me(c,r,y.id))h.add(y.id);if(a)h.add(i);else h.delete(i);return{windowSelection:{[r]:[...h]}}});return}if(t.matches("[data-balance-toggle]")){let r=t.getAttribute("data-provider"),i=!t.checked;be((a)=>En(a,r,i));return}if(t.matches("[data-collapsed-quota]")){let r=t.getAttribute("data-provider"),i=t.value;be((a)=>On(a,r,i));return}if(t.matches("[data-cutoff]")){let r=Number(t.value);be((i)=>Sn(i,r));return}if(t.matches("[data-quota-display]")){let r=t.value==="used"?"used":"remaining";be((i)=>fn(i,r));return}if(t.matches("[data-reset-time]")){let r=t.value==="absolute"?"absolute":"relative";be((i)=>Tn(i,r))}});io.onReady((e)=>{if(Xt(e,document.documentElement),Cn)return;Cn=!0;let t=()=>{vn().then(()=>{if(!ee)return;ee="",xe()}).catch(yn)};window.setInterval(t,5000),t(),ir().catch(()=>{return})});})();
