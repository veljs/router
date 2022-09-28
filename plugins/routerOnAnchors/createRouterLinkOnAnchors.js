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
    //console.log('addRouterLinkEventListener', node);
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

  function onMutation(mutationList) {
    for (const mutation of mutationList) {
      if (mutation.type === "childList") {
        for (const node of mutation.addedNodes) {
          if (
            node.tagName === "A" &&
            node.getAttribute(routerLinkAttribute) === null
          ) {
            addRouterLinkEventListener(node);
          }
        }

        for (const node of mutation.removedNodes) {
          if (
            node.tagName === "A" &&
            node.getAttribute(routerLinkAttribute) !== null
          ) {
            removeRouterLinkEventListener(node);
          }
        }
      }
    }
  }

  const observer = new MutationObserver(onMutation);

  return {
    apply(mountEl) {
      const $$a = mountEl.querySelectorAll(`a:not([${routerLinkAttribute}])`);
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
