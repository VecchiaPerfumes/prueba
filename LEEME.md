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
