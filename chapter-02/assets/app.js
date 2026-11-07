const KEY='ch2_journey_v2';function load(){try{return JSON.parse(localStorage.getItem(KEY))||{places:[],gifts:[],illustration:'',startedAt:new Date().toISOString()}}catch(e){return {places:[],gifts:[],illustration:''}}}function save(d){localStorage.setItem(KEY,JSON.stringify(d))}function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function readFile(file,cb){if(!file)return;const r=new FileReader();r.onload=()=>cb(r.result);r.readAsDataURL(file)}function preview(input,img){input.addEventListener('change',()=>readFile(input.files[0],src=>{img.src=src;img.classList.remove('hidden')}))}function back(){if(history.length>1)history.back();else location.href='index.html'}function header(title){return `<header class="topbar"><a class="nav" href="index.html" aria-label="返回首頁">⌂</a><div class="brand">${title}</div><button class="nav" onclick="back()" aria-label="返回上一頁">‹</button></header>`}

const RESET_API='https://private-album-api-796382184623.asia-east1.run.app/public/chapter-02/reset-state';
const RESET_MARKER_KEY='ch2_global_reset_seen_v1';
let resetCheckRunning=false;
async function checkChapter02GlobalReset(){
  if(resetCheckRunning)return;resetCheckRunning=true;
  try{
    const response=await fetch(RESET_API,{method:'GET',cache:'no-store',credentials:'omit'});
    if(!response.ok)throw new Error('reset state HTTP '+response.status);
    const state=await response.json();const remote=String(Number(state.resetAt||0));
    if(!remote||remote==='0')return;
    const seen=localStorage.getItem(RESET_MARKER_KEY);
    if(seen!==remote){
      // A marker mismatch means this browser still has data from before the global reset.
      localStorage.removeItem(KEY);sessionStorage.removeItem(KEY);
      localStorage.setItem(RESET_MARKER_KEY,remote);
      window.dispatchEvent(new CustomEvent('chapter02:reset'));
    }
  }catch(error){console.warn('Chapter 02 global reset check deferred until online:',error);}
  finally{resetCheckRunning=false;}
}
checkChapter02GlobalReset();
window.addEventListener('online',checkChapter02GlobalReset);
window.setInterval(checkChapter02GlobalReset,15000);
window.addEventListener('message',event=>{
  if(event.origin!=='https://private-album-api-796382184623.asia-east1.run.app'||event.data?.type!=='CHAPTER_02_RESET')return;
  checkChapter02GlobalReset();
});
