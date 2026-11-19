const $ = (id) => document.getElementById(id);
const idPattern = /^[a-f0-9]{64}$/;
const textFormats = new Set(['txt', 'md', 'tex', 'bib']);
const allowedFormats = new Set([...textFormats, 'docx', 'pdf']);
const previewLimit = 512 * 1024;
const rootUrl = new URL('./api/documents', document.baseURI);
const fileUrl = (doc) => rootUrl.href + '/' + doc.id;

let language = 'en';
try { if (localStorage.getItem('praxis.locale') === 'zh') language = 'zh'; } catch { /* Storage may be unavailable. */ }
const t = (english, chinese) => language === 'en' ? english : chinese;
let items = [], selectedGroup = '', indexStatus = 'loading', previewStatus = '';
let listRequest, fileRequest, activeId = '', returnId = '';
const headings = { all: ['All documents', '全部文档'] };

const dossierSections = [
  [/\b(cv|resume|curriculum vitae)\b|简历/i, 'cv', 'Curriculum vitae', '简历'],
  [/\bresearch\b|研究/i, 'research', 'Research', '研究'],
  [/\bteaching\b|教学/i, 'teaching', 'Teaching', '教学'],
  [/\bcover\b|求职信/i, 'cover', 'Cover letters', '求职信'],
  [/\bpublications?\b|发表/i, 'publications', 'Publications', '发表成果'],
  [/\breferences?\b|推荐/i, 'references', 'References', '推荐材料'],
];
function documentGroup(doc) {
  const words = doc.name.replace(/[_./-]+/g, ' ');
  const match = dossierSections.find(([pattern]) => pattern.test(words));
  if (match) return ['section:' + match[1], t(match[2], match[3])];
  return doc.group ? ['folder:' + doc.group, doc.group] : ['root', t('Other materials', '其他材料')];
}

function node(tag, value) {
  const el = document.createElement(tag);
  el.textContent = value;
  return el;
}

function applyLanguage() {
  document.documentElement.lang = t('en', 'zh-CN');
  $('language').textContent = t('简体中文', 'English');
  for (const el of document.querySelectorAll('[data-zh]')) {
    el.dataset.en ??= el.textContent;
    el.textContent = t(el.dataset.en, el.dataset.zh);
  }
  for (const el of document.querySelectorAll('[data-zh-aria]')) {
    el.dataset.enAria ??= el.getAttribute('aria-label');
    el.setAttribute('aria-label', t(el.dataset.enAria, el.dataset.zhAria));
  }
}

function requestOptions(controller) {
  return { credentials: 'same-origin', mode: 'same-origin', redirect: 'error', cache: 'no-store',
    referrerPolicy: 'no-referrer', signal: controller.signal };
}

function statusFor(response) {
  if ([401, 403].includes(response.status)) return 'denied';
  return response.status === 404 ? 'missing' : 'error';
}

function validateCatalog(value) {
  if (!Array.isArray(value?.items)) throw new Error('Invalid catalog');
  const seen = new Set();
  for (const doc of value.items) {
    if (!doc || typeof doc.id !== 'string' || !idPattern.test(doc.id) || seen.has(doc.id) ||
        typeof doc.name !== 'string' || !doc.name || typeof doc.group !== 'string' || !allowedFormats.has(doc.type)) {
      throw new Error('Invalid document metadata');
    }
    seen.add(doc.id);
  }
  return value.items;
}

function showStatus() {
  let message = '';
  if (indexStatus === 'loading') message = t('Loading documents…', '正在读取文档…');
  else if (indexStatus === 'denied') message = t('Access has ended. Sign in again or ask the owner for access.', '当前访问权限已失效，请重新登录或联系资料所有者。');
  else if (indexStatus === 'error') message = t('Could not load the document collection. Refresh to retry.', '暂时无法读取文档目录，请刷新重试。');
  else if (!items.length) message = t('No documents in this collection yet.', '此资料库暂无文档。');
  else if (previewStatus === 'missing') message = t('This document is no longer available.', '此文档已不可用。');
  else if (previewStatus === 'error') message = t('Could not read this document. Refresh to retry.', '暂时无法读取这份文档，请刷新重试。');
  else if (previewStatus === 'loading') message = t('Reading document…', '正在读取原文…');
  else if (previewStatus === 'partial') message = t('Showing an excerpt. Download the original for the full document.', '当前为节选，可下载原件查看全文。');
  else if (previewStatus === 'empty') message = t('This document is empty.', '这份文档为空。');
  else if (!$('directory').hidden && !$('list').children.length) message = t('No matching documents.', '没有匹配的文档。');
  $('status').textContent = message;
  $('status').hidden = !message;
}

