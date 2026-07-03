package history

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

func buildDeletePlan(paths codexPaths, targets []ThreadSummary, runID string) (PlanResult, error) {
	outputDir := outputDirFor(runID)
	if err := os.MkdirAll(outputDir, 0o755); err != nil {
		return PlanResult{}, err
	}
	planTargets := make([]PlanTarget, 0, len(targets))
	warnings := []string{}
	for _, target := range targets {
		planTarget, err := buildPlanTarget(paths, target)
		if err != nil {
			return PlanResult{}, err
		}
		planTargets = append(planTargets, planTarget)
		warnings = append(warnings, planTarget.Warnings...)
	}
	sort.Slice(planTargets, func(i, j int) bool {
		return planTargets[i].Thread.UpdatedAt > planTargets[j].Thread.UpdatedAt
	})
	document := planDocument{
		RunID:     runID,
		CodexHome: paths.codexHome,
		Approved:  false,
		Summary:   planSummary(planTargets, warnings),
		Targets:   planTargets,
		Warnings:  warnings,
	}
	planPath := filepath.Join(outputDir, "delete-plan.json")
	if err := writeJSON(planPath, document); err != nil {
		return PlanResult{}, err
	}
	return PlanResult{
		RunID:     document.RunID,
		CodexHome: document.CodexHome,
		PlanPath:  planPath,
		Summary:   document.Summary,
		Targets:   document.Targets,
		Warnings:  document.Warnings,
	}, nil
}

func buildPlanTarget(paths codexPaths, target ThreadSummary) (PlanTarget, error) {
	stores, err := planDatabaseStores(paths, target.ID)
	if err != nil {
		return PlanTarget{}, err
	}
	metadataStores, err := planMetadataStores(paths, target.ID)
	if err != nil {
		return PlanTarget{}, err
	}
	stores = append(stores, metadataStores...)
	rolloutStores, warnings := planRolloutStores(paths, target)
	stores = append(stores, rolloutStores...)
	return PlanTarget{
		Thread:   target,
		Stores:   stores,
		Warnings: warnings,
	}, nil
}

func planDatabaseStores(paths codexPaths, threadID string) ([]PlanStore, error) {
	stores, err := planStateStores(paths.stateDB, threadID)
	if err != nil {
		return nil, err
	}
	for _, spec := range []struct {
		path   string
		table  string
		column string
		store  string
	}{
		{path: paths.logsDB, table: "logs", column: "thread_id", store: "logs_db.logs"},
		{path: paths.goalsDB, table: "thread_goals", column: "thread_id", store: "goals_db.thread_goals"},
	} {
		next, err := planSingleTable(spec.path, spec.table, spec.column, threadID, spec.store)
		if err != nil {
			return nil, err
		}
		stores = append(stores, next)
	}
	return stores, nil
}

func planMetadataStores(paths codexPaths, threadID string) ([]PlanStore, error) {
	ids := map[string]struct{}{threadID: {}}
	stores := make([]PlanStore, 0, 4)
	for _, next := range []func() (PlanStore, error){
		func() (PlanStore, error) {
			return planJSONLRewrite(paths.sessionIndex, "session_index", ids, countSessionIndexMatches)
		},
		func() (PlanStore, error) {
			return planJSONLRewrite(paths.history, "history_jsonl", ids, countHistoryMatches)
		},
		func() (PlanStore, error) { return planJSONRewrite(paths.globalState, "global_state", ids) },
		func() (PlanStore, error) { return planJSONRewrite(paths.globalStateBackup, "global_state_backup", ids) },
	} {
		planned, err := next()
		if err != nil {
			return nil, err
		}
		stores = append(stores, planned)
	}
	return stores, nil
}

func planRolloutStores(paths codexPaths, target ThreadSummary) ([]PlanStore, []string) {
	stores := []PlanStore{planDeleteFile(target.RolloutPath, "rollout_jsonl")}
	warnings := []string{}
	if target.RolloutPath == "" {
		warnings = append(warnings, fmt.Sprintf("会话 %s 缺少 rollout_path", target.ID))
	}
	for _, snapshot := range findShellSnapshots(paths.shellSnapshotsDir, target.ID) {
		stores = append(stores, planDeleteFile(snapshot, "shell_snapshot"))
	}
	return stores, warnings
}

