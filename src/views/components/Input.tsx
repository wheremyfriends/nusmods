import React from "react";

type Props = {
  helperText?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  type?: string;
  [key: string]: any;
};
export default function Input({
  helperText,
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  disabled = false,
  ...otherProps
}: Props) {
  const id = React.useId();
  return (
    <fieldset className="mt-5">
      {label && (
        <label
          htmlFor={id}
          className="block font-medium leading-6 text-gray-900 mb-0"
        >
          {label}
        </label>
      )}

      <input
        type={type}
        id={id}
        className="form-control"
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={onChange}
        {...otherProps}
      />

      {helperText && <div className="text-sm text-grey-900">{helperText}</div>}
    </fieldset>
  );
}
