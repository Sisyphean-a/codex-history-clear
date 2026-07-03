import type {HistoryWorkspaceController} from './history-workspace-controller';
import {
    AdvancedDetails,
    ControlPanel,
    OverviewPanel,
    PlanPanel,
    SessionPanel,
} from './history-workspace-panels';
import {StatusBar, ToolbarPanel} from './history-workspace-ui';

export function HistoryWorkspaceView(props: HistoryWorkspaceController) {
    return (
        <article className="工具壳">
            <ToolbarPanel {...props}/>
            {props.error ? <div className="错误横幅">{props.error}</div> : null}
            <section className="主工作区">
                <aside className="工具侧栏">
                    <OverviewPanel {...props}/>
                    <ControlPanel {...props}/>
                </aside>
                <SessionPanel {...props}/>
                <PlanPanel {...props}/>
            </section>
            <AdvancedDetails {...props}/>
            <StatusBar {...props}/>
        </article>
    );
}
