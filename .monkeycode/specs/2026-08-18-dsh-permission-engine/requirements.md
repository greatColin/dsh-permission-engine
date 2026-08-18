# 需求文档：dsh-permission-engine

## Introduction

`dsh-permission-engine` 是 DeepSeek Harness (DSH) 的客户端插件，解决 "DSH 每个 bash 调用都要点 Approve 太烦" 的问题。该插件采用**责任链模式**（Chain of Responsibility）：每条命令的"放行与否"决策拆分为多个独立的 link，按序执行，第一个返回非空决定的 link 胜出，否则默认放行。

插件拆分为两个可独立发版的 npm 包：

| 包 | 职责 |
|---|---|
| `@yourname/dsh-permission-engine` | 框架：抽象类、引擎、DSH 集成、UI |
| `@yourname/dsh-permission-engine-defaults` | 6 条默认 link（L0 Hard Deny / L1 Safe Read / L2 Allowlist / L3 Risk Scoring + LLM Review / L4 Remember） |

## Glossary

- **DSH**：DeepSeek Harness，宿主应用，提供 Cordis 插件运行时。
- **插件（plugin）**：DSH Cordis 插件，导出 `apply(ctx)` 与 `inject`。
- **link**：责任链中的最小决策单元，实现 `decide(ctx)`，返回 `Decision | null`。
- **链（chain）**：link 的有序集合，按注册顺序执行。
- **引擎（PermissionEngine）**：管理链注册、执行决策、提供 UI 数据接口的 Service。
- **HOST 半**：运行在 DSH 主进程侧，处理工具拦截、目录扫描、持久化。
- **CLIENT 半**：运行在客户端 UI 侧，负责设置页渲染与用户交互。
- **DecisionInput**：一条待决策命令的输入，含 `tool`、`args`、`context`。
- **Decision**：决策结果，为 `allow` | `deny` | `ask` 之一。
- **ChainContext**：单次决策的运行时上下文，含 `input`、`tags`、`history`。
- **TestCase**：link 内置测试用例，含 `name`、`input`、`expected`。
- **tools/pre-execute 钩子**：DSH 提供的事件钩子，在 bash 等工具执行前触发，可 `deny(reason)` / `ask(reason)`。

## Requirements

### REQ-1：决策模型

**User Story:** 作为 DSH 用户，我希望每次工具调用自动经过多层安全检查，以便无需每次手动 Approve。

#### Acceptance Criteria

1. WHEN 引擎处理一条命令，系统 SHALL 按 L0 硬拒绝 → L1 只读 → L2 白名单 → L3 评分+LLM → L4 记忆 的顺序执行 5 层决策。
2. WHEN 任一 link 返回非空 Decision，系统 SHALL 终止后续 link 并将该 Decision 作为最终决定。
3. WHEN 所有 link 均返回空决定，系统 SHALL 默认放行。
4. WHILE 决策过程中，系统 SHALL 记录审计日志、感知沙箱状态、感知会话上下文这 3 项横切能力。

### REQ-2：每层可自定义

**User Story:** 作为 DSH 用户，我希望硬拒绝 pattern、LLM prompt、评分 JS、记忆 TTL 都能通过 UI 编辑，以便适配个人工作流。

#### Acceptance Criteria

1. WHEN 用户在设置页修改硬拒绝 pattern，系统 SHALL 使修改立即生效。
2. WHEN 用户在设置页修改 LLM prompt，系统 SHALL 使修改立即生效。
3. WHEN 用户在设置页修改评分 JS，系统 SHALL 使修改立即生效。
4. WHEN 用户在设置页修改记忆 TTL，系统 SHALL 使修改立即生效。
5. WHEN 用户修改任意配置，系统 SHALL 在下次决策时使用新配置，缓存已有决策结果无效。

### REQ-3：复用 DSH 内置 preset

**User Story:** 作为 DSH 用户，我希望插件叠加在 DSH 的 safe / danger-full-access preset 之上，以便不破坏已有行为。

#### Acceptance Criteria

