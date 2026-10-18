"use client";

export default function ProvaEsempio({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        document.getElementById("converti")?.scrollIntoView({ behavior: "smooth", block: "start" });
        window.dispatchEvent(new Event("ec-esempio"));
      }}
    >
      {children}
    </button>
  );
}
