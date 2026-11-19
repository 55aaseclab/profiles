# Profiles / 个人材料

Academic dossier. Serve `public/` as a static directory alongside your private, same-origin document API. Use HTTPS or a loopback origin. The client starts in English and supports Simplified Chinese. It retains only the language preference. The platform supplies Home on managed pages.

| Route | Response |
| --- | --- |
| `GET ./api/documents` | `{"items":[{"id":"…","name":"…","group":"","type":"pdf"}]}`. IDs are 64 lowercase hexadecimal characters; names and groups are display text; type is a lowercase file extension. |
| `GET ./api/documents/<id>` | The authorized original. Text/Markdown/TeX/BibTeX are served as UTF-8 plain text, PDFs as PDF, and other permitted binary formats as downloads. |

The server authenticates both endpoints, checks access on every request and sets private responses to `Cache-Control: no-store`. Keep private data, generated originals, manifests, backups and credentials outside this repository and the static web root. Store only the allowlisted public files in Git. Test using `node test/smoke.mjs` with Playwright installed (or set `PLAYWRIGHT_MODULE` to its module path and `CHROMIUM_PATH` to your browser executable). The test creates synthetic responses in memory.

## 简体中文

学术申请材料。将 `public/` 与私有、同源的文档 API 一起提供服务，使用 HTTPS 或本机回环地址。默认英语，支持简体中文；本地只保存语言偏好。受管页面由工作台统一提供返回按钮。

列表接口返回获准文档的名称、分组、格式和不透明编号。原件接口使用该编号逐次鉴权。文本、Markdown、TeX 和 BibTeX 显示为纯文本，PDF 可打开查看，其他允许的二进制文件可下载。服务端对私有响应设置 `Cache-Control: no-store`。私人资料、生成件、清单、备份及凭据应存放在本源码仓库和静态目录以外。浏览器测试只使用内存合成数据。
