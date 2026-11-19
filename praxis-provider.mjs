// Browser-safe, read-only app provider. The native private API owns authorization.
const metadata = { version: 1, appId: 'profiles', name: 'Profiles', cards: { supported: true, execution: 'browser' }, inventory: { execution: 'server' }, nativeReads: ['/api/documents'], dataSources: [{ id: 'originals', label: 'Private dossier originals', labels: { zh: '私人材料原件' }, kind: 'directory', location: { env: 'PRAXIS_PROFILES_DIR' } }] };
const formats = new Set(['md', 'txt', 'tex', 'bib', 'pdf', 'docx']);
const identity = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const text = (value, limit) => typeof value === 'string' && value.length > 0 && value.length <= limit && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value);
export function describe() { return structuredClone(metadata); }
export async function getCards(context = {}) {
  if (typeof context.read !== 'function' || !text(context.identity?.userId || context.identity?.username, 200)) return { status: 'unavailable', items: [], errors: [{ code: 'AUTHORIZED_READ_CONTEXT_REQUIRED' }] };
  let catalog;
  try { catalog = await context.read('api/documents'); } catch { return { status: 'unavailable', items: [], errors: [{ code: 'DOCUMENT_CATALOG_UNAVAILABLE' }] }; }
  if (!catalog || !Array.isArray(catalog.items)) return { status: 'unavailable', items: [], errors: [{ code: 'INVALID_DOCUMENT_CATALOG' }] };
  const items = [], seen = new Set(); let invalid = false;
  for (const doc of catalog.items.slice(0, 1000)) {
    if (!doc || !identity(doc.id) || seen.has(doc.id) || !identity(doc.revision) || !text(doc.name, 1000) || typeof doc.group !== 'string' || !formats.has(doc.type) || !text(doc.updatedAt, 80) || !Number.isFinite(Date.parse(doc.updatedAt)) || doc.preview !== undefined && !text(doc.preview, 2000)) { invalid = true; continue; }
    seen.add(doc.id);
    const href = '/apps/profiles/#document=' + doc.id;
    const preview = ['md', 'txt', 'tex', 'bib'].includes(doc.type) && doc.preview ? doc.preview : undefined;
    items.push({ id: 'profiles:' + doc.id, appId: 'profiles', resourceId: doc.id, revision: doc.revision, kind: 'result', title: doc.name, updatedAt: doc.updatedAt,
      reason: { en: 'In your personal document collection', zh: '你配置的个人材料' }, ...(preview && { preview }),
      source: { name: 'Profiles', appId: 'profiles', resourceId: doc.id, revision: doc.revision, href },
      primaryAction: { label: { en: 'Open in Profiles', zh: '在 Profiles 中打开' }, href },
      evidence: [{ label: { en: 'Original document', zh: '原始文档' }, href, revision: doc.revision, ...(preview && { excerpt: preview }) }],
    });
  }
  const incomplete = catalog.partial === true || catalog.items.length > 1000;
  return { status: incomplete ? 'partial' : invalid ? items.length ? 'partial' : 'unavailable' : items.length ? 'ready' : 'empty', items, ...(invalid && { errors: [{ code: 'INVALID_DOCUMENT_METADATA' }] }) };
}
export async function getDataInventory(context = {}) {
  const source = structuredClone(metadata.dataSources[0]);
  if (typeof context.resolveDataSource !== 'function') return { status: 'ready', items: [{ id: source.id, appId: metadata.appId, label: source.label, labels: source.labels, kind: source.kind, status: 'server-managed', description: { en: 'The private originals directory is resolved by the server. This browser metadata includes no filesystem path.', zh: '私有原件目录由服务端解析，此浏览器元数据不包含文件系统路径。' } }] };
  try {
    const resolved = await context.resolveDataSource(source);
    if (!resolved) throw new Error('UNRESOLVED_SOURCE');
    const values = Array.isArray(resolved) ? resolved : [resolved];
    const items = values.map((value, index) => {
      if (!value || typeof value !== 'object') throw new Error('INVALID_SOURCE_METADATA');
      const output = { id: values.length > 1 ? source.id + ':' + index : source.id, appId: metadata.appId, label: source.label, labels: source.labels, kind: source.kind, status: value.status || 'ready' };
      for (const field of ['applicationPath', 'hostPath', 'containerPath', 'volumeName', 'storageKey', 'description']) if (typeof value[field] === 'string' && value[field]) output[field] = value[field];
      return output;
    });
    return { status: items.length ? items.every(item => item.status === 'unavailable') ? 'unavailable' : items.some(item => item.status === 'unavailable') ? 'partial' : 'ready' : 'empty', items };
  } catch { return { status: 'unavailable', items: [{ id: source.id, appId: metadata.appId, label: source.label, labels: source.labels, kind: source.kind, status: 'unavailable' }], errors: [{ code: 'DATA_SOURCE_UNAVAILABLE' }] }; }
}
