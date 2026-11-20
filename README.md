# Profiles / 个人材料

Academic dossier. Serve `public/` as a static directory alongside your private, same-origin document API. Use HTTPS or a loopback origin. The client starts in English and supports Simplified Chinese. It retains only the language preference. The platform supplies Home on managed pages.

| Route | Response |
| --- | --- |
| `GET ./api/documents` | `{"items":[{"id":"…","name":"…","group":"","type":"pdf"}]}`. IDs and metadata-derived revisions are 64 lowercase hexadecimal characters; `updatedAt` is an ISO modification timestamp. Names and groups are display text; type is a lowercase file extension. Optional `preview` is a bounded plain-text excerpt for md/txt/tex/bib; PDF/docx omit it. |
| `GET ./api/documents/<id>` | The authorized original. Text/Markdown/TeX/BibTeX are served as UTF-8 plain text, PDFs as PDF, and other permitted binary formats as downloads. |

The server authenticates both endpoints, checks access on every request and sets private responses to `Cache-Control: no-store`. Keep private data, generated originals, manifests, backups and credentials outside this repository and the static web root. Store only the allowlisted public files in Git. Test using `node test/smoke.mjs` with Playwright installed (or set `PLAYWRIGHT_MODULE` to its module path and `CHROMIUM_PATH` to your browser executable). The test creates synthetic responses in memory.

## Praxis provider

`praxis-provider.mjs` exposes version-1 browser card projections and server-owned data-inventory metadata. `getCards({read, identity})` performs one authorized `read('api/documents')`; it never fetches every original or writes records. Cards preserve original filenames/content language and link to the same native document in their evidence. The private endpoint and the gateway enforce the configured owner boundary. Metadata revisions identify a filesystem version, not a full-content digest.

`describe().dataSources` declares the original directory through `location.env`; the server's `resolveDataSource` supplies actual location metadata. Browser inventory metadata contains no paths. Run dependency-free checks with `node --test test/provider.test.mjs`.

## 简体中文

学术申请材料。将 `public/` 与私有、同源的文档 API 一起提供服务，使用 HTTPS 或本机回环地址。默认英语，支持简体中文；本地只保存语言偏好。受管页面由工作台统一提供返回按钮。

列表接口返回获准文档的名称、分组、格式和不透明编号。原件接口使用该编号逐次鉴权。文本、Markdown、TeX 和 BibTeX 显示为纯文本，PDF 可打开查看，其他允许的二进制文件可下载。服务端对私有响应设置 `Cache-Control: no-store`。私人资料、生成件、清单、备份及凭据应存放在本源码仓库和静态目录以外。浏览器测试只使用内存合成数据。

### Praxis provider

`praxis-provider.mjs` 提供版本 1 的浏览器卡片投影和服务端数据位置声明。卡片只通过一次已授权的 `read('api/documents')` 读取目录，不逐份下载原件，不写业务记录，保留原文件名及内容语言，并将入口和证据都指向同一份原生文档。网关与私有接口共同执行配置的所有者边界。元数据版本标识文件系统版本，不冒充全文内容摘要。

原件目录通过 `describe().dataSources` 的 `location.env` 声明，由服务端 `resolveDataSource` 提供实际位置；浏览器元数据不包含路径。无依赖测试：`node --test test/provider.test.mjs`。

## Praxis registration

App release: `0.1.1`. The app owns [`praxis-app.json`](praxis-app.json), its English and Simplified Chinese presentation, the icon at `public/praxis-icon.svg`, the declared PRD locations and any legacy icon aliases. `schemaVersion: 1` identifies the registration format; it is separate from this app release and from data, protocol and document revisions. Package and lockfile release metadata, where present, agree with the declaration.

[`apps.example.json`](apps.example.json) registers a local alias by referencing `./praxis-app.json` and `http://127.0.0.1:8082/`. Start the standalone service described above before using the example; registration does not start a backend or grant account, administrator or business-data access. Installation origins, data locations and access policy remain separately configured.

For a static preview, run `python3 -m http.server 8082 --bind 127.0.0.1 --directory public`. Private document reads still require the authenticated same-origin API described above.

## Praxis 登记

应用发行版本：`0.1.1`。本应用维护 [`praxis-app.json`](praxis-app.json)、英中展示文案、`public/praxis-icon.svg` 图标、PRD 路径及需要保留的旧图标别名。`schemaVersion: 1` 表示登记格式，与应用发行版本、数据、协议和文档修订分别管理；已有 package 和 lockfile 的发行版本须与声明一致。

[`apps.example.json`](apps.example.json) 引用 `./praxis-app.json`，使用 `http://127.0.0.1:8082/` 登记本地别名。先按上文启动独立服务；登记不启动后端，也不授予账号、管理员或业务数据权限。安装地址、数据位置与授权策略仍独立配置。

静态预览可执行 `python3 -m http.server 8082 --bind 127.0.0.1 --directory public`；读取私人文档仍需上文规定的同源鉴权接口。
