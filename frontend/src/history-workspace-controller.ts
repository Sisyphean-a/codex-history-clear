import {type Dispatch, type SetStateAction, useState} from 'react';
import {
    ApproveHistoryDeletePlan,
    BuildHistoryDeletePlan,
    ExecuteHistoryDeletePlan,
    ExportHistoryEvidencePack,
    ListHistoryThreads,
    RollbackHistoryDelete,
} from '../wailsjs/go/main/App';
import type {
    HistoryApproveResult,
    HistoryEvidencePackResult,
    HistoryExecutionResult,
    HistoryListResult,
    HistoryPlanResult,
    HistoryRollbackResult,
} from './history-types';

export type HistoryLoadingState = 'list' | 'plan' | 'execute' | 'rollback' | 'export' | null;

type HistoryWorkspaceState = {
    grep: string;
    setGrep: (value: string) => void;
    cwd: string;
    setCwd: (value: string) => void;
    archivedOnly: boolean;
    setArchivedOnly: (value: boolean) => void;
    loading: HistoryLoadingState;
    setLoading: (value: HistoryLoadingState) => void;
    error: string | null;
    setError: (value: string | null) => void;
    listResult: HistoryListResult | null;
    setListResult: (value: HistoryListResult | null) => void;
    selectedIds: string[];
    setSelectedIds: Dispatch<SetStateAction<string[]>>;
    planResult: HistoryPlanResult | null;
    setPlanResult: (value: HistoryPlanResult | null) => void;
    executionResult: HistoryExecutionResult | null;
    setExecutionResult: (value: HistoryExecutionResult | null) => void;
    rollbackResult: HistoryRollbackResult | null;
    setRollbackResult: (value: HistoryRollbackResult | null) => void;
    evidencePackResult: HistoryEvidencePackResult | null;
    setEvidencePackResult: (value: HistoryEvidencePackResult | null) => void;
    confirmText: string;
    setConfirmText: (value: string) => void;
};

export type HistoryWorkspaceController = {
    grep: string;
    setGrep: (value: string) => void;
    cwd: string;
    setCwd: (value: string) => void;
    archivedOnly: boolean;
    setArchivedOnly: (value: boolean) => void;
    loading: HistoryLoadingState;
    error: string | null;
    listResult: HistoryListResult | null;
    selectedIds: string[];
    planResult: HistoryPlanResult | null;
    executionResult: HistoryExecutionResult | null;
    rollbackResult: HistoryRollbackResult | null;
    evidencePackResult: HistoryEvidencePackResult | null;
    confirmText: string;
    setConfirmText: (value: string) => void;
    loadThreads: () => Promise<void>;
    buildPlan: () => Promise<void>;
    executePlan: () => Promise<void>;
    backupPlan: () => Promise<void>;
    rollbackPlan: () => Promise<void>;
    exportEvidencePack: () => Promise<void>;
    toggleSelected: (threadID: string) => void;
};

function useHistoryFilterState() {
    const [grep, setGrep] = useState('');
    const [cwd, setCwd] = useState('');
    const [archivedOnly, setArchivedOnly] = useState(false);
    return {grep, setGrep, cwd, setCwd, archivedOnly, setArchivedOnly};
}

function useHistoryTaskState() {
    const [loading, setLoading] = useState<HistoryLoadingState>(null);
    const [error, setError] = useState<string | null>(null);
    const [listResult, setListResult] = useState<HistoryListResult | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    return {loading, setLoading, error, setError, listResult, setListResult, selectedIds, setSelectedIds};
}

function useHistoryArtifactState() {
    const [planResult, setPlanResult] = useState<HistoryPlanResult | null>(null);
    const [executionResult, setExecutionResult] = useState<HistoryExecutionResult | null>(null);
    const [rollbackResult, setRollbackResult] = useState<HistoryRollbackResult | null>(null);
    const [evidencePackResult, setEvidencePackResult] = useState<HistoryEvidencePackResult | null>(null);
    const [confirmText, setConfirmText] = useState('');
    return {planResult, setPlanResult, executionResult, setExecutionResult, rollbackResult, setRollbackResult, evidencePackResult, setEvidencePackResult, confirmText, setConfirmText};
}

function useHistoryWorkspaceState(): HistoryWorkspaceState {
    return {
        ...useHistoryFilterState(),
        ...useHistoryTaskState(),
        ...useHistoryArtifactState(),
    };
}

