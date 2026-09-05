"use client";

import { TicketCreateWorkflow } from "@/workflows/support/common/ticket-create-workflow";

export default function FileSupportTicketPopupPage() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <TicketCreateWorkflow />
    </div>
  );
}
