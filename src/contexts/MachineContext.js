import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { getMachines } from '../apis/machineApi';

const MachineContext = createContext();

export const useMachines = () => {
  const context = useContext(MachineContext);
  if (!context) {
    throw new Error('useMachines must be used within a MachineProvider');
  }
  return context;
};

export const MachineProvider = ({ children }) => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMachines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMachines();
      setMachines(response.data || []);
    } catch (err) {
      setError('Failed to fetch machines');
      console.error('Error fetching machines:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshMachines = useCallback(() => {
    fetchMachines();
  }, [fetchMachines]);

  const value = useMemo(
    () => ({
      machines,
      loading,
      error,
      refreshMachines,
      fetchMachines,
    }),
    [machines, loading, error, refreshMachines, fetchMachines]
  );

  return (
    <MachineContext.Provider value={value}>
      {children}
    </MachineContext.Provider>
  );
};
