---
doc_type: feature-review
feature: 2026-06-30-read-only-manifest-baseline
status: passed
reviewer: subagent
reviewed: 2026-06-30
round: 3
---

# read-only-manifest-baseline 代码审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-06-30-read-only-manifest-baseline/read-only-manifest-baseline-design.md`
- Checklist: `.codestable/features/2026-06-30-read-only-manifest-baseline/read-only-manifest-baseline-checklist.yaml`
- Evidence pack: `.codestable/features/2026-06-30-read-only-manifest-baseline/read-only-manifest-baseline-evidence-pack.md`
- Gate results: `.codestable/features/2026-06-30-read-only-manifest-baseline/read-only-manifest-baseline-gate-results.json`
- DoD results: `.codestable/features/2026-06-30-read-only-manifest-baseline/read-only-manifest-baseline-dod-results.json`
- Implementation evidence: 2026-06-30 本地 fresh 复跑 `go test ./...`、`npm --prefix frontend run build`、`wails build -clean`
- Diff basis: linked worktree 内 `git status --short --untracked-files=all`；本 feature 的实现文件相对基线提交为未跟踪新增
- Baseline dirty files: `.codestable/` 下其他 feature / roadmap / goal 文档与生成产物存在既有 dirty；本报告只审 `read-only-manifest-baseline` 的实现文件和本 unit 物料

### Independent Review

- Detection: 原生 Task agent 可用；OCR CLI 不可用
- 环节 A 独立隔离 Task agent: `native-agent completed`
- 环节 B OCR CLI: `not-available`
- OCR severity mapping: High→blocking/important，Medium→nit/suggestion，Low→discarded
- Merge policy: 3 轮独立 reviewer finding 已逐条本地核验；resolved blocking 已修复后重跑 fresh 验证，最终以最新 reviewer `blocking: none` 定稿
- Gate effect: `reviewer: subagent`，满足下游 gate 放行条件

## 2. Diff Summary

- 新增：`app.go`、`main.go`、`scan_binding.go`、`go.mod`、`wails.json`、`internal/discovery/*.go`、`frontend/src/App.tsx`、`frontend/src/App.css`、`frontend/src/style.css`
- 生成 / scaffold：`frontend/wailsjs/**`、`build/**`、`frontend/package*.json`、`frontend/index.html`、`frontend/tsconfig*.json`、`frontend/vite.config.ts`
- 删除：none
- 未跟踪 / staged：实现文件为未跟踪新增；无 staged files
- 风险热点：文件系统只读边界、artifact 落盘安全、CLI 诊断降级、桌面工作区错误投影

## 3. Findings

### blocking

- none

### important

- none

### nit

- [ ] REV-301 `main.go:33`
  - Evidence: 应用启动失败仍走原始 `println`
  - Impact: 不影响只读扫描正确性，但与 design 的结构化诊断约束不完全一致

### suggestion

- [ ] REV-302 `frontend/src/App.tsx:65`、`internal/discovery/roots.go:198`
  - Evidence: 工作区当前展示 `unknownItemsPath`，但不直接展示 unknown count / non-empty 状态
  - Impact: 遇到未分类候选时，操作者可能需要手动打开 `unknown-items.json` 才能感知布局漂移

### learning

- none

### praise

- `internal/discovery/service.go` + `service_test.go` 已把 `run_id` 提升到纳秒级，消除了同秒重复扫描的产物碰撞。
- `internal/discovery/hash.go` 改成流式哈希，避免真实大文件扫描时一次性整读放大内存。
- `internal/discovery/roots.go`、`artifacts.go` 与新增测试一起，把 `outputDir` 越界、预置 artifact 目标复用、未分类候选静默漏报三类 review 问题都收进了显式失败或显式落盘路径。

## 4. Test And QA Focus

- 用真实或夹具 `CODEX_HOME` 跑一次桌面扫描，补齐工作区截图，并保留 `discovery.json`、`manifest-before.json`、`unknown-items.json` 实物证据。
- 做一次 `unknown-items.json` 非空场景，确认操作者能明确意识到“有未分类候选”，而不是只看到 `warnings=0`。
- 在 Windows 上验证 reparse-point / symlink 夹具：预置 artifact 文件为链接、以及 `outputDir` 指向重解析目录，确认不会越界写。
- 覆盖 CLI 降级矩阵：`codex` 不在 PATH、`codex --help` 失败、`codex doctor --json` 失败或返回非法 JSON，核对 `available`、`doctorStatus`、`warnings` 与 UI 文案。
- 复跑非法根目录、`outputDir` 落进 source root 两条失败路径，确认前端只显示显式错误，不显示“扫描成功”。

## 5. Residual Risk

- 当前 evidence pack 还未补入桌面工作区截图和一次真实扫描 JSON artifact 实物；QA 需要补齐。
- artifact 越界保护已由 `O_EXCL` 和普通文件单测覆盖，但 Windows symlink / reparse-point 实夹具仍需 QA 复核。

## 6. Verdict

- Status: passed
- Next: 进入 `cs-feat-qa`
