// Shared Config Validator
// Checks for required environment variables before agent startup

export function validateConfig(requiredKeys: string[]) {
  const missingKeys = requiredKeys.filter(key => !process.env[key]);
  
  if (missingKeys.length > 0) {
    const errorMsg = `[Config Error] Missing required environment variables: ${missingKeys.join(', ')}`;
    console.error(errorMsg);
    // In a real microservice, we might want to throw here to prevent startup
    // throw new Error(errorMsg); 
    return { valid: false, missingKeys };
  }
  
  return { valid: true, missingKeys: [] };
}
