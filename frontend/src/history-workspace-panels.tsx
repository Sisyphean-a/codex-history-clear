import type {HistoryWorkspaceController} from './history-workspace-controller';
import {HistoryExecutionTable, HistoryPlanTargetTable, HistoryThreadTable} from './history-workspace-tables';
import {
    DataRow,
    Field,
    Icon,
    IconButton,
    MetricRow,
    scanStatusText,
    SectionHeading,
    SelectRow,
} from './history-workspace-ui';
import {ResultPanel} from './workspace';

export function OverviewPanel(props: HistoryWorkspaceController) {
    return (
        <section className="面板 侧栏面板">
            <SectionHeading badgeText={scanStatusText(props)} title="概览"/>
            <div className="概览列表">
                <MetricRow label="总会话" value={String(props.overview.totalSessions)}/>
                <MetricRow label="已归档" value={String(props.overview.archivedSessions)}/>
                <MetricRow label="建议清理" value={String(props.overview.suggestedCount)}/>
                <MetricRow highlight label="可释放空间" value={props.overview.releaseText}/>
                <MetricRow label="最近更新" value={props.overview.latestUpdate}/>
                <MetricRow label="回滚状态" tone="success" value={props.overview.rollbackText}/>
            </div>
        </section>
    );
}

export function ControlPanel(props: HistoryWorkspaceController) {
    return (
        <section className="面板 侧栏面板 控制面板">
            <StrategySection {...props}/>
            <FilterSection {...props}/>
            <SafetySection {...props}/>
        </section>
    );
}

function StrategySection(props: HistoryWorkspaceController) {
    return (
        <section className="侧栏分组">
            <SectionHeading title="清理策略"/>
            <div className="策略切换">
                {['recommended', 'conservative', 'project', 'manual'].map((value) => (
                    <StrategyButton
                        checked={props.strategyState.strategy === value}
                        key={value}
                        label={strategyLabel(value)}
                        onClick={() => props.strategyState.chooseStrategy(value as HistoryWorkspaceController['strategyState']['strategy'])}
                    />
                ))}
            </div>
            {props.strategyState.strategy === 'project' ? (
                <SelectRow
                    aria-label="项目目录"
                    onChange={(event) => props.strategyState.setSelectedProject(event.target.value)}
                    value={props.strategyState.selectedProject}
                >
                    <option value="">选择项目目录</option>
                    {props.projectChoices.map((project) => <option key={project} value={project}>{project}</option>)}
                </SelectRow>
            ) : null}
            <p className="组说明">{strategyRuleText(props.strategyState.strategy, props.strategyState.selectedProject)}</p>
        </section>
    );
}

function FilterSection(props: HistoryWorkspaceController) {
    return (
        <section className="侧栏分组">
            <SectionHeading title="筛选条件"/>
            <div className="筛选列">
                <Field><input className="输入 搜索输入" onChange={(event) => props.filters.setTitleQuery(event.target.value)} placeholder="搜索标题、摘要..." value={props.filters.titleQuery}/></Field>
                <SelectRow aria-label="目录筛选" onChange={(event) => props.filters.setArchivedFilter(event.target.value as typeof props.filters.archivedFilter)} value={props.filters.archivedFilter}>
                    <option value="all">全部状态</option>
                    <option value="archived">仅已归档</option>
                    <option value="active">仅未归档</option>
                </SelectRow>
                <Field>
                    <input className="输入" list="项目目录建议" onChange={(event) => props.filters.setProjectQuery(event.target.value)} placeholder="项目目录" value={props.filters.projectQuery}/>
                    <datalist id="项目目录建议">
                        {props.projectChoices.map((project) => <option key={project} value={project}/>)}
                    </datalist>
                </Field>
                <SelectRow aria-label="时间筛选" onChange={(event) => props.filters.setAgeFilter(event.target.value as typeof props.filters.ageFilter)} value={props.filters.ageFilter}>
                    <option value="any">全部时间</option>
                    <option value="30">30 天前</option>
                    <option value="90">90 天前</option>
                    <option value="180">180 天前</option>
                </SelectRow>
                <SelectRow aria-label="大小筛选" onChange={(event) => props.filters.setSizeFilter(event.target.value as typeof props.filters.sizeFilter)} value={props.filters.sizeFilter}>
                    <option value="any">全部大小</option>
                    <option value="1">1 MB 以上</option>
                    <option value="10">10 MB 以上</option>
                    <option value="50">50 MB 以上</option>
                </SelectRow>
            </div>
        </section>
    );
}

