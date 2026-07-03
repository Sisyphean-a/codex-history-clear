package main

import (
	"os"
	"path/filepath"
	"sort"

	"codex-history-manager/internal/history"
)

func (a *App) ListHistoryThreads(request history.ListRequest) (history.ListResult, error) {
	return a.history.ListThreads(request)
}

func (a *App) BuildHistoryDeletePlan(request history.BuildPlanRequest) (history.PlanResult, error) {
	return a.history.BuildDeletePlan(request)
}

func (a *App) ApproveHistoryDeletePlan(request history.ApproveRequest) (history.ApproveResult, error) {
	return a.history.ApproveDeletePlan(request)
}

func (a *App) ExecuteHistoryDeletePlan(request history.ExecuteRequest) (history.ExecuteResult, error) {
	return a.history.ExecuteDeletePlan(request)
}

func (a *App) RollbackHistoryDelete(request history.RollbackRequest) (history.RollbackResult, error) {
	return a.history.RollbackExecution(request)
}

func (a *App) ExportHistoryEvidencePack(request history.EvidencePackRequest) (history.EvidencePackResult, error) {
	request = a.fillEvidenceArtifacts(request)
	return a.history.ExportEvidencePack(request)
}

func (a *App) fillEvidenceArtifacts(request history.EvidencePackRequest) history.EvidencePackRequest {
	if request.DiscoveryPath == "" || request.ManifestBeforePath == "" || request.DuplicateGroupsPath == "" {
		if scan, plan, err := a.rebuildReadOnlyArtifacts(); err == nil {
			request.DiscoveryPath = scan.DiscoveryPath
			request.ManifestBeforePath = scan.ManifestPath
			request.DuplicateGroupsPath = plan.DuplicateGroupsPath
		}
	}
	request.GoalReportPath = repoDocPath(".codestable", "goals", "2026-06-30-codex-history-manager", "goal.md")
	request.IterationReportPath = latestIterationPath()
	request.RoadmapPath = repoDocPath(".codestable", "roadmap", "codex-history-manager", "codex-history-manager-roadmap.md")
	request.RequirementPath = repoDocPath(".codestable", "requirements", "codex-history-management.md")
	return request
}

func (a *App) rebuildReadOnlyArtifacts() (ScanResult, DeletePlanResult, error) {
	scan, err := a.RunReadOnlyScan()
	if err != nil {
		return ScanResult{}, DeletePlanResult{}, err
	}
	plan, err := a.BuildDeletePlan(scan.ManifestPath)
	if err != nil {
		return ScanResult{}, DeletePlanResult{}, err
	}
	return scan, plan, nil
}

func latestIterationPath() string {
	dir := repoDocPath(".codestable", "goals", "2026-06-30-codex-history-manager", "iterations")
	entries, err := os.ReadDir(dir)
	if err != nil {
		return ""
	}
	names := []string{}
	for _, entry := range entries {
		if entry.IsDir() || filepath.Ext(entry.Name()) != ".md" {
			continue
		}
		names = append(names, entry.Name())
	}
	if len(names) == 0 {
		return ""
	}
	sort.Strings(names)
	return filepath.Join(dir, names[len(names)-1])
}

func repoDocPath(parts ...string) string {
	path := filepath.Join(parts...)
	if _, err := os.Stat(path); err != nil {
		return ""
	}
	return path
}
