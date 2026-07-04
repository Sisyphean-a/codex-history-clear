import type {HistoryWorkspaceController} from './history-workspace-controller';
import {HistoryThreadTable} from './history-workspace-thread-table';

export function SessionPanel(props: HistoryWorkspaceController) {
    return (
        <section className="面板 列表面板">
            <HistoryThreadTable
                allItems={props.listResult?.items ?? []}
                duplicateAnalysis={props.duplicateAnalysis}
                items={props.visibleThreads}
                selectedIds={props.selectedIds}
                toggleSelected={props.actions.toggleSelected}
            />
        </section>
    );
}
