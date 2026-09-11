# Elovex — Big Technical Audit

**تاريخ التدقيق:** 11 سبتمبر 2026

**النطاق:** تطبيق Next.js، صفحات categories وpagination، API proxy، صفحة الفيديو، لوحة الإدارة، SEO، الأداء، الاعتماديات، واختبارات الجودة.

**النتيجة العامة:** المشروع يبني بنجاح، لكن لا ينبغي اعتباره جاهزاً للإنتاج العام قبل معالجة مشكلتين أمنيتين مرتفعتي الأولوية: **تزوير جلسة الإدارة** و**SSRF عبر عنوان API القابل للتعديل**. كما أن lint يفشل، ولا توجد اختبارات آلية، وSEO الحالي لا يولد sitemap فعلياً للفيديوهات.

## 1. ملخص تنفيذي

| المجال | الحالة | الخطورة | الملاحظة الرئيسية |
|---|---|---:|---|
| Build وTypeScript | ناجح | منخفضة | `npm run build` داز بلا أخطاء. |
| Lint | فاشل | متوسطة | خطآن و6 تحذيرات، منها أخطاء React effects. |
| الاختبارات | غير موجودة | عالية | لا يوجد `test` script ولا ملفات test/spec. |
| Admin authentication | غير آمن | حرجة | cookie ثابتة القيمة ويمكن تزويرها إذا عرف المهاجم اسمها وقيمتها. |
| API proxy | خطر SSRF | عالية | Admin يستطيع حفظ URL خارجي أو داخلي، والسيرفر يجلبه لاحقاً. |
| Upstream API | هش | عالية | اعتماد كامل على API خارجي، بلا circuit breaker أو rate limit أو schema validation. |
| XSS / browser isolation | يحتاج تقوية | عالية | JSON-LD وiframe يعتمدان على بيانات upstream غير موثوقة، ولا توجد CSP. |
| Dependencies | تحتاج تحديث | عالية | `npm audit --omit=dev` أظهر 4 vulnerabilities، بينها PostCSS عالية وNext متوسطة. |
| Pagination/categories | وظيفية | منخفضة | route `/p/2` وcategory parameter موجودان، لكنهما غير مغطّيين باختبارات. |
| SEO | جزئي | متوسطة | metadata موجودة، لكن sitemap hardcoded ولا يضم صفحات الفيديو الديناميكية. |
| Performance | مقبول مبدئياً | متوسطة | caching موجود، لكن client fetch و`<img>` وduplicate data loading يحتاجون تحسيناً. |

## 2. نتائج التحقق التنفيذي

تم تشغيل `npm run build` بنجاح على Next.js 15.5.25. فحص TypeScript ومرحلة static page generation نجحا.

تم تشغيل `npm run lint`. النتيجة كانت **8 مشاكل: خطآن و6 تحذيرات**. الخطآن في `app/page.tsx` مرتبطان باستدعاء `setState` مباشرة داخل `useEffect` في السطرين 122 و156. التحذيرات تتعلق بــ dependencies ناقصة في React hooks وباستخدام `<img>` بدل `next/image`.

تم تشغيل `npm test -- --runInBand`. العملية فشلت لأن المشروع لا يحتوي على `test` script.

فحص `npm audit --omit=dev` أظهر أربع ثغرات production dependency:

| الحزمة | الإصدار المثبت | التصنيف | السبب |
|---|---:|---:|---|
| `next` | 15.5.25 | Moderate | vulnerability عبر PostCSS حسب npm audit. |
| `postcss` | 8.4.31 | High | path traversal / arbitrary source-map disclosure advisories. |
| `express` | 4.22.2 | Moderate | dependency على نسخة متأثرة من `qs`. |
| `qs` | nested | Moderate | parsing وDoS advisories. |

الترقية المقترحة آلياً إلى Next 16.3.4 هي **major upgrade**، ولذلك يجب اختبارها في branch منفصل قبل الدمج.

## 3. النتائج الأمنية

### SEC-01 — تزوير جلسة admin بسبب cookie ثابتة القيمة

**الخطورة: حرجة.**

في `app/api/admin/login/route.ts`، الجلسة تُنشأ بهذه القيم الثابتة:

```ts
const COOKIE_NAME = 'elovex_admin';
const COOKIE_VALUE = 'authenticated';
```

والتحقق يتم عبر مقارنة القيمة فقط:

