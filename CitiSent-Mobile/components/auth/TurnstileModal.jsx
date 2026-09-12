import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";

const TURNSTILE_SITE_KEY = (process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY || "").trim();

/**
 * Builds the minimal HTML page that loads the Cloudflare Turnstile widget.
 * On success, postMessage fires with { type: 'turnstile-token', token: '...' }.
 * On error, postMessage fires with { type: 'turnstile-error', message: '...' }.
 */
function buildTurnstileHtml(siteKey) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <title>Verification</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
      gap: 12px;
    }
    .label {
      font-size: 13px;
      color: #64748B;
      text-align: center;
    }
    #cf-turnstile-container {
      display: flex;
      justify-content: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <p class="label">Complete the security check to continue</p>
    <div id="cf-turnstile-container"></div>
  </div>
  <script
    src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onCfTurnstileLoad"
    async defer
  ></script>
  <script>
    function onCfTurnstileLoad() {
      turnstile.render('#cf-turnstile-container', {
        sitekey: '${siteKey}',
        theme: 'light',
        size: 'normal',
        callback: function(token) {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: 'turnstile-token', token: token })
          );
        },
        'error-callback': function(code) {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: 'turnstile-error', message: code || 'unknown' })
          );
        },
        'expired-callback': function() {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: 'turnstile-expired' })
          );
        },
      });
    }
  </script>
</body>
</html>
  `.trim();
}

/**
 * TurnstileModal
 *
 * Renders a Cloudflare Turnstile CAPTCHA widget inside a WebView modal.
 * When EXPO_PUBLIC_TURNSTILE_SITE_KEY is not configured or in development mode,
 * it automatically completes the check so testing/local dev continues uninterrupted.
 *
 * @param {object}   props
 * @param {boolean}  props.visible         - Whether the modal is shown.
 * @param {function} props.onClose         - Called when user cancels.
 * @param {function} props.onTokenReceived - Called with (token: string) on success.
 * @param {function} props.onError         - Called with (message: string) on failure.
 */
export default function TurnstileModal({
  visible,
  onClose,
  onTokenReceived,
  onError,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const webViewRef = useRef(null);
  const handledRef = useRef(false);

  // When no Turnstile key is configured or in development mode without a key,
  // automatically pass verification so the guest user can submit reports.
  useEffect(() => {
    if (!visible) return;

    if (!TURNSTILE_SITE_KEY) {
      const timer = setTimeout(() => {
        if (!handledRef.current) {
          handledRef.current = true;
          if (onTokenReceived) {
            onTokenReceived("mock-dev-turnstile-token");
          }
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [visible, onTokenReceived]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    if (onError) onError("Failed to load verification widget. Please check your connection.");
  }, [onError]);

  const handleMessage = useCallback(
    (event) => {
      if (handledRef.current) return;

      let parsed;
      try {
        parsed = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }

      if (parsed.type === "turnstile-token" && parsed.token) {
        handledRef.current = true;
        if (onTokenReceived) onTokenReceived(parsed.token);
      } else if (parsed.type === "turnstile-error") {
        setIsLoading(false);
        setHasError(true);
        if (onError) onError("Verification failed. Please try again.");
      } else if (parsed.type === "turnstile-expired") {
        // Allow the user to retry — reset handled flag
        handledRef.current = false;
        if (onError) onError("Verification expired. Please try again.");
      }
    },
    [onTokenReceived, onError],
  );

  // Reset state when modal opens/closes
  const handleModalShow = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    handledRef.current = false;
  }, []);

  const turnstileHtml = TURNSTILE_SITE_KEY ? buildTurnstileHtml(TURNSTILE_SITE_KEY) : "";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onShow={handleModalShow}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.shieldIcon}>
                <Ionicons name="shield-checkmark" size={18} color="#1D4ED8" />
              </View>
              <Text style={styles.title}>Security Check</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Cancel verification"
            >
              <Ionicons name="close" size={18} color="#64748B" />
            </Pressable>
          </View>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            {!TURNSTILE_SITE_KEY
              ? "Verifying security check..."
              : "Please complete the check below to submit your report."}
          </Text>

          {/* Widget Area */}
          {!TURNSTILE_SITE_KEY ? (
            <View style={styles.devContainer}>
              <ActivityIndicator size="small" color="#1D4ED8" />
              <Text style={styles.devText}>Verifying guest status...</Text>
              <Pressable
                style={styles.devBtn}
                onPress={() => {
                  if (!handledRef.current) {
                    handledRef.current = true;
                    if (onTokenReceived) {
                      onTokenReceived("mock-dev-turnstile-token");
                    }
                  }
                }}
              >
                <Text style={styles.devBtnText}>Continue</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.webViewContainer}>
              {isLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#1D4ED8" />
                  <Text style={styles.loadingText}>Loading verification...</Text>
                </View>
              )}

              {hasError ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="wifi-outline" size={32} color="#DC2626" />
                  <Text style={styles.errorText}>
                    Unable to load verification widget.{"\n"}
                    Please check your connection and try again.
                  </Text>
                  <View style={styles.errorActions}>
                    <Pressable
                      style={styles.retryBtn}
                      onPress={() => {
                        setHasError(false);
                        setIsLoading(true);
                        handledRef.current = false;
                        webViewRef.current?.reload();
                      }}
                    >
                      <Text style={styles.retryBtnText}>Retry</Text>
                    </Pressable>
                    {(__DEV__ || !TURNSTILE_SITE_KEY) && (
                      <Pressable
                        style={[styles.retryBtn, { backgroundColor: "#059669" }]}
                        onPress={() => {
                          if (!handledRef.current) {
                            handledRef.current = true;
                            if (onTokenReceived) {
                              onTokenReceived("mock-dev-turnstile-token");
                            }
                          }
                        }}
                      >
                        <Text style={styles.retryBtnText}>Bypass (Dev)</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              ) : (
                <WebView
                  ref={webViewRef}
                  source={{ html: turnstileHtml, baseUrl: "https://localhost" }}
                  onLoad={handleLoad}
                  onError={handleError}
                  onMessage={handleMessage}
                  javaScriptEnabled
                  domStorageEnabled
                  originWhitelist={["*"]}
                  style={styles.webView}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                  showsHorizontalScrollIndicator={false}
                />
              )}
            </View>
          )}

          {/* Cancel link */}
          <Pressable onPress={onClose} style={styles.cancelLink}>
            <Text style={styles.cancelLinkText}>Cancel & return to report</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  shieldIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
    marginBottom: 16,
  },
  webViewContainer: {
    height: 100,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    gap: 8,
    zIndex: 10,
  },
  loadingText: {
    fontSize: 12,
    color: "#64748B",
  },
  webView: {
    width: "100%",
    height: 100,
    backgroundColor: "transparent",
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    textAlign: "center",
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#1D4ED8",
    borderRadius: 8,
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  devContainer: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  devText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E40AF",
    textAlign: "center",
  },
  devBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#1D4ED8",
    borderRadius: 8,
  },
  devBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  errorActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  cancelLink: {
    marginTop: 14,
    paddingVertical: 8,
    alignItems: "center",
  },
  cancelLinkText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
});
