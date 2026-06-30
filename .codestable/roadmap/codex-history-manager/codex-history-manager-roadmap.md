---
doc_type: roadmap
slug: codex-history-manager
status: active
created: 2026-06-30
last_reviewed: 2026-06-30
tags: [windows, codex, history, cleanup, go, wails2, desktop]
related_requirements: [codex-history-management]
related_architecture: []
---

# Codex 会话历史管理工具 roadmap

## 1. 背景

这块需求要解决的不是“删几个文件”，而是把 Windows 上分散、漂移、可能被路径映射放大的 Codex 本地会话历史，整理成一条安全、可回滚、可审计的治理链路。研究材料已经给出了足够清楚的目标和约束：要以 `CODEX_HOME` 为中心，以官方 CLI 为主控制面，兼容 SQLite、JSONL、cc-switch、WSL 和重解析点场景。

用户已经明确技术路线采用 **Go + Wails2**。因此这份 roadmap 不再是技术中立的抽象规划，而是直接围绕 Windows 本地桌面工具来定义：Go 承担治理逻辑与系统交互，Wails2 承担可审阅、可确认、可回放的操作者界面。

## 2. 范围与明确不做

### 本 roadmap 覆盖

- Wails2 桌面壳层、前后端绑定和本地作业进度呈现
- Windows 本地 Codex 会话历史的只读发现与统一清单生成
- 路径归一化、逻辑去重、保留本判定与删除计划生成
- 归档、隔离删除、回滚日志、复扫校验这条安全执行链
- 面向操作者的桌面工作区、报告产物、样本夹具和最小验证闭环

### 明确不做

- OpenAI 云端 Conversations / Responses 的同步器
- 浏览器缓存和 WebView 用户数据的深度解析器
- 直接修改 live SQLite 或 JSONL 的默认自动化路径
- 跨平台（macOS / Linux）一次性交付；本期按 Windows 优先
- 与 Codex 无关的通用本地文件清理平台

### Granularity Gate

| 判断项 | 结论 |
|---|---|
| 为什么不是 single feature | 这块需求至少包含桌面壳层、发现、归一化、计划、执行、安全验证六个独立交付，且它们之间有明确 DAG 和共享数据契约。 |
| 为什么不是 brainstorm | 目标、边界、成功信号和主要风险已经足够清楚，现阶段更需要可执行拆解而不是继续分诊。 |
| roadmap 边界 | 本次只覆盖 Windows 本地桌面治理链路，不扩展到云端同步、浏览器深解析和通用清理能力。 |
| 最小闭环 | `read-only-manifest-baseline` 完成后，桌面应用能从候选根目录生成 discovery 快照、统一 manifest 基线并在界面展示摘要。 |

## 3. 模块拆分（概设）

```text
Codex History Manager
├── Wails2 Desktop Shell：承载窗口、工作区、确认流和作业进度
├── Discovery Layer：发现候选根目录与本地对象
├── Canonicalization & Planning Layer：归一化路径、会话标识、重复组和删除计划
└── Execution & Verification Layer：执行 archive / quarantine / delete，并产出回滚、备份与验证证据
```

### Wails2 Desktop Shell · 桌面壳层

- **职责**：提供桌面入口、工作区状态、计划确认、执行进度和证据查看，不直接触碰文件系统或 CLI。
- **承载的子 feature**：`read-only-manifest-baseline`、`operator-surface-and-fixtures`
- **触碰的现有代码 / 模块**：全新模块

### Discovery Layer · 发现层

- **职责**：枚举 `CODEX_HOME` 及其候选根目录，收集 CLI 诊断结果与本地对象元数据。
- **承载的子 feature**：`read-only-manifest-baseline`
- **触碰的现有代码 / 模块**：全新模块

### Canonicalization & Planning Layer · 归一化与计划层

- **职责**：把路径别名、reparse point、WSL/Win32 表示和会话标识整理成统一坐标系，并基于统一 manifest 生成重复组、保留本和删除计划。
- **承载的子 feature**：`path-and-project-canonicalization`、`duplicate-grouping-and-retention-planning`
- **触碰的现有代码 / 模块**：全新模块

### Execution & Verification Layer · 执行与验证层

- **职责**：执行归档、隔离、删除、在线备份、回滚日志和执行后复扫，保持 destructive 动作可审计。
- **承载的子 feature**：`archive-and-quarantine-execution`、`post-run-verification-and-backup`、`operator-surface-and-fixtures`
- **触碰的现有代码 / 模块**：全新模块

