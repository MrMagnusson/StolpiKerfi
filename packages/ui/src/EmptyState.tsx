/** Dashed 1px box, single sentence at 60% opacity — README.md "Empty states". */
export function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ border: "1px dashed var(--color-divider)", padding: "28px 16px", textAlign: "center", fontSize: 14, opacity: 0.6 }}>
      {text}
    </div>
  );
}
