var verbose = true;

function log () {
  if (!verbose) {
    return;
  }

  console.log.apply(
    console, [
      `%c WebVR Navigator `,
      'background: #111; color: cyan; text-shadow: 0 -1px #000; padding: 4px 0; line-height: 0',
      ...arguments
    ]
  );
}

log('Polyfill', window.location.href);

var port = chrome.runtime.connect({name: 'contentScript'});

function post (msg) {
  port.postMessage(msg);
}

post({method: 'script-ready'});

// port.onMessage.addListener(function (msg) {
//   switch (msg.action) {
//     case 'hmd-activate':
//       var e = new CustomEvent('webvr-nav-hmd-activate', {
//         detail: {
//           state: msg.value
//         }
//       });
//       window.dispatchEvent(e);
//       break;
//   }
// });

window.addEventListener('webvr-ready', function () {
  post({action: 'page-ready'});
});

if ('injectedScript' in window) {
  var scriptBody = '(' + window.injectedScript + ')();';

  var script = document.createElement('script');
  script.textContent = scriptBody;
  (document.head || document.documentElement).appendChild(script);
  script.parentNode.removeChild(script);
}
