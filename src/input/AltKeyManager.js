// src/input/AltKeyManager.js
'use strict';

/**
 * Manages Alt-key pressed state for hover-preview trigger. Spec 1 keeps
 * legacy behavior: state is set externally; the manager only notifies
 * listeners. The console.log-only detection is preserved (bug fixed later).
 */
class AltKeyManager {
  constructor() {
    this._isAltPressed = false;
    this._listeners = [];
    this._disposables = [];
    this._forceEnabled = false;
  }

  startListening() {
    console.log('Alt键监听已启动');
  }

  isAltPressed() {
    return this._isAltPressed;
  }

  setAltPressed(pressed) {
    const was = this._isAltPressed;
    this._isAltPressed = pressed;
    if (was !== pressed) this._notifyListeners(pressed);
  }

  setForceEnabled(enabled) {
    this._forceEnabled = enabled;
  }

  isForceEnabled() {
    return this._forceEnabled;
  }

  toggleForceEnabled() {
    this._forceEnabled = !this._forceEnabled;
    return this._forceEnabled;
  }

  addListener(listener) {
    this._listeners.push(listener);
  }

  removeListener(listener) {
    const idx = this._listeners.indexOf(listener);
    if (idx > -1) this._listeners.splice(idx, 1);
  }

  _notifyListeners(isPressed) {
    this._listeners.forEach((l) => {
      try {
        l(isPressed);
      } catch (err) {
        console.error('Alt键状态监听器执行错误:', err);
      }
    });
  }
}

module.exports = { AltKeyManager };
