"use client";

interface TopicDriftProps {
  drift: string;
}

export function TopicDrift({ drift }: TopicDriftProps) {
  return (
    <p className="text-xs text-text-muted italic mt-3 animate-fade-in">
      {drift}
    </p>
  );
}