```ts
request.cookies.get(COOKIE_NAME)?.value === COOKIE_VALUE
```

أي شخص يستطيع إرسال cookie باسم `elovex_admin` وقيمة `authenticated` يحصل عملياً على صلاحيات admin دون معرفة كلمة السر. هذه ليست session موقعة ولا token عشوائي.

**الإصلاح المطلوب:** استعمال session token عشوائي محفوظ server-side أو cookie موقعة بـ HMAC/JWT مع secret قوي، وتدوير session بعد تسجيل الدخول. يجب إضافة logout فعلي، مدة صلاحية قصيرة، وإبطال الجلسة عند الحاجة. يجب كذلك إضافة rate limiting لمحاولات الدخول ومقارنة آمنة لكلمة السر باستخدام hash مخصص مثل Argon2id أو bcrypt.

### SEC-02 — SSRF عبر `api_base_url`

**الخطورة: عالية.**

`app/api/settings/route.ts` يسمح لأي admin يحوز cookie أن يحفظ أي `http` أو `https` URL تقريباً. التحقق يمنع userinfo فقط، لكنه لا يمنع:

- `localhost` و`127.0.0.1`.
- عناوين الشبكات الخاصة مثل `10.0.0.0/8` و`172.16.0.0/12` و`192.168.0.0/16`.
- عناوين cloud metadata مثل `169.254.169.254`.
- DNS names التي تحل إلى عناوين داخلية.

بعد ذلك، `app/api/videos/search/route.ts` وroutes أخرى تستعمل `fetch(url)` من الخادم. إذا تم تجاوز auth أو تم استعمال cookie المزورة، يمكن للمهاجم تحويل الخادم إلى proxy للوصول إلى خدمات داخلية أو تسريب محتواها.

**الإصلاح المطلوب:** لا تقبل arbitrary URLs في production. استعمل allowlist ثابتة للنطاقات المسموحة، أو خزّن provider identifier بدل URL. إذا كان URL ضرورياً، طبّق DNS/IP validation قبل كل request، امنع redirects، امنع private/link-local/reserved ranges، وأعد التحقق بعد DNS resolution. يجب أيضاً تحديد `redirect: 'error'`، وإضافة outbound egress restrictions عند مستوى الاستضافة.

### SEC-03 — JSON-LD قابل للحقن عبر بيانات upstream

**الخطورة: عالية.**

صفحة الفيديو تستعمل:

```tsx
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }} />
```

`JSON.stringify` لا يحول `<` إلى `\\u003c`. إذا احتوى عنوان أو keyword مصدر خارجي على `</script><script>...`، يمكن كسر عنصر script. بيانات upstream يجب اعتبارها غير موثوقة.

**الإصلاح المطلوب:** استعمال serializer آمن لـ JSON-LD يحول `<` و`>` و`&` إلى unicode escapes، أو تطبيق `serialize-javascript`/حل موثوق مناسب للـ script context. يجب إضافة اختبار payload عدائي.

### SEC-04 — iframe خارجي بلا allowlist

`video.embed` يمر مباشرة إلى `iframe src`. لا يوجد allowlist للـ hostname ولا Content Security Policy تحدد `frame-src`.

هذا يرفع خطر phishing، tracking غير متوقع، وcontent injection من provider خاطئ. `allow="autoplay; fullscreen; encrypted-media"` أوسع مما يلزم في بعض providers.

**الإصلاح المطلوب:** اسمح فقط بنطاقات embed المعتمدة، طبّق URL parser صارماً، امنع `javascript:` وdata URLs، وأضف CSP فيها `frame-src` للنطاقات المعتمدة فقط. لا تعتمد على `referrerPolicy` كبديل للحماية.

### SEC-05 — غياب security headers وCSP

