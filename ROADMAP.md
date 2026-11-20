# Profiles roadmap / 路线图

| Release | Outcome | Acceptance |
| --- | --- | --- |
| 0.1.1 | Authorized source-backed workbench cards and server-owned directory inventory | Verify native deep links, real metadata revisions, bounded text previews, metadata-only PDF/docx cards, empty/error states and owner revocation. |
| 0.1.0 | English-first bilingual private document reading | Search and select an authorized item, read the correct original, navigate back and handle empty, unavailable and revoked states. Confirm that a clean source checkout contains only code and public documentation. |

| 版本 | 交付 | 验收 |
| --- | --- | --- |
| 0.1.1 | 已授权来源卡片与服务端原件目录数据位置 | 核对原生深链、真实元数据版本、有限纯文本预览、仅元数据的 PDF/docx 卡片、空目录/错误状态及所有者撤权。 |
| 0.1.0 | 英文优先的双语私有文档阅读界面 | 搜索并选择获准材料，核对原文，返回原位置，验证空目录、服务不可用和撤权状态。检查独立源码仓库只包含代码与公开文档。 |

## App-owned Praxis integration

This app owns its reviewed `praxis-integration.mjs`: native entry policy, typed business operations and MCP guidance where supported. Praxis loads that declaration from the installed source and retains authorization, signing, policy leases and audit. Installation does not grant access or start a backend. Existing native interfaces, data ownership and recovery boundaries remain in force.

## 应用自有 Praxis 集成

本应用在所属仓库维护经审核的 `praxis-integration.mjs`，声明原生入口策略，以及已支持的类型明确的业务操作与 MCP 指引。Praxis 从已安装源码加载声明，继续统一执行授权、签名、策略租约与审计。安装声明不会授予访问权限，也不会启动后端；已有原生界面、数据归属与恢复边界继续生效。
