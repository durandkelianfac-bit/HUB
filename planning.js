// Moteur de décodage du planning (indépendant de l'interface, testable avec Node).
// Horaires en heure locale Europe/Paris, stockés sous forme "HH:MM" (pas de conversion UTC).
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Planning=factory()})(typeof self!=='undefined'?self:this,function(){
'use strict';
const J={type:'jour',debut:'06:50',fin:'19:10'},N={type:'nuit',debut:'18:50',fin:'07:10'};
const CODES={
 J1:{...J,secteur:'SRP1',titre:'Jour SRP1'},J2:{...J,secteur:'SRP2',titre:'Jour SRP2'},J3:{...J,secteur:'Soins intensifs',titre:'Jour Soins intensifs'},
 N1:{...N,secteur:'SRP1',titre:'Nuit SRP1'},N2:{...N,secteur:'SRP2',titre:'Nuit SRP2'},N3:{...N,secteur:'Soins intensifs',titre:'Nuit Soins intensifs'}};
const REPOS={RH:1,RC:1,CA:1};
const MOIS=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const strip=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const MK=MOIS.map(strip),pad=n=>String(n).padStart(2,'0');
const daysIn=(y,m)=>new Date(Date.UTC(y,m,0)).getUTCDate();
const iso=(y,m,d)=>y+'-'+pad(m)+'-'+pad(d);
const addDay=s=>{const d=new Date(s+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10)};
const minus=(h,min)=>{const[a,b]=h.split(':').map(Number),t=((a*60+b-min)%1440+1440)%1440;return pad(Math.floor(t/60))+':'+pad(t%60)};
const ALLOWED='J1, J2, J3, N1, N2, N3, RH, RC, CA';
function shiftFrom(date,code){const K=String(code).toUpperCase(),c=CODES[K];if(!c)throw new Error('Code inconnu : '+code);
 return{date,code:K,type:c.type,secteur:c.secteur,titre:c.titre,debut:c.debut,fin:c.fin,finLeLendemain:c.type==='nuit',finDate:c.type==='nuit'?addDay(date):date,rappel:minus(c.debut,30)}}
function decode(text,opts){opts=opts||{};const toks=String(text||'').split(/[\s,;]+/).filter(Boolean),months=[],years=[],codes=[],err=[];
 toks.forEach(t=>{const mi=MK.indexOf(strip(t.replace(/[.:]+$/,'')));if(mi>=0)months.push(mi+1);else if(/^\d{4}$/.test(t))years.push(+t);else codes.push(t)});
 if(months.length!==1||new Set(years).size>1){
  if(months.length===0)err.push({code:'MOIS_INCONNU',message:'Mois introuvable. Écris le nom du mois en toutes lettres (ex. : Novembre).'});
  if(months.length>1)err.push({code:'MOIS_AMBIGU',message:'Plusieurs mois trouvés dans le texte. Indique un seul mois.'});
  if(new Set(years).size>1)err.push({code:'ANNEE_AMBIGUE',message:'Plusieurs années trouvées dans le texte. Indique une seule année.'});
  return{ok:false,errors:err}}
 const m=months[0],y=years.length?years[0]:(Number.isInteger(opts.year)?opts.year:null);
 if(!y)return{ok:false,errors:[{code:'ANNEE_INCONNUE',message:'Année introuvable. Ajoute-la au texte (ex. : Novembre 2026).'}]};
 codes.forEach(t=>{const K=t.toUpperCase();if(!CODES[K]&&!REPOS[K]&&t!=='-')err.push({code:'CODE_INCONNU',message:'Code inconnu : '+t+'. Codes autorisés : '+ALLOWED+'.'})});
 const n=daysIn(y,m);if(codes.length!==n)err.push({code:'NOMBRE_CODES',message:MOIS[m-1][0].toUpperCase()+MOIS[m-1].slice(1)+' '+y+' compte '+n+' jours mais '+codes.length+' code(s) fourni(s) : le nombre doit être identique.'});
 if(err.length)return{ok:false,errors:err,month:m,year:y};
 const days=[],shifts=[];
 codes.forEach((t,i)=>{const d=i+1,date=iso(y,m,d),K=t.toUpperCase();
  if(CODES[K]){const s=shiftFrom(date,K);shifts.push(s);days.push({day:d,date,code:K,kind:'travail',label:s.titre+' ('+s.debut+' → '+s.fin+(s.finLeLendemain?' +1 j':'')+')'})}
  else if(REPOS[K])days.push({day:d,date,code:K,kind:'repos',label:'Repos'});
  else days.push({day:d,date,code:'—',kind:'vide',label:'Aucun poste'})});
 return{ok:true,year:y,month:m,days,shifts,errors:[]}}
return{CODES,MOIS,ALLOWED,decode,shiftFrom,daysIn};
});
