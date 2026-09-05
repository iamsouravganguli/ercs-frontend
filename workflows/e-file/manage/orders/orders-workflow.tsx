"use client";
import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { Plus, Pencil, Trash2, Eye, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CustomModal,
  CustomModalBody,
} from "@/components/ui/custom-modal";
import {
  useProfileDetail,
  useCaseOrderList,
  useCaseOrderDelete,
  useCaseOrderUpdate,
  useOrderTypeList,
  canModifyManageTab,
  isCitizenAdvocate as isCitizenAdvocateRole,
} from "@/lib";
import { useTranslation } from "@/i18n";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, ColumnDef } from "@/components/ui/data-grid";
import { OrderForm } from "@/workflows/e-file/common/orders/order-form";
import toast from "react-hot-toast";

export default function ManageOrdersWorkflow() {
  const { caseId } = useParams<{ caseId: string }>();
  const case_number = caseId as string;
  const { t, lang } = useTranslation() as any;
  const { data: profileData } = useProfileDetail();
  const role =
    (profileData as any)?.role ||
    (profileData as any)?.user?.role ||
    (profileData as any)?.data?.role ||
    "";
  const roleUpper = String(role || "").toUpperCase();
  const isCitizenAdvocate = isCitizenAdvocateRole(role);
  const canAdd = canModifyManageTab(role);
  const [open, setOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);

  const { data: ordersRes, isLoading, refetch } = useCaseOrderList(case_number);
  const orderList: any[] = ordersRes?.result?.data || [];
  const { data: orderTypesRes } = useOrderTypeList();
  const orderTypes: any[] = orderTypesRes?.result?.data || [];
  const deleteMutation = useCaseOrderDelete();
  const updateMutation = useCaseOrderUpdate();

  const getOrderTypeName = (code: string) => {
    const found = orderTypes.find((x: any) => x.code === code);
    return found
      ? lang === "hi"
        ? found.name || found.name_en
        : found.name_en || found.name
      : code || "—";
  };

  const getOrderStatusVariant = (
    code?: string,
  ): "success" | "error" | "warning" | "info" | "neutral" => {
    switch (code) {
      case "ORDER_PUBLISHED":
      case "ORDER_SIGNED":
        return "success";
      case "ORDER_ISSUED":
        return "info";
      case "ORDER_DRAFT":
        return "warning";
      case "ORDER_REJECTED":
        return "error";
      default:
        return "neutral";
    }
  };

  const openAdd = () => {
    setEditingOrder(null);
    setOpen(true);
  };
  const openEdit = (item: any) => {
    setEditingOrder(item);
    setOpen(true);
  };
  const handleDelete = async (id: any) => {
    if (
      !confirm(
        lang === "hi"
          ? "क्या आप निश्चित रूप से इस आदेश को हटाना चाहते हैं?"
          : "Are you sure you want to delete this order?",
      )
    )
      return;
    try {
      await deleteMutation.mutateAsync({ caseNumber: case_number, pk: id });
      toast.success(lang === "hi" ? "आदेश हटाया गया।" : "Order deleted.");
      refetch();
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    }
  };

  const handleSign = async (item: any) => {
    try {
      let signedId: number | null = 45;
      try {
        const res: any = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || ""}/master/status/?type=ORDER`,
        ).then((r) => r.json());
        const found = res?.result?.data?.find(
          (s: any) => s.code === "ORDER_SIGNED",
        );
        if (found?.id) signedId = found.id;
      } catch {}
      await updateMutation.mutateAsync({
        caseNumber: case_number,
        pk: item.id,
        payload: { status: signedId } as any,
      });
      toast.success(
        lang === "hi"
          ? "आदेश हस्ताक्षरित किया गया।"
          : "Order signed successfully.",
      );
      refetch();
    } catch (e: any) {
      toast.error(e?.message || "Failed to sign");
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => (
          <span className="text-xs font-medium text-foreground">
            {row.original.order_no || `ORD-${row.original.id}`}
          </span>
        ),
      },
      {
        accessorKey: "title",
        header: "Order Title",
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-foreground line-clamp-1">
            {row.original.title || "—"}
          </span>
        ),
      },
      {
        accessorKey: "order_type",
        header: "Order Type",
        cell: ({ row }) => (
          <span className="text-xs font-medium text-foreground">
            {getOrderTypeName(row.original.order_type)}
          </span>
        ),
      },
      {
        accessorKey: "order_date",
        header: "Order Date",
        cell: ({ row }) => (
          <span className="text-xs font-medium text-foreground">
            {row.original.order_date
              ? new Date(row.original.order_date).toLocaleDateString(
                  lang === "hi" ? "hi-IN" : "en-IN",
                  { day: "2-digit", month: "short", year: "numeric" },
                )
              : "—"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const item = row.original;
          const statusDetail = item.status_detail;
          if (statusDetail) {
            return (
              <StatusBadge variant={getOrderStatusVariant(statusDetail.code)}>
                {lang === "hi"
                  ? statusDetail.name || statusDetail.name_en
                  : statusDetail.name_en || statusDetail.name}
              </StatusBadge>
            );
          }
          return <StatusBadge variant="warning">Draft</StatusBadge>;
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const item = row.original;
          const statusCode =
            item.status_detail?.code ||
            (item.status ? String(item.status) : "ORDER_DRAFT");
          const isDraft = statusCode === "ORDER_DRAFT";
          const isIssued = statusCode === "ORDER_ISSUED";
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-muted"
                onClick={() => openEdit(item)}
                title="View Order"
              >
                <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </Button>
              {canAdd && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-muted"
                  onClick={() => openEdit(item)}
                  title="Edit Order"
                >
                  <Pencil className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </Button>
              )}
              {canAdd && isDraft && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(item.id)}
                  title="Delete Order"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              {canAdd && isIssued && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-muted-foreground hover:text-emerald-600"
                  onClick={() => handleSign(item)}
                  title="Sign Order"
                >
                  <PenTool className="w-4 h-4" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [lang, orderTypes, canAdd],
  );

  return (
    <>
      <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
          <h2 className="text-[13px] font-semibold">Orders</h2>
          {canAdd && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={openAdd}
              className="h-7 px-3 text-xs font-medium bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add
            </Button>
          )}
        </div>
        <DataTable
          columns={columns}
          data={orderList}
          isError={false}
          emptyTitle="No orders yet"
          emptyMessage="Orders will appear here once passed."
          onRefetch={refetch}
          defaultPageSize={10}
        />
      </section>

      <CustomModal
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setEditingOrder(null);
        }}
        className="w-full max-w-[900px] h-[90vh] max-sm:max-w-none max-sm:w-screen max-sm:h-screen max-sm:max-h-none max-sm:rounded-none max-sm:border-0 p-0 overflow-hidden"
      >
        <CustomModalBody className="p-0 h-full overflow-hidden max-sm:rounded-none">
          <OrderForm
            order={editingOrder}
            onClose={() => {
              setOpen(false);
              setEditingOrder(null);
            }}
            onSuccess={() => {
              refetch();
              setOpen(false);
              setEditingOrder(null);
            }}
          />
        </CustomModalBody>
      </CustomModal>
    </>
  );
}
