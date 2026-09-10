"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconChevron } from "./Icons";
import { huf, duration } from "@/lib/format";

export default function ServicesAccordion({ grouped = [] }) {
  const router = useRouter();
  const [open, setOpen] = useState(grouped[0]?.category || null);

  return (
    <div>
      {grouped.map((g) => {
        const isOpen = open === g.category;
        return (
          <div className={`accordion ${isOpen ? "is-open" : ""}`} key={g.category}>
            <button
              className="accordion__head"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : g.category)}
            >
              <span>
                {g.category} <span className="count">· {g.items.length} szolgáltatás</span>
              </span>
              <IconChevron className="accordion__chev" width={20} height={20} />
            </button>
            <div className="accordion__body">
              {g.items.map((s) => (
                <div className="price-row" key={s.id}>
                  <div className="price-row__name">{s.name}</div>
                  <div className="price-row__meta">
                    <div className="price-row__price">{huf(s.price)}</div>
                    <div className="price-row__dur">{duration(s.durationMinutes)}</div>
                  </div>
                  {s.description && <p className="price-row__desc">{s.description}</p>}
                  <button
                    className="btn btn--outline-dark btn--sm price-row__book"
                    onClick={() => router.push(`/foglalas?service=${s.id}`)}
                  >
                    Foglalás
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
