import { useState, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface TableOfContentsItem {
  id: string;
  title: string;
  icon?: ReactNode;
  badge?: string;
  isActive?: boolean;
  onClick?: () => void;
}

interface TableOfContentsSection {
  title: string;
  items: TableOfContentsItem[];
}

interface TwoPanelLayoutProps {
  title: string;
  description?: string;
  tableOfContents: TableOfContentsSection[];
  children: ReactNode;
  topPanel?: ReactNode;
  rightPanelTitle?: string;
  rightPanelActions?: ReactNode;
}

export function TwoPanelLayout({
  title,
  description,
  tableOfContents,
  children,
  topPanel,
  rightPanelTitle,
  rightPanelActions,
}: TwoPanelLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Fixed Left Panel - Table of Contents */}
      <div className="w-80 border-r bg-card">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        
        <div className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-120px)]">
          {tableOfContents.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Button
                    key={item.id}
                    variant={item.isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start h-auto p-3 text-left",
                      item.isActive && "bg-secondary"
                    )}
                    onClick={item.onClick}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        {item.icon}
                        <span className="text-sm">{item.title}</span>
                      </div>
                      {item.badge && (
                        <Badge variant="outline" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
              {sectionIndex < tableOfContents.length - 1 && (
                <Separator className="my-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Optional Top Panel */}
        {topPanel && (
          <div className="border-b bg-card">
            <div className="p-4">
              {topPanel}
            </div>
          </div>
        )}

        {/* Main Content Panel */}
        <div className="flex-1 overflow-hidden">
          <Card className="h-full rounded-none border-0">
            {(rightPanelTitle || rightPanelActions) && (
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  {rightPanelTitle && (
                    <CardTitle>{rightPanelTitle}</CardTitle>
                  )}
                  {rightPanelActions && (
                    <div className="flex items-center space-x-2">
                      {rightPanelActions}
                    </div>
                  )}
                </div>
              </CardHeader>
            )}
            <CardContent className="p-6 h-full overflow-y-auto">
              {children}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}