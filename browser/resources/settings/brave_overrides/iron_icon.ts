// Copyright (c) 2023 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// You can obtain one at https://mozilla.org/MPL/2.0/.

import { RegisterPolymerComponentProperties } from 'chrome://resources/brave/polymer_overriding.js'
// const iconMap = {
//   'settings:location-on': 'location-on', // location
//   'cr:videocam': 'video-camera', // camera
//   'cr:mic': 'microphone', // microphone
//   'settings:sensors': 'motion-sensor', // motion sensors
//   'settings:notifications': 'notification', // notifications
//   'settings:code': 'code', // javascript
//   'settings:photo': 'image', // images
//   'cr:open-in-new': 'launch', // popups & redirects
//   'settings:ads': '', // intrusive ads (unused)
//   'cr:sync': 'sync', // background sync
//   'settings:volume-up': 'volume-on', // sound
//   'cr:file-download': 'download', // automatic downloads
//   'settings:midi': 'media-visualizer', // midi devices
//   'settings:usb': 'usb', // usb devices
//   'settings:serial-port': 'cpu-chip', // serial ports
//   'settings:save-original': 'file-edit', // file editing
//   'settings:hid-device': 'sparkles', // hid devices
//   'settings:protected-content': 'key-lock', // protected content ids
//   'settings:clipboard': 'copy', // clipboard
//   'settings:payment-handler': 'credit-card', // payment handlers
//   'settings:bluetooth-scanning': 'bluetooth', // bluetooth scanning
//   'settings:insecure-content': 'warning-triangle-outline', // insecure content
//   'settings:federated-identity-api': '', // federated identity (unused)
//   'settings:vr-headset': 'virtual-reality', // virtual reality & virtual reality
//   'settings:window-management': 'windows-open', // window management
//   'settings:local-fonts': 'font-size',

//   // Leo Icons
//   'user': 'user',
//   'autoplay-on': 'autoplay-on',
//   'ethereum-on': 'ethereum-on',
//   'smartphone-desktop': 'smartphone-desktop', // localhost access
//   'solana-on': 'solana-on',
//   'smartphone-hand': 'smartphone-hand',
// } as const

RegisterPolymerComponentProperties({
  'iron-icon': {
    isLeoIcon_: {
      type: Boolean,
      computed: '_baz(icon)'
    }
  }
})

// RegisterPolymerPrototypeModification({
//   'iron-icon': (prototype) => {
//     const _updateIcon = prototype._updateIcon
//     prototype._updateIcon = function(...args) {
//       console.log("Prototyped updateIcon", ...args)
//       _updateIcon.apply(this, ...args)
//     }
//   }
// })

// RegisterPolymerTemplateModifications({
//   'iron-icon': (templateContent) => {
//     let checkBoxesParent = templateContent.querySelector('#browserSelect').parentElement;
//     checkBoxesParent.appendChild(html`
//       <settings-checkbox id="importDialogExtensions"
//         hidden="[[!selected_.extensions]]"
//         pref="{{prefs.import_dialog_extensions}}"
//         label="${loadTimeData.getString('importExtensions')}" no-set-pref>
//       </settings-checkbox>
//       <settings-checkbox id="importDialogPayments"
//         hidden="[[!selected_.payments]]"
//         pref="{{prefs.import_dialog_payments}}"
//         label="${loadTimeData.getString('importPayments')}" no-set-pref>
//       </settings-checkbox>
//     `)
//   }
// })