## 4. 模块间接口契约 / 共享协议（架构层详设）

### 4.1 Desktop Scan Request / Result

**方向**：Wails2 Desktop Shell → Discovery Layer  
**形式**：Go 绑定方法 `RunReadOnlyScan` 与序列化 DTO

**契约**：

```go
type ScanRequest struct {
  CodexHome              string
  ExtraRoots             []string
  IncludeBrowserSidecars bool
  OutputDir              string
}

type ScanResult struct {
  RunID            string
  DiscoveryPath    string
  ManifestPath     string
  UnknownItemsPath string
  Summary          ScanSummary
  Warnings         []string
}
```

**约束**：

- 桌面壳层只能提交序列化请求，不直接拼接系统命令。
- `OutputDir` 必须是应用工作区内的绝对 Windows 路径。
- `IncludeBrowserSidecars=false` 时，发现层只能记录跳过原因，不能静默扫描浏览器或 WebView2 目录。

### 4.2 Discovery Manifest

**方向**：Discovery Layer → Canonicalization & Planning Layer  
**形式**：UTF-8 JSON 文件 `discovery.json`

**契约**：

```json
{
  "run_id": "20260630-103000",
  "roots": ["C:\\Users\\Alice\\.codex"],
  "items": [
    {
      "source_root": "C:\\Users\\Alice\\.codex",
      "path": "C:\\Users\\Alice\\.codex\\history.jsonl",
      "kind": "history_jsonl",
      "size": 12345,
      "mtime_utc": "2026-06-30T10:21:33Z",
      "attributes": ["Archive"],
      "link_type": null,
      "target": null
    }
  ],
  "cli_snapshot": {
    "doctor_json_path": "out\\codex-doctor.json",
    "resume_supported": true
  }
}
```

**约束**：

- `kind` 只允许 `config_toml`、`auth_json`、`credentials_json`、`history_jsonl`、`session_index_jsonl`、`state_sqlite`、`logs_sqlite`、`rollout_jsonl`、`archived_rollout_jsonl`。
- `path` 必须是绝对 Windows 路径。
- Discovery Layer 不解析正文内容，只提供对象级元数据和 CLI 快照位置。

### 4.3 Normalized Session Record

**方向**：Canonicalization & Planning Layer 内部共享  
**形式**：UTF-8 JSON 文件 `manifest-before.json`

**契约**：

```json
{
  "session_uid": "uuid-or-null",
  "thread_uid": "uuid-or-null",
  "storage_kind": "codex_history_jsonl|codex_rollout_jsonl|codex_sqlite",
  "source_path": "C:\\Users\\Alice\\.codex\\sessions\\...\\rollout-1.jsonl",
  "canonical_path": "C:\\Users\\Alice\\.codex\\sessions\\...\\rollout-1.jsonl",
  "real_path": "\\\\?\\C:\\Users\\Alice\\.codex\\sessions\\...\\rollout-1.jsonl",
  "reparse_kind": "none|symlink|junction|mountpoint|unknown",
  "cwd_raw": "/mnt/c/dev/project",
  "cwd_norm": "c:\\dev\\project",
  "updated_at": "2026-06-30T10:21:33Z",
  "content_hash": "sha256:...",
  "duplicate_group": "dup-000123",
  "preferred": false,
  "evidence": ["cli-visible", "rollout-file"]
}
```

**约束**：

- `duplicate_group` 在分组前可为 `null`，分组后必须稳定。
- `preferred=true` 的记录在同一 `duplicate_group` 内最多一条。
- `storage_kind` 不包含浏览器缓存类型；浏览器旁路对象只作为观察项进入独立清单。

### 4.4 Delete Plan

**方向**：Canonicalization & Planning Layer → Execution & Verification Layer  
**形式**：UTF-8 JSON 文件 `delete-plan.json`

**契约**：

```json
{
  "run_id": "20260630-103000",
  "approved": false,
  "items": [
    {
      "duplicate_group": "dup-000123",
      "session_uid": "uuid-or-null",
      "source_path": "C:\\Users\\Alice\\.codex\\sessions\\...\\rollout-1.jsonl",
      "action": "keep|archive|quarantine|delete|repair_index",
      "reason": "preferred copy exists at newer canonical path",
      "requires_cli": true,
      "quarantine_path": ".codex\\.trash\\20260630-103000\\rollout-1.jsonl"
    }
  ]
}
```

