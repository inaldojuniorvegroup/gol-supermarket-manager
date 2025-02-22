import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutGrid,
  ShoppingCart,
  Store,
  Truck,
  LogOut,
  Menu,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();
  const [open, setOpen] = useState(false);

  const menuItems = [
    { path: "/", label: "Products", icon: LayoutGrid },
    { path: "/orders", label: "Orders", icon: ShoppingCart },
    { path: "/stores", label: "Stores", icon: Store },
    { path: "/distributors", label: "Distributors", icon: Truck },
  ];

  const SidebarContent = () => (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold">
            Gol Supermarket
          </h2>
        </div>
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <Button
                variant={location === item.path ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setOpen(false)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
          <Button
            variant="ghost"
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100"
            onClick={() => {
              logoutMutation.mutate();
              setOpen(false);
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="outline" size="icon" className="absolute top-4 left-4">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <ScrollArea className="h-full">
            <SidebarContent />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <aside className="hidden lg:block fixed inset-y-0 z-50 w-64 border-r">
        <ScrollArea className="h-full">
          <SidebarContent />
        </ScrollArea>
      </aside>
    </>
  );
}
