package discovery

func buildManifest(items []DiscoveryItem) ([]ManifestRecord, error) {
	records := make([]ManifestRecord, 0, len(items))
	for _, item := range items {
		record, ok, err := buildManifestRecord(item)
		if err != nil {
			return nil, err
		}
		if !ok {
			continue
		}
		records = append(records, record)
	}
	return records, nil
}

func buildManifestRecord(item DiscoveryItem) (ManifestRecord, bool, error) {
	storageKind, ok := storageKindFor(item.Kind)
	if !ok {
		return ManifestRecord{}, false, nil
	}
	contentHash, err := contentHashFor(item.Path)
	if err != nil {
		return ManifestRecord{}, false, err
	}
	return ManifestRecord{
		StorageKind:   storageKind,
		SourcePath:    item.Path,
		CanonicalPath: item.Path,
		RealPath:      realPathFor(item),
		ReparseKind:   reparseKindFor(item),
		UpdatedAt:     item.MTimeUTC,
		ContentHash:   contentHash,
		Preferred:     false,
		Evidence:      evidenceFor(item.Kind),
		CwdNorm:       "",
	}, true, nil
}

func storageKindFor(kind string) (string, bool) {
	switch kind {
	case "history_jsonl":
		return "codex_history_jsonl", true
	case "rollout_jsonl", "archived_rollout_jsonl":
		return "codex_rollout_jsonl", true
	case "state_sqlite", "logs_sqlite":
		return "codex_sqlite", true
	default:
		return "", false
	}
}

func realPathFor(item DiscoveryItem) string {
	if item.Target != nil {
		return *item.Target
	}
	return item.Path
}

func reparseKindFor(item DiscoveryItem) string {
	if item.LinkType == nil {
		return "none"
	}
	return *item.LinkType
}

func evidenceFor(kind string) []string {
	switch kind {
	case "history_jsonl":
		return []string{"history-file"}
	case "rollout_jsonl":
		return []string{"rollout-file"}
	case "archived_rollout_jsonl":
		return []string{"archived-rollout-file"}
	default:
		return []string{"sqlite-file"}
	}
}

func buildUnknownItems(items []DiscoveryItem) []UnknownItem {
	unknownItems := []UnknownItem{}
	for _, item := range items {
		if _, ok := storageKindFor(item.Kind); ok {
			continue
		}
		unknownItems = append(unknownItems, UnknownItem{
			SourceRoot: item.SourceRoot,
			Path:       item.Path,
			Kind:       item.Kind,
			Reason:     "not included in manifest-before storage kinds",
		})
	}
	return unknownItems
}
