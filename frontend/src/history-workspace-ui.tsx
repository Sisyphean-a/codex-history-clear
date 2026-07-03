import packageInfo from '../package.json';
import type {ReactNode, SelectHTMLAttributes} from 'react';
import type {HistoryWorkspaceController} from './history-workspace-controller';

const appVersion = packageInfo.version === '0.0.0' ? '预览版' : `v${packageInfo.version}`;

export function ToolbarPanel(props: HistoryWorkspaceController) {
    const scanText = props.loading === 'scan' ? '扫描中' : props.scanWorkspace.kind === 'idle' ? '开始扫描' : '重新扫描';
    const rootPath = props.workspaceConfig?.codexHome ?? '读取中';
    return (
        <header className="顶部栏 面板">
            <div className="品牌区">
                <div className="品牌图标"><Icon path="M4 3.5A2.5 2.5 0 0 1 6.5 1h3A2.5 2.5 0 0 1 12 3.5v9A2.5 2.5 0 0 1 9.5 15h-3A2.5 2.5 0 0 1 4 12.5v-9Zm2.5-.75a.75.75 0 0 0-.75.75v1.25h4.5V3.5a.75.75 0 0 0-.75-.75h-3Zm3.75 3.75h-4.5v2.25h4.5V6.5Zm-4.5 4v2a.75.75 0 0 0 .75.75h3a.75.75 0 0 0 .75-.75v-2h-4.5Z"/></div>
                <div className="品牌文案">
                    <div className="标题行">
                        <h1>Codex 历史清理器</h1>
                        <span className="版本标">{appVersion}</span>
                    </div>
                    <div className="路径说明">
                        <span>当前目录</span>
                        <code title={rootPath}>{rootPath}</code>
                    </div>
                </div>
            </div>
            <div className="标题分隔线"/>
            <div className="顶部按钮组">
                <ToolbarButton disabled={props.loading === 'directory'} icon="folder" onClick={props.actions.changeDirectory} text="更换目录"/>
                <ToolbarButton icon="archive" onClick={props.actions.openBackupDirectory} text="打开备份目录"/>
                <ToolbarButton disabled={props.loading === 'scan'} icon="refresh" onClick={props.actions.startScan} primary text={scanText}/>
            </div>
        </header>
    );
}

export function StatusBar(props: HistoryWorkspaceController) {
    const items = [
        scanStatusText(props),
        `${props.overview.totalSessions} 条会话`,
        `已选择 ${props.selectedIds.length} 条`,
        `预计释放 ${props.overview.releaseText}`,
        `上次扫描 ${props.overview.latestUpdate}`,
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

export function ToolbarButton({text, icon, onClick, disabled, primary = false}: { text: string; icon: ToolbarIcon; onClick: () => void; disabled?: boolean; primary?: boolean }) {
    return <button className={primary ? '主按钮 图标按钮' : '次按钮 图标按钮'} disabled={disabled} onClick={onClick} type="button"><ToolbarGlyph icon={icon}/>{text}</button>;
}

export function IconButton({icon, onClick, title, active = false, disabled = false}: { icon: ToolbarIcon; onClick: () => void; title: string; active?: boolean; disabled?: boolean }) {
    return <button className={`图标控件 ${active ? '激活' : ''}`} disabled={disabled} onClick={onClick} title={title} type="button"><ToolbarGlyph icon={icon}/></button>;
}

export function MetricRow({label, value, highlight = false, tone, large = false}: { label: string; value: string; highlight?: boolean; tone?: 'success'; large?: boolean }) {
    return <div className={`数据行 指标行 ${highlight ? '高亮' : ''} ${tone ? `色调-${tone}` : ''} ${large ? '大号' : ''}`}><span>{label}</span><strong title={value}>{value}</strong></div>;
}

export function DataRow({label, value, code = false}: { label: string; value: string; code?: boolean }) {
    return <div className="数据行"><span>{label}</span>{code ? <code title={value}>{value}</code> : <strong title={value}>{value}</strong>}</div>;
}

export function InfoBar({text}: { text: string }) {
    return <div className="信息条"><Icon path="M8 2.5A4.5 4.5 0 1 0 8 11.5 4.5 4.5 0 0 0 8 2.5Zm0 10.5A6 6 0 1 1 8 1a6 6 0 0 1 0 12Zm-.75-3h1.5V6.5h-1.5V10Zm0 2.25h1.5v1.5h-1.5v-1.5Z"/>{text}</div>;
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

function ToolbarGlyph({icon}: { icon: ToolbarIcon }) {
    const paths: Record<ToolbarIcon, string> = {
        archive: 'M2 4.25h12v2.5H2v-2.5Zm1 3.75h10v5H3V8Zm2 1.5v2h6v-2H5Z',
        folder: 'M1.75 4.5h4.1l1.2 1.4h7.2v5.6a1 1 0 0 1-1 1h-10.5a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1Z',
        list: 'M2.5 4h11v1.5h-11V4Zm0 3.25h11v1.5h-11v-1.5Zm0 3.25h11V12h-11v-1.5Z',
        refresh: 'M12.75 7.5a4.75 4.75 0 1 1-1.52-3.47V2.75h1.5v3.5h-3.5v-1.5h1.1A3.25 3.25 0 1 0 11.25 7.5h1.5Z',
        spark: 'm8 1.5 1.15 2.65L11.8 5.3 9.15 6.45 8 9.1 6.85 6.45 4.2 5.3l2.65-1.15L8 1.5Zm-4.5 7.75.7 1.55 1.55.7-1.55.7-.7 1.55-.7-1.55-1.55-.7 1.55-.7.7-1.55Zm9 0 .7 1.55 1.55.7-1.55.7-.7 1.55-.7-1.55-1.55-.7 1.55-.7.7-1.55Z',
    };
    return <Icon path={paths[icon]}/>;
}

export type ToolbarIcon = 'archive' | 'folder' | 'list' | 'refresh' | 'spark';
