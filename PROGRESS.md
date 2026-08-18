# dsh-permission-engine 开发进度

## 当前状态

Step 2 完成：Loader（目录/内联/npm 包三种来源）+ new Function 沙箱（变量遮蔽 + 静态扫描拒绝 require/import）+ demo 模板 + 10 条 loader/sandbox 单测通过。累计 29/29 测试通过。Step 3a 引擎与 DSH 集成待启动。

## 任务清单

### Step 1：项目脚手架与链核心

- [x] 1.1 创建框架包 `packages/dsh-permission-engine`（package.json：type module + 双半 exports + `dsh.client` 字段 + peerDependencies）
- [x] 1.2 创建 defaults 包 `packages/dsh-permission-engine-defaults`（package.json：peer 依赖框架包，零静态依赖）
- [x] 1.3 配置 vitest 测试基建（`pnpm test`，根 workspace）
- [x] 1.4 定义类型契约 `lib/types/chain.d.ts`（ChainLink/TestCase/Decision/ChainContext）
- [x] 1.5 实现 `BaseChainLink`（含 `static tests` 归一化、`runSelfTest`、allow/deny/ask/pass 辅助）
- [x] 1.6 实现 `PermissionChain`（按 order 排序、首决策胜出、全空放行、错误隔离、history 记录）
- [x] 1.7 实现 `defineLink` helper 与 dev 测试 link（allow/deny/echo）
- [x] 1.8 单测：`tests/chain.test.js`、`tests/link.test.js`、`tests/engine.test.js`（首步骨架）

### Step 2：Loader 与沙箱

- [x] 2.1 实现 `Loader.loadFromDirectory`（fs/promises + pathToFileURL + import，返回 `{ link, source, error? }`）
- [x] 2.2 实现 `Loader.loadFromInlineCode`（`new Function` + 变量遮蔽沙箱，拒绝 require/import/process；静态扫描拒绝显式 import/require 调用）
- [x] 2.3 实现 `Loader.loadFromPackage`（动态 import，调 registerLinks/default）
- [x] 2.4 单测：`tests/loader.test.js`、`tests/loader-inline.test.js`（沙箱拒绝 require/import；demo 模板可加载）

**验收（design.md Step 2 验收对拍）：** loader 临时目录 + 内联 JS 均通过（对应测试）。

### Step 3a：引擎与 DSH 集成（HOST 半）

- [ ] 3a.1 实现 `PermissionEngine` Service（registerLink/setEnabled/reorder/decide/runSelfTest/listChainsForUI/reloadFromSettings）
- [ ] 3a.2 实现 `DshHooks`：`ctx.on('tools/pre-execute')` 监听，allow→`return next()`、deny/ask→返回决策（D1）
- [ ] 3a.3 实现 `AuditLogService`（`ctx.storageDomain` domain 表 + append/query/export）
- [ ] 3a.4 settings 集成：`installSettingsSection(ctx, ns, Config, config, hooks)`（REQ-2）
- [ ] 3a.5 沙箱感知与上下文感知（`ctx.get('sandbox')`、sessionId/workspaceId，取不到给安全默认值）
- [ ] 3a.6 defaults 包注册：框架包动态 `import()` defaults 的 `registerLinks(engine, ctx)`（D2）
- [ ] 3a.7 单测：`tests/integration/full-flow.test.js`（mock ctx + 手动触发 pre-execute：`rm -rf /`→deny、`ls -la`→allow、审计落库、LLM 失败降级）

**验收（design.md Step 3b 验收对拍）：** full-flow 测试模拟一次 bash 调用，断言 L0/L1 命中与审计落库。

### Step 3b：defaults 包 6 条默认 link

- [ ] 3b.1 L0 HardDenyLink（硬拒绝正则）+ static tests
- [ ] 3b.2 L1 SafeReadLink（只读命令集）+ static tests
- [ ] 3b.3 L2 AllowlistLink（白名单前缀）+ static tests
- [ ] 3b.4 L3a RiskScoringLink（评分 JS）+ static tests
- [ ] 3b.5 L3b LlmReviewLink（ctx.llm + AbortController 超时降级 allow）+ static tests
- [ ] 3b.6 L4 RememberLink（记忆 TTL）+ static tests
- [ ] 3b.7 defaults 包单测：`tests/links/*.test.js`（每条 link ≥3 用例）

### Step 3c：CLIENT 半 UI

