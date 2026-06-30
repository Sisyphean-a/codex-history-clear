import {FormEvent, useState, useTransition} from 'react';
import './App.css';
import {RunReadOnlyScan} from "../wailsjs/go/main/App";

type ScanResult = {
    runId: string;
    discoveryPath: string;
    manifestPath: string;
    unknownItemsPath: string;
    summary: { rootCount: number; itemCount: number; warningCount: number };
    warnings: string[];
    items: Array<{ path: string; kind: string }>;
    cliSnapshot: {
        executablePath: string;
        available: boolean;
        doctorStatus: string;
        resumeSupported: boolean;
    };
};

const previewItems = (items: ScanResult['items']) => items.slice(0, 5);

type WorkspaceState =
    | { kind: 'idle' }
    | { kind: 'running'; message: string }
    | { kind: 'ready'; result: ScanResult }
    | { kind: 'error'; message: string };

type FormState = {
    codexHome: string;
    extraRoots: string;
    outputDir: string;
    includeBrowserSidecars: boolean;
};

const initialForm: FormState = {
    codexHome: '',
    extraRoots: '',
    outputDir: '',
    includeBrowserSidecars: false,
};

const parseRoots = (value: string) =>
    value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);

function ResultPanel({workspace}: { workspace: WorkspaceState }) {
    if (workspace.kind === 'idle') return <p className="hint">还没有扫描结果。先触发一次只读发现。</p>;
    if (workspace.kind === 'running') return <p className="hint">{workspace.message}</p>;
    if (workspace.kind === 'error') return <p className="error-text">{workspace.message}</p>;

    const hasWarnings = workspace.result.warnings.length > 0;
    return (
        <section className="result-shell">
            <div className="result-grid">
                <span>run_id</span><strong>{workspace.result.runId}</strong>
                <span>roots</span><strong>{workspace.result.summary.rootCount}</strong>
                <span>items</span><strong>{workspace.result.summary.itemCount}</strong>
                <span>warnings</span><strong>{workspace.result.summary.warningCount}</strong>
            </div>
            <div className="status-grid">
                <span>CLI available</span><strong>{workspace.result.cliSnapshot.available ? 'yes' : 'no'}</strong>
                <span>Doctor status</span><strong>{workspace.result.cliSnapshot.doctorStatus}</strong>
                <span>Resume support</span><strong>{workspace.result.cliSnapshot.resumeSupported ? 'yes' : 'no'}</strong>
            </div>
            <div className="artifact-list">
                <code>{workspace.result.discoveryPath}</code>
                <code>{workspace.result.manifestPath}</code>
                <code>{workspace.result.unknownItemsPath}</code>
            </div>
            <section className={hasWarnings ? 'notice warning' : 'notice success'}>
                <h3>Warnings</h3>
                {hasWarnings
                    ? <ul>{workspace.result.warnings.map((item) => <li key={item}>{item}</li>)}</ul>
                    : <p>这次扫描没有返回 warning。</p>}
            </section>
            <section className="item-preview">
                <h3>Discovered items</h3>
                <ul>
                    {previewItems(workspace.result.items).map((item) =>
                        <li key={`${item.kind}:${item.path}`}>
                            <strong>{item.kind}</strong>
                            <code>{item.path}</code>
                        </li>
                    )}
                </ul>
                {workspace.result.items.length > 5 ? <p>仅展示前 5 项，完整对象清单已写入 `discovery.json`。</p> : null}
            </section>
        </section>
    );
}

function App() {
    const [form, setForm] = useState(initialForm);
    const [workspace, setWorkspace] = useState<WorkspaceState>({kind: 'idle'});
    const [isPending, startTransition] = useTransition();
    const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
        setForm((current) => ({...current, [key]: value}));
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        startTransition(() => {
            setWorkspace({kind: 'running', message: '正在采集候选根目录、CLI 诊断并写入 artifact...'});
            RunReadOnlyScan({
                codexHome: form.codexHome,
                extraRoots: parseRoots(form.extraRoots),
                outputDir: form.outputDir,
                includeBrowserSidecars: form.includeBrowserSidecars,
            }).then((result) => setWorkspace({kind: 'ready', result}))
                .catch((error) => setWorkspace({kind: 'error', message: String(error)}));
        });
    };

    return (
        <main className="workspace">
            <section className="hero">
                <p className="eyebrow">STEP 4 · WORKSPACE PROJECTION</p>
                <h1>Codex History Manager</h1>
                <p className="lede">当前仍是只读扫描，但现在会把 discovery / manifest artifact 真正落盘，并把 warning、CLI 状态和对象摘要投影到工作区。</p>
            </section>
            <form className="shell-card" onSubmit={submit}>
                <label><span>CODEX_HOME</span><input value={form.codexHome} onChange={(e) => update('codexHome', e.target.value)} placeholder="C:\\Users\\you\\.codex"/></label>
                <label><span>Extra roots</span><textarea value={form.extraRoots} onChange={(e) => update('extraRoots', e.target.value)} placeholder={"D:\\backup\\.codex\nE:\\lab\\.codex"}/></label>
                <label><span>Output dir</span><input value={form.outputDir} onChange={(e) => update('outputDir', e.target.value)} placeholder="留空时使用 tmp\\runs\\&lt;run_id&gt;"/></label>
                <label className="toggle"><input checked={form.includeBrowserSidecars} onChange={(e) => update('includeBrowserSidecars', e.target.checked)} type="checkbox"/><span>Include browser sidecars</span></label>
                <div className="actions"><button className="primary" disabled={isPending} type="submit">{isPending ? 'Scanning...' : 'Run Discovery Scan'}</button></div>
            </form>
            <section className="shell-card evidence"><h2>Workspace state</h2><ResultPanel workspace={workspace}/></section>
        </main>
    );
}

export default App;
