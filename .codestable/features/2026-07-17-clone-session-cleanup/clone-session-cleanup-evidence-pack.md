# clone-session-cleanup evidence pack

- `go test ./...`：passed，history 7.069s。
- `npm --prefix frontend test -- --run`：passed，3/3。
- `npm --prefix frontend run build`：passed。
- `wails build -clean`：passed，生成 `build/bin/codex-history-manager.exe`。
- `git diff --check`：passed。
- 规模证据：3000 转录目录测试通过；1000 文件型克隆通过公开计划调用验证实际 IO 次数固定为 2 次目录遍历、1 次目录数据库打开、3 次计划数据库打开、2 次 JSONL 和 2 次 JSON 扫描。
- 浏览器证据：2048x983 和 390x844；元数据克隆、14 天、告警详情可见，无重叠。
- 安全证据：同 ID 多路径删除回滚、来源保留、克隆身份替换阻断；批准文件的目标 ID、stores、CODEX_HOME 或未知 delete_file 被篡改时均在备份和写操作前失败。
- Windows 路径证据：根内 junction 别名已实测解析到同一物理文件，计划只产生一个删除动作，`SkipBackup` 执行通过；文件 symlink 用例因当前账户缺少创建权限而明确 skipped，未计为通过。
- 输入证据：非 UUID 文件型克隆被告警并拒绝进入列表；转录扫描中断时活动时间留空，不参与日期筛选。
