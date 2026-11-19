# Profiles requirements

Version: v0.1.1 · [简体中文](#简体中文)

Browse an academic application dossier by document type, including CVs and research, teaching and cover statements. The authorized user can search the collection, read plain text, and open PDFs or download other originals. An empty collection, unavailable connection and expired permission have different visible states. Changing the language preserves the current search and document.

The public release contains the client and its data contract. A private service authorizes the collection and each document request and supplies the current files. Keep document bytes, names, directory listings, drafts, generated documents and credentials off the public source tree. Temporary test fixtures use invented text.

## Source-backed workbench cards and data inventory

Publish an app-owned browser provider for authorized document cards. Read only the existing same-origin `api/documents` catalog through the host-supplied read callback. Each real document yields a result card with a stable app/document ID, nonempty source revision, the original filename and a native `#document=<opaque-id>` entry and evidence link to that same object. No files means an honest empty result; failed or denied reads cannot produce cards.

The private catalog supplies `revision` from the already-open regular file's identity, size and modification/change timestamps, and `updatedAt` from its modification time. A bounded plain-text preview is permitted for Markdown, text, TeX and BibTeX. PDFs and office documents provide metadata and an original link without an invented summary or body read. Preserve symlink/hardlink exclusions, path restrictions, sensitive-file filtering and the configured owner's reauthorization before delivery.

Declare the private originals directory as a server-owned inventory source. The browser receives no filesystem path. The server resolves the configured directory for authorized Settings administration. Keep all document bytes, names and live paths outside the public source repository.

## 简体中文

**个人材料需求 · v0.1.1**

按材料类别浏览学术申请档案，包括简历、研究陈述、教学陈述及求职信。 获准用户可以查找文档、阅读纯文本、打开 PDF 或下载其他格式的原件。空目录、暂时无法连接和权限失效分别提示。切换语言保留当前搜索和文档。

公开发行物包含客户端及其数据合同。私有服务分别验证列表和单个文档的访问权限，提供当前文档。真实文档、文件名、目录清单、草稿、构建产物及凭据均保留在公开仓库之外。测试使用临时合成材料。

### 来源卡片与数据位置

发布应用自己的浏览器 provider，通过宿主提供的只读回调读取既有同源 `api/documents` 目录。每份真实文档生成结果卡，使用稳定的应用/文档编号、非空来源版本、原文件名，以及指向同一对象的原生 `#document=<不透明编号>` 入口与证据链接。无文档时如实为空；读取失败或拒绝时不生成卡片。

私有目录接口从已打开的常规文件身份、大小及修改/变更时间派生 `revision`，以修改时间提供 `updatedAt`。仅对 Markdown、纯文本、TeX、BibTeX 有限读取并提取短纯文本预览；PDF 和办公文档只提供元数据及原件入口，不虚构摘要或读取正文。保留软/硬链接排除、路径约束、敏感文件过滤和交付前的资料所有者再次验权。

原件目录声明为服务端管理的数据位置，浏览器不获取文件系统路径；由服务端为获授权的设置管理员解析实际配置。文档正文、名称和真实部署路径都留在公开源码之外。
