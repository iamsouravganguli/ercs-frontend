"use client";

import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Upload, FileText, Trash2, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DSCSignerCard } from "@/components/ui/dsc-signer-card";
import { useDSCSigner } from "@/lib";
import { CommonsApiServices, getFileUrl } from "@/lib";
import { useTranslation } from "@/i18n";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/cn";

export function CommunicationDocUploadModal({
  communication,
  caseNumber,
  onClose,
  onSuccess,
}: {
  communication: any;
  caseNumber: string;
  onClose?: () => void;
  onSuccess?: () => void;
}) {
  const { t, lang } = useTranslation() as any;
  const dscSigner = useDSCSigner();
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"upload" | "list">("upload");
  const [docs, setDocs] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cid = communication?.communication_id || communication?.id;

  const loadDocs = async () => {
    if (!cid) return;
    setLoadingDocs(true);
    try {
      const res: any = await apiClient.get(`/doc/linked/CaseCommunicationModel/${cid}/`);
      const list: any[] = res?.data?.result?.data || res?.data?.data || res?.data?.results || (Array.isArray(res?.data) ? res.data : []);
      setDocs(Array.isArray(list) ? list : []);
    } catch { setDocs([]); }
    finally { setLoadingDocs(false); }
  };

  useEffect(() => { if (tab === "list") loadDocs(); }, [tab, cid]);
  useEffect(() => { loadDocs(); }, [cid]);

  const upload = async () => {
    if (!file) { toast.error(lang === "hi" ? "फ़ाइल चुनें" : "Choose a file"); return; }
    if (file.type !== "application/pdf") { toast.error(t("case.notices.only_pdf") ?? "Only PDF"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error(t("case.notices.file_too_large") ?? "File too large"); return; }
    if (!cid) { toast.error("Communication ID missing"); return; }
    setSaving(true);
    let sig: any = null;
    let toastId: any = null;
    if (dscSigner.useDsc) {
      toastId = toast.loading(t("case.notices.signing_document") ?? "Signing...") as any;
      try { sig = await dscSigner.signDocument(file); toast.dismiss(toastId); } catch (e: any) {
        toast.dismiss(toastId);
        const m = e?.message || "";
        if (m === "TOKEN_PIN_REQUIRED") toast.error(t("case.notices.enter_token_pin") ?? "Enter PIN");
        else if (m === "NO_MATCHING_TOKEN") toast.error(t("case.notices.no_matching_token") ?? "No matching token");
        else toast.error(m || "Sign failed");
        setSaving(false); return;
      }
    }
    try {
      const fd = new FormData();
      fd.append("file", file, file.name);
      fd.append("type_of_doc", "COMMUNICATION_DOC");
      fd.append("meta", JSON.stringify({ communication_id: cid, subject: communication?.subject || "" }));
      const res: any = await apiClient.post(`/doc/linked/CaseCommunicationModel/${cid}/upload/`, fd, { headers: { "Content-Type": "multipart/form-data" } } as any);
      const doc = res?.data?.result?.data;
      if (dscSigner.useDsc && sig && doc?.id) {
        await CommonsApiServices.DscSignatureSign("DocModel", doc.id, { signature_hash: sig.signature_hash, document_hash: sig.document_hash });
        toast.success(t("case.notices.signed_saved_success") ?? "Signed and uploaded");
      } else {
        toast.success("Document uploaded");
      }
      setFile(null);
      setTab("list");
      loadDocs();
      onSuccess?.();
    } catch (e: any) {
      toast.error(e?.message || e?.response?.data?.message || "Upload failed");
    } finally { setSaving(false); }
  };

  const handleDelete = async (doc: any) => {
    if (!confirm(lang === "hi" ? "क्या इस दस्तावेज़ को हटाना चाहते हैं?" : "Delete this document?")) return;
    try {
      await CommonsApiServices.CaseDocumentDeleteService(doc.id);
      toast.success(lang === "hi" ? "दस्तावेज़ हटा दिया गया" : "Document deleted");
      loadDocs();
    } catch (e: any) { toast.error(e?.message || "Failed"); }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
      <div className="sticky top-0 z-20 flex items-center h-14 px-6 border-b bg-white dark:bg-zinc-900 shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">{lang === "hi" ? "दस्तावेज़" : "Documents"}</h1>
      </div>
      <div className="shrink-0 flex items-center gap-1 px-6 pt-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={cn("h-9 px-4 text-sm font-medium whitespace-nowrap border-b-[3px] -mb-px transition-colors", tab === "upload" ? "border-primary text-primary" : "border-transparent text-zinc-500 hover:text-zinc-700")}
        >
          {lang === "hi" ? "अपलोड" : "Upload"}
        </button>
        <button
          type="button"
          onClick={() => setTab("list")}
          className={cn("h-9 px-4 text-sm font-medium whitespace-nowrap border-b-[3px] -mb-px transition-colors", tab === "list" ? "border-primary text-primary" : "border-transparent text-zinc-500 hover:text-zinc-700")}
        >
          {lang === "hi" ? "अपलोडेड" : "Uploaded"} {docs.length > 0 && (<span className="ml-1 text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full">{docs.length}</span>)}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar">
        {tab === "upload" ? (
          <>
            <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold">{lang === "hi" ? "फ़ाइल चुनें" : "Choose File"}</div>
              <div className="p-6 space-y-3">
                {!file ? (
                  <label className="cursor-pointer border-2 border-dashed border-primary/20 rounded-xl p-10 flex flex-col items-center justify-center bg-muted/5 hover:bg-muted/10 transition-colors">
                    <Upload className="w-10 h-10 text-primary/50 mb-3" />
                    <span className="text-sm font-medium">{t("case.notices.click_to_select") ?? "Click to select a PDF file"}</span>
                    <span className="text-xs text-muted-foreground mt-1">{t("case.notices.max_size") ?? "Maximum size: 10MB"}</span>
                    <input hidden type="file" accept=".pdf,application/pdf" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; if (f.type !== "application/pdf") { toast.error(t("case.notices.only_pdf") ?? "Only PDF"); e.target.value=""; return; } if (f.size > 10*1024*1024) { toast.error(t("case.notices.file_too_large") ?? "File too large"); e.target.value=""; return; } setFile(f); e.target.value=""; }} />
                  </label>
                ) : (
                  <div className="border rounded-lg bg-muted/20 h-10 flex items-center px-3 gap-2">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <p className="text-sm font-medium truncate flex-1 min-w-0">{file.name}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">({(file.size/1024).toFixed(1)} KB)</span>
                    <button type="button" onClick={()=>setFile(null)} className="ml-1 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}
                <input ref={inputRef} hidden type="file" accept=".pdf,application/pdf" onChange={(e)=>{ const f=e.target.files?.[0]; if(!f) return; setFile(f); e.target.value=""; }} />
                {!file && (<Button type="button" variant="outline" size="sm" onClick={()=>inputRef.current?.click()} className="h-8 px-3 text-xs"><Upload className="w-3.5 h-3.5 mr-1.5" />{lang==="hi"?"फ़ाइल चुनें":"Choose file"}</Button>)}
              </div>
            </section>
            <DSCSignerCard useDsc={dscSigner.useDsc} onUseDscChange={dscSigner.setUseDsc} pin={dscSigner.pin} onPinChange={dscSigner.setPin} profileCerts={dscSigner.profileCerts} loadingCerts={dscSigner.loadingProfileCerts} title={t("case.notices.dsc_signature") ?? "Digital Signature (DSC)"} checkboxLabel={t("case.notices.sign_with_dsc") ?? "Digitally sign with DSC Token"} pinLabel={t("case.notices.token_pin") ?? "Token PIN"} pinPlaceholder={t("case.notices.enter_pin") ?? "Enter token PIN"} noCertsText={t("case.notices.no_dsc_found") ?? "No registered DSC certificate found in user profile."} certsHeaderTitle={t("case.notices.profile_certs_details") ?? "Profile Certificate Details"} />
          </>
        ) : (
          <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold flex items-center justify-between">
              <span>{lang === "hi" ? "अपलोडेड डॉक्यूमेंट्स" : "Uploaded Documents"}</span>
              <Button type="button" variant="ghost" size="sm" onClick={loadDocs} disabled={loadingDocs} className="h-7 text-xs">{loadingDocs ? "..." : (lang === "hi" ? "रिफ्रेश" : "Refresh")}</Button>
            </div>
            <div className="p-0">
              {loadingDocs ? (
                <div className="p-6 text-xs text-muted-foreground text-center">{lang === "hi" ? "लोड हो रहा है..." : "Loading..."}</div>
              ) : docs.length === 0 ? (
                <div className="p-10 text-center space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">{lang === "hi" ? "अभी कोई दस्तावेज़ अपलोड नहीं हुआ" : "No documents uploaded yet"}</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {docs.map((doc: any) => {
                    const url = getFileUrl(doc.file_url);
                    return (
                      <div key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate" title={doc.file_name}>{doc.file_name || `Doc #${doc.id}`}</p>
                          <p className="text-xs text-muted-foreground">{doc.file_size_mb ? `${doc.file_size_mb} MB` : ""} {doc.created_at ? `• ${new Date(doc.created_at).toLocaleDateString(lang==="hi"?"hi-IN":"en-IN")}` : ""}</p>
                        </div>
                        {url && (
                          <a href={url} target="_blank" rel="noopener noreferrer" className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground" title={lang==="hi"?"देखें":"View"}>
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                        {url && (
                          <a href={url} target="_blank" rel="noopener noreferrer" download className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground" title={lang==="hi"?"डाउनलोड":"Download"}>
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        <button type="button" onClick={()=> handleDelete(doc)} className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title={lang==="hi"?"हटाएं":"Delete"}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      <div className="flex items-center justify-end border-t bg-white dark:bg-zinc-900 px-6 py-3 z-10 shrink-0 gap-2">
        {tab === "upload" ? (
          <>
            <Button type="button" variant="outline" onClick={onClose} className="px-5">{t("case.notices.cancel") ?? "Cancel"}</Button>
            <Button type="button" onClick={upload} disabled={saving || !file} className="px-6 font-semibold">{saving ? (lang==="hi"?"अपलोड हो रहा है...":"Uploading...") : (lang==="hi"?"अपलोड करें":"Upload")}</Button>
          </>
        ) : (
          <Button type="button" variant="outline" onClick={onClose} className="px-5">{lang === "hi" ? "बंद करें" : "Close"}</Button>
        )}
      </div>
    </div>
  );
}
