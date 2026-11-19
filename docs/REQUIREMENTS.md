# Objective
Let users see how much quota they have left and when it resets without leaving OpenChamber.

# Requirements

## REQ 1
For each displayed quota window, the plugin must show a bar indicating the quota remaining and show when the window resets. If the remaining quota or reset time is unavailable, the plugin must show an error message instead of the affected bar.

## REQ 2
The plugin must support every model provider in the latest OpenChamber version that exposes quota data. Providers that do not expose quota data are ineligible. The plugin may also support providers outside OpenChamber that expose quota data, such as Tavily.

## REQ 3
The plugin must display its quota UI in OpenChamber's Session Panel.

## REQ 4
Users must be able to choose which supported providers to display and, for each provider with multiple quota windows, which windows to display.
