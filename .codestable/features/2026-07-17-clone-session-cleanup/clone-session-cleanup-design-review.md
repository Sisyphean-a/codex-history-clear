---
doc_type: feature-design-review
feature: 2026-07-17-clone-session-cleanup
status: passed
reviewed: 2026-07-17
round: 3
---

# clone-session-cleanup feature design 审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-17-clone-session-cleanup/clone-session-cleanup-design.md`
- Checklist: `.codestable/features/2026-07-17-clone-session-cleanup/clone-session-cleanup-checklist.yaml`
- Intent / brainstorm: none
- Roadmap: none
- Related docs: `codex-history-management` requirement、ADR-001、ADR-002、CONTEXT
- Code facts checked: history 列表、计划、执行、验证和前端筛选链路

### Independent Review

- Status: completed
- Detection: native-agent
- Provider / agent: `/root/clone_cleanup_design_review`
- Raw output: 三轮独立审查结果已回传主 agent
- Merge policy: 所有 finding 均经代码与文档事实核验；前两轮阻塞和重要项已修订关闭
- Gate effect: none

## 2. Design Summary

- Goal: 让 SQLite 未登记的元数据克隆进入可筛选、可备份、可回滚的删除流程，并增加 14 天筛选。
- Key contracts: 结构化 `cloned_from` 是唯一克隆证据；同 ID 多路径完整处理；计划和执行双重路径校验；批量目标只扫描一次级别。
- Steps: 5 步，覆盖会话事实、删除编排、前端识别、日期筛选和验证。
- Checks: 14 条，覆盖来源保护、路径安全、告警、可选目录和规模风险。
- Baseline / validation: 当前 `go test ./...` 与前端生产构建通过；实现后增加 Vitest、Wails build 和浏览器验证。

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

- 克隆来源证据与内容重复判断必须分开；`cloned_from` 能证明复制关系，但不能证明复制后没有继续对话。

### praise

- 方案没有为克隆文件另开直接删除捷径，继续复用批准、备份、回滚和复扫链路。

## 4. User Review Focus

- 用户需要重点拍板：14 天按会话最后活动时间计算，而不是按 `clone_timestamp` 计算。
- implement 需要重点遵守：统一目录、多路径、批量计划、公开告警和双阶段路径校验。
- code review / QA / acceptance 需要重点复核：来源会话不受影响、千条目标不重复扫描、Wails 告警与筛选可见。

## 5. Evidence Confidence Ledger

| Check | Verdict | Evidence Class | Basis | Follow-up |
|---|---|---|---|---|
| Acceptance Coverage Matrix | pass | E | 核心正反场景逐项映射到 S1-S5 | none |
| DoD Contract | pass | E | Design/Implementation/Review/QA/Acceptance 均有阻塞门槛 | none |
| Steps and checks traceability | pass | E | checklist 与 design 推进策略和契约一致 | none |
| Roadmap contract compliance | n/a | C | 本 feature 非 roadmap 子项 | none |
| Module interface design | pass | C | 统一目录、公开告警、批量计划和错误语义已定义 | implementation 复核实际接口 |
| Validation and artifacts | pass | E | Go、Vitest、frontend、Wails、浏览器证据齐全 | none |

Summary: E=4, C=2, H=0, H-only core checks=none。

## 6. Residual Risk

- 14 天语义需用户确认；文件系统校验到删除仍有极小 TOCTOU 窗口；3000 文件墙钟耗时只作参考，结构性单次扫描证据优先。

## 7. Verdict

- Status: passed
- Next: 交给用户整体 review；确认后把 design 标为 approved 并进入实现。
