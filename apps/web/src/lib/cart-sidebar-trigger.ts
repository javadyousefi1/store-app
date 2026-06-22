let trigger: (() => void) | null = null;

export function registerCartSidebarTrigger(nextTrigger: () => void) {
  trigger = nextTrigger;

  return () => {
    if (trigger === nextTrigger) trigger = null;
  };
}

export function triggerCartSidebar() {
  trigger?.();
}
