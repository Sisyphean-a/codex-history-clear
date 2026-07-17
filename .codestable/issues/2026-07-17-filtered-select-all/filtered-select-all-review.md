---
doc_type: issue-review
issue: 2026-07-17-filtered-select-all
status: passed
reviewer: subagent+ocr
reviewed: 2026-07-17
round: 2
---

# filtered-select-all 代码审查报告

## 1. Scope And Inputs

- Design: `.codestable/issues/2026-07-17-filtered-select-all/filtered-select-all-analysis.md`
- Checklist: none
- Evidence pack: none
- Gate results: `npm run build`、`go test ./...`、`wails build`、`git diff --check` 均通过
- DoD results: none
- Implementation evidence: issue fix-note 和当前对话中的构建结果
- Diff basis: 当前工作区 7 个前端源码文件及本 issue 文档
- Baseline dirty files: none

### Independent Review

- Detection: 原生 Codex Task agent 可用；OCR CLI 可用且连接测试通过。
- 环节 A 独立隔离 Task agent: native-agent + completed
- 环节 B OCR CLI: completed
- OCR severity mapping: High→blocking/important，Medium→nit/suggestion，Low→discarded
- Merge policy: 两路结果均已逐条按仓库事实核验后合并。
- Gate effect: none

## 2. Diff Summary

- 新增：`frontend/src/history-workspace-selection.ts` 和本 issue 文档
- 修改：前端控制器契约、动作集合、控制器接线、控制器内部、会话面板和会话表格
- 删除：none
- 未跟踪 / staged：新增文件未跟踪；没有 staged 文件
- 风险热点：用户可见的列表选择状态；不涉及后端删除逻辑、权限或持久化

## 3. Adversarial Pass

- 假设的生产 bug：筛选外仍有选择时，表头可能错误显示部分选中或取消错误范围。
- 主动攻击过的反例：空结果、部分选中、全部选中、筛选外选择保留、非手动策略转手动、计划生成期间改变选择。
- 结果：选择集合按当前可见会话派生，全选动作只增删当前可见 ID；没有升级为 finding。计划生成期间改变选择属于既有时序风险，留给残余风险。

## 4. Findings

### blocking

none

### important

none。首轮发现控制器内部文件达到 301 行；选择动作拆分后原文件 259 行、新文件 47 行，复核已关闭。

### nit

none

### suggestion

none。OCR 提出的“隐藏选中项导致表头误显示半选”已驳回：`selectedIds` 由当前 `visibleThreads` 派生，不包含筛选外 ID。

### learning

- 表格三态必须基于当前可见选择集合，批量增删则保留筛选外的手动选择集合。

### praise

- 全选与取消全选复用现有手动选择模型，没有绕过删除预览和二次确认。

## 5. Test And QA Focus

- QA 必须重点复核：“30 天前”等筛选下的全选、取消全选和部分选中三态。
- Evidence pack residual risks / gate warnings：浏览器交互验证按 Owner 指示未执行。
- 建议新增或加强的测试：后续可为选择集合转换补纯函数单测，并为表头三态补组件测试。
- 不能靠 review 完全确认的点：真实桌面界面中的点击手感，以及计划生成期间改变选择的时序表现。

## 6. Residual Risk

- 当前仓库没有前端行为测试，且未做浏览器交互验证；已用 TypeScript 构建和 Wails 完整桌面构建覆盖类型与集成打包风险。
- 计划生成期间仍允许改变选择是既有行为，本次未扩大处理范围；如真实复现旧选择预览，应另开 issue。

## 7. Verdict

- Status: passed
- Next: 回到 issue 修复流程完成 gate 和交付。
