import './history-workspace.css';
import {useHistoryWorkspaceController} from './history-workspace-controller';
import {HistoryWorkspaceView} from './history-workspace-view';

export function HistoryWorkspace() {
    const controller = useHistoryWorkspaceController();
    return <HistoryWorkspaceView {...controller}/>;
}
