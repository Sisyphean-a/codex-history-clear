import {useState, useTransition} from 'react';
import './App.css';
import {BuildDeletePlan, RunReadOnlyScan} from "../wailsjs/go/main/App";
import {ResultPanel} from "./workspace";
import type {WorkspaceState} from "./workspace-types";

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
                        <span>approved=false</span>
                    </div>
                </div>
                <button className="主按钮" disabled={isPending} onClick={runPlanning} type="button">
                    {isPending ? '处理中' : '扫描并生成计划'}
                </button>
            </section>
            <ResultPanel workspace={workspace}/>
        </main>
    );
}

export default App;
