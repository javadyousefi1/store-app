"use client";

import { useState } from "react";

interface ModalState<T> {
  open: boolean;
  data?: T;
}

export function useModal<T = undefined>() {
  const [state, setState] = useState<ModalState<T>>({ open: false });

  return {
    isOpen: state.open,
    data: state.data,
    open: (data?: T) => setState({ open: true, data }),
    close: () => setState({ open: false }),
  };
}
