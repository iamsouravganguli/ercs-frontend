"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "./card";
import { Badge } from "./badge";
import { Calendar, MapPin } from "lucide-react";

export type CaseData = {
  id: string;
  caseNo: string;
  title: string;
  petitioner: string;
  respondent: string;
  type: string;
  status: string;
  filedOn: string;
  nextHearing?: string;
  tehsil: string;
  district: string;
};

const statusColor: Record<string, string> = {
  filed: "bg-blue-100 text-blue-700",
  hearing: "bg-yellow-100 text-yellow-700",
  closed: "bg-green-100 text-green-700",
};

export const CaseCard = ({
  data,
  onClick,
}: {
  data: CaseData;
  onClick?: () => void;
}) => {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-1"
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-sm font-semibold">{data.caseNo}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{data.title}</p>
        </div>

        <Badge className={statusColor[data.status] || ""}>{data.status}</Badge>
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        <div>
          <span className="font-medium">Petitioner:</span> {data.petitioner}
        </div>
        <div>
          <span className="font-medium">Respondent:</span> {data.respondent}
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {data.tehsil}, {data.district}
        </div>

        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Filed: {data.filedOn}
          </div>

          {data.nextHearing && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Next: {data.nextHearing}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
