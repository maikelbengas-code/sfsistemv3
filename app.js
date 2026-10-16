const LS=(()=>{try{localStorage.setItem('t','1');localStorage.removeItem('t');return localStorage}catch{const m={};return{getItem:k=>m[k]??null,setItem:(k,v)=>{m[k]=String(v)},removeItem:k=>{delete m[k]}}}})();
const KEY='sf_gym_v2',$=s=>document.querySelector(s);
const DAYS=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const PAL=['#d4af37','#ff6b35','#2dd4bf','#a78bfa','#f43f5e','#38bdf8'];
const IMGS=['photo-1534438327276-14e5300c3a48','photo-1571019613454-1cb2f99b2d8b','photo-1517836357463-d25dfeac3438'].map(i=>`url(https://images.unsplash.com/${i}?q=70&w=1000&auto=format&fit=crop)`);

let S,me=null,tab='hoy',selStu=null,selDay=0,viewingAsStudent=false;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39.'}[c]));
const col=z=>PAL[[...z].reduce((a,c)=>a+c.charCodeAt(0),0)%PAL.length];
const today=()=>new Date().toLocaleDateString('en-CA');
const todayIdx=()=>(new Date().getDay()+6)%7;

// SHA-256 en JS puro: funciona igual en HTTP y HTTPS (crypto.subtle solo existe en HTTPS/localhost)
const sha256js=str=>{
  const bytes=new TextEncoder().encode(str),H=[],K=[],comp={};let pc=0;
  for(let c=2;pc<64;c++){if(!comp[c]){for(let i=0;i<313;i+=c)comp[i]=c;if(pc<8)H[pc]=(Math.pow(c,.5)*4294967296)|0;K[pc++]=(Math.pow(c,1/3)*4294967296)|0}}
  const l=bytes.length,n=(((l+8)>>6)+1)*16,W=new Array(n).fill(0);
  for(let i=0;i<l;i++)W[i>>2]|=bytes[i]<<((3-i%4)*8);
  W[l>>2]|=0x80<<((3-l%4)*8);W[n-1]=l*8;
  const R=(x,k)=>(x>>>k)|(x<<(32-k));
  for(let o=0;o<n;o+=16){
    const w=W.slice(o,o+16),h=H.slice();
    for(let j=16;j<64;j++){const a=w[j-15],b=w[j-2];w[j]=(w[j-16]+(R(a,7)^R(a,18)^(a>>>3))+w[j-7]+(R(b,17)^R(b,19)^(b>>>10)))|0}
    let [a,b,c,d,e,f,g,hh]=h;
    for(let j=0;j<64;j++){
      const t1=(hh+(R(e,6)^R(e,11)^R(e,25))+((e&f)^(~e&g))+K[j]+w[j])|0,
            t2=((R(a,2)^R(a,13)^R(a,22))+((a&b)^(a&c)^(b&c)))|0;
      hh=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0}
    [a,b,c,d,e,f,g,hh].forEach((v,i)=>H[i]=(H[i]+v)|0)}
  return H.map(x=>(x>>>0).toString(16).padStart(8,'0')).join('')};
const sha=async t=>{
  try{if(window.crypto&&window.crypto.subtle){const buf=await window.crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return[...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')}}catch(e){}
  return sha256js(t)};

const isPrivileged=u=>u&&(u.role==='admin'||u.role==='tecnico');

const emb=u=>{const m=(u||'').match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([\w-]{11})/);return m?'https://www.youtube.com/embed/'+m[1]:''};
const yid=u=>(((u||'').match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([\w-]{11})/))||[])[1]||'';
const vurl=(e,w)=>w==='F'?e.videoF:e.video;
const vw=e=>{const p=activeUser()&&activeUser().vid==='F'?'F':'M';return emb(vurl(e,p))?p:(p==='F'?'M':'F')};
const vsm=(e,w)=>{w=w||vw(e);const u=vurl(e,w);return emb(u)?`<button class="vthumb sm" data-a="vid" data-v="${e.id}" data-w="${w}" aria-label="Ver video"><img src="https://img.youtube.com/vi/${yid(u)}/mqdefault.jpg" alt="" loading="lazy"><i></i></button>`:''};
const vadm=e=>`<div class="vpair">${['M','F'].map(w=>emb(vurl(e,w))?`<div class="vg"><small>${w==='F'?'♀ Mujeres':'♂ Hombres'}</small>${vsm(e,w)}</div>`:'').join('')}</div>`;
const vpv=id=>`<div class="vthumb big pv"><img src="https://img.youtube.com/vi/${id}/mqdefault.jpg" alt="Vista previa"><i></i><span>Vista previa del video</span></div>`;

const activeUser=()=>(viewingAsStudent && me && isPrivileged(me)) ? {id:me.id,name:me.name+' (Modo Alumno)',role:'alumno',vid:me.vid||'M'} : me;

async function save(){
  try{
    LS.setItem(KEY,JSON.stringify(S));
    if(typeof db !== 'undefined'){
      await db.collection('sf_gym').doc('data').set(S);
    }
  }catch(e){console.error(e);toast('Error al guardar en la nube')}
}

const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2300)};
const lerr=m=>{document.querySelectorAll('.fld').forEach(f=>{f.classList.remove('bad');void f.offsetWidth;f.classList.add('bad')});const e=$('#lerr');e.textContent=m;e.hidden=false};
const exById=id=>S.ex.find(e=>e.id===id);
const exFor=(uid,id,day)=>{const e=exById(id);if(!e)return e;const m=S.ov?.[uid]||{},o=m[day+'|'+id]||m[id];return o&&Object.keys(o).length?{...e,...o,_ov:1}:e};

async function init(){
  const defaultData = {
    users:[
      {id:1,email:'admin@sf.com',name:'Sergio Fernández',role:'admin',active:true,pass:'8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'},
      {id:2,email:'alumno@sf.com',name:'Alumno Demo',role:'alumno',active:true,pass:'8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'}
    ],
    ex:[[ 'Pecho','Press de banca plano','4','10-12'],['Pecho','Aperturas con mancuernas','3','12'],['Pierna','Sentadilla libre','4','8-10'],['Espalda','Dominadas','3','8'],['Espalda','Remo con barra','4','10'],['Hombro','Press militar','4','10']].map((e,i)=>({id:i+1,zone:e[0],name:e[1],sets:e[2],reps:e[3],note:'',video:''})),
    plans:{2:{Lunes:{title:'Pecho',items:[1,2]},Martes:{title:'Pierna',items:[3]},Jueves:{title:'Espalda',items:[4,5]}}},
    done:{},
    maint:false
  };

  try {
    S = JSON.parse(LS.getItem(KEY)||'null');
  } catch(e) {
    S = null;
  }

  if(!S || !Array.isArray(S.users)){
    S = defaultData;
    LS.setItem(KEY, JSON.stringify(S));
  }
  
  const id=+LS.getItem('sf_me');
  me = S.users.find(u=>u.id===id&&u.active)||null;
  if(me&&expired()){me=null;LS.removeItem('sf_me')}
  S.pays??=[];
  if(me) tab = isPrivileged(me)?'alumnos':'hoy';

  if(!document.querySelector('#sparks')){
    document.body.insertAdjacentHTML('afterbegin','<div id="sparks" aria-hidden="true">'+Array.from({length:16},(_,i)=>`<i style="left:${(i*37+11)%100}%;width:${3+i%3*2}px;height:${3+i%3*2}px;animation-duration:${8+i%5*2}s;animation-delay:-${(i*1.9).toFixed(1)}s"></i>`).join('')+'</div>');
  }
  render();
  payCheck(true);remindCheck(true);

  if('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for(let registration of registrations) {
        registration.unregister();
      }
    });
  }

  if(typeof db !== 'undefined'){
    db.collection('sf_gym').doc('data').onSnapshot(async doc => {
      if(doc.exists && doc.data() && Array.isArray(doc.data().users)){
        S = doc.data();S.pays??=[];if(me){me=S.users.find(u=>u.id===me.id&&u.active)||null;if(!me)LS.removeItem('sf_me')}
        LS.setItem(KEY, JSON.stringify(S));
        render();payCheck();
      } else {
        await save();
      }
    }, (error) => {
      console.log('Modo offline / usando datos locales', error);
    });
  }
}

const dbl=()=>'<svg class="dbl" viewBox="0 0 120 60" aria-hidden="true"><rect class="q" x="38" y="27" width="44" height="6" rx="3"/><rect class="p" x="26" y="14" width="10" height="32" rx="3"/><rect class="p" x="18" y="20" width="8" height="20" rx="2"/><rect class="q" x="12" y="26" width="6" height="8" rx="2"/><rect class="p" x="84" y="14" width="10" height="32" rx="3"/><rect class="p" x="94" y="20" width="8" height="20" rx="2"/><rect class="q" x="102" y="26" width="6" height="8" rx="2"/></svg>';

function render(){
  const a=$('#app'), actU = activeUser();
  
  if(S.maint && actU && actU.role === 'alumno' && !viewingAsStudent){
    a.className='wide';
    a.innerHTML=`<div class="login" style="--img:${IMGS[0]}"><div class="card login-card lcard" style="text-align:center;padding:40px 20px;"><img src="logo.png" alt="SF Sistem" style="width:80px;height:80px;margin:0 auto 16px;object-fit:contain;border-radius:16px;">${dbl()}<h1>App en <b>Mantenimiento</b></h1><p style="margin-top:10px;color:var(--mut);">Estamos actualizando el sistema para ofrecerte una mejor experiencia. Volvemos enseguida.</p></div></div>`;
    return;
  }

  const k=(actU?actU.id+actU.role:'login')+(viewingAsStudent?'-viewAsStudent':'');a.className=isPrivileged(actU)&&!viewingAsStudent?'wide':'';
  const html=!actU?loginV():(isPrivileged(actU)&&!viewingAsStudent)?adminV():studentV(),v=$('#view');
  if(actU&&v&&a.dataset.k===k){
    const t=document.createElement('div');t.innerHTML=html;
    v.innerHTML=t.querySelector('#view').innerHTML;
    a.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===tab));
    {const nb=a.querySelector('.nav'),nn=t.querySelector('.nav');if(nb&&nn){nb.querySelectorAll('.bdg').forEach(x=>x.remove());const bb=nn.querySelector('[data-v=pagos] .bdg'),pb=nb.querySelector('[data-v=pagos]');if(bb&&pb)pb.appendChild(bb)}}
    {const ob=a.querySelector('.bell'),nbl=t.querySelector('.bell');if(ob&&nbl){if(ob.outerHTML!==nbl.outerHTML)ob.replaceWith(nbl)}else if(ob)ob.remove();else if(nbl){const ta=a.querySelector('.tact');if(ta)ta.prepend(nbl)}}
    const f=a.querySelector('.fab'),nf=t.querySelector('.fab');
    if(f&&nf){if(f.outerHTML!==nf.outerHTML)f.replaceWith(nf)}else if(f)f.remove();else if(nf)a.appendChild(nf);
    if(shown!==tab){const o=(isPrivileged(actU)&&!viewingAsStudent)?['alumnos','pagos','planes','ejercicios','cartelera']:['hoy','semana','progreso'],ix=x=>x==='progA'?.5:o.indexOf(x);
      v.className='';void v.offsetWidth;v.className=ix(tab)>=ix(shown)?'sl-r':'sl-l';scrollTo(0,0);setTimeout(()=>{v.className=''},500)}
  }else{a.innerHTML=html;a.dataset.k=k}
  shown=tab;anim();
}

const ICON={hoy:'M13 2 3 14h7l-1 8 10-12h-7z',semana:'M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2zM5 10h14v10H5z',alumnos:'M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zM8 12a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm8 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4zM8 14c-2.3 0-6 1.2-6 3.5V20h5v-2c0-1.3.7-2.5 1.9-3.4z',planes:'M19 3h-4.2a3 3 0 0 0-5.6 0H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 0a1 1 0 1 1-1 1 1 1 0 0 1 1-1zM7 9h10v2H7zm0 4h10v2H7zm0 4h6v2H7z',ejercicios:'M20.57 14.86 22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z'};
ICON.progreso='M3 3v18h18v-2H5V3zm4 10h3v5H7zm5-6h3v11h-3zm5 3h3v8h-3z';ICON.cartelera='M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5z';
ICON.pagos='M19 14V6c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zm-9-1c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-6v11c0 1.1-.9 2-2 2H4v-2h17V7h2z';
const NC={pagos:'#34d399',hoy:'#ff6b35',semana:'#2dd4bf',progreso:'#a78bfa',alumnos:'#d4af37',planes:'#38bdf8',ejercicios:'#f43f5e',cartelera:'#ff6b35'};
const hdr=()=>{
  const actU = activeUser();
  return `<div class="top"><div class="brand"><img src="logo.png" alt="SF Sistem"><div class="hi"><small>${isPrivileged(actU)&&!viewingAsStudent?(actU.role==='tecnico'?'Técnico':'Entrenador'):'Alumno'}</small><b>Hola, ${esc(actU.name.split(' ')[0])}</b></div></div><div class="tact">${bellBtn()}${isPrivileged(me)&&me.role==='tecnico'?`<button class="ib" data-a="toggleViewAsStudent" aria-label="Ver modo alumno" title="${viewingAsStudent?'Salir de modo alumno':'Ver modo alumno'}"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg></button>`:''}<button class="ib" data-a="mypw" aria-label="Cambiar mi contraseña" title="Mi contraseña"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12.65 10A5.99 5.99 0 0 0 7 6a6 6 0 0 0 0 12 5.99 5.99 0 0 0 5.65-4H17v4h4v-4h2v-4zM7 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/></svg></button><button class="out" data-a="out" aria-label="Salir"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8v-2H4z"/></svg><span>Salir</span></button></div></div>`;
};
const SESSION_MS=20*60*1000;
const touch=()=>LS.setItem('sf_last',Date.now());
const expired=()=>Date.now()-(+LS.getItem('sf_last')||0)>SESSION_MS;
const closeM=()=>{const m=$('#modal');m.hidden=true;m.innerHTML='';m.classList.remove('vfull');try{if(document.fullscreenElement)document.exitFullscreen()}catch{}};
document.addEventListener('fullscreenchange',()=>{const m=$('#modal');if(m&&m.classList.contains('vfull')&&!m.hidden&&!document.fullscreenElement)closeM()});
function sessionCheck(){if(me&&expired()){me=null;LS.removeItem('sf_me');LS.removeItem('sf_last');closeM();render();toast('Sesión cerrada por inactividad. Ingresá de nuevo.')}}

