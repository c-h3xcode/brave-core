// Copyright (c) 2020 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// You can obtain one at https://mozilla.org/MPL/2.0/.

import * as React from 'react'

// Components
import {
  SettingsRow,
  SettingsText
} from '../../../components/default'
import Toggle from '@brave/leo/react/toggle'
import Dropdown from '@brave/leo/react/dropdown'

// Utils
import { getLocale } from '../../../../common/locale'

// Types
import { useNewTabPref } from '../../../hooks/usePref'
import styled from 'styled-components'

const StyledDropdown = styled(Dropdown)`
  display: block;
  width: 220px;
`

const clockFormats = {
  '': () => {
    const dateFormat = new Intl.DateTimeFormat()
    const dateFormatOptions = dateFormat && dateFormat.resolvedOptions()
    const localeInfo = dateFormatOptions && dateFormatOptions.locale
      ? ` (${dateFormatOptions.locale})`
      : ''
    return `${getLocale('clockFormatDefault')}${localeInfo}`
  },
  '12': () => getLocale('clockFormat12'),
  '24': () => getLocale('clockFormat24')
}

function ClockSettings() {
  const [clockFormat, setClockFormat] = useNewTabPref('clockFormat')
  const [showClock, setShowClock] = useNewTabPref('showClock')

  return <div>
    <SettingsRow>
      <SettingsText>{getLocale('showClock')}</SettingsText>
      <Toggle
        onChange={() => setShowClock(!showClock)}
        checked={showClock}
        size='small'
      />
    </SettingsRow>
    {showClock && <SettingsRow>
      <SettingsText>{getLocale('clockFormat')}</SettingsText>
      <StyledDropdown value={clockFormat} onChange={e => setClockFormat(e.detail.value)}>
        {/* TODO(fallaciousreasoning): https://github.com/brave/leo/issues/305 */}
        <span slot="value">
          {clockFormats[clockFormat!]()}
        </span>
        {/* TODO(fallaciousreasoning): https://github.com/brave/leo/issues/302 */}
        <span slot="placeholder">{clockFormats['']()}</span>
        {Object.entries(clockFormats).map(([format, getText]) => <leo-option value={format}>{getText()}</leo-option>)}
      </StyledDropdown>
    </SettingsRow>}
  </div>
}

export default ClockSettings
