(() => {
 const stage=document.getElementById("map-stage"),img=document.getElementById("date-map"),reset=document.getElementById("reset-map");
 if(!stage||!img)return;
 let scale=1,x=0,y=0,pointers=new Map(),startDist=0,startScale=1,startX=0,startY=0,lastTap=0;
 const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
 function paint(){img.style.transform=`translate(${x}px,${y}px) scale(${scale})`;}
 function resetView(){scale=1;x=0;y=0;paint();}
 function distance(a,b){return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);}
 stage.addEventListener("pointerdown",e=>{
   stage.setPointerCapture(e.pointerId);pointers.set(e.pointerId,e);
   if(pointers.size===1){startX=e.clientX-x;startY=e.clientY-y;}
   if(pointers.size===2){const pts=[...pointers.values()];startDist=distance(pts[0],pts[1]);startScale=scale;}
 });
 stage.addEventListener("pointermove",e=>{
   if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,e);
   if(pointers.size===1&&scale>1){x=e.clientX-startX;y=e.clientY-startY;paint();}
   if(pointers.size===2){const pts=[...pointers.values()];if(startDist){scale=clamp(startScale*distance(pts[0],pts[1])/startDist,1,5);paint();}}
 });
 const end=e=>{pointers.delete(e.pointerId);if(pointers.size<2)startDist=0;};
 stage.addEventListener("pointerup",end);stage.addEventListener("pointercancel",end);
 stage.addEventListener("dblclick",e=>{scale=scale>1?1:2.2;x=0;y=0;paint();});
 reset?.addEventListener("click",resetView);
 paint();
})();
