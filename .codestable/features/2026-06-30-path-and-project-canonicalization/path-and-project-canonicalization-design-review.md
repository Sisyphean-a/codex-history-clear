---
doc_type: feature-design-review
feature: 2026-06-30-path-and-project-canonicalization
status: passed
reviewed: 2026-06-30
round: 1
---

# path-and-project-canonicalization feature design 审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-06-30-path-and-project-canonicalization/path-and-project-canonicalization-design.md`
- Checklist: `.codestable/features/2026-06-30-path-and-project-canonicalization/path-and-project-canonicalization-checklist.yaml`
- Intent / brainstorm: none
- Roadmap: `.codestable/roadmap/codex-history-manager/codex-history-manager-roadmap.md`
- Related docs: `.codestable/requirements/codex-history-management.md`, `.codestable/requirements/CONTEXT.md`, `.codestable/requirements/adrs/003-go-backend-and-wails2-desktop-shell.md`
- Code facts checked: none

### Independent Review

- Status: local-only
- Detection: local-only
- Provider / agent: none
- Raw output: none
- Merge policy: 未启用独立 reviewer，本轮由本地事实审查定稿
- Gate effect: none

## 2. Design Summary

- Goal: 为后续判重和桌面展示建立稳定路径归一化层
- Key contracts: `canonical_path` / `real_path` 并存、unknown 显式可见、前端不自推路径语义
- Steps: 5 步，风险热点是 WSL / reparse fixture 和 enriched manifest 字段稳定性
- Checks: 7 条，覆盖字段边界、场景和范围守护
- Baseline / validation: `go test ./internal/...`、`npm --prefix frontend run build`、`wails build -clean`

## 3. Findings

### blocking

- none

### important

- none

### nit

- none

### suggestion

- none

### learning

- 把“路径别名识别”和“重复组判定”拆开，能把错误定位限定在归一化层，不让保留本策略背锅。

### praise

- 设计把 unknown 路径保守处理写成硬约束，能有效压住误删前置条件。

## 4. User Review Focus

- 用户需要重点拍板：是否需要在 UI 中额外展示 project label
- implement 需要重点遵守：`canonical_path` 与 `real_path` 必须并存，unknown 不得被静默合并
- code review / QA / acceptance 需要重点复核：fixture 覆盖 WSL / junction / worktree，前端不自行推导路径语义

## 5. Evidence Confidence Ledger

| Check | Verdict | Evidence Class | Basis | Follow-up |
|---|---|---|---|---|
| Acceptance Coverage Matrix | pass | E | design 第 3.3 节覆盖路径收敛、unknown 和构建入口 | none |
| DoD Contract | pass | E | 第 3.4 节包含设计到验收的完整契约 | none |
| Steps and checks traceability | pass | E | checklist 与 design 第 2、3 节可逐条映射 | none |
| Roadmap contract compliance | pass | C | design 严格围绕 roadmap 4.3 字段，不越界进入 delete plan | item2 实现后复核字段命名 |
| Validation and artifacts | pass | E | enriched manifest、截图和命令都已明确 | none |

Summary: E=4, C=1, H=0, H-only core checks=none。

## 6. Residual Risk

- 真实 reparse point 样本可能比文档列出的更多；实现阶段需要优先把未知样本留成 warning 和夹具，而不是扩写猜测规则。

## 7. Verdict

- Status: passed
- Next: 交给用户整体 review；如 design/checklist 有实质修改，回 `cs-feat-design` 修订后重跑 `cs-feat-design-review`
