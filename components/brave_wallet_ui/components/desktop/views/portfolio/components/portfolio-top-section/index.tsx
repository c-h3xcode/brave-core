import * as React from 'react'

// Constants
import {
  PriceDataObjectType,
  BraveWallet,
  DefaultCurrencies
} from '../../../../../../constants/types'
import { getLocale } from '../../../../../../../common/locale'
import { CurrencySymbols } from '../../../../../../utils/currency-symbols'

// Utils
import Amount from '../../../../../../utils/amount'

// Options
import { ChartTimelineOptions } from '../../../..//../../options/chart-timeline-options'

// Components
import { BackButton, LoadingSkeleton, withPlaceholderIcon } from '../../../../../shared'
import {
  ChartControlBar,
  LineChart,
  SelectNetworkDropdown,
  WithHideBalancePlaceholder
} from '../../../../'

// Styled Components
import {
  TopRow,
  BalanceTitle,
  BalanceText,
  AssetIcon,
  AssetRow,
  PriceRow,
  AssetNameText,
  DetailText,
  InfoColumn,
  PriceText,
  PercentBubble,
  PercentText,
  ArrowIcon,
  BalanceRow,
  ShowBalanceButton,
  StyledWrapper
} from './style'

export interface Props {
  onChangeTimeline: (path: BraveWallet.AssetPriceTimeframe) => void
  onSelectNetwork: (network: BraveWallet.NetworkInfo) => () => void
  defaultCurrencies: DefaultCurrencies
  selectedNetwork: BraveWallet.NetworkInfo
  networkList: BraveWallet.NetworkInfo[]
  selectedTimeline: BraveWallet.AssetPriceTimeframe
  selectedPortfolioTimeline: BraveWallet.AssetPriceTimeframe
  selectedAsset: BraveWallet.BlockchainToken | undefined
  selectedAssetFiatPrice: BraveWallet.AssetPrice | undefined
  selectedAssetCryptoPrice: BraveWallet.AssetPrice | undefined
  selectedAssetPriceHistory: PriceDataObjectType[]
  portfolioPriceHistory: PriceDataObjectType[]
  portfolioBalance: string
  isLoading: boolean
  isFetchingPortfolioPriceHistory: boolean
  hideBalances?: boolean
  showNetworkSelector: boolean
  showNetworkDropdown?: boolean
  showToggleBalanceButton: boolean
  goBack: () => void
  onToggleHideBalances?: () => void
  toggleShowNetworkDropdown?: () => void
}

