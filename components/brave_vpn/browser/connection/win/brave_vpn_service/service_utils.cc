#include "brave/components/brave_vpn/browser/connection/win/brave_vpn_service/service_utils.h"

#include "base/logging.h"
#include "chrome/install_static/install_util.h"
#include "brave/components/brave_vpn/browser/connection/win/brave_vpn_service/scoped_sc_handle.h"

namespace brave_vpn {

namespace {

HRESULT HRESULTFromLastError() {
  const auto error_code = ::GetLastError();
  return (error_code != NO_ERROR) ? HRESULT_FROM_WIN32(error_code) : E_FAIL;
}

}  // namespace

std::wstring GetVpnServiceDisplayName() {
  static constexpr wchar_t kBraveVpnServiceDisplayName[] = L" Vpn Service";
  return install_static::GetBaseAppName() + kBraveVpnServiceDisplayName;
}

std::wstring GetVpnServiceName() {
  std::wstring name = GetVpnServiceDisplayName();
  name.erase(std::remove_if(name.begin(), name.end(), isspace), name.end());
  return name;
}

bool ConfigureServiceAutoRestart(const std::wstring& service_name) {
  ScopedScHandle scm(::OpenSCManager(nullptr, nullptr, SC_MANAGER_CONNECT));
  if (!scm.IsValid()) {
    LOG(ERROR) << "::OpenSCManager failed. service_name: " << service_name
               << ", error: " << std::hex << HRESULTFromLastError();
    return false;
  }
  ScopedScHandle service(
      ::OpenService(scm.Get(), service_name.c_str(), SERVICE_ALL_ACCESS));
  if (!service.IsValid()) {
    LOG(ERROR) << "::OpenService failed. service_name: " << service_name
               << ", error: " << std::hex << HRESULTFromLastError();
    return false;
  }

  if (!SetServiceFailActions(service.Get())) {
    LOG(ERROR) << "SetServiceFailActions failed:" << std::hex
               << HRESULTFromLastError();
    return false;
  }

  return true;
}

bool SetServiceFailActions(SC_HANDLE service) {
  SC_ACTION failActions[] = {
      {SC_ACTION_RESTART, 1}, {SC_ACTION_RESTART, 1}, {SC_ACTION_RESTART, 1}};
  // The time after which to reset the failure count to zero if there are no
  // failures, in seconds.
  SERVICE_FAILURE_ACTIONS servFailActions = {
      .dwResetPeriod = 0,
      .lpRebootMsg = NULL,
      .lpCommand = NULL,
      .cActions = sizeof(failActions) / sizeof(SC_ACTION),
      .lpsaActions = failActions};
  return ChangeServiceConfig2(service, SERVICE_CONFIG_FAILURE_ACTIONS,
                              &servFailActions);
}

}  // namespace brave_vpn
