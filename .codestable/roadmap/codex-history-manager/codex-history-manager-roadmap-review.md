---
doc_type: roadmap-review
roadmap: codex-history-manager
status: passed
reviewed: 2026-06-30
round: 2
---

# codex-history-manager roadmap 审查报告

## 1. Scope And Inputs

- Roadmap: `.codestable/roadmap/codex-history-manager/codex-history-manager-roadmap.md`
- Items: `.codestable/roadmap/codex-history-manager/codex-history-manager-items.yaml`
- Related docs: `.codestable/requirements/codex-history-management.md`, `.codestable/requirements/CONTEXT.md`, `.codestable/requirements/adrs/001-cli-first-read-only-discovery.md`, `.codestable/requirements/adrs/002-reversible-two-phase-deletion.md`, `.codestable/requirements/adrs/003-go-backend-and-wails2-desktop-shell.md`
- Code facts checked: none

### Independent Review

- Status: local-only
- Detection: local-only
- Provider / agent: none
- Raw output: none
- Merge policy: 本轮仅做本地审查，未启用独立 reviewer
- Gate effect: none

## 2. Roadmap Summary

- Goal completion signal: 建立一条以 Go 后端和 Wails2 桌面壳层承载的 Windows 本地历史治理链
- Module split: Wails2 Desktop Shell / Discovery / Canonicalization & Planning / Execution & Verification 四层
- Interface contracts: 已定义桌面扫描 DTO、`discovery.json`、`manifest-before.json`、`delete-plan.json`、`JobEvent`、`rollback-journal.json`
- Items: 6 条，`read-only-manifest-baseline` 为 minimal loop，风险热点集中在路径别名、live SQLite 和桌面壳层边界
- Dependency shape: DAG

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

- 先把桌面壳层 DTO 和作业事件流定死，能避免后续 feature 把前端做成直接操纵系统路径的“胖绑定层”。

### praise

- 先定共享 schema 和桌面壳层边界再拆 feature，避免后续各条 feature 各自发明 manifest、delete-plan 和 UI 绑定协议。

## 4. User Review Focus

- 用户需要重点拍板：默认是否开启浏览器旁路扫描、冷静期长度、保留本默认策略，以及是否接受 Windows-first + Wails2 的交付边界
- 后续 feature-design 需要重点复核：`delete-plan.json` 的动作边界、路径归一化规则、CLI 不可用时的降级策略、Wails2 绑定层不得越权访问系统路径
- 不能靠 roadmap review 完全确认的点：真实客户端版本下的路径变体、SQLite 样本差异，以及初始化模板落地后的前端脚本细节

## 5. Evidence Confidence Ledger

| Check | Verdict | Evidence Class | Basis | Follow-up |
|---|---|---|---|---|
| Granularity Gate | pass | E | roadmap 第 2 节显式说明为何不是 single feature / brainstorm | none |
| Goal Coverage Matrix | pass | E | roadmap 第 5 节矩阵覆盖桌面壳层与治理链路的核心完成信号 | none |
| DAG and minimal loop | pass | E | items.yaml 依赖无环且仅一条 `minimal_loop: true` | none |
| Interface contract usability | pass | C | roadmap 第 4 节已把桌面 DTO、事件流和共享产物写成稳定 schema | 第一条落地后用真实样本和 Wails2 scaffold 复核字段稳定性 |

Summary: E=3, C=1, H=0, H-only core checks=none。

## 6. Residual Risk

- 研究材料覆盖的是当前已知实现事实，不是长期稳定 API；第一条 feature 必须把未知对象和路径变体显式记录出来。
- 当前仓库还没有真实代码、Wails2 scaffold 或样本夹具；第一条 feature 必须同时建立前端验证命令和最小 smoke 入口。
- 当前 git 仓库没有 `HEAD` 提交；真正生成 goal 执行包前必须先补初始基线，否则 `goal-state.yaml` 无法合法落盘。

## 7. Verdict

- Status: passed
- Next: 交给用户 review；如 roadmap 实质修改，回 `cs-roadmap` 修订后重跑 `cs-roadmap-review`
