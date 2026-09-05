

export interface Device {
  device_id: number;
  label: string;
  manufacturer: string;
  model: string;
}

export interface Certificate {
  cert_id: number;
  subject: string;
  issuer: string;
  serial: string;
  valid_from: string;
  valid_to: string;
  certificate: string;
}

export interface HealthResult {
  running: boolean;
  lib: string | null;
  message: string;
}

export interface SignResult {
  signature_hash: string;
  document_hash: string;
  algorithm: string;
}


export interface DocSignPayload {
  signature_hash: string;
  document_hash: string;
  algorithm: string;
  signed_at: string;
  certificate: string;
  serial: string;
}

export interface VerifyResult {
  valid: boolean;
  verified: boolean;
  message: string;
}

export type DSCErrorCode =
  | "BRIDGE_NOT_FOUND"
  | "NO_DEVICES"
  | "DEVICE_NOT_FOUND"
  | "MULTIPLE_DEVICES"
  | "NO_DEVICE"
  | "NO_CERTS"
  | "CERT_NOT_FOUND"
  | "MULTIPLE_CERTS"
  | "NO_CERT"
  | "MISSING_PIN"
  | "MISSING_CERT"
  | "SIGN_FAILED"
  | "VERIFY_FAILED"
  | "DSC_ERROR";


declare global {
  interface Window {
    DSCBridge?: {
      health(): Promise<string | null>;
      getDevices(): Promise<Device[]>;
      getCertificates(deviceId: number): Promise<Certificate[]>;
      sign(
        deviceId: number,
        certId: number,
        pin: string,
        data: string,
      ): Promise<SignResult>;
      verify(
        certificate: string,
        data: string,
        signatureHash: string,
      ): Promise<VerifyResult>;
      blobToBase64(blob: Blob | File): Promise<string>;
    };
  }
}


export class DSCError extends Error {
  public readonly code: DSCErrorCode;

  constructor(message: string, code: DSCErrorCode = "DSC_ERROR") {
    super(message);
    this.name = "DSCError";
    this.code = code;
  }
}


