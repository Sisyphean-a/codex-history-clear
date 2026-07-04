import type {ReactNode} from 'react';
import {HistoryPlanTargetTable} from './history-workspace-tables';
import type {HistoryWorkspaceController} from './history-workspace-controller';

type ToolbarPanelProps = HistoryWorkspaceController & {
    onOpenPreview: () => void;
    onOpenSettings: () => void;
};

type DialogProps = HistoryWorkspaceController & {
    open: boolean;
    onClose: () => void;
};

type ToolbarMetric = {
    label: string;
    value: string;
    code?: boolean;
    wide?: boolean;
    tone?: 'accent' | 'warn' | 'neutral';
};

export function ToolbarPanel(props: ToolbarPanelProps) {
    const previewText = props.loading === 'plan' ? '生成预览中' : '删除预览';
    return (
        <header className="顶部操作区 面板">
            <div className="顶部信息行">
                <div className="顶部信息组">
                    {toolbarMetrics(props).map((item) => <ToolbarMetricItem key={item.label} {...item}/>)}
                </div>
                <div className="顶部操作组">
                    <ToolbarButton icon="settings" onClick={props.onOpenSettings} text="设置"/>
                    <ToolbarButton
                        disabled={props.selectedIds.length === 0 || props.loading === 'plan'}
                        icon="trash"
                        onClick={props.onOpenPreview}
                        text={previewText}
                        tone="danger"
                    />
                </div>
            </div>
            <ToolbarFilters {...props}/>
        </header>
    );
}

function ToolbarFilters(props: HistoryWorkspaceController) {
    return (
        <div className="顶部筛选行">
            <ToolbarField label="状态">
                <select
                    aria-label="状态筛选"
                    className="输入"
                    onChange={(event) => props.filters.setArchivedFilter(event.target.value as typeof props.filters.archivedFilter)}
                    value={props.filters.archivedFilter}
                >
                    <option value="all">全部状态</option>
                    <option value="archived">仅已归档</option>
                    <option value="active">仅未归档</option>
                </select>
            </ToolbarField>
            <ToolbarField label="项目">
                <input
                    aria-label="项目目录筛选"
                    className="输入"
                    list="项目目录建议"
                    onChange={(event) => props.filters.setProjectQuery(event.target.value)}
                    placeholder="全部项目"
                    value={props.filters.projectQuery}
                />
                <datalist id="项目目录建议">
                    {props.projectChoices.map((project) => <option key={project} value={project}/>)}
                </datalist>
            </ToolbarField>
            <ToolbarField label="时间">
                <select
                    aria-label="时间筛选"
                    className="输入"
                    onChange={(event) => props.filters.setAgeFilter(event.target.value as typeof props.filters.ageFilter)}
                    value={props.filters.ageFilter}
                >
                    <option value="any">全部时间</option>
                    <option value="30">30 天前</option>
                    <option value="90">90 天前</option>
                    <option value="180">180 天前</option>
                </select>
            </ToolbarField>
            <ToolbarField label="大小">
                <select
                    aria-label="大小筛选"
                    className="输入"
                    onChange={(event) => props.filters.setSizeFilter(event.target.value as typeof props.filters.sizeFilter)}
                    value={props.filters.sizeFilter}
                >
                    <option value="any">全部大小</option>
                    <option value="1">1 MB 以上</option>
                    <option value="10">10 MB 以上</option>
                    <option value="50">50 MB 以上</option>
                </select>
            </ToolbarField>
        </div>
    );
}

