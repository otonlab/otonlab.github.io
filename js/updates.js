// OTON LAB アップデート情報：data/updates.json を読んで表示する
// 本文の書き方はオトン学園の data/updates.json と同じ（**太字**・行頭 ● / ・ は箇条書き・空行で段落）＋ [文字](https://…) でリンク
(function (root) {
  const LATEST = 5; // 最初に見せる公開済みの件数

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function inline(s) {
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/\[([^\]]+)\]\((https:\/\/[^\s()<>"]+)\)/g, '<a href="$2">$1</a>');   // [文字](https://…) はリンク（https だけ）
  }

  /** 本文 → HTML（段落と箇条書き） */
  function renderBody(text) {
    return String(text || '').split(/\n\s*\n/).map(block => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      let html = '', list = [], para = [];
      const flushList = () => { if (list.length) { html += '<ul>' + list.map(l => '<li>' + inline(l) + '</li>').join('') + '</ul>'; list = []; } };
      const flushPara = () => { if (para.length) { html += '<p>' + para.map(inline).join('<br>') + '</p>'; para = []; } };
      for (const l of lines) {
        const m = l.match(/^[●・]\s*(.*)$/);
        if (m) { flushPara(); list.push(m[1]); } else { flushList(); para.push(l); }
      }
      flushPara(); flushList();
      return html;
    }).join('');
  }

  /** 公開済みと準備中を分ける。公開済みは新しい順（同じ日はファイルの順） */
  function splitItems(data) {
    const items = (data && data.items) || [];
    const upcoming = items.filter(x => x.status === 'upcoming');
    const released = items
      .map((x, i) => ({ x, i }))
      .filter(o => o.x.status === 'released' && /^\d{4}-\d{2}-\d{2}$/.test(o.x.date || ''))
      .sort((a, b) => (a.x.date < b.x.date ? 1 : a.x.date > b.x.date ? -1 : a.i - b.i))
      .map(o => o.x);
    return { upcoming, latest: released.slice(0, LATEST), past: released.slice(LATEST) };
  }

  function appName(data, id) {
    return (data.apps && data.apps[id] && data.apps[id].name) || id;
  }
  function fmtDate(d) {
    return d.replace(/-/g, '.');
  }

  function itemHtml(data, x) {
    return '<li class="upd-item"><details>' +
      '<summary>' +
        '<span class="upd-meta">' +
          '<time datetime="' + esc(x.date) + '">' + esc(fmtDate(x.date)) + '</time>' +
          '<span class="upd-app">' + esc(appName(data, x.app)) + '</span>' +
          '<span class="upd-status is-released">公開済み</span>' +
        '</span>' +
        '<span class="upd-title">' + inline(x.title) + '</span>' +
      '</summary>' +
      '<div class="upd-body">' + renderBody(x.body) + '</div>' +
    '</details></li>';
  }

  function upcomingHtml(data, x) {
    return '<article class="upd-card">' +
      '<div class="upd-meta">' +
        '<span class="upd-status is-upcoming">準備中</span>' +
        '<span class="upd-app">' + esc(appName(data, x.app)) + '</span>' +
        '<span class="upd-when">公開日未定</span>' +
      '</div>' +
      '<h3 class="upd-card-title">' + inline(x.title) + '</h3>' +
      '<div class="upd-body">' + renderBody(x.body) + '</div>' +
    '</article>';
  }

  function render(data) {
    const { upcoming, latest, past } = splitItems(data);
    const up = document.getElementById('upd-upcoming');
    const list = document.getElementById('upd-list');
    const pastList = document.getElementById('upd-past');
    const more = document.getElementById('upd-more');

    if (upcoming.length) {
      up.innerHTML = '<p class="upd-label">開発中（まだ公開していません）</p>' + upcoming.map(x => upcomingHtml(data, x)).join('');
      up.hidden = false;
    }
    list.innerHTML = latest.length ? latest.map(x => itemHtml(data, x)).join('') : '<li class="upd-msg">まだ更新はありません。</li>';
    if (past.length) {
      pastList.innerHTML = past.map(x => itemHtml(data, x)).join('');
      more.hidden = false;
      more.addEventListener('click', () => {
        const open = more.getAttribute('aria-expanded') === 'true';
        more.setAttribute('aria-expanded', String(!open));
        pastList.hidden = open;
        more.textContent = open ? '過去の更新を見る' : '過去の更新を閉じる';
      });
    }
  }

  const api = { renderBody, splitItems, LATEST };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OtonUpdates = api;

  if (typeof document !== 'undefined' && document.getElementById('upd-list')) {
    fetch('data/updates.json', { cache: 'no-cache' })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(render)
      .catch(() => {
        document.getElementById('upd-list').innerHTML = '<li class="upd-msg">アップデート情報を読み込めませんでした。時間をおいて開き直してください。</li>';
      });
  }
})(typeof window !== 'undefined' ? window : globalThis);
