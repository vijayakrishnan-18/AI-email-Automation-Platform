import { promises as dns } from 'dns';

/**
 * Validates if an email address has a domain with valid MX records setup.
 * This helps prevent sending emails to non-existent domains which causes bounces.
 *
 * @param email The email address to validate
 * @returns true if the domain has MX records, false otherwise
 */
export async function validateEmailDomain(email: string): Promise<boolean> {
  if (!email || !email.includes('@')) {
    return false;
  }

  const domain = email.split('@')[1];
  
  // Basic domain format check
  if (!domain || !domain.includes('.')) {
    return false;
  }

  try {
    const mxRecords = await dns.resolveMx(domain);
    return mxRecords && mxRecords.length > 0;
  } catch (error: any) {
    // ENOTFOUND or ENODATA usually means the domain definitively doesn't exist or has no MX records
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      return false;
    }
    // If it's a different DNS error (e.g. ECONNREFUSED, timeout), we MUST let it pass
    // to avoid blocking legitimate emails due to local DNS/network issues.
    // In this user's environment, even valid domains like gmail.com are throwing ECONNREFUSED.
    console.warn(`DNS lookup failed for domain ${domain} with error:`, error.message);
    return true;
  }
}
