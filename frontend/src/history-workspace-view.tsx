import type {ReactNode, SelectHTMLAttributes} from 'react';
import type {HistoryWorkspaceController} from './history-workspace-controller';
import {HistoryExecutionTable, HistoryPlanTargetTable, HistoryThreadTable} from './history-workspace-tables';
import {ResultPanel} from './workspace';

export function HistoryWorkspaceView(props: HistoryWorkspaceController) {
    return (
        <article className="工具壳">
            <ToolbarPanel {...props}/>
            {props.error ? <div className="错误面板">{props.error}</div> : null}
            <section className="主工作区">
                <aside className="工具侧栏">
                    <OverviewPanel {...props}/>
                    <ControlPanel {...props}/>
                </aside>
                <SessionPanel {...props}/>
                <PlanPanel {...props}/>
            </section>
            <AdvancedDetails {...props}/>
        </article>
    );
}

function ToolbarPanel(props: HistoryWorkspaceController) {
    const buttonText = props.scanWorkspace.kind === 'idle' ? '开始扫描' : '重新扫描';
    const rootPath = props.workspaceConfig?.codexHome ?? '读取中';
    return (
        <header className="面板 工具栏">
            <div className="标题栏">
                <div className="标题簇">
                    <h1>历史清理</h1>
                    <div className="工具说明">
                        <span>目录</span>
                        <code title={rootPath}>{rootPath}</code>
                    </div>
                </div>
                <div className="按钮组">
                    <button className="主按钮" disabled={props.loading === 'scan'} onClick={props.actions.startScan} type="button">
                        {props.loading === 'scan' ? '扫描中' : buttonText}
                    </button>
                    <button className="次按钮" disabled={props.loading === 'directory'} onClick={props.actions.changeDirectory} type="button">
                        更换目录
                    </button>
                    <button className="次按钮" onClick={props.actions.openBackupDirectory} type="button">
                        打开备份目录
                    </button>
                </div>
            </div>
        </header>
    );
}

function OverviewPanel(props: HistoryWorkspaceController) {
    return (
        <article className="面板 概览面板">
            <header className="面板头"><h2>概览</h2></header>
            <div className="概览网格">
                <DataRow label="总会话" value={String(props.overview.totalSessions)}/>
                <DataRow label="已归档" value={String(props.overview.archivedSessions)}/>
                <DataRow label="待处理" value={String(props.overview.suggestedCount)}/>
                <DataRow label="释放" value={props.overview.releaseText}/>
                <DataRow label="最近更新" value={props.overview.latestUpdate}/>
                <DataRow label="回滚" value={props.overview.rollbackText}/>
            </div>
        </article>
    );
}

