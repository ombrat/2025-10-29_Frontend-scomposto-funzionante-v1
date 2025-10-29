import React from 'react';

/**
 * Simple provider wrapper for future global providers (theme, toast, auth...)
 * Use it to wrap the App or parts of the tree that need context.
 */
export default function AppProvider({ children }) {
  return (
    <div>
      {children}
    </div>
  );
}