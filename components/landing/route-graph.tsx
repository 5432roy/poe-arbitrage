export function RouteGraph() {
  return (
    <svg
      className="h-auto w-full max-w-lg"
      viewBox="0 0 520 420"
      role="img"
      aria-labelledby="route-graph-title route-graph-desc"
    >
      <title id="route-graph-title">Example three-leg currency route</title>
      <desc id="route-graph-desc">
        A cycle from Chaos to Divine to Exalted and back to Chaos, drawn from a
        completed market snapshot.
      </desc>
      <defs>
        <marker
          id="route-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" className="fill-primary" />
        </marker>
      </defs>

      <g className="text-border" aria-hidden="true">
        <circle cx="260" cy="210" r="168" fill="none" stroke="currentColor" />
      </g>

      <g className="stroke-primary" fill="none">
        <path
          data-route-edge="chaos-divine"
          d="M 168 286 L 244 128"
          strokeWidth="2"
          markerEnd="url(#route-arrow)"
        />
        <path
          data-route-edge="divine-exalted"
          d="M 292 118 L 368 268"
          strokeWidth="2"
          markerEnd="url(#route-arrow)"
        />
        <path
          data-route-edge="exalted-chaos"
          d="M 338 312 L 182 312"
          strokeWidth="2"
          markerEnd="url(#route-arrow)"
        />
      </g>

      <g data-route-node="chaos">
        <circle
          cx="148"
          cy="312"
          r="28"
          className="fill-surface stroke-primary"
          strokeWidth="2"
        />
        <text
          x="148"
          y="364"
          textAnchor="middle"
          className="fill-foreground text-[13px] font-medium"
        >
          Chaos
        </text>
      </g>
      <g data-route-node="divine">
        <circle
          cx="260"
          cy="96"
          r="28"
          className="fill-surface stroke-primary"
          strokeWidth="2"
        />
        <text
          x="260"
          y="52"
          textAnchor="middle"
          className="fill-foreground text-[13px] font-medium"
        >
          Divine
        </text>
      </g>
      <g data-route-node="exalted">
        <circle
          cx="372"
          cy="312"
          r="28"
          className="fill-surface stroke-primary"
          strokeWidth="2"
        />
        <text
          x="372"
          y="364"
          textAnchor="middle"
          className="fill-foreground text-[13px] font-medium"
        >
          Exalted
        </text>
      </g>
    </svg>
  );
}