function ControlPanel(props: HistoryWorkspaceController) {
    return (
        <article className="面板 控制面板">
            <section className="控制分组">
                <div className="分组头">
                    <h2>选择范围</h2>
                    <span className="说明行">{strategyRuleText(props.strategyState.strategy, props.strategyState.selectedProject)}</span>
                </div>
                <div className="策略切换">
                    <StrategyButton checked={props.strategyState.strategy === 'recommended'} label="推荐" onClick={() => props.strategyState.chooseStrategy('recommended')}/>
                    <StrategyButton checked={props.strategyState.strategy === 'conservative'} label="保守" onClick={() => props.strategyState.chooseStrategy('conservative')}/>
                    <StrategyButton checked={props.strategyState.strategy === 'project'} label="按项目" onClick={() => props.strategyState.chooseStrategy('project')}/>
                    <StrategyButton checked={props.strategyState.strategy === 'manual'} label="手动" onClick={() => props.strategyState.chooseStrategy('manual')}/>
                </div>
                {props.strategyState.strategy === 'project' ? (
                    <SelectRow label="项目目录" onChange={(event) => props.strategyState.setSelectedProject(event.target.value)} value={props.strategyState.selectedProject}>
                        <option value="">选择项目目录</option>
                        {props.projectChoices.map((project) => <option key={project} value={project}>{project}</option>)}
                    </SelectRow>
                ) : null}
            </section>
            <section className="控制分组">
                <div className="分组头"><h2>筛选条件</h2></div>
                <div className="筛选网格">
                    <Field label="内容">
                        <input className="输入" onChange={(event) => props.filters.setTitleQuery(event.target.value)} placeholder="标题、摘要、首条消息" value={props.filters.titleQuery}/>
                    </Field>
                    <Field label="目录">
                        <input className="输入" onChange={(event) => props.filters.setProjectQuery(event.target.value)} placeholder="项目目录" value={props.filters.projectQuery}/>
                    </Field>
                    <SelectRow label="时间" onChange={(event) => props.filters.setAgeFilter(event.target.value as typeof props.filters.ageFilter)} value={props.filters.ageFilter}>
                        <option value="any">全部</option>
                        <option value="30">30 天前</option>
                        <option value="90">90 天前</option>
                        <option value="180">180 天前</option>
                    </SelectRow>
                    <SelectRow label="归档" onChange={(event) => props.filters.setArchivedFilter(event.target.value as typeof props.filters.archivedFilter)} value={props.filters.archivedFilter}>
                        <option value="all">全部</option>
                        <option value="archived">已归档</option>
                        <option value="active">未归档</option>
                    </SelectRow>
                    <SelectRow label="大小" onChange={(event) => props.filters.setSizeFilter(event.target.value as typeof props.filters.sizeFilter)} value={props.filters.sizeFilter}>
                        <option value="any">全部</option>
                        <option value="1">1 MB 以上</option>
                        <option value="10">10 MB 以上</option>
                        <option value="50">50 MB 以上</option>
                    </SelectRow>
                </div>
            </section>
            <section className="控制分组">
                <div className="分组头"><h2>执行选项</h2></div>
                <div className="选项网格">
                    <CheckboxField checked={props.strategyState.autoBackup} label="删除前自动备份" onChange={props.strategyState.setAutoBackup}/>
                    <CheckboxField checked={props.strategyState.generateReport} label="生成校验报告" onChange={props.strategyState.setGenerateReport}/>
                    <CheckboxField checked={props.strategyState.keepRecent} label="保留最近 30 天" onChange={props.strategyState.setKeepRecent}/>
                    <CheckboxField checked={props.strategyState.skipUnknown} label="跳过未知结构" onChange={props.strategyState.setSkipUnknown}/>
                </div>
            </section>
        </article>
    );
}

function SessionPanel(props: HistoryWorkspaceController) {
    const loadState = !props.listResult
        ? '等待扫描'
        : props.listResult.summary.hasMore
            ? `仅载入前 ${props.listResult.summary.limit} 条`
            : '已载入全部';
    return (
        <article className="面板 列表面板">
            <header className="面板头">
                <div>
                    <h2>会话列表</h2>
                    <div className="次信息">
                        <span>{props.visibleThreads.length} 条结果</span>
                        <span>{props.selectedIds.length} 条待处理</span>
                        <span>{loadState}</span>
                    </div>
                </div>
            </header>
            <HistoryThreadTable items={props.visibleThreads} selectedIds={props.selectedIds} toggleSelected={props.actions.toggleSelected}/>
        </article>
    );
}

