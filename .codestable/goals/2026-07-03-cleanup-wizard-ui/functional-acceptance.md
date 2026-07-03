---
doc_type: functional-acceptance
goal: cleanup-wizard-ui
verdict: pass
reviewer: subagent
reviewer_name: Pauli
task_agent_role: explorer
iteration: 1
updated_at: "2026-07-03"
---

# 功能验收

## Reviewer

- reviewer：`Pauli`
- task agent role：`explorer`
- scope：按 `重构文档.txt` 对“安全清理向导”做只读功能验收

## Acceptance Checks

- 顶部区域是否改成“Codex 历史清理器”，并展示扫描目录、扫描入口和辅助入口。
- 主界面是否改成左侧策略栏 + 右侧会话列表 / 计划预览。
- 会话是否支持按时间、归档状态、项目目录和大小筛选，并显示人能看懂的状态标签。
- `CLEAN` 是否只用于真正删除，“只备份不删除”是否独立可用。
- discovery、manifest、恢复记录、校验报告等工程细节是否默认收进高级详情。
- 会话读取是否已消除前端硬上限；“删除前自动备份”是否已经是后端真实能力。

## Functional Evidence

- 主流程结构、按钮与折叠区验收通过：`frontend/src/history-workspace-view.tsx`
- 全量会话读取链路验收通过：`frontend/src/history-workspace-api.ts`、`internal/history/list.go`、`internal/history/service.go`
- 自动备份真开关验收通过：`frontend/src/history-workspace-controller-internals.ts`、`internal/history/execute.go`、`internal/history/execute_backup.go`
- 运行验证通过：`npm --prefix frontend run build`、`go test ./...`、`wails build -clean`

## Verdict

`pass`

## Residual Risks

- 未做 GUI 实机截图，只基于代码路径和构建/测试证据验收。
- 自动备份关闭后会失去恢复点，这是产品允许的真实行为，已通过主流程文案和风险提示显式说明。

## Follow-up

- 无。最终结果对应 `iterations/001.md`。
