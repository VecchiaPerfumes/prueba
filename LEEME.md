# VECCHIA PERFUMES — sitio reconstruido

## Cómo subirlo

Sube **la carpeta completa tal cual**, respetando la subcarpeta `assets/`.
Si subes los archivos sueltos, el CSS y el JS no cargarán.

```
/                        ← raíz del repositorio
├── index.html
├── catalogo.html
├── producto.html
├── decants.html
├── quiz.html
├── favoritos.html
├── checkout.html
├── contacto.html
├── robots.txt
├── sitemap.xml
├── mens-collection.html      ┐
├── woman-collection.html     │ redirecciones de las URLs
├── unisex-collection.html    │ antiguas (no borrar: mantienen
├── gift-sets.html            │ vivos los enlaces ya compartidos)
├── vecchia-quiz.html         ┘
└── assets/
    ├── vecchia.css
    ├── data.js
    └── app.js
```

En GitHub: *Add file → Upload files* y **arrastra la carpeta `assets` entera**,
no sus archivos por separado.

Borra del repositorio los archivos antiguos que ya no se usan:
`site-variables.css`, `site-components.css`, `site-footer.css`, `site-utilities.js`.

## Cómo editar el catálogo

Todo el catálogo vive en **`data.js`**, en un único array.
Para cambiar un precio, una foto o el stock, edita solo ese archivo:

```js
{
  "id": "asad-lattafa-100ml-edp",   // no lo cambies: es el enlace de la ficha
  "name": "Asad Lattafa 100ml EDP",
  "brand": "Lattafa",               // "" si no quieres mostrar marca
  "price": 50,                      // número, sin símbolo
  "image": "https://…",
  "alt": "Asad Lattafa 100ml EDP",  // texto alternativo (accesibilidad y SEO)
  "desc": "…",
  "family": "arabes",               // "arabes" | "designer"
  "genders": ["hombre"],            // hombre | mujer | unisex | sets
  "soldOut": false,                 // true = muestra AGOTADO y bloquea el pedido
  "bestseller": false,              // true = aparece en «Más vendidos»
  "nuevo": false                    // true = aparece en «Novedades»
}
```

Al guardar, el cambio se refleja en **todas** las páginas a la vez: home,
catálogo, buscador, ficha de producto, favoritos y carrito.

## Qué NO hace todavía (necesita servidor)

El pedido se cierra por WhatsApp con el mensaje ya redactado. Eso funciona hoy
sin ningún servidor. Lo que **no** existe y requeriría backend:

1. **Cobro con tarjeta en la web.** Necesita una pasarela (Stripe, Mercado Pago…)
   con su clave secreta en un servidor. La clave *nunca* puede ir en estos
   archivos: cualquiera vería el código fuente. Haría falta una función
   serverless (Vercel Functions) que cree la sesión de pago.
2. **Stock en tiempo real.** Hoy `soldOut` se edita a mano en `data.js`.
   Para stock automático haría falta una base de datos y un panel.
3. **Guardar los pedidos.** Ahora llegan a WhatsApp; no se almacenan.
4. **Favoritos entre dispositivos.** Se guardan en el navegador de cada
   visitante (localStorage). Para sincronizarlos haría falta login y base de datos.

## Paleta

Dos colores. Están al principio de `vecchia.css`:

```css
--white:#FFFFFF   /* fondo, tarjetas, modales, formularios */
--black:#000000   /* texto, iconos, bordes, botones */
```

Todo lo demás (bordes, texto secundario, separadores) es negro con opacidad,
no un color aparte. Las superficies oscuras — héroe, pie, buscador, baldosas
de foto — son negro puro con texto blanco.

Botones: fondo blanco, texto negro, borde negro; al pasar el ratón se
invierten. Esquinas prácticamente rectas (radio 0–1 px).

## Por qué unas fotos van sobre negro y otras sobre blanco

Tus 116 fotos vienen de **22 tiendas distintas** y cada archivo trae su propio
fondo incrustado: **72 con fondo oscuro** (las de fimgs.net) y **44 con fondo
claro**. Por eso antes se veía «cada foto de un color».

No se pueden repintar desde la web, así que cada tipo recibe el tratamiento
que hace desaparecer su fondo:

- **Fondo claro** → baldosa blanca + `mix-blend-mode:multiply`: el blanco de
  la foto se funde con el fondo y solo queda el frasco.
- **Fondo oscuro** → baldosa negra y foto a sangre (`object-fit:cover`): la
  foto cubre la baldosa entera, así que no se ve ningún recuadro.

El sitio lo decide solo, mirando si la URL contiene `dark-`. Si cambias una
foto, actualiza el campo `dark` de ese producto en `data.js`.

**Si quieres que todas vayan sobre blanco**, hay que sustituir esas 72 fotos
por versiones con fondo blanco. Prueba primero una URL en el navegador: si
`375x500` funciona en lugar de `dark-375x500`, es un buscar-y-reemplazar en
`data.js` y poner `"dark": false`. No lo hice yo porque desde aquí no tengo
acceso a internet para comprobarlo, y a ciegas se habrían roto las 72.

## Tasa euro → Bs

Los precios se muestran en **dólares**, y el equivalente en bolívares se
calcula con la **tasa euro del BCV**. Aparece en las tarjetas, la ficha, el
carrito y el checkout. La lógica está en `app.js`, bloque `Rate`.

El pie de cada página dice con qué tasa se calculó, por ejemplo:
`Tasa euro: Bs 968,07 · actualizada el 11 de septiembre de 2026`.
Así el comprador ve el número exacto que se usó y no hay malentendidos.

**Cómo obtiene la tasa**, en este orden:

1. **Tasa manual** — si la escribes, manda sobre todo lo demás. En `app.js`:
   ```js
   manual: null,     // bolívares por euro, p. ej.  manual: 968.07
   ```
2. **La última tasa buena guardada** en el navegador del visitante.
3. **Las APIs**, en segundo plano:
   - `ve.dolarapi.com/v1/euros/oficial` (BCV) — comprobada y funcionando
   - `api.exchangerate.host` con `base=EUR` — respaldo

**Qué pasa si todo falla:** no se muestra ningún precio en bolívares. No sale
`NaN`, ni `undefined`, ni `$0`, ni «Tasa no configurada» — la línea en Bs
simplemente no existe y el sitio sigue funcionando en dólares.

Cualquier valor absurdo (texto, cero, negativo, mayor de diez millones) se
descarta y se conserva la tasa anterior.

> La clave de caché es `vecchia.rate.eur.v2`. Si algún día vuelves a la tasa
> dólar, cambia también esa clave: si no, quien ya visitó el sitio seguiría
> viendo cálculos hechos con la tasa vieja guardada en su navegador.

## Decants

Eliminada por completo: la página, el enlace del menú, el del pie, la sección
del inicio y la entrada del sitemap. No queda ninguna referencia en el código.

## Notas sobre los datos

- Los 116 productos, precios, fotos y descripciones salen de tus páginas
  originales. No se inventó ninguno.
- 31 productos no declaran marca en su nombre; en esos la línea de marca
  simplemente no se muestra (mejor que mostrar una marca equivocada).
- **Versace Eros** ($105) solo existía en la home antigua y no tenía categoría
  asignada. Está en el catálogo y en el buscador, pero no aparece al filtrar por
  Hombre / Mujer / Unisex. Para colocarlo, añade el género en `data.js`:
  `"genders": ["hombre"]`.
- Dos de los cuatro «más vendidos» están marcados como agotados en tus
  colecciones. Se respeta ese estado: se muestran con la etiqueta AGOTADO y
  la home prioriza los disponibles.
