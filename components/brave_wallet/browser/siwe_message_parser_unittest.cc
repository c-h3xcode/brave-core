/* Copyright (c) 2023 The Brave Authors. All rights reserved.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at https://mozilla.org/MPL/2.0/. */

#include <string>

#include "base/strings/strcat.h"
#include "brave/components/brave_wallet/browser/siwe_message_parser.h"
#include "testing/gtest/include/gtest/gtest.h"
#include "url/gurl.h"
#include "url/origin.h"
#include "url/url_constants.h"

namespace brave_wallet {

class SIWEMessageParserTest : public testing::Test {
 public:
  SIWEMessageParserTest() = default;
  ~SIWEMessageParserTest() override = default;

  void CheckState(int state) {
    EXPECT_EQ(static_cast<int>(parser_.state_), state);
  }

  std::string starting_token() { return parser_.GetStartingTokenForTesting(); }
  std::string uri_token() { return parser_.GetURITokenForTesting(); }
  std::string version_token() { return parser_.GetVersionTokenForTesting(); }
  std::string chain_id_token() { return parser_.GetChainIdTokenForTesting(); }
  std::string nonce_token() { return parser_.GetNonceTokenForTesting(); }

 protected:
  SIWEMessageParser parser_;
};

TEST_F(SIWEMessageParserTest, Start) {
  for (const std::string& invalid_case : {
           std::string(""),
           std::string("\n"),
           std::string("wants you to sign in with your Ethereum account:\n"),
           starting_token(),
           base::StrCat({starting_token(), "\n"}),
           base::StrCat({"example.com", starting_token(),
                         "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"}),
           std::string(
               "example.comwants you to sign in with your Ethereum account:\n"),
           base::StrCat({"://example.com", starting_token(), "\n"}),
           base::StrCat({"example.com:abc", starting_token(), "\n"}),
           base::StrCat({"example.com::3388", starting_token(), "\n"}),
       }) {
    SCOPED_TRACE(testing::Message() << "\"" << invalid_case << "\"");
    EXPECT_FALSE(parser_.Parse(invalid_case));
    // Check if we are still in State::kStart
    CheckState(0);
  }

  const struct {
    std::string origin_str;
    std::string expected_origin_str;
  } valid_cases[] = {
      {"example.com", "https://example.com"},
      {"example.com:3388", "https://example.com:3388"},
      {"http://example.com:3388", "http://example.com:3388"},
      {"https://example.com", "https://example.com"},
  };
  for (const auto& valid_case : valid_cases) {
    const std::string message =
        base::StrCat({valid_case.origin_str, starting_token(), "\n"});
    SCOPED_TRACE(testing::Message() << "\"" << message << "\"");
    auto result = parser_.Parse(message);
    ASSERT_TRUE(result);
    EXPECT_EQ(result->origin,
              url::Origin::Create(GURL(valid_case.expected_origin_str)));
    // It would proceed to State::kAddress but still invalid
    CheckState(1);
    EXPECT_FALSE(result->is_valid);
  }
}

TEST_F(SIWEMessageParserTest, Address) {
  const std::string message_prefix =
      base::StrCat({"example.com", starting_token(), "\n"});
  for (const std::string& invalid_case : {
           "",
           "\n",
           "C02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\n",
           "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2abcd\n",
           "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C75\n",
           "0xxC02aaA39b223FE8D0A0e5C4F27eAD9083C75\n",
       }) {
    const std::string message = base::StrCat({message_prefix, invalid_case});
    SCOPED_TRACE(testing::Message() << "\"" << message << "\"");
    auto result = parser_.Parse(message);
    ASSERT_TRUE(result);
    EXPECT_TRUE(result->address.empty());
    // Check if we are still in State::kAddress
    CheckState(1);
    EXPECT_FALSE(result->is_valid);
  }
  auto result = parser_.Parse(base::StrCat(
      {message_prefix, "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\n"}));
  ASSERT_TRUE(result);
  EXPECT_EQ(result->address, "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
  // It would proceed to State::kStatement but still invalid
  CheckState(2);
  EXPECT_FALSE(result->is_valid);
}

TEST_F(SIWEMessageParserTest, Statement) {
  const std::string message_prefix =
      base::StrCat({"example.com", starting_token(), "\n",
                    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\n"});
  for (const std::string& invalid_case : {
           "",
           "\n",
           "statement",
           "\nstatement",
           "\nstatement\n",
       }) {
    const std::string message = base::StrCat({message_prefix, invalid_case});
    SCOPED_TRACE(testing::Message() << "\"" << message << "\"");
    auto result = parser_.Parse(message);
    ASSERT_TRUE(result);
    EXPECT_FALSE(result->statement);
    // Check if we are still in State::kStatement
    CheckState(2);
    EXPECT_FALSE(result->is_valid);
  }
  for (const std::string& valid_case : {
           "\n\n",
           "\nexample statement\n\n",
       }) {
    const std::string message = base::StrCat({message_prefix, valid_case});
    SCOPED_TRACE(testing::Message() << "\"" << message << "\"");
    auto result = parser_.Parse(message);
    ASSERT_TRUE(result);
    if (valid_case == "\n\n") {
      EXPECT_FALSE(result->statement);
    } else {
      ASSERT_TRUE(result->statement);
      EXPECT_EQ(*(result->statement), "example statement");
    }
    // It would proceed to kURI but still invalid
    CheckState(3);
    EXPECT_FALSE(result->is_valid);
  }
}

TEST_F(SIWEMessageParserTest, URI) {
  const std::string example_uri("https://example.com/login");
  const std::string message_prefix =
      base::StrCat({"example.com", starting_token(), "\n",
                    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\n\n\n"});
  for (const auto& invalid_case : {
           std::string(""),
           std::string("\n"),
           example_uri,
           uri_token(),
           base::StrCat({uri_token(), example_uri}),
           base::StrCat({example_uri, "\n"}),
           base::StrCat({uri_token(), "\n"}),
           base::StrCat({"\n", uri_token(), example_uri, "\n"}),
           base::StrCat({"abc ", uri_token(), example_uri, "\n"}),
           base::StrCat({uri_token().substr(uri_token().size() - 1),
                         example_uri, "\n"}),  // URI:https://example.com/login
           base::StrCat({uri_token(), example_uri.substr(8),
                         "\n"}),  // URI: example.com/login
           base::StrCat({uri_token(), "example", "\n"}),
       }) {
    const std::string message = base::StrCat({message_prefix, invalid_case});
    SCOPED_TRACE(testing::Message() << "\"" << message << "\"");
    auto result = parser_.Parse(message);
    ASSERT_TRUE(result);
    EXPECT_FALSE(result->uri.is_valid());
    // Check if we are still in State::kURI
    CheckState(3);
    EXPECT_FALSE(result->is_valid);
  }
  auto result = parser_.Parse(
      base::StrCat({message_prefix, uri_token(), example_uri, "\n"}));
  ASSERT_TRUE(result);
  EXPECT_EQ(result->uri, GURL(example_uri));
  // It would proceed to State::kVersion but still invalid
  CheckState(4);
  EXPECT_FALSE(result->is_valid);
}

TEST_F(SIWEMessageParserTest, Version) {
  const std::string message_prefix =
      base::StrCat({"example.com", starting_token(), "\n",
                    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\n\n\n",
                    uri_token(), "https://example.com/login\n"});
  for (const auto& invalid_case : {
           std::string(""),
           std::string("\n"),
           version_token(),
           std::string("1"),
           base::StrCat({version_token(), "1"}),
           base::StrCat({version_token(), "\n"}),
           std::string("1\n"),
           base::StrCat({"\n", version_token(), "1", "\n"}),
           base::StrCat({"abc ", version_token(), "1", "\n"}),
           base::StrCat(
               {version_token().substr(version_token().size() - 1), "1", "\n"}),
           base::StrCat({version_token(), "abc123", "\n"}),
           base::StrCat({version_token(), "123", "\n"}),
       }) {
    const std::string message = base::StrCat({message_prefix, invalid_case});
    SCOPED_TRACE(testing::Message() << "\"" << message << "\"");
    auto result = parser_.Parse(message);
    ASSERT_TRUE(result);
    EXPECT_EQ(result->version, 0u);
    // Check if we are still in State::kVersion
    CheckState(4);
    EXPECT_FALSE(result->is_valid);
  }
  auto result =
      parser_.Parse(base::StrCat({message_prefix, version_token(), "1\n"}));
  ASSERT_TRUE(result);
  EXPECT_EQ(result->version, 1u);
  // It would proceed to State::kChainId but still invalid
  CheckState(5);
  EXPECT_FALSE(result->is_valid);
}

TEST_F(SIWEMessageParserTest, ChainId) {
  const std::string message_prefix = base::StrCat(
      {"example.com", starting_token(), "\n",
       "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\n\n\n", uri_token(),
       "https://example.com/login\n", version_token(), "1\n"});
  for (const auto& invalid_case : {
           std::string(""),
           std::string("\n"),
           chain_id_token(),
           std::string("1"),
           base::StrCat({chain_id_token(), "1"}),
           base::StrCat({chain_id_token(), "\n"}),
           std::string("1\n"),
           base::StrCat({"\n", chain_id_token(), "1", "\n"}),
           base::StrCat({"abc ", chain_id_token(), "1", "\n"}),
           base::StrCat({chain_id_token().substr(chain_id_token().size() - 1),
                         "1", "\n"}),
       }) {
    const std::string message = base::StrCat({message_prefix, invalid_case});
    SCOPED_TRACE(testing::Message() << "\"" << message << "\"");
    auto result = parser_.Parse(message);
    ASSERT_TRUE(result);
    EXPECT_TRUE(result->chain_id.empty());
    // Check if we are still in State::kChainId
    CheckState(5);
    EXPECT_FALSE(result->is_valid);
  }
  auto result =
      parser_.Parse(base::StrCat({message_prefix, chain_id_token(), "1\n"}));
  ASSERT_TRUE(result);
  EXPECT_EQ(result->chain_id, "1");
  // It would proceed to State::kNonce but still invalid
  CheckState(6);
  EXPECT_FALSE(result->is_valid);
}

TEST_F(SIWEMessageParserTest, Nonce) {
  const std::string message_prefix =
      base::StrCat({"example.com", starting_token(), "\n",
                    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\n\n\n",
                    uri_token(), "https://example.com/login\n", version_token(),
                    "1\n", chain_id_token(), "1\n"});
  for (const auto& invalid_case : {
           std::string(""),
           std::string("\n"),
           nonce_token(),
           std::string("32891756"),
           base::StrCat({nonce_token(), "32891756"}),
           base::StrCat({nonce_token(), "\n"}),
           std::string("1\n"),
           base::StrCat({"\n", nonce_token(), "32891756", "\n"}),
           base::StrCat({"abc ", nonce_token(), "32891756", "\n"}),
           base::StrCat({nonce_token().substr(nonce_token().size() - 1),
                         "32891756", "\n"}),
       }) {
    const std::string message = base::StrCat({message_prefix, invalid_case});
    SCOPED_TRACE(testing::Message() << "\"" << message << "\"");
    auto result = parser_.Parse(message);
    ASSERT_TRUE(result);
    EXPECT_TRUE(result->nonce.empty());
    // Check if we are still in State::kNonce
    CheckState(6);
    EXPECT_FALSE(result->is_valid);
  }
  auto result = parser_.Parse(
      base::StrCat({message_prefix, nonce_token(), "32891756\n"}));
  ASSERT_TRUE(result);
  EXPECT_EQ(result->nonce, "32891756");
  // It would proceed to State::kIssuedAt but still invalid
  CheckState(7);
  EXPECT_FALSE(result->is_valid);
}

}  // namespace brave_wallet
