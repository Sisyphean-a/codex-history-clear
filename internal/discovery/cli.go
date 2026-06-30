package discovery

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"strings"
	"time"
)

type cliProbe struct {
	snapshot   CLISnapshot
	warnings   []string
	doctorJSON []byte
}

func (s *Service) collectCLIProbe(request ScanRequest) cliProbe {
	probe := cliProbe{warnings: []string{}}
	if !request.IncludeBrowserSidecars {
		probe.warnings = append(probe.warnings, "browser sidecars disabled")
	}
	cliSnapshot, doctorJSON, cliWarnings := s.collectCLISnapshot()
	probe.snapshot = cliSnapshot
	probe.doctorJSON = doctorJSON
	probe.warnings = append(probe.warnings, cliWarnings...)
	return probe
}

func (s *Service) collectCLISnapshot() (CLISnapshot, []byte, []string) {
	commandPath, err := s.lookPath("codex")
	if err != nil {
		return CLISnapshot{DoctorStatus: "unavailable"}, nil, []string{"codex CLI not found in PATH"}
	}

	snapshot := CLISnapshot{ExecutablePath: commandPath}
	warnings := []string{}
	helpOutput, err := s.runCommand(3*time.Second, commandPath, "--help")
	if err != nil {
		snapshot.DoctorStatus = "unavailable"
		warnings = append(warnings, commandWarning("codex --help failed", helpOutput, err))
		return snapshot, nil, warnings
	}
	snapshot.Available = true
	snapshot.ResumeSupported = strings.Contains(strings.ToLower(helpOutput), "resume")

	doctorOutput, err := s.runCommand(5*time.Second, commandPath, "doctor", "--json")
	switch {
	case err != nil:
		snapshot.DoctorStatus = "error"
		warnings = append(warnings, commandWarning("codex doctor --json failed", doctorOutput, err))
		return snapshot, nil, warnings
	case !json.Valid([]byte(doctorOutput)):
		snapshot.DoctorStatus = "invalid_json"
		warnings = append(warnings, "codex doctor --json returned invalid JSON")
		return snapshot, nil, warnings
	default:
		snapshot.DoctorStatus = "ok"
	}
	return snapshot, []byte(doctorOutput), warnings
}

func runCombinedCommand(timeout time.Duration, name string, args ...string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, name, args...)
	output, err := cmd.CombinedOutput()
	return string(bytes.TrimSpace(output)), err
}

func commandWarning(prefix string, output string, err error) string {
	trimmed := strings.TrimSpace(output)
	if trimmed == "" {
		return fmt.Sprintf("%s: %v", prefix, err)
	}
	if len(trimmed) > 160 {
		trimmed = trimmed[:160]
	}
	return fmt.Sprintf("%s: %v (%s)", prefix, err, trimmed)
}
