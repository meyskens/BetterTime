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
            <div className="col-md-4 d-flex align-items-center">
              <span className="text-muted">BetterTime is a hobby project by Maartje Eyskens</span>
            </div>

            <ul className="nav col-md-6 justify-content-end list-unstyled d-flex">
              <li className="ms-3">
                <a className="text-muted" href="https://github.com/meyskens/BetterTime">
                  <i className="fa-brands fa-github" />
                </a>
              </li>
            </ul>
            <div className="col-md-12 d-flex align-items-center">
              <span className="text-muted">This site is not affiliated with any of it&#39;s data sourses. Use at own risk.</span>
            </div>
          </footer>
        </div>
      </Router>
    </Provider>
  );
}

export default App;
