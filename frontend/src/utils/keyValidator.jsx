/**
 * Development Key Validator
 * FAANG-grade runtime validation for React keys
 * 
 * This runs ONLY in development and throws errors for invalid keys
 * before they reach React's reconciler.
 */

import React from 'react';

const isDevelopment = import.meta.env.DEV;

/**
 * Validates array items before rendering
 * @throws {Error} If duplicate or empty keys detected
 */
export function validateKeys(items, keyExtractor, componentName = 'Component') {
  if (!isDevelopment) return items;
  
  if (!Array.isArray(items)) {
    console.error(`[KEY_VALIDATOR] ${componentName}: Expected array, got ${typeof items}`);
    return items;
  }

  const keys = [];
  const emptyKeys = [];
  const duplicates = new Map();

  items.forEach((item, index) => {
    const key = typeof keyExtractor === 'function' 
      ? keyExtractor(item, index) 
      : item?.[keyExtractor];

    if (key === '' || key === null || key === undefined) {
      emptyKeys.push({ index, item });
    } else {
      if (keys.includes(key)) {
        if (!duplicates.has(key)) {
          duplicates.set(key, []);
        }
        duplicates.get(key).push(index);
      }
      keys.push(key);
    }
  });

  // Report issues
  if (emptyKeys.length > 0) {
    console.error(
      `[KEY_VALIDATOR] ${componentName}: Found ${emptyKeys.length} items with empty keys`,
      emptyKeys
    );
    console.trace('Stack trace:');
  }

  if (duplicates.size > 0) {
    console.error(
      `[KEY_VALIDATOR] ${componentName}: Found duplicate keys`,
      Array.from(duplicates.entries())
    );
    console.trace('Stack trace:');
  }

  return items;
}

/**
 * HOC to wrap components that render lists
 */
export function withKeyValidation(Component, keyExtractor) {
  if (!isDevelopment) return Component;

  return function ValidatedComponent(props) {
    if (props.items) {
      validateKeys(props.items, keyExtractor, Component.name);
    }
    return <Component {...props} />;
  };
}

/**
 * Hook to validate keys in useEffect
 */
export function useKeyValidation(items, keyExtractor, componentName) {
  if (!isDevelopment) return;

  React.useEffect(() => {
    validateKeys(items, keyExtractor, componentName);
  }, [items, keyExtractor, componentName]);
}
