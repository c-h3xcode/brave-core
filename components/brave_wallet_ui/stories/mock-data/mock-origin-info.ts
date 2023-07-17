// Copyright (c) 2022 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// you can obtain one at https://mozilla.org/MPL/2.0/.
import { BraveWallet, SerializableOriginInfo } from '../../constants/types'

export const mockeTldPlusOne = 'uniswap.org'

export const mockOriginInfoShort: BraveWallet.OriginInfoShort = {
  originSpec: 'https://with_a_really_looooooong_site_name.fixme.uniswap.org',
  eTldPlusOne: mockeTldPlusOne
}

export const mockOriginInfo: SerializableOriginInfo = {
  origin: {
    scheme: 'https',
    host: 'with_a_really_looooooong_site_name.fixme.uniswap.org',
    port: 443,
    nonceIfOpaque: undefined
  },
  ...mockOriginInfoShort
}
