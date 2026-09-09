import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { authApi } from "../../services/auth";

const OTP_LENGTH = 6;
const OTP_TTL_SECONDS = 5 * 60; // 5 minutes
const RESEND_COOLDOWN_SECONDS = 60;

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function GuestVerificationModal({
  visible,
  onClose,
  onVerified,
}) {
  // Steps: 'phone' | 'otp' | 'success'
  const [step, setStep] = useState("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const inputRefs = useRef([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Timers
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(OTP_TTL_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const otpTimerRef = useRef(null);
  const resendTimerRef = useRef(null);

  const resetState = useCallback(() => {
    setStep("phone");
    setPhoneNumber("");
    setDigits(Array(OTP_LENGTH).fill(""));
    setError("");
    setIsLoading(false);
    clearInterval(otpTimerRef.current);
    clearInterval(resendTimerRef.current);
  }, []);

  useEffect(() => {
    if (!visible) {
      resetState();
    }
  }, [visible, resetState]);

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

  // Send OTP
  const handleSendOtp = async () => {
    const rawNumber = phoneNumber.trim().replace(/\D/g, "");
    if (!rawNumber) {
      setError("Please enter your Philippine phone number.");
      return;
    }

    const fullNumber = rawNumber.startsWith("09")
      ? rawNumber
      : rawNumber.startsWith("9")
      ? "0" + rawNumber
      : rawNumber;

    if (fullNumber.length !== 11 || !fullNumber.startsWith("09")) {
      setError("Please enter a valid 11-digit mobile number (e.g. 09171234567).");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await authApi.sendGuestOtp(fullNumber);
      setStep("otp");
      setDigits(Array(OTP_LENGTH).fill(""));
      startOtpTimer();
      startResendCooldown();
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    } catch (err) {
      setError(err?.message || "Unable to send verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;

    setIsLoading(true);
    setError("");
    setDigits(Array(OTP_LENGTH).fill(""));

    const rawNumber = phoneNumber.trim().replace(/\D/g, "");
    const fullNumber = rawNumber.startsWith("09")
      ? rawNumber
      : rawNumber.startsWith("9")
      ? "0" + rawNumber
      : rawNumber;

    try {
      await authApi.sendGuestOtp(fullNumber);
      startOtpTimer();
      startResendCooldown();
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err?.message || "Unable to resend code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Digit handling
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

  // Verify OTP
  const handleVerify = async () => {
    const otp = digits.join("");
    if (otp.length < OTP_LENGTH) {
      setError("Please enter all 6 digits of your verification code.");
      return;
    }

    if (otpSecondsLeft === 0) {
      setError("Your code has expired. Please request a new one.");
      return;
    }

    setIsLoading(true);
    setError("");

    const rawNumber = phoneNumber.trim().replace(/\D/g, "");
    const fullNumber = rawNumber.startsWith("09")
      ? rawNumber
      : rawNumber.startsWith("9")
      ? "0" + rawNumber
      : rawNumber;

    try {
      await authApi.verifyGuestOtp(fullNumber, otp);
      clearInterval(otpTimerRef.current);
      clearInterval(resendTimerRef.current);
      setStep("success");

      // Auto-continue after brief positive feedback
      setTimeout(() => {
        if (onVerified) {
          onVerified();
        }
      }, 900);
    } catch (err) {
      const msg = err?.message || "Verification failed. Please try again.";
      setError(msg);

      if (
        msg.toLowerCase().includes("invalidated") ||
        msg.toLowerCase().includes("expired")
      ) {
        setDigits(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isOtpComplete = digits.join("").length === OTP_LENGTH;
  const isOtpExpired = otpSecondsLeft === 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 items-center justify-center bg-black/60 px-5">
          <View className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            {/* Close Button */}
            {step !== "success" && (
              <Pressable
                onPress={onClose}
                className="absolute right-4 top-4 z-10 h-8 w-8 items-center justify-center rounded-full bg-gray-100"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={18} color="#64748B" />
              </Pressable>
            )}

            {/* STEP 1: Phone input */}
            {step === "phone" && (
              <View>
                <View className="mb-4 h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 self-center">
                  <Ionicons name="shield-checkmark" size={26} color="#1D4ED8" />
                </View>

                <Text
                  className="mb-2 text-center text-xl font-extrabold"
                  style={{ color: Colors.text?.heading || "#0F172A" }}
                >
                  Verify your account
                </Text>

                <Text
                  className="mb-6 text-center text-xs leading-5"
                  style={{ color: Colors.text?.slate || "#4B5563" }}
                >
                  To help prevent spam and false reports, guest users must verify
                  their phone number before submitting a report.
                </Text>

                <View className="mb-2">
                  <Text className="mb-1.5 text-xs font-semibold text-slate-700">
                    Philippine Mobile Number
                  </Text>
                  <View className="flex-row items-center rounded-xl border border-slate-300 bg-slate-50 px-3 py-1">
                    <Text className="mr-2 text-sm font-bold text-slate-800">
                      +63
                    </Text>
                    <View className="h-5 w-[1px] bg-slate-300 mr-2" />
                    <TextInput
                      value={phoneNumber}
                      onChangeText={(val) => {
                        setPhoneNumber(val);
                        setError("");
                      }}
                      placeholder="0917 123 4567"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                      className="flex-1 py-2 text-sm font-semibold text-slate-900"
                      maxLength={14}
                      autoFocus
                    />
                  </View>
                </View>

                {error ? (
                  <Text className="mt-1 mb-2 text-xs font-medium text-red-600">
                    {error}
                  </Text>
                ) : null}

                <Pressable
                  onPress={handleSendOtp}
                  disabled={isLoading || !phoneNumber.trim()}
                  className="mt-4 w-full rounded-xl py-3.5 shadow-sm"
                  style={{
                    backgroundColor:
                      isLoading || !phoneNumber.trim()
                        ? "#93C5FD"
                        : Colors.primaryStrong,
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text className="text-center text-sm font-bold text-white">
                      Send OTP
                    </Text>
                  )}
                </Pressable>

                <Pressable onPress={onClose} className="mt-3 py-2">
                  <Text className="text-center text-xs font-semibold text-slate-500">
                    Cancel & return to report
                  </Text>
                </Pressable>
              </View>
            )}

            {/* STEP 2: OTP Entry */}
            {step === "otp" && (
              <View>
                <View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 self-center">
                  <Ionicons name="keypad-outline" size={24} color="#1D4ED8" />
                </View>

                <Text
                  className="mb-1 text-center text-xl font-extrabold"
                  style={{ color: Colors.text?.heading || "#0F172A" }}
                >
                  Enter verification code
                </Text>

                <Text
                  className="mb-4 text-center text-xs text-slate-500 leading-4"
                >
                  We sent a 6-digit code to{"\n"}
                  <Text className="font-bold text-slate-800">
                    +63 {phoneNumber.replace(/^0/, "")}
                  </Text>
                </Text>

                {/* Expiry Timer */}
                <View className="mb-4 items-center">
                  {isOtpExpired ? (
                    <Text className="text-xs font-semibold text-red-500">
                      Code expired. Please request a new one.
                    </Text>
                  ) : (
                    <Text className="text-xs text-slate-500">
                      Expires in{" "}
                      <Text className="font-bold text-blue-700">
                        {formatTime(otpSecondsLeft)}
                      </Text>
                    </Text>
                  )}
                </View>

                {/* 6 Digit Input Boxes */}
                <View className="mb-4 flex-row justify-center gap-2">
                  {digits.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      value={digit}
                      onChangeText={(val) => handleDigitChange(val, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      style={{
                        width: 42,
                        height: 50,
                        borderRadius: 10,
                        borderWidth: 1.5,
                        borderColor: error
                          ? "#FCA5A5"
                          : digit
                          ? "#2563EB"
                          : "#CBD5E1",
                        backgroundColor: digit ? "#EFF6FF" : "#F8FAFC",
                        color: "#0F172A",
                        fontSize: 20,
                        fontWeight: "700",
                        textAlign: "center",
                      }}
                    />
                  ))}
                </View>

                {error ? (
                  <Text className="mb-3 text-center text-xs font-medium text-red-600">
                    {error}
                  </Text>
                ) : null}

                {/* Verify Button */}
                <Pressable
                  onPress={handleVerify}
                  disabled={isLoading || !isOtpComplete || isOtpExpired}
                  className="w-full rounded-xl py-3.5 shadow-sm"
                  style={{
                    backgroundColor:
                      isLoading || !isOtpComplete || isOtpExpired
                        ? "#93C5FD"
                        : Colors.primaryStrong,
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text className="text-center text-sm font-bold text-white">
                      Verify
                    </Text>
                  )}
                </Pressable>

                {/* Resend & Back options */}
                <View className="mt-4 flex-row items-center justify-between px-1">
                  <Pressable
                    onPress={() => {
                      setStep("phone");
                      setError("");
                    }}
                  >
                    <Text className="text-xs font-semibold text-slate-500">
                      Change number
                    </Text>
                  </Pressable>

                  {resendCooldown === 0 ? (
                    <Pressable onPress={handleResendOtp} disabled={isLoading}>
                      <Text className="text-xs font-bold text-blue-600">
                        Resend OTP
                      </Text>
                    </Pressable>
                  ) : (
                    <Text className="text-xs text-slate-400">
                      Resend in {resendCooldown}s
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* STEP 3: Success state */}
            {step === "success" && (
              <View className="py-4 items-center">
                <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <Ionicons name="checkmark" size={32} color="#15803D" />
                </View>

                <Text className="mb-1 text-center text-xl font-extrabold text-slate-900">
                  Phone number verified
                </Text>

                <Text className="text-center text-xs text-slate-500">
                  Submitting your report now...
                </Text>

                <ActivityIndicator
                  size="small"
                  color="#15803D"
                  className="mt-4"
                />
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
