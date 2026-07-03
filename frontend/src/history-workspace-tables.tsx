import {formatBytes, formatDateTime, projectLabel} from './history-workspace-helpers';
import type {
    HistoryExecutionResult,
    HistoryPlanResult,
    HistoryThread,
} from './history-types';
import type {WorkspaceState} from './workspace-types';

const actionLabels: Record<string, string> = {
    delete_rows: '删行',
    rewrite_rows: '清引用',
    rewrite_jsonl: '改 JSONL',
    rewrite_json: '改 JSON',
    delete_file: '删文件',
    inspect: '检查',
};

function shortID(value: string) {
    return value.slice(0, 8);
}

function threadPreview(item: HistoryThread) {
    return item.preview.trim() || item.firstUserMessage.trim() || item.sourceTitle.trim() || '—';
}

function threadBadge(item: HistoryThread, selected: boolean): { label: string; tone: 'accent' | 'warn' | 'neutral' } {
    if (selected) return {label: '建议清理', tone: 'accent'};
    if (!item.rolloutPath) return {label: '未知结构', tone: 'warn'};
    if (item.archived) return {label: '已归档', tone: 'neutral'};
    if (item.sizeBytes >= 50 * 1024 * 1024) return {label: '大文件', tone: 'warn'};
    return {label: '建议保留', tone: 'neutral'};
}

type MetaTone = 'project' | 'time' | 'size' | 'source' | 'provider' | 'thread' | 'duplicate';

type MetaItem = {
    key: string;
    text: string;
    tone: MetaTone;
    variant?: string;
};

type DuplicateHint = {
    copies: number;
    reviewNeeded: boolean;
};

function rowMeta(item: HistoryThread, duplicateHint?: DuplicateHint) {
    const items: MetaItem[] = [
        {key: 'project', text: projectLabel(item), tone: 'project'},
        {key: 'updatedAt', text: formatDateTime(item.updatedAt), tone: 'time'},
        {key: 'size', text: formatBytes(item.sizeBytes), tone: 'size'},
    ];
    const source = sourceLabel(item);
    if (source !== '') items.push({key: 'source', text: source, tone: 'source'});
    const provider = providerLabel(item.modelProvider);
    if (provider !== '') items.push({key: 'provider', text: provider, tone: 'provider', variant: providerVariant(item.modelProvider)});
    const threadSource = threadSourceLabel(item.threadSource);
    if (threadSource !== '') items.push({key: 'threadSource', text: threadSource, tone: 'thread'});
    if (duplicateHint && duplicateHint.copies > 0) {
        items.push({
            key: 'duplicate',
            text: `${duplicateHint.reviewNeeded ? '疑似重复' : '重复副本'} ${duplicateHint.copies}`,
            tone: 'duplicate',
            variant: duplicateHint.reviewNeeded ? 'review' : 'stable',
        });
    }
    return items;
}

function sourceLabel(item: HistoryThread) {
    if (item.threadSource === 'subagent') return '子代理';
    if (item.source.trim().startsWith('{')) return '子代理';
    if (item.source === 'vscode') return 'VSCode';
    if (item.source === 'cli') return 'CLI';
    return item.source.trim();
}

function providerLabel(value: string) {
    if (value === 'hi_code') return 'Hi Code';
    if (value === 'openai') return 'OpenAI';
    if (value === 'custom') return '自定义';
    return value.trim();
}

function providerVariant(value: string) {
    if (value === 'hi_code') return 'hi-code';
    if (value === 'openai') return 'openai';
    if (value === 'custom') return 'custom';
    return 'generic';
}

function threadSourceLabel(value: string) {
    if (value === 'subagent') return '派生会话';
    return '';
}

function duplicateHints(workspace: WorkspaceState) {
    const hints = new Map<string, DuplicateHint>();
    if (workspace.kind !== 'ready') return hints;
    for (const group of workspace.plan.groups) {
        const copies = Math.max(0, group.candidates.length - 1);
        if (copies === 0) continue;
        for (const candidate of group.candidates) {
            const keys = [candidate.sessionUid, candidate.sourcePath].filter(Boolean) as string[];
            for (const key of keys) {
                const existing = hints.get(key);
                if (!existing || existing.copies < copies || (existing.reviewNeeded && !group.reviewNeeded)) {
                    hints.set(key, {copies, reviewNeeded: group.reviewNeeded});
                }
            }
        }
    }
    return hints;
}

function tagTone(tag: 'accent' | 'warn' | 'neutral') {
    if (tag === 'accent') return 'accent';
    if (tag === 'warn') return 'warn';
    return 'neutral';
}

