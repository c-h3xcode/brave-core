// Copyright (c) 2023 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// You can obtain one at https://mozilla.org/MPL/2.0/.

import { RegisterPolymerComponentProperties, RegisterStyleOverride, RegisterPolymerPrototypeModification } from 'chrome://resources/brave/polymer_overriding.js'
import {html} from 'chrome://resources/polymer/v3_0/polymer/polymer_bundled.min.js'

const leoIcons = (window as any)['icons'] as Set<string>

// Maps Chromium icons to their equivalent Brave icons.
const iconMap: { [key: string]: string } = {
  'settings:location-on': 'location-on', // location
  'settings:location-off': 'location-off', // location off
  'cr:videocam': 'video-camera', // camera
  'settings:videocam-off': 'video-camera-off', // camera off
  'cr:mic': 'microphone', // microphone
  'settings:mic-off': 'microphone-off', // microphone off
  'settings:sensors': 'motion-sensor', // motion sensors
  'settings:notifications': 'notification', // notifications
  'settings:code': 'code', // javascript
  'settings:photo': 'image', // images
  'cr:open-in-new': 'launch', // popups & redirects
  'settings:ads': '', // intrusive ads (unused)
  'cr:sync': 'sync', // background sync
  'settings:volume-up': 'volume-on', // sound
  'cr:file-download': 'download', // automatic downloads
  'settings:midi': 'media-visualizer', // midi devices
  'settings:usb': 'usb', // usb devices
  'settings:serial-port': 'cpu-chip', // serial ports
  'settings:save-original': 'file-edit', // file editing
  'settings:hid-device': 'sparkles', // hid devices
  'settings:protected-content': 'key-lock', // protected content ids
  'settings:clipboard': 'copy', // clipboard
  'settings:payment-handler': 'credit-card', // payment handlers
  'settings:bluetooth-scanning': 'bluetooth', // bluetooth scanning
  'settings:insecure-content': 'warning-triangle-outline', // insecure content
  'settings:federated-identity-api': '', // federated identity (unused)
  'settings:vr-headset': 'virtual-reality', // virtual reality & virtual reality
  'settings:window-management': 'windows-open', // window management
  'settings:local-fonts': 'font-size', // fonts
}

RegisterStyleOverride('iron-icon', html`
  <style>
    :host {
      --leo-icon-size: var(--iron-icon-width, 24px);
      --leo-icon-color: var(--iron-icon-fill-color, currentColor);
    }
  </style>
`)

RegisterPolymerPrototypeModification({
  'iron-icon': (prototype) => {
    const _updateIcon = prototype._updateIcon
    prototype._updateIcon = function (...args: any[]) {
      const removeAllOfType = (type: string) => {
        for (const node of this.shadowRoot.querySelectorAll(type)) node.remove()
      }

      const name = iconMap[this.icon];
      if (name || leoIcons.has(this.icon)) {
        removeAllOfType('svg')
        this._svgIcon = null

        let leoIcon = this.shadowRoot.querySelector('leo-icon')
        if (!leoIcon) {
          leoIcon = document.createElement('leo-icon')
          this.shadowRoot.append(leoIcon)
        }
        leoIcon.setAttribute('name', name ?? this.icon)
      } else {
        removeAllOfType('leo-icon')
        _updateIcon.apply(this, ...args)
      }
    }
  }
})
