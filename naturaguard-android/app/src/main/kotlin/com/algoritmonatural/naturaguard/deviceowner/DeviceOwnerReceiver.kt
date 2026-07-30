package com.algoritmonatural.naturaguard.deviceowner

import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import com.algoritmonatural.naturaguard.shared.EventLogger
import com.algoritmonatural.naturaguard.shared.Severity
import com.algoritmonatural.naturaguard.shared.SecurityEvent

/**
 * Dedicated-device mode. Android's own provisioning flow is the guardrail
 * here, not this code: Device Owner can only be set via QR/NFC
 * provisioning on a factory-reset device, or `adb shell dpm set-device-owner`
 * with no other accounts present. There is no API path from inside a
 * normal running app to silently become Device Owner on a device already
 * in use by someone else — which is exactly why this mode is the only
 * approved gate for the surveillance-adjacent features
 * (mobile-android-agent's non-negotiable rule).
 */
class DeviceOwnerReceiver : DeviceAdminReceiver() {

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        EventLogger(context).log(
            SecurityEvent(
                type = "device_owner_enabled",
                severity = Severity.INFO,
                message = "Modo dispositivo dedicado (Device Owner) ativado.",
                source = "deviceowner",
            )
        )
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        EventLogger(context).log(
            SecurityEvent(
                type = "device_owner_disabled",
                severity = Severity.WARNING,
                message = "Modo dispositivo dedicado (Device Owner) desativado.",
                source = "deviceowner",
            )
        )
    }

    companion object {
        fun componentName(context: Context): ComponentName =
            ComponentName(context, DeviceOwnerReceiver::class.java)

        fun isDeviceOwner(context: Context): Boolean {
            val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            return dpm.isDeviceOwnerApp(context.packageName)
        }
    }
}
