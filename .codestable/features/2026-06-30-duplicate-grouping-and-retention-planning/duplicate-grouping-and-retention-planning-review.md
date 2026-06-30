---
doc_type: feature-review
feature: 2026-06-30-duplicate-grouping-and-retention-planning
status: changes-requested
reviewer: self
reviewed: 2026-06-30
round: 1
---

# duplicate-grouping-and-retention-planning 代码审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-06-30-duplicate-grouping-and-retention-planning/duplicate-grouping-and-retention-planning-design.md`
- Checklist: `.codestable/features/2026-06-30-duplicate-grouping-and-retention-planning/duplicate-grouping-and-retention-planning-checklist.yaml`
- Implementation evidence: 提交 `986df0b feat(planning): 实现重复分组与删除计划功能`；人工运行产物 `C:\Users\xiakn\AppData\Local\Temp\codex-history-manager\runs\20260630-134610-279401100\{manifest-before,duplicate-groups,delete-plan,unknown-items}.json`
- Diff basis: 工作区 clean，本轮按最近实现提交 `986df0b` 做归因审查
- Baseline dirty files: none

### Independent Review

- Status: local-only
- Detection: local-review-with-agent-cli-available
- Provider / agent: none
- Raw output: none
- Merge policy: Paseo 不可用，按本地仓库事实独立定稿
- Gate effect: none

## 2. Diff Summary

- 新增：`internal/planning/*`、`plan_binding.go`、`plan_binding_test.go`、`frontend/src/workspace.tsx`、`frontend/src/workspace-types.ts`
- 修改：`app.go`、`frontend/src/App.tsx`、`frontend/src/App.css`、`frontend/wailsjs/go/*`、feature checklist / attention
- 删除：none
- 未跟踪 / staged：none
- 风险热点：跨模块数据契约、重复分组语义、保留本排序依据、只读扫描到计划生成的端到端链路

## 3. Findings

### blocking

- [ ] REV-001 `internal/planning/service.go:14` `internal/discovery/manifest.go:27` `internal/planning/grouping.go:192` ` .codestable/features/2026-06-30-path-and-project-canonicalization/path-and-project-canonicalization-checklist.yaml:4` 规划层在前置归一化能力尚未实现时，直接消费原始 `manifest-before.json`，导致真实数据路径拿不到分组所需的会话与路径证据。
  - Evidence: `BuildDeletePlan()` 直接读取扫描阶段产出的 `manifest-before.json`；当前 discovery 只把 `CanonicalPath` 原样写成 `item.Path`、把 `CwdNorm` 固定成空字符串，且不填 `SessionUID/ThreadUID`；`groupKeyFor()` 在这些字段缺失时退化成 `storageKind + basename + contentHash`。同时，直接依赖的 `path-and-project-canonicalization` checklist 仍是全 `pending`。这和 design/roadmap 要求“先有 enriched manifest，再做 grouping/planning”不一致。最新真实运行 `20260630-134610-279401100` 里 `manifest-before.json` 共 188 条记录，全部落在 `content_hash_only` 路径，最终 `duplicate-groups.json` 为 0 组、`delete-plan.json` 为空。
  - Impact: 核心验收项“同一逻辑会话的多入口记录进入同组”在真实 `.codex` 数据上并未被证明成立，当前 feature 进入 QA 只会得到一个“能跑但永远分不出组”的假阳性状态。
  - Expected fix scope: 让 planning 明确消费归一化后的 enriched manifest，或在前置 feature 落地前回退本 feature 的完成状态；同时补真实输入链路的证据，不要继续以 raw manifest 作为完成态。

