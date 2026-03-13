import React from "react";
import { Toaster, toast } from "react-hot-toast";

/**
 * Global toaster renderer.
 * Mount once (e.g., in App.jsx or root layout) so all pages can trigger notifications.
 */
const Toasters = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={10}
      containerStyle={{ top: 20, right: 20 }}
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: "10px",
          background: "#1f2937",
          color: "#fff",
          fontSize: "14px",
          maxWidth: "420px",
        },
        success: {
          iconTheme: {
            primary: "#22c55e",
            secondary: "#ffffff",
          },
          style: {
            border: "1px solid #22c55e",
          },
        },
        error: {
          duration: 6500,
          iconTheme: {
            primary: "#ef4444",
            secondary: "#ffffff",
          },
          style: {
            border: "1px solid #ef4444",
          },
        },
      }}
    />
  );
};

/**
 * Success toast helper.
 * Example: notifySuccess("Login successful.");
 */
export const notifySuccess = (message = "Action completed successfully.") => {
  toast.success(message);
};

/**
 * Error toast helper with guidance.
 * Example: notifyError("Login failed.", "Check your email/password and try again.");
 */
export const notifyError = (
  message = "Action failed.",
  guideline = "Please verify your input, check your connection, and try again."
) => {
  toast.error(`${message}\nWhat to do: ${guideline}`);
};

export default Toasters;
