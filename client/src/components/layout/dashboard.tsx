import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Package, Store, Truck, ShoppingCart, Menu, LogOut,
  ChevronRight
} from "lucide-react";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarTrigger,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar";

const navigation = [
  { name: "Products", href: "/products", icon: Package },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Stores", href: "/stores", icon: Store },
  { name: "Distributors", href: "/distributors", icon: Truck },
];

export default function Dashboard({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const NavContent = () => (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4">
          <img 
            src="https://placehold.co/32x32/png" 
            alt="Gol Market" 
            className="w-8 h-8"
          />
          <span className="font-semibold text-lg">Gol Market</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <SidebarMenuItem key={item.name}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={item.name}
                    className="w-full"
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                    {isActive && <ChevronRight className="ml-auto h-5 w-5" />}
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </SidebarFooter>
    </>
  );

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen">
        {/* Move SidebarTrigger outside of Sidebar */}
        <SidebarTrigger className="fixed top-4 left-4 z-50" />

        <Sidebar>
          <NavContent />
        </Sidebar>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-muted/10 p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}