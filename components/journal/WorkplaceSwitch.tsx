"use client";

import { KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Building2, House } from "lucide-react";
import { cn } from "@/lib/utils";

export type Workplace = "onsite" | "home";

interface WorkplaceSwitchProps {
  value: Workplace | null;
  onChange: (value: Workplace) => void;
}

const options = [
  { value: "onsite" as const, label: "Onsite", shortLabel: "Onsite", icon: Building2 },
  { value: "home" as const, label: "Work from home", shortLabel: "Home", icon: House }
];

export function WorkplaceSwitch({ value, onChange }: WorkplaceSwitchProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      onChange(event.key === "ArrowLeft" ? "onsite" : "home");
    }
  }

  return (
    <div
      className="workplace-switch"
      role="radiogroup"
      aria-label="Where did you work today?"
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
            className={cn("workplace-option", active && "active")}
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
