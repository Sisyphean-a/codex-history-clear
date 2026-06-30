package main

import "codex-history-manager/internal/discovery"

type ScanRequest struct {
	CodexHome              string   `json:"codexHome"`
	ExtraRoots             []string `json:"extraRoots"`
	IncludeBrowserSidecars bool     `json:"includeBrowserSidecars"`
	OutputDir              string   `json:"outputDir"`
}

type ScanSummary struct {
	RootCount    int `json:"rootCount"`
	ItemCount    int `json:"itemCount"`
	WarningCount int `json:"warningCount"`
}

type DiscoveryItem struct {
	SourceRoot string   `json:"sourceRoot"`
	Path       string   `json:"path"`
	Kind       string   `json:"kind"`
	Size       int64    `json:"size"`
	MTimeUTC   string   `json:"mtimeUtc"`
	Attributes []string `json:"attributes"`
	LinkType   *string  `json:"linkType"`
	Target     *string  `json:"target"`
}

type CLISnapshot struct {
	ExecutablePath  string `json:"executablePath"`
	Available       bool   `json:"available"`
	DoctorStatus    string `json:"doctorStatus"`
	ResumeSupported bool   `json:"resumeSupported"`
}

type ScanResult struct {
	RunID            string          `json:"runId"`
	DiscoveryPath    string          `json:"discoveryPath"`
	ManifestPath     string          `json:"manifestPath"`
	UnknownItemsPath string          `json:"unknownItemsPath"`
	Summary          ScanSummary     `json:"summary"`
	Warnings         []string        `json:"warnings"`
	Items            []DiscoveryItem `json:"items"`
	CLISnapshot      CLISnapshot     `json:"cliSnapshot"`
}

func (a *App) RunReadOnlyScan(request ScanRequest) (ScanResult, error) {
	result, err := a.discovery.RunReadOnlyScan(discovery.ScanRequest{
		CodexHome:              request.CodexHome,
		ExtraRoots:             request.ExtraRoots,
		IncludeBrowserSidecars: request.IncludeBrowserSidecars,
		OutputDir:              request.OutputDir,
	})
	if err != nil {
		return ScanResult{}, err
	}

	return mapScanResult(result), nil
}

func mapScanResult(result discovery.ScanResult) ScanResult {
	items := make([]DiscoveryItem, 0, len(result.Items))
	for _, item := range result.Items {
		items = append(items, DiscoveryItem{
			SourceRoot: item.SourceRoot,
			Path:       item.Path,
			Kind:       item.Kind,
			Size:       item.Size,
			MTimeUTC:   item.MTimeUTC,
			Attributes: item.Attributes,
			LinkType:   item.LinkType,
			Target:     item.Target,
		})
	}

	return ScanResult{
		RunID:            result.RunID,
		DiscoveryPath:    result.DiscoveryPath,
		ManifestPath:     result.ManifestPath,
		UnknownItemsPath: result.UnknownItemsPath,
		Summary: ScanSummary{
			RootCount:    result.Summary.RootCount,
			ItemCount:    result.Summary.ItemCount,
			WarningCount: result.Summary.WarningCount,
		},
		Warnings: result.Warnings,
		Items:    items,
		CLISnapshot: CLISnapshot{
			ExecutablePath:  result.CLISnapshot.ExecutablePath,
			Available:       result.CLISnapshot.Available,
			DoctorStatus:    result.CLISnapshot.DoctorStatus,
			ResumeSupported: result.CLISnapshot.ResumeSupported,
		},
	}
}
