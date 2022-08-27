import React, { Suspense } from "react";
import ReactDOM from "react-dom";
import App from "./App";

console.error("Elke gelijkenis met SAT berust op louter toeval.");
console.error("Hallo daar! Leuk dat je eventjes komt kijken... maar alles is gewoon open source hoor!");
console.error("Anyhow als je graag ook je naam bij collega's hebt, de prijs is 1 big c koffie of gelijkgestelde vriendelijkheid");

ReactDOM.render(
  <Suspense fallback="...">
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </Suspense>,
  document.getElementById("root"),
);
