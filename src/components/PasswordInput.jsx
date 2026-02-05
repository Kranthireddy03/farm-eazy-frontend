import React, { useState } from 'react';

/**
 * Reusable Password Input with visibility toggle and consistent styling
 * Props:
 * - label: string (label for the field)
 * - name: string (input name)
 * - value: string (input value)
 * - onChange: function (input change handler)
 * - placeholder: string (input placeholder)
 * - error: string (error message)
 * - required: boolean
 * - autoComplete: string
 */
function PasswordInput({
  label = 'Password',
  name = 'password',
  value,
  onChange,
  placeholder = 'Enter password',
  error = '',
  required = false,
  autoComplete = 'current-password',
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center mt-1">
        <input
          type={visible ? 'text' : 'password'}
          name={name}
          id={name}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          className={`input ${error ? 'input-error' : ''}`}
          aria-invalid={error ? 'true' : 'false'}
          required={required}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="ml-2 px-3 py-1 rounded-full border-2 border-green-600 bg-gradient-to-r from-green-200 to-yellow-100 hover:from-green-300 hover:to-yellow-200 transition flex items-center focus:outline-none focus:ring-2 focus:ring-green-500"
          style={{ fontWeight: 'bold', fontSize: '1.1em' }}
        >
          <span style={{ marginRight: 4 }}>{visible ? '👁️' : '🌱'}</span>
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default PasswordInput;
