import { DSCBridgeSDK, type Device, type Certificate } from "@/lib/dsc-sdk";

let _instance: DSCBridgeSDK | null = null;


export function getDSC(): DSCBridgeSDK {
  if (typeof window === "undefined") {
    throw new Error("DSCBridgeSDK is only available in the browser.");
  }
  if (!_instance) {
    _instance = new DSCBridgeSDK();
  }
  return _instance;
}


export function resetDSC(): void {
  _instance = null;
}


export function newDSC(): DSCBridgeSDK {
  return new DSCBridgeSDK();
}


export async function getDeviceList(): Promise<Device[]> {
  return getDSC().getDevices();
}


export async function getCertificateList(
  deviceId: number,
): Promise<Certificate[]> {
  return getDSC().getCertificates(deviceId);
}