const PAYWARN=3;let pm=0;
const NUM=n=>(+n||0).toLocaleString('es-PY');
const fmtD=s=>s?new Date(s+'T00:00').toLocaleDateString('es',{day:'numeric',month:'short',year:'numeric'}):'';
const dd=s=>Math.round((new Date(s+'T00:00')-new Date(today()+'T00:00'))/864e5);
const addM=s=>{const[y,m,d]=s.split('-').map(Number),n=new Date(y,m,1);n.setDate(Math.min(d,new Date(y,m+1,0).getDate()));return n.toLocaleDateString('en-CA')};
const mk=o=>{const n=new Date();return new Date(n.getFullYear(),n.getMonth()+o,1).toLocaleDateString('en-CA').slice(0,7)};
const payInfo=u=>{if(!u.fee||!u.due)return{k:'none',t:'Sin configurar'};const d=dd(u.due);
  if(d<0)return{k:'bad',t:`Vencido hace ${-d} día${d===-1?'':'s'}`};
  if(d===0)return{k:'warn',t:'Vence hoy'};
  if(d<=PAYWARN)return{k:'warn',t:`Vence en ${d} día${d==1?'':'s'}`};
  return{k:'ok',t:`Al día · ${d} days`}};
const PS=()=>{if(!S.pstu)S.pstu=alumnos().filter(u=>u.fee||u.due||(S.pays||[]).some(p=>p.uid===u.id)).map(u=>({id:u.id,name:u.name,fee:u.fee||0,due:u.due||'',paid:u.paid||0,active:u.active!==false}));return S.pstu};
const rem=u=>Math.max(0,(+u.fee||0)-(+u.paid||0));
const canPay=u=>!u.fee||!u.due||u.due.slice(0,7)<=today().slice(0,7)||dd(u.due)<=PAYWARN;
const payAlerts=()=>PS().filter(u=>u.active!==false&&u.fee&&u.due&&dd(u.due)<=PAYWARN).sort((a,b)=>dd(a.due)-dd(b.due));
const bdg=k=>k==='pagos'&&isPrivileged(activeUser())&&!viewingAsStudent&&payAlerts().length?`<em class="bdg">${payAlerts().length}</em>`:'';
const payBanner=()=>{const al=payAlerts();if(!al.length)return'';const bad=al.some(u=>dd(u.due)<0);
  return`<div class="pbanner ${bad?'bad':''}" data-a="tab" data-v="pagos"><b>${al.length} pago${al.length>1?'s':''} por cobrar</b><small>${al.slice(0,3).map(u=>esc(u.name.split(' ')[0])+': '+payInfo(u).t.toLowerCase()).join(' · ')}${al.length>3?'…':''}</small></div>`};
function payCheck(first){
  const actU = activeUser();
  if(!isPrivileged(actU)||viewingAsStudent||!S||!S.users)return;const al=payAlerts();if(!al.length)return;
  if(first)toast(al.length+(al.length>1?' pagos por cobrar':' pago por cobrar'));
  const k='sf_pn_'+today();if(LS.getItem(k)===String(al.length))return;
  if('Notification'in window&&Notification.permission==='granted'){
    LS.setItem(k,al.length);
    const msg=al.slice(0,3).map(u=>u.name.split(' ')[0]+': '+payInfo(u).t.toLowerCase()).join(' · '),o={body:msg,icon:'icon-192.png',badge:'icon-192.png',tag:'sf-pagos'};
    (navigator.serviceWorker?navigator.serviceWorker.getRegistration():Promise.resolve(null)).then(r=>r?r.showNotification('SF Sistem · Pagos por cobrar',o):new Notification('SF Sistem · Pagos por cobrar',o)).catch(()=>{})}}

const noRoutine=u=>!Object.values(S.plans?.[u.id]||{}).some(d=>d&&d.items&&d.items.length);
const noRoutList=()=>alumnos().filter(u=>u.active!==false&&noRoutine(u));
const recentPays=()=>(S.pays||[]).filter(p=>dd(p.date)>=-7).sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id).slice(0,15);
const bellSeen=()=>+LS.getItem('sf_bell_seen')||0;
const newPays=()=>recentPays().filter(p=>p.id>bellSeen());
const bellCount=()=>payAlerts().length+noRoutList().length+newPays().length;
const isAdm=()=>{const u=activeUser();return !!(u&&isPrivileged(u)&&!viewingAsStudent&&S&&S.users)};
const bellBtn=()=>{if(!isAdm())return'';const n=bellCount();
  return`<button class="ib bell" data-a="bell" aria-label="Notificaciones" title="Notificaciones"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>${n?`<em class="bb">${n>99?'99+':n}</em>`:''}</button>`};
const routBanner=()=>{const l=noRoutList();if(!l.length)return'';
  return`<div class="pbanner bad" data-a="gorut" data-v="${l[0].id}"><b>${l.length} alumno${l.length>1?'s':''} sin rutina</b><small>${l.slice(0,3).map(u=>esc(u.name.split(' ')[0])).join(' · ')}${l.length>3?'…':''}</small></div>`};
const bellModal=()=>{
  const al=payAlerts(),nr=noRoutList(),pp=recentPays();
  const sec=(t,c,items)=>items.length?`<h4 class="nsec ${c}">${t} (${items.length})</h4>`+items.join(''):'';
  const nrH=nr.map(u=>`<div class="nitem bad"><div><b>${esc(u.name)}</b><small>Todavía no tiene rutina</small></div><div class="acts"><button data-a="gorut" data-v="${u.id}">Asignar</button></div></div>`);
  const alH=al.map(u=>{const pi=payInfo(u),amt=rem(u)||u.fee;return`<div class="nitem ${pi.k==='bad'?'bad':'warn'}"><div><b>${esc(u.name)}</b><small>Pago pendiente · ${pi.t.toLowerCase()} · ${NUM(amt)} Gs</small></div><div class="acts"><button data-a="payn" data-v="${u.id}">Aviso</button><button data-a="gopay">Pagos</button></div></div>`});
  const ppH=pp.map(p=>`<div class="nitem ok"><div><b>${esc(p.name)}</b><small>Pago realizado · ${fmtD(p.date)}${p.full===false?' · abono':''}</small></div><b class="gold">${NUM(p.amount)} Gs</b></div>`);
  const body=sec('Alumnos sin rutina','bad',nrH)+sec('Pagos pendientes','warn',alH)+sec('Pagos realizados (últimos 7 días)','ok',ppH);
  $('#modal').innerHTML=`<div class="card"><h3>Notificaciones</h3>${body||'<div class="empty">'+dbl()+'Sin notificaciones por ahora.</div>'}<button class="ghost" style="margin-top:10px" data-a="closev">Cerrar</button></div>`;$('#modal').hidden=false;
  const mx=Math.max(0,...pp.map(p=>p.id));if(mx>bellSeen()){LS.setItem('sf_bell_seen',mx);const b=document.querySelector('.bell .bb');if(b)b.remove()}};
function remindCheck(first){
  if(!isAdm())return;const nr=noRoutList(),n=bellCount();if(!n)return;
  const parts=[];if(payAlerts().length)parts.push(payAlerts().length+' pago'+(payAlerts().length>1?'s':'')+' pendiente'+(payAlerts().length>1?'s':''));if(nr.length)parts.push(nr.length+' alumno'+(nr.length>1?'s':'')+' sin rutina');
  const msg='🔔 '+(parts.join(' · ')||'Tenés notificaciones nuevas')+' · tocá la campana';
  if(first)setTimeout(()=>toast(msg),2800);else toast(msg);
  if(nr.length&&'Notification'in window&&Notification.permission==='granted'){
    const k='sf_rn_'+today()+'_'+nr.length;if(LS.getItem(k))return;LS.setItem(k,'1');
    const o={body:nr.slice(0,3).map(u=>u.name.split(' ')[0]).join(', ')+(nr.length>3?'…':'')+' todavía no tiene rutina',icon:'icon-192.png',badge:'icon-192.png',tag:'sf-rutinas'};
    (navigator.serviceWorker?navigator.serviceWorker.getRegistration():Promise.resolve(null)).then(r=>r?r.showNotification('SF Sistem · Alumnos sin rutina',o):new Notification('SF Sistem · Alumnos sin rutina',o)).catch(()=>{})}}

const ovModal=idx=>{const id=(((S.plans[selStu]||{})[DAYS[selDay]]||{}).items||[])[idx],e=exFor(selStu,id,DAYS[selDay]),u=S.users.find(z=>z.id===selStu);if(!e)return;
  $('#modal').innerHTML=`<div class="card"><h3>Editar para ${esc(u?.name||'alumno')}</h3><small class="lb">Solo se aplica a este alumno y al día ${DAYS[selDay]}. Si el ejercicio está otro día, ahí lo editás aparte. El original en "Ejercicios" no se modifica.</small><input id="o-name" placeholder="Nombre" value="${esc(e.name)}"><div class="g2"><input id="o-sets" placeholder="Series" inputmode="numeric" value="${esc(e.sets)}"><input id="o-reps" placeholder="Repeticiones" value="${esc(e.reps)}"></div><input id="o-note" placeholder="Nota (opcional: RPE, cadencia…)" value="${esc(e.note)}"><textarea id="o-desc" placeholder="Descripción / indicaciones (opcional)">${esc(e.desc)}</textarea><button class="btn" data-a="ovsave" data-v="${id}">Guardar para este alumno</button>${e._ov?`<button class="ghost" style="margin-top:10px" data-a="ovreset" data-v="${id}">Volver al original</button>`:''}<button class="ghost" style="margin-top:10px" data-a="closev">Cancelar</button></div>`;$('#modal').hidden=false};

/* ===== Correos guardados + Face ID / huella (v3.0.15) ===== */
const jget=(k,d)=>{try{return JSON.parse(LS.getItem(k))||d}catch{return d}};
const savedAcc=()=>jget('sf_accs',[]);
const saveAcc=u=>{const l=savedAcc().filter(x=>x.id!==u.id);l.unshift({em:u.email,id:u.id});LS.setItem('sf_accs',JSON.stringify(l.slice(0,3)))};
const bioMap=()=>jget('sf_bio',{});
const b64e=buf=>btoa(String.fromCharCode(...new Uint8Array(buf)));
const b64d=t=>Uint8Array.from(atob(t),c=>c.charCodeAt(0));
let bioOK=false;
(async()=>{try{bioOK=!!(window.PublicKeyCredential&&window.isSecureContext&&await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())}catch{}
  if(bioOK&&typeof me!=='undefined'&&!me){const e=document.getElementById('em'),p=document.getElementById('pw');if(e&&p&&!p.value&&(!e.value||(savedAcc()[0]&&e.value===savedAcc()[0].em)))render()}})();
const bioIcon='<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.81 4.47c-.08 0-.16-.02-.23-.06C15.66 3.42 14 3 12.01 3c-1.98 0-3.86.47-5.57 1.41-.24.13-.54.04-.68-.2a.506.506 0 0 1 .2-.68C7.82 2.52 9.86 2 12.01 2c2.13 0 3.99.47 6.03 1.52.25.13.34.43.21.67-.09.18-.26.28-.44.28zM3.5 9.72a.5.5 0 0 1-.41-.79c.99-1.4 2.25-2.5 3.75-3.27C9.98 4.04 14 4.03 17.15 5.65c1.5.77 2.76 1.86 3.75 3.25a.5.5 0 0 1-.12.7.5.5 0 0 1-.7-.12 9.4 9.4 0 0 0-3.4-3c-2.9-1.5-6.63-1.5-9.5-.01a9.3 9.3 0 0 0-3.4 3 .5.5 0 0 1-.28.25zM9.75 21.79a.47.47 0 0 1-.35-.15c-.87-.87-1.34-1.43-2.01-2.64-.69-1.23-1.05-2.73-1.05-4.34 0-2.97 2.54-5.39 5.66-5.39s5.66 2.42 5.66 5.39c0 .28-.22.5-.5.5s-.5-.22-.5-.5c0-2.42-2.09-4.39-4.66-4.39s-4.66 1.97-4.66 4.39c0 1.44.32 2.77.93 3.85.64 1.15 1.08 1.64 1.85 2.42.19.2.19.51 0 .71-.11.1-.24.15-.37.15zm7.17-1.85c-1.19 0-2.24-.3-3.1-.89-1.49-1.01-2.38-2.65-2.38-4.39 0-.28.22-.5.5-.5s.5.22.5.5c0 1.41.72 2.74 1.94 3.56.71.48 1.54.71 2.54.71.24 0 .64-.03 1.04-.1.27-.05.53.13.58.41.05.27-.13.53-.41.58-.57.11-1.07.12-1.21.12zM14.91 22c-.04 0-.09-.01-.13-.02-1.59-.44-2.63-1.03-3.72-2.1a7.3 7.3 0 0 1-2.17-5.22c0-1.62 1.38-2.94 3.08-2.94s3.08 1.32 3.08 2.94c0 1.07.93 1.94 2.08 1.94s2.08-.87 2.08-1.94c0-3.77-3.25-6.83-7.25-6.83-2.84 0-5.44 1.58-6.61 4.03-.39.81-.59 1.76-.59 2.8 0 .78.07 2.01.67 3.61.1.26-.03.55-.29.64-.26.1-.55-.04-.64-.29a11.14 11.14 0 0 1-.73-3.96c0-1.2.23-2.29.68-3.24 1.33-2.79 4.28-4.6 7.51-4.6 4.55 0 8.25 3.51 8.25 7.83 0 1.62-1.38 2.94-3.08 2.94s-3.08-1.32-3.08-2.94c0-1.07-.93-1.94-2.08-1.94s-2.08.87-2.08 1.94c0 1.71.66 3.31 1.87 4.51.95.94 1.86 1.46 3.27 1.85.27.07.42.35.35.61-.05.23-.26.38-.47.38z"/></svg>';
const savedBlock=()=>{const l=savedAcc();if(!l.length)return'';
  return`<div class="accs"><small>Tu correo en este celular</small>${l.map(x=>`<div class="acc"><button type="button" data-a="pickem" data-v="${esc(x.em)}">${esc(x.em)}</button><button type="button" class="x" data-a="forgetem" data-v="${x.id}" aria-label="Quitar este correo">✕</button></div>`).join('')}</div>`};
