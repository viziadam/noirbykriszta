"use client";

import { useEffect, useMemo, useState } from "react";
import BeforeAfterSlider from "./BeforeAfterSlider";
import { IconClose, IconArrowLeft, IconArrowRight } from "./Icons";
import { CATEGORY_LABELS } from "@/lib/format";

const FILTERS = ["mind", "szempilla", "szemoldok", "elotte-utana"];

export default function GalleryClient({ images = [] }) {
  const [filter, setFilter] = useState("mind");
  const [lightbox, setLightbox] = useState(null); // index a sima képek között

  const visible = useMemo(
    () => (filter === "mind" ? images : images.filter((i) => i.category === filter)),
    [filter, images]
  );

  const plainImages = useMemo(
    () => visible.filter((i) => i.type !== "before-after"),
    [visible]
  );
  const baImages = useMemo(
    () => visible.filter((i) => i.type === "before-after"),
    [visible]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (lightbox === null) return;
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => (i + 1) % plainImages.length);
      if (e.key === "ArrowLeft") setLightbox((i) => (i - 1 + plainImages.length) % plainImages.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, plainImages.length]);

  return (
    <>
      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={filter === f ? "is-active" : ""}
            onClick={() => {
              setFilter(f);
              setLightbox(null);
            }}
          >
            {CATEGORY_LABELS[f]}
          </button>
        ))}
      </div>

      {baImages.length > 0 && (
        <div className="ba-range" style={{ marginBottom: "2rem" }}>
          {baImages.map((b) => (
            <BeforeAfterSlider
              key={b.id}
              before={b.url}
              after={b.urlAfter || b.url}
              caption={b.caption}
            />
          ))}
        </div>
      )}

      {plainImages.length === 0 && baImages.length === 0 && (
        <p className="muted text-center">Ebben a kategóriában még nincs feltöltött kép.</p>
      )}

      {plainImages.length > 0 && (
        <div className="masonry">
          {plainImages.map((img, idx) => (
            <figure
              className="masonry__item"
              key={img.id}
              onClick={() => setLightbox(idx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setLightbox(idx)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.caption || "NOIR By Kriszta munka"} loading="lazy" />
              {img.caption && <figcaption className="masonry__cap">{img.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}

      {lightbox !== null && plainImages[lightbox] && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <button className="lightbox__close" aria-label="Bezárás">
            <IconClose width={18} height={18} />
          </button>
          {plainImages.length > 1 && (
            <>
              <button
                className="lightbox__nav lightbox__nav--prev"
                aria-label="Előző"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((i) => (i - 1 + plainImages.length) % plainImages.length);
                }}
              >
                <IconArrowLeft width={18} height={18} />
              </button>
              <button
                className="lightbox__nav lightbox__nav--next"
                aria-label="Következő"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((i) => (i + 1) % plainImages.length);
                }}
              >
                <IconArrowRight width={18} height={18} />
              </button>
            </>
          )}
          <div onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={plainImages[lightbox].url}
              alt={plainImages[lightbox].caption || "NOIR By Kriszta munka"}
            />
            {plainImages[lightbox].caption && (
              <p className="lightbox__cap">{plainImages[lightbox].caption}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
