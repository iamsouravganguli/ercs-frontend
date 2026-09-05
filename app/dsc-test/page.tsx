"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import { DSCBridgeSDK } from '@/lib/dsc-sdk';
import { useDSCSigner, isDev, formatDate } from '@/lib/query';
import { CommonsApiServices } from '@/lib/services';
import { Button } from "@/components/ui/button";
import { DSCSignerCard } from "@/components/ui/dsc-signer-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Copy,
  ShieldCheck,
  KeyRound,
  Cpu,
  Lock,
} from "lucide-react";

export default function DSCTestPage() {

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [enteredPassword, setEnteredPassword] = useState<string>("");
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("dsc_test_auth");
      if (stored === "true") {
        setIsAuthenticated(true);
      }
      setAuthChecked(true);
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPassword.trim() === "dsc@123") {
      setIsAuthenticated(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("dsc_test_auth", "true");
      }
      toast.success("Access Granted! Welcome to DSC Testing Suite.");
    } else {
      toast.error("Invalid password. Access denied.");
      setEnteredPassword("");
    }
  };

  const dscSigner = useDSCSigner({ autoFetchCerts: true });

  const [health, setHealth] = useState<{
    running: boolean;
    message: string;
    lib: string | null;
  } | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const [testFile, setTestFile] = useState<File | null>(null);
  const [signingResult, setSigningResult] = useState<any | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  const [verifyResult, setVerifyResult] = useState<{
    valid?: boolean;
    message?: string;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const checkBridgeHealth = async () => {
    setCheckingHealth(true);
    try {
      const sdk = new DSCBridgeSDK();
      const res = await sdk.health();
      setHealth(res);
      if (res.running) {
        toast.success("DSC Bridge is active & running!");
      } else {
        toast.error("DSC Bridge service is unreachable.");
      }
    } catch (e: any) {
      setHealth({
        running: false,
        message: e?.message || "Failed to check health",
        lib: null,
      });
      toast.error("DSC Bridge extension not detected.");
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      checkBridgeHealth();
    }
  }, [isAuthenticated]);

  const handleTestFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setTestFile(files[0]);
    setSigningResult(null);
    setVerifyResult(null);
  };

  const handleExecuteSign = async () => {
    if (!dscSigner.useDsc) {
      toast.error("Please enable DSC Signing checkbox first.");
      return;
    }
    if (!dscSigner.pin) {
      toast.error("Please enter your Token PIN.");
      return;
    }
    if (!testFile) {
      toast.error("Please upload or select a test file first.");
      return;
    }

    setIsSigning(true);
    setSigningResult(null);
    setVerifyResult(null);

    try {
      const result = await dscSigner.signDocument(testFile);
      setSigningResult(result);
      toast.success("Document digitally signed successfully!");
    } catch (err: any) {
      console.error("Test Signing Error:", err);
      const msg = err?.message || "Signing failed";
      toast.error(`Signing Error: ${msg}`);
    } finally {
      setIsSigning(false);
    }
  };

  const handleExecuteVerify = async () => {
    if (!signingResult || !testFile) {
      toast.error("Please sign a file first before verifying.");
      return;
    }

    setIsVerifying(true);
    try {
      const sdk = new DSCBridgeSDK();
      const res = await sdk.verify(
        testFile,
        signingResult.signature_hash,
        signingResult.certificate,
      );
      setVerifyResult(res);
      if (res.valid) {
        toast.success("Signature Verification Passed! Document is valid.");
      } else {
        toast.error(`Verification Failed: ${res.message}`);
      }
    } catch (err: any) {
      console.error("Test Verification Error:", err);
      toast.error(err?.message || "Verification process failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard!`);
  };

  if (!authChecked) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 max-w-md w-full space-y-6 text-center shadow-2xl">
          <div className="w-14 h-14 bg-primary/10 border border-primary/20 text-primary rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Protected Route: DSC Test Suite
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Enter password to access the Digital Signature diagnostic &
              testing playground.
            </p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="dsc_pwd"
                className="text-xs font-semibold text-neutral-300"
              >
                Route Password
              </label>
              <input
                id="dsc_pwd"
                type="password"
                value={enteredPassword}
                onChange={(e) => setEnteredPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full h-10 rounded-xl border border-neutral-800 bg-neutral-900 px-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              className="w-full h-10 rounded-xl font-semibold"
            >
              Unlock Page
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 md:p-10 space-y-8">
      {}
      <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-700 dark:text-amber-400">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-500" />
          <span className="text-sm font-semibold">
            DEVELOPMENT MODE ONLY — DSC Diagnostic & Testing Suite
          </span>
        </div>
        <StatusBadge variant="warning">DEV ONLY</StatusBadge>
      </div>

      {}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Digital Signature (DSC) Testing Playground
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Test Chrome Extension Bridge connection, USB Token detection,
            Profile Certificates, and Document Signing / Verification.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={checkBridgeHealth}
          disabled={checkingHealth}
          className="rounded-xl flex items-center gap-2"
        >
          <RefreshCw
            className={`w-4 h-4 ${checkingHealth ? "animate-spin" : ""}`}
          />
          Re-check Extension Health
        </Button>
      </div>

      {}
      <div className="grid md:grid-cols-3 gap-6">
        {}
        <div className="bg-card border rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Cpu className="w-4 h-4 text-primary" />
            Bridge Extension Status
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Extension Status:
              </span>
              <StatusBadge variant={health?.running ? "success" : "error"}>
                {health?.running
                  ? "Running & Connected"
                  : "Not Detected / Offline"}
              </StatusBadge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Library Version:</span>
              <span className="font-mono text-foreground">
                {health?.lib || "N/A"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
              Message:{" "}
              <span className="font-medium text-foreground">
                {health?.message || "Checking..."}
              </span>
            </div>
          </div>
        </div>

        {}
        <div className="bg-card border rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <KeyRound className="w-4 h-4 text-primary" />
            USB Token Hardware
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tokens Connected:</span>
              <span className="font-bold text-foreground">
                {dscSigner.devices.length}
              </span>
            </div>
            {dscSigner.devices.length > 0 ? (
              dscSigner.devices.map((dev) => (
                <div
                  key={dev.device_id}
                  className="p-2 rounded bg-muted/30 border space-y-0.5"
                >
                  <div className="font-semibold text-foreground">
                    Device #{dev.device_id}:{" "}
                    {dev.label || dev.model || "USB Token"}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Mfg: {dev.manufacturer || "Generic"} | Model:{" "}
                    {dev.model || "N/A"}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-xs italic">
                No USB tokens detected on machine.
              </p>
            )}
          </div>
        </div>

        {}
        <div className="bg-card border rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between text-sm font-semibold text-foreground">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Bound Profile Certs
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dscSigner.reloadProfileCerts()}
              className="h-7 text-xs px-2"
            >
              Refresh
            </Button>
          </div>
          <div className="space-y-2 text-xs">
            {dscSigner.loadingProfileCerts ? (
              <p className="text-muted-foreground animate-pulse">
                Loading profile certificates...
              </p>
            ) : dscSigner.profileCerts.length > 0 ? (
              dscSigner.profileCerts.map((pc) => (
                <div
                  key={pc.id || pc.serial}
                  className="p-2 rounded bg-muted/30 border space-y-0.5"
                >
                  <div className="font-semibold text-foreground">
                    Code: {pc.code || pc.subject || "User Cert"}
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground truncate">
                    Serial: {pc.serial}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-xs italic">
                No certificates registered in user profile.
              </p>
            )}
          </div>
        </div>
      </div>

      {}
      <div className="grid md:grid-cols-2 gap-8">
        {}
        <div className="space-y-6">
          <div className="border-b pb-2">
            <h2 className="text-lg font-bold text-foreground">
              1. Reusable DSCSignerCard Component
            </h2>
            <p className="text-xs text-muted-foreground">
              Live preview of the shared DSCSignerCard UI primitive used in
              forms.
            </p>
          </div>

          <DSCSignerCard
            useDsc={dscSigner.useDsc}
            onUseDscChange={dscSigner.setUseDsc}
            pin={dscSigner.pin}
            onPinChange={dscSigner.setPin}
            profileCerts={dscSigner.profileCerts}
            loadingCerts={dscSigner.loadingProfileCerts}
            title="Digital Signature (DSC) - Test Form Component"
          />

          {}
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <Label className="text-xs font-semibold text-foreground">
              Select Test Document (PDF)
            </Label>
            {!testFile ? (
              <label className="cursor-pointer border-2 border-dashed border-primary/20 rounded-xl p-8 flex flex-col items-center justify-center bg-muted/5 hover:bg-muted/10 transition-colors">
                <UploadCloud className="w-10 h-10 text-primary/50 mb-2" />
                <span className="text-sm font-medium text-foreground">
                  Click to upload test file
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  Select any PDF file to test signing
                </span>
                <input
                  hidden
                  type="file"
                  accept=".pdf,application/pdf,text/plain"
                  onChange={(e) => handleTestFileUpload(e.target.files)}
                />
              </label>
            ) : (
              <div className="border rounded-lg bg-muted/20 h-12 flex items-center px-4 gap-3">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {testFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(testFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTestFile(null)}
                  className="text-xs text-destructive hover:text-destructive"
                >
                  Remove
                </Button>
              </div>
            )}

            <Button
              onClick={handleExecuteSign}
              disabled={isSigning || !testFile || !dscSigner.useDsc}
              className="w-full rounded-xl"
            >
              {isSigning
                ? "Digitally Signing Document..."
                : "Execute Test DSC Sign"}
            </Button>
          </div>
        </div>

        {}
        <div className="space-y-6">
          <div className="border-b pb-2">
            <h2 className="text-lg font-bold text-foreground">
              2. Signature Output & Verification
            </h2>
            <p className="text-xs text-muted-foreground">
              Inspecting calculated `signature_hash`, `document_hash`, and
              testing verification.
            </p>
          </div>

          {signingResult ? (
            <div className="bg-card border rounded-xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Digital Signature Generated
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      JSON.stringify(signingResult, null, 2),
                      "Full JSON Payload",
                    )
                  }
                  className="h-8 text-xs rounded-lg flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Payload JSON
                </Button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="font-semibold">
                      Signature Hash (`signature_hash`):
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          signingResult.signature_hash,
                          "Signature Hash",
                        )
                      }
                      className="text-primary hover:underline"
                    >
                      Copy Hash
                    </button>
                  </div>
                  <div className="p-2.5 bg-muted/40 rounded border font-mono text-[11px] break-all select-all text-foreground">
                    {signingResult.signature_hash}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="font-semibold">
                      Document SHA-256 Hash (`document_hash`):
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          signingResult.document_hash,
                          "Document Hash",
                        )
                      }
                      className="text-primary hover:underline"
                    >
                      Copy Hash
                    </button>
                  </div>
                  <div className="p-2.5 bg-muted/40 rounded border font-mono text-[11px] break-all select-all text-foreground">
                    {signingResult.document_hash}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t text-[11px]">
                  <div>
                    <span className="text-muted-foreground block">
                      Algorithm:
                    </span>
                    <span className="font-semibold text-foreground">
                      {signingResult.algorithm || "SHA256withRSA"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">
                      Cert Serial:
                    </span>
                    <span className="font-mono font-semibold text-foreground">
                      {signingResult.serial || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {}
              <div className="pt-4 border-t space-y-3">
                <Button
                  variant="outline"
                  onClick={handleExecuteVerify}
                  disabled={isVerifying}
                  className="w-full rounded-xl border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                >
                  {isVerifying
                    ? "Verifying Signature..."
                    : "Run Verify Signature Test"}
                </Button>

                {verifyResult && (
                  <div
                    className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                      verifyResult.valid
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                        : "bg-destructive/10 text-destructive border-destructive/30"
                    }`}
                  >
                    {verifyResult.valid ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>
                      {verifyResult.valid
                        ? "Verification Result: VALID SIGNATURE"
                        : `Verification Result: ${verifyResult.message}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-card border rounded-xl p-12 text-center text-muted-foreground space-y-2">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground/40" />
              <p className="text-sm font-medium">No Signature Generated Yet</p>
              <p className="text-xs">
                Upload a test file and click &ldquo;Execute Test DSC Sign&rdquo; to test
                signature generation and inspect output hashes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
