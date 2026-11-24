// Illustrative points only; no real businesses, ratings, or distance claims.
export const places=[
  {id:'park',ar:'حديقة',en:'Park',x:-5.2,y:.9,z:-1.7,icon:'M12 3 5 12h3l-4 5h6v4h4v-4h6l-4-5h3L12 3Z'},
  {id:'restaurant',ar:'مطعم',en:'Restaurant',x:5.2,y:1.5,z:1.6,icon:'M5 3v6m3-6v6M3 3v6a3 3 0 0 0 6 0M6 12v9M18 3v18m0-18c-4 2-4 8 0 8'},
  {id:'school',ar:'مدرسة',en:'School',x:4.8,y:1.8,z:-2.9,icon:'m3 8 9-5 9 5-9 5-9-5Zm3 3v7l6 3 6-3v-7M21 8v8'},
  {id:'pharmacy',ar:'صيدلية',en:'Pharmacy',x:-5.2,y:1.3,z:2.6,icon:'M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z'},
  {id:'market',ar:'متجر',en:'Market',x:1,y:1.2,z:4.1,icon:'M4 8h16v13H4V8Zm4 0V6a4 4 0 0 1 8 0v2M8 12h8'},
  {id:'mosque',ar:'مسجد',en:'Mosque',x:-1.7,y:1.7,z:-3.8,icon:'M4 21V10m0-7v3m-2 4h4M8 21v-8h12v8M8 13c0-4 6-6 6-8 0 2 6 4 6 8m-8 8v-4h4v4'},
];
export function createPlaceExplorer(host,onSelect){
  const ar=()=>document.documentElement.lang==='ar';let selected=null;
  const markers=[...places,{id:'apartment',ar:'العقار',en:'Property',x:0,y:5.05,z:-.5}];
  const layer=document.createElement('div');layer.className='poi-layer';host.append(layer);
  const explorer=document.createElement('div');explorer.className='place-selection';explorer.hidden=true;explorer.innerHTML='<div class="place-detail" hidden></div>';document.querySelector('.map-bottom').after(explorer);
  const icon=p=>p.id==='apartment'?'<svg viewBox="0 0 32 42" aria-hidden="true"><path d="M16 1C7.8 1 2 7.2 2 15c0 10 14 25 14 25s14-15 14-25C30 7.2 24.2 1 16 1Z" fill="#d92d2d" stroke="white" stroke-width="1.5"/><circle cx="16" cy="15" r="5" fill="white" stroke="none"/></svg>':`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${p.icon}"/></svg>`;const buttons=new Map();
  for(const p of markers){const b=document.createElement('button');b.type='button';b.className=`poi-pin ${p.id==='apartment'?'apartment-pin':''}`;b.dataset.place=p.id;b.innerHTML=`<span class="poi-dot">${icon(p)}</span><span class="poi-name"></span>`;b.onclick=()=>{selected=p.id;onSelect?.();render();};b.onpointerdown=e=>e.stopPropagation();b.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home'].includes(e.key))e.stopPropagation();};layer.append(b);buttons.set(p.id,b);}
  function render(){
    for(const p of markers){const b=buttons.get(p.id);b.querySelector('.poi-name').textContent=ar()?p.ar:p.en;b.setAttribute('aria-label',(ar()?p.ar:p.en)+(ar()?' — موقع توضيحي':' — illustrative location'));b.setAttribute('aria-pressed',String(selected===p.id));b.hidden=b.dataset.clipped==='true';}
    const detail=explorer.querySelector('.place-detail'),p=markers.find(p=>p.id===selected);detail.hidden=!p;explorer.hidden=!p||host.hidden;
    if(p){detail.innerHTML=`<div class="place-detail-icon">${icon(p)}</div><div><h4>${ar()?p.ar:p.en}</h4><p>${p.id==='apartment'?(ar()?'موقع العقار الرئيسي في المشهد.':'The main property location in the scene.'):(ar()?'استكشف هذا النوع من الخدمات في محيط العقار.':'Explore this type of service around the property.')}</p><small>${ar()?'الموقع توضيحي؛ بيانات الأماكن الفعلية لم تتصل بعد.':'Illustrative location; real place data is not connected yet.'}</small></div><button type="button" class="place-close" aria-label="${ar()?'إغلاق تفاصيل المكان':'Close place details'}">×</button>`;detail.querySelector('button').onclick=()=>{const previous=selected;selected=null;render();buttons.get(previous)?.focus();};}
  }
  const observer=new MutationObserver(render);observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});addEventListener('pagehide',()=>observer.disconnect(),{once:true});render();
  return {project(camera,width,height,THREE){camera.updateMatrixWorld();const point=new THREE.Vector3();for(const p of markers){const b=buttons.get(p.id);point.set(p.x,p.y,p.z).project(camera);const x=(point.x*.5+.5)*width,y=(-point.y*.5+.5)*height;b.dataset.clipped=String(point.z>1||point.z< -1||x<22||x>width-22||y<35||y>height-10);b.hidden=b.dataset.clipped==='true';if(!b.hidden){b.style.left=`${x}px`;b.style.top=`${y}px`;b.style.zIndex=String(p.id==='apartment'?100:Math.round((1-point.z)*1000));}}},setVisible(value){explorer.hidden=!value||!selected;}};
}
