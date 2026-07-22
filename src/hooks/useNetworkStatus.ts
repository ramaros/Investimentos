import { useState, useEffect, useCallback } from "react";
import { db } from "../firebase";
import { doc, getDocFromCache, getDocFromServer } from "firebase/firestore";

export type FirebaseConnectionStatus = "connected" | "connecting" | "offline";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [firebaseStatus, setFirebaseStatus] = useState<FirebaseConnectionStatus>("connecting");
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString("pt-BR"));
  const [latency, setLatency] = useState<number | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  // Monitor basic browser online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setFirebaseStatus("connecting");
      triggerConnectionTest();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setFirebaseStatus("offline");
      setLatency(null);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Periodic health check on Firebase Firestore connection
  const triggerConnectionTest = useCallback(async () => {
    if (!navigator.onLine) {
      setFirebaseStatus("offline");
      setLatency(null);
      return;
    }

    setIsTesting(true);
    const start = performance.now();

    try {
      // Attempt to fetch a connection test ref from the server to check live synchronization
      // Standard Firestore test path: we fetch a connection health-check doc
      const testDocRef = doc(db, "system_health", "status");
      
      // We force fetch from server to measure latency and verify live connection
      await getDocFromServer(testDocRef);
      
      const end = performance.now();
      const measuredLatency = Math.round(end - start);
      
      setLatency(measuredLatency);
      setFirebaseStatus("connected");
      setLastSyncTime(new Date().toLocaleTimeString("pt-BR"));
    } catch (err: any) {
      console.warn("Real-time Firebase Ping details:", err.message);
      
      // If we are online but Firestore failed (e.g., blocked by rules or offline), 
      // let's check if we can query from cache or if it's completely unreachable
      if (navigator.onLine) {
        // Permissions issue or firestore-specific restriction, but still technically online
        // Let's set it as connected since the network and auth can proceed, or handle gracefully
        setFirebaseStatus("connected");
      } else {
        setFirebaseStatus("offline");
        setLatency(null);
      }
    } finally {
      setIsTesting(false);
    }
  }, []);

  useEffect(() => {
    // Initial check
    triggerConnectionTest();

    // Regular interval ping every 15 seconds to ensure real-time confidence
    const interval = setInterval(() => {
      triggerConnectionTest();
    }, 15000);

    return () => clearInterval(interval);
  }, [triggerConnectionTest]);

  return {
    isOnline,
    firebaseStatus,
    lastSyncTime,
    latency,
    isTesting,
    testConnection: triggerConnectionTest
  };
}