async function withLoading(kind: Exclude<HistoryLoadingState, null>, state: HistoryWorkspaceState, task: () => Promise<void>) {
    state.setLoading(kind);
    state.setError(null);
    try {
        await task();
    } catch (cause) {
        state.setError(String(cause));
    } finally {
        state.setLoading(null);
    }
}

function resetExecutionArtifacts(state: HistoryWorkspaceState) {
    state.setExecutionResult(null);
    state.setRollbackResult(null);
    state.setEvidencePackResult(null);
    state.setConfirmText('');
}

async function approvePlan(planResult: HistoryPlanResult): Promise<HistoryApproveResult> {
    return ApproveHistoryDeletePlan({planPath: planResult.planPath});
}

function buildEvidenceRequest(state: HistoryWorkspaceState) {
	return {
		runId: state.executionResult?.runId ?? state.planResult?.runId ?? '',
		discoveryPath: '',
		manifestBeforePath: '',
		duplicateGroupsPath: '',
		deletePlanPath: state.planResult?.planPath ?? '',
		approvedPlanPath: state.executionResult?.approvedPlanPath ?? '',
		rollbackJournalPath: state.executionResult?.rollbackJournalPath ?? '',
		execResultPath: state.executionResult?.execResultPath ?? '',
		manifestAfterPath: state.executionResult?.manifestAfterPath ?? '',
		goalReportPath: '',
		iterationReportPath: '',
		roadmapPath: '',
		requirementPath: '',
	};
}

function useHistoryWorkspaceActions(state: HistoryWorkspaceState) {
    const loadThreads = () => withLoading('list', state, async () => {
        const result = await ListHistoryThreads({limit: 80, grep: state.grep, cwd: state.cwd, archived: state.archivedOnly, all: false});
        state.setListResult(result);
        state.setSelectedIds((current) => current.filter((id) => result.items.some((item) => item.id === id)));
    });
    const buildPlan = () => state.selectedIds.length === 0 ? Promise.resolve() : withLoading('plan', state, async () => {
        const result = await BuildHistoryDeletePlan({threadIds: state.selectedIds});
        state.setPlanResult(result);
        resetExecutionArtifacts(state);
    });
    const runExecution = (backupOnly: boolean) => !state.planResult ? Promise.resolve() : withLoading('execute', state, async () => {
        const planResult = state.planResult;
        if (!planResult) return;
        const approval = await approvePlan(planResult);
        const result = await ExecuteHistoryDeletePlan({planPath: approval.approvedPlanPath, confirmed: true, backupOnly});
        state.setExecutionResult(result);
        state.setRollbackResult(null);
        state.setEvidencePackResult(null);
        state.setConfirmText('');
        if (!backupOnly) {
            await loadThreads();
        }
    });
    const exportEvidencePack = () => withLoading('export', state, async () => {
        const result = await ExportHistoryEvidencePack(buildEvidenceRequest(state));
        state.setEvidencePackResult(result);
    });
    const rollbackPlan = () => !state.executionResult ? Promise.resolve() : withLoading('rollback', state, async () => {
        const executionResult = state.executionResult;
        if (!executionResult) return;
        const result = await RollbackHistoryDelete({journalPath: executionResult.rollbackJournalPath});
        state.setRollbackResult(result);
        await loadThreads();
    });
    const toggleSelected = (threadID: string) => {
        state.setSelectedIds((current) => current.includes(threadID) ? current.filter((id) => id !== threadID) : [...current, threadID]);
    };
    return {
        loadThreads,
        buildPlan,
        executePlan: () => runExecution(false),
        backupPlan: () => runExecution(true),
        rollbackPlan,
        exportEvidencePack,
        toggleSelected,
    };
}

export function useHistoryWorkspaceController(): HistoryWorkspaceController {
    const state = useHistoryWorkspaceState();
    const actions = useHistoryWorkspaceActions(state);
    return {
        grep: state.grep,
        setGrep: state.setGrep,
        cwd: state.cwd,
        setCwd: state.setCwd,
        archivedOnly: state.archivedOnly,
        setArchivedOnly: state.setArchivedOnly,
        loading: state.loading,
        error: state.error,
        listResult: state.listResult,
        selectedIds: state.selectedIds,
        planResult: state.planResult,
        executionResult: state.executionResult,
        rollbackResult: state.rollbackResult,
        evidencePackResult: state.evidencePackResult,
        confirmText: state.confirmText,
        setConfirmText: state.setConfirmText,
        ...actions,
    };
}