**约束**：

- `approved=false` 时 Execution Layer 只能做 dry-run。
- `delete` 只能出现在已通过 `archive` 或 `quarantine` 的对象上。
- `repair_index` 不能隐式伴随 `delete`；必须作为独立动作记录。

### 4.5 Execution Job Event

**方向**：Execution & Verification Layer → Wails2 Desktop Shell  
**形式**：作业事件流 `JobEvent`

**契约**：

```json
{
  "run_id": "20260630-103000",
  "phase": "backup|archive|quarantine|delete|repair_index|verify",
  "item_index": 3,
  "item_total": 12,
  "level": "info|warn|error",
  "message": "quarantined rollout-1.jsonl",
  "artifact_path": "out\\rollback-journal.json",
  "requires_confirmation": false
}
```

**约束**：

- 同一 `run_id` 的事件必须按 phase 内顺序到达，不允许 UI 自行重排结果意义。
- `requires_confirmation=true` 只能出现在 destructive 阶段开始前，不能在动作进行到一半时补确认。
- `artifact_path` 为空时，桌面壳层只能展示状态，不得假设有文件可下载。

### 4.6 Rollback And Verification Artifacts

**方向**：Execution & Verification Layer → 操作者与后续验证  
**形式**：UTF-8 JSON 文件 `rollback-journal.json`、`exec-result.json`、`manifest-after.json`

**契约**：

```json
{
  "run_id": "20260630-103000",
  "rollback": [
    {
      "action": "quarantine",
      "from": "C:\\Users\\Alice\\.codex\\sessions\\...\\rollout-1.jsonl",
      "to": "C:\\Users\\Alice\\.codex\\.trash\\20260630-103000\\rollout-1.jsonl",
      "restorable": true
    }
  ],
  "verification": {
    "after_manifest": "out\\manifest-after.json",
    "cli_recheck": true,
    "consistency_status": "pass|warn|fail"
  }
}
```

**约束**：

- 每个 destructive 动作都必须有一条 rollback 记录。
- `manifest-after.json` 与执行前 manifest 使用同一 schema，便于差异比对。

## 5. 子 feature 清单

1. **read-only-manifest-baseline** — 初始化 Wails2 桌面壳层并从候选根目录生成只读 discovery 快照和统一 manifest 基线
   - 所属模块：Wails2 Desktop Shell, Discovery Layer
   - 依赖：无
   - 状态：in-progress
   - 对应 feature：`2026-06-30-read-only-manifest-baseline`
   - 备注：最小闭环；完成后即可用真实样本验证定位规则并在界面展示摘要

2. **path-and-project-canonicalization** — 归一化 Win32、WSL、reparse point 和 worktree 路径，区分路径别名与真实副本
   - 所属模块：Canonicalization & Planning Layer
   - 依赖：`read-only-manifest-baseline`
   - 状态：in-progress
   - 对应 feature：`2026-06-30-path-and-project-canonicalization`
   - 备注：为重复判定和 UI 标注提供统一坐标系

3. **duplicate-grouping-and-retention-planning** — 基于统一 manifest 生成重复组、保留本和删除计划
   - 所属模块：Canonicalization & Planning Layer
   - 依赖：`read-only-manifest-baseline`, `path-and-project-canonicalization`
   - 状态：in-progress
   - 对应 feature：`2026-06-30-duplicate-grouping-and-retention-planning`
   - 备注：明确分离逻辑重复与物理重复

4. **archive-and-quarantine-execution** — 执行 archive、quarantine、delete 和 repair_index 包装，并通过桌面壳层持续回传作业进度
   - 所属模块：Execution & Verification Layer
   - 依赖：`duplicate-grouping-and-retention-planning`
   - 状态：in-progress
   - 对应 feature：`2026-06-30-archive-and-quarantine-execution`
   - 备注：默认支持 dry-run、人工确认和 rollback journal

5. **post-run-verification-and-backup** — 加入在线备份、执行后复扫、一致性校验和敏感文件保护
   - 所属模块：Execution & Verification Layer
   - 依赖：`archive-and-quarantine-execution`
   - 状态：in-progress
   - 对应 feature：`2026-06-30-post-run-verification-and-backup`
   - 备注：把回滚、安全和验证闭环补齐