1. WHEN DSH 内置 preset 已有决定，系统 SHALL 叠加而非替代该决定。
2. WHEN LLM 审查失败或超时，系统 SHALL 降级为 DSH 的 `safe` preset 并继续运行，不崩溃。

### REQ-4：命令详情可查

**User Story:** 作为 DSH 用户，我希望每条命令能查到完整的决策链路，以便理解为何放行或拒绝。

#### Acceptance Criteria

1. WHEN 查询一条命令的详情，系统 SHALL 返回：是否在沙箱、经过哪些 link、哪条 link 拍板、评分值、LLM 结论、用户是否 override。
2. WHEN 命令经过链执行，系统 SHALL 在 ChainContext.history 中记录每条 link 的结果、耗时与错误信息。

### REQ-5：设置页完整 UI

**User Story:** 作为 DSH 用户，我希望设置页能管理所有 link、测试命令、查看审计日志，以便一站式管理权限策略。

#### Acceptance Criteria

1. WHEN 打开设置页，系统 SHALL 显示 4 个 tab：Chains / Tester / Audit / About。
2. WHEN 打开 Chains tab，系统 SHALL 按来源分组列出跨包所有 link（defaults / inline / custom dir / npm）。
3. WHEN 操作任意 link，系统 SHALL 支持启用、禁用、重排。
4. WHEN 在 Tester 输入命令并点击运行，系统 SHALL 执行完整决策并显示 ChainFlow 横向流程与最终决定。
5. WHEN 打开 Audit tab，系统 SHALL 支持按时间/会话/决策/工具筛选日志，并支持导出 JSON/CSV。
6. WHEN 点击任意 link 的"跑测试"按钮，系统 SHALL 调用该 link 的 `runSelfTest()` 并显示 ✅/❌ 结果列表。
7. WHILE 设置页运行，系统 SHALL 使用 i18n 提供中文与英文界面。

### REQ-6：两包拆分

**User Story:** 作为维护者，我希望框架包与 defaults 包互不依赖、可独立发版，以便各自演进。

#### Acceptance Criteria

1. WHEN 只安装框架包，系统 SHALL 使用 dev link 正常运行。
2. WHEN 安装 defaults 包，系统 SHALL 额外提供 6 条默认 link。
3. WHEN 构建任一包，系统 SHALL 不引入对另一包的直接 import。

### REQ-7：内部测试类

**User Story:** 作为 link 开发者，我希望每条 link 自带测试用例并能在 UI 即时验证，以便获得快速反馈。

#### Acceptance Criteria

1. WHEN 定义一条 link，系统 SHALL 允许声明 `static tests` 数组（默认 `[]`）。
2. WHEN 调用 `link.runSelfTest()`，系统 SHALL 执行全部 `static tests` 并返回 `{ name, passed, actual, expected, error? }` 数组。
3. WHEN 设置页点击"跑测试"，系统 SHALL 调用引擎的 `runSelfTest(linkId)` 方法展示结果。

### REQ-8：自定义链三种方式

**User Story:** 作为 DSH 用户，我希望通过内联代码、本地文件、NPM 包三种方式添加自定义 link，以便灵活扩展。

#### Acceptance Criteria

1. WHEN 用户在设置页"添加链"选择内联代码，系统 SHALL 显示 demo 模板，空编辑器时填充模板，保存后注册为新 link。
2. WHEN 用户在内联编辑器运行测试，系统 SHALL 用编辑器内代码执行 `runSelfTest` 并显示结果。
3. WHEN `~/.dsh/custom-chains/` 目录存在 `*.js` 文件，系统 SHALL 在插件启动时自动扫描并加载为 link。
4. WHEN `~/.dsh/custom-chains/` 下文件变化，系统 SHALL 自动热加载并更新链路。
5. WHEN 用户通过 `dsh plugin add` 安装兼容 npm 包，系统 SHALL 动态加载该包的 link。
6. WHEN 内联代码或本地文件语法错误，系统 SHALL 显示明确错误信息且插件不崩溃。

### REQ-9：双半架构

**User Story:** 作为维护者，我希望插件遵循 DSH 双半架构，以便 HOST 与 CLIENT 职责分离。

