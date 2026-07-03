---
doc_type: goal
goal: codex-history-manager
status: blocked
---

# Codex History Manager Goal

## Objective

完成 `codex-history-manager` 整个 roadmap，实现基于 `Go + Wails2` 的 Windows 本地 Codex 会话历史管理桌面工具，并补齐真正可执行的本地历史删除能力，最终通过功能验收。

## Starting Point

- 仓库已有 Wails2 桌面壳层、只读扫描、重复分组和删除计划预览，实现不再是空白。
- `go test ./...`、`npm --prefix frontend run build`、`wails build -clean` 已能通过，说明最小闭环站住了。
- 当前真正缺口是 destructive 执行层：还没有真实删除、回滚备份、执行后复扫和桌面确认流。
- 参考项目 `E:\其他\codex-history` 已证明在当前 Codex 本地数据结构下，`state_5.sqlite`、`logs_2.sqlite`、`goals_1.sqlite`、`session_index.jsonl`、`history.jsonl`、rollout 文件这些存储都可以成为真实删除链路的一部分。
- 本机真实 `.codex` 结构已确认与早期假设有偏差：`session_index.jsonl` 只有 `id/thread_name/updated_at`，不再提供 rollout 路径；主索引应切到 `state_5.sqlite.threads`。

## Acceptance Criteria

- 桌面应用能启动并展示只读扫描摘要。
- 能列出本地历史会话，并生成可复核的真实删除计划。
- 能生成 `discovery.json`、`manifest-before.json`、`delete-plan.json`、`rollback-journal.json`、`exec-result.json`、`manifest-after.json` 等核心 artifact。
- destructive 流程能真实改写本地 SQLite / JSONL / rollout 存储，并具备审批、回滚、备份、复扫和一致性结论。
- 桌面工作区能完成会话筛选、计划确认、执行删除和结果复核。
- 桌面工作区、fixture smoke 和功能验收证据能支撑最终功能验收。

## Non-Goals

- 不做 OpenAI 云端 Conversations / Responses 同步。
- 不做浏览器缓存和 WebView 用户数据的深度解析器。
- 不做 macOS / Linux 跨平台交付。
- 不做超出 Codex 当前本地数据模型的通用文件清理平台。

## Decisions And Assumptions

- owner 已批准按完整 roadmap goal 推进。
- owner 已额外批准：以 `E:\其他\codex-history` 作为真实删除参考，无需单独逐项请示。
- 现有 feature design 继续作为执行契约，但真实删除链路以当前真实 `.codex` 数据结构为准，不再依赖过时的 `session_index.path` 假设。
- 执行层以 `state_5.sqlite.threads` 作为会话主索引，再联动 `logs/goals/session_index/history/global_state/rollout` 做删除与验证。
- 默认保留回滚能力：原始 rollout 进入隔离或备份区，SQLite / JSONL 在 destructive 前先生成可恢复快照。
- 在没有 `HEAD` 基线提交的前提下继续推进；若后续 gate 明确要求提交基线，再单独补。

## Current State

- Goal 状态：`active`
- 已完成 iteration：`14`
- 当前进展：auditor 提出的实现和证据缺口都已补齐；当前 goal 进入 `blocked`，原因不是代码未完成，而是连续第三个 goal turn 都被平台 `agent thread limit` 卡住，无法再启动独立功能验收 agent。
- 新确认事实：
  - `session_index.jsonl` 当前只有标题索引，不再携带 rollout 路径。
  - rollout `session_meta` 同时携带 `session_id` 和 `id`，其中 `id` 对应当前线程，适合做真实删除定位。
  - `history.jsonl` 仍保留 `session_id` 级别的文本记录，真实删除需要一起改写。
- 当前关键路径：平台恢复 Task agent 容量后，补独立功能验收 verdict，并落 `functional-acceptance.md` 关闭 goal。

## Next Action

等待平台释放 Task agent 容量，或在新会话中重新发起独立功能验收。
