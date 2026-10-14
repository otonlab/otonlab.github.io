// OTON LAB トップページ：星空・メニューの現在地・表示アニメーション・「詳しく見る」
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 星空（またたき） ---- */
  const canvas = document.getElementById('stars');
  const ctx = canvas && canvas.getContext('2d');
  let stars = [];
  let w = 0, h = 0, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(260, (w * h) / 5200));
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() < 0.08 ? 1.3 + Math.random() * 0.6 : 0.4 + Math.random() * 0.7,
      a: 0.35 + Math.random() * 0.6,
      p: Math.random() * Math.PI * 2,
      s: 0.4 + Math.random() * 1.2,
      blue: Math.random() < 0.3,
    }));
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      const tw = reduceMotion ? 1 : 0.65 + 0.35 * Math.sin(s.p + t * 0.001 * s.s);
      ctx.globalAlpha = s.a * tw;
      ctx.fillStyle = s.blue ? '#bfe2ff' : '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  if (ctx) {
    resize();
    let resizeTimer = 0;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { resize(); if (reduceMotion) draw(0); }, 150);
    });
    if (reduceMotion) {
      draw(0);
    } else {
      // 30fps に抑え、タブが見えないときは止める
      let last = 0;
      const loop = t => {
        if (t - last > 33) { draw(t); last = t; }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  }

  /* ---- 表示アニメーション ---- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      }
    }, { rootMargin: '0px 0px -10% 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-in'));
  }

  /* ---- メニューの現在地 ---- */
  const links = [...document.querySelectorAll('.site-nav a[data-nav]')];
  const sections = [...document.querySelectorAll('[data-section]')];
  function updateNav() {
    if (!sections.length) return; // 利用規約などのページ
    const y = window.scrollY + window.innerHeight * 0.35;
    let current = 'top';
    for (const s of sections) if (s.offsetTop <= y) current = s.dataset.section;
    // ページの一番下まで来たら最後のセクション
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      current = sections[sections.length - 1].dataset.section;
    }
    for (const a of links) a.classList.toggle('is-active', a.dataset.nav === current);
  }
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  /* ---- 「詳しく見る」 ---- */
  const more = document.querySelector('.link-more');
  const panel = document.getElementById('mp-more');
  if (more && panel) {
    more.addEventListener('click', () => {
      const open = more.getAttribute('aria-expanded') === 'true';
      more.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
      more.textContent = open ? '詳しく見る' : '閉じる';
    });
  }
})();
