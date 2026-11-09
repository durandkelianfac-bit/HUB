// Notes riches : post-it, dossiers, éditeur plein écran, tableaux, verrouillage chiffré (AES-GCM).
const COL=['#fff3a3','#ffd1dc','#c8f0c8','#cfe5ff','#e5d4ff','#ffe0b8','#e4e4e4'];
let nf={note:'',idea:''},cur=null,cpw=null,sto,sr=null;
// ---- sécurité : nettoyage du HTML et chiffrement
const OKT=new Set('B I U S STRIKE STRONG EM H1 H2 H3 P DIV BR UL OL LI A SPAN FONT TABLE TBODY THEAD TR TD TH HR INPUT MARK'.split(' '));
function clean(h){const d=new DOMParser().parseFromString('<body>'+h,'text/html').body;
 (function w(n){[...n.childNodes].forEach(c=>{if(c.nodeType==3)return;if(c.nodeType!=1||!OKT.has(c.tagName)||(c.tagName=='INPUT'&&c.getAttribute('type')!='checkbox')){c.remove();return}
  [...c.attributes].forEach(a=>{const k=a.name,v=a.value;
   if(k=='style')c.setAttribute('style',v.split(';').filter(x=>/^\s*(color|background-color|text-align|font-weight|font-style|text-decoration)\s*:\s*[#\w\s(),.%-]+$/i.test(x)).join(';'));
   else if(k=='href'&&/^(https?:|mailto:|tel:)/i.test(v));else if(k=='color'&&/^[#\w]+$/.test(v));else if(c.tagName=='INPUT'&&(k=='type'||k=='checked'));else c.removeAttribute(k)});
  if(c.tagName=='A'){c.target='_blank';c.rel='noopener'}w(c)})})(d);return d.innerHTML}
const b64=b=>{let s='';new Uint8Array(b).forEach(x=>s+=String.fromCharCode(x));return btoa(s)},ub=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function nkey(pw,salt){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:250000,hash:'SHA-256'},k,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function enc(pw,txt){const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),c=await crypto.subtle.encrypt({name:'AES-GCM',iv},await nkey(pw,salt),new TextEncoder().encode(txt));return{s:b64(salt),i:b64(iv),c:b64(c)}}
async function dec(pw,o){return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:ub(o.i)},await nkey(pw,ub(o.s)),ub(o.c)))}
function askPw(m){return new Promise(r=>{const d=document.createElement('div');d.className='ov';d.innerHTML=`<div class="card"><h3>${m}</h3><input type="password" autocomplete="off" aria-label="Code"><button class="btn">OK</button><button class="btn alt">Annuler</button></div>`;document.body.append(d);const i=d.querySelector('input'),f=v=>{d.remove();r(v)};i.focus();const[b1,b2]=d.querySelectorAll('button');b1.onclick=()=>f(i.value);b2.onclick=()=>f(null);i.onkeydown=e=>{if(e.key=='Enter')f(i.value)}})}
// ---- dossiers
const fl=k=>L('folder').filter(f=>f.kind==k);
const pathOf=id=>{const a=[];let f=id;while(f){const x=L('folder').find(y=>y.id==f);if(!x)break;a.unshift(x);f=x.parent}return a};
const tree=(k,p='',d=0)=>fl(k).filter(f=>(f.parent||'')==p).flatMap(f=>[[f.id,'— '.repeat(d)+f.title],...tree(k,f.id,d+1)]);
const cnt=(k,id)=>{const n=L(k).filter(x=>x.parent==id).length+fl(k).filter(x=>x.parent==id).length;return n+' élément'+(n>1?'s':'')};
function newFolder(k){const n=prompt('Nom du dossier ?');if(n&&n.trim())put({id:uid(),t:'folder',kind:k,title:n.trim(),parent:nf[k]||'',ts:Date.now()})}
function renFolder(k){const f=L('folder').find(x=>x.id==nf[k]),n=f&&prompt('Nouveau nom ?',f.title);if(n&&n.trim()){f.title=n.trim();put(f)}}
function delFolder(k){const f=L('folder').find(x=>x.id==nf[k]);if(!f||!confirm('Supprimer ce dossier ? Son contenu remonte d\'un niveau.'))return;
 S.items.filter(x=>x.parent==f.id).forEach(x=>{x.parent=f.parent||'';push(x)});nf[k]=f.parent||'';del(f.id)}
function nview(k){const c=T[k],cf=nf[k]||'',pth=pathOf(cf),subs=fl(k).filter(f=>(f.parent||'')==cf),its=L(k).filter(x=>(x.parent||'')==cf).sort((a,b)=>(b.pin||0)-(a.pin||0)||(b.ts2||b.ts)-(a.ts2||a.ts));
 return `<h2>${c.i} ${c.n}</h2><div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin-bottom:10px"><button class="chip" style="border:0;cursor:pointer;color:inherit;font:inherit" onclick="nf['${k}']='';render()">${c.i} ${c.n}</button>${pth.map(f=>`<span>›</span><button class="chip" style="border:0;cursor:pointer;color:inherit;font:inherit" onclick="nf['${k}']='${f.id}';render()">${esc(f.title)}</button>`).join('')}</div>
<div><button class="btn" onclick="newNote('${k}')">+ ${k=='note'?'Note':'Idée'}</button><button class="btn alt" onclick="newFolder('${k}')">+ Dossier</button>${cf?`<button class="btn alt" onclick="renFolder('${k}')">Renommer</button><button class="btn alt" onclick="delFolder('${k}')">Supprimer ce dossier</button>`:''}</div>
${subs.length?`<div class="fg">${subs.map(f=>`<div class="fo" onclick="nf['${k}']='${f.id}';render()">📁 <b>${esc(f.title)}</b><small>${cnt(k,f.id)}</small></div>`).join('')}</div>`:''}
<div class="pg">${its.map(x=>`<div class="pi" style="background:${x.color||COL[0]}" onclick="openNote('${x.id}')"><b>${x.pin?'📌 ':''}${x.lock?'🔒 ':''}${esc(x.title||'Sans titre')}</b><span>${x.lock?'Note verrouillée':esc((x.text||'').slice(0,160))}</span></div>`).join('')||'<p class="mu">Rien ici. Crée une première entrée.</p>'}</div>`}
// ---- éditeur
function newNote(k){const it={id:uid(),t:k,title:'',html:'',text:'',color:COL[0],parent:nf[k]||'',lock:0,ts:Date.now()};S.items.push(it);save();openNote(it.id)}
const rest=()=>{if(sr){const s=getSelection();s.removeAllRanges();s.addRange(sr)}};
function ex(c,v){const e=$('#nec');e.focus();rest();document.execCommand(c,false,v);sv()}
const cell=()=>{const n=getSelection().anchorNode,e=n&&(n.nodeType==3?n.parentElement:n);return e&&e.closest&&$('#nec').contains(e)?e.closest('td,th'):null};
function tOp(o){const td=cell();if(!td)return;const tr=td.closest('tr'),tb=td.closest('table'),i=td.cellIndex;
 if(o=='ar'){const r=tr.cloneNode(true);r.querySelectorAll('td,th').forEach(c=>c.innerHTML='<br>');tr.after(r)}
 if(o=='ac')[...tb.rows].forEach(r=>{r.insertCell(i+1).innerHTML='<br>'});
 if(o=='dr'&&tb.rows.length>1)tr.remove();
 if(o=='dc'&&tr.cells.length>1)[...tb.rows].forEach(r=>r.deleteCell(i));
 if(o=='dt')tb.remove();sv()}
const CMD={chk:()=>ex('insertHTML','<div><input type="checkbox">&nbsp;</div>'),tbl:()=>ex('insertHTML','<table><tbody>'+('<tr>'+'<td><br></td>'.repeat(3)+'</tr>').repeat(3)+'</tbody></table><p><br></p>'),
 dat:()=>{const i=$('#ndt');i.value='';i.onchange=()=>{if(i.value)ex('insertText',fd(i.value))};i.showPicker?i.showPicker():i.click()},
 lnk:()=>{const u=prompt('Adresse du lien (https://…)');if(u)ex('createLink',/^(https?:|mailto:|tel:)/.test(u)?u:'https://'+u)},
 adr:()=>{const t=getSelection().toString().trim();if(!t)return alert('Sélectionne d\'abord une adresse dans le texte.');ex('createLink','https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(t))}};
const TB=[['B','bold'],['I','italic'],['U','underline'],['S','strikeThrough'],['T','formatBlock','h2'],['¶','formatBlock','p'],['•','insertUnorderedList'],['1.','insertOrderedList'],['☑','@chk'],['⇤','justifyLeft'],['↔','justifyCenter'],['⇥','justifyRight'],['↶','undo'],['↷','redo']];
const INS=[['▦','@tbl','Tableau'],['📅','@dat','Date'],['🔗','@lnk','Lien'],['📍','@adr','Adresse (sélectionne le texte)'],['─','insertHorizontalRule','Séparateur']];
const run=(c,v)=>c[0]=='@'?CMD[c.slice(1)]():ex(c,v);
function slash(){const d=document.createElement('div');d.className='ov';d.innerHTML='<div class="card"><h3>Insérer</h3></div>';const c=d.firstChild;
 [['Titre','formatBlock','h2'],['Liste','insertUnorderedList'],['Cases à cocher','@chk'],['Tableau','@tbl'],['Date','@dat'],['Adresse','@adr'],['Séparateur','insertHorizontalRule']].forEach(([n,a,v])=>{const b=document.createElement('button');b.className='btn alt';b.textContent=n;b.onclick=()=>{d.remove();$('#nec').focus();rest();document.execCommand('delete');run(a,v)};c.append(b)});
 document.body.append(d);d.onclick=e=>{if(e.target==d)d.remove()}}
function sv(){clearTimeout(sto);sto=setTimeout(flush,700)}
async function flush(){if(!cur)return;const it=S.items.find(x=>x.id==cur);if(!it)return;it.title=$('#net').value.trim();const h=clean($('#nec').innerHTML),tx=$('#nec').innerText;
 if(cpw!==null){it.enc=await enc(cpw,JSON.stringify({h,tx}));it.html='';it.text='';it.lock=1}else{it.html=h;it.text=tx.slice(0,2000);delete it.enc;it.lock=0}
 it.ts2=Date.now();put(it)}
async function openNote(id){const it=S.items.find(x=>x.id==id);if(!it||cur)return;let h=it.html||esc(it.text||'').replace(/\n/g,'<br>');cpw=null;
 if(it.lock&&it.enc){const p=await askPw('Code de la note');if(p===null)return;try{h=JSON.parse(await dec(p,it.enc)).h;cpw=p}catch(e){alert('Code incorrect.');return}}
 cur=id;const o=document.createElement('div');o.id='ned';o.className='ov';
 o.innerHTML=`<div class="eh"><button class="x" id="nbk" aria-label="Retour">←</button><input id="net" placeholder="Titre" value="${esc(it.title)}"><button class="x" id="nmn" aria-label="Options">⋯</button></div><div id="nec" contenteditable="true" role="textbox" aria-multiline="true"></div><div id="tc"><button data-o="ar">+ Ligne</button><button data-o="ac">+ Colonne</button><button data-o="dr">− Ligne</button><button data-o="dc">− Colonne</button><button data-o="dt">Suppr. tableau</button></div><div id="tbr"></div><input type="date" id="ndt" style="position:absolute;opacity:0;width:1px;height:1px;pointer-events:none">`;
 document.body.append(o);const ec=$('#nec');ec.innerHTML=clean(h);document.execCommand('styleWithCSS',false,true);
 const bt=(l,fn,t)=>{const b=document.createElement('button');b.textContent=l;b.title=t||'';b.setAttribute('aria-label',t||l);b.onpointerdown=e=>e.preventDefault();b.onclick=fn;$('#tbr').append(b)};
 TB.forEach(([l,c,v])=>bt(l,()=>run(c,v)));
 [['A','foreColor','Couleur du texte'],['🖍','hiliteColor','Surlignage']].forEach(([l,c,t])=>{const lb=document.createElement('label');lb.textContent=l;lb.title=t;const i=document.createElement('input');i.type='color';i.value=c=='foreColor'?'#d62828':'#ffe14d';i.oninput=()=>ex(c,i.value);lb.append(i);$('#tbr').append(lb)});
 INS.forEach(([l,c,t])=>bt(l,()=>run(c),t));
 $('#tc').onpointerdown=e=>e.preventDefault();$('#tc').onclick=e=>{if(e.target.dataset.o)tOp(e.target.dataset.o)};
 const vv=window.visualViewport,fit=()=>{if(vv){o.style.height=vv.height+'px';o.style.top=vv.offsetTop+'px'}};fit();vv&&(vv.onresize=fit,vv.onscroll=fit);
 document.onselectionchange=()=>{const s=getSelection();if(s.rangeCount&&ec.contains(s.anchorNode)){sr=s.getRangeAt(0).cloneRange();$('#tc').style.display=cell()?'flex':'none'}};
 ec.oninput=e=>{sv();if(e.data=='/')slash()};ec.onclick=e=>{if(e.target.type=='checkbox'){e.target.toggleAttribute('checked',e.target.checked);sv()}};$('#net').oninput=sv;
 $('#nbk').onclick=closeNote;$('#nmn').onclick=menu;if(!it.title&&!it.text)setTimeout(()=>$('#net').focus(),50)}
async function closeNote(){const it=S.items.find(x=>x.id==cur);clearTimeout(sto);
 if(it&&!it.ts2&&!$('#net').value.trim()&&!$('#nec').innerText.trim()){S.items=S.items.filter(x=>x.id!=cur);save()}else await flush();
 cur=null;cpw=null;sr=null;document.onselectionchange=null;$('#ned').remove();render()}
function menu(){const it=S.items.find(x=>x.id==cur),d=document.createElement('div');d.className='ov';
 d.innerHTML=`<div class="card"><h3>Options</h3><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">${COL.map(c=>`<button class="x" data-c="${c}" style="background:${c};width:34px;height:34px;border-radius:50%;border:2px solid ${c==it.color?'var(--tx)':'transparent'}" aria-label="Couleur"></button>`).join('')}</div>
<button class="btn alt" data-a="pin">${it.pin?'Désépingler':'📌 Épingler'}</button><button class="btn alt" data-a="lock">${it.lock?'Changer le code':'🔒 Verrouiller'}</button>${it.lock?'<button class="btn alt" data-a="unlock">Retirer le verrou</button>':''}
<select id="nmv" aria-label="Dossier"><option value="">Dossier : racine</option>${tree(it.t).map(([i,n])=>`<option value="${i}" ${i==it.parent?'selected':''}>${esc(n)}</option>`).join('')}</select><button class="btn alt" data-a="del">🗑 Supprimer</button><button class="btn" data-a="ok">Fermer</button></div>`;
 document.body.append(d);d.onclick=async e=>{const b=e.target;if(b==d||b.dataset.a=='ok')return d.remove();
  if(b.dataset.c){it.color=b.dataset.c;put(it);d.remove();return}
  if(b.dataset.a=='pin'){it.pin=it.pin?0:1;put(it);d.remove()}
  if(b.dataset.a=='del'){d.remove();clearTimeout(sto);const id=cur;cur=null;cpw=null;document.onselectionchange=null;$('#ned').remove();del(id)}
  if(b.dataset.a=='unlock'){cpw=null;d.remove();await flush()}
  if(b.dataset.a=='lock'){d.remove();const p=await askPw('Choisis un code (sans lui, la note est perdue)');if(!p)return;if(p!==await askPw('Confirme le code'))return alert('Les codes ne correspondent pas.');cpw=p;await flush()}};
 $('#nmv').onchange=e=>{it.parent=e.target.value;put(it)}}
