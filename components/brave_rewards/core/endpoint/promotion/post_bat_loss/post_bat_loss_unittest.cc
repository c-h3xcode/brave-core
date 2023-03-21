/* Copyright (c) 2020 The Brave Authors. All rights reserved.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at https://mozilla.org/MPL/2.0/. */
#include "brave/components/brave_rewards/core/endpoint/promotion/post_bat_loss/post_bat_loss.h"

#include <string>
#include <utility>
#include <vector>

#include "base/test/task_environment.h"
#include "brave/components/brave_rewards/core/ledger.h"
#include "brave/components/brave_rewards/core/ledger_client_mock.h"
#include "brave/components/brave_rewards/core/ledger_impl_mock.h"
#include "brave/components/brave_rewards/core/state/state_keys.h"
#include "net/http/http_status_code.h"
#include "testing/gtest/include/gtest/gtest.h"

// npm run test -- brave_unit_tests --filter=PostBatLossTest.*

using ::testing::_;
using ::testing::Invoke;

namespace ledger {
namespace endpoint {
namespace promotion {

class PostBatLossTest : public testing::Test {
 protected:
  void SetUp() override {
    const std::string wallet = R"({
      "payment_id":"fa5dea51-6af4-44ca-801b-07b6df3dcfe4",
      "recovery_seed":"AN6DLuI2iZzzDxpzywf+IKmK1nzFRarNswbaIDI3pQg="
    })";
    ON_CALL(*mock_ledger_impl_.ledger_client(),
            GetStringState(state::kWalletBrave))
        .WillByDefault(testing::Return(wallet));
  }

  base::test::TaskEnvironment task_environment_;
  MockLedgerImpl mock_ledger_impl_;
  PostBatLoss loss_{&mock_ledger_impl_};
};

TEST_F(PostBatLossTest, ServerOK) {
  ON_CALL(*mock_ledger_impl_.ledger_client(), LoadURL(_, _))
      .WillByDefault(Invoke(
          [](mojom::UrlRequestPtr request, client::LoadURLCallback callback) {
            mojom::UrlResponse response;
            response.status_code = 200;
            response.url = request->url;
            response.body = "";
            std::move(callback).Run(response);
          }));

  loss_.Request(30.0, 1, [](const mojom::Result result) {
    EXPECT_EQ(result, mojom::Result::LEDGER_OK);
  });
}

TEST_F(PostBatLossTest, ServerError500) {
  ON_CALL(*mock_ledger_impl_.ledger_client(), LoadURL(_, _))
      .WillByDefault(Invoke(
          [](mojom::UrlRequestPtr request, client::LoadURLCallback callback) {
            mojom::UrlResponse response;
            response.status_code = 500;
            response.url = request->url;
            response.body = "";
            std::move(callback).Run(response);
          }));

  loss_.Request(30.0, 1, [](const mojom::Result result) {
    EXPECT_EQ(result, mojom::Result::LEDGER_ERROR);
  });
}

TEST_F(PostBatLossTest, ServerErrorRandom) {
  ON_CALL(*mock_ledger_impl_.ledger_client(), LoadURL(_, _))
      .WillByDefault(Invoke(
          [](mojom::UrlRequestPtr request, client::LoadURLCallback callback) {
            mojom::UrlResponse response;
            response.status_code = 453;
            response.url = request->url;
            response.body = "";
            std::move(callback).Run(response);
          }));

  loss_.Request(30.0, 1, [](const mojom::Result result) {
    EXPECT_EQ(result, mojom::Result::LEDGER_ERROR);
  });
}

}  // namespace promotion
}  // namespace endpoint
}  // namespace ledger