const bioBtns=()=>{if(!bioOK)return'';const m=bioMap();
  return savedAcc().filter(x=>m[x.id]).map(x=>{const u=S.users.find(z=>z.id===x.id);return`<button type="button" class="ghost biobtn" data-a="biologin" data-v="${x.id}">${bioIcon}<span>Entrar con Face ID / huella${u?' · '+esc(u.name.split(' ')[0]):''}</span></button>`}).join('')};
function enterUser(u){me=u;viewingAsStudent=false;LS.setItem('sf_me',u.id);touch();tab=isPrivileged(u)?'alumnos':'hoy';render();payCheck(true);remindCheck(true)}
async function bioEnable(u){
  const cred=await navigator.credentials.create({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),rp:{name:'SF Sistem'},user:{id:new TextEncoder().encode('sf-'+u.id),name:u.email,displayName:u.name},pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'discouraged'},attestation:'none',timeout:60000}});
  const m=bioMap();m[u.id]=b64e(cred.rawId);LS.setItem('sf_bio',JSON.stringify(m));LS.removeItem('sf_bio_no_'+u.id)}
const bioOffer=u=>{if(!bioOK||bioMap()[u.id]||LS.getItem('sf_bio_no_'+u.id))return;
  setTimeout(()=>{if(!me||me.id!==u.id)return;$('#modal').innerHTML=`<div class="card"><h3>Entrá más rápido</h3><p style="color:var(--mut);margin:0 0 14px">¿Querés entrar con <b>Face ID o huella</b> la próxima vez en este celular? Tu contraseña sigue funcionando igual.</p><button class="btn" data-a="bioon" data-v="${u.id}">Activar</button><button class="ghost" style="margin-top:10px" data-a="biono" data-v="${u.id}">Ahora no</button></div>`;$('#modal').hidden=false},900)};

let gv='bar',gr=6;
const mTot=k=>(S.pays||[]).filter(p=>(p.date||'').slice(0,7)===k).reduce((a,p)=>a+p.amount,0);
const fm=n=>n>=1e6?(n/1e6).toFixed(n>=1e7?0:1).replace('.0','')+'M':n>=1e3?Math.round(n/1e3)+'k':''+n;
const mlab=k=>new Date(k+'-01T00:00').toLocaleDateString('es',{month:'short'}).replace('.','');
const dlt=(c,p)=>{const d=c-p,q=p?Math.round(d/p*100):100;return`<span class="dl ${d>0?'up':d<0?'dn':'eq'}">${d>0?'▲':d<0?'▼':'●'} ${p||!c?(d>0?'+':'')+q+'%':'nuevo'}</span>`};
function statsV(){
  const n=gr,all=Array.from({length:n+1},(_,i)=>mTot(mk(pm-n+i))),ks=Array.from({length:n},(_,i)=>mk(pm-n+1+i)),vs=all.slice(1),c=vs[n-1],p=all[n-1],mx=Math.max(...vs,1),
    avg=Math.round(vs.reduce((a,b)=>a+b,0)/n),W=320,L=10,T=24,PH=120,X=i=>L+(W-2*L)/n*(i+.5),Y=v=>T+PH-v/mx*PH,
    tr=i=>all[i+1]>all[i]?'#2dd4bf':all[i+1]<all[i]?'#f43f5e':'#d4af37';
  let g='';
  if(gv==='bar'){const bw=(W-2*L)/n*.6;g=vs.map((v,i)=>{const h=Math.max(v/mx*PH,2),cur=i===n-1;return`<rect class="bb" x="${(X(i)-bw/2).toFixed(1)}" y="${(T+PH-h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="${tr(i)}" fill-opacity="${cur?1:.62}" style="animation-delay:${i*.07}s"/><text class="${cur?'cur':''}" x="${X(i).toFixed(1)}" y="${(T+PH-h-5).toFixed(1)}">${v?fm(v):''}</text>`}).join('')}
  else if(gv==='line'){const pt=vs.map((v,i)=>[X(i),Y(v)]),d=pt.map((q,i)=>(i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' ');
    g=`<defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4af37" stop-opacity=".45"/><stop offset="1" stop-color="#d4af37" stop-opacity="0"/></linearGradient></defs><line x1="${L}" x2="${W-L}" y1="${Y(avg).toFixed(1)}" y2="${Y(avg).toFixed(1)}" stroke="#9a9a9a" stroke-dasharray="4 4" stroke-opacity=".6"/><path class="ar" d="${d} L${pt[n-1][0].toFixed(1)} ${T+PH} L${pt[0][0].toFixed(1)} ${T+PH}Z" fill="url(#ga)"/><path class="lp" pathLength="1" d="${d}" fill="none" stroke="#f0d676" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`+pt.map((q,i)=>`<circle class="dt" cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${i===n-1?5:3.5}" fill="${tr(i)}" stroke="#0a0a0a" stroke-width="1.5" style="animation-delay:${.9+i*.06}s"/><text class="${i===n-1?'cur':''}" x="${q[0].toFixed(1)}" y="${(q[1]-9).toFixed(1)}">${vs[i]?fm(vs[i]):''}</text>`).join('')}
  if(gv!=='cmp')g=`<svg class="cs" viewBox="0 0 320 170" role="img" aria-label="Ganancias por mes"><line x1="${L}" x2="${W-L}" y1="${T+PH}" y2="${T+PH}" stroke="#2a2a2a"/>${g}${ks.map((k,i)=>`<text class="${i===n-1?'cur':''}" x="${X(i).toFixed(1)}" y="160">${mlab(k)}</text>`).join('')}</svg>`;
  else g=ks.map((k,i)=>({k,v:vs[i],p:all[i]})).reverse().map((r,j)=>`<div class="cr"><small>${mlab(r.k)}</small><div class="cb"><i style="width:${(r.v/mx*100).toFixed(1)}%;--d:${j*.07}s"></i></div><b>${fm(r.v)}</b>${dlt(r.v,r.p)}</div>`).join('');
  return`<div class="card" style="margin-top:12px"><div class="seg">${[['bar','Barras'],['line','Línea'],['cmp','Comparar']].map(([k,l])=>`<button class="${gv===k?'on':''}" data-a="gv" data-v="${k}">${l}</button>`).join('')}</div><div class="seg">${[6,12].map(x=>`<button class="${gr===x?'on':''}" data-a="gr" data-v="${x}">${x} meses</button>`).join('')}</div>
    <div class="gh"><div><small>Ganancia de ${mlab(ks[n-1])}</small><b>${NUM(c)} Gs</b></div>${dlt(c,p)}</div><small class="gs">${c===p?'Igual que el mes anterior':(c>p?'Subió ':'Bajó ')+NUM(Math.abs(c-p))+' Gs vs '+mlab(ks[n-2])} · promedio ${NUM(avg)} Gs</small>${g}
    <div class="legend"><small style="--k:#2dd4bf">Subió</small><small style="--k:#f43f5e">Bajó</small>${gv==='line'?'<small style="--k:#9a9a9a">Promedio</small>':''}</div></div>`}

const loadJs=u=>new Promise((ok,no)=>{const e=document.createElement('script');e.src=u;e.onload=ok;e.onerror=no;document.head.appendChild(e)});
async function upImg(f){
  if(!firebase.storage)await loadJs('https://www.gstatic.com/firebasejs/10.12.0/firebase-storage-compat.js');
  const ref=firebase.storage().ref('daily/'+Date.now()+'-'+f.name.replace(/[^\w.-]/g,_=>'_')),t=ref.put(f,{contentType:f.type}),bar=$('#upbar');bar.hidden=false;
  t.on('state_changed',x=>{bar.firstElementChild.style.width=Math.round(x.bytesTransferred/x.totalBytes*100)+'%'});
  await t;return ref.getDownloadURL()}

function pagosV(){
  const key=mk(pm),lbl=new Date(key+'-01T00:00').toLocaleDateString('es',{month:'long',year:'numeric'}),
    ps=(S.pays||[]).filter(p=>(p.date||'').slice(0,7)===key).sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id),
    tot=ps.reduce((a,p)=>a+p.amount,0),exp=PS().filter(u=>u.active!==false).reduce((a,u)=>a+(+u.fee||0),0),pend=Math.max(0,exp-tot),
    st=PS().slice().sort((a,b)=>(a.fee&&a.due?dd(a.due):9e4)-(b.fee&&b.due?dd(b.due):9e4)),
    nt='Notification'in window?Notification.permission:'unsupported';
  return`<h2 class="sec">Ganancias</h2><div class="card"><div class="cal-h"><button data-a="pm" data-v="-1" aria-label="Mes anterior">‹</button><h3 data-a="pm" data-v="0">${lbl}</h3><button data-a="pm" data-v="1" aria-label="Mes siguiente">›</button></div>
    <div class="fin"><div><b>${NUM(tot)}</b><small>Cobrado (Gs)</small></div><div><b>${NUM(exp)}</b><small>Esperado/mes (Gs)</small></div><div><b>${NUM(pend)}</b><small>Pendiente (Gs)</small></div></div></div>${statsV()}
    ${nt==='default'?'<div class="card" style="margin-top:12px"><small class="lb">Recibí un aviso en el teléfono cuando una cuota esté por vencer.</small><button class="btn" data-a="notif">Activar avisos</button></div>':nt==='denied'?'<p class="hint">Los avisos del teléfono están bloqueados. Podés activarlos desde los permisos del navegador.</p>':nt==='granted'?'<p class="hint">Avisos activados ✓ (se envían mientras la app esté abierta o en segundo plano).</p>':''}
    <h2 class="sec">Agregar alumno a pagos</h2><div class="card"><input id="pa-name" placeholder="Nombre del alumno"><small class="lb">Cuota mensual (Guaraníes) · opcional</small><input id="pa-fee" type="number" inputmode="numeric" min="0" step="1000" placeholder="Ej. 150000"><small class="lb">Próximo vencimiento · opcional</small><input id="pa-due" type="date"><button class="btn" data-a="padd">Agregar</button></div><h2 class="sec">Cuotas de alumnos (${st.length})</h2>`+
    (st.map(u=>{const pi=payInfo(u);return`<div class="row ${u.active===false?'off':''}"><div><b>${esc(u.name)}</b><small>${u.fee?NUM(u.fee)+' Gs':'Sin cuota'}${u.due?' · vence '+fmtD(u.due):''}</small>${u.paid>0?`<small class="gold">Pagó ${NUM(u.paid)} · Saldo ${NUM(rem(u))} Gs</small>`:''}</div><span class="tag ${pi.k}">${pi.t}</span><div class="acts"><button data-a="payq" data-v="${u.id}" ${canPay(u)?'':'disabled'}>${canPay(u)?(u.paid>0?'Abonar':'Cobrar'):'Mes pagado ✓'}</button><button data-a="payed" data-v="${u.id}">Cuota</button><button data-a="payn" data-v="${u.id}">Aviso</button><button data-a="pdel" data-v="${u.id}">Quitar</button></div></div>`}).join('')||'<div class="empty">Agregá un alumno arriba.</div>')+
    `<h2 class="sec">Pagos de ${lbl} (${ps.length})</h2><div class="card"><small class="lb">Descargá el balance de ${lbl} con cada pago: nombre, fecha y monto.</small><button class="btn" data-a="balimg" ${ps.length?'':'disabled'}>Descargar balance (imagen)</button><button class="ghost" style="margin-top:10px" data-a="balcsv" ${ps.length?'':'disabled'}>Descargar balance (Excel/CSV)</button></div>`+
    (ps.map(p=>`<div class="row"><div><b>${esc(p.name)}</b><small>${fmtD(p.date)}${p.full===false?' · abono parcial':''}</small></div><b class="gold">${NUM(p.amount)} Gs</b><div class="acts"><button data-a="sharePay" data-v="${p.id}">Comprobante</button><button data-a="payx" data-v="${p.id}">Anular</button></div></div>`).join('')||'<div class="empty">Sin pagos registrados este mes.</div>')};

