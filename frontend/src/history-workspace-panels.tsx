import type {HistoryWorkspaceController} from './history-workspace-controller';
import {HistoryThreadTable} from './history-workspace-tables';
import {Field, MetricRow, scanStatusText, SectionHeading, SelectRow} from './history-workspace-ui';

export function OverviewPanel(props: HistoryWorkspaceController) {
    const duplicateCount = props.scanWorkspace.kind === 'ready'
        ? props.scanWorkspace.plan.groups.reduce((total, group) => total + Math.max(0, group.candidates.length - 1), 0)
        : 0;
    const scanCount = props.scanWorkspace.kind === 'ready' ? props.scanWorkspace.scan.summary.itemCount : 0;
    const unknownCount = props.scanWorkspace.kind === 'ready' ? props.scanWorkspace.scan.summary.unknownCount : 0;
    return (
        <section className="面板 侧栏面板">
            <SectionHeading badgeText={scanStatusText(props)} title="概览"/>
            <div className="概览列表">
                <MetricRow label="总会话" value={String(props.overview.totalSessions)}/>
                <MetricRow label="已归档" value={String(props.overview.archivedSessions)}/>
                <MetricRow label="重复项" value={String(duplicateCount)}/>
                <MetricRow label="扫描对象" value={String(scanCount)}/>
                <MetricRow label="未识别对象" value={String(unknownCount)}/>
            </div>
        </section>
    );
}

export function ControlPanel(props: HistoryWorkspaceController) {
    return (
        <section className="面板 侧栏面板 控制面板">
            <FilterSection {...props}/>
            <SafetySection {...props}/>
        </section>
    );
}

function FilterSection(props: HistoryWorkspaceController) {
    return (
        <section className="侧栏分组">
            <SectionHeading title="筛选条件"/>
            <div className="筛选列">
                <SelectRow aria-label="状态筛选" onChange={(event) => props.filters.setArchivedFilter(event.target.value as typeof props.filters.archivedFilter)} value={props.filters.archivedFilter}>
                    <option value="all">全部状态</option>
                    <option value="archived">仅已归档</option>
                    <option value="active">仅未归档</option>
                </SelectRow>
                <Field>
                    <input className="输入" list="项目目录建议" onChange={(event) => props.filters.setProjectQuery(event.target.value)} placeholder="目录" value={props.filters.projectQuery}/>
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
                    <p>按左侧条件筛出范围，勾选后加入本次清理。</p>
                </div>
                <div className="列表状态组">
                    <span className="状态签 accent">已选 {props.selectedIds.length}</span>
                    <span className="状态签 neutral">显示 {props.visibleThreads.length}</span>
                </div>
            </header>
            <HistoryThreadTable
                items={props.visibleThreads}
                scanWorkspace={props.scanWorkspace}
                selectedIds={props.selectedIds}
                toggleSelected={props.actions.toggleSelected}
            />
            <footer className="列表底栏">
                <strong>加载状态</strong>
                <span>{loadState}</span>
            </footer>
        </section>
    );
}

function CheckboxField({checked, label, onChange}: { checked: boolean; label: string; onChange: (value: boolean) => void }) {
    return <label className="勾选项"><input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox"/><span>{label}</span></label>;
}
