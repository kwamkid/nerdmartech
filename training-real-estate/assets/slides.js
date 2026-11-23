(function(){
 var slides=[].slice.call(document.querySelectorAll('.slide')),n=slides.length,i=0;
 slides.forEach(function(s,k){var p=s.querySelector('.pg');if(p)p.textContent=String(k+1).padStart(2,'0')+' / '+String(n).padStart(2,'0')});
 function fit(){var s=Math.min(innerWidth/1280,innerHeight/720);document.documentElement.style.setProperty('--s',s)}
 function go(k){i=Math.max(0,Math.min(n-1,k));slides.forEach(function(s,j){s.classList.toggle('on',j===i)});
  document.getElementById('bar').style.width=((i+1)/n*100)+'%';try{history.replaceState(null,'','#'+(i+1))}catch(e){}
  if(window.__strip)window.__strip(i)}
 addEventListener('resize',fit);fit();
 /* thumbnail strip */
 (function(){
  var strip=document.createElement('div');strip.className='strip';
  var row=document.createElement('div');row.className='row';strip.appendChild(row);
  var tab=document.createElement('button');tab.type='button';tab.className='striptab';tab.textContent='สไลด์ทั้งหมด';
  var thumbs=slides.map(function(sl,k){
   var b=document.createElement('button');b.type='button';b.className='th';b.title='หน้า '+(k+1);
   var m=document.createElement('div');m.className='mini';
   var c=sl.cloneNode(true);c.classList.add('on');c.removeAttribute('id');
   c.querySelectorAll('[id]').forEach(function(x){x.removeAttribute('id')});
   c.querySelectorAll('[data-qr]').forEach(function(x){x.removeAttribute('data-qr')});
   c.querySelectorAll('video').forEach(function(v){var im=document.createElement('img');im.src=v.getAttribute('poster')||'';v.parentNode.replaceChild(im,v)});
   c.querySelectorAll('img').forEach(function(im){im.loading='lazy'});
   m.appendChild(c);b.appendChild(m);
   var nb=document.createElement('span');nb.className='n';nb.textContent=k+1;b.appendChild(nb);
   b.addEventListener('click',function(e){e.stopPropagation();go(k)});
   row.appendChild(b);return b;});
  document.body.appendChild(strip);document.body.appendChild(tab);
  function pin(v){document.body.classList.toggle('strip-pin',v===undefined?!document.body.classList.contains('strip-pin'):v)}
  tab.addEventListener('click',function(e){e.stopPropagation();pin()});
  addEventListener('mousemove',function(e){document.body.classList.toggle('strip-peek',e.clientY>innerHeight-130)});
  addEventListener('keydown',function(e){if((e.key==='t'||e.key==='T')&&!document.body.classList.contains('all'))pin()});
  window.__strip=function(k){thumbs.forEach(function(b,j){b.classList.toggle('cur',j===k)});
   var b=thumbs[k];if(b)row.scrollTo({left:b.offsetLeft-row.clientWidth/2+b.clientWidth/2,behavior:'smooth'})};
 })();
 var h=parseInt(location.hash.slice(1),10);go(isNaN(h)?0:h-1);
 if(/[?&]all\b/.test(location.search)){document.body.classList.add('all')}
 if(/[?&]print\b/.test(location.search)){document.body.classList.add('all','print')}
 addEventListener('keydown',function(e){
  if(document.body.classList.contains('all')&&e.key!=='g'&&e.key!=='G'&&e.key!=='Escape')return;
  if(['ArrowRight','PageDown',' ','Enter'].indexOf(e.key)>-1){e.preventDefault();go(i+1)}
  else if(['ArrowLeft','PageUp','Backspace'].indexOf(e.key)>-1){e.preventDefault();go(i-1)}
  else if(e.key==='p'||e.key==='P'){e.preventDefault();(window.slidesPrint||window.print)()}
  else if(e.key==='Home')go(0);else if(e.key==='End')go(n-1);
  else if(e.key==='f'||e.key==='F'){if(!document.fullscreenElement)document.documentElement.requestFullscreen().catch(function(){});else document.exitFullscreen()}
  else if(e.key==='g'||e.key==='G'||e.key==='Escape'){document.body.classList.toggle('all',e.key!=='Escape'?undefined:false)}
 });
 document.getElementById('deck').addEventListener('click',function(e){
  var s=e.target.closest('.slide');if(document.body.classList.contains('all')&&s){document.body.classList.remove('all');go(slides.indexOf(s));return}
  if(e.target.closest('a,button'))return; if(e.clientX>innerWidth/3)go(i+1);else go(i-1)});
 var x0=null;addEventListener('touchstart',function(e){x0=e.touches[0].clientX},{passive:true});
 addEventListener('touchend',function(e){if(x0===null)return;var d=e.changedTouches[0].clientX-x0;if(Math.abs(d)>40)go(i+(d<0?1:-1));x0=null});
})();

