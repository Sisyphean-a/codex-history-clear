---
doc_type: issue-fix
issue: 2026-07-17-filtered-select-all
path: standard
fix_date: 2026-07-17
related: [filtered-select-all-analysis.md]
tags:
  - frontend
  - selection
---

# 筛选结果无法全选 修复记录

## 1. 实际采用方案

采用分析中的方案 A：把现有表头勾选框改为当前筛选结果的全选入口，并支持未选、部分选中和全部选中三种状态。

全选和取消全选只修改当前可见会话。其他筛选结果中保留的手动选择不会被误清除，删除预览和二次确认流程保持不变。

## 2. 改动文件清单

- `frontend/src/history-workspace-contract.ts`：在控制器契约中增加切换全部可见会话的动作。
- `frontend/src/history-workspace-controller-builders.ts`：让动作集合接受新的选择动作。
- `frontend/src/history-workspace-controller.ts`：把当前筛选结果的会话 ID 传给选择状态层。
- `frontend/src/history-workspace-selection.ts`：集中实现逐条选择、建议选择以及选择或取消全部当前可见会话。
- `frontend/src/history-workspace-controller-internals.ts`：将选择动作移出，保持控制器内部文件不超过项目行数上限。
- `frontend/src/history-workspace-panels.tsx`：把全选动作传给会话表格。
- `frontend/src/history-workspace-thread-table.tsx`：把只读表头改为可交互的三态全选框。

## 3. 验证结果

- `npm run build`：通过，TypeScript 检查和 Vite 生产构建成功。
- `go test ./...`：通过，全部 Go 测试和 smoke 测试成功。
- `wails build`：通过，Wails 绑定生成、前端编译和 Windows 桌面应用打包成功。
- `git diff --check`：通过，没有空白符错误。
- 状态链路检查：筛选结果全部选中时再次点击会移除当前可见 ID；部分选中时表头显示中间态；非手动策略点击全选后会切换到手动选择。
- 浏览器交互验证：未执行。该前端依赖 Wails 注入的 Go 接口，Owner 明确要求不启动浏览器验证。

## 4. 遗留事项

无。
