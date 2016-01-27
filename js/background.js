'use strict';

chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('../window.htm', {
    outerBounds: {
      width: 810,
      height: 600,
      minWidth: 810,
      minHeight: 600
    }
  });
});