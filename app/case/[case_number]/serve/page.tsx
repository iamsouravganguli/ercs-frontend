"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Send, Bell, FileText, CheckCircle2 } from "lucide-react";
import { useSessionCheck, useNoticeDeliveryModeList } from '@/lib/query';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

type UserRole =
  | "CO"
  | "SA"
  | "CO"
  | "RI"
  | "RSI"
  | "AD"
  | "CT"
  | "CT"
  | "AD"
  | "SA"
  | "PO"
  | "CO"
  | "CC";

type ServiceStatus = "Pending" | "Served";

type ServiceMode = "By Hand" | "Post" | "Email" | "WhatsApp" | "Affixation";

type ServiceItem = {
  id: string;
  case_number: string;
  recipient: string;
  address: string;
  mode: ServiceMode;
  remarks: string;
  proof_name?: string;
  proof?: File;
  status: ServiceStatus;
  served_at?: string;
  created_at: string;
};

export default function ServeNoticePage() {
  const { case_number } = useParams<{
    case_number: string;
  }>();

  const proofRef = useRef<HTMLInputElement>(null);

  const sessionCheck = useSessionCheck();
  const activeSessionRole =
    sessionCheck.data?.result?.data?.role?.toUpperCase() || "CO";

  const [role, setRole] = useState<UserRole>("CO");

  const [items, setItems] = useState<ServiceItem[]>([]);

  const [loading, setLoading] = useState(false);

  const [recipient, setRecipient] = useState("");

  const [address, setAddress] = useState("");

  const [mode, setMode] = useState<ServiceMode>("By Hand");

  const [remarks, setRemarks] = useState("");


  const deliveryModesQuery = useNoticeDeliveryModeList();
  const deliveryModes = deliveryModesQuery.data?.result?.data || [];

  useEffect(() => {
    if (activeSessionRole) {
      setRole(activeSessionRole as UserRole);
    }
  }, [activeSessionRole]);

  const canServe =
    role === "CO" || role === "SA" || role === "RI" || role === "RSI";

  const isCTorAD = role === "CT" || role === "AD";

  useEffect(() => {
    loadItems();
  }, [case_number]);

  async function getBucket(): Promise<any> {

    if (!navigator.storageBuckets) {
      alert("Storage Buckets API not supported.");
      return null;
    }


    return await navigator.storageBuckets.open("case-serve-notices");
  }

  async function openDB(bucket: any): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = bucket.indexedDB.open("rccms", 1);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains("serve_notices")) {
          db.createObjectStore("serve_notices", { keyPath: "id" });
        }
      };

      request.onsuccess = () => resolve(request.result);

      request.onerror = () => reject(request.error);
    });
  }

  function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);

      request.onerror = () => reject(request.error);
    });
  }

  function waitTx(tx: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();

      tx.onerror = () => reject(tx.error);

      tx.onabort = () => reject(tx.error);
    });
  }

  async function loadItems() {
    try {
      setLoading(true);

      const bucket = await getBucket();

      if (!bucket) return;

      const db = await openDB(bucket);

      const tx = db.transaction("serve_notices", "readonly");

      const all = await requestToPromise<ServiceItem[]>(
        tx.objectStore("serve_notices").getAll(),
      );

      setItems(all.filter((item) => item.case_number === case_number));
    } finally {
      setLoading(false);
    }
  }

  async function createService() {
    if (!recipient.trim()) {
      alert("Enter recipient");
      return;
    }

    const proof = proofRef.current?.files?.[0];

    const bucket = await getBucket();

    if (!bucket) return;

    const db = await openDB(bucket);

    const tx = db.transaction("serve_notices", "readwrite");

    tx.objectStore("serve_notices").put({
      id: crypto.randomUUID(),
      case_number,
      recipient,
      address,
      mode,
      remarks,
      proof_name: proof?.name,
      proof,
      status: "Pending",
      created_at: new Date().toISOString(),
    });

    await waitTx(tx);

    setRecipient("");
    setAddress("");
    setMode("By Hand");
    setRemarks("");

    if (proofRef.current) {
      proofRef.current.value = "";
    }

    await loadItems();
  }

  async function markServed(id: string) {
    const bucket = await getBucket();

    if (!bucket) return;

    const db = await openDB(bucket);

    const readTx = db.transaction("serve_notices", "readonly");

    const row = await requestToPromise<ServiceItem>(
      readTx.objectStore("serve_notices").get(id),
    );

    if (!row) return;

    const tx = db.transaction("serve_notices", "readwrite");

    tx.objectStore("serve_notices").put({
      ...row,
      status: "Served",
      served_at: new Date().toISOString(),
    });

    await waitTx(tx);
    await loadItems();
  }

  function downloadProof(item: ServiceItem) {
    if (!item.proof) return;

    const url = URL.createObjectURL(item.proof);

    const a = document.createElement("a");

    a.href = url;
    a.download = item.proof_name || "proof-file";

    a.click();

    URL.revokeObjectURL(url);
  }

  const pending = items.filter((x) => x.status === "Pending").length;

  const served = items.filter((x) => x.status === "Served").length;

  return (
    <div className="w-full px-4 md:px-6 py-4 space-y-4">
      {}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-5 md:p-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Serve Notice</p>

            <p className="text-lg font-semibold">{case_number}</p>
          </div>

          {!isCTorAD && (
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="h-9 rounded-xl border px-3 text-sm"
            >
              <option>PESHKAR</option>
              <option>SA</option>
              <option>CLERK</option>
              <option>RI</option>
              <option>RSI</option>
            </select>
          )}
        </CardContent>
      </Card>

      {}
      {canServe && !isCTorAD && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Service Entry</CardTitle>

            <CardDescription className="text-xs">
              Record notice delivery with proof
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Recipient Name"
                className="h-10 rounded-xl border px-3 text-sm"
              />

              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as ServiceMode)}
                className="h-10 rounded-xl border px-3 text-sm"
              >
                {deliveryModes.length > 0 ? (
                  deliveryModes.map((d: any) => (
                    <option key={d.code} value={d.name_en || d.name}>
                      {d.name_en || d.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option>By Hand</option>
                    <option>Post</option>
                    <option>Email</option>
                    <option>WhatsApp</option>
                    <option>Affixation</option>
                  </>
                )}
              </select>
            </div>

            <textarea
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Address"
              className="w-full rounded-xl border px-3 py-2 text-sm resize-none"
            />

            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Remarks"
              className="w-full rounded-xl border px-3 py-2 text-sm resize-none"
            />

            <input
              ref={proofRef}
              type="file"
              className="w-full text-sm border rounded-xl px-3 py-2"
            />

            <div className="flex justify-end">
              <Button onClick={createService} className="rounded-xl px-5">
                <Send className="w-4 h-4 mr-1" />
                Save Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {}
      {!isCTorAD && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-semibold">{items.length}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="font-semibold">{pending}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Served</p>
              <p className="font-semibold">{served}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {}
      <Card className="rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="px-5 py-4 border-b">
          <CardTitle className="text-base font-semibold">
            Service List ({items.length})
          </CardTitle>

          <CardDescription className="text-xs">
            Proof upload enabled
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground italic">
              Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center space-y-4 bg-background border border-dashed rounded-2xl m-6">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <Bell className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                No records found.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-border text-left">
              <thead className="bg-muted/30 text-xs font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="px-6 py-3">Recipient & Address</th>
                  <th className="px-6 py-3">Delivery Mode</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date Served</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-muted/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground">
                          {item.recipient}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[300px] truncate">
                          {item.address}
                        </p>
                        {item.remarks && (
                          <p className="text-[10px] text-muted-foreground mt-1 italic">
                            Remarks: {item.remarks}
                          </p>
                        )}
                        {item.proof_name && (
                          <p className="text-[10px] text-primary mt-1 flex items-center gap-1 font-medium">
                            📎 {item.proof_name}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-foreground/80">
                      {item.mode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          item.status === "Served"
                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/10"
                            : "bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/10"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-muted-foreground">
                      {item.served_at
                        ? new Date(item.served_at).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {item.proof && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg px-3 flex items-center gap-1.5"
                            onClick={() => downloadProof(item)}
                          >
                            <FileText className="w-4 h-4" /> Download Proof
                          </Button>
                        )}
                        {canServe && item.status === "Pending" && (
                          <Button
                            size="sm"
                            className="h-8 rounded-lg px-3 flex items-center gap-1"
                            onClick={() => markServed(item.id)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Served
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
