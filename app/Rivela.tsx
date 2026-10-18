"use client";

import { useEffect } from "react";

// Entrata delle sezioni allo scroll. Senza JavaScript (o con movimento ridotto) tutto resta visibile.
export default function Rivela() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const elementi = Array.from(document.querySelectorAll<HTMLElement>("[data-rivela]"));
    const fuori = elementi.filter((el) => el.getBoundingClientRect().top > window.innerHeight * 0.9);
    fuori.forEach((el) => el.classList.add("nascosto"));
    const oss = new IntersectionObserver(
      (voci) => {
        for (const v of voci) {
          if (!v.isIntersecting) continue;
          v.target.classList.remove("nascosto");
          oss.unobserve(v.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    fuori.forEach((el) => oss.observe(el));
    return () => oss.disconnect();
  }, []);
  return null;
}
