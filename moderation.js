// moderation.js — Otaku Overload Safety Engine & Neko-Guard Bot
import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. Self-Harm & Crisis Phrase Patterns
const CRISIS_PHRASES = [
  /kill my\s*self/i,
  /want to die/i,
  /end my life/i,
  /cut my\s*wrists/i,
  /suicide/i,
  /hate living/i,
  /nobody would care if i died/i
];

// 2. Toxic Phrase Combinations & Targeted Negativity
const TOXIC_PHRASE_PATTERNS = [
  /\bgo\s+die\b/i,
  /\bnobody\s+likes\s+you\b/i,
  /\bhope\s+you\s+(get\s+hurt|die|fail)\b/i,
  /\byou\s+should\s+(end|kill)\s+yourself\b/i,
  /\bdelete\s+your\s+life\b/i,
  /\bu\s+are\s+useless\b/i
];

// 3. Severe Harassment & Scam Link Blocklist
const SEVERE_BLOCKLIST = [
  'nigger', 'nigga', 'faggot', 'kike', 'spic', 'chink', 'retard',
  'free-robux', 'discord.gg/scam', 'bit.ly/phish', 'grabify.link'
];

// 4. Mild Profanity Auto-Masking (Replaced with Asterisks)
const CENSOR_MAP = {
  'fuck': 'f***',
  'shit': 's***',
  'bitch': 'b****',
  'asshole': 'a**hole',
  'cunt': 'c***'
};

/**
 * Main Evaluation Engine
 * @param {string} text 
 * @returns {Object} { status: 'allow'|'censor'|'block'|'crisis', cleanText: string, reason: string }
 */
export function evaluateMessageSafety(text) {
  if (!text) return { status: 'allow', cleanText: '', reason: '' };

  const trimmed = text.trim();

  // Check 1: Self-Harm / Crisis Words
  for (const pattern of CRISIS_PHRASES) {
    if (pattern.test(trimmed)) {
      return {
        status: 'crisis',
        cleanText: trimmed,
        reason: 'self_harm_detected'
      };
    }
  }

  // Check 2: Severe Toxic Combinations or Severe Slurs
  const lower = trimmed.toLowerCase();
  const hasSevereWord = SEVERE_BLOCKLIST.some(word => lower.includes(word));
  const hasToxicCombo = TOXIC_PHRASE_PATTERNS.some(pattern => pattern.test(trimmed));

  if (hasSevereWord || hasToxicCombo) {
    return {
      status: 'block',
      cleanText: '',
      reason: 'severe_toxicity_or_slur'
    };
  }

  // Check 3: Mild Profanity Masking
  let cleanText = trimmed;
  let maskedWordCount = 0;

  Object.keys(CENSOR_MAP).forEach(badWord => {
    const regex = new RegExp(`\\b${badWord}\\b`, 'gi');
    if (regex.test(cleanText)) {
      maskedWordCount++;
      cleanText = cleanText.replace(regex, CENSOR_MAP[badWord]);
    }
  });

  if (maskedWordCount > 0) {
    return {
      status: 'censor',
      cleanText: cleanText,
      reason: 'profanity_masked'
    };
  }

  return {
    status: 'allow',
    cleanText: cleanText,
    reason: 'safe'
  };
}

/**
 * Triggers Neko-Guard 🐾 Bot to Post an In-Chat Friendly Reminder
 * @param {string} roomName - 'chat_messages' or 'basement_chat_messages'
 * @param {string} userName - Target member display name
 * @param {string} warningType - 'vibe_check' | 'crisis_support' | 'masked_notice'
 */
export async function sendNekoGuardNotice(roomName, userName, warningType) {
  let botMessage = "";

  if (warningType === 'crisis_support') {
    botMessage = `🌸 @${userName}, we care about you! If you are going through a hard time, please reach out to someone who can help. You can text or call 988 anytime for free, confidential support. You belong here! 💜`;
  } else if (warningType === 'vibe_check') {
    botMessage = `🐾 @${userName}, let's keep the vibes cozy and friendly in the lounge! Please avoid negative or aggressive messages. 🌸`;
  } else if (warningType === 'masked_notice') {
    botMessage = `🐾 @${userName}, a quick reminder to keep language clean for everyone in Twilight Mode! ✨`;
  }

  try {
    await addDoc(collection(db, roomName), {
      authorUid: "neko_guard_bot",
      authorName: "Neko-Guard 🐾",
      authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=NekoGuardBot",
      authorFrame: "gold_aura",
      authorGlow: "pink_glow",
      text: botMessage,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error("Failed to trigger Neko-Guard notice:", err);
  }
}

/**
 * Report System for Manual Admin Review
 */
export async function reportMessageToAdmin({ messageId, roomName, reportedUid, reportedText, reason }) {
  if (!window.currentUser) {
    alert("You must be signed in to submit a message report.");
    return false;
  }

  try {
    await addDoc(collection(db, "reports"), {
      reporterUid: window.currentUser.uid,
      reporterEmail: window.currentUser.email || "Anonymous",
      reportedMessageId: messageId || "N/A",
      roomName: roomName || "chat_messages",
      reportedUid: reportedUid || "Unknown",
      reportedText: reportedText || "",
      reason: reason || "inappropriate",
      status: "pending",
      timestamp: serverTimestamp()
    });

    alert("Message reported. Neko-Guard moderators will review it shortly!");
    return true;
  } catch (err) {
    console.error("Failed to submit report:", err);
    return false;
  }
}