function drawGroups() {
  const groups = new Map();
  for (const doc of items) {
    const [key, label] = documentGroup(doc);
    const group = groups.get(key) ?? { label, count: 0 };
    group.count += 1;
    groups.set(key, group);
  }
  if (selectedGroup && !groups.has(selectedGroup)) selectedGroup = '';
  const options = [['', { label: t(...headings.all), count: items.length }], ...groups.entries()];
  const oldFocus = $('groups').contains(document.activeElement) ? document.activeElement?.dataset.group : undefined;
  $('groups').replaceChildren();
  for (const [key, group] of options) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.group = key;
    button.append(node('span', group.label), node('small', String(group.count)));
    button.title = group.label;
    if (selectedGroup === key) button.setAttribute('aria-current', 'true');
    button.onclick = () => {
      selectedGroup = key;
      if (location.hash) history.replaceState(null, '', location.pathname + location.search);
      render();
      [...$('groups').children].find(el => el.dataset.group === key)?.focus();
    };
    $('groups').append(button);
  }
  if (oldFocus !== undefined) [...$('groups').children].find(el => el.dataset.group === oldFocus)?.focus();
}

function drawList() {
  const query = $('query').value.trim().toLocaleLowerCase();
  const visible = items.filter(doc => {
    const [key, label] = documentGroup(doc);
    return (!selectedGroup || selectedGroup === key) &&
      (!query || [doc.name, doc.group, label, doc.type].some(value => value.toLocaleLowerCase().includes(query)));
  });
  const oldFocus = $('list').contains(document.activeElement) ? document.activeElement?.dataset.doc : undefined;
  $('list').replaceChildren();
  for (const doc of visible) {
    const link = document.createElement('a');
    link.className = 'file';
    link.href = '#document=' + doc.id;
    link.dataset.doc = doc.id;
    link.append(node('span', doc.name), node('small', doc.type.toUpperCase()));
    link.lastChild.className = 'kind';
    link.onclick = event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      returnId = doc.id;
      history.pushState({ fromDirectory: true }, '', link.hash);
      render();
      $('title').focus();
    };
    const li = document.createElement('li');
    li.append(link);
    $('list').append(li);
  }
  if (oldFocus) $('list').querySelector('[data-doc="' + oldFocus + '"]')?.focus();
}

function clearPreview() {
  fileRequest?.abort();
  fileRequest = undefined;
  activeId = '';
  previewStatus = '';
  $('meta').textContent = '';
  $('actions').replaceChildren();
  $('text').hidden = true;
  $('text').textContent = '';
}

async function fetchPreview(doc) {
  const controller = new AbortController();
  fileRequest = controller;
  const timeout = setTimeout(() => controller.abort(), 20_000);
  previewStatus = 'loading';
  showStatus();
  try {
    const response = await fetch(fileUrl(doc), requestOptions(controller));
    if (fileRequest !== controller) return;
    if (!response.ok) {
      const status = statusFor(response);
      if (status === 'denied') { forgetCatalog(status); render(); return; }
      previewStatus = status;
      if (status === 'missing') $('actions').replaceChildren();
      return;
    }
    if (!/^text\/plain(?:;|$)/i.test(response.headers.get('content-type') ?? '')) throw new Error('Expected plain text');
    const stream = response.body.getReader();
    const decoder = new TextDecoder();
    let text = '', used = 0, partial = false;
    while (true) {
      const { done, value } = await stream.read();
      if (done) break;
      const take = Math.min(value.length, previewLimit - used);
      text += decoder.decode(value.subarray(0, take), { stream: true });
      used += take;
      if (take < value.length) { partial = true; await stream.cancel(); break; }
    }
    if (fileRequest !== controller) return;
    text += decoder.decode();
    $('text').textContent = text;
    $('text').hidden = !text;
    previewStatus = partial ? 'partial' : text ? '' : 'empty';
  } catch {
    if (fileRequest === controller) previewStatus = 'error';
  } finally {
    clearTimeout(timeout);
    if (fileRequest === controller) { fileRequest = undefined; showStatus(); }
  }
}