function SafetySection(props: HistoryWorkspaceController) {
    return (
        <section className="侧栏分组">
            <SectionHeading title="安全选项"/>
            <div className="安全列">
                <CheckboxField checked={props.strategyState.autoBackup} label="删除前自动备份" onChange={props.strategyState.setAutoBackup}/>
                <CheckboxField checked={props.strategyState.generateReport} label="生成校验报告" onChange={props.strategyState.setGenerateReport}/>
                <CheckboxField checked={props.strategyState.keepRecent} label="保留最近 30 天" onChange={props.strategyState.setKeepRecent}/>
                <CheckboxField checked={props.strategyState.skipUnknown} label="跳过未知结构" onChange={props.strategyState.setSkipUnknown}/>
            </div>
        </section>
    );
}

export function SessionPanel(props: HistoryWorkspaceController) {
    const loadState = !props.listResult ? '等待扫描' : props.listResult.summary.hasMore ? `仅载入前 ${props.listResult.summary.limit} 条` : '已载入全部';
    return (
        <section className="面板 列表面板">
            <header className="列表头">
                <div>
                    <h2>会话列表</h2>
                    <p>显示建议清理项，可手动调整</p>
                </div>
                <div className="列表工具">
                    <IconButton disabled={props.loading === 'scan'} icon="refresh" onClick={props.actions.startScan} title="重新扫描"/>
                    <SelectRow aria-label="列表状态筛选" onChange={(event) => props.filters.setArchivedFilter(event.target.value as typeof props.filters.archivedFilter)} value={props.filters.archivedFilter}>
                        <option value="all">全部状态</option>
                        <option value="archived">已归档</option>
                        <option value="active">未归档</option>
                    </SelectRow>
                    <div className="视图切换">
                        <IconButton active={props.strategyState.strategy === 'recommended'} icon="spark" onClick={() => props.strategyState.chooseStrategy('recommended')} title="推荐模式"/>
                        <IconButton active={props.strategyState.strategy === 'manual'} icon="list" onClick={() => props.strategyState.chooseStrategy('manual')} title="手动模式"/>
                    </div>
                </div>
            </header>
            <HistoryThreadTable items={props.visibleThreads} selectedIds={props.selectedIds} toggleSelected={props.actions.toggleSelected}/>
            <footer className="列表底栏">
                <strong>已选择 {props.selectedIds.length} 条会话</strong>
                <span>{loadState}</span>
            </footer>
        </section>
    );
}

export function PlanPanel(props: HistoryWorkspaceController) {
    const plan = props.planState.planResult;
    const execution = props.planState.executionResult;
    const statusText = execution ? execution.verification.summary : plan ? '待确认' : '未生成预览';
    return (
        <aside className="面板 执行面板">
            <header className="执行头">
                <h2>本次清理计划</h2>
                <p>基于当前筛选与选中项自动生成</p>
            </header>
            <SummaryCard {...props}/>
            <ConfirmCard {...props}/>
            <div className="计划表区域">
                {plan ? <HistoryPlanTargetTable targets={plan.targets}/> : <div className="空态 小号">未生成预览</div>}
            </div>
            {execution ? (
                <section className="执行后操作">
                    <div className="次信息">
                        <span>{execution.backups.length} 个备份</span>
                        <span>{execution.verification.remainingReferences.length} 个残留引用</span>
                        <span>{statusText}</span>
                    </div>
                    <div className="操作列">
                        <button className="次按钮" disabled={props.loading === 'rollback' || execution.rollbackJournalPath === ''} onClick={props.actions.rollbackPlan} type="button">按备份恢复</button>
                        <button className="次按钮" disabled={props.loading === 'export'} onClick={props.actions.exportEvidencePack} type="button">导出报告</button>
                    </div>
                </section>
            ) : null}
        </aside>
    );
}

