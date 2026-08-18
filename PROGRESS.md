# dsh-permission-engine 开发进度

## 当前状态

Step 3b 完成：defaults 包实现 6 条默认 link（L0 hard-deny、L1 safe-read、L2 allowlist、L3a risk-scoring、L3b llm-review、L4 remember），并通过 27 个单测；框架包新增 `./chain/link`、`./chain/chain`、`./services/engine` 子路径导出。累计 59/59 测试通过。Step 3a 已提交。Step 3c（CLIENT 半 UI）待启动，需要确认依赖与 DSH Client RPC API 细节。

## 任务清单

### Step 3b：defaults 包 6 条默认 link

- [x] 3b.1 L0 HardDenyLink（硬拒绝正则）+ static tests
- [x] 3b.2 L1 SafeReadLink（只读命令集）+ static tests
- [x] 3b.3 L2 AllowlistLink（白名单前缀）+ static tests
- [x] 3b.4 L3a RiskScoringLink（评分 JS）+ static tests
- [x] 3b.5 L3b LlmReviewLink（ctx.llm + AbortController 超时降级 allow）+ static tests
- [x] 3b.6 L4 RememberLink（记忆 TTL）+ static tests
- [x] 3b.7 defaults 包单测：`tests/links/*.test.js` + `register-links.test.js`（27 条通过）

### Step 3c：CLIENT 半 UI（React + RPC）

- [ ] 3c.1 确定 CLIENT 半依赖与 RPC API（是否引入 CodeMirror、`ctx.host.call` 是否可用）
- [ ] 3c.2 实现 `lib/client.js`：`inject` 声明 + `apply` 注册设置页面 slot
- [ ] 3c.3 实现 React 设置页面：链列表、启用/禁用、排序、内联编辑（CodeMirror 或 textarea）
- [ ] 3c.4 实现 HOST 半 RPC handler：`host.call('permissionEngine.listChains')`、`host.call('permissionEngine.updateChain')`、`host.call('permissionEngine.runSelfTest')`、`host.call('permissionEngine.reload')`
- [ ] 3c.5 i18n：`ctx.locale.register` 注册中英文 key
- [ ] 3c.6 组件测试：mock ctx + 渲染 + RPC 调用断言

## 下一步

1. 与用户确认 Step 3c 的两个问题：
   - 是否允许在框架包中添加 `@uiw/react-codemirror` 与 `@codemirror/lang-javascript` 依赖？
   - DSH Client Runtime 中 RPC 调用实际 API 是 `ctx.host.call(...)`、`ctx.remote.call(...)` 还是其他？如你已知请提供。
2. 根据确认结果实现 CLIENT 半 UI 与 HOST 半 RPC handler。
3. Step 3c 完成后停下问用户。

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
