/**
 * Dynamic app configuration.
 *
 * `app.json` stays the source of truth for the static configuration; this file
 * receives it through the `config` argument and only injects values that must
 * come from the environment (for example the Google Maps key used by
 * `react-native-maps` on Android).
 */
module.exports = ({ config }) => {
  const androidMapsKey = process.env.GOOGLE_MAPS_API_KEY;
  const iosMapsKey = process.env.GOOGLE_MAPS_IOS_API_KEY;

  const plugins = [...(config.plugins ?? [])];

  if (androidMapsKey || iosMapsKey) {
    plugins.push([
      'react-native-maps',
      {
        ...(androidMapsKey ? { androidGoogleMapsApiKey: androidMapsKey } : {}),
        ...(iosMapsKey ? { iosGoogleMapsApiKey: iosMapsKey } : {}),
      },
    ]);
  }

  return {
    ...config,
    plugins,
  };
};