const stuModal=id=>{const u=S.users.find(x=>x.id===id);if(!u)return;
  $('#modal').innerHTML=`<div class="card"><h3>Editar alumno</h3><small class="lb">Nombre</small><input id="eu-name" placeholder="Nombre completo" value="${esc(u.name)}"><small class="lb">Correo o usuario</small><input id="eu-email" placeholder="Correo electrónico" value="${esc(u.email)}" autocapitalize="none"><small class="lb">Videos que ve este alumno</small><select id="eu-vid"><option value="M" ${u.vid==='F'?'':'selected'}>Videos de hombres</option><option value="F" ${u.vid==='F'?'selected':''}>Videos de mujeres</option></select><button class="btn" data-a="euok" data-v="${id}">Guardar</button><button class="ghost" style="margin-top:10px" data-a="closev">Cancelar</button></div>`;$('#modal').hidden=false};
const feeModal=id=>{const u=PS().find(x=>x.id===id);if(!u)return;
  $('#modal').innerHTML=`<div class="card"><h3>Cuota de ${esc(u.name)}</h3><small class="lb">Nombre</small><input id="fe-name" placeholder="Nombre del alumno" value="${esc(u.name)}"><small class="lb">Cuota mensual (Guaraníes)</small><input id="fe-fee" type="number" inputmode="numeric" min="0" step="1000" placeholder="Ej. 150000" value="${u.fee||''}"><small class="lb">Próximo vencimiento</small><input id="fe-due" type="date" value="${esc(u.due||'')}"><button class="btn" data-a="feeok" data-v="${id}">Guardar</button><button class="ghost" style="margin-top:10px" data-a="closev">Cancelar</button></div>`;$('#modal').hidden=false};
const payModal=id=>{const u=PS().find(x=>x.id===id);if(!u)return;if(!canPay(u))return toast('Este alumno ya pagó este mes');
  $('#modal').innerHTML=`<div class="card"><h3>Registrar pago · ${esc(u.name)}</h3><small class="lb">Monto cobrado (Guaraníes)</small><input id="pq-amt" type="number" inputmode="numeric" min="0" step="1000" placeholder="Ej. 150000" value="${u.fee?(rem(u||''))||'':''}"><small class="lb">Fecha del pago</small><input id="pq-date" type="date" value="${today()}"><small class="lb">${u.fee&&u.due?(u.paid>0?'Ya pagó '+NUM(u.paid)+' de '+NUM(u.fee)+'. Saldo: '+NUM(rem(u))+' Gs. ':'Cuota: '+NUM(u.fee)+' Gs. ')+'Podés cobrar menos y queda el saldo. Al completar la cuota, el vencimiento pasa a '+fmtD(addM(u.due))+'.':'Se creará el próximo vencimiento a 1 mes de la fecha del pago.'}</small><button class="btn" data-a="pqok" data-v="${id}">Registrar pago</button><button class="ghost" style="margin-top:10px" data-a="closev">Cancelar</button></div>`;$('#modal').hidden=false};
const pwModal=id=>{pwId=id;const u=S.users.find(x=>x.id===id);if(!u)return;
  $('#modal').innerHTML=`<div class="card"><h3>Contraseña de ${esc(u.name)}</h3><input id="pw1" type="password" placeholder="Nueva contraseña (mín. 4)" autocomplete="new-password"><input id="pw2" type="password" placeholder="Repetir contraseña" autocomplete="new-password"><label style="display:flex;gap:8px;align-items:center;margin:0 0 12px;color:var(--mut);font-size:14px"><input type="checkbox" data-c="showpw" style="width:auto;margin:0"> Mostrar contraseñas</label><button class="btn" data-a="pwok">Guardar</button>${bioOK&&me&&me.id===id?(bioMap()[id]?`<button class="ghost" style="margin-top:10px" data-a="biooff" data-v="${id}">Desactivar Face ID / huella</button>`:`<button class="ghost" style="margin-top:10px" data-a="bioon" data-v="${id}">Activar Face ID / huella</button>`):''}<button class="ghost" style="margin-top:10px" data-a="closev">Cancelar</button></div>`;$('#modal').hidden=false};
const nav=items=>`<div class="nav">${items.map(([k,l])=>`<button class="${tab===k?'on':''}" data-a="tab" data-v="${k}" style="--c:${NC[k]}"><i class="ic"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="${ICON[k]}"/></svg></i><span>${l}</span>${bdg(k)}</button>`).join('')}</div>`;

function loginV(){return`<div class="login" style="--img:${IMGS[0]}"><i class="spark s1"></i><i class="spark s2"></i><i class="spark s3"></i><i class="spark s4"></i><i class="spark s5"></i><div class="card login-card lcard"><img src="logo.png" alt="SF Sistem"><div class="coach"><b>Sergio Fernández</b><span>Coach</span></div><h1>Plan <b>personalizado</b></h1><p>Ingresá para ver tu rutina</p>${savedBlock()}<div class="fld"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z"/></svg><input id="em" placeholder="Usuario o correo" autocapitalize="none" autocomplete="username" value="${esc((savedAcc()[0]||{}).em||'')}"></div><div class="fld"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.65 10A5.99 5.99 0 0 0 7 6a6 6 0 0 0 0 12 5.99 5.99 0 0 0 5.65-4H17v4h4v-4h2v-4zM7 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/></svg><input id="pw" type="password" placeholder="Contraseña" autocomplete="current-password"></div><button class="btn shine" data-a="login">Entrar</button>${bioBtns()}<p id="lerr" class="lerr" role="alert" hidden></p></div><small class="ver">SF Sistem · versión 3.0.15</small></div>`}

const contactBox=()=>{const c=S.contact||{},ig=igu(c.ig),wa=(c.wa||'').replace(/\D/g,'');return ig||wa?`<div class="cbox"><h3>Contacto</h3><div class="cl">${wa?`<a class="wa" href="https://wa.me/${wa}" target="_blank" rel="noopener" aria-label="WhatsApp"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.6 3.6a1 1 0 0 1-.25 1z"/></svg><span>WhatsApp</span></a>`:''}${ig?`<a class="ig" href="https://instagram.com/${ig}" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5zM17.3 5.9a1.1 1.1 0 1 1-1.1 1.1 1.1 1.1 0 0 1 1.1-1.1z"/></svg><span>Instagram</span></a>`:''}</div></div>`:''};
const anim=()=>{const rm=matchMedia('(prefers-reduced-motion:reduce)').matches;document.querySelectorAll('[data-n]').forEach(el=>{const n=+el.dataset.n,sf=el.dataset.s||'',t0=performance.now();if(rm||!n){el.textContent=n+sf;return}const f=t=>{const p=Math.min(1,(t-t0)/1000);el.textContent=Math.round(n*(1-Math.pow(1-p,3)))+sf;if(p<1)requestAnimationFrame(f)};el.textContent='0'+sf;requestAnimationFrame(f)})};
const igu=v=>{v=(v||'').trim();const m=v.match(/instagram\.com\/([\w.]+)/);return(m?m[1]:v).replace(/^@/,'').replace(/[^\w.]/g,'.')};
let tmpImg=null,tmpUrl=null,cm=0,editX=null,viewStu=null,pwId=null,cu=null;
const isRest=(uid,day)=>{const r=S.rest?.[uid];if(r&&day in r)return r[day];return(day==='Sábado'||day==='Domingo')&&!((S.plans[uid]||{})[day]?.items?.length)};
const planOn=(uid,day)=>isRest(uid,day)?null:(S.plans[uid]||{})[day];
let shown=null;
const dailyCard=()=>{const d=S.daily;if(!d)return'';const tx=`<span class="badge">Del entrenador · ${d.date===today()?'Hoy':esc(d.date)}</span>${d.text?`<p>${esc(d.text)}</p>`:''}`;
  if(d.yt)return`<div class="daily vid"><iframe src="https://www.youtube.com/embed/${esc(d.yt)}?rel=0&playsinline=1" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe><div>${tx}</div></div>`;
  return d.img?`<div class="daily"><img class="bgi" src="${d.img}" alt="" aria-hidden="true"><img class="main" src="${d.img}" alt="Imagen del día"><div>${tx}</div></div>`:''};

let shBlob=null,shUrl=null;
function consData(u,mode){
  const dn=S.done[u.id]||{},ck=(S.ck||{})[u.id]||{},t=today(),n=new Date(),days=[];let lbl,sub,off=0;
  const st=k=>{const has=!!planOn(u.id,DAYS[(new Date(k+'T00:00').getDay()+6)%7])?.items?.length;return{k,has,s:dn[k]?'ok':ck[k]?.length?'part':has&&k<t?'miss':has?'plan':'rest',now:k===t}};
  if(mode==='w'){const mon=new Date(n);mon.setDate(n.getDate()-todayIdx());for(let i=0;i<7;i++){const d=new Date(mon);d.setDate(mon.getDate()+i);days.push({...st(d.toLocaleDateString('en-CA')),d:d.getDate()})}
    const f=x=>new Date(x+'T00:00').toLocaleDateString('es',{day:'numeric',month:'short'});lbl='SEMANAL';sub=f(days[0].k)+' – '+f(days[6].k)}
  else{const b=new Date(n.getFullYear(),n.getMonth()+cm,1),y=b.getFullYear(),m=b.getMonth(),dim=new Date(y,m+1,0).getDate();
    for(let d=1;d<=dim;d++)days.push({...st(`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`),d});
    off=(b.getDay()+6)%7;lbl='MENSUAL';sub=b.toLocaleDateString('es',{month:'long',year:'numeric'});sub=sub[0].toUpperCase()+sub.slice(1)}
  const pl=days.filter(x=>x.has).length,ok=days.filter(x=>x.s==='ok').length,ex=days.reduce((a,x)=>a+(ck[x.k]?.length||0),0);
  let sk=0,c=new Date();if(!dn[t])c.setDate(c.getDate()-1);while(dn[c.toLocaleDateString('en-CA')]){sk++;c.setDate(c.getDate()-1)}
  return{lbl,sub,days,off,pl,ok,ex,sk,mode,pct:pl?Math.min(100,Math.round(ok/pl*100)):0}}
const loadImg=src=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=src});
async function shareImg(u,mode){
  const D=consData(u,mode);try{await document.fonts.load('600 80px Oswald')}catch{}
  const W=1080,H=1920,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d'),F='Oswald,Impact,system-ui,sans-serif',G='#d4af37',G2='#f0d676',cx=W/2;
  const bg=x.createRadialGradient(cx,700,80,cx,1000,1500);bg.addColorStop(0,'#2e2510');bg.addColorStop(0.55,'#120f08');bg.addColorStop(1,'#050505');x.fillStyle=bg;x.fillRect(0,0,W,H);
  x.strokeStyle='rgba(212,175,55,.4)';x.lineWidth=4;x.strokeRect(28,28,W-56,H-56);
  const drawText=(t,y,sz,col,w=600)=>{x.font=w+' '+sz+'px '+F;x.fillStyle=col;x.textAlign='center';x.textBaseline='alphabetic';x.fillText(t,cx,y)};
  const rr=(a,b,w,h,r)=>{x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()};
  try{const lg=await loadImg('logo.png'),k=lg.width/1254,sw=1222*k,sh=554*k,dw=560,dh=dw*sh/sw;x.drawImage(lg,16*k,318*k,sw,sh,cx-dw/2,80,dw,dh)}catch{}
  drawText('MI CONSTANCIA',400,44,G2,600);drawText(D.lbl+' · '+D.sub,462,38,'#cfcfcf',500);
  let nm=u.name.toUpperCase(),fs=100;x.font='700 '+fs+'px '+F;while(x.measureText(nm).width>W-160&&fs>48){fs-=4;x.font='700 '+fs+'px '+F}drawText(nm,572,fs,'#fff',700);
  const dv=x.createLinearGradient(cx-140,0,cx+140,0);dv.addColorStop(0,'transparent');dv.addColorStop(0.5,G);dv.addColorStop(1,'transparent');x.fillStyle=dv;x.fillRect(cx-140,602,280,4);
  const ry=830,R=170;x.lineWidth=36;x.lineCap='round';x.strokeStyle='rgba(255,255,255,.1)';x.beginPath();x.arc(cx,ry,R,0,7);x.stroke();
  if(D.pct>0){const g=x.createLinearGradient(cx-R,ry-R,cx+R,ry+R);g.addColorStop(0,G2);g.addColorStop(1,G);x.save();x.strokeStyle=g;x.shadowColor='rgba(212,175,55,.7)';x.shadowBlur=30;x.beginPath();x.arc(cx,ry,R,-Math.PI/2,-Math.PI/2+Math.PI*2*D.pct/100);x.stroke();x.restore()}
  drawText(D.pct+'%',ry+46,130,'#fff',700);drawText('de cumplimiento',1064,34,'#bdbdbd',500);
  [['Racha',D.sk],['Días completos',D.ok+'/'+D.pl],['Ejercicios',D.ex]].forEach(([l,v],i)=>{const a=75+i*320;rr(a,1110,290,150,26);x.fillStyle='rgba(255,255,255,.05)';x.fill();x.strokeStyle='rgba(212,175,55,.45)';x.lineWidth=3;x.stroke();
    x.textAlign='center';x.font='700 80px '+F;x.fillStyle=G2;x.fillText(v,a+145,1190);x.font='500 28px '+F;x.fillStyle='#a8a8a8';x.fillText(l,a+145,1236)});
  const dot=(px,py,r,d,chk)=>{const s=d.s;x.save();x.beginPath();x.arc(px,py,r,0,7);
    if(s==='ok'){const g=x.createLinearGradient(px-r,py-r,px+r,py+r);g.addColorStop(0,G2);g.addColorStop(1,G);x.fillStyle=g;x.shadowColor='rgba(212,175,55,.6)';x.shadowBlur=16;x.fill();x.shadowBlur=0}
    else{x.fillStyle=s==='part'?'rgba(212,175,55,.18)':'rgba(255,255,255,.05)';x.fill();x.lineWidth=4;x.strokeStyle=s==='miss'?'#f43f5e':s==='part'?G:s==='plan'?'rgba(212,175,55,.5)':'rgba(255,255,255,.14)';x.stroke()}
    if(s==='ok'&&chk){x.strokeStyle='#111';x.lineWidth=r*.17;x.lineCap='round';x.lineJoin='round';x.beginPath();x.moveTo(px-r*.38,py+r*.02);x.lineTo(px-r*.1,py+r*.32);x.lineTo(px+r*.42,py-r*.3);x.stroke()}
    else{x.fillStyle=s==='ok'?'#111':s==='miss'?'#fda4af':'#9a9a9a';x.font='600 '+Math.round(r*.78)+'px '+F;x.textAlign='center';x.textBaseline='middle';x.fillText(d.d,px,py+2)}
    if(d.now){x.beginPath();x.arc(px,py,r+9,0,7);x.strokeStyle='#2dd4bf';x.lineWidth=4;x.stroke()}x.restore()};
  const LT=['L','M','X','J','V','S','D'];
  if(mode==='w'){D.days.forEach((d,i)=>{const px=cx+(i-3)*134;dot(px,1480,52,d,true);drawText(LT[i],1590,34,'#9a9a9a',500)});drawText('Constancia = resultados',1710,58,G2,600)}
  else{LT.forEach((l,i)=>tx2(l,cx+(i-3)*120,1336));D.days.forEach((d,i)=>{const p=D.off+i;dot(cx+((p%7)-3)*120,1400+Math.floor(p/7)*76,31,d,false)})}
  function tx2(t,px,y){x.font='600 30px '+F;x.fillStyle='#9a9a9a';x.textAlign='center';x.fillText(t,px,y)}
  const coach=(S.users.find(z=>isPrivileged(z))||{}).name||'Sergio Fernández',ig=igu((S.contact||{}).ig);
  drawText('SF SISTEM · Coach '+coach,1846,34,G2,600);if(ig)drawText('@'+ig,1880,28,'#9a9a9a',500);
  return new Promise((ok,no)=>cv.toBlob(b=>b?ok(b):no(new Error('blob')),'image/png'))}
