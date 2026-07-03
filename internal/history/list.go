package history

import (
	"database/sql"
	"fmt"
	"os"
	"strings"
	"time"
)

const (
	defaultListLimit   = 80
	unlimitedListLimit = int(^uint(0) >> 1)
)

type threadRow struct {
	ID               string
	Title            string
	Source           string
	ModelProvider    string
	ThreadSource     sql.NullString
	RolloutPath      string
	CreatedAt        int64
	UpdatedAt        int64
	CreatedAtMS      sql.NullInt64
	UpdatedAtMS      sql.NullInt64
	CWD              string
	Archived         int64
	FirstUserMessage sql.NullString
	Preview          sql.NullString
}

func listThreads(paths codexPaths, request ListRequest) ([]ThreadSummary, int, error) {
	sessionIndex, err := readSessionIndex(paths.sessionIndex)
	if err != nil {
		return nil, 0, err
	}
	db, err := openReadonlyDatabase(paths.stateDB)
	if err != nil {
		return nil, 0, err
	}
	defer db.Close()

	query, args := buildThreadQuery(request)
	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	items := []ThreadSummary{}
	total := 0
	limit := effectiveLimit(request.Limit)
	for rows.Next() {
		row, err := scanThreadRow(rows)
		if err != nil {
			return nil, 0, err
		}
		thread := mapThreadRow(paths, row, sessionIndex)
		if !matchesGrep(thread, request.Grep) {
			continue
		}
		total++
		if len(items) < limit {
			items = append(items, thread)
		}
	}
	return items, total, rows.Err()
}

func resolveTargets(paths codexPaths, threadIDs []string) ([]ThreadSummary, error) {
	if len(threadIDs) == 0 {
		return nil, fmt.Errorf("至少选择一个会话")
	}
	seen := map[string]struct{}{}
	targets := make([]ThreadSummary, 0, len(threadIDs))
	for _, threadID := range threadIDs {
		target, err := resolveTarget(paths, strings.TrimSpace(threadID))
		if err != nil {
			return nil, err
		}
		if _, ok := seen[target.ID]; ok {
			continue
		}
		seen[target.ID] = struct{}{}
		targets = append(targets, target)
	}
	return targets, nil
}

func resolveTarget(paths codexPaths, threadID string) (ThreadSummary, error) {
	if threadID == "" {
		return ThreadSummary{}, fmt.Errorf("会话 ID 不能为空")
	}
	sessionIndex, err := readSessionIndex(paths.sessionIndex)
	if err != nil {
		return ThreadSummary{}, err
	}
	db, err := openReadonlyDatabase(paths.stateDB)
	if err != nil {
		return ThreadSummary{}, err
	}
	defer db.Close()

	rows, err := db.Query(
		`select id, title, source, model_provider, thread_source, rollout_path, created_at, updated_at, created_at_ms, updated_at_ms, cwd, archived, first_user_message, preview
		from threads
		where id like ?
		order by coalesce(updated_at_ms, updated_at * 1000) desc, id desc`,
		threadID+"%",
	)
	if err != nil {
		return ThreadSummary{}, err
	}
	defer rows.Close()

	matches := []ThreadSummary{}
	for rows.Next() {
		row, err := scanThreadRow(rows)
		if err != nil {
			return ThreadSummary{}, err
		}
		matches = append(matches, mapThreadRow(paths, row, sessionIndex))
	}
	if err := rows.Err(); err != nil {
		return ThreadSummary{}, err
	}
	if len(matches) == 0 {
		return ThreadSummary{}, fmt.Errorf("未找到会话: %s", threadID)
	}
	if len(matches) > 1 {
		return ThreadSummary{}, fmt.Errorf("短 ID 命中 %d 条会话，请输入更长的前缀: %s", len(matches), threadID)
	}
	return matches[0], nil
}

