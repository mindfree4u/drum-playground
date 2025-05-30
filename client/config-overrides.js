const { override, addWebpackPlugin } = require('customize-cra');
const webpack = require('webpack');

module.exports = override(
  addWebpackPlugin(
    new webpack.DefinePlugin({
      'process.env.REACT_APP_MANIFEST': JSON.stringify({
        short_name: "드럼놀이터",
        name: "드럼놀이터 예약시스템",
        icons: [
          {
            src: "logo192.png",
            sizes: "64x64 32x32 24x24 16x16",
            type: "image/x-icon"
          },
          {
            src: "logo192.png",
            type: "image/png",
            sizes: "192x192"
          },
          {
            src: "logo512.png",
            type: "image/png",
            sizes: "512x512"
          }
        ],
        start_url: ".",
        display: "standalone",
        theme_color: "#000000",
        background_color: "#ffffff"
      })
    })
  )
); 