export function HistoryThreadTable({
    items,
    scanWorkspace,
    selectedIds,
    toggleSelected,
}: {
    items: HistoryThread[];
    scanWorkspace: WorkspaceState;
    selectedIds: string[];
    toggleSelected: (threadID: string) => void;
}) {
    if (items.length === 0) return <div className="空态 小号">没有匹配会话</div>;
    const selected = new Set(selectedIds);
    const hints = duplicateHints(scanWorkspace);
    return (
        <div className="表格壳 会话表壳">
            <div className="列表表头">
                <label className="行勾选头"><input aria-label="只读标题" checked={selected.size > 0} readOnly type="checkbox"/></label>
                <span>标题 / 摘要</span>
                <span>状态</span>
            </div>
            <div className="会话列表">
                {items.map((item) => {
                    const isSelected = selected.has(item.id);
                    const preview = threadPreview(item);
                    const badge = threadBadge(item, isSelected);
                    const duplicateHint = hints.get(item.id) ?? hints.get(item.rolloutPath);
                    return (
                        <label className={`会话行 ${isSelected ? '已选行' : ''}`} key={item.id}>
                            <div className="会话勾选">
                                <input
                                    aria-label={`选择会话 ${item.title || shortID(item.id)}`}
                                    checked={isSelected}
                                    onChange={() => toggleSelected(item.id)}
                                    type="checkbox"
                                />
                            </div>
                            <div className="会话主体">
                                <div className="候选主值" title={item.title || '未命名会话'}>{item.title || '未命名会话'}</div>
                                <div className="候选副值" title={preview}>{preview}</div>
                                <div className="会话元信息">
                                    {rowMeta(item, duplicateHint).map((meta) => (
                                        <span
                                            className={`会话元信息项 ${meta.tone}${meta.variant ? ` ${meta.tone}-${meta.variant}` : ''}`}
                                            key={`${item.id}:${meta.key}`}
                                            title={meta.text}
                                        >
                                            {meta.text}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="会话状态">
                                <span className={`状态签 ${tagTone(badge.tone)}`}>{badge.label}</span>
                            </div>
                        </label>
                    );
                })}
            </div>
        </div>
    );
}

export function HistoryPlanTargetTable({targets}: { targets: HistoryPlanResult['targets'] }) {
    if (targets.length === 0) return <div className="空态 小号">当前范围没有可执行目标</div>;
    return (
        <div className="表格壳">
            <table className="结果表格">
                <thead>
                <tr>
                    <th>会话</th>
                    <th>路径</th>
                    <th>动作数</th>
                    <th>提示</th>
                </tr>
                </thead>
                <tbody>
                {targets.map((target) => (
                    <tr key={target.thread.id}>
                        <td>
                            <div className="候选主值" title={target.thread.title || '未命名会话'}>{target.thread.title || '未命名会话'}</div>
                            <div className="候选副值">{shortID(target.thread.id)}</div>
                        </td>
                        <td className="路径列"><code title={target.thread.rolloutPath || '—'}>{target.thread.rolloutPath || '—'}</code></td>
                        <td>{target.stores.filter((store) => store.count > 0 || store.store === 'rollout_jsonl').length}</td>
                        <td title={target.warnings[0] ?? '—'}>{target.warnings[0] ?? '—'}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

function ExecutionSummary({result}: { result: HistoryExecutionResult }) {
    return (
        <>
            <section className="指标网格 三列">
                <article className="指标卡"><span className="指标名">改动条目</span><strong className="指标值">{result.mutations.filter((item) => item.changed).length}</strong></article>
                <article className="指标卡"><span className="指标名">备份文件</span><strong className="指标值">{result.backups.length}</strong></article>
                <article className="指标卡"><span className="指标名">残留引用</span><strong className="指标值">{result.verification.remainingReferences.length}</strong></article>
            </section>
            <div className="数据列">
                <div className="数据行"><span>执行模式</span><code title={result.mode}>{result.mode}</code></div>
                <div className="数据行"><span>校验结论</span><code title={result.verification.summary}>{result.verification.summary}</code></div>
                <div className="数据行"><span>已确认计划</span><code title={result.approvedPlanPath}>{result.approvedPlanPath}</code></div>
                <div className="数据行"><span>恢复记录</span><code title={result.rollbackJournalPath}>{result.rollbackJournalPath}</code></div>
                <div className="数据行"><span>执行结果</span><code title={result.execResultPath}>{result.execResultPath}</code></div>
                <div className="数据行"><span>清理后清单</span><code title={result.manifestAfterPath}>{result.manifestAfterPath}</code></div>
            </div>
        </>
    );
}

function VerificationTable({result}: { result: HistoryExecutionResult }) {
    if (result.verification.remainingReferences.length === 0) {
        return null;
    }
    return (
        <div className="表格壳">
            <table className="结果表格">
                <thead>
                <tr>
                    <th>残留存储</th>
                    <th>说明</th>
                    <th>路径</th>
                </tr>
                </thead>
                <tbody>
                {result.verification.remainingReferences.map((item) => (
                    <tr key={`${item.store}:${item.path}`}>
                        <td>{item.store}</td>
                        <td title={item.detail}>{item.detail}</td>
                        <td className="路径列"><code title={item.path}>{item.path}</code></td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

function MutationTable({result}: { result: HistoryExecutionResult }) {
    return (
        <div className="表格壳">
            <table className="结果表格">
                <thead>
                <tr>
                    <th>存储</th>
                    <th>动作</th>
                    <th>变化</th>
                    <th>路径</th>
                </tr>
                </thead>
                <tbody>
                {result.mutations.map((item) => (
                    <tr key={`${item.store}:${item.path}`}>
                        <td>{item.store}</td>
                        <td>{actionLabels[item.action] ?? item.action}</td>
                        <td>{item.changedRows}</td>
                        <td className="路径列"><code title={item.path}>{item.path}</code></td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

function EventTable({result}: { result: HistoryExecutionResult }) {
    return (
        <div className="表格壳">
            <table className="结果表格">
                <thead>
                <tr>
                    <th>阶段</th>
                    <th>级别</th>
                    <th>消息</th>
                    <th>产物</th>
                </tr>
                </thead>
                <tbody>
                {result.events.map((item, index) => (
                    <tr key={`${item.phase}:${index}`}>
                        <td>{item.phase}</td>
                        <td>{item.level}</td>
                        <td title={item.message}>{item.message}</td>
                        <td className="路径列"><code title={item.artifactPath}>{item.artifactPath}</code></td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export function HistoryExecutionTable({result}: { result: HistoryExecutionResult }) {
    return (
        <div className="结果区">
            <ExecutionSummary result={result}/>
            <VerificationTable result={result}/>
            <MutationTable result={result}/>
            <EventTable result={result}/>
        </div>
    );
}
