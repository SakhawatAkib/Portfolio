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

  /* ---------------------------------------------------------------
     8. ARCADE AUDIO (Web Audio beeps — no external files)
  --------------------------------------------------------------- */
  var SFX = (function(){
    var ctx = null, muted = false, unlocked = false;
    try { muted = localStorage.getItem("arcade-mute") === "1"; } catch(e){}

    function ensure(){
      if(!ctx){
        var AC = window.AudioContext || window.webkitAudioContext;
        if(!AC) return null;
        ctx = new AC();
      }
      if(ctx.state === "suspended") ctx.resume();
      unlocked = true;
      return ctx;
    }
    function tone(freq, dur, type, gain, slide){
      if(muted) return;
      var c = ensure(); if(!c) return;
      var t0 = c.currentTime;
      var o = c.createOscillator();
      var g = c.createGain();
      o.type = type || "square";
      o.frequency.setValueAtTime(freq, t0);
      if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t0 + dur);
      g.gain.setValueAtTime(gain || 0.06, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      o.connect(g); g.connect(c.destination);
      o.start(t0); o.stop(t0 + dur + 0.02);
    }
    return {
      unlock: ensure,
      isMuted: function(){ return muted; },
      setMuted: function(m){
        muted = !!m;
        try { localStorage.setItem("arcade-mute", muted ? "1" : "0"); } catch(e){}
      },
      coin: function(){ tone(880,.08,"square",.07); setTimeout(function(){ tone(1320,.12,"square",.05); },70); },
      blip: function(){ tone(520,.05,"square",.04); },
      confirm: function(){ tone(660,.06,"square",.05); setTimeout(function(){ tone(990,.1,"square",.05); },60); },
      catch: function(){ tone(740,.05,"triangle",.05,1200); },
      gem: function(){ tone(520,.04,"triangle",.05); setTimeout(function(){ tone(780,.05,"triangle",.05); },40); setTimeout(function(){ tone(1040,.1,"triangle",.04); },80); },
      miss: function(){ tone(180,.15,"sawtooth",.03,80); },
      win: function(){ [523,659,784,1046].forEach(function(f,i){ setTimeout(function(){ tone(f,.12,"square",.05); }, i*90); }); },
      fanfare: function(){ [440,554,659,880].forEach(function(f,i){ setTimeout(function(){ tone(f,.1,"square",.05); }, i*80); }); },
      boot: function(){ tone(110,.2,"sawtooth",.03,440); }
    };
  })();

  /* unlock audio on first gesture */
  ["pointerdown","keydown"].forEach(function(ev){
    document.addEventListener(ev, function once(){
      SFX.unlock();
      document.removeEventListener(ev, once);
    }, {passive:true});
  });

  /* ---------------------------------------------------------------
     9. SCORE / CREDITS / ACHIEVEMENTS
  --------------------------------------------------------------- */
  var Arcade = (function(){
    var credits = 0, score = 0, hi = 0, bestRun = 0;
    var unlocked = {};
    var watched = {};
    var visited = {player:false, career:false, continue:false, arcade:false};

    try {
      credits = parseInt(localStorage.getItem("arcade-credits")||"0",10)||0;
      score = parseInt(localStorage.getItem("arcade-score")||"0",10)||0;
      hi = parseInt(localStorage.getItem("arcade-hi")||"0",10)||0;
      bestRun = parseInt(localStorage.getItem("arcade-best-run")||"0",10)||0;
      unlocked = JSON.parse(localStorage.getItem("arcade-ach")||"{}")||{};
      watched = JSON.parse(localStorage.getItem("arcade-watched")||"{}")||{};
    } catch(e){}

    function pad(n, w){ n = String(Math.max(0, n|0)); while(n.length < w) n = "0"+n; return n; }
    function save(){
      try {
        localStorage.setItem("arcade-credits", String(credits));
        localStorage.setItem("arcade-score", String(score));
        localStorage.setItem("arcade-hi", String(hi));
        localStorage.setItem("arcade-best-run", String(bestRun));
        localStorage.setItem("arcade-ach", JSON.stringify(unlocked));
        localStorage.setItem("arcade-watched", JSON.stringify(watched));
      } catch(e){}
    }
    function render(){
      var c = document.getElementById("creditsVal");
      var s = document.getElementById("scoreVal");
      var h = document.getElementById("hiScoreVal");
      var ac = document.getElementById("arcadeCredits");
      var br = document.getElementById("bestRun");
      if(c) c.textContent = pad(credits, 2);
      if(s) s.textContent = pad(score, 6);
      if(h) h.textContent = pad(hi, 6);
      if(ac) ac.textContent = pad(credits, 2);
      if(br) br.textContent = pad(bestRun, 4);
      var playBtns = [document.getElementById("startArcade")];
      playBtns.forEach(function(b){
        if(!b) return;
        b.disabled = credits < 1;
        b.textContent = credits < 1 ? "▸ NEED 1 CREDIT" : "▸ PLAY COIN RUSH";
      });
      var heroPlay = document.getElementById("playArcade");
      if(heroPlay) heroPlay.disabled = false;
      var strip = document.getElementById("scoreStrip");
      if(strip){ strip.classList.remove("pulse"); void strip.offsetWidth; strip.classList.add("pulse"); }
    }
    function toast(key, title, force){
      if(!force && unlocked[key]) return;
      if(!force) unlocked[key] = true;
      save();
      SFX.gem();
      var host = document.getElementById("toasts");
      if(!host) return;
      var el = document.createElement("div");
      el.className = "toast";
      el.innerHTML = '<span class="toast-k">ACHIEVEMENT UNLOCKED</span><span class="toast-t">'+title+'</span>';
      if(force) el.querySelector(".toast-k").textContent = "ARCADE";
      host.appendChild(el);
      setTimeout(function(){
        el.classList.add("out");
        setTimeout(function(){ el.remove(); }, 320);
      }, 3200);
      if(!force) addScore(250);
    }
    function addScore(n){
      score += n;
      if(score > hi) hi = score;
      save(); render();
    }
    function addCredit(n, silent){
      credits += (n||1);
      if(credits > 99) credits = 99;
      if(!silent) SFX.coin();
      save(); render();
      if(credits >= 1) toast("first_credit", "FIRST CREDIT — MACHINE LIVE");
      if(credits >= 5) toast("coin_hoarder", "COIN HOARDER — 5 CREDITS");
    }
    function spendCredit(){
      if(credits < 1) return false;
      credits -= 1;
      save(); render();
      return true;
    }
    function markWatch(title){
      if(!title) return;
      var first = !watched[title];
      watched[title] = true;
      save();
      if(first) addScore(50);
      var n = Object.keys(watched).length;
      if(n >= 1) toast("first_reel", "FIRST REEL — LIGHTS UP");
      if(n >= 3) toast("reel_hunter", "REEL HUNTER — 3 CABINETS");
      if(n >= 8) toast("floor_tour", "FLOOR TOUR — 8 REELS");
    }
    function markVisit(sec){
      if(visited[sec]) return;
      visited[sec] = true;
      addScore(25);
      if(sec === "player") toast("player_card", "PLAYER CARD LOADED");
      if(sec === "career") toast("career_clear", "CAREER PATH CLEARED");
      if(sec === "continue") toast("continue_yes", "CONTINUE? — YES");
      if(sec === "arcade") toast("arcade_bay", "ARCADE BAY FOUND");
    }
    function setBestRun(n){
      if(n > bestRun){ bestRun = n; save(); }
      render();
      var lr = document.getElementById("lastRun");
      if(lr) lr.textContent = pad(n, 4);
      if(n >= 500) toast("coin_catcher", "COIN CATCHER — 500+ RUN");
      if(n >= 1500) toast("high_roller", "HIGH ROLLER — 1500+ RUN");
    }
    function godMode(){
      document.body.classList.add("god-mode");
      toast("konami", "GOD MODE — KONAMI CLEARED");
      addCredit(3, true);
      SFX.win();
      addScore(1000);
    }

    render();
    // welcome credit for first-time visitors
    try {
      if(!localStorage.getItem("arcade-welcomed")){
        localStorage.setItem("arcade-welcomed", "1");
        if(credits < 1){ credits = 1; save(); render(); }
      }
    } catch(e){}
    return {
      render: render,
      addCredit: addCredit,
      spendCredit: spendCredit,
      addScore: addScore,
      markWatch: markWatch,
      markVisit: markVisit,
      setBestRun: setBestRun,
      godMode: godMode,
      toast: toast,
      getCredits: function(){ return credits; },
      getBestRun: function(){ return bestRun; }
    };
  })();

  /* mute button */
  (function muteUI(){
    var btn = document.getElementById("muteBtn");
    if(!btn) return;
    function sync(){
      var m = SFX.isMuted();
      btn.setAttribute("aria-pressed", m ? "true" : "false");
      btn.setAttribute("aria-label", m ? "Unmute arcade sounds" : "Mute arcade sounds");
      btn.innerHTML = m
        ? '<i class="fa-solid fa-volume-xmark" aria-hidden="true"></i>'
        : '<i class="fa-solid fa-volume-high" aria-hidden="true"></i>';
    }
    sync();
    btn.addEventListener("click", function(){
      SFX.setMuted(!SFX.isMuted());
      sync();
      if(!SFX.isMuted()) SFX.blip();
    });
  })();

  /* insert coin buttons */
  (function coins(){
    function insert(){ Arcade.addCredit(1); }
    var a = document.getElementById("insertCoin");
    var b = document.getElementById("heroCoin");
    var c = document.getElementById("freeCredit");
    if(a) a.addEventListener("click", insert);
    if(b) b.addEventListener("click", insert);
    if(c) c.addEventListener("click", function(){
      try {
        if(localStorage.getItem("arcade-freebie") === "1"){
          Arcade.toast("freebie_used", "FREE CREDIT ALREADY CLAIMED", true);
          SFX.miss();
          return;
        }
        localStorage.setItem("arcade-freebie", "1");
      } catch(e){}
      Arcade.addCredit(1);
      Arcade.toast("freebie", "FREE CREDIT CLAIMED");
    });
    document.addEventListener("keydown", function(e){
      if(e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if(e.key === "c" || e.key === "C"){
        if(document.getElementById("rush") && document.getElementById("rush").classList.contains("open")) return;
        if(document.getElementById("cab") && document.getElementById("cab").classList.contains("open")) return;
        insert();
      }
    });
  })();

  /* section visit achievements — arcade is marked when its popup opens */
  (function visits(){
    if(!("IntersectionObserver" in window)) return;
    ["player","career","continue"].forEach(function(id){
      var el = document.getElementById(id);
      if(!el) return;
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(e.isIntersecting){ Arcade.markVisit(id); io.disconnect(); }
        });
      }, {threshold:.35});
      io.observe(el);
    });
  })();

  /* ---------------------------------------------------------------
     FLOATING ARCADE — PLAYER VS MACHINE opens from bottom-left cartridge
  --------------------------------------------------------------- */
  (function arcadePopup(){
    var panel = document.getElementById("arcade");
    var launcher = document.getElementById("arcadeLauncher");
    var closeBtn = document.getElementById("arcadeClose");
    var last = null;
    if(!panel || !launcher || !closeBtn) return;

    function open(origin){
      last = origin || document.activeElement;
      panel.classList.add("open");
      panel.setAttribute("aria-hidden","false");
      launcher.setAttribute("aria-expanded","true");
      document.body.classList.add("arcade-popup-open");
      panel.querySelectorAll(".reveal").forEach(function(el){ el.classList.add("in"); });
      Arcade.markVisit("arcade");
      SFX.confirm();
      closeBtn.focus();
    }
    function close(){
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden","true");
      launcher.setAttribute("aria-expanded","false");
      document.body.classList.remove("arcade-popup-open");
      if(last && last.focus) last.focus();
    }

    launcher.addEventListener("click", function(){ open(launcher); });
    document.addEventListener("click", function(e){
      var trigger = e.target.closest("[data-arcade-trigger]");
      if(trigger){
        e.preventDefault();
        open(trigger);
        return;
      }
      if(e.target === panel || e.target.closest("#arcadeClose")) close();
    });
    document.addEventListener("keydown", function(e){
      if(!panel.classList.contains("open")) return;
      if(e.key === "Escape"){
        var rush = document.getElementById("rush");
        if(rush && rush.classList.contains("open")) return;
        e.preventDefault();
        close();
      }
    });

    if(location.hash === "#arcade") open(launcher);
  })();

  /* ---------------------------------------------------------------
     10. MODE FILTERS + SURPRISE ME + KEYBOARD CABINET SELECT
  --------------------------------------------------------------- */
  (function cabinetsPlay(){
    var filters = document.getElementById("modeFilters");
    var games = Array.prototype.slice.call(document.querySelectorAll(".game"));
    var selected = -1;

    function visibleGames(){
      return games.filter(function(g){ return !g.classList.contains("filtered-out"); });
    }
    function setSelected(i){
      games.forEach(function(g){ g.classList.remove("cab-selected"); });
      var vis = visibleGames();
      if(!vis.length){ selected = -1; return; }
      selected = ((i % vis.length) + vis.length) % vis.length;
      vis[selected].classList.add("cab-selected");
      vis[selected].scrollIntoView({block:"nearest", behavior: REDUCE ? "auto" : "smooth"});
      SFX.blip();
    }

    if(filters){
      filters.addEventListener("click", function(e){
        var chip = e.target.closest(".mode-chip");
        if(!chip) return;
        filters.querySelectorAll(".mode-chip").forEach(function(c){ c.classList.remove("on"); });
        chip.classList.add("on");
        var mode = chip.getAttribute("data-mode");
        games.forEach(function(g){
          var m = (g.getAttribute("data-mode")||"").toLowerCase();
          var show = mode === "all" || m.indexOf(mode) !== -1;
          g.classList.toggle("filtered-out", !show);
        });
        SFX.confirm();
        Arcade.addScore(5);
        setSelected(0);
      });
    }

    var surprise = document.getElementById("surpriseBtn");
    if(surprise){
      surprise.addEventListener("click", function(){
        var vis = visibleGames();
        if(!vis.length) return;
        var pick = vis[(Math.random()*vis.length)|0];
        setSelected(visibleGames().indexOf(pick));
        SFX.confirm();
        // flash then open reel
        pick.classList.add("cab-selected");
        setTimeout(function(){
          pick.click();
        }, 280);
      });
    }

    document.addEventListener("keydown", function(e){
      if(e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      var rush = document.getElementById("rush");
      var cab = document.getElementById("cab");
      if((rush && rush.classList.contains("open")) || (cab && cab.classList.contains("open"))) return;
      if(e.key === "ArrowRight" || e.key === "ArrowDown"){ e.preventDefault(); setSelected(selected < 0 ? 0 : selected+1); }
      if(e.key === "ArrowLeft" || e.key === "ArrowUp"){ e.preventDefault(); setSelected(selected < 0 ? 0 : selected-1); }
      if((e.key === "Enter") && selected >= 0){
        var vis = visibleGames();
        if(vis[selected]){ e.preventDefault(); vis[selected].click(); }
      }
    });
  })();

  /* hook video open to score */
  (function watchHook(){
    var cab = document.getElementById("cab");
    if(!cab) return;
    var mo = new MutationObserver(function(){
      if(!cab.classList.contains("open")) return;
      var t = document.getElementById("cabTitle");
      var name = t ? t.textContent.replace(/^NOW PLAYING —\s*/,"") : "";
      Arcade.markWatch(name);
      SFX.confirm();
    });
    mo.observe(cab, {attributes:true, attributeFilter:["class"]});
  })();

  /* ---------------------------------------------------------------
     11. KONAMI CODE
  --------------------------------------------------------------- */
  (function konami(){
    var seq = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
    var i = 0;
    document.addEventListener("keydown", function(e){
      var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if(key === seq[i]){
        i++;
        if(i === seq.length){ i = 0; Arcade.godMode(); }
      } else {
        i = (key === seq[0]) ? 1 : 0;
      }
    });
  })();

  /* ---------------------------------------------------------------
     12. COIN RUSH MINI-GAME
  --------------------------------------------------------------- */
  (function coinRush(){
    var rush = document.getElementById("rush");
    var canvas = document.getElementById("rushCanvas");
    var overlay = document.getElementById("rushOverlay");
    var msg = document.getElementById("rushMsg");
    var goBtn = document.getElementById("rushGo");
    var closeBtn = document.getElementById("rushClose");
    var timeEl = document.getElementById("rushTime");
    var scoreEl = document.getElementById("rushScore");
    var comboEl = document.getElementById("rushCombo");
    if(!rush || !canvas) return;

    var ctx = canvas.getContext("2d");
    var W = 720, H = 480;
    var playing = false, raf = 0, pointerX = W/2;
    var state = null;
    var COLORS = ["#ffd23f","#ff2e88","#29f2ff","#57ff8f","#a86bff"];

    function openMachine(){
      rush.classList.add("open");
      rush.setAttribute("aria-hidden","false");
      document.body.style.overflow = "hidden";
      overlay.classList.remove("hide");
      msg.textContent = "READY PLAYER ONE";
      goBtn.textContent = "▸ START";
      goBtn.style.display = "";
      if(timeEl) timeEl.textContent = "15";
      if(scoreEl) scoreEl.textContent = "0";
      if(comboEl) comboEl.textContent = "x1";
      drawIdle();
      goBtn.focus();
    }
    function closeMachine(){
      playing = false;
      cancelAnimationFrame(raf);
      rush.classList.remove("open");
      rush.setAttribute("aria-hidden","true");
      document.body.style.overflow = "";
    }
    function tryStartFromOutside(){
      if(!Arcade.spendCredit()){
        Arcade.toast("need_coin", "NEED A CREDIT — INSERT COIN", true);
        SFX.miss();
        return;
      }
      SFX.confirm();
      openMachine();
    }

    ["startArcade"].forEach(function(id){
      var b = document.getElementById(id);
      if(b) b.addEventListener("click", tryStartFromOutside);
    });
    if(closeBtn) closeBtn.addEventListener("click", closeMachine);
    document.addEventListener("keydown", function(e){
      if(e.key === "Escape" && rush.classList.contains("open")) closeMachine();
    });

    function drawIdle(){
      ctx.fillStyle = "#05030c";
      ctx.fillRect(0,0,W,H);
      // floor grid
      ctx.strokeStyle = "rgba(255,46,136,.25)";
      ctx.lineWidth = 1;
      for(var y=0;y<H;y+=32){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
      for(var x=0;x<W;x+=32){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      ctx.fillStyle = "#ffd23f";
      ctx.font = "16px 'Press Start 2P', monospace";
      ctx.textAlign = "center";
      ctx.fillText("COIN RUSH", W/2, H/2 - 10);
      ctx.fillStyle = "#9d94c9";
      ctx.font = "10px 'Press Start 2P', monospace";
      ctx.fillText("CATCH THE FALLING CREDITS", W/2, H/2 + 24);
    }

    function beginRound(){
      overlay.classList.add("hide");
      state = {
        t: 15,
        score: 0,
        combo: 1,
        comboTimer: 0,
        paddle: {x: W/2, w: 88, h: 16},
        coins: [],
        particles: [],
        spawn: 0,
        last: performance.now()
      };
      playing = true;
      loop(performance.now());
    }

    function spawnCoin(){
      var gem = Math.random() < 0.18;
      state.coins.push({
        x: 30 + Math.random()*(W-60),
        y: -20,
        r: gem ? 12 : 10,
        vy: 2.2 + Math.random()*2.8 + (15 - state.t)*0.12,
        gem: gem,
        c: gem ? "#ff2e88" : COLORS[(Math.random()*COLORS.length)|0],
        spin: Math.random()*Math.PI
      });
    }

    function endRound(){
      playing = false;
      cancelAnimationFrame(raf);
      var final = state.score;
      Arcade.addScore(final);
      Arcade.setBestRun(final);
      SFX.win();
      overlay.classList.remove("hide");
      if(Arcade.getCredits() > 0){
        msg.textContent = "SCORE "+final+"  ·  BEST "+Arcade.getBestRun();
        goBtn.style.display = "";
        goBtn.textContent = "▸ PLAY AGAIN (1 CREDIT)";
      } else {
        msg.textContent = "SCORE "+final+"\nINSERT COIN TO RETRY";
        goBtn.style.display = "none";
      }
    }

    if(goBtn) goBtn.addEventListener("click", function(){
      if(playing) return;
      // replay from overlay costs a credit after the first round
      if(overlay && !overlay.classList.contains("hide") && goBtn.textContent.indexOf("AGAIN") !== -1){
        if(!Arcade.spendCredit()){ SFX.miss(); Arcade.toast("need_coin", "NEED A CREDIT — INSERT COIN", true); return; }
      }
      SFX.confirm();
      beginRound();
    });

    function loop(now){
      if(!playing || !state) return;
      var dt = Math.min(0.05, (now - state.last)/1000);
      state.last = now;
      state.t -= dt;
      state.spawn -= dt;
      state.comboTimer -= dt;
      if(state.comboTimer <= 0) state.combo = 1;
      if(state.spawn <= 0){
        spawnCoin();
        state.spawn = 0.28 + Math.random()*0.35;
      }
      // paddle follows pointer
      state.paddle.x += (pointerX - state.paddle.x) * Math.min(1, dt*18);

      for(var i=state.coins.length-1;i>=0;i--){
        var c = state.coins[i];
        c.y += c.vy;
        c.spin += dt*8;
        var px = state.paddle.x, pw = state.paddle.w, py = H - 36;
        if(c.y + c.r >= py && c.y - c.r <= py + state.paddle.h &&
           c.x >= px - pw/2 - 4 && c.x <= px + pw/2 + 4){
          var pts = (c.gem ? 250 : 100) * state.combo;
          state.score += pts;
          state.combo = Math.min(8, state.combo + 1);
          state.comboTimer = 1.4;
          if(c.gem) SFX.gem(); else SFX.catch();
          for(var p=0;p<8;p++){
            state.particles.push({
              x:c.x, y:c.y, vx:(Math.random()-.5)*6, vy:(Math.random()-.5)*6,
              a:1, c:c.c
            });
          }
          state.coins.splice(i,1);
          continue;
        }
        if(c.y - c.r > H){
          state.coins.splice(i,1);
          state.combo = 1;
          SFX.miss();
        }
      }
      for(var j=state.particles.length-1;j>=0;j--){
        var pt = state.particles[j];
        pt.x += pt.vx; pt.y += pt.vy; pt.a -= 0.04;
        if(pt.a <= 0) state.particles.splice(j,1);
      }

      // draw
      ctx.fillStyle = "#05030c";
      ctx.fillRect(0,0,W,H);
      ctx.strokeStyle = "rgba(41,242,255,.12)";
      for(var gy=0;gy<H;gy+=40){ ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke(); }

      state.coins.forEach(function(c){
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.spin);
        ctx.scale(Math.cos(c.spin)*0.35 + 0.65, 1); // coin flip
        ctx.shadowBlur = 12; ctx.shadowColor = c.c;
        ctx.fillStyle = c.c;
        if(c.gem){
          ctx.beginPath();
          ctx.moveTo(0,-c.r); ctx.lineTo(c.r,0); ctx.lineTo(0,c.r); ctx.lineTo(-c.r,0);
          ctx.closePath(); ctx.fill();
        } else {
          ctx.beginPath(); ctx.arc(0,0,c.r,0,Math.PI*2); ctx.fill();
          ctx.fillStyle = "rgba(0,0,0,.25)";
          ctx.fillRect(-2, -c.r+2, 4, c.r*2-4);
        }
        ctx.restore();
      });

      state.particles.forEach(function(pt){
        ctx.globalAlpha = pt.a;
        ctx.fillStyle = pt.c;
        ctx.fillRect(pt.x-2, pt.y-2, 4, 4);
        ctx.globalAlpha = 1;
      });

      // paddle
      var pad = state.paddle;
      ctx.shadowBlur = 14; ctx.shadowColor = "#29f2ff";
      ctx.fillStyle = "#29f2ff";
      ctx.fillRect(pad.x - pad.w/2, H - 36, pad.w, pad.h);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#0a0716";
      ctx.fillRect(pad.x - pad.w/2 + 4, H - 32, pad.w - 8, 8);

      if(timeEl) timeEl.textContent = String(Math.max(0, Math.ceil(state.t)));
      if(scoreEl) scoreEl.textContent = String(state.score);
      if(comboEl) comboEl.textContent = "x"+state.combo;

      if(state.t <= 0){ endRound(); return; }
      raf = requestAnimationFrame(loop);
    }

    function setPointer(clientX){
      var r = canvas.getBoundingClientRect();
      pointerX = ((clientX - r.left) / r.width) * W;
    }
    canvas.addEventListener("pointermove", function(e){ setPointer(e.clientX); });
    canvas.addEventListener("pointerdown", function(e){ setPointer(e.clientX); canvas.setPointerCapture(e.pointerId); });

    drawIdle();
  })();

  /* ---------------------------------------------------------------
     13. TRANSMIT MESSAGE — email form (FormSubmit)
     Uses FormData + _url (FormSubmit's required origin hint). If AJAX
     still fails on a real http(s) host, falls back to a classic POST
     with _next back to this page (?mail=sent).
  --------------------------------------------------------------- */
  (function mailForm(){
    var form = document.getElementById("mailForm");
    if(!form) return;

    var INBOX = "sakhawatakib@gmail.com";
    var ENDPOINT = "https://formsubmit.co/ajax/" + INBOX;

    var nameEl = document.getElementById("mailName");
    var emailEl = document.getElementById("mailEmail");
    var subjectEl = document.getElementById("mailSubject");
    var messageEl = document.getElementById("mailMessage");
    var subjectHidden = document.getElementById("mailSubjectHidden");
    var replyHidden = document.getElementById("mailReplyto");
    var urlHidden = document.getElementById("mailUrl");
    var statusEl = document.getElementById("mailStatus");
    var sendBtn = document.getElementById("mailSend");
    var sending = false;
    var pageBase = location.href.split("#")[0].split("?")[0];

    function setStatus(text, kind){
      if(!statusEl) return;
      statusEl.textContent = text;
      statusEl.className = "mail-status" + (kind ? " " + kind : "");
    }
    function mark(el, bad){
      if(el) el.classList.toggle("bad", !!bad);
    }
    function validEmail(v){
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    }
    function parseJsonSafe(res){
      return res.text().then(function(text){
        if(!text) return {};
        try { return JSON.parse(text); }
        catch(e){ return { message: text }; }
      });
    }
    function syncFormMeta(email, subject){
      if(subjectHidden){
        subjectHidden.value = subject
          ? ("Portfolio: " + subject)
          : "Portfolio contact — arcade cabinet";
      }
      if(replyHidden) replyHidden.value = email || "";
      // FormSubmit help: hidden _url stops the false "web server" reject
      if(urlHidden) urlHidden.value = pageBase;
    }
    function celebrateSent(){
      form.reset();
      syncFormMeta("", "");
      mark(nameEl, false); mark(emailEl, false); mark(messageEl, false);
      setStatus("MESSAGE DELIVERED TO " + INBOX, "ok");
      SFX.win();
      if(typeof Arcade !== "undefined"){
        Arcade.addScore(100);
        Arcade.toast("mail_sent", "TRANSMISSION SENT — INBOX HIT");
      }
    }
    function nativeFallback(){
      // Classic FormSubmit POST — more reliable than AJAX for some hosts
      var next = form.querySelector("[name='_next']");
      if(!next){
        next = document.createElement("input");
        next.type = "hidden";
        next.name = "_next";
        form.appendChild(next);
      }
      next.value = pageBase + "?mail=sent#continue";
      setStatus("RELAY RETRY — FULL TRANSMIT…", "wait");
      HTMLFormElement.prototype.submit.call(form);
    }

    // Returned from classic POST fallback
    if(/[?&]mail=sent(?:&|$)/.test(location.search)){
      celebrateSent();
      if(history.replaceState){
        history.replaceState(null, "", pageBase + "#continue");
      }
    } else if(urlHidden){
      urlHidden.value = pageBase;
    }

    form.addEventListener("submit", function(e){
      e.preventDefault();
      if(sending) return;

      var name = (nameEl.value || "").trim();
      var email = (emailEl.value || "").trim();
      var subject = (subjectEl.value || "").trim();
      var message = (messageEl.value || "").trim();
      var honey = form.querySelector("[name='_honey']");

      mark(nameEl, !name);
      mark(emailEl, !email || !validEmail(email));
      mark(messageEl, !message);

      if(!name || !email || !validEmail(email) || !message){
        setStatus("TRANSMISSION FAILED — CHECK HIGHLIGHTED FIELDS", "err");
        SFX.miss();
        return;
      }
      if(honey && honey.value){ return; } // bot trap

      // file:// has no Origin — FormSubmit always rejects it
      if(location.protocol === "file:"){
        setStatus("OPEN VIA LIVE SERVER OR GITHUB PAGES — NOT AS A LOCAL FILE", "err");
        SFX.miss();
        return;
      }

      syncFormMeta(email, subject);

      sending = true;
      sendBtn.disabled = true;
      setStatus("TRANSMITTING… STAND BY", "wait");
      SFX.blip();

      // FormData (not JSON) — FormSubmit handles multipart more reliably
      var fd = new FormData(form);
      fd.delete("_next"); // AJAX path should not redirect
      fd.set("_replyto", email);
      fd.set("_url", pageBase);

      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: fd
      })
      .then(function(res){
        return parseJsonSafe(res).then(function(data){
          return { ok: res.ok, status: res.status, data: data };
        });
      })
      .then(function(result){
        var data = result.data || {};
        var msg = String(data.message || data.error || "");
        var success = data.success === true || data.success === "true";

        if(/activat|confirm/i.test(msg)){
          setStatus("CHECK " + INBOX + " (AND SPAM) → CLICK ACTIVATE FORM — THEN RESEND", "err");
          SFX.miss();
          if(typeof Arcade !== "undefined"){
            Arcade.toast("mail_activate", "CHECK GMAIL — ACTIVATE FORMSUBMIT", true);
          }
          return;
        }

        // FormSubmit often returns this even on Live Server when AJAX is flaky —
        // fall back to a classic POST so the email still goes out.
        if(/web server|html files/i.test(msg)){
          nativeFallback();
          return;
        }

        if(!result.ok || (!success && msg)){
          throw new Error(msg || "send failed");
        }

        celebrateSent();
      })
      .catch(function(err){
        var detail = (err && err.message) ? String(err.message) : "";
        // Network / CORS failure on a real host → classic POST last resort
        if(location.protocol.indexOf("http") === 0 && !detail){
          nativeFallback();
          return;
        }
        setStatus(
          detail
            ? ("RELAY ERROR — " + detail.slice(0, 80).toUpperCase())
            : "RELAY OFFLINE — TRY AGAIN OR EMAIL " + INBOX,
          "err"
        );
        SFX.miss();
      })
      .finally(function(){
        sending = false;
        sendBtn.disabled = false;
      });
    });

    [nameEl, emailEl, messageEl].forEach(function(el){
      if(!el) return;
      el.addEventListener("input", function(){ mark(el, false); });
    });
  })();

})();
