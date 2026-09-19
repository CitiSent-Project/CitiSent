import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import {
  getAuthToken,
  getAuthUser,
  isJwtExpired,
  onAuthStateChanged,
} from "../services/authSession";

function hasValidSession() {
  const token = getAuthToken();
  const user = getAuthUser();
  // A valid session requires: a user object AND either a non-expired token,
  // or a guest user (guests may not carry a JWT).
  if (!user) return false;
  if (user.isGuest) return true;
  return Boolean(token && !isJwtExpired(token));
}

export default function Index() {
  // `null`  = still waiting for initAuthSession to finish
  // `true`  = authenticated
  // `false` = not authenticated
  const [authReady, setAuthReady] = useState(null);

  useEffect(() => {
    // If initAuthSession() already finished before this component mounted
    // (e.g. fast re-render), resolve immediately.
    const token = getAuthToken();
    const user = getAuthUser();
    if (token !== "" || user !== null) {
      setAuthReady(hasValidSession());
      return;
    }

    // Otherwise wait for the auth state notification from _layout.jsx's
    // initAuthSession() call — fires once with the resolved user (or null).
    const unsubscribe = onAuthStateChanged((resolvedUser) => {
      setAuthReady(
        resolvedUser
          ? resolvedUser.isGuest
            ? true
            : Boolean(getAuthToken() && !isJwtExpired(getAuthToken()))
          : false
      );
    });

    // Safety timeout: if initAuthSession never fires (edge case), fall through to Login.
    const timer = setTimeout(() => setAuthReady(false), 3000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  // While we're waiting for the session to be resolved, show a transparent
  // loading screen so the splash screen transition stays smooth.
  if (authReady === null) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="small" color="#1B2D4F" />
      </View>
    );
  }

  return <Redirect href={authReady ? "/(tabs)" : "/auth/Login"} />;
}
