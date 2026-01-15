import debounce from 'lodash/debounce';
import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = debounce(setDebouncedValue, delay);
    handler(value);

    return () => {
      handler.cancel();
    };
  }, [value, delay]);

  return debouncedValue;
}