`next.config.ts` لا يعرّف `headers()`. لا يظهر وجود CSP أو HSTS أو `X-Content-Type-Options` أو `Referrer-Policy` أو `Permissions-Policy.

**الإصلاح المطلوب:** إضافة headers production مناسبة. يجب تصميم CSP بعناية لأن JSON-LD وiframe وanalytics يحتاجون مصادر محددة. لا تستعمل `unsafe-eval` إلا إذا أثبتت الحاجة.

### SEC-06 — غياب rate limiting

لا توجد حماية واضحة على login أو settings أو video proxy. يمكن إساءة استعمال login brute force، أو استهلاك quota upstream، أو جعل endpoint proxy نقطة bandwidth abuse.

**الإصلاح المطلوب:** rate limit موزع في edge/provider، خصوصاً على login وproxy. أضف حدّاً للحجم، timeout، concurrency cap، وcircuit breaker للـ upstream.

## 4. صحة API وcategories وpagination

الفكرة الحالية صحيحة من ناحية التدفق: الواجهة ترسل category، والـ proxy يحولها داخلياً إلى `query` للـ upstream، وpage URL أصبح `/p/2?category=anal`. هذا يجعل الرابط قابلاً للمشاركة ويحافظ على category أثناء الانتقال.

لكن التنفيذ يظل حساساً لجودة upstream API:

1. لا توجد schema validation لهيكل JSON أو XML. أي response صالح نحوياً لكنه مختلف بنيوياً يمكن أن يؤدي إلى قائمة فارغة أو metadata خاطئة.
2. XML parser يدوي ومحدود. لا يعالج XML entities، CDATA، namespaces، أو nested thumbnail fields بشكل موثوق.
3. لا توجد tests تثبت أن category مثل `anal` لا تختلط مع category أخرى، أو أن page 2 تستعمل فعلاً `page=2`.
4. لا توجد حماية من `total_pages` غير المنطقي أو page خارج النطاق الذي يعيده upstream.
5. API route يفرض `per_page` بين 1 و1000، بينما UI يستعمل 50. يجب توحيد هذه القاعدة مع product requirement حتى لا تتغير من admin أو client.

**التوصية:** استعمل schema validator مثل Zod، عرّف canonical internal response، واكتب contract tests لـ JSON وXML وHTTP 4xx/5xx وtimeout والـ malformed payload.

## 5. SEO audit

### نقاط جيدة

الصفحة الرئيسية تحتوي metadata عامة، وصفحة الفيديو تولد title وdescription وcanonical وOpen Graph. صفحة الفيديو تضيف `VideoObject` structured data. `robots.txt` يمنع `/admin` و`/api/` ويشير إلى sitemap.

### المشاكل

| الأولوية | المشكلة | الأثر |
|---|---|---|
| عالية | `SITE_URL` وsitemap وrobots hardcoded على `https://elovex.vercel.app` | إذا كان domain الفعلي مختلفاً، canonical وsitemap وOpen Graph ستشير إلى host خاطئ. |
| عالية | sitemap لا يضم `/videos/[id]` | محركات البحث قد لا تكتشف watch pages بسرعة. |
| متوسطة | sitemap يضم category URLs query-string فقط | صفحات categories ليست routes مستقلة ذات metadata مخصصة، وقد تتعامل محركات البحث معها كنسخ منخفضة القيمة. |
| متوسطة | لا توجد `lastModified` حقيقية للفيديوهات | كل sitemap generation يستعمل `new Date()`، ما يعطي إشارات تغيير غير دقيقة. |
| متوسطة | لا يوجد `VideoObject` sitemap أو video sitemap namespace | فرصة SEO إضافية غير مستعملة. |
| منخفضة | لا يظهر `og:image` عام للصفحة الرئيسية | المشاركة الاجتماعية ستكون أقل جودة. |

**الإصلاح المطلوب:** استعمل `NEXT_PUBLIC_SITE_URL` أو domain config موحداً، أنشئ sitemap ديناميكياً من video IDs مع pagination، أضف `lastModified` من upstream، وخصص route مثل `/category/anal` إذا كانت فهرسة categories هدفاً أساسياً.

## 6. Performance audit

### ما هو جيد

يوجد cache قصير داخل API proxy، cache في `sessionStorage`، prefetch للصفحة التالية، lazy loading للصور المتأخرة، وtimeout للطلبات. حجم first-load الذي ظهر في build حوالي 102–111 kB من JavaScript المشترك، وهو مقبول مبدئياً.

### ما يحتاج التحسين

1. `responseCache` في الذاكرة يعمل لكل instance فقط، وليس cache موزعاً. في serverless سيضيع كثيراً مع cold starts.
2. `getPortalSettings()` يمكن أن يضرب Supabase في عدة requests متزامنة. يلزم cache settings قصير مع invalidation بعد save.
3. صفحة الفيديو تنفذ `loadPage` مرة عند `generateMetadata` ومرة عند render. هذا قد يضاعف upstream calls والـ latency.
4. `<img>` يستعمل remote URLs دون `next/image`. هذا يقلل image optimization ويفسر تحذيرات lint.
5. related query يعتمد على keywords upstream وقد يكون query طويلاً أو قليل الجودة. يلزم normalize، deduplicate، وحد أقصى واضح.
6. لا توجد حماية واضحة من عدد كبير من requests لنفس category/page من clients مختلفين.

