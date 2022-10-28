/* Copyright (c) 2021 The Brave Authors. All rights reserved.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createReducer } from 'redux-act'
import {
  AccountInfo,
  AccountTransactions,
  BraveWallet,
  GetBlockchainTokenBalanceReturnInfo,
  GetPriceHistoryReturnInfo,
  PortfolioTokenHistoryAndInfo,
  WalletAccountType,
  WalletState,
  WalletInfoBase,
  WalletInfo,
  DefaultCurrencies,
  GetPriceReturnInfo,
  GetNativeAssetBalancesPayload,
  SolFeeEstimates,
  AssetFilterOption
} from '../../constants/types'
import {
  GetCoinMarketsResponse,
  IsEip1559Changed,
  NewUnapprovedTxAdded,
  SetTransactionProviderErrorType,
  SitePermissionsPayloadType,
  TransactionStatusChanged,
  UnapprovedTxUpdated
} from '../constants/action_types'
import * as WalletActions from '../actions/wallet_actions'

// Utils
import { mojoTimeDeltaToJSDate } from '../../../common/mojomUtils'
import { sortTransactionByDate } from '../../utils/tx-utils'
import Amount from '../../utils/amount'
import { createTokenBalanceRegistryKey } from '../../utils/account-utils'

// Options
import { AllAssetsFilterOption } from '../../options/asset-filter-options'
import { AllNetworksOption } from '../../options/network-filter-options'
import { AllAccountsOption } from '../../options/account-filter-options'

const defaultState: WalletState = {
  hasInitialized: false,
  isFilecoinEnabled: false,
  isSolanaEnabled: false,
  isTestNetworksEnabled: false,
  isWalletCreated: false,
  isWalletLocked: true,
  favoriteApps: [],
  isWalletBackedUp: false,
  hasIncorrectPassword: false,
  selectedAccount: {} as WalletAccountType,
  selectedNetwork: {
    chainId: BraveWallet.MAINNET_CHAIN_ID,
    chainName: 'Ethereum Mainnet',
    activeRpcEndpointIndex: 0,
    rpcEndpoints: [],
    blockExplorerUrls: [],
    iconUrls: [],
    symbol: 'ETH',
    symbolName: 'Ethereum',
    decimals: 18,
    coin: BraveWallet.CoinType.ETH,
    isEip1559: true
  },
  accounts: [],
  userVisibleTokensInfo: [],
  transactions: {},
  pendingTransactions: [],
  knownTransactions: [],
  fullTokenList: [],
  portfolioPriceHistory: [],
  selectedPendingTransaction: undefined,
  isFetchingPortfolioPriceHistory: true,
  selectedPortfolioTimeline: BraveWallet.AssetPriceTimeframe.OneDay,
  networkList: [],
  transactionSpotPrices: [],
  addUserAssetError: false,
  defaultEthereumWallet: BraveWallet.DefaultWallet.BraveWalletPreferExtension,
  defaultSolanaWallet: BraveWallet.DefaultWallet.BraveWalletPreferExtension,
  activeOrigin: {
    eTldPlusOne: '',
    originSpec: '',
    origin: {
      scheme: '',
      host: '',
      port: 0,
      nonceIfOpaque: undefined
    }
  },
  gasEstimates: undefined,
  connectedAccounts: [],
  isMetaMaskInstalled: false,
  selectedCoin: BraveWallet.CoinType.ETH,
  defaultCurrencies: {
    fiat: '',
    crypto: ''
  },
  transactionProviderErrorRegistry: {},
  isLoadingCoinMarketData: true,
  coinMarketData: [],
  defaultNetworks: [] as BraveWallet.NetworkInfo[],
  defaultAccounts: [] as BraveWallet.AccountInfo[],
  selectedNetworkFilter: AllNetworksOption,
  selectedAssetFilter: AllAssetsFilterOption,
  selectedAccountFilter: AllAccountsOption,
  solFeeEstimates: undefined,
  onRampCurrencies: [] as BraveWallet.OnRampCurrency[],
  selectedCurrency: undefined,
  passwordAttempts: 0
}

const getAccountType = (info: AccountInfo) => {
  if (info.hardware) {
    return info.hardware.vendor
  }
  return info.isImported ? 'Secondary' : 'Primary'
}

export const createWalletReducer = (initialState: WalletState) => {
  const reducer = createReducer<WalletState>({}, initialState)

  reducer.on(WalletActions.initialized.type, (state: WalletState, payload: WalletInfo): WalletState => {
    const accounts = payload.accountInfos.map((info: AccountInfo, idx: number) => {
      return {
        id: `${idx + 1}`,
        name: info.name,
        address: info.address,
        accountType: getAccountType(info),
        deviceId: info.hardware ? info.hardware.deviceId : '',
        tokenBalanceRegistry: {},
        nativeBalanceRegistry: {},
        coin: info.coin,
        keyringId: info.keyringId
      } as WalletAccountType
    })
    const selectedAccount = payload.selectedAccount
      ? accounts.find((account) => account.address.toLowerCase() === payload.selectedAccount.toLowerCase()) ?? accounts[0]
      : accounts[0]
    return {
      ...state,
      hasInitialized: true,
      isWalletCreated: payload.isWalletCreated,
      isFilecoinEnabled: payload.isFilecoinEnabled,
      isSolanaEnabled: payload.isSolanaEnabled,
      isWalletLocked: payload.isWalletLocked,
      favoriteApps: payload.favoriteApps,
      accounts,
      isWalletBackedUp: payload.isWalletBackedUp,
      selectedAccount
    }
  })

  reducer.on(WalletActions.locked.type, (state): WalletState => {
    return {
      ...state,
      isWalletLocked: true
    }
  })

  reducer.on(WalletActions.hasIncorrectPassword.type, (state: WalletState, payload: boolean): WalletState => {
    return {
      ...state,
      hasIncorrectPassword: payload
    }
  })

  reducer.on(WalletActions.setSelectedAccount.type, (state: WalletState, payload: WalletAccountType): WalletState => {
    return {
      ...state,
      selectedAccount: payload
    }
  })

  reducer.on(WalletActions.setNetwork.type, (state: WalletState, payload: BraveWallet.NetworkInfo): WalletState => {
    return {
      ...state,
      selectedNetwork: payload
    }
  })

  reducer.on(WalletActions.setVisibleTokensInfo.type, (state: WalletState, payload: BraveWallet.BlockchainToken[]): WalletState => {
    return {
      ...state,
      userVisibleTokensInfo: payload
    }
  })

  reducer.on(WalletActions.setAllNetworks.type, (state: WalletState, payload: BraveWallet.NetworkInfo[]): WalletState => {
    return {
      ...state,
      networkList: payload
    }
  })

  reducer.on(WalletActions.setAllTokensList.type, (state: WalletState, payload: BraveWallet.BlockchainToken[]): WalletState => {
    return {
      ...state,
      fullTokenList: payload
    }
  })

  reducer.on(WalletActions.nativeAssetBalancesUpdated.type, (state: WalletState, payload: GetNativeAssetBalancesPayload): WalletState => {
    let accounts: WalletAccountType[] = [...state.accounts]

    accounts.forEach((account, accountIndex) => {
      payload.balances[accountIndex].forEach((info, tokenIndex) => {
        if (info.error === BraveWallet.ProviderError.kSuccess) {
          accounts[accountIndex].nativeBalanceRegistry[info.chainId] = Amount.normalize(info.balance)
        }
      })
    })

    // Refresh selectedAccount object
    const selectedAccount = accounts.find(
      account => account === state.selectedAccount
    ) ?? state.selectedAccount

    return {
      ...state,
      accounts,
      selectedAccount
    }
  })

  reducer.on(WalletActions.tokenBalancesUpdated.type, (state: WalletState, payload: GetBlockchainTokenBalanceReturnInfo): WalletState => {
    const visibleTokens = state.userVisibleTokensInfo
      .filter(asset => asset.contractAddress !== '')

    let accounts: WalletAccountType[] = [...state.accounts]
    accounts.forEach((account, accountIndex) => {
      payload.balances[accountIndex]?.forEach((info, tokenIndex) => {
        if (info.error === BraveWallet.ProviderError.kSuccess) {
          const token = visibleTokens[tokenIndex]
          const registryKey = createTokenBalanceRegistryKey(token)
          accounts[accountIndex].tokenBalanceRegistry[registryKey] = Amount.normalize(info.balance)
        }
      })
    })

    // Refresh selectedAccount object
    const selectedAccount = accounts.find(
      account => account === state.selectedAccount
    ) ?? state.selectedAccount

    return {
      ...state,
      accounts,
      selectedAccount
    }
  })

  reducer.on(WalletActions.pricesUpdated.type, (state: WalletState, payload: GetPriceReturnInfo): WalletState => {
    return {
      ...state,
      transactionSpotPrices: payload.success ? payload.values : state.transactionSpotPrices
    }
  })

  reducer.on(WalletActions.portfolioPriceHistoryUpdated.type, (state: WalletState, payload: PortfolioTokenHistoryAndInfo[][]): WalletState => {
    const history = payload.map((infoArray) => {
      return infoArray.map((info) => {
        if (new Amount(info.balance).isPositive() && info.token.visible) {
          return info.history.values.map((value) => {
            return {
              date: value.date,
              price: new Amount(info.balance)
                .divideByDecimals(info.token.decimals)
                .times(value.price)
                .toNumber()
            }
          })
        } else {
          return []
        }
      })
    })
    const jointHistory = [].concat.apply([], [...history]).filter((h: []) => h.length > 1) as GetPriceHistoryReturnInfo[][]

    // Since the Price History API sometimes will return a shorter
    // array of history, this checks for the shortest array first to
    // then map and reduce to it length
    const shortestHistory = jointHistory.length > 0 ? jointHistory.reduce((a, b) => a.length <= b.length ? a : b) : []
    const sumOfHistory = jointHistory.length > 0 ? shortestHistory.map((token, tokenIndex) => {
      return {
        date: mojoTimeDeltaToJSDate(token.date),
        close: jointHistory.map(price => Number(price[tokenIndex].price) || 0).reduce((sum, x) => sum + x, 0)
      }
    }) : []

    return {
      ...state,
      portfolioPriceHistory: sumOfHistory,
      isFetchingPortfolioPriceHistory: sumOfHistory.length === 0
    }
  })

  reducer.on(WalletActions.portfolioTimelineUpdated.type, (state: WalletState, payload: BraveWallet.AssetPriceTimeframe): WalletState => {
    return {
      ...state,
      isFetchingPortfolioPriceHistory: true,
      selectedPortfolioTimeline: payload
    }
  })

  reducer.on(WalletActions.newUnapprovedTxAdded.type, (state: WalletState, payload: NewUnapprovedTxAdded): WalletState => {
    const newState = {
      ...state,
      pendingTransactions: [
        ...state.pendingTransactions,
        payload.txInfo
      ]
    }

    if (state.pendingTransactions.length === 0) {
      newState.selectedPendingTransaction = payload.txInfo
    }

    return newState
  })

  reducer.on(WalletActions.unapprovedTxUpdated.type, (state: WalletState, payload: UnapprovedTxUpdated): WalletState => {
    const newState = { ...state }

    const index = state.pendingTransactions.findIndex(
      (tx: BraveWallet.TransactionInfo) => tx.id === payload.txInfo.id
    )

    if (index !== -1) {
      newState.pendingTransactions[index] = payload.txInfo
    }

    if (state.selectedPendingTransaction?.id === payload.txInfo.id) {
      newState.selectedPendingTransaction = payload.txInfo
    }

    return newState
  })

  reducer.on(WalletActions.transactionStatusChanged.type, (state: WalletState, payload: TransactionStatusChanged): WalletState => {
    const newPendingTransactions = state.pendingTransactions
      .filter((tx: BraveWallet.TransactionInfo) => tx.id !== payload.txInfo.id)
      .concat(payload.txInfo.txStatus === BraveWallet.TransactionStatus.Unapproved ? [payload.txInfo] : [])

    const sortedTransactionList = sortTransactionByDate(newPendingTransactions)

    const newTransactionEntries = Object.entries(state.transactions).map(([address, transactions]) => {
      const hasTransaction = transactions.some(tx => tx.id === payload.txInfo.id)

      return [
        address,
        hasTransaction
          ? sortTransactionByDate([
            ...transactions.filter(tx => tx.id !== payload.txInfo.id),
            payload.txInfo
          ])
          : transactions
      ]
    })

    return {
      ...state,
      pendingTransactions: sortedTransactionList,
      selectedPendingTransaction: sortedTransactionList[0],
      transactions: Object.fromEntries(newTransactionEntries)
    }
  })

  reducer.on(WalletActions.setAccountTransactions.type, (state: WalletState, payload: AccountTransactions): WalletState => {
    const { accounts } = state

    const newPendingTransactions = accounts.map((account) => {
      return payload[account.address]
    }).flat(1)

    const filteredTransactions = newPendingTransactions?.filter((tx: BraveWallet.TransactionInfo) => tx?.txStatus === BraveWallet.TransactionStatus.Unapproved) ?? []

    const sortedTransactionList = sortTransactionByDate(filteredTransactions)

    return {
      ...state,
      transactions: payload,
      pendingTransactions: sortedTransactionList,
      selectedPendingTransaction: sortedTransactionList[0]
    }
  })

  reducer.on(WalletActions.addUserAssetError.type, (state: WalletState, payload: boolean): WalletState => {
    return {
      ...state,
      addUserAssetError: payload
    }
  })

  reducer.on(WalletActions.defaultEthereumWalletUpdated.type, (state: WalletState, payload: BraveWallet.DefaultWallet): WalletState => {
    return {
      ...state,
      defaultEthereumWallet: payload
    }
  })

  reducer.on(WalletActions.defaultSolanaWalletUpdated.type, (state: WalletState, payload: BraveWallet.DefaultWallet): WalletState => {
    return {
      ...state,
      defaultSolanaWallet: payload
    }
  })

  reducer.on(WalletActions.activeOriginChanged.type, (state: WalletState, payload: BraveWallet.OriginInfo): WalletState => {
    return {
      ...state,
      activeOrigin: payload
    }
  })

  reducer.on(WalletActions.isEip1559Changed.type, (state: WalletState, payload: IsEip1559Changed): WalletState => {
    const selectedNetwork = state.networkList.find(
      network => network.chainId === payload.chainId
    ) || state.selectedNetwork

    const updatedNetwork: BraveWallet.NetworkInfo = {
      ...selectedNetwork,
      isEip1559: payload.isEip1559
    }

    return {
      ...state,
      selectedNetwork: updatedNetwork,
      networkList: state.networkList.map(
        network => network.chainId === payload.chainId ? updatedNetwork : network
      )
    }
  })

  reducer.on(WalletActions.setGasEstimates.type, (state: WalletState, payload: BraveWallet.GasEstimation1559): WalletState => {
    return {
      ...state,
      gasEstimates: payload
    }
  })

  reducer.on(WalletActions.setSolFeeEstimates.type, (state: WalletState, payload: SolFeeEstimates): WalletState => {
    return {
      ...state,
      solFeeEstimates: payload
    }
  })

  reducer.on(WalletActions.setSitePermissions.type, (state: WalletState, payload: SitePermissionsPayloadType): WalletState => {
    return {
      ...state,
      connectedAccounts: payload.accounts
    }
  })

  reducer.on(WalletActions.queueNextTransaction.type, (state: WalletState): WalletState => {
    const pendingTransactions = state.pendingTransactions

    const index = pendingTransactions.findIndex(
      (tx: BraveWallet.TransactionInfo) => tx.id === state.selectedPendingTransaction?.id
    ) + 1

    let newPendingTransaction = pendingTransactions[index]
    if (pendingTransactions.length === index) {
      newPendingTransaction = pendingTransactions[0]
    }
    return {
      ...state,
      selectedPendingTransaction: newPendingTransaction
    }
  })

  reducer.on(WalletActions.setMetaMaskInstalled.type, (state: WalletState, payload: boolean): WalletState => {
    return {
      ...state,
      isMetaMaskInstalled: payload
    }
  })

  reducer.on(WalletActions.refreshAccountInfo.type, (state: WalletState, payload: WalletInfoBase): WalletState => {
    const accounts = state.accounts

    const updatedAccounts = accounts.map(account => {
      const info = payload.accountInfos.find(info => account.address === info.address)
      if (info) {
        account.name = info.name
      }
      return account
    })

    return {
      ...state,
      accounts: updatedAccounts
    }
  })

  reducer.on(WalletActions.defaultCurrenciesUpdated.type, (state: WalletState, payload: DefaultCurrencies): WalletState => {
    return {
      ...state,
      defaultCurrencies: payload
    }
  })

  reducer.on(WalletActions.setTransactionProviderError.type, (state: WalletState, payload: SetTransactionProviderErrorType): WalletState => {
    return {
      ...state,
      transactionProviderErrorRegistry: {
        ...state.transactionProviderErrorRegistry,
        [payload.transaction.id]: payload.providerError
      }
    }
  })

  reducer.on(WalletActions.setSelectedCoin.type, (state: WalletState, payload: BraveWallet.CoinType): WalletState => {
    return {
      ...state,
      selectedCoin: payload
    }
  })

  reducer.on(WalletActions.setDefaultNetworks.type, (state: WalletState, payload: BraveWallet.NetworkInfo[]): WalletState => {
    return {
      ...state,
      defaultNetworks: payload
    }
  })

  reducer.on(WalletActions.setCoinMarkets.type, (state: WalletState, payload: GetCoinMarketsResponse): WalletState => {
    return {
      ...state,
      coinMarketData: payload.success ? payload.values.map(coin => {
        coin.image = coin.image.replace('https://assets.coingecko.com', ' https://assets.cgproxy.brave.com')
        return coin
      }) : [],
      isLoadingCoinMarketData: false
    }
  })

  reducer.on(WalletActions.setDefaultAccounts.type, (state: WalletState, payload: BraveWallet.AccountInfo[]): WalletState => {
    return {
      ...state,
      defaultAccounts: payload
    }
  })

  reducer.on(WalletActions.setSelectedNetworkFilter.type, (state: WalletState, payload: BraveWallet.NetworkInfo): WalletState => {
    return {
      ...state,
      isFetchingPortfolioPriceHistory: true,
      selectedNetworkFilter: payload
    }
  })

  reducer.on(WalletActions.setShowTestNetworks.type, (state: WalletState, payload: boolean): WalletState => {
    return {
      ...state,
      isTestNetworksEnabled: payload
    }
  })

  reducer.on(WalletActions.setOnRampCurrencies.type, (state: WalletState, payload: BraveWallet.OnRampCurrency[]): WalletState => {
    return {
      ...state,
      onRampCurrencies: payload
    }
  })

  reducer.on(WalletActions.selectCurrency.type, (state: WalletState, payload: BraveWallet.OnRampCurrency): WalletState => {
    return {
      ...state,
      selectedCurrency: payload
    }
  })

  reducer.on(WalletActions.setPasswordAttempts.type, (state: WalletState, payload: number): WalletState => {
    return {
      ...state,
      passwordAttempts: payload
    }
  })

  reducer.on(WalletActions.setSelectedAssetFilterItem.type, (state: WalletState, payload: AssetFilterOption): WalletState => {
    return {
      ...state,
      selectedAssetFilter: payload
    }
  })

  reducer.on(WalletActions.setSelectedAccountFilterItem.type, (state: WalletState, payload: WalletAccountType): WalletState => {
    // We need to add a getPortfolioAccountFilter and setPortfolioAccountFilter pref to persist this value
    // https://github.com/brave/brave-browser/issues/25620
    return {
      ...state,
      isFetchingPortfolioPriceHistory: true,
      selectedAccountFilter: payload
    }
  })

  return reducer
}

const reducer = createWalletReducer(defaultState)

export default reducer