6. **operator-surface-and-fixtures** — 提供桌面工作区、样本夹具、报告导出和最小 smoke / build 验证
   - 所属模块：Wails2 Desktop Shell, Execution & Verification Layer
   - 依赖：`read-only-manifest-baseline`, `duplicate-grouping-and-retention-planning`, `post-run-verification-and-backup`
   - 状态：in-progress
   - 对应 feature：`2026-06-30-operator-surface-and-fixtures`
   - 备注：收口条目，确保桌面交互、样本验证和打包交付都有稳定入口

**最小闭环**：第 1 条 `read-only-manifest-baseline` 做完后，系统就能启动桌面应用、对真实 `CODEX_HOME` 生成 discovery 快照、CLI 快照和统一 manifest 基线，并在界面呈现摘要。

### Goal Coverage Matrix

| Goal / completion signal | Covered by item(s) | Verification entry | Evidence type | Core? |
|---|---|---|---|---|
| 桌面应用能启动并展示只读扫描摘要 | `read-only-manifest-baseline` | 启动 Wails2 应用并检查扫描工作区 | screenshot, command, json artifact | yes |
| 能从真实候选根目录稳定找出会话相关对象 | `read-only-manifest-baseline` | 运行只读扫描并检查 `discovery.json` / `manifest-before.json` | command, json artifact | yes |
| 能把路径别名与真实副本分开识别 | `path-and-project-canonicalization` | 用 WSL / junction / worktree 样本检查 `canonical_path` / `real_path` | fixture test, report | yes |
| 能给同一逻辑会话生成唯一保留本和删除计划 | `duplicate-grouping-and-retention-planning` | 检查 duplicate groups、preferred record 与 `delete-plan.json` | json artifact, diff review | yes |
| destructive 动作可回滚且可复扫验证 | `archive-and-quarantine-execution`, `post-run-verification-and-backup` | 执行 dry-run / sample run 并检查 rollback / after manifest / consistency status | command, json artifact | yes |
| 操作者有稳定入口、样本夹具和桌面 smoke 流程 | `operator-surface-and-fixtures` | 运行 smoke tests、导出证据包并检查打包产物 | test, command, screenshot | no |

## 6. 排期思路

先用 `read-only-manifest-baseline` 同时建立 **Wails2 桌面壳层** 和 **最小事实面**，是为了让后续每条 feature 都能在真实桌面工作区里看到证据，而不是先堆一批后台逻辑再补交互。再做路径归一化和重复分组，是因为没有统一 manifest 时，后续所有删除策略都会变成猜测。执行层放在计划层之后，是为了让 destructive 动作只消费结构化计划，而不是边扫描边删除。

Top 3 风险与缓解：

- **真实存储形态与研究结论不完全一致**：第一条先产出 manifest 基线和未知对象清单，不急着做删除。
- **活动 SQLite / WAL 占用导致一致性或备份风险**：执行层只接受在线备份或显式待机后的备份，不做 raw copy 假设。
- **Wails2 壳层与后端边界被写成“大而全绑定”**：第 4 节先把 DTO 与事件流定死，避免前端直接拼路径、命令和删除动作。

关键假设：

- 目标环境能提供 `CODEX_HOME` 或等价候选根目录。
- 官方 CLI 至少在部分环境里可调用；不可用时只影响执行层，不阻断只读发现层。
- Wails2 前端采用标准 `frontend/` 工作区；具体组件框架可随初始化模板确定，但后端 DTO 和作业事件流不因此改变。
- 浏览器 / WebView 相关对象在第一阶段只作为旁路观察项，不进入默认删除计划。

## 7. 观察项

- 当前仓库还没有真实样本、Wails2 scaffold 或现成代码，第一条完成后要把“未知对象”“路径变体”和前端验证命令一起固化为 fixture / smoke 入口。
- 当前仓库虽是 git 仓库，但还没有 `HEAD` 基线提交；后续真正生成 goal 执行包前必须先补上初始提交，否则 `goal-state.yaml` 无法写合法 `baseline_ref`。
- 如果真实环境里 `codex delete` 无法覆盖某些本地对象，仍然不要直接回退到 live DB 写操作；先回 roadmap 补安全路径。
- 如果浏览器或 WebView 状态在真实部署里成为主入口，应另开一份 roadmap，而不是把本 roadmap 静默扩成通用浏览器取证工具。

## 8. 变更日志（update 模式）

- 2026-06-30：引入 `Go + Wails2` 桌面交付路线；新增桌面壳层模块与作业事件契约，调整第 1 条和第 6 条 item 的交付口径。受影响的已启动 feature：none。
