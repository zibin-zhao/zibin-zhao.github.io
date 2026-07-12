type MenuButton = {
  setAttribute: (name: string, value: string) => void;
  focus: () => void;
};

type MenuPanel = {
  classList: {
    contains: (name: string) => boolean;
    toggle: (name: string, force?: boolean) => boolean;
  };
};

export const isMenuOpen = (panel: MenuPanel | null) => panel?.classList.contains('open') ?? false;

export const shouldDismissMenu = (open: boolean, insideButton: boolean, insidePanel: boolean) => (
  open && !insideButton && !insidePanel
);

export const setMenuOpen = (
  button: MenuButton | null,
  panel: MenuPanel | null,
  open: boolean,
  { returnFocus = false }: { returnFocus?: boolean } = {},
) => {
  panel?.classList.toggle('open', open);
  button?.setAttribute('aria-expanded', String(open));

  if (!open && returnFocus) button?.focus();

  return open;
};
