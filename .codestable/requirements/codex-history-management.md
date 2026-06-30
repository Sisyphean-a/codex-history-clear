---
doc_type: requirement
slug: codex-history-management
pitch: 在 Windows 上安全地查找、去重和清理 Codex 会话历史
status: draft
last_reviewed: 2026-06-30
implemented_by: []
tags: [windows, codex, history, dedupe, cleanup]
---

# 在 Windows 上安全管理 Codex 会话历史

## 用户故事

- 作为同时使用 Codex CLI、Desktop 或 cc-switch 的 Windows 开发者，我希望一次扫描就看清会话历史实际落在哪些本地对象里，而不是自己翻 `.codex`、SQLite 和浏览器目录猜真源。
- 作为担心误删历史的维护者，我希望系统先生成可复核的归档/删除计划，再执行隔离删除，而不是直接改活数据库或删文件。
- 作为在 WSL、worktree 或路径映射环境里工作的用户，我希望工具能把路径别名和真实副本分开识别，而不是把同一会话误判成多份独立数据。
- 作为要长期治理本地会话数据的人，我希望每次清理都留下备份、回滚日志和执行结果，方便审计和重跑。

## 为什么需要

Codex 会话历史在 Windows 上并不是一个单一文件。配置、历史文本、rollout 转录、SQLite 状态、浏览器或 WebView 旁路状态可能分散在多个位置，cc-switch、WSL 和重解析点还会把同一份数据包装成不同入口。没有统一发现和治理能力时，用户只能手工猜路径、手工删文件，风险高且不可审计。

## 怎么解决

以 `CODEX_HOME` 为中心做只读发现，把会话相关对象统一成一份清单，再按“路径归一化、逻辑去重、人工确认、隔离删除、执行后复扫”的流程治理。能走官方 CLI 的操作走官方 CLI，不能直接确认安全性的本地对象只进入计划和隔离阶段，不默认做不可逆修改。

## 边界

- 不负责 OpenAI 云端 Conversations / Responses 的同步或跨设备统一。
- 默认不直接修改 live SQLite 或 JSONL 内容；这类对象只参与发现、分析和验证。
- 不把浏览器缓存或 WebView 用户数据目录当权威真源；它们只是候选旁路存储。
- 不替代 Codex 官方 CLI；官方已有的归档、删除、诊断语义优先复用。
