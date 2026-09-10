"use client";

import { useRef, useState } from "react";

export default function BeforeAfterSlider({ before, after, caption }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(50);
  const dragging = useRef(false);

  const setFromClientX = (clientX) => {
    const rect = ref.current.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, pct)));
  };

  const onDown = (e) => {
    dragging.current = true;
    setFromClientX(e.touches ? e.touches[0].clientX : e.clientX);
  };
  const onMove = (e) => {
    if (!dragging.current) return;
    setFromClientX(e.touches ? e.touches[0].clientX : e.clientX);
  };
  const onUp = () => (dragging.current = false);

  return (
    <figure style={{ margin: 0 }}>
      <div
        className="ba"
        ref={ref}
        style={{ "--pos": `${pos}%` }}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onTouchStart={onDown}
        onTouchMove={onMove}
        onTouchEnd={onUp}
        role="slider"
        aria-label="Előtte–utána összehasonlító csúszka"
        aria-valuenow={Math.round(pos)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 4));
          if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 4));
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={before} alt="Előtte" className="ba__before" draggable="false" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={after} alt="Utána" className="ba__after" draggable="false" />
        <span className="ba__tag ba__tag--before">Előtte</span>
        <span className="ba__tag ba__tag--after">Utána</span>
        <span className="ba__divider" />
        <span className="ba__handle" aria-hidden="true">
          ⟺
        </span>
      </div>
      {caption && (
        <figcaption className="muted" style={{ marginTop: "0.7rem" }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
