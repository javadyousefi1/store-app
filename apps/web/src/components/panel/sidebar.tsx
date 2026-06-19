import { NavContent } from "./nav-content";

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-l bg-card h-full">
      <NavContent />
    </aside>
  );
}