const PortfolioTopSection = (props: Props) => {
  const {
    defaultCurrencies,
    selectedNetwork,
    portfolioPriceHistory,
    selectedAssetPriceHistory,
    selectedAssetFiatPrice,
    selectedAssetCryptoPrice,
    selectedTimeline,
    selectedPortfolioTimeline,
    networkList,
    selectedAsset,
    portfolioBalance,
    isLoading,
    isFetchingPortfolioPriceHistory,
    hideBalances,
    showNetworkSelector,
    showToggleBalanceButton,
    showNetworkDropdown,
    goBack,
    onChangeTimeline,
    onSelectNetwork,
    toggleShowNetworkDropdown,
    onToggleHideBalances
  } = props

  const [fullPortfolioFiatBalance, setFullPortfolioFiatBalance] = React.useState<string>(portfolioBalance)
  const [hoverBalance, setHoverBalance] = React.useState<string>()
  const [hoverPrice, setHoverPrice] = React.useState<string>()

  React.useEffect(() => {
    if (portfolioBalance !== '') {
      setFullPortfolioFiatBalance(portfolioBalance)
    }
  }, [portfolioBalance])

  const portfolioHistory = React.useMemo(() => {
    return portfolioPriceHistory
  }, [portfolioPriceHistory])

  const onUpdateBalance = (value: number | undefined) => {
    if (!selectedAsset) {
      if (value) {
        setHoverBalance(new Amount(value).formatAsFiat())
      } else {
        setHoverBalance(undefined)
      }
    } else {
      if (value) {
        setHoverPrice(new Amount(value).formatAsFiat())
      } else {
        setHoverPrice(undefined)
      }
    }
  }

  const priceHistory = React.useMemo(() => {
    if (parseFloat(portfolioBalance) === 0) {
      return []
    } else {
      return portfolioHistory
    }
  }, [portfolioHistory, portfolioBalance])

  const AssetIconWithPlaceholder = React.useMemo(() => {
    return withPlaceholderIcon(AssetIcon, { size: 'big', marginLeft: 0, marginRight: 12 })
  }, [])

  const onClickNetworkDropdown = () => {
    if (toggleShowNetworkDropdown) {
      toggleShowNetworkDropdown()
    }
  }

  return (
    <StyledWrapper>
      <TopRow>
        <BalanceRow>
          {!selectedAsset ? (
            <BalanceTitle>{getLocale('braveWalletBalance')}</BalanceTitle>
          ) : (
            <BackButton onSubmit={goBack} />
          )}
          {showNetworkSelector && !selectedAsset?.isErc721 &&
            <SelectNetworkDropdown
              onClick={onClickNetworkDropdown}
              networkList={networkList}
              showNetworkDropDown={showNetworkDropdown || false}
              selectedNetwork={selectedNetwork}
              onSelectNetwork={onSelectNetwork}
            />
          }
        </BalanceRow>
        <BalanceRow>
          {!selectedAsset?.isErc721 &&
            <ChartControlBar
              onSubmit={onChangeTimeline}
              selectedTimeline={selectedAsset ? selectedTimeline : selectedPortfolioTimeline}
              timelineOptions={ChartTimelineOptions()}
            />
          }
          {showToggleBalanceButton &&
            <ShowBalanceButton
              hideBalances={hideBalances}
              onClick={onToggleHideBalances}
            />
          }
        </BalanceRow>
      </TopRow>
      {!selectedAsset ? (
        <WithHideBalancePlaceholder
          size='big'
          hideBalances={hideBalances || false}
        >
          <BalanceText>
            {fullPortfolioFiatBalance !== ''
              ? `${CurrencySymbols[defaultCurrencies.fiat]}${hoverBalance || fullPortfolioFiatBalance}`
              : <LoadingSkeleton width={150} height={32} />
            }
          </BalanceText>
        </WithHideBalancePlaceholder>
      ) : (
        <>
          {!selectedAsset.isErc721 &&
            <InfoColumn>
              <AssetRow>
                <AssetIconWithPlaceholder asset={selectedAsset} network={selectedNetwork} />
                <AssetNameText>{selectedAsset.name}</AssetNameText>
              </AssetRow>
              <DetailText>{selectedAsset.name} {getLocale('braveWalletPrice')} ({selectedAsset.symbol})</DetailText>
              <PriceRow>
                <PriceText>{CurrencySymbols[defaultCurrencies.fiat]}{hoverPrice || (selectedAssetFiatPrice ? new Amount(selectedAssetFiatPrice.price).formatAsFiat() : 0.00)}</PriceText>
                <PercentBubble isDown={selectedAssetFiatPrice ? Number(selectedAssetFiatPrice.assetTimeframeChange) < 0 : false}>
                  <ArrowIcon isDown={selectedAssetFiatPrice ? Number(selectedAssetFiatPrice.assetTimeframeChange) < 0 : false} />
                  <PercentText>{selectedAssetFiatPrice ? Number(selectedAssetFiatPrice.assetTimeframeChange).toFixed(2) : 0.00}%</PercentText>
                </PercentBubble>
              </PriceRow>
              <DetailText>
                {
                  selectedAssetCryptoPrice
                    ? new Amount(selectedAssetCryptoPrice.price)
                      .formatAsAsset(undefined, defaultCurrencies.crypto)
                    : ''
                }
              </DetailText>
            </InfoColumn>
          }
        </>
      )}
      {!selectedAsset?.isErc721 &&
        <LineChart
          isDown={selectedAsset && selectedAssetFiatPrice ? Number(selectedAssetFiatPrice.assetTimeframeChange) < 0 : false}
          isAsset={!!selectedAsset}
          priceData={selectedAsset ? selectedAssetPriceHistory : priceHistory}
          onUpdateBalance={onUpdateBalance}
          isLoading={selectedAsset ? isLoading : parseFloat(portfolioBalance) === 0 ? false : isFetchingPortfolioPriceHistory}
          isDisabled={selectedAsset ? false : parseFloat(portfolioBalance) === 0}
        />
      }
    </StyledWrapper>
  )
}

export default PortfolioTopSection
