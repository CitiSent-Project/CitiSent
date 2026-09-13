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
 * Builds the minimal HTML page that loads the Cloudflare Turnstile widget.
 * On success, postMessage fires with { type: 'turnstile-token', token: '...' }.
 * On error, postMessage fires with { type: 'turnstile-error', message: '...' }.
 *
 * Internal status messages are emitted via { type: 'turnstile-log', message: '...' }
 * so the React Native side can trace the widget lifecycle without guessing.
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
  <script>
    function rnLog(msg) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({ type: 'turnstile-log', message: msg })
        );
      }
    }
    window.addEventListener('error', function(e) {
      rnLog('JS error: ' + (e.message || 'unknown'));
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({ type: 'turnstile-error', message: e.message || 'Script error' })
        );
      }
    });
    window.addEventListener('securitypolicyviolation', function(e) {
      rnLog('CSP violation: ' + e.blockedURI);
    });

    // Monitor when Cloudflare injects the challenge iframe
    try {
      var observer = new MutationObserver(function(mutations) {
        for (var i = 0; i < mutations.length; i++) {
          var added = mutations[i].addedNodes;
          for (var j = 0; j < added.length; j++) {
            var node = added[j];
            if (node.tagName === 'IFRAME') {
              rnLog('Iframe added: src=' + (node.src || '').substring(0, 80));
              node.addEventListener('load', function() {
                rnLog('Iframe load completed! size=' + node.offsetWidth + 'x' + node.offsetHeight);
                inspectDom();
              });
            }
          }
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {
      rnLog('Observer error: ' + e.message);
    }

    function inspectDom() {
      try {
        var c = document.getElementById('cf-turnstile-container');
        var iframes = document.querySelectorAll('iframe');
        var details = [];
        for (var i = 0; i < iframes.length; i++) {
          var f = iframes[i];
          var cs = window.getComputedStyle(f);
          details.push({
            src: (f.src || '').substring(0, 60),
            w: f.offsetWidth,
            h: f.offsetHeight,
            vis: cs.visibility,
            disp: cs.display,
            op: cs.opacity
          });
        }
        rnLog('DOM: win=' + window.innerWidth + 'x' + window.innerHeight +
              ', body=' + document.body.offsetWidth + 'x' + document.body.offsetHeight +
              ', iframes=' + iframes.length +
              ', details=' + JSON.stringify(details));
      } catch (err) {
        rnLog('DOM check err: ' + (err.message || err));
      }
    }
  </script>
  <script
    src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoaded"
    async
    defer
    onerror="rnLog('Failed to load Turnstile script from Cloudflare CDN')"
  ></script>
</head>
<body>
  <div class="container">
    <div id="cf-turnstile-container"></div>
  </div>
  <script>
    var rendered = false;

    // Called by the Turnstile script's ?onload= parameter
    function onTurnstileLoaded() {
      rnLog('Turnstile API script loaded (onload callback)');
      tryRender();
    }

    function tryRender() {
      if (rendered) return;
      if (typeof turnstile !== 'undefined' && turnstile.render) {
        rendered = true;
        try {
          rnLog('Origin: ' + window.location.origin + ' | Hostname: ' + window.location.hostname);
        } catch (_) {}
        rnLog('Calling turnstile.render()');
        try {
          turnstile.render('#cf-turnstile-container', {
            sitekey: '${siteKey}',
            theme: 'light',
            size: 'normal',
            callback: function(token) {
              rnLog('Token received from widget');
              window.ReactNativeWebView.postMessage(
                JSON.stringify({ type: 'turnstile-token', token: token })
              );
            },
            'error-callback': function(code) {
              rnLog('Widget error-callback fired: ' + (code || 'unknown'));
              window.ReactNativeWebView.postMessage(
                JSON.stringify({ type: 'turnstile-error', message: String(code || 'unknown') })
              );
            },
            'expired-callback': function() {
              rnLog('Widget expired-callback fired');
              window.ReactNativeWebView.postMessage(
                JSON.stringify({ type: 'turnstile-expired' })
              );
            },
          });
          rnLog('turnstile.render() completed — widget should be visible');
          inspectDom();
          setTimeout(inspectDom, 1000);
          setTimeout(inspectDom, 2500);
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: 'turnstile-ready' })
          );
        } catch (err) {
          rnLog('turnstile.render() threw: ' + (err.message || err));
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: 'turnstile-error', message: err.message || 'render error' })
          );
        }
      } else {
        rnLog('turnstile API not yet available');
      }
    }

    // Fallback polling in case onload fires before our script runs
    rnLog('Starting poll for turnstile API...');
    var pollCount = 0;
    var pollInterval = setInterval(function() {
      pollCount++;
      if (typeof turnstile !== 'undefined' && turnstile.render) {
        clearInterval(pollInterval);
        rnLog('turnstile API found via polling (attempt ' + pollCount + ')');
        tryRender();
      }
    }, 200);

    // Stop polling after 15s
    setTimeout(function() {
      clearInterval(pollInterval);
      if (!rendered) {
        rnLog('Polling stopped after 15s — turnstile API never became available');
        window.ReactNativeWebView.postMessage(
          JSON.stringify({ type: 'turnstile-error', message: 'Turnstile script did not load within 15s' })
        );
      }
    }, 15000);
  </script>