- [ ] 3c.1 `lib/client.js` 入口：locale.register + `settings.section` slot 注册
- [ ] 3c.2 RPC 契约：HOST 半 `harness.handle` 注册全部方法；CLIENT 半 `host.call` 封装
- [ ] 3c.3 `SettingsPage`（4 tab 容器）+ `ChainConfig`（分组/启用/重排/跑测试/添加/重置）
- [ ] 3c.4 `CommandTester` + `ChainFlow`（stepper 展示 history）
- [ ] 3c.5 `AuditLogTab`（筛选/列表/详情/导出）+ `About`
- [ ] 3c.6 `AddChainDialog`（内联代码 + demo 模板 + 跑测试 + 保存 / 本地文件 / npm 包）
- [ ] 3c.7 `CodeEditor`（CodeMirror）
- [ ] 3c.8 `config.get/config.update` RPC（白名单规避，D9）+ CLIENT 构建（JSX→CJS 单文件 + wrap-client）
- [ ] 3c.9 组件测试：`tests/ui/__tests__/*.test.js`（4 tab、跨包 link 列出、跑测试回显、审计筛选导出）

**验收（design.md Step 3c 验收对拍）：** 组件测试断言跨包 link 列出（6 defaults + 3 dev）、跑测试按钮回显、审计筛选导出。

> ⚠️ Step 3c 验收完成后**必须停下**，向用户报告并请求确认后再进入 Step 4（禁跳 step）。

### Step 4：高级链功能

- [ ] 4.1 内联链 demo 模板 `lib/chain/templates/link-demo.js`（空编辑器填充 + 可加载）
- [ ] 4.2 本地目录热加载（chokidar Watcher：增/改/删触发重载）
- [ ] 4.3 语法错误处理（loader 捕获 SyntaxError 返回 `{ link:null, source, error }`，UI 明确提示）
- [ ] 4.4 npm 包安装流程完善（`chains.installPackage` 错误处理与反馈）
- [ ] 4.5 单测：`tests/watcher.test.js`、loader-inline 边界补测、错误路径补测

**验收（design.md Step 4 验收对拍）：** 内联链 demo 模板加载、本地目录热加载、语法错误不崩（loader-inline/watcher 测试覆盖）。

## 决策日志

| 编号 | 决策 | 依据 |
|---|---|---|
| D1 | 钩子 API 用 DSH 真实契约：`tools/pre-execute(exec, next) => PreToolDecision`，放行 `return next()`；需求原文 `event.deny/event.ask` 不存在 | dsh-tools 源码；官方 extension-cookbook permission-gate 示例 |
| D2 | defaults 包经 `config.useDefaults` + 动态 `import()` 调 `registerLinks(engine, ctx)`，两包零静态依赖 | REQ-6 |
| D3 | 内联 JS 沙箱：`new Function` + 变量遮蔽，不引 vm；direct-eval 为已知边界 | REQ-13.1 |
| D4 | UI 用 React + CodeMirror | dsh-client-ui-slots React-only |
| D5 | 审计用 `ctx.storageDomain` KV domain，不直接写 JSONL | REQ-10.2 |
| D6 | LLM 失败降级 = `allow` + `degraded:true`，交还 DSH workspace-write 兜底 | REQ-3.2 |
| D7 | 沙箱感知 `ctx.get('sandbox')`，danger-full-access 提高 ask 频率 | REQ-1.4 |
| D8 | CLIENT 半 JSX→CJS 单文件 + wrap-client.mjs 包装为 `__ModuleLoader__` 工厂 | client-runner 加载约束 |
| D9 | CLIENT 禁用 settingsScope，配置走 `host.call('config.*')` RPC（apiproxy 白名单） | dsh-host-apiproxy 源码（settings-not-exposed） |

## 遇到的问题

- **DSH rc 包无法作为独立 npm 依赖安装**：`@deepseek-ai/dsh-client-runtime@0.0.1-rc.1` 等依赖树含未发布内部包（`dsh-compact`、`dsh-type-meta` 等，registry 404）。故框架包 `package.json` 仅保留 `@deepseek-ai/cordis` 一个 peer（其余 DSH 服务由 DSH 宿主运行时经 `ctx` 提供，代码不 import DSH 包 —— 与 REQ-6"禁跨包 hard import"一致）。
- **pnpm 11 默认忽略依赖构建脚本**（`ERR_PNPM_IGNORED_BUILDS`），并因此在每条命令前跑 install 校验导致所有 pnpm 命令失败。解决：`pnpm approve-builds esbuild` 批准 esbuild postinstall（`pnpm.onlyBuiltDependencies` 在 pnpm 11 已失效；`pnpm-workspace.yaml` 的 `onlyBuiltDependencies` 未生效）。
- **`.npmrc` 增加 `verify-deps-before-run=false` 后 pnpm 命令仍被 install 校验阻塞** —— 直接运行 `node_modules/.bin/vitest run` 绕过；批准 esbuild 后恢复正常。

## 下一步

1. Step 3a：实现 `PermissionEngine` 与 DSH 集成（`ctx.provide` service、`tools/pre-execute` 监听、`ctx.storageDomain` 审计、`installSettingsSection`、defaults 包动态加载、full-flow 集成测试）
2. 完成后提交 Step 3a，继续 Step 3b（6 条默认 link）