func buildThreadQuery(request ListRequest) (string, []any) {
	where := []string{}
	args := []any{}
	if !request.All {
		where = append(where, "archived = ?")
		if request.Archived {
			args = append(args, 1)
		} else {
			args = append(args, 0)
		}
	} else if request.Archived {
		where = append(where, "archived = ?")
		args = append(args, 1)
	}
	if request.CWD != "" {
		where = append(where, `lower(cwd) like lower(?) escape '\'`)
		args = append(args, "%"+escapeLike(request.CWD)+"%")
	}
	query := `select id, title, source, model_provider, thread_source, rollout_path, created_at, updated_at, created_at_ms, updated_at_ms, cwd, archived, first_user_message, preview from threads`
	if len(where) > 0 {
		query += " where " + strings.Join(where, " and ")
	}
	query += " order by coalesce(updated_at_ms, updated_at * 1000) desc, id desc"
	return query, args
}

func scanThreadRow(rows *sql.Rows) (threadRow, error) {
	var row threadRow
	err := rows.Scan(
		&row.ID,
		&row.Title,
		&row.Source,
		&row.ModelProvider,
		&row.ThreadSource,
		&row.RolloutPath,
		&row.CreatedAt,
		&row.UpdatedAt,
		&row.CreatedAtMS,
		&row.UpdatedAtMS,
		&row.CWD,
		&row.Archived,
		&row.FirstUserMessage,
		&row.Preview,
	)
	return row, err
}

func mapThreadRow(paths codexPaths, row threadRow, sessionIndex map[string]sessionIndexEntry) ThreadSummary {
	title := row.Title
	sourceTitle := row.Title
	if entry, ok := sessionIndex[row.ID]; ok && entry.ThreadName != "" {
		title = entry.ThreadName
	}
	return ThreadSummary{
		ID:               row.ID,
		Title:            title,
		SourceTitle:      sourceTitle,
		Source:           row.Source,
		ModelProvider:    row.ModelProvider,
		ThreadSource:     nullableString(row.ThreadSource),
		RolloutPath:      row.RolloutPath,
		CreatedAt:        formatUnix(row.CreatedAtMS, row.CreatedAt),
		UpdatedAt:        formatUnix(row.UpdatedAtMS, row.UpdatedAt),
		CWD:              strings.TrimPrefix(row.CWD, `\\?\`),
		Archived:         row.Archived == 1,
		SizeBytes:        estimateThreadSize(paths, row),
		FirstUserMessage: row.FirstUserMessage.String,
		Preview:          row.Preview.String,
	}
}

func estimateThreadSize(paths codexPaths, row threadRow) int64 {
	size := fileSize(row.RolloutPath)
	for _, snapshot := range findShellSnapshots(paths.shellSnapshotsDir, row.ID) {
		size += fileSize(snapshot)
	}
	return size
}

func fileSize(path string) int64 {
	info, err := os.Stat(path)
	if err != nil {
		return 0
	}
	return info.Size()
}

func matchesGrep(thread ThreadSummary, grep string) bool {
	if strings.TrimSpace(grep) == "" {
		return true
	}
	needle := strings.ToLower(grep)
	haystack := strings.ToLower(strings.Join([]string{
		thread.Title,
		thread.SourceTitle,
		thread.FirstUserMessage,
		thread.Preview,
	}, "\n"))
	return strings.Contains(haystack, needle)
}

func effectiveLimit(value int) int {
	if value < 0 {
		return unlimitedListLimit
	}
	if value > 0 {
		return value
	}
	return defaultListLimit
}

func formatUnix(ms sql.NullInt64, seconds int64) string {
	if ms.Valid {
		return time.UnixMilli(ms.Int64).UTC().Format(time.RFC3339)
	}
	return time.Unix(seconds, 0).UTC().Format(time.RFC3339)
}

func nullableString(value sql.NullString) string {
	if value.Valid {
		return value.String
	}
	return ""
}

func escapeLike(value string) string {
	value = strings.ReplaceAll(value, `\`, `\\`)
	value = strings.ReplaceAll(value, `%`, `\%`)
	return strings.ReplaceAll(value, `_`, `\_`)
}
