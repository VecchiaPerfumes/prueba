# VECCHIA PERFUMES — sitio reconstruido

## Cómo subirlo

Sube **la carpeta completa tal cual**, respetando la subcarpeta `assets/`.
Si subes los archivos sueltos, el CSS y el JS no cargarán.

```
/                        ← raíz del repositorio
├── index.html
├── catalogo.html
├── producto.html
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
├── vecchia-quiz.html         │
├── decants.html              ┘ (la sección Decants ya no existe;
│                                queda como redirección a catalogo.html)
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

Todo el catálogo vive en **`assets/data.js`**, en un único array.
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

Solo tres valores, definidos al principio de `assets/vecchia.css`:

```css
--cream:#F4F1EA    /* fondo de la página */
--cream-2:#EDE9E0  /* superficie alterna: baldosas de foto, campos */
--gray:#DCD7CC     /* gris claro: bordes y separadores */
--black:#000000    /* texto, botones y superficies oscuras */
```

Los grises intermedios salen de negro con opacidad, así que cambiando esas
cuatro líneas cambia el sitio entero. No hay blanco puro en pantalla (solo en
la hoja de impresión, que es lo correcto para papel).

## Por qué unas fotos van sobre negro y otras sobre crema

Tus 116 fotos vienen de **22 tiendas distintas** y cada una trae su propio
fondo incrustado en el archivo: **72 con fondo oscuro** (las de fimgs.net) y
**44 con fondo claro**. Por eso antes se veía «cada foto de un color».

No se pueden repintar desde la web, así que cada tipo recibe el tratamiento
que la hace desaparecer:

- **Fondo claro** → baldosa crema + `mix-blend-mode:multiply`: el blanco de la
  foto se funde con el crema y solo queda el frasco.
- **Fondo oscuro** → baldosa negra y foto a sangre (`object-fit:cover`): la
  foto cubre la baldosa entera, así que no se ve ningún recuadro.

El sitio decide solo, mirando si la URL contiene `dark-`. Si algún día
cambias una foto, actualiza el campo `dark` de ese producto en `data.js`
(`true` si la nueva foto tiene fondo oscuro).

**Si quieres que todas vayan sobre crema**, la solución de fondo es sustituir
esas 72 fotos por versiones con fondo blanco. Prueba primero una URL en el
navegador antes de cambiarlas todas: si funciona, es un buscar-y-reemplazar
de `dark-375x500` por `375x500` en `data.js`, y luego poner `"dark": false`.
No lo hice yo porque desde aquí no tengo acceso a internet para comprobar que
esas direcciones existan, y a ciegas se habrían roto las 72 fotos.

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
