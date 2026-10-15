import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB9XuAAm61mvhdW7FruoXf4BUGXAJw67Eo",
  authDomain: "sitaram-5ca97.firebaseapp.com",
  projectId: "sitaram-5ca97",
  storageBucket: "sitaram-5ca97.firebasestorage.app",
  messagingSenderId: "295779810717",
  appId: "1:295779810717:web:b150ea615148235b37c374",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = "en";

let confirmationResult = null;

function toE164(phoneNumber) {
  const digits = String(phoneNumber || "").replace(/\D/g, "");
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  if (!/^[6-9]\d{9}$/.test(local)) {
    throw new Error("Enter a valid 10-digit Indian mobile number");
  }
  return `+91${local}`;
}

function clearRecaptcha() {
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (error) {
      console.error(error);
    }
    window.recaptchaVerifier = null;
  }
}

// grecaptcha keeps the old element marked as rendered. Invisible
// RecaptchaVerifier.clear() does not unregister it, so reuse throws
// "reCAPTCHA has already been rendered in this element".
function freshRecaptchaContainer() {
  const existing = document.getElementById("firebase-recaptcha");
  const next = document.createElement("div");
  next.id = "firebase-recaptcha";
  if (existing?.parentNode) {
    existing.parentNode.replaceChild(next, existing);
  } else {
    document.body.appendChild(next);
  }
  return next;
}

export function firebaseAuthError(error) {
  const code = error?.code || "";
  if (code === "auth/billing-not-enabled") {
    return "Firebase SMS needs the Blaze billing plan. Upgrade the Sitaram Firebase project, then try again.";
  }
  if (code === "auth/invalid-phone-number") {
    return "Enter a valid 10-digit Indian mobile number";
  }
  if (code === "auth/too-many-requests") {
    return "Too many OTP attempts. Wait a few minutes and try again.";
  }
  if (code === "auth/invalid-verification-code" || code === "auth/code-expired") {
    return "Invalid or expired OTP";
  }
  if (code === "auth/invalid-app-credential" || code === "auth/captcha-check-failed" || code === "auth/missing-client-identifier") {
    return "OTP check failed. Refresh the page and try again.";
  }
  return error?.message || "Failed to send OTP";
}

export async function getFirebaseRecaptchaToken() {
  clearRecaptcha();
  const container = freshRecaptchaContainer();
  const verifier = new RecaptchaVerifier(auth, container, {
    size: "invisible",
  });
  window.recaptchaVerifier = verifier;
  return verifier.verify();
}

export async function sendFirebaseOtp(phoneNumber) {
  clearRecaptcha();
  const container = freshRecaptchaContainer();
  const verifier = new RecaptchaVerifier(auth, container, {
    size: "invisible",
  });
  window.recaptchaVerifier = verifier;
  await verifier.render();
  confirmationResult = await signInWithPhoneNumber(
    auth,
    toE164(phoneNumber),
    verifier
  );
  return confirmationResult;
}

export async function confirmFirebaseOtp(code) {
  if (!confirmationResult) {
    throw new Error("Request OTP again");
  }
  const credential = await confirmationResult.confirm(String(code || "").trim());
  return credential.user.getIdToken();
}
