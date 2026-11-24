# Objective
Let users see how much quota they have left and when it resets without leaving OpenChamber.

# Requirements

## REQ 1
For each displayed resetting window, show a colored quota bar, the even-use estimate, and the reset time. The estimate is the share that would remain or have been used if the window's quota were used evenly, on the same scale as the bar. If quota or reset time is missing, show an error for that bar; temporary unavailability counts as missing. If only the timing is missing, omit the estimate.

A spend cap or lifetime limit with a known maximum gets a bar without a reset or estimate; a prepaid balance is a number without a bar. Never invent a reset. A provider exposing none of these is ineligible under REQ 2.

Default to showing quota remaining. Users can choose to show quota used instead in Quota settings. Save this choice per OpenChamber instance and apply it to the bars and values for all displayed windows and caps. Warning and danger still reflect how much quota remains; balances are unchanged.

## REQ 2
The plugin must support these providers: user-defined custom providers, OpenAI Codex, OpenCode Go, OpenRouter, Tavily, and OpenCode Zen. Additional providers may be added later. A provider is in scope only when it exposes quota data the plugin can retrieve. The plugin must not read OpenChamber's credential store.

## REQ 3
The plugin must display its quota UI in OpenChamber's Session Panel.

## REQ 4
Users must be able to choose which supported providers to display and, for each provider with multiple quota windows, which windows to display.

Selections are saved per OpenChamber instance and survive restarts. Before any selection is saved, show all windows from configured providers. After saving, a newly added provider appears with its current windows; a newly reported window type stays hidden until enabled. Non-reporting balances are shown by default and can be hidden per provider.

## REQ 5
Users must be able to include their own custom providers. A custom provider supplies a label, HTTPS endpoint, and key using the supported quota format; no field mapping or format picker is offered.
