# Changelog


## v0.1.16

[compare changes](https://github.com/vad1ym/vike-i18n-routing/compare/v0.1.15...v0.1.16)

### 💅 Refactors

- Remove framework wrappers, use core useI18nRoute directly ([9ff0e62](https://github.com/vad1ym/vike-i18n-routing/commit/9ff0e62))

### ❤️ Contributors

- Vadym Bulakh ([@vad1ym](https://github.com/vad1ym))

## v0.1.15

[compare changes](https://github.com/vad1ym/vike-i18n-routing/compare/v0.1.14...v0.1.15)

### 🔥 Performance

- Cache localized path lookups, 20x faster localizePath without linear degradation ([d1bd08b](https://github.com/vad1ym/vike-i18n-routing/commit/d1bd08b))

### ❤️ Contributors

- Vadym Bulakh ([@vad1ym](https://github.com/vad1ym))

## v0.1.14

[compare changes](https://github.com/vad1ym/vike-i18n-routing/compare/v0.1.13...v0.1.14)

### 🚀 Enhancements

- Support redirect status codes ([#37](https://github.com/vad1ym/vike-i18n-routing/pull/37))

### 🔥 Performance

- Optimize localizePath to not create route each time ([b73c3a9](https://github.com/vad1ym/vike-i18n-routing/commit/b73c3a9))

### 🩹 Fixes

- Add i18nRoute to passToClient for hydration ([1b041b9](https://github.com/vad1ym/vike-i18n-routing/commit/1b041b9))

### ❤️ Contributors

- Vadym Bulakh ([@vad1ym](https://github.com/vad1ym))

## v0.1.13

[compare changes](https://github.com/vad1ym/vike-i18n-routing/compare/v0.1.12...v0.1.13)

### 🔥 Performance

- Cache locale detector config per i18n config instance ([bd3bb0d](https://github.com/vad1ym/vike-i18n-routing/commit/bd3bb0d))

### 💅 Refactors

- Simplify variant helpers and clean up router internals ([6471fbf](https://github.com/vad1ym/vike-i18n-routing/commit/6471fbf))

### 📖 Documentation

- Improve clarity, structure and consistency across all pages ([90083e7](https://github.com/vad1ym/vike-i18n-routing/commit/90083e7))
- Rewrite README around solving Vike manual i18n boilerplate ([ab1b025](https://github.com/vad1ym/vike-i18n-routing/commit/ab1b025))

### ✅ Tests

- Reorganize test suite into focused files and add missing coverage ([b42bfe8](https://github.com/vad1ym/vike-i18n-routing/commit/b42bfe8))
- Add createTestRouter helper ([e1114e4](https://github.com/vad1ym/vike-i18n-routing/commit/e1114e4))

### ❤️ Contributors

- Vadym Bulakh ([@vad1ym](https://github.com/vad1ym))

## v0.1.12

[compare changes](https://github.com/vad1ym/vike-i18n-routing/compare/v0.1.11...v0.1.12)

### 🚀 Enhancements

- LocalizePath params and query support ([#23](https://github.com/vad1ym/vike-i18n-routing/pull/23))
- Inline paramVariants and queryVariants in localizePath ([#24](https://github.com/vad1ym/vike-i18n-routing/pull/24))

### ❤️ Contributors

- Vadym Bulakh ([@vad1ym](https://github.com/vad1ym))

## v0.1.11

[compare changes](https://github.com/vad1ym/vike-i18n-routing/compare/v0.1.10...v0.1.11)

### 🚀 Enhancements

- Locale-aware redirects and per-domain routes/redirects ([#22](https://github.com/vad1ym/vike-i18n-routing/pull/22))

### 🩹 Fixes

- Dont fallback i18nUrl to canonical if route not defined ([639e345](https://github.com/vad1ym/vike-i18n-routing/commit/639e345))

### ❤️ Contributors

- Vadym Bulakh ([@vad1ym](https://github.com/vad1ym))

## v0.1.10

[compare changes](https://github.com/vad1ym/vike-i18n-routing/compare/v0.1.9...v0.1.10)

### 🚀 Enhancements

- Add react useI18nRoute support ([#18](https://github.com/vad1ym/vike-i18n-routing/pull/18))
- Add Solid useI18nRoute support ([#19](https://github.com/vad1ym/vike-i18n-routing/pull/19))

### ❤️ Contributors

- Vadym Bulakh ([@vad1ym](https://github.com/vad1ym))

## v0.1.9

[compare changes](https://github.com/vad1ym/vike-i18n-routing/compare/v0.1.8...v0.1.9)

### 🚀 Enhancements

- Add static paths helper , closes #6 ([#15](https://github.com/vad1ym/vike-i18n-routing/pull/15), [#6](https://github.com/vad1ym/vike-i18n-routing/issues/6))

### 📖 Documentation

- Correct documentation ([5c16d9e](https://github.com/vad1ym/vike-i18n-routing/commit/5c16d9e))

### ❤️ Contributors

- Vadym Bulakh ([@vad1ym](https://github.com/vad1ym))

## v0.1.8

[compare changes](https://github.com/vad1ym/vike-i18n-routing/compare/v0.1.7...v0.1.8)

### 🚀 Enhancements

- Support wildcard domain configs ([87e5ebf](https://github.com/vad1ym/vike-i18n-routing/commit/87e5ebf))
- Make locale detection sources configurable ([6e61064](https://github.com/vad1ym/vike-i18n-routing/commit/6e61064))
- Support query string variants ([#14](https://github.com/vad1ym/vike-i18n-routing/pull/14))

### 🏡 Chore

- Clean up example ([b524813](https://github.com/vad1ym/vike-i18n-routing/commit/b524813))

### ❤️ Contributors

- Vadym Bulakh ([@vad1ym](https://github.com/vad1ym))

## v0.1.7

[compare changes](https://github.com/vad1ym/vike-i18n-routing/compare/v0.1.6...v0.1.7)

### 🩹 Fixes

- Apply redirect in onBeforeRoute when redirectTo is set ([849ec33](https://github.com/vad1ym/vike-i18n-routing/commit/849ec33))

### 💅 Refactors

- Simplify LocalizedPathOptions to single prefix flag ([8e3038c](https://github.com/vad1ym/vike-i18n-routing/commit/8e3038c))

### ❤️ Contributors

- Vadym Bulakh ([@vad1ym](https://github.com/vad1ym))

## v0.1.6

[compare changes](https://github.com/vad1ym/vike-i18n-routing/compare/v0.1.5...v0.1.6)

### 💅 Refactors

- Allow vike-like route params definition ([f07cf9d](https://github.com/vad1ym/vike-i18n-routing/commit/f07cf9d))

### 🏡 Chore

- Add gh pages workflow ([23d3dbe](https://github.com/vad1ym/vike-i18n-routing/commit/23d3dbe))
- Add readme banner ([c2b0031](https://github.com/vad1ym/vike-i18n-routing/commit/c2b0031))

### ❤️ Contributors

- Vadym Bulakh ([@vad1ym](https://github.com/vad1ym))

## v0.1.5

[compare changes](https://github.com/vad1ym/vike-i18n-routing/compare/v0.1.4...v0.1.5)

### 💅 Refactors

- Automatic params redirect, simplify usage ([0f548e3](https://github.com/vad1ym/vike-i18n-routing/commit/0f548e3))

### 📖 Documentation

- Add documentation ([04d0a12](https://github.com/vad1ym/vike-i18n-routing/commit/04d0a12))

### 🏡 Chore

- Add gh pages workflow ([c5aae44](https://github.com/vad1ym/vike-i18n-routing/commit/c5aae44))

### ❤️ Contributors

- Vadym Bulakh ([@vad1ym](https://github.com/vad1ym))

## v0.1.4

[compare changes](https://github.com/vad1ym/vike-i18n-routing/compare/v0.1.3...v0.1.4)

### 💅 Refactors

- Simplify setRouteParamVariants and localizePath ([ec20359](https://github.com/vad1ym/vike-i18n-routing/commit/ec20359))
- Migrate to useI18nRoute ([9f5d106](https://github.com/vad1ym/vike-i18n-routing/commit/9f5d106))

### ❤️ Contributors

- Vadym Bulakh ([@vad1ym](https://github.com/vad1ym))

## v0.1.3

[compare changes](https://github.com/vad1ym/vike-i18n-routing/compare/v0.1.2...v0.1.3)

### 🩹 Fixes

- Resolve localized params, improve example ([2c5f6bc](https://github.com/vad1ym/vike-i18n-routing/commit/2c5f6bc))

### ❤️ Contributors

- Vadym Bulakh ([@vad1ym](https://github.com/vad1ym))

## v0.1.2

[compare changes](https://github.com/vad1ym/vike-i18n-routing/compare/v0.1.1...v0.1.2)

### 🩹 Fixes

- Default unprefixed redirect ([b6859b9](https://github.com/vad1ym/vike-i18n-routing/commit/b6859b9))

### 💅 Refactors

- Simplify router ([096f947](https://github.com/vad1ym/vike-i18n-routing/commit/096f947))
- Remove i18nRoute.requestConfig ([c27a3d5](https://github.com/vad1ym/vike-i18n-routing/commit/c27a3d5))

### ❤️ Contributors

- Vadym Bulakh ([@vad1ym](https://github.com/vad1ym))

## v0.1.1


### 💅 Refactors

- Configs based flow ([bc1160b](https://github.com/vad1ym/vike-i18n-routing/commit/bc1160b))

### ❤️ Contributors

- Vadym Bulakh ([@vad1ym](https://github.com/vad1ym))

