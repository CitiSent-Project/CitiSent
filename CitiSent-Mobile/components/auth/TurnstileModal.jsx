import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";

const TURNSTILE_SITE_KEY = (process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY || "").trim();

/**
 * Builds the HTML document that loads and renders the Cloudflare Turnstile widget.
 * Emits postMessage events back to React Native WebView:
 * - { type: 'turnstile-ready' }
 * - { type: 'turnstile-token', token: '...' }
 * - { type: 'turnstile-error', message: '...' }
 * - { type: 'turnstile-expired' }
 */
function buildTurnstileHtml(siteKey) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Verification</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .container {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
    }
    #cf-turnstile-container {
      width: 300px;
      height: 65px;
      margin: 0 auto;
    }
  </style>
  <script
    src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoaded"
    async
    defer
  ></script>
</head>
<body>
  <div class="container">
    <div id="cf-turnstile-container"></div>
  </div>
  <script>
    var rendered = false;

    function post(data) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
    }

    function tryRender() {
      if (rendered) return;
      if (typeof turnstile !== 'undefined' && turnstile.render) {
        rendered = true;
        try {
          turnstile.render('#cf-turnstile-container', {
            sitekey: '${siteKey}',
            theme: 'light',
            size: 'normal',
            callback: function(token) {
              post({ type: 'turnstile-token', token: token });
            },
            'error-callback': function(code) {
              post({ type: 'turnstile-error', message: String(code || 'unknown') });
            },
            'expired-callback': function() {
              post({ type: 'turnstile-expired' });
            },
          });
          post({ type: 'turnstile-ready' });
        } catch (err) {
          post({ type: 'turnstile-error', message: err.message || 'render error' });
        }
      }
    }

    function onTurnstileLoaded() {
      tryRender();
    }

    var pollInterval = setInterval(function() {
      if (typeof turnstile !== 'undefined' && turnstile.render) {
        clearInterval(pollInterval);
        tryRender();
      }
    }, 200);

    setTimeout(function() {
      clearInterval(pollInterval);
      if (!rendered) {
        post({ type: 'turnstile-error', message: 'Verification load timed out.' });
      }
    }, 15000);
  </script>
