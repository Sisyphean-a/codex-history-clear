import {useEffect, useLayoutEffect, useRef, useState, type CSSProperties} from 'react';
import type {HistoryWorkspaceController} from './history-workspace-controller';
import {
    ControlPanel,
    OverviewPanel,
    SessionPanel,
} from './history-workspace-panels';
import {DeletePreviewDialog, StatusBar, ToolbarPanel} from './history-workspace-ui';

export function HistoryWorkspaceView(props: HistoryWorkspaceController) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewPending, setPreviewPending] = useState(false);
    const [sidebarHeight, setSidebarHeight] = useState(0);
    const sidebarRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!previewPending || props.loading === 'plan') return;
        setPreviewPending(false);
        if (props.planState.planResult) setPreviewOpen(true);
    }, [previewPending, props.loading, props.planState.planResult]);

    useEffect(() => {
        if (!previewOpen || !props.planState.executionResult) return;
        props.planState.setConfirmText('');
        setPreviewOpen(false);
    }, [previewOpen, props.planState.executionResult]);

    const closePreview = () => {
        props.planState.setConfirmText('');
        setPreviewOpen(false);
    };

    const openPreview = async () => {
        if (props.selectedIds.length === 0 || props.loading === 'plan') return;
        if (props.planState.planResult) {
            props.planState.setConfirmText('');
            setPreviewOpen(true);
            return;
        }
        setPreviewPending(true);
        await props.actions.buildPlan();
    };

    useLayoutEffect(() => {
        const element = sidebarRef.current;
        if (!element) return;
        const updateHeight = () => setSidebarHeight(element.offsetHeight);
        updateHeight();
        const observer = new ResizeObserver(() => updateHeight());
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    const workspaceStyle = sidebarHeight > 0
        ? ({'--workspace-column-height': `${sidebarHeight}px`} as CSSProperties)
        : undefined;

    return (
        <article className="工具壳">
            <ToolbarPanel {...props} onOpenPreview={openPreview}/>
            {props.error ? <div className="错误横幅">{props.error}</div> : null}
            <section className="主工作区" style={workspaceStyle}>
                <aside className="工具侧栏" ref={sidebarRef}>
                    <OverviewPanel {...props}/>
                    <ControlPanel {...props}/>
                </aside>
                <section className="主内容列">
                    <SessionPanel {...props}/>
                </section>
            </section>
            <DeletePreviewDialog {...props} onClose={closePreview} open={previewOpen}/>
            <StatusBar {...props}/>
        </article>
    );
}