</body>
</html>
  `.trim();
}

/**
 * The base URL used as the WebView's document origin.
 *
 * Cloudflare Turnstile validates the page origin against the widget's allowed
 * domains list configured in the Cloudflare dashboard. Using "http://localhost"
 * causes a silent render failure if localhost is not in that list.
 *
 * We use the production backend URL so the origin matches a real domain that
 * should be whitelisted in Cloudflare. If the env variable is not set, fall
 * back to "https://challenges.cloudflare.com" which Cloudflare always allows
 * for its own Turnstile widget resources.
 */
const WEBVIEW_BASE_URL =
  (process.env.EXPO_PUBLIC_TURNSTILE_BASE_URL || "").trim() ||
  (process.env.EXPO_PUBLIC_API_BASE_URL || "").replace(/\/api\/v1\/?$/, "").trim() ||
  "https://challenges.cloudflare.com";

function getHumanErrorMessage(code) {
  switch (String(code)) {
    case "110200":
      return "Domain not authorized (110200). Add 'citisent-backend.onrender.com' to Hostname Management in your Cloudflare Turnstile settings.";
    case "110100":
    case "110110":
    case "400020":
      return `Invalid Turnstile site key (${code}). Please verify your Cloudflare configuration.`;
    case "110600":
    case "110620":
      return `Verification timed out (${code}). Please tap Retry.`;
    case "200500":
      return "Unable to connect to Cloudflare verification service. Please check your network.";
    default:
      return `Verification failed (${code}). Please try again.`;
  }
}

/**
 * TurnstileModal
 *
 * Renders a Cloudflare Turnstile CAPTCHA widget inside a WebView modal.
 * When EXPO_PUBLIC_TURNSTILE_SITE_KEY is not configured, it shows a
 * development bypass so testing/local dev continues uninterrupted.
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

  // ── Lifecycle logging ──────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      console.warn(
        `[Turnstile] Component mounted — site key configured: ${Boolean(TURNSTILE_SITE_KEY)}, ` +
        `baseUrl: ${WEBVIEW_BASE_URL}`
      );
    }
    return () => {
      if (visible) {
        console.warn("[Turnstile] Component unmounting");
      }
    };
  }, [visible]);

  // When no Turnstile key is configured, automatically pass verification
  // so the guest user can submit reports in development.
  useEffect(() => {
    if (!visible) return;

    if (!TURNSTILE_SITE_KEY) {
      console.warn("[Turnstile] No site key — using development bypass (mock token in 500ms)");
      const timer = setTimeout(() => {
        if (!handledRef.current) {
          handledRef.current = true;
          console.warn("[Turnstile] Development bypass: sending mock token");
          if (onTokenReceived) {
            onTokenReceived("mock-dev-turnstile-token");
          }
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [visible, onTokenReceived]);

  const handleLoadStart = useCallback(() => {
    console.warn("[Turnstile] WebView loading started");
  }, []);

  const handleLoad = useCallback(() => {
    console.warn("[Turnstile] WebView loaded (onLoad)");
    // Keep showing spinner until turnstile-ready event
  }, []);

  const handleLoadEnd = useCallback(() => {
    console.warn("[Turnstile] WebView load ended (onLoadEnd)");
  }, []);

  const handleError = useCallback((err) => {
    const description = err?.description || err?.message || "unknown";
    const code = err?.code || "N/A";
    console.warn(`[Turnstile] WebView error — code: ${code}, description: ${description}`);
    setIsLoading(false);
    setHasError(true);
    setErrorDetail(`WebView error: ${description}`);
    if (onError) onError("Failed to load verification widget. Please check your connection.");
  }, [onError]);

  const handleHttpError = useCallback((syntheticEvent) => {
    const { nativeEvent } = syntheticEvent || {};
    const statusCode = nativeEvent?.statusCode || "unknown";
    const description = nativeEvent?.description || "unknown";
    console.warn(`[Turnstile] WebView HTTP error — status: ${statusCode}, description: ${description}`);
    setIsLoading(false);
    setHasError(true);
    setErrorDetail(`HTTP error ${statusCode}: ${description}`);
    if (onError) onError("Failed to load verification widget. Please check your connection.");
  }, [onError]);

  const handleMessage = useCallback(
    (event) => {
      if (handledRef.current) return;

      let parsed;
      try {
        parsed = JSON.parse(event.nativeEvent.data);
      } catch {
        console.warn("[Turnstile] Received unparseable postMessage:", event.nativeEvent.data?.slice(0, 100));
        return;
      }

      if (parsed.type === "turnstile-log") {
        // Relay internal widget lifecycle messages to the RN console
        console.warn(`[Turnstile] Widget: ${parsed.message}`);
        return;
      }

      if (parsed.type === "turnstile-ready") {
        console.warn("[Turnstile] Widget rendered (turnstile-ready) — waiting for user interaction");
        setIsLoading(false);
        setHasError(false);
        setErrorDetail("");
      } else if (parsed.type === "turnstile-token" && parsed.token) {
        handledRef.current = true;
        console.warn(`[Turnstile] Token received (length=${parsed.token.length})`);
        setIsLoading(false);
        if (onTokenReceived) onTokenReceived(parsed.token);
      } else if (parsed.type === "turnstile-error") {
        const errorMsg = parsed.message || "unknown";
        const humanMsg = getHumanErrorMessage(errorMsg);
        console.warn(`[Turnstile] Error event from widget: ${errorMsg} (${humanMsg})`);
        setIsLoading(false);
        setHasError(true);
        setErrorDetail(humanMsg);
        if (onError) onError(humanMsg);
      } else if (parsed.type === "turnstile-expired") {
        console.warn("[Turnstile] Token expired — user can retry");
        // Allow the user to retry — reset handled flag
        handledRef.current = false;
        if (onError) onError("Verification expired. Please try again.");
      }
    },
    [onTokenReceived, onError],
  );

  // Safety timeout: if widget hasn't responded within 15s, show descriptive error
  useEffect(() => {
    if (!visible || !TURNSTILE_SITE_KEY) return;
    const timer = setTimeout(() => {
      if (!handledRef.current && isLoading) {
        console.warn(
          "[Turnstile] Widget load timed out after 15s. " +
          "This usually means the Turnstile script failed to load or the widget's " +
          "allowed domain list in Cloudflare does not include the WebView origin. " +
          `Current baseUrl: ${WEBVIEW_BASE_URL}`
        );
        setIsLoading(false);
        setHasError(true);
        setErrorDetail(
          "The verification widget did not load within 15 seconds. " +
          "This may be a network issue or a domain configuration problem."
        );
      }
    }, 15000);
    return () => clearTimeout(timer);
  }, [visible, isLoading]);

  // Reset state when modal opens/closes
  const handleModalShow = useCallback(() => {
    console.warn("[Turnstile] Modal opened — resetting state");
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
                    console.warn("[Turnstile] Manual dev bypass pressed");
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
                  <Ionicons name="wifi-outline" size={32} color="#DC2626" />
                  <Text style={styles.errorText}>
                    Unable to load verification widget.{"\n"}
                    Please check your connection and try again.
                  </Text>
                  {errorDetail ? (
                    <Text style={styles.errorDetailText}>{errorDetail}</Text>
                  ) : null}
                  <View style={styles.errorActions}>
                    <Pressable
                      style={styles.retryBtn}
                      onPress={() => {
                        console.warn("[Turnstile] Retry pressed — remounting WebView");
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
                            console.warn("[Turnstile] DEV bypass pressed (error state)");
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
                  onLoadStart={handleLoadStart}
                  onLoad={handleLoad}
                  onLoadEnd={handleLoadEnd}
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
  webView: {
    backgroundColor: "#FFFFFF",
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
  errorDetailText: {
    fontSize: 10,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 14,
    marginTop: 2,
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
