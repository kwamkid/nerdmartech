(function(){
 var slides=[].slice.call(document.querySelectorAll('.slide')),n=slides.length,i=0;
 slides.forEach(function(s,k){var p=s.querySelector('.pg');if(p)p.textContent=String(k+1).padStart(2,'0')+' / '+String(n).padStart(2,'0')});
 function fit(){var s=Math.min(innerWidth/1280,innerHeight/720);document.documentElement.style.setProperty('--s',s)}
 function go(k){i=Math.max(0,Math.min(n-1,k));slides.forEach(function(s,j){s.classList.toggle('on',j===i)});
  document.getElementById('bar').style.width=((i+1)/n*100)+'%';try{history.replaceState(null,'','#'+(i+1))}catch(e){}}
 addEventListener('resize',fit);fit();
 var h=parseInt(location.hash.slice(1),10);go(isNaN(h)?0:h-1);
 if(/[?&]all\b/.test(location.search)){document.body.classList.add('all')}
 if(/[?&]print\b/.test(location.search)){document.body.classList.add('all','print')}
 addEventListener('keydown',function(e){
  if(document.body.classList.contains('all')&&e.key!=='g'&&e.key!=='G'&&e.key!=='Escape')return;
  if(['ArrowRight','PageDown',' ','Enter'].indexOf(e.key)>-1){e.preventDefault();go(i+1)}
  else if(['ArrowLeft','PageUp','Backspace'].indexOf(e.key)>-1){e.preventDefault();go(i-1)}
  else if(e.key==='p'||e.key==='P'){e.preventDefault();window.print()}
  else if(e.key==='Home')go(0);else if(e.key==='End')go(n-1);
  else if(e.key==='f'||e.key==='F'){if(!document.fullscreenElement)document.documentElement.requestFullscreen().catch(function(){});else document.exitFullscreen()}
  else if(e.key==='g'||e.key==='G'||e.key==='Escape'){document.body.classList.toggle('all',e.key!=='Escape'?undefined:false)}
 });
 document.getElementById('deck').addEventListener('click',function(e){
  var s=e.target.closest('.slide');if(document.body.classList.contains('all')&&s){document.body.classList.remove('all');go(slides.indexOf(s));return}
  if(e.target.closest('a'))return; if(e.clientX>innerWidth/3)go(i+1);else go(i-1)});
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
