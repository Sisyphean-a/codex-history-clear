import {buildThreadTags, formatBytes, formatDateTime, projectLabel} from './history-workspace-helpers';
import type {
    HistoryExecutionResult,
    HistoryPlanResult,
    HistoryThread,
} from './history-types';

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

function compactThreadTags(item: HistoryThread, selected: boolean) {
    const tags = buildThreadTags(item, selected ? [item.id] : [])
        .map((tag) => tag === '建议清理' ? '待处理' : tag)
        .filter((tag) => tag !== '建议保留');
    return Array.from(new Set(tags)).slice(0, 3);
}

function tagTone(tag: string) {
    if (tag === '待处理') return 'accent';
    if (tag === '未知结构') return 'warn';
    return 'neutral';
}

export function HistoryThreadTable({items, selectedIds, toggleSelected}: { items: HistoryThread[]; selectedIds: string[]; toggleSelected: (threadID: string) => void }) {
    if (items.length === 0) return <div className="空态 小号">没有匹配会话</div>;
    const selected = new Set(selectedIds);
    return (
        <div className="表格壳 会话表壳">
            <table className="结果表格 会话表">
                <thead>
                <tr>
                    <th className="列-选择">选</th>
                    <th className="列-会话">会话</th>
                    <th className="列-项目">项目</th>
                    <th className="列-时间">更新时间</th>
                    <th className="列-大小">大小</th>
                    <th className="列-状态">状态</th>
                </tr>
                </thead>
                <tbody>
                {items.map((item) => {
                    const isSelected = selected.has(item.id);
                    const project = projectLabel(item);
                    const preview = threadPreview(item);
                    const tags = compactThreadTags(item, isSelected);
                    return (
                        <tr className={isSelected ? '已选行' : ''} key={item.id}>
                            <td className="列-选择">
                                <input
                                    aria-label={`选择会话 ${item.title || shortID(item.id)}`}
                                    checked={isSelected}
                                    onChange={() => toggleSelected(item.id)}
                                    type="checkbox"
                                />
                            </td>
                            <td className="列-会话">
                                <div className="会话标题单元">
                                    <div className="候选主值" title={item.title || '未命名会话'}>{item.title || '未命名会话'}</div>
                                    <div className="候选副值" title={preview}>{preview}</div>
                                    <div className="表格次信息">
                                        <code title={item.id}>{shortID(item.id)}</code>
                                        {item.sourceTitle && item.sourceTitle !== item.title ? <span title={item.sourceTitle}>{item.sourceTitle}</span> : null}
                                    </div>
                                </div>
                            </td>
                            <td className="列-项目 路径列"><code title={project}>{project}</code></td>
                            <td className="列-时间">{formatDateTime(item.updatedAt)}</td>
                            <td className="列-大小">{formatBytes(item.sizeBytes)}</td>
                            <td className="列-状态">
                                <div className="表格标签列">
                                    {tags.map((tag) => (
                                        <span className={`状态签 ${tagTone(tag)}`} key={`${item.id}:${tag}`}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
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
