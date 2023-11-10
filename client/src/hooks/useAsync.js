import { useCallback, useEffect, useState } from "react";

export function useAsync(func, dependencies = []) {
  const { execute, ...state } = useAsyncInternal(func, dependencies, true);

  useEffect(() => {
    execute();
  }, [execute]);

  return state;
}

export function useAsyncFn(func, dependencies = []) {
  return useAsyncInternal(func, dependencies);
}

export function useAsyncInternal(func, dependencies, initialLoading = false) {
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState();
  const [value, setValue] = useState();

  const execute = useCallback((...params) => {
    setLoading(true);
    return func(...params)
      .then((data) => {
        setValue(data);
        setError(undefined);
        return data;
      })
      .catch((err) => {
        setValue(undefined);
        setError(err);
        return err;
      })
      .finally(() => {
        setLoading(false);
      });
  }, dependencies);

  return {
    loading,
    error,
    value,
    execute,
  };
}