func planStateStores(path string, threadID string) ([]PlanStore, error) {
	stores := []PlanStore{}
	store, err := planSingleTable(path, "threads", "id", threadID, "state_db.threads")
	if err != nil {
		return nil, err
	}
	store.Detail = "delete target thread row"
	stores = append(stores, store)
	for _, spec := range []struct {
		table string
		col   string
		name  string
	}{
		{table: "thread_dynamic_tools", col: "thread_id", name: "state_db.thread_dynamic_tools"},
		{table: "thread_spawn_edges", col: "parent_thread_id", name: "state_db.thread_spawn_edges.parent"},
		{table: "thread_spawn_edges", col: "child_thread_id", name: "state_db.thread_spawn_edges.child"},
		{table: "agent_job_items", col: "assigned_thread_id", name: "state_db.agent_job_items"},
	} {
		next, err := planSingleTable(path, spec.table, spec.col, threadID, spec.name)
		if err != nil {
			return nil, err
		}
		stores = append(stores, next)
	}
	return stores, nil
}

func planSingleTable(path string, table string, column string, threadID string, storeName string) (PlanStore, error) {
	if !fileExists(path) {
		return PlanStore{Store: storeName, Path: path, Action: "inspect", Detail: "store is missing", Exists: false}, nil
	}
	db, err := openReadonlyDatabase(path)
	if err != nil {
		return PlanStore{}, err
	}
	defer db.Close()
	count, err := countWhere(db, table, column, threadID)
	if err != nil {
		return PlanStore{}, err
	}
	action := "delete_rows"
	detail := "delete matching rows"
	if table == "agent_job_items" {
		action = "rewrite_rows"
		detail = "clear assigned_thread_id references"
	}
	return PlanStore{
		Store:  storeName,
		Path:   path,
		Action: action,
		Detail: detail,
		Count:  count,
		Exists: true,
	}, nil
}

func planJSONLRewrite(path string, store string, ids map[string]struct{}, counter func(string, map[string]struct{}) (int64, error)) (PlanStore, error) {
	count, err := counter(path, ids)
	if err != nil {
		return PlanStore{}, err
	}
	return PlanStore{
		Store:  store,
		Path:   path,
		Action: "rewrite_jsonl",
		Detail: "remove matching entries",
		Count:  count,
		Exists: fileExists(path),
	}, nil
}

func planJSONRewrite(path string, store string, ids map[string]struct{}) (PlanStore, error) {
	count, err := countGlobalStateMatches(path, ids)
	if err != nil {
		return PlanStore{}, err
	}
	return PlanStore{
		Store:  store,
		Path:   path,
		Action: "rewrite_json",
		Detail: "remove known thread references",
		Count:  count,
		Exists: fileExists(path),
	}, nil
}

func planDeleteFile(path string, store string) PlanStore {
	info, err := os.Stat(path)
	if err != nil {
		return PlanStore{Store: store, Path: path, Action: "delete_file", Detail: "delete file", Exists: false}
	}
	return PlanStore{
		Store:  store,
		Path:   path,
		Action: "delete_file",
		Detail: "delete file",
		Count:  info.Size(),
		Exists: true,
	}
}

func planSummary(targets []PlanTarget, warnings []string) PlanSummary {
	storeCount := 0
	for _, target := range targets {
		storeCount += len(target.Stores)
	}
	return PlanSummary{
		TargetCount:  len(targets),
		StoreCount:   storeCount,
		WarningCount: len(warnings),
	}
}

func findShellSnapshots(dir string, threadID string) []string {
	if !fileExists(dir) {
		return nil
	}
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil
	}
	snapshots := []string{}
	for _, entry := range entries {
		name := entry.Name()
		if entry.IsDir() || !strings.HasPrefix(name, threadID+".") || !strings.HasSuffix(name, ".sh") {
			continue
		}
		snapshots = append(snapshots, filepath.Join(dir, name))
	}
	sort.Strings(snapshots)
	return snapshots
}
