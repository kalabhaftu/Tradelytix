import { DataProvider } from "@/context/data-provider";
import { TemplateProvider } from "@/context/template-provider";
import { TagsProvider } from "@/context/tags-provider";
import Modals from "@/components/modals";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReactElement, Suspense } from "react";
import { SidebarLayout } from "../dashboard/components/sidebar-layout";
import { MobileBottomNav } from "@/components/ui/mobile-nav";
import { QuickAddFAB } from "@/components/quick-add-fab";
import { CommandPalette } from "@/components/command-palette";
import { GlobalTradeController } from "../dashboard/components/global-trade-controller";
import { WeeklyReviewTrigger } from "@/components/weekly-review-trigger";
import { KeyboardShortcutsModal } from "@/components/ui/keyboard-shortcuts-modal";
import { getSiteUiSettings } from "@/server/site-ui-settings";

import { TourProvider } from "@/context/tour-context";
import { TourTooltip } from "@/components/tour/tour-tooltip";
import { ResumeWidget } from "@/components/tour/resume-widget";

export default async function DemoLayout({ children }: { children: ReactElement }) {
  const siteUiSettings = await getSiteUiSettings()

  return (
    <TooltipProvider>
      <DataProvider isDemoMode={true}>
        <TourProvider>
          <TagsProvider>
            <TemplateProvider initialActiveTemplate={null}>
                <div className="min-h-screen flex flex-col">
                  <Suspense fallback={<div className="flex flex-1" />}>
                    <SidebarLayout siteUiSettings={siteUiSettings}>
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
                  <TourTooltip />
                  <ResumeWidget />
                </div>
            </TemplateProvider>
          </TagsProvider>
        </TourProvider>
      </DataProvider>
    </TooltipProvider>
  );
}
