import { doc, getDoc, updateDoc, increment, Timestamp } from "firebase/firestore";
import { db } from "./firebaseConfig";

export async function checkAndGrantDailyBonus(userId) {
  if (!userId) return { bonusGranted: false };

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return { bonusGranted: false };

  const userData = userSnap.data();
  const now = new Date();
  
  const lastGranted = userData.last_daily_bonus_at 
    ? userData.last_daily_bonus_at.toDate() 
    : null;

  // Check if today is a new calendar day in UTC
  const isNewDay = !lastGranted || 
    lastGranted.getUTCFullYear() !== now.getUTCFullYear() ||
    lastGranted.getUTCMonth() !== now.getUTCMonth() ||
    lastGranted.getUTCDate() !== now.getUTCDate();

  if (isNewDay) {
    // 100 Orbs for VIPs, 50 Orbs for standard members
    const bonusAmount = userData.isVIP ? 100 : 50;

    await updateDoc(userRef, {
      orb_balance: increment(bonusAmount),
      last_daily_bonus_at: Timestamp.fromDate(now)
    });

    return { 
      bonusGranted: true, 
      amount: bonusAmount, 
      newTotal: (userData.orb_balance || 0) + bonusAmount 
    };
  }

  return { bonusGranted: false };
}
