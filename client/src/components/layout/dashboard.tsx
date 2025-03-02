import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Store as StoreType } from "@shared/schema";
import { motion } from "framer-motion";
import { 
  Package, Store, Truck, ShoppingCart, Menu, LogOut,
  ChevronRight, User
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
  const { user, logoutMutation } = useAuth();

  const { data: store } = useQuery<StoreType>({
    queryKey: [`/api/stores/${user?.storeId}`],
    enabled: !!user?.storeId,
    queryFn: async () => {
      console.log("Fetching store data for storeId:", user?.storeId);
      const res = await fetch(`/api/stores/${user?.storeId}`);
      if (!res.ok) {
        console.error("Failed to fetch store:", res.status, res.statusText);
        throw new Error('Failed to fetch store');
      }
      const data = await res.json();
      console.log("Store data received:", data);
      return data;
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const NavContent = () => (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4">
          <motion.img 
            src="/assets/LOGO.png" 
            alt="Gol Supermarket" 
            className="w-8 h-8 object-contain"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              duration: 0.5,
              ease: "easeOut",
              delay: 0.2
            }}
          />
          <motion.span 
            className="font-semibold text-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              duration: 0.5,
              ease: "easeOut",
              delay: 0.4
            }}
          >
            Gol Supermarket
          </motion.span>
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
        <Sidebar>
          <div className="absolute right-0 translate-x-full top-2">
            <SidebarTrigger />
          </div>
          <NavContent />
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-background border-b py-3">
            <div className="max-w-screen-xl mx-auto px-4">
              <div className="flex flex-wrap justify-center items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Logado como</div>
                  <div className="font-semibold">{user?.username}</div>
                </div>
                {store && (
                  <>
                    <div className="mx-2 text-muted-foreground">•</div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Loja</div>
                      <div className="font-semibold">{store.name}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <main className="flex-1 overflow-y-auto bg-muted/10 p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}