</body>
</html>
  `.trim();
}

/**
 * Base URL used as the WebView origin. Matches the backend domain whitelisted
 * in Cloudflare Turnstile Hostname Management.
 */
const WEBVIEW_BASE_URL =
  (process.env.EXPO_PUBLIC_TURNSTILE_BASE_URL || "").trim() ||
  (process.env.EXPO_PUBLIC_API_BASE_URL || "").replace(/\/api\/v1\/?$/, "").trim() ||
  "https://challenges.cloudflare.com";

function getHumanErrorMessage(code) {
  switch (String(code)) {
    case "110200":
      return "Domain not authorized (110200). Ensure your backend domain is added in Cloudflare Turnstile settings.";
    case "110100":
    case "110110":
    case "400020":
      return `Invalid Turnstile site key (${code}). Please check configuration.`;
    case "110600":
    case "110620":
      return `Verification timed out (${code}). Please tap Retry.`;
    case "200500":
      return "Unable to connect to verification service. Please check your connection.";
    default:
      return `Verification failed (${code}). Please try again.`;
  }
}

/**
 * TurnstileModal
 *
 * Renders the Cloudflare Turnstile CAPTCHA widget in a clean modal dialog.
 */
export default function TurnstileModal({
  visible,
  onClose,
  onTokenReceived,
  onError,
}) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.min(Math.max(screenWidth - 32, 320), 380);
  const webViewWidth = Math.max(300, Math.min(cardWidth - 24, 320));
  const webViewHeight = 90;

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorDetail, setErrorDetail] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const webViewRef = useRef(null);
  const handledRef = useRef(false);

  // Development bypass if no site key is configured
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

  const handleError = useCallback((err) => {
    const description = err?.description || err?.message || "unknown";
    setIsLoading(false);
    setHasError(true);
    setErrorDetail(`Connection error: ${description}`);
    if (onError) onError("Failed to load verification widget. Please check your connection.");
  }, [onError]);

  const handleHttpError = useCallback((syntheticEvent) => {
    const { nativeEvent } = syntheticEvent || {};
    const statusCode = nativeEvent?.statusCode || "unknown";
    setIsLoading(false);
    setHasError(true);
    setErrorDetail(`HTTP error (${statusCode})`);
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

      if (parsed.type === "turnstile-ready") {
        setIsLoading(false);
        setHasError(false);
        setErrorDetail("");
      } else if (parsed.type === "turnstile-token" && parsed.token) {
        handledRef.current = true;
        setIsLoading(false);
        if (onTokenReceived) onTokenReceived(parsed.token);
      } else if (parsed.type === "turnstile-error") {
        const errorMsg = parsed.message || "unknown";
        const humanMsg = getHumanErrorMessage(errorMsg);
        setIsLoading(false);
        setHasError(true);
        setErrorDetail(humanMsg);
        if (onError) onError(humanMsg);
      } else if (parsed.type === "turnstile-expired") {
        handledRef.current = false;
        if (onError) onError("Verification expired. Please try again.");
      }
    },
    [onTokenReceived, onError],
  );

  // Safety timeout: 15s
  useEffect(() => {
    if (!visible || !TURNSTILE_SITE_KEY) return;
    const timer = setTimeout(() => {
      if (!handledRef.current && isLoading) {
        setIsLoading(false);
        setHasError(true);
        setErrorDetail("Verification timed out. Please check your connection and retry.");
      }
    }, 15000);
    return () => clearTimeout(timer);
  }, [visible, isLoading]);

  const handleModalShow = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    setErrorDetail("");
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
        <View style={[styles.card, { width: cardWidth }]}>
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
              : "Please complete the check below to continue."}
          </Text>

          {/* Widget Area */}
          {!TURNSTILE_SITE_KEY ? (
            <View style={[styles.devContainer, { width: webViewWidth }]}>
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
            <View style={[styles.webViewContainer, { width: webViewWidth, height: webViewHeight }]}>
              {isLoading && (
                <View style={[styles.loadingOverlay, { width: webViewWidth, height: webViewHeight }]}>
                  <ActivityIndicator size="large" color="#1D4ED8" />
                  <Text style={styles.loadingText}>Loading verification...</Text>
                </View>
              )}

              {hasError ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="wifi-outline" size={28} color="#DC2626" />
                  <Text style={styles.errorText}>
                    Unable to load verification widget.
                  </Text>
                  {errorDetail ? (
                    <Text style={styles.errorDetailText}>{errorDetail}</Text>
                  ) : null}
                  <View style={styles.errorActions}>
                    <Pressable
                      style={styles.retryBtn}
                      onPress={() => {
                        setHasError(false);
                        setErrorDetail("");
                        setIsLoading(true);
                        handledRef.current = false;
                        setReloadKey((k) => k + 1);
                      }}
                    >
                      <Text style={styles.retryBtnText}>Retry</Text>
                    </Pressable>
                    {__DEV__ && (
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
                  key={`turnstile-wv-${reloadKey}`}
                  ref={webViewRef}
                  source={{ html: turnstileHtml, baseUrl: WEBVIEW_BASE_URL }}
                  onError={(e) => handleError(e?.nativeEvent)}
                  onHttpError={handleHttpError}
                  onMessage={handleMessage}
                  javaScriptEnabled
                  domStorageEnabled
                  mixedContentMode="always"
                  thirdPartyCookiesEnabled
                  sharedCookiesEnabled
                  originWhitelist={["*"]}
                  androidLayerType="software"
                  opaque={false}
                  javaScriptCanOpenWindowsAutomatically={true}
                  setSupportMultipleWindows={false}
                  style={{ width: webViewWidth, height: webViewHeight, backgroundColor: "#FFFFFF" }}
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
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  shieldIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: {
    width: "100%",
    fontSize: 12,
    color: "#64748B",
    lineHeight: 16,
    marginBottom: 14,
    textAlign: "left",
  },
  webViewContainer: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    gap: 8,
    zIndex: 10,
  },
  loadingText: {
    fontSize: 12,
    color: "#64748B",
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    gap: 6,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#DC2626",
    textAlign: "center",
  },
  errorDetailText: {
    fontSize: 10,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 13,
  },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#1D4ED8",
    borderRadius: 6,
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
    marginTop: 12,
    paddingVertical: 6,
    alignItems: "center",
  },
  cancelLinkText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
});
