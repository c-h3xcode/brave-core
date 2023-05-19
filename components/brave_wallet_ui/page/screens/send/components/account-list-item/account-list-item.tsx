// Copyright (c) 2022 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// you can obtain one at https://mozilla.org/MPL/2.0/.

import * as React from 'react'

import { BraveWallet } from '../../../../../constants/types'

// Styled Components
import { Button, AccountCircle } from './account-list-item.style'
import { Text, Column } from '../../shared.styles'
import getAPIProxy from '../../../../../common/async/bridge'

// Hooks
import { useAccountOrb } from '../../../../../common/hooks/use-orb'

interface Props {
  account: BraveWallet.AccountInfo
  onClick: (account: BraveWallet.AccountInfo) => void
  isSelected: boolean
  selectedAccountKeyring: number | undefined
}

export const AccountListItem = (props: Props) => {
  const { onClick, account, isSelected, selectedAccountKeyring } = props

  // hooks
  const orb = useAccountOrb(account)

  const apiProxy = getAPIProxy()
  const [fvmAddress, setFvmAddress] = React.useState<string>()
  if (account.accountId.coin === BraveWallet.CoinType.ETH &&
      (selectedAccountKeyring === BraveWallet.KeyringId.kFilecoin ||
       selectedAccountKeyring === BraveWallet.KeyringId.kFilecoinTestnet)) {
    apiProxy.braveWalletService.convertFEVMToFVMAddress(
      account.accountId.keyringId === BraveWallet.KeyringId.kFilecoin, account.address).then(v => {
        if (v.result) {
          setFvmAddress(v.result)
        }
      })
  }

  return (
    <Button disabled={isSelected} onClick={() => onClick(account)}>
      <AccountCircle orb={orb} />
      <Column horizontalAlign='flex-start' verticalAlign='center'>
        <Text textColor='text03' textSize='12px' isBold={false}>{account.name}</Text>
        <Text textColor='text01' textSize='12px' isBold={false}>{account.address}</Text>
        {fvmAddress &&
          <Text textColor='text02' textSize='12px' isBold={false}>{fvmAddress}</Text>
        }
      </Column>
    </Button>
  )
}

export default AccountListItem
