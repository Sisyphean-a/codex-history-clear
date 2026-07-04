import type {HistoryWorkspaceController} from './history-workspace-controller';
import {HistoryThreadTable} from './history-workspace-tables';

export function SessionPanel(props: HistoryWorkspaceController) {
    return (
        <section className="面板 列表面板">
            <HistoryThreadTable
                items={props.visibleThreads}
                scanWorkspace={props.scanWorkspace}
                selectedIds={props.selectedIds}
                toggleSelected={props.actions.toggleSelected}
            />
        </section>
    );
}
