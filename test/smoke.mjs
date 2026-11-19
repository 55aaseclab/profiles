import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const files = new Map([
  ['/viewer/', ['index.html', 'text/html']],
  ['/viewer/app.js', ['app.js', 'text/javascript']],
  ['/viewer/app.css', ['app.css', 'text/css']],
]);
const source = { id: 'a'.repeat(64), name: 'Example research note.md', group: 'Sample folder', type: 'md' };
const pdf = { id: 'b'.repeat(64), name: 'Example.pdf', group: 'Sample folder', type: 'pdf' };
const fixture = 'Synthetic content <img src=x onerror="document.body.remove()">.';
let items = [source, pdf], status = 200;
const server = createServer(async (req, res) => {
  const asset = files.get(req.url);
  if (asset) {
    res.writeHead(200, { 'Content-Type': asset[1] + '; charset=utf-8' });
    res.end(await readFile(new URL('../public/' + asset[0], import.meta.url)));
    return;
  }
  if (req.url === '/viewer/api/documents') {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(status === 200 ? { items } : {}));
    return;
  }
  if (req.url === '/viewer/api/documents/' + source.id) {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(fixture);
    return;
  }
  res.writeHead(404).end();
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const url = 'http://127.0.0.1:' + server.address().port + '/viewer/';
  await page.goto(url);
  await page.getByRole('link', { name: /Example research note/ }).waitFor();
  await page.getByLabel('Find documents').fill('research');
  assert.equal(await page.getByRole('link', { name: /Example.pdf/ }).count(), 0);
  await page.getByRole('link', { name: /Example research note/ }).click();
  await page.locator('#text').waitFor();
  assert.equal(await page.locator('#text').textContent(), fixture);
  assert.equal(await page.locator('#text img').count(), 0);
  assert.equal(await page.locator('#actions a').getAttribute('download'), source.name);
  await page.getByRole('button', { name: '简体中文' }).click();
  assert.equal(await page.locator('html').getAttribute('lang'), 'zh-CN');
  await page.getByRole('button', { name: '返回列表' }).click();
  await page.getByLabel('查找文档').waitFor();
  assert.equal(await page.locator('#query').inputValue(), 'research');
  await page.locator('#query').fill('');
  await page.getByRole('link', { name: /Example.pdf/ }).click();
  assert.equal(await page.getByRole('link', { name: '打开 PDF' }).getAttribute('href'), url + 'api/documents/' + pdf.id);
  status = 403;
  await page.getByRole('button', { name: '刷新' }).click();
  await page.getByText('当前访问权限已失效，请重新登录或联系资料所有者。').waitFor();
  assert.equal(await page.getByRole('link', { name: '打开 PDF' }).count(), 0);
  assert.ok(!(await page.locator('body').textContent()).includes(source.name));
  status = 200; items = [];
  await page.goto(url);
  await page.getByText('此资料库暂无文档。').waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(errors, []);
  console.log('Passed bilingual document browsing, safe rendering, private original link, revocation and empty state at 390px.');
} finally {
  await browser?.close();
  server.closeAllConnections();
  server.close();
}
