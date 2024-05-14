export const validateEmail = (str: string) => {
  const validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

  return str.match(validRegex);
}

export const validateForm = (fields: any[]) => {
  const hasRequired = fields.filter((field: any) => field.name !== 'email' && field.name !== 'connectWallet').some((field:any) => field.options.required) || false;
  if (hasRequired) return false;

  const connectWalletRequiresSignature = fields.find((field: any) => field.name === 'connectWallet')?.options.requiresSignature || false;
  if (connectWalletRequiresSignature) return false;
  
  return true;
}