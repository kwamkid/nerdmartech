(function(){
 var slides=[].slice.call(document.querySelectorAll('.slide')),n=slides.length,i=0;
 slides.forEach(function(s,k){var p=s.querySelector('.pg');if(p)p.textContent=String(k+1).padStart(2,'0')+' / '+String(n).padStart(2,'0')});
 function fit(){var s=Math.min(innerWidth/1280,innerHeight/720);document.documentElement.style.setProperty('--s',s)}
 /* click-to-reveal: elements with data-step="1..N" appear one by one before the slide changes */
 function stepsOf(s){return [].slice.call(s.querySelectorAll('[data-step]'))}
 function maxStep(s){var m=0;stepsOf(s).forEach(function(e){m=Math.max(m,+e.getAttribute('data-step')||0)});return m}
 function setShown(s,k){s._st=k;stepsOf(s).forEach(function(e){var v=(+e.getAttribute('data-step')||0)<=k,was=!e.classList.contains('st-hide');
  e.classList.toggle('st-hide',!v);if(v&&!was){e.classList.remove('st-in');void e.getBoundingClientRect();e.classList.add('st-in')}})}
 function next(){var s=slides[i];if((s._st||0)<maxStep(s))setShown(s,(s._st||0)+1);else go(i+1)}
 function prev(){var s=slides[i];if((s._st||0)>0)setShown(s,s._st-1);else go(i-1,true)}
 function go(k,atEnd){i=Math.max(0,Math.min(n-1,k));slides.forEach(function(s,j){s.classList.toggle('on',j===i)});
  setShown(slides[i],atEnd?maxStep(slides[i]):0);
  document.getElementById('bar').style.width=((i+1)/n*100)+'%';try{history.replaceState(null,'','#'+(i+1))}catch(e){}
  if(window.__strip)window.__strip(i)}
 /* overview grid (G): fill the full width, number every slide */
 function grid(){var W=document.documentElement.clientWidth,pad=32,gap=24,min=340;
  var cols=Math.max(1,Math.floor((W-pad*2+gap)/(min+gap))),cw=(W-pad*2-gap*(cols-1))/cols,r=document.documentElement.style;
  r.setProperty('--gc',cols);r.setProperty('--ts',cw/1280)}
 slides.forEach(function(s,k){var t=document.createElement('span');t.className='tn';t.textContent=k+1;s.appendChild(t)});
 addEventListener('resize',function(){fit();grid()});fit();grid();
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
  /* hub + PDF buttons ride on top of the thumbnail strip */
  var bar=document.createElement('div');bar.className='bar';strip.insertBefore(bar,row);
  ['hubbtn','pdfbtn'].forEach(function(c){var el=document.querySelector('body > .'+c);if(el){el.addEventListener('click',function(e){e.stopPropagation()});bar.appendChild(el)}});
  document.body.appendChild(strip);document.body.appendChild(tab);
  function pin(v){var c=document.body.classList,on=v===undefined?!c.contains('strip-pin'):v;c.toggle('strip-pin',on);if(!on)c.remove('strip-peek')}
  tab.addEventListener('click',function(e){e.stopPropagation();pin()});
  var lastTouch=0;addEventListener('touchstart',function(){lastTouch=Date.now()},{passive:true});addEventListener('mousemove',function(e){if(Date.now()-lastTouch<1000)return;var on=document.body.classList.contains('strip-peek');document.body.classList.toggle('strip-peek',e.clientY>innerHeight-(on?strip.offsetHeight+20:130))});
  addEventListener('keydown',function(e){if((e.key==='t'||e.key==='T')&&!document.body.classList.contains('all'))pin()});
  window.__strip=function(k){thumbs.forEach(function(b,j){b.classList.toggle('cur',j===k)});
   var b=thumbs[k];if(b)row.scrollTo({left:b.offsetLeft-row.clientWidth/2+b.clientWidth/2,behavior:'smooth'})};
 })();
 var h=parseInt(location.hash.slice(1),10);go(isNaN(h)?0:h-1);
 if(/[?&]all\b/.test(location.search)){document.body.classList.add('all')}
 if(/[?&]print\b/.test(location.search)){document.body.classList.add('all','print')}
 addEventListener('keydown',function(e){
  if(document.body.classList.contains('all')&&e.key!=='g'&&e.key!=='G'&&e.key!=='Escape')return;
  if(['ArrowRight','PageDown',' ','Enter'].indexOf(e.key)>-1){e.preventDefault();next()}
  else if(['ArrowLeft','PageUp','Backspace'].indexOf(e.key)>-1){e.preventDefault();prev()}
  else if(e.key==='Home')go(0);else if(e.key==='End')go(n-1);
  else if(e.key==='f'||e.key==='F'){if(!document.fullscreenElement)document.documentElement.requestFullscreen().catch(function(){});else document.exitFullscreen()}
  else if(e.key==='g'||e.key==='G'||e.key==='Escape'){document.body.classList.toggle('all',e.key!=='Escape'?undefined:false)}
 });
 document.getElementById('deck').addEventListener('click',function(e){
  var s=e.target.closest('.slide');if(document.body.classList.contains('all')&&s){document.body.classList.remove('all');go(slides.indexOf(s));return}
  /* only the edge strips change slides, so text can be selected and copied */});
 ['l','r'].forEach(function(d){var z=document.createElement('div');z.className='navz '+d;z.setAttribute('aria-hidden','true');
  z.innerHTML='<svg viewBox="0 0 24 24"><path d="'+(d==='l'?'M15 5l-7 7 7 7':'M9 5l7 7-7 7')+'"/></svg>';
  document.body.appendChild(z)});
 /* edge zones never cover anything clickable: buttons, links and prompt boxes always win */
 var LIVE='a,button,input,textarea,select,.say,.cb,.codes,.strip,.striptab,.hubbtn,.pdfbtn';
 function edge(e){if(document.body.classList.contains('all'))return 0;var w=innerWidth*0.09;
  if(e.target.closest&&e.target.closest(LIVE))return 0;return e.clientX<w?-1:e.clientX>innerWidth-w?1:0}
 addEventListener('mousemove',function(e){var d=edge(e);document.body.classList.toggle('nav-l',d===-1);document.body.classList.toggle('nav-r',d===1)});
 addEventListener('click',function(e){var d=edge(e);if(!d||String(getSelection()).length)return;if(d>0)next();else prev()});
 var x0=null;addEventListener('touchstart',function(e){x0=e.touches[0].clientX},{passive:true});
 addEventListener('touchend',function(e){if(x0===null)return;if(String(getSelection()).length){x0=null;return}var d=e.changedTouches[0].clientX-x0;if(Math.abs(d)>40){if(d<0)next();else prev()}x0=null});
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
