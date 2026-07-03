param(
    [string]$ProjectRoot = "E:\github\codex-history-clear",
    [ValidateSet("overview", "history")]
    [string]$Mode = "overview"
)

$distDir = Join-Path $ProjectRoot "frontend\dist"
$artifactsDir = Join-Path $ProjectRoot ".codestable\goals\2026-06-30-codex-history-manager\artifacts"
$htmlPath = Join-Path $distDir "history-workspace-evidence.html"
$pngPath = Join-Path $artifactsDir ("history-workspace-" + $Mode + ".png")
$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

if (!(Test-Path $edgePath)) {
    throw "missing edge: $edgePath"
}

New-Item -ItemType Directory -Force -Path $artifactsDir | Out-Null

$bundleName = (Get-ChildItem (Join-Path $distDir "assets") -Filter "index.*.js" | Sort-Object Name | Select-Object -Last 1).Name
$cssName = (Get-ChildItem (Join-Path $distDir "assets") -Filter "index.*.css" | Sort-Object Name | Select-Object -Last 1).Name

$mockHtml = @"
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>history workspace evidence</title>
  <link rel="stylesheet" href="/assets/$cssName" />
  <script>
    window.go = {
      main: {
        App: {
          RunReadOnlyScan: async () => ({
            runId: "scan-20260702",
            roots: ["C:\\\\Users\\\\xiakn\\\\.codex"],
            discoveryPath: "C:\\\\temp\\\\discovery.json",
            manifestPath: "C:\\\\temp\\\\manifest-before.json",
            unknownItemsPath: "C:\\\\temp\\\\unknown-items.json",
            summary: { rootCount: 1, itemCount: 12, unknownCount: 0 },
            items: []
          }),
          BuildDeletePlan: async () => ({
            runId: "plan-20260702",
            manifestPath: "C:\\\\temp\\\\manifest-before.json",
            duplicateGroupsPath: "C:\\\\temp\\\\duplicate-groups.json",
            deletePlanPath: "C:\\\\temp\\\\delete-plan.json",
            summary: { groupCount: 1, candidateCount: 2, reviewCount: 0, plannedCount: 2 },
            warnings: [],
            items: [
              {
                duplicateGroup: "dup-0001",
                sessionUid: "session-keep",
                sourcePath: "C:\\\\Users\\\\xiakn\\\\.codex\\\\sessions\\\\archived\\\\rollout-2.jsonl",
                preferredPath: "C:\\\\Users\\\\xiakn\\\\.codex\\\\sessions\\\\live\\\\rollout-1.jsonl",
                action: "quarantine",
                reasonCode: "physical-copy",
                reason: "keep newer live rollout",
                requiresCli: false,
                reviewNeeded: false,
                quarantinePath: "C:\\\\Users\\\\xiakn\\\\.codex\\\\.trash\\\\rollout-2.jsonl",
                warnings: []
              }
            ],
            groups: [
              {
                duplicateGroup: "dup-0001",
                preferredPath: "C:\\\\Users\\\\xiakn\\\\.codex\\\\sessions\\\\live\\\\rollout-1.jsonl",
                reviewNeeded: false,
                warning: "",
                candidates: [
                  {
                    sessionUid: "session-keep",
                    threadUid: "session-keep",
                    storageKind: "rollout_jsonl",
                    sourcePath: "C:\\\\Users\\\\xiakn\\\\.codex\\\\sessions\\\\live\\\\rollout-1.jsonl",
                    canonicalPath: "C:\\\\Users\\\\xiakn\\\\.codex\\\\sessions\\\\live\\\\rollout-1.jsonl",
                    realPath: "C:\\\\Users\\\\xiakn\\\\.codex\\\\sessions\\\\live\\\\rollout-1.jsonl",
                    updatedAt: "2026-07-02T12:00:00Z",
                    preferred: true,
                    relation: "preferred",
                    action: "keep",
                    reasonCode: "cli-visible-preferred",
                    reason: "cli visible and newest",
                    requiresCli: false,
                    reviewNeeded: false,
                    quarantinePath: null,
                    warnings: []
                  },
                  {
                    sessionUid: "session-keep",
                    threadUid: "session-keep",
                    storageKind: "rollout_jsonl",
                    sourcePath: "C:\\\\Users\\\\xiakn\\\\.codex\\\\sessions\\\\archived\\\\rollout-2.jsonl",
                    canonicalPath: "C:\\\\Users\\\\xiakn\\\\.codex\\\\sessions\\\\archived\\\\rollout-2.jsonl",
                    realPath: "C:\\\\Users\\\\xiakn\\\\.codex\\\\sessions\\\\archived\\\\rollout-2.jsonl",
                    updatedAt: "2026-07-01T12:00:00Z",
                    preferred: false,
                    relation: "physical-copy",
                    action: "quarantine",
                    reasonCode: "physical-copy",
                    reason: "physical copy goes to quarantine",
                    requiresCli: false,
                    reviewNeeded: false,
                    quarantinePath: "C:\\\\Users\\\\xiakn\\\\.codex\\\\.trash\\\\rollout-2.jsonl",
                    warnings: []
                  }
                ]
              }
            ]
          }),
          ListHistoryThreads: async () => ({
            codexHome: "C:\\\\Users\\\\xiakn\\\\.codex",
            summary: { count: 2, limit: 80, hasMore: false },
            items: [
              {
                id: "019f3000-1111-7222-8333-abcdefabcdef",
                title: "Primary Thread",
                sourceTitle: "source-primary",
                rolloutPath: "C:\\\\Users\\\\xiakn\\\\.codex\\\\sessions\\\\2026\\\\07\\\\02\\\\rollout-a.jsonl",
                createdAt: "2026-07-02T12:00:00Z",
                updatedAt: "2026-07-02T12:10:00Z",
                cwd: "E:\\\\repo",
                archived: false,
                firstUserMessage: "hello",
                preview: "preview"
              },
              {
                id: "019f3000-9999-7222-8333-fedcbafedcba",
                title: "Secondary Thread",
                sourceTitle: "source-secondary",
                rolloutPath: "C:\\\\Users\\\\xiakn\\\\.codex\\\\sessions\\\\2026\\\\07\\\\02\\\\rollout-b.jsonl",
                createdAt: "2026-07-02T11:00:00Z",
                updatedAt: "2026-07-02T11:10:00Z",
                cwd: "E:\\\\keep",
                archived: false,
                firstUserMessage: "keep",
                preview: "preview"
              }
            ]
          }),
          BuildHistoryDeletePlan: async () => ({
            runId: "history-plan-20260702",
            codexHome: "C:\\\\Users\\\\xiakn\\\\.codex",
            planPath: "C:\\\\temp\\\\history-delete-plan.json",
            summary: { targetCount: 1, storeCount: 8, warningCount: 0 },
            warnings: [],
            targets: [
              {
                thread: {
                  id: "019f3000-1111-7222-8333-abcdefabcdef",
                  title: "Primary Thread",
                  sourceTitle: "source-primary",
                  rolloutPath: "C:\\\\Users\\\\xiakn\\\\.codex\\\\sessions\\\\2026\\\\07\\\\02\\\\rollout-a.jsonl",
                  createdAt: "2026-07-02T12:00:00Z",
                  updatedAt: "2026-07-02T12:10:00Z",
                  cwd: "E:\\\\repo",
                  archived: false,
                  firstUserMessage: "hello",
                  preview: "preview"
                },
                warnings: [],
                stores: [
                  { store: "state_db.threads", path: "C:\\\\Users\\\\xiakn\\\\.codex\\\\state_5.sqlite", action: "delete_rows", detail: "delete target thread row", count: 1, exists: true },
                  { store: "history_jsonl", path: "C:\\\\Users\\\\xiakn\\\\.codex\\\\history.jsonl", action: "rewrite_jsonl", detail: "remove matching entries", count: 1, exists: true },
                  { store: "rollout_jsonl", path: "C:\\\\Users\\\\xiakn\\\\.codex\\\\sessions\\\\2026\\\\07\\\\02\\\\rollout-a.jsonl", action: "delete_file", detail: "delete file", count: 1024, exists: true }
                ]
              }
            ]
          }),
          ApproveHistoryDeletePlan: async () => ({
            runId: "history-plan-20260702",
            planPath: "C:\\\\temp\\\\history-delete-plan.json",
            approvedPlanPath: "C:\\\\temp\\\\approved-plan.json",
            summary: { targetCount: 1, storeCount: 8, warningCount: 0 },
            warnings: [],
            targets: []
          }),
          ExecuteHistoryDeletePlan: async (request) => ({
            runId: "history-plan-20260702",
            mode: request.backupOnly ? "backup-only" : "delete",
            planPath: "C:\\\\temp\\\\approved-plan.json",
            approvedPlanPath: "C:\\\\temp\\\\approved-plan.json",
            rollbackJournalPath: "C:\\\\temp\\\\rollback-journal.json",
            execResultPath: "C:\\\\temp\\\\exec-result.json",
            manifestAfterPath: request.backupOnly ? "" : "C:\\\\temp\\\\manifest-after.json",
            backups: [
              { originalPath: "C:\\\\Users\\\\xiakn\\\\.codex\\\\state_5.sqlite", backupPath: "C:\\\\temp\\\\backup\\\\001-state_5.sqlite" }
            ],
            mutations: request.backupOnly ? [] : [
              { store: "state_db.threads", action: "delete_rows", path: "C:\\\\Users\\\\xiakn\\\\.codex\\\\state_5.sqlite", changedRows: 1, changed: true },
              { store: "history_jsonl", action: "rewrite_jsonl", path: "C:\\\\Users\\\\xiakn\\\\.codex\\\\history.jsonl", changedRows: 1, changed: true },
              { store: "rollout_jsonl", action: "delete_file", path: "C:\\\\Users\\\\xiakn\\\\.codex\\\\sessions\\\\2026\\\\07\\\\02\\\\rollout-a.jsonl", changedRows: 1024, changed: true }
            ],
            events: [
              { phase: "backup", itemIndex: 1, itemTotal: 1, level: "info", message: "backup ready", artifactPath: "C:\\\\temp\\\\rollback-journal.json" },
              { phase: request.backupOnly ? "backup" : "delete", itemIndex: 1, itemTotal: 1, level: "info", message: request.backupOnly ? "backup only, no destructive rewrite" : "history deletion finished", artifactPath: "C:\\\\temp\\\\exec-result.json" }
            ],
            verification: request.backupOnly
              ? { status: "skipped", summary: "backup only, no destructive rewrite", success: false, remainingReferences: [] }
              : { status: "pass", summary: "no remaining references after execution", success: true, remainingReferences: [] }
          }),
          ExportHistoryEvidencePack: async () => ({
            runId: "history-plan-20260702",
            evidencePackPath: "C:\\\\temp\\\\evidence-pack.json",
            artifacts: [
              { label: "discovery", path: "C:\\\\temp\\\\discovery.json" },
              { label: "manifest_before", path: "C:\\\\temp\\\\manifest-before.json" },
              { label: "duplicate_groups", path: "C:\\\\temp\\\\duplicate-groups.json" },
              { label: "delete_plan", path: "C:\\\\temp\\\\history-delete-plan.json" },
              { label: "approved_plan", path: "C:\\\\temp\\\\approved-plan.json" },
              { label: "rollback_journal", path: "C:\\\\temp\\\\rollback-journal.json" },
              { label: "exec_result", path: "C:\\\\temp\\\\exec-result.json" },
              { label: "manifest_after", path: "C:\\\\temp\\\\manifest-after.json" },
              { label: "goal_report", path: "E:\\\\github\\\\codex-history-clear\\\\.codestable\\\\goals\\\\2026-06-30-codex-history-manager\\\\goal.md" },
              { label: "latest_iteration", path: "E:\\\\github\\\\codex-history-clear\\\\.codestable\\\\goals\\\\2026-06-30-codex-history-manager\\\\iterations\\\\012.md" }
            ]
          }),
          RollbackHistoryDelete: async () => ({
            runId: "history-plan-20260702",
            journalPath: "C:\\\\temp\\\\rollback-journal.json",
            restoredCount: 1,
            entries: [{ originalPath: "C:\\\\Users\\\\xiakn\\\\.codex\\\\state_5.sqlite", backupPath: "C:\\\\temp\\\\backup\\\\001-state_5.sqlite", restored: true }],
            events: [{ phase: "rollback", itemIndex: 1, itemTotal: 1, level: "info", message: "backup restored", artifactPath: "C:\\\\Users\\\\xiakn\\\\.codex\\\\state_5.sqlite" }]
          })
        }
      }
    };

    async function waitFor(selector, timeoutMs = 10000) {
      const started = Date.now();
      while (Date.now() - started < timeoutMs) {
        const node = document.querySelector(selector);
        if (node) return node;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      throw new Error("selector timeout: " + selector);
    }

    async function runEvidence() {
      const historyRoot = "main > section:nth-of-type(2) > article:nth-of-type(2)";
      const topScanButton = await waitFor("main > section:nth-of-type(1) button");
      topScanButton.click();
      const historyLoadButton = await waitFor(historyRoot + " > header button");
      historyLoadButton.click();
      await waitFor(historyRoot + " table tbody input[type='checkbox']");
      document.querySelector(historyRoot + " table tbody input[type='checkbox']").click();
      const planButton = await waitFor(historyRoot + " > section:nth-of-type(2) > article:nth-of-type(1) > div:last-child button");
      planButton.click();
      const input = await waitFor(historyRoot + " input[placeholder='purge-selected']");
      const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      setValue.call(input, "purge-selected");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 500));
      const executeButton = await waitFor(historyRoot + " > section:nth-of-type(2) > article:nth-of-type(2) button:last-child");
      executeButton.click();
      await new Promise((resolve) => setTimeout(resolve, 500));
      const exportButton = await waitFor(historyRoot + " > article:nth-of-type(2) button:first-of-type");
      exportButton.click();
      await new Promise((resolve) => setTimeout(resolve, 1200));
      if ("$Mode" === "history") {
        document.querySelector("main > section:nth-of-type(1)").style.display = "none";
        document.querySelector("main > section:nth-of-type(2) > article:nth-of-type(1)").style.display = "none";
        const executionPanel = await waitFor(historyRoot + " > article:nth-of-type(2)");
        executionPanel.scrollIntoView({ block: "start" });
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      window.__evidenceReady = true;
    }

    window.__evidenceReady = false;
    window.addEventListener("load", () => {
      setTimeout(() => {
        runEvidence().catch((error) => {
          window.__evidenceError = String(error);
        });
      }, 100);
    });
  </script>
  <script type="module" crossorigin src="/assets/$bundleName"></script>
</head>
<body>
  <div id="root"></div>
</body>
</html>
"@

Set-Content -Path $htmlPath -Value $mockHtml -Encoding UTF8

$server = Start-Process -FilePath python -ArgumentList "-m", "http.server", "4173", "--bind", "127.0.0.1" -WorkingDirectory $distDir -WindowStyle Hidden -PassThru
try {
    Start-Sleep -Seconds 2
    & $edgePath --headless=new --disable-gpu --virtual-time-budget=12000 --window-size=1600,4200 "--screenshot=$pngPath" "http://127.0.0.1:4173/history-workspace-evidence.html" | Out-Null
    if (!(Test-Path $pngPath)) {
        throw "failed to render evidence screenshot"
    }
    Write-Output $pngPath
}
finally {
    if ($server -and !$server.HasExited) {
        Stop-Process -Id $server.Id -Force
    }
}
