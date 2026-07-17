# clone-session-cleanup goal protocol

1. 读取 approved design、checklist、goal-plan 和 goal-state，以仓库事实恢复进度。
2. implementation 按 checklist 顺序执行；行为代码使用 RED → GREEN → VERIFY，例外写明替代证据。
3. 每完成一步立即更新 checklist 和 goal-state ledger；实现门通过后写 `review/ready`。
4. 启动独立 `cs-code-review`；有 blocking 则写 `review/fixing`，修复后重跑 review。
5. review passed 后写 `qa/ready` 并执行 QA；失败写 `qa/fixing`，修完重跑 review 和 QA。
6. QA passed 后写 `acceptance/ready`，按已批准设计逐项验收。
7. 全部通过后写 `complete/passed`，再输出 `CS_FEATURE_GOAL_COMPLETE`。

Goal 模式接管普通阶段 checkpoint，只有以下情况 handoff：需要改变批准范围或公开契约；独立 reviewer 无法完成；同一失败项三轮仍不通过；外部环境缺失导致核心行为无法判断；用户要求暂停或改方向。

handoff 前写 `handoff/blocked`、原因和下一动作，再输出：

```text
CS_FEATURE_GOAL_HANDOFF
Reason: <具体阻塞>
Next: <建议动作>
```

实现必须遵守：不自动删除元数据克隆；来源 ID 仅作证据；同 ID 全路径完整处理；计划和执行双重校验；千条目标批量扫描；14 天按最后活动时间。
