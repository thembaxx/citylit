"use client";
import { Ticket, Bed, MaskHappy, Tree, MusicNotes } from "@phosphor-icons/react";
const icons = [Ticket, Bed, MaskHappy, Tree, MusicNotes];
export default function CategoryIcon({ index, size = 24 }: { index: number; size?: number }) {
  const Icon = icons[index] ?? icons[0];
  return <Icon size={size} weight="regular" aria-hidden="true" data-category-icon={index} />;
}
