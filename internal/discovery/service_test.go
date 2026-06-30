package discovery

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"testing"
	"time"
)

func TestPreviewScanEnumeratesKnownItemsAndCLIState(t *testing.T) {
	root := buildFixtureRoot(t)
	service := newTestService()
	service.lookPath = func(string) (string, error) { return `C:\Tools\codex.exe`, nil }
	service.runCommand = fakeRunCommand(map[string]commandResult{
		"--help":        {output: "commands: scan resume doctor"},
		"doctor --json": {output: `{"status":"ok"}`},
	})
	outputDir := filepath.Join(t.TempDir(), "scan-output")

	result, err := service.RunReadOnlyScan(ScanRequest{
		CodexHome:              root,
		IncludeBrowserSidecars: true,
		OutputDir:              outputDir,
	})
	if err != nil {
		t.Fatalf("RunReadOnlyScan() error = %v", err)
	}

	if result.Summary != (ScanSummary{RootCount: 1, ItemCount: 9, UnknownCount: 4, WarningCount: 0}) {
		t.Fatalf("Summary = %#v", result.Summary)
	}
	if result.CLISnapshot.DoctorStatus != "ok" || !result.CLISnapshot.ResumeSupported {
		t.Fatalf("CLISnapshot = %#v", result.CLISnapshot)
	}
	assertKinds(t, result.Items, []string{
		"auth_json", "config_toml", "credentials_json", "history_jsonl",
		"logs_sqlite", "rollout_jsonl", "session_index_jsonl", "state_sqlite",
		"archived_rollout_jsonl",
	})
	assertArtifactPathsInDir(t, outputDir, result)

	discoveryDoc := readJSON[discoveryDocument](t, result.DiscoveryPath)
	if discoveryDoc.RunID != result.RunID {
		t.Fatalf("discovery run_id = %q, want %q", discoveryDoc.RunID, result.RunID)
	}
	if discoveryDoc.CLISnapshot.DoctorJSONPath == nil || *discoveryDoc.CLISnapshot.DoctorJSONPath != "codex-doctor.json" {
		t.Fatalf("doctor_json_path = %#v", discoveryDoc.CLISnapshot.DoctorJSONPath)
	}

	manifest := readJSON[[]ManifestRecord](t, result.ManifestPath)
	if len(manifest) != 5 {
		t.Fatalf("manifest records = %d, want 5", len(manifest))
	}
	assertStorageKinds(t, manifest, []string{
		"codex_history_jsonl",
		"codex_rollout_jsonl",
		"codex_rollout_jsonl",
		"codex_sqlite",
		"codex_sqlite",
	})

	unknownItems := readJSON[[]UnknownItem](t, result.UnknownItemsPath)
	if len(unknownItems) != 4 {
		t.Fatalf("unknown items = %d, want 4", len(unknownItems))
	}
	doctorJSONPath := filepath.Join(outputDir, "codex-doctor.json")
	doctorJSON := readJSON[map[string]string](t, doctorJSONPath)
	if doctorJSON["status"] != "ok" {
		t.Fatalf("doctor json = %v", doctorJSON)
	}
}

func TestPreviewScanUsesHomeFallbackAndCLIWarning(t *testing.T) {
	homeDir := t.TempDir()
	root := filepath.Join(homeDir, ".codex")
	writeFixtureFile(t, root, "history.jsonl", "{}\n")

	service := newTestService()
	service.userHomeDir = func() (string, error) { return homeDir, nil }
	service.lookPath = func(string) (string, error) { return "", errors.New("missing") }
	service.runCommand = func(time.Duration, string, ...string) (string, error) {
		t.Fatal("runCommand should not be called when codex is unavailable")
		return "", nil
	}
	outputDir := filepath.Join(t.TempDir(), "scan-output")

	result, err := service.RunReadOnlyScan(ScanRequest{OutputDir: outputDir})
	if err != nil {
		t.Fatalf("RunReadOnlyScan() error = %v", err)
	}

	if result.Summary != (ScanSummary{RootCount: 1, ItemCount: 1, UnknownCount: 0, WarningCount: 2}) {
		t.Fatalf("Summary = %#v", result.Summary)
	}
	if result.CLISnapshot.DoctorStatus != "unavailable" {
		t.Fatalf("DoctorStatus = %q", result.CLISnapshot.DoctorStatus)
	}
	if result.DiscoveryPath != filepath.Join(outputDir, "discovery.json") {
		t.Fatalf("DiscoveryPath = %q", result.DiscoveryPath)
	}
	unknownItems := readJSON[[]UnknownItem](t, result.UnknownItemsPath)
	if len(unknownItems) != 0 {
		t.Fatalf("unknown items = %d, want 0", len(unknownItems))
	}
}

