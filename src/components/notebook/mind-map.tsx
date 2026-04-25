"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  BackgroundVariant,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { GeminiVideoResult } from "@/lib/gemini/ingestVideo";

// ─── Custom node types ────────────────────────────────────────────────────────

function RootNode({ data }: { data: { label: string } }) {
  return (
    <div className="px-5 py-3 rounded-xl bg-white text-zinc-950 font-bold text-sm shadow-lg max-w-[220px] text-center leading-snug">
      {data.label}
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}

function ChapterNode({ data }: { data: { label: string; time: string; url?: string } }) {
  return (
    <div className="px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs shadow max-w-[200px] leading-snug">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="font-semibold text-[13px] mb-0.5">{data.label}</div>
      {data.url ? (
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-400 hover:text-zinc-200 font-mono text-[10px]"
          onClick={(e) => e.stopPropagation()}
        >
          {data.time}
        </a>
      ) : (
        <span className="text-zinc-500 font-mono text-[10px]">{data.time}</span>
      )}
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}

function MomentNode({ data }: { data: { label: string; url?: string } }) {
  return (
    <div className="px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700/60 text-zinc-300 text-[11px] max-w-[180px] leading-snug shadow">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      {data.url ? (
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {data.label}
        </a>
      ) : (
        data.label
      )}
    </div>
  );
}

const NODE_TYPES = { root: RootNode, chapter: ChapterNode, moment: MomentNode };

// ─── Layout helpers ───────────────────────────────────────────────────────────

const CHAPTER_Y = 160;
const MOMENT_Y = 310;
const CHAPTER_GAP = 230;

function timestampUrl(youtubeUrl: string | null, sec: number) {
  if (!youtubeUrl) return undefined;
  try {
    const url = new URL(youtubeUrl);
    url.searchParams.set("t", String(Math.floor(sec)));
    return url.toString();
  } catch {
    return undefined;
  }
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function buildGraph(
  gemini: GeminiVideoResult,
  title: string,
  youtubeUrl: string | null
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const totalWidth = gemini.chapters.length * CHAPTER_GAP;
  const rootX = totalWidth / 2 - 110;

  nodes.push({
    id: "root",
    type: "root",
    position: { x: rootX, y: 0 },
    data: { label: title },
  });

  gemini.chapters.forEach((chapter, ci) => {
    const chapterId = `chapter-${ci}`;
    const cx = ci * CHAPTER_GAP;

    nodes.push({
      id: chapterId,
      type: "chapter",
      position: { x: cx, y: CHAPTER_Y },
      data: {
        label: chapter.title,
        time: formatTime(chapter.start_sec),
        url: timestampUrl(youtubeUrl, chapter.start_sec),
      },
    });

    edges.push({
      id: `root-${chapterId}`,
      source: "root",
      target: chapterId,
      style: { stroke: "#52525b", strokeWidth: 1.5 },
      animated: false,
    });

    // Key moments that fall within this chapter's time range
    const chapterEnd = gemini.chapters[ci + 1]?.start_sec ?? Infinity;
    const moments = (gemini.key_moments ?? []).filter(
      (m) => m.at_sec >= chapter.start_sec && m.at_sec < chapterEnd
    );

    moments.forEach((moment, mi) => {
      const momentId = `moment-${ci}-${mi}`;
      const totalMoments = moments.length;
      const mx = cx + (mi - (totalMoments - 1) / 2) * 195;

      nodes.push({
        id: momentId,
        type: "moment",
        position: { x: mx, y: MOMENT_Y },
        data: {
          label: moment.why,
          url: timestampUrl(youtubeUrl, moment.at_sec),
        },
      });

      edges.push({
        id: `${chapterId}-${momentId}`,
        source: chapterId,
        target: momentId,
        style: { stroke: "#3f3f46", strokeWidth: 1 },
      });
    });
  });

  return { nodes, edges };
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  gemini: GeminiVideoResult;
  title: string;
  youtubeUrl: string | null;
}

function MindMapInner({ gemini, title, youtubeUrl }: Props) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildGraph(gemini, title, youtubeUrl),
    [gemini, title, youtubeUrl]
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onInit = useCallback((instance: { fitView: () => void }) => {
    instance.fitView();
  }, []);

  return (
    <div style={{ height: "calc(100vh - 180px)" }} className="rounded-lg overflow-hidden border border-zinc-800">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onInit={onInit as any}
        nodeTypes={NODE_TYPES}
        fitView
        minZoom={0.2}
        maxZoom={2}
        colorMode="dark"
      >
        <Background variant={BackgroundVariant.Dots} color="#27272a" gap={20} size={1} />
        <Controls className="[&_button]:bg-zinc-800 [&_button]:border-zinc-700 [&_button]:text-white" />
        <MiniMap
          nodeColor={(n) => (n.type === "root" ? "#fff" : n.type === "chapter" ? "#52525b" : "#3f3f46")}
          maskColor="rgba(9,9,11,0.7)"
          className="!bg-zinc-900 !border-zinc-800"
        />
      </ReactFlow>
    </div>
  );
}

export function MindMap(props: Props) {
  return (
    <ReactFlowProvider>
      <MindMapInner {...props} />
    </ReactFlowProvider>
  );
}
