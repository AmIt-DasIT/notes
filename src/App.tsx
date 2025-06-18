import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Notebook } from "./components/notebook";
import { ModeToggle } from "./components/mode-toggle";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen">
        <Notebook />
      </div>
      <ModeToggle />
    </QueryClientProvider>
  );
}

export default App;