func TestPreviewScanRejectsOutputInsideSourceRoot(t *testing.T) {
	root := buildFixtureRoot(t)
	service := newTestService()

	_, err := service.RunReadOnlyScan(ScanRequest{
		CodexHome:              root,
		IncludeBrowserSidecars: true,
		OutputDir:              filepath.Join(root, "tmp", "runs"),
	})
	if err == nil || !strings.Contains(err.Error(), "输出目录不能位于扫描目录内") {
		t.Fatalf("RunReadOnlyScan() error = %v", err)
	}
}

func TestPreviewScanRejectsPreexistingArtifactTarget(t *testing.T) {
	root := buildFixtureRoot(t)
	outputDir := filepath.Join(t.TempDir(), "scan-output")
	if err := os.MkdirAll(outputDir, 0o755); err != nil {
		t.Fatalf("MkdirAll(%q) error = %v", outputDir, err)
	}
	if err := os.WriteFile(filepath.Join(outputDir, "discovery.json"), []byte("existing"), 0o644); err != nil {
		t.Fatalf("WriteFile(discovery.json) error = %v", err)
	}

	service := newTestService()
	service.lookPath = func(string) (string, error) { return `C:\Tools\codex.exe`, nil }
	service.runCommand = fakeRunCommand(map[string]commandResult{
		"--help":        {output: "commands: scan resume doctor"},
		"doctor --json": {output: `{"status":"ok"}`},
	})

	_, err := service.RunReadOnlyScan(ScanRequest{
		CodexHome:              root,
		IncludeBrowserSidecars: true,
		OutputDir:              outputDir,
	})
	if err == nil || !strings.Contains(err.Error(), "输出文件已存在") {
		t.Fatalf("RunReadOnlyScan() error = %v", err)
	}
}

func TestPreviewScanMarksCLIUnavailableWhenHelpFails(t *testing.T) {
	root := buildFixtureRoot(t)
	service := newTestService()
	service.lookPath = func(string) (string, error) { return `C:\Tools\codex.exe`, nil }
	service.runCommand = fakeRunCommand(map[string]commandResult{
		"--help": {output: "permission denied", err: errors.New("exit status 1")},
	})

	result, err := service.RunReadOnlyScan(ScanRequest{
		CodexHome:              root,
		IncludeBrowserSidecars: true,
		OutputDir:              filepath.Join(t.TempDir(), "scan-output"),
	})
	if err != nil {
		t.Fatalf("RunReadOnlyScan() error = %v", err)
	}
	if result.CLISnapshot.Available {
		t.Fatalf("CLISnapshot.Available = true, want false")
	}
	if result.CLISnapshot.DoctorStatus != "unavailable" {
		t.Fatalf("DoctorStatus = %q, want unavailable", result.CLISnapshot.DoctorStatus)
	}
	if len(result.Warnings) != 1 {
		t.Fatalf("warnings = %v, want single warning", result.Warnings)
	}
}

func TestPreviewScanTracksUnknownCandidateFiles(t *testing.T) {
	root := buildFixtureRoot(t)
	writeFixtureFile(t, root, filepath.Join("sessions", "live", "mystery-session.jsonl"), "{}\n")
	service := newTestService()
	service.lookPath = func(string) (string, error) { return `C:\Tools\codex.exe`, nil }
	service.runCommand = fakeRunCommand(map[string]commandResult{
		"--help":        {output: "commands: scan resume doctor"},
		"doctor --json": {output: `{"status":"ok"}`},
	})

	result, err := service.RunReadOnlyScan(ScanRequest{
		CodexHome:              root,
		IncludeBrowserSidecars: true,
		OutputDir:              filepath.Join(t.TempDir(), "scan-output"),
	})
	if err != nil {
		t.Fatalf("RunReadOnlyScan() error = %v", err)
	}

	unknownItems := readJSON[[]UnknownItem](t, result.UnknownItemsPath)
	if len(unknownItems) != 5 {
		t.Fatalf("unknown items = %d, want 5", len(unknownItems))
	}
	if !containsUnknownPath(unknownItems, "mystery-session.jsonl") {
		t.Fatalf("unknown items missing mystery-session.jsonl: %#v", unknownItems)
	}
}

func TestPreviewScanRejectsMissingRoot(t *testing.T) {
	service := newTestService()
	_, err := service.RunReadOnlyScan(ScanRequest{
		CodexHome:              filepath.Join(t.TempDir(), "missing"),
		IncludeBrowserSidecars: true,
		OutputDir:              filepath.Join(t.TempDir(), "scan-output"),
	})
	if err == nil || !strings.Contains(err.Error(), "扫描目录不存在") {
		t.Fatalf("RunReadOnlyScan() error = %v", err)
	}
}

func TestValidateRootPreservesUnexpectedStatErrors(t *testing.T) {
	err := validateRoot(string([]byte{0}))
	if err == nil || !strings.Contains(err.Error(), "扫描目录不可用") {
		t.Fatalf("validateRoot() error = %v", err)
	}
}

