import { useCallback, useEffect, useState } from "react";
import { departmentsApi } from "../services/departments";

export default function useDepartments() {
  const [departments, setDepartments] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDepartments = useCallback(async () => {
    const nextDepartments = await departmentsApi.getDepartments();
    return Array.isArray(nextDepartments) ? nextDepartments : [];
  }, []);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setIsInitialLoading(true);
      setError(null);

      try {
        const nextDepartments = await fetchDepartments();
        if (isActive) {
          setDepartments(nextDepartments);
        }
      } catch (err) {
        if (isActive) {
          setDepartments([]);
          setError(err);
        }
      } finally {
        if (isActive) {
          setIsInitialLoading(false);
        }
      }
    };

    load();

    return () => {
      isActive = false;
    };
  }, [fetchDepartments]);

  const reloadDepartments = useCallback(async () => {
    setError(null);

    try {
      const nextDepartments = await fetchDepartments();
      setDepartments(nextDepartments);
    } catch (err) {
      setDepartments([]);
      setError(err);
    }
  }, [fetchDepartments]);

  return {
    departments,
    isInitialLoading,
    error,
    reloadDepartments,
  };
}
