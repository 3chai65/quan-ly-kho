/**
 * Quản Lý Kho — HTML + CSS + JS client (nhúng inline).
 * Tách khỏi worker.js để dễ bảo trì; Wrangler tự bundle khi deploy.
 */

export const PAGE = String.raw`<!doctype html>
<html lang="vi" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Quản Lý Kho — Sổ kho, đơn bán và doanh thu</title>
<meta name="description" content="Quản lý kho dược liệu: đơn bán lẻ, đơn thuốc chén, nhập hàng, tồn kho, lịch sử giao dịch và thống kê doanh thu 12 tháng. Đồng bộ Cloud.">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" id="themeColor" content="#f5f7fa">
<meta name="robots" content="noindex, nofollow">
<link id="favicon" rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Ccircle cx='256' cy='256' r='256' fill='%23fff'/%3E%3Cpath fill='%23000' d='M256 64c53 0 96 43 96 96s-43 96-96 96s-96 43-96 96s43 96 96 96c-106 0-192-86-192-192S150 64 256 64m0 448a256 256 0 1 0 0-512a256 256 0 1 0 0 512m32-352a32 32 0 1 0-64 0a32 32 0 1 0 64 0m-64 192a32 32 0 1 1 64 0a32 32 0 1 1-64 0'/%3E%3C/svg%3E">
<style nonce="%%NONCE%%">
*,*::before,*::after{box-sizing:border-box}
:root{
color-scheme:light;
--bg:#f5f7fa;--surface:#fff;--surface2:#f8fafc;--border:#e3e8ef;--border2:#eef2f7;
--text:#0f172a;--text2:#475569;--muted:#5b6b81;
--brand:#4f46e5;--brand-text:#4338ca;--brand-soft:#eef2ff;
--green:#047857;--green-soft:#ecfdf5;--green-text:#047857;
--amber:#b45309;--amber-soft:#fffbeb;--amber-text:#b45309;
--red:#be123c;--red-soft:#fff1f2;--red-text:#be123c;
--blue:#1d4ed8;--blue-soft:#eff6ff;--blue-text:#1d4ed8;
--purple:#6d28d9;--purple-soft:#f5f3ff;--purple-text:#6d28d9;
--r:14px;--r-sm:10px;
--sh:0 1px 2px rgba(15,23,42,.05),0 2px 8px rgba(15,23,42,.05);
--ring:0 0 0 3px rgba(79,70,229,.30);
}
html[data-theme=dark]{
color-scheme:dark;
--bg:#0a0f1a;--surface:#111827;--surface2:#182234;--border:#25334a;--border2:#1d2942;
--text:#e9eef8;--text2:#c2cddd;--muted:#95a3b8;
--brand:#6366f1;--brand-text:#a5b4fc;--brand-soft:#1e1b4b;
--green:#10b981;--green-soft:#062e26;--green-text:#34d399;
--amber:#f59e0b;--amber-soft:#3a2a06;--amber-text:#fbbf24;
--red:#f43f5e;--red-soft:#3f1020;--red-text:#fb7185;
--blue:#60a5fa;--blue-soft:#0b2447;--blue-text:#93c5fd;
--purple:#a78bfa;--purple-soft:#241b45;--purple-text:#c4b5fd;
--sh:0 1px 2px rgba(0,0,0,.5);
--ring:0 0 0 3px rgba(129,140,248,.35);
}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--text);
font:15px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif;
padding-bottom:48px;-webkit-font-smoothing:antialiased}
[hidden]{display:none!important}
h1,h2,h3,p{margin:0}
a{color:var(--brand-text)}
.sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.sprite{position:absolute;width:0;height:0;overflow:hidden}
.ico{width:1.15em;height:1.15em;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none;vertical-align:-.18em}
.skip{position:absolute;left:-9999px;top:0;z-index:200;background:var(--surface);color:var(--text);padding:10px 16px;border-radius:0 0 10px 0}
.skip:focus{left:0}
:focus-visible{outline:2px solid var(--brand);outline-offset:2px}
/* ---------- layout ---------- */
.wrap{max-width:1120px;margin:0 auto;padding:0 16px}
.top{position:sticky;top:0;z-index:30;background:var(--surface);border-bottom:1px solid var(--border)}
.bar{display:flex;align-items:center;gap:10px;justify-content:space-between;flex-wrap:wrap;min-height:60px}
.brand{display:flex;align-items:center;gap:9px;font-weight:800;font-size:17px;color:var(--text);text-decoration:none;letter-spacing:-.01em}
.brand .ico{width:22px;height:22px;color:var(--brand)}
.bar__actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.main{padding:18px 0 0}
/* ---------- buttons ---------- */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:40px;padding:8px 14px;
border-radius:var(--r-sm);border:1px solid var(--border);background:var(--surface);color:var(--text);
font:inherit;font-size:14px;font-weight:600;cursor:pointer;text-decoration:none;
transition:background .15s,border-color .15s,color .15s}
.btn:hover{background:var(--surface2)}
.btn:active{transform:translateY(1px)}
.btn--primary{background:#4f46e5;border-color:#4f46e5;color:#fff}
.btn--primary:hover{background:#4338ca;border-color:#4338ca}
.btn--green{background:#047857;border-color:#047857;color:#fff}
.btn--green:hover{background:#065f46;border-color:#065f46}
.btn--dark{background:#334155;border-color:#334155;color:#fff}
.btn--dark:hover{background:#1e293b;border-color:#1e293b}
.btn--icon{min-width:38px;min-height:38px;padding:6px}
.btn--sm{min-height:34px;padding:5px 11px;font-size:13px}
.btn--danger{color:var(--red-text);background:transparent;border-color:transparent}
.btn--danger:hover{background:var(--red-soft)}
.btn[disabled]{opacity:.4;cursor:not-allowed}
/* ---------- menu ---------- */
.menu{position:relative}
.menu__list{position:absolute;right:0;top:calc(100% + 6px);min-width:178px;background:var(--surface);
border:1px solid var(--border);border-radius:12px;box-shadow:0 14px 34px rgba(15,23,42,.18);padding:6px;z-index:60}
.menu__item{display:flex;align-items:center;gap:9px;width:100%;padding:9px 10px;border:0;background:transparent;
color:var(--text);border-radius:8px;font:inherit;font-size:14px;cursor:pointer;text-align:left}
.menu__item:hover{background:var(--surface2)}
.menu__item[aria-checked=true]{background:var(--brand-soft);color:var(--brand-text);font-weight:700}
/* ---------- row action menu (···) ---------- */
.rowmenu{position:static;display:inline-flex}
.rowmenu__list{position:fixed;z-index:120;min-width:180px;background:var(--surface);
border:1px solid var(--border);border-radius:12px;box-shadow:0 14px 34px rgba(15,23,42,.18);padding:6px}
.rowmenu__list[hidden]{display:none}
.menu__item--danger{color:var(--red-text)}
.menu__item--danger:hover{background:var(--red-soft);color:var(--red-text)}
/* ---------- cards ---------- */
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);box-shadow:var(--sh);overflow:hidden}
.card__head{display:flex;align-items:center;gap:10px;padding:13px 16px;flex-wrap:wrap}
.card__title{font-size:15px;font-weight:700;letter-spacing:-.01em}
.card__body{padding:16px}
.card__foot{padding:13px 16px;border-top:1px solid var(--border2)}
details>.card__head{cursor:pointer;list-style:none;user-select:none}
details>.card__head::-webkit-details-marker{display:none}
details[open]>.card__head{border-bottom:1px solid var(--border2)}
details>.card__head:hover{background:var(--surface2)}
.chev{transition:transform .18s;color:var(--muted)}
details[open] .chev{transform:rotate(90deg)}
.spacer{flex:1 1 auto}
/* ---------- stats ---------- */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}
.stat{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);box-shadow:var(--sh);
padding:15px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px}
.stat__k{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--muted)}
.stat__v{font-size:22px;font-weight:800;letter-spacing:-.02em;margin-top:3px;font-variant-numeric:tabular-nums}
.stat__ic{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;flex:none}
.stat__ic .ico{width:20px;height:20px}
.stat__sub{font-size:11px;color:var(--muted);margin-top:4px;line-height:1.45}
.stat__sub b{color:var(--text2);font-weight:700;font-variant-numeric:tabular-nums}
.ic-blue{background:var(--blue-soft);color:var(--blue-text)}
.ic-green{background:var(--green-soft);color:var(--green-text)}
.ic-amber{background:var(--amber-soft);color:var(--amber-text)}
.ic-purple{background:var(--purple-soft);color:var(--purple-text)}
</style>
<style nonce="%%NONCE%%">
/* ---------- forms ---------- */
.field{min-width:0}
.lbl{display:block;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);margin-bottom:5px}
.inp{width:100%;min-height:42px;padding:9px 12px;border-radius:var(--r-sm);border:1px solid var(--border);
background:var(--surface);color:var(--text);font:inherit;font-size:14px}
.inp::placeholder{color:var(--muted);opacity:.85}
.inp:focus{outline:none;border-color:var(--brand);box-shadow:var(--ring)}
.inp--sm{min-height:36px;padding:6px 9px;font-size:13px;border-radius:8px}
.inp--num{text-align:right;font-variant-numeric:tabular-nums}
/* Ẩn mũi tên spin của mọi input number (desktop) — mobile vẫn nhập số qua bàn phím */
input[type=number]::-webkit-outer-spin-button,
input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
input[type=number]{-moz-appearance:textfield;appearance:textfield}
select.inp{cursor:pointer}
.datefield,.monthfield{position:relative}
.datefield .inp{padding-right:42px}
.monthfield .inp{padding-right:32px}
.datefield__ico,.monthfield__ico{position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none}
.datefield__ico{width:18px;height:18px}
.monthfield__ico{width:15px;height:15px;right:9px}
.datefield__native,.monthfield__native{position:absolute;right:0;top:0;height:100%;opacity:0;border:0;padding:0;cursor:pointer}
.datefield__native{width:42px}
.monthfield__native{width:30px}
.row{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:end}
.nhap-row{display:grid;grid-template-columns:minmax(0,1fr) 110px 128px;gap:10px;align-items:end}
.grid2{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}
.grid2+.grid2,.stats+.grid2{margin-top:18px}
.stack{display:grid;gap:12px}
.stack>*+*{margin-top:0}
/* ---------- table ---------- */
.tw{overflow-x:auto;-webkit-overflow-scrolling:touch;position:relative}
table{width:100%;border-collapse:collapse;font-size:14px}
th{text-align:left;font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);
font-weight:700;padding:9px 10px;border-bottom:1px solid var(--border);white-space:nowrap}
td{padding:8px 10px;border-bottom:1px solid var(--border2);vertical-align:middle}
tbody tr:last-child td{border-bottom:0}
tbody tr:hover{background:var(--surface2)}
.num{font-variant-numeric:tabular-nums}
.c-num{width:46px;text-align:center}
.c-del{width:46px;text-align:center}
.c-act{width:104px;text-align:center}
.c-act .inline-row{justify-content:center;gap:4px}
.c-qty{width:110px}
.c-money{width:130px}
table.ord,table.inv,table.his{min-width:0}
.muted{color:var(--muted)}
.small{font-size:12px}
.empty-cell{padding:22px 10px;text-align:center}
.b{font-weight:700}
.linkbtn{padding:0;border:0;background:transparent;color:var(--brand-text);font:inherit;font-weight:700;
text-align:left;text-decoration:underline;text-underline-offset:2px;cursor:pointer}
.linkbtn:hover{color:var(--brand)}
.txt-blue{color:var(--blue-text)}
.txt-green{color:var(--green-text)}
.txt-red{color:var(--red-text)}
.txt-brand{color:var(--brand-text)}
/* ---------- suggest ---------- */
.sug{position:relative}
.sug__list{position:absolute;z-index:40;left:0;right:0;top:calc(100% + 4px);max-height:288px;overflow:auto;
background:var(--surface);border:1px solid var(--border);border-radius:var(--r-sm);
box-shadow:0 16px 36px rgba(15,23,42,.20);padding:4px}
.sug__item{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:8px 10px;
border:0;border-radius:8px;background:transparent;color:inherit;font:inherit;font-size:14px;cursor:pointer;text-align:left}
.sug__item:hover,.sug__item[aria-selected=true]{background:var(--brand-soft)}
.sug__name{font-weight:600}
.sug__meta{font-size:12px;color:var(--muted);white-space:nowrap}
.sug__empty{padding:10px;font-size:13px;color:var(--muted)}
/* ---------- misc ---------- */
.mt-10{margin-top:10px}.mt-12{margin-top:12px}.mt-18{margin-top:18px}.mb-12{margin-bottom:12px}
.w-70{width:70px}.w-120{width:120px}.w-full{width:100%}
.gap-12{gap:12px}
.lbl--flat{margin:0}
.inline-row{display:flex;align-items:center;gap:6px}
.bak-actions{display:flex;flex-wrap:wrap;gap:8px}
.chk{display:flex;align-items:center;gap:9px;font-size:13px;color:var(--text2);cursor:pointer;user-select:none}
.chk input{width:18px;height:18px;accent-color:var(--brand);cursor:pointer}
.total{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.total__v{font-size:20px;font-weight:800;font-variant-numeric:tabular-nums}
.hintbox{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;
background:var(--surface2);border:1px solid var(--border2);border-radius:var(--r-sm);padding:10px 12px}
.hint{font-size:12px;color:var(--muted)}
.pager{display:flex;align-items:center;gap:5px;flex-wrap:wrap}
.pager__num{min-width:34px;justify-content:center}
.pager__num[aria-current=page]{background:var(--brand);border-color:var(--brand);color:#fff}
.foot{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;
margin-top:14px;padding-top:13px;border-top:1px solid var(--border2)}
.note{margin-top:12px;border:1px solid var(--border);border-radius:var(--r-sm);overflow-x:auto;overflow-y:hidden;background:var(--amber-soft);
border-left:3px solid var(--red)}
.note__head{display:flex;justify-content:space-between;gap:10px;padding:7px 12px;font-size:11px;font-weight:700;
letter-spacing:.05em;text-transform:uppercase;color:var(--amber-text);border-bottom:1px solid var(--border)}
.note table{background:transparent}
.note th{background:transparent}
.note td{height:34px;padding:4px 10px;border-bottom:1px dashed var(--border)}
.note tbody tr:hover{background:transparent}
.note tfoot td{height:40px;border-top:2px solid var(--border);border-bottom:0;font-weight:800}
.note .foot{margin:0;padding:8px 12px}
.note .r{text-align:right}
.foot--retail{display:grid;grid-template-columns:1fr 104px;gap:0;padding-left:13px}
.foot--retail .total{padding-right:10px}
.foot--retail .btn{width:100%;padding-left:6px;padding-right:6px}
.legend{display:flex;gap:16px;font-size:12px;color:var(--muted);align-items:center}
.dot{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:-1px}
.dot--imp{background:#6366f1}
.dot--exp{background:#10b981}
.chart{display:block;width:100%;height:300px;cursor:pointer}
.chart-tip{margin-top:8px;min-height:18px}
/* ---------- toast ---------- */
.toast{position:fixed;z-index:120;left:50%;bottom:22px;transform:translate(-50%,150%);
opacity:0;visibility:hidden;
display:flex;align-items:center;gap:10px;max-width:calc(100% - 32px);
padding:11px 16px;border-radius:12px;background:#111827;color:#f8fafc;font-size:14px;font-weight:500;
box-shadow:0 16px 40px rgba(0,0,0,.35);transition:transform .26s ease,opacity .26s ease;pointer-events:none}
.toast.is-on{transform:translate(-50%,0);opacity:1;visibility:visible}
.toast .ico{color:#34d399}
.toast[data-kind=error] .ico{color:#fbbf24}
/* ---------- dialog ---------- */
.dlg{border:0;padding:0;background:transparent;max-width:min(440px,calc(100% - 24px));width:100%;
max-height:calc(100dvh - 24px);overflow:auto}
.dlg::backdrop{background:rgba(10,15,26,.6)}
.dlg__card{width:100%}
.dlg--wide{max-width:min(640px,calc(100% - 24px))}
.foot--rec{margin-top:0;padding-top:0;border-top:0}
.mrow{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px dashed var(--border);cursor:pointer}
.mrow:last-child{border-bottom:0}
.mrow input{margin-top:3px;width:18px;height:18px;flex:none}
.note td.num{white-space:nowrap}
.dlg__foot{display:flex;justify-content:flex-end;gap:8px}
/* ---------- responsive ---------- */
@media (max-width:900px){
.grid2{grid-template-columns:1fr}
.stats{grid-template-columns:repeat(2,1fr)}
}
@media (max-width:640px){
.wrap{padding:0 12px}
.bar{min-height:56px}
.brand span{font-size:15px}
.hide-sm{display:none}
.stat__v{font-size:19px}
.stat__ic{width:36px;height:36px;border-radius:10px}
.card__body{padding:13px}
.row{grid-template-columns:1fr}
.nhap-row{grid-template-columns:minmax(0,1fr) 78px 94px;gap:8px}
.btn{min-height:44px}
.btn--sm{min-height:38px}
.inp{min-height:44px;font-size:16px}
.chart{height:260px}
}
@media (max-width:600px){
.tw{overflow-x:visible}
table.ord,table.inv,table.his{display:block;min-width:0}
table.ord thead,table.inv thead,table.his thead{display:none}
table.ord tbody,table.inv tbody,table.his tbody{display:block}
table.ord tr,table.inv tr,table.his tr{display:block}
table.ord td,table.inv td,table.his td{display:block;width:auto;padding:0;border:0}
table.ord tr.is-row,table.inv tr.is-row,table.his tr.is-row{display:grid;gap:7px 10px;align-items:center;
padding:11px 2px;border-bottom:1px solid var(--border2)}
table.ord tr.is-row{grid-template-columns:24px minmax(0,1fr) minmax(0,1fr) 40px}
table.ord tr.is-row>td:nth-child(1){grid-area:1/1;text-align:left}
table.ord tr.is-row>td:nth-child(2){grid-area:1/2/2/4;min-width:0;overflow-wrap:anywhere}
table.ord tr.is-row>td:nth-child(3){grid-area:2/2}
table.ord tr.is-row>td:nth-child(4){grid-area:2/3}
table.ord tr.is-row>td:nth-child(5){grid-area:1/4/3/5;justify-self:end;align-self:center}
table.ord--r tr.is-row>td:nth-child(3){grid-area:2/2/3/4}
table.ord--r tr.is-row>td:nth-child(4){grid-area:1/4/3/5;justify-self:end;align-self:center}
table.ord tr.is-row>td.c-qty::before,table.ord tr.is-row>td.c-money::before,
table.inv tr.is-row>td:nth-child(2)::before,table.inv tr.is-row>td:nth-child(3)::before,
table.inv tr.is-row>td:nth-child(4)::before,
table.his tr.is-row>td:nth-child(3)::before,table.his tr.is-row>td:nth-child(4)::before,
table.his tr.is-row>td:nth-child(5)::before{content:attr(data-label);display:block;font-size:10px;font-weight:700;
letter-spacing:.04em;text-transform:uppercase;color:var(--muted);margin-bottom:3px}
table.inv tr.is-row{grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto}
table.inv tr.is-row>td:nth-child(1){grid-area:1/1/2/3;min-width:0;overflow-wrap:anywhere}
table.inv tr.is-row>td:nth-child(5){grid-area:1/3/3/4;justify-self:end;align-self:center}
table.inv tr.is-row>td:nth-child(2){grid-area:2/1}
table.inv tr.is-row>td:nth-child(3){grid-area:2/2}
table.inv tr.is-row>td:nth-child(4){grid-area:2/3;text-align:right}
table.his tr.is-row{grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto}
table.his tr.is-row>td:nth-child(1){grid-area:2/1/3/3;font-size:12px}
table.his tr.is-row>td:nth-child(2){grid-area:1/1/2/3;min-width:0;overflow-wrap:anywhere}
table.his tr.is-row>td:nth-child(6){grid-area:1/3/3/4;justify-self:end;align-self:center}
table.his tr.is-row>td:nth-child(3){grid-area:3/1}
table.his tr.is-row>td:nth-child(4){grid-area:3/2}
table.his tr.is-row>td:nth-child(5){grid-area:3/3;text-align:right}
table.ord tr.is-empty td,table.inv tr.is-empty td,table.his tr.is-empty td{display:block;padding:18px 4px;
text-align:center;border-bottom:1px solid var(--border2)}
table.ord .inp{width:100%}
table.inv .c-del,table.his .c-act{width:auto}
.note .c-act{width:76px}
.note td,.note th{padding-left:5px;padding-right:5px}
.note .c-act .btn--icon{min-width:32px;width:32px;min-height:32px;height:32px}
}
@media (min-width:601px){
table.his th:nth-child(4),table.his th:nth-child(5),
table.his td:nth-child(4),table.his td:nth-child(5){text-align:right}
}
@media (prefers-reduced-motion:reduce){
*,*::before,*::after{animation-duration:.001ms!important;transition-duration:.001ms!important}
}
</style>
<script nonce="%%NONCE%%">
(function(){
  var d=document.documentElement,m='system';
  try{m=localStorage.getItem('theme_mode')||'system';}catch(e){}
  var dark=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
  d.setAttribute('data-theme',dark?'dark':'light');
  window.__THEME__=m;
  window.__DB__=%%BOOT%%;
  window.__NEED_FETCH__=%%NEEDFETCH%%;
})();
</script>
</head>
<body>
<a class="skip" href="#main">Bỏ qua điều hướng</a>
<svg class="sprite" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
<symbol id="i-yin" viewBox="0 0 512 512"><circle cx="256" cy="256" r="256" fill="#fff" stroke="none"/><path fill="#000" stroke="none" d="M256 64c53 0 96 43 96 96s-43 96-96 96s-96 43-96 96s43 96 96 96c-106 0-192-86-192-192S150 64 256 64m0 448a256 256 0 1 0 0-512a256 256 0 1 0 0 512m32-352a32 32 0 1 0-64 0a32 32 0 1 0 64 0m-64 192a32 32 0 1 1 64 0a32 32 0 1 1-64 0"/></symbol>
<symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
<symbol id="i-minus" viewBox="0 0 24 24"><path d="M5 12h14"/></symbol>
<symbol id="i-trash" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/></symbol>
<symbol id="i-save" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></symbol>
<symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></symbol>
<symbol id="i-moon" viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></symbol>
<symbol id="i-monitor" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></symbol>
<symbol id="i-warehouse" viewBox="0 0 24 24"><path d="M3 21V9l9-6 9 6v12"/><path d="M9 21v-6h6v6"/></symbol>
<symbol id="i-chart-line" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></symbol>
<symbol id="i-chart-col" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M8 17V9M13 17V5M18 17v-4"/></symbol>
<symbol id="i-receipt" viewBox="0 0 24 24"><path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2z"/><path d="M9 7h6M9 11h6"/></symbol>
<symbol id="i-mortar" viewBox="0 0 24 24"><path d="M3 10h18v2a9 9 0 0 1-18 0v-2z"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></symbol>
<symbol id="i-cloud-down" viewBox="0 0 24 24"><path d="M12 13v8M8 17l4 4 4-4"/><path d="M20 16.6A5 5 0 0 0 18 7h-1.3A8 8 0 1 0 4 15.3"/></symbol>
<symbol id="i-cart" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></symbol>
<symbol id="i-cash" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/></symbol>
<symbol id="i-plus-circle" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></symbol>
<symbol id="i-x" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></symbol>
<symbol id="i-warn" viewBox="0 0 24 24"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></symbol>
<symbol id="i-edit" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></symbol>
<symbol id="i-dots" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></symbol>
<symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></symbol>
<symbol id="i-chev-r" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></symbol>
<symbol id="i-swap" viewBox="0 0 24 24"><path d="M7 4 3 8l4 4M3 8h13M17 20l4-4-4-4M21 16H8"/></symbol>
<symbol id="i-calendar" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></symbol>
<symbol id="i-book" viewBox="0 0 24 24"><path d="M4 4a2 2 0 0 1 2-2h13v20H6a2 2 0 0 1-2-2z"/><path d="M8 2v20M12 7h4M12 11h4"/></symbol>
<symbol id="i-arrow-down-left" viewBox="0 0 24 24"><path d="M18 6 6 18M6 8v10h10"/></symbol>
<symbol id="i-arrow-up-right" viewBox="0 0 24 24"><path d="M6 18 18 6M8 6h10v10"/></symbol>
</svg>
<header class="top">
  <div class="wrap bar">
    <a class="brand" href="#main">
      <svg class="ico" aria-hidden="true"><use href="#i-yin"/></svg>
      <span>Quản Lý Kho</span>
    </a>
    <div class="bar__actions">
      <div class="menu">
        <button class="btn btn--sm" type="button" id="themeBtn" data-action="theme-menu" aria-haspopup="true" aria-expanded="false" aria-controls="themeMenu">
          <svg class="ico" aria-hidden="true"><use href="#i-monitor"/></svg><span id="themeLabel">Hệ thống</span>
        </button>
        <div class="menu__list" id="themeMenu" role="menu" aria-labelledby="themeBtn" hidden>
          <button class="menu__item" type="button" role="menuitemradio" data-theme-set="system" aria-checked="true">
            <svg class="ico" aria-hidden="true"><use href="#i-monitor"/></svg>Hệ thống
          </button>
          <button class="menu__item" type="button" role="menuitemradio" data-theme-set="light" aria-checked="false">
            <svg class="ico" aria-hidden="true"><use href="#i-sun"/></svg>Sáng
          </button>
          <button class="menu__item" type="button" role="menuitemradio" data-theme-set="dark" aria-checked="false">
            <svg class="ico" aria-hidden="true"><use href="#i-moon"/></svg>Tối
          </button>
        </div>
      </div>
      <a class="btn btn--sm" href="/logout">Đăng xuất</a>
    </div>
  </div>
</header>

<main id="main" class="wrap main">
  <h1 class="sr">Quản lý kho dược liệu</h1>

  <section class="stats" aria-label="Số liệu kho và bán hàng">
    <div class="stat">
      <div>
        <p class="stat__k">Nhập trong tháng</p>
        <p class="stat__v" id="statImport">0</p>
      </div>
      <span class="stat__ic ic-blue" aria-hidden="true"><svg class="ico"><use href="#i-cart"/></svg></span>
    </div>
    <div class="stat">
      <div>
        <p class="stat__k">Bán trong tháng</p>
        <p class="stat__v" id="statExport">0</p>
        <p class="stat__sub">Hôm nay <b id="statExportDay">0</b> · Năm <b id="statExportYear">0</b></p>
      </div>
      <span class="stat__ic ic-green" aria-hidden="true"><svg class="ico"><use href="#i-cash"/></svg></span>
    </div>
    <div class="stat">
      <div>
        <p class="stat__k">Lợi nhuận tháng</p>
        <p class="stat__v" id="statProfit">0</p>
        <p class="stat__sub">Hôm nay <b id="statProfitDay">0</b> · Năm <b id="statProfitYear">0</b></p>
      </div>
      <span class="stat__ic ic-amber" aria-hidden="true"><svg class="ico"><use href="#i-chart-line"/></svg></span>
    </div>
    <div class="stat">
      <div>
        <p class="stat__k">Tổng tồn kho</p>
        <p class="stat__v" id="statStock">0g</p>
      </div>
      <span class="stat__ic ic-purple" aria-hidden="true"><svg class="ico"><use href="#i-warehouse"/></svg></span>
    </div>
  </section>

  <div class="grid2">
    <details class="card" id="retailBox">
      <summary class="card__head">
        <svg class="ico chev" aria-hidden="true"><use href="#i-chev-r"/></svg>
        <svg class="ico txt-green" aria-hidden="true"><use href="#i-receipt"/></svg>
        <h2 class="card__title">1. Đơn bán lẻ</h2>
        <span class="spacer"></span>
        <span class="hint">kg · k</span>
      </summary>
      <div class="card__body">
        <div class="row mb-12">
          <div class="sug">
            <label class="lbl" for="retailSearch">Chọn vị thuốc</label>
            <input class="inp" id="retailSearch" type="search" autocomplete="off" placeholder="Nhập tên vị thuốc..." data-sug="retail" role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="retailList">
            <div class="sug__list" id="retailList" role="listbox" aria-label="Gợi ý vị thuốc" hidden></div>
          </div>
          <div class="field">
            <label class="lbl" for="retailDate">Ngày bán</label>
            <div class="datefield">
              <input class="inp" id="retailDate" type="text" inputmode="numeric" autocomplete="off" placeholder="dd/mm/yyyy" maxlength="10" title="Ngày ghi nhận đơn, mặc định là hôm nay">
              <svg class="ico datefield__ico" aria-hidden="true"><use href="#i-calendar"/></svg>
              <input class="datefield__native" id="retailDateNative" type="date" tabindex="-1" aria-label="Chọn ngày từ lịch">
            </div>
          </div>
        </div>
        <p class="hint mt-10">Ô “Ngày bán” dùng để ghi ngày vào lịch sử; mặc định là hôm nay.</p>
        <div class="tw">
          <table class="ord">
            <caption class="sr">Các dòng trong đơn bán lẻ</caption>
            <thead><tr>
              <th class="c-num" scope="col">STT</th>
              <th scope="col">Tên</th>
              <th class="c-qty" scope="col">SL (kg)</th>
              <th class="c-money" scope="col">Thành tiền</th>
              <th class="c-del" scope="col"><span class="sr">Xóa</span></th>
            </tr></thead>
            <tbody id="retailBody"></tbody>
          </table>
        </div>
        <p class="hint mt-10">Nhập SL và thành tiền rồi nhấn <b>Enter</b> — vị thuốc sẽ được đưa ngay vào tờ ghi bên dưới.</p>
        <div class="note" id="retailNote">
          <div class="note__head"><span>Tờ ghi đơn bán lẻ</span><span id="retailNotePg"></span></div>
          <table>
            <caption class="sr">Tờ ghi đơn bán lẻ</caption>
            <thead><tr>
              <th class="c-num" scope="col">STT</th>
              <th scope="col">Tên</th>
              <th scope="col">SL</th>
              <th scope="col" class="r">Thành tiền</th>
              <th class="c-act" scope="col"><span class="sr">Thao tác</span></th>
            </tr></thead>
            <tbody id="retailNoteBody"></tbody>
            <tfoot><tr>
              <td colspan="3">Tổng tiền</td>
              <td class="num txt-green r" id="retailNoteTotal">0</td>
              <td></td>
            </tr></tfoot>
          </table>
          <div class="foot" id="retailNotePager" hidden></div>
        </div>
        <div class="foot foot--retail">
          <div class="total">
            <span class="lbl lbl--flat">Thành tiền</span>
            <span class="total__v txt-green" id="retailTotal">0</span>
          </div>
          <button class="btn btn--green" type="button" data-action="save-retail">
            <svg class="ico" aria-hidden="true"><use href="#i-save"/></svg>Lưu đơn
          </button>
        </div>
      </div>
    </details>

    <details class="card" id="remedyBox">
      <summary class="card__head">
        <svg class="ico chev" aria-hidden="true"><use href="#i-chev-r"/></svg>
        <svg class="ico txt-brand" aria-hidden="true"><use href="#i-mortar"/></svg>
        <h2 class="card__title">2. Đơn thuốc chén</h2>
        <span class="spacer"></span>
        <span class="hint">Gram · k</span>
      </summary>
      <div class="card__body">
        <div class="grid2 gap-12 mb-12">
          <div class="field">
            <label class="lbl" for="remedyPreset">Đơn có sẵn</label>
            <select class="inp" id="remedyPreset">
              <option value="">— Đơn mới —</option>
            </select>
          </div>
          <div class="field">
            <label class="lbl" for="remedyDate">Ngày bán</label>
            <div class="datefield">
              <input class="inp" id="remedyDate" type="text" inputmode="numeric" autocomplete="off" placeholder="dd/mm/yyyy" maxlength="10" title="Ngày ghi nhận đơn, mặc định là hôm nay">
              <svg class="ico datefield__ico" aria-hidden="true"><use href="#i-calendar"/></svg>
              <input class="datefield__native" id="remedyDateNative" type="date" tabindex="-1" aria-label="Chọn ngày từ lịch">
            </div>
          </div>
        </div>
        <p class="hint mt-10">Ô “Ngày bán” dùng để ghi ngày vào lịch sử; mặc định là hôm nay.</p>
        <div class="grid2 gap-12 mb-12">
          <div class="sug">
            <label class="lbl" for="remedySearch">Chọn vị thuốc</label>
            <input class="inp" id="remedySearch" type="search" autocomplete="off" placeholder="Nhập tên vị thuốc..." data-sug="remedy" role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="remedyList">
            <div class="sug__list" id="remedyList" role="listbox" aria-label="Gợi ý vị thuốc" hidden></div>
          </div>
          <div class="field">
            <label class="lbl" for="remedyName">Tên đơn</label>
            <input class="inp" id="remedyName" type="text" autocomplete="off" placeholder="Để trống sẽ ghi là Đơn thuốc lẻ" maxlength="60">
          </div>
        </div>
        <div class="tw">
          <table class="ord ord--r">
            <caption class="sr">Dòng nhập vị thuốc cho đơn thuốc chén</caption>
            <thead><tr>
              <th class="c-num" scope="col">STT</th>
              <th scope="col">Tên</th>
              <th class="c-qty" scope="col">SL (gram)</th>
              <th class="c-del" scope="col"><span class="sr">Thêm vào tờ ghi</span></th>
            </tr></thead>
            <tbody id="remedyBody"></tbody>
          </table>
        </div>
        <p class="hint mt-10">Nhập số gram rồi nhấn <b>Enter</b> — vị thuốc sẽ được đưa ngay vào tờ ghi bên dưới.</p>
        <div class="note" id="remedyNote">
          <div class="note__head"><span>Tờ ghi đơn thuốc chén</span><span id="remedyNotePg"></span></div>
          <table>
            <caption class="sr">Tờ ghi đơn thuốc chén</caption>
            <thead><tr>
              <th class="c-num" scope="col">STT</th>
              <th scope="col">Tên</th>
              <th scope="col">SL (gram)</th>
              <th class="c-act" scope="col"><span class="sr">Thao tác</span></th>
            </tr></thead>
            <tbody id="remedyNoteBody"></tbody>
            <tfoot><tr>
              <td colspan="2">Tổng 1 thang</td>
              <td class="num txt-brand" id="remedyNoteTotal">0 g</td>
              <td>
                <div class="inline-row"><input class="inp inp--sm inp--num w-120" id="remedyUnitPrice" type="number" step="any" min="0" inputmode="decimal" placeholder="0" aria-label="Giá 1 thang" title="Giá 1 thang"></div>
              </td>
            </tr></tfoot>
          </table>
          <div class="foot" id="remedyNotePager" hidden></div>
        </div>
        <div class="hintbox mt-12">
          <div class="inline-row">
            <label class="lbl lbl--flat" for="remedyThang">Số thang</label>
            <input class="inp inp--sm inp--num w-70" id="remedyThang" type="number" step="1" min="1" inputmode="numeric" value="1" aria-label="Số thang">
          </div>
          <span class="b txt-brand" aria-hidden="true">=</span>
          <div class="inline-row">
            <span class="lbl lbl--flat">Thành tiền</span>
            <span class="b txt-brand num" id="remedyTotal" aria-live="polite">0</span>
          </div>
        </div>
        <div class="foot">
          <span class="hint" id="remedyQty">0 vị · 0 g</span>
          <div class="inline-row">
            <button class="btn btn--sm btn--danger" type="button" data-action="del-preset" id="remedyDelPreset" hidden>
              <svg class="ico" aria-hidden="true"><use href="#i-trash"/></svg>Xóa đơn
            </button>
            <button class="btn btn--sm" type="button" data-action="copy-preset" id="remedyCopyPreset" hidden>
              <svg class="ico" aria-hidden="true"><use href="#i-swap"/></svg>Sao chép đơn
            </button>
            <button class="btn" type="button" data-action="save-preset" id="remedySavePreset">
              <svg class="ico" aria-hidden="true"><use href="#i-save"/></svg><span id="remedySaveLabel">Lưu đơn</span>
            </button>
            <button class="btn btn--primary" type="button" data-action="save-remedy">
              <svg class="ico" aria-hidden="true"><use href="#i-cash"/></svg>Bán đơn
            </button>
          </div>
        </div>
      </div>
    </details>
  </div>
  <details class="card mt-18" id="nhapBox">
    <summary class="card__head">
      <svg class="ico chev" aria-hidden="true"><use href="#i-chev-r"/></svg>
      <svg class="ico txt-blue" aria-hidden="true"><use href="#i-cart"/></svg>
      <h2 class="card__title">3. Nhập hàng</h2>
      <span class="spacer"></span>
      <span class="hint">Gõ tên mới để tạo vị thuốc</span>
    </summary>
    <form class="card__body" id="nhapForm" novalidate>
      <div class="nhap-row">
        <div class="field sug">
          <label class="lbl" for="nhapSearch">Vị thuốc</label>
          <input class="inp" id="nhapSearch" type="text" autocomplete="off" placeholder="Nhập tên vị thuốc..." data-sug="nhap" role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="nhapList">
          <div class="sug__list" id="nhapList" role="listbox" aria-label="Gợi ý vị thuốc" hidden></div>
        </div>
        <div class="field">
          <label class="lbl" for="nhapQty">Số lượng (kg)</label>
          <input class="inp inp--num" id="nhapQty" type="number" step="any" min="0" inputmode="decimal" placeholder="0">
        </div>
        <div class="field">
          <label class="lbl" for="nhapPrice">Giá nhập (k/kg)</label>
          <input class="inp inp--num" id="nhapPrice" type="number" step="any" min="0" inputmode="decimal" placeholder="0">
        </div>
      </div>
      <p class="hint mt-10" id="nhapHint" hidden></p>
      <div class="hintbox mt-12">
        <span class="lbl lbl--flat">Thành tiền</span>
        <span class="b txt-blue num" id="nhapTotal">0</span>
      </div>
      <p class="hint mt-10">Nhập số lượng, giá rồi nhấn Enter để thêm vào tờ ghi. Nhấn Enter xong sẽ quay về ô tên vị thuốc.</p>
      <div class="note mt-12" id="nhapListBox" hidden>
        <div class="note__head"><span>Tờ ghi nhập hàng</span><span id="nhapListCount"></span></div>
        <table>
          <caption class="sr">Danh sách vị thuốc chờ nhập</caption>
          <thead><tr>
            <th class="c-num" scope="col">STT</th>
            <th scope="col">Tên</th>
            <th scope="col">SL</th>
            <th class="r" scope="col">Giá nhập</th>
            <th class="c-act" scope="col"><span class="sr">Thao tác</span></th>
          </tr></thead>
          <tbody id="nhapListBody"></tbody>
          <tfoot><tr>
            <td colspan="3">Tổng tiền</td>
            <td class="num txt-blue r" id="nhapListTotal">0</td>
            <td></td>
          </tr></tfoot>
        </table>
      </div>
      <button class="btn btn--dark mt-12 w-full" type="submit">
        <svg class="ico" aria-hidden="true"><use href="#i-save"/></svg><span id="nhapSaveLabel">Lưu nhập hàng</span>
      </button>
    </form>
  </details>
  <div class="grid2 mt-18">
    <details class="card" id="chartBox">
      <summary class="card__head">
        <svg class="ico chev" aria-hidden="true"><use href="#i-chev-r"/></svg>
        <svg class="ico txt-brand" aria-hidden="true"><use href="#i-chart-col"/></svg>
        <h2 class="card__title">Thống kê nhập &amp; bán 12 tháng</h2>
        <span class="spacer"></span>
        <span class="hint">Năm</span>
      </summary>
      <div class="card__body">
        <div class="row mb-12">
          <div class="legend" aria-hidden="true">
            <span><i class="dot dot--imp"></i>Nhập</span>
            <span><i class="dot dot--exp"></i>Bán</span>
          </div>
          <div class="field">
            <label class="lbl" for="chartYear">Năm</label>
            <input class="inp inp--sm" id="chartYear" type="number" min="2000" max="2100" step="1">
          </div>
        </div>
        <canvas class="chart" id="statsChart" role="img" aria-label="Biểu đồ cột so sánh tổng nhập và tổng bán theo từng tháng"></canvas>
        <p class="hint chart-tip" id="chartTip" aria-live="polite">Bấm vào cột để xem số liệu tháng.</p>
      </div>
    </details>

    <details class="card" id="invBox">
      <summary class="card__head">
        <svg class="ico chev" aria-hidden="true"><use href="#i-chev-r"/></svg>
        <svg class="ico txt-brand" aria-hidden="true"><use href="#i-warehouse"/></svg>
        <h2 class="card__title">Danh sách tồn kho</h2>
        <span class="spacer"></span>
        <span class="hint" id="invCount"></span>
      </summary>
      <div class="card__body">
        <div class="row mb-12">
          <div class="sug">
            <label class="lbl" for="invSearch">Tìm vị thuốc</label>
            <input class="inp" id="invSearch" type="search" autocomplete="off" placeholder="Nhập tên vị thuốc để lọc..." data-sug="inv" role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="invList">
            <div class="sug__list" id="invList" role="listbox" aria-label="Gợi ý vị thuốc" hidden></div>
          </div>
          <div class="field">
            <label class="lbl" for="invSort">Sắp xếp</label>
            <select class="inp" id="invSort">
              <option value="sold_desc" selected>Bán chạy nhất (nhiều → ít)</option>
              <option value="name_asc">Tên (A → Z)</option>
              <option value="stock_desc">Số lượng (nhiều → ít)</option>
              <option value="stock_asc">Số lượng (ít → nhiều)</option>
            </select>
          </div>
        </div>
        <div class="foot foot--rec mb-12">
          <span class="hint">Đối chiếu tồn hiện tại với tổng nhập − tổng bán trong lịch sử.</span>
          <button class="btn btn--sm" type="button" data-action="reconcile">
            <svg class="ico" aria-hidden="true"><use href="#i-swap"/></svg>Đối chiếu tồn kho
          </button>
        </div>
        <div class="tw">
          <table class="inv">
            <caption class="sr">Tồn kho hiện tại</caption>
            <thead><tr>
              <th scope="col">Tên</th>
              <th scope="col">Đã bán</th>
              <th scope="col">Tồn kho</th>
              <th scope="col">Giá nhập</th>
              <th scope="col" class="c-del"><span class="sr">Thao tác</span></th>
            </tr></thead>
            <tbody id="invBody"></tbody>
          </table>
        </div>
        <div class="foot" id="invPager"></div>
      </div>
    </details>
  </div>

  <div class="grid2 mt-18">
    <details class="card" id="impBox">
      <summary class="card__head">
        <svg class="ico chev" aria-hidden="true"><use href="#i-chev-r"/></svg>
        <svg class="ico txt-blue" aria-hidden="true"><use href="#i-cart"/></svg>
        <h2 class="card__title">Lịch sử nhập hàng</h2>
        <span class="spacer"></span>
        <span class="hint" id="impCount"></span>
      </summary>
      <div class="card__body">
        <div class="row mb-12">
          <div class="field">
            <label class="lbl" for="impMonth">Lọc theo tháng (mm/yyyy)</label>
            <div class="monthfield">
              <input class="inp inp--sm" id="impMonth" type="text" inputmode="numeric" autocomplete="off" placeholder="mm/yyyy" maxlength="7" aria-label="Lọc theo tháng (mm/yyyy)">
              <svg class="ico monthfield__ico" aria-hidden="true"><use href="#i-calendar"/></svg>
              <input class="monthfield__native" id="impMonthNative" type="month" tabindex="-1" aria-label="Chọn tháng từ lịch">
            </div>
          </div>
          <div class="inline-row">
            <button class="btn btn--sm" type="button" data-action="latest-imp">Gần nhất</button>
            <button class="btn btn--sm" type="button" data-action="clear-imp">Tất cả</button>
          </div>
        </div>
        <div class="tw">
          <table class="his">
            <caption class="sr">Lịch sử nhập hàng</caption>
            <thead><tr>
              <th scope="col">Ngày</th>
              <th scope="col">Vị thuốc</th>
              <th scope="col">SL</th>
              <th scope="col">Đơn giá</th>
              <th scope="col">Thành tiền</th>
              <th scope="col" class="c-act"><span class="sr">Thao tác</span></th>
            </tr></thead>
            <tbody id="impBody"></tbody>
          </table>
        </div>
        <div class="foot" id="impPager"></div>
      </div>
    </details>

    <details class="card" id="expBox">
      <summary class="card__head">
        <svg class="ico chev" aria-hidden="true"><use href="#i-chev-r"/></svg>
        <svg class="ico txt-green" aria-hidden="true"><use href="#i-cash"/></svg>
        <h2 class="card__title">Lịch sử bán hàng</h2>
        <span class="spacer"></span>
        <span class="hint" id="expCount"></span>
      </summary>
      <div class="card__body">
        <div class="row mb-12">
          <div class="field">
            <label class="lbl" for="expMonth">Lọc theo tháng (mm/yyyy)</label>
            <div class="monthfield">
              <input class="inp inp--sm" id="expMonth" type="text" inputmode="numeric" autocomplete="off" placeholder="mm/yyyy" maxlength="7" aria-label="Lọc theo tháng (mm/yyyy)">
              <svg class="ico monthfield__ico" aria-hidden="true"><use href="#i-calendar"/></svg>
              <input class="monthfield__native" id="expMonthNative" type="month" tabindex="-1" aria-label="Chọn tháng từ lịch">
            </div>
          </div>
          <div class="inline-row">
            <button class="btn btn--sm" type="button" data-action="latest-exp">Gần nhất</button>
            <button class="btn btn--sm" type="button" data-action="clear-exp">Tất cả</button>
            <button class="btn btn--sm" type="button" data-action="merge-old" id="mergeBtn" hidden>Gộp đơn thuốc lẻ cũ</button>
            <button class="btn btn--sm" type="button" data-action="mig-restore" id="migUndo" hidden>
              <svg class="ico" aria-hidden="true"><use href="#i-cloud-down"/></svg>Hoàn tác chuẩn hoá
            </button>
          </div>
        </div>
        <div class="tw">
          <table class="his">
            <caption class="sr">Lịch sử bán hàng</caption>
            <thead><tr>
              <th scope="col">Ngày</th>
              <th scope="col">Vị thuốc</th>
              <th scope="col">SL</th>
              <th scope="col">Đơn giá</th>
              <th scope="col">Thành tiền</th>
              <th scope="col" class="c-act"><span class="sr">Thao tác</span></th>
            </tr></thead>
            <tbody id="expBody"></tbody>
          </table>
        </div>
        <div class="foot" id="expPager"></div>
      </div>
    </details>
  </div>

  <details class="card mt-18" id="backupBox">
    <summary class="card__head">
      <svg class="ico chev" aria-hidden="true"><use href="#i-chev-r"/></svg>
      <svg class="ico txt-brand" aria-hidden="true"><use href="#i-save"/></svg>
      <h2 class="card__title">Sao lưu &amp; khôi phục</h2>
      <span class="spacer"></span>
      <span class="hint" id="backupHint">Chưa sao lưu</span>
    </summary>
    <div class="card__body">
      <p class="hint">Bản sao lưu là file JSON lưu trên máy bạn. Nên giữ nhiều bản theo ngày để khôi phục khi cần.</p>
      <div class="bak-actions mt-12">
        <button class="btn btn--primary" type="button" data-action="backup-now">
          <svg class="ico" aria-hidden="true"><use href="#i-save"/></svg>Sao lưu ngay
        </button>
        <button class="btn" type="button" data-action="restore-file">
          <svg class="ico" aria-hidden="true"><use href="#i-cloud-down"/></svg>Khôi phục từ file
        </button>
        <input type="file" id="restoreInput" accept=".json,application/json" hidden>
      </div>
      <label class="chk mt-12" for="autoBackup">
        <input type="checkbox" id="autoBackup" checked>
        <span>Tự sao lưu mỗi ngày khi mở trang</span>
      </label>
      <p class="hint mt-10" id="backupLast">Chưa có bản sao lưu nào.</p>
      <p class="hint mt-10">Nếu trình duyệt chặn tải tự động, hãy cho phép tải xuống cho trang này hoặc bấm “Sao lưu ngay”.</p>
    </div>
  </details>
</main>

<dialog class="dlg" id="editDlg" aria-labelledby="editTitle">
  <div class="card dlg__card">
    <div class="card__head">
      <svg class="ico txt-brand" aria-hidden="true"><use href="#i-edit"/></svg>
      <h2 class="card__title" id="editTitle">Chỉnh sửa vị thuốc</h2>
    </div>
    <div class="card__body">
      <input type="hidden" id="editId">
      <div class="field">
        <label class="lbl" for="editName">Tên vị thuốc</label>
        <input class="inp" id="editName" type="text" autocomplete="off" required>
      </div>
      <div class="field mt-12">
        <label class="lbl" for="editPrice">Giá nhập (k/kg)</label>
        <input class="inp inp--num" id="editPrice" type="number" step="any" min="0" inputmode="decimal">
      </div>
    </div>
    <div class="card__foot dlg__foot">
      <button class="btn" type="button" data-action="close-edit">Hủy</button>
      <button class="btn btn--primary" type="button" data-action="save-edit">Lưu thay đổi</button>
    </div>
  </div>
</dialog>

<dialog class="dlg dlg--wide" id="recDlg" aria-labelledby="recTitle">
  <div class="card dlg__card">
    <div class="card__head">
      <svg class="ico txt-brand" aria-hidden="true"><use href="#i-swap"/></svg>
      <h2 class="card__title" id="recTitle">Đối chiếu tồn kho với lịch sử</h2>
    </div>
    <div class="card__body">
      <p class="hint" id="recHint"></p>
      <div class="tw mt-12">
        <table>
          <caption class="sr">Các vị thuốc có tồn lệch với lịch sử</caption>
          <thead><tr>
            <th scope="col">Vị thuốc</th>
            <th scope="col">Tồn hiện tại</th>
            <th scope="col">Theo lịch sử</th>
            <th scope="col">Chênh</th>
            <th class="c-act" scope="col"><span class="sr">Thao tác</span></th>
          </tr></thead>
          <tbody id="recBody"></tbody>
        </table>
      </div>
    </div>
    <div class="card__foot dlg__foot">
      <button class="btn" type="button" data-action="close-rec">Đóng</button>
      <button class="btn btn--primary" type="button" data-action="rec-fix-all" id="recFixAll">Áp dụng tất cả</button>
    </div>
  </div>
</dialog>

<dialog class="dlg dlg--wide" id="mergeDlg" aria-labelledby="mergeTitle">
  <div class="card dlg__card">
    <div class="card__head">
      <svg class="ico txt-green" aria-hidden="true"><use href="#i-cash"/></svg>
      <h2 class="card__title" id="mergeTitle">Gộp đơn thuốc lẻ cũ</h2>
    </div>
    <div class="card__body">
      <p class="hint" id="mergeHint"></p>
      <div class="mt-12" id="mergeList"></div>
    </div>
    <div class="card__foot dlg__foot">
      <button class="btn" type="button" data-action="close-merge">Đóng</button>
      <button class="btn btn--primary" type="button" data-action="merge-do">Gộp các đơn đã chọn</button>
    </div>
  </div>
</dialog>

<dialog class="dlg" id="txDlg" aria-labelledby="txEditTitle">
  <div class="card dlg__card">
    <div class="card__head">
      <svg class="ico txt-brand" aria-hidden="true"><use href="#i-edit"/></svg>
      <h2 class="card__title" id="txEditTitle">Sửa giao dịch</h2>
    </div>
    <div class="card__body">
      <input type="hidden" id="txEditId">
      <div class="field">
        <label class="lbl" for="txEditName">Vị thuốc</label>
        <input class="inp" id="txEditName" type="text" readonly>
      </div>
      <p class="hint mt-10" id="txEditMeta"></p>
      <div class="grid2 mt-12 gap-12">
        <div class="field">
          <label class="lbl" for="txEditQty" id="txEditQtyLbl">Số lượng (kg)</label>
          <input class="inp inp--num" id="txEditQty" type="number" step="any" min="0" inputmode="decimal">
        </div>
        <div class="field">
          <label class="lbl" for="txEditPrice">Đơn giá (k/kg)</label>
          <input class="inp inp--num" id="txEditPrice" type="number" step="any" min="0" inputmode="decimal">
        </div>
      </div>
      <div class="hintbox mt-12">
        <span class="lbl lbl--flat">Thành tiền</span>
        <span class="b txt-brand num" id="txEditTotal">0</span>
      </div>
    </div>
    <div class="card__foot dlg__foot">
      <button class="btn" type="button" data-action="close-tx">Hủy</button>
      <button class="btn btn--primary" type="button" data-action="save-tx">Lưu thay đổi</button>
    </div>
  </div>
</dialog>

<dialog class="dlg dlg--wide" id="orderDlg" aria-labelledby="orderTitle">
  <div class="card dlg__card">
    <div class="card__head">
      <svg class="ico txt-green" aria-hidden="true"><use href="#i-receipt"/></svg>
      <h2 class="card__title" id="orderTitle">Chi tiết đơn</h2>
    </div>
    <div class="card__body">
      <p class="hint" id="orderMeta"></p>
      <div class="note mt-12" id="orderNote">
        <div class="note__head"><span id="orderNoteTitle">Tờ ghi đơn</span><span id="orderNotePg"></span></div>
        <table>
          <caption class="sr">Các vị thuốc trong đơn</caption>
          <thead><tr>
            <th class="c-num" scope="col">STT</th>
            <th scope="col">Tên</th>
            <th scope="col" id="orderQtyHead">SL</th>
            <th class="r" scope="col" id="orderPriceHead" hidden>Đơn giá</th>
            <th class="r" scope="col" id="orderMoneyHead" hidden>Thành tiền</th>
            <th class="c-act" scope="col"><span class="sr">Thao tác</span></th>
          </tr></thead>
          <tbody id="orderBody"></tbody>
          <tfoot><tr>
            <td colspan="2" id="orderFootLabel">Tổng cộng</td>
            <td class="num txt-green" id="orderFootQty">0</td>
            <td class="num txt-green r" id="orderFootPrice" hidden></td>
            <td class="num txt-green r" id="orderFootMoney" hidden>0</td>
            <td class="c-act"></td>
          </tr></tfoot>
        </table>
        <div class="foot" id="orderPager" hidden></div>
      </div>
      <div class="hintbox mt-12" id="orderParams" hidden>
        <div class="inline-row">
          <span class="lbl lbl--flat">Số thang</span>
          <span class="b num" id="orderThang">—</span>
        </div>
        <span class="b txt-brand" aria-hidden="true">×</span>
        <div class="inline-row">
          <span class="lbl lbl--flat">Giá 1 thang</span>
          <span class="b num" id="orderUnitPrice">—</span>
        </div>
        <span class="b txt-brand" aria-hidden="true">=</span>
        <div class="inline-row">
          <span class="lbl lbl--flat">Thành tiền</span>
          <span class="b txt-brand num" id="orderTotal">0</span>
        </div>
      </div>
    </div>
    <div class="card__foot dlg__foot">
      <button class="btn" type="button" data-action="close-order">Đóng</button>
    </div>
  </div>
</dialog>

<div class="toast" id="toast" role="status" aria-live="polite">
  <svg class="ico" aria-hidden="true"><use href="#i-check"/></svg>
  <span id="toastMsg">Đã lưu</span>
</div>
<script nonce="%%NONCE%%">
(function(){
'use strict';

/* ================= TIỆN ÍCH ================= */
var doc = document;
function $(s, r){ return (r || doc).querySelector(s); }
function $$(s, r){ return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
function el(tag, cls, text){
  var n = doc.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
function svg(name, cls){
  var s = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('class', 'ico' + (cls ? ' ' + cls : ''));
  s.setAttribute('aria-hidden', 'true');
  var u = doc.createElementNS('http://www.w3.org/2000/svg', 'use');
  u.setAttribute('href', '#i-' + name);
  s.appendChild(u);
  return s;
}
var NF0 = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
var NF1 = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });
var NF2 = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });
function num(v){ var n = parseFloat(v); return isFinite(n) ? n : 0; }
/* Giữ tối đa 15 chữ số có nghĩa: chỉ dọn nhiễu nhị phân của JavaScript
   (ví dụ 0.1 + 0.2 = 0.30000000000000004 → 0.3), không làm tròn số liệu thực. */
function dec(n){
  n = Number(n);
  if (!isFinite(n) || n === 0) return 0;
  /* Nếu một giá trị ngắn hơn (ít chữ số hơn) nằm trong sai số nhị phân cho phép
     thì dùng giá trị đó; nhờ vậy 6.31142000000001 → 6.31142 nhưng vẫn giữ
     nguyên các số thực có nhiều chữ số. */
  for (var p = 1; p < 15; p++) {
    var r = Number(n.toPrecision(p));
    if (Math.abs(n - r) <= Math.abs(n) * 1e-12) return r;
  }
  return Number(n.toPrecision(15));
}
/* Làm tròn tiền (đơn vị nghìn VND) về số nguyên. Dùng cho cả lưu trữ và
   hiển thị, để tổng các dòng luôn khớp dòng tổng. */
function money(v){ return Math.round(num(v)); }
/* Hiển thị đầy đủ chữ số, không làm tròn. Dùng dấu . phân cách nghìn, , thập phân. */
function fmtNum(n){
  var v = dec(n);
  if (v === 0) return '0';
  var neg = v < 0;
  if (neg) v = -v;
  var s = String(v);
  if (s.indexOf('e') >= 0) {
    s = v.toFixed(20).replace(/0+$/, '').replace(/\.$/, '');
    if (!s) s = '0';
  }
  var parts = s.split('.');
  var ip = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  var fp = parts[1] ? ',' + parts[1] : '';
  return (neg ? '-' : '') + ip + fp;
}
/* Quy ước hiển thị: 1 kg = 10 lạng = 1000 g  ·  1 tr = 1000 */
function fmtQty(kg){
  var n = dec(kg);
  var a = Math.abs(n);
  if (a === 0) return '0g';
  if (a >= 1) return fmtNum(n) + ' kg';
  var lang = dec(n * 10);
  if (Math.abs(lang) >= 1) return fmtNum(lang) + ' lạng';
  return fmtNum(dec(n * 1000)) + ' g';
}
function fmtMoney(k){
  /* Tiền (đơn vị nghìn VND): làm tròn thành số nguyên, bỏ phần thập phân.
     Tổng các dòng khớp dòng tổng vì mọi dòng đều làm tròn cùng quy tắc. */
  var v = Number(k);
  if (!isFinite(v)) v = 0;
  return NF0.format(Math.round(v));
}
function fmtUnitPrice(k){ return fmtMoney(k) + '/kg'; }
function fmtInt(n){ return fmtNum(n); }
function pad2(n){ return n < 10 ? '0' + n : '' + n; }
function todayISO(){ var d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function thisMonth(){ return todayISO().slice(0, 7); }
function thisYear(){ return todayISO().slice(0, 4); }
function parseDateVN(s){
  s = String(s || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    var p = s.split('-');
    var dt0 = new Date(+p[0], +p[1] - 1, +p[2]);
    return (dt0.getFullYear() === +p[0] && dt0.getMonth() === +p[1] - 1 && dt0.getDate() === +p[2]) ? s : '';
  }
  var m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (!m) return '';
  var d = +m[1], mo = +m[2], y = +m[3];
  if (y < 100) y += 2000;
  if (y < 1900 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31) return '';
  var dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return '';
  return y + '-' + pad2(mo) + '-' + pad2(d);
}
function dateInputVN(iso){
  var p = String(iso || '').split('-');
  return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : '';
}
function getDateInput(id){
  var n = $('#' + id);
  if (!n) return '';
  return parseDateVN(n.value) || n.getAttribute('data-iso') || '';
}
function setDateInput(id, iso){
  var n = $('#' + id);
  if (!n) return;
  n.value = dateInputVN(iso);
  n.setAttribute('data-iso', iso || '');
  var nat = $('#' + id + 'Native');
  if (nat) nat.value = iso || '';
}
function bindDateInput(id){
  var n = $('#' + id), nat = $('#' + id + 'Native');
  if (!n) return;
  n.addEventListener('change', function(){
    if (!n.value.trim()) { setDateInput(id, todayISO()); return; }
    var iso = parseDateVN(n.value);
    if (iso) { setDateInput(id, iso); return; }
    var prev = n.getAttribute('data-iso') || '';
    n.value = dateInputVN(prev);
    toast(prev ? 'Ngày không hợp lệ, giữ nguyên ngày cũ' : 'Ngày không hợp lệ, dùng hôm nay', 'error');
    if (!prev) setDateInput(id, todayISO());
  });
  if (nat) {
    var syncNat = function(){ nat.value = parseDateVN(n.value) || todayISO(); };
    nat.addEventListener('focus', syncNat);
    nat.addEventListener('click', syncNat);
    nat.addEventListener('change', function(){ if (nat.value) setDateInput(id, nat.value); });
  }
}
function parseMonthVN(s){
  s = String(s || '').trim();
  if (/^\d{4}-\d{2}$/.test(s)) {
    var y0 = +s.slice(0, 4), m0 = +s.slice(5, 7);
    return (y0 >= 1900 && y0 <= 2100 && m0 >= 1 && m0 <= 12) ? s : '';
  }
  var m = s.match(/^(\d{1,2})[\/\-.](\d{4})$/);
  if (!m) return '';
  var mo = +m[1], y = +m[2];
  return (y >= 1900 && y <= 2100 && mo >= 1 && mo <= 12) ? y + '-' + pad2(mo) : '';
}
function monthInputVN(ym){
  var p = String(ym || '').split('-');
  return p.length === 2 ? p[1] + '/' + p[0] : '';
}
function getMonthInput(id){
  var n = $('#' + id);
  if (!n) return '';
  return parseMonthVN(n.value) || n.getAttribute('data-ym') || '';
}
function setMonthInput(id, ym){
  var n = $('#' + id);
  if (!n) return;
  n.value = monthInputVN(ym);
  n.setAttribute('data-ym', ym || '');
  var nat = $('#' + id + 'Native');
  if (nat) nat.value = ym || '';
}
function bindMonthInput(id, onChange){
  var n = $('#' + id), nat = $('#' + id + 'Native');
  if (!n) return;
  n.addEventListener('change', function(){
    var ym = parseMonthVN(n.value);
    if (ym) { setMonthInput(id, ym); onChange(); return; }
    if (!n.value.trim()) { setMonthInput(id, ''); onChange(); return; }
    setMonthInput(id, n.getAttribute('data-ym') || '');
    toast('Tháng không hợp lệ, dùng mm/yyyy', 'error');
  });
  if (nat) {
    var syncNat = function(){ nat.value = parseMonthVN(n.value) || ''; };
    nat.addEventListener('focus', syncNat);
    nat.addEventListener('click', syncNat);
    nat.addEventListener('change', function(){
      if (nat.value) { setMonthInput(id, nat.value); onChange(); }
    });
  }
}
function uid(p){ return p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function capWords(s){
  if (!s) return '';
  return String(s).normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim()
    .replace(/(^|[^\p{L}\p{N}])(\p{L})/gu, function(m, sep, ch){ return sep + ch.toUpperCase(); });
}
function normSearch(s){
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
}
function sortByName(a, b){ return a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' }); }
function findProduct(id){
  for (var i = 0; i < db.products.length; i++) if (String(db.products[i].id) === String(id)) return db.products[i];
  return null;
}
var txIndex = null;
function indexTx(){
  txIndex = {};
  db.transactions.forEach(function(t, i){ txIndex[t.id] = i; });
}
function tsFromId(id){
  var m = String(id || '').match(/(\d{10,13})$/);
  if (!m) return 0;
  var v = Number(m[1]);
  return (v > 946684800000 && v < 4102444800000) ? v : 0;
}
function txStamp(t){
  var ts = num(t.ts);
  if (ts > 0) return ts;
  var idTs = tsFromId(t.id);
  if (idTs) return idTs;
  var base = Date.parse(String(t.date || '') + 'T00:00:00');
  if (!isFinite(base)) base = 0;
  if (!txIndex) indexTx();
  return base + (txIndex[t.id] || 0);
}
function txHasTime(t){
  return num(t.ts) > 0 || tsFromId(t.id) > 0;
}
function lastImport(id){
  var best = null, bestStamp = -Infinity;
  db.transactions.forEach(function(t){
    if (t.type !== 'NHAP' || String(t.productId) !== String(id) || !(num(t.price) > 0)) return;
    var s = txStamp(t);
    if (!best || String(t.date) > String(best.date) || (String(t.date) === String(best.date) && s >= bestStamp)) {
      best = t; bestStamp = s;
    }
  });
  return best ? { price: num(best.price), date: String(best.date), ts: bestStamp, hasTime: txHasTime(best) } : null;
}
function refPrice(p){
  var l = lastImport(p.id);
  return l ? l.price : num(p.costPrice);
}

/* ================= TRẠNG THÁI ================= */
var KEY = 'kho_db_local_v1';
var DIRTY_KEY = 'kho_db_dirty_v1';
var BASE_KEY = 'kho_cloud_base_v1';
var PAGE_SIZE = 10;
var db = { products: [], transactions: [], prescriptions: [], updatedAt: 0 };
var invPage = 1, impPage = 1, expPage = 1;
var impAll = false, expAll = false;
var cloudBase = 0;
var dirty = false;
var syncErrorShown = false;
var conflictOpen = false;
var toastTimer = null;

function sanitize(d){
  var o = { products: [], transactions: [], prescriptions: [], updatedAt: 0 };
  if (!d || typeof d !== 'object') return o;
  o.updatedAt = dec(d.updatedAt);
  if (Array.isArray(d.products)) {
    var seenPid = {}, seenPname = {};
    d.products.forEach(function(p){
      if (!p || !p.name) return;
      var id = String(p.id || uid('PROD'));
      var name = String(p.name);
      var nameKey = capWords(name).toLowerCase();
      if (seenPid[id] || seenPname[nameKey]) return;
      seenPid[id] = true;
      seenPname[nameKey] = true;
      o.products.push({
        id: id,
        name: name,
        stock: dec(p.stock),
        costPrice: money(p.costPrice)
      });
    });
  }
  if (Array.isArray(d.transactions)) {
    var seenTid = {};
    d.transactions.forEach(function(t){
      if (!t) return;
      var id = String(t.id || uid('TX'));
      if (seenTid[id]) return;
      seenTid[id] = true;
      var tx = {
        id: id,
        date: String(t.date || ''),
        type: t.type === 'NHAP' ? 'NHAP' : 'BAN',
        productId: String(t.productId || ''),
        qty: dec(t.qty),
        price: money(t.price),
        total: money(t.total),
        cost: t.cost == null ? null : money(t.cost)
      };
      if (t.oid && t.oname) { tx.oid = String(t.oid); tx.oname = String(t.oname); }
      else if (t.oid && tx.type === 'NHAP') { tx.oid = String(t.oid); }
      if (t.retail) tx.retail = true;
      if (t.rx) tx.rx = true;
      if (t.g != null) tx.g = dec(t.g);
      if (t.thang != null) tx.thang = dec(t.thang);
      if (t.unitPrice != null) tx.unitPrice = money(t.unitPrice);
      if (num(t.ts) > 0) tx.ts = num(t.ts);
      o.transactions.push(tx);
    });
  }
  if (Array.isArray(d.prescriptions)) {
    var seenRid = {}, seenRname = {};
    d.prescriptions.forEach(function(r){
      if (!r || !r.name || !Array.isArray(r.items)) return;
      var rid = String(r.id || uid('RX'));
      var rname = String(r.name);
      /* Tên đơn trong DB là UNIQUE phân biệt hoa/thường → chỉ loại trùng đúng tên. */
      var rnameKey = rname.trim();
      if (seenRid[rid] || seenRname[rnameKey]) return;
      var items = [], seenItem = {};
      r.items.forEach(function(it){
        if (!it || !it.productId) return;
        var itemPid = String(it.productId);
        if (seenItem[itemPid]) return;
        seenItem[itemPid] = true;
        items.push({ productId: itemPid, grams: dec(it.grams) });
      });
      if (!items.length) return;
      seenRid[rid] = true;
      seenRname[rnameKey] = true;
      o.prescriptions.push({
        id: rid,
        name: rname,
        items: items,
        total: money(r.total),
        thang: Math.max(1, Math.round(num(r.thang)) || 1),
        updatedAt: dec(r.updatedAt)
      });
    });
  }
  return o;
}
function readLocal(){
  try {
    var raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return sanitize(JSON.parse(raw));
  } catch (e) { return null; }
}
function readDirty(){
  try { return localStorage.getItem(DIRTY_KEY) === '1'; } catch (e) { return false; }
}
function readBase(){
  try {
    var v = Number(localStorage.getItem(BASE_KEY));
    return isFinite(v) && v > 0 ? v : 0;
  } catch (e) { return 0; }
}
function saveLocal(){
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
    localStorage.setItem(DIRTY_KEY, dirty ? '1' : '0');
    localStorage.setItem(BASE_KEY, String(cloudBase || 0));
  } catch (e) {}
}
function touch(){ db.updatedAt = Date.now(); dirty = true; saveLocal(); }

/* ================= THÔNG BÁO ================= */
function toast(msg, kind){
  var t = $('#toast'), m = $('#toastMsg');
  if (!t || !m) return;
  m.textContent = msg;
  t.setAttribute('data-kind', kind === 'error' ? 'error' : 'ok');
  t.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ t.classList.remove('is-on'); }, 2800);
}

/* ================= GIAO DIỆN SÁNG/TỐI ================= */
var YIN = 'M256 64c53 0 96 43 96 96s-43 96-96 96s-96 43-96 96s43 96 96 96c-106 0-192-86-192-192S150 64 256 64m0 448a256 256 0 1 0 0-512a256 256 0 1 0 0 512m32-352a32 32 0 1 0-64 0a32 32 0 1 0 64 0m-64 192a32 32 0 1 1 64 0a32 32 0 1 1-64 0';
function setFavicon(){
  var link = $('#favicon');
  if (!link) return;
  var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><circle cx="256" cy="256" r="256" fill="#fff"/><path fill="#000" d="' + YIN + '"/></svg>';
  link.href = 'data:image/svg+xml,' + encodeURIComponent(s);
}
function applyTheme(mode){
  var dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  window.__THEME__ = mode;
  doc.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  try { localStorage.setItem('theme_mode', mode); } catch (e) {}
  var lbl = $('#themeLabel');
  if (lbl) lbl.textContent = mode === 'dark' ? 'Tối' : mode === 'light' ? 'Sáng' : 'Hệ thống';
  $$('#themeMenu [data-theme-set]').forEach(function(b){
    b.setAttribute('aria-checked', b.getAttribute('data-theme-set') === mode ? 'true' : 'false');
  });
  var meta = $('#themeColor');
  if (meta) meta.setAttribute('content', dark ? '#0a0f1a' : '#f5f7fa');
  setFavicon();
  if ($('#chartBox') && $('#chartBox').open) renderChart();
}
function closeThemeMenu(){
  var m = $('#themeMenu'), b = $('#themeBtn');
  if (m) m.hidden = true;
  if (b) b.setAttribute('aria-expanded', 'false');
}
/* ================= DÒNG ĐƠN HÀNG ================= */
function renumber(tbody){
  var n = 0;
  Array.prototype.forEach.call(tbody.children, function(tr){
    if (tr.getAttribute('data-empty') === '1') return;
    n++;
    var c = tr.querySelector('.c-num');
    if (c) c.textContent = String(n);
  });
}
function clearEmpty(tb){
  if (!tb) return;
  var old = tb.querySelector('tr[data-empty="1"]');
  if (old) old.remove();
}
function orderEmpty(tb, cols, text){
  if (!tb) return;
  clearEmpty(tb);
  var has = false;
  Array.prototype.forEach.call(tb.children, function(tr){
    if (tr.getAttribute('data-empty') !== '1') has = true;
  });
  if (has) return;
  var tr = el('tr');
  tr.setAttribute('data-empty', '1');
  tr.className = 'is-empty';
  var td = el('td', 'empty-cell muted small', text);
  td.colSpan = cols;
  tr.appendChild(td);
  tb.appendChild(tr);
}
function fmtGram(g){
  var n = dec(g);
  if (Math.abs(n) >= 1000) return fmtNum(dec(n / 1000)) + ' kg';
  return fmtNum(n) + ' g';
}
var remedyItems = [];
var remedyNotePage = 1;
var remedyEditIdx = -1;
function commitRemedyRow(){
  var tb = $('#remedyBody');
  if (!tb) return;
  var row = tb.querySelector('tr[data-pid]');
  if (!row) return;
  var g = num($('.remedy-qty', row).value);
  if (g > 0) {
    remedyItems.push({ productId: row.getAttribute('data-pid'), grams: dec(g) });
    remedyNotePage = 1e9;
  }
  tb.textContent = '';
  orderEmpty(tb, 4, 'Gõ tên vị thuốc ở trên để thêm dòng.');
}
function addRemedyToNote(){
  var row = $('#remedyBody tr[data-pid]');
  if (!row) return;
  var qi = $('.remedy-qty', row);
  if (num(qi.value) <= 0) { toast('Nhập số gram lớn hơn 0', 'error'); qi.focus(); return; }
  commitRemedyRow();
  calcRemedy();
  var s = $('#remedySearch');
  if (s) {
    suppressSug = true;
    s.focus();
    closeSuggest('remedy');
    setTimeout(function(){ suppressSug = false; }, 0);
  }
}
function remedyNoteSave(){
  var it = remedyItems[remedyEditIdx];
  if (!it) { remedyEditIdx = -1; renderRemedyNote(); return; }
  var g = num(($('#remedyNoteEditQty') || {}).value);
  if (g <= 0) { toast('Số gram phải lớn hơn 0', 'error'); return; }
  it.grams = dec(g);
  remedyEditIdx = -1;
  calcRemedy();
}
function renderRemedyNote(){
  var tb = $('#remedyNoteBody');
  if (!tb) return;
  var pages = Math.max(1, Math.ceil(remedyItems.length / PAGE_SIZE));
  if (remedyNotePage > pages) remedyNotePage = pages;
  if (remedyNotePage < 1) remedyNotePage = 1;
  var sum = 0;
  remedyItems.forEach(function(it){ sum += num(it.grams); });
  tb.textContent = '';
  for (var k = 0; k < PAGE_SIZE; k++) {
    var i = (remedyNotePage - 1) * PAGE_SIZE + k;
    var it = remedyItems[i];
    var tr = el('tr');
    if (!it) {
      tr.appendChild(el('td', 'c-num', ''));
      tr.appendChild(el('td', '', ''));
      tr.appendChild(el('td', '', ''));
      tr.appendChild(el('td', 'c-act', ''));
      tb.appendChild(tr);
      continue;
    }
    var p = findProduct(it.productId);
    tr.appendChild(el('td', 'c-num num muted', String(i + 1)));
    tr.appendChild(el('td', 'b', p ? p.name : 'Đã xóa'));
    var tdq, tda = el('td', 'c-act');
    var wrap = el('div', 'inline-row');
    if (i === remedyEditIdx) {
      tdq = el('td', 'c-qty');
      var qi = el('input', 'inp inp--sm inp--num');
      qi.id = 'remedyNoteEditQty'; qi.type = 'number'; qi.step = 'any'; qi.min = '0'; qi.inputMode = 'decimal';
      qi.value = String(num(it.grams));
      qi.setAttribute('aria-label', 'Số lượng (gram)');
      tdq.appendChild(qi);
      var bs = el('button', 'btn btn--icon');
      bs.type = 'button'; bs.setAttribute('data-action', 'rnote-save'); bs.setAttribute('aria-label', 'Lưu dòng');
      bs.appendChild(svg('save'));
      var bc = el('button', 'btn btn--icon btn--danger');
      bc.type = 'button'; bc.setAttribute('data-action', 'rnote-cancel'); bc.setAttribute('aria-label', 'Hủy sửa');
      bc.appendChild(svg('x'));
      wrap.appendChild(bs); wrap.appendChild(bc);
    } else {
      tdq = el('td', 'num', fmtGram(it.grams));
      wrap.appendChild(rowMenu([
        { label: 'Sửa dòng', icon: 'edit', action: 'rnote-edit', idx: i },
        { label: 'Xóa dòng', icon: 'trash', action: 'rnote-del', idx: i, danger: true }
      ], 'Thao tác với dòng ' + (i + 1)));
    }
    tr.appendChild(tdq);
    tda.appendChild(wrap);
    tr.appendChild(tda);
    tb.appendChild(tr);
  }
  var tot = $('#remedyNoteTotal');
  if (tot) tot.textContent = fmtGram(sum);
  var pg = $('#remedyNotePg');
  if (pg) pg.textContent = 'Trang ' + remedyNotePage + ' / ' + pages;
  var host = $('#remedyNotePager');
  if (host) {
    host.hidden = pages <= 1;
    if (pages > 1) renderPager(host, remedyNotePage, pages, 'rnote');
  }
}
function addOrderRow(kind, pid){
  var isRetail = kind === 'retail';
  var tb = $(isRetail ? '#retailBody' : '#remedyBody');
  var p = findProduct(pid);
  if (!tb || !p) return null;
  clearEmpty(tb);

  var tr = el('tr');
  tr.setAttribute('data-pid', p.id);
  tr.className = 'is-row';
  tr.appendChild(el('td', 'c-num num muted'));
  tr.appendChild(el('td', 'b', p.name));

  var tdQ = el('td', 'c-qty');
  tdQ.setAttribute('data-label', isRetail ? 'SL (kg)' : 'SL (gram)');
  var qi = el('input', 'inp inp--sm inp--num ' + (isRetail ? 'retail-qty' : 'remedy-qty'));
  qi.type = 'number'; qi.step = 'any'; qi.min = '0'; qi.inputMode = 'decimal'; qi.placeholder = '0';
  qi.setAttribute('aria-label', isRetail ? 'Số lượng (kg)' : 'Số lượng (gram)');
  tdQ.appendChild(qi);
  tr.appendChild(tdQ);

  if (isRetail) {
    var tdM = el('td', 'c-money');
    tdM.setAttribute('data-label', 'Thành tiền');
    var mi = el('input', 'inp inp--sm inp--num retail-money');
    mi.type = 'number'; mi.step = 'any'; mi.min = '0'; mi.inputMode = 'decimal'; mi.placeholder = '0';
    mi.setAttribute('aria-label', 'Thành tiền');
    tdM.appendChild(mi);
    tr.appendChild(tdM);
  }

  var tdD = el('td', 'c-del');
  var b;
  if (isRetail) {
    b = el('button', 'btn btn--icon btn--primary');
    b.type = 'button';
    b.setAttribute('data-action', 'note-add');
    b.setAttribute('aria-label', 'Thêm vào tờ ghi');
    b.setAttribute('title', 'Thêm vào tờ ghi');
    b.appendChild(svg('plus'));
  } else {
    b = el('button', 'btn btn--icon btn--primary');
    b.type = 'button';
    b.setAttribute('data-action', 'rnote-add');
    b.setAttribute('aria-label', 'Thêm vào tờ ghi');
    b.setAttribute('title', 'Thêm vào tờ ghi');
    b.appendChild(svg('plus'));
  }
  tdD.appendChild(b);
  tr.appendChild(tdD);

  tb.appendChild(tr);
  renumber(tb);

  return tr;
}
function resetRetail(){
  var tb = $('#retailBody');
  if (!tb) return;
  tb.textContent = '';
  orderEmpty(tb, 5, 'Gõ tên vị thuốc ở trên để thêm dòng.');
  retailItems = [];
  noteEditIdx = -1;
  notePage = 1;
  var s = $('#retailSearch');
  if (s) s.value = '';
  calcRetail();
}
function resetRemedy(){
  var tb = $('#remedyBody');
  if (!tb) return;
  tb.textContent = '';
  orderEmpty(tb, 4, 'Gõ tên vị thuốc ở trên để thêm dòng.');
  remedyItems = [];
  remedyEditIdx = -1;
  remedyNotePage = 1;
  var s = $('#remedySearch');
  if (s) s.value = '';
  var n = $('#remedyName');
  if (n) n.value = '';
  var sel = $('#remedyPreset');
  if (sel) sel.value = '';
  var up = $('#remedyUnitPrice');
  if (up) up.value = '';
  var th = $('#remedyThang');
  if (th) th.value = '1';
  calcRemedy();
  updatePresetUI();
}
var notePage = 1;
var retailItems = [];
var noteEditIdx = -1;
function renderNote(){
  var tb = $('#retailNoteBody');
  if (!tb) return;
  var pages = Math.max(1, Math.ceil(retailItems.length / PAGE_SIZE));
  if (notePage > pages) notePage = pages;
  if (notePage < 1) notePage = 1;
  var sum = 0;
  retailItems.forEach(function(it){ sum += num(it.amount); });
  tb.textContent = '';
  for (var k = 0; k < PAGE_SIZE; k++) {
    var i = (notePage - 1) * PAGE_SIZE + k;
    var it = retailItems[i];
    var tr = el('tr');
    if (!it) {
      tr.appendChild(el('td', 'c-num', ''));
      tr.appendChild(el('td', '', ''));
      tr.appendChild(el('td', '', ''));
      tr.appendChild(el('td', '', ''));
      tr.appendChild(el('td', 'c-act', ''));
      tb.appendChild(tr);
      continue;
    }
    var p = findProduct(it.pid);
    tr.appendChild(el('td', 'c-num num muted', String(i + 1)));
    tr.appendChild(el('td', 'b', p ? p.name : 'Đã xóa'));
    var tdq, tdm, tda = el('td', 'c-act');
    var wrap = el('div', 'inline-row');
    if (i === noteEditIdx) {
      tdq = el('td', 'c-qty');
      var qi = el('input', 'inp inp--sm inp--num');
      qi.id = 'noteEditQty'; qi.type = 'number'; qi.step = 'any'; qi.min = '0'; qi.inputMode = 'decimal';
      qi.value = String(num(it.kg));
      qi.setAttribute('aria-label', 'Số lượng (kg)');
      tdq.appendChild(qi);
      tdm = el('td', 'c-money');
      var mi = el('input', 'inp inp--sm inp--num');
      mi.id = 'noteEditMoney'; mi.type = 'number'; mi.step = 'any'; mi.min = '0'; mi.inputMode = 'decimal';
      mi.value = String(num(it.amount));
      mi.setAttribute('aria-label', 'Thành tiền');
      tdm.appendChild(mi);
      var bs = el('button', 'btn btn--icon');
      bs.type = 'button'; bs.setAttribute('data-action', 'note-save'); bs.setAttribute('aria-label', 'Lưu dòng');
      bs.appendChild(svg('save'));
      var bc = el('button', 'btn btn--icon btn--danger');
      bc.type = 'button'; bc.setAttribute('data-action', 'note-cancel'); bc.setAttribute('aria-label', 'Hủy sửa');
      bc.appendChild(svg('x'));
      wrap.appendChild(bs); wrap.appendChild(bc);
    } else {
      tdq = el('td', 'num', fmtQty(it.kg));
      tdm = el('td', 'num r', fmtMoney(it.amount));
      wrap.appendChild(rowMenu([
        { label: 'Sửa dòng', icon: 'edit', action: 'note-edit', idx: i },
        { label: 'Xóa dòng', icon: 'trash', action: 'note-del', idx: i, danger: true }
      ], 'Thao tác với dòng ' + (i + 1)));
    }
    tr.appendChild(tdq);
    tr.appendChild(tdm);
    tda.appendChild(wrap);
    tr.appendChild(tda);
    tb.appendChild(tr);
  }
  var tot = $('#retailNoteTotal');
  if (tot) tot.textContent = fmtMoney(sum);
  var pg = $('#retailNotePg');
  if (pg) pg.textContent = 'Trang ' + notePage + ' / ' + pages;
  var host = $('#retailNotePager');
  if (host) {
    host.hidden = pages <= 1;
    if (pages > 1) renderPager(host, notePage, pages, 'note');
  }
}
function commitRetailRow(){
  var tb = $('#retailBody');
  if (!tb) return true;
  var row = tb.querySelector('tr[data-pid]');
  if (!row) return true;
  var q = num($('.retail-qty', row).value);
  var m = num($('.retail-money', row).value);
  if (q > 0) {
    if (m < 0) {
      toast('Thành tiền không được âm', 'error');
      var mi = $('.retail-money', row);
      if (mi) { mi.focus(); if (mi.select) mi.select(); }
      return false;
    }
    retailItems.push({ pid: row.getAttribute('data-pid'), kg: dec(q), amount: dec(m) });
    notePage = 1e9;
  }
  tb.textContent = '';
  orderEmpty(tb, 5, 'Gõ tên vị thuốc ở trên để thêm dòng.');
  return true;
}
function addRetailToNote(){
  var row = $('#retailBody tr[data-pid]');
  if (!row) return;
  var qi = $('.retail-qty', row);
  if (num(qi.value) <= 0) { toast('Nhập số lượng lớn hơn 0', 'error'); qi.focus(); return; }
  if (!commitRetailRow()) return;
  calcRetail();
  var s = $('#retailSearch');
  if (s) {
    suppressSug = true;
    s.focus();
    closeSuggest('retail');
    setTimeout(function(){ suppressSug = false; }, 0);
  }
}
function noteSave(){
  var it = retailItems[noteEditIdx];
  if (!it) { noteEditIdx = -1; renderNote(); return; }
  var q = num(($('#noteEditQty') || {}).value);
  var m = num(($('#noteEditMoney') || {}).value);
  if (q <= 0) { toast('Số lượng phải lớn hơn 0', 'error'); return; }
  if (m < 0) { toast('Thành tiền không được âm', 'error'); return; }
  it.kg = dec(q);
  it.amount = dec(m);
  noteEditIdx = -1;
  calcRetail();
}
function calcRetail(){
  var total = 0;
  retailItems.forEach(function(it){ total += num(it.amount); });
  $$('#retailBody .retail-money').forEach(function(i){ total += num(i.value); });
  var out = $('#retailTotal');
  if (out) out.textContent = fmtMoney(total);
  renderNote();
}
function remedyThang(){
  var v = Math.round(num(($('#remedyThang') || {}).value));
  return v >= 1 ? v : 1;
}
function remedyGrand(){
  return money(remedyThang() * num(($('#remedyUnitPrice') || {}).value));
}
/* Hàm thuần: chia grand (số nguyên) cho các dòng theo gram; các phần đều là
   số nguyên và dòng cuối nhận phần dư để tổng các dòng luôn bằng đúng grand. */
function allocateRemedyAmounts(grand, items){
  var list = items || [];
  var totalG = list.reduce(function(a, it){ return a + num(it.g); }, 0);
  var allocated = 0;
  return list.map(function(it, idx){
    var amount = idx === list.length - 1
      ? grand - allocated
      : Math.round(totalG > 0 ? grand * (num(it.g) / totalG) : 0);
    allocated += amount;
    return amount;
  });
}
function calcRemedy(){
  var grand = remedyGrand();
  var items = 0, grams = 0;
  remedyItems.forEach(function(it){
    if (num(it.grams) > 0) { items++; grams += num(it.grams); }
  });
  $$('#remedyBody tr[data-pid]').forEach(function(tr){
    var g = num($('.remedy-qty', tr).value);
    if (g > 0) { items++; grams += g; }
  });
  var out = $('#remedyQty');
  var th = remedyThang();
  if (out) out.textContent = items + ' vị · ' + (grams > 0 ? fmtQty(grams / 1000) : '0 g') + '/thang'
    + (th > 1 && grams > 0 ? ' · tổng ' + th + ' thang: ' + fmtQty(grams * th / 1000) : '');
  var tot = $('#remedyTotal');
  if (tot) tot.textContent = fmtMoney(grand);
  renderRemedyNote();
}

/* ================= ĐƠN THUỐC CÓ SẴN ================= */
function findPreset(id){
  for (var i = 0; i < db.prescriptions.length; i++) {
    if (String(db.prescriptions[i].id) === String(id)) return db.prescriptions[i];
  }
  return null;
}
function presetByName(name){
  var key = capWords(name).toLowerCase();
  if (!key) return null;
  for (var i = 0; i < db.prescriptions.length; i++) {
    if (capWords(db.prescriptions[i].name).toLowerCase() === key) return db.prescriptions[i];
  }
  return null;
}
function collectRemedyItems(){
  commitRemedyRow();
  calcRemedy();
  var items = [];
  remedyItems.forEach(function(it){
    if (num(it.grams) > 0) items.push({ productId: it.productId, grams: dec(it.grams) });
  });
  return items;
}
function renderPresetOptions(){
  var sel = $('#remedyPreset');
  if (!sel) return;
  var cur = sel.value;
  sel.textContent = '';
  var o0 = el('option', null, '— Đơn mới —');
  o0.value = '';
  sel.appendChild(o0);
  db.prescriptions.slice().sort(function(a, b){
    return a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' });
  }).forEach(function(r){
    var o = el('option', null, r.name);
    o.value = r.id;
    sel.appendChild(o);
  });
  if (cur && findPreset(cur)) sel.value = cur;
  else sel.value = '';
  updatePresetUI();
}
function updatePresetUI(){
  var sel = $('#remedyPreset');
  var nameInp = $('#remedyName');
  var lbl = $('#remedySaveLabel');
  var del = $('#remedyDelPreset');
  var copy = $('#remedyCopyPreset');
  var cur = sel && sel.value ? findPreset(sel.value) : null;
  var name = capWords(nameInp ? nameInp.value : '');
  var target = name ? presetByName(name) : cur;
  if (lbl) {
    if (name) {
      if (cur && (!target || String(target.id) === String(cur.id))) lbl.textContent = 'Cập nhật đơn (' + name + ')';
      else if (target) lbl.textContent = 'Tên đã dùng (' + name + ')';
      else lbl.textContent = 'Lưu đơn (' + name + ')';
    }
    else lbl.textContent = 'Lưu đơn';
  }
  if (del) del.hidden = !cur;
  if (copy) copy.hidden = !cur;
}
function loadPreset(id){
  var r = findPreset(id);
  var tb = $('#remedyBody');
  if (!r || !tb) return;
  tb.textContent = '';
  remedyItems = [];
  r.items.forEach(function(it){
    if (!findProduct(it.productId)) return;
    remedyItems.push({ productId: it.productId, grams: dec(num(it.grams)) });
  });
  remedyEditIdx = -1;
  remedyNotePage = 1;
  orderEmpty(tb, 4, 'Gõ tên vị thuốc ở trên để thêm dòng.');
  var nameInp = $('#remedyName');
  if (nameInp) nameInp.value = r.name;
  var thang = Math.max(1, Math.round(num(r.thang) || 1));
  var th = $('#remedyThang');
  if (th) th.value = String(thang);
  var up = $('#remedyUnitPrice');
  if (up) up.value = num(r.total) > 0 ? String(dec(num(r.total) / thang)) : '';
  renumber(tb);
  calcRemedy();
  updatePresetUI();
}
function onPresetChange(){
  var sel = $('#remedyPreset');
  var id = sel ? sel.value : '';
  if (id) { loadPreset(id); return; }
  var tb = $('#remedyBody');
  if (tb) {
    tb.textContent = '';
    orderEmpty(tb, 4, 'Gõ tên vị thuốc ở trên để thêm dòng.');
  }
  remedyItems = [];
  remedyEditIdx = -1;
  remedyNotePage = 1;
  var nameInp = $('#remedyName');
  if (nameInp) nameInp.value = '';
  var up = $('#remedyUnitPrice');
  if (up) up.value = '';
  var th = $('#remedyThang');
  if (th) th.value = '1';
  calcRemedy();
  updatePresetUI();
}
function savePreset(){
  var nameInp = $('#remedyName');
  var name = capWords(nameInp ? nameInp.value : '');
  if (!name) { toast('Nhập tên đơn', 'error'); if (nameInp) nameInp.focus(); return; }
  if (nameInp) nameInp.value = name;
  var items = collectRemedyItems();
  if (!items.length) { toast('Chọn ít nhất 1 vị thuốc và nhập số gram', 'error'); return; }
  var thang = remedyThang();
  var grand = remedyGrand();
  var sel = $('#remedyPreset');
  var selected = sel && sel.value ? findPreset(sel.value) : null;
  var byName = presetByName(name);
  var cur = selected;
  var msg;

  if (cur) {
    /* Đang sửa một đơn có sẵn: cập nhật theo ID, không dò theo tên. */
    if (byName && String(byName.id) !== String(cur.id)) {
      toast('Tên "' + name + '" đã dùng cho đơn khác', 'error');
      if (nameInp) { nameInp.focus(); if (nameInp.select) nameInp.select(); }
      return;
    }
    if (capWords(cur.name).toLowerCase() !== name.toLowerCase()) {
      var rename = confirm('Đổi tên đơn "' + cur.name + '" thành "' + name + '"?\n\n'
        + 'OK: đổi tên đơn đang chọn.\nHủy: lưu thành đơn mới (giữ lại đơn cũ).');
      if (!rename) cur = null;
    }
  } else if (byName) {
    /* Không chọn đơn nào nhưng tên đã tồn tại: xác nhận ghi đè. */
    if (!confirm('Đơn "' + name + '" đã có. Cập nhật đơn này bằng nội dung đang nhập?')) return;
    cur = byName;
  }

  if (cur) {
    cur.name = name;
    cur.items = items;
    cur.total = dec(grand);
    cur.thang = thang;
    cur.updatedAt = Date.now();
    msg = 'Đã cập nhật đơn "' + name + '"';
  } else {
    cur = { id: uid('RX'), name: name, items: items, total: dec(grand), thang: thang, updatedAt: Date.now() };
    db.prescriptions.push(cur);
    msg = 'Đã lưu đơn "' + name + '"';
  }
  commit(msg);
  if (sel) sel.value = cur.id;
  renderPresetOptions();
  if (sel) sel.value = cur.id;
  updatePresetUI();
}
function delPreset(){
  var sel = $('#remedyPreset');
  var r = sel && sel.value ? findPreset(sel.value) : null;
  if (!r) return;
  if (!confirm('Xóa đơn "' + r.name + '"? Các giao dịch đã bán vẫn được giữ lại.')) return;
  db.prescriptions = db.prescriptions.filter(function(x){ return String(x.id) !== String(r.id); });
  resetRemedy();
  commit('Đã xóa đơn "' + r.name + '"');
}
function copyPreset(){
  var sel = $('#remedyPreset');
  var r = sel && sel.value ? findPreset(sel.value) : null;
  if (!r) { toast('Chọn đơn có sẵn để sao chép', 'error'); return; }
  var items = collectRemedyItems();
  if (!items.length) { toast('Đơn chưa có vị thuốc nào', 'error'); return; }
  var name = window.prompt('Tên đơn mới:', r.name + ' (bản sao)');
  if (name === null) return;
  name = capWords(name);
  if (!name) { toast('Nhập tên đơn', 'error'); return; }
  if (presetByName(name)) { toast('Đã có đơn "' + name + '"', 'error'); return; }
  var copy = {
    id: uid('RX'),
    name: name,
    items: items,
    total: dec(remedyGrand()),
    thang: remedyThang(),
    updatedAt: Date.now()
  };
  db.prescriptions.push(copy);
  commit('Đã sao chép đơn "' + r.name + '" thành "' + name + '"');
  var s = $('#remedyPreset');
  if (s) s.value = copy.id;
  loadPreset(copy.id);
}

/* ================= LƯU ĐƠN ================= */
function commit(msg, force){
  touch();
  renderAll();
  if (orderCur) renderOrder();
  pushState(false, !!force);
  if (msg) toast(msg);
}
function saveRetail(){
  var date = getDateInput('retailDate') || todayISO();
  if (!commitRetailRow()) return;
  var items = retailItems.map(function(it){ return { pid: it.pid, kg: it.kg, amount: it.amount }; });
  if (!items.length) { toast('Chọn vị thuốc và nhập số lượng hợp lệ', 'error'); return; }
  for (var k = 0; k < items.length; k++) {
    if (items[k].kg <= 0) { toast('Số lượng phải lớn hơn 0', 'error'); return; }
    if (items[k].amount < 0) { toast('Thành tiền không được âm', 'error'); return; }
  }

  var oname = 'Bán lẻ';
  var oid = items.length > 1 ? uid('OD') : null;
  var ts = Date.now();

  var need = {};
  items.forEach(function(it){ need[it.pid] = (need[it.pid] || 0) + it.kg; });
  for (var pid in need) {
    var p = findProduct(pid);
    if (!p) { toast('Vị thuốc không còn tồn tại', 'error'); return; }
    if (need[pid] > p.stock + 1e-9) {
      toast('Tồn "' + p.name + '" không đủ (còn ' + fmtQty(p.stock) + ')', 'error');
      return;
    }
  }
  items.forEach(function(it){
    var p = findProduct(it.pid);
    p.stock = dec(p.stock - it.kg);
    var tx = {
      id: uid('TX'), date: date, type: 'BAN', productId: it.pid,
      qty: dec(it.kg), price: it.kg > 0 ? money(it.amount / it.kg) : 0,
      total: money(it.amount), cost: money(it.kg * num(p.costPrice)), ts: ts,
      retail: true
    };
    if (oid) { tx.oid = oid; tx.oname = oname; }
    db.transactions.push(tx);
  });
  resetRetail();
  commit('Đã lưu đơn bán lẻ');
}
function saveRemedy(){
  var date = getDateInput('remedyDate') || todayISO();
  commitRemedyRow();
  calcRemedy();
  var grand = remedyGrand();
  var items = [];
  remedyItems.forEach(function(it){
    if (it.productId && num(it.grams) > 0) items.push({ pid: it.productId, g: num(it.grams) });
  });
  if (!items.length) { toast('Chọn ít nhất 1 vị thuốc và nhập số gram', 'error'); return; }
  if (grand <= 0) { toast('Nhập giá 1 thang', 'error'); return; }

  var thang = remedyThang();
  var need = {};
  items.forEach(function(it){ need[it.pid] = (need[it.pid] || 0) + it.g / 1000 * thang; });
  for (var pid in need) {
    var p = findProduct(pid);
    if (!p) { toast('Vị thuốc không còn tồn tại', 'error'); return; }
    if (need[pid] > p.stock + 1e-9) {
      toast('Tồn "' + p.name + '" không đủ (còn ' + fmtQty(p.stock) + ')', 'error');
      return;
    }
  }
  var oname = capWords(($('#remedyName') || {}).value) || 'Đơn thuốc lẻ';
  var oid = uid('OD');
  var ts = Date.now();
  /* Chia tiền theo gram; dòng cuối nhận phần dư để tổng khớp tuyệt đối. */
  var amounts = allocateRemedyAmounts(grand, items);
  items.forEach(function(it, idx){
    var p = findProduct(it.pid);
    var kg = it.g / 1000 * thang;
    p.stock = dec(p.stock - kg);
    var amount = amounts[idx];
    var tx = {
      id: uid('TX'), date: date, type: 'BAN', productId: it.pid,
      qty: dec(kg), price: kg > 0 ? money(amount / kg) : 0,
      total: amount, cost: money(kg * num(p.costPrice)),
      rx: true, g: dec(it.g), thang: thang, unitPrice: thang > 0 ? money(grand / thang) : 0,
      ts: ts
    };
    if (oid) { tx.oid = oid; tx.oname = oname; }
    db.transactions.push(tx);
  });
  resetRemedy();
  commit('Đã bán đơn thuốc chén');
}

/* ================= THỐNG KÊ ================= */
function txCogs(t){
  if (t.cost != null) return num(t.cost);
  var p = findProduct(t.productId);
  return num(t.qty) * (p ? num(p.costPrice) : 0);
}
/* Hàm thuần để test: không đọc DOM, không phụ thuộc db toàn cục. */
function computeStats(transactions, products, today){
  var ym = String(today || '').slice(0, 7), yr = String(today || '').slice(0, 4);
  var dExp = 0, dCogs = 0, mImp = 0, mExp = 0, mCogs = 0, yExp = 0, yCogs = 0;
  var byId = {};
  (products || []).forEach(function(p){ byId[p.id] = p; });
  (transactions || []).forEach(function(t){
    if (!t || !t.date) return;
    var inDay = t.date === today;
    var inMon = t.date.indexOf(ym) === 0;
    var inYear = t.date.indexOf(yr) === 0;
    if (!inDay && !inMon && !inYear) return;
    var v = num(t.total);
    if (t.type === 'NHAP') {
      if (inMon) mImp += v;
      return;
    }
    var c = t.cost != null
      ? num(t.cost)
      : num(t.qty) * (byId[t.productId] ? num(byId[t.productId].costPrice) : 0);
    if (inDay) { dExp += v; dCogs += c; }
    if (inMon) { mExp += v; mCogs += c; }
    if (inYear) { yExp += v; yCogs += c; }
  });
  return {
    dExp: dExp, dCogs: dCogs, mImp: mImp, mExp: mExp, mCogs: mCogs,
    yExp: yExp, yCogs: yCogs,
    profitDay: dExp - dCogs, profitMonth: mExp - mCogs, profitYear: yExp - yCogs,
    stock: (products || []).reduce(function(a, p){ return a + num(p.stock); }, 0)
  };
}
function renderStats(){
  var s = computeStats(db.transactions, db.products, todayISO());
  var set = function(id, v){ var n = $('#' + id); if (n) n.textContent = v; };
  var setProfit = function(id, v){
    var n = $('#' + id);
    if (!n) return;
    n.textContent = fmtMoney(v);
    n.className = v < 0 ? 'txt-red' : '';
  };
  set('statImport', fmtMoney(s.mImp));
  set('statExport', fmtMoney(s.mExp));
  set('statExportDay', fmtMoney(s.dExp));
  set('statExportYear', fmtMoney(s.yExp));
  setProfit('statProfitDay', s.profitDay);
  setProfit('statProfitYear', s.profitYear);
  var pn = $('#statProfit');
  if (pn) {
    pn.textContent = fmtMoney(s.profitMonth);
    pn.className = 'stat__v ' + (s.profitMonth < 0 ? 'txt-red' : '');
  }
  set('statStock', fmtQty(s.stock));
}
/* ================= PHÂN TRANG ================= */
function mkPageBtn(label, target, disabled, kind, current){
  var b = el('button', 'btn btn--sm pager__num', label);
  b.type = 'button';
  if (current) b.setAttribute('aria-current', 'page');
  if (disabled) { b.disabled = true; return b; }
  b.setAttribute('data-action', 'page');
  b.setAttribute('data-kind', kind);
  b.setAttribute('data-page', String(target));
  return b;
}
function renderPager(host, page, total, kind){
  if (!host) return;
  host.textContent = '';
  if (total <= 1) { host.appendChild(el('span', 'muted small', 'Hiển thị tất cả')); return; }
  host.appendChild(el('span', 'muted small', 'Trang ' + page + ' / ' + total));
  var nav = el('div', 'pager');
  nav.appendChild(mkPageBtn('Trước', page - 1, page <= 1, kind));
  var start = Math.max(1, page - 2), end = Math.min(total, page + 2);
  if (start > 1) {
    nav.appendChild(mkPageBtn('1', 1, false, kind));
    if (start > 2) nav.appendChild(el('span', 'muted small', '…'));
  }
  for (var i = start; i <= end; i++) nav.appendChild(mkPageBtn(String(i), i, false, kind, i === page));
  if (end < total) {
    if (end < total - 1) nav.appendChild(el('span', 'muted small', '…'));
    nav.appendChild(mkPageBtn(String(total), total, false, kind));
  }
  nav.appendChild(mkPageBtn('Sau', page + 1, page >= total, kind));
  host.appendChild(nav);
}
/* ================= MENU THAO TÁC (···) ================= */
/* Menu thao tác nhỏ gắn vào từng dòng (sửa/xóa). Position cố định để không bị
   cắt bởi vùng cuộn ngang của bảng; tự đóng khi bấm ra ngoài/Esc/cuộn trang. */
var rowMenuCur = null;
function closeRowMenu(refocus){
  if (!rowMenuCur) return;
  rowMenuCur.list.hidden = true;
  rowMenuCur.btn.setAttribute('aria-expanded', 'false');
  var b = rowMenuCur.btn;
  rowMenuCur = null;
  if (refocus) { try { b.focus({ preventScroll: true }); } catch (e) { b.focus(); } }
}
function toggleRowMenu(btn, list){
  if (rowMenuCur && rowMenuCur.btn === btn) { closeRowMenu(); return; }
  closeRowMenu();
  list.hidden = false;
  var r = btn.getBoundingClientRect();
  var w = list.offsetWidth, h = list.offsetHeight;
  var left = r.right - w;
  if (left < 8) left = 8;
  if (left + w > window.innerWidth - 8) left = window.innerWidth - w - 8;
  var top = r.bottom + 6;
  if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);
  list.style.left = left + 'px';
  list.style.top = top + 'px';
  btn.setAttribute('aria-expanded', 'true');
  rowMenuCur = { btn: btn, list: list };
}
function rowMenu(items, label){
  var wrap = el('div', 'rowmenu');
  var b = el('button', 'btn btn--icon');
  b.type = 'button';
  b.setAttribute('aria-haspopup', 'menu');
  b.setAttribute('aria-expanded', 'false');
  b.setAttribute('aria-label', label || 'Thao tác');
  b.appendChild(svg('dots'));
  var list = el('div', 'rowmenu__list');
  list.setAttribute('role', 'menu');
  list.hidden = true;
  items.forEach(function(it){
    var ib = el('button', 'menu__item' + (it.danger ? ' menu__item--danger' : ''));
    ib.type = 'button';
    ib.setAttribute('role', 'menuitem');
    ib.setAttribute('data-action', it.action);
    if (it.id != null) ib.setAttribute('data-id', it.id);
    if (it.idx != null) ib.setAttribute('data-idx', String(it.idx));
    ib.appendChild(svg(it.icon));
    ib.appendChild(doc.createTextNode(it.label));
    ib.addEventListener('click', closeRowMenu);
    list.appendChild(ib);
  });
  b.addEventListener('click', function(e){ e.stopPropagation(); toggleRowMenu(b, list); });
  wrap.appendChild(b);
  wrap.appendChild(list);
  return wrap;
}
doc.addEventListener('click', function(e){
  if (!rowMenuCur) return;
  var t = e.target;
  if (t && t.closest && (t.closest('.rowmenu__list') || t.closest('.rowmenu'))) return;
  closeRowMenu();
}, true);
doc.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeRowMenu(true); });
doc.addEventListener('scroll', closeRowMenu, true);
window.addEventListener('resize', closeRowMenu);
function emptyRow(tbody, cols, text){
  var tr = el('tr');
  tr.className = 'is-empty';
  var td = el('td', 'muted small empty-cell', text);
  td.colSpan = cols;
  tr.appendChild(td);
  tbody.appendChild(tr);
}

/* ================= TỒN KHO ================= */
function renderInventory(){
  var tbody = $('#invBody');
  if (!tbody) return;
  tbody.textContent = '';
  var sortBy = ($('#invSort') || {}).value || 'sold_desc';
  var kw = normSearch(($('#invSearch') || {}).value || '');
  var list = db.products.filter(function(p){ return !kw || normSearch(p.name).indexOf(kw) >= 0; });

  // Tổng kg đã bán theo từng vị (BAN: bán lẻ + đơn chén, đều lưu qty_kg)
  var sales = {};
  db.transactions.forEach(function(t){
    if (t && t.type === 'BAN') {
      var pid = t.productId;
      sales[pid] = (sales[pid] || 0) + num(t.qty);
    }
  });

  list.sort(function(a, b){
    if (sortBy === 'sold_desc') return ((sales[b.id] || 0) - (sales[a.id] || 0)) || sortByName(a, b);
    if (sortBy === 'stock_desc') return num(b.stock) - num(a.stock);
    if (sortBy === 'stock_asc') return num(a.stock) - num(b.stock);
    return sortByName(a, b);
  });

  var count = $('#invCount');
  if (count) count.textContent = list.length + ' vị thuốc';

  if (!list.length) {
    emptyRow(tbody, 5, db.products.length ? 'Không tìm thấy vị thuốc phù hợp.' : 'Chưa có vị thuốc nào trong kho.');
    renderPager($('#invPager'), 1, 1, 'inv');
    return;
  }

  var totalPages = Math.ceil(list.length / PAGE_SIZE) || 1;
  if (invPage > totalPages) invPage = totalPages;
  var slice = list.slice((invPage - 1) * PAGE_SIZE, invPage * PAGE_SIZE);

  slice.forEach(function(p){
    var tr = el('tr');
    tr.className = 'is-row';
    tr.appendChild(el('td', 'b', p.name));
    var cSold = el('td', 'num muted', fmtQty(sales[p.id] || 0));
    cSold.setAttribute('data-label', 'Đã bán');
    tr.appendChild(cSold);
    var cStock = el('td', 'num', fmtQty(p.stock));
    cStock.setAttribute('data-label', 'Tồn kho');
    tr.appendChild(cStock);
    var cCost = el('td', 'num muted', fmtUnitPrice(p.costPrice));
    cCost.setAttribute('data-label', 'Giá nhập');
    tr.appendChild(cCost);

    var tdA = el('td', 'c-del');
    tdA.appendChild(rowMenu([
      { label: 'Sửa vị thuốc', icon: 'edit', action: 'edit-prod', id: p.id },
      { label: 'Xóa vị thuốc', icon: 'trash', action: 'del-prod', id: p.id, danger: true }
    ], 'Thao tác với ' + p.name));
    tr.appendChild(tdA);
    tbody.appendChild(tr);
  });
  renderPager($('#invPager'), invPage, totalPages, 'inv');
}

/* ================= LỊCH SỬ ================= */
function txName(t){
  var p = findProduct(t.productId);
  return p ? p.name : null;
}
function timeVN(ts){
  var d = new Date(num(ts));
  if (!isFinite(d.getTime())) return '';
  return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}
function appendOrderRow(tbody, r, isImp){
  var tr = el('tr');
  tr.className = 'is-row';
  tr.appendChild(el('td', 'muted small', dateVN(r.date) + (r.hasTime ? ' ' + timeVN(r.ts) : '')));
  var tn = el('td', 'b');
  var nameBtn = el('button', 'linkbtn', r.oname);
  nameBtn.type = 'button';
  nameBtn.setAttribute('data-action', 'order-view');
  nameBtn.setAttribute('data-oid', r.oid);
  nameBtn.setAttribute('aria-label', 'Xem chi tiết ' + r.oname + ' ngày ' + dateVN(r.date));
  tn.appendChild(nameBtn);
  tn.appendChild(el('span', 'muted small', ' · ' + r.n + ' vị'));
  tr.appendChild(tn);
  var cQty = el('td', 'num', fmtQty(r.qty));
  cQty.setAttribute('data-label', 'SL');
  tr.appendChild(cQty);
  var cPrice = el('td', 'num muted', '—');
  cPrice.setAttribute('data-label', 'Đơn giá');
  tr.appendChild(cPrice);
  var cTotal = el('td', 'num b ' + (isImp ? 'txt-blue' : 'txt-green'), fmtMoney(r.total));
  cTotal.setAttribute('data-label', 'Thành tiền');
  tr.appendChild(cTotal);
  var td = el('td', 'c-act');
  td.appendChild(rowMenu([
    { label: 'Xóa đơn', icon: 'trash', action: 'del-order', id: r.oid, danger: true }
  ], 'Thao tác với ' + r.oname));
  tr.appendChild(td);
  tbody.appendChild(tr);
}
var orderCur = null, orderPage = 1;
function renderOrder(){
  var items = db.transactions.filter(function(t){
    return t.oid && String(t.oid) === String(orderCur);
  });
  var tb = $('#orderBody');
  if (!items.length) { closeOrder(); return; }
  if (!tb) return;
  var first = items[0];
  var isImp = first.type === 'NHAP';
  var oname = first.oname || '';
  var isRetail = !isImp && (items.some(function(t){ return t.retail; }) || oname === 'Bán lẻ');
  var preset = (!isImp && !isRetail) ? presetByName(oname) : null;
  var metaThang = 0, metaUnit = 0;
  items.forEach(function(t){
    if (num(t.thang) > 0) metaThang = num(t.thang);
    if (num(t.unitPrice) > 0) metaUnit = num(t.unitPrice);
  });
  var thang = 0;
  if (!isImp && !isRetail) {
    if (metaThang > 0) thang = Math.max(1, Math.round(metaThang));
    else if (preset) thang = Math.max(1, Math.round(num(preset.thang) || 1));
  }
  var totalMoney = 0, totalKg = 0, maxTs = 0, hasTime = false;
  items.forEach(function(t){
    totalMoney += num(t.total);
    totalKg += num(t.qty);
    var s = txStamp(t);
    if (s > maxTs) maxTs = s;
    if (txHasTime(t)) hasTime = true;
  });
  var perThang = !isImp && thang > 0;
  var unitPrice = perThang ? (metaUnit > 0 ? metaUnit : dec(totalMoney / thang)) : 0;

  var gramsPerThang = 0;
  items.forEach(function(t){
    if (perThang) gramsPerThang += num(t.g) > 0 ? num(t.g) : num(t.qty) * 1000 / thang;
  });

  var qtyHead = $('#orderQtyHead');
  if (qtyHead) qtyHead.textContent = perThang ? 'SL (gram)' : 'SL';
  var priceHead = $('#orderPriceHead');
  if (priceHead) priceHead.hidden = !isImp;
  var moneyHead = $('#orderMoneyHead');
  if (moneyHead) moneyHead.hidden = perThang;
  var footLabel = $('#orderFootLabel');
  if (footLabel) footLabel.textContent = perThang ? 'Tổng 1 thang' : 'Tổng cộng';
  var footQty = $('#orderFootQty');
  if (footQty) footQty.textContent = perThang ? fmtGram(gramsPerThang) : fmtQty(totalKg);
  var footPrice = $('#orderFootPrice');
  if (footPrice) { footPrice.hidden = !isImp; footPrice.textContent = '—'; }
  var footMoney = $('#orderFootMoney');
  if (footMoney) {
    footMoney.hidden = perThang;
    footMoney.textContent = fmtMoney(totalMoney);
  }

  var meta = $('#orderMeta');
  if (meta) {
    var parts = ['Ngày ' + dateVN(first.date) + (hasTime ? ' ' + timeVN(maxTs) : ''), items.length + ' vị'];
    if (perThang) {
      parts.push(fmtQty(gramsPerThang / 1000) + '/thang');
      if (thang > 1) parts.push('tổng ' + thang + ' thang: ' + fmtQty(totalKg));
    } else {
      parts.push(fmtQty(totalKg));
    }
    meta.textContent = parts.join(' · ');
  }
  var title = $('#orderTitle');
  if (title) title.textContent = isImp ? ('Đơn nhập ngày ' + dateVN(first.date)) : oname;
  var noteTitle = $('#orderNoteTitle');
  if (noteTitle) noteTitle.textContent = isImp ? 'Tờ ghi nhập hàng' : (perThang ? 'Tờ ghi đơn thuốc chén' : (isRetail ? 'Tờ ghi đơn bán lẻ' : 'Tờ ghi đơn'));

  var pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  if (orderPage > pages) orderPage = pages;
  if (orderPage < 1) orderPage = 1;
  var start = (orderPage - 1) * PAGE_SIZE;
  tb.textContent = '';
  items.slice(start, start + PAGE_SIZE).forEach(function(t, k){
    var i = start + k;
    var p = findProduct(t.productId);
    var tr = el('tr');
    tr.appendChild(el('td', 'c-num num muted', String(i + 1)));
    tr.appendChild(el('td', 'b', p ? p.name : 'Đã xóa'));
    if (perThang) {
      var g = num(t.g) > 0 ? num(t.g) : num(t.qty) * 1000 / thang;
      tr.appendChild(el('td', 'num', fmtGram(g)));
    } else {
      tr.appendChild(el('td', 'num', fmtQty(t.qty)));
      if (isImp) tr.appendChild(el('td', 'num r', fmtUnitPrice(t.price)));
      tr.appendChild(el('td', 'num r b ' + (isImp ? 'txt-blue' : 'txt-green'), fmtMoney(t.total)));
    }
    var tdA = el('td', 'c-act');
    tdA.appendChild(rowMenu([
      { label: 'Sửa dòng', icon: 'edit', action: 'tx-edit', id: t.id },
      { label: 'Xóa dòng', icon: 'trash', action: 'del-tx', id: t.id, danger: true }
    ], 'Thao tác với dòng ' + (i + 1)));
    tr.appendChild(tdA);
    tb.appendChild(tr);
  });
  var pg = $('#orderNotePg');
  if (pg) pg.textContent = 'Trang ' + orderPage + ' / ' + pages;
  var host = $('#orderPager');
  if (host) {
    host.hidden = pages <= 1;
    if (pages > 1) renderPager(host, orderPage, pages, 'order');
  }

  var params = $('#orderParams');
  if (params) params.hidden = !perThang;
  if (perThang) {
    var pt = $('#orderThang');
    if (pt) pt.textContent = String(thang);
    var pu = $('#orderUnitPrice');
    if (pu) pu.textContent = fmtMoney(unitPrice);
    var po = $('#orderTotal');
    if (po) po.textContent = fmtMoney(totalMoney);
  }
}
function openOrder(oid){
  orderCur = String(oid);
  orderPage = 1;
  renderOrder();
  var d = $('#orderDlg');
  if (d && d.showModal) d.showModal(); else if (d) d.setAttribute('open', '');
}
function closeOrder(){
  var d = $('#orderDlg');
  if (d && d.close) d.close(); else if (d) d.removeAttribute('open');
  orderCur = null;
}
function dateVN(iso){
  var d = String(iso || '').split('-');
  return d.length === 3 ? d[2] + '/' + d[1] + '/' + d[0] : 'Không rõ ngày';
}
function historyData(kind, month, latestOnly){
  var isImp = kind === 'imp';
  indexTx();
  var list = db.transactions.filter(function(t){
    if (t.type !== (isImp ? 'NHAP' : 'BAN')) return false;
    return !month || (t.date && String(t.date).indexOf(month) === 0);
  });

  var oidCount = {};
  if (isImp) {
    list.forEach(function(t){ if (t.oid) oidCount[t.oid] = (oidCount[t.oid] || 0) + 1; });
  }

  var map = {}, rows = [];
  list.forEach(function(t){
    var groupable = !!t.oid && (isImp ? oidCount[t.oid] > 1 : !!t.oname);
    if (!groupable) {
      rows.push({
        single: true, tx: t,
        date: String(t.date || ''),
        ts: txStamp(t), hasTime: txHasTime(t),
        name: txName(t), qty: num(t.qty), total: num(t.total), price: num(t.price)
      });
      return;
    }
    var g = map[t.oid];
    if (!g) {
      g = map[t.oid] = {
        group: true, oid: t.oid, oname: t.oname || '',
        date: String(t.date || ''), ts: txStamp(t), hasTime: txHasTime(t),
        qty: 0, total: 0, n: 0, items: [], name: ''
      };
      rows.push(g);
    }
    g.items.push(t);
    g.qty += num(t.qty);
    g.total += num(t.total);
    g.n++;
    var s = txStamp(t);
    if (s > g.ts) g.ts = s;
    if (txHasTime(t)) g.hasTime = true;
  });

  rows.forEach(function(r){
    if (!r.group) return;
    if (!r.oname) {
      r.oname = isImp ? ('Đơn nhập ngày ' + dateVN(r.date) + (r.hasTime ? ' · ' + timeVN(r.ts) : '')) : 'Đơn';
    }
    r.name = r.oname;
  });

  var latestDate = '', latestTs = -Infinity, latestHasTime = false;
  rows.forEach(function(r){
    if (!r.date) return;
    if (r.date > latestDate || (r.date === latestDate && r.ts > latestTs)) {
      latestDate = r.date;
      latestTs = r.ts;
      latestHasTime = r.hasTime;
    }
  });

  if (latestOnly) {
    /* Gần nhất = toàn bộ giao dịch của ngày gần nhất (thay vì theo phút) */
    rows = rows.filter(function(r){
      return r.date === latestDate;
    });
    rows.sort(function(a, b){ return b.ts - a.ts; });
  } else {
    rows.sort(function(a, b){
      var na = a.name, nb = b.name;
      if (na === null && nb !== null) return 1;
      if (nb === null && na !== null) return -1;
      var c = (na || '').localeCompare(nb || '', 'vi', { sensitivity: 'base' });
      if (c) return c;
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return b.ts - a.ts;
    });
  }

  return { rows: rows, latestDate: latestDate, latestTs: latestTs, latestHasTime: latestHasTime };
}
function renderHistory(kind){
  var isImp = kind === 'imp';
  if (!isImp) updateMergeBtn();
  var tbody = $('#' + kind + 'Body');
  if (!tbody) return;
  var month = getMonthInput(isImp ? 'impMonth' : 'expMonth');
  var latestOnly = !month && !(isImp ? impAll : expAll);
  var data = historyData(kind, month, latestOnly);
  var rows = data.rows;

  var count = $('#' + kind + 'Count');
  if (count) {
    var suffix = '';
    if (data.latestDate) {
      suffix = ' · ' + (isImp ? 'nhập' : 'bán') + ' gần nhất ' + dateVN(data.latestDate) +
        (data.latestHasTime ? ' ' + timeVN(data.latestTs) : '');
    }
    count.textContent = rows.length + (isImp ? ' lần nhập' : ' giao dịch') + suffix;
  }

  tbody.textContent = '';
  if (!rows.length) {
    emptyRow(tbody, 6, isImp ? 'Không có giao dịch nhập.' : 'Không có giao dịch bán.');
    renderPager($('#' + kind + 'Pager'), 1, 1, kind);
    return;
  }

  var page = isImp ? impPage : expPage;
  var totalPages = Math.ceil(rows.length / PAGE_SIZE) || 1;
  if (page > totalPages) page = totalPages;
  if (page < 1) page = 1;
  if (isImp) impPage = page; else expPage = page;
  var slice = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  slice.forEach(function(r){
    if (r.group) { appendOrderRow(tbody, r, isImp); return; }
    var t = r.tx;
    var tr = el('tr');
    tr.className = 'is-row';
    tr.appendChild(el('td', 'muted small', dateVN(t.date) + (r.hasTime ? ' ' + timeVN(r.ts) : '')));
    var name = r.name;
    tr.appendChild(el('td', 'b', name === null ? 'Đã xóa' : name));
    var cQty = el('td', 'num', fmtQty(t.qty));
    cQty.setAttribute('data-label', 'SL');
    tr.appendChild(cQty);
    var cPrice = el('td', 'num muted', fmtUnitPrice(t.price));
    cPrice.setAttribute('data-label', 'Đơn giá');
    tr.appendChild(cPrice);
    var cTotal = el('td', 'num b ' + (isImp ? 'txt-blue' : 'txt-green'), fmtMoney(t.total));
    cTotal.setAttribute('data-label', 'Thành tiền');
    tr.appendChild(cTotal);
    var td = el('td', 'c-act');
    td.appendChild(rowMenu([
      { label: 'Sửa giao dịch', icon: 'edit', action: 'tx-edit', id: t.id },
      { label: 'Xóa giao dịch', icon: 'trash', action: 'del-tx', id: t.id, danger: true }
    ], 'Thao tác với giao dịch ngày ' + dateVN(t.date)));
    tr.appendChild(td);
    tbody.appendChild(tr);
  });
  renderPager($('#' + kind + 'Pager'), page, totalPages, kind);
}
/* ================= GỘP ĐƠN THUỐC LẺ CŨ ================= */
function mergeCandidates(){
  var map = {}, list = [];
  db.transactions.forEach(function(t){
    if (t.type !== 'BAN' || t.oid) return;
    /* Không gộp đơn bán lẻ (kể cả dữ liệu cũ chưa có cờ retail). */
    if (t.retail) return;
    if (String(t.oname || '').toLowerCase() === 'bán lẻ') return;
    var price = dec(num(t.price));
    var key = t.date + '|' + String(dec(price));
    var g = map[key];
    if (!g) { g = map[key] = { key: key, date: String(t.date || ''), price: price, items: [], total: 0 }; list.push(g); }
    g.items.push(t);
    g.total += num(t.total);
  });
  list = list.filter(function(g){ return g.items.length >= 2 && g.price > 0; });
  list.forEach(function(g){
    var q = g.price / 5;
    g.likely = Math.abs(q - Math.round(q)) > 0.002;
  });
  list.sort(function(a, b){
    if (a.likely !== b.likely) return a.likely ? -1 : 1;
    return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
  });
  return list;
}
function updateMergeBtn(){
  var b = $('#mergeBtn');
  if (b) b.hidden = !mergeCandidates().length;
}
function openMerge(){
  var list = mergeCandidates();
  var box = $('#mergeList');
  if (!box) return;
  box.textContent = '';
  var hint = $('#mergeHint');
  if (hint) hint.textContent = list.length
    ? 'Các dòng bán chưa có tên đơn, cùng ngày và cùng đơn giá/kg có thể là một đơn thuốc chén bán không đặt tên. Đơn giá lẻ do chia đều (rất giống đơn thuốc chén) được tick sẵn; đơn giá tròn có thể là bán lẻ nên chưa tick. Chỉ tick những đơn bạn chắc chắn.'
    : 'Không còn đơn nào cần gộp.';
  list.forEach(function(g){
    var lab = el('label', 'mrow');
    var cb = el('input');
    cb.type = 'checkbox';
    cb.setAttribute('data-key', g.key);
    cb.checked = g.likely;
    lab.appendChild(cb);
    var d = el('div');
    d.appendChild(el('div', 'b', dateVN(g.date) + ' · ' + g.items.length + ' vị · ' + fmtMoney(g.total) + ' · giá ' + fmtUnitPrice(g.price)));
    var names = g.items.slice(0, 6).map(function(t){ return txName(t) || 'Đã xóa'; }).join(', ');
    d.appendChild(el('div', 'muted small', names + (g.items.length > 6 ? '…' : '')));
    lab.appendChild(d);
    box.appendChild(lab);
  });
  var go = document.querySelector('[data-action="merge-do"]');
  if (go) go.hidden = !list.length;
  var dlg = $('#mergeDlg');
  if (dlg && dlg.showModal) dlg.showModal(); else if (dlg) dlg.setAttribute('open', '');
}
function closeMerge(){
  var dlg = $('#mergeDlg');
  if (dlg && dlg.close) dlg.close(); else if (dlg) dlg.removeAttribute('open');
}
function mergeDo(){
  var keys = {};
  var n = 0;
  $$('#mergeList input[type=checkbox]').forEach(function(cb){
    if (cb.checked) keys[cb.getAttribute('data-key')] = true;
  });
  mergeCandidates().forEach(function(g){
    if (!keys[g.key]) return;
    var oid = uid('OD');
    g.items.forEach(function(t){ t.oid = oid; t.oname = 'Đơn thuốc lẻ'; });
    n++;
  });
  if (!n) { toast('Chưa chọn đơn nào để gộp', 'error'); return; }
  closeMerge();
  commit('Đã gộp ' + n + ' đơn thuốc lẻ');
}

/* ================= ĐỐI CHIẾU TỒN KHO ================= */
function reconcileList(){
  var inn = {}, out = {};
  db.transactions.forEach(function(t){
    var m = t.type === 'NHAP' ? inn : out;
    m[t.productId] = (m[t.productId] || 0) + num(t.qty);
  });
  var res = [];
  db.products.forEach(function(p){
    var calc = dec((inn[p.id] || 0) - (out[p.id] || 0));
    var diff = dec(num(p.stock) - calc);
    if (Math.abs(diff) > 1e-9) res.push({ id: p.id, name: p.name, stock: num(p.stock), calc: calc, diff: diff });
  });
  res.sort(function(a, b){ return Math.abs(b.diff) - Math.abs(a.diff); });
  return res;
}
function fmtKgExact(v){ return fmtNum(v) + ' kg'; }
function renderRec(){
  var tb = $('#recBody');
  if (!tb) return;
  var list = reconcileList();
  tb.textContent = '';
  var hint = $('#recHint');
  if (hint) {
    hint.textContent = list.length
      ? list.length + ' vị thuốc có tồn khác với số tính từ lịch sử (tổng nhập trừ tổng bán). Chỉ áp dụng khi bạn chắc lịch sử đúng; nếu lịch sử có dòng nhập nhầm thì sửa dòng đó trước.'
      : 'Tồn kho của tất cả vị thuốc khớp với lịch sử nhập và bán.';
  }
  list.forEach(function(r){
    var tr = el('tr');
    tr.appendChild(el('td', 'b', r.name));
    tr.appendChild(el('td', 'num', fmtKgExact(r.stock)));
    tr.appendChild(el('td', 'num', fmtKgExact(r.calc)));
    tr.appendChild(el('td', 'num', (r.diff > 0 ? '+' : '') + fmtKgExact(r.diff)));
    var td = el('td', 'c-act');
    var b = el('button', 'btn btn--sm', 'Dùng số lịch sử');
    b.type = 'button';
    b.setAttribute('data-action', 'rec-fix');
    b.setAttribute('data-id', r.id);
    td.appendChild(b);
    tr.appendChild(td);
    tb.appendChild(tr);
  });
  var fa = $('#recFixAll');
  if (fa) fa.hidden = !list.length;
}
function openRec(){
  renderRec();
  var d = $('#recDlg');
  if (d && d.showModal) d.showModal(); else if (d) d.setAttribute('open', '');
}
function closeRec(){
  var d = $('#recDlg');
  if (d && d.close) d.close(); else if (d) d.removeAttribute('open');
}
function recFix(id){
  var p = findProduct(id);
  if (!p) return;
  var r = null;
  reconcileList().forEach(function(x){ if (String(x.id) === String(id)) r = x; });
  if (!r) return;
  if (r.calc < -1e-9) {
    toast('Số theo lịch sử đang âm — không thể áp dụng. Hãy sửa giao dịch nhập/bán trước.', 'error');
    return;
  }
  p.stock = r.calc;
  commit('Đã chỉnh tồn "' + p.name + '"');
  renderRec();
}
function recFixAll(){
  var list = reconcileList();
  if (!list.length) return;
  var valid = list.filter(function(r){ return r.calc >= -1e-9; });
  if (!valid.length) {
    toast('Tất cả vị lệch đều có số lịch sử âm — hãy sửa giao dịch trước.', 'error');
    return;
  }
  if (!confirm('Đặt lại tồn của ' + valid.length + ' vị thuốc theo lịch sử?' +
    (valid.length < list.length ? '\n(' + (list.length - valid.length) + ' vị có số âm sẽ bỏ qua.)' : ''))) return;
  valid.forEach(function(r){
    var p = findProduct(r.id);
    if (p) p.stock = Math.max(0, r.calc);
  });
  commit('Đã chỉnh tồn ' + valid.length + ' vị thuốc');
  renderRec();
}
/* ================= HOÀN TÁC CHUẨN HOÁ CŨ ================= */
var MIG_KEY = 'kho_migrate_retail_v1';
var MIG_BAK = 'kho_backup_premig_v1';

function restoreMigrate(){
  var raw = null;
  try { raw = localStorage.getItem(MIG_BAK); } catch (e) {}
  if (!raw) { toast('Không có bản sao lưu', 'error'); return; }
  if (!confirm('Khôi phục toàn bộ dữ liệu trước khi chuẩn hoá?')) return;
  var bak = null;
  try { bak = sanitize(JSON.parse(raw)); } catch (e) {}
  if (!bak) { toast('Bản sao lưu không đọc được', 'error'); return; }
  db = bak;
  try { localStorage.removeItem(MIG_KEY); } catch (e) {}
  commit('Đã khôi phục dữ liệu trước chuẩn hoá', true);
}

/* ================= BIỂU ĐỒ ================= */
var chartSel = -1, chartGeo = null;
function chartData(){
  var year = ($('#chartYear') || {}).value || thisYear();
  var imp = [], exp = [], impK = [], expK = [];
  for (var m = 1; m <= 12; m++) {
    var ym = year + '-' + pad2(m);
    var a = 0, b = 0, ak = 0, bk = 0;
    db.transactions.forEach(function(t){
      if (!t.date || t.date.indexOf(ym) !== 0) return;
      var v = num(t.total);
      if (t.type === 'NHAP') { a += v / 1000; ak += v; }
      else { b += v / 1000; bk += v; }
    });
    imp.push(dec(a)); exp.push(dec(b));
    impK.push(dec(ak)); expK.push(dec(bk));
  }
  return { imp: imp, exp: exp, impK: impK, expK: expK, year: year };
}
function niceMax(v){
  if (v <= 0) return 1;
  var e = Math.pow(10, Math.floor(Math.log10(v)));
  var m = v / e;
  var n = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10;
  return n * e;
}
function axisLabel(v){
  if (v >= 1000) return NF1.format(v / 1000) + ' tỷ';
  if (v >= 10) return NF0.format(v);
  if (v >= 1) return NF1.format(v);
  return v === 0 ? '0' : NF2.format(v);
}
function bar(ctx, x, y, w, h, r){
  if (h <= 0.2 || w <= 0) return;
  r = Math.min(r, w / 2, h);
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
}
function renderChart(){
  var cv = $('#statsChart');
  if (!cv || !cv.offsetParent) return;
  var host = cv.parentNode;
  var cssW = cv.clientWidth || host.clientWidth || 600;
  var cssH = cv.clientHeight || 300;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(cssW * dpr);
  cv.height = Math.round(cssH * dpr);
  var ctx = cv.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  var cs = getComputedStyle(doc.documentElement);
  var colText = cs.getPropertyValue('--muted').trim() || '#5b6b81';
  var colGrid = cs.getPropertyValue('--border').trim() || '#e3e8ef';

  var data = chartData();
  var max = 0;
  data.imp.forEach(function(v){ if (v > max) max = v; });
  data.exp.forEach(function(v){ if (v > max) max = v; });
  max = niceMax(max);

  var padL = 44, padR = 8, padT = 12, padB = 26;
  var W = Math.max(10, cssW - padL - padR);
  var H = Math.max(10, cssH - padT - padB);
  var groupW = W / 12;
  var bw = Math.max(3, Math.min(16, groupW / 3));
  var y0 = padT + H;

  ctx.font = '11px system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
  ctx.textBaseline = 'middle';

  for (var g = 0; g <= 4; g++) {
    var val = max * g / 4;
    var y = Math.round(y0 - H * g / 4) + 0.5;
    ctx.strokeStyle = colGrid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + W, y);
    ctx.stroke();
    ctx.fillStyle = colText;
    ctx.textAlign = 'right';
    ctx.fillText(axisLabel(val), padL - 7, y);
  }

  for (var i = 0; i < 12; i++) {
    var cx = padL + groupW * i + groupW / 2;
    if (i === chartSel) {
      ctx.fillStyle = 'rgba(99,102,241,.14)';
      ctx.fillRect(padL + groupW * i, padT, groupW, H);
    }
    ctx.fillStyle = '#6366f1';
    bar(ctx, cx - bw - 1, y0 - H * data.imp[i] / max, bw, H * data.imp[i] / max, 3);
    ctx.fillStyle = '#10b981';
    bar(ctx, cx + 1, y0 - H * data.exp[i] / max, bw, H * data.exp[i] / max, 3);
    ctx.fillStyle = colText;
    ctx.textAlign = 'center';
    ctx.fillText('T' + (i + 1), cx, y0 + 13);
  }

  chartGeo = { padL: padL, padT: padT, W: W, H: H, groupW: groupW, y0: y0, cssW: cssW, cssH: cssH };
  var tip = $('#chartTip');
  if (tip) {
    if (chartSel >= 0 && chartSel < 12) {
      tip.textContent = 'Tháng ' + (chartSel + 1) + '/' + data.year +
        ' — Nhập: ' + fmtMoney(data.impK[chartSel]) +
        ' · Bán: ' + fmtMoney(data.expK[chartSel]);
    } else {
      tip.textContent = 'Bấm vào cột để xem số liệu tháng.';
    }
  }
}
function onChartClick(e){
  var cv = $('#statsChart');
  if (!cv || !chartGeo) return;
  var r = cv.getBoundingClientRect();
  var g = chartGeo;
  var x = (e.clientX - r.left) * (g.cssW / (r.width || g.cssW));
  var y = (e.clientY - r.top) * (g.cssH / (r.height || g.cssH));
  if (x < g.padL || x > g.padL + g.W || y < g.padT || y > g.y0 + 14) return;
  var i = Math.floor((x - g.padL) / g.groupW);
  if (i < 0) i = 0; else if (i > 11) i = 11;
  chartSel = chartSel === i ? -1 : i;
  renderChart();
}

/* ================= GỢI Ý TÌM NHANH ================= */
var SUG = {
  retail: { input: 'retailSearch', list: 'retailList' },
  remedy: { input: 'remedySearch', list: 'remedyList' },
  nhap:   { input: 'nhapSearch', list: 'nhapList' },
  inv:    { input: 'invSearch', list: 'invList' }
};
var sugIdx = -1;

function matchProducts(q){
  var nq = normSearch(q);
  var arr = db.products.filter(function(p){ return !nq || normSearch(p.name).indexOf(nq) >= 0; });
  arr.sort(function(a, b){
    var sa = nq && normSearch(a.name).indexOf(nq) === 0 ? 0 : 1;
    var sb = nq && normSearch(b.name).indexOf(nq) === 0 ? 0 : 1;
    return (sa - sb) || sortByName(a, b);
  });
  return arr.slice(0, 50);
}
function closeSuggest(key){
  var cfg = SUG[key];
  if (!cfg) return;
  var list = $('#' + cfg.list), inp = $('#' + cfg.input);
  if (list) list.hidden = true;
  if (inp) inp.setAttribute('aria-expanded', 'false');
  sugIdx = -1;
}
function openSuggest(key){
  var cfg = SUG[key];
  if (!cfg) return;
  var inp = $('#' + cfg.input), list = $('#' + cfg.list);
  if (!inp || !list) return;
  var items = matchProducts(inp.value);
  var raw = String(inp.value || '').trim();
  var exact = false;
  list.textContent = '';
  sugIdx = -1;
  items.forEach(function(p){
    if (raw && capWords(p.name).toLowerCase() === capWords(raw).toLowerCase()) exact = true;
    var b = el('button', 'sug__item');
    b.type = 'button';
    b.setAttribute('role', 'option');
    b.setAttribute('aria-selected', 'false');
    b.appendChild(el('span', 'sug__name', p.name));
    var meta = 'Tồn ' + fmtQty(p.stock);
    var pr = refPrice(p);
    if (pr > 0) meta += ' · ' + fmtUnitPrice(pr);
    b.appendChild(el('span', 'sug__meta', meta));
    b.addEventListener('mousedown', function(e){ e.preventDefault(); pickSuggest(key, p.id); });
    list.appendChild(b);
  });
  if (key === 'nhap' && raw && !exact) {
    var nb = el('button', 'sug__item');
    nb.type = 'button';
    nb.setAttribute('role', 'option');
    nb.setAttribute('aria-selected', 'false');
    nb.appendChild(el('span', 'sug__name', 'Tạo mới: ' + capWords(raw)));
    nb.appendChild(el('span', 'sug__meta', 'Vị thuốc mới'));
    nb.addEventListener('mousedown', function(e){ e.preventDefault(); nhapNewProduct(raw); });
    list.appendChild(nb);
  }
  if (!list.children.length) list.appendChild(el('div', 'sug__empty', 'Không tìm thấy vị thuốc nào'));
  list.hidden = false;
  inp.setAttribute('aria-expanded', 'true');
}
function dupOrderRow(bodySel, pid){
  var found = null;
  $$(bodySel + ' tr[data-pid]').forEach(function(tr){
    if (tr.getAttribute('data-pid') === String(pid)) found = tr;
  });
  return found;
}
function pickSuggest(key, id){
  var p = findProduct(id);
  if (!p) return;
  if (key === 'retail' || key === 'remedy') {
    var isR = key === 'retail';
    var dup = dupOrderRow(isR ? '#retailBody' : '#remedyBody', p.id);
    if (isR && !dup) {
      for (var di = 0; di < retailItems.length; di++) {
        if (String(retailItems[di].pid) !== String(p.id)) continue;
        toast('"' + p.name + '" đã có trong tờ ghi — bấm sửa để đổi SL', 'error');
        noteEditIdx = di;
        notePage = Math.floor(di / PAGE_SIZE) + 1;
        renderNote();
        var eq2 = $('#noteEditQty');
        if (eq2) { eq2.focus(); eq2.select(); }
        var s9 = $('#retailSearch');
        if (s9) s9.value = '';
        closeSuggest(key);
        return;
      }
    }
    if (!isR && !dup) {
      for (var dj = 0; dj < remedyItems.length; dj++) {
        if (String(remedyItems[dj].productId) !== String(p.id)) continue;
        toast('"' + p.name + '" đã có trong tờ ghi — bấm sửa để đổi gram', 'error');
        remedyEditIdx = dj;
        remedyNotePage = Math.floor(dj / PAGE_SIZE) + 1;
        renderRemedyNote();
        var eq3 = $('#remedyNoteEditQty');
        if (eq3) { eq3.focus(); eq3.select(); }
        var s8 = $('#remedySearch');
        if (s8) s8.value = '';
        closeSuggest(key);
        return;
      }
    }
    if (dup) {
      toast('"' + p.name + '" đã có trong danh sách', 'error');
      var q0 = $(isR ? '.retail-qty' : '.remedy-qty', dup);
      if (q0) { q0.focus(); if (q0.select) q0.select(); }
      var s0 = $(isR ? '#retailSearch' : '#remedySearch');
      if (s0) s0.value = '';
      closeSuggest(key);
      return;
    }
  }
  if (key === 'retail') {
    if (!commitRetailRow()) return;
    var row = addOrderRow('retail', p.id);
    if (row) $('.retail-qty', row).focus();
    var s1 = $('#retailSearch');
    if (s1) s1.value = '';
    calcRetail();
  } else if (key === 'remedy') {
    commitRemedyRow();
    var row2 = addOrderRow('remedy', p.id);
    if (row2) $('.remedy-qty', row2).focus();
    var s2 = $('#remedySearch');
    if (s2) s2.value = '';
    calcRemedy();
  } else if (key === 'nhap') {
    nhapPick(p);
  } else if (key === 'inv') {
    $('#invSearch').value = p.name;
    invPage = 1;
    renderInventory();
  }
  closeSuggest(key);
}
function onSuggestKey(e, key){
  var cfg = SUG[key];
  if (!cfg) return;
  var list = $('#' + cfg.list);
  if (!list) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    if (list.hidden) { openSuggest(key); }
    var items = $$('.sug__item', list);
    if (!items.length) return;
    sugIdx = (sugIdx + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items.forEach(function(n, i){ n.setAttribute('aria-selected', i === sugIdx ? 'true' : 'false'); });
    items[sugIdx].scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Enter') {
    var items2 = $$('.sug__item', list);
    if (!list.hidden && items2.length) {
      e.preventDefault();
      items2[sugIdx >= 0 ? sugIdx : 0].dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    }
  } else if (e.key === 'Escape') {
    closeSuggest(key);
  }
}
var suppressSug = false;
function initSuggest(){
  Object.keys(SUG).forEach(function(key){
    var cfg = SUG[key];
    var inp = $('#' + cfg.input);
    if (!inp) return;
    inp.addEventListener('input', function(){ openSuggest(key); });
    inp.addEventListener('keydown', function(e){ onSuggestKey(e, key); });
    inp.addEventListener('blur', function(){ setTimeout(function(){ closeSuggest(key); }, 140); });
  });
}
/* ================= NHẬP HÀNG ================= */
var nhapPid = null;
function findByName(name){
  var key = capWords(name).toLowerCase();
  if (!key) return null;
  for (var i = 0; i < db.products.length; i++) {
    if (capWords(db.products[i].name).toLowerCase() === key) return db.products[i];
  }
  return null;
}
function nhapPick(p){
  nhapPid = p.id;
  var inp = $('#nhapSearch');
  if (inp) inp.value = p.name;
  var price = $('#nhapPrice');
  var l = lastImport(p.id);
  var v = l ? l.price : num(p.costPrice);
  if (price) price.value = v > 0 ? String(v) : '';
  var hint = $('#nhapHint');
  if (hint) {
    if (v > 0) {
      var txt = 'Giá nhập gần nhất: ' + fmtUnitPrice(v);
      if (l && l.date) {
        txt += ' (ngày ' + dateVN(l.date) + (l.hasTime ? ' ' + timeVN(l.ts) : '') + ')';
      }
      hint.textContent = txt;
      hint.hidden = false;
    } else {
      hint.hidden = true;
      hint.textContent = '';
    }
  }
  calcNhap();
  var q = $('#nhapQty');
  if (q) { q.focus(); if (q.select) q.select(); }
}
function nhapNewProduct(name){
  var inp = $('#nhapSearch');
  if (inp) inp.value = capWords(name);
  nhapPid = null;
  var hint = $('#nhapHint');
  if (hint) {
    hint.textContent = 'Vị thuốc mới — sẽ được tạo khi lưu.';
    hint.hidden = false;
  }
  closeSuggest('nhap');
  var q = $('#nhapQty');
  if (q) q.focus();
}
function calcNhap(){
  var q = num(($('#nhapQty') || {}).value);
  var p = num(($('#nhapPrice') || {}).value);
  var out = $('#nhapTotal');
  if (out) out.textContent = fmtMoney(q * p);
}
var nhapList = [];
function nhapPriceOk(p, price){
  if (!p || !(price > 0)) return true;
  var l = lastImport(p.id);
  var ref = l ? l.price : 0;
  if (!(ref > 0)) return true;
  var ratio = price / ref;
  if (ratio <= 1.5 && ratio >= 0.5) return true;
  var pct = dec((ratio - 1) * 100);
  return confirm('Giá nhập "' + p.name + '" lần này là ' + fmtUnitPrice(price) + ', chênh ' + (pct > 0 ? '+' : '') + fmtNum(pct) + '% so với lần nhập gần nhất (' + fmtUnitPrice(ref) + ').\nBạn có chắc giá này đúng không?');
}
function renderNhapList(){
  var box = $('#nhapListBox');
  var tb = $('#nhapListBody');
  if (!box || !tb) return;
  tb.textContent = '';
  box.hidden = !nhapList.length;
  var sum = 0;
  nhapList.forEach(function(it, i){
    sum += num(it.qty) * num(it.price);
    var tr = el('tr');
    tr.className = 'is-row';
    tr.appendChild(el('td', 'c-num num muted', String(i + 1)));
    tr.appendChild(el('td', 'b', it.name));
    var cq = el('td', 'num', fmtQty(it.qty));
    cq.setAttribute('data-label', 'SL');
    tr.appendChild(cq);
    var cp = el('td', 'num muted r', it.price > 0 ? fmtMoney(it.price) : '—');
    cp.setAttribute('data-label', 'Giá nhập');
    tr.appendChild(cp);
    var td = el('td', 'c-act');
    td.appendChild(rowMenu([
      { label: 'Xóa dòng', icon: 'trash', action: 'del-nhap-item', idx: i, danger: true }
    ], 'Thao tác với ' + it.name));
    tr.appendChild(td);
    tb.appendChild(tr);
  });
  var tot = $('#nhapListTotal');
  if (tot) tot.textContent = fmtMoney(sum);
  var cnt = $('#nhapListCount');
  if (cnt) cnt.textContent = nhapList.length ? nhapList.length + ' vị' : '';
  var lbl = $('#nhapSaveLabel');
  if (lbl) lbl.textContent = nhapList.length ? 'Lưu nhập hàng (' + nhapList.length + ')' : 'Lưu nhập hàng';
}
function resetNhapInputs(){
  nhapPid = null;
  var inp = $('#nhapSearch');
  if (inp) inp.value = '';
  ['nhapQty', 'nhapPrice'].forEach(function(id){
    var n = $('#' + id);
    if (n) n.value = '';
  });
  var hint = $('#nhapHint');
  if (hint) { hint.hidden = true; hint.textContent = ''; }
  calcNhap();
}
function addNhapItem(){
  var inp = $('#nhapSearch');
  var name = capWords((inp || {}).value);
  var qty = num(($('#nhapQty') || {}).value);
  var price = num(($('#nhapPrice') || {}).value);
  if (!name) { toast('Nhập tên vị thuốc', 'error'); if (inp) inp.focus(); return; }
  if (qty <= 0) { toast('Nhập số lượng lớn hơn 0', 'error'); var q = $('#nhapQty'); if (q) q.focus(); return; }
  if (price < 0) { toast('Giá nhập không được âm', 'error'); var pNeg = $('#nhapPrice'); if (pNeg) { pNeg.focus(); pNeg.select(); } return; }
  var p = nhapPid ? findProduct(nhapPid) : findByName(name);
  if (!nhapPriceOk(p, price)) { var pi = $('#nhapPrice'); if (pi) { pi.focus(); pi.select(); } return; }
  nhapList.push({ pid: p ? p.id : null, name: p ? p.name : name, qty: dec(qty), price: dec(price) });
  resetNhapInputs();
  renderNhapList();
  closeSuggest('nhap');
  if (inp) inp.focus();
}
function saveNhap(e){
  if (e) e.preventDefault();
  var date = todayISO();
  var entries = nhapList.slice();
  var name = capWords(($('#nhapSearch') || {}).value);
  if (name) {
    var qty = num(($('#nhapQty') || {}).value);
    var price = num(($('#nhapPrice') || {}).value);
    if (price < 0) { toast('Giá nhập không được âm', 'error'); var pn = $('#nhapPrice'); if (pn) { pn.focus(); pn.select(); } return; }
    var cp = nhapPid ? findProduct(nhapPid) : findByName(name);
    if (qty > 0 && !nhapPriceOk(cp, price)) { var pi2 = $('#nhapPrice'); if (pi2) { pi2.focus(); pi2.select(); } return; }
    if (qty > 0 || !cp) entries.push({ pid: cp ? cp.id : null, name: name, qty: dec(qty), price: dec(price) });
    else if (!entries.length) { toast('Nhập số lượng lớn hơn 0', 'error'); return; }
  }
  if (!entries.length) { toast('Nhập tên vị thuốc', 'error'); var i0 = $('#nhapSearch'); if (i0) i0.focus(); return; }
  for (var ei = 0; ei < entries.length; ei++) {
    if (entries[ei].qty < 0) { toast('Số lượng không được âm', 'error'); return; }
    if (entries[ei].price < 0) { toast('Giá nhập không được âm', 'error'); return; }
  }

  var savedN = 0;
  var batchId = uid('IM');
  var ts = Date.now();
  entries.forEach(function(it){
    var p = it.pid ? findProduct(it.pid) : null;
    if (!p) p = findByName(it.name);
    if (!p) {
      p = { id: uid('PROD'), name: it.name, stock: 0, costPrice: money(it.price) };
      db.products.push(p);
    }
    if (it.qty > 0) {
      p.stock = dec(num(p.stock) + it.qty);
      if (it.price > 0) p.costPrice = money(it.price);
      db.transactions.push({
        id: uid('TX'), date: date, type: 'NHAP', productId: p.id,
        qty: dec(it.qty), price: money(it.price), total: money(it.qty * it.price), cost: null,
        oid: batchId, ts: ts
      });
      savedN++;
    }
  });

  if (savedN > 0) {
    impAll = false;
    impPage = 1;
    setMonthInput('impMonth', '');
  }
  nhapList = [];
  resetNhapInputs();
  renderNhapList();
  commit(savedN === 0 ? 'Đã tạo vị thuốc' : savedN > 1 ? 'Đã lưu nhập ' + savedN + ' vị thuốc' : 'Đã lưu nhập hàng');
}

/* ================= SẢN PHẨM ================= */
function dupName(name, excludeId){
  var key = capWords(name).toLowerCase();
  if (!key) return null;
  for (var i = 0; i < db.products.length; i++) {
    var p = db.products[i];
    if (String(p.id) === String(excludeId || '')) continue;
    if (capWords(p.name).toLowerCase() === key) return p;
  }
  return null;
}
function openEdit(id){
  var p = findProduct(id);
  if (!p) return;
  $('#editId').value = p.id;
  $('#editName').value = p.name;
  $('#editPrice').value = String(num(p.costPrice));
  var d = $('#editDlg');
  if (d && d.showModal) d.showModal(); else if (d) d.setAttribute('open', '');
}
function saveEdit(){
  var id = $('#editId').value;
  var name = capWords($('#editName').value);
  var price = num($('#editPrice').value);
  if (!name) { toast('Tên vị thuốc không được để trống', 'error'); return; }
  if (price < 0) { toast('Giá nhập không được âm', 'error'); var ep = $('#editPrice'); if (ep) { ep.focus(); ep.select(); } return; }
  var p = findProduct(id);
  if (!p) { toast('Không tìm thấy vị thuốc', 'error'); return; }
  var d = dupName(name, id);
  if (d) { toast('Đã có "' + d.name + '" trong kho', 'error'); return; }
  p.name = name;
  p.costPrice = dec(price);
  closeEdit();
  commit('Đã cập nhật vị thuốc');
}
function closeEdit(){
  var d = $('#editDlg');
  if (d && d.close) d.close(); else if (d) d.removeAttribute('open');
}
function delProduct(id){
  var p = findProduct(id);
  if (!p) return;
  if (!confirm('Xóa "' + p.name + '" khỏi kho? Lịch sử giao dịch vẫn được giữ lại.')) return;
  db.products = db.products.filter(function(x){ return String(x.id) !== String(id); });
  commit('Đã xóa vị thuốc');
}
function delTx(id){
  var t = null;
  for (var i = 0; i < db.transactions.length; i++) if (db.transactions[i].id === id) { t = db.transactions[i]; break; }
  if (!t) return;
  if (!confirm('Xóa giao dịch này? Tồn kho sẽ được điều chỉnh lại.')) return;
  var p = findProduct(t.productId);
  if (p && t.type === 'NHAP' && num(p.stock) - num(t.qty) < -1e-9) {
    toast('Không thể xóa: "' + p.name + '" đã bán, tồn sẽ âm. Hãy sửa/xóa đơn bán liên quan trước.', 'error');
    return;
  }
  if (p) {
    if (t.type === 'NHAP') p.stock = dec(p.stock - num(t.qty));
    else p.stock = dec(p.stock + num(t.qty));
  }
  db.transactions = db.transactions.filter(function(x){ return x.id !== id; });
  commit('Đã xóa giao dịch');
}
/* ================= SỬA GIAO DỊCH ================= */
var txEditCur = null;
function findTx(id){
  for (var i = 0; i < db.transactions.length; i++) {
    if (db.transactions[i].id === id) return db.transactions[i];
  }
  return null;
}
function delOrder(oid){
  var items = db.transactions.filter(function(x){ return x.oid === oid; });
  if (!items.length) return;
  var label = items[0].oname || (items[0].type === 'NHAP'
    ? 'đơn nhập ngày ' + dateVN(items[0].date)
    : 'đơn');
  if (!confirm('Xóa cả ' + label + '? Tồn kho sẽ được điều chỉnh lại.')) return;
  /* Kiểm tra trước toàn bộ đơn nhập: không được để tồn âm. */
  for (var i = 0; i < items.length; i++) {
    var t0 = items[i];
    if (t0.type !== 'NHAP') continue;
    var p0 = findProduct(t0.productId);
    if (p0 && num(p0.stock) - num(t0.qty) < -1e-9) {
      toast('Không thể xóa: "' + p0.name + '" đã bán, tồn sẽ âm. Hãy sửa/xóa đơn bán liên quan trước.', 'error');
      return;
    }
  }
  items.forEach(function(t){
    var p = findProduct(t.productId);
    if (!p) return;
    /* Nhập: xóa đơn phải trừ tồn lại; Bán: cộng tồn lại */
    if (t.type === 'NHAP') p.stock = dec(p.stock - num(t.qty));
    else p.stock = dec(p.stock + num(t.qty));
  });
  db.transactions = db.transactions.filter(function(x){ return x.oid !== oid; });
  commit('Đã xóa đơn');
}
function txEditKg(t, qRaw){
  if (!t || !t.rx) return dec(qRaw);
  var thang = num(t.thang) > 0 ? num(t.thang) : 1;
  return dec(qRaw / 1000 * thang);
}
function openTxEdit(id){
  var t = findTx(id);
  if (!t) return;
  txEditCur = t;
  var p = findProduct(t.productId);
  $('#txEditId').value = t.id;
  $('#txEditName').value = p ? p.name : 'Đã xóa';
  var isRx = !!t.rx;
  var lbl = $('#txEditQtyLbl');
  if (lbl) lbl.textContent = isRx ? 'Số gram (mỗi thang)' : 'Số lượng (kg)';
  $('#txEditQty').value = String(isRx ? num(t.g) : dec(t.qty));
  $('#txEditPrice').value = String(dec(t.price));
  var meta = $('#txEditMeta');
  if (meta) meta.textContent = (t.rx ? 'Đơn thuốc chén' : t.type === 'NHAP' ? 'Nhập hàng' : 'Bán hàng') + ' · ngày ' +
    dateVN(t.date) + (txHasTime(t) ? ' ' + timeVN(txStamp(t)) : '');
  calcTxEdit();
  var d = $('#txDlg');
  if (d && d.showModal) d.showModal(); else if (d) d.setAttribute('open', '');
}
function calcTxEdit(){
  var q = num(($('#txEditQty') || {}).value);
  var p = num(($('#txEditPrice') || {}).value);
  var out = $('#txEditTotal');
  if (out) out.textContent = fmtMoney(txEditKg(txEditCur, q) * p);
}
function closeTxEdit(){
  var d = $('#txDlg');
  if (d && d.close) d.close(); else if (d) d.removeAttribute('open');
  txEditCur = null;
}
function saveTxEdit(){
  var t = txEditCur;
  if (!t) return;
  var qRaw = num($('#txEditQty').value);
  var price = num($('#txEditPrice').value);
  if (qRaw <= 0) { toast('Số lượng phải lớn hơn 0', 'error'); return; }
  if (price < 0) { toast('Đơn giá không được âm', 'error'); var ep = $('#txEditPrice'); if (ep) { ep.focus(); ep.select(); } return; }
  var isRx = !!t.rx;
  var q = txEditKg(t, qRaw);

  var p = findProduct(t.productId);
  var oldQty = num(t.qty);
  var oldCost = num(t.cost);
  var delta = dec(q - oldQty);
  if (p) {
    if (t.type === 'NHAP') {
      if (num(p.stock) + delta < -1e-9) {
        toast('Tồn "' + p.name + '" không đủ để giảm (còn ' + fmtQty(p.stock) + ')', 'error');
        return;
      }
      p.stock = dec(num(p.stock) + delta);
      if (price > 0) p.costPrice = money(price);
    } else {
      if (num(p.stock) + 1e-9 < delta) {
        toast('Tồn "' + p.name + '" không đủ (còn ' + fmtQty(p.stock) + ')', 'error');
        return;
      }
      p.stock = dec(num(p.stock) - delta);
    }
  }
  /* Giữ giá vốn lịch sử: nhân theo đơn giá vốn cũ của chính giao dịch,
     chỉ fallback về giá hiện tại khi giao dịch cũ không có cost. */
  var oldUnitCost = oldQty > 0 && oldCost > 0 ? dec(oldCost / oldQty) : (p ? num(p.costPrice) : 0);
  t.qty = dec(q);
  t.price = money(price);
  t.total = money(q * price);
  if (isRx) t.g = dec(qRaw);
  if (t.type === 'BAN') t.cost = money(q * oldUnitCost);
  if (isRx) {
    var thang = num(t.thang) > 0 ? num(t.thang) : 1;
    if (t.oid) {
      /* Giá 1 thang là metadata cấp đơn: cập nhật lại toàn bộ dòng cùng đơn
         để hộp chi tiết luôn khớp Số thang × Giá 1 thang = Thành tiền. */
      var orderItems = db.transactions.filter(function(x){ return x.oid && String(x.oid) === String(t.oid) && x.rx; });
      var orderTotal = orderItems.reduce(function(a, x){ return a + num(x.total); }, 0);
      orderItems.forEach(function(x){ x.unitPrice = thang > 0 ? money(orderTotal / thang) : 0; });
    } else {
      t.unitPrice = thang > 0 ? money(t.total / thang) : 0;
    }
  }
  closeTxEdit();
  commit('Đã cập nhật giao dịch');
}
/* ==== Đồng bộ: bản local không có đăng nhập, gọi thẳng API ==== */
function apiFetch(url, opts){
  var o = {};
  var src = opts || {};
  for (var k in src) o[k] = src[k];
  var h = {};
  var sh = src.headers || {};
  for (var k2 in sh) h[k2] = sh[k2];
  o.headers = h;
  o.cache = 'no-store';
  return fetch(url, o);
}
/* ================= ĐỒNG BỘ D1 ================= */
function cloudConflict(){
  if (conflictOpen) return Promise.resolve(false);
  conflictOpen = true;
  var useLatest = confirm('Dữ liệu trên một thiết bị khác đã thay đổi sau lần bạn mở trang này.\n\nOK: tải bản mới nhất về (thay đổi chưa lưu của máy này sẽ mất).\nHủy: giữ bản trên máy này và ghi đè lên Cloud.');
  conflictOpen = false;
  if (useLatest) return pullState(true, true).then(function(){ return false; });
  return pushState(true, true);
}
function pushState(manual, force){
  touch();
  var sent = num(db.updatedAt);
  var headers = { 'Content-Type': 'application/json', 'X-Base-Updated': String(cloudBase) };
  if (force) headers['X-Force'] = '1';
  return apiFetch('/api/state', {
    method: 'PUT',
    headers: headers,
    body: JSON.stringify(db)
  }).then(function(r){
    return r ? r.json() : null;
  }).then(function(d){
    if (d && d.conflict) return cloudConflict();
    var ok = !!(d && d.success);
    if (ok) {
      cloudBase = num(d.updatedAt) || sent;
      if (num(db.updatedAt) === sent) {
        db.updatedAt = cloudBase;
        dirty = false;
      } else {
        /* Có thay đổi mới trong lúc đang gửi: giữ dirty và gửi tiếp. */
        dirty = true;
        setTimeout(function(){ pushState(false); }, 0);
      }
      saveLocal();
    }
    if (manual) {
      var err = d && (d.error || (d.details && d.details[0]));
      if (ok) syncErrorShown = false;
      toast(ok ? 'Đã lưu dữ liệu' : (err || 'Lưu dữ liệu thất bại'), ok ? 'ok' : 'error');
    } else if (ok) {
      syncErrorShown = false;
    } else if (!syncErrorShown) {
      syncErrorShown = true;
      var err2 = d && (d.error || (d.details && d.details[0]));
      toast((err2 || 'Chưa lưu được lên Cloud') + ' — dữ liệu vẫn giữ trên máy này', 'error');
    }
    return ok;
  }).catch(function(){
    if (manual) toast('Không kết nối được máy chủ', 'error');
    else if (!syncErrorShown) {
      syncErrorShown = true;
      toast('Mất kết nối — dữ liệu vẫn giữ trên máy này', 'error');
    }
    return false;
  });
}
function pullState(manual, forceLatest){
  return apiFetch('/api/state?t=' + Date.now())
    .then(function(r){
      return r ? r.json() : null;
    })
    .then(function(d){
      var server = d && d.success ? sanitize(d.data) : null;
      if (!server) {
        if (manual) toast('Không tải được dữ liệu', 'error');
        return false;
      }
      cloudBase = num(server.updatedAt);
      /* Chỉ ưu tiên server khi máy này không có thay đổi chưa gửi.
         Nếu đang dirty, đẩy bản local lên trước; server sẽ trả 409 nếu
         thiết bị khác đã sửa, và người dùng quyết định. */
      if (forceLatest || !dirty) {
        db = server;
        dirty = false;
        saveLocal();
        renderAll();
        if (manual) toast('Đã tải dữ liệu mới nhất');
        return true;
      }
      pushState(false);
      if (manual) toast('Dữ liệu trên máy chưa gửi — đang lưu lên máy chủ');
      return true;
    })
    .catch(function(){ if (manual) toast('Không tải được dữ liệu', 'error'); return false; });
}

/* ================= SAO LƯU / KHÔI PHỤC ================= */
var BAK_LAST = 'kho_backup_last_v1';
var BAK_AUTO = 'kho_backup_auto_v1';

function backupAutoOn(){
  try { return localStorage.getItem(BAK_AUTO) !== '0'; } catch (e) { return true; }
}
function backupLastDate(){
  try { return localStorage.getItem(BAK_LAST) || ''; } catch (e) { return ''; }
}
function bakDateText(iso){
  var p = String(iso || '').split('-');
  return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : String(iso || '');
}
function renderBackupInfo(){
  var last = backupLastDate();
  var n = $('#backupLast');
  if (n) n.textContent = last
    ? 'Bản sao lưu gần nhất: ' + bakDateText(last) + '.'
    : 'Chưa có bản sao lưu nào.';
  var h = $('#backupHint');
  if (h) h.textContent = !last
    ? 'Chưa sao lưu'
    : (last === todayISO() ? 'Đã sao lưu hôm nay' : 'Sao lưu ' + bakDateText(last));
}
function downloadBackup(manual, filename){
  var url = null;
  try {
    var payload = {
      app: 'quan-ly-kho',
      version: 1,
      savedAt: new Date().toISOString(),
      data: db
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    url = URL.createObjectURL(blob);
    var a = el('a');
    a.href = url;
    a.download = filename || ('kho-backup-' + todayISO() + '.json');
    a.rel = 'noopener';
    doc.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 5000);
  } catch (e) {
    if (manual) toast('Không tạo được bản sao lưu', 'error');
    return false;
  }
  try { localStorage.setItem(BAK_LAST, todayISO()); } catch (e) {}
  renderBackupInfo();
  if (manual) toast('Đã tải file sao lưu về máy');
  return true;
}
function backupStamp(){
  var d = new Date();
  return todayISO() + '-' + pad2(d.getHours()) + pad2(d.getMinutes());
}
/* Tải snapshot hiện tại trước khi restore. Trả false nếu trình duyệt chặn,
   để restoreFromFile dừng lại thay vì ghi đè mù. */
function backupBeforeRestore(){
  return downloadBackup(false, 'kho-backup-truoc-restore-' + backupStamp() + '.json');
}
function maybeAutoBackup(){
  if (!backupAutoOn()) return false;
  if (backupLastDate() === todayISO()) return false;
  if (!db.products.length && !db.transactions.length && !db.prescriptions.length) return false;
  if (!downloadBackup(false)) return false;
  toast('Đã tự sao lưu dữ liệu hôm nay');
  return true;
}
function parseBackup(text){
  var obj = JSON.parse(text);
  var d = obj && obj.data ? obj.data : obj;
  if (!d || typeof d !== 'object') return null;
  /* Bắt buộc đủ 3 bảng: thiếu một bảng sẽ khiến restore xóa mất dữ liệu. */
  if (!Array.isArray(d.products) || !Array.isArray(d.transactions) || !Array.isArray(d.prescriptions)) return null;
  if (obj.app && obj.app !== 'quan-ly-kho') return null;
  for (var i = 0; i < d.transactions.length; i++) {
    var t = d.transactions[i];
    if (!t || (t.type !== 'NHAP' && t.type !== 'BAN')) return null;
    if (num(t.qty) < 0 || num(t.price) < 0 || num(t.total) < 0) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(t.date || ''))) return null;
  }
  for (var j = 0; j < d.products.length; j++) {
    var p = d.products[j];
    if (!p || !p.name || num(p.stock) < 0 || num(p.costPrice) < 0) return null;
  }
  return sanitize(d);
}
function restoreFromFile(file){
  if (!file) return;
  if (file.size > 4 * 1024 * 1024) { toast('File sao lưu quá lớn', 'error'); return; }
  var fr = new FileReader();
  fr.onload = function(){
    var bak = null;
    try { bak = parseBackup(String(fr.result || '')); } catch (e) {}
    if (!bak) { toast('File sao lưu không hợp lệ hoặc thiếu bảng dữ liệu', 'error'); return; }
    var msg = 'Khôi phục ' + bak.products.length + ' vị thuốc, ' +
      bak.transactions.length + ' giao dịch, ' +
      bak.prescriptions.length + ' đơn thuốc?\n\n' +
      'Dữ liệu hiện tại (kể cả trên Cloud) sẽ bị thay thế hoàn toàn.';
    if (!confirm(msg)) return;
    /* Luôn lưu snapshot hiện tại trước khi ghi đè; nếu không tải được thì hủy. */
    if (!backupBeforeRestore()) {
      toast('Không tạo được bản sao lưu trước khi khôi phục — đã hủy thao tác', 'error');
      return;
    }
    db = bak;
    /* Restore là ghi đè chủ động: bỏ qua kiểm tra conflict và ép ghi lên Cloud. */
    commit('Đã khôi phục từ file sao lưu (đã lưu bản trước đó)', true);
  };
  fr.onerror = function(){ toast('Không đọc được file', 'error'); };
  fr.readAsText(file);
}

/* ================= RENDER TỔNG ================= */
function renderAll(){
  indexTx();
  db.products.forEach(function(p){ p.name = capWords(p.name); });
  renderPresetOptions();
  renderInventory();
  renderHistory('imp');
  renderHistory('exp');
  renderStats();
  var cb = $('#chartBox');
  if (cb && cb.open) renderChart();
}

/* ================= SỰ KIỆN ================= */
function handleAction(btn){
  var a = btn.getAttribute('data-action');
  var id = btn.getAttribute('data-id');
  switch (a) {
    case 'theme-menu': {
      var menu = $('#themeMenu');
      var open = menu.hidden;
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      break;
    }
    case 'save-retail': saveRetail(); break;
    case 'save-remedy': saveRemedy(); break;
    case 'save-preset': savePreset(); break;
    case 'del-preset': delPreset(); break;
    case 'copy-preset': copyPreset(); break;
    case 'del-row': {
      var tr = btn.closest('tr');
      if (tr) {
        var tb = tr.parentNode;
        tr.remove();
        renumber(tb);
        orderEmpty(tb, tb.id === 'retailBody' ? 5 : 4, 'Gõ tên vị thuốc ở trên để thêm dòng.');
        calcRetail();
        calcRemedy();
      }
      break;
    }
    case 'edit-prod': openEdit(id); break;
    case 'del-prod': delProduct(id); break;
    case 'del-nhap-item': {
      var ix = parseInt(btn.getAttribute('data-idx'), 10);
      if (ix >= 0 && ix < nhapList.length) { nhapList.splice(ix, 1); renderNhapList(); }
      break;
    }
    case 'del-tx': delTx(id); break;
    case 'del-order': delOrder(id); break;
    case 'order-view': openOrder(btn.getAttribute('data-oid')); break;
    case 'close-order': closeOrder(); break;
    case 'note-edit': {
      noteEditIdx = parseInt(btn.getAttribute('data-idx'), 10);
      renderNote();
      var eq = $('#noteEditQty');
      if (eq) { eq.focus(); eq.select(); }
      break;
    }
    case 'note-del': {
      var ni = parseInt(btn.getAttribute('data-idx'), 10);
      if (ni >= 0 && ni < retailItems.length) { retailItems.splice(ni, 1); noteEditIdx = -1; calcRetail(); }
      break;
    }
    case 'rnote-add': addRemedyToNote(); break;
    case 'rnote-edit': {
      remedyEditIdx = parseInt(btn.getAttribute('data-idx'), 10);
      renderRemedyNote();
      var req = $('#remedyNoteEditQty');
      if (req) { req.focus(); req.select(); }
      break;
    }
    case 'rnote-del': {
      var rni = parseInt(btn.getAttribute('data-idx'), 10);
      if (rni >= 0 && rni < remedyItems.length) { remedyItems.splice(rni, 1); remedyEditIdx = -1; calcRemedy(); }
      break;
    }
    case 'rnote-save': remedyNoteSave(); break;
    case 'rnote-cancel': remedyEditIdx = -1; renderRemedyNote(); break;
    case 'note-add': addRetailToNote(); break;
    case 'note-save': noteSave(); break;
    case 'note-cancel': noteEditIdx = -1; renderNote(); break;
    case 'tx-edit': openTxEdit(id); break;
    case 'close-tx': closeTxEdit(); break;
    case 'save-tx': saveTxEdit(); break;
    case 'save-edit': saveEdit(); break;
    case 'close-edit': closeEdit(); break;
    case 'clear-imp': setMonthInput('impMonth', ''); impAll = true; impPage = 1; renderHistory('imp'); break;
    case 'clear-exp': setMonthInput('expMonth', ''); expAll = true; expPage = 1; renderHistory('exp'); break;
    case 'latest-imp': setMonthInput('impMonth', ''); impAll = false; impPage = 1; renderHistory('imp'); break;
    case 'reconcile': openRec(); break;
    case 'merge-old': openMerge(); break;
    case 'close-merge': closeMerge(); break;
    case 'merge-do': mergeDo(); break;
    case 'close-rec': closeRec(); break;
    case 'rec-fix': recFix(id); break;
    case 'rec-fix-all': recFixAll(); break;
    case 'latest-exp': setMonthInput('expMonth', ''); expAll = false; expPage = 1; renderHistory('exp'); break;
    case 'mig-restore': restoreMigrate(); break;
    case 'backup-now': downloadBackup(true); break;
    case 'restore-file': {
      var ri = $('#restoreInput');
      if (ri) ri.click();
      break;
    }
    case 'page': {
      var kind = btn.getAttribute('data-kind');
      var page = parseInt(btn.getAttribute('data-page'), 10) || 1;
      if (kind === 'inv') { invPage = page; renderInventory(); }
      else if (kind === 'imp') { impPage = page; renderHistory('imp'); }
      else if (kind === 'exp') { expPage = page; renderHistory('exp'); }
      else if (kind === 'rnote') { remedyNotePage = page; renderRemedyNote(); }
      else if (kind === 'note') { notePage = page; renderNote(); }
      else if (kind === 'order') { orderPage = page; renderOrder(); }
      break;
    }
  }
}

function bindEvents(){
  doc.addEventListener('click', function(e){
    var t = e.target.closest ? e.target.closest('[data-action]') : null;
    if (t) handleAction(t);
    if (!e.target.closest || !e.target.closest('.menu')) closeThemeMenu();
  });

  $$('#themeMenu [data-theme-set]').forEach(function(b){
    b.addEventListener('click', function(){
      applyTheme(b.getAttribute('data-theme-set'));
      closeThemeMenu();
    });
  });

  var nf = $('#nhapForm');
  if (nf) nf.addEventListener('submit', saveNhap);
  if (nf) nf.addEventListener('keydown', function(e){
    if (e.key !== 'Enter' || e.defaultPrevented) return;
    if (!e.target || e.target.tagName !== 'INPUT') return;
    e.preventDefault();
    var id = e.target.id;
    if (id === 'nhapQty' && !num(($('#nhapPrice') || {}).value)) { goSearch('#nhapPrice'); return; }
    if (id === 'nhapQty' || id === 'nhapPrice') { addNhapItem(); return; }
    goSearch('#nhapSearch');
  });
  ['nhapQty', 'nhapPrice'].forEach(function(id){
    var n = $('#' + id);
    if (n) n.addEventListener('input', calcNhap);
  });
  var ns = $('#nhapSearch');
  if (ns) ns.addEventListener('input', function(){
    if (nhapPid) {
      var p = findProduct(nhapPid);
      if (!p || capWords(ns.value) !== p.name) nhapPid = null;
    }
  });

  var body = $('#retailBody');
  if (body) body.addEventListener('input', function(e){
    if (e.target.classList.contains('retail-money') || e.target.classList.contains('retail-qty')) calcRetail();
  });
  var nbody = $('#retailNoteBody');
  if (nbody) nbody.addEventListener('keydown', function(e){
    if (e.key === 'Enter' && e.target && e.target.tagName === 'INPUT') { e.preventDefault(); noteSave(); }
    else if (e.key === 'Escape' && noteEditIdx >= 0) { noteEditIdx = -1; renderNote(); }
  });
  var rnbody = $('#remedyNoteBody');
  if (rnbody) rnbody.addEventListener('keydown', function(e){
    if (e.key === 'Enter' && e.target && e.target.tagName === 'INPUT') { e.preventDefault(); remedyNoteSave(); }
    else if (e.key === 'Escape' && remedyEditIdx >= 0) { remedyEditIdx = -1; renderRemedyNote(); }
  });
  var rbody = $('#remedyBody');
  if (rbody) rbody.addEventListener('input', function(e){
    if (e.target.classList.contains('remedy-qty')) calcRemedy();
  });
  function goSearch(sel){
    var s = $(sel);
    if (!s) return;
    s.focus();
    if (typeof s.select === 'function') s.select();
  }
  function rowEnter(host, add){
    if (!host) return;
    host.addEventListener('keydown', function(e){
      if (e.key !== 'Enter' || e.defaultPrevented) return;
      if (!e.target || e.target.tagName !== 'INPUT') return;
      e.preventDefault();
      /* Enter khi đang nhập dòng: đưa thẳng vào tờ ghi (giống nhập hàng) */
      add();
    });
  }
  rowEnter(body, addRetailToNote);
  rowEnter(rbody, addRemedyToNote);
  var rup = $('#remedyUnitPrice');
  if (rup) {
    rup.addEventListener('input', calcRemedy);
    rup.addEventListener('keydown', function(e){
      if (e.key === 'Enter') { e.preventDefault(); goSearch('#remedySearch'); }
    });
  }
  var rth = $('#remedyThang');
  if (rth) {
    rth.addEventListener('input', calcRemedy);
    rth.addEventListener('change', function(){ rth.value = String(remedyThang()); calcRemedy(); });
    rth.addEventListener('keydown', function(e){
      if (e.key === 'Enter') { e.preventDefault(); goSearch('#remedySearch'); }
    });
  }
  var rsel = $('#remedyPreset');
  if (rsel) rsel.addEventListener('change', onPresetChange);
  var rname = $('#remedyName');
  if (rname) {
    rname.addEventListener('input', updatePresetUI);
    rname.addEventListener('blur', function(){ rname.value = capWords(rname.value); updatePresetUI(); });
  }

  var sort = $('#invSort');
  if (sort) sort.addEventListener('change', function(){ invPage = 1; renderInventory(); });
  var is = $('#invSearch');
  if (is) is.addEventListener('input', function(){ invPage = 1; renderInventory(); });

  bindDateInput('retailDate');
  bindDateInput('remedyDate');
  bindMonthInput('impMonth', function(){ impAll = false; impPage = 1; renderHistory('imp'); });
  bindMonthInput('expMonth', function(){ expAll = false; expPage = 1; renderHistory('exp'); });

  var cy = $('#chartYear');
  if (cy) cy.addEventListener('change', function(){ chartSel = -1; renderChart(); });
  var ch = $('#statsChart');
  if (ch) ch.addEventListener('click', onChartClick);

  var cb = $('#chartBox');
  if (cb) cb.addEventListener('toggle', function(){
    if (cb.open) requestAnimationFrame(renderChart);
  });

  var rt = null;
  window.addEventListener('resize', function(){
    clearTimeout(rt);
    rt = setTimeout(function(){ if (cb && cb.open) renderChart(); }, 160);
  });

  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  var onMq = function(){
    var m = window.__THEME__ || 'system';
    if (m === 'system') applyTheme('system');
  };
  if (mq.addEventListener) mq.addEventListener('change', onMq);

  var dlg = $('#editDlg');
  if (dlg) dlg.addEventListener('click', function(e){ if (e.target === dlg) closeEdit(); });
  var txd = $('#txDlg');
  if (txd) txd.addEventListener('click', function(e){ if (e.target === txd) closeTxEdit(); });
  var od = $('#orderDlg');
  if (od) od.addEventListener('click', function(e){ if (e.target === od) closeOrder(); });
  ['txEditQty', 'txEditPrice'].forEach(function(id){
    var n = $('#' + id);
    if (n) n.addEventListener('input', calcTxEdit);
  });

  var ri = $('#restoreInput');
  if (ri) ri.addEventListener('change', function(){
    var f = ri.files && ri.files[0];
    restoreFromFile(f);
    ri.value = '';
  });

  var ab = $('#autoBackup');
  if (ab) {
    ab.checked = backupAutoOn();
    ab.addEventListener('change', function(){
      try { localStorage.setItem(BAK_AUTO, ab.checked ? '1' : '0'); } catch (e) {}
      toast(ab.checked ? 'Đã bật tự sao lưu hằng ngày' : 'Đã tắt tự sao lưu hằng ngày');
      if (ab.checked) maybeAutoBackup();
    });
  }
}

/* ================= KHỞI ĐỘNG ================= */
function init(){
  var remote = window.__DB__ ? sanitize(window.__DB__) : null;
  var local = readLocal();
  var wasDirty = readDirty();
  var savedBase = readBase();

  if (local && wasDirty) {
    /* Có thay đổi chưa gửi: giữ bản local và đẩy lên Cloud. */
    db = local;
    cloudBase = savedBase;
    dirty = true;
  } else if (remote) {
    db = remote;
    cloudBase = num(remote.updatedAt) || savedBase;
    dirty = false;
    saveLocal();
  } else if (local) {
    db = local;
    cloudBase = savedBase || num(local.updatedAt);
    dirty = false;
  } else {
    db = { products: [], transactions: [], prescriptions: [], updatedAt: 0 };
    cloudBase = 0;
    dirty = false;
  }

  var m = window.__THEME__ || 'system';
  applyTheme(m);

  var t = todayISO();
  setDateInput('retailDate', t);
  setDateInput('remedyDate', t);
  var cy = $('#chartYear');
  if (cy) cy.value = thisYear();

  var undo = $('#migUndo');
  if (undo) {
    var hasBak = false;
    try { hasBak = !!localStorage.getItem(MIG_BAK); } catch (e) {}
    undo.hidden = !hasBak;
  }

  bindEvents();
  initSuggest();
  resetRetail();
  resetRemedy();
  renderAll();
  renderBackupInfo();

  if (dirty) {
    /* Đẩy bản local chưa gửi lên trước; server trả 409 nếu máy khác đã sửa. */
    pushState(false);
  } else if (window.__NEED_FETCH__ || !remote) {
    pullState(false, true);
  }

  var firstUse = function(){
    doc.removeEventListener('pointerdown', firstUse);
    doc.removeEventListener('keydown', firstUse);
    setTimeout(maybeAutoBackup, 400);
  };
  doc.addEventListener('pointerdown', firstUse);
  doc.addEventListener('keydown', firstUse);
}

if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
else init();

})();
</script>
</body>
</html>`;
