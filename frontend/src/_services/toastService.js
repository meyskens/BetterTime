import { Subject } from "rxjs";
import { filter } from "rxjs/operators";

const toastSubject = new Subject();
const defaultId = "default-toast";

export default {
  // enable subscribing to toasts observable
  onToast: (id = defaultId) => toastSubject.asObservable().pipe(filter(x => x && x.id === id)),

  send: alert => {
    alert.id = alert.id || defaultId;
    toastSubject.next(alert);
  },

  clear: (id = defaultId) => toastSubject.next({ id }),
};
