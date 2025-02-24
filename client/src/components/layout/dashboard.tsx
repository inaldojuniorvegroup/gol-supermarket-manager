import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Package, Store, Truck, ShoppingCart, Menu, LogOut,
  ChevronRight
} from "lucide-react";

const navigation = [
  { name: "Products", href: "/products", icon: Package },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Stores", href: "/stores", icon: Store },
  { name: "Distributors", href: "/distributors", icon: Truck },
];

export default function Dashboard({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
    setOpen(false);
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-6 py-4">
        <img 
          src="https://placehold.co/32x32/png" 
          alt="Gol Market" 
          className="w-8 h-8"
        />
        <span className="font-semibold text-lg">Gol Market</span>
      </div>
      <ScrollArea className="flex-1">
        <nav className="space-y-1 px-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={() => setOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md
                  ${isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted"
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                {item.name}
                {isActive && <ChevronRight className="ml-auto h-5 w-5" />}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="p-4">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r">
        <NavContent />
      </div>

      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            className="lg:hidden p-2 m-4"
            aria-label="Open navigation menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SheetHeader className="px-6 py-4">
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>Access all sections of the application</SheetDescription>
          </SheetHeader>
          <NavContent />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-muted/10 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}