const avatarTones = [
  { background: "#EFF6FF", color: "#1D4ED8" },
  { background: "#FBF1DD", color: "#7A5210" },
  { background: "#E7F7EC", color: "#15803D" },
  { background: "#F4F2EC", color: "#082F63" }
] as const;

function toneFor(name: string) {
  let hash = 0;

  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) % 997;
  }

  return avatarTones[hash % avatarTones.length];
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function Avatar({ name, className = "" }: { name: string; className?: string }) {
  const tone = toneFor(name);

  return (
    <span
      aria-hidden
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${className}`.trim()}
      style={{ background: tone.background, color: tone.color }}
    >
      {initialsFor(name)}
    </span>
  );
}
