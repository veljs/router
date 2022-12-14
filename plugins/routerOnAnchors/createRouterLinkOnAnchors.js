export default function createRouterLinkOnAnchors({ dispatchRoute }) {
  const routerLinkAttribute = "data-veljs-router-link";
  const nodePropName = "__veljsRouterLink__";

  function createRouterLinkEventHandler(href) {
    return (event) => {
      event.preventDefault();
      dispatchRoute(href);
    };
  }

  function addRouterLinkEventListener(node) {
    const callback = createRouterLinkEventHandler(node.getAttribute("href"));
    node.addEventListener("click", callback);
    node.setAttribute(routerLinkAttribute, "");

    node[nodePropName] = {
      removeEventListener() {
        node.removeEventListener("click", callback);
        node.removeAttribute(routerLinkAttribute);
      },
    };
  }

  function removeRouterLinkEventListener(node) {
    if (node.getAttribute(routerLinkAttribute) !== null) {
      node[nodePropName].removeEventListener();
    }
  }

  function isEligibleRouterAnchorHrefNode(node) {
    const href = node.getAttribute("href");
    return href && !href.startsWith("http");
  }

  function isEligibleRouterAnchorNode(node) {
    return (
      node &&
      node.tagName === "A" &&
      node.getAttribute(routerLinkAttribute) === null &&
      isEligibleRouterAnchorHrefNode(node)
    );
  }

  function onMutation(mutationList) {
    for (const mutation of mutationList) {
      if (mutation.type === "childList") {
        for (const node of mutation.addedNodes) {
          if (isEligibleRouterAnchorNode(node)) {
            addRouterLinkEventListener(node);
          }
        }

        for (const node of mutation.removedNodes) {
          if (isEligibleRouterAnchorNode(node)) {
            removeRouterLinkEventListener(node);
          }
        }
      }
    }
  }

  const observer = new MutationObserver(onMutation);

  return {
    apply(mountEl) {
      const $$a = mountEl.querySelectorAll(
        `a:not([${routerLinkAttribute}]):not([href^=http])`
      );
      for (const $a of $$a) {
        addRouterLinkEventListener($a);
      }
    },
    mount(mountEl) {
      observer.observe(mountEl, { childList: true, subtree: true });
    },
    destroy() {
      observer.disconnect();
    },
  };
}
