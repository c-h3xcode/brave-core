/* Copyright (c) 2023 The Brave Authors. All rights reserved.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at https://mozilla.org/MPL/2.0/. */

#include "brave/components/brave_wallet/browser/siwe_message_parser.h"

#include "base/logging.h"
#include "base/strings/strcat.h"
#include "base/strings/string_tokenizer.h"
#include "brave/components/brave_wallet/common/eth_address.h"
#include "url/gurl.h"
#include "url/origin.h"
#include "url/url_constants.h"

using base::StringTokenizer;

namespace brave_wallet {

namespace {
constexpr char kStartingToken[] =
    " wants you to sign in with your Ethereum account:";
constexpr char kURIToken[] = "URI: ";
constexpr char kVersionToken[] = "Version: ";
constexpr char kChainIdToken[] = "Chain ID: ";
constexpr char kNonceToken[] = "Nonce: ";

bool ConsumeDelim(StringTokenizer* tokenizer) {
  CHECK(tokenizer);
  if (!tokenizer->GetNext() || !tokenizer->token_is_delim()) {
    return false;
  }
  return true;
}

bool CheckField(const std::string& input, const std::string& token) {
  std::string::size_type n = input.find(token);
  if (n == std::string::npos || n != 0) {
    return false;
  }
  return true;
}

bool FillStringField(StringTokenizer* tokenizer,
                     const std::string& input,
                     const std::string& token,
                     std::string& field) {
  CHECK(tokenizer);
  if (!CheckField(input, token)) {
    return false;
  }
  field = input.substr(token.length());
  if (field.empty()) {
    return false;
  }
  if (!ConsumeDelim(tokenizer)) {
    field.clear();
    return false;
  }
  return true;
}
}  // namespace

mojom::SIWEMessagePtr SIWEMessageParser::Parse(const std::string& message) {
  state_ = State::kStart;
  StringTokenizer tokenizer(message, "\n");
  tokenizer.set_options(StringTokenizer::RETURN_DELIMS);
  auto result = mojom::SIWEMessage::New();
  while (tokenizer.GetNext()) {
    const std::string& token = tokenizer.token();
    switch (state_) {
      case State::kStart: {
        std::string::size_type n = token.find(kStartingToken);
        if (!n || n == std::string::npos) {
          return {};
        }
        // missing line feed
        if (token.substr(n) != kStartingToken) {
          return {};
        }
        const std::string& old_origin_str = token.substr(0, n);
        std::string new_origin_str(old_origin_str);
        // If scheme is not specified, https will be used by default.
        if (old_origin_str.find(url::kStandardSchemeSeparator) ==
            std::string::npos) {
          new_origin_str =
              base::StrCat({url::kHttpsScheme, url::kStandardSchemeSeparator,
                            old_origin_str});
        }
        GURL url(new_origin_str);
        if (!url.is_valid()) {
          return {};
        }
        result->origin = url::Origin::Create(url);
        if (!ConsumeDelim(&tokenizer)) {
          return {};
        }
        state_ = State::kAddress;
        break;
      }
      case State::kAddress:
        if (!EthAddress::IsValidAddress(token)) {
          return result;
        }
        result->address = token;
        if (!ConsumeDelim(&tokenizer)) {
          return result;
        }
        state_ = State::kStatement;
        break;
      case State::kStatement:
        // Check starting line feed and check it is not the end
        if (!tokenizer.token_is_delim() || !tokenizer.GetNext()) {
          return result;
        }
        // If it is already ending line, does nothing and move to next state
        if (!tokenizer.token_is_delim()) {
          result->statement = tokenizer.token();
          // Consume both statement and ending line feed
          if (!ConsumeDelim(&tokenizer) || !ConsumeDelim(&tokenizer)) {
            result->statement.reset();
            return result;
          }
        }
        state_ = State::kURI;
        break;
      case State::kURI:
        if (!CheckField(token, kURIToken)) {
          return result;
        }
        result->uri = GURL(token.substr(strlen(kURIToken)));
        if (!result->uri.is_valid() || !ConsumeDelim(&tokenizer)) {
          result->uri = GURL();
          return result;
        }
        state_ = State::kVersion;
        break;
      case State::kVersion:
        if (!CheckField(token, kVersionToken)) {
          return result;
        }
        if (!base::StringToUint(token.substr(strlen(kVersionToken)),
                                &result->version)) {
          return result;
        }
        // The only supported version should be 1
        if (result->version != 1 || !ConsumeDelim(&tokenizer)) {
          result->version = 0;
          return result;
        }
        state_ = State::kChainId;
        break;
      case State::kChainId:
        if (!FillStringField(&tokenizer, token, kChainIdToken,
                             result->chain_id)) {
          return result;
        }
        state_ = State::kNonce;
        break;
      case State::kNonce:
        if (!FillStringField(&tokenizer, token, kNonceToken, result->nonce)) {
          return result;
        }
        state_ = State::kIssuedAt;
        break;
      default:
        break;
    }
  }
  if (state_ == State::kStart) {
    return {};
  } else {
    return result;
  }
}
void SIWEMessageParser::Iterate(const std::string& message) {
  StringTokenizer tokenizer(message, "\n");
  tokenizer.set_options(StringTokenizer::RETURN_DELIMS);
  LOG(ERROR) << "=============================================================";
  while (tokenizer.GetNext()) {
    LOG(ERROR) << tokenizer.token();
  }
  LOG(ERROR) << "=============================================================";
}

// static
std::string SIWEMessageParser::GetStartingTokenForTesting() {
  return kStartingToken;
}

// static
std::string SIWEMessageParser::GetURITokenForTesting() {
  return kURIToken;
}

// static
std::string SIWEMessageParser::GetVersionTokenForTesting() {
  return kVersionToken;
}

// static
std::string SIWEMessageParser::GetChainIdTokenForTesting() {
  return kChainIdToken;
}

// static
std::string SIWEMessageParser::GetNonceTokenForTesting() {
  return kNonceToken;
}

}  // namespace brave_wallet
