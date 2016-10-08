/* global URLSearchParams */
(function () {
  'use strict';

  window.injectedScript = function () {
    // var port = chrome.runtime.connect( null, { name: `panel` } );
    // var tabId = chrome.devtools.inspectedWindow.tabId;

    // function post (msg) {
    //   msg.tabId = tabId;
    //   port.postMessage(msg);
    // }

    var startPerfNow = performance.now();
    console.log('loaded polyfill');

    var parseMetaContent = function (tag) {
      var obj = {};
      var content = typeof tag === 'string' ? tag : tag.content;
      if (!content) { return; }
      var pairs = content.split(',');
      if (pairs.length === 1) { pairs = content.split(';'); }  // Check for `;` just in case.
      pairs.forEach(function (item) {
        var chunks = item.replace(/[\s;,]+/g, '').split('=');
        if (chunks.length !== 2) { return; }
        obj[chunks[0]] = chunks[1];
      });
      return obj;
    };

    var getQSProjection = function () {
      var projection = null;
      if ('URLSearchParams' in window) {
        var qsViewmode = new URLSearchParams().get('viewmode');
        if (qsViewmode === 'stereo' || qsViewmode === 'mono') {
          projection = qsViewmode;
        }
      }
      return projection;
    };

    var getMetaProjection = function () {
      var projection = null;
      var metaViewmodeTags = document.querySelectorAll('meta[name="viewmode"]');
      Array.prototype.forEach.call(metaViewmodeTags, function (tag) {
        var val = parseMetaContent(tag);
        if (val && val.projection) {
          projection = val.projection;
        }
      });
      return projection;
    };

    var getDesiredProjection = function () {
      return getQSProjection() || getMetaProjection() || 'stereo';
    };

    // TODO: check if VRDisplay.canPresent.

    function createVRDisplayEvent (type, display, reason) {
      var e = new CustomEvent(type);
      e.display = display;
      e.reason = reason;
      return e;
    }

    // post({action: 'hmd-activate', value: true});

    // resolves when document readyState complete
    var documentComplete = new Promise(function(resolve) {
      if(document.readyState === 'complete') {
        resolve();
      }

      var interval = setInterval(function() {
        if(document.readyState === 'complete') {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });

    function VRNavigator (vrDisplay) {
      var self = this;
      this.vrDisplay = vrDisplay;
      // this.displayId = 1;
      // this.displayName = vrDisplay.name;
      // this.isConnected = true;
      // this.isPresenting = false;
      this.enter = function (projection) {
        console.log('enter',
          'connected=' + vrDisplay.isConnected,
          'presenting=' + vrDisplay.isPresenting);
        if (!vrDisplay.isConnected) {
          return Promise.reject();
        }
        self.projection = projection;
        if (!vrDisplay.isPresenting) {
          // TODO: Synthesise event people that is not the true `vrdisplaypresentchange` with `reason` of `navigation`.
          // var e1 = createVRDisplayEvent('vrdisplayactivate', self, 'mounted');
          // window.dispatchEvent(e1);
          // var e2 = createVRDisplayEvent('vrdisplayactivated', self, 'mounted');
          // window.dispatchEvent(e2);
          // var e3 = createVRDisplayEvent('vrdisplaypresentchange', self, 'mounted');
          // window.dispatchEvent(e3);

          console.log('fired');

          // TODO: Figure out why three.js isn't entering VR upon getting this event.
          // var e3 = createVRDisplayEvent('vrdisplaypresentchange', self, 'unmounted');
          // window.dispatchEvent(e3);

          documentComplete.then(function() {

            // Array.prototype.forEach.call(document.querySelectorAll('button, a'), function (el) {
            //   if ((el.alt || '').toLowerCase().indexOf('vr') > -1 ||
            //       (el.title || '').toLowerCase().indexOf('vr') > -1 ||
            //       (el.textContent || '').toLowerCase().indexOf('vr') > -1) {
            //     el.click();
            //     el.blur();
            //   }
            // });

            var enteredVR = false;

            var aScene = document.querySelector('a-scene');
            if (aScene && aScene.enterVR) {
              aScene.enterVR();
              enteredVR = true;
            }

            if (!enteredVR) {
              Array.prototype.forEach.call(document.querySelectorAll('button[style]'), function (el) {
                if ((el.textContent || '').trim().toLowerCase().indexOf('enter vr') > -1) {
                  el.click();
                  el.blur();
                  enteredVR = true;
                }
              });
            }

            if (!enteredVR) {
              console.warn('Could not find "Enter VR" button');
            }
          });

          // if ('WEBVR' in window && window.WEBVR.getButton) {
          //   console.log('WEBVR', window.WEBVR)
          //   window.WEBVR.getButton().click();
          //   return Promise.resolve(projection);
          // }
        }
        return Promise.resolve(projection);
      };
      this.exit = function (projection) {
        console.log('exit',
          'connected=' + vrDisplay.isConnected,
          'presenting=' + vrDisplay.isPresenting);
        if (!vrDisplay.isConnected) {
          return Promise.reject();
        }
        self.projection = projection;
        if (vrDisplay.isPresenting) {
          // TODO: Synthesise event people that is not the true `vrdisplaypresentchange` with `reason` of `navigation`.
          // var e1 = createVRDisplayEvent('vrdisplaydeactivate', self, 'unmounted');
          // window.dispatchEvent(e2);
          // var e2 = createVRDisplayEvent('vrdisplaydeactivated', self, 'unmounted');
          // window.dispatchEvent(e2);
          // var e3 = createVRDisplayEvent('vrdisplaypresentchange', self, 'unmounted');
          // window.dispatchEvent(e3);

          var e3 = createVRDisplayEvent('vrdisplaypresentchange', self, 'unmounted');
          window.dispatchEvent(e3);

          // if ('WEBVR' in window && window.WEBVR.getButton) {
          //   window.WEBVR.getButton().click();
          //   return Promise.resolve(projection);
          // }

          var exitedVR = false;

          var aScene = document.querySelector('a-scene');
          if (aScene && aScene.enterVR) {
            aScene.enterVR();
            exitedVR = true;
          }

          if (!exitedVR) {
            Array.prototype.forEach.call(document.querySelectorAll('button[style]'), function (el) {
              if ((el.textContent || '').trim().toLowerCase().indexOf('exit vr') > -1) {
                el.click();
                el.blur();
                exitedVR = true;
              }
            });
          }

          if (!exitedVR) {
            console.warn('Could not find "Exit VR" button');
          }

          // TODO: Handle exiting VR for A-Frame. May need to introduce some method
        }
        return Promise.resolve(projection);
      };
      this.autoChange = function () {
        var projection = getDesiredProjection();
        if (projection === 'stereo') {
          return self.enter(projection);
        }
        if (projection === 'mono') {
          return self.exit(projection);
        }
      };

      // window.addEventListener('webvr-nav-hmd-activate', function (e) {
      //   if (e.detail.state) {
      //     var event = createVRDisplayEvent( 'vrdisplayactivate', this, 'HMD activated' );
      //     window.dispatchEvent(event);
      //   } else {
      //     var event = createVRDisplayEvent( 'vrdisplaydeactivate', this, 'HMD deactivated' );
      //     window.dispatchEvent(event);
      //   }
      // }.bind(this));
    }

    var projection;
    var vrDisplay;
    var vrNav;

    // TODO: Add mutation observer for detecting addition/removal/modification of `meta[name=viewmode]`.

    function attemptAutoChange (vrDisplay) {
      console.log('attemptAutoChange', vrDisplay);

      if (vrNav) {
        return Promise.resolve(vrNav.vrDisplay);
      }

      if (!vrDisplay) {
        return Promise.resolve(null);
      }

      vrNav = new VRNavigator(vrDisplay);
      return vrNav.autoChange().then(function (projection) {
        console.log('viewmode projection changed:', projection);
        return projection;
      }).catch(function (err) {
        console.warn(err.message);
        return err;
      });
    }

    function filterDisplaysAndAttemptAutoChange (vrDisplays) {
      console.log('filterDisplaysAndAttemptAutoChange', vrDisplays);

      if (vrNav) {
        return Promise.resolve(vrNav.vrDisplay);
      }

      // TODO: Look up and use stored `VRDisplay`.

      if (!vrDisplays || !vrDisplays.length) {
        return Promise.resolve(null);
      }

      return attemptAutoChange(vrDisplays[0]);
    }

    var attemptInterval = setInterval(attempt, 100);

    function attempt () {
      return new Promise(function (resolve, reject) {
        if (!navigator.getVRDisplays) {
          if (attemptInterval) {
            clearInterval(attemptInterval);
          }
          return reject(new Error('navigator.getVRDisplays is not available'));
        }

        console.log('attempt');

        return navigator.getVRDisplays()
          .then(filterDisplaysAndAttemptAutoChange)
          .then(function (vrDisplay) {
            console.log('projectionAttempted', vrDisplay, vrNav);
            if (vrDisplay) {
              if (vrNav && vrNav.projection && attemptInterval) {
                clearInterval(attemptInterval);
              }
              return resolve(vrDisplay);
            }
          })
          .catch(function (err) {
            // if (attemptInterval) {
            //   clearInterval(attemptInterval);
            // }
            return reject(err);
          });
      });
    }

    document.addEventListener('DOMContentLoaded', attempt);

    window.addEventListener('load', attempt);

    window.addEventListener('vrdisplaypresentchange', function () {
      console.log(e.type, e, e.display, e.reason);
      if (!e.display) {
        return;
      }
      if (e.reason === 'navigation') {
        attemptAutoChange(e.display);
      }
    });

    function onEventAttempt (e) {
      console.log(e.type, e, e.display, e.reason);
      if (!e.display) {
        return;
      }
      attemptAutoChange(e.display);
    }

    window.addEventListener('vrdisplayactivated', onEventAttempt);
    window.addEventListener('vrdisplaydeactivated', onEventAttempt);
    window.addEventListener('vrdisplayactivate', onEventAttempt);
    window.addEventListener('vrdisplaydeactivate', onEventAttempt);

    // TODO: Address `<iframe allowvr>`s?

    // navigator.vrEnabled = true;

    var e = new Event('webvr-ready');
    window.dispatchEvent(e);
  }
})();
