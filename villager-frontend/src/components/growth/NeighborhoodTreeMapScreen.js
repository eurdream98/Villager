import { useState } from 'react';
import { getTreeStage, getTreeStageLabel } from '../../lib/growth';
import TreeIcon from './TreeIcon';
import './GrowthScreens.css';

function NeighborhoodTreeMapScreen({ neighborhoodTrees, loading, onClose }) {
  const [selectedId, setSelectedId] = useState(null);

  const selected =
    neighborhoodTrees.find((t) => t.id === selectedId) ?? null;

  return (
    <div className="growth-screen" role="dialog" aria-labelledby="tree-map-title">
      <header className="growth-screen__header">
        <button type="button" className="growth-screen__back" onClick={onClose}>
          ← 뒤로
        </button>
        <h2 id="tree-map-title" className="growth-screen__title">
          동네 나무 지도
        </h2>
      </header>

      <div className="growth-screen__body">
        {loading ? (
          <p className="growth-screen__loading">지도 불러오는 중…</p>
        ) : (
          <>
            <div className="tree-map" aria-label="동네별 나무가 표시된 지도">
              <div className="tree-map__grid" aria-hidden="true" />
              <div className="tree-map__roads" aria-hidden="true">
                <span className="tree-map__road tree-map__road--h1" />
                <span className="tree-map__road tree-map__road--h2" />
                <span className="tree-map__road tree-map__road--v1" />
                <span className="tree-map__road tree-map__road--v2" />
              </div>

              {neighborhoodTrees.map((tree) => {
                const stage = getTreeStage(tree.totalXp);
                const isSelected = selectedId === tree.id;
                return (
                  <button
                    key={tree.id}
                    type="button"
                    className={`tree-map__marker${isSelected ? ' tree-map__marker--selected' : ''}`}
                    style={{ left: `${tree.mapX}%`, top: `${tree.mapY}%` }}
                    onClick={() => setSelectedId(tree.id)}
                    aria-label={`${tree.name} 나무, ${getTreeStageLabel(stage)}`}
                    aria-pressed={isSelected}
                  >
                    <TreeIcon stage={stage} />
                    <span className="tree-map__marker-label">{tree.name}</span>
                  </button>
                );
              })}
            </div>

            {selected ? (
              <div className="tree-map-detail">
                <h3 className="tree-map-detail__title">{selected.name}</h3>
                <p className="tree-map-detail__stage">
                  {getTreeStageLabel(getTreeStage(selected.totalXp))}
                </p>
                <dl className="tree-map-detail__stats">
                  <div className="tree-map-detail__stat">
                    <dt>동네 누적 XP</dt>
                    <dd>{selected.totalXp.toLocaleString()}</dd>
                  </div>
                  <div className="tree-map-detail__stat">
                    <dt>참여 주민</dt>
                    <dd>{selected.residentCount}명</dd>
                  </div>
                </dl>
                <p className="tree-map-detail__hint">
                  이 동네 주민들이 거래·커뮤니티·알바 등을 할 때마다 나무가 자라요.
                  지도에서 다른 동네 나무도 눌러 비교해 보세요.
                </p>
              </div>
            ) : (
              <p className="tree-map-detail tree-map-detail--empty">
                지도에서 동네 나무를 눌러 성장 상태를 확인하세요.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default NeighborhoodTreeMapScreen;
