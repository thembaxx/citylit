"use client";
import { HugeiconsIcon } from "@hugeicons/react";
// Direct icon subpaths keep the other 6,000+ definitions out of the bundle.
import Ticket01Icon from "@hugeicons/core-free-icons/Ticket01Icon";
import BedDoubleIcon from "@hugeicons/core-free-icons/BedDoubleIcon";
import MaskTheater01Icon from "@hugeicons/core-free-icons/MaskTheater01Icon";
import TreesIcon from "@hugeicons/core-free-icons/TreesIcon";
import MusicNote02Icon from "@hugeicons/core-free-icons/MusicNote02Icon";
const icons = [Ticket01Icon, BedDoubleIcon, MaskTheater01Icon, TreesIcon, MusicNote02Icon];
export default function CategoryIcon({ index, size = 24 }: { index: number; size?: number }) {
  return (
    <HugeiconsIcon
      icon={icons[index] ?? icons[0]}
      size={size}
      strokeWidth={1.5}
      aria-hidden="true"
      data-category-icon={index}
    />
  );
}
