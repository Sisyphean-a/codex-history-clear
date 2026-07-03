---
doc_type: goal
goal: cleanup-wizard-ui
status: complete
---

# 清理向导界面改造 goal

## Objective

按 `重构文档.txt` 把当前桌面前端从“运行产物 / manifest / evidence 展示台”改成“安全清理向导”，保留真实删除、备份、回滚和证据导出能力，并在完成后移除该文档。

## Starting Point

- 当前 UI 分成两块：左边偏只读扫描与重复计划预览，右边偏真实历史删除工作区。
- 现有流程能做扫描、建计划、备份、删除、回滚和导出证据，但信息架构太工程化。
- 当前会话列表只有标题、更新时间和目录，缺少大小维度；当前扫描目录也没有显式可切换入口。
- roadmap 里已有 `operator-surface-and-fixtures`，但它关注“把能力串起来”，本轮要把入口改成普通用户一眼能看懂的清理向导。

## Acceptance Criteria

- 顶部区域改成“Codex 历史清理器”，清楚显示扫描目录、扫描按钮和辅助入口。
- 主体布局改成左侧策略栏 + 右侧会话列表 / 计划预览，不再让工程细节占主流程。
- 支持按时间、归档状态、项目目录和大小筛选，并能按策略自动生成建议清理选择。
- 删除前确认口令改成 `CLEAN`，保留只备份、确认清理、删除后回滚。
- `discovery.json`、`manifest-before.json`、`duplicate-groups.json`、`rollback-journal.json`、evidence pack 等能力进入“高级详情 / 调试信息”折叠区。
- `npm --prefix frontend run build` 与相关 `go test` 通过，`重构文档.txt` 删除。

## Non-Goals

- 不删后端能力，不把工具改成云端同步产品。
- 不重做核心删除引擎的数据契约。
- 不扩大到 macOS / Linux 适配。

## Decisions And Assumptions

- 以用户提供的 `重构文档.txt` 作为本轮唯一产品方向输入，不另起新的 brainstorm。
- 复用现有 `operator-surface-and-fixtures` 设计作为“已有能力收口”背景，本轮只重构前端入口与交互，不新增 destructive 语义。
- 为了让“更换目录 / 打开备份目录 / 大小筛选”不是摆设，允许补最小后端绑定与 DTO 字段。

## Current State

- 状态：`complete`
- 相关既有文档：`roadmap/codex-history-manager`、`feature/2026-06-30-operator-surface-and-fixtures`
- 本轮已完成：主流程改成安全清理向导；会话支持全量读取、大小统计、目录切换、策略筛选、`CLEAN` 确认、只备份、真实自动备份开关、回滚与校验报告折叠区。
- 独立功能验收已通过，`重构文档.txt` 可移除。

## Next Action

goal 已完成，无后续动作。
