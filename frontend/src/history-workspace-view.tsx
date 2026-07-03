import type {ChangeEventHandler, ReactNode, SelectHTMLAttributes} from 'react';
import type {HistoryWorkspaceController} from './history-workspace-controller';
import {buildThreadTags, formatBytes, formatDateTime, projectLabel} from './history-workspace-helpers';
import {HistoryExecutionTable, HistoryPlanTargetTable} from './history-workspace-tables';
import {ResultPanel} from './workspace';

export function HistoryWorkspaceView(props: HistoryWorkspaceController) {
    return (
        <article className="向导壳">
            <TopPanel {...props}/>
            <OverviewPanel {...props}/>
            {props.error ? <div className="错误面板">{props.error}</div> : null}
            <section className="内容栅格">
                <StrategyPanel {...props}/>
                <section className="主内容列">
                    <SessionPanel {...props}/>
                    <PlanPanel {...props}/>
                </section>
            </section>
            <AdvancedDetails {...props}/>
        </article>
    );
}

function TopPanel(props: HistoryWorkspaceController) {
    const buttonText = props.scanWorkspace.kind === 'idle' ? '开始扫描' : '重新扫描';
    return (
        <header className="向导顶部">
            <div className="标题区">
                <h1>Codex 历史清理器</h1>
                <p>安全清理旧会话，删除前自动备份，可随时回滚</p>
                <div className="目录条">
                    <span>当前扫描目录</span>
                    <code>{props.workspaceConfig?.codexHome ?? '读取中'}</code>
                </div>
            </div>
            <div className="顶栏动作">
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
        </header>
    );
}

function OverviewPanel(props: HistoryWorkspaceController) {
    return (
        <section className="总览网格">
            <MetricCard label="会话总数" value={String(props.overview.totalSessions)}/>
            <MetricCard label="已归档会话" value={String(props.overview.archivedSessions)}/>
            <MetricCard label="建议清理数量" value={String(props.overview.suggestedCount)}/>
            <MetricCard label="预计释放空间" value={props.overview.releaseText}/>
            <MetricCard label="最近更新时间" value={props.overview.latestUpdate}/>
            <MetricCard label="是否可回滚" value={props.overview.rollbackText}/>
        </section>
    );
}

function StrategyPanel(props: HistoryWorkspaceController) {
    return (
        <aside className="策略栏 面板">
            <section className="策略组">
                <header className="面板头"><h2>清理策略</h2></header>
                <StrategyOption checked={props.strategyState.strategy === 'recommended'} description="清理 90 天前的 archived 会话" label="推荐清理" onChange={() => props.strategyState.chooseStrategy('recommended')}/>
                <StrategyOption checked={props.strategyState.strategy === 'conservative'} description="只清理 180 天前的历史" label="保守清理" onChange={() => props.strategyState.chooseStrategy('conservative')}/>
                <StrategyOption checked={props.strategyState.strategy === 'project'} description="按项目目录批量清理" label="按项目清理" onChange={() => props.strategyState.chooseStrategy('project')}/>
                {props.strategyState.strategy === 'project' ? (
                    <select className="输入" onChange={(event) => props.strategyState.setSelectedProject(event.target.value)} value={props.strategyState.selectedProject}>
                        <option value="">选择项目目录</option>
                        {props.projectChoices.map((project) => <option key={project} value={project}>{project}</option>)}
                    </select>
                ) : null}
                <StrategyOption checked={props.strategyState.strategy === 'manual'} description="自己勾选要处理的会话" label="手动选择" onChange={() => props.strategyState.chooseStrategy('manual')}/>
            </section>
            <section className="策略组">
                <header className="面板头"><h2>筛选</h2></header>
                <input className="输入" onChange={(event) => props.filters.setTitleQuery(event.target.value)} placeholder="按标题或内容筛选" value={props.filters.titleQuery}/>
                <input className="输入" onChange={(event) => props.filters.setProjectQuery(event.target.value)} placeholder="按项目目录筛选" value={props.filters.projectQuery}/>
                <SelectRow label="时间范围" onChange={(event) => props.filters.setAgeFilter(event.target.value as typeof props.filters.ageFilter)} value={props.filters.ageFilter}>
                    <option value="any">全部时间</option>
                    <option value="30">30 天前</option>
                    <option value="90">90 天前</option>
                    <option value="180">180 天前</option>
                </SelectRow>
                <SelectRow label="归档状态" onChange={(event) => props.filters.setArchivedFilter(event.target.value as typeof props.filters.archivedFilter)} value={props.filters.archivedFilter}>
                    <option value="all">全部会话</option>
                    <option value="archived">只看已归档</option>
                    <option value="active">只看未归档</option>
                </SelectRow>
                <SelectRow label="大小" onChange={(event) => props.filters.setSizeFilter(event.target.value as typeof props.filters.sizeFilter)} value={props.filters.sizeFilter}>
                    <option value="any">全部大小</option>
                    <option value="1">1 MB 以上</option>
                    <option value="10">10 MB 以上</option>
                    <option value="50">50 MB 以上</option>
                </SelectRow>
            </section>
            <section className="策略组">
                <header className="面板头"><h2>执行选项</h2></header>
                <CheckRow checked={props.strategyState.autoBackup} description="关闭后清理不会自动留备份，也就不能回滚" label="删除前自动备份" onChange={(event) => props.strategyState.setAutoBackup(event.target.checked)}/>
                <CheckRow checked={props.strategyState.generateReport} description="删除后自动生成校验与证据报告" label="删除后生成校验报告" onChange={(event) => props.strategyState.setGenerateReport(event.target.checked)}/>
                <CheckRow checked={props.strategyState.keepRecent} description="默认不动最近 30 天的会话" label="保留最近 30 天会话" onChange={(event) => props.strategyState.setKeepRecent(event.target.checked)}/>
                <CheckRow checked={props.strategyState.skipUnknown} description="有未知结构时先保守跳过" label="跳过未知结构文件" onChange={(event) => props.strategyState.setSkipUnknown(event.target.checked)}/>
            </section>
        </aside>
    );
}

