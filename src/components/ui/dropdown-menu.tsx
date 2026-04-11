import * as React from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../../lib/utils';

type DropdownMenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  contentId: string;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
};

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext(componentName: string): DropdownMenuContextValue {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error(`${componentName} must be used within DropdownMenu.`);
  }
  return context;
}

function composeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T | null) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') {
        ref(node);
        return;
      }
      (ref as React.MutableRefObject<T | null>).current = node;
    });
  };
}

interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function DropdownMenu({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
}: DropdownMenuProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const contentId = React.useId();
  const open = openProp ?? uncontrolledOpen;

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (openProp === undefined) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [onOpenChange, openProp]
  );

  const value = React.useMemo(
    () => ({
      open,
      setOpen,
      contentId,
      triggerRef,
    }),
    [contentId, open, setOpen]
  );

  return <DropdownMenuContext.Provider value={value}>{children}</DropdownMenuContext.Provider>;
}

type DropdownMenuTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  children: React.ReactElement;
};

const DropdownMenuTrigger = React.forwardRef<HTMLElement, DropdownMenuTriggerProps>(
  function DropdownMenuTrigger(
    { asChild = false, children, onClick, onKeyDown, ...props },
    forwardedRef
  ) {
    const { open, setOpen, contentId, triggerRef } = useDropdownMenuContext('DropdownMenuTrigger');

    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLElement>) => {
        onClick?.(event as unknown as React.MouseEvent<HTMLButtonElement>);
        if (event.defaultPrevented) return;
        setOpen(!open);
      },
      [onClick, open, setOpen]
    );

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLElement>) => {
        onKeyDown?.(event as unknown as React.KeyboardEvent<HTMLButtonElement>);
        if (event.defaultPrevented) return;
        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setOpen(true);
        } else if (event.key === 'Escape') {
          setOpen(false);
        }
      },
      [onKeyDown, setOpen]
    );

    const triggerProps = {
      ...props,
      ref: composeRefs(forwardedRef, triggerRef as React.Ref<HTMLElement>),
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      'aria-expanded': open,
      'aria-haspopup': 'menu' as const,
      'aria-controls': open ? contentId : undefined,
      'data-state': open ? 'open' : 'closed',
    };

    if (asChild) {
      return React.cloneElement(children, {
        ...triggerProps,
        ...children.props,
        ref: composeRefs(
          (children as React.ReactElement & { ref?: React.Ref<HTMLElement> }).ref,
          forwardedRef,
          triggerRef as React.Ref<HTMLElement>
        ),
        onClick: (event: React.MouseEvent<HTMLElement>) => {
          children.props.onClick?.(event);
          if (!event.defaultPrevented) {
            handleClick(event);
          }
        },
        onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
          children.props.onKeyDown?.(event);
          if (!event.defaultPrevented) {
            handleKeyDown(event);
          }
        },
        'aria-expanded': open,
        'aria-haspopup': 'menu',
        'aria-controls': open ? contentId : undefined,
        'data-state': open ? 'open' : 'closed',
      });
    }

    const triggerButtonProps = triggerProps as React.ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <button
        type="button"
        {...triggerButtonProps}
        className={cn('cursor-pointer', triggerButtonProps.className)}
      >
        {children}
      </button>
    );
  }
);

