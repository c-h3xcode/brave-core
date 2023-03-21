/* Copyright (c) 2019 The Brave Authors. All rights reserved.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at https://mozilla.org/MPL/2.0/. */

#ifndef BRAVE_COMPONENTS_BRAVE_REWARDS_CORE_LEDGER_IMPL_MOCK_H_
#define BRAVE_COMPONENTS_BRAVE_REWARDS_CORE_LEDGER_IMPL_MOCK_H_

#include "brave/components/brave_rewards/core/ledger_client.h"
#include "brave/components/brave_rewards/core/ledger_client_mock.h"
#include "brave/components/brave_rewards/core/ledger_impl.h"
#include "testing/gmock/include/gmock/gmock.h"

namespace ledger {

class MockLedgerImpl : public LedgerImpl {
 public:
  MockLedgerImpl();

  ~MockLedgerImpl() override;

  MockLedgerClient* ledger_client() const;

  MOCK_CONST_METHOD0(database, database::Database*());

  MOCK_CONST_METHOD0(promotion, promotion::Promotion*());

  MOCK_METHOD2(Initialize, void(bool, ledger::LegacyResultCallback));
};

}  // namespace ledger

#endif  // BRAVE_COMPONENTS_BRAVE_REWARDS_CORE_LEDGER_IMPL_MOCK_H_
