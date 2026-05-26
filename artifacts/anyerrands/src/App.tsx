import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";

// Pages
import Home from "@/pages/home";
import ErrandsPage from "@/pages/errands/index";
import NewErrandPage from "@/pages/errands/new";
import ErrandDetailPage from "@/pages/errands/[id]";
import HelpersPage from "@/pages/helpers/index";
import NewHelperPage from "@/pages/helpers/new";
import HelperProfilePage from "@/pages/helpers/[id]";
import MapPage from "@/pages/map";
import ProfilePage from "@/pages/profile";
import AdminReportsPage from "@/pages/admin/reports";
import NotFound from "@/pages/not-found";

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
        <Route path="/errands/:id" component={ErrandDetailPage} />
        <Route path="/helpers" component={HelpersPage} />
        <Route path="/helpers/new" component={NewHelperPage} />
        <Route path="/helpers/:id" component={HelperProfilePage} />
        <Route path="/map" component={MapPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/admin/reports" component={AdminReportsPage} />
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
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;