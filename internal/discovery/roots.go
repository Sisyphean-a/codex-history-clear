package discovery

import (
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

func (s *Service) resolveRoots(request ScanRequest) ([]string, error) {
	candidates := candidateRoots(request, s.lookupEnv, s.userHomeDir)
	roots := make([]string, 0, len(candidates))
	seen := map[string]struct{}{}
	for _, candidate := range candidates {
		root, err := normalizeRoot(candidate)
		if err != nil {
			return nil, err
		}
		if root == "" {
			continue
		}
		if _, ok := seen[rootKey(root)]; ok {
			continue
		}
		if err := validateRoot(root); err != nil {
			return nil, err
		}
		seen[rootKey(root)] = struct{}{}
		roots = append(roots, root)
	}
	if len(roots) == 0 {
		return nil, fmt.Errorf("no candidate roots configured")
	}
	return roots, nil
}

func candidateRoots(request ScanRequest, lookupEnv func(string) string, userHomeDir func() (string, error)) []string {
	explicit := explicitRoots(request)
	if len(explicit) > 0 {
		return explicit
	}
	if envHome := strings.TrimSpace(lookupEnv("CODEX_HOME")); envHome != "" {
		return []string{envHome}
	}
	homeDir, err := userHomeDir()
	if err != nil || strings.TrimSpace(homeDir) == "" {
		return nil
	}
	return []string{filepath.Join(homeDir, ".codex")}
}

func explicitRoots(request ScanRequest) []string {
	roots := []string{}
	if trimmed := strings.TrimSpace(request.CodexHome); trimmed != "" {
		roots = append(roots, trimmed)
	}
	return append(roots, request.ExtraRoots...)
}

func normalizeRoot(root string) (string, error) {
	trimmed := strings.TrimSpace(root)
	if trimmed == "" {
		return "", nil
	}
	absolute, err := filepath.Abs(trimmed)
	if err != nil {
		return "", fmt.Errorf("resolve root %q: %w", root, err)
	}
	return filepath.Clean(absolute), nil
}

func validateRoot(root string) error {
	info, err := os.Stat(root)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return fmt.Errorf("candidate root not found: %s", root)
		}
		return fmt.Errorf("candidate root unavailable: %s: %w", root, err)
	}
	if !info.IsDir() {
		return fmt.Errorf("candidate root is not a directory: %s", root)
	}
	return nil
}

func rootKey(root string) string {
	return strings.ToLower(root)
}

func validateOutputDir(outputDir string, roots []string) error {
	cleanOutput, err := comparisonPath(outputDir)
	if err != nil {
		return fmt.Errorf("resolve output directory %q: %w", outputDir, err)
	}
	for _, root := range roots {
		cleanRoot, err := comparisonPath(root)
		if err != nil {
			return fmt.Errorf("resolve candidate root %q: %w", root, err)
		}
		if pathsOverlap(cleanOutput, cleanRoot) {
			return fmt.Errorf("output directory must stay outside candidate roots: %s", outputDir)
		}
	}
	return nil
}

func pathsOverlap(candidate string, root string) bool {
	left := rootKey(filepath.Clean(candidate))
	right := rootKey(filepath.Clean(root))
	if left == right {
		return true
	}
	prefix := right + string(filepath.Separator)
	return strings.HasPrefix(left, prefix)
}

func comparisonPath(path string) (string, error) {
	clean := filepath.Clean(path)
	resolved, err := filepath.EvalSymlinks(clean)
	if err == nil {
		return resolved, nil
	}
	if errors.Is(err, os.ErrNotExist) {
		return resolveParentSymlink(clean)
	}
	return "", err
}

func resolveParentSymlink(path string) (string, error) {
	current := path
	suffix := []string{}
	for {
		resolved, err := filepath.EvalSymlinks(current)
		if err == nil {
			parts := append([]string{resolved}, reverseParts(suffix)...)
			return filepath.Join(parts...), nil
		}
		if !errors.Is(err, os.ErrNotExist) {
			return "", err
		}
		parent := filepath.Dir(current)
		if parent == current {
			return path, nil
		}
		suffix = append(suffix, filepath.Base(current))
		current = parent
	}
}

func reverseParts(parts []string) []string {
	reversed := make([]string, 0, len(parts))
	for index := len(parts) - 1; index >= 0; index-- {
		reversed = append(reversed, parts[index])
	}
	return reversed
}