function SessionPanel(props: HistoryWorkspaceController) {
    return (
        <article className="面板 会话区">
            <header className="面板头">
                <div>
                    <h2>会话列表</h2>
                    <div className="次信息">
                        <span>{props.visibleThreads.length} 条可见</span>
                        <span>{props.selectedIds.length} 条待处理</span>
                    </div>
                </div>
                <button className="次按钮" disabled={props.selectedIds.length === 0 || props.loading === 'plan'} onClick={props.actions.buildPlan} type="button">
                    {props.loading === 'plan' ? '生成中' : '生成清理预览'}
                </button>
            </header>
            {props.visibleThreads.length === 0 ? <div className="空态 小号">当前筛选下没有会话</div> : (
                <div className="会话列表">
                    {props.visibleThreads.map((thread) => <SessionCard key={thread.id} selected={props.selectedIds.includes(thread.id)} thread={thread} toggleSelected={props.actions.toggleSelected}/>)}
                </div>
            )}
        </article>
    );
}

function PlanPanel(props: HistoryWorkspaceController) {
    return (
        <article className="面板 计划区">
            <header className="面板头"><h2>执行计划</h2></header>
            <SummaryList props={props}/>
            <div className="危险提示">只有真正删除前才需要输入 <code>{props.confirmPhrase}</code>。如果关闭自动备份，本次清理后将不能回滚。</div>
            <div className="操作列">
                <input className="输入" onChange={(event) => props.planState.setConfirmText(event.target.value)} placeholder={props.confirmPhrase} value={props.planState.confirmText}/>
                <button className="次按钮" disabled={props.loading === 'execute' || !props.planState.planResult} onClick={props.actions.backupPlan} type="button">
                    {props.loading === 'execute' ? '处理中' : '只备份不删除'}
                </button>
                <button className="主按钮" disabled={!props.planState.canConfirm || props.loading === 'execute' || !props.planState.planResult} onClick={props.actions.executePlan} type="button">
                    {props.loading === 'execute' ? '清理中' : '确认并清理'}
                </button>
            </div>
            {props.planState.executionResult ? <ExecutionNotice {...props}/> : null}
        </article>
    );
}