function shModal(bl){shBlob=bl;if(shUrl)URL.revokeObjectURL(shUrl);shUrl=URL.createObjectURL(bl);
  $('#modal').innerHTML=`<div class="card"><h3>Compartir en estados</h3><img class="spv" src="${shUrl}" alt="Vista previa"><button class="btn" data-a="shok">Compartir</button><button class="ghost" style="margin-top:10px" data-a="shdl">Descargar imagen</button><button class="ghost" style="margin-top:10px" data-a="closev">Cerrar</button></div>`;$('#modal').hidden=false}
const dlSh=()=>{if(!shUrl)return;const l=document.createElement('a');l.href=shUrl;l.download='constancia-sf-sistem.png';document.body.appendChild(l);l.click();l.remove();toast('Imagen descargada')};

async function generatePayReceiptImg(p){
  try{await document.fonts.load('600 80px Oswald')}catch{}
  const W=1080,H=1440,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d'),F='Oswald,Impact,system-ui,sans-serif',G='#d4af37',G2='#f0d676',cx=W/2;
  
  const bg=x.createRadialGradient(cx,500,100,cx,800,1200);bg.addColorStop(0,'#1e1910');bg.addColorStop(0.6,'#110f0a');bg.addColorStop(1,'#050505');x.fillStyle=bg;x.fillRect(0,0,W,H);
  x.strokeStyle='rgba(212,175,55,.5)';x.lineWidth=6;x.strokeRect(36,36,W-72,H-72);

  const drawText=(t,y,sz,col,w=600)=>{x.font=w+' '+sz+'px '+F;x.fillStyle=col;x.textAlign='center';x.textBaseline='alphabetic';x.fillText(t,cx,y)};
  
  try{const lg=await loadImg('logo.png'),dw=280,dh=280;x.drawImage(lg,cx-dw/2,90,dw,dh)}catch{}
  
  drawText('SF SISTEM',410,50,G2,700);
  drawText('COMPROBANTE DE PAGO',480,56,'#ffffff',700);
  
  const dv=x.createLinearGradient(cx-200,0,cx+200,0);dv.addColorStop(0,'transparent');dv.addColorStop(0.5,G);dv.addColorStop(1,'transparent');x.fillStyle=dv;x.fillRect(cx-200,530,400,4);

  const boxX=90,boxY=590,boxW=900,boxH=440,r=24;
  x.fillStyle='rgba(255,255,255,.04)';x.beginPath();x.roundRect(boxX,boxY,boxW,boxH,r);x.fill();
  x.strokeStyle='rgba(212,175,55,.3)';x.lineWidth=2;x.beginPath();x.roundRect(boxX,boxY,boxW,boxH,r);x.stroke();

  x.textAlign='left';
  x.font='500 32px '+F;x.fillStyle='#b5b5b5';x.fillText('ALUMNO:',boxX+60,boxY+90);
  x.font='700 42px '+F;x.fillStyle='#ffffff';x.fillText(p.name.toUpperCase(),boxX+60,boxY+150);

  x.font='500 32px '+F;x.fillStyle='#b5b5b5';x.fillText('FECHA DE PAGO:',boxX+60,boxY+250);
  x.font='700 38px '+F;x.fillStyle=G2;x.fillText(fmtD(p.date),boxX+60,boxY+310);

  x.font='500 32px '+F;x.fillStyle='#b5b5b5';x.fillText('ESTADO:',boxX+580,boxY+250);
  x.font='700 38px '+F;x.fillStyle='#2dd4bf';x.fillText('VERIFICADO ✓',boxX+580,boxY+310);

  drawText('¡Gracias por tu pago!',1110,48,G2,700);
  drawText('Estás invirtiendo por tu salud.',1176,38,'#e0e0e0',500);

  const coach=(S.users.find(z=>isPrivileged(z))||{}).name||'Sergio Fernández';
  drawText('Coach '+coach,1330,30,'#8a8a8a',500);

  return new Promise((ok,no)=>cv.toBlob(b=>b?ok(b):no(new Error('blob')),'image/png'))}

async function sharePaymentReceipt(p){
  toast('Generando comprobante...');
  try{
    const blob=await generatePayReceiptImg(p);
    const f=new File([blob],'comprobante-pago.png',{type:'image/png'});
    if(navigator.canShare&&navigator.canShare({files:[f]})){
      await navigator.share({files:[f],title:'Comprobante de Pago · SF Sistem',text:'¡Gracias por tu pago! Estás invirtiendo por tu salud.'});
    }else{
      const url=URL.createObjectURL(blob);
      const l=document.createElement('a');l.href=url;l.download='comprobante-pago.png';document.body.appendChild(l);l.click();l.remove();
      toast('Comprobante descargado');
    }
  }catch(e){console.error(e);toast('No se pudo generar el comprobante')}
}

async function generatePendingImg(name,amount,date){
  try{await document.fonts.load('600 80px Oswald')}catch{}
  const W=1080,H=1440,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d'),F='Oswald,Impact,system-ui,sans-serif',G='#d4af37',G2='#f0d676',cx=W/2;
  const bg=x.createRadialGradient(cx,500,100,cx,800,1200);bg.addColorStop(0,'#1e1910');bg.addColorStop(0.6,'#110f0a');bg.addColorStop(1,'#050505');x.fillStyle=bg;x.fillRect(0,0,W,H);
  x.strokeStyle='rgba(212,175,55,.5)';x.lineWidth=6;x.strokeRect(36,36,W-72,H-72);
  const drawText=(t,y,sz,col,w=600)=>{x.font=w+' '+sz+'px '+F;x.fillStyle=col;x.textAlign='center';x.textBaseline='alphabetic';x.fillText(t,cx,y)};
  try{const lg=await loadImg('logo.png');x.drawImage(lg,cx-140,90,280,280)}catch{}
  drawText('SF SISTEM',410,50,G2,700);
  drawText('AVISO DE PAGO PENDIENTE',480,52,'#ffffff',700);
  const dv=x.createLinearGradient(cx-200,0,cx+200,0);dv.addColorStop(0,'transparent');dv.addColorStop(0.5,G);dv.addColorStop(1,'transparent');x.fillStyle=dv;x.fillRect(cx-200,530,400,4);
  const boxX=90,boxY=590,boxW=900,boxH=440,r=24;
  x.fillStyle='rgba(255,255,255,.04)';x.beginPath();x.roundRect(boxX,boxY,boxW,boxH,r);x.fill();
  x.strokeStyle='rgba(212,175,55,.3)';x.lineWidth=2;x.beginPath();x.roundRect(boxX,boxY,boxW,boxH,r);x.stroke();
  x.textAlign='left';
  x.font='500 32px '+F;x.fillStyle='#b5b5b5';x.fillText('ALUMNO:',boxX+60,boxY+90);
  let nm=String(name||'').toUpperCase(),fs=42;x.font='700 '+fs+'px '+F;while(x.measureText(nm).width>boxW-120&&fs>24){fs-=2;x.font='700 '+fs+'px '+F}
  x.fillStyle='#ffffff';x.fillText(nm,boxX+60,boxY+150);
  x.font='500 32px '+F;x.fillStyle='#b5b5b5';x.fillText('VENCIMIENTO:',boxX+60,boxY+250);
  x.font='700 38px '+F;x.fillStyle=G2;x.fillText(date?fmtD(date):'—',boxX+60,boxY+310);
  x.font='500 32px '+F;x.fillStyle='#b5b5b5';x.fillText('MONTO:',boxX+500,boxY+250);
  x.font='700 38px '+F;x.fillStyle=G2;x.fillText(NUM(amount)+' Gs',boxX+500,boxY+310);
  x.font='500 32px '+F;x.fillStyle='#b5b5b5';x.fillText('ESTADO:',boxX+60,boxY+385);
  x.font='700 38px '+F;x.fillStyle='#f59e0b';x.fillText('PENDIENTE DE PAGO',boxX+270,boxY+385);
  drawText('Te esperamos para seguir entrenando.',1110,44,G2,700);
  drawText('¡Gracias por invertir en tu salud!',1176,38,'#e0e0e0',500);
  const coach=(S.users.find(z=>isPrivileged(z))||{}).name||'Sergio Fernández';
  drawText('Coach '+coach,1330,30,'#8a8a8a',500);
  return new Promise((ok,no)=>cv.toBlob(b=>b?ok(b):no(new Error('blob')),'image/png'))}

const pendModal=id=>{const u=PS().find(x=>x.id===id);if(!u)return;
  const amt=rem(u)||u.fee||'';
  $('#modal').innerHTML=`<div class="card"><h3>Aviso de pago · ${esc(u.name)}</h3><small class="lb">Monto pendiente (Guaraníes)</small><input id="pn-amt" type="number" inputmode="numeric" min="0" step="1000" placeholder="Ej. 150000" value="${amt}"><small class="lb">Fecha de vencimiento</small><input id="pn-date" type="date" value="${esc(u.due||today())}"><button class="btn" data-a="pnshare" data-v="${id}">Compartir aviso</button><button class="ghost" style="margin-top:10px" data-a="pndl" data-v="${id}">Descargar imagen</button><button class="ghost" style="margin-top:10px" data-a="closev">Cancelar</button></div>`;$('#modal').hidden=false};

async function sendPending(id,download){
  const u=PS().find(x=>x.id===id);if(!u)return;
  const amt=Math.round(+val('pn-amt')),dt=val('pn-date');
  if(!(amt>0))return toast('Ingresá el monto');if(!dt)return toast('Elegí la fecha');
  toast('Generando aviso...');
  try{
    const blob=await generatePendingImg(u.name,amt,dt),f=new File([blob],'aviso-pago-sf-sistem.png',{type:'image/png'});
    if(!download&&navigator.canShare&&navigator.canShare({files:[f]})){
      await navigator.share({files:[f],title:'Aviso de pago pendiente · SF Sistem',text:'Hola '+u.name.split(' ')[0]+', te recordamos que tenés un pago pendiente de '+NUM(amt)+' Gs con vencimiento el '+fmtD(dt)+'.'});
    }else{
      const url=URL.createObjectURL(blob),l=document.createElement('a');l.href=url;l.download='aviso-pago-sf-sistem.png';document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
      toast('Aviso descargado');
    }
  }catch(e){if(e&&e.name==='AbortError')return;console.error(e);toast('No se pudo generar el aviso')}
}

const balData=()=>{const key=mk(pm),lbl=new Date(key+'-01T00:00').toLocaleDateString('es',{month:'long',year:'numeric'}),
  ps=(S.pays||[]).filter(p=>(p.date||'').slice(0,7)===key).sort((a,b)=>a.date.localeCompare(b.date)||a.id-b.id),
  tot=ps.reduce((a,p)=>a+p.amount,0),exp=PS().filter(u=>u.active!==false).reduce((a,u)=>a+(+u.fee||0),0);
  return{key,lbl,ps,tot,exp,pend:Math.max(0,exp-tot)}};
const saveBlob=(blob,name)=>{const url=URL.createObjectURL(blob),l=document.createElement('a');l.href=url;l.download=name;document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(url),4000)};

