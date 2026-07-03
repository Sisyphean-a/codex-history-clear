import type {AgeFilter, ArchivedFilter, CleanupStrategy, SizeFilter} from './history-workspace-helpers';

export type ViewState = {
    titleQuery: string;
    projectQuery: string;
    archivedFilter: ArchivedFilter;
    ageFilter: AgeFilter;
    sizeFilter: SizeFilter;
    strategy: CleanupStrategy;
    selectedProject: string;
    autoBackup: boolean;
    keepRecent: boolean;
    generateReport: boolean;
    skipUnknown: boolean;
    manualSelectedIds: string[];
    confirmText: string;
};

export function initialViewState(): ViewState {
    return {
        titleQuery: '',
        projectQuery: '',
        archivedFilter: 'all',
        ageFilter: 'any',
        sizeFilter: 'any',
        strategy: 'recommended',
        selectedProject: '',
        autoBackup: true,
        keepRecent: true,
        generateReport: true,
        skipUnknown: true,
        manualSelectedIds: [],
        confirmText: '',
    };
}
