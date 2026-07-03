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

export function HistoryThreadTable({items, selectedIds, toggleSelected}: { items: HistoryThread[]; selectedIds: string[]; toggleSelected: (threadID: string) => void }) {
    if (items.length === 0) return <div className="空态 小号">没有匹配会话</div>;
    return (
        <div className="表格壳">
            <table className="结果表格">
                <thead>
                <tr>
                    <th>选中</th>
                    <th>标题</th>
                    <th>短 ID</th>
                    <th>更新时间</th>
                    <th>目录</th>
                </tr>
                </thead>
                <tbody>
                {items.map((item) => (
                    <tr key={item.id}>
                        <td><input checked={selectedIds.includes(item.id)} onChange={() => toggleSelected(item.id)} type="checkbox"/></td>
                        <td>{item.title}</td>
                        <td><code>{shortID(item.id)}</code></td>
                        <td>{item.updatedAt}</td>
                        <td className="路径列"><code>{item.cwd}</code></td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export function HistoryPlanTargetTable({targets}: { targets: HistoryPlanResult['targets'] }) {
    return (
        <div className="表格壳">
            <table className="结果表格">
                <thead>
                <tr>
                    <th>会话</th>
                    <th>路径</th>
                    <th>动作数</th>
                    <th>warning</th>
                </tr>
                </thead>
                <tbody>
                {targets.map((target) => (
                    <tr key={target.thread.id}>
                        <td>
                            <div className="候选主值">{target.thread.title}</div>
                            <div className="候选副值">{target.thread.id}</div>
                        </td>
                        <td className="路径列"><code>{target.thread.rolloutPath}</code></td>
                        <td>{target.stores.filter((store) => store.count > 0 || store.store === 'rollout_jsonl').length}</td>
                        <td>{target.warnings[0] ?? '—'}</td>
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
                <div className="数据行"><span>mode</span><code>{result.mode}</code></div>
                <div className="数据行"><span>verification</span><code>{result.verification.summary}</code></div>
                <div className="数据行"><span>approved plan</span><code>{result.approvedPlanPath}</code></div>
                <div className="数据行"><span>rollback journal</span><code>{result.rollbackJournalPath}</code></div>
                <div className="数据行"><span>exec result</span><code>{result.execResultPath}</code></div>
                <div className="数据行"><span>manifest after</span><code>{result.manifestAfterPath}</code></div>
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
                        <td>{item.detail}</td>
                        <td className="路径列"><code>{item.path}</code></td>
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
                        <td className="路径列"><code>{item.path}</code></td>
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
                        <td>{item.message}</td>
                        <td className="路径列"><code>{item.artifactPath}</code></td>
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
