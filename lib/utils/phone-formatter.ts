/**
 * Formats phone numbers for Argentina, specifically for Salta province (387 area code)
 * Converts various input formats to +5493875350665 format for WhatsApp compatibility
 */
export function formatArgentinaPhone(input: string): string {
  // Remove all non-numeric characters
  const cleaned = input.replace(/\D/g, "")

  // Handle empty input
  if (!cleaned) return ""

  // Handle international format already (starts with 549)
  if (cleaned.startsWith("549")) {
    return `+${cleaned}`
  }

  // Handle full international format (starts with 54)
  if (cleaned.startsWith("54") && cleaned.length >= 12) {
    // If it's 54387... add the 9
    if (cleaned.startsWith("54387")) {
      return `+549${cleaned.slice(2)}`
    }
    return `+${cleaned}`
  }

  // Handle local Salta format: 0387 155350665 or similar
  if (cleaned.startsWith("0387")) {
    let number = cleaned.slice(4) // Remove 0387

    // Remove mobile prefixes (155, 154, 156, etc.)
    if (number.startsWith("15")) {
      number = number.slice(2)
    }

    return `+549387${number}`
  }

  // Handle format without leading 0: 387 155350665
  if (cleaned.startsWith("387") && cleaned.length >= 10) {
    let number = cleaned.slice(3) // Remove 387

    // Remove mobile prefixes (155, 154, 156, etc.)
    if (number.startsWith("15")) {
      number = number.slice(2)
    }

    return `+549387${number}`
  }

  // Handle direct mobile format: 155350665 (assume Salta)
  if (cleaned.startsWith("15") && cleaned.length >= 9) {
    const number = cleaned.slice(2) // Remove 15 prefix
    return `+549387${number}`
  }

  // Handle direct number without prefix (assume Salta): 5350665
  if (cleaned.length >= 7 && cleaned.length <= 8) {
    return `+549387${cleaned}`
  }

  // Handle other Argentina area codes (keep as is but add +549)
  if (cleaned.length >= 10) {
    return `+549${cleaned}`
  }

  // For international numbers, keep as entered if they start with +
  if (input.startsWith("+")) {
    return input
  }

  // Default: assume it's a Salta number
  return `+549387${cleaned}`
}

/**
 * Validates if a phone number is properly formatted for WhatsApp
 */
export function isValidWhatsAppPhone(phone: string): boolean {
  // Must start with + and have at least 10 digits
  const phoneRegex = /^\+\d{10,15}$/
  return phoneRegex.test(phone)
}

/**
 * Formats phone number for display (user-friendly format)
 */
export function formatPhoneForDisplay(phone: string): string {
  if (phone.startsWith("+549387")) {
    const number = phone.slice(7) // Remove +549387
    return `+54 9 387 ${number.slice(0, 3)} ${number.slice(3)}`
  }

  if (phone.startsWith("+549")) {
    const areaAndNumber = phone.slice(4) // Remove +549
    if (areaAndNumber.length >= 7) {
      const area = areaAndNumber.slice(0, 3)
      const number = areaAndNumber.slice(3)
      return `+54 9 ${area} ${number.slice(0, 3)} ${number.slice(3)}`
    }
  }

  return phone
}
