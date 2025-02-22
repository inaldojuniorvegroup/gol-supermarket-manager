import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import Dashboard from "@/components/layout/dashboard";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import ProductsPage from "@/pages/products-page";
import OrdersPage from "@/pages/orders-page";
import StoresPage from "@/pages/stores-page";
import DistributorsPage from "@/pages/distributors-page";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/products" component={() => (
        <Dashboard>
          <ProductsPage />
        </Dashboard>
      )} />
      <ProtectedRoute path="/orders" component={() => (
        <Dashboard>
          <OrdersPage />
        </Dashboard>
      )} />
      <ProtectedRoute path="/stores" component={() => (
        <Dashboard>
          <StoresPage />
        </Dashboard>
      )} />
      <ProtectedRoute path="/distributors" component={() => (
        <Dashboard>
          <DistributorsPage />
        </Dashboard>
      )} />
      <ProtectedRoute path="/" component={() => (
        <Dashboard>
          <ProductsPage />
        </Dashboard>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
