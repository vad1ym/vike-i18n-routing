import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import vike from 'vike/plugin'

export default defineConfig({
  plugins: [
    solid({ ssr: true }),
    vike(),
  ],
})
