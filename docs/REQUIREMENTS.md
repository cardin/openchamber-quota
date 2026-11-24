# Objective
Let users see how much quota they have left and when it resets without leaving OpenChamber.

# Requirements

## REQ 1
For each displayed resetting window, show a colored bar of quota remaining, the even-use estimate, and the reset time. The estimate is the share that would remain if the window's quota were used evenly. If remaining quota or reset time is missing, show an error for that bar; temporary unavailability counts as missing. If only the timing is missing, omit the estimate.

A spend cap or lifetime limit with a known maximum gets a bar without a reset or estimate; a prepaid balance is a number without a bar. Never invent a reset. A provider exposing none of these is ineligible under REQ 2.

## REQ 2
The plugin must support these providers: user-defined custom providers, OpenAI Codex, OpenCode Go, OpenRouter, Tavily, and OpenCode Zen. Additional providers may be added later. A provider is in scope only when it exposes quota data the plugin can retrieve. The plugin must not read OpenChamber's credential store.

## REQ 3
The plugin must display its quota UI in OpenChamber's Session Panel.

## REQ 4
Users must be able to choose which supported providers to display and, for each provider with multiple quota windows, which windows to display.

## REQ 5
Users must be able to include their own custom providers.