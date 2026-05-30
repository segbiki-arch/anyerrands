import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { InstallPrompt } from "@/components/install-prompt";

// Pages
import Home from "@/pages/home";
import ErrandsPage from "@/pages/errands/index";
import NewErrandPage from "@/pages/errands/new";
import NewLiftPage from "@/pages/lifts/new";
import MyErrandsPage from "@/pages/my-errands";
import ErrandDetailPage from "@/pages/errands/[id]";
import HelpersPage from "@/pages/helpers/index";
import NewHelperPage from "@/pages/helpers/new";
import HelperProfilePage from "@/pages/helpers/[id]";
import MapPage from "@/pages/map";
import ProfilePage from "@/pages/profile";
import AdminReportsPage from "@/pages/admin/reports";
import AdminHelpersPage from "@/pages/admin/helpers";
import TermsPage from "@/pages/terms";
import NotFound from "@/pages/not-found";
import { useIsAdmin } from "@/hooks/use-is-admin";

function AdminRoute() {
  const { isAdmin, isLoading } = useIsAdmin();
  if (isLoading) return null;
  if (!isAdmin) return <NotFound />;
  return <AdminReportsPage />;
}

function AdminHelpersRoute() {
  const { isAdmin, isLoading } = useIsAdmin();
  if (isLoading) return null;
  if (!isAdmin) return <NotFound />;
  return <AdminHelpersPage />;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/errands" component={ErrandsPage} />
        <Route path="/errands/new" component={NewErrandPage} />
        <Route path="/my-errands" component={MyErrandsPage} />
        <Route path="/lifts/new" component={NewLiftPage} />
        <Route path="/errands/:id" component={ErrandDetailPage} />
        <Route path="/helpers" component={HelpersPage} />
        <Route path="/helpers/new" component={NewHelperPage} />
        <Route path="/helpers/:id" component={HelperProfilePage} />
        <Route path="/map" component={MapPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/admin/reports" component={AdminRoute} />
        <Route path="/admin/helpers" component={AdminHelpersRoute} />
        <Route path="/terms" component={TermsPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <InstallPrompt />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;