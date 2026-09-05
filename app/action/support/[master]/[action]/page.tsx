"use client";
import React, { use } from "react";
import { useSearchParams } from "next/navigation";
import {
  CategoryAddForm,
  CategoryEditForm,
  CategoryViewForm,
  SubCategoryAddForm,
  SubCategoryEditForm,
  SubCategoryViewForm,
  PriorityAddForm,
  PriorityEditForm,
  PriorityViewForm,
  StatusAddForm,
  StatusEditForm,
  StatusViewForm,
  EscalationLevelAddForm,
  EscalationLevelEditForm,
  EscalationLevelViewForm,
  ResolutionTypeAddForm,
  ResolutionTypeEditForm,
  ResolutionTypeViewForm,
  SupportTypeAddForm,
  SupportTypeEditForm,
  SupportTypeViewForm,
} from "../../../../administrator/masters/support/(actions)/forms";

export default function SupportActionPage({
  params,
}: {
  params: Promise<{ master: string; action: string }>;
}) {
  const { master, action } = use(params);
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";

  const handleSuccess = () => {
    if (window.opener) {
      window.opener.postMessage("REFRESH_SUPPORT_MASTER_LIST", "*");
    }
    setTimeout(() => {
      window.close();
    }, 1000);
  };

  const handleClose = () => {
    window.close();
  };


  switch (master) {
    case "types":
      if (action === "add")
        return (
          <SupportTypeAddForm
            onSuccess={handleSuccess}
            onCancel={handleClose}
          />
        );
      if (action === "edit")
        return (
          <SupportTypeEditForm
            id={id}
            onSuccess={handleSuccess}
            onCancel={handleClose}
          />
        );
      if (action === "view")
        return <SupportTypeViewForm id={id} onClose={handleClose} />;
      break;

    case "categories":
      if (action === "add")
        return (
          <CategoryAddForm onSuccess={handleSuccess} onCancel={handleClose} />
        );
      if (action === "edit")
        return (
          <CategoryEditForm
            id={id}
            onSuccess={handleSuccess}
            onCancel={handleClose}
          />
        );
      if (action === "view")
        return <CategoryViewForm id={id} onClose={handleClose} />;
      break;

    case "sub-categories":
      if (action === "add")
        return (
          <SubCategoryAddForm
            onSuccess={handleSuccess}
            onCancel={handleClose}
          />
        );
      if (action === "edit")
        return (
          <SubCategoryEditForm
            id={id}
            onSuccess={handleSuccess}
            onCancel={handleClose}
          />
        );
      if (action === "view")
        return <SubCategoryViewForm id={id} onClose={handleClose} />;
      break;

    case "priorities":
      if (action === "add")
        return (
          <PriorityAddForm onSuccess={handleSuccess} onCancel={handleClose} />
        );
      if (action === "edit")
        return (
          <PriorityEditForm
            id={id}
            onSuccess={handleSuccess}
            onCancel={handleClose}
          />
        );
      if (action === "view")
        return <PriorityViewForm id={id} onClose={handleClose} />;
      break;

    case "statuses":
      if (action === "add")
        return (
          <StatusAddForm onSuccess={handleSuccess} onCancel={handleClose} />
        );
      if (action === "edit")
        return (
          <StatusEditForm
            id={id}
            onSuccess={handleSuccess}
            onCancel={handleClose}
          />
        );
      if (action === "view")
        return <StatusViewForm id={id} onClose={handleClose} />;
      break;

    case "escalation-levels":
      if (action === "add")
        return (
          <EscalationLevelAddForm
            onSuccess={handleSuccess}
            onCancel={handleClose}
          />
        );
      if (action === "edit")
        return (
          <EscalationLevelEditForm
            id={id}
            onSuccess={handleSuccess}
            onCancel={handleClose}
          />
        );
      if (action === "view")
        return <EscalationLevelViewForm id={id} onClose={handleClose} />;
      break;

    case "resolution-types":
      if (action === "add")
        return (
          <ResolutionTypeAddForm
            onSuccess={handleSuccess}
            onCancel={handleClose}
          />
        );
      if (action === "edit")
        return (
          <ResolutionTypeEditForm
            id={id}
            onSuccess={handleSuccess}
            onCancel={handleClose}
          />
        );
      if (action === "view")
        return <ResolutionTypeViewForm id={id} onClose={handleClose} />;
      break;
  }

  return (
    <div className="p-6 text-sm text-destructive font-medium h-screen w-full bg-background flex items-center justify-center">
      Error: Invalid action or master route configuration.
    </div>
  );
}
