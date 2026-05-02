import { DataProvider } from "@/context/data-provider";
import { TemplateProvider } from "@/context/template-provider";
import { TagsProvider } from "@/context/tags-provider";
import Modals from "@/components/modals";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReactElement, Suspense } from "react";
import { SidebarLayout } from "./components/sidebar-layout";
import { MobileBottomNav } from "@/components/ui/mobile-nav";
import { QuickAddFAB } from "@/components/quick-add-fab";
import { CommandPalette } from "@/components/command-palette";
import { GlobalTradeController } from "./components/global-trade-controller";
import { WeeklyReviewTrigger } from "@/components/weekly-review-trigger";
import { KeyboardShortcutsModal } from "@/components/ui/keyboard-shortcuts-modal";
import { getInitBootstrapData } from "@/server/init-bootstrap";

export default async function RootLayout({ children }: { children: ReactElement }) {
  const initialBootstrapData = await getInitBootstrapData()

  return (
    <TooltipProvider>
      <DataProvider initialBootstrapData={initialBootstrapData}>
        <TagsProvider>
          <TemplateProvider initialActiveTemplate={initialBootstrapData.activeTemplateShell}>
              <div className="min-h-screen flex flex-col">
                <Suspense fallback={<div className="flex flex-1" />}>
                  <SidebarLayout>
                    {children}
                  </SidebarLayout>
                </Suspense>
                <Modals />
                <MobileBottomNav />
                <QuickAddFAB />
                <CommandPalette />
                <KeyboardShortcutsModal />
                <Suspense fallback={null}>
                  <GlobalTradeController />
                </Suspense>
                <WeeklyReviewTrigger />
              </div>
          </TemplateProvider>
        </TagsProvider>
      </DataProvider>
    </TooltipProvider>
  );
}
