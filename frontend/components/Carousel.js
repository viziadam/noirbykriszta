"use client";

import { useCallback, useEffect, useRef } from "react";
import { IconArrowLeft, IconArrowRight } from "./Icons";

export default function Carousel({ images = [] }) {
  const trackRef = useRef(null);
  const timer = useRef(null);

  const scrollByCard = useCallback((dir) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector(".carousel__slide");
    const amount = card ? card.offsetWidth + 16 : 320;
    let next = track.scrollLeft + dir * amount;
    if (dir > 0 && next >= track.scrollWidth - track.clientWidth - 4) next = 0;
    if (dir < 0 && track.scrollLeft <= 4) next = track.scrollWidth;
    track.scrollTo({ left: next, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (images.length <= 1) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;
    timer.current = setInterval(() => scrollByCard(1), 4500);
    return () => clearInterval(timer.current);
  }, [images.length, scrollByCard]);

  const pause = () => clearInterval(timer.current);
  const resume = () => {
    clearInterval(timer.current);
    timer.current = setInterval(() => scrollByCard(1), 4500);
  };

  if (!images.length) return null;

  return (
    <div className="carousel" onMouseEnter={pause} onMouseLeave={resume}>
      <button
        className="carousel__btn carousel__btn--prev"
        aria-label="Előző kép"
        onClick={() => scrollByCard(-1)}
      >
        <IconArrowLeft width={18} height={18} />
      </button>
      <div className="carousel__track" ref={trackRef}>
        {images.map((img) => (
          <figure className="carousel__slide" key={img.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.caption || "NOIR By Kriszta munka"} loading="lazy" />
            {img.caption && <figcaption className="carousel__caption">{img.caption}</figcaption>}
          </figure>
        ))}
      </div>
      <button
        className="carousel__btn carousel__btn--next"
        aria-label="Következő kép"
        onClick={() => scrollByCard(1)}
      >
        <IconArrowRight width={18} height={18} />
      </button>
    </div>
  );
}
