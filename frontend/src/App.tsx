import {useState, useTransition} from 'react';
import './App.css';
import {RunReadOnlyScan} from "../wailsjs/go/main/App";

type ScanResult = {
    runId: string;
    roots: string[];
    discoveryPath: string;
    manifestPath: string;
    unknownItemsPath: string;
    summary: { rootCount: number; itemCount: number; unknownCount: number; warningCount: number };
    warnings: string[];
    items: Array<{ path: string; kind: string; sourceRoot: string; mtimeUtc: string; size: number }>;
    cliSnapshot: {
        executablePath: string;
        available: boolean;
        doctorStatus: string;
        resumeSupported: boolean;
    };
};

type WorkspaceState =
    | { kind: 'idle' }
    | { kind: 'running' }
    | { kind: 'ready'; result: ScanResult }
    | { kind: 'error'; message: string };

const kindLabels: Record<string, string> = {
    auth_json: '认证',
    config_toml: '配置',
    credentials_json: '凭据',
    history_jsonl: '历史',
    session_index_jsonl: '会话索引',
    state_sqlite: '状态库',
    logs_sqlite: '日志库',
    rollout_jsonl: '执行记录',
    archived_rollout_jsonl: '归档执行记录',
};

const cliStatusLabels: Record<string, string> = {
    ok: '正常',
    unavailable: '不可用',
    error: '异常',
    invalid_json: '返回无效',
};

const emptyDash = '—';

const previewItems = (items: ScanResult['items']) => items.slice(0, 12);

function metricTone(value: number) {
    if (value === 0) return 'ok';
    if (value < 5) return 'warn';
    return 'risk';
}

function StatusBadge({label, tone}: { label: string; tone: 'neutral' | 'ok' | 'warn' | 'risk' }) {
    return <span className={`状态标记 ${tone}`}>{label}</span>;
}

function MetricCard({label, value, tone}: { label: string; value: string | number; tone?: 'neutral' | 'ok' | 'warn' | 'risk' }) {
    return (
        <article className="指标卡">
            <span className="指标名">{label}</span>
            <strong className={`指标值 ${tone ?? 'neutral'}`}>{value}</strong>
        </article>
    );
}

function DataRow({label, value}: { label: string; value: string }) {
    return (
        <div className="数据行">
            <span>{label}</span>
            <code>{value || emptyDash}</code>
        </div>
    );
}

function ItemTable({items}: { items: ScanResult['items'] }) {
    if (items.length === 0) {
        return <div className="空态">无数据</div>;
    }

    return (
        <div className="表格壳">
            <table className="结果表格">
                <thead>
                <tr>
                    <th>类型</th>
                    <th>路径</th>
                    <th>大小</th>
                    <th>修改时间</th>
                </tr>
                </thead>
                <tbody>
                {previewItems(items).map((item) => (
                    <tr key={`${item.kind}:${item.path}`}>
                        <td>{kindLabels[item.kind] ?? item.kind}</td>
                        <td className="路径列"><code>{item.path}</code></td>
                        <td>{item.size}</td>
                        <td>{item.mtimeUtc}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

function ResultPanel({workspace}: { workspace: WorkspaceState }) {
    if (workspace.kind === 'idle') {
        return <div className="空态">未执行</div>;
    }
    if (workspace.kind === 'running') {
        return <div className="空态">扫描中</div>;
    }
    if (workspace.kind === 'error') {
        return <div className="错误面板">{workspace.message}</div>;
    }

    const {result} = workspace;
    const warningTone = metricTone(result.summary.warningCount);
    const unknownTone = metricTone(result.summary.unknownCount);
    const cliTone = result.cliSnapshot.available ? 'ok' : 'risk';

    return (
        <div className="结果区">
            <section className="指标网格">
                <MetricCard label="扫描目录" value={result.summary.rootCount}/>
                <MetricCard label="识别对象" value={result.summary.itemCount}/>
                <MetricCard label="未识别对象" value={result.summary.unknownCount} tone={unknownTone}/>
                <MetricCard label="警告" value={result.summary.warningCount} tone={warningTone}/>
            </section>

            <section className="双栏">
                <article className="面板">
                    <header className="面板头">
                        <h2>运行</h2>
                        <StatusBadge
                            label={result.cliSnapshot.available ? 'CLI 可用' : 'CLI 不可用'}
                            tone={cliTone}
                        />
                    </header>
                    <div className="数据列">
                        <DataRow label="运行 ID" value={result.runId}/>
                        <DataRow label="根目录" value={result.roots[0] ?? emptyDash}/>
                        <DataRow label="CLI 路径" value={result.cliSnapshot.executablePath || emptyDash}/>
                        <DataRow label="诊断状态" value={cliStatusLabels[result.cliSnapshot.doctorStatus] ?? result.cliSnapshot.doctorStatus}/>
                        <DataRow label="Resume" value={result.cliSnapshot.resumeSupported ? '支持' : '不支持'}/>
                    </div>
                </article>

                <article className="面板">
                    <header className="面板头">
                        <h2>产物</h2>
                    </header>
                    <div className="数据列">
                        <DataRow label="发现清单" value={result.discoveryPath}/>
                        <DataRow label="执行前清单" value={result.manifestPath}/>
                        <DataRow label="未识别对象" value={result.unknownItemsPath}/>
                    </div>
                </article>
            </section>

            <section className="双栏">
                <article className="面板">
                    <header className="面板头">
                        <h2>警告</h2>
                        <StatusBadge
                            label={result.summary.warningCount === 0 ? '无' : String(result.summary.warningCount)}
                            tone={warningTone}
                        />
                    </header>
                    {result.warnings.length === 0 ? (
                        <div className="空态">无</div>
                    ) : (
                        <ul className="警告列表">
                            {result.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                        </ul>
                    )}
                </article>

                <article className="面板">
                    <header className="面板头">
                        <h2>扫描对象</h2>
                        <StatusBadge
                            label={String(result.summary.itemCount)}
                            tone="neutral"
                        />
                    </header>
                    <ItemTable items={result.items}/>
                </article>
            </section>
        </div>
    );
}

function App() {
    const [workspace, setWorkspace] = useState<WorkspaceState>({kind: 'idle'});
    const [isPending, startTransition] = useTransition();

    const runScan = () => {
        startTransition(() => {
            setWorkspace({kind: 'running'});
            RunReadOnlyScan({
                codexHome: '',
                extraRoots: [],
                outputDir: '',
                includeBrowserSidecars: false,
            }).then((result) => setWorkspace({kind: 'ready', result}))
                .catch((error) => setWorkspace({kind: 'error', message: String(error)}));
        });
    };

    return (
        <main className="工作台">
            <section className="顶栏">
                <div className="标题区">
                    <h1>Codex 历史清理</h1>
                    <div className="次信息">
                        <span>只读扫描</span>
                        <span>当前用户</span>
                        <span>.codex</span>
                    </div>
                </div>
                <button className="主按钮" disabled={isPending} onClick={runScan} type="button">
                    {isPending ? '扫描中' : '开始扫描'}
                </button>
            </section>
            <ResultPanel workspace={workspace}/>
        </main>
    );
}

export default App;
