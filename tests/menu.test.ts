import { describe, expect, it } from 'vitest';

describe('Index menu state helper', () => {
  it('synchronizes panel class, aria-expanded, and optional focus return', async () => {
    let menuModule: typeof import('../src/scripts/menu') | undefined;
    try {
      menuModule = await import('../src/scripts/menu');
    } catch {
      // The assertion below reports a failed import with a focused message.
    }
    expect(menuModule).toBeDefined();
    if (!menuModule) return;

    const classes = new Set<string>();
    const panel = {
      classList: {
        contains: (name: string) => classes.has(name),
        toggle: (name: string, force?: boolean) => {
          const next = force ?? !classes.has(name);
          if (next) classes.add(name);
          else classes.delete(name);
          return next;
        },
      },
    };
    const attributes = new Map<string, string>();
    let focusCount = 0;
    const button = {
      setAttribute: (name: string, value: string) => attributes.set(name, value),
      focus: () => { focusCount += 1; },
    };

    menuModule.setMenuOpen(button, panel, true);
    expect(menuModule.isMenuOpen(panel)).toBe(true);
    expect(attributes.get('aria-expanded')).toBe('true');

    menuModule.setMenuOpen(button, panel, false, { returnFocus: true });
    expect(menuModule.isMenuOpen(panel)).toBe(false);
    expect(attributes.get('aria-expanded')).toBe('false');
    expect(focusCount).toBe(1);

    expect(menuModule.shouldDismissMenu(true, true, false)).toBe(false);
    expect(menuModule.shouldDismissMenu(true, false, true)).toBe(false);
    expect(menuModule.shouldDismissMenu(true, false, false)).toBe(true);
    expect(menuModule.shouldDismissMenu(false, false, false)).toBe(false);
  });
});