function drawDocument(doc, force) {
  $('title').textContent = doc.name;
  $('meta').textContent = [doc.group, doc.type.toUpperCase()].filter(Boolean).join(' · ');
  const link = document.createElement('a');
  link.className = 'action';
  link.href = fileUrl(doc);
  link.rel = 'noopener noreferrer';
  if (doc.type === 'pdf') {
    link.target = '_blank';
    link.textContent = t('Open PDF', '打开 PDF');
  } else {
    link.download = doc.name;
    link.textContent = t('Download original', '下载原件');
  }
  $('actions').replaceChildren(link);
  if (activeId === doc.id && !force) return;
  fileRequest?.abort(); fileRequest = undefined;
  $('text').hidden = true;
  $('text').textContent = '';
  activeId = doc.id;
  previewStatus = '';
  if (textFormats.has(doc.type)) void fetchPreview(doc);
}

function forgetCatalog(status) {
  listRequest?.abort();
  listRequest = undefined;
  clearPreview();
  items = [];
  indexStatus = status;
  selectedGroup = '';
  $('query').value = '';
  $('groups').replaceChildren();
  $('list').replaceChildren();
}

function render(force = false) {
  const params = new URLSearchParams(location.hash.slice(1));
  const id = params.get('document');
  const ready = indexStatus === 'ready';
  $('directory').hidden = !ready || id !== null || items.length === 0;
  $('reader').hidden = !ready || id === null;
  $('groups').hidden = !ready || items.length === 0;
  $('reload').disabled = indexStatus === 'loading';
  if (ready && items.length) drawGroups();
  if (ready && id !== null) {
    const doc = items.find(doc => doc.id === id);
    if (doc) drawDocument(doc, force);
    else {
      clearPreview(); previewStatus = 'missing'; $('title').textContent = t('Document unavailable', '文档不可用');
    }
  } else {
    clearPreview();
    const group = items.find(doc => documentGroup(doc)[0] === selectedGroup);
    $('title').textContent = group ? documentGroup(group)[1] : t(...headings.all);
    if (ready) drawList();
  }
  showStatus();
}

async function loadCatalog(force = false) {
  listRequest?.abort();
  const controller = new AbortController();
  listRequest = controller;
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(rootUrl, requestOptions(controller));
    if (listRequest !== controller) return;
    if (!response.ok) {
      forgetCatalog(statusFor(response) === 'denied' ? 'denied' : 'error');
      render();
      return;
    }
    const next = validateCatalog(await response.json());
    if (listRequest !== controller) return;
    const changed = indexStatus !== 'ready' || JSON.stringify(items) !== JSON.stringify(next);
    items = next;
    indexStatus = 'ready';
    if (changed || force) render(force);
  } catch {
    if (listRequest === controller) { forgetCatalog('error'); render(); }
  } finally {
    clearTimeout(timeout);
    if (listRequest === controller) listRequest = undefined;
  }
}

$('query').addEventListener('input', () => { drawList(); showStatus(); });
$('reload').onclick = () => void loadCatalog(true);
$('back').onclick = () => {
  if (history.state?.fromDirectory) history.back();
  else {
    history.replaceState(null, '', location.pathname + location.search);
    render();
    $('title').focus();
  }
};
addEventListener('popstate', () => {
  render();
  if (!location.hash && returnId) $('list').querySelector('[data-doc="' + returnId + '"]')?.focus();
});
addEventListener('hashchange', () => render());
$('language').onclick = () => {
  language = language === 'en' ? 'zh' : 'en';
  try { localStorage.setItem('praxis.locale', language); } catch { /* Current tab still changes. */ }
  document.cookie = 'praxis_locale=' + language + '; Path=/; SameSite=Lax; Max-Age=31536000' + (location.protocol === 'https:' ? '; Secure' : '');
  document.dispatchEvent(new CustomEvent('praxis-locale-change', { detail: language, bubbles: true }));
  applyLanguage(); render();
};
addEventListener('storage', event => {
  if (event.key !== 'praxis.locale') return;
  language = event.newValue === 'zh' ? 'zh' : 'en';
  applyLanguage(); render();
});
addEventListener('pagehide', () => { forgetCatalog('loading'); render(); });
addEventListener('pageshow', event => { if (event.persisted) void loadCatalog(true); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) void loadCatalog(); });
setInterval(() => { if (!document.hidden) void loadCatalog(); }, 30_000);
applyLanguage(); render(); void loadCatalog();