func (s *Service) collectItems(roots []string) ([]DiscoveryItem, []UnknownItem, error) {
	items := make([]DiscoveryItem, 0, len(roots))
	unknownItems := []UnknownItem{}
	for _, root := range roots {
		rootItems, rootUnknownItems, err := scanRoot(root)
		if err != nil {
			return nil, nil, err
		}
		items = append(items, rootItems...)
		unknownItems = append(unknownItems, rootUnknownItems...)
	}
	sort.Slice(items, func(i, j int) bool {
		if items[i].SourceRoot == items[j].SourceRoot {
			return items[i].Path < items[j].Path
		}
		return items[i].SourceRoot < items[j].SourceRoot
	})
	sort.Slice(unknownItems, func(i, j int) bool {
		if unknownItems[i].SourceRoot == unknownItems[j].SourceRoot {
			return unknownItems[i].Path < unknownItems[j].Path
		}
		return unknownItems[i].SourceRoot < unknownItems[j].SourceRoot
	})
	return items, unknownItems, nil
}

func scanRoot(root string) ([]DiscoveryItem, []UnknownItem, error) {
	items := []DiscoveryItem{}
	unknownItems := []UnknownItem{}
	err := filepath.WalkDir(root, func(path string, entry fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if entry.IsDir() {
			return nil
		}
		kind, ok := classifyPath(path)
		if !ok {
			if shouldTrackUnknown(path) {
				unknownItems = append(unknownItems, UnknownItem{
					SourceRoot: root,
					Path:       path,
					Kind:       "unclassified_candidate",
					Reason:     "candidate file did not match known discovery kinds",
				})
			}
			return nil
		}
		item, err := newDiscoveryItem(root, path, kind)
		if err != nil {
			return err
		}
		items = append(items, item)
		return nil
	})
	if err != nil {
		return nil, nil, err
	}
	return items, unknownItems, nil
}

func classifyPath(path string) (string, bool) {
	name := strings.ToLower(filepath.Base(path))
	switch name {
	case "config.toml":
		return "config_toml", true
	case "auth.json":
		return "auth_json", true
	case "credentials.json":
		return "credentials_json", true
	case "history.jsonl":
		return "history_jsonl", true
	case "session_index.jsonl":
		return "session_index_jsonl", true
	}
	if kind, ok := classifySQLite(name); ok {
		return kind, true
	}
	if strings.HasPrefix(name, "rollout-") && strings.HasSuffix(name, ".jsonl") {
		return rolloutKind(path), true
	}
	return "", false
}

func classifySQLite(name string) (string, bool) {
	if !strings.HasSuffix(name, ".sqlite") {
		return "", false
	}
	switch {
	case strings.HasPrefix(name, "state"):
		return "state_sqlite", true
	case strings.HasPrefix(name, "logs"):
		return "logs_sqlite", true
	default:
		return "", false
	}
}

func rolloutKind(path string) string {
	lowerPath := strings.ToLower(path)
	archivedMarkers := []string{
		string(filepath.Separator) + "archive" + string(filepath.Separator),
		string(filepath.Separator) + "archives" + string(filepath.Separator),
		string(filepath.Separator) + "archived" + string(filepath.Separator),
	}
	for _, marker := range archivedMarkers {
		if strings.Contains(lowerPath, marker) {
			return "archived_rollout_jsonl"
		}
	}
	return "rollout_jsonl"
}

func shouldTrackUnknown(path string) bool {
	name := strings.ToLower(filepath.Base(path))
	switch {
	case strings.HasSuffix(name, ".jsonl"):
		return true
	case strings.HasSuffix(name, ".json"):
		return true
	case strings.HasSuffix(name, ".sqlite"):
		return true
	case strings.HasSuffix(name, ".toml"):
		return true
	default:
		return false
	}
}

func newDiscoveryItem(sourceRoot string, path string, kind string) (DiscoveryItem, error) {
	info, err := os.Lstat(path)
	if err != nil {
		return DiscoveryItem{}, err
	}
	linkType, target := linkMetadata(path, info)
	return DiscoveryItem{
		SourceRoot: sourceRoot,
		Path:       path,
		Kind:       kind,
		Size:       info.Size(),
		MTimeUTC:   info.ModTime().UTC().Format(time.RFC3339),
		Attributes: fileAttributes(info),
		LinkType:   linkType,
		Target:     target,
	}, nil
}
