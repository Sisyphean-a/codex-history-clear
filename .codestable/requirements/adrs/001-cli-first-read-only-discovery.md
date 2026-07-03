---
id: 001
title: 以官方 CLI 和只读扫描作为主控制面
status: accepted
date: 2026-06-30
relates_to: [requirements/codex-history-management]
---

# 以官方 CLI 和只读扫描作为主控制面

## Context

Windows 上的 Codex 本地历史并没有公开、稳定、完整的单一存储契约。研究材料显示，历史信息可能分散在 `history.jsonl`、`sessions/**/rollout-*.jsonl`、`session_index.jsonl`、`state_*.sqlite`、`logs_*.sqlite`，以及浏览器或 WebView 旁路状态里。直接把某一个 SQLite 文件当成唯一真源，既不能覆盖路径映射和索引漂移，也会把 live DB、WAL 和锁争用风险直接暴露给实现层。

## Decision

本项目把官方 CLI 和只读扫描定义为发现与计划阶段的主控制面：

- 会话级治理优先复用 `codex resume`、`codex archive`、`codex delete`、`codex doctor` 这类官方语义。
- 发现与计划阶段的本地文件和数据库只做只读发现、证据采集与计划生成。
- `CODEX_HOME` 及其候选根目录是扫描入口，不把单一数据库路径写死成唯一真源。
- 真实历史删除允许在 approved plan、备份、rollback journal 和执行后复扫都具备时，按显式 destructive 流程直接改写本地 SQLite / JSONL / rollout。

## Consequences

这种控制面在发现阶段更保守，也更容易审计和回放；但一旦进入真实删除，就必须补上本地批量改写、回滚和复扫链路，因为官方 CLI 现有语义不足以覆盖当前 `.codex` 的真实多存储模型。

## Alternatives Considered

- 直接编辑 SQLite 或 JSONL：覆盖面看似更大，但会把 schema 漂移、WAL、一致性和误删风险一起放大。
- 把某一个数据库文件当唯一真源：实现简单，但无法覆盖 `.codex/sqlite` 变体路径、路径别名和索引漂移。
