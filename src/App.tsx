import { AppRoutes } from "./routes/AppRoutes";
import { SeoSync } from "./components/public/SeoSync";

function App() {
  return (
    <>
      <SeoSync />
      <AppRoutes />
    </>
  );
}

export default App;
