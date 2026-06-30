package discovery

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

type Service struct {
	now         func() time.Time
	lookupEnv   func(string) string
	userHomeDir func() (string, error)
	lookPath    func(string) (string, error)
	runCommand  func(time.Duration, string, ...string) (string, error)
}

func NewService() *Service {
	return &Service{
		now:         time.Now,
		lookupEnv:   os.Getenv,
		userHomeDir: os.UserHomeDir,
		lookPath:    exec.LookPath,
		runCommand:  runCombinedCommand,
	}
}

func (s *Service) RunReadOnlyScan(request ScanRequest) (ScanResult, error) {
	runID := buildRunID(s.now().UTC())
	outputDir, err := resolveOutputDir(request.OutputDir, runID)
	if err != nil {
		return ScanResult{}, err
	}

	roots, err := s.resolveRoots(request)
	if err != nil {
		return ScanResult{}, err
	}
	if err := validateOutputDir(outputDir, roots); err != nil {
		return ScanResult{}, err
	}
	items, unknownItems, err := s.collectItems(roots)
	if err != nil {
		return ScanResult{}, err
	}

	probe := s.collectCLIProbe(request)
	artifacts, err := newArtifactSet(runID, roots, items, unknownItems, probe)
	if err != nil {
		return ScanResult{}, err
	}
	if err := writeArtifacts(outputDir, artifacts); err != nil {
		return ScanResult{}, err
	}

	return ScanResult{
		RunID:            runID,
		DiscoveryPath:    filepath.Join(outputDir, "discovery.json"),
		ManifestPath:     filepath.Join(outputDir, "manifest-before.json"),
		UnknownItemsPath: filepath.Join(outputDir, "unknown-items.json"),
		Summary:          scanSummary(roots, items, probe.warnings),
		Warnings:         probe.warnings,
		Items:            items,
		CLISnapshot:      probe.snapshot,
	}, nil
}

func resolveOutputDir(outputDir string, runID string) (string, error) {
	candidate := strings.TrimSpace(outputDir)
	if candidate == "" {
		candidate = filepath.Join("tmp", "runs", runID)
	}
	return filepath.Abs(filepath.Clean(candidate))
}

func scanSummary(roots []string, items []DiscoveryItem, warnings []string) ScanSummary {
	return ScanSummary{
		RootCount:    len(roots),
		ItemCount:    len(items),
		WarningCount: len(warnings),
	}
}

func buildRunID(now time.Time) string {
	return fmt.Sprintf("%s-%09d", now.Format("20060102-150405"), now.Nanosecond())
}
