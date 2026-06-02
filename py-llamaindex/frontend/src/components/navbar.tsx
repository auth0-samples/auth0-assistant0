import { NavLink } from "react-router";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export const ActiveLink = (props: { href: string; children: ReactNode }) => {
  return (
    <NavLink
      to={props.href}
      className={({ isActive }) =>
        cn(
          "px-4 py-2 rounded-[18px] whitespace-nowrap flex items-center gap-2 text-sm transition-all",
          isActive && "bg-primary text-primary-foreground",
        )
      }
    >
      {props.children}
    </NavLink>
  );
};
