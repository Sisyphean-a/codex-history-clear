import packageInfo from '../package.json';
import type {ReactNode, SelectHTMLAttributes} from 'react';
import {HistoryPlanTargetTable} from './history-workspace-tables';
import type {HistoryWorkspaceController} from './history-workspace-controller';

const appVersion = packageInfo.version === '0.0.0' ? '预览版' : `v${packageInfo.version}`;

type ToolbarPanelProps = HistoryWorkspaceController & { onOpenPreview: () => void };
type DeletePreviewDialogProps = HistoryWorkspaceController & { open: boolean; onClose: () => void };

export function ToolbarPanel(props: ToolbarPanelProps) {
    const scanText = props.loading === 'scan' ? '扫描中' : props.scanWorkspace.kind === 'idle' ? '开始扫描' : '重新扫描';
    const plan = props.planState.planResult;
    const execution = props.planState.executionResult;
    const targetCount = plan?.summary.targetCount ?? props.selectedIds.length;
    const previewText = props.loading === 'plan' ? '生成预览中' : '删除预览';
    return (
        <header className="顶部操作区 面板">
            <div className="顶部主行">
                <div className="顶部按钮组">
                    <ToolbarButton disabled={props.loading === 'directory'} icon="folder" onClick={props.actions.changeDirectory} text="更换目录"/>
                    <ToolbarButton icon="archive" onClick={props.actions.openBackupDirectory} text="打开备份目录"/>
                    <ToolbarButton disabled={props.loading === 'scan'} icon="refresh" onClick={props.actions.startScan} text={scanText} tone="primary"/>
                    <ToolbarButton
                        disabled={props.selectedIds.length === 0 || props.loading === 'plan'}
                        icon="trash"
                        onClick={props.onOpenPreview}
                        text={previewText}
                    />
                </div>
                <div className="顶部摘要行">
                    <InlineSummaryItem label="将删除" value={`${targetCount} 条会话`}/>
                    <InlineSummaryItem label="预计释放" value={props.overview.releaseText}/>
                </div>
            </div>
            {execution ? (
                <div className="顶部次行">
                    <span className={`状态签 ${execution.verification.success ? 'accent' : 'warn'}`}>{execution.verification.summary}</span>
                    <div className="顶部次操作">
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
                </div>
            ) : null}
        </header>
    );
}

export function DeletePreviewDialog(props: DeletePreviewDialogProps) {
    if (!props.open) return null;
    const plan = props.planState.planResult;
    const targetCount = plan?.summary.targetCount ?? props.selectedIds.length;
    const backdropClick = props.loading === 'execute' ? undefined : props.onClose;
    return (
        <div className="预览遮罩" onClick={backdropClick} role="presentation">
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

export function StatusBar(props: HistoryWorkspaceController) {
    const items = [
        scanStatusText(props),
        `目录 ${props.workspaceConfig?.codexHome ?? '读取中'}`,
        `总会话 ${props.overview.totalSessions}`,
        `当前列表 ${props.visibleThreads.length}`,
        `已选择 ${props.selectedIds.length}`,
        `预计释放 ${props.overview.releaseText}`,
    ];
    return (
        <footer className="状态栏">
            <div className="状态列">
                {items.map((item, index) => <span key={`${item}:${index}`}>{item}</span>)}
            </div>
            <span>{appVersion} · OpenAI Codex CLI</span>
        </footer>
    );
}

export function SectionHeading({title, badgeText}: { title: string; badgeText?: string }) {
    return (
        <div className="分组头">
            <h2>{title}</h2>
            {badgeText ? <span className="状态签 accent">{badgeText}</span> : null}
        </div>
    );
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

export function MetricRow({label, value, highlight = false, tone, large = false}: { label: string; value: string; highlight?: boolean; tone?: 'success'; large?: boolean }) {
    return <div className={`数据行 指标行 ${highlight ? '高亮' : ''} ${tone ? `色调-${tone}` : ''} ${large ? '大号' : ''}`}><span>{label}</span><strong title={value}>{value}</strong></div>;
}

export function DataRow({label, value, code = false}: { label: string; value: string; code?: boolean }) {
    return <div className="数据行"><span>{label}</span>{code ? <code title={value}>{value}</code> : <strong title={value}>{value}</strong>}</div>;
}

export function Field({children}: { children: ReactNode }) {
    return <label className="字段">{children}</label>;
}

export function SelectRow({children, ...rest}: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
    return <Field><select className="输入" {...rest}>{children}</select></Field>;
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

function InlineSummaryItem({label, value, code = false}: { label: string; value: string; code?: boolean }) {
    return (
        <div className={`顶部摘要项 ${code ? '顶部摘要项-路径' : ''}`}>
            <strong>{label}</strong>
            {code ? <code title={value}>{value}</code> : <span title={value}>{value}</span>}
        </div>
    );
}

function backupText(props: HistoryWorkspaceController) {
    return props.planState.backupPath || props.workspaceConfig?.backupRoot || '未配置备份目录';
}

function ToolbarGlyph({icon}: { icon: ToolbarIcon }) {
    const paths: Record<ToolbarIcon, string> = {
        archive: 'M2 4.25h12v2.5H2v-2.5Zm1 3.75h10v5H3V8Zm2 1.5v2h6v-2H5Z',
        folder: 'M1.75 4.5h4.1l1.2 1.4h7.2v5.6a1 1 0 0 1-1 1h-10.5a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1Z',
        refresh: 'M12.75 7.5a4.75 4.75 0 1 1-1.52-3.47V2.75h1.5v3.5h-3.5v-1.5h1.1A3.25 3.25 0 1 0 11.25 7.5h1.5Z',
        trash: 'M3 4.5h10M6 4.5V3h4v1.5m-5.25 0 .6 8.25h5.3l.6-8.25',
    };
    return <Icon path={paths[icon]}/>;
}

type ToolbarIcon = 'archive' | 'folder' | 'refresh' | 'trash';
