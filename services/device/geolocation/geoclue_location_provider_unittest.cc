// Copyright (c) 2023 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// You can obtain one at https://mozilla.org/MPL/2.0/.

#include "brave/services/device/geolocation/geoclue_location_provider.h"

#include <memory>
#include <utility>

#include "base/feature_list.h"
#include "base/functional/bind.h"
#include "base/run_loop.h"
#include "base/test/scoped_feature_list.h"
#include "base/test/task_environment.h"
#include "services/device/public/cpp/device_features.h"
#include "services/device/public/mojom/geoposition.mojom.h"
#include "testing/gtest/include/gtest/gtest.h"

namespace device {

class TestGeoClueLocationProvider : public GeoClueLocationProvider {
 public:
  TestGeoClueLocationProvider() = default;
  ~TestGeoClueLocationProvider() override = default;

  bool HasPermission() { return permission_granted_; }

  bool Started() { return client_state_ != kStopped; }

  void SetPositionForTesting(mojom::GeopositionPtr position) {
    SetPosition(mojom::GeopositionResult::NewPosition(std::move(position)));
  }
};

class GeoClueLocationProviderTest : public testing::Test {
 public:
  GeoClueLocationProviderTest() = default;
  ~GeoClueLocationProviderTest() override = default;

  void InitializeProvider() {
    provider_ = std::make_unique<TestGeoClueLocationProvider>();
    provider_->SetUpdateCallback(base::BindRepeating(
        [](GeoClueLocationProviderTest* test, const LocationProvider* provider,
           mojom::GeopositionResultPtr position) {
          test->loop_->Quit();
          test->update_count_++;
        },
        base::Unretained(this)));
  }

  void WaitForUpdate() {
    loop_ = std::make_unique<base::RunLoop>();
    loop_->Run();
  }

 protected:
  base::test::TaskEnvironment task_environment_;
  std::unique_ptr<base::RunLoop> loop_;
  int update_count_ = 0;

  std::unique_ptr<TestGeoClueLocationProvider> provider_;
};

TEST_F(GeoClueLocationProviderTest,
       CreateDestroy) {  // should not crash
  InitializeProvider();
  EXPECT_TRUE(provider_);
  provider_.reset();
}

TEST_F(GeoClueLocationProviderTest, OnPermissionGranted) {
  InitializeProvider();
  EXPECT_FALSE(provider_->HasPermission());
  provider_->OnPermissionGranted();
  EXPECT_TRUE(provider_->HasPermission());
}

TEST_F(GeoClueLocationProviderTest, CanStart) {
  InitializeProvider();
  EXPECT_FALSE(provider_->Started());
  provider_->StartProvider(false);
  EXPECT_TRUE(provider_->Started());
}

TEST_F(GeoClueLocationProviderTest, CanStop) {
  InitializeProvider();
  EXPECT_FALSE(provider_->Started());

  // Shouldn't crash, even though we haven't started.
  provider_->StopProvider();

  EXPECT_FALSE(provider_->Started());

  provider_->StartProvider(true);
  EXPECT_TRUE(provider_->Started());

  provider_->StopProvider();
  EXPECT_FALSE(provider_->Started());

  // Shouldn't crash calling stop a second time, after having started.
  provider_->StopProvider();
  EXPECT_FALSE(provider_->Started());
}

TEST_F(GeoClueLocationProviderTest, CanStopPermissionGranted) {
  InitializeProvider();
  EXPECT_FALSE(provider_->Started());

  provider_->OnPermissionGranted();
  provider_->StopProvider();

  EXPECT_FALSE(provider_->Started());
  EXPECT_TRUE(provider_->HasPermission());
}

TEST_F(GeoClueLocationProviderTest, CanStopStartedAndPermissionGranted) {
  InitializeProvider();

  provider_->OnPermissionGranted();
  provider_->StartProvider(false);

  // Let everything initialize until we get a location
  WaitForUpdate();

  EXPECT_EQ(1, update_count_);
  EXPECT_TRUE(provider_->Started());
  EXPECT_TRUE(provider_->HasPermission());

  // After stopping, further updates should no propagate.
  provider_->StopProvider();

  auto fake_position = mojom::Geoposition::New();
  fake_position->latitude = 0;
  fake_position->longitude = 0;
  fake_position->accuracy = 1;
  fake_position->timestamp = base::Time::Now();
  provider_->SetPositionForTesting(std::move(fake_position));

  EXPECT_EQ(1, update_count_);
}

TEST_F(GeoClueLocationProviderTest, CanRestartProvider) {
  InitializeProvider();

  provider_->OnPermissionGranted();
  provider_->StartProvider(true);
  EXPECT_TRUE(provider_->Started());

  WaitForUpdate();
  EXPECT_EQ(1, update_count_);

  provider_->StopProvider();
  EXPECT_FALSE(provider_->Started());

  provider_->StartProvider(true);

  WaitForUpdate();
  EXPECT_EQ(2, update_count_);
}

TEST_F(GeoClueLocationProviderTest, NoLocationUntilPermissionGranted) {
  InitializeProvider();
  EXPECT_FALSE(provider_->Started());
  EXPECT_FALSE(provider_->HasPermission());
  EXPECT_EQ(0, update_count_);

  provider_->StartProvider(false);
  EXPECT_TRUE(provider_->Started());
  EXPECT_FALSE(provider_->HasPermission());
  EXPECT_EQ(0, update_count_);

  auto fake_position = mojom::Geoposition::New();
  fake_position->latitude = 0;
  fake_position->longitude = 0;
  fake_position->accuracy = 1;
  fake_position->timestamp = base::Time::Now();

  provider_->SetPositionForTesting(fake_position->Clone());
  EXPECT_EQ(0, update_count_);

  provider_->OnPermissionGranted();

  // Wait for the client to initialize.
  WaitForUpdate();
  EXPECT_EQ(1, update_count_);

  fake_position->latitude = 1;
  provider_->SetPositionForTesting(fake_position->Clone());
  EXPECT_EQ(2, update_count_);
}

TEST_F(GeoClueLocationProviderTest, GetsLocation) {
  InitializeProvider();
  provider_->StartProvider(false);
  provider_->OnPermissionGranted();

  WaitForUpdate();
  EXPECT_EQ(1, update_count_);

  EXPECT_LE(provider_->GetPosition()->get_position()->latitude, 90);
  EXPECT_GE(provider_->GetPosition()->get_position()->latitude, -90);
  EXPECT_LE(provider_->GetPosition()->get_position()->longitude, 180);
  EXPECT_GE(provider_->GetPosition()->get_position()->longitude, -180);
  EXPECT_GE(provider_->GetPosition()->get_position()->accuracy, 0);
  EXPECT_FALSE(provider_->GetPosition()->get_position()->timestamp.is_null());
}

TEST_F(GeoClueLocationProviderTest,
       DoesNotInitializeWithoutFeatureAndIsDisabledByDefault) {
  auto provider = MaybeCreateGeoClueLocationProvider();
  EXPECT_FALSE(provider);
}

TEST_F(GeoClueLocationProviderTest, InitializesWithFeature) {
  base::test::ScopedFeatureList features;
  features.InitAndEnableFeature(features::kLinuxGeoClueLocationBackend);
  EXPECT_TRUE(
      base::FeatureList::IsEnabled(features::kLinuxGeoClueLocationBackend));

  auto provider = MaybeCreateGeoClueLocationProvider();
  EXPECT_TRUE(provider);
}

}  // namespace device
