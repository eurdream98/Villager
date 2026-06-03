import './TreeIcon.css';

function TreeIcon({ stage = 1, className = '' }) {
  const scale = 0.75 + stage * 0.1;

  return (
    <svg
      className={`tree-icon ${className}`.trim()}
      viewBox="0 0 48 64"
      width="48"
      height="64"
      aria-hidden="true"
      style={{ transform: `scale(${scale})` }}
    >
      <rect className="tree-icon__trunk" x="20" y="36" width="8" height="22" rx="2" />
      <ellipse className="tree-icon__canopy tree-icon__canopy--back" cx="24" cy="28" rx="18" ry="20" />
      <ellipse className="tree-icon__canopy tree-icon__canopy--mid" cx="24" cy="22" rx="14" ry="16" />
      <ellipse className="tree-icon__canopy tree-icon__canopy--front" cx="24" cy="16" rx="10" ry="12" />
      {stage >= 4 && (
        <circle className="tree-icon__fruit" cx="18" cy="20" r="2.5" />
      )}
      {stage >= 4 && (
        <circle className="tree-icon__fruit" cx="30" cy="24" r="2.5" />
      )}
      {stage >= 5 && (
        <circle className="tree-icon__fruit" cx="24" cy="12" r="2.5" />
      )}
    </svg>
  );
}

export default TreeIcon;
