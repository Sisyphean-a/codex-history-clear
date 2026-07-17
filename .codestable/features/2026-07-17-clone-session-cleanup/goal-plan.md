# clone-session-cleanup goal plan

- Feature: `2026-07-17-clone-session-cleanup`
- Design: `.codestable/features/2026-07-17-clone-session-cleanup/clone-session-cleanup-design.md`
- Checklist: `.codestable/features/2026-07-17-clone-session-cleanup/clone-session-cleanup-checklist.yaml`
- Design review: `.codestable/features/2026-07-17-clone-session-cleanup/clone-session-cleanup-design-review.md`
- 用户确认：2026-07-17，用户明确确认 14 天按最后活动时间计算并要求开始实现。

## 执行顺序

1. 用测试锁定元数据克隆目录、告警、可选根和多路径行为，再实现统一目录。
2. 用集成测试锁定文件型克隆的批量计划、删除、验证与回滚，再改造计划编排。
3. 用前端测试锁定元数据克隆筛选和 14 天边界，再接通类型、筛选和告警界面。
4. 运行完整构建、独立代码审查、QA 和验收。

## 验证命令

- `go test ./...`
- `npm --prefix frontend test -- --run`
- `npm --prefix frontend run build`
- `wails build -clean`
- `git diff --check`

## TDD Policy

行为代码默认留下 RED → GREEN → VERIFY 证据。Wails 生成文件和纯样式调整允许 `TDD exception`，替代证据为生成命令、构建和浏览器检查。

## Gate Policy

- 实现完成后必须由独立 Task agent 做代码审查，分别给出 spec 合规和代码质量结论。
- 审查通过后进入 QA；QA 通过后进入 acceptance。
- 需要修改已批准范围、连续三次同项失败或外部环境无法判断核心行为时 handoff。
