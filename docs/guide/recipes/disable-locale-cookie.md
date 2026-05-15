# Disable Locale Cookie

Disable cookie writes when locale must be controlled only by URL or session.

```ts
i18n: {
  localeCookie: false,
}
```

If cookie writes should stay enabled but cookie-based detection should be skipped, use:

```ts
i18n: {
  localeCookie: 'locale',
  localeDetector: {
    localeCookie: false,
  },
}
```
