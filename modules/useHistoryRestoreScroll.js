'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _PathUtils = require('history').PathUtils;

var setManualScroll = function setManualScroll() {
  if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
    history.scrollRestoration = 'manual';
  }
};

var createKey = function createKey() {
  return Math.random().toString(36).substr(2, 6);
};

var addScrollKey = function addScrollKey(locationOrString) {
  var location = typeof locationOrString === 'string' ? (0, _PathUtils.parsePath)(locationOrString) : locationOrString;
  if (!location.state) location.state = {};
  location.state.__scrollKey = createKey();
  return location;
};

var useHistoryRestoreScroll = function useHistoryRestoreScroll(createHistory) {
  return function () {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    setManualScroll();

    var scrollableNodes = {};

    // TODO: safer sessionStorage stuff
    var positionsByLocation = sessionStorage.positionsByLocation && JSON.parse(sessionStorage.positionsByLocation) || {};

    var initialScrollKey = sessionStorage.initialScrollKey || createKey();
    var currentScrollKey = sessionStorage.currentScrollKey || initialScrollKey;
    var first = true;

    window.addEventListener('beforeunload', function () {
      saveScrollPositions();
      sessionStorage.positionsByLocation = JSON.stringify(positionsByLocation);
      sessionStorage.currentScrollKey = currentScrollKey;
      sessionStorage.initialScrollKey = initialScrollKey;
    });

    var history = createHistory(options);

    var push = function push(locationWithoutKey) {
      var location = addScrollKey(locationWithoutKey);
      history.push(location);
    };

    var replace = function replace(locationWithoutKey) {
      var location = addScrollKey(locationWithoutKey);
      history.replace(location);
    };

    var registerScroller = function registerScroller(scrollKey, node) {
      scrollableNodes[scrollKey] = node;
      restoreNode(scrollKey);
    };

    var unregisterScroller = function unregisterScroller(scrollKey) {
      delete scrollableNodes[scrollKey];
    };

    var getScrollerPosition = function getScrollerPosition(componentScrollKey) {
      var locationPositions = positionsByLocation[currentScrollKey];
      var position = locationPositions ? locationPositions[componentScrollKey] : null;

      return position && position.scrollX !== undefined && position.scrollY !== undefined ? position : null;
    };

    var saveScrollPositions = function saveScrollPositions() {
      if (!positionsByLocation[currentScrollKey]) positionsByLocation[currentScrollKey] = {};
      var _window = window,
          scrollY = _window.scrollY,
          scrollX = _window.scrollX;

      savePosition('window', { scrollX: scrollX, scrollY: scrollY });
      for (var scrollKey in scrollableNodes) {
        var scrollerNode = scrollableNodes[scrollKey];
        var scrollTop = scrollerNode.scrollTop,
            scrollLeft = scrollerNode.scrollLeft;

        savePosition(scrollKey, { scrollTop: scrollTop, scrollLeft: scrollLeft });
      }
    };

    var savePosition = function savePosition(scrollKey, position) {
      positionsByLocation[currentScrollKey][scrollKey] = position;
    };

    var restoreWindow = function restoreWindow(location) {
      if (location.action === 'PUSH' || location.action === 'REPLACE') {
        window.scrollTo(0, 0);
      } else {
        var position = getScrollerPosition('window');
        if (position) {
          var scrollX = position.scrollX,
              scrollY = position.scrollY;

          window.scrollTo(scrollX, scrollY);
        }
      }
    };

    var restoreNode = function restoreNode(scrollKey) {
      var position = getScrollerPosition(scrollKey);
      if (position) {
        var node = scrollableNodes[scrollKey];
        var scrollTop = position.scrollTop,
            scrollLeft = position.scrollLeft;

        node.scrollTop = scrollTop;
        node.scrollLeft = scrollLeft;
      }
    };

    var unlisten = history.listen(function (location) {
      if (first) {
        first = false;
      } else {
        saveScrollPositions();
      }
      currentScrollKey = location.state && location.state.__scrollKey || initialScrollKey;
    });

    var listen = function listen() {
      var internalUnlisten = history.listen.apply(history, arguments);
      return function () {
        return unlisten() && internalUnlisten();
      };
    };

    return _extends({}, history, {
      listen: listen,
      push: push,
      replace: replace,
      restoreScroll: {
        registerScroller: registerScroller,
        unregisterScroller: unregisterScroller,
        restoreWindow: restoreWindow
      }
    });
  };
};

exports.default = useHistoryRestoreScroll;
