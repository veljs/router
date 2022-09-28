import dispatchRoute from "./dispatchRoute";
import { ROUTE_CHANGE_EVENT } from "./constants";

export default function routerLink(node) {
  const linkRoute = node.getAttribute("href");

  function getCurrentURL() {
    return new URL(location.href);
  }

  function setActive(to) {
    if (to === linkRoute) {
      node.setAttribute("app-link-active", "");
    } else {
      node.removeAttribute("app-link-active");
    }
  }

  setActive(getCurrentURL().pathname);

  function onClick(e) {
    e.preventDefault();
    dispatchRoute(linkRoute);
  }

  function onRouteChange(e) {
    const { to } = e.detail;
    setActive(to);
  }

  node.addEventListener("click", onClick);
  document.addEventListener(ROUTE_CHANGE_EVENT, onRouteChange);
  return {
    destroy() {
      node.removeEventListener("click", onClick);
      document.removeEventListener(ROUTE_CHANGE_EVENT, onRouteChange);
    },
  };
}
