package history

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type codexPaths struct {
	codexHome         string
	stateDB           string
	logsDB            string
	goalsDB           string
	sessionIndex      string
	history           string
	globalState       string
	globalStateBackup string
	shellSnapshotsDir string
}

func (s *Service) resolvePaths() (codexPaths, error) {
	homeDir, err := s.userHomeDir()
	if err != nil {
		return codexPaths{}, fmt.Errorf("获取用户目录失败: %w", err)
	}
	homeDir = strings.TrimSpace(homeDir)
	if homeDir == "" {
		return codexPaths{}, fmt.Errorf("未找到用户目录")
	}
	codexHome, err := filepath.Abs(filepath.Join(homeDir, ".codex"))
	if err != nil {
		return codexPaths{}, fmt.Errorf("解析 CODEX_HOME 失败: %w", err)
	}
	codexHome = filepath.Clean(codexHome)
	if err := validateCodexHome(codexHome); err != nil {
		return codexPaths{}, err
	}
	return codexPaths{
		codexHome:         codexHome,
		stateDB:           filepath.Join(codexHome, "state_5.sqlite"),
		logsDB:            filepath.Join(codexHome, "logs_2.sqlite"),
		goalsDB:           filepath.Join(codexHome, "goals_1.sqlite"),
		sessionIndex:      filepath.Join(codexHome, "session_index.jsonl"),
		history:           filepath.Join(codexHome, "history.jsonl"),
		globalState:       filepath.Join(codexHome, ".codex-global-state.json"),
		globalStateBackup: filepath.Join(codexHome, ".codex-global-state.json.bak"),
		shellSnapshotsDir: filepath.Join(codexHome, "shell-snapshots"),
	}, nil
}

func validateCodexHome(root string) error {
	info, err := os.Stat(root)
	if err != nil {
		if os.IsNotExist(err) {
			return fmt.Errorf("CODEX_HOME 不存在: %s", root)
		}
		return fmt.Errorf("CODEX_HOME 不可用: %s: %w", root, err)
	}
	if !info.IsDir() {
		return fmt.Errorf("CODEX_HOME 不是文件夹: %s", root)
	}
	return nil
}
