package discovery

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

type artifactSet struct {
	discoveryDoc discoveryDocument
	manifest     []ManifestRecord
	unknownItems []UnknownItem
	doctorJSON   []byte
}

type discoveryDocument struct {
	RunID       string               `json:"run_id"`
	Roots       []string             `json:"roots"`
	Items       []DiscoveryItem      `json:"items"`
	CLISnapshot discoveryCLISnapshot `json:"cli_snapshot"`
}

type discoveryCLISnapshot struct {
	DoctorJSONPath  *string `json:"doctor_json_path"`
	ResumeSupported bool    `json:"resume_supported"`
}

func buildArtifactSet(runID string, roots []string, items []DiscoveryItem, probe cliProbe) artifactSet {
	doctorPath := doctorJSONPath(probe)
	return artifactSet{
		discoveryDoc: discoveryDocument{
			RunID: runID,
			Roots: roots,
			Items: items,
			CLISnapshot: discoveryCLISnapshot{
				DoctorJSONPath:  doctorPath,
				ResumeSupported: probe.snapshot.ResumeSupported,
			},
		},
		unknownItems: buildUnknownItems(items),
		doctorJSON:   probe.doctorJSON,
	}
}

func doctorJSONPath(probe cliProbe) *string {
	if len(probe.doctorJSON) == 0 {
		return nil
	}
	path := "codex-doctor.json"
	return &path
}

func writeArtifacts(outputDir string, artifacts artifactSet) error {
	if err := os.MkdirAll(outputDir, 0o755); err != nil {
		return err
	}
	if err := writeJSON(filepath.Join(outputDir, "discovery.json"), artifacts.discoveryDoc); err != nil {
		return err
	}
	if err := writeJSON(filepath.Join(outputDir, "manifest-before.json"), artifacts.manifest); err != nil {
		return err
	}
	if err := writeJSON(filepath.Join(outputDir, "unknown-items.json"), artifacts.unknownItems); err != nil {
		return err
	}
	if len(artifacts.doctorJSON) == 0 {
		return nil
	}
	return writeBytes(filepath.Join(outputDir, "codex-doctor.json"), artifacts.doctorJSON)
}

func newArtifactSet(
	runID string,
	roots []string,
	items []DiscoveryItem,
	unknownItems []UnknownItem,
	probe cliProbe,
) (artifactSet, error) {
	manifest, err := buildManifest(items)
	if err != nil {
		return artifactSet{}, err
	}
	artifacts := buildArtifactSet(runID, roots, items, probe)
	artifacts.manifest = manifest
	artifacts.unknownItems = append(artifacts.unknownItems, unknownItems...)
	return artifacts, nil
}

func writeJSON(path string, payload any) error {
	data, err := json.MarshalIndent(payload, "", "  ")
	if err != nil {
		return err
	}
	data = append(data, '\n')
	return writeBytes(path, data)
}

func writeBytes(path string, data []byte) error {
	file, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o644)
	if err != nil {
		if os.IsExist(err) {
			return fmt.Errorf("artifact target must not already exist: %s", path)
		}
		return err
	}
	defer file.Close()

	if _, err := file.Write(data); err != nil {
		return err
	}
	return nil
}
