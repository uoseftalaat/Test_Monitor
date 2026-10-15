import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToGlobalSummary,
  subscribeToProject,
  fetchLocalGlobalSummary,
  fetchLocalProject
} from '../firebase/dataService';

export function useProjectData({
  selectedProjectId,
  currentUser,
  bypassAuthForFallback,
  firebaseReady,
  authLoading
}) {
  const [globalSummary, setGlobalSummary] = useState(null);
  const [currentProjectData, setCurrentProjectData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isUsingCache, setIsUsingCache] = useState(false);
  const [isFirebaseLive, setIsFirebaseLive] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(60); // seconds

  const loadLocalFallback = useCallback(async () => {
    setIsUsingCache(false);
    setIsFirebaseLive(false);
    try {
      const summaryData = await fetchLocalGlobalSummary();
      setGlobalSummary(summaryData);

      if (selectedProjectId !== 'all') {
        const projData = await fetchLocalProject(selectedProjectId);
        setCurrentProjectData(projData);
      }
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.warn('Local fallback error:', err);
      // Try local storage cache
      const cacheKey = `test_monitor_cache_${selectedProjectId}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          setCurrentProjectData(JSON.parse(cached));
          setIsUsingCache(true);
        } catch (_) {}
      } else {
        setErrorMessage(err.message || 'Failed to load test monitoring data');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedProjectId]);

  // Manage Data Subscriptions / Loading
  useEffect(() => {
    if (authLoading) return;
    if (!currentUser && !bypassAuthForFallback) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    // If Firebase is configured and user is signed in, listen to Firestore in real time
    if (firebaseReady && currentUser) {
      let isGlobalLoaded = false;
      let isProjectLoaded = selectedProjectId === 'all';

      const checkInitialLoaded = () => {
        if (isGlobalLoaded && isProjectLoaded) {
          setIsLoading(false);
          setIsRefreshing(false);
          setIsFirebaseLive(true);
        }
      };

      // Realtime subscription for Global Summary
      const unsubSummary = subscribeToGlobalSummary(
        (summary) => {
          setGlobalSummary(summary);
          setLastUpdated(summary?.lastUpdated || new Date().toISOString());
          isGlobalLoaded = true;
          checkInitialLoaded();
        },
        (err) => {
          if (err?.code !== 'permission-denied') {
            console.warn('Firestore summary subscription failed, trying local fallback:', err);
            loadLocalFallback();
          }
        }
      );

      // Realtime subscription for Selected Project
      let unsubProject = () => {};
      if (selectedProjectId !== 'all') {
        unsubProject = subscribeToProject(
          selectedProjectId,
          (projData) => {
            setCurrentProjectData(projData);
            setLastUpdated(new Date().toISOString());
            isProjectLoaded = true;
            checkInitialLoaded();

            // Cache to local storage
            try {
              localStorage.setItem(`test_monitor_cache_${selectedProjectId}`, JSON.stringify(projData));
            } catch (_) {}
          },
          (err) => {
            if (err?.code !== 'permission-denied') {
              console.warn(`Firestore project ${selectedProjectId} subscription failed, trying fallback:`, err);
              loadLocalFallback();
            }
          }
        );
      }

      return () => {
        unsubSummary();
        unsubProject();
      };
    } else {
      // Fallback mode (Firebase not configured or user chose local preview)
      loadLocalFallback();
    }
  }, [authLoading, currentUser, bypassAuthForFallback, firebaseReady, selectedProjectId, loadLocalFallback]);

  // Auto-refresh interval (for local mode or periodic sync)
  useEffect(() => {
    if (!autoRefreshInterval || autoRefreshInterval <= 0) return;
    if (isFirebaseLive) return; // Firestore onSnapshot handles updates automatically!

    const timer = setInterval(() => {
      loadLocalFallback();
    }, autoRefreshInterval * 1000);

    return () => clearInterval(timer);
  }, [autoRefreshInterval, isFirebaseLive, loadLocalFallback]);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    if (!isFirebaseLive) {
      loadLocalFallback();
    } else {
      setTimeout(() => {
        setIsRefreshing(false);
        setLastUpdated(new Date().toISOString());
      }, 500);
    }
  }, [isFirebaseLive, loadLocalFallback]);

  const clearProjectData = useCallback(() => {
    setCurrentProjectData(null);
    setGlobalSummary(null);
    setIsFirebaseLive(false);
  }, []);

  return {
    globalSummary,
    currentProjectData,
    isLoading,
    isRefreshing,
    lastUpdated,
    errorMessage,
    isUsingCache,
    isFirebaseLive,
    autoRefreshInterval,
    setAutoRefreshInterval,
    refresh,
    clearProjectData
  };
}

export default useProjectData;
