import type {HistoryWorkspaceController} from './history-workspace-contract';
import {
    createPlanReset,
    useBoundControllerEffects,
    useControllerStore,
    useDerivedWorkspaceData,
    usePlanActions,
    useSelectionActions,
    useViewValueSetter,
    useWorkspaceActions,
} from './history-workspace-controller-internals';
import {
    buildActionSet,
    buildFilters,
    buildOverview,
    buildPlanState,
    buildStrategyState,
} from './history-workspace-controller-builders';

export type {HistoryWorkspaceController} from './history-workspace-contract';

export function useHistoryWorkspaceController(): HistoryWorkspaceController {
    const store = useControllerStore();
    const derived = useDerivedWorkspaceData(store.listResult, store.scanWorkspace, store.view);
    const setViewValue = useViewValueSetter(store.setView);
    const resetPlanArtifacts = createPlanReset(store);
    const workspaceActions = useWorkspaceActions({store, resetPlanArtifacts});
    const selectionActions = useSelectionActions({
        setView: store.setView,
        selectedIds: derived.selectedIds,
        strategy: store.view.strategy,
        projectChoices: derived.projectChoices,
    });
    const planActions = usePlanActions({
        store,
        selectedIds: derived.selectedIds,
        selectionSignature: derived.selectionSignature,
        resetPlanArtifacts,
        refreshWorkspace: workspaceActions.refreshWorkspace,
    });
    useBoundControllerEffects({store, derived, startScan: workspaceActions.startScan, resetPlanArtifacts});
    return {
        loading: store.loading,
        error: store.error,
        workspaceConfig: store.workspaceConfig,
        scanWorkspace: store.scanWorkspace,
        listResult: store.listResult,
        visibleThreads: derived.visibleThreads,
        projectChoices: derived.projectChoices,
        selectedIds: derived.selectedIds,
        confirmPhrase: 'CLEAN',
        overview: buildOverview({
            allThreads: derived.allThreads,
            selectedIds: derived.selectedIds,
            selectedSize: derived.selectedSize,
            executionResult: store.executionResult,
        }),
        filters: buildFilters(store.view, setViewValue),
        strategyState: buildStrategyState(store.view, setViewValue, selectionActions.chooseStrategy),
        planState: buildPlanState({store, view: store.view, visibleThreads: derived.visibleThreads, selectedIds: derived.selectedIds, unknownCount: derived.unknownCount, setViewValue}),
        actions: buildActionSet(workspaceActions, selectionActions, planActions),
    };
}