function SummaryCard(props: HistoryWorkspaceController) {
    const plan = props.planState.planResult;
    const targetCount = plan?.summary.targetCount ?? props.selectedIds.length;
    const projectText = props.planState.affectedProjects.length === 0 ? '—' : `${props.planState.affectedProjects.length} 个`;
    return (
        <section className="摘要卡">
            <MetricRow large label="将删除" value={`${targetCount} 条会话`}/>
            <MetricRow large label="预计释放" value={props.overview.releaseText}/>
            <MetricRow large label="涉及项目" value={projectText}/>
            <DataRow code label="备份位置" value={props.planState.backupPath || '未启用自动备份'}/>
            <MetricRow label="回滚支持" tone="success" value={props.overview.rollbackText}/>
        </section>
    );
}

function ConfirmCard(props: HistoryWorkspaceController) {
    const plan = props.planState.planResult;
    const execution = props.planState.executionResult;
    return (
        <section className="确认卡">
            <div className="确认说明">
                <strong>确认方式</strong>
                <p>输入 {props.confirmPhrase} 以启用操作</p>
            </div>
            <input className="输入 确认输入" onChange={(event) => props.planState.setConfirmText(event.target.value)} placeholder={`输入 ${props.confirmPhrase} 以确认`} value={props.planState.confirmText}/>
            <div className="执行区">
                <button className="主按钮" disabled={props.selectedIds.length === 0 || props.loading === 'plan'} onClick={props.actions.buildPlan} type="button">{props.loading === 'plan' ? '生成中' : plan ? '刷新预览' : '生成预览'}</button>
                {plan && !execution ? (
                    <div className="操作列">
                        <button className="次按钮" disabled={props.loading === 'execute'} onClick={props.actions.backupPlan} type="button">{props.loading === 'execute' ? '处理中' : '只备份不删除'}</button>
                        <button className="危险按钮" disabled={!props.planState.canConfirm || props.loading === 'execute'} onClick={props.actions.executePlan} type="button">{props.loading === 'execute' ? '清理中' : '确认并清理'}</button>
                    </div>
                ) : null}
                <p className="确认尾注">操作不可逆，请谨慎确认</p>
            </div>
        </section>
    );
}

export function AdvancedDetails(props: HistoryWorkspaceController) {
    return (
        <details className="高级折叠">
            <summary><Icon path="M5.5 4.5 9 8l-3.5 3.5" className="折叠图标"/>高级详情</summary>
            <div className="高级网格">
                <article className="面板">
                    <header className="面板头"><h2>扫描产物</h2></header>
                    <ResultPanel workspace={props.scanWorkspace}/>
                </article>
                <article className="面板">
                    <header className="面板头"><h2>执行记录</h2></header>
                    {props.planState.executionResult ? <HistoryExecutionTable result={props.planState.executionResult}/> : <div className="空态 小号">未执行</div>}
                    {props.planState.evidencePackResult ? <DataRow code label="报告路径" value={props.planState.evidencePackResult.evidencePackPath}/> : null}
                    {props.planState.rollbackResult ? <DataRow code label="恢复记录" value={props.planState.rollbackResult.journalPath}/> : null}
                </article>
            </div>
        </details>
    );
}

function StrategyButton({checked, label, onClick}: { checked: boolean; label: string; onClick: () => void }) {
    return <button aria-pressed={checked} className={`策略按钮 ${checked ? '选中' : ''}`} onClick={onClick} type="button">{label}</button>;
}

function CheckboxField({checked, label, onChange}: { checked: boolean; label: string; onChange: (value: boolean) => void }) {
    return <label className="勾选项"><input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox"/><span>{label}</span></label>;
}

function strategyRuleText(strategy: HistoryWorkspaceController['strategyState']['strategy'], selectedProject: string) {
    if (strategy === 'recommended') return '推荐清理 90 天前的已归档会话，风险低。';
    if (strategy === 'conservative') return '保守模式只关注更久远的历史会话。';
    if (strategy === 'project') return selectedProject ? `当前只处理项目：${selectedProject}` : '按项目批量处理同一目录下的会话。';
    return '手动模式下，你可以在中间列表里逐条勾选。';
}

function strategyLabel(value: string) {
    if (value === 'recommended') return '推荐';
    if (value === 'conservative') return '保守';
    if (value === 'project') return '按项目';
    return '手动';
}