export function DeletePreviewDialog(props: DialogProps) {
    if (!props.open) return null;
    const plan = props.planState.planResult;
    const targetCount = plan?.summary.targetCount ?? props.selectedIds.length;
    const backdropClick = props.loading === 'execute' ? undefined : props.onClose;
    return (
        <div className="弹窗遮罩" onClick={backdropClick} role="presentation">
            <section
                aria-labelledby="删除预览标题"
                aria-modal="true"
                className="预览弹窗 面板"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
            >
                <header className="弹窗头">
                    <div>
                        <h2 id="删除预览标题">删除预览</h2>
                        <p>真正清理前，先确认这次会动哪些会话和备份路径。</p>
                    </div>
                    <button className="图标控件" disabled={props.loading === 'execute'} onClick={props.onClose} title="关闭" type="button">
                        <Icon path="M4 4 12 12M12 4 4 12"/>
                    </button>
                </header>
                <div className="弹窗摘要">
                    <SummaryValue label="将删除" value={`${targetCount} 条会话`}/>
                    <SummaryValue label="预计释放" value={props.overview.releaseText}/>
                    <SummaryValue code label="备份位置" value={backupText(props)}/>
                </div>
                {props.planState.riskNotes.length > 0 ? (
                    <section className="预览风险">
                        <strong>执行提示</strong>
                        <ul>
                            {props.planState.riskNotes.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                    </section>
                ) : null}
                <div className="预览表格">
                    {plan ? <HistoryPlanTargetTable targets={plan.targets}/> : <div className="空态 小号">还没有可展示的预览结果</div>}
                </div>
                <footer className="弹窗底栏">
                    <div className="确认说明">
                        <strong>二次确认</strong>
                        <p>输入 {props.confirmPhrase} 后，才能点击真正删除。</p>
                    </div>
                    <input
                        className="输入 确认输入"
                        onChange={(event) => props.planState.setConfirmText(event.target.value)}
                        placeholder={`输入 ${props.confirmPhrase}`}
                        value={props.planState.confirmText}
                    />
                    <div className="弹窗操作">
                        <button className="次按钮" disabled={props.loading === 'execute'} onClick={props.onClose} type="button">取消</button>
                        <button className="次按钮" disabled={!plan || props.loading === 'execute'} onClick={props.actions.backupPlan} type="button">
                            {props.loading === 'execute' ? '处理中' : '只备份不删除'}
                        </button>
                        <button className="危险按钮" disabled={!props.planState.canConfirm || props.loading === 'execute'} onClick={props.actions.executePlan} type="button">
                            {props.loading === 'execute' ? '清理中' : '确认删除'}
                        </button>
                    </div>
                </footer>
            </section>
        </div>
    );
}

export function SettingsDialog(props: DialogProps) {
    if (!props.open) return null;
    return (
        <div className="弹窗遮罩" onClick={props.onClose} role="presentation">
            <section
                aria-labelledby="设置标题"
                aria-modal="true"
                className="设置弹窗 面板"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
            >
                <header className="弹窗头">
                    <div>
                        <h2 id="设置标题">设置</h2>
                        <p>目录、扫描、备份和安全策略都集中放在这里。</p>
                    </div>
                    <button className="图标控件" onClick={props.onClose} title="关闭" type="button">
                        <Icon path="M4 4 12 12M12 4 4 12"/>
                    </button>
                </header>
                <div className="设置内容">
                    <WorkspaceSettingsSection {...props}/>
                    <SafetySettingsSection {...props}/>
                    <ExecutionSettingsSection {...props}/>
                </div>
                <footer className="弹窗底栏 设置底栏">
                    <button className="次按钮" onClick={props.onClose} type="button">关闭</button>
                </footer>
            </section>
        </div>
    );
}

function WorkspaceSettingsSection(props: HistoryWorkspaceController) {
    return (
        <section className="设置分组">
            <div className="分组头">
                <h3>工作区</h3>
                <span className={`状态签 ${scanStatusTone(props)}`}>{scanStatusText(props)}</span>
            </div>
            <div className="数据列">
                <DataRow code label="当前目录" value={props.workspaceConfig?.codexHome ?? '读取中'}/>
                <DataRow code label="备份根目录" value={props.workspaceConfig?.backupRoot ?? '未配置备份目录'}/>
                <DataRow code label="本次备份" value={backupText(props)}/>
            </div>
            <div className="设置操作组">
                <ToolbarButton disabled={props.loading === 'directory'} icon="folder" onClick={props.actions.changeDirectory} text="更换目录"/>
                <ToolbarButton icon="archive" onClick={props.actions.openBackupDirectory} text="打开备份目录"/>
                <ToolbarButton disabled={props.loading === 'scan'} icon="refresh" onClick={props.actions.startScan} text={scanActionText(props)} tone="primary"/>
            </div>
        </section>
    );
}

function SafetySettingsSection(props: HistoryWorkspaceController) {
    return (
        <section className="设置分组">
            <div className="分组头">
                <h3>安全选项</h3>
                <span className="状态签 neutral">{props.planState.affectedProjects.length} 个项目</span>
            </div>
            <div className="设置勾选网格">
                <CheckboxField checked={props.strategyState.autoBackup} label="删除前自动备份" onChange={props.strategyState.setAutoBackup}/>
                <CheckboxField checked={props.strategyState.generateReport} label="生成校验报告" onChange={props.strategyState.setGenerateReport}/>
                <CheckboxField checked={props.strategyState.keepRecent} label="保留最近 30 天" onChange={props.strategyState.setKeepRecent}/>
                <CheckboxField checked={props.strategyState.skipUnknown} label="跳过未知结构" onChange={props.strategyState.setSkipUnknown}/>
            </div>
        </section>
    );
}

function ExecutionSettingsSection(props: HistoryWorkspaceController) {
    const execution = props.planState.executionResult;
    if (!execution) return null;
    return (
        <section className="设置分组">
            <div className="分组头">
                <h3>执行后操作</h3>
                <span className={`状态签 ${execution.verification.success ? 'accent' : 'warn'}`}>{execution.verification.summary}</span>
            </div>
            <div className="数据列">
                <DataRow code label="恢复记录" value={execution.rollbackJournalPath || '未保留恢复点'}/>
                <DataRow code label="执行结果" value={execution.execResultPath}/>
            </div>
            <div className="设置操作组">
                <button
                    className="次按钮"
                    disabled={props.loading === 'rollback' || execution.rollbackJournalPath === ''}
                    onClick={props.actions.rollbackPlan}
                    type="button"
                >
                    按备份恢复
                </button>
                <button className="次按钮" disabled={props.loading === 'export'} onClick={props.actions.exportEvidencePack} type="button">
                    导出报告
                </button>
            </div>
        </section>
    );
}

function ToolbarMetricItem({label, value, code = false, wide = false, tone = 'neutral'}: ToolbarMetric) {
    return (
        <div className={`顶部信息项 顶部信息项-${tone} ${wide ? '顶部信息项-宽' : ''}`}>
            <span>{label}</span>
            {code ? <code title={value}>{value}</code> : <strong title={value}>{value}</strong>}
        </div>
    );
}

function ToolbarField({label, children}: { label: string; children: ReactNode }) {
    return (
        <label className="顶部筛选项">
            <span>{label}</span>
            {children}
        </label>
    );
}

function CheckboxField({checked, label, onChange}: { checked: boolean; label: string; onChange: (value: boolean) => void }) {
    return <label className="勾选项"><input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox"/><span>{label}</span></label>;
}

export function ToolbarButton({
    text,
    icon,
    onClick,
    disabled,
    tone = 'neutral',
}: {
    text: string;
    icon: ToolbarIcon;
    onClick: () => void | Promise<void>;
    disabled?: boolean;
    tone?: 'neutral' | 'primary' | 'danger';
}) {
    const className = tone === 'primary'
        ? '主按钮 图标按钮'
        : tone === 'danger'
            ? '危险按钮 图标按钮'
            : '次按钮 图标按钮';
    return <button className={className} disabled={disabled} onClick={onClick} type="button"><ToolbarGlyph icon={icon}/>{text}</button>;
}

export function DataRow({label, value, code = false}: { label: string; value: string; code?: boolean }) {
    return <div className="数据行"><span>{label}</span>{code ? <code title={value}>{value}</code> : <strong title={value}>{value}</strong>}</div>;
}

export function Icon({path, className = ''}: { path: string; className?: string }) {
    return <svg className={className} fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 16 16" width="16"><path d={path}/></svg>;
}

export function scanStatusText(props: HistoryWorkspaceController) {
    if (props.loading === 'scan') return '扫描中';
    if (props.scanWorkspace.kind === 'error') return '扫描失败';
    if (props.scanWorkspace.kind === 'ready') return '扫描完成';
    if (props.listResult) return '已载入';
    return '等待扫描';
}

function SummaryValue({label, value, code = false}: { label: string; value: string; code?: boolean }) {
    return (
        <div className={`摘要槽 ${code ? '摘要槽-路径' : ''}`}>
            <span>{label}</span>
            {code ? <code title={value}>{value}</code> : <strong title={value}>{value}</strong>}
        </div>
    );
}

function ToolbarGlyph({icon}: { icon: ToolbarIcon }) {
    const paths: Record<ToolbarIcon, string> = {
        archive: 'M2 4.25h12v2.5H2v-2.5Zm1 3.75h10v5H3V8Zm2 1.5v2h6v-2H5Z',
        folder: 'M1.75 4.5h4.1l1.2 1.4h7.2v5.6a1 1 0 0 1-1 1h-10.5a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1Z',
        refresh: 'M12.75 7.5a4.75 4.75 0 1 1-1.52-3.47V2.75h1.5v3.5h-3.5v-1.5h1.1A3.25 3.25 0 1 0 11.25 7.5h1.5Z',
        settings: 'M2.5 4.25h11M4.75 8h6.5M3.5 11.75h9M5.25 3v2.5M10.75 6.75v2.5M7.25 10.5V13',
        trash: 'M3 4.5h10M6 4.5V3h4v1.5m-5.25 0 .6 8.25h5.3l.6-8.25',
    };
    return <Icon path={paths[icon]}/>;
}

function toolbarMetrics(props: HistoryWorkspaceController): ToolbarMetric[] {
    const duplicateCount = props.scanWorkspace.kind === 'ready'
        ? props.scanWorkspace.plan.groups.reduce((count, group) => count + Math.max(0, group.candidates.length - 1), 0)
        : 0;
    const scanCount = props.scanWorkspace.kind === 'ready' ? props.scanWorkspace.scan.summary.itemCount : 0;
    const unknownCount = props.scanWorkspace.kind === 'ready' ? props.scanWorkspace.scan.summary.unknownCount : 0;
    return [
        {label: '状态', value: scanStatusText(props), tone: scanStatusTone(props)},
        {label: '目录', value: props.workspaceConfig?.codexHome ?? '读取中', code: true, wide: true},
        {label: '总会话', value: String(props.overview.totalSessions)},
        {label: '已归档', value: String(props.overview.archivedSessions)},
        {label: '重复项', value: String(duplicateCount)},
        {label: '扫描对象', value: String(scanCount)},
        {label: '未识别', value: String(unknownCount), tone: unknownCount > 0 ? 'warn' : 'neutral'},
        {label: '已选择', value: String(props.selectedIds.length), tone: props.selectedIds.length > 0 ? 'accent' : 'neutral'},
        {label: '预计释放', value: props.overview.releaseText, tone: props.selectedIds.length > 0 ? 'accent' : 'neutral'},
    ];
}

function scanActionText(props: HistoryWorkspaceController) {
    if (props.loading === 'scan') return '扫描中';
    if (props.scanWorkspace.kind === 'idle') return '开始扫描';
    return '重新扫描';
}

function scanStatusTone(props: HistoryWorkspaceController): 'accent' | 'warn' | 'neutral' {
    if (props.loading === 'scan' || props.scanWorkspace.kind === 'ready') return 'accent';
    if (props.scanWorkspace.kind === 'error') return 'warn';
    return 'neutral';
}

function backupText(props: HistoryWorkspaceController) {
    return props.planState.backupPath || props.workspaceConfig?.backupRoot || '未配置备份目录';
}

type ToolbarIcon = 'archive' | 'folder' | 'refresh' | 'settings' | 'trash';
