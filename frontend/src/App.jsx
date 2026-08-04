import { useEffect, useState } from "react";
import "./App.css";
import ShoppingPage from "./ShoppingPage.jsx";
import TripPage from "./TripPage.jsx";
import { getView } from "./viewRoute.js";

function App() {
  const [view, setView] = useState(() => getView(window.location.pathname));

  useEffect(() => {
    document.body.dataset.view = view;
    return () => delete document.body.dataset.view;
  }, [view]);

  useEffect(() => {
    function handlePopState() {
      setView(getView(window.location.pathname));
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function navigate(nextView) {
    const path = nextView === "shopping" ? "/shopping" : "/";
    window.history.pushState({}, "", path);
    setView(nextView);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return view === "shopping" ? (
    <ShoppingPage key="shopping" onShowTrips={() => navigate("trips")} />
  ) : (
    <TripPage key="trips" onShowShopping={() => navigate("shopping")} />
  );
}

export default App;
