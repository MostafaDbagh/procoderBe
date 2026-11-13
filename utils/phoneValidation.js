/** Convert common localized digits without discarding invalid characters. */
function normalizePhoneInput(input) {
 if (typeof input !== "string") return "";
 return input.normalize("NFKC").trim()
  .replace(/[٠-٩۰-۹०-९০-৯]/g, c => {
   const code = c.charCodeAt(0);
   const zero = [0x660, 0x6f0, 0x966, 0x9e6].find(start => code >= start && code <= start + 9);
   return String(code - zero);
  });
}

/** Format validation, not country-specific number assignment verification.
 * Accept 7–15 digits, local leading zeros, +/00 country codes and common separators.
 */
function isValidPublicPhone(input) {
 const value = normalizePhoneInput(input);
 if (!/^[+\d\s().-]+$/.test(value)) return false;
 const compact = value.replace(/[\s().-]/g, "");
 if (compact.startsWith("+")) return /^\+[1-9]\d{6,14}$/.test(compact);
 if (compact.startsWith("00")) return /^00[1-9]\d{6,14}$/.test(compact);
 return /^(?!0+$)\d{7,15}$/.test(compact);
}


module.exports = { normalizePhoneInput, isValidPublicPhone };
