import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Optional className to style the input. Consumers of this library can override
   * styles via this prop or by using a CSS framework such as Tailwind.
   */
  className?: string;
}

/**
 * A minimal input component used by the DataTable. It forwards all props to
 * the underlying `<input>` element and supports ref forwarding.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={className} {...props} />;
  }
);