## 7. Code quality وmaintainability

المشروع يستعمل أسطراً طويلة جداً في `app/page.tsx` و`app/videos/[id]/page.tsx` وroutes. هذا يصعّب review واكتشاف bugs الأمنية. يجب تقسيم الواجهة إلى components صغيرة، وفصل API client وnormalizers وtypes.

توجد warnings في React hook dependencies. ترك dependencies ناقصة يمكن أن ينتج stale closures، خصوصاً في `buildRequest` و`prefetchPage`. إصلاحها يتطلب `useCallback` أو إعادة تصميم effect، وليس إسكات lint.

لا توجد اختبارات. الحد الأدنى المطلوب هو:

- unit tests لـ URL building وcategory normalization.
- route tests لـ pagination وvalidation.
- tests لـ JSON/XML normalization.
- tests لـ auth: unauthenticated, valid login, invalid login, forged cookie.
- tests لـ SSRF blocking.
- tests لـ JSON-LD escaping.
- smoke test للـ `/`, `/p/2?category=anal`, `/videos/:id`, `/sitemap.xml`.

## 8. خطة الإصلاح المقترحة

### المرحلة الأولى: قبل أي deployment عام

1. استبدال cookie الثابتة بجلسة موقعة أو مخزنة server-side.
2. إغلاق SSRF عبر allowlist domains ومنع private/link-local IPs.
3. إضافة rate limiting على login وproxy.
4. حماية JSON-LD وiframe بقواعد serialization وallowlist.
5. إضافة security headers وCSP.
6. تحديث dependencies في branch منفصل وإعادة build وaudit.

### المرحلة الثانية: reliability

1. إضافة Zod schemas للـ upstream JSON/XML normalized response.
2. إضافة Vitest أو Playwright وtest script.
3. إصلاح lint errors وhook dependency warnings.
4. إضافة provider timeout، retry محدود، circuit breaker، وstale cache.
5. منع duplicate fetch في generateMetadata وrender.

### المرحلة الثالثة: SEO وgrowth

1. استعمال production domain من environment variable واحد.
2. إنشاء category routes مستقلة ذات metadata canonical.
3. إدخال video URLs الحقيقية إلى sitemap بشكل paginated.
4. إضافة `lastModified` من upstream.
5. إضافة image metadata وOpen Graph image.

## 9. قرار الجاهزية

**القرار: Not ready for public production.**

الـ build وحده ناجح، لكنه لا يثبت الأمان. وجود cookie قابلة للتزوير وSSRF محتمل يجعل deployment العام عالي المخاطر. pagination وcategories تبدوان صحيحتين وظيفياً، لكن لا توجد automated tests تثبت السلوك ضد regressions.

## References

[1]: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html "OWASP Server-Side Request Forgery Prevention Cheat Sheet"

[2]: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html "OWASP Cross-Site Request Forgery Prevention Cheat Sheet"

[3]: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html "OWASP Cross Site Scripting Prevention Cheat Sheet"

[4]: https://nextjs.org/docs/app/guides/content-security-policy "Next.js Content Security Policy Guide"

[5]: https://www.npmjs.com/package/next "Next.js package and release information"

[6]: https://www.eporner.com/api/v2 "Eporner API v2 documentation supplied for this project"

[7]: https://developers.google.com/search/docs/appearance/structured-data/video "Google Video structured data documentation"

[8]: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap "Google sitemap creation documentation"

[9]: https://nextjs.org/docs/app/api-reference/functions/generate-metadata "Next.js generateMetadata documentation"

[10]: https://nextjs.org/docs/messages/no-img-element "Next.js no-img-element guidance"

[11]: https://github.com/advisories/GHSA-6g55-p6wh-862q "PostCSS arbitrary file read and information disclosure advisory"

[12]: https://github.com/advisories/GHSA-qx2v-qp2m-jg93 "PostCSS XSS advisory"

[13]: https://github.com/advisories/GHSA-x5fp-wj9c-mxmx "qs array-limit bypass advisory"

[14]: https://github.com/advisories/GHSA-4mjr-xmp4-gh2g "qs denial-of-service advisory"
