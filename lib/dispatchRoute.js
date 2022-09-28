import { ROUTE_CHANGE_EVENT } from "./constants";

export default function dispatchRoute(to) {
  if (!to) {
    return;
  }
  document.dispatchEvent(
    new CustomEvent(ROUTE_CHANGE_EVENT, {
      detail: {
        to,
      },
    })
  );
}