async function generateBalanceImg(d){
  try{await document.fonts.load('600 40px Oswald')}catch{}
  const W=1080,RH=64,top=520,n=d.ps.length,H=top+Math.max(n,1)*RH+330,cv=document.createElement('canvas');cv.width=W;cv.height=H;
  const x=cv.getContext('2d'),F='Oswald,Impact,system-ui,sans-serif',G='#d4af37',G2='#f0d676',cx=W/2;
  const bg=x.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#1e1910');bg.addColorStop(0.4,'#110f0a');bg.addColorStop(1,'#050505');x.fillStyle=bg;x.fillRect(0,0,W,H);
  x.strokeStyle='rgba(212,175,55,.5)';x.lineWidth=6;x.strokeRect(36,36,W-72,H-72);
  const T=(t,px,y,sz,col,w=600,al='left')=>{x.font=w+' '+sz+'px '+F;x.fillStyle=col;x.textAlign=al;x.textBaseline='alphabetic';x.fillText(t,px,y)};
  try{const lg=await loadImg('logo.png');x.drawImage(lg,cx-110,70,220,220)}catch{}
  T('SF SISTEM',cx,330,46,G2,700,'center');
  T('BALANCE DE PAGOS',cx,392,54,'#ffffff',700,'center');
  T(d.lbl.toUpperCase(),cx,440,36,G2,600,'center');
  x.fillStyle=G;x.fillRect(cx-200,465,400,3);
  // encabezado de tabla
  const c1=90,c2=250,c3=W-90;
  x.fillStyle='rgba(212,175,55,.15)';x.fillRect(70,top-50,W-140,RH-8);
  T('FECHA',c1,top-8,28,G2,700);T('ALUMNO',c2,top-8,28,G2,700);T('MONTO (Gs)',c3,top-8,28,G2,700,'right');
  if(!n)T('Sin pagos registrados este mes',cx,top+50,32,'#b5b5b5',500,'center');
  d.ps.forEach((p,i)=>{const y=top+i*RH+RH-18;
    if(i%2===0){x.fillStyle='rgba(255,255,255,.04)';x.fillRect(70,top+i*RH-4,W-140,RH-8)}
    T(fmtD(p.date),c1,y,30,'#e0e0e0',500);
    let nm=String(p.name||'')+(p.full===false?' (abono)':''),fs=32;x.font='600 '+fs+'px '+F;while(x.measureText(nm).width>400&&fs>20){fs-=2;x.font='600 '+fs+'px '+F}
    T(nm,c2,y,fs,'#ffffff',600);
    T(NUM(p.amount),c3,y,32,G2,700,'right')});
  const by=top+Math.max(n,1)*RH+40;
  x.fillStyle=G;x.fillRect(70,by,W-140,3);
  T('PAGOS REGISTRADOS',c1,by+60,30,'#b5b5b5',500);T(String(n),c3,by+60,34,'#ffffff',700,'right');
  T('TOTAL COBRADO',c1,by+120,34,G2,700);T(NUM(d.tot)+' Gs',c3,by+120,40,G2,700,'right');
  T('Esperado: '+NUM(d.exp)+' Gs   ·   Pendiente: '+NUM(d.pend)+' Gs',cx,by+185,28,'#b5b5b5',500,'center');
  T('Generado el '+fmtD(today()),cx,by+235,24,'#8a8a8a',500,'center');
  return new Promise((ok,no)=>cv.toBlob(b=>b?ok(b):no(new Error('blob')),'image/png'))}

const routModal=id=>{const u=S.users.find(z=>z.id===id);if(!u)return;const d=todayIdx();
  const days=DAYS.map((n,i)=>{const t=planOn(u.id,n),its=(t?.items||[]).map(x=>exFor(u.id,x,n)).filter(Boolean);
    return`<details ${i===d?'open':''}><summary><span>${n}</span><small>${t?esc(t.title)+' · '+its.length+' ejercicios':'Descanso'}</small></summary><div>${byZone(its)||'<div class="empty">'+dbl()+'Sin ejercicios</div>'}</div></details>`}).join('');
  $('#modal').innerHTML=`<div class="card"><h3>Rutina de ${esc(u.name)}</h3><small class="lb">Así la ve el alumno en su semana.</small>${days}<button class="ghost" style="margin-top:10px" data-a="closev">Cerrar</button></div>`;$('#modal').hidden=false};

function calV(u=activeUser()){
  cu=u;
  const p=S.plans[u.id]||{},dn=S.done[u.id]||{},ck=(S.ck||{})[u.id]||{},n=new Date(),b=new Date(n.getFullYear(),n.getMonth()+cm,1),y=b.getFullYear(),m=b.getMonth(),dim=new Date(y,m+1,0).getDate(),off=(b.getDay()+6)%7,t=today();
  let cells='<i></i>'.repeat(off),cnt=0,pl=0,ex=0;
  for(let d=1;d<=dim;d++){const k=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,has=planOn(u.id,DAYS[(new Date(y,m,d).getDay()+6)%7])?.items?.length,ok=dn[k],c=ck[k]?.length||0;if(ok)cnt++;if(has)pl++;ex+=c;
    cells+=`<div class="cd ${ok?'ok':''} ${c&&!ok?'part':''} ${k===t?'now':''} ${has&&!ok&&!c&&k<t?'miss':''} ${has?'plan':''}" data-a="cd" data-v="${k}">${d}</div>`}
  let st=0,c=new Date();if(!dn[t])c.setDate(c.getDate()-1);while(dn[c.toLocaleDateString('en-CA')]){st++;c.setDate(c.getDate()-1)}
  const tot=Object.values(dn).filter(Boolean).length,pct=pl?Math.min(100,Math.round(cnt/pl*100)):0;
  return`<h2 class="sec">Progreso</h2><div class="stats"><div><b data-n="${st}">${st}</b><small>Racha</small></div><div><b data-n="${cnt}">${cnt}</b><small>Este mes</small></div><div><b data-n="${ex}">${ex}</b><small>Ejercicios</small></div><div><b data-n="${tot}">${tot}</b><small>Total</small></div></div>
  <div class="card cal"><div class="calhero"><div><b>Constancia = resultados</b><small>Cada mancuerna cuenta</small></div><div class="ring"><svg viewBox="0 0 80 80"><circle class="bg" cx="40" cy="40" r="34"/><circle class="fg" cx="40" cy="40" r="34" style="--off:${(214*(1-pct/100)).toFixed(1)}"/></svg><span><b data-n="${pct}" data-s="%">${pct}%</b></span></div></div>
  <div class="cal-h"><button data-a="cal" data-v="-1" aria-label="Mes anterior">‹</button><h3 data-a="cal" data-v="0">${b.toLocaleDateString('es',{month:'long',year:'numeric'})}</h3><button data-a="cal" data-v="1" aria-label="Mes siguiente">›</button></div>
  <small>Cumplimiento del mes: ${pct}%</small><div class="bar"><i class="grow" style="width:${pct}%"></i></div>
  <div class="cg">${['L','M','X','J','V','S','D'].map(x=>`<span>${x}</span>`).join('')}${cells}</div>
  ${isPrivileged(activeUser())&&!viewingAsStudent?'<p class="hint">Tocá un día para marcarlo o desmarcarlo como completado.</p>':''}<div class="legend"><small style="--k:var(--gold)">Completo</small><small style="--k:rgba(212,175,55,.35)">Parcial</small><small style="--k:var(--bad)">Faltó</small><small style="--k:var(--ok)">Hoy</small></div></div><h2 class="sec">Compartir en estados</h2><div class="card"><small class="lb">Creá una imagen con la constancia y el logo de SF Sistem para subir a WhatsApp o Instagram.</small><div class="g2"><button class="btn" data-a="shw">Semanal</button><button class="btn" data-a="shm">Mensual</button></div></div>`;
}

function exCard(e,k){const actU = activeUser(), ck=k&&(((S.ck||{})[actU.id]||{})[today()]||[]).includes(e.id);
return`<div class="ex ${ck?'chk':''}" style="--c:${col(e.zone)}"><div class="exh"><div class="exi"><div class="exn"><b>${esc(e.name)}</b><small>${esc(e.zone)}</small></div><div class="chips"><span>${esc(e.sets)} series</span><span>${esc(e.reps)} reps</span>${e.note?`<span>${esc(e.note)}</span>`:''}</div></div>${vsm(e)}</div>${e.desc?`<p class="desc">${esc(e.desc)}</p>`:''}${k?`<button class="okb ${ck?'on':''}" data-a="ck" data-v="${e.id}"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg><em>${ck?'Hecho':'Marcar como hecho'}</em></button>`:''}</div>`;}
const grp=l=>[...new Set(l.map(e=>e.zone))].flatMap(k=>l.filter(e=>e.zone===k));
const zh=(e,i,a)=>i&&a[i-1].zone===e.zone?'':`<h3 class="zone" style="--c:${col(e.zone)}">${esc(e.zone)}<small>${a.filter(x=>x.zone===e.zone).length} ejercicios</small></h3>`;
const byZone=(l,k)=>grp(l).map((e,i,a)=>zh(e,i,a)+exCard(e,k)).join('');

function studentV(){
  const actU = activeUser(), p=S.plans[actU.id]||{},d=todayIdx();
  let body;
  if(tab==='hoy'){
    const t=planOn(actU.id,DAYS[d]),items=(t?.items||[]).map(x=>exFor(actU.id,x,DAYS[d])).filter(Boolean),ok=(S.done[actU.id]||{})[today()];
    body=dailyCard()+(items.length?byZone(items,1)+`<button class="btn ${ok?'done':''}" data-a="fin">${ok?'Rutina terminada':'Marcar como terminada'}</button>`:`<div class="hero"><h2>Día libre</h2></div><div class="empty">${dbl()}Descansar también es entrenar.</div>`);
  }else if(tab==='progreso')body=calV();else body=`<h2 class="sec">Tu semana</h2>`+DAYS.map((n,i)=>{const t=planOn(actU.id,n),its=(t?.items||[]).map(x=>exFor(actU.id,x,n)).filter(Boolean);
    return`<details class="${i===d?'today':''}" ${i===d?'open':''}><summary><span>${n}</span><small>${t?esc(t.title)+' · '+its.length+' ejercicios':'Descanso'}</small></summary><div>${byZone(its)||'<div class="empty">'+dbl()+'Sin ejercicios</div>'}</div></details>`}).join('');
  return hdr()+`<main id="view">${body}${tab==='progreso'?'':contactBox()}</main>`+nav([['hoy','Hoy'],['semana','Semana'],['progreso','Progreso']]);
}

