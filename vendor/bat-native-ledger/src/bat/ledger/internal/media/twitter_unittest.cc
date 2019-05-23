/* Copyright (c) 2019 The Brave Authors. All rights reserved.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "bat/ledger/internal/media/twitter.h"
#include "testing/gtest/include/gtest/gtest.h"

// npm run test -- brave_unit_tests --filter=MediaTwitterTest.*

namespace braveledger_media {

class MediaTwitterTest : public testing::Test {
};

TEST(MediaTwitterTest, GetProfileURL) {
  // screen_name is empty
  std::string result = braveledger_media::MediaTwitter::GetProfileURL("");
  ASSERT_EQ(result, "");

  // all good
  result = braveledger_media::MediaTwitter::GetProfileURL("emerick");
  ASSERT_EQ(result, "https://twitter.com/emerick/");
}

TEST(MediaTwitterTest, GetProfileImageURL) {
  // screen_name is empty
  std::string result = braveledger_media::MediaTwitter::GetProfileImageURL("");
  ASSERT_EQ(result, "");

  // all good
  result = braveledger_media::MediaTwitter::GetProfileImageURL("emerick");
  ASSERT_EQ(result, "https://twitter.com/emerick/profile_image?size=original");
}

TEST(MediaTwitterTest, GetPublisherKey) {
  // key is empty
  std::string result = braveledger_media::MediaTwitter::GetPublisherKey("");
  ASSERT_EQ(result, "");

  // all good
  result = braveledger_media::MediaTwitter::GetPublisherKey("213234");
  ASSERT_EQ(result, "twitter#channel:213234");
}

TEST(MediaTwitterTest, GetMediaKey) {
  // screen_name is empty
  std::string result = braveledger_media::MediaTwitter::GetMediaKey("");
  ASSERT_EQ(result, "");

  // all good
  result = braveledger_media::MediaTwitter::GetMediaKey("emerick");
  ASSERT_EQ(result, "twitter_emerick");
}

TEST(MediaTwitterTest, GetUserNameFromUrl) {
  // screen_name is empty
  std::string result = braveledger_media::MediaTwitter::GetUserNameFromUrl("");
  ASSERT_EQ(result, "");

  // empty path
  result = braveledger_media::MediaTwitter::
      GetUserNameFromUrl("/");
  ASSERT_EQ(result, "");

  // simple path
  result = braveledger_media::MediaTwitter::
      GetUserNameFromUrl("/emerick");
  ASSERT_EQ(result, "emerick");

  // long path
  result = braveledger_media::MediaTwitter::
      GetUserNameFromUrl("/emerick/news");
  ASSERT_EQ(result, "emerick");
}

TEST(MediaTwitterTest, IsExcludedPath) {
  // path is empty
  bool result = braveledger_media::MediaTwitter::IsExcludedPath("");
  ASSERT_EQ(result, true);

  // path is simple excluded link
  result =
      braveledger_media::MediaTwitter::IsExcludedPath("/home");
  ASSERT_EQ(result, true);

  // path is simple excluded link with trailing /
  result =
      braveledger_media::MediaTwitter::IsExcludedPath("/home/");
  ASSERT_EQ(result, true);
  ASSERT_EQ(result, true);

  // path is complex excluded link
  result =
      braveledger_media::MediaTwitter::IsExcludedPath("/i/");
  ASSERT_EQ(result, true);

  // path is complex excluded link two levels
  result =
      braveledger_media::MediaTwitter::IsExcludedPath("/i/settings");
  ASSERT_EQ(result, true);

  // path is random link
  result =
      braveledger_media::MediaTwitter::IsExcludedPath("/asdfs/asdfasdf/");
  ASSERT_EQ(result, false);

  // path is not excluded link
  result =
      braveledger_media::MediaTwitter::IsExcludedPath("/emerick");
  ASSERT_EQ(result, false);
}

TEST(MediaTwitterTest, GetUserId) {
  const char profile_old[] =
      "<div class=\"wrapper\">"
      "<div class=\"ProfileNav\" role=\"navigation\" data-user-id=\"123\">"
      "emerick</div></div>";
  const char profile_new[] =
      "<div class=\"wrapper\">"
      "<img src=\"https://pbs.twimg.com/profile_banners/123/profile.jpg\" />"
      "</div>";

  // response is empty
  std::string result = braveledger_media::MediaTwitter::GetUserId("");
  ASSERT_EQ(result, "");

  // html is not correct
  result =
      braveledger_media::MediaTwitter::GetUserId("<div>Hi</div>");
  ASSERT_EQ(result, "");

  // support for current Twitter
  result =
      braveledger_media::MediaTwitter::GetUserId(profile_old);
  ASSERT_EQ(result, "123");

  // support for new Twitter
  result =
      braveledger_media::MediaTwitter::GetUserId(profile_new);
  ASSERT_EQ(result, "123");
}

TEST(MediaTwitterTest, GetPublisherName) {
  // response is empty
  std::string result =
      braveledger_media::MediaTwitter::GetPublisherName("", "emerick");
  ASSERT_EQ(result, "");

  // without twitter
  result = braveledger_media::MediaTwitter::
      GetPublisherName("<title>Hi</title>", "emerick");
  ASSERT_EQ(result, "Hi");

  // current twitter
  result = braveledger_media::MediaTwitter::
      GetPublisherName("<title>Name (@emerick) / Twitter</title>", "emerick");
  ASSERT_EQ(result, "Name");

  // new twitter
  result = braveledger_media::MediaTwitter::
      GetPublisherName("<title>Name (@emerick) | Twitter</title>", "emerick");
  ASSERT_EQ(result, "Name");
}

}  // namespace braveledger_media
