

export function base64urlToBuffer(b64url: string): Uint8Array {

  let str = b64url.replace(/-/g, "+").replace(/_/g, "/");

  while (str.length % 4) {
    str += "=";
  }
  const binaryStr = window.atob(str);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}


export function bufferToBase64url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binaryStr = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    const byte = bytes[i] ?? 0;
    binaryStr += String.fromCharCode(byte);
  }
  const base64 = window.btoa(binaryStr);

  return base64.replace(/\+/g, "-").replace(/\
}


export function coerceRegistrationOptions(
  options: any,
): PublicKeyCredentialCreationOptions {
  return {
    ...options,
    challenge: base64urlToBuffer(options.challenge),
    user: {
      ...options.user,
      id: base64urlToBuffer(options.user.id),
    },

    authenticatorSelection: {
      residentKey: "required",
      requireResidentKey: true,
      userVerification: "required",
    },
    attestation: "none",
  };
}


export function coerceAuthenticationOptions(
  options: any,
): PublicKeyCredentialRequestOptions {
  return {
    ...options,
    challenge: base64urlToBuffer(options.challenge),
    allowCredentials: options.allowCredentials?.map((cred: any) => ({
      ...cred,
      id: base64urlToBuffer(cred.id),
    })),
    userVerification: "required",
  };
}


export function serializeRegistrationResponse(credential: any) {
  const response = credential.response;
  return {
    id: credential.id,
    device_name: `${navigator.userAgent.split(" ").slice(-1)[0]} Passkey`,
    client_data_json: bufferToBase64url(response.clientDataJSON),
    attestation_object: bufferToBase64url(response.attestationObject),
  };
}


export function serializeAssertionResponse(assertion: any) {
  const response = assertion.response;
  return {
    credential_id: assertion.id,
    client_data_json: bufferToBase64url(response.clientDataJSON),
    authenticator_data: bufferToBase64url(response.authenticatorData),
    signature: bufferToBase64url(response.signature),
  };
}
