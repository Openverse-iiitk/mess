'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { LoginDialog } from '@/components/auth/LoginDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, LogOut, Menu, User } from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

interface NavbarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function Navbar({ activeTab, onTabChange }: NavbarProps = {}) {
  const { user, isManager, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Openverse" width={32} height={32} className="rounded-sm" />
          <span className="text-lg font-semibold tracking-tight">MessApp</span>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Notifications (Manager only) */}
          {isManager && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between p-2">
                  <span className="text-sm font-medium">Notifications</span>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" className="h-auto py-1 text-xs" onClick={markAllAsRead}>
                      Mark all read
                    </Button>
                  )}
                </div>
                <DropdownMenuSeparator />
                <ScrollArea className="max-h-64">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                        onClick={() => markAsRead(n.id)}
                      >
                        <div className="flex items-center gap-2">
                          {!n.read && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                          <span className="text-sm font-medium">{n.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{n.body}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(n.timestamp, { addSuffix: true })}
                        </span>
                      </DropdownMenuItem>
                    ))
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Auth */}
          {isManager ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">Mess Manager</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setLoginOpen(true)}>
              Manager Login
            </Button>
          )}

          {/* Mobile menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <div className="mt-4 flex flex-col gap-2">
                <Button
                  variant={activeTab === 'expenses' ? 'secondary' : 'ghost'}
                  className="justify-start"
                  onClick={() => {
                    onTabChange?.('expenses');
                    setMobileMenuOpen(false);
                  }}
                >
                  Expenses
                </Button>
                <Button
                  variant={activeTab === 'complaints' ? 'secondary' : 'ghost'}
                  className="justify-start"
                  onClick={() => {
                    onTabChange?.('complaints');
                    setMobileMenuOpen(false);
                  }}
                >
                  Complaints
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </header>
  );
}
