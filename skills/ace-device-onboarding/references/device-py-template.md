# Device Backend — Current Pattern

**`device.py`** — one concrete device backend extending `DeviceBackend`:

```python
"""
<Device Name> Backend Implementation
Reference: ACE DeviceBackend implementation pattern
"""
import asyncio
import datetime
import logging
import time
from copy import deepcopy
from typing import Any, Dict, List, Optional

import numpy as np

from ace.core.devices.base import DeviceBackend, DeviceState, OperationResult

logger = logging.getLogger(__name__)


class <DeviceName>Backend(DeviceBackend):
    """
    <Device Name> backend

    Thin adapter layer:
    - Defines default state schema
    - Implements operation handlers
    - Calls the installed SDK for ordinary device operations
    """

    _DEFAULT_STATE: Dict[str, Any] = {
        "subsystem_1": {"param1": default_value, "param2": default_value},
        "subsystem_2": {"param3": default_value},
        "status": "idle",
    }

    def __init__(self, device_id: str = "<device-family>/<implementation>", speed_multiplier: float = 10.0):
        # DeviceBackend is the neutral alias of the legacy SimulatorDevice base;
        # its constructor parameter remains simulator_id for compatibility.
        super().__init__(simulator_id=device_id, device_type="<DEVICE_TYPE>")
        self._speed_multiplier = max(speed_multiplier, 0.1)
        self._faults: Dict[str, float] = {}

    @property
    def vendor(self) -> str:
        return "<Vendor Name>"

    @property
    def model(self) -> str:
        return "<Model Name>"

    @property
    def description(self) -> str:
        return "<Device> backend"

    @property
    def capabilities(self) -> List[str]:
        return [
            "capability_1",
            "capability_2",
            "capability_3",
        ]

    def connect(self) -> None:
        """Initialize backend state."""
        self._state = DeviceState(
            timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            properties=deepcopy(self._DEFAULT_STATE),
        )
        self._connected = True
        self._faults = {}
        logger.info(f"<Device> backend connected: session={self.session_id}")

    def disconnect(self) -> None:
        """Clean up backend state."""
        self._connected = False
        logger.info(f"<Device> backend disconnected: session={self.session_id}")

    def inject_fault(self, fault_type: str, severity: float = 0.5) -> None:
        """Inject fault for testing (optional)."""
        valid_faults = {"fault_type_1", "fault_type_2"}
        if fault_type not in valid_faults:
            logger.warning(f"Unknown fault type: {fault_type}")
            return
        self._faults[fault_type] = max(0.0, min(1.0, severity))

    def remove_fault(self, fault_type: str) -> None:
        """Remove injected fault (optional)."""
        self._faults.pop(fault_type, None)

    def set_speed_multiplier(self, value: float) -> None:
        """Adjust execution speed for simulator leaves (optional)."""
        self._speed_multiplier = max(value, 0.1)

    def get_speed_multiplier(self) -> float:
        return self._speed_multiplier

    async def execute_operation(self, operation: str, params: Dict[str, Any]) -> OperationResult:
        """
        Route operation to handler.
        Handler naming: _op_<operation_name>
        """
        start_time = time.time()
        try:
            handler = getattr(self, f"_op_{operation}", None)
            if handler is None:
                return OperationResult(
                    success=False, operation=operation,
                    error=f"Unknown operation: {operation}",
                    duration_seconds=time.time() - start_time,
                )
            result = await handler(params)
            result.duration_seconds = time.time() - start_time
            return result
        except Exception as e:
            return OperationResult(
                success=False, operation=operation, error=str(e),
                duration_seconds=time.time() - start_time,
            )

    # --- Operation Handlers ---
    # Each handler is thin; extract reusable helpers when logic grows.

    async def _op_connect(self, params: Dict[str, Any]) -> OperationResult:
        """Handle connect operation."""
        self.connect()
        return OperationResult(success=True, operation="connect")

    async def _op_disconnect(self, params: Dict[str, Any]) -> OperationResult:
        """Handle disconnect operation."""
        self.disconnect()
        return OperationResult(success=True, operation="disconnect")

    async def _op_get_state(self, params: Dict[str, Any]) -> OperationResult:
        """Return current device state."""
        return OperationResult(
            success=True,
            operation="get_state",
            output={"state": self._state.properties if self._state else {}}
        )

    async def _op_set_parameter(self, params: Dict[str, Any]) -> OperationResult:
        """
        Set device parameter.
        Apply one backend-owned parameter update.
        """
        subsystem = params.get("subsystem")
        param = params.get("parameter")
        value = params.get("value")

        if not all([subsystem, param, value is not None]):
            return OperationResult(
                success=False,
                operation="set_parameter",
                error="Missing subsystem, parameter, or value"
            )

        if self._state and subsystem in self._state.properties:
            self._state.properties[subsystem][param] = value
            return OperationResult(success=True, operation="set_parameter")

        return OperationResult(
            success=False,
            operation="set_parameter",
            error=f"Invalid subsystem: {subsystem}"
        )

    # Add more operation handlers as needed...
    # Keep ordinary SDK calls and backend-owned validation here.
```

**Key Principles:**
- `device.py` is the concrete backend extending `DeviceBackend`
- State schema defined in `_DEFAULT_STATE`
- Operation handlers route to `_op_<operation>` methods
- Ordinary SDK calls and backend-owned validation stay in `device.py`
- Use `node.py` only for custom or composite logic that is not a device capability
- Fault injection is optional for simulator leaves