- [ ] REV-002 `internal/discovery/manifest.go:68` `internal/planning/grouping.go:60` `internal/planning/ranking.go:53` `internal/planning/service_test.go:27` 当前实现宣称支持“CLI 可见记录优先保留”，但生产链路从未产出 `cli-visible` 证据，这条排序规则在真实扫描中是死代码，测试却用手写 fixture 把它伪造成已覆盖。
  - Evidence: discovery 的 `evidenceFor()` 只会生成 `history-file`、`rollout-file`、`archived-rollout-file`、`sqlite-file`；planning 端把 `hasEvidence(record, "cli-visible")` 作为最高优先级排序与 reason code 来源；`service_test.go` 又直接构造了带 `"cli-visible"` 的 `ManifestRecord`。这意味着单测验证的是“虚构输入下的排序器”，不是实际扫描结果下的保留本策略。
  - Impact: 保留本选择与 `reasonCode`/`reason` 会在真实运行时偏离 ADR 001 和设计里声明的 CLI-first 倾向，后续执行层若据此做 archive/quarantine，将缺少可靠的权威来源判断。
  - Expected fix scope: 要么在 discovery/归一化链路里真实产出 CLI 可见性证据并补端到端覆盖；要么在证据未落地前移除这条优先级与文案，避免前端展示出并不存在的判定依据。

### important

- [ ] REV-003 `internal/planning/service_test.go:25` 当前测试只覆盖手写 `ManifestRecord`，没有任何 `RunReadOnlyScan -> BuildDeletePlan` 的集成用例，导致 `go test ./internal/...` 通过并不能证明真实 `.codex` 输入可用。
  - Evidence: 三个 planning 测试都通过 `manifestRecord()` 注入 `SessionUID`、`CwdNorm`、`RealPath` 和自定义 `Evidence`，而这些字段在真实 discovery 输出里目前并不成立。
  - Impact: 这次回归之所以能在本地构建、单测全部绿色的情况下，仍让真实运行得到 `0` 个重复组，根因就是测试边界停在了算法内部，没有覆盖扫描到规划的接缝。
  - Expected fix scope: 增加至少一条集成测试，用 discovery fixture 真正生成 `manifest-before.json` 再喂给 planning；如果短期必须用合成输入，也要单独补一条断言“当前 raw manifest 不足以满足分组契约”的守门测试。

### nit

- none

### suggestion

- 当前工作台已经把 `unknownCount` 作为核心指标暴露出来，后续实现可以考虑把 `unknown-items.json` 的摘要也放进只读复核界面，避免操作者只能看到一个大数字却无法判断哪些 unknown 与历史治理相关。

### learning

- 这次实现里的 planning 单测更像“决策引擎单测”，不是“治理链路验收证据”。只要输入 schema 还没稳定，单测绿并不等于 feature 已经具备可上线的治理价值。

### praise

- 前端保持了 `approved=false` 的只读复核边界，没有让桌面工作区直接写回计划真值，这点和两阶段删除 ADR 是一致的。

## 4. Test And QA Focus

- QA 必须重点复核：用真实 `.codex` 样本再次跑 `RunReadOnlyScan -> BuildDeletePlan`，确认是否能得到至少一组非空 `duplicate_group`；补完归一化后再复核 path-alias 与 physical-copy 是否被区分。
- 建议新增或加强的测试：`RunReadOnlyScan` 输出喂给 planning 的集成测试；CLI-visible 证据链路测试；一组“文件名不同但逻辑同会话”的样本。
- 不能靠 review 完全确认的点：cc-switch 产生的映射对象在真实环境里到底表现为路径别名、物理复制还是索引漂移，当前仓库还没有对应 fixture。

## 5. Residual Risk

- 最新真实运行里 `unknown-items.json` 有 543 条，其中绝大多数来自 `.tmp/plugins`、`plugins/cache` 等非会话对象。即便本轮 blocking 修完，若 discovery 端不继续收窄 unknown 范围或增强复核界面，操作者仍然很难判断哪些 unknown 值得关注。

## 6. Verdict

- Status: changes-requested
- Next: 回 `cs-feat-impl` 走 review-fix，只修本报告的 blocking findings；修完后重跑 `cs-code-review`，不要直接进入 `cs-feat-qa`
