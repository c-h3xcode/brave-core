/* Copyright (c) 2022 The Brave Authors. All rights reserved.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at https://mozilla.org/MPL/2.0/. */

#ifndef BRAVE_COMPONENTS_BRAVE_WALLET_COMMON_COMMON_UTIL_H_
#define BRAVE_COMPONENTS_BRAVE_WALLET_COMMON_COMMON_UTIL_H_

#include <stddef.h>
#include <vector>

class PrefService;

namespace brave_wallet {

bool IsAllowed(PrefService* prefs);

std::vector<uint8_t> Leb128Encode(size_t value);

}  // namespace brave_wallet

#endif  // BRAVE_COMPONENTS_BRAVE_WALLET_COMMON_COMMON_UTIL_H_
