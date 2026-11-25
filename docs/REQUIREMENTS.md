# Objective
Let users see how much quota they have left and when it resets without leaving OpenChamber.

# Requirements

## REQ 1
For each displayed resetting window, show a colored quota bar, the even-use estimate, and the reset time. The estimate is the share that would remain or have been used if the window's quota were used evenly, on the same scale as the bar. If quota or reset time is missing, show an error for that bar; temporary unavailability counts as missing. If only the timing is missing, omit the estimate.

A spend cap or lifetime limit with a known maximum gets a bar without a reset or estimate; a prepaid balance is a number without a bar. Never invent a reset. A provider exposing none of these is ineligible under REQ 2.

Default to showing quota remaining. Users can choose to show quota used instead in Quota settings.

## REQ 2
The plugin must support these providers: providers that OpenCode supports, user-defined custom providers, and Tavily. Additional providers may be added later. A provider is in scope only when it exposes quota data the plugin can retrieve.

For providers that OpenCode supports, the plugin must obtain their credentials only through OpenChamber's approved usage-provider contract. For providers OpenCode doesn't support, the user enters a key in Quota settings. No component reads the OpenChamber or OpenCode credential store directly, and no credential reaches the panel.

Custom-provider setup is hidden in this release pending verification.

## REQ 3
The plugin must display its quota UI in OpenChamber's Session Panel.

## REQ 4
Users must be able to choose which supported providers to display and, for each provider with multiple quota windows, which windows to display.
