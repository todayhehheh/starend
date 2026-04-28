interface Props {
  coins: number;
}

export default function CoinDisplay({ coins }: Props) {
  return (
    <div className="flex items-center gap-1.5 bg-[var(--color-card)] pixel-border rounded-full px-3 py-1.5">
      <span>🪙</span>
      <span className="text-sm font-extrabold">{coins}</span>
    </div>
  );
}
