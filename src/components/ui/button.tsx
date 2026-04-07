import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Variant can be used by consumers to apply their own styles. This library
   * does not prescribe any specific variants but passes the value through as
   * a data attribute for easy targeting.
   */
  variant?: string;
  /**
   * Size can be used by consumers to adjust the button dimensions. This library
   * leaves styling up to the consumer.
   */
  size?: string;
}

/**
 * A minimal button component. It forwards all props to a native `<button>` and
 * allows passing variant and size as data attributes for styling. The
 * `className` prop can be used to apply custom styles.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant, size, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={className}
        data-variant={variant}
        data-size={size}
        {...props}
      />
    );
  }
);