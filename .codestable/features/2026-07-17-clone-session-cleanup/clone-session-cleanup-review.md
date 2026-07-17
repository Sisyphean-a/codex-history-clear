---
doc_type: feature-review
feature: 2026-07-17-clone-session-cleanup
status: changes-requested
reviewer: subagent+ocr
reviewed: 2026-07-17
round: 3
---

# clone-session-cleanup 代码审查报告

## 1. Scope And Inputs

- Design、checklist、evidence pack、gate results、DoD results：同 feature 目录对应文件
- Implementation evidence: `clone-session-cleanup-implementation.md`
- Diff basis: 当前工作区全部 dirty 文件均归属本 feature；staged 为空
- Baseline dirty files: none

### Independent Review

- Detection: 原生 Task agent 与 OCR CLI 均可用
- 环节 A 独立隔离 Task agent: native-agent completed
- 环节 B OCR CLI: completed，260 秒
- OCR severity mapping: High/Medium 均经本地代码核验；与设计冲突或不符合实际执行逻辑的项已丢弃
- Merge policy: 两路结果逐条对照目录、计划、备份、状态改写和测试事实合并
- Gate effect: 2 项 blocking、3 项 important 阻塞 QA

## 2. Diff Summary

- 新增：统一会话目录、计划完整性校验、真实 IO 观察器、后端/前端测试和 feature 证据
- 修改：历史列表、删除计划/验证、Wails 类型、克隆/日期筛选和告警界面
- 删除：none
- 风险热点：外部 ID 边界、物理路径身份、缺失 rollout、扫描中断时间、跨平台路径比较

## 3. Adversarial Pass

- 假设的生产 bug：磁盘元数据扩大了原有 ID/路径假设，导致状态误删或同一文件重复删除。
- 主动攻击：短 ID、junction 路径别名、缺失文件、扫描中断、Linux 大小写路径、批准后时序。
- 结果：2 项 blocking、3 项 important；TOCTOU 保留为 residual risk。

## 4. Findings

### blocking

- [ ] R3-REV-001 `internal/history/catalog.go` 文件型克隆接受任意非空 ID。
  - Evidence: 文件型克隆 ID 直接进入目标；全局状态清理按键名是否包含 ID 删除，短 ID `a` 会命中大量无关键。
  - Impact: 删除畸形磁盘克隆可能连带清理无关全局状态。
  - Expected fix scope: 目录接纳层只接受规范 UUID 会话 ID；补短 ID 不得进入列表/计划测试，并把规模夹具改为真实 UUID。
- [ ] R3-REV-002 `internal/history/catalog.go` 只按字面路径去重，同一真实文件的 junction 别名会生成多个删除动作。
  - Evidence: 计划与执行逐字面路径删除；第一条删除后第二条复验失败，SkipBackup 时可能留下部分改写。
  - Impact: 合法根内 junction 别名导致执行失败或无备份模式部分删除。
  - Expected fix scope: 合并时按解析后的真实路径去重，不合并不同真实文件；补物理路径别名测试。

### important

- [ ] R3-REV-003 `internal/history/transcript_validation.go` 对 `Exists: false` 的删除项仍要求文件存在，误伤数据库中 rollout 已丢失的登记会话。
- [ ] R3-REV-004 `internal/history/catalog_support.go` 扫描中断仍返回部分最大时间，可能错误参与 14 天筛选。
- [ ] R3-REV-005 `internal/history/plan_validation.go` 在非 Windows 平台也忽略路径大小写；前端选择项同时缺少溢出策略，生成绑定仍有一处尾随空白。

### nit

none

### suggestion

- 让目录合并、计划和执行共享同一物理路径身份定义。

### learning

- SQLite 真源改为“SQLite + 磁盘”后，原先隐含的 UUID 与路径唯一性假设必须成为显式输入契约。

### praise

- 原始计划、批准计划和当前规范计划三方比对有效阻断批准后篡改。
- 1000 目标测试已在公开调用的真实 IO 边界验证固定扫描次数。

## 5. Test And QA Focus

- QA 必须重点复核：短 ID、正常路径+junction 别名、缺失 rollout、超长行中断、Linux 路径大小写。
- 建议新增或加强：物理路径别名去重后默认备份与 SkipBackup 均只产生一个删除动作。
- 不能靠 review 完全确认：Windows symlink 权限、删除前极小 TOCTOU 窗口。

## 6. Residual Risk

- symlink 用例在本机可能跳过，不能写成已实际覆盖；junction 需 QA 记录。
- 路径复验与删除不是原子 no-follow 操作，默认备份可回滚，SkipBackup 由用户显式承担风险。

## 7. Verdict

- Status: changes-requested
- Next: `cs-feat` implementation review-fix，修复 R3-REV-001 至 R3-REV-005 后重跑独立代码审查。