type DropdownMenuContentProps = React.HTMLAttributes<HTMLDivElement> & {
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom';
  sideOffset?: number;
};

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  function DropdownMenuContent(
    {
      className,
      align = 'center',
      side = 'bottom',
      sideOffset = 4,
      style,
      children,
      ...props
    },
    forwardedRef
  ) {
    const { open, setOpen, contentId, triggerRef } = useDropdownMenuContext('DropdownMenuContent');
    const contentRef = React.useRef<HTMLDivElement | null>(null);
    const [position, setPosition] = React.useState<{
      top: number;
      left: number;
      translateX: string;
      translateY: string;
    } | null>(null);

    const updatePosition = React.useCallback(() => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) {
        setPosition(null);
        return;
      }

      const top = side === 'bottom' ? rect.bottom + sideOffset : rect.top - sideOffset;
      const left =
        align === 'start' ? rect.left : align === 'end' ? rect.right : rect.left + rect.width / 2;
      const translateX =
        align === 'start' ? '0' : align === 'end' ? '-100%' : '-50%';
      const translateY = side === 'bottom' ? '0' : '-100%';

      setPosition({ top, left, translateX, translateY });
    }, [align, side, sideOffset, triggerRef]);

    React.useEffect(() => {
      if (!open) {
        setPosition(null);
        return;
      }

      updatePosition();

      const handleViewportChange = () => updatePosition();

      window.addEventListener('resize', handleViewportChange);
      window.addEventListener('scroll', handleViewportChange, true);

      return () => {
        window.removeEventListener('resize', handleViewportChange);
        window.removeEventListener('scroll', handleViewportChange, true);
      };
    }, [open, updatePosition]);

    React.useEffect(() => {
      if (!open) return;

      const handlePointerDown = (event: MouseEvent) => {
        const target = event.target as Node | null;
        if (!target) return;
        if (contentRef.current?.contains(target)) return;
        if (triggerRef.current?.contains(target)) return;
        setOpen(false);
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setOpen(false);
          triggerRef.current?.focus();
        }
      };

      const handleFocusIn = (event: FocusEvent) => {
        const target = event.target as Node | null;
        if (!target) return;
        if (contentRef.current?.contains(target)) return;
        if (triggerRef.current?.contains(target)) return;
        setOpen(false);
      };

      document.addEventListener('mousedown', handlePointerDown);
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('focusin', handleFocusIn);

      return () => {
        document.removeEventListener('mousedown', handlePointerDown);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('focusin', handleFocusIn);
      };
    }, [open, setOpen, triggerRef]);

    React.useEffect(() => {
      if (!open) return;
      const firstItem = contentRef.current?.querySelector<HTMLElement>('[data-dropdown-item]');
      firstItem?.focus();
    }, [open]);

    if (!open || typeof document === 'undefined') return null;
    if (!position) return null;

    return createPortal(
      <div
        ref={composeRefs(forwardedRef, contentRef)}
        id={contentId}
        role="menu"
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          transform: `translate(${position.translateX}, ${position.translateY})`,
          zIndex: 200,
          ...style,
        }}
        className={cn(
          'z-[200] max-h-[min(60vh,22rem)] min-w-[10rem] overflow-x-hidden overflow-y-auto rounded-lg p-1 shadow-lg outline-none',
          className
        )}
        {...props}
      >
        {children}
      </div>,
      document.body
    );
  }
);

type DropdownMenuItemProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onSelect'
> & {
  onSelect?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

const DropdownMenuItem = React.forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
  function DropdownMenuItem({ className, disabled, onClick, onSelect, ...props }, forwardedRef) {
    const { setOpen, triggerRef } = useDropdownMenuContext('DropdownMenuItem');
    const [highlighted, setHighlighted] = React.useState(false);

    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented || disabled) return;
        onSelect?.(event);
        if (!event.defaultPrevented) {
          setOpen(false);
          triggerRef.current?.focus();
        }
      },
      [disabled, onClick, onSelect, setOpen, triggerRef]
    );

    return (
      <button
        ref={forwardedRef}
        type="button"
        role="menuitem"
        disabled={disabled}
        data-dropdown-item=""
        data-disabled={disabled ? '' : undefined}
        data-highlighted={highlighted ? '' : undefined}
        className={cn(
          'relative flex w-full cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-left text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
          className
        )}
        onClick={handleClick}
        onFocus={() => setHighlighted(true)}
        onBlur={() => setHighlighted(false)}
        onMouseEnter={() => setHighlighted(true)}
        onMouseLeave={() => setHighlighted(false)}
        {...props}
      />
    );
  }
);

function DropdownMenuGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function DropdownMenuPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuPortal,
};
