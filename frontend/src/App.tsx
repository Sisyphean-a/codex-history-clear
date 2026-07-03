import {useState, useTransition} from 'react';
import './App.css';
import {BuildDeletePlan, RunReadOnlyScan} from "../wailsjs/go/main/App";
import {HistoryWorkspace} from "./history-workspace";
import {ResultPanel} from "./workspace";
import type {WorkspaceState} from "./workspace-types";

function WorkspacePreview({workspace}: { workspace: WorkspaceState }) {
    return (
        <article className="面板 功能卡">
            <header className="面板头">
                <div>
                    <h2>重复治理预览</h2>
                    <div className="次信息">
                        <span>只读扫描</span>
                        <span>重复组复核</span>
                        <span>删除计划预览</span>
                    </div>
                </div>
            </header>
            <ResultPanel workspace={workspace}/>
        </article>
    );
}

function App() {
    const [workspace, setWorkspace] = useState<WorkspaceState>({kind: 'idle'});
    const [isPending, startTransition] = useTransition();

    const runPlanning = () => {
        startTransition(() => {
            setWorkspace({kind: 'running'});
            RunReadOnlyScan()
                .then((scan) => BuildDeletePlan(scan.manifestPath).then((plan) => ({scan, plan})))
                .then(({scan, plan}) => setWorkspace({kind: 'ready', scan, plan}))
                .catch((error) => setWorkspace({kind: 'error', message: String(error)}));
        });
    };

    return (
        <main className="工作台">
            <section className="顶栏">
                <div className="标题区">
                    <h1>Codex 历史治理台</h1>
                    <div className="次信息">
                        <span>只读扫描</span>
                        <span>重复组</span>
                        <span>删除计划</span>
                        <span>先审后删</span>
                    </div>
                </div>
                <button className="主按钮" disabled={isPending} onClick={runPlanning} type="button">
                    {isPending ? '处理中' : '扫描并生成计划'}
                </button>
            </section>
            <section className="功能列">
                <WorkspacePreview workspace={workspace}/>
                <HistoryWorkspace/>
            </section>
        </main>
    );
}

export default App;
