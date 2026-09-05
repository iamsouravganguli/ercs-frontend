"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DSCBridgeSDK,
  DocSignPayload,
  Certificate,
  Device,
} from "./dsc-sdk";
import { CommonsApiServices } from "./services";

export interface UseDSCSignerOptions {
  autoFetchCerts?: boolean;
}

export function useDSCSigner(
  options: UseDSCSignerOptions = { autoFetchCerts: true },
) {
  const [useDsc, setUseDsc] = useState(false);
  const [pin, setPin] = useState("");


  const [profileCerts, setProfileCerts] = useState<any[]>([]);
  const [loadingProfileCerts, setLoadingProfileCerts] = useState(false);

  const [bridgeActive, setBridgeActive] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null);
  const [selectedCert, setSelectedCert] = useState<number | null>(null);


  const loadProfileCerts = useCallback(async () => {
    setLoadingProfileCerts(true);
    try {
      const res = await CommonsApiServices.ProfileDSCList();
      const certsList = res?.result?.data || [];
      setProfileCerts(certsList);
      if (certsList.length > 0) {
        setUseDsc(true);
      }
    } catch (e) {
      console.error("Failed to load profile certificates", e);
    } finally {
      setLoadingProfileCerts(false);
    }
  }, []);

  useEffect(() => {
    if (options.autoFetchCerts) {

      loadProfileCerts();
    }
  }, [options.autoFetchCerts, loadProfileCerts]);


  useEffect(() => {
    if (!useDsc) return;

    const sdk = new DSCBridgeSDK();
    let cancelled = false;
    sdk
      .health()
      .then((h) => {
        if (cancelled) return;
        if (h.running) {
          setBridgeActive(true);
          sdk
            .getDevices()
            .then((devs) => {
              if (cancelled) return;
              setDevices(devs);
              if (devs && devs.length > 0 && devs[0]) {
                setSelectedDevice(devs[0].device_id);
              }
            })
            .catch((err) => {
              if (!cancelled) console.error("No DSC devices found:", err);
            });
        } else {
          setBridgeActive(false);
        }
      })
      .catch(() => {
        if (!cancelled) setBridgeActive(false);
      });
    return () => {
      cancelled = true;
      sdk.dispose();
    };
  }, [useDsc]);


  useEffect(() => {
    if (selectedDevice !== null && useDsc) {
      const sdk = new DSCBridgeSDK();
      let cancelled = false;
      sdk
        .getCertificates(selectedDevice)
        .then((c) => {
          if (cancelled) return;
          setCerts(c);
          if (c && c.length > 0 && c[0]) {
            setSelectedCert(c[0].cert_id);
          }
        })
        .catch((err) => {
          if (!cancelled) console.error("Failed to fetch certs:", err);
        });
      return () => {
        cancelled = true;
        sdk.dispose();
      };
    }
  }, [selectedDevice, useDsc]);


  const signDocument = useCallback(
    async (file: File | Blob | string): Promise<DocSignPayload | null> => {
      if (!useDsc) return null;
      if (!pin || pin.trim() === "") {
        throw new Error("TOKEN_PIN_REQUIRED");
      }

      const dscSDK = new DSCBridgeSDK();
      try {
        let finalDevice = selectedDevice;
        let finalCertId = selectedCert;


        if (profileCerts.length > 0) {
          try {
            const connectedDevices = await dscSDK.getDevices();
            let matched = false;
            const cleanSerial = (s: string) =>
              s.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

            for (const dev of connectedDevices) {
              const deviceCerts = await dscSDK.getCertificates(dev.device_id);
              for (const cert of deviceCerts) {
                const isMatch = profileCerts.some(
                  (pc) => cleanSerial(pc.serial) === cleanSerial(cert.serial),
                );
                if (isMatch) {
                  finalDevice = dev.device_id;
                  finalCertId = cert.cert_id;
                  matched = true;
                  break;
                }
              }
              if (matched) break;
            }
          } catch (err) {
            console.error("Auto selection search failed:", err);
          }
        }

        if (finalDevice === null || finalCertId === null) {
          throw new Error("NO_MATCHING_TOKEN");
        }

        await dscSDK.selectDevice(finalDevice);
        await dscSDK.selectCertificate(finalCertId);
        return await dscSDK.signForDjango(file, pin);
      } finally {
        dscSDK.dispose();
      }
    },
    [useDsc, pin, selectedDevice, selectedCert, profileCerts],
  );

  return {
    useDsc,
    setUseDsc,
    pin,
    setPin,
    profileCerts,
    loadingProfileCerts,
    bridgeActive,
    devices,
    certs,
    selectedDevice,
    setSelectedDevice,
    selectedCert,
    setSelectedCert,
    signDocument,
    reloadProfileCerts: loadProfileCerts,
  };
}
