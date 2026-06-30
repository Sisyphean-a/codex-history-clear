---
doc_type: goal
goal: codex-history-manager
status: active
---

# Codex History Manager Goal

## Objective

完成 `codex-history-manager` 整个 roadmap，实现基于 `Go + Wails2` 的 Windows 本地 Codex 会话历史管理桌面工具，并通过最终功能验收。

## Starting Point

- 仓库当前已有 requirement、roadmap、ADR 和 6 份 feature design / checklist / design-review 文档。
- 项目技术路线已明确为 `Go + Wails2`。
- 当前还没有任何 Go、Wails2 或前端实现代码。
- 环境检查已确认本机具备 `go 1.26.1`、`node 24.16.0`、`npm 11.13.0`、`wails 2.11.0`。
- git 仓库存在，但还没有 `HEAD` 基线提交。

## Acceptance Criteria

- 桌面应用能启动并展示只读扫描摘要。
- 能生成 `discovery.json`、`manifest-before.json`、`delete-plan.json`、`rollback-journal.json`、`exec-result.json`、`manifest-after.json` 等核心 artifact。
- 能区分路径别名与真实副本，生成唯一保留本和可复核删除计划。
- destructive 流程具备审批、回滚、备份、复扫和一致性结论。
- 桌面工作区、fixture smoke 和 evidence pack 能支撑最终功能验收。

## Non-Goals

- 不做 OpenAI 云端 Conversations / Responses 同步。
- 不做浏览器缓存和 WebView 用户数据的深度解析器。
- 不做直接修改 live SQLite 或 JSONL 的默认自动化路径。
- 不做 macOS / Linux 跨平台交付。

## Decisions And Assumptions

- owner 已批准按完整 roadmap goal 推进。
- 现有 6 份 feature design 作为当前执行契约；若实现时发现需要跨 capability boundary 或改长期 spec，再触发 owner-stop。
- 先从 `read-only-manifest-baseline` 开始，建立 Wails2 骨架和最小只读闭环。
- 在没有 `HEAD` 基线提交的前提下先推进实现；若后续 gate 明确要求 commit / baseline，再单独触发 owner 决策。

## Current State

- Goal 状态：`active`
- 已完成 iteration：`8`
- 当前进展：owner 已授权 `read-only-manifest-baseline` 进入 Task agent 独立 review，阻塞已解除
- 已准备证据：fresh build / test 已重跑，review packet 已生成；当前正在补齐 feature 目录下的 review gate 物料并等待 reviewer 返回

## Next Action

执行 `read-only-manifest-baseline` 的独立 code review，合并经本地核验的 finding，生成 `{slug}-review.md`；若 review 通过，立即进入 `cs-feat-qa`。