const APP_URL='https://sfsistemv3.vercel.app/';
const alumnos=()=>S.users.filter(u=>u.role==='alumno');
const uRow=u=>{const isTech=u.role==='tecnico';return`<div class="row ${u.active?'':'off'}"><div><b>${esc(u.name)}</b><small>${esc(u.email)} · <b>${u.role.toUpperCase()}</b></small>${u.role==='alumno'&&u.active&&noRoutine(u)?'<small class="norut">⚠ Sin rutina asignada</small>':''}</div><span class="tag ${u.active?'ok':'bad'}">${u.active?'Activo':'Suspendido'}</span><div class="acts"><button data-a="edu" data-v="${u.id}">Editar</button>${isTech?'<small style="color:var(--gold);font-size:11px;padding:4px">Protegido</small>':`<button data-a="tog" data-v="${u.id}">${u.active?'Suspender':'Activar'}</button>`}${u.role==='alumno'?`<button data-a="rut" data-v="${u.id}">Rutina</button><button data-a="prog" data-v="${u.id}">Progreso</button>`:''}${isTech?'':`<button data-a="pass" data-v="${u.id}">Contraseña</button><button data-a="del" data-v="${u.id}">Eliminar</button>`}</div></div>`};
const staffL=()=>S.users.filter(u=>u.role!=='alumno'),stuL=()=>S.users.filter(u=>u.role==='alumno');
function adminV(){
  let b='';const XV=editX?exById(editX):null;
  if(tab==='alumnos')b=`${payBanner()}${routBanner()}<h2 class="sec">Control de Sistema</h2><div class="card"><button class="btn" data-a="toggleMaint">${S.maint ? 'Desactivar Mantenimiento Alumnos' : 'Activar Mantenimiento Alumnos'}</button></div><h2 class="sec">Link para los alumnos</h2><div class="card"><small class="lb">Pasá este link a tus alumnos para que abran y descarguen la app.</small><input id="app-link" readonly value="${APP_URL}" onfocus="this.select()"><button class="btn" data-a="copylink">Copiar link</button><button class="ghost" style="margin-top:10px" data-a="sharelink">Compartir link</button></div><h2 class="sec">Respaldo de datos</h2><div class="card"><small class="lb">Descargá una copia de todos tus datos (usuarios, planes, pagos…) o restaurá una anterior.</small><button class="btn" data-a="exportb">Descargar respaldo</button><small class="lb" style="margin-top:14px;display:block">Restaurar desde un archivo de respaldo</small><input type="file" accept=".json,application/json" data-c="impb"></div><h2 class="sec">Mis contactos</h2><div class="card"><input id="c-ig" placeholder="Tu Instagram (@usuario)" value="${esc(S.contact?.ig)}" autocapitalize="none"><input id="c-wa" placeholder="Tu WhatsApp con código de país (ej. 595981123456)" inputmode="tel" value="${esc(S.contact?.wa)}"><button class="btn" data-a="savec">Guardar contactos</button></div><h2 class="sec">Nuevo usuario / personal / alumno</h2><div class="card"><input id="n-name" placeholder="Nombre completo"><input id="n-em" placeholder="Correo o usuario" autocapitalize="none"><input id="n-pw" placeholder="Contraseña inicial"><select id="n-role"><option value="alumno">Alumno</option><option value="tecnico">Técnico (Poder Admin)</option><option value="admin">Administrador</option></select><select id="n-vid"><option value="M">Videos de hombres</option><option value="F">Videos de mujeres</option></select><button class="btn" data-a="addu">Crear usuario</button></div><h2 class="sec">Personal · Admin y Técnicos (${staffL().length})</h2>`+
    (staffL().map(uRow).join('')||'<div class="empty">Sin personal.</div>')+
    `<h2 class="sec">Alumnos (${stuL().length})</h2>`+
    (stuL().map(uRow).join('')||'<div class="empty">Todavía no hay alumnos.</div>');
  if(tab==='planes'){
    const st=alumnos();if(!selStu||!st.find(u=>u.id===selStu))selStu=st[0]?.id;
    if(!st.length)b='<div class="empty">Creá un alumno primero.</div>';
    else{const t=(S.plans[selStu]||{})[DAYS[selDay]]||{title:'',items:[]},zs=[...new Set(S.ex.map(e=>e.zone))];
      b=`<h2 class="sec">Plan de entrenamiento</h2><select data-c="stu">${st.map(u=>`<option value="${u.id}" ${u.id===selStu?'selected':''}>${esc(u.name)}</option>`).join('')}</select>
      <div class="chipbar">${DAYS.map((n,i)=>`<button class="${i===selDay?'on':''}" data-a="day" data-v="${i}">${n.slice(0,3)}${isRest(selStu,n)?' ☾':((S.plans[selStu]||{})[n]?.items?.length?' ●':'')}</button>`).join('')}</div>
      <label class="rest ${isRest(selStu,DAYS[selDay])?'on':''}"><input type="checkbox" data-c="rest" ${isRest(selStu,DAYS[selDay])?'checked':''}> Día de descanso (${DAYS[selDay]})</label>
      <input id="p-title" placeholder="Título del día (ej. Pecho y tríceps)" value="${esc(t.title)}" data-c="title">
      ${t.items.map((id,i)=>{const e=exFor(selStu,id,DAYS[selDay]);return e?`<div class="row"><div><b>${esc(e.name)}</b><small>${esc(e.zone)} ·${esc(e.sets)}x${esc(e.reps)}${e.note?' · '+esc(e.note):''}${e._ov?' · <span class="gold">✎ Editado para este alumno (${DAYS[selDay]})</span>':''}</small></div>${vadm(e)}<div class="acts"><button data-a="pedit" data-v="${i}">Editar</button><button data-a="rm" data-v="${i}">Quitar</button></div></div>`:''}).join('')||'<div class="empty">Sin ejercicios este día.</div>'}
      <select data-c="add"><option value="">+ Agregar ejercicio</option>${zs.map(z=>`<optgroup label="${esc(z)}">${S.ex.filter(e=>e.zone===z).map(e=>`<option value="${e.id}">${esc(e.name)}</option>`).join('')}</optgroup>`).join('')}</select>
      <button class="ghost" data-a="clear">Vaciar este día</button>`}
  }
  if(tab==='ejercicios')b=`<h2 class="sec">${XV?'Editar ejercicio':'Nuevo ejercicio'}</h2><div class="card"><div class="g2"><input id="x-zone" placeholder="Zona (ej. Pecho)" value="${esc(XV?.zone)}"><input id="x-name" placeholder="Nombre" value="${esc(XV?.name)}"></div><div class="g2"><input id="x-sets" placeholder="Series" inputmode="numeric" value="${esc(XV?.sets)}"><input id="x-reps" placeholder="Repeticiones" value="${esc(XV?.reps)}"></div><input id="x-note" placeholder="Nota (opcional: RPE, cadencia…)" value="${esc(XV?.note)}"><textarea id="x-desc" placeholder="Descripción (opcional): cómo se hace, consejos, errores comunes…">${esc(XV?.desc)}</textarea><small class="lb">♂ Video para HOMBRES (opcional)</small><input id="x-video" placeholder="Link de YouTube (hombres)" value="${esc(XV?.video)}"><div id="vprev">${yid(XV?.video)?vpv(yid(XV.video)):''}</div><small class="lb">♀ Video para MUJERES (opcional)</small><input id="x-videoF" placeholder="Link de YouTube (mujeres)" value="${esc(XV?.videoF)}"><div id="vprevF">${yid(XV?.videoF)?vpv(yid(XV.videoF)):''}</div><button class="btn" data-a="addx">${XV?'Guardar cambios':'Guardar ejercicio'}</button><button class="ghost" style="margin-top:10px" data-a="cancx">Cancelar edición</button></div><h2 class="sec">Catálogo (${S.ex.length})</h2>`+grp(S.ex).map((e,i,a)=>zh(e,i,a)+`<div class="row"><div><b>${esc(e.name)}</b><small style="color:${col(e.zone)}">${esc(e.zone)} · ${esc(e.sets)}x${esc(e.reps)}</small></div>${vadm(e)}<div class="acts"><button data-a="edx" data-v="${e.id}">Editar</button><button data-a="delx" data-v="${e.id}">Eliminar</button></div></div>`).join('');
  if(tab==='pagos')b=pagosV();
  if(tab==='progA'){const u=S.users.find(x=>x.id===viewStu);b=u?`<button class="ghost" data-a="back">‹ Volver a usuarios</button><h2 class="sec">${esc(u.name)}</h2>`+calV(u):'<div class="empty">Usuario no encontrado.</div>'}
  if(tab==='cartelera')b=`<h2 class="sec">Foto o link de YouTube del día</h2><div class="card"><input type="file" accept="image/*" data-c="img"><img id="dprev" class="dprev" alt="" hidden><div class="bar" id="upbar" hidden><i style="width:0"></i></div><small class="lb">O pegá un link de YouTube</small><input id="d-yt" placeholder="https://youtube.com/watch?v=..." autocapitalize="none"><input id="d-text" placeholder="Mensaje del día (opcional)" value="${esc(S.daily?.text)}"><button class="btn" data-a="pubd">Publicar para los alumnos</button>${S.daily?'<button class="ghost" style="margin-top:10px" data-a="deld">Quitar lo publicado</button>':''}</div>`+(S.daily?`<h2 class="sec">Publicada ahora</h2>${dailyCard()}`:'');
  return hdr()+`<main id="view">${b}</main>`+nav([['alumnos','Usuarios'],['pagos','Pagos'],['planes','Planes'],['ejercicios','Ejercicios'],['cartelera','Del día']]);
}

