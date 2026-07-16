/* =====================================================================
   INSERT COIN — arcade cabinet portfolio
   Vanilla JS: boot flash, starfield, reveals, hover reels, video cabinet.
   ===================================================================== */
(function(){
  "use strict";
  var REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------
     1. POWER-ON boot flash
  --------------------------------------------------------------- */
  (function boot(){
    var b = document.getElementById("boot");
    if(!b) return;
    if(REDUCE){ b.remove(); return; }
    setTimeout(function(){
      b.classList.add("done");
      setTimeout(function(){ b.remove(); }, 400);
    }, 1250);
  })();

  /* ---------------------------------------------------------------
     2. STARFIELD — neon pixel drift + mouse connect + click blast
  --------------------------------------------------------------- */
  (function starfield(){
    var canvas = document.getElementById("starfield");
    if(!canvas) return;
    var ctx = canvas.getContext("2d");
    var host = document.querySelector(".title-screen");
    var colors = ["#ff2e88","#29f2ff","#ffd23f","#57ff8f","#a86bff"];
    var stars = [], ripples = [], mouse = {x:-999,y:-999}, W=0, H=0, DPR=Math.min(window.devicePixelRatio||1, 2);

    function size(){
      W = host.clientWidth; H = host.clientHeight;
      canvas.width = W*DPR; canvas.height = H*DPR;
      canvas.style.width = W+"px"; canvas.style.height = H+"px";
      ctx.setTransform(DPR,0,0,DPR,0,0);
    }
    function seed(){
      stars = [];
      var n = Math.min(260, Math.round(W*H/5000));
      for(var i=0;i<n;i++){
        var sx=Math.random()*W, sy=Math.random()*H;
        stars.push({
          x:sx, y:sy,
          vx:(Math.random()-.5)*.8, vy:(Math.random()-.5)*.8,
          s:Math.random()<.15 ? 4 : 2,
          c:colors[(Math.random()*colors.length)|0]
        });
      }
    }
    function step(){
      ctx.clearRect(0,0,W,H);
      // connect lines near mouse
      for(var i=0;i<stars.length;i++){
        var p = stars[i];
        p.x += p.vx; p.y += p.vy;
        // wrap around edges so particles drift continuously
        if(p.x < -6) p.x = W + 6;
        else if(p.x > W + 6) p.x = -6;
        if(p.y < -6) p.y = H + 6;
        else if(p.y > H + 6) p.y = -6;
        // very light damping — lets blast-launched particles gradually settle
        p.vx *= 0.9985;
        p.vy *= 0.9985;
        var dx=p.x-mouse.x, dy=p.y-mouse.y, d=Math.hypot(dx,dy);
        if(d<140){
          ctx.strokeStyle = p.c; ctx.globalAlpha = (1-d/140)*.5; ctx.lineWidth=1;
          ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(mouse.x,mouse.y); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 8; ctx.shadowColor = p.c; ctx.fillStyle = p.c;
        ctx.fillRect(p.x - p.s/2, p.y - p.s/2, p.s, p.s);
        ctx.shadowBlur = 0;
      }
      // click shockwaves
      for(var r=ripples.length-1;r>=0;r--){
        var w = ripples[r]; w.rad += (w.spd||7); w.a -= (w.fade||.02);
        if(w.a<=0){ ripples.splice(r,1); continue; }
        ctx.globalAlpha = w.a; ctx.strokeStyle = w.c; ctx.lineWidth = (w.lw||2);
        ctx.beginPath(); ctx.arc(w.x, w.y, w.rad, 0, Math.PI*2); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      // charge-up indicator while pressing and holding
      if(charge){
        var t = Math.min(1, (performance.now() - charge.start) / maxChargeMs);
        var full = t >= 1;
        var pulse = 0.65 + 0.35 * Math.sin(performance.now() / 70);
        var coreColor = full ? "#ff2e88" : "#29f2ff";
        var ringR = 10 + 52 * t;

        // pull nearby stars slightly INWARD toward the charge (energy gathering)
        for(var ci=0;ci<stars.length;ci++){
          var sp = stars[ci], sdx = charge.x - sp.x, sdy = charge.y - sp.y, sd = Math.hypot(sdx, sdy)||1;
          if(sd < 140){ sp.vx += (sdx/sd) * 0.06 * t; sp.vy += (sdy/sd) * 0.06 * t; }
        }

        // outer growing ring
        ctx.save();
        ctx.globalAlpha = 0.5 + 0.4 * t;
        ctx.strokeStyle = coreColor;
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 18 * pulse;
        ctx.shadowColor = coreColor;
        ctx.beginPath();
        ctx.arc(charge.x, charge.y, ringR * (full ? pulse : 1), 0, Math.PI*2);
        ctx.stroke();

        // progress arc — fills clockwise as it charges
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = full ? "#ffd23f" : "#57ff8f";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(charge.x, charge.y, ringR + 6, -Math.PI/2, -Math.PI/2 + Math.PI*2*t);
        ctx.stroke();

        // bright inner core, brighter as it fills
        ctx.globalAlpha = 0.35 + 0.5 * t;
        ctx.fillStyle = full ? "#ffd23f" : "#29f2ff";
        ctx.shadowBlur = 24 * pulse;
        ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath();
        ctx.arc(charge.x, charge.y, (4 + 10 * t) * pulse, 0, Math.PI*2);
        ctx.fill();

        // crackling sparks when nearly full
        if(t > 0.55){
          var sparks = Math.round((t - 0.55) * 14);
          for(var s=0;s<sparks;s++){
            var ang = Math.random() * Math.PI * 2;
            var rr = ringR * (0.7 + Math.random() * 0.6);
            ctx.globalAlpha = Math.random() * 0.8 * t;
            ctx.fillStyle = colors[(Math.random()*colors.length)|0];
            ctx.shadowBlur = 8;
            ctx.shadowColor = ctx.fillStyle;
            var sx = charge.x + Math.cos(ang) * rr;
            var sy = charge.y + Math.sin(ang) * rr;
            ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
          }
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(step);
    }
    var raf;
    size(); seed();
    if(!REDUCE){ step(); }
    else { // static frame for reduced motion
      for(var i=0;i<stars.length;i++){var p=stars[i];ctx.fillStyle=p.c;ctx.fillRect(p.x,p.y,p.s,p.s);}
    }

    var charge = null; // active charge: {x, y, start}
    var maxChargeMs = 1400;

    window.addEventListener("resize", function(){ size(); seed(); });
    host.addEventListener("mousemove", function(e){
      var r = canvas.getBoundingClientRect(); mouse.x = e.clientX-r.left; mouse.y = e.clientY-r.top;
    });
    host.addEventListener("mouseleave", function(){ mouse.x=-999; mouse.y=-999; });

    host.addEventListener("pointerdown", function(e){
      if(REDUCE) return;
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left;
      var y = e.clientY - r.top;
      charge = {x: x, y: y, start: performance.now()};
    });

    function releaseBlast(){
      if(!charge) return;
      var x = charge.x;
      var y = charge.y;
      var held = performance.now() - charge.start;
      var intensity = Math.min(1, held / maxChargeMs); // 0 to 1
      // exponential curve — light taps stay gentle, holding ramps up hard
      var power = Math.pow(intensity, 2.2);
      charge = null;

      // main shockwave — expands faster and fades slower the harder you charged
      ripples.push({
        x: x, y: y, rad: 4, a: 0.95,
        spd: 6 + 20 * power,      // 6 → 26 px/frame
        fade: 0.026 - 0.016 * power, // slower fade at full charge = wider wave
        lw: 2 + 4 * power,
        c: intensity >= 1 ? "#ffd23f" : colors[(Math.random()*colors.length)|0]
      });
      // echo rings scaled by intensity
      var echoes = Math.round(power * 3); // 0-3 extra rings
      for(var ri = 0; ri < echoes; ri++){
        ripples.push({
          x: x, y: y, rad: 4, a: 0.6,
          spd: 5 + 14 * power, fade: 0.03, lw: 1.5,
          c: colors[(Math.random()*colors.length)|0]
        });
      }

      // push particles with force + range scaled by the intensity curve
      var force = 2 + 22 * power;           // ~2x tap → ~24x full charge
      var distance = 150 + 500 * power;     // blast radius grows with charge

      for(var i=0;i<stars.length;i++){
        var p=stars[i], dx=p.x-x, dy=p.y-y, d=Math.hypot(dx,dy)||1;
        if(d < distance){
          var falloff = 1 - (d / distance); // stronger near the center
          p.vx += (dx/d) * force * falloff;
          p.vy += (dy/d) * force * falloff;
        }
      }
    }

    host.addEventListener("pointerup", releaseBlast);
    host.addEventListener("pointerleave", releaseBlast);
    host.addEventListener("pointercancel", function(){ charge = null; });
  })();

  /* ---------------------------------------------------------------
     3. REVEAL ON SCROLL (skip hero, which load-animates) + ability bars
  --------------------------------------------------------------- */
  (function reveals(){
    var items = Array.prototype.slice.call(document.querySelectorAll(".reveal"))
      .filter(function(el){ return !el.closest(".title-inner"); });
    if(REDUCE || !("IntersectionObserver" in window)){
      items.forEach(function(el){ el.classList.add("in"); });
      document.querySelectorAll(".abil-bar").forEach(function(b){ b.classList.add("fill"); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(!e.isIntersecting) return;
        e.target.classList.add("in");
        // stagger cabinets by grid position
        var cabs = e.target.parentElement && e.target.parentElement.classList.contains("cabinets");
        io.unobserve(e.target);
      });
    }, {threshold:.16, rootMargin:"0px 0px -6% 0px"});
    items.forEach(function(el){ io.observe(el); });

    // fill ability bars when the player section scrolls in
    var abils = document.querySelector(".abilities");
    if(abils){
      var io2 = new IntersectionObserver(function(en){
        en.forEach(function(e){
          if(!e.isIntersecting) return;
          document.querySelectorAll(".abil-bar").forEach(function(b,i){
            setTimeout(function(){ b.classList.add("fill"); }, i*110);
          });
          io2.disconnect();
        });
      }, {threshold:.4});
      io2.observe(abils);
    }
  })();

  /* ---------------------------------------------------------------
     4. MOBILE MENU
  --------------------------------------------------------------- */
  (function menu(){
    var burger = document.getElementById("burger"), nav = document.getElementById("menu");
    if(!burger || !nav) return;
    burger.addEventListener("click", function(){
      var open = nav.classList.toggle("open");
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function(e){
      if(e.target.closest("a")){ nav.classList.remove("open"); burger.classList.remove("open"); burger.setAttribute("aria-expanded","false"); }
    });
  })();

  /* ---------------------------------------------------------------
     5. GAME CABINET HOVER — cycle screenshots (two-layer crossfade)
  --------------------------------------------------------------- */
  (function hoverReels(){
    document.querySelectorAll(".game").forEach(function(card){
      var base = card.getAttribute("data-base");
      var shots = (card.getAttribute("data-shots")||"").split(",").filter(Boolean);
      if(!base || !shots.length) return;
      var urls = shots.map(function(n){ return base + n.trim() + ".png"; });
      var layers = card.querySelectorAll(".g-shot");
      var A = layers[0], B = layers[1];
      var timer=null, idx=0, active=A, hidden=B, preloaded=false;

      function preload(){ if(preloaded) return; preloaded=true; urls.forEach(function(u){ var im=new Image(); im.src=u; }); }

      function start(){
        preload();
        idx = 0;
        A.src = urls[0]; A.classList.add("on"); B.classList.remove("on");
        active = A; hidden = B;
        if(REDUCE || urls.length<2) return;
        timer = setInterval(function(){
          idx = (idx+1) % urls.length;
          hidden.src = urls[idx];
          hidden.classList.add("on");
          active.classList.remove("on");
          var t = active; active = hidden; hidden = t;
        }, 1050);
      }
      function stop(){
        if(timer){ clearInterval(timer); timer=null; }
        A.classList.remove("on"); B.classList.remove("on");
      }
      card.addEventListener("mouseenter", start);
      card.addEventListener("mouseleave", stop);
      card.addEventListener("focusin", start);
      card.addEventListener("focusout", stop);
    });
  })();

  /* ---------------------------------------------------------------
     6. VIDEO CABINET (lightbox) — play gameplay reels in-browser
  --------------------------------------------------------------- */
  (function cabinet(){
    var cab = document.getElementById("cab"),
        video = document.getElementById("cabVideo"),
        title = document.getElementById("cabTitle"),
        closeBtn = document.getElementById("cabClose"),
        last = null;

    function open(src, name, origin){
      last = origin || null;
      video.src = src;
      title.textContent = "NOW PLAYING — " + (name || "GAMEPLAY");
      cab.classList.add("open");
      cab.setAttribute("aria-hidden","false");
      document.body.style.overflow = "hidden";
      var p = video.play(); if(p && p.catch) p.catch(function(){});
      closeBtn.focus();
    }
    function close(){
      cab.classList.remove("open");
      cab.setAttribute("aria-hidden","true");
      video.pause(); video.removeAttribute("src"); video.load();
      document.body.style.overflow = "";
      if(last && last.focus) last.focus();
    }

    document.addEventListener("click", function(e){
      // explicit trigger buttons (hero, featured) carry data-video
      var trigger = e.target.closest("[data-video]");
      if(trigger && !trigger.classList.contains("game")){
        e.preventDefault();
        open(trigger.getAttribute("data-video"), trigger.getAttribute("data-title"), trigger);
        return;
      }
      // whole game cabinet opens its reel (store links open externally)
      var game = e.target.closest(".game");
      if(game && game.getAttribute("data-video")){
        if(e.target.closest(".game-stores")) return;
        e.preventDefault();
        open(game.getAttribute("data-video"), game.getAttribute("data-title"), game);
        return;
      }
      if(e.target === cab || e.target.closest("#cabClose")) close();
    });
    document.addEventListener("keydown", function(e){
      if(e.key === "Escape" && cab.classList.contains("open")) close();
    });
    // keyboard: Enter/Space on a focused game card
    document.querySelectorAll(".game").forEach(function(g){
      g.setAttribute("tabindex","0");
      g.setAttribute("role","button");
      g.addEventListener("keydown", function(e){
        if(e.target.closest(".game-stores")) return;
        if(e.key === "Enter" || e.key === " "){ e.preventDefault(); open(g.getAttribute("data-video"), g.getAttribute("data-title"), g); }
      });
    });
  })();

  /* ---------------------------------------------------------------
     7. CONTINUE countdown (cosmetic 9..0 loop) + random title glitch
  --------------------------------------------------------------- */
  (function extras(){
    if(REDUCE) return;
    var count = document.getElementById("count");
    if(count){
      var n = 9;
      setInterval(function(){ n = (n===0) ? 9 : n-1; count.textContent = n; }, 1000);
    }
    var title = document.querySelector(".glitch");
    if(title){
      setInterval(function(){
        title.style.animation = "none"; void title.offsetWidth;
        title.style.animation = "glitch .3s steps(2) 2";
      }, 6500);
    }
  })();

})();
