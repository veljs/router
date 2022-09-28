import createRouterLinkOnAnchors from "./createRouterLinkOnAnchors";
import dispatchRoute from "../../lib/dispatchRoute";

const routerLinkOnAnchors = createRouterLinkOnAnchors({ dispatchRoute });

export default {
  onMount({ mountEl }) {
    routerLinkOnAnchors.mount(mountEl);
  },
  onDestroy() {
    routerLinkOnAnchors.destroy();
  },
  onRouterPageMount({ mountEl }) {
    routerLinkOnAnchors.apply(mountEl);
  },
};
