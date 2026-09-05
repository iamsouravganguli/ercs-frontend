"use client";

import { useState } from "react";
import { Badge } from "./badge";
import { Card, CardContent } from "./card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "./tabs";


export interface TabContentCtx {
  tabId: string;
  activeTabId: string;
  setActiveTab: (id: string) => void;
}

export interface SearchTab {

  id: string;

  label: string;

  icon: React.ElementType;

  count?: number;

  disabled?: boolean;

  renderContent?: (ctx: TabContentCtx) => React.ReactNode;

  filters?: React.ReactNode;

  table?: React.ReactNode;
}

export interface TabbedSearchProps {
  tabs: SearchTab[];

  defaultTab?: string;

  activeTab?: string;

  onTabChange?: (id: string) => void;
}


export function TabbedSearch({
  tabs,
  defaultTab,
  activeTab: controlledTab,
  onTabChange,
}: TabbedSearchProps) {
  const [internalTab, setInternalTab] = useState(
    defaultTab ?? tabs[0]?.id ?? "",
  );

  const isControlled = controlledTab !== undefined;
  const active = isControlled ? controlledTab : internalTab;

  const handleChange = (id: string) => {
    if (!isControlled) setInternalTab(id);
    onTabChange?.(id);
  };

  return (
    <Tabs value={active} onValueChange={handleChange}>
      {}
      <div className="flex flex-col gap-4 md:flex-row md:items-start w-full">
        {}
        <TabsList
          className="
            flex flex-row h-auto w-full overflow-x-auto
            bg-muted p-1 rounded-lg gap-0.5
            md:flex-col md:w-44 md:shrink-0 md:overflow-x-visible
          "
        >
          {tabs.map(({ id, label, icon: Icon, count, disabled }) => (
            <TabsTrigger
              key={id}
              value={id}
              disabled={disabled}
              className="
                shrink-0 gap-1.5 px-3 py-2 text-sm
                md:w-full md:justify-start md:gap-2
              "
            >
              <Icon className="size-4 shrink-0" />
              <span className="hidden sm:inline md:inline">{label}</span>
              {}
              <span className="sm:hidden">{label}</span>
              {count !== undefined && (
                <Badge
                  variant="secondary"
                  className="ml-auto h-4 px-1 text-[10px] leading-none"
                >
                  {count}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {}
        <Card className="flex-1 min-w-0">
          <CardContent className="pt-5">
            {tabs.map((tab) => {
              const ctx: TabContentCtx = {
                tabId: tab.id,
                activeTabId: active,
                setActiveTab: handleChange,
              };
              return (
                <TabsContent
                  key={tab.id}
                  value={tab.id}
                  className="mt-0 space-y-3"
                >
                  {tab.renderContent ? (
                    tab.renderContent(ctx)
                  ) : (
                    <>
                      {tab.filters}
                      {tab.table}
                    </>
                  )}
                </TabsContent>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </Tabs>
  );
}
