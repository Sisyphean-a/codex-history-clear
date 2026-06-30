---
doc_type: feature-evidence-pack
feature: 2026-06-30-read-only-manifest-baseline
status: generated
---

# 2026-06-30-read-only-manifest-baseline evidence pack

## 1. Scope

- Design: `.codestable/features/2026-06-30-read-only-manifest-baseline/read-only-manifest-baseline-design.md`
- Checklist: `.codestable/features/2026-06-30-read-only-manifest-baseline/read-only-manifest-baseline-checklist.yaml`

## 2. DoD Results

```json
{
  "gate_id": "dod-runner",
  "stage": "implementation.before_review",
  "status": "passed",
  "blocking": [],
  "warnings": [],
  "evidence": [
    {
      "command": "go test ./...",
      "exit_code": 0,
      "stdout": "?   \tcodex-history-manager\t[no test files]\r\nok  \tcodex-history-manager/internal/discovery\t(cached)",
      "stderr": "",
      "id": "CMD-001",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "npm --prefix frontend run build",
      "exit_code": 0,
      "stdout": "\r\n> frontend@0.0.0 build\r\n> tsc && vite build\r\n\r\n\u001b[36mvite v3.2.11 \u001b[32mbuilding for production...\u001b[36m\u001b[39m\r\ntransforming...\r\n\u001b[32m✓\u001b[39m 34 modules transformed.\r\nrendering chunks...\r\n\u001b[90m\u001b[37m\u001b[2mdist/\u001b[22m\u001b[90m\u001b[39m\u001b[32mindex.html                 \u001b[39m \u001b[2m0.37 KiB\u001b[22m\r\n\u001b[90m\u001b[37m\u001b[2mdist/\u001b[22m\u001b[90m\u001b[39m\u001b[35massets/index.163b0f93.css  \u001b[39m \u001b[2m3.52 KiB / gzip: 1.34 KiB\u001b[22m\r\n\u001b[90m\u001b[37m\u001b[2mdist/\u001b[22m\u001b[90m\u001b[39m\u001b[36massets/index.e968352e.js   \u001b[39m \u001b[2m144.05 KiB / gzip: 46.67 KiB\u001b[22m",
      "stderr": "",
      "id": "CMD-002",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "wails build -clean",
      "exit_code": 0,
      "stdout": "\u001b[0;92mWails CLI\u001b[0m \u001b[0;31mv2.11.0\u001b[0m\r\n\r\n\r\n# \u001b[1;33m\u001b[1;33mBuild Options\u001b[0m\r\n\u001b[1;33m\u001b[0m\u001b[0m\r\nPlatform(s)       \u001b[90m\u001b[90m | \u001b[0m\u001b[0mwindows/amd64                                                               \r\nCompiler          \u001b[90m\u001b[90m | \u001b[0m\u001b[0mC:\\Program Files\\Go\\bin\\go.exe                                              \r\nSkip Bindings     \u001b[90m\u001b[90m | \u001b[0m\u001b[0mfalse                                                                       \r\nBuild Mode        \u001b[90m\u001b[90m | \u001b[0m\u001b[0mproduction                                                                  \r\nDevtools          \u001b[90m\u001b[90m | \u001b[0m\u001b[0mfalse                                                                       \r\nFrontend Directory\u001b[90m\u001b[90m | \u001b[0m\u001b[0mE:\\github\\codex-history-clear\\.worktree\\read-only-manifest-baseline\\frontend\r\nObfuscated        \u001b[90m\u001b[90m | \u001b[0m\u001b[0mfalse                                                                       \r\nSkip Frontend     \u001b[90m\u001b[90m | \u001b[0m\u001b[0mfalse                                                                       \r\nCompress          \u001b[90m\u001b[90m | \u001b[0m\u001b[0mfalse                                                                       \r\nPackage           \u001b[90m\u001b[90m | \u001b[0m\u001b[0mtrue                                                                        \r\nClean Bin Dir     \u001b[90m\u001b[90m | \u001b[0m\u001b[0mtrue                                                                        \r\nLDFlags           \u001b[90m\u001b[90m | \u001b[0m\u001b[0m                                                                            \r\nTags              \u001b[90m\u001b[90m | \u001b[0m\u001b[0m[]                                                                          \r\nRace Detector     \u001b[90m\u001b[90m | \u001b[0m\u001b[0mfalse                                                                       \r\n\r\n\r\n# \u001b[1;33m\u001b[1;33mBuilding target: windows/amd64\u001b[0m\r\n\u001b[1;33m\u001b[0m\u001b[0m\r\n  \u001b[90m\u001b[90m•\u001b[0m\u001b[0m \u001b[39m\u001b[39mGenerating bindings: \u001b[0m\u001b[0mDone.\r\n  \u001b[90m\u001b[90m•\u001b[0m\u001b[0m \u001b[39m\u001b[39mInstalling frontend dependencies: \u001b[0m\u001b[0mDone.\r\n  \u001b[90m\u001b[90m•\u001b[0m\u001b[0m \u001b[39m\u001b[39mCompiling frontend: \u001b[0m\u001b[0mDone.\r\n  \u001b[90m\u001b[90m•\u001b[0m\u001b[0m \u001b[39m\u001b[39mGenerating application assets: \u001b[0m\u001b[0mDone.\r\n  \u001b[90m\u001b[90m•\u001b[0m\u001b[0m \u001b[39m\u001b[39mCompiling application: \u001b[0m\u001b[0mDone.\r\n\u001b[30;46m\u001b[30;46m INFO \u001b[0m\u001b[0m \u001b[96m\u001b[96mWails is now using the new Go WebView2Loader. If you encounter any issues with it, please report them to https://github.com/wailsapp/wails/issues/2004. You could also use the old legacy loader with `-tags native_webview2loader`, but keep in mind this will be deprecated in the near future.\u001b[0m\u001b[0m\r\nBuilt 'E:\\github\\codex-history-clear\\.worktree\\read-only-manifest-baseline\\build\\bin\\read-only-manifest-baseline.exe' in 4.432s.\r\n\r\n\u001b[31;107m\u001b[31;107m ♥  \u001b[0m\u001b[0m \u001b[92m\u001b[92mIf Wails is useful to you or your company, please consider sponsoring the project:\u001b[0m\u001b[0m\r\nhttps://github.com/sponsors/leaanthony",
      "stderr": "",
      "id": "CMD-003",
      "core": true,
      "failure_handling": "fix-or-block"
    }
  ],
  "providers": {}
}
```

