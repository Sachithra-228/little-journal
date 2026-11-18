"use client";

import { KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Building2, House, Palmtree } from "lucide-react";
import { dayTypes, type DayType } from "@/lib/journals";
import { cn } from "@/lib/utils";

interface DayTypeSwitchProps {
  value: DayType | null;
  onChange: (value: DayType) => void;
}

const options = [
  { value: "onsite" as const, label: "Onsite", shortLabel: "Onsite", icon: Building2 },
  { value: "remote" as const, label: "Work from home", shortLabel: "Home", icon: House },
  { value: "leave" as const, label: "Leave", shortLabel: "Leave", icon: Palmtree }
];

export function DayTypeSwitch({ value, onChange }: DayTypeSwitchProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();
    const index = value ? dayTypes.indexOf(value) : 0;
    const step = event.key === "ArrowLeft" ? -1 : 1;
    onChange(dayTypes[(index + step + dayTypes.length) % dayTypes.length]);
  }

  return (
    <div
      className="workplace-switch"
      role="radiogroup"
      aria-label="What kind of day was it?"
      onKeyDown={handleKeyDown}
    >
      {options.map(({ value: option, label, shortLabel, icon: Icon }) => {
        const active = value === option;

        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active || (!value && option === "onsite") ? 0 : -1}
            className={cn("workplace-option", `day-${option}`, active && "active")}
            onClick={() => onChange(option)}
          >
            {active ? (
              <motion.span
                layoutId="workplace-highlight"
                className="workplace-highlight"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            ) : null}
            <Icon size={17} />
            <span className="workplace-label" aria-label={label}>
              <span className="workplace-label-long">{label}</span>
              <span className="workplace-label-short" aria-hidden="true">
                {shortLabel}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
