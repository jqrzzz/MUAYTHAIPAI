/*
 * OckOck embeddable booking widget
 *
 * Drop this on any gym website:
 *   <script src="https://muaythaipai.com/embed.js" data-gym="your-gym-slug" async></script>
 *
 * Optional attributes on the script tag:
 *   data-gym       — required. Your gym slug (the same one that shows up
 *                     in muaythaipai.com/gyms/<slug>).
 *   data-mount     — CSS selector of the element to mount inside.
 *                     Defaults to the script's parent node.
 *   data-min-height — minimum iframe height in px. Default 480.
 *
 * The widget posts its content height back to the parent so the iframe
 * resizes smoothly as the user scrolls services. No third-party scripts,
 * no cookies, no analytics.
 */
(function () {
  "use strict"

  var current
  // currentScript is reliable for synchronous loads; for async we fall
  // back to looking up the last <script> with our src.
  if (document.currentScript) {
    current = document.currentScript
  } else {
    var scripts = document.getElementsByTagName("script")
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && scripts[i].src.indexOf("/embed.js") !== -1) {
        current = scripts[i]
        break
      }
    }
  }
  if (!current) return

  var slug = current.getAttribute("data-gym")
  if (!slug) {
    console.warn("[OckOck embed] missing data-gym attribute on the script tag")
    return
  }

  var origin = (function () {
    try {
      var u = new URL(current.src)
      return u.origin
    } catch (_) {
      return "https://muaythaipai.com"
    }
  })()

  var minHeight = parseInt(current.getAttribute("data-min-height") || "480", 10)

  var mountSelector = current.getAttribute("data-mount")
  var mount = mountSelector
    ? document.querySelector(mountSelector)
    : current.parentNode
  if (!mount) {
    console.warn("[OckOck embed] mount target not found:", mountSelector)
    return
  }

  // Wrapper keeps our iframe contained at full width with sensible defaults.
  var wrapper = document.createElement("div")
  wrapper.style.cssText =
    "max-width:640px;margin:0 auto;width:100%;border-radius:16px;overflow:hidden;"

  var iframe = document.createElement("iframe")
  iframe.src = origin + "/embed/" + encodeURIComponent(slug)
  iframe.title = "Book at this gym (powered by OckOck)"
  iframe.loading = "lazy"
  iframe.setAttribute(
    "sandbox",
    "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
  )
  iframe.style.cssText =
    "width:100%;border:0;display:block;background:transparent;min-height:" +
    minHeight +
    "px;"

  wrapper.appendChild(iframe)
  mount.appendChild(wrapper)

  // Listen for height updates from the iframe (resize observer inside).
  window.addEventListener("message", function (event) {
    if (event.source !== iframe.contentWindow) return
    var data = event.data
    if (!data || data.type !== "ockock:embed:resize" || data.slug !== slug) return
    var h = parseInt(data.height, 10)
    if (!isNaN(h) && h > 0) {
      iframe.style.height = Math.max(h, minHeight) + "px"
    }
  })
})()
