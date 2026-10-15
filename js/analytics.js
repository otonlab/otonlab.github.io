// アクセス解析（GoatCounter・管理者だけが見る）。Cookie なし・集計のみ。
// 本番（otonlab.github.io）だけで数える＝手元の確認・Tailscale では数えない。
// 読み込めなくてもページには何も起きない（async・失敗しても無視）。
(function () {
  if (location.hostname !== 'otonlab.github.io') return;
  // ページは「パス」で区別（/・/terms.html・/solaris/ …）。?以降は数えない（流入元は GoatCounter が別に受け取る）
  window.goatcounter = { path: function () { return location.pathname || '/'; } };
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.setAttribute('data-goatcounter', 'https://otonlab.goatcounter.com/count');
  document.head.appendChild(s);
})();