export class DSCBridgeSDK {
  private _device: number | null = null;
  private _cert: Certificate | null = null;
  private _pollTimer: ReturnType<typeof setInterval> | null = null;
  private _pollTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this._waitForBridge();
  }


  private _waitForBridge(): void {

    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
    if (this._pollTimeout) {
      clearTimeout(this._pollTimeout);
      this._pollTimeout = null;
    }
    this._pollTimer = setInterval(() => {
      if (window.DSCBridge) {
        if (this._pollTimer) {
          clearInterval(this._pollTimer);
          this._pollTimer = null;
        }
        if (this._pollTimeout) {
          clearTimeout(this._pollTimeout);
          this._pollTimeout = null;
        }
      }
    }, 100);
    this._pollTimeout = setTimeout(() => {
      if (this._pollTimer) {
        clearInterval(this._pollTimer);
        this._pollTimer = null;
      }
      this._pollTimeout = null;
    }, 10_000);
  }


  dispose(): void {
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
    if (this._pollTimeout) {
      clearTimeout(this._pollTimeout);
      this._pollTimeout = null;
    }
  }

  private _assertReady(): void {
    if (!window.DSCBridge) {
      throw new DSCError(
        "DSC Bridge extension is not installed or not running. " +
          "Please install the DSC Bridge Chrome extension.",
        "BRIDGE_NOT_FOUND",
      );
    }
  }

  private _assertDevice(): void {

    if (this._device === null) {
      throw new DSCError(
        "No device selected. Call selectDevice() first.",
        "NO_DEVICE",
      );
    }
  }

  private _assertCert(): void {
    if (!this._cert) {
      throw new DSCError(
        "No certificate selected. Call selectCertificate() first.",
        "NO_CERT",
      );
    }
  }


  async health(): Promise<HealthResult> {
    this._assertReady();
    try {
      const data = await window.DSCBridge!.health();
      return { running: true, lib: data, message: "Bridge is running" };
    } catch (e) {
      return {
        running: false,
        lib: null,
        message: e instanceof Error ? e.message : "Bridge not reachable",
      };
    }
  }


  async getDevices(): Promise<Device[]> {
    this._assertReady();
    const devices = await window.DSCBridge!.getDevices();
    if (!devices || devices.length === 0) {
      throw new DSCError(
        "No DSC devices found. Plug in your USB token and try again.",
        "NO_DEVICES",
      );
    }
    return devices;
  }


  async selectDevice(deviceId?: number): Promise<Device> {
    const devices = await this.getDevices();

    if (deviceId === undefined) {
      if (devices.length === 1) {
        const only = devices[0] as Device;
        this._device = only.device_id;
        return only;
      }
      throw new DSCError(
        `Multiple devices found. Pass a device_id: ${devices.map((d) => d.device_id).join(", ")}`,
        "MULTIPLE_DEVICES",
      );
    }

    const device = devices.find((d) => d.device_id === deviceId);
    if (device === undefined) {
      throw new DSCError(`Device ${deviceId} not found.`, "DEVICE_NOT_FOUND");
    }

    this._device = device.device_id;
    return device;
  }


  async getCertificates(deviceId?: number): Promise<Certificate[]> {
    this._assertReady();


    if (deviceId === undefined && this._device === null) {
      this._assertDevice();
    }
    const id = (deviceId ?? this._device) as number;


    return await window.DSCBridge!.getCertificates(id);
  }


  async selectCertificate(
    certId?: number,
    deviceId?: number,
  ): Promise<Certificate> {
    const certs = await this.getCertificates(deviceId);

    if (!certs || certs.length === 0) {
      throw new DSCError("No certificates found on this device.", "NO_CERTS");
    }

    if (certId === undefined) {
      if (certs.length === 1) {
        const only = certs[0] as Certificate;
        this._cert = only;
        return only;
      }
      throw new DSCError(
        `Multiple certificates found. Pass a cert_id: ${certs.map((c) => c.cert_id).join(", ")}`,
        "MULTIPLE_CERTS",
      );
    }

    const cert = certs.find((c) => c.cert_id === certId);
    if (cert === undefined) {
      throw new DSCError(`Certificate ${certId} not found.`, "CERT_NOT_FOUND");
    }

    this._cert = cert;
    return cert;
  }


  async sign(file: File | Blob | string, pin: string): Promise<SignResult> {
    this._assertReady();
    this._assertDevice();
    this._assertCert();

    if (!pin || pin.trim() === "") {
      throw new DSCError("PIN is required.", "MISSING_PIN");
    }

    const data =
      typeof file === "string"
        ? file
        : await window.DSCBridge!.blobToBase64(file);

    return await window.DSCBridge!.sign(
      this._device!,
      this._cert!.cert_id,
      pin,
      data,
    );
  }


  async signForDjango(
    file: File | Blob | string,
    pin: string,
  ): Promise<DocSignPayload> {
    this._assertCert();
    const result = await this.sign(file, pin);
    return {
      signature_hash: result.signature_hash,
      document_hash: result.document_hash,
      algorithm: result.algorithm,
      signed_at: new Date().toISOString(),
      certificate: this._cert!.certificate,
      serial: this._cert!.serial,
    };
  }


  async verify(
    file: File | Blob | string,
    signatureHash: string,
    certificate?: string,
  ): Promise<VerifyResult> {
    this._assertReady();

    const cert = certificate ?? this._cert?.certificate;
    if (!cert) {
      throw new DSCError(
        "Certificate required for verification. Pass it or select a certificate first.",
        "MISSING_CERT",
      );
    }

    const data =
      typeof file === "string"
        ? file
        : await window.DSCBridge!.blobToBase64(file);

    return await window.DSCBridge!.verify(cert, data, signatureHash);
  }


  async autoSign(
    file: File | Blob | string,
    pin: string,
  ): Promise<DocSignPayload> {
    await this.selectDevice();
    await this.selectCertificate();
    return await this.signForDjango(file, pin);
  }


  async toBase64(blob: File | Blob): Promise<string> {
    this._assertReady();
    return await window.DSCBridge!.blobToBase64(blob);
  }


  reset(): void {
    this._device = null;
    this._cert = null;
  }


  destroy(): void {
    this.dispose();
    this.reset();
  }


  get selectedDevice(): number | null {
    return this._device;
  }


  get selectedCertificate(): Certificate | null {
    return this._cert;
  }
}