func TestBuildRunIDIncludesNanoseconds(t *testing.T) {
	first := buildRunID(time.Date(2026, 6, 30, 7, 8, 9, 123456789, time.UTC))
	second := buildRunID(time.Date(2026, 6, 30, 7, 8, 9, 987654321, time.UTC))

	if first == second {
		t.Fatalf("buildRunID() should distinguish scans in the same second: %q", first)
	}
	if !strings.Contains(first, "-123456789") {
		t.Fatalf("buildRunID() = %q, want nanosecond suffix", first)
	}
}

func TestContentHashForLargeFile(t *testing.T) {
	path := filepath.Join(t.TempDir(), "large-history.jsonl")
	payload := strings.Repeat("{\"event\":\"scan\"}\n", 32*1024)
	if err := os.WriteFile(path, []byte(payload), 0o644); err != nil {
		t.Fatalf("WriteFile(%q) error = %v", path, err)
	}

	got, err := contentHashFor(path)
	if err != nil {
		t.Fatalf("contentHashFor() error = %v", err)
	}

	sum := sha256.Sum256([]byte(payload))
	want := "sha256:" + hex.EncodeToString(sum[:])
	if got != want {
		t.Fatalf("contentHashFor() = %q, want %q", got, want)
	}
}

type commandResult struct {
	output string
	err    error
}

func newTestService() *Service {
	service := NewService()
	service.now = func() time.Time { return time.Date(2026, 6, 30, 7, 8, 9, 0, time.UTC) }
	return service
}

func fakeRunCommand(results map[string]commandResult) func(time.Duration, string, ...string) (string, error) {
	return func(_ time.Duration, _ string, args ...string) (string, error) {
		result, ok := results[strings.Join(args, " ")]
		if !ok {
			return "", errors.New("unexpected command")
		}
		return result.output, result.err
	}
}

func buildFixtureRoot(t *testing.T) string {
	t.Helper()
	root := t.TempDir()
	writeFixtureFile(t, root, "config.toml", "theme = \"light\"\n")
	writeFixtureFile(t, root, "auth.json", "{}\n")
	writeFixtureFile(t, root, "credentials.json", "{}\n")
	writeFixtureFile(t, root, "history.jsonl", "{}\n")
	writeFixtureFile(t, root, "session_index.jsonl", "{}\n")
	writeFixtureFile(t, root, filepath.Join("sqlite", "state_main.sqlite"), "sqlite")
	writeFixtureFile(t, root, filepath.Join("sqlite", "logs_main.sqlite"), "sqlite")
	writeFixtureFile(t, root, filepath.Join("sessions", "live", "rollout-1.jsonl"), "{}\n")
	writeFixtureFile(t, root, filepath.Join("sessions", "archived", "rollout-2.jsonl"), "{}\n")
	return root
}

func writeFixtureFile(t *testing.T, root string, relativePath string, content string) {
	t.Helper()
	path := filepath.Join(root, relativePath)
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatalf("MkdirAll(%q) error = %v", path, err)
	}
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatalf("WriteFile(%q) error = %v", path, err)
	}
}

func assertKinds(t *testing.T, items []DiscoveryItem, expected []string) {
	t.Helper()
	kinds := make([]string, 0, len(items))
	for _, item := range items {
		if !filepath.IsAbs(item.Path) {
			t.Fatalf("item path is not absolute: %q", item.Path)
		}
		kinds = append(kinds, item.Kind)
	}
	slices.Sort(kinds)
	slices.Sort(expected)
	if !slices.Equal(kinds, expected) {
		t.Fatalf("Kinds = %v, want %v", kinds, expected)
	}
}

func assertStorageKinds(t *testing.T, records []ManifestRecord, expected []string) {
	t.Helper()
	kinds := make([]string, 0, len(records))
	for _, record := range records {
		if !strings.HasPrefix(record.ContentHash, "sha256:") {
			t.Fatalf("content hash = %q", record.ContentHash)
		}
		kinds = append(kinds, record.StorageKind)
	}
	slices.Sort(kinds)
	slices.Sort(expected)
	if !slices.Equal(kinds, expected) {
		t.Fatalf("StorageKinds = %v, want %v", kinds, expected)
	}
}

func assertArtifactPathsInDir(t *testing.T, outputDir string, result ScanResult) {
	t.Helper()
	for _, path := range []string{result.DiscoveryPath, result.ManifestPath, result.UnknownItemsPath} {
		relative, err := filepath.Rel(outputDir, path)
		if err != nil {
			t.Fatalf("Rel(%q, %q) error = %v", outputDir, path, err)
		}
		if strings.HasPrefix(relative, "..") {
			t.Fatalf("artifact path escapes output dir: %q", path)
		}
	}
}

func readJSON[T any](t *testing.T, path string) T {
	t.Helper()
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("ReadFile(%q) error = %v", path, err)
	}
	var payload T
	if err := json.Unmarshal(data, &payload); err != nil {
		t.Fatalf("Unmarshal(%q) error = %v", path, err)
	}
	return payload
}

func containsUnknownPath(items []UnknownItem, suffix string) bool {
	for _, item := range items {
		if strings.HasSuffix(item.Path, suffix) {
			return true
		}
	}
	return false
}