## 3. Validation Commands

Extracted from checklist `dod.commands`; see DoD Results for command status.

## 4. Scope And Cleanliness

Design bytes: 6148
Checklist bytes: 1695

## 5. Residual Risks

- none

## 6. Provider Signals

```json
{
  "archguard": {
    "status": "skipped",
    "reason": "archguard collection disabled",
    "warnings": []
  },
  "meta_cc": {
    "status": "skipped",
    "reason": "meta-cc collection disabled",
    "warnings": []
  }
}
```

## 7. Gate Results

```json
{
  "ok": false,
  "action": "commit",
  "findings": [
    {
      "severity": "P1",
      "message": "Completed CodeStable implementation unit is missing code review evidence ({slug}-review.md).",
      "path": ".codestable/features/2026-06-30-read-only-manifest-baseline/read-only-manifest-baseline-review.md"
    }
  ],
  "warnings": [],
  "unit": ".codestable/features/2026-06-30-read-only-manifest-baseline",
  "current_branch": "feat/read-only-manifest-baseline",
  "default_branch": "master",
  "staged_files": [],
  "dirty_buckets": {},
  "baseline": {
    "unit": ".codestable/features/2026-06-30-read-only-manifest-baseline",
    "default_branch": "master",
    "default_head": "6850ca392f60934e16707ea9865b8b1311c2f8db",
    "current_branch": "feat/read-only-manifest-baseline",
    "worktree": "E:/github/codex-history-clear/.worktree/read-only-manifest-baseline",
    "linked_worktree": true,
    "timestamp": 1782803629
  },
  "post_baseline_implementation": [],
  "required_review": ".codestable/features/2026-06-30-read-only-manifest-baseline/read-only-manifest-baseline-review.md"
}
```
