import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth } from "../config";

const googleProvider = new GoogleAuthProvider();

// Sign up new user
export const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential; // Return full credential for flexible usage
  } catch (error) {
    throw error;
  }
};

// Log in existing user
export const logIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential; // Return full credential as expected by Login.jsx
  } catch (error) {
    throw error;
  }
};

// Sign out
export const logOut = async () => {
  try {
    localStorage.removeItem("roleVerified");
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

// Auth State Observer
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Google Sign In
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error) {
    throw error;
  }
};

// Password Reset
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw error;
  }
};