function PlanPanel(props: HistoryWorkspaceController) {
    const plan = props.planState.planResult;
    const execution = props.planState.executionResult;
    const riskNotes = props.planState.riskNotes.filter((risk) => !risk.startsWith('本次按默认安全策略执行'));
    const buildPreviewText = props.loading === 'plan' ? '生成中' : plan ? '刷新预览' : '生成预览';
    const backupText = props.loading === 'execute' ? '处理中' : '只备份';
    const executeText = props.loading === 'execute' ? '清理中' : '确认清理';
    const projectText = props.planState.affectedProjects.length === 0 ? '—' : props.planState.affectedProjects.join('、');
    const backupPath = props.planState.backupPath || '未启用自动备份';
    const statusText = execution ? execution.verification.summary : plan ? '待确认' : '未生成预览';
    return (
        <aside className="面板 计划面板">
            <header className="面板头">
                <div>
                    <h2>执行面板</h2>
                    <div className="次信息">
                        <span>{plan ? `预览 ${plan.summary.targetCount} 条会话` : '未生成预览'}</span>
                        <span>{statusText}</span>
                    </div>
                </div>
            </header>
            <div className="数据列 摘要数据">
                <DataRow label="预览目标" value={plan ? `${plan.summary.targetCount} 条 / ${plan.summary.storeCount} 处存储` : '—'}/>
                <DataRow label="涉及项目" value={projectText}/>
                <DataRow code label="备份位置" value={backupPath}/>
                <DataRow label="计划提示" value={plan ? `${plan.summary.warningCount} 条` : '—'}/>
            </div>
            {props.selectedIds.length > 0 && riskNotes.length > 0 ? (
                <div className="告警列">
                    {riskNotes.map((risk) => <div className="告警项" key={risk}>{risk}</div>)}
                </div>
            ) : null}
            {plan ? <HistoryPlanTargetTable targets={plan.targets}/> : <div className="空态 小号">未生成预览</div>}
            <section className="执行区">
                <button className="主按钮" disabled={props.selectedIds.length === 0 || props.loading === 'plan'} onClick={props.actions.buildPlan} type="button">
                    {buildPreviewText}
                </button>
                {plan && !execution ? (
                    <>
                        <Field label="确认词">
                            <input className="输入" onChange={(event) => props.planState.setConfirmText(event.target.value)} placeholder={props.confirmPhrase} value={props.planState.confirmText}/>
                        </Field>
                        <div className="操作列">
                            <button className="次按钮" disabled={props.loading === 'execute'} onClick={props.actions.backupPlan} type="button">
                                {backupText}
                            </button>
                            <button className="危险按钮" disabled={!props.planState.canConfirm || props.loading === 'execute'} onClick={props.actions.executePlan} type="button">
                                {executeText}
                            </button>
                        </div>
                    </>
                ) : null}
            </section>
            {execution ? (
                <section className="执行后操作">
                    <div className="次信息">
                        <span>{execution.backups.length} 个备份</span>
                        <span>{execution.verification.remainingReferences.length} 个残留引用</span>
                    </div>
                    <div className="操作列">
                        <button className="次按钮" disabled={props.loading === 'rollback' || execution.rollbackJournalPath === ''} onClick={props.actions.rollbackPlan} type="button">
                            按备份恢复
                        </button>
                        <button className="次按钮" disabled={props.loading === 'export'} onClick={props.actions.exportEvidencePack} type="button">
                            导出报告
                        </button>
                    </div>
                </section>
            ) : null}
        </aside>
    );
}

function AdvancedDetails(props: HistoryWorkspaceController) {
    return (
        <details className="高级折叠">
            <summary>详细结果</summary>
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

function DataRow({label, value, code = false}: { label: string; value: string; code?: boolean }) {
    return (
        <div className="数据行">
            <span>{label}</span>
            {code ? <code title={value}>{value}</code> : <strong title={value}>{value}</strong>}
        </div>
    );
}

function StrategyButton({checked, label, onClick}: { checked: boolean; label: string; onClick: () => void }) {
    return (
        <button aria-pressed={checked} className={`策略按钮 ${checked ? '选中' : ''}`} onClick={onClick} type="button">
            {label}
        </button>
    );
}

function CheckboxField({checked, label, onChange}: { checked: boolean; label: string; onChange: (value: boolean) => void }) {
    return (
        <label className="开关项">
            <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox"/>
            <span>{label}</span>
        </label>
    );
}

function Field({label, children}: { label: string; children: ReactNode }) {
    return <label className="字段"><span>{label}</span>{children}</label>;
}

function SelectRow({label, children, ...rest}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
    return <Field label={label}><select className="输入" {...rest}>{children}</select></Field>;
}

function strategyRuleText(strategy: HistoryWorkspaceController['strategyState']['strategy'], selectedProject: string) {
    if (strategy === 'recommended') return '90 天前且已归档';
    if (strategy === 'conservative') return '180 天前历史';
    if (strategy === 'project') return selectedProject ? `项目：${selectedProject}` : '按项目批量处理';
    return '手动勾选要处理的会话';
}