const val=id=>$('#'+id).value.trim();
const planDay=()=>{(S.plans[selStu]??={});return S.plans[selStu][DAYS[selDay]]??={title:'',items:[]}};
document.addEventListener('click',async ev=>{
  if(ev.target.id==='modal'){closeM();return}
  const b=ev.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,v=b.dataset.v;if(!me&&!['login','pickem','forgetem','biologin'].includes(a))return;
  if(a==='login'){const em=val('em').toLowerCase(),raw=$('#pw').value,h=await sha(raw),h2=await sha(raw.trim());
    const u=S.users.find(u=>u.email.toLowerCase()===em&&(u.pass===h||u.pass===h2));
    if(!u)return lerr('Usuario o contraseña incorrectos');
    if(!u.active)return lerr('Cuenta suspendida. Hablá con tu entrenador.');
    saveAcc(u);enterUser(u);bioOffer(u);return}
  if(a==='toggleViewAsStudent'){viewingAsStudent=!viewingAsStudent;tab=viewingAsStudent?'hoy':'alumnos';render();toast(viewingAsStudent?'Modo alumno activado (Vista de prueba)':'Volviendo a modo técnico');return}
  if(a==='exportb'){const l=document.createElement('a');l.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,2)],{type:'application/json'}));l.download='respaldo-sf-sistem-'+today()+'.json';document.body.appendChild(l);l.click();l.remove();return toast('Respaldo descargado')}
  if(a==='toggleMaint'){S.maint=!S.maint;await save();toast(S.maint?'Mantenimiento para alumnos activado':'Mantenimiento desactivado');return render()}
  if(a==='ck'){const actU=activeUser(),d=((S.ck??={})[actU.id]??={})[today()]??=[],i=d.indexOf(+v);i<0?d.push(+v):d.splice(i,1);
    const all=((S.plans[actU.id]||{})[DAYS[todayIdx()]]?.items)||[],dn=(S.done[actU.id]??={});await save();
    if(all.length&&all.every(x=>d.includes(x))&&!dn[today()]){dn[today()]=true;await save();toast('¡Rutina completa! Excelente trabajo');return render()}
    b.classList.toggle('on',i<0);b.closest('.ex').classList.toggle('chk',i<0);b.querySelector('em').textContent=i<0?'Hecho':'Marcar como hecho';return toast(i<0?'¡Ejercicio listo!':'Desmarcado')}
  if(a==='prog'){viewStu=+v;tab='progA';cm=0;return render()}
  if(a==='back'){tab='alumnos';return render()}
  if(a==='edx'){editX=+v;render();return scrollTo({top:0,behavior:'smooth'})}
  if(a==='cancx'){editX=null;return render()}
  if(a==='savec'){S.contact={ig:val('c-ig'),wa:val('c-wa')};await save();return toast('Contactos guardados')}
  if(a==='mypw')return pwModal(me.id);
  if(a==='pm'){pm=v==='0'?0:pm+ +v;return render()}
  if(a==='gv'){gv=v;return render()}
  if(a==='gr'){gr=+v;return render()}
  if(a==='shw'||a==='shm'){toast('Generando imagen…');try{shModal(await shareImg(activeUser(),a==='shw'?'w':'m'))}catch(e){console.error(e);toast('No se pudo crear la imagen')}return}
  if(a==='shok'){if(!shBlob)return;const f=new File([shBlob],'constancia-sf-sistem.png',{type:'image/png'});try{if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:'Mi constancia · SF Sistem'});return}}catch(e){if(e&&e.name==='AbortError')return}return dlSh()}
  if(a==='shdl')return dlSh();
  if(a==='sharePay'){const p=(S.pays||[]).find(x=>x.id===+v);if(p)await sharePaymentReceipt(p);return}
  if(a==='edu')return stuModal(+v);
  if(a==='euok'){const u=S.users.find(x=>x.id===+v),n=val('eu-name'),em=val('eu-email').toLowerCase();if(!u)return;if(!n||!em)return toast('Nombre y correo no pueden estar vacíos');if(S.users.some(x=>x.email.toLowerCase()===em&&x.id!==u.id))return toast('Ese correo ya está en uso');u.name=n;u.email=em;u.vid=val('eu-vid')==='F'?'F':'M';await save();closeM();toast('Usuario actualizado');return render()}
  if(a==='padd'){const n=val('pa-name'),f=Math.round(+val('pa-fee'))||0,d=val('pa-due');if(!n)return toast('Escribí el nombre del alumno');if(f>0&&!d)return toast('Elegí la fecha de vencimiento');
    PS().push({id:Date.now(),name:n,fee:f,due:d,paid:0,active:true});await save();toast('Alumno agregado a pagos');return render()}
  if(a==='pdel'){const u=PS().find(x=>x.id===+v);if(!u||!confirm('¿Quitar a '+u.name+' de la lista de pagos? Sus pagos ya registrados se mantienen.'))return;S.pstu=PS().filter(x=>x.id!==u.id);await save();toast('Alumno quitado de pagos');return render()}
  if(a==='pedit')return ovModal(+v);
  if(a==='ovsave'){const id=+v,b0=exById(id);if(!b0)return;const f={name:val('o-name'),sets:val('o-sets'),reps:val('o-reps'),note:val('o-note'),desc:val('o-desc')};
    if(!f.name)return toast('Poné un nombre');
    const diff={};for(const k of Object.keys(f))if(String(f[k]||'')!==String(b0[k]||''))diff[k]=f[k];
    const ov=((S.ov??={})[selStu]??={}),key=DAYS[selDay]+'|'+id;delete ov[id];if(Object.keys(diff).length)ov[key]=diff;else delete ov[key];
    await save();closeM();toast(Object.keys(diff).length?'Guardado para este alumno ('+DAYS[selDay]+')':'Sin cambios respecto al original');return render()}
  if(a==='ovreset'){const id=+v;if(S.ov?.[selStu]){delete S.ov[selStu][DAYS[selDay]+'|'+id];delete S.ov[selStu][id]}await save();closeM();toast('Ejercicio restablecido');return render()}
  if(a==='pickem'){$('#em').value=v;$('#pw').focus();return}
  if(a==='forgetem'){const id=+v,l=savedAcc().filter(x=>x.id!==id);LS.setItem('sf_accs',JSON.stringify(l));const m=bioMap();delete m[id];LS.setItem('sf_bio',JSON.stringify(m));return render()}
  if(a==='biologin'){const id=+v,cid=bioMap()[id];if(!cid)return;
    try{await navigator.credentials.get({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),allowCredentials:[{type:'public-key',id:b64d(cid),transports:['internal']}],userVerification:'required',timeout:60000}})}
    catch(e){return toast(e&&e.name==='NotAllowedError'?'Verificación cancelada':'No se pudo verificar. Entrá con tu contraseña.')}
    const u=S.users.find(x=>x.id===id);if(!u)return lerr('Cuenta no encontrada. Entrá con tu contraseña.');if(!u.active)return lerr('Cuenta suspendida. Hablá con tu entrenador.');
    enterUser(u);return}
  if(a==='bioon'){const u=S.users.find(x=>x.id===+v);if(!u)return;try{await bioEnable(u);closeM();toast('Face ID / huella activado en este celular')}catch(e){closeM();if(!(e&&e.name==='NotAllowedError'))toast('No se pudo activar en este celular')}return}
  if(a==='biono'){LS.setItem('sf_bio_no_'+v,'1');closeM();return}
  if(a==='biooff'){const m=bioMap();delete m[+v];LS.setItem('sf_bio',JSON.stringify(m));closeM();toast('Face ID / huella desactivado en este celular');return}
  if(a==='bell')return bellModal();
  if(a==='gorut'){selStu=+v;closeM();tab='planes';return render()}
  if(a==='gopay'){closeM();tab='pagos';return render()}
  if(a==='rut')return routModal(+v);
  if(a==='copylink'){try{await navigator.clipboard.writeText(APP_URL)}catch{const i=$('#app-link');i.select();i.setSelectionRange(0,999);document.execCommand('copy')}return toast('Link copiado')}
  if(a==='sharelink'){if(navigator.share){try{await navigator.share({title:'SF Sistem',text:'Descargá la app de SF Sistem:',url:APP_URL})}catch{}}else{try{await navigator.clipboard.writeText(APP_URL)}catch{}toast('Link copiado')}return}
  if(a==='balimg'){const d=balData();if(!d.ps.length)return toast('Sin pagos este mes');toast('Generando balance...');try{saveBlob(await generateBalanceImg(d),'balance-sf-sistem-'+d.key+'.png');toast('Balance descargado')}catch(e){console.error(e);toast('No se pudo generar el balance')}return}
  if(a==='balcsv'){const d=balData();if(!d.ps.length)return toast('Sin pagos este mes');const q=t=>'"'+String(t).replace(/"/g,'""')+'"',
    rows=[['SF Sistem · Balance de pagos',d.lbl],['Fecha','Alumno','Monto (Gs)','Tipo'],...d.ps.map(p=>[fmtD(p.date),p.name,p.amount,p.full===false?'Abono parcial':'Cuota completa']),[],['','Total cobrado',d.tot],['','Esperado/mes',d.exp],['','Pendiente',d.pend]];
    saveBlob(new Blob(['\ufeff'+rows.map(r=>r.map(q).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}),'balance-sf-sistem-'+d.key+'.csv');return toast('Balance descargado')}
  if(a==='payed')return feeModal(+v);
  if(a==='payn')return pendModal(+v);
  if(a==='pnshare')return sendPending(+v,false);
  if(a==='pndl')return sendPending(+v,true);
  if(a==='feeok'){const u=PS().find(x=>x.id===+v),f=Math.round(+val('fe-fee'))||0,d=val('fe-due');if(!u)return;if(f>0&&!d)return toast('Elegí la fecha de vencimiento');const nm=val('fe-name');if(!nm)return toast('El nombre no puede estar vacío');u.name=nm;u.fee=f;u.due=d;await save();closeM();toast('Cuota guardada');return render()}
  if(a==='payq')return payModal(+v);
  if(a==='pqok'){const u=PS().find(x=>x.id===+v),amt=Math.round(+val('pq-amt')),dt=val('pq-date')||today();if(!u)return;if(!(amt>0))return toast('Ingresá el monto cobrado');
    const cfg=u.fee&&u.due;
    if(cfg&&!canPay(u))return toast('Este alumno ya pagó este mes');
    if(!cfg&&(S.pays||[]).some(p=>p.uid===u.id&&(p.date||'').slice(0,7)===dt.slice(0,7)))return toast('Ya hay un cobro de este alumno en ese mes');
    if(cfg&&amt>rem(u))return toast('El monto supera el saldo ('+NUM(rem(u))+' Gs)');
    const pd=u.due||'',pp=+u.paid||0;let nd=pd,np=pp+amt,full=true;
    if(cfg){full=np>=u.fee;if(full){nd=addM(u.due);np=0}}else{if(!u.fee)u.fee=amt;nd=addM(dt);np=0}
    (S.pays??=[]).push({id:Date.now(),uid:u.id,name:u.name,amount:amt,date:dt,prevDue:pd,prevPaid:pp,newDue:nd,newPaid:np,full});u.due=nd;u.paid=np;await save();closeM();toast(full?'Cuota completa · vence '+fmtD(nd):'Abono registrado · saldo '+NUM(rem(u))+' Gs');return render()}
  if(a==='payx'){const p=(S.pays||[]).find(x=>x.id===+v);if(!p||!confirm('¿Anular el pago de '+NUM(p.amount)+' Gs?'))return;
    const last=S.pays.filter(x=>x.uid===p.uid).sort((m,n)=>n.id-m.id)[0];if(last&&last.id!==p.id)return toast('Anulá primero el pago más reciente de este alumno');
    S.pays=S.pays.filter(x=>x.id!==p.id);const u=PS().find(x=>x.id===p.uid);if(u&&u.due===p.newDue&&(+u.paid||0)===(+p.newPaid||0)){if(p.prevDue)u.due=p.prevDue;u.paid=+p.prevPaid||0}await save();toast('Pago anulado');return render()}
  if(a==='notif'){if(!('Notification'in window))return toast('Este navegador no permite avisos');const r=await Notification.requestPermission();toast(r==='granted'?'Avisos activados':'Avisos no permitidos');payCheck();return render()}
  if(a==='pwok'){const p=$('#pw1').value;if(p.length<4)return toast('Mínimo 4 caracteres');if(p!==$('#pw2').value)return toast('Las contraseñas no coinciden');const targetUser=S.users.find(u=>u.id===pwId);if(targetUser&&targetUser.role==='tecnico'&&me.role!=='tecnico')return toast('No tienes permisos para modificar la contraseña de un técnico');targetUser.pass=await sha(p);await save();$('#modal').hidden=true;$('#modal').innerHTML='';return toast('Contraseña actualizada')}
  if(a==='cal'){cm=v==='0'?0:cm+ +v;return render()}
  if(a==='cd'){const actU=activeUser();if(isPrivileged(actU)&&!viewingAsStudent){const d=(S.done[cu.id]??={});d[v]=!d[v];await save();toast(d[v]?'Día marcado como completo':'Día desmarcado');return render()}
    const t=planOn(actU.id,DAYS[(new Date(v+'T00:00').getDay()+6)%7]),n=((S.ck||{})[actU.id]||{})[v]?.length||0;return toast((t?t.title||'Entrenamiento':'Descanso')+((S.done[actU.id]||{})[v]?' · completado ✓':'')+(n?' · '+n+' exercises ✓':''))}
  if(a==='pubd'){const tx=val('d-text'),yl=val('d-yt'),dt=today();
    if(yl){const id=yid(yl);if(!id)return toast('Ese link no parece de YouTube');S.daily={type:'yt',yt:id,text:tx,date:dt}}
    else{const im=tmpImg||S.daily?.img;if(!im)return toast('Elegí una foto o un link de YouTube primero');S.daily={img:im,text:tx,date:dt}}
    tmpImg=null;await save();toast('Publicado');return render()}
  if(a==='deld'){delete S.daily;await save();return render()}
  if(a==='out'){b.classList.add('bye');return setTimeout(()=>{me=null;viewingAsStudent=false;LS.removeItem('sf_me');LS.removeItem('sf_last');render()},380)}
  if(a==='tab'){tab=v;return render()}
  if(a==='vid'){const e=exById(+v),m=$('#modal'),vu=vurl(e,b.dataset.w)||e.video||e.videoF;m.className='vfull';m.innerHTML=`<div class="vwrap"><div class="vbar"><b>${esc(e.name)}</b><button data-a="closev" aria-label="Cerrar video">✕ Cerrar</button></div><iframe src="${emb(vu)}?autoplay=1&rel=0&playsinline=1&modestbranding=1&fs=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>`;m.hidden=false;const rf=m.requestFullscreen||m.webkitRequestFullscreen;if(rf){try{const r=rf.call(m);if(r&&r.catch)r.catch(()=>{})}catch{}}return}
  if(a==='closev'){closeM();return}
  if(a==='fin'){const actU=activeUser(),d=(S.done[actU.id]??={});d[today()]=!d[today()];await save();toast(d[today()]?'¡Buen trabajo!':'Rutina reabierta');return render()}
  if(a==='addu'){const n=val('n-name'),e=val('n-em').toLowerCase(),p=val('n-pw'),r=$('#n-role').value;
    if(!n||!e||p.length<4)return toast('Completá nombre, correo y contraseña (mín. 4)');
    if(S.users.some(u=>u.email.toLowerCase()===e))return toast('Ese correo ya existe');
    S.users.push({id:Date.now(),email:e,name:n,role:r,active:true,vid:val('n-vid')==='F'?'F':'M',pass:await sha(p)});await save();toast('Usuario creado');return render()}
  if(a==='tog'){const u=S.users.find(u=>u.id===+v);if(!u)return;if(u.role==='tecnico')return toast('No se puede suspender a un técnico');if(u.id===me.id)return toast('No podés suspender tu propia cuenta');u.active=!u.active;await save();toast(u.active?'Usuario activado':'Usuario suspendido');return render()}
  if(a==='pass')return pwModal(+v);
  if(a==='del'){const u=S.users.find(u=>u.id===+v);if(!u)return;if(u.role==='tecnico')return toast('No se puede eliminar a un técnico');if(+v===me.id)return toast('No podés eliminar tu propia cuenta');if(!confirm('¿Eliminar usuario y su plan?'))return;S.users=S.users.filter(u=>u.id!==+v);delete S.plans[+v];await save();return render()}
  if(a==='day'){selDay=+v;return render()}
  if(a==='rm'){planDay().items.splice(+v,1);await save();return render()}
  if(a==='clear'){delete S.plans[selStu][DAYS[selDay]];await save();return render()}
  if(a==='addx'){const e={id:editX||Date.now(),zone:val('x-zone'),name:val('x-name'),sets:val('x-sets'),reps:val('x-reps'),note:val('x-note'),desc:val('x-desc'),video:val('x-video'),videoF:val('x-videoF')};
    if(!e.zone||!e.name||!e.sets||!e.reps)return toast('Completá zona, nombre, series y reps');
    if(editX){S.ex[S.ex.findIndex(x=>x.id===editX)]=e;editX=null}else S.ex.push(e);await save();toast('Ejercicio guardado');return render()}
  if(a==='delx'){if(!confirm('¿Eliminar del catálogo?'))return;S.ex=S.ex.filter(e=>e.id!==+v);await save();return render()}
});

document.addEventListener('change',async ev=>{
  const c=ev.target.dataset.c;if(!c)return;
  if(c==='img'){const f=ev.target.files[0];if(!f)return;
    const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,1080/Math.max(im.width,im.height)),cv=document.createElement('canvas');cv.width=im.width*k;cv.height=im.height*k;cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);tmpImg=cv.toDataURL('image/jpeg',.78);const p=$('#dprev');p.src=tmpImg;p.hidden=false};im.src=r.result};r.readAsDataURL(f);return}
  if(c==='impb'){const f=ev.target.files[0];if(!f)return;
    try{const d=JSON.parse(await f.text());if(!d||!Array.isArray(d.users)||!d.users.length)throw 0;
      if(!confirm('Esto reemplaza TODOS los datos actuales por los del respaldo ('+d.users.length+' usuarios). ¿Continuar?')){ev.target.value='';return}
      d.pays??=[];S=d;me=S.users.find(u=>u.id===me.id&&u.active)||null;if(!me)LS.removeItem('sf_me');await save();render();toast(me?'Respaldo restaurado':'Respaldo restaurado · ingresá de nuevo')}
    catch(e){toast('Archivo de respaldo no válido')}
    ev.target.value='';return}
  if(c==='showpw'){['pw1','pw2'].forEach(i=>$('#'+i).type=ev.target.checked?'text':'password');return}
  if(c==='rest'){((S.rest??={})[selStu]??={})[DAYS[selDay]]=ev.target.checked;await save();toast(ev.target.checked?'Día de descanso':'Día de entrenamiento');return render()}
  if(c==='stu'){selStu=+ev.target.value;return render()}
  if(c==='title'){planDay().title=ev.target.value.trim();await save();return toast('Título guardado')}
  if(c==='add'&&ev.target.value){
    const t=planDay();
    if(isRest(selStu,DAYS[selDay])){
      ((S.rest??={})[selStu]??={})[DAYS[selDay]]=false;
      toast('Día activado: ya no es de descanso');
    }
    const valNum=+ev.target.value;
    if(!t.items.includes(valNum)){
      t.items.push(valNum);
      await save();
      render();
    }
  }
});

document.addEventListener('input',ev=>{if(ev.target.id==='em'||ev.target.id==='pw'){document.querySelectorAll('.fld.bad').forEach(f=>f.classList.remove('bad'));$('#lerr').hidden=true;return}
  if(ev.target.id!=='x-video'&&ev.target.id!=='x-videoF')return;const id=yid(ev.target.value),p=$(ev.target.id==='x-video'?'#vprev':'#vprevF');p.innerHTML=id?vpv(id):(ev.target.value.trim()?'<small>Ese link no parece de YouTube</small>':'')});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='pw')document.querySelector('[data-a=login]').click()});

let lastT=0;
['click','keydown','touchstart','scroll','input'].forEach(t=>addEventListener(t,()=>{if(!me)return;const n=Date.now();if(n-lastT<4000)return;lastT=n;if(expired())return sessionCheck();touch()},{passive:true,capture:true}));
setInterval(sessionCheck,15000);
setInterval(()=>payCheck(),30*60*1000);
setInterval(()=>remindCheck(),45*60*1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){sessionCheck();payCheck()}});

init();