/* QR: any [data-qr] gets a QR code. data-qr="" = this deck's own link */
(function(){
 var els=document.querySelectorAll('[data-qr]'); if(!els.length) return;
 function draw(){
  els.forEach(function(el){
   var url=el.getAttribute('data-qr')||(location.origin+location.pathname);
   try{var q=qrcode(0,'M');q.addData(url);q.make();
    el.innerHTML=q.createSvgTag({cellSize:4,margin:0,scalable:true});}catch(e){el.textContent=url}
  });
 }
 if(window.qrcode){draw();return}
 var sc=document.createElement('script');
 sc.src='https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
 sc.onload=draw; sc.onerror=function(){els.forEach(function(el){el.textContent=el.getAttribute('data-qr')||location.href})};
 document.head.appendChild(sc);
})();

/* PDF: Safari ignores the 16:9 page size -> tell the user to use Chrome */
window.slidesPrint=function(){
 var ua=navigator.userAgent,isSafari=/Safari/.test(ua)&&!/Chrome|Chromium|CriOS|Edg|OPR|Firefox/.test(ua);
 if(!isSafari){
  var t=document.createElement('div');t.className='pdftoast';
  t.innerHTML='ในหน้าต่างพิมพ์ ช่อง <b>Destination</b> เลือก <b>Save as PDF</b> · ถ้าเลือกเครื่องพิมพ์จะได้ A4 มีขอบขาว';
  document.body.appendChild(t);setTimeout(function(){window.print();setTimeout(function(){t.remove()},4000)},350);return}
 var o=document.createElement('div');o.className='pdfhint';
 o.innerHTML='<div class="box"><h3>Safari ทำ PDF 16:9 ไม่ได้</h3><p>Safari จะออกเป็นกระดาษ A4 มีขอบขาว ให้เปิดหน้านี้ใน Google Chrome แล้วกดปุ่มนี้อีกครั้ง จะได้ PDF แนวนอน 16:9 พอดีจอ projector</p><div class="bt"><button class="no" type="button">พิมพ์แบบ A4 ต่อ</button><button class="ok" type="button">เข้าใจแล้ว</button></div></div>';
 o.querySelector('.no').onclick=function(){o.remove();window.print()};
 o.querySelector('.ok').onclick=function(){o.remove()};
 document.body.appendChild(o);
};

/* copy buttons on slides */
document.addEventListener('click',function(e){
 var b=e.target.closest('.cpy');if(!b)return;e.stopPropagation();
 var t=b.getAttribute('data-copy'),old=b.innerHTML,ic=b.classList.contains('ic');
 function done(){if(ic)b.innerHTML='<svg><use href="#i-pass"/></svg>';else b.textContent='คัดลอกแล้ว ✓';b.classList.add('ok');setTimeout(function(){b.innerHTML=old;b.classList.remove('ok')},1500)}
 function fb(){var a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy');done()}catch(x){}a.remove()}
 if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(t).then(done,fb)}else fb();
},true);
