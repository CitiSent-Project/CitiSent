import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AuthActionButton,
  AuthBrandMark,
  AuthCityFooter,
  authApi,
} from "../../modules/auth";
import { AppKeyboardAvoidingView, FeedbackModal } from "../../modules/shared";

const OTP_LENGTH = 6;
const OTP_TTL_SECONDS = 5 * 60; // 5 minutes
const RESEND_COOLDOWN_SECONDS = 60;

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function OtpVerificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { email } = useLocalSearchParams();
  const normalizedEmail = Array.isArray(email) ? email[0] : email || "";

  // OTP digit state
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const inputRefs = useRef([]);

  // Timers
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(OTP_TTL_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const otpTimerRef = useRef(null);
  const resendTimerRef = useRef(null);

  // UI state
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState({
    visible: false,
    type: "error",
    title: "",
    message: "",
    onCloseAction: null,
  });

  const showModal = (type, title, message, onCloseAction = null) =>
    setModal({ visible: true, type, title, message, onCloseAction });

  const closeModal = () => {
    const action = modal.onCloseAction;
    setModal((prev) => ({ ...prev, visible: false }));
    if (action) action();
  };

  // ─── OTP countdown ────────────────────────────────────────────────────────
  const startOtpTimer = useCallback(() => {
    clearInterval(otpTimerRef.current);
    setOtpSecondsLeft(OTP_TTL_SECONDS);
    otpTimerRef.current = setInterval(() => {
      setOtpSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(otpTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // ─── Resend cooldown ───────────────────────────────────────────────────────
  const startResendCooldown = useCallback(() => {
    clearInterval(resendTimerRef.current);
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    resendTimerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(resendTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startOtpTimer();
    startResendCooldown();
    return () => {
      clearInterval(otpTimerRef.current);
      clearInterval(resendTimerRef.current);
    };
  }, [startOtpTimer, startResendCooldown]);

  // ─── Digit input handling ──────────────────────────────────────────────────
  const handleDigitChange = (value, index) => {
    const cleaned = value.replace(/\D/g, "").slice(-1);
    setError("");

    const newDigits = [...digits];
    newDigits[index] = cleaned;
    setDigits(newDigits);

    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = "";
      setDigits(newDigits);
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ─── Verify OTP ────────────────────────────────────────────────────────────
  const handleVerify = async () => {
    if (isVerifying) return;

    const otp = digits.join("");

    if (otp.length < OTP_LENGTH) {
      setError("Please enter all 6 digits of your verification code.");
      return;
    }

    if (otpSecondsLeft === 0) {
      setError("Your code has expired. Please request a new one.");
      return;
    }

    setError("");
    setIsVerifying(true);

    try {
      const result = await authApi.verifyOtp(normalizedEmail, otp);
      const resetToken = result?.resetToken;

      if (!resetToken) {
        throw new Error("Verification succeeded but no reset token was returned.");
      }

      clearInterval(otpTimerRef.current);
      clearInterval(resendTimerRef.current);

      router.push({
        pathname: "/auth/ResetPassword",
        params: { resetToken },
      });
    } catch (err) {
      const msg = err?.message || "Verification failed. Please try again.";
      setError(msg);

      // If OTP is fully invalidated, reset digits
      if (
        msg.toLowerCase().includes("invalidated") ||
        msg.toLowerCase().includes("expired")
      ) {
        setDigits(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // ─── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (isResending || resendCooldown > 0) return;

    setIsResending(true);
    setError("");
    setDigits(Array(OTP_LENGTH).fill(""));

    try {
      await authApi.requestOtp(normalizedEmail);
      startOtpTimer();
      startResendCooldown();
      inputRefs.current[0]?.focus();
      showModal("info", "Code Sent", "A new verification code has been sent to your email.");
    } catch (err) {
      const msg = err?.message || "Unable to resend code. Please try again.";
      showModal("error", "Resend Failed", msg);
    } finally {
      setIsResending(false);
    }
  };

  const isOtpExpired = otpSecondsLeft === 0;
  const canResend = resendCooldown === 0 && !isResending;
  const otpValue = digits.join("");
  const isOtpComplete = otpValue.length === OTP_LENGTH;

  // ─── Timer color ───────────────────────────────────────────────────────────
  const timerColor =
    otpSecondsLeft <= 60
      ? otpSecondsLeft <= 30
        ? "#FCA5A5" // red — urgent
        : "#FDE68A" // yellow — warning
      : "#86EFAC"; // green — plenty of time

  return (
    <View
      className="flex-1 bg-[#1B2D4F]"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <StatusBar style="light" />

      <AuthCityFooter />

      <AppKeyboardAvoidingView className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-8 pt-16">
            {/* Brand */}
            <View className="items-center">
              <AuthBrandMark />
            </View>

            {/* Heading */}
            <View className="mt-10 items-center">
              <Text className="text-center text-[32px] text-[#CFDAEA]">
                Enter Verification Code
              </Text>
              <Text className="mt-3 text-center text-[13px] leading-5 text-[#AFC5E2]">
                We sent a 6-digit code to{"\n"}
                <Text className="font-semibold text-[#CFDAEA]">
                  {normalizedEmail}
                </Text>
              </Text>
            </View>

            {/* Countdown */}
            <View className="mt-6 items-center">
              {isOtpExpired ? (
                <Text className="text-[13px] font-semibold text-[#FCA5A5]">
                  Code expired — please request a new one.
                </Text>
              ) : (
                <View className="flex-row items-center gap-2">
                  <Text className="text-[13px] text-[#8CA8C9]">
                    Code expires in{" "}
                  </Text>
                  <Text
                    className="text-[14px] font-bold"
                    style={{ color: timerColor }}
                  >
                    {formatTime(otpSecondsLeft)}
                  </Text>
                </View>
              )}
            </View>

            {/* 6-digit OTP input boxes */}
            <View className="mt-8 flex-row justify-center gap-3">
              {digits.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  value={digit}
                  onChangeText={(value) => handleDigitChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  accessibilityLabel={`OTP digit ${index + 1}`}
                  style={{
                    width: 44,
                    height: 54,
                    borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: error
                      ? "#FCA5A5"
                      : digit
                        ? "#60A5FA"
                        : "#3D5A80",
                    backgroundColor: digit ? "#1E3A5F" : "#162540",
                    color: "#DDEBFF",
                    fontSize: 22,
                    fontWeight: "700",
                    textAlign: "center",
                  }}
                />
              ))}
            </View>

            {/* Error */}
            {error ? (
              <Text
                className="mt-4 text-center text-[13px] text-[#FCA5A5]"
                accessibilityLiveRegion="polite"
              >
                {error}
              </Text>
            ) : null}

            {/* Verify button */}
            <View className="mt-6">
              <AuthActionButton
                label={
                  isVerifying ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    "Verify Code"
                  )
                }
                variant="primary"
                onPress={handleVerify}
                disabled={isVerifying || !isOtpComplete || isOtpExpired}
              />
            </View>

            {/* Resend */}
            <View className="mt-4 items-center">
              {canResend ? (
                <Pressable
                  onPress={handleResend}
                  accessibilityRole="button"
                  accessibilityLabel="Resend verification code"
                >
                  <Text className="text-[13px] font-semibold text-[#60A5FA]">
                    {isResending ? "Sending…" : "Resend Code"}
                  </Text>
                </Pressable>
              ) : (
                <Text className="text-[13px] text-[#5A7A9B]">
                  Resend available in {resendCooldown}s
                </Text>
              )}
            </View>

            {/* Back to login */}
            <Pressable
              className="mt-6 items-center"
              onPress={() => router.push("/auth/LoginForm")}
              accessibilityRole="button"
              accessibilityLabel="Back to login"
            >
              <Text className="text-[13px] text-[#8CA8C9]">Back to Login</Text>
            </Pressable>
          </View>
        </ScrollView>
      </AppKeyboardAvoidingView>

      <FeedbackModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />
    </View>
  );
}