#### Acceptance Criteria

1. WHEN 加载插件，系统 SHALL 导出 `lib/index.js`（HOST）与 `lib/client.js`（CLIENT）双半入口。
2. WHEN HOST 端需要渲染 UI，系统 SHALL 禁止使用 React。
3. WHEN 需要跨半通信，系统 SHALL 使用 `ctx.harness.handle`（HOST）与 `host.call`（CLIENT）。

### REQ-10：DSH 服务集成

**User Story:** 作为维护者，我希望插件复用 DSH 提供的服务而非自建，以便保持一致与可维护。

#### Acceptance Criteria

1. WHEN 需要存储配置，系统 SHALL 使用 `ctx.settings`。
2. WHEN 需要持久化审计日志，系统 SHALL 使用 `ctx.storageDomain`。
3. WHEN 需要记录日志，系统 SHALL 使用 `ctx.logger`。
4. WHEN 需要注入 UI，系统 SHALL 使用 `ctx.slots.inject('xxx', ...)`。
5. WHEN HOST 端需要扫描本地目录，系统 SHALL 使用 `fs/promises`。

### REQ-11：HMR 支持

**User Story:** 作为开发者，我希望 dev 模式修改 `lib/**` 无需重启 DSH，以便加快开发。

#### Acceptance Criteria

1. WHEN dev 模式下修改 `lib/**` 文件，系统 SHALL 支持热更新而无需重启 DSH。

### REQ-12：i18n

**User Story:** 作为多语言用户，我希望设置页支持中英文，以便按偏好使用。

#### Acceptance Criteria

1. WHEN 注册插件，系统 SHALL 通过 `ctx.locale.register('permission-engine', { zh, en })` 注册中英文语言包。
2. WHEN 用户切换语言，系统 SHALL 使用对应语言的设置页文案。

### REQ-13：代码沙箱化

**User Story:** 作为安全维护者，我希望评分 JS 与内联 link 在受限环境执行，以便防止恶意代码访问宿主环境。

#### Acceptance Criteria

1. WHEN 执行评分 JS 或内联 link 代码，系统 SHALL 使用 `new Function` 沙箱化执行，禁止直接 `eval`。
2. WHEN 沙箱内代码尝试 `require` / `import` / 访问全局对象，系统 SHALL 禁止该访问并返回错误。
3. WHEN LLM 调用，系统 SHALL 使用 `AbortController` + timeout，禁止同步阻塞。

### REQ-14：工具拦截钩子

**User Story:** 作为 DSH 用户，我希望插件通过 DSH 标准钩子拦截工具执行，以便决策真正生效。

#### Acceptance Criteria

1. WHEN 工具执行前，系统 SHALL 通过 `ctx.on('tools/pre-execute', ...)` 钩子拦截。
2. WHEN 链返回 deny，系统 SHALL 调用 `event.deny(reason)`。
3. WHEN 链返回 ask，系统 SHALL 调用 `event.ask(reason)`。
4. WHEN 链返回 allow，系统 SHALL 不干预执行。

### REQ-15：审计日志持久化

**User Story:** 作为 DSH 用户，我希望每次决策被持久记录，以便事后审查。

#### Acceptance Criteria

1. WHEN 完成一次决策，系统 SHALL 将审计记录写入 `~/.dsh/.../permission-audit.jsonl`。
2. WHEN 审计记录被写入，系统 SHALL 包含命令、决策、命中 link、评分、时间等信息。
3. WHEN 用户导出审计日志，系统 SHALL 支持 JSON 与 CSV 格式。

### REQ-16：进度跟踪

**User Story:** 作为协作开发者，我希望开发进度被持续记录，以便中断后能接续。

#### Acceptance Criteria

1. WHEN 项目根目录不存在 `PROGRESS.md`，系统 SHALL 创建该文件。
2. WHEN 每个 task 完成，开发者 SHALL 更新 `PROGRESS.md` 任务勾选、决策日志、遇到的问题、下一步。
3. WHEN 每个 step 完整验收，开发者 SHALL 在"当前状态"写入 100 字以内总结。
