import type {HistoryRollbackResult} from './history-types';
import type {HistoryWorkspaceController} from './history-workspace-controller';
import {
    HistoryExecutionTable,
    HistoryPlanTargetTable,
    HistoryThreadTable,
} from './history-workspace-tables';

const confirmPhrase = 'purge-selected';

export function HistoryWorkspaceView(props: HistoryWorkspaceController) {
    return (
        <article className="面板 功能卡">
            <HistoryWorkspaceHeader loading={props.loading} loadThreads={props.loadThreads}/>
            <HistoryFilters {...props}/>
            {props.error ? <div className="错误面板">{props.error}</div> : null}
            <section className="双栏">
                <HistoryListPanel {...props}/>
                <HistoryPlanPanel {...props}/>
            </section>
            <HistoryExecutionPanel {...props}/>
            <HistoryRollbackPanel rollbackResult={props.rollbackResult}/>
        </article>
    );
}

function HistoryWorkspaceHeader({loading, loadThreads}: Pick<HistoryWorkspaceController, 'loading' | 'loadThreads'>) {
    return (
        <header className="面板头">
            <div>
                <h2>真实历史删除</h2>
                <div className="次信息">
                    <span>state_5.sqlite 主索引</span>
                    <span>history/session_index 改写</span>
                    <span>rollback / manifest-after</span>
                </div>
            </div>
            <button className="主按钮" disabled={loading === 'list'} onClick={loadThreads} type="button">
                {loading === 'list' ? '载入中' : '加载本地会话'}
            </button>
        </header>
    );
}

function HistoryFilters(props: Pick<HistoryWorkspaceController, 'grep' | 'setGrep' | 'cwd' | 'setCwd' | 'archivedOnly' | 'setArchivedOnly'>) {
    return (
        <section className="筛选网格">
            <label className="字段">
                <span>标题筛选</span>
                <input className="输入" onChange={(event) => props.setGrep(event.target.value)} value={props.grep}/>
            </label>
            <label className="字段">
                <span>目录筛选</span>
                <input className="输入" onChange={(event) => props.setCwd(event.target.value)} value={props.cwd}/>
            </label>
            <label className="勾选项">
                <input checked={props.archivedOnly} onChange={(event) => props.setArchivedOnly(event.target.checked)} type="checkbox"/>
                <span>只看 archived</span>
            </label>
        </section>
    );
}

function HistoryListPanel(props: Pick<HistoryWorkspaceController, 'listResult' | 'selectedIds' | 'toggleSelected' | 'loading' | 'buildPlan'>) {
    return (
        <article className="面板 内层面板">
            <header className="面板头">
                <h2>会话列表</h2>
                <div className="次信息">
                    <span>{props.listResult?.summary.count ?? 0} 条</span>
                    <span>{props.selectedIds.length} 已选</span>
                </div>
            </header>
            {props.listResult ? <HistoryThreadTable items={props.listResult.items} selectedIds={props.selectedIds} toggleSelected={props.toggleSelected}/> : <div className="空态 小号">先加载本地会话</div>}
            <div className="操作列">
                <button className="次按钮" disabled={props.selectedIds.length === 0 || props.loading === 'plan'} onClick={props.buildPlan} type="button">
                    {props.loading === 'plan' ? '生成中' : '生成删除计划'}
                </button>
                {props.listResult ? <div className="路径提示">{props.listResult.codexHome}</div> : null}
            </div>
        </article>
    );
}

function HistoryPlanPanel(props: Pick<HistoryWorkspaceController, 'planResult' | 'confirmText' | 'setConfirmText' | 'loading' | 'executePlan' | 'backupPlan'>) {
    return (
        <article className="面板 内层面板">
            <header className="面板头">
                <h2>执行计划</h2>
                <div className="次信息">
                    <span>{props.planResult?.summary.targetCount ?? 0} 会话</span>
                    <span>{props.planResult?.summary.storeCount ?? 0} 存储动作</span>
                </div>
            </header>
            {!props.planResult ? <div className="空态 小号">选择会话后生成计划</div> : (
                <>
                    <HistoryPlanTargetTable targets={props.planResult.targets}/>
                    <div className="危险提示">输入 <code>{confirmPhrase}</code> 后才会先生成 approved plan，再执行真实删除或只做备份。</div>
                    <div className="操作列">
                        <input className="输入" onChange={(event) => props.setConfirmText(event.target.value)} placeholder={confirmPhrase} value={props.confirmText}/>
                        <button className="次按钮" disabled={props.confirmText !== confirmPhrase || props.loading === 'execute'} onClick={props.backupPlan} type="button">
                            {props.loading === 'execute' ? '处理中' : '只做备份'}
                        </button>
                        <button className="主按钮" disabled={props.confirmText !== confirmPhrase || props.loading === 'execute'} onClick={props.executePlan} type="button">
                            {props.loading === 'execute' ? '删除中' : '执行真实删除'}
                        </button>
                    </div>
                </>
            )}
        </article>
    );
}

function HistoryExecutionPanel(props: Pick<HistoryWorkspaceController, 'executionResult' | 'loading' | 'rollbackPlan' | 'exportEvidencePack' | 'evidencePackResult'>) {
    const statusTone = statusClass(props.executionResult?.verification.status);
    const statusText = props.executionResult?.verification.status ?? 'idle';
    return (
        <article className="面板 内层面板">
            <header className="面板头">
                <h2>执行结果</h2>
                {props.executionResult ? <span className={`状态签 ${statusTone}`}>{statusText}</span> : null}
            </header>
            {!props.executionResult ? <div className="空态 小号">执行删除后会在这里显示 rollback、artifact 和校验结果</div> : (
                <>
                    <HistoryExecutionTable result={props.executionResult}/>
                    <div className="操作列">
                        <div className="路径提示">{props.executionResult.execResultPath}</div>
                        <button className="次按钮" disabled={props.loading === 'export'} onClick={props.exportEvidencePack} type="button">
                            {props.loading === 'export' ? '导出中' : '导出 Evidence Pack'}
                        </button>
                        <button className="次按钮" disabled={props.loading === 'rollback'} onClick={props.rollbackPlan} type="button">
                            {props.loading === 'rollback' ? '恢复中' : '按 journal 回滚'}
                        </button>
                    </div>
                    {props.evidencePackResult ? (
                        <div className="数据列">
                            <div className="数据行"><span>evidence</span><code>{props.evidencePackResult.evidencePackPath}</code></div>
                        </div>
                    ) : null}
                </>
            )}
        </article>
    );
}

function HistoryRollbackPanel({rollbackResult}: { rollbackResult: HistoryRollbackResult | null }) {
    if (!rollbackResult) return null;
    return (
        <article className="面板 内层面板">
            <header className="面板头">
                <h2>回滚结果</h2>
                <span className="状态签 accent">restored</span>
            </header>
            <div className="数据列">
                <div className="数据行"><span>journal</span><code>{rollbackResult.journalPath}</code></div>
                <div className="数据行"><span>恢复文件</span><code>{String(rollbackResult.restoredCount)}</code></div>
            </div>
        </article>
    );
}

function statusClass(status: string | undefined) {
    if (status === 'pass') return 'accent';
    if (status === 'skipped') return 'neutral';
    return 'warn';
}
