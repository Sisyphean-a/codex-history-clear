---
id: 003
title: 使用 Go 后端与 Wails2 桌面壳层交付治理工具
status: accepted
date: 2026-06-30
relates_to: [requirements/codex-history-management, 001, 002]
---

# 使用 Go 后端与 Wails2 桌面壳层交付治理工具

## Context

这套工具的核心问题发生在 Windows 本地：要读 `CODEX_HOME`、候选根目录、SQLite、JSONL、reparse point，还要包装官方 CLI、产出可审计的计划与执行证据。纯浏览器页面拿不到稳定的本地文件和进程控制；纯 CLI 虽然能做核心治理，但对“先看证据、再人工确认、再执行”的操作体验不够友好。用户已经明确项目准备采用 Go + Wails2。

## Decision

本项目采用 Go 后端 + Wails2 桌面壳层：

- 核心发现、归一化、计划、执行、备份、验证逻辑都放在 Go 服务层。
- 操作者界面通过 Wails2 承载，前端只负责展示状态、收集确认和触发后端绑定。
- 文件系统访问、官方 CLI 调用、SQLite 在线备份和 destructive 动作只允许在 Go 后端执行，不把这些能力下放到前端脚本。
- Wails2 绑定层只暴露稳定 DTO 和作业事件流，不让前端直接拼系统路径或命令。

## Consequences

这样可以把本地治理能力和桌面交互面结合起来，同时保留 Go 在 Windows 文件系统和命令编排上的优势。代价是项目需要同时维护 Go 与前端构建链，并且要把 WebView2 / Wails2 运行时差异显式纳入 smoke 与打包验证。另一个后果是：应用自身的 WebView2 用户数据目录只能作为观察项，不能被工具误判为 Codex 历史真源。

## Alternatives Considered

- 纯 CLI 工具：后端实现最直接，但人工复核删除计划、比对证据和逐步确认的体验较弱。
- 本地 Web 服务 + 浏览器页面：UI 灵活，但本地文件访问、权限边界和分发体验更复杂。
- Electron / Tauri：同样能做桌面壳，但当前用户已明确选择 Go + Wails2，且本项目更希望把系统级治理逻辑保持在 Go 里。