function AdvancedDetails(props: HistoryWorkspaceController) {
    return (
        <details className="高级折叠">
            <summary>高级详情 / 调试信息</summary>
            <div className="高级网格">
                <article className="面板">
                    <header className="面板头"><h2>只读扫描与发现产物</h2></header>
                    <ResultPanel workspace={props.scanWorkspace}/>
                </article>
                <article className="面板">
                    <header className="面板头"><h2>删除目标与存储动作</h2></header>
                    {props.planState.planResult ? <HistoryPlanTargetTable targets={props.planState.planResult.targets}/> : <div className="空态 小号">先生成清理预览</div>}
                </article>
                <article className="面板">
                    <header className="面板头"><h2>执行、恢复与报告</h2></header>
                    {props.planState.executionResult ? <HistoryExecutionTable result={props.planState.executionResult}/> : <div className="空态 小号">执行后在这里看恢复记录和校验报告</div>}
                    <div className="操作列">
                        <button className="次按钮" disabled={props.loading === 'export'} onClick={props.actions.exportEvidencePack} type="button">导出校验报告</button>
                        <button className="次按钮" disabled={props.loading === 'rollback' || !props.planState.executionResult || props.planState.executionResult.rollbackJournalPath === ''} onClick={props.actions.rollbackPlan} type="button">按备份记录恢复</button>
                    </div>
                    {props.planState.evidencePackResult ? <div className="数据行"><span>校验报告</span><code>{props.planState.evidencePackResult.evidencePackPath}</code></div> : null}
                    {props.planState.rollbackResult ? <div className="数据行"><span>恢复记录</span><code>{props.planState.rollbackResult.journalPath}</code></div> : null}
                </article>
            </div>
        </details>
    );
}

function SessionCard({thread, selected, toggleSelected}: { thread: HistoryWorkspaceController['visibleThreads'][number]; selected: boolean; toggleSelected: (threadID: string) => void }) {
    return (
        <label className={`会话卡 ${selected ? '选中' : ''}`}>
            <input checked={selected} onChange={() => toggleSelected(thread.id)} type="checkbox"/>
            <div className="会话主体">
                <div className="会话头">
                    <strong>{thread.title}</strong>
                    <span>{formatBytes(thread.sizeBytes)}</span>
                </div>
                <div className="会话目录">{projectLabel(thread)}</div>
                <div className="会话元信息">
                    <span>更新于 {formatDateTime(thread.updatedAt)}</span>
                    <span>ID {thread.id.slice(0, 8)}</span>
                </div>
                <div className="标签列">
                    {buildThreadTags(thread, selected ? [thread.id] : []).map((tag) => <span className="状态签 neutral" key={`${thread.id}:${tag}`}>{tag}</span>)}
                </div>
            </div>
        </label>
    );
}

function SummaryList({props}: { props: HistoryWorkspaceController }) {
    const projects = props.planState.affectedProjects.length === 0 ? '暂未选择项目' : props.planState.affectedProjects.join('、');
    const hasRecovery = props.strategyState.autoBackup || (props.planState.executionResult?.rollbackJournalPath ?? '') !== '';
    const backupText = props.planState.backupPath || (props.strategyState.autoBackup ? '等待生成预览' : '本次不生成自动备份');
    const rollbackText = hasRecovery ? '清理后可在高级详情里一键恢复' : '本次未保留恢复点，清理后不能一键恢复';
    return (
        <ul className="摘要列">
            <li>将处理 {props.selectedIds.length} 条会话</li>
            <li>预计释放 {props.overview.releaseText}</li>
            <li>涉及项目目录：{projects}</li>
            <li>备份位置：{backupText}</li>
            <li>恢复方式：{rollbackText}</li>
            {props.planState.riskNotes.map((risk) => <li key={risk}>风险提示：{risk}</li>)}
        </ul>
    );
}

function ExecutionNotice(props: HistoryWorkspaceController) {
    return (
        <div className="执行提示">
            <div className="次信息">
                <span>{props.planState.executionResult?.verification.summary ?? '已完成本次处理'}</span>
                <span>{props.planState.executionResult?.backups.length ?? 0} 个备份</span>
            </div>
            <div className="小号">恢复记录和校验报告已移到“高级详情 / 调试信息”。</div>
        </div>
    );
}

function MetricCard({label, value}: { label: string; value: string }) {
    return <article className="指标卡"><span className="指标名">{label}</span><strong className="指标值">{value}</strong></article>;
}

function StrategyOption({checked, label, description, onChange}: { checked: boolean; label: string; description: string; onChange: () => void }) {
    return <label className="策略项"><input checked={checked} name="cleanup-strategy" onChange={onChange} type="radio"/><span><strong>{label}</strong><small>{description}</small></span></label>;
}

function CheckRow({checked, disabled = false, label, description, onChange}: { checked: boolean; disabled?: boolean; label: string; description: string; onChange: ChangeEventHandler<HTMLInputElement> }) {
    return <label className="策略项"><input checked={checked} disabled={disabled} onChange={onChange} type="checkbox"/><span><strong>{label}</strong><small>{description}</small></span></label>;
}

function SelectRow({label, children, ...rest}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
    return <label className="字段"><span>{label}</span><select className="输入" {...rest}>{children}</select></label>;
}
