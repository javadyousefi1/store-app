let _trigger: (() => void) | null = null;

export function registerAuthModalTrigger(fn: () => void) {
  _trigger = fn;
}

export function triggerAuthModal() {
  _trigger?.();
}
