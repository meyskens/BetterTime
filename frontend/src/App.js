import { Container } from "react-bootstrap";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Provider } from "react-redux";

import "react-calendar/dist/Calendar.css";

import AppNav from "./Nav";
import Rooster from "./pages/rooster/Rooster";
import Rooms from "./pages/rooms/Rooms";
import GlobalToast from "./pages/_components/GlobalToast";
import store from "./redux/store";

import "./scss/App.scss";

function App() {
  return (
    <Provider store={store}>
      <Router>
        <AppNav />
        <Container className="content-page">
          <GlobalToast />
          <Switch>
            <Route path="/rooms">
              <Rooms />
            </Route>
            <Route path="/">
              <Rooster />
            </Route>
          </Switch>
        </Container>
        <div className="container">
          <footer className="d-flex flex-wrap justify-content-between align-items-center py-3 my-4 border-top">
            <div className="col-10 d-flex align-items-center">
              <span className="text-muted">
                BetterTime is a hobby project by Maartje Eyskens
                <br />
                This site is not affiliated with any of it&#39;s data sourses. Use at own risk.
              </span>
              <br />
            </div>

            <div className="nav col-2 justify-content-end list-unstyled d-flex text-end">
              <a className="text-muted" href="https://github.com/meyskens/BetterTime">
                <i className="fa-brands fa-github" />
              </a>
            </div>
          </footer>
        </div>
      </Router>
    </Provider>
  );
}

export default App;
