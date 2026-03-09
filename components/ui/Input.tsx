import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-stone-700 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          {...props}
          className={`
            w-full px-4 py-3 border rounded-lg text-stone-900 placeholder-stone-400
            focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
            transition
            ${error ? 'border-red-400 bg-red-50' : 'border-stone-300 bg-white'}
            ${className}
          `}
        />
        {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
