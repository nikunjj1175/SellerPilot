"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;
export const TabsList = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List
    className={cn(
      "flex gap-1 overflow-x-auto pb-1 scrollbar-thin",
      className
    )}
    {...props}
  />
);
export const TabsTrigger = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) => (
  <TabsPrimitive.Trigger
    className={cn(
      "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
      "text-muted-foreground hover:text-foreground hover:bg-muted/60",
      "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md",
      className
    )}
    {...props}
  />
);
export const TabsContent = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content className={cn("mt-6 focus:outline-none", className)} {...props} />